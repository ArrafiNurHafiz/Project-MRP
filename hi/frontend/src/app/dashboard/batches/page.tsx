'use client';

import { useState, useEffect } from 'react';
import { apiFetch, MaterialBatchLot, Material, Vendor } from '@/lib/api';
import { Layers, Plus, Search, CheckCircle2, ShieldCheck, QrCode, Calendar, Truck, AlertCircle, XCircle } from 'lucide-react';

export default function BatchesPage() {
  const [lots, setLots] = useState<MaterialBatchLot[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [materialFilter, setMaterialFilter] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [materialId, setMaterialId] = useState<number>(0);
  const [vendorId, setVendorId] = useState<number>(0);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [initialQty, setInitialQty] = useState<number>(50);
  const [unitCost, setUnitCost] = useState<number>(18500);
  const [woodOrigin, setWoodOrigin] = useState('Perhutani KPH Randublatung - SVLK Certified');
  const [moistureContent, setMoistureContent] = useState<number>(11.5);
  const [expiryDate, setExpiryDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (materialFilter > 0) query.set('material_id', materialFilter.toString());

    const [bRes, mRes, vRes] = await Promise.all([
      apiFetch<any>(`/industrial/batches?${query.toString()}`),
      apiFetch<any>('/materials?limit=100'),
      apiFetch<any>('/vendors?limit=100'),
    ]);

    if (bRes.success && bRes.data) setLots(bRes.data.lots || []);
    if (mRes.success && mRes.data) setMaterials(mRes.data.materials || []);
    if (vRes.success && vRes.data) setVendors(vRes.data.vendors || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [materialFilter]);

  const handleRegisterLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId || !vendorId || initialQty <= 0) {
      setError('Material, vendor, dan kuantitas awal wajib diisi');
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await apiFetch('/industrial/batches', {
      method: 'POST',
      body: JSON.stringify({
        material_id: Number(materialId),
        vendor_id: Number(vendorId),
        received_date: new Date(receivedDate).toISOString(),
        initial_qty: Number(initialQty),
        unit_cost: Number(unitCost),
        wood_origin: woodOrigin,
        moisture_content: Number(moistureContent),
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      }),
    });

    if (res.success) {
      setSuccess('Lot / Batch kedatangan bahan baku berhasil didaftarkan & stok bertambah!');
      setModalOpen(false);
      loadData();
    } else {
      setError(res.message || 'Gagal meregistrasi lot');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            Traceable Batch &amp; Lot Tracking (FIFO &amp; Sertifikasi Kayu)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pelacakan asal-usul kayu log (Legalitas SVLK Perhutani), kadar air (Moisture Content), tanggal kedatangan &amp; alokasi FIFO di gudang.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Registrasi Lot Baru
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

      {/* Filter Bar */}
      <div className="berry-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor lot (cth: LOT-2026-09-1234) atau sertifikat asal kayu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={materialFilter}
          onChange={(e) => setMaterialFilter(Number(e.target.value))}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="0">Semua Jenis Material</option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.material_code})
            </option>
          ))}
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
              <th className="p-4">No. Lot / Batch</th>
              <th className="p-4">Nama Material Bahan</th>
              <th className="p-4">Pemasok &amp; Asal Kayu</th>
              <th className="p-4 text-center">Kadar Air (MC)</th>
              <th className="p-4 text-right">Stok Masuk</th>
              <th className="p-4 text-right">Sisa Stok Lot</th>
              <th className="p-4 text-right">HPP Satuan</th>
              <th className="p-4 text-center">QC Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Memuat data lot material...
                </td>
              </tr>
            ) : lots.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Belum ada catatan lot kedatangan material.
                </td>
              </tr>
            ) : (
              lots.map((lot) => (
                <tr key={lot.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-emerald-600">
                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5" />
                      {lot.batch_number}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{lot.material?.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{lot.material?.material_code}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{lot.vendor?.name}</div>
                    <div className="text-[10px] text-slate-500">{lot.wood_origin || 'Supplier Utama'}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-extrabold font-mono text-[11px]">
                      {lot.moisture_content}% MC
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-600">
                    {lot.initial_qty} {lot.material?.unit}
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-emerald-700">
                    {lot.remaining_qty} {lot.material?.unit}
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-slate-900">
                    Rp {lot.unit_cost.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                      {lot.qc_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Registrasi Lot */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Registrasi Lot / Batch Kedatangan Bahan Baku
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterLot} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Material *</label>
                  <select
                    required
                    value={materialId}
                    onChange={(e) => {
                      const mid = Number(e.target.value);
                      setMaterialId(mid);
                      const m = materials.find((mat) => mat.id === mid);
                      if (m) setUnitCost(m.cost_per_unit);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="0">-- Pilih Material --</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.material_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pemasok Vendor *</label>
                  <select
                    required
                    value={vendorId}
                    onChange={(e) => setVendorId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="0">-- Pilih Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.alias || 'Supplier'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Tiba</label>
                  <input
                    type="date"
                    required
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kuantitas Masuk *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={initialQty}
                    onChange={(e) => setInitialQty(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Biaya Beli / Unit</label>
                  <input
                    type="number"
                    min={0}
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asal Kayu / Sertifikat SVLK</label>
                  <input
                    type="text"
                    placeholder="Perhutani KPH Randublatung..."
                    value={woodOrigin}
                    onChange={(e) => setWoodOrigin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kadar Air Kayu (% MC)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={moistureContent}
                    onChange={(e) => setMoistureContent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
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
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/25 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Lot & Tambah Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
