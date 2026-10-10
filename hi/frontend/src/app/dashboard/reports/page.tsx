'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { BarChart3, TrendingUp, DollarSign, Package, Layers, ShoppingCart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const [finReport, setFinReport] = useState<any>(null);
  const [invReport, setInvReport] = useState<any>(null);
  const [funnelReport, setFunnelReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      const [fRes, iRes, sRes] = await Promise.all([
        apiFetch<any>('/reports/financial'),
        apiFetch<any>('/reports/inventory'),
        apiFetch<any>('/reports/sales-funnel'),
      ]);

      if (fRes.success && fRes.data) setFinReport(fRes.data);
      if (iRes.success && iRes.data) setInvReport(iRes.data);
      if (sRes.success && sRes.data) setFunnelReport(sRes.data);
      setLoading(false);
    }
    loadReports();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            Executive Business Intelligence &amp; Analytics Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Laporan terpadu performa finansial, konversi sales funnel, serta valuasi aset dan inventaris bahan baku MRP.
          </p>
        </div>
      </div>

      {/* Grid Reports (3 Sections) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Financial Executive Summary */}
        <div className="berry-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">1. Ringkasan Finansial &amp; Piutang</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Total Omset Pesanan Terkonfirmasi:</span>
              <span className="text-lg font-extrabold font-mono text-indigo-700">
                Rp {(finReport?.total_revenue || 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Total Pembayaran Masuk (Cash In):</span>
              <span className="text-base font-extrabold font-mono text-emerald-600">
                Rp {(finReport?.total_paid || 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Sisa Piutang Berjalan (AR Outstanding):</span>
              <span className="text-base font-extrabold font-mono text-amber-600">
                Rp {(finReport?.total_receivables || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Sales Funnel Conversion */}
        <div className="berry-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">2. Sales Funnel Conversion</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
              <div className="flex justify-between font-bold text-indigo-950">
                <span>Rasio RFQ ke Penawaran:</span>
                <span className="font-mono">{(funnelReport?.rfq_to_quote_pct || 100).toFixed(1)}%</span>
              </div>
              <p className="text-[10px] text-indigo-700">Permintaan harga yang berhasil diproses tim sales</p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
              <div className="flex justify-between font-bold text-blue-950">
                <span>Rasio Penawaran ke Order (Win Rate):</span>
                <span className="font-mono">{(funnelReport?.quote_to_so_pct || 85).toFixed(1)}%</span>
              </div>
              <p className="text-[10px] text-blue-700">Surat penawaran yang disetujui (ACC) menjadi pesanan</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Total Surat Penawaran:</span>
                <b className="text-slate-900 font-mono">{funnelReport?.total_quotes || 0} Quotes</b>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Perintah Kerja (SPK):</span>
                <b className="text-slate-900 font-mono">{funnelReport?.total_work_orders || 0} SPK</b>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Inventory Valuation & Stock Health */}
        <div className="berry-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Package className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900">3. Valuasi Inventaris &amp; Stok</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Total Nilai Aset Bahan Baku:</span>
              <span className="text-lg font-extrabold font-mono text-slate-900">
                Rp {(invReport?.total_valuation || 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-slate-500 block">Peringatan Stok Menipis:</span>
                <span className="text-xs text-slate-400">Material dibawah batas minimum</span>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-extrabold text-sm font-mono">
                {invReport?.low_stock_count || 0} Item
              </span>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard/materials"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Lihat Detail Inventaris Bahan <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
