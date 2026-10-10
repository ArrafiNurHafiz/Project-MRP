'use client';

import { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Plus,
  Flame,
  XCircle,
  Building,
  User,
} from 'lucide-react';
import { apiFetch, QCLog, WorkOrder, User as UserType, getStoredUser } from '@/lib/api';

export default function QCPage() {
  const [qcLogs, setQcLogs] = useState<QCLog[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [selectedStationId, setSelectedStationId] = useState<number>(0);
  const [inspectionModel, setInspectionModel] = useState('in_house');
  const [sampleQty, setSampleQty] = useState(50);
  const [passQty, setPassQty] = useState(48);
  const [rejectMinorQty, setRejectMinorQty] = useState(2);
  const [rejectMajorQty, setRejectMajorQty] = useState(0);
  const [rejectScrapQty, setRejectScrapQty] = useState(0);
  const [defectCategories, setDefectCategories] = useState('Serat kayu kasar / Amplas kurang halus');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [qcRes, woRes] = await Promise.all([
      apiFetch<QCLog[]>('/qc/logs?limit=50'),
      apiFetch<any>('/spk?limit=50'),
    ]);

    if (qcRes.success && qcRes.data) setQcLogs(qcRes.data);
    if (woRes.success && woRes.data) setWorkOrders(woRes.data.work_orders || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitQC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStationId) {
      alert('Pilih stasiun kerja SPK yang diinspeksi');
      return;
    }

    const payload = {
      work_order_station_id: Number(selectedStationId),
      inspection_model: inspectionModel,
      sample_qty: Number(sampleQty),
      pass_qty: Number(passQty),
      reject_minor_qty: Number(rejectMinorQty),
      reject_major_qty: Number(rejectMajorQty),
      reject_scrap_qty: Number(rejectScrapQty),
      defect_categories: defectCategories,
      notes,
    };

    const res = await apiFetch('/qc/inspect', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      alert('Inspeksi QC berhasil disimpan!');
      setModalOpen(false);
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
              <ClipboardList className="w-5 h-5" />
            </div>
            Kontrol Kualitas &amp; Inspeksi QC (3 Tingkat)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pemeriksaan sampling mutu produk per stasiun kerja: Klasifikasi Cacat Minor (Bisa diperbaiki), Cacat Mayor (Bongkar), dan Scrap (Ganti Bahan).
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Input Inspeksi QC
        </button>
      </div>

      {/* QC Logs Table */}
      <div className="berry-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
            <tr>
              <th className="p-4">Waktu Inspeksi</th>
              <th className="p-4">Auditor QC</th>
              <th className="p-4 text-center">Sample</th>
              <th className="p-4 text-center">Lolos (Pass)</th>
              <th className="p-4 text-center">Cacat (Reject)</th>
              <th className="p-4">Kategori Kerusakan</th>
              <th className="p-4">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Memuat data inspeksi QC...
                </td>
              </tr>
            ) : qcLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Belum ada log inspeksi QC yang tercatat.
                </td>
              </tr>
            ) : (
              qcLogs.map((qc) => (
                <tr key={qc.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono text-slate-500 text-[11px]">
                    {new Date(qc.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 font-bold text-slate-800">
                    {qc.inspector_user?.name || 'Inspektur QC'}
                  </td>
                  <td className="p-4 text-center font-mono font-bold text-slate-700">
                    {qc.sample_qty} pcs
                  </td>
                  <td className="p-4 text-center font-mono font-extrabold text-emerald-600">
                    {qc.pass_qty} pcs
                  </td>
                  <td className="p-4 text-center font-mono font-extrabold text-rose-600">
                    {qc.reject_qty} pcs
                  </td>
                  <td className="p-4 text-slate-600">
                    {qc.defect_categories || '-'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        qc.action_taken === 'accept'
                          ? 'bg-emerald-100 text-emerald-800'
                          : qc.action_taken === 'scrap'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {qc.action_taken.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Input QC */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Formulir Inspeksi Kontrol Kualitas (QC)
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQC} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Stasiun SPK yang Diinspeksi *</label>
                <select
                  required
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                >
                  <option value="0">-- Pilih Stasiun SPK --</option>
                  {workOrders.map((wo) =>
                    wo.stations?.map((st) => (
                      <option key={st.id} value={st.id}>
                        {wo.spk_number} - {wo.product?.product_name} ➔ {st.station?.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Sample Diperiksa</label>
                  <input
                    type="number"
                    min={1}
                    value={sampleQty}
                    onChange={(e) => setSampleQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lolos Standar (Pass)</label>
                  <input
                    type="number"
                    min={0}
                    value={passQty}
                    onChange={(e) => setPassQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-emerald-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Minor Rework</label>
                  <input
                    type="number"
                    min={0}
                    value={rejectMinorQty}
                    onChange={(e) => setRejectMinorQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-amber-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Major Rework</label>
                  <input
                    type="number"
                    min={0}
                    value={rejectMajorQty}
                    onChange={(e) => setRejectMajorQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-rose-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Scrap (Ganti)</label>
                  <input
                    type="number"
                    min={0}
                    value={rejectScrapQty}
                    onChange={(e) => setRejectScrapQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-rose-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Cacat &amp; Catatan QC</label>
                <textarea
                  rows={2}
                  value={defectCategories}
                  onChange={(e) => setDefectCategories(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  Simpan Laporan QC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
