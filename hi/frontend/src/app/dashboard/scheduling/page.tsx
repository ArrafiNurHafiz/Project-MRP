'use client';

import { useState, useEffect } from 'react';
import { apiFetch, WorkOrder, WorkStation } from '@/lib/api';
import {
  CalendarDays,
  Kanban,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Search,
  Filter,
} from 'lucide-react';

export default function ProductionSchedulingPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'gantt' | 'kanban'>('gantt');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [woRes, stRes] = await Promise.all([
      apiFetch<any>('/spk?limit=100'),
      apiFetch<any>('/stations'),
    ]);

    if (woRes.success && woRes.data) setWorkOrders(woRes.data.work_orders || []);
    if (stRes.success && stRes.data) setStations(stRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredWOs = workOrders.filter(
    (wo) =>
      wo.spk_number.toLowerCase().includes(search.toLowerCase()) ||
      (wo.product?.product_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const KANBAN_COLUMNS = [
    { id: 'draft', title: 'Draf SPK', bg: 'bg-slate-50', border: 'border-slate-200' },
    { id: 'ready', title: 'Siap Produksi', bg: 'bg-blue-50/50', border: 'border-blue-200' },
    { id: 'in_progress', title: 'Sedang Berjalan (MES)', bg: 'bg-amber-50/50', border: 'border-amber-200' },
    { id: 'completed', title: 'Selesai & Put-Away', bg: 'bg-emerald-50/50', border: 'border-emerald-200' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
              <CalendarDays className="w-5 h-5" />
            </div>
            Visual Production Scheduling &amp; Capacity
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penjadwalan interaktif visual lini produksi ala Katana MRP: timeline stasiun kerja (Gantt Chart) dan alur kartu SPK (Kanban Board).
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('gantt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'gantt' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Gantt Timeline
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'kanban' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Kanban className="w-4 h-4" />
            Kanban Board
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="berry-card p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor SPK, nama produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Selesai
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Sedang Berjalan
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Draf / Terjadwal
          </span>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'gantt' ? (
        <div className="berry-card p-6 space-y-6 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-600" />
              Timeline Pemanfaatan Stasiun Kerja Pabrik
            </h2>
            <span className="text-xs text-slate-400">Total {stations.length} Stasiun Kerja</span>
          </div>

          <div className="space-y-4">
            {stations.map((st) => {
              // Find work orders assigned to this station
              const assignedWOs = filteredWOs.filter((wo) =>
                wo.stations?.some((wos) => wos.station_id === st.id)
              );

              return (
                <div key={st.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-100 text-violet-800">
                        {st.station_code}
                      </span>
                      <span className="font-bold text-xs text-slate-800">{st.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Beban: {assignedWOs.length} SPK Antrean
                    </span>
                  </div>

                  {/* Gantt Bar Lane */}
                  <div className="relative h-12 bg-white rounded-lg border border-slate-200/60 p-1.5 flex items-center gap-2 overflow-x-auto">
                    {assignedWOs.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic px-2">Tidak ada pengerjaan aktif</span>
                    ) : (
                      assignedWOs.map((wo) => (
                        <div
                          key={wo.id}
                          className={`h-full min-w-[200px] px-3 py-1 rounded-md text-[11px] flex flex-col justify-center border shadow-xs transition-all ${
                            wo.status === 'completed'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : wo.status === 'in_progress'
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : 'bg-blue-50 border-blue-200 text-blue-900'
                          }`}
                        >
                          <span className="font-mono font-bold truncate">{wo.spk_number}</span>
                          <span className="text-[10px] text-slate-500 truncate">
                            {wo.product?.product_name || `Produk #${wo.product_id}`} ({wo.total_target_qty} pcs)
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map((col) => {
            const colWOs = filteredWOs.filter((wo) => {
              if (col.id === 'draft') return wo.status === 'draft' && !wo.start_date;
              if (col.id === 'ready') return wo.status === 'draft' && Boolean(wo.start_date);
              if (col.id === 'in_progress') return wo.status === 'in_progress';
              if (col.id === 'completed') return wo.status === 'completed';
              return false;
            });

            return (
              <div key={col.id} className={`p-4 rounded-2xl border ${col.border} ${col.bg} flex flex-col min-h-[500px]`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
                  <h3 className="text-xs font-bold text-slate-800">{col.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-600 shadow-xs">
                    {colWOs.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colWOs.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-slate-400 text-xs italic">
                      Kosong
                    </div>
                  ) : (
                    colWOs.map((wo) => (
                      <div
                        key={wo.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-violet-700">{wo.spk_number}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            wo.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {wo.priority}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 leading-tight">
                          {wo.product?.product_name || `Produk #${wo.product_id}`}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>Target: {wo.total_target_qty} unit</span>
                          <span>{wo.deadline_date ? new Date(wo.deadline_date).toLocaleDateString('id-ID') : '-'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
