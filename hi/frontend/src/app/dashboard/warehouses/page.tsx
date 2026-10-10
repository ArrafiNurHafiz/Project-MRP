'use client';

import { useState, useEffect } from 'react';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  ClipboardCheck,
  Building,
  Boxes,
  Layers,
  Clock,
  ShieldCheck,
  Scale,
  RefreshCw,
  X,
  Loader2,
  Package,
} from 'lucide-react';
import {
  apiFetch,
  Warehouse,
  StockTransfer,
  StockAdjustment,
  Material,
  getActiveTenant,
  ActiveTenantContext,
  getStoredUser,
  User,
  isSuperuser,
} from '@/lib/api';

export default function WarehousesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTenant, setActiveTenantState] = useState<ActiveTenantContext>(getActiveTenant());
  const [activeTab, setActiveTab] = useState<'warehouses' | 'transfers' | 'adjustments'>('warehouses');

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states: New Warehouse
  const [whCode, setWhCode] = useState('');
  const [whName, setWhName] = useState('');
  const [whType, setWhType] = useState<'raw_materials' | 'finished_goods' | 'wip' | 'quarantine' | 'subcontractor'>('raw_materials');
  const [whLocation, setWhLocation] = useState('');
  const [whAddress, setWhAddress] = useState('');
  const [whCapacity, setWhCapacity] = useState(1000);
  const [whManager, setWhManager] = useState('');

  // Form states: Transfer
  const [fromWhId, setFromWhId] = useState<number>(0);
  const [toWhId, setToWhId] = useState<number>(0);
  const [transferMatId, setTransferMatId] = useState<number>(0);
  const [transferQty, setTransferQty] = useState<number>(10);
  const [driverName, setDriverName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Form states: Adjustment
  const [adjWhId, setAdjWhId] = useState<number>(0);
  const [adjMatId, setAdjMatId] = useState<number>(0);
  const [recordedQty, setRecordedQty] = useState<number>(50);
  const [countedQty, setCountedQty] = useState<number>(50);
  const [adjReason, setAdjReason] = useState<string>('count_difference');
  const [adjNotes, setAdjNotes] = useState('');

  useEffect(() => {
    setUser(getStoredUser());
    setActiveTenantState(getActiveTenant());

    const handleTenantChange = () => {
      setActiveTenantState(getActiveTenant());
      loadAll();
    };

    window.addEventListener('tenant-changed', handleTenantChange);
    loadAll();

    return () => window.removeEventListener('tenant-changed', handleTenantChange);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [whRes, trfRes, adjRes, matRes] = await Promise.all([
        apiFetch<{ warehouses: Warehouse[] }>('/warehouses'),
        apiFetch<{ transfers: StockTransfer[] }>('/stock-transfers'),
        apiFetch<{ adjustments: StockAdjustment[] }>('/stock-adjustments'),
        apiFetch<{ materials: Material[] }>('/materials?limit=100'),
      ]);

      if (whRes.success && whRes.data) setWarehouses(whRes.data.warehouses || []);
      if (trfRes.success && trfRes.data) setTransfers(trfRes.data.transfers || []);
      if (adjRes.success && adjRes.data) setAdjustments(adjRes.data.adjustments || []);
      if (matRes.success && matRes.data) setMaterials(matRes.data.materials || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch<Warehouse>('/warehouses', {
        method: 'POST',
        body: JSON.stringify({
          code: whCode,
          name: whName,
          type: whType,
          location: whLocation,
          address: whAddress,
          capacity_m3: whCapacity,
          manager_name: whManager,
        }),
      });

      if (res.success) {
        setSuccess('Gudang baru berhasil didaftarkan');
        setShowAddWarehouseModal(false);
        setWhCode('');
        setWhName('');
        setWhLocation('');
        setWhAddress('');
        setWhManager('');
        loadAll();
      } else {
        setError(res.error || res.message || 'Gagal membuat gudang');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromWhId === toWhId) {
      setError('Gudang asal dan gudang tujuan tidak boleh sama');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const selectedMat = materials.find((m) => m.id === Number(transferMatId));
      const res = await apiFetch<StockTransfer>('/stock-transfers', {
        method: 'POST',
        body: JSON.stringify({
          from_warehouse_id: Number(fromWhId),
          to_warehouse_id: Number(toWhId),
          driver_name: driverName,
          vehicle_number: vehicleNo,
          notes: transferNotes,
          items: [
            {
              material_id: Number(transferMatId),
              requested_qty: Number(transferQty),
              transferred_qty: Number(transferQty),
              unit_cost: selectedMat?.cost_per_unit || 0,
            },
          ],
        }),
      });

      if (res.success) {
        setSuccess('Mutasi transfer stok berhasil dibuat (In-Transit)');
        setShowTransferModal(false);
        setDriverName('');
        setVehicleNo('');
        setTransferNotes('');
        loadAll();
      } else {
        setError(res.error || res.message || 'Gagal membuat transfer');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTransfer = async (id: number) => {
    if (!confirm('Selesaikan transfer ini dan perbarui stok di kedua gudang?')) return;
    try {
      const res = await apiFetch(`/stock-transfers/${id}/complete`, { method: 'POST' });
      if (res.success) {
        setSuccess('Transfer stok telah diselesaikan & inventori otomatis diperbarui');
        loadAll();
      } else {
        setError(res.error || res.message || 'Gagal menyelesaikan transfer');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch<StockAdjustment>('/stock-adjustments', {
        method: 'POST',
        body: JSON.stringify({
          warehouse_id: Number(adjWhId),
          material_id: Number(adjMatId),
          recorded_qty: Number(recordedQty),
          counted_qty: Number(countedQty),
          reason: adjReason,
          notes: adjNotes,
        }),
      });

      if (res.success) {
        setSuccess('Hasil stock opname berhasil dicatat sebagai draft penyesuaian');
        setShowAdjustmentModal(false);
        setAdjNotes('');
        loadAll();
      } else {
        setError(res.error || res.message || 'Gagal mencatat penyesuaian');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveAdjustment = async (id: number) => {
    if (!confirm('Setujui penyesuaian ini? Stok gudang dan master material akan diperbarui sesuai hasil hitungan fisik.')) return;
    try {
      const res = await apiFetch(`/stock-adjustments/${id}/approve`, { method: 'POST' });
      if (res.success) {
        setSuccess('Penyesuaian stok disetujui & master inventori disinkronkan');
        loadAll();
      } else {
        setError(res.error || res.message || 'Gagal menyetujui penyesuaian');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const totalCapacity = warehouses.reduce((acc, w) => acc + (w.capacity_m3 || 0), 0);
  const activeTransfersCount = transfers.filter((t) => t.status === 'in_transit').length;
  const pendingAdjCount = adjustments.filter((a) => a.status === 'draft').length;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'raw_materials':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Bahan Baku</span>;
      case 'wip':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Lantai WIP</span>;
      case 'finished_goods':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Barang Jadi</span>;
      case 'quarantine':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Karantina QC</span>;
      case 'subcontractor':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Mitra Maklon</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <WarehouseIcon className="w-5 h-5 text-indigo-600" />
              Multi-Warehouse Management &amp; Stock Movements
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              {activeTenant.company_code}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Kelola jaringan gudang penyimpanan bahan baku, staging WIP lantai pabrik, karantina QC, dan mutasi antar fasilitas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowTransferModal(true)}
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            Transfer Pindah Gudang
          </button>
          <button
            onClick={() => setShowAddWarehouseModal(true)}
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Gudang
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Gudang Aktif</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{warehouses.length} Fasilitas</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Operasional multi-lokasi</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kapasitas Total</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalCapacity.toLocaleString()} m³</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">Volume penyimpanan log &amp; barang</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mutasi In-Transit</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">{activeTransfersCount} Pengiriman</div>
            <div className="text-[10px] text-indigo-500 font-medium mt-0.5">Sedang dalam perjalanan</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Opname Pending</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{pendingAdjCount} Penyesuaian</div>
            <div className="text-[10px] text-amber-600 font-medium mt-0.5">Menunggu approval manajer</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('warehouses')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'warehouses'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          Direktori Gudang ({warehouses.length})
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'transfers'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          Mutasi Pindah Gudang ({transfers.length})
        </button>
        <button
          onClick={() => setActiveTab('adjustments')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'adjustments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          Stock Opname &amp; Rekonsiliasi ({adjustments.length})
        </button>
      </div>

      {/* Tab 1: Warehouses Directory */}
      {activeTab === 'warehouses' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {warehouses.map((wh) => (
              <div
                key={wh.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-200 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <WarehouseIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">{wh.name}</h3>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">{wh.code}</div>
                    </div>
                  </div>
                  {getTypeBadge(wh.type)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Lokasi / Zona</span>
                    <span className="font-semibold text-slate-700">{wh.location || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Kepala Gudang (PIC)</span>
                    <span className="font-semibold text-slate-700">{wh.manager_name || 'Belum diatur'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Kapasitas</span>
                    <span className="font-semibold text-slate-700">{wh.capacity_m3?.toLocaleString() || 0} m³</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Aktif Beroperasi
                    </span>
                  </div>
                </div>

                {wh.address && (
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-600">Alamat:</span> {wh.address}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {wh.stocks?.length || 0} material tersimpan
                  </span>
                  <button
                    onClick={() => {
                      setFromWhId(wh.id);
                      setShowTransferModal(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    Transfer Keluar <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {warehouses.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <WarehouseIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-slate-700">Belum ada gudang terdaftar</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Daftarkan gudang bahan baku dan staging lantai produksi perusahaan Anda untuk mulai melacak perpindahan inventori.
              </p>
              <button
                onClick={() => setShowAddWarehouseModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20"
              >
                + Tambah Gudang Pertama
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Internal Stock Transfers */}
      {activeTab === 'transfers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-800">Riwayat Mutasi Antar Gudang</h2>
            <button
              onClick={() => setShowTransferModal(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Buat Mutasi Baru
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No. Transfer</th>
                  <th className="py-3 px-4">Gudang Asal</th>
                  <th className="py-3 px-4">Gudang Tujuan</th>
                  <th className="py-3 px-4">Item &amp; Jumlah</th>
                  <th className="py-3 px-4">Supir &amp; Plat</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{trf.transfer_number}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{trf.from_warehouse?.name || 'Gudang #' + trf.from_warehouse_id}</div>
                      <div className="text-[10px] text-slate-400">{trf.from_warehouse?.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{trf.to_warehouse?.name || 'Gudang #' + trf.to_warehouse_id}</div>
                      <div className="text-[10px] text-slate-400">{trf.to_warehouse?.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      {trf.items && trf.items.length > 0 ? (
                        <div>
                          <span className="font-bold text-slate-800">{trf.items[0].requested_qty} unit</span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
                            {trf.items[0].material?.name || 'Material ID ' + trf.items[0].material_id}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{trf.driver_name || '-'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{trf.vehicle_number}</div>
                    </td>
                    <td className="py-3 px-4">
                      {trf.status === 'completed' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Selesai &bull; Diterima
                        </span>
                      ) : trf.status === 'in_transit' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          Dalam Perjalanan
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                          {trf.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {trf.status === 'in_transit' && (
                        <button
                          onClick={() => handleCompleteTransfer(trf.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                        >
                          Konfirmasi Terima
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {transfers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada riwayat mutasi transfer stok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Stock Adjustments (Stock Opname) */}
      {activeTab === 'adjustments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-800">Stock Opname &amp; Rekonsiliasi Fisik</h2>
              <p className="text-[11px] text-slate-500">Pencocokan jumlah stok tercatat di sistem vs hitungan fisik gudang.</p>
            </div>
            <button
              onClick={() => setShowAdjustmentModal(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Catat Hasil Opname
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No. Opname</th>
                  <th className="py-3 px-4">Gudang</th>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4">Tercatat</th>
                  <th className="py-3 px-4">Fisik Nyata</th>
                  <th className="py-3 px-4">Selisih</th>
                  <th className="py-3 px-4">Alasan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{adj.adjustment_number}</td>
                    <td className="py-3 px-4 font-medium">{adj.warehouse?.name || 'Gudang #' + adj.warehouse_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {adj.material?.name || 'Material #' + adj.material_id}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{adj.recorded_qty}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{adj.counted_qty}</td>
                    <td className="py-3 px-4">
                      {adj.discrepancy_qty > 0 ? (
                        <span className="font-bold text-emerald-600">+{adj.discrepancy_qty} (Lebih)</span>
                      ) : adj.discrepancy_qty < 0 ? (
                        <span className="font-bold text-rose-600">{adj.discrepancy_qty} (Kurang)</span>
                      ) : (
                        <span className="font-bold text-slate-400">0 (Sesuai)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {adj.reason}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {adj.status === 'approved' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Disetujui
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Draft Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {adj.status === 'draft' && (
                        <button
                          onClick={() => handleApproveAdjustment(adj.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                        >
                          Setujui &amp; Sinkronkan
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {adjustments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Belum ada catatan rekonsiliasi stock opname.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Warehouse */}
      {showAddWarehouseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                Daftarkan Fasilitas Gudang Baru
              </h3>
              <button onClick={() => setShowAddWarehouseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateWarehouse} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Gudang *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: WH-RAW-02"
                    value={whCode}
                    onChange={(e) => setWhCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Fasilitas *</label>
                  <select
                    value={whType}
                    onChange={(e: any) => setWhType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                  >
                    <option value="raw_materials">Gudang Bahan Baku (Raw Material)</option>
                    <option value="wip">Lantai Staging WIP (Produksi)</option>
                    <option value="finished_goods">Gudang Barang Jadi (Finished Goods)</option>
                    <option value="quarantine">Gudang Karantina &amp; Reject QC</option>
                    <option value="subcontractor">Gudang Mitra Maklon / Subkontrak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Fasilitas Gudang *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gudang Kayu Mahoni &amp; Teak Jepara"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi / Zona</label>
                  <input
                    type="text"
                    placeholder="Contoh: Gedung Barat Blok A"
                    value={whLocation}
                    onChange={(e) => setWhLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kapasitas (m³)</label>
                  <input
                    type="number"
                    value={whCapacity}
                    onChange={(e) => setWhCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kepala Gudang (PIC)</label>
                <input
                  type="text"
                  placeholder="Nama manajer penanggung jawab"
                  value={whManager}
                  onChange={(e) => setWhManager(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  placeholder="Alamat fisik fasilitas gudang"
                  value={whAddress}
                  onChange={(e) => setWhAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddWarehouseModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Gudang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transfer Stock */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                Buat Surat Jalan &amp; Mutasi Pindah Gudang
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTransfer} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gudang Asal *</label>
                  <select
                    required
                    value={fromWhId}
                    onChange={(e) => setFromWhId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                  >
                    <option value="">Pilih Gudang Asal</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gudang Tujuan *</label>
                  <select
                    required
                    value={toWhId}
                    onChange={(e) => setToWhId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                  >
                    <option value="">Pilih Gudang Tujuan</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Material yang Dipindahkan *</label>
                  <select
                    required
                    value={transferMatId}
                    onChange={(e) => setTransferMatId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                  >
                    <option value="">Pilih Material</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.material_code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah (Qty) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={transferQty}
                    onChange={(e) => setTransferQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Supir / Kurir</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pak Joko"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Polisi Kendaraan</label>
                  <input
                    type="text"
                    placeholder="Contoh: K 8821 ZA"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Dokumen Surat Jalan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan keperluan transfer material"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Kirim Mutasi Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Stock Adjustment (Opname) */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-600" />
                Catat Hasil Hitungan Stock Opname Fisik
              </h3>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAdjustment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Gudang yang Diinspeksi *</label>
                <select
                  required
                  value={adjWhId}
                  onChange={(e) => setAdjWhId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                >
                  <option value="">Pilih Gudang</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Material yang Dihitung *</label>
                <select
                  required
                  value={adjMatId}
                  onChange={(e) => {
                    const mId = Number(e.target.value);
                    setAdjMatId(mId);
                    const mat = materials.find((m) => m.id === mId);
                    if (mat) {
                      setRecordedQty(mat.stock_qty);
                      setCountedQty(mat.stock_qty);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                >
                  <option value="">Pilih Material</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.material_code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stok Tercatat di Sistem</label>
                  <input
                    type="number"
                    value={recordedQty}
                    onChange={(e) => setRecordedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hitungan Fisik Nyata *</label>
                  <input
                    type="number"
                    required
                    value={countedQty}
                    onChange={(e) => setCountedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-400 focus:outline-indigo-600 font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Selisih Hasil Opname:</span>
                <span className={`font-black text-sm ${countedQty - recordedQty < 0 ? 'text-rose-600' : countedQty - recordedQty > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {countedQty - recordedQty > 0 ? `+${countedQty - recordedQty}` : countedQty - recordedQty} unit
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alasan Penyesuaian *</label>
                <select
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                >
                  <option value="count_difference">Selisih Hitungan Rutin / Human Error</option>
                  <option value="damaged">Bahan Baku Rusak / Scrap di Gudang</option>
                  <option value="expired">Bahan Kimia Kadaluarsa</option>
                  <option value="audit_adjustment">Penyesuaian Audit Akhir Bulan</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Berita Acara</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan hasil temuan fisik di lapangan"
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-600"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Draft Opname
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
