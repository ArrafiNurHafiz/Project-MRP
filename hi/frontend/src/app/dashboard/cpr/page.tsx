'use client';

import { useState, useEffect } from 'react';
import { apiFetch, CustomProductRequest, Customer, Material, WorkStation, getStoredUser } from '@/lib/api';
import { Wrench, Plus, CheckCircle2, ArrowRight, Search, Building2, XCircle, DollarSign, Calendar, Layers, Clock, FileCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CPRPage() {
  const [cprs, setCprs] = useState<CustomProductRequest[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCPR, setSelectedCPR] = useState<CustomProductRequest | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editSpecsOpen, setEditSpecsOpen] = useState(false);

  // Material & Routing Edit State for Selected CPR
  const [editMaterials, setEditMaterials] = useState<{ material_id: number; item_name: string; qty_required: number; unit: string; unit_cost: number }[]>([]);
  const [editRoutings, setEditRoutings] = useState<{ station_id: number; stage_name: string; sequence_order: number; estimated_hours: number; hourly_rate: number }[]>([]);
  const [suggestedPrice, setSuggestedPrice] = useState<number>(0);
  const [leadDays, setLeadDays] = useState<number>(14);
  const [engineeringNotes, setEngineeringNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (statusFilter) query.set('status', statusFilter);

    const [cprRes, matRes, stRes] = await Promise.all([
      apiFetch<any>(`/cpr?${query.toString()}`),
      apiFetch<any>('/materials'),
      apiFetch<any>('/stations'),
    ]);

    if (cprRes.success && cprRes.data) setCprs(cprRes.data.cprs || []);
    if (matRes.success && matRes.data) setMaterials(matRes.data.materials || []);
    if (stRes.success && stRes.data) setStations(stRes.data.stations || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleOpenDetail = (cpr: CustomProductRequest) => {
    setSelectedCPR(cpr);
    setEditMaterials(
      cpr.materials?.map((m) => ({
        material_id: m.material_id || 0,
        item_name: m.item_name,
        qty_required: m.qty_required,
        unit: m.unit,
        unit_cost: m.unit_cost,
      })) || [
        { material_id: materials[0]?.id || 1, item_name: materials[0]?.name || 'Kayu Mahoni Grade A', qty_required: 0.05, unit: 'batang', unit_cost: 45000 },
      ]
    );
    setEditRoutings(
      cpr.routings?.map((r) => ({
        station_id: r.station_id || 0,
        stage_name: r.stage_name,
        sequence_order: r.sequence_order,
        estimated_hours: r.estimated_hours,
        hourly_rate: r.hourly_rate,
      })) || [
        { station_id: stations[0]?.id || 1, stage_name: 'Pembahanan & Pemotongan', sequence_order: 1, estimated_hours: 1.5, hourly_rate: 25000 },
        { station_id: stations[1]?.id || 2, stage_name: 'Perakitan & Finishing', sequence_order: 2, estimated_hours: 2.0, hourly_rate: 30000 },
      ]
    );
    setSuggestedPrice(cpr.suggested_price || cpr.base_price_hpp * 1.35);
    setLeadDays(cpr.estimated_lead_days || 14);
    setEngineeringNotes(cpr.engineering_notes || '');
    setDetailModalOpen(true);
  };

  const handleAddMaterialRow = () => {
    setEditMaterials([
      ...editMaterials,
      { material_id: materials[0]?.id || 0, item_name: materials[0]?.name || '', qty_required: 1, unit: 'pcs', unit_cost: materials[0]?.cost_per_unit || 10000 },
    ]);
  };

  const handleAddRoutingRow = () => {
    setEditRoutings([
      ...editRoutings,
      { station_id: stations[0]?.id || 0, stage_name: stations[0]?.name || '', sequence_order: editRoutings.length + 1, estimated_hours: 1, hourly_rate: 25000 },
    ]);
  };

  const calculateHPP = () => {
    const matTotal = editMaterials.reduce((acc, m) => acc + (m.qty_required * m.unit_cost), 0);
    const routTotal = editRoutings.reduce((acc, r) => acc + (r.estimated_hours * r.hourly_rate), 0);
    return matTotal + routTotal;
  };

  const handleSaveEngineeringSpecs = async () => {
    if (!selectedCPR) return;
    const hpp = calculateHPP();
    const payload = {
      product_name: selectedCPR.product_name,
      category: selectedCPR.category,
      unit: selectedCPR.unit,
      requested_qty: selectedCPR.requested_qty,
      target_budget: selectedCPR.target_budget,
      estimated_lead_days: leadDays,
      engineering_notes: engineeringNotes,
      base_price_hpp: hpp,
      suggested_price: suggestedPrice || hpp * 1.35,
      status: 'IN_PROGRESS',
      materials: editMaterials.map((m) => ({
        material_id: m.material_id || undefined,
        item_name: m.item_name,
        qty_required: Number(m.qty_required),
        unit: m.unit,
        unit_cost: Number(m.unit_cost),
        subtotal: Number(m.qty_required) * Number(m.unit_cost),
      })),
      routings: editRoutings.map((r) => ({
        station_id: r.station_id || undefined,
        stage_name: r.stage_name,
        sequence_order: Number(r.sequence_order),
        estimated_hours: Number(r.estimated_hours),
        hourly_rate: Number(r.hourly_rate),
        subtotal: Number(r.estimated_hours) * Number(r.hourly_rate),
      })),
    };

    const res = await apiFetch(`/cpr/${selectedCPR.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      alert('Spesifikasi Engineering CPR & Estimasi HPP berhasil disimpan!');
      setDetailModalOpen(false);
      loadData();
    } else {
      alert(res.error?.message || 'Gagal menyimpan CPR');
    }
  };

  const handleApproveCPR = async (id: number) => {
    if (!confirm('Setujui Dokumen CPR ini? Penawaran (Quotation) dapat langsung diterbitkan.')) return;
    const res = await apiFetch(`/cpr/${id}/approve`, { method: 'PATCH' });
    if (res.success) {
      alert('CPR Berhasil Disetujui!');
      loadData();
    } else {
      alert(res.error?.message || 'Gagal menyetujui CPR');
    }
  };

  const handleConvertToQuotation = async (id: number) => {
    if (!confirm('Terbitkan Surat Penawaran Resmi dari dokumen CPR ini?')) return;
    const res = await apiFetch(`/cpr/${id}/convert-to-quote`, { method: 'POST' });
    if (res.success) {
      alert('Surat Penawaran Resmi berhasil diterbitkan!');
      loadData();
    } else {
      alert(res.error?.message || 'Gagal konversi ke penawaran');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Custom Products Request (CPR)</h1>
              <p className="text-xs text-slate-500 font-medium">Rekayasa Teknis R&D: Perancangan Formula BOM Kustom, Jam Kerja Routing, Lead Time & Estimasi HPP</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/rfq"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Ke Daftar RFQ
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Nomor CPR atau Nama Produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>
        <div className="flex gap-2">
          {['', 'NEW', 'IN_PROGRESS', 'NEED_REVISION', 'APPROVED', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === '' ? 'Semua Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* CPR Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">No. CPR & Tgl</th>
                <th className="py-3.5 px-4">Pelanggan & RFQ Ref</th>
                <th className="py-3.5 px-4">Nama Produk Kustom</th>
                <th className="py-3.5 px-4">Target Permintaan</th>
                <th className="py-3.5 px-4">Kalkulasi HPP & Jual</th>
                <th className="py-3.5 px-4">Status R&D</th>
                <th className="py-3.5 px-4 text-right">Aksi Engineering</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">Memuat data CPR...</td>
                </tr>
              ) : cprs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">Tidak ada dokumen CPR produk kustom ditemukan.</td>
                </tr>
              ) : (
                cprs.map((cpr) => (
                  <tr key={cpr.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      <div>{cpr.cpr_number}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{new Date(cpr.created_at).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800">{cpr.customer?.name}</div>
                      {cpr.rfq && <div className="text-[10px] text-indigo-600 font-mono">Ref: {cpr.rfq.rfq_number}</div>}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{cpr.product_name}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{cpr.technical_specs || 'Tidak ada catatan spesifikasi khusus'}</div>
                    </td>
                    <td className="py-4 px-4 font-mono">
                      <div className="font-bold text-slate-800">{cpr.requested_qty} {cpr.unit}</div>
                      <div className="text-[10px] text-slate-500">Lead: {cpr.estimated_lead_days} hari</div>
                    </td>
                    <td className="py-4 px-4 font-mono">
                      <div className="text-slate-600">HPP: Rp {cpr.base_price_hpp?.toLocaleString('id-ID')}</div>
                      <div className="font-bold text-emerald-600 text-xs">Jual: Rp {cpr.suggested_price?.toLocaleString('id-ID')}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        cpr.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        cpr.status === 'COMPLETED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        cpr.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        cpr.status === 'NEED_REVISION' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {cpr.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetail(cpr)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition"
                      >
                        Fill / Edit Specs
                      </button>
                      {cpr.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleApproveCPR(cpr.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition"
                        >
                          Approve CPR
                        </button>
                      )}
                      {cpr.status === 'APPROVED' && (
                        <button
                          onClick={() => handleConvertToQuotation(cpr.id)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition"
                        >
                          Issue Quotation
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail / Engineering Formulation Modal */}
      {detailModalOpen && selectedCPR && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Engineering Workstation & Costing CPR</h3>
                <p className="text-xs text-slate-500 font-medium">Dokumen: {selectedCPR.cpr_number} - {selectedCPR.product_name}</p>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>

            {/* Material Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" /> 1. Komponen Bahan Baku Kustom (Materials)
                </h4>
                <button
                  type="button"
                  onClick={handleAddMaterialRow}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-md text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Bahan
                </button>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                    <tr>
                      <th className="p-2.5">Nama Bahan</th>
                      <th className="p-2.5">Qty / Unit</th>
                      <th className="p-2.5">Satuan</th>
                      <th className="p-2.5">Harga Satuan (Rp)</th>
                      <th className="p-2.5 text-right">Subtotal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editMaterials.map((mat, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <input
                            type="text"
                            value={mat.item_name}
                            onChange={(e) => {
                              const arr = [...editMaterials];
                              arr[idx].item_name = e.target.value;
                              setEditMaterials(arr);
                            }}
                            className="w-full p-1.5 border rounded-md text-xs"
                          />
                        </td>
                        <td className="p-2 w-24">
                          <input
                            type="number"
                            step="0.01"
                            value={mat.qty_required}
                            onChange={(e) => {
                              const arr = [...editMaterials];
                              arr[idx].qty_required = parseFloat(e.target.value) || 0;
                              setEditMaterials(arr);
                            }}
                            className="w-full p-1.5 border rounded-md text-xs font-mono"
                          />
                        </td>
                        <td className="p-2 w-24">
                          <input
                            type="text"
                            value={mat.unit}
                            onChange={(e) => {
                              const arr = [...editMaterials];
                              arr[idx].unit = e.target.value;
                              setEditMaterials(arr);
                            }}
                            className="w-full p-1.5 border rounded-md text-xs"
                          />
                        </td>
                        <td className="p-2 w-32">
                          <input
                            type="number"
                            value={mat.unit_cost}
                            onChange={(e) => {
                              const arr = [...editMaterials];
                              arr[idx].unit_cost = parseFloat(e.target.value) || 0;
                              setEditMaterials(arr);
                            }}
                            className="w-full p-1.5 border rounded-md text-xs font-mono"
                          />
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800">
                          Rp {(mat.qty_required * mat.unit_cost).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Routing Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" /> 2. Tahapan Routing Fabrikasi & Jam Kerja
                </h4>
                <button
                  type="button"
                  onClick={handleAddRoutingRow}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-md text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Tahap
                </button>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                    <tr>
                      <th className="p-2.5">Tahapan Fabrikasi</th>
                      <th className="p-2.5">Urutan</th>
                      <th className="p-2.5">Estimasi Jam Kerja</th>
                      <th className="p-2.5">Tarif / Jam (Rp)</th>
                      <th className="p-2.5 text-right">Subtotal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editRoutings.map((rout, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <input
                            type="text"
                            value={rout.stage_name}
                            onChange={(e) => {
                              const arr = [...editRoutings];
                              arr[idx].stage_name = e.target.value;
                              setEditRoutings(arr);
                            }}
                            className="w-full p-1.5 border rounded-md text-xs"
                          />
                        </td>
                        <td className="p-2 w-20">
                          <input
                            type="number"
                            value={rout.sequence_order}
                            onChange={(e) => {
                              const arr = [...editRoutings];
                              arr[idx].sequence_order = parseInt(e.target.value) || 1;
                              setEditRoutings(arr);
                            }}
                            className="w-full p-1.5 border rounded-md text-xs font-mono"
                          />
                        </td>
                        <td className="p-2 w-28">
                          <input
                            type="number"
                            step="0.5"
                            value={rout.estimated_hours}
                            onChange={(e) => {
                              const arr = [...editRoutings];
                              arr[idx].estimated_hours = parseFloat(e.target.value) || 0;
                              setEditRoutings(arr);
                            }}
                            className="w-full p-1.5 border rounded-md text-xs font-mono"
                          />
                        </td>
                        <td className="p-2 w-32">
                          <input
                            type="number"
                            value={rout.hourly_rate}
                            onChange={(e) => {
                              const arr = [...editRoutings];
                              arr[idx].hourly_rate = parseFloat(e.target.value) || 0;
                              setEditRoutings(arr);
                            }}
                            className="w-full p-1.5 border rounded-md text-xs font-mono"
                          />
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800">
                          Rp {(rout.estimated_hours * rout.hourly_rate).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary & Price Decision */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block">Total Kalkulasi HPP (BOM + Routing)</label>
                <div className="text-base font-black font-mono text-slate-900 mt-1">
                  Rp {calculateHPP().toLocaleString('id-ID')}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block">Rekomendasi Harga Jual (Margin 35%)</label>
                <input
                  type="number"
                  value={suggestedPrice || calculateHPP() * 1.35}
                  onChange={(e) => setSuggestedPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-white border rounded-lg font-mono font-bold text-emerald-600 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block">Lead Time Produksi (Hari Kerja)</label>
                <input
                  type="number"
                  value={leadDays}
                  onChange={(e) => setLeadDays(parseInt(e.target.value) || 14)}
                  className="w-full p-2 bg-white border rounded-lg font-mono font-bold text-slate-800 mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEngineeringSpecs}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                Simpan Spesifikasi & HPP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
