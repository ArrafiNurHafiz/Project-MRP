'use client';

import { useState, useEffect } from 'react';
import { apiFetch, ReworkOrder, WorkOrder, WorkStation, User, getStoredUser } from '@/lib/api';
import { RotateCcw, Plus, Search, CheckCircle2, AlertOctagon, XCircle, Users, ArrowRight, Eye, ShieldAlert } from 'lucide-react';

export default function ReworksPage() {
  const [reworks, setReworks] = useState<ReworkOrder[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [mitraUsers, setMitraUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [updateModalRO, setUpdateModalRO] = useState<ReworkOrder | null>(null);

  // Form State Create
  const [workOrderId, setWorkOrderId] = useState<number>(0);
  const [sourceStationId, setSourceStationId] = useState<number>(3); // Finishing
  const [targetStationId, setTargetStationId] = useState<number>(2); // Pasca WW / Amplas ulang
  const [defectReason, setDefectReason] = useState('WARNA_BELANG');
  const [defectQty, setDefectQty] = useState<number>(25);
  const [assignedMitraId, setAssignedMitraId] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Form State Update
  const [recoveredQty, setRecoveredQty] = useState<number>(20);
  const [scrappedQty, setScrappedQty] = useState<number>(5);
  const [updateStatus, setUpdateStatus] = useState<'RECOVERED' | 'SCRAPPED' | 'IN_PROGRESS'>('RECOVERED');
  const [updateNotes, setUpdateNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (statusFilter) query.set('status', statusFilter);

    const [rRes, wRes, sRes, uRes] = await Promise.all([
      apiFetch<any>(`/industrial/reworks?${query.toString()}`),
      apiFetch<any>('/spk?limit=100'),
      apiFetch<any>('/stations'),
      apiFetch<any>('/users?limit=100'),
    ]);

    if (rRes.success && rRes.data) setReworks(rRes.data.rework_orders || []);
    if (wRes.success && wRes.data) setWorkOrders(wRes.data.work_orders || []);
    if (sRes.success && sRes.data) setStations(sRes.data || []);
    if (uRes.success && uRes.data) setMitraUsers(uRes.data.users?.filter((u: any) => u.roles?.some((r: any) => r.name.toLowerCase().includes('mitra'))) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreateRework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrderId || defectQty <= 0) {
      setError('Pilih SPK dan isi jumlah cacat');
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await apiFetch('/industrial/reworks', {
      method: 'POST',
      body: JSON.stringify({
        work_order_id: Number(workOrderId),
        source_station_id: Number(sourceStationId),
        target_station_id: Number(targetStationId),
        defect_reason: defectReason,
        defect_qty: Number(defectQty),
        assigned_mitra_id: assignedMitraId ? Number(assignedMitraId) : undefined,
        notes,
      }),
    });

    if (res.success) {
      setSuccess('Surat Perintah Rework berhasil diterbitkan!');
      setModalOpen(false);
      setNotes('');
      loadData();
    } else {
      setError(res.message || 'Gagal menerbitkan rework order');
    }
    setSubmitting(false);
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateModalRO) return;
    setSubmitting(true);

    const res = await apiFetch(`/industrial/reworks/${updateModalRO.id}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({
        recovered_qty: Number(recoveredQty),
        scrapped_qty: Number(scrappedQty),
        status: updateStatus,
        notes: updateNotes,
      }),
    });

    if (res.success) {
      setSuccess(`Hasil rework ${updateModalRO.rework_number} berhasil diperbarui!`);
      setUpdateModalRO(null);
      loadData();
    } else {
      alert(res.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <RotateCcw className="w-5 h-5" />
            </div>
            Rework Order &amp; Scrap Defect Loop
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penanganan sirkular produk reject QC (jamur kayu, warna belang, cacat dimensi), perbaikan ulang ke stasiun asal &amp; pencatatan scrap afkir.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/25 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Terbitkan Perintah Rework
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
          <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Filter */}
      <div className="berry-card p-4 flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="">Semua Status Rework</option>
          <option value="IN_PROGRESS">IN_PROGRESS (Sedang Dikerjakan Ulang)</option>
          <option value="RECOVERED">RECOVERED (Lolos QC Ulang)</option>
          <option value="SCRAPPED">SCRAPPED (Afkir Total)</option>
        </select>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl cursor-pointer"
        >
          Cari
        </button>
      </div>

      {/* Table */}
      <div className="berry-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
            <tr>
              <th className="p-4">No. Rework</th>
              <th className="p-4">Ref. SPK / Produk</th>
              <th className="p-4">Alur Perbaikan</th>
              <th className="p-4">Alasan Cacat</th>
              <th className="p-4 text-center">Qty Cacat</th>
              <th className="p-4 text-center">Hasil Pulih / Afkir</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Memuat data perintah rework...
                </td>
              </tr>
            ) : reworks.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Tidak ada perintah rework aktif. Tingkat kualitas produksi optimal.
                </td>
              </tr>
            ) : (
              reworks.map((ro) => (
                <tr key={ro.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-purple-600">{ro.rework_number}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{ro.work_order?.product?.product_name || 'Produk'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{ro.work_order?.spk_number}</div>
                  </td>
                  <td className="p-4 text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span>{ro.source_station?.name}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-purple-700 font-bold">{ro.target_station?.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                      {ro.defect_reason.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold text-slate-900 font-mono">
                    {ro.defect_qty} pcs
                  </td>
                  <td className="p-4 text-center font-mono">
                    <span className="text-emerald-600 font-bold">{ro.recovered_qty} OK</span> /{' '}
                    <span className="text-rose-600 font-bold">{ro.scrapped_qty} Scrap</span>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        ro.status === 'RECOVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ro.status === 'SCRAPPED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {ro.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {ro.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => {
                          setUpdateModalRO(ro);
                          setRecoveredQty(ro.defect_qty);
                          setScrappedQty(0);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Input Hasil QC
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Terbitkan Rework */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-600" />
                Terbitkan Perintah Kerja Ulang (Rework Order)
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRework} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih SPK Induk *</label>
                <select
                  required
                  value={workOrderId}
                  onChange={(e) => setWorkOrderId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                >
                  <option value="0">-- Pilih SPK Terbit --</option>
                  {workOrders.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.spk_number} - {w.product?.product_name} ({w.total_target_qty} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stasiun Temuan Cacat</label>
                  <select
                    value={sourceStationId}
                    onChange={(e) => setSourceStationId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    {stations.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.station_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kirim Balik ke Stasiun</label>
                  <select
                    value={targetStationId}
                    onChange={(e) => setTargetStationId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  >
                    {stations.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.station_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Cacat / Defect</label>
                  <select
                    value={defectReason}
                    onChange={(e) => setDefectReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  >
                    <option value="WARNA_BELANG">Warna Belang / Kurang Rata</option>
                    <option value="JAMUR_KAYU">Tumbuh Jamur / Lembab</option>
                    <option value="RETAK_KAYU">Retak Rambut / Sambungan Purus</option>
                    <option value="UKURAN_MELENCENG">Dimensi Tebal/Panjang Meleset</option>
                    <option value="SALAH_GRAFIR_LASER">Salah Grafir / Logo Miring</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Unit Cacat (pcs) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={defectQty}
                    onChange={(e) => setDefectQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan &amp; Instruksi Perbaikan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Amplas ulang grit 240, lapis clear doff tipis..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/25"
                >
                  {submitting ? 'Menyimpan...' : 'Terbitkan Rework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Input Hasil QC Rework */}
      {updateModalRO && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-200">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Hasil Inspeksi QC Ulang: {updateModalRO.rework_number}
            </h2>

            <form onSubmit={handleUpdateProgress} className="space-y-4 text-xs">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex justify-between font-bold text-purple-950">
                <span>Total Unit Diperbaiki:</span>
                <span>{updateModalRO.defect_qty} pcs</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-700 mb-1">Jumlah Berhasil Pulih (Pass)</label>
                  <input
                    type="number"
                    min={0}
                    value={recoveredQty}
                    onChange={(e) => setRecoveredQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-rose-700 mb-1">Jumlah Afkir Total (Scrap)</label>
                  <input
                    type="number"
                    min={0}
                    value={scrappedQty}
                    onChange={(e) => setScrappedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keputusan Status Akhir</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                >
                  <option value="RECOVERED">RECOVERED (Lolos Masuk Jalur Packing)</option>
                  <option value="SCRAPPED">SCRAPPED (Afkir / Musnahkan)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Masih Perlu Dipoles)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan QC</label>
                <textarea
                  rows={2}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Kualitas warna telah seragam dan siap packing..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUpdateModalRO(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/25"
                >
                  Simpan Keputusan QC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
