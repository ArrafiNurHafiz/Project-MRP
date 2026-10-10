'use client';

import { useState, useEffect } from 'react';
import { apiFetch, UnbuildOrder, Product, Material, getStoredUser } from '@/lib/api';
import { RefreshCw, Plus, Search, CheckCircle2, XCircle, ArrowRight, Package, Boxes, Eye, Sparkles, Check, AlertCircle } from 'lucide-react';

export default function UnbuildsPage() {
  const [unbuilds, setUnbuilds] = useState<UnbuildOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalUnbuild, setDetailModalUnbuild] = useState<UnbuildOrder | null>(null);

  // Form State
  const [productId, setProductId] = useState<number>(0);
  const [disassemblyQty, setDisassemblyQty] = useState<number>(10);
  const [reason, setReason] = useState('RETUR_PELANGGAN_KARENA_CANCEL_ORDER');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [uRes, pRes] = await Promise.all([
      apiFetch<any>('/enterprise/unbuilds'),
      apiFetch<any>('/products?limit=100'),
    ]);

    if (uRes.success && uRes.data) setUnbuilds(uRes.data.unbuild_orders || []);
    if (pRes.success && pRes.data) setProducts(pRes.data.products || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUnbuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || disassemblyQty <= 0) {
      setError('Pilih produk dan masukkan kuantitas bongkar');
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await apiFetch('/enterprise/unbuilds', {
      method: 'POST',
      body: JSON.stringify({
        product_id: Number(productId),
        disassembly_qty: Number(disassemblyQty),
        reason,
      }),
    });

    if (res.success) {
      setSuccess('Perintah pembongkaran produk jadi (Unbuild Order) berhasil diterbitkan!');
      setModalOpen(false);
      loadData();
    } else {
      setError(res.message || 'Gagal membuat unbuild order');
    }
    setSubmitting(false);
  };

  const handleExecuteUnbuild = async (id: number) => {
    if (!confirm('Eksekusi pembongkaran produk? Komponen material penyusunnya akan dikembalikan secara otomatis ke stok gudang.')) return;
    const res = await apiFetch(`/enterprise/unbuilds/${id}/execute`, { method: 'PATCH' });
    if (res.success) {
      setSuccess('Produk berhasil dibongkar dan bahan baku dikembalikan ke stok gudang!');
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
              <RefreshCw className="w-5 h-5" />
            </div>
            Unbuild / Disassembly Orders (Reverse BOM)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standar Odoo MRP: Pembongkaran produk jadi / retur pelanggan untuk mengembalikan komponen bahan baku mentah kembali ke stok inventaris.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/25 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Terbitkan Perintah Unbuild
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
              <th className="p-4">No. Unbuild</th>
              <th className="p-4">Produk yang Dibongkar</th>
              <th className="p-4 text-center">Kuantitas Bongkar</th>
              <th className="p-4">Alasan Pembongkaran</th>
              <th className="p-4">Petugas Pelaksana</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Memuat data unbuild...
                </td>
              </tr>
            ) : unbuilds.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Belum ada perintah unbuild aktif.
                </td>
              </tr>
            ) : (
              unbuilds.map((ub) => (
                <tr key={ub.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-purple-600">{ub.unbuild_number}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{ub.product?.product_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{ub.product?.product_code}</div>
                  </td>
                  <td className="p-4 text-center font-mono font-bold text-slate-900">
                    {ub.disassembly_qty} pcs
                  </td>
                  <td className="p-4 text-slate-600">{ub.reason.replace(/_/g, ' ')}</td>
                  <td className="p-4 font-bold text-slate-800">{ub.performed_by_user?.name || 'Staff Pabrik'}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        ub.status === 'DISASSEMBLED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ub.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setDetailModalUnbuild(ub)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {ub.status === 'DRAFT' && (
                        <button
                          onClick={() => handleExecuteUnbuild(ub.id)}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Eksekusi Bongkar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Unbuild */}
      {detailModalUnbuild && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">
                Unbuild: {detailModalUnbuild.unbuild_number}
              </h2>
              <button onClick={() => setDetailModalUnbuild(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div>Produk Jadi: <b>{detailModalUnbuild.product?.product_name}</b></div>
              <div>Kuantitas Dibongkar: <b>{detailModalUnbuild.disassembly_qty} pcs</b></div>
              <div>Alasan: <span className="text-slate-700">{detailModalUnbuild.reason}</span></div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-extrabold text-purple-950 uppercase text-[10px]">Komponen Bahan yang Dikembalikan ke Gudang:</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Material</th>
                      <th className="p-2.5 text-right">Kuantitas Pulih</th>
                      <th className="p-2.5 text-center">Kondisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailModalUnbuild.recovered_items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-900">{it.material?.name}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">{it.recovered_qty} {it.material?.unit}</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                            {it.condition}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailModalUnbuild(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Unbuild */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-600" />
                Terbitkan Perintah Bongkar (Unbuild Order)
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUnbuild} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Produk Jadi yang Dibongkar *</label>
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                >
                  <option value="0">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} ({p.product_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kuantitas Dibongkar (pcs) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={disassemblyQty}
                    onChange={(e) => setDisassemblyQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alasan Pembongkaran</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  >
                    <option value="RETUR_PELANGGAN_CANCEL">Retur Pembatalan Pesanan</option>
                    <option value="SALAH_WARNA_FINISHING">Salah Warna Finishing (Ambil Ulang Kayu)</option>
                    <option value="DEFECTIVE_REPURPOSE">Produk Cacat Dialihfungsikan</option>
                    <option value="STOK_LAMA_AFKIR">Stok Lama Di-disassembly</option>
                  </select>
                </div>
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
                  {submitting ? 'Menyimpan...' : 'Simpan Draf Unbuild'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
