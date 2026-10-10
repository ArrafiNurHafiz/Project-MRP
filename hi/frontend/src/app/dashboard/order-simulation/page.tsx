'use client';

import { useState, useEffect } from 'react';
import {
  apiFetch,
  Product,
  OrderSimulationResult,
  MRPRunSummary,
  MRPNetRequirementItem,
} from '@/lib/api';
import {
  Cpu,
  Play,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers,
  ShoppingCart,
  DollarSign,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Search,
  CheckSquare,
  Square,
  Building,
  Check,
  X,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default function OrderSimulationPage() {
  const [activeTab, setActiveTab] = useState<'mrp_run' | 'simulation'>('mrp_run');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab 1: Order Simulation Calculator State
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<OrderSimulationResult | null>(null);
  const [requiredDate, setRequiredDate] = useState(
    new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [simulationItems, setSimulationItems] = useState([
    { product_id: 1, quantity: 200, selling_price: 35000 },
    { product_id: 2, quantity: 150, selling_price: 45000 },
  ]);

  // Tab 2: Automated MRP Run Workbench State
  const [mrpSummary, setMrpSummary] = useState<MRPRunSummary | null>(null);
  const [loadingMRP, setLoadingMRP] = useState(false);
  const [mrpError, setMrpError] = useState<string | null>(null);
  const [mrpSuccess, setMrpSuccess] = useState<string | null>(null);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DEFICIT_ONLY' | 'OK_ONLY'>('DEFICIT_ONLY');
  const [mrpSearch, setMrpSearch] = useState('');
  const [generatingPO, setGeneratingPO] = useState(false);
  const [poResultModal, setPoResultModal] = useState<{
    pos_created: number;
    purchase_orders: any[];
  } | null>(null);

  useEffect(() => {
    async function initData() {
      try {
        const prodRes = await apiFetch<any>('/products?limit=100');
        if (prodRes.success && prodRes.data) {
          setProducts(prodRes.data.products || []);
          if (prodRes.data.products && prodRes.data.products.length >= 2) {
            setSimulationItems([
              { product_id: prodRes.data.products[0].id, quantity: 200, selling_price: 35000 },
              { product_id: prodRes.data.products[1].id, quantity: 150, selling_price: 45000 },
            ]);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initData();
    fetchNetRequirements();
  }, []);

  const fetchNetRequirements = async () => {
    setLoadingMRP(true);
    setMrpError(null);
    try {
      const res = await apiFetch<MRPRunSummary>('/mrp/net-requirements');
      if (res.success && res.data) {
        setMrpSummary(res.data);
        // Pre-select all materials that have net deficit
        const deficitIds = res.data.items
          .filter((it) => it.net_deficit > 0)
          .map((it) => it.material_id);
        setSelectedMaterialIds(deficitIds);
      } else {
        setMrpError(res.message || 'Gagal memuat kalkulasi kebutuhan bersih MRP');
      }
    } catch (err: any) {
      setMrpError(err.message);
    } finally {
      setLoadingMRP(false);
    }
  };

  const handleAddItem = () => {
    if (products.length > 0) {
      setSimulationItems([
        ...simulationItems,
        { product_id: products[0].id, quantity: 100, selling_price: 30000 },
      ]);
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setError(null);

    const payload = {
      order_required_date: requiredDate,
      items: simulationItems.map((it) => ({
        product_id: Number(it.product_id),
        quantity: Number(it.quantity),
        selling_price: Number(it.selling_price),
      })),
    };

    const res = await apiFetch<OrderSimulationResult>('/order-simulation/calculate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success && res.data) {
      setResult(res.data);
    } else {
      setError(res.message || 'Gagal menjalankan kalkulasi simulasi');
    }
    setSimulating(false);
  };

  const handleToggleSelectMaterial = (id: number) => {
    if (selectedMaterialIds.includes(id)) {
      setSelectedMaterialIds(selectedMaterialIds.filter((item) => item !== id));
    } else {
      setSelectedMaterialIds([...selectedMaterialIds, id]);
    }
  };

  const handleSelectAllDeficits = () => {
    if (!mrpSummary) return;
    const deficitIds = mrpSummary.items
      .filter((it) => it.net_deficit > 0)
      .map((it) => it.material_id);

    if (selectedMaterialIds.length === deficitIds.length) {
      setSelectedMaterialIds([]);
    } else {
      setSelectedMaterialIds(deficitIds);
    }
  };

  const handleBatchGeneratePO = async () => {
    if (selectedMaterialIds.length === 0) {
      alert('Pilih minimal 1 bahan baku defisit untuk diterbitkan Purchase Order.');
      return;
    }

    if (
      !confirm(
        `Terbitkan Purchase Order otomatis untuk ${selectedMaterialIds.length} bahan baku yang dipilih? Sistem akan mengelompokkan PO berdasarkan vendor terkait secara otomatis.`
      )
    ) {
      return;
    }

    setGeneratingPO(true);
    setMrpError(null);
    setMrpSuccess(null);

    try {
      const res = await apiFetch<any>('/mrp/generate-po-batch', {
        method: 'POST',
        body: JSON.stringify({
          selected_material_ids: selectedMaterialIds,
          notes: 'Diterbitkan otomatis via Enterprise MRP Net Requirements Engine',
        }),
      });

      if (res.success && res.data) {
        setMrpSuccess(`Berhasil menerbitkan ${res.data.pos_created} Purchase Order!`);
        setPoResultModal(res.data);
        fetchNetRequirements();
      } else {
        setMrpError(res.message || 'Gagal membuat batch Purchase Order');
      }
    } catch (err: any) {
      setMrpError(err.message);
    } finally {
      setGeneratingPO(false);
    }
  };

  // Filtered MRP Items
  const filteredMrpItems = (mrpSummary?.items || []).filter((it) => {
    const matchesSearch =
      it.name.toLowerCase().includes(mrpSearch.toLowerCase()) ||
      it.code.toLowerCase().includes(mrpSearch.toLowerCase()) ||
      it.category.toLowerCase().includes(mrpSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'DEFICIT_ONLY') {
      return it.status === 'DEFICIT' || it.status === 'CRITICAL';
    }
    if (statusFilter === 'OK_ONLY') {
      return it.status === 'OK';
    }
    return true;
  });

  const selectedTotalCost = (mrpSummary?.items || [])
    .filter((it) => selectedMaterialIds.includes(it.material_id))
    .reduce((sum, it) => sum + it.estimated_cost, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
            Perencanaan Kebutuhan Material &amp; Simulasi MRP
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Engine otomatisasi pengadaan industri (MRP II): Hitung kebutuhan bersih bahan baku, saldo proyeksi, alokasi SPK aktif, dan terbitkan Purchase Order 1-klik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'mrp_run' && (
            <button
              onClick={fetchNetRequirements}
              disabled={loadingMRP}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loadingMRP ? 'animate-spin' : ''}`} />
              Hitung Ulang MRP
            </button>
          )}
          <Link
            href="/dashboard/purchase-orders"
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Daftar PO Vendor
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-1">
        <button
          onClick={() => setActiveTab('mrp_run')}
          className={`flex items-center gap-2 py-3 px-5 border-b-2 text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'mrp_run'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Kebutuhan Bersih MRP &amp; Auto PO (Enterprise MRP Run)
          {mrpSummary && mrpSummary.deficit_materials > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
              {mrpSummary.deficit_materials} Defisit
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('simulation')}
          className={`flex items-center gap-2 py-3 px-5 border-b-2 text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'simulation'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4 text-purple-600" />
          Simulasi Pra-Pesanan (What-If Order Simulation)
        </button>
      </div>

      {/* TAB 1: AUTOMATED MRP NET REQUIREMENTS WORKBENCH */}
      {activeTab === 'mrp_run' && (
        <div className="space-y-6">
          {/* Notifications */}
          {mrpError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{mrpError}</span>
            </div>
          )}
          {mrpSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{mrpSuccess}</span>
            </div>
          )}

          {/* MRP KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="berry-card p-5 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Bahan Baku Dievaluasi
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {mrpSummary?.total_materials || 0}
                </span>
                <span className="text-xs text-slate-400 font-medium">Item Master</span>
              </div>
            </div>

            <div className="berry-card p-5 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Defisit / Stok Kurang
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-600 font-mono">
                  {mrpSummary?.deficit_materials || 0}
                </span>
                <span className="text-xs text-rose-500 font-bold">Perlu Pengadaan</span>
              </div>
            </div>

            <div className="berry-card p-5 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Estimasi Biaya Defisit Total
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-indigo-700 font-mono">
                  Rp {(mrpSummary?.total_deficit_cost || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="berry-card p-5 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Material Terpilih untuk PO
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  {selectedMaterialIds.length}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  Rp {selectedTotalCost.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Workbench Filter & 1-Click Action Bar */}
          <div className="berry-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama atau kode bahan baku..."
                  value={mrpSearch}
                  onChange={(e) => setMrpSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer shrink-0"
              >
                <option value="DEFICIT_ONLY">Tampilkan: Hanya Defisit &amp; Kritis</option>
                <option value="ALL">Tampilkan: Semua Material</option>
                <option value="OK_ONLY">Tampilkan: Stok Aman (OK)</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleSelectAllDeficits}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                {selectedMaterialIds.length > 0 && selectedMaterialIds.length === (mrpSummary?.items.filter(i => i.net_deficit > 0).length || 0)
                  ? 'Batal Pilih Semua'
                  : 'Pilih Semua Defisit'}
              </button>

              <button
                type="button"
                disabled={generatingPO || selectedMaterialIds.length === 0}
                onClick={handleBatchGeneratePO}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl shadow-md shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {generatingPO
                  ? 'Menerbitkan Purchase Order...'
                  : `⚡ Terbitkan 1-Klik Batch PO (${selectedMaterialIds.length})`}
              </button>
            </div>
          </div>

          {/* Workbench Table */}
          <div className="berry-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">Pilih</th>
                    <th className="py-3 px-4">Bahan Baku &amp; Kategori</th>
                    <th className="py-3 px-3 text-right">Stok Riil</th>
                    <th className="py-3 px-3 text-right">Kebutuhan SPK</th>
                    <th className="py-3 px-3 text-right">Pesanan Masuk (PO)</th>
                    <th className="py-3 px-3 text-right">Safety Stock</th>
                    <th className="py-3 px-3 text-right">Proyeksi Saldo</th>
                    <th className="py-3 px-3 text-right font-bold text-rose-700">Defisit Bersih</th>
                    <th className="py-3 px-3 text-right font-bold text-indigo-700">Saran Order</th>
                    <th className="py-3 px-3 text-right">Estimasi Biaya</th>
                    <th className="py-3 px-3">Vendor Rekomendasi</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingMRP ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                        Menghitung kebutuhan bersih material dari seluruh SPK dan stok gudang...
                      </td>
                    </tr>
                  ) : filteredMrpItems.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400">
                        Tidak ada data bahan baku sesuai filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredMrpItems.map((item) => {
                      const isSelected = selectedMaterialIds.includes(item.material_id);
                      return (
                        <tr
                          key={item.material_id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            item.status === 'CRITICAL'
                              ? 'bg-rose-50/30'
                              : item.status === 'DEFICIT'
                              ? 'bg-amber-50/20'
                              : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={item.net_deficit === 0}
                              onChange={() => handleToggleSelectMaterial(item.material_id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900">{item.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              [{item.code}] • <span className="text-slate-500">{item.category}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                            {item.current_stock.toFixed(1)} {item.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            {item.demand_qty.toFixed(1)} {item.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-blue-600 font-medium">
                            {item.inbound_qty > 0 ? `+${item.inbound_qty.toFixed(1)}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-400">
                            {item.safety_stock.toFixed(1)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-mono font-bold ${
                              item.projected_stock < 0 ? 'text-rose-600' : 'text-slate-800'
                            }`}
                          >
                            {item.projected_stock.toFixed(1)} {item.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-rose-600">
                            {item.net_deficit > 0 ? `${item.net_deficit.toFixed(1)} ${item.unit}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-indigo-700 bg-indigo-50/40">
                            {item.recommended_order > 0
                              ? `${item.recommended_order.toFixed(1)} ${item.unit}`
                              : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                            {item.estimated_cost > 0
                              ? `Rp ${item.estimated_cost.toLocaleString('id-ID')}`
                              : '-'}
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-slate-800 font-bold flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[130px]">{item.preferred_vendor_name || 'Vendor Umum'}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Lead time: {item.lead_time_days} hari
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                item.status === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                                  : item.status === 'DEFICIT'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {item.status === 'CRITICAL'
                                ? 'KRITIS'
                                : item.status === 'DEFICIT'
                                ? 'DEFISIT'
                                : 'AMAN'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Success Modal: Batch PO Generated */}
          {poResultModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {poResultModal.pos_created} Purchase Order Berhasil Diterbitkan!
                      </h3>
                      <p className="text-xs text-slate-500">
                        Order pembelian telah diterbitkan secara otomatis dan terkelompok per vendor.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPoResultModal(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {poResultModal.purchase_orders?.map((po: any) => (
                    <div
                      key={po.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {po.po_number}
                          </span>
                          <span className="font-bold text-slate-800">
                            {po.vendor?.name || 'Vendor Rekomendasi'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Status: <b className="uppercase">{po.status}</b> • {po.items?.length || 0} item bahan
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-extrabold text-slate-900 block">
                          Rp {(po.total_amount || 0).toLocaleString('id-ID')}
                        </span>
                        <Link
                          href="/dashboard/purchase-orders"
                          className="text-[10px] text-indigo-600 hover:underline font-bold"
                        >
                          Lihat Detail &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPoResultModal(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                  >
                    Tutup
                  </button>
                  <Link
                    href="/dashboard/purchase-orders"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25"
                  >
                    Buka Modul Pengadaan (PO)
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WHAT-IF ORDER SIMULATION CALCULATOR */}
      {activeTab === 'simulation' && (
        <div className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Input Parameters Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Simulation Configuration (5 cols) */}
            <div className="lg:col-span-5 berry-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-indigo-600" />
                  Parameter Pesanan yang Disimulasikan
                </h2>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  + Tambah Item
                </button>
              </div>

              <form onSubmit={handleRunSimulation} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Selesai / Due Date *</label>
                  <input
                    type="date"
                    required
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Daftar Produk &amp; Target Kuantitas:
                  </span>
                  {simulationItems.map((it, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">Produk #{idx + 1}</span>
                        {simulationItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setSimulationItems(simulationItems.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-700 font-bold"
                          >
                            × Hapus
                          </button>
                        )}
                      </div>
                      <select
                        value={it.product_id}
                        onChange={(e) => {
                          const updated = [...simulationItems];
                          updated[idx].product_id = Number(e.target.value);
                          setSimulationItems(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.product_name} ({p.product_code})
                          </option>
                        ))}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">Kuantitas (pcs)</span>
                          <input
                            type="number"
                            min={1}
                            value={it.quantity}
                            onChange={(e) => {
                              const updated = [...simulationItems];
                              updated[idx].quantity = Number(e.target.value);
                              setSimulationItems(updated);
                            }}
                            className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">Harga Jual / Unit</span>
                          <input
                            type="number"
                            min={0}
                            value={it.selling_price}
                            onChange={(e) => {
                              const updated = [...simulationItems];
                              updated[idx].selling_price = Number(e.target.value);
                              setSimulationItems(updated);
                            }}
                            className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-emerald-600 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={simulating}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {simulating ? 'Menjalankan BOM Explosion...' : 'Jalankan Simulasi MRP'}
                </button>
              </form>
            </div>

            {/* Results Pane (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {!result ? (
                <div className="berry-card p-16 text-center text-slate-400 text-xs">
                  Atur parameter pesanan di sebelah kiri dan klik &quot;Jalankan Simulasi MRP&quot; untuk menguji kelayakan material dan kapasitas pabrik.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Feasibility Overview Card */}
                  <div className="berry-card p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="text-xs font-extrabold text-slate-500 uppercase">Ringkasan Kelayakan Produksi</span>
                      <span
                        className={`px-3 py-1 rounded-md text-xs font-extrabold uppercase ${
                          result.feasibility_status === 'FEASIBLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800 animate-pulse'
                        }`}
                      >
                        {result.feasibility_status === 'FEASIBLE'
                          ? '✓ Bahan Cukup - Siap Produksi'
                          : '⚠️ Terjadi Kekurangan Bahan Baku'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block mb-1">Estimasi Omset:</span>
                        <span className="font-mono font-extrabold text-sm text-indigo-700">
                          Rp {result.forecasted_revenue.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block mb-1">Total Biaya Bahan:</span>
                        <span className="font-mono font-extrabold text-sm text-slate-800">
                          Rp {result.total_gross_cogs.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block mb-1">Proyeksi Gross Margin:</span>
                        <span className="font-mono font-extrabold text-sm text-emerald-600">
                          Rp {result.estimated_margin.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Material Requirements Planning (BOM Explosion Demand) */}
                  <div className="berry-card p-6 space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      BOM Explosion &amp; Kebutuhan Bahan Baku (MRP Net Requirements)
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] uppercase font-extrabold text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Bahan Baku</th>
                            <th className="py-2.5 px-3 text-right">Dibutuhkan</th>
                            <th className="py-2.5 px-3 text-right">Stok Gudang</th>
                            <th className="py-2.5 px-3 text-right">Selisih Kekurangan</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.material_demands.map((dem) => (
                            <tr key={dem.material_id} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3 font-bold text-slate-900">
                                {dem.name}{' '}
                                <span className="text-[10px] text-slate-400 font-mono">
                                  [{dem.material_code}]
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                                {dem.required_gross_qty.toFixed(2)} {dem.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                {dem.current_stock_qty.toFixed(2)} {dem.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                                {dem.net_shortage_qty > 0
                                  ? `${dem.net_shortage_qty.toFixed(2)} ${dem.unit}`
                                  : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                                    dem.is_shortage
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {dem.is_shortage ? 'KURANG' : 'CUKUP'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Rough-Cut Capacity Planning (CRP) */}
                  <div className="berry-card p-6 space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-600" />
                      Beban Kapasitas Stasiun Kerja (Rough-Cut CRP)
                    </h3>

                    <div className="space-y-3">
                      {result.station_capacities.map((cap) => (
                        <div key={cap.station_code} className="space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{cap.station_name}</span>
                            <span>
                              {cap.estimated_load_hours.toFixed(1)} / {cap.max_capacity_hours} Jam (
                              {cap.utilization_pct.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                cap.utilization_pct > 100
                                  ? 'bg-rose-500'
                                  : cap.utilization_pct > 75
                                  ? 'bg-amber-500'
                                  : 'bg-indigo-600'
                              }`}
                              style={{ width: `${Math.min(cap.utilization_pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Purchase Recommendations if Shortage */}
                  {result.purchase_recommendations.length > 0 && (
                    <div className="berry-card p-6 space-y-3 bg-amber-50/50 border-amber-200">
                      <h3 className="text-sm font-extrabold text-amber-900 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-amber-700" />
                        Rekomendasi Penerbitan Purchase Order Bahan
                      </h3>
                      <div className="space-y-2">
                        {result.purchase_recommendations.map((po, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white rounded-xl border border-amber-200 flex justify-between items-center text-xs"
                          >
                            <div>
                              <b className="text-slate-900 block">{po.material_name}</b>
                              <span className="text-slate-500 text-[11px]">
                                Saran Beli: {po.recommended_qty.toFixed(2)} pcs • Lead Time:{' '}
                                {po.suggested_lead_days} Hari
                              </span>
                            </div>
                            <span className="font-mono font-bold text-amber-900">
                              Rp {po.estimated_total_cost.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
