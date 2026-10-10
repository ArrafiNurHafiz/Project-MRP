'use client';

import { useState, useEffect } from 'react';
import { apiFetch, CurrencyFX } from '@/lib/api';
import { DollarSign, Edit2, CheckCircle2, AlertCircle, Search, ArrowUpDown, Globe } from 'lucide-react';

export default function FXManagementPage() {
  const [currencies, setCurrencies] = useState<CurrencyFX[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyFX | null>(null);
  const [newRate, setNewRate] = useState<number>(1);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const res = await apiFetch<CurrencyFX[]>('/fx-currencies');
    if (res.success && res.data) {
      setCurrencies(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCurrency || newRate <= 0) return;
    setUpdating(true);
    setError(null);

    const res = await apiFetch(`/fx-currencies/${selectedCurrency.code}`, {
      method: 'PATCH',
      body: JSON.stringify({ rate: Number(newRate) }),
    });

    if (res.success) {
      setSuccess(`Kurs ${selectedCurrency.code} berhasil diperbarui!`);
      setSelectedCurrency(null);
      loadData();
    } else {
      setError(res.message || 'Gagal memperbarui kurs');
    }
    setUpdating(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            FX Management &amp; Multi-Currency Exchange Rates
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengaturan kurs valuta asing (USD, SGD, EUR) terhadap mata uang dasar (IDR) untuk konversi harga jual ekspor &amp; PO impor bahan baku.
          </p>
        </div>
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

      {/* Grid Currency Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {currencies.map((c) => (
          <div key={c.id} className="berry-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-600 block">{c.code}</span>
                  <h3 className="text-sm font-extrabold text-slate-900">{c.name}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-sm flex items-center justify-center">
                  {c.symbol}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] text-slate-500 block">Nilai Tukar Dasar:</span>
                <div className="font-mono text-lg font-extrabold text-slate-900">
                  1 {c.code} = Rp {c.exchange_rate.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedCurrency(c);
                setNewRate(c.exchange_rate);
              }}
              className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Perbarui Nilai Kurs
            </button>
          </div>
        ))}
      </div>

      {/* Modal Edit Kurs */}
      {selectedCurrency && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-indigo-600" />
                Perbarui Kurs: {selectedCurrency.name} ({selectedCurrency.code})
              </h2>
              <button onClick={() => setSelectedCurrency(null)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateRate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nilai Kurs terhadap IDR (Rupiah) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0.01}
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-base font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCurrency(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25"
                >
                  {updating ? 'Menyimpan...' : 'Simpan Kurs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
