'use client';

import { useState, useEffect } from 'react';
import {
  Calculator,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Percent,
  UserCheck,
  Building,
  Tag,
  ArrowRight,
} from 'lucide-react';
import {
  apiFetch,
  Product,
  ProductCostCalculation,
  MitraPayrollSummary,
  User as UserType,
  getStoredUser,
  hasPermission,
  isSuperuser,
  hasRole,
} from '@/lib/api';

export default function CostingPayrollPage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [calculation, setCalculation] = useState<ProductCostCalculation | null>(null);
  const [payrolls, setPayrolls] = useState<MitraPayrollSummary[]>([]);

  const [activeTab, setActiveTab] = useState<'hpp' | 'payroll'>('hpp');
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const fetchProductsAndPayroll = async () => {
    try {
      const [prodRes, payrollRes] = await Promise.all([
        apiFetch<{ products: Product[] }>('/products?limit=100'),
        apiFetch<MitraPayrollSummary[]>('/finance/mitra-payroll'),
      ]);

      if (prodRes.success && prodRes.data) {
        const pList = prodRes.data.products || [];
        setProducts(pList);
        if (pList.length > 0) {
          setSelectedProductId(pList[0].id);
          fetchHPPCalculation(pList[0].id);
        }
      }
      if (payrollRes.success && payrollRes.data) {
        setPayrolls(payrollRes.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHPPCalculation = async (prodId: number) => {
    if (!prodId) return;
    setCalculating(true);
    try {
      const res = await apiFetch<ProductCostCalculation>(`/products/${prodId}/hpp-calc`);
      if (res.success && res.data) {
        setCalculation(res.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    fetchProductsAndPayroll();
  }, []);

  const handleSelectProduct = (prodId: number) => {
    setSelectedProductId(prodId);
    fetchHPPCalculation(prodId);
  };

  // Total payroll sum
  const totalPayrollAllMitra = payrolls.reduce((acc, p) => acc + p.total_payout, 0);
  const totalPcsProduced = payrolls.reduce((acc, p) => acc + p.total_pass_qty, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Calculator className="w-5 h-5" />
            </div>
            Kalkulasi HPP &amp; Borongan Pengrajin
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Engine kalkulasi biaya produksi real-time berbasis konsumsi BOM material + ongkos kerja stasiun &amp; tagihan borongan mitra.
          </p>
        </div>

        {/* Tab Navigation Pill */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('hpp')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hpp'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kalkulator HPP Produk
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'payroll'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rekap Tagihan Borongan Mitra
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: KALKULASI HPP BERSIH PRODUK */}
      {activeTab === 'hpp' && (
        <div className="space-y-6">
          {/* Select Product Filter */}
          <div className="berry-card p-5 space-y-3">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Pilih Produk Kitchenware untuk Simulasi HPP
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={selectedProductId}
                onChange={(e) => handleSelectProduct(Number(e.target.value))}
                className="sm:col-span-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs focus:outline-none focus:border-indigo-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.product_name} ({p.product_code})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Margin Retail Ideal:</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                  35% - 45%
                </span>
              </div>
            </div>
          </div>

          {calculating ? (
            <div className="berry-card py-16 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              Menghitung kalkulasi HPP produk...
            </div>
          ) : !calculation ? (
            <div className="berry-card p-12 text-center text-slate-400">
              Pilih produk untuk melihat struktur rincian HPP.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: BOM Materials Breakdown (7 cols) */}
              <div className="lg:col-span-7 berry-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      1. Komposisi Bahan Baku (BOM)
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-700">
                    Subtotal: Rp {calculation.total_material_cost.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-extrabold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Bahan Baku</th>
                        <th className="py-2.5 px-3">Kuantitas</th>
                        <th className="py-2.5 px-3">Harga Beli</th>
                        <th className="py-2.5 px-3 text-right">Subtotal Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {calculation.materials_breakdown.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400">
                            Belum ada resep BOM untuk produk ini.
                          </td>
                        </tr>
                      ) : (
                        calculation.materials_breakdown.map((m: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {m.material_name}
                              <span className="block text-[10px] text-slate-400 uppercase">{m.category}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700 font-medium">
                              {m.quantity} {m.unit}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">
                              Rp {(m.unit_cost || m.unitCost || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 text-right">
                              Rp {m.subtotal.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Labor & Routing Station Costs (5 cols) */}
              <div className="lg:col-span-5 berry-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      2. Biaya Jasa &amp; Stasiun Kerja
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-700">
                    Subtotal: Rp {calculation.total_labor_cost.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(calculation.labor_breakdown || (calculation as any).laborBreakdown || []).map((l: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{l.station_name || l.stationName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className={`px-2 py-0.2 rounded text-[9px] font-extrabold ${
                            l.assigned_type === 'mitra'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {l.assigned_type === 'mitra' ? 'Mitra Borongan' : 'In-House Pabrik'}
                          </span>
                          <span>• {l.worker_name || l.workerName}</span>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-indigo-600 text-sm">
                        Rp {l.fee_per_unit.toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* HPP Summary Card */}
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Bahan Baku (BOM):</span>
                    <span className="font-mono font-bold text-slate-800">Rp {calculation.total_material_cost.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Jasa (Stasiun 1 s.d. 5):</span>
                    <span className="font-mono font-bold text-slate-800">Rp {calculation.total_labor_cost.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="pt-2 border-t border-indigo-200/80 flex justify-between font-extrabold text-sm">
                    <span className="text-indigo-950">HPP Bersih / Unit:</span>
                    <span className="font-mono text-indigo-700 text-base">Rp {calculation.total_hpp_per_unit.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REKAPITULASI TAGIHAN BORONGAN MITRA */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="berry-card p-5">
              <div className="text-xs text-slate-500 font-bold uppercase">Total Tagihan Borongan</div>
              <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-2">
                Rp {totalPayrollAllMitra.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Akumulasi seluruh mitra aktif</div>
            </div>

            <div className="berry-card p-5">
              <div className="text-xs text-slate-500 font-bold uppercase">Total Produk Selesai (Pass)</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
                {totalPcsProduced.toLocaleString('id-ID')} Pcs
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Telah lolos verifikasi QC</div>
            </div>

            <div className="berry-card p-5">
              <div className="text-xs text-slate-500 font-bold uppercase">Jumlah Pengrajin Mitra</div>
              <div className="text-2xl font-extrabold text-indigo-600 mt-2 font-mono">
                {payrolls.length} Bengkel
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Terdaftar di Stasiun 1 s.d. 3</div>
            </div>
          </div>

          {/* Payroll Cards per Mitra */}
          <div className="space-y-4">
            {payrolls.length === 0 ? (
              <div className="berry-card p-12 text-center text-slate-400">
                Belum ada tagihan borongan mitra yang tercatat.
              </div>
            ) : (
              payrolls.map((p) => (
                <div
                  key={p.mitra_id}
                  className="berry-card p-6 space-y-4 hover:border-indigo-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-base font-extrabold text-slate-900">{p.mitra_name}</h3>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        WhatsApp: {p.phone}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Total Tagihan Siap Bayar</div>
                      <div className="text-2xl font-mono font-extrabold text-emerald-600">
                        Rp {p.total_payout.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Total Output: <b className="text-slate-800">{p.total_pass_qty} pcs</b>
                      </div>
                    </div>
                  </div>

                  {/* SPK Breakdown Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] uppercase font-extrabold text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">No. SPK</th>
                          <th className="py-2.5 px-3">Produk</th>
                          <th className="py-2.5 px-3">Stasiun Kerja</th>
                          <th className="py-2.5 px-3 text-right">Qty Pass</th>
                          <th className="py-2.5 px-3 text-right">Tarif / Pcs</th>
                          <th className="py-2.5 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {p.spk_breakdown.map((s: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{s.spk_number}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{s.product_name}</td>
                            <td className="py-2.5 px-3 text-slate-600">{s.station_name}</td>
                            <td className="py-2.5 px-3 font-mono text-right font-bold text-emerald-600">{s.pass_qty} pcs</td>
                            <td className="py-2.5 px-3 font-mono text-right text-slate-500">Rp {s.rate_per_pcs.toLocaleString('id-ID')}</td>
                            <td className="py-2.5 px-3 font-mono text-right font-extrabold text-slate-900">Rp {s.total_subtotal.toLocaleString('id-ID')}</td>
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
      )}
    </div>
  );
}
