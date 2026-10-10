'use client';

import { useState, useEffect } from 'react';
import { apiFetch, ShopFloorLog, WorkOrder, WorkStation, getStoredUser, User } from '@/lib/api';
import { LifecycleStepper } from '@/components/LifecycleStepper';
import { PlayCircle, StopCircle, Clock, CheckCircle2, AlertCircle, Sparkles, UserCheck, Activity, Layers, Tablet, Plus, Minus } from 'lucide-react';

const SHOPFLOOR_LIFECYCLE_STEPS = [
  { id: 'READY', label: '1. Siap Shift', sublabel: 'Pilih Stasiun & Mesin' },
  { id: 'RUNNING', label: '2. Pengerjaan Unit', sublabel: 'Clock-In Aktif' },
  { id: 'REPORTING', label: '3. Lapor Output', sublabel: 'Hitung Good & Scrap' },
  { id: 'COMPLETED', label: '4. Akumulasi SPK', sublabel: 'Tercatat ke Database' },
];

export default function ShopFloorPage() {
  const [logs, setLogs] = useState<ShopFloorLog[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStationId, setActiveStationId] = useState<number>(0);

  // Clock In Form
  const [selectedWOSId, setSelectedWOSId] = useState<number>(0);
  const [machineName, setMachineName] = useState('CNC Router 3-Axis / Saw Table #1');
  const [clockInModal, setClockInModal] = useState(false);

  // Clock Out Form
  const [clockOutTargetLog, setClockOutTargetLog] = useState<ShopFloorLog | null>(null);
  const [goodQty, setGoodQty] = useState<number>(45);
  const [scrapQty, setScrapQty] = useState<number>(2);
  const [durationMinutes, setDurationMinutes] = useState<number>(180);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [lRes, wRes, sRes] = await Promise.all([
      apiFetch<any>('/enterprise/shopfloor/logs'),
      apiFetch<any>('/spk?limit=100'),
      apiFetch<any>('/stations'),
    ]);

    if (lRes.success && lRes.data) setLogs(lRes.data.logs || []);
    if (wRes.success && wRes.data) setWorkOrders(wRes.data.work_orders || []);
    if (sRes.success && sRes.data) setStations(sRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWOSId) {
      setError('Pilih stasiun SPK pengerjaan');
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await apiFetch('/enterprise/shopfloor/clock-in', {
      method: 'POST',
      body: JSON.stringify({
        work_order_station_id: Number(selectedWOSId),
        machine_name: machineName,
      }),
    });

    if (res.success) {
      setSuccess('Operator berhasil Clock-In shift kerja!');
      setClockInModal(false);
      loadData();
    } else {
      setError(res.message || 'Gagal Clock-In');
    }
    setSubmitting(false);
  };

  const handleClockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clockOutTargetLog) return;
    setSubmitting(true);

    const res = await apiFetch(`/enterprise/shopfloor/clock-out/${clockOutTargetLog.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        duration_minutes: Number(durationMinutes),
        good_qty_produced: Number(goodQty),
        scrap_qty_produced: Number(scrapQty),
      }),
    });

    if (res.success) {
      setSuccess('Hasil shift kerja berhasil disimpan dan diakumulasikan ke SPK!');
      setClockOutTargetLog(null);
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
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
            Shop Floor Live Operator Kiosk (Shopfloor Execution)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standar Katana &amp; MRPeasy: Antarmuka tablet operator lantai pabrik untuk Clock-In/Out waktu pengerjaan nyata &amp; input unit jadi.
          </p>
        </div>
        <button
          onClick={() => setClockInModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all cursor-pointer shrink-0"
        >
          <PlayCircle className="w-4 h-4" />
          Clock-In Shift Baru
        </button>
      </div>

      {/* Katana MRP Shopfloor Live Stepper */}
      <div className="berry-card p-4 bg-slate-50/70 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Tablet className="w-3.5 h-3.5 text-emerald-600" />
            Alur Kerja Tablet Operator (Shopfloor Lifecycle):
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Mode Ramah Sentuh (Tablet Kiosk)</span>
        </div>
        <LifecycleStepper
          steps={SHOPFLOOR_LIFECYCLE_STEPS}
          currentStepId={logs.some((l) => l.status === 'RUNNING') ? 'RUNNING' : 'READY'}
        />
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

      {/* Active Running Operators Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {logs.filter((l) => l.status === 'RUNNING').map((l) => (
          <div key={l.id} className="berry-card p-4 space-y-2 border-l-4 border-l-emerald-500 bg-emerald-50/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900">{l.operator_user?.name || 'Operator'}</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold animate-pulse">
                SEDANG BEKERJA
              </span>
            </div>
            <div className="text-xs text-slate-600">
              <div>Mesin: <b>{l.machine_name || 'Manual Bench'}</b></div>
              <div className="text-[11px] text-slate-500 font-mono">Mulai: {new Date(l.clock_in_time).toLocaleTimeString('id-ID')}</div>
            </div>
            <button
              onClick={() => {
                setClockOutTargetLog(l);
                setGoodQty(30);
                setScrapQty(1);
              }}
              className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <StopCircle className="w-3.5 h-3.5" />
              Clock-Out Selesai
            </button>
          </div>
        ))}
      </div>

      {/* Logs History Table */}
      <div className="berry-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
            <tr>
              <th className="p-4">Operator</th>
              <th className="p-4">Stasiun Kerja / Mesin</th>
              <th className="p-4">Waktu Mulai - Selesai</th>
              <th className="p-4 text-center">Durasi Nyata</th>
              <th className="p-4 text-center">Output Lolos (Good)</th>
              <th className="p-4 text-center">Scrap / Cacat</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Memuat data log shopfloor...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Belum ada log shift kerja operator.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{log.operator_user?.name || 'Staff'}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{log.machine_name || 'Stasiun Kerja'}</div>
                  </td>
                  <td className="p-4 font-mono text-[11px] text-slate-600">
                    {new Date(log.clock_in_time).toLocaleTimeString('id-ID')} -{' '}
                    {log.clock_out_time ? new Date(log.clock_out_time).toLocaleTimeString('id-ID') : 'Berjalan'}
                  </td>
                  <td className="p-4 text-center font-bold font-mono">
                    {log.duration_minutes > 0 ? `${log.duration_minutes} mnt` : '-'}
                  </td>
                  <td className="p-4 text-center font-bold text-emerald-700 font-mono">
                    {log.good_qty_produced} pcs
                  </td>
                  <td className="p-4 text-center font-bold text-rose-600 font-mono">
                    {log.scrap_qty_produced} pcs
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        log.status === 'COMPLETED'
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Clock In */}
      {clockInModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-200">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-emerald-600" />
              Clock-In Shift Kerja Operator
            </h2>

            <form onSubmit={handleClockIn} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih SPK &amp; Stasiun Kerja *</label>
                <select
                  required
                  value={selectedWOSId}
                  onChange={(e) => setSelectedWOSId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                >
                  <option value="0">-- Pilih SPK --</option>
                  {workOrders.map((wo) =>
                    wo.stations?.map((st) => (
                      <option key={st.id} value={st.id}>
                        {wo.spk_number} - {wo.product?.product_name} ({st.station?.name})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mesin / Posisi Pengerjaan</label>
                <input
                  type="text"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClockInModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/25"
                >
                  Mulai Bekerja (Clock-In)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Clock Out */}
      {clockOutTargetLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-200">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <StopCircle className="w-5 h-5 text-rose-600" />
              Clock-Out &amp; Input Hasil Shift
            </h2>

            <form onSubmit={handleClockOut} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Durasi Kerja Shift (Menit) *</label>
                <input
                  type="number"
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-emerald-700">Output Lolos (pcs)</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setGoodQty(Math.max(0, goodQty - 1))}
                        className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoodQty(goodQty + 1)}
                        className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[10px] font-bold"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoodQty(goodQty + 10)}
                        className="px-1.5 py-0.5 bg-emerald-200 hover:bg-emerald-300 text-emerald-900 rounded text-[10px] font-bold"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={goodQty}
                    onChange={(e) => setGoodQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center text-sm font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-rose-700">Cacat / Scrap</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setScrapQty(Math.max(0, scrapQty - 1))}
                        className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => setScrapQty(scrapQty + 1)}
                        className="px-1.5 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded text-[10px] font-bold"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => setScrapQty(scrapQty + 5)}
                        className="px-1.5 py-0.5 bg-rose-200 hover:bg-rose-300 text-rose-900 rounded text-[10px] font-bold"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={scrapQty}
                    onChange={(e) => setScrapQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClockOutTargetLog(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/25"
                >
                  Simpan &amp; Clock-Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
