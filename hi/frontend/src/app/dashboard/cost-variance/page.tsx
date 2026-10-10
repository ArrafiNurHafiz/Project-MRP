'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Percent,
  Cpu,
  Boxes,
  Zap,
} from 'lucide-react';
import {
  apiFetch,
  WorkOrder,
  JobCostVarianceResult,
  getJobCostVariance,
  getStoredUser,
  User,
} from '@/lib/api';

export default function CostVariancePage() {
  const [user, setUser] = useState<User | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWOId, setSelectedWOId] = useState<number | null>(null);
  const [varianceData, setVarianceData] = useState<JobCostVarianceResult | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingVariance, setLoadingVariance] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await apiFetch<{ work_orders: WorkOrder[]; total: number }>('/spk');
      if (res.success && res.data) {
        const wos = res.data.work_orders || [];
        setWorkOrders(wos);
        if (wos.length > 0 && !selectedWOId) {
          setSelectedWOId(wos[0].id);
          fetchVariance(wos[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar Work Order');
    } finally {
      setLoadingList(false);
    }
  };

  const fetchVariance = async (woId: number) => {
    setLoadingVariance(true);
    setError(null);
    try {
      const res = await getJobCostVariance(woId);
      if (res.success && res.data) {
        setVarianceData(res.data);
      } else {
        setError(res.message || 'Gagal memuat analisis varians biaya');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoadingVariance(false);
    }
  };

  const handleSelectWO = (woId: number) => {
    setSelectedWOId(woId);
    fetchVariance(woId);
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const filteredWOs = workOrders.filter(
    (wo) =>
      wo.spk_number.toLowerCase().includes(search.toLowerCase()) ||
      (wo.product?.product_name && wo.product.product_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            Financial & Job Costing Intelligence
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Analisis Varians HPP (Standard vs Actual COGS)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit margin laba riil, pelacakan deviasi biaya material, tenaga kerja, dan overhead pabrik per SPK.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedWOId) fetchVariance(selectedWOId);
            }}
            disabled={loadingVariance || !selectedWOId}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingVariance ? 'animate-spin' : ''}`} />
            Hitung Ulang
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Work Order Picker */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Pilih Surat Perintah Kerja (SPK)
              </h2>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {workOrders.length} SPK
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari SPK atau produk..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
              />
            </div>

            {loadingList ? (
              <div className="py-8 text-center text-xs text-slate-400">Memuat daftar SPK...</div>
            ) : filteredWOs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Tidak ada SPK ditemukan</div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredWOs.map((wo) => {
                  const isSelected = wo.id === selectedWOId;
                  return (
                    <button
                      key={wo.id}
                      onClick={() => handleSelectWO(wo.id)}
                      className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">{wo.spk_number}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            wo.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : wo.status === 'in_progress'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {wo.status}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-700 truncate">
                        {wo.product?.product_name || `Produk #${wo.product_id}`}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Target: {wo.total_target_qty} unit</span>
                        <span className="flex items-center gap-1">
                          Lihat Varians <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Variance Details & KPIs */}
        <div className="lg:col-span-8 space-y-6">
          {loadingVariance ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-800">Menghitung Varians Biaya HPP...</div>
              <p className="text-xs text-slate-500">
                Membandingkan alokasi BOM standar dengan pemakaian aktual material, upah kerja, dan overhead.
              </p>
            </div>
          ) : !varianceData ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2 text-slate-400">
              <Layers className="w-10 h-10 mx-auto text-slate-300" />
              <div className="text-sm font-semibold">Pilih SPK di sebelah kiri untuk melihat rincian varians</div>
            </div>
          ) : (
            <>
              {/* Header Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                      Hasil Analisis COGS
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {varianceData.product_name}
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                      <span>Nomor SPK: <b>{varianceData.spk_number}</b></span>
                      <span>&bull;</span>
                      <span>Target: <b>{varianceData.target_qty} unit</b></span>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider ${
                        varianceData.is_favorable
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {varianceData.is_favorable ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          FAVORABLE (HEMAT)
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 text-rose-600" />
                          UNFAVORABLE (OVER BUDGET)
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div className="text-[11px] font-bold uppercase text-slate-500">Standard Budget HPP</div>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">
                      {formatIDR(varianceData.total_standard_cost)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Sesuai Bill of Materials (BOM)</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div className="text-[11px] font-bold uppercase text-slate-500">Actual Cost (Realisasi)</div>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">
                      {formatIDR(varianceData.total_actual_cost)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Total pengeluaran riil terpakai</div>
                  </div>

                  <div
                    className={`p-4 rounded-xl border ${
                      varianceData.is_favorable
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50/70 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase opacity-80">
                      Varians Bersih ({varianceData.total_variance_pct >= 0 ? '+' : ''}
                      {varianceData.total_variance_pct.toFixed(1)}%)
                    </div>
                    <div className="text-xl font-extrabold mt-1">
                      {formatIDR(Math.abs(varianceData.total_variance))}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {varianceData.is_favorable
                        ? 'Penghematan terhadap budget awal'
                        : 'Pembengkakan melebihi standar'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                  Rincian Komponen Biaya Produksi (Cost Elements)
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-left">
                        <th className="py-2.5 px-3 rounded-l-lg">Kategori Biaya</th>
                        <th className="py-2.5 px-3 text-right">Biaya Standar</th>
                        <th className="py-2.5 px-3 text-right">Biaya Aktual</th>
                        <th className="py-2.5 px-3 text-right">Deviasi (IDR)</th>
                        <th className="py-2.5 px-3 text-right">Deviasi (%)</th>
                        <th className="py-2.5 px-3 text-center rounded-r-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {varianceData.breakdown.map((item, idx) => {
                        const isFav = item.variance <= 0;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-2">
                              {item.category.toLowerCase().includes('material') ? (
                                <Boxes className="w-4 h-4 text-amber-500" />
                              ) : item.category.toLowerCase().includes('overhead') ? (
                                <Zap className="w-4 h-4 text-purple-500" />
                              ) : (
                                <Cpu className="w-4 h-4 text-blue-500" />
                              )}
                              {item.category}
                            </td>
                            <td className="py-3 px-3 text-right text-slate-600">
                              {formatIDR(item.standard_cost)}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-slate-900">
                              {formatIDR(item.actual_cost)}
                            </td>
                            <td
                              className={`py-3 px-3 text-right font-bold ${
                                isFav ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {item.variance >= 0 ? '+' : ''}
                              {formatIDR(item.variance)}
                            </td>
                            <td
                              className={`py-3 px-3 text-right font-semibold ${
                                isFav ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {item.variance_pct >= 0 ? '+' : ''}
                              {item.variance_pct.toFixed(1)}%
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  isFav
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {isFav ? 'FAVORABLE' : 'UNFAVORABLE'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Strategic Insights */}
              <div className="bg-gradient-to-br from-indigo-50/80 to-slate-50 p-5 rounded-2xl border border-indigo-100 text-xs text-slate-700 space-y-2">
                <div className="font-bold text-indigo-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Rekomendasi Manajerial & Solusi Deviasi
                </div>
                <p className="leading-relaxed">
                  {varianceData.is_favorable
                    ? 'Eksekusi SPK ini berjalan sangat efisien di bawah estimasi awal. Pastikan standar efisiensi ini dicatat sebagai acuan harga pokok produk pada penawaran (RFQ) berikutnya.'
                    : 'Terjadi pemborosan biaya melebihi anggaran awal. Periksa potensi scrap material pada stasiun kerja, lembur berlebih, atau selisih harga pembelian material terkini (Purchase Price Variance).'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
