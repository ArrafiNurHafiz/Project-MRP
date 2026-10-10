'use client';

import { useState, useEffect } from 'react';
import { apiFetch, OverheadAbsorption, getStoredUser } from '@/lib/api';
import { Zap, Plus, Search, CheckCircle2, DollarSign, Building, ArrowRight, ShieldCheck, AlertCircle, XCircle } from 'lucide-react';

export default function OverheadPage() {
  const [overheads, setOverheads] = useState<OverheadAbsorption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [periodMonth, setPeriodMonth] = useState('2026-09');
  const [electricityCost, setElectricityCost] = useState<number>(4500000);
  const [factoryRentCost, setFactoryRentCost] = useState<number>(6000000);
  const [depreciationCost, setDepreciationCost] = useState<number>(2500000);
  const [consumableCost, setConsumableCost] = useState<number>(1800000);
  const [totalProductionQty, setTotalProductionQty] = useState<number>(1250);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const res = await apiFetch<any>('/asian/overheads');
    if (res.success && res.data) setOverheads(res.data.overheads || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalOverhead = Number(electricityCost) + Number(factoryRentCost) + Number(depreciationCost) + Number(consumableCost);
  const estRate = totalProductionQty > 0 ? totalOverhead / totalProductionQty : 0;

  const handleCalculateOverhead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalProductionQty <= 0) {
      setError('Total kuantitas output produksi pabrik harus lebih dari 0');
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await apiFetch('/asian/overheads', {
      method: 'POST',
      body: JSON.stringify({
        period_month: periodMonth,
        electricity_cost: Number(electricityCost),
        factory_rent_cost: Number(factoryRentCost),
        depreciation_cost: Number(depreciationCost),
        consumable_cost: Number(consumableCost),
        total_production_qty: Number(totalProductionQty),
      }),
    });

    if (res.success) {
      setSuccess('Absorpsi biaya overhead pabrik berhasil dialokasikan!');
      setModalOpen(false);
      loadData();
    } else {
      setError(res.message || 'Gagal menghitung overhead');
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
              <Zap className="w-5 h-5" />
            </div>
            Factory Overhead Cost Absorption (Tarif Beban Pabrikasi)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standar Kledo Manufaktur &amp; Equine: Absorpsi tagihan listrik PLN pabrik, sewa gedung, depresiasi mesin &amp; consumables ke HPP per unit jadi.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/25 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Hitung Absorpsi Periode Baru
        </button>
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

      {/* Table */}
      <div className="berry-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
            <tr>
              <th className="p-4">Periode Bulan</th>
              <th className="p-4 text-right">Biaya Listrik PLN</th>
              <th className="p-4 text-right">Sewa &amp; Depresiasi</th>
              <th className="p-4 text-right">Bahan Pembantu</th>
              <th className="p-4 text-right">Total Overhead</th>
              <th className="p-4 text-center">Output Jadi</th>
              <th className="p-4 text-right font-extrabold text-amber-900">Tarif Overhead / Unit</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Memuat data absorpsi overhead...
                </td>
              </tr>
            ) : overheads.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Belum ada catatan absorpsi biaya overhead pabrik.
                </td>
              </tr>
            ) : (
              overheads.map((ov) => (
                <tr key={ov.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-bold text-slate-900 font-mono text-sm">{ov.period_month}</td>
                  <td className="p-4 text-right font-mono text-slate-700">
                    Rp {ov.electricity_cost.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-right font-mono text-slate-700">
                    Rp {(ov.factory_rent_cost + ov.depreciation_cost).toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-right font-mono text-slate-700">
                    Rp {ov.consumable_cost.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-slate-900">
                    Rp {ov.total_overhead_cost.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-center font-mono font-bold text-indigo-600">
                    {ov.total_production_qty.toLocaleString('id-ID')} pcs
                  </td>
                  <td className="p-4 text-right font-mono font-extrabold text-amber-700 text-sm">
                    Rp {Math.round(ov.overhead_rate_per_unit).toLocaleString('id-ID')} / pcs
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                      {ov.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Hitung Overhead */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                Alokasi &amp; Absorpsi Biaya Overhead Pabrik
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCalculateOverhead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Periode Bulan *</label>
                  <input
                    type="month"
                    required
                    value={periodMonth}
                    onChange={(e) => setPeriodMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Output Produksi (pcs) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalProductionQty}
                    onChange={(e) => setTotalProductionQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-center font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tagihan Listrik PLN Pabrik (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={electricityCost}
                    onChange={(e) => setElectricityCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Biaya Sewa Gedung Pabrik (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={factoryRentCost}
                    onChange={(e) => setFactoryRentCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Depresiasi Mesin &amp; Alat (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={depreciationCost}
                    onChange={(e) => setDepreciationCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bahan Pembantu / Consumable (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={consumableCost}
                    onChange={(e) => setConsumableCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Real-time Rate Card */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs font-bold text-amber-950">
                <span>Tarif Overhead Terkalkulasi:</span>
                <span className="text-base font-extrabold text-amber-800 font-mono">
                  Rp {Math.round(estRate).toLocaleString('id-ID')} / pcs
                </span>
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
                  {submitting ? 'Menyimpan...' : 'Simpan Alokasi Overhead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
