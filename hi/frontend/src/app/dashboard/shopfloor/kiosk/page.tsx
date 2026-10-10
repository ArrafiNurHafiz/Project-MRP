'use client';

import { useState, useEffect } from 'react';
import { apiFetch, WorkOrder, WorkStation, ShopFloorLog } from '@/lib/api';
import {
  Tablet,
  ScanLine,
  Play,
  Square,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Clock,
  Gauge,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function ShopFloorKioskPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [activeLogs, setActiveLogs] = useState<ShopFloorLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Kiosk Input
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedStationId, setSelectedStationId] = useState<number>(0);
  const [selectedWOSId, setSelectedWOSId] = useState<number>(0);
  const [selectedMachine, setSelectedMachine] = useState('Mesin Gergaji Saw Table #1');
  const [activeSession, setActiveSession] = useState<ShopFloorLog | null>(null);

  // Output reporting counters
  const [goodQty, setGoodQty] = useState(1);
  const [scrapQty, setScrapQty] = useState(0);
  const [scrapReason, setScrapReason] = useState('CACAT_POTONG_KAYU');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [woRes, stRes, lRes] = await Promise.all([
      apiFetch<any>('/spk?status=in_progress&limit=50'),
      apiFetch<any>('/stations'),
      apiFetch<any>('/enterprise/shopfloor/logs'),
    ]);

    if (woRes.success && woRes.data) setWorkOrders(woRes.data.work_orders || []);
    if (stRes.success && stRes.data) setStations(stRes.data || []);
    if (lRes.success && lRes.data) {
      const all = (lRes.data.logs || []) as ShopFloorLog[];
      setActiveLogs(all.filter((l) => l.status === 'RUNNING'));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    const found = workOrders.find((w) => w.spk_number.toLowerCase() === barcodeInput.trim().toLowerCase());
    if (found) {
      if (found.stations && found.stations.length > 0) {
        setSelectedWOSId(found.stations[0].id);
        setSelectedStationId(found.stations[0].station_id);
      }
      setMessage({ text: `SPK Terdeteksi: ${found.spk_number} - ${found.product?.product_name}`, type: 'success' });
    } else {
      setMessage({ text: `SPK dengan barcode ${barcodeInput} tidak ditemukan`, type: 'error' });
    }
  };

  const handleStartWork = async () => {
    if (!selectedWOSId) {
      setMessage({ text: 'Pilih stasiun SPK sebelum memulai!', type: 'error' });
      return;
    }
    setSubmitting(true);
    const res = await apiFetch<any>('/enterprise/shopfloor/clock-in', {
      method: 'POST',
      body: JSON.stringify({
        work_order_station_id: Number(selectedWOSId),
        machine_name: selectedMachine,
      }),
    });

    if (res.success && res.data) {
      setActiveSession(res.data);
      setMessage({ text: 'Timer pengerjaan dimulai! Selamat bekerja.', type: 'success' });
      loadData();
    } else {
      setMessage({ text: res.message || 'Gagal memulai shift kerja', type: 'error' });
    }
    setSubmitting(false);
  };

  const handleFinishWork = async () => {
    if (!activeSession) return;
    setSubmitting(true);
    const res = await apiFetch<any>(`/enterprise/shopfloor/clock-out/${activeSession.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        good_qty_produced: Number(goodQty),
        scrap_qty_produced: Number(scrapQty),
        duration_minutes: 60,
      }),
    });

    if (res.success) {
      setMessage({ text: `Shift kerja selesai! Output tercatat: ${goodQty} Good, ${scrapQty} Scrap`, type: 'success' });
      setActiveSession(null);
      setGoodQty(1);
      setScrapQty(0);
      loadData();
    } else {
      setMessage({ text: res.message || 'Gagal menyelesaikan shift', type: 'error' });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-6 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/shopfloor"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-lg font-black tracking-wide uppercase">Shop Floor Operator Tablet Kiosk</h1>
            </div>
            <p className="text-xs text-slate-400">Mode Sentuh Khusus Operator Stasiun Produksi Pabrik</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 font-bold flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            MES ONLINE
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between my-4 ${
          message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Touch Kiosk Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-auto py-4">
        {/* Left Column: Barcode & Selection */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              1. Scan Barcode SPK / Input Manual
            </label>
            <form onSubmit={handleBarcodeScan} className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Arahkan scanner ke Barcode / SPK-..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm font-mono rounded-2xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30"
              >
                Cari
              </button>
            </form>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              2. Pilih Stasiun Kerja &amp; Mesin
            </label>
            <div className="grid grid-cols-2 gap-2">
              {stations.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStationId(st.id)}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                    selectedStationId === st.id
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-mono text-[10px] text-slate-500">{st.station_code}</div>
                  <div className="truncate">{st.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              3. Pilih SPK Aktif
            </label>
            <select
              value={selectedWOSId}
              onChange={(e) => setSelectedWOSId(Number(e.target.value))}
              className="w-full text-xs p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none font-mono"
            >
              <option value={0}>-- Pilih SPK dari Antrean Produksi --</option>
              {workOrders.map((wo) => (
                <option key={wo.id} value={wo.stations?.[0]?.id || wo.id}>
                  {wo.spk_number} - {wo.product?.product_name} ({wo.total_target_qty} unit)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column: Timer & Touch Counters */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 flex flex-col justify-between space-y-6">
          <div className="text-center py-4 bg-slate-900/60 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Status Operator</span>
            <div className="text-2xl font-black mt-1 text-emerald-400 flex items-center justify-center gap-2">
              <Clock className="w-6 h-6 animate-spin" />
              {activeSession ? 'SEDANG MENGERJAKAN UNIT' : 'STANDBY (SIAP KERJA)'}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">Mesin: {selectedMachine}</p>
          </div>

          {/* Big Touch Buttons for Good & Scrap */}
          <div className="grid grid-cols-2 gap-4">
            {/* Good Qty */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 text-center space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Unit Bagus (Good)
              </span>
              <div className="text-4xl font-black font-mono text-white">{goodQty}</div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGoodQty(Math.max(1, goodQty - 1))}
                  className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-lg font-bold flex items-center justify-center text-slate-300"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setGoodQty(goodQty + 1)}
                  className="w-12 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-lg font-bold flex items-center justify-center text-white"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setGoodQty(goodQty + 10)}
                  className="px-3 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400"
                >
                  +10
                </button>
              </div>
            </div>

            {/* Scrap Qty */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 text-center space-y-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                Cacat / Rusak (Scrap)
              </span>
              <div className="text-4xl font-black font-mono text-white">{scrapQty}</div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScrapQty(Math.max(0, scrapQty - 1))}
                  className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-lg font-bold flex items-center justify-center text-slate-300"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setScrapQty(scrapQty + 1)}
                  className="w-12 h-12 rounded-xl bg-rose-600 hover:bg-rose-500 text-lg font-bold flex items-center justify-center text-white"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setScrapQty(scrapQty + 5)}
                  className="px-3 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-rose-400"
                >
                  +5
                </button>
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-2">
            {!activeSession ? (
              <button
                type="button"
                disabled={submitting}
                onClick={handleStartWork}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                Mulai Pengerjaan (Start Timer)
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinishWork}
                className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-rose-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer"
              >
                <Square className="w-5 h-5 fill-current" />
                Selesai Shift &amp; Lapor Output Unit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>Kiosk ID: KIOSK-SHOPFLOOR-01</span>
        <span>Aplikasi Manufaktur Kayu KWAS &bull; EMTKu Modern MRP</span>
      </div>
    </div>
  );
}
