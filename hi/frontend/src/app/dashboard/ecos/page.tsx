'use client';

import { useState, useEffect } from 'react';
import { apiFetch, EngineeringChangeOrder, Product, Material, getStoredUser } from '@/lib/api';
import { GitPullRequest, Plus, Search, CheckCircle2, XCircle, ArrowRight, Layers, FileText, AlertCircle, Eye, Sparkles, Check } from 'lucide-react';

export default function ECOPage() {
  const [ecos, setEcos] = useState<EngineeringChangeOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalECO, setDetailModalECO] = useState<EngineeringChangeOrder | null>(null);

  // Form State
  const [productId, setProductId] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [changeType, setChangeType] = useState('BOM_CHANGE');
  const [reason, setReason] = useState('Optimasi efisiensi bahan & substitusi jenis cat ramah lingkungan');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [versionFrom, setVersionFrom] = useState('v1.0');
  const [versionTo, setVersionTo] = useState('v1.1');
  const [items, setItems] = useState([
    { material_id: 0, action_type: 'UPDATE_QTY', old_quantity: 0.05, new_quantity: 0.04, notes: 'Pengurangan ketebalan susut' },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (statusFilter) query.set('status', statusFilter);

    const [eRes, pRes, mRes] = await Promise.all([
      apiFetch<any>(`/enterprise/ecos?${query.toString()}`),
      apiFetch<any>('/products?limit=100'),
      apiFetch<any>('/materials?limit=100'),
    ]);

    if (eRes.success && eRes.data) setEcos(eRes.data.ecos || []);
    if (pRes.success && pRes.data) setProducts(pRes.data.products || []);
    if (mRes.success && mRes.data) setMaterials(mRes.data.materials || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreateECO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !title) {
      setError('Pilih produk dan masukkan judul revisi ECO');
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await apiFetch('/enterprise/ecos', {
      method: 'POST',
      body: JSON.stringify({
        product_id: Number(productId),
        title,
        change_type: changeType,
        reason,
        effective_date: new Date(effectiveDate).toISOString(),
        version_from: versionFrom,
        version_to: versionTo,
        items: items.map((it) => ({
          material_id: Number(it.material_id),
          action_type: it.action_type,
          old_quantity: Number(it.old_quantity),
          new_quantity: Number(it.new_quantity),
          notes: it.notes,
        })),
      }),
    });

    if (res.success) {
      setSuccess('Dokumen Engineering Change Order berhasil diterbitkan!');
      setModalOpen(false);
      setTitle('');
      loadData();
    } else {
      setError(res.message || 'Gagal menerbitkan ECO');
    }
    setSubmitting(false);
  };

  const handleApplyECO = async (id: number) => {
    if (!confirm('Setujui & terapkan perubahan resep BOM ini ke master produk aktif?')) return;
    const res = await apiFetch(`/enterprise/ecos/${id}/apply`, { method: 'PATCH' });
    if (res.success) {
      setSuccess('Perubahan resep BOM berhasil diberlakukan secara resmi!');
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
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <GitPullRequest className="w-5 h-5" />
            </div>
            Engineering Change Orders (ECO &amp; BOM Versioning)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standar industri Odoo &amp; Infor: Kontrol revisi formula BOM, perbaikan gambar teknik, dan persetujuan perubahan spesifikasi produksi.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Ajukan Revisi ECO Baru
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

      {/* Filter */}
      <div className="berry-card p-4 flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="">Semua Status ECO</option>
          <option value="DRAFT">DRAFT (Draf Pengajuan)</option>
          <option value="IN_REVIEW">IN_REVIEW (Sedang Direview)</option>
          <option value="APPLIED">APPLIED (Diberlakukan ke BOM)</option>
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
              <th className="p-4">No. ECO</th>
              <th className="p-4">Nama Produk Master</th>
              <th className="p-4">Judul Revisi</th>
              <th className="p-4">Tipe Perubahan</th>
              <th className="p-4 text-center">Versi BOM</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Memuat data ECO...
                </td>
              </tr>
            ) : ecos.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Belum ada revisi Engineering Change Order.
                </td>
              </tr>
            ) : (
              ecos.map((eco) => (
                <tr key={eco.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-indigo-600">{eco.eco_number}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{eco.product?.product_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{eco.product?.product_code}</div>
                  </td>
                  <td className="p-4 font-bold text-slate-800">{eco.title}</td>
                  <td className="p-4 text-slate-600">{eco.change_type.replace(/_/g, ' ')}</td>
                  <td className="p-4 text-center font-mono">
                    <span className="text-slate-500">{eco.version_from}</span> ➔{' '}
                    <span className="text-indigo-600 font-bold">{eco.version_to}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        eco.status === 'APPLIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {eco.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setDetailModalECO(eco)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {eco.status !== 'APPLIED' && (
                        <button
                          onClick={() => handleApplyECO(eco.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Terapkan ke BOM
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

      {/* Modal Detail ECO */}
      {detailModalECO && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">
                Dokumen ECO: {detailModalECO.eco_number}
              </h2>
              <button onClick={() => setDetailModalECO(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div>Produk: <b>{detailModalECO.product?.product_name}</b></div>
              <div>Alasan Perubahan: <span className="text-slate-700">{detailModalECO.reason}</span></div>
              <div>Versi BOM: <b>{detailModalECO.version_from}</b> ➔ <b className="text-indigo-600">{detailModalECO.version_to}</b></div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-extrabold text-slate-700 uppercase text-[10px]">Rincian Komponen BOM yang Direvisi:</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Material</th>
                      <th className="p-2.5">Aksi</th>
                      <th className="p-2.5 text-right">Qty Lama</th>
                      <th className="p-2.5 text-right">Qty Baru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailModalECO.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-900">{it.material?.name}</td>
                        <td className="p-2.5 text-indigo-600 font-bold">{it.action_type}</td>
                        <td className="p-2.5 text-right font-mono">{it.old_quantity}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600">{it.new_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailModalECO(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajukan ECO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-indigo-600" />
                Formulir Pengajuan Engineering Change Order (ECO)
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateECO} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Master Produk *</label>
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
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Perubahan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Redesain Sambungan Purus & Hemat Cat"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Versi Asal</label>
                  <input
                    type="text"
                    value={versionFrom}
                    onChange={(e) => setVersionFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Versi Baru Target</label>
                  <input
                    type="text"
                    value={versionTo}
                    onChange={(e) => setVersionTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Berlaku</label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alasan &amp; Justifikasi Perubahan</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              {/* Items */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-extrabold text-indigo-700 uppercase text-[10px]">Revisi Kebutuhan Komponen Material:</span>
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 items-center">
                    <div className="col-span-5">
                      <select
                        value={it.material_id}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].material_id = Number(e.target.value);
                          setItems(updated);
                        }}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900"
                      >
                        <option value="0">-- Pilih Material --</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.material_code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.001"
                        placeholder="Qty Baru"
                        value={it.new_quantity}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].new_quantity = Number(e.target.value);
                          setItems(updated);
                        }}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-900 text-center"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Catatan instruksi..."
                        value={it.notes}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].notes = e.target.value;
                          setItems(updated);
                        }}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900"
                      />
                    </div>
                  </div>
                ))}
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Terbitkan ECO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
