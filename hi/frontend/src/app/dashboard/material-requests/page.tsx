'use client';

import { useState, useEffect } from 'react';
import { apiFetch, MaterialRequest, Material, User, getStoredUser } from '@/lib/api';
import { ClipboardList, CheckCircle2, AlertTriangle, Search, Package, ArrowRight, Clock, ShieldCheck, Box } from 'lucide-react';

export default function MaterialRequestsPage() {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (statusFilter) query.set('status', statusFilter);

    const res = await apiFetch<any>(`/material-requests?${query.toString()}`);
    if (res.success && res.data) {
      setRequests(res.data.requests || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    setCurrentUser(getStoredUser());
    loadData();
  }, [statusFilter]);

  // 1. Gudang cek ketersediaan stok
  const handleCheckStock = async (id: number) => {
    const res = await apiFetch<MaterialRequest>(`/material-requests/${id}/check-stock`, { method: 'PATCH' });
    if (res.success) {
      alert('Pemeriksaan ketersediaan stok gudang selesai!');
      loadData();
    } else {
      alert(res.message);
    }
  };

  // 2. Gudang serahkan / alokasikan material ke lantai produksi
  const handleAllocateIssue = async (id: number) => {
    if (!confirm('Ambil barang dari gudang dan serahkan ke lantai produksi? Stok material aktual akan otomatis dipotong.')) return;
    const res = await apiFetch<MaterialRequest>(`/material-requests/${id}/allocate-issue`, { method: 'PATCH' });
    if (res.success) {
      alert('Material berhasil diambil dan dialokasikan ke lantai produksi!');
      loadData();
    } else {
      alert(res.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ISSUED':
        return 'bg-emerald-100 text-emerald-800';
      case 'AVAILABLE':
        return 'bg-blue-100 text-blue-800';
      case 'SHORTAGE':
        return 'bg-rose-100 text-rose-800 animate-pulse';
      case 'WAITING_CHECK':
        return 'bg-amber-100 text-amber-800 animate-pulse';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <ClipboardList className="w-5 h-5" />
            </div>
            Permintaan Material Gudang (Material Requests)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Alur Gudang: Otomatis Terbit dari Eksekusi SPK ➔ Gudang Cek Ketersediaan Stok ➔ Ambil Barang &amp; Serahkan ke Produksi
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="berry-card p-4 flex flex-col md:flex-row items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
        >
          <option value="">Semua Status Permintaan</option>
          <option value="WAITING_CHECK">WAITING_CHECK (Perlu Dicek Gudang)</option>
          <option value="AVAILABLE">AVAILABLE (Stok Siap Diambil)</option>
          <option value="SHORTAGE">SHORTAGE (Bahan Kurang / Perlu PO)</option>
          <option value="ISSUED">ISSUED (Sudah Diserahkan ke Produksi)</option>
        </select>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-all cursor-pointer"
        >
          Refresh Data
        </button>
      </div>

      {/* Material Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 berry-card">
            Memuat daftar permintaan material...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 berry-card">
            Belum ada permintaan material gudang. Permintaan material otomatis terbit saat SPK diubah menjadi &quot;Siap Proses&quot;.
          </div>
        ) : (
          requests.map((mr) => (
            <div
              key={mr.id}
              className="berry-card p-6 space-y-4 hover:border-blue-300 transition-all"
            >
              {/* Header MR */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      {mr.request_number}
                    </span>
                    <span className="text-xs text-slate-800 font-bold">
                      Ref SPK: <b className="text-indigo-600 font-mono">{mr.work_order?.spk_number}</b>
                    </span>
                    <span className="text-xs text-slate-500">({mr.work_order?.product?.product_name})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dibuat: {new Date(mr.request_date).toLocaleString('id-ID')}</span>
                    <span>•</span>
                    <span>Pemohon: {mr.requested_by?.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${getStatusBadge(mr.status)}`}>
                    {mr.status}
                  </span>
                  {mr.status === 'WAITING_CHECK' && (
                    <button
                      onClick={() => handleCheckStock(mr.id)}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      1. Cek Ketersediaan Gudang
                    </button>
                  )}
                  {(mr.status === 'AVAILABLE' || mr.status === 'SHORTAGE') && (
                    <>
                      <button
                        onClick={() => handleAllocateIssue(mr.id)}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5" />
                        2. Ambil &amp; Serahkan ke Produksi
                      </button>
                      {mr.status === 'SHORTAGE' && mr.work_order_id && (
                        <button
                          onClick={async () => {
                            if (!confirm('Terbitkan Purchase Order otomatis untuk menutupi seluruh defisit bahan pada permintaan ini?')) return;
                            const res = await apiFetch<any>(`/work-orders/${mr.work_order_id}/create-shortage-po`, { method: 'POST' });
                            if (res.success) {
                              alert(`Purchase Order berhasil diterbitkan: ${res.data?.po_number || 'PO Baru'}`);
                            } else {
                              alert(res.error?.message || 'Gagal membuat PO');
                            }
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> 1-Click PO Shortage
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-600 text-[10px] uppercase tracking-wider font-extrabold">
                    <tr>
                      <th className="p-3">Nama Bahan Baku</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3 text-center">Dibutuhkan</th>
                      <th className="p-3 text-center">Stok Gudang</th>
                      <th className="p-3 text-center">Dialokasikan</th>
                      <th className="p-3 text-center">Status Item</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60">
                    {mr.items?.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-100/40">
                        <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                          <Box className="w-3.5 h-3.5 text-blue-600" />
                          {it.material?.name} <span className="text-[10px] text-slate-400 font-mono">[{it.material?.material_code}]</span>
                        </td>
                        <td className="p-3 text-slate-600 capitalize">{it.material?.category}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">
                          {it.required_qty.toFixed(2)} {it.unit}
                        </td>
                        <td className="p-3 text-center font-mono font-semibold text-slate-600">
                          {it.available_qty.toFixed(2)} {it.unit}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-600">
                          {it.allocated_qty.toFixed(2)} {it.unit}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                              it.status === 'TAKEN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : it.status === 'READY'
                                ? 'bg-blue-100 text-blue-800'
                                : it.status === 'SHORTAGE'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {it.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
