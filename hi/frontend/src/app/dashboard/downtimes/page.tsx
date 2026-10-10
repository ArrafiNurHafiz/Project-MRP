'use client';

import { useState, useEffect } from 'react';
import { apiFetch, MachineDowntime, WorkStation, getStoredUser, User } from '@/lib/api';
import { AlertTriangle, Plus, Search, CheckCircle2, Clock, Wrench, XCircle, ShieldAlert, Activity, Play } from 'lucide-react';

export default function MachineDowntimesPage() {
  const [downtimes, setDowntimes] = useState<MachineDowntime[]>([]);
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationFilter, setStationFilter] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [resolveModalDT, setResolveModalDT] = useState<MachineDowntime | null>(null);

  // Form State Report
  const [stationId, setStationId] = useState<number>(1);
  const [machineName, setMachineName] = useState('');
  const [reasonCategory, setReasonCategory] = useState<'BREAKDOWN' | 'TOOLING_CHANGE' | 'POWER_OUTAGE' | 'MAINTENANCE' | 'MATERIAL_WAIT'>('BREAKDOWN');
  const [impactedQty, setImpactedQty] = useState<number>(0);
  const [actionTaken, setActionTaken] = useState('');

  // Form State Resolve
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [resolveNotes, setResolveNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (stationFilter > 0) query.set('station_id', stationFilter.toString());

    const [dRes, sRes] = await Promise.all([
      apiFetch<any>(`/industrial/downtimes?${query.toString()}`),
      apiFetch<any>('/stations'),
    ]);

    if (dRes.success && dRes.data) setDowntimes(dRes.data.downtimes || []);
    if (sRes.success && sRes.data) setStations(sRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [stationFilter]);

  const handleReportDowntime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationId || !machineName) {
      setError('Stasiun kerja dan nama mesin wajib diisi');
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await apiFetch('/industrial/downtimes', {
      method: 'POST',
      body: JSON.stringify({
        station_id: Number(stationId),
        machine_name: machineName,
        reason_category: reasonCategory,
        impacted_qty: Number(impactedQty),
        action_taken: actionTaken,
      }),
    });

    if (res.success) {
      setSuccess('Kendala mesin berhasil dilaporkan ke supervisor lantai produksi!');
      setModalOpen(false);
      setMachineName('');
      setActionTaken('');
      loadData();
    } else {
      setError(res.message || 'Gagal melaporkan kendala');
    }
    setSubmitting(false);
  };

  const handleResolveDowntime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveModalDT) return;
    setSubmitting(true);

    const res = await apiFetch(`/industrial/downtimes/${resolveModalDT.id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({
        duration_minutes: Number(durationMinutes),
        action_taken: resolveNotes || 'Perbaikan mekanikal/elektrikal selesai, mesin di-running test normal',
      }),
    });

    if (res.success) {
      setSuccess(`Mesin ${resolveModalDT.machine_name} berhasil ditandai normal kembali!`);
      setResolveModalDT(null);
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
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Wrench className="w-5 h-5" />
            </div>
            Shopfloor Machine Downtime &amp; OEE Maintenance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan kendala mesin (CNC, Spindle Moulder, Spray Booth), durasi downtime, estimasi unit tertunda &amp; tindakan penanganan teknis.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/25 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Laporkan Kendala Mesin
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
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
          value={stationFilter}
          onChange={(e) => setStationFilter(Number(e.target.value))}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="0">Semua Stasiun Kerja (Stasiun 1 s.d. 5)</option>
          {stations.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name} ({st.station_code})
            </option>
          ))}
        </select>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl"
        >
          Segarkan Data
        </button>
      </div>

      {/* Table */}
      <div className="berry-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
            <tr>
              <th className="p-4">Nama Mesin / Peralatan</th>
              <th className="p-4">Stasiun Kerja</th>
              <th className="p-4">Kategori Kendala</th>
              <th className="p-4">Waktu Mulai</th>
              <th className="p-4 text-center">Durasi (Menit)</th>
              <th className="p-4 text-center">Unit Tertunda</th>
              <th className="p-4">Status &amp; Tindakan</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Memuat log downtime mesin...
                </td>
              </tr>
            ) : downtimes.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Semua mesin beroperasi 100% normal. Belum ada kendala dilaporkan.
                </td>
              </tr>
            ) : (
              downtimes.map((dt) => (
                <tr key={dt.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{dt.machine_name}</td>
                  <td className="p-4 text-slate-600">{dt.station?.name || 'Stasiun Kerja'}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[10px]">
                      {dt.reason_category}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 font-mono text-[11px]">
                    {new Date(dt.start_time).toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-center font-bold font-mono">
                    {dt.duration_minutes > 0 ? `${dt.duration_minutes} mnt` : <span className="text-rose-600 animate-pulse">BERJALAN</span>}
                  </td>
                  <td className="p-4 text-center font-mono font-bold text-slate-800">
                    {dt.impacted_qty} pcs
                  </td>
                  <td className="p-4 text-slate-600 text-[11px] max-w-[200px] truncate">
                    {dt.action_taken || <span className="text-amber-600 italic">Dalam penanganan tim teknis</span>}
                  </td>
                  <td className="p-4 text-right">
                    {!dt.end_time && (
                      <button
                        onClick={() => setResolveModalDT(dt)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Selesaikan
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Report Downtime */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Lapor Kendala &amp; Downtime Mesin Produksi
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportDowntime} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Stasiun Kerja *</label>
                <select
                  value={stationId}
                  onChange={(e) => setStationId(Number(e.target.value))}
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
                <label className="block font-bold text-slate-700 mb-1">Nama Mesin / Alat *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: CNC Router 3-Axis / Mesin Amplas Belt / Spray Gun #2"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Kendala</label>
                  <select
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  >
                    <option value="BREAKDOWN">Kerusakan Mesin (Breakdown)</option>
                    <option value="TOOLING_CHANGE">Ganti Mata Pisau / Setting</option>
                    <option value="POWER_OUTAGE">Gangguan Listrik / Genset</option>
                    <option value="MAINTENANCE">Perawatan Rutin</option>
                    <option value="MATERIAL_WAIT">Menunggu Bahan Baku</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimasi Unit Tertunda</label>
                  <input
                    type="number"
                    min={0}
                    value={impactedQty}
                    onChange={(e) => setImpactedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gejala &amp; Tindakan Awal</label>
                <textarea
                  rows={2}
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="Mata pisau patah / belt aus / bearing panas..."
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
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/25 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Laporkan Kendala'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Selesaikan Downtime */}
      {resolveModalDT && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-200">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Selesaikan Kendala Mesin: {resolveModalDT.machine_name}
            </h2>

            <form onSubmit={handleResolveDowntime} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Durasi Downtime (Menit) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center text-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tindakan Perbaikan yang Dilakukan</label>
                <textarea
                  rows={2}
                  required
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Penggantian bearing & pelumasan ulang selesai, uji beban normal..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolveModalDT(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/25"
                >
                  Tandai Mesin Normal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
