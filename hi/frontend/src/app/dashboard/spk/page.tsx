'use client';

import { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  User,
  Shield,
  ArrowRight,
  Flame,
  X,
  Sparkles,
  ClipboardCheck,
  Building,
  UserCheck,
  PlayCircle,
  PackageCheck,
  Calendar,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  apiFetch,
  WorkOrder,
  Product,
  User as UserType,
  getStoredUser,
  hasPermission,
  isSuperuser,
  hasRole,
  processWorkOrder,
  autoAllocateWorkOrderBatches,
  createShortagePO,
} from '@/lib/api';
import { LifecycleStepper } from '@/components/LifecycleStepper';
import { MaterialAllocationPill } from '@/components/MaterialAllocationPill';
import Link from 'next/link';

const SPK_LIFECYCLE_STEPS = [
  { id: 'draft', label: 'Draf SPK', sublabel: 'Penjadwalan' },
  { id: 'in_progress', label: 'Produksi', sublabel: 'Alokasi & Stasiun' },
  { id: 'completed', label: 'Selesai', sublabel: 'QC & Produk Jadi' },
];

export default function SPKPage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'normal'>('all');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [targetQty, setTargetQty] = useState<number>(200);
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [deadlineDays, setDeadlineDays] = useState<number>(5);
  const [submittingSPK, setSubmittingSPK] = useState(false);

  // Ready To Process Modal
  const [processModalWO, setProcessModalWO] = useState<WorkOrder | null>(null);
  const [processStartDate, setProcessStartDate] = useState<string>('');
  const [processDeadlineDate, setProcessDeadlineDate] = useState<string>('');
  const [submittingProcess, setSubmittingProcess] = useState(false);

  // Assign Worker Modal
  const [assignModalWOS, setAssignModalWOS] = useState<any | null>(null);
  const [assignedType, setAssignedType] = useState<'internal' | 'mitra'>('internal');
  const [assignedUserId, setAssignedUserId] = useState<number | undefined>(undefined);
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Progress Report Modal
  const [reportModalWOS, setReportModalWOS] = useState<any | null>(null);
  const [reportPassQty, setReportPassQty] = useState<number>(50);
  const [reportRejQty, setReportRejQty] = useState<number>(0);
  const [reportNotes, setReportNotes] = useState<string>('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const canCreateSPK = isSuperuser(currentUser) || hasRole(currentUser, 'PPIC') || hasPermission(currentUser, 'kelola spk');
  const canAssignWorker = isSuperuser(currentUser) || hasRole(currentUser, 'PPIC') || hasRole(currentUser, 'Mandor') || hasPermission(currentUser, 'kelola spk');
  const canReportProgress = isSuperuser(currentUser) || hasRole(currentUser, 'Operator') || hasRole(currentUser, 'Mitra') || hasRole(currentUser, 'Mandor') || hasPermission(currentUser, 'verifikasi laporan produksi') || hasPermission(currentUser, 'kelola spk');

  const fetchSPKs = async () => {
    try {
      const res = await apiFetch<{ work_orders: WorkOrder[]; total: number }>(
        `/spk?search=${encodeURIComponent(search)}`
      );
      if (res.success && res.data) {
        setWorkOrders(res.data.work_orders || []);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchMeta = async () => {
    try {
      const prodRes = await apiFetch<{ products: Product[] }>('/products?limit=100');
      if (prodRes.success && prodRes.data) setProducts(prodRes.data.products || []);

      const userRes = await apiFetch<{ users: UserType[] }>('/users?limit=100');
      if (userRes.success && userRes.data) setUsers(userRes.data.users || []);
    } catch (err) {
      // Ignored for non-admin roles
    }
  };

  useEffect(() => {
    Promise.all([fetchSPKs(), fetchMeta()]).finally(() => setLoading(false));
  }, [search]);

  const handleCreateSPK = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setSubmittingSPK(true);
    setError(null);

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + Number(deadlineDays));

    try {
      const res = await apiFetch('/spk', {
        method: 'POST',
        body: JSON.stringify({
          product_id: Number(selectedProductId),
          total_target_qty: Number(targetQty),
          priority: priority,
          deadline_date: deadline.toISOString(),
        }),
      });

      if (!res.success) {
        setError(res.message || 'Gagal menerbitkan SPK');
        setSubmittingSPK(false);
        return;
      }

      setSuccess(`SPK baru berhasil diterbitkan dengan 5 alur stasiun routing otomatis!`);
      setShowCreateModal(false);
      fetchSPKs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingSPK(false);
    }
  };

  const handleOpenProcessModal = (wo: WorkOrder) => {
    setProcessModalWO(wo);
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
    setProcessStartDate(today);
    setProcessDeadlineDate(nextWeek);
  };

  const handleProcessWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processModalWO) return;
    setSubmittingProcess(true);
    setError(null);

    try {
      const res = await processWorkOrder(processModalWO.id, {
        start_date: new Date(processStartDate).toISOString(),
        deadline_date: new Date(processDeadlineDate).toISOString(),
      });

      if (!res.success) {
        setError(res.message || 'Gagal memproses SPK');
        setSubmittingProcess(false);
        return;
      }

      setSuccess(`Perintah Kerja ${processModalWO.spk_number} SIAP DIPROSES! Permintaan Material Gudang telah OTOMATIS DITERBITKAN.`);
      setProcessModalWO(null);
      fetchSPKs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingProcess(false);
    }
  };

  const handleOpenAssign = (wos: any) => {
    setAssignModalWOS(wos);
    setAssignedType(wos.assigned_type || 'internal');
    setAssignedUserId(wos.assigned_user_id || undefined);
    setError(null);
  };

  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalWOS) return;
    setSubmittingAssign(true);
    setError(null);

    try {
      const res = await apiFetch(`/spk/stations/${assignModalWOS.id}/assign`, {
        method: 'PUT',
        body: JSON.stringify({
          assigned_type: assignedType,
          assigned_user_id: assignedUserId ? Number(assignedUserId) : null,
        }),
      });

      if (!res.success) {
        setError(res.message || 'Gagal memperbarui penugasan');
        setSubmittingAssign(false);
        return;
      }

      setSuccess('Penugasan stasiun berhasil diperbarui!');
      setAssignModalWOS(null);
      fetchSPKs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleOpenReport = (wos: any) => {
    setReportModalWOS(wos);
    setReportPassQty(50);
    setReportRejQty(0);
    setReportNotes('');
    setError(null);
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalWOS) return;
    setSubmittingReport(true);
    setError(null);

    try {
      const res = await apiFetch(`/spk/stations/${reportModalWOS.id}/progress`, {
        method: 'POST',
        body: JSON.stringify({
          log_type: 'progress_report',
          reported_qty_pass: Number(reportPassQty),
          reported_qty_reject: Number(reportRejQty),
          notes: reportNotes,
          channel: 'web',
        }),
      });

      if (!res.success) {
        setError(res.message || 'Gagal menyimpan laporan progres');
        setSubmittingReport(false);
        return;
      }

      setSuccess('Laporan progres pengerjaan stasiun berhasil dicatat!');
      setReportModalWOS(null);
      fetchSPKs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  const getStationStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 animate-pulse';
      case 'qc_wait':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getKanbanStage = (wo: WorkOrder) => {
    if (wo.status === 'draft') return 'draft';
    if (wo.status === 'completed') return 'completed';
    if (wo.status === 'cancelled') return 'cancelled';
    const stations = wo.stations || [];
    if (stations.some((s) => s.status === 'qc_wait')) return 'qc';
    if (stations.some((s) => s.status === 'in_progress')) return 'in_progress';
    return 'ready';
  };

  const getProgressPercentage = (wo: WorkOrder) => {
    if (wo.status === 'completed') return 100;
    const stations = wo.stations || [];
    if (stations.length === 0) return 0;
    const completedCount = stations.filter((s) => s.status === 'completed').length;
    const inProgressCount = stations.filter((s) => s.status === 'in_progress' || s.status === 'qc_wait').length;
    return Math.min(100, Math.round(((completedCount + inProgressCount * 0.5) / stations.length) * 100));
  };

  const filteredWorkOrders = workOrders.filter((wo) => {
    if (priorityFilter !== 'all' && wo.priority !== priorityFilter) return false;
    return true;
  });

  const kanbanColumns = [
    { id: 'draft', title: '1. Draf & Antrean', color: 'border-slate-300 bg-slate-50/50 text-slate-700', badge: 'bg-slate-200 text-slate-700' },
    { id: 'ready', title: '2. Terjadwal / Siap', color: 'border-blue-300 bg-blue-50/40 text-blue-800', badge: 'bg-blue-100 text-blue-800' },
    { id: 'in_progress', title: '3. Sedang Produksi', color: 'border-indigo-300 bg-indigo-50/40 text-indigo-800', badge: 'bg-indigo-100 text-indigo-800' },
    { id: 'qc', title: '4. Quality Control', color: 'border-amber-300 bg-amber-50/40 text-amber-800', badge: 'bg-amber-100 text-amber-800' },
    { id: 'completed', title: '5. Selesai (FG)', color: 'border-emerald-300 bg-emerald-50/40 text-emerald-800', badge: 'bg-emerald-100 text-emerald-800' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
            Perintah Kerja Produksi (SPK 5 Stasiun Kerja)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Alur Manufaktur: Klik Detail ➔ Siap Proses (Input Tgl Mulai &amp; Selesai) ➔ Terbit SPK Produksi ➔ Otomatis Terbit Permintaan Material Gudang
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/material-requests"
            className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
          >
            <PackageCheck className="w-4 h-4" />
            Permintaan Material
          </Link>
          {canCreateSPK && (
            <button
              onClick={() => {
                if (products.length > 0 && !selectedProductId) {
                  setSelectedProductId(products[0].id);
                }
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Terbitkan SPK Manual
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
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

      {/* Search & View Controls Bar */}
      <div className="berry-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Nomor SPK (misal: SPK-2026-09-0012) atau nama produk..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Semua Prioritas</option>
            <option value="normal">Prioritas Normal</option>
            <option value="urgent">Prioritas Urgent 🔥</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Tabel Detail
            </button>
          </div>
        </div>
      </div>

      {/* SPK View (Kanban vs Detailed Pipeline Table) */}
      <div>
        {loading ? (
          <div className="py-12 text-center text-slate-400 berry-card">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Memuat data SPK...
          </div>
        ) : filteredWorkOrders.length === 0 ? (
          <div className="berry-card p-12 text-center text-slate-400 rounded-2xl">
            Belum ada SPK terbit sesuai filter. Terbitkan pesanan dari menu Pesanan atau klik &quot;Terbitkan SPK Manual&quot;.
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {kanbanColumns.map((col) => {
              const colItems = filteredWorkOrders.filter((wo) => getKanbanStage(wo) === col.id);
              return (
                <div
                  key={col.id}
                  className="flex flex-col bg-slate-50/70 rounded-2xl border border-slate-200 p-3 min-w-[260px] space-y-3"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 px-1">
                    <span className="text-xs font-extrabold text-slate-800 tracking-tight">{col.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${col.badge}`}>
                      {colItems.length}
                    </span>
                  </div>

                  {/* Cards List */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-0.5">
                    {colItems.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white/40">
                        Kosong
                      </div>
                    ) : (
                      colItems.map((wo) => {
                        const progress = getProgressPercentage(wo);
                        const activeStation = wo.stations?.find((s) => s.status === 'in_progress' || s.status === 'qc_wait') || wo.stations?.[0];
                        return (
                          <div
                            key={wo.id}
                            className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all"
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div>
                                <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block mb-1">
                                  {wo.spk_number}
                                </span>
                                <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">{wo.product?.product_name}</h4>
                                <p className="text-[10px] text-slate-400 font-mono">[{wo.product?.product_code}]</p>
                              </div>
                              {wo.priority === 'urgent' && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-extrabold shrink-0 animate-pulse">
                                  <Flame className="w-3 h-3 text-rose-600" />
                                  URGENT
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                              <div>
                                <span className="text-slate-400 block text-[9px]">Target:</span>
                                <b className="text-slate-800 font-mono">{wo.total_target_qty} pcs</b>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px]">Deadline:</span>
                                <span className="font-medium text-slate-700 truncate block">
                                  {wo.deadline_date ? new Date(wo.deadline_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                                </span>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-slate-500 font-medium">Progres Fisik</span>
                                <span className="font-bold text-indigo-700">{progress}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    progress === 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-indigo-600' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>

                            {/* Katana Material Allocation Pill */}
                            <div className="pt-1">
                              <MaterialAllocationPill
                                compact={true}
                                status={
                                  wo.status === 'completed'
                                    ? 'IN_STOCK'
                                    : wo.status === 'in_progress'
                                    ? 'IN_STOCK'
                                    : 'EXPECTED'
                                }
                              />
                            </div>

                            {/* Active Station */}
                            {activeStation && (
                              <div className="text-[10px] flex items-center justify-between text-slate-500 border-t border-slate-100 pt-2">
                                <span className="truncate max-w-[120px]">
                                  Pos: <b className="text-slate-700">{activeStation.station?.name || `Stasiun ${activeStation.sequence_order}`}</b>
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getStationStatusBadge(activeStation.status)}`}>
                                  {activeStation.status}
                                </span>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                              {wo.status === 'draft' && (
                                <button
                                  onClick={() => handleOpenProcessModal(wo)}
                                  className="w-full flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-colors cursor-pointer"
                                >
                                  <PlayCircle className="w-3.5 h-3.5" /> Siap Proses
                                </button>
                              )}
                              {wo.status === 'in_progress' && (
                                <>
                                  <button
                                    onClick={async () => {
                                      const res = await apiFetch<any>(`/work-orders/${wo.id}/auto-allocate`, { method: 'POST' });
                                      if (res.success) {
                                        alert(`FIFO Selesai! Terpenuhi: ${res.data?.all_fulfilled ? 'YA (100%)' : 'ADA DEFISIT'}`);
                                        fetchSPKs();
                                      } else {
                                        alert(res.error?.message || 'Gagal');
                                      }
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1 py-1 px-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                    title="Alokasi Bahan FIFO"
                                  >
                                    <Sparkles className="w-3 h-3" /> Auto FIFO
                                  </button>
                                  <button
                                    onClick={() => setViewMode('table')}
                                    className="flex-1 flex items-center justify-center gap-1 py-1 px-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    Detail &rarr;
                                  </button>
                                </>
                              )}
                              {wo.status === 'completed' && (
                                <div className="w-full py-1 text-center text-emerald-700 bg-emerald-50 rounded text-[10px] font-bold border border-emerald-200 flex items-center justify-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai Masuk FG
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-5">
            {filteredWorkOrders.map((wo) => (
            <div
              key={wo.id}
              className="berry-card p-6 space-y-5 hover:border-indigo-300 transition-all"
            >
              {/* SPK Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                      {wo.spk_number}
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900">{wo.product?.product_name}</h2>
                    <span className="text-[11px] font-mono text-slate-400">[{wo.product?.product_code}]</span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span>
                      Target: <b className="text-slate-800">{wo.total_target_qty} pcs</b>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      Mulai - Selesai:{' '}
                      {wo.start_date ? new Date(wo.start_date).toLocaleDateString('id-ID') : 'Draft'}{' '}
                      s.d.{' '}
                      {wo.deadline_date ? new Date(wo.deadline_date).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {wo.status === 'draft' && (
                    <button
                      onClick={() => handleOpenProcessModal(wo)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer animate-pulse"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Siap Proses (Eksekusi)
                    </button>
                  )}
                  {wo.status === 'in_progress' && (
                    <>
                      <button
                        onClick={async () => {
                          const res = await apiFetch<any>(`/work-orders/${wo.id}/auto-allocate`, { method: 'POST' });
                          if (res.success) {
                            alert(`Alokasi Otomatis FIFO Selesai! Terpenuhi: ${res.data?.all_fulfilled ? 'YA (100%)' : 'ADA DEFISIT MATERIAL'}`);
                            fetchSPKs();
                          } else {
                            alert(res.error?.message || 'Gagal auto-allocate');
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all"
                        title="Auto-Allocate Stok Material Gudang berdasarkan Batch FIFO"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Auto-Allocate FIFO
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Terbitkan Purchase Order otomatis untuk menutupi seluruh kekurangan bahan baku SPK ini?')) return;
                          const res = await apiFetch<any>(`/work-orders/${wo.id}/create-shortage-po`, { method: 'POST' });
                          if (res.success) {
                            alert(`Purchase Order berhasil diterbitkan: ${res.data?.po_number || 'PO Baru'}`);
                          } else {
                            alert(res.error?.message || 'Gagal membuat PO shortage');
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all"
                        title="Terbitkan 1-Klik PO Pengadaan untuk Defisit Bahan"
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> 1-Click PO Shortage
                      </button>
                    </>
                  )}
                  {wo.priority === 'urgent' && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-extrabold animate-pulse">
                      <Flame className="w-3.5 h-3.5" />
                      URGENT
                    </span>
                  )}
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-md font-extrabold uppercase ${
                      wo.status === 'in_progress'
                        ? 'bg-purple-100 text-purple-800'
                        : wo.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {wo.status}
                  </span>
                </div>
              </div>

              {/* Katana MRP Visual Lifecycle Stepper */}
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                  Tahapan Siklus SPK (Katana Lifecycle):
                </span>
                <LifecycleStepper
                  steps={SPK_LIFECYCLE_STEPS}
                  currentStepId={wo.status}
                />
              </div>

              {/* Katana MRP Visual Material Allocation Bar */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Status Alokasi Bahan Baku Gudang:
                  </span>
                  <span className="text-xs text-slate-600">
                    Auto-alokasi batch FIFO &amp; pemenuhan bahan baku sebelum stasiun mulai
                  </span>
                </div>
                <MaterialAllocationPill
                  status={
                    wo.status === 'completed'
                      ? 'IN_STOCK'
                      : wo.status === 'in_progress'
                      ? 'IN_STOCK'
                      : 'EXPECTED'
                  }
                  onAutoAllocate={
                    wo.status === 'in_progress'
                      ? async () => {
                          const res = await autoAllocateWorkOrderBatches(wo.id);
                          if (res.success) {
                            alert(`Alokasi Otomatis FIFO Selesai! Terpenuhi: ${res.data?.all_fulfilled ? 'YA (100%)' : 'ADA DEFISIT MATERIAL'}`);
                            fetchSPKs();
                          } else {
                            alert(res.message || 'Gagal auto-allocate');
                          }
                        }
                      : undefined
                  }
                  onCreateShortagePO={
                    wo.status === 'in_progress'
                      ? async () => {
                          if (!confirm('Terbitkan Purchase Order otomatis untuk menutupi seluruh kekurangan bahan baku SPK ini?')) return;
                          const res = await createShortagePO(wo.id);
                          if (res.success) {
                            alert(`Purchase Order berhasil diterbitkan: ${res.data?.po_number || 'PO Baru'}`);
                          } else {
                            alert(res.message || 'Gagal membuat PO shortage');
                          }
                        }
                      : undefined
                  }
                />
              </div>

              {/* 5 Work Stations Pipeline */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                {wo.stations?.map((wos, idx) => {
                  const isExternal = wos.assigned_type === 'mitra';
                  return (
                    <div
                      key={wos.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3 relative hover:bg-slate-100/60 transition-colors"
                    >
                      <div>
                        {/* Station Name & Status */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-extrabold text-slate-700">
                            {idx + 1}. {wos.station?.name}
                          </span>
                        </div>

                        <div className="mb-2">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase ${getStationStatusBadge(
                              wos.status
                            )}`}
                          >
                            {wos.status}
                          </span>
                        </div>

                        {/* Progress metrics */}
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between text-slate-700">
                            <span>Selesai (Pass):</span>
                            <b className="text-emerald-700 font-mono font-bold">{wos.completed_qty} pcs</b>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Cacat (Reject):</span>
                            <b className="text-rose-600 font-mono font-bold">{wos.reject_qty} pcs</b>
                          </div>
                          <div className="flex justify-between text-slate-400 text-[10px]">
                            <span>Input:</span>
                            <span className="font-mono">{wos.input_qty} pcs</span>
                          </div>
                        </div>

                        {/* Assigned Worker */}
                        <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                          <div className="flex items-center gap-1 font-bold text-slate-700 mb-0.5">
                            {isExternal ? (
                              <Building className="w-3 h-3 text-amber-600" />
                            ) : (
                              <User className="w-3 h-3 text-indigo-600" />
                            )}
                            <span>{isExternal ? 'Mitra Borongan' : 'In-House Pabrik'}</span>
                          </div>
                          <div className="truncate text-slate-800 font-medium">
                            {wos.assigned_user?.name || (
                              <span className="italic text-slate-400">Belum ditugaskan</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {(canAssignWorker || canReportProgress) && (
                        <div className="pt-2 border-t border-slate-200 flex gap-1.5">
                          {canAssignWorker && (
                            <button
                              onClick={() => handleOpenAssign(wos)}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Tugaskan
                            </button>
                          )}
                          {canReportProgress && (
                            <button
                              onClick={() => handleOpenReport(wos)}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Lapor
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

      {/* Siap Proses Modal */}
      {processModalWO && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl border border-slate-200">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-emerald-600" />
                Siap Proses: {processModalWO.spk_number}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tentukan tanggal mulai dan deadline produksi. Sistem akan otomatis menerbitkan Perintah Kerja lantai produksi &amp; Permintaan Material ke Bagian Gudang.
              </p>
            </div>

            <form onSubmit={handleProcessWorkOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai Produksi *</label>
                  <input
                    type="date"
                    required
                    value={processStartDate}
                    onChange={(e) => setProcessStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deadline Selesai *</label>
                  <input
                    type="date"
                    required
                    value={processDeadlineDate}
                    onChange={(e) => setProcessDeadlineDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
                📦 <b>Koneksi Gudang Otomatis:</b> Kebutuhan material berdasarkan BOM produk ({processModalWO.product?.product_name}) akan otomatis diteruskan ke modul <b>Permintaan Material Gudang</b> untuk dicek dan disiapkan.
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProcessModalWO(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingProcess}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  {submittingProcess ? 'Memproses...' : 'Mulai Eksekusi & Terbitkan MR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create SPK Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Penerbitan Surat Perintah Kerja (SPK) Manual
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSPK} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Pilih Produk Kitchenware
                </label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} ({p.product_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Target Kuantitas (Pcs)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={targetQty}
                    onChange={(e) => setTargetQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent / Prioritas Tinggi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Target Waktu Selesai (Hari dari Sekarang)
                </label>
                <input
                  type="number"
                  min={1}
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingSPK}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25"
                >
                  {submittingSPK ? 'Menerbitkan...' : 'Terbitkan SPK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Worker Modal */}
      {assignModalWOS && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                Penugasan: {assignModalWOS.station?.name}
              </h2>
              <button onClick={() => setAssignModalWOS(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssign} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Tipe Pelaksana
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignedType('internal')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      assignedType === 'internal'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    In-House Pabrik
                  </button>

                  <button
                    type="button"
                    disabled={!assignModalWOS.station?.is_external_allowed}
                    onClick={() => setAssignedType('mitra')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      assignedType === 'mitra'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600 disabled:opacity-40'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    Mitra Produksi
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Pilih Pekerja / Mitra
                </label>
                <select
                  value={assignedUserId || ''}
                  onChange={(e) => setAssignedUserId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                >
                  <option value="">-- Pilih Pekerja / Mitra --</option>
                  {users
                    .filter((u) => u.is_active)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAssignModalWOS(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all"
                >
                  {submittingAssign ? 'Menyimpan...' : 'Simpan Penugasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Report Modal */}
      {reportModalWOS && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                Lapor Progres: {reportModalWOS.station?.name}
              </h2>
              <button onClick={() => setReportModalWOS(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReport} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Jumlah Bagus (Pass)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={reportPassQty}
                    onChange={(e) => setReportPassQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-emerald-700 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Jumlah Cacat (Reject)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={reportRejQty}
                    onChange={(e) => setReportRejQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-rose-600 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Catatan Pekerjaan
                </label>
                <textarea
                  rows={2}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReportModalWOS(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all"
                >
                  {submittingReport ? 'Menyimpan...' : 'Simpan Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
