'use client';

import { useState, useEffect } from 'react';
import { apiFetch, SubcontractReconciliation, WorkOrder, User, getStoredUser } from '@/lib/api';
import { Scale, Plus, Search, CheckCircle2, DollarSign, ArrowRight, ShieldCheck, AlertCircle, XCircle, Check } from 'lucide-react';

export default function SubcontractReconcilePage() {
  const [reconciles, setReconciles] = useState<SubcontractReconciliation[]>([]);
  const [mitraUsers, setMitraUsers] = useState<User[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [mitraUserId, setMitraUserId] = useState<number>(0);
  const [workOrderId, setWorkOrderId] = useState<number>(0);
  const [sentQuantity, setSentQuantity] = useState<number>(100);
  const [receivedQuantity, setReceivedQuantity] = useState<number>(95);
  const [rejectQuantity, setRejectQuantity] = useState<number>(5);
  const [pieceRate, setPieceRate] = useState<number>(25000);
  const [penaltyPerReject, setPenaltyPerReject] = useState<number>(10000);
  const [notes, setNotes] = useState('Pengerjaan rapi, 5 unit cacat potongan kayu diganti penalti');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (statusFilter) query.set('status', statusFilter);

    const [rRes, uRes, wRes] = await Promise.all([
      apiFetch<any>(`/asian/subcontract-reconciles?${query.toString()}`),
      apiFetch<any>('/users?limit=100'),
      apiFetch<any>('/spk?limit=100'),
    ]);

    if (rRes.success && rRes.data) setReconciles(rRes.data.reconciliations || []);
    if (uRes.success && uRes.data) setMitraUsers(uRes.data.users?.filter((u: any) => u.roles?.some((r: any) => r.name.toLowerCase().includes('mitra'))) || []);
    if (wRes.success && wRes.data) setWorkOrders(wRes.data.work_orders || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreateReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mitraUserId || !workOrderId || sentQuantity <= 0) {
      setError('Pilih mitra pengrajin, SPK, dan isi jumlah unit kirim');
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await apiFetch('/asian/subcontract-reconciles', {
      method: 'POST',
      body: JSON.stringify({
        mitra_user_id: Number(mitraUserId),
        work_order_id: Number(workOrderId),
        sent_quantity: Number(sentQuantity),
        received_quantity: Number(receivedQuantity),
        reject_quantity: Number(rejectQuantity),
        piece_rate: Number(pieceRate),
        penalty_per_reject: Number(penaltyPerReject),
        notes,
      }),
    });

    if (res.success) {
      setSuccess('Rekonsiliasi bahan & ongkos maklon berhasil disimpan!');
      setModalOpen(false);
      loadData();
    } else {
      setError(res.message || 'Gagal menyimpan rekonsiliasi');
    }
    setSubmitting(false);
  };

  const handlePayReconcile = async (id: number) => {
    if (!confirm('Tandai tagihan ongkos borongan maklon ini sebagai LUNAS?')) return;
    const res = await apiFetch(`/asian/subcontract-reconciles/${id}/pay`, { method: 'PATCH' });
    if (res.success) {
      setSuccess('Pembayaran maklon mitra berhasil ditandai lunas!');
      loadData();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Scale className="w-5 h-5" />
            </div>
            Subcontract &amp; Maklon Material Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standar industri HashMicro: Rekonsiliasi bahan baku keluar vs produk jadi masuk dari bengkel mitra, rasio rendemen kayu &amp; potongan penalti cacat.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/25 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Rekonsiliasi Maklon Baru
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Table */}
      <div className="berry-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
            <tr>
              <th className="p-4">No. Rekonsiliasi</th>
              <th className="p-4">Mitra Bengkel / SPK</th>
              <th className="p-4 text-center">Bahan Keluar ➔ Jadi Masuk</th>
              <th className="p-4 text-center">Rasio Rendemen</th>
              <th className="p-4 text-right">Kotor Borongan</th>
              <th className="p-4 text-right">Potongan Cacat</th>
              <th className="p-4 text-right">Bersih Dibayar</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  Memuat data rekonsiliasi maklon...
                </td>
              </tr>
            ) : reconciles.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  Belum ada dokumen rekonsiliasi maklon mitra.
                </td>
              </tr>
            ) : (
              reconciles.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-purple-600">{rec.reconcile_number}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{rec.mitra_user?.name || 'Mitra Pengrajin'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{rec.work_order?.spk_number}</div>
                  </td>
                  <td className="p-4 text-center font-mono">
                    <span className="text-slate-500">{rec.sent_quantity} kirim</span> ➔{' '}
                    <span className="text-emerald-600 font-bold">{rec.received_quantity} jadi</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-bold font-mono text-[11px]">
                      {rec.material_yield_pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-700">
                    Rp {rec.mitra_fee_payable.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-right font-mono text-rose-600 font-bold">
                    {rec.penalty_deduction > 0 ? `- Rp ${rec.penalty_deduction.toLocaleString('id-ID')}` : 'Rp 0'}
                  </td>
                  <td className="p-4 text-right font-mono font-extrabold text-emerald-700 text-sm">
                    Rp {rec.final_payout_amount.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        rec.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {rec.status !== 'PAID' && (
                      <button
                        onClick={() => handlePayReconcile(rec.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Bayar Borongan
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Buat Rekonsiliasi */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-600" />
                Input Rekonsiliasi Hasil Maklon Mitra
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReconcile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Mitra Bengkel *</label>
                  <select
                    required
                    value={mitraUserId}
                    onChange={(e) => setMitraUserId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  >
                    <option value="0">-- Pilih Mitra --</option>
                    {mitraUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih SPK Induk *</label>
                  <select
                    required
                    value={workOrderId}
                    onChange={(e) => setWorkOrderId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  >
                    <option value="0">-- Pilih SPK --</option>
                    {workOrders.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.spk_number} - {w.product?.product_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bahan Dikirim (pcs)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={sentQuantity}
                    onChange={(e) => setSentQuantity(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-emerald-700 mb-1">Barang Jadi (pcs)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={receivedQuantity}
                    onChange={(e) => setReceivedQuantity(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-rose-700 mb-1">Cacat Rusak (pcs)</label>
                  <input
                    type="number"
                    min={0}
                    value={rejectQuantity}
                    onChange={(e) => setRejectQuantity(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarif Borongan / Unit (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={pieceRate}
                    onChange={(e) => setPieceRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Denda per Cacat (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={penaltyPerReject}
                    onChange={(e) => setPenaltyPerReject(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Kualitas Maklon</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/25 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Rekonsiliasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
