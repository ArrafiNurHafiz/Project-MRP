'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  MessageSquare,
  Users,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Layers,
  Box,
  BarChart3,
  Globe,
  Building2,
  DollarSign,
  Zap,
  Check,
} from 'lucide-react';
import { apiFetch, SaaSPlanInfo } from '@/lib/api';

export default function HomePage() {
  const [plans, setPlans] = useState<SaaSPlanInfo[]>([]);

  useEffect(() => {
    async function loadPlans() {
      const res = await apiFetch<SaaSPlanInfo[]>('/saas/plans');
      if (res.success && res.data) {
        setPlans(res.data);
      }
    }
    loadPlans();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#eef2f6] text-slate-800 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[74px] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-extrabold text-white text-xl shadow-md shadow-indigo-500/25">
              EM
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-none">
                EMTKu <span className="text-indigo-600 font-bold text-xs uppercase bg-indigo-50 px-1.5 py-0.5 rounded-md">MRP</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">Enterprise Multi-Tenant SaaS Platform</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="#pricing"
              className="text-xs font-bold text-slate-600 hover:text-indigo-600 px-3 py-2 transition-colors hidden sm:block"
            >
              Paket Harga
            </Link>
            <Link
              href="/aktivasi"
              className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              Aktivasi WhatsApp
            </Link>
            <Link
              href="/login"
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/25 flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              Masuk Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-16 max-w-6xl mx-auto text-center space-y-16">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/70 border border-indigo-200 text-indigo-800 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Platform SaaS Manufaktur &amp; MRP Multi-Perusahaan Siap Jual
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Software MRP &amp; ERP Pabrik Terpadu untuk Ratusan Perusahaan
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Solusi cloud lengkap untuk mengelola Penjualan, Simulasi BOM Explosion, SPK 5 Stasiun Kerja, Inspeksi QC, Downtime Mesin OEE, serta Alokasi Bahan Baku &amp; Borongan Mitra.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              Coba Demo Sistem Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/tenants"
              className="px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Globe className="w-4 h-4 text-indigo-600" />
              Portal Klien Multi-Tenant
            </Link>
          </div>
        </div>

        {/* 3 Value Proposition Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="berry-card p-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-2">Multi-Tenant &amp; White-label</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Setiap perusahaan klien mendapatkan subdomain unik, kuota pengguna terisolasi, dan konfigurasi profil perusahaan sendiri.
            </p>
          </div>

          <div className="berry-card p-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
              <Cpu className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-2">Simulasi &amp; BOM Explosion</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Kalkulasi kebutuhan bahan baku dan kapasitas stasiun kerja otomatis sebelum pesanan disetujui untuk mencegah shortage.
            </p>
          </div>

          <div className="berry-card p-6">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-2">OEE, Rework &amp; Batch FIFO</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pencatatan downtime mesin pabrik, loop perbaikan cacat kualitas (jamur/belang), serta pelacakan nomor lot kayu dan kadar air.
            </p>
          </div>
        </div>

        {/* SaaS Pricing Plans Section */}
        <div id="pricing" className="w-full space-y-8 pt-8">
          <div>
            <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-md">
              Paket Langganan B2B
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Pilihan Paket Langganan Software MRP
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">
              Skalakan sistem manajemen manufaktur sesuai dengan kapasitas pabrik dan jumlah stasiun kerja Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 text-left">
            {plans.map((p, idx) => (
              <div
                key={idx}
                className={`berry-card p-6 flex flex-col justify-between relative ${
                  p.tier === 'PROFESSIONAL' ? 'border-2 border-indigo-500 shadow-xl' : ''
                }`}
              >
                {p.tier === 'PROFESSIONAL' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase">
                    Paling Populer
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">{p.tier}</span>
                    <h3 className="text-base font-extrabold text-slate-900">{p.name}</h3>
                  </div>

                  <div className="pb-4 border-b border-slate-100">
                    <div className="text-2xl font-extrabold font-mono text-slate-900">
                      {p.price_idr_per_month > 0 ? `Rp ${p.price_idr_per_month.toLocaleString('id-ID')}` : 'Rp 0'}
                    </div>
                    <span className="text-[11px] text-slate-500">per bulan / perusahaan</span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div>• Maks. <b>{p.max_users} Pengguna</b></div>
                    <div>• Maks. <b>{p.max_orders_per_month} Pesanan / bln</b></div>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    {p.features.map((f, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span className="text-[11px]">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Link
                    href="/dashboard/tenants"
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      p.tier === 'PROFESSIONAL'
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    Pilih Paket Ini
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 space-y-2">
        <div className="font-extrabold text-slate-800 text-sm">EMTKu MRP SaaS Platform</div>
        <p>© 2026 PT EMTKu Manufaktur Digital Indonesia. All rights reserved.</p>
      </footer>
    </div>
  );
}
