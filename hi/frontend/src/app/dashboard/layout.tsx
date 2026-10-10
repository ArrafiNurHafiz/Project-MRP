'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Package,
  Layers,
  ClipboardList,
  Truck,
  Bot,
  Boxes,
  Calculator,
  FileText,
  ShoppingCart,
  Receipt,
  Building2,
  ChevronRight,
  TrendingUp,
  Cpu,
  BarChart3,
  DollarSign,
  Settings,
  Wrench,
  RotateCcw,
  QrCode,
  Globe,
  GitPullRequest,
  Activity,
  RefreshCw,
  Scale,
  Zap,
  Warehouse,
  Search,
  Plus,
  ChevronDown,
  Building,
  Calendar,
  PackageCheck,
  Sparkles,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import {
  getStoredUser,
  clearToken,
  User,
  hasPermission,
  hasAnyRole,
  isSuperuser,
  getActiveTenant,
  setActiveTenant,
  AVAILABLE_ENTERPRISES,
  ActiveTenantContext,
} from '@/lib/api';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  permission?: string;
  roles?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTenant, setActiveTenantState] = useState<ActiveTenantContext>(AVAILABLE_ENTERPRISES[0]);
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Simple Mode for new digital users vs Advanced Mode for enterprise
  const [navMode, setNavMode] = useState<'simple' | 'advanced'>('simple');

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.push('/login');
    } else {
      setUser(u);
    }
    setActiveTenantState(getActiveTenant());

    const savedMode = localStorage.getItem('emtku_nav_mode');
    if (savedMode === 'advanced' || savedMode === 'simple') {
      setNavMode(savedMode);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  const handleSelectTenant = (ent: ActiveTenantContext) => {
    setActiveTenant(ent);
    setActiveTenantState(ent);
    setTenantDropdownOpen(false);
  };

  const handleToggleMode = (mode: 'simple' | 'advanced') => {
    setNavMode(mode);
    localStorage.setItem('emtku_nav_mode', mode);
  };

  const isItemVisible = (item: NavItem) => {
    if (!user) return false;
    if (isSuperuser(user)) return true;
    if (item.permission && hasPermission(user, item.permission)) return true;
    if (item.roles && hasAnyRole(user, item.roles)) return true;
    if (!item.permission && !item.roles) return true;
    return false;
  };

  // 1. SIMPLE MODE: Only core daily tasks for new digital users
  const navSimple: NavItem[] = [
    { href: '/dashboard', label: 'Beranda Harian', icon: LayoutDashboard },
    { href: '/dashboard/orders', label: 'Pesanan Pelanggan', icon: ShoppingCart, badge: 'Pesanan' },
    { href: '/dashboard/spk', label: 'Surat Perintah Kerja (SPK)', icon: Layers, badge: 'Pabrik' },
    { href: '/dashboard/shopfloor/kiosk', label: 'Mode Sentuh Operator', icon: Activity, badge: 'Tablet' },
    { href: '/dashboard/materials', label: 'Bahan Baku & Stok Gudang', icon: Boxes, badge: 'Gudang' },
    { href: '/dashboard/goods-receipts', label: 'Penerimaan Barang Vendor', icon: PackageCheck, badge: 'Masuk' },
    { href: '/dashboard/delivery-orders', label: 'Surat Jalan Pengiriman', icon: Truck, badge: 'Kirim' },
    { href: '/dashboard/products', label: 'Katalog Produk & Resep BOM', icon: Package, badge: 'Produk' },
    { href: '/dashboard/reports', label: 'Laporan Ringkasan', icon: BarChart3, badge: 'Laporan' },
  ];

  // 2. ADVANCED MODE: Complete enterprise capabilities grouped cleanly
  const navGroupsAdvanced: NavGroup[] = [
    {
      title: 'Perencanaan & Penjadwalan',
      items: [
        { href: '/dashboard', label: 'Beranda Operasional', icon: LayoutDashboard },
        { href: '/dashboard/order-simulation', label: 'Simulasi Pesanan & MRP', icon: Cpu, badge: 'Simulasi' },
        { href: '/dashboard/scheduling', label: 'Jadwal Visual & Gantt Chart', icon: Calendar, badge: 'Jadwal' },
      ],
    },
    {
      title: 'Penjualan & Pelanggan',
      items: [
        { href: '/dashboard/orders', label: 'Pesanan Penjualan', icon: ShoppingCart },
        { href: '/dashboard/quotes', label: 'Surat Penawaran Harga', icon: FileText },
        { href: '/dashboard/rfq', label: 'Permintaan Harga (RFQ)', icon: FileText, badge: 'CRM' },
        { href: '/dashboard/cpr', label: 'Pesanan Kustom Khusus (CPR)', icon: Wrench, badge: 'Desain' },
        { href: '/dashboard/invoices', label: 'Faktur & Tagihan Pembayaran', icon: Receipt },
        { href: '/dashboard/customers', label: 'Buku Kontak Pelanggan', icon: Building2 },
      ],
    },
    {
      title: 'Produksi & Lantai Kerja',
      items: [
        { href: '/dashboard/spk', label: 'Surat Perintah Kerja (SPK)', icon: Layers },
        { href: '/dashboard/shopfloor/kiosk', label: 'Mode Sentuh Layar Operator', icon: Activity, badge: 'Kiosk' },
        { href: '/dashboard/shopfloor', label: 'Pusat Pantau Lantai Kerja', icon: Activity },
        { href: '/dashboard/material-requests', label: 'Pengeluaran Bahan ke Pabrik', icon: ClipboardList, badge: 'Gudang' },
        { href: '/dashboard/cost-variance', label: 'Analisis Deviasi Biaya HPP', icon: TrendingUp, badge: 'HPP' },
        { href: '/dashboard/reworks', label: 'Perbaikan Barang Cacat', icon: RotateCcw, badge: 'Mutu' },
        { href: '/dashboard/downtimes', label: 'Catatan Mesin Macet & OEE', icon: Wrench, badge: 'OEE' },
        { href: '/dashboard/maintenance', label: 'Jadwal Servis Mesin', icon: Wrench },
        { href: '/dashboard/ecos', label: 'Perubahan Resep / Desain (ECO)', icon: GitPullRequest, badge: 'ECO' },
        { href: '/dashboard/unbuilds', label: 'Bongkar Produk / Retur', icon: RefreshCw },
        { href: '/dashboard/overhead', label: 'Biaya Operasional Pabrik', icon: Zap, badge: 'Overhead' },
        { href: '/dashboard/costing-payroll', label: 'Upah Tukang & Mitra Borongan', icon: Calculator },
      ],
    },
    {
      title: 'Gudang & Pengiriman',
      items: [
        { href: '/dashboard/materials', label: 'Bahan Baku & Stok Gudang', icon: Boxes },
        { href: '/dashboard/goods-receipts', label: 'Penerimaan Barang Vendor (GRN)', icon: PackageCheck, badge: 'Masuk' },
        { href: '/dashboard/delivery-orders', label: 'Surat Jalan Pengiriman (DO)', icon: Truck, badge: 'Kirim' },
        { href: '/dashboard/warehouses', label: 'Multi Gudang & Pindah Stok', icon: Warehouse, badge: 'Gudang' },
        { href: '/dashboard/batches', label: 'Pelacakan Batch & Tanggal Stok', icon: QrCode, badge: 'Trace' },
        { href: '/dashboard/purchase-orders', label: 'Pesanan Pembelian Bahan (PO)', icon: ShoppingCart },
        { href: '/dashboard/vendors', label: 'Daftar Vendor & Pemasok', icon: Building2 },
        { href: '/dashboard/landed-costs', label: 'Biaya Ongkir & Tambahan HPP', icon: Truck },
        { href: '/dashboard/subcontract-reconcile', label: 'Rekonsiliasi Maklon Luar', icon: Scale },
        { href: '/dashboard/qc', label: 'Pemeriksaan Mutu (QC)', icon: ClipboardList, permission: 'input inspeksi qc' },
        { href: '/dashboard/logistics', label: 'Armada Truk & Pengiriman', icon: Truck, permission: 'kelola mutasi logistik' },
        { href: '/dashboard/agent-parser', label: 'Asisten WhatsApp AI', icon: Bot, badge: 'AI' },
      ],
    },
    {
      title: 'Pengaturan & Master Data',
      items: [
        { href: '/dashboard/products', label: 'Katalog Master Produk & BOM', icon: Package },
        { href: '/dashboard/mitra-assignments', label: 'Spesialisasi Tukang / Mitra', icon: Users },
        { href: '/dashboard/reports', label: 'Laporan Laba & Analitik', icon: BarChart3, badge: 'Laporan' },
        { href: '/dashboard/company-settings', label: 'Profil Perusahaan & NPWP', icon: Settings },
        { href: '/dashboard/users', label: 'Manajemen Akun & Karyawan', icon: Users, permission: 'kelola pengguna' },
        { href: '/dashboard/roles', label: 'Hak Akses & Peran (RBAC)', icon: Shield, permission: 'kelola peran' },
        { href: '/dashboard/audit-logs', label: 'Riwayat Jejak Aktivitas', icon: History, permission: 'lihat catatan aktivitas' },
        { href: '/dashboard/tenants', label: 'Portal Multi-Tenant SaaS', icon: Globe, badge: 'SaaS' },
        { href: '/dashboard/saas-users', label: 'Pengguna Subdomain SaaS', icon: ShieldCheck, badge: 'Admin' },
        { href: '/dashboard/fx-management', label: 'Kurs Mata Uang Valas', icon: DollarSign },
      ],
    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Header Navbar */}
      <header className="h-[70px] bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Logo & Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-sm">
              EM
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">
                EMTKu <span className="text-indigo-600 font-bold text-xs uppercase bg-indigo-50 px-1.5 py-0.5 rounded-md">Manufaktur</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Sistem Operasional Pabrik &amp; Gudang</span>
            </div>
          </Link>

          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors cursor-pointer"
            title="Sembunyikan / Tampilkan Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Multi-Company / Tenant Context Switcher */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Building className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-800 leading-tight flex items-center gap-1.5">
                  <span className="truncate max-w-[170px]">{activeTenant.name}</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {activeTenant.company_code}
                  </span>
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">{activeTenant.plan}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {tenantDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                  Pilih Entitas Perusahaan
                </div>
                <div className="space-y-1">
                  {AVAILABLE_ENTERPRISES.map((ent) => (
                    <button
                      key={ent.id}
                      onClick={() => handleSelectTenant(ent)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        activeTenant.id === ent.id
                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{ent.name}</div>
                        <div className="text-[10px] text-slate-400">Kode: {ent.company_code} &bull; {ent.plan}</div>
                      </div>
                      {activeTenant.id === ent.id && <span className="text-indigo-600 font-bold">&check;</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-500 text-xs transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Cari menu atau fitur...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white rounded border border-slate-200 text-slate-500">
              Ctrl+K
            </kbd>
          </button>

          {/* Quick Action Button */}
          <div className="relative">
            <button
              onClick={() => setQuickActionOpen(!quickActionOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aksi Cepat</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {quickActionOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Buat Dokumen Baru
                </div>
                <Link
                  href="/dashboard/orders"
                  onClick={() => setQuickActionOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <ShoppingCart className="w-4 h-4 text-blue-500" />
                  <span>Pesanan Penjualan Baru</span>
                </Link>
                <Link
                  href="/dashboard/spk"
                  onClick={() => setQuickActionOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>Surat Perintah Kerja (SPK)</span>
                </Link>
                <Link
                  href="/dashboard/goods-receipts"
                  onClick={() => setQuickActionOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <PackageCheck className="w-4 h-4 text-emerald-500" />
                  <span>Penerimaan Barang Vendor</span>
                </Link>
                <Link
                  href="/dashboard/delivery-orders"
                  onClick={() => setQuickActionOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Truck className="w-4 h-4 text-purple-500" />
                  <span>Surat Jalan Pengiriman (DO)</span>
                </Link>
              </div>
            )}
          </div>

          {/* User Profile Capsule */}
          <div className="flex items-center gap-2 p-1.5 pl-3 bg-slate-100 rounded-full border border-slate-200">
            <span className="text-xs font-bold text-slate-800">{user.name}</span>
            <button
              onClick={handleLogout}
              title="Keluar"
              className="w-7 h-7 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Global Command Palette / Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-24 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <Search className="w-5 h-5 text-indigo-600" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama modul, fitur, atau kode transaksi..."
                className="w-full text-sm outline-hidden text-slate-800 placeholder-slate-400"
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {[
                { name: 'Beranda Harian & Ringkasan', path: '/dashboard', category: 'Operasional Harian', icon: LayoutDashboard },
                { name: 'Pesanan Pelanggan (Orders)', path: '/dashboard/orders', category: 'Penjualan', icon: ShoppingCart },
                { name: 'Surat Perintah Kerja (SPK)', path: '/dashboard/spk', category: 'Produksi', icon: Layers },
                { name: 'Mode Sentuh Operator Kiosk', path: '/dashboard/shopfloor/kiosk', category: 'Lantai Kerja', icon: Activity },
                { name: 'Bahan Baku & Stok Gudang', path: '/dashboard/materials', category: 'Gudang', icon: Boxes },
                { name: 'Penerimaan Barang Vendor (GRN)', path: '/dashboard/goods-receipts', category: 'Gudang', icon: PackageCheck },
                { name: 'Surat Jalan Pengiriman (DO)', path: '/dashboard/delivery-orders', category: 'Pengiriman', icon: Truck },
                { name: 'Katalog Produk & Resep BOM', path: '/dashboard/products', category: 'Master Data', icon: Package },
                { name: 'Jadwal Visual & Gantt Chart', path: '/dashboard/scheduling', category: 'Produksi', icon: Calendar },
                { name: 'Analisis Deviasi Biaya HPP', path: '/dashboard/cost-variance', category: 'Keuangan', icon: TrendingUp },
                { name: 'Surat Penawaran Harga', path: '/dashboard/quotes', category: 'Penjualan', icon: FileText },
                { name: 'Laporan Laba & Analitik', path: '/dashboard/reports', category: 'Laporan', icon: BarChart3 },
              ]
                .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setSearchModalOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-indigo-50/80 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-100 group-hover:text-indigo-600 flex items-center justify-center text-slate-500 transition-colors">
                          <ItemIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600">{item.name}</div>
                          <div className="text-[10px] text-slate-400">{item.category}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
                    </Link>
                  );
                })}
            </div>
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Tekan Esc untuk menutup</span>
              <span>Entitas aktif: <b className="text-slate-600">{activeTenant.company_code}</b></span>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Sidebar Container */}
        <aside
          className={`fixed md:sticky top-[70px] h-[calc(100vh-70px)] bg-white border-r border-slate-200 flex flex-col justify-between z-40 transition-all duration-300 overflow-y-auto ${
            sidebarOpen ? 'w-64' : 'w-0 md:w-0 overflow-hidden'
          } ${mobileOpen ? 'translate-x-0 !w-64' : '-translate-x-full md:translate-x-0'}`}
        >
          <div className="p-4 space-y-4">
            {/* View Mode Switcher: Harian (Mudah) vs Semua Modul (Lengkap) */}
            <div className="bg-slate-100/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
              <button
                onClick={() => handleToggleMode('simple')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center text-xs font-bold transition-all cursor-pointer ${
                  navMode === 'simple'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Harian (Mudah)
              </button>
              <button
                onClick={() => handleToggleMode('advanced')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center text-xs font-bold transition-all cursor-pointer ${
                  navMode === 'advanced'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua Modul
              </button>
            </div>

            {/* 1. SIMPLE MODE NAVIGATION */}
            {navMode === 'simple' ? (
              <div className="space-y-1">
                <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                  Alur Kerja Utama
                </div>
                {navSimple.filter(isItemVisible).map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* Switch to Advanced Button */}
                <div className="pt-4 border-t border-slate-100 mt-4">
                  <button
                    onClick={() => handleToggleMode('advanced')}
                    className="w-full text-center py-2 px-3 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Buka 25+ Fitur Lengkap &darr;</span>
                  </button>
                </div>
              </div>
            ) : (
              /* 2. ADVANCED MODE NAVIGATION */
              <div className="space-y-5">
                {navGroupsAdvanced.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                      {group.title}
                    </div>
                    {group.items.filter(isItemVisible).map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-indigo-50/70 hover:text-indigo-600'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="truncate max-w-[155px]">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}

                {/* Back to Simple Mode Button */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleMode('simple')}
                    className="w-full text-center py-2 px-3 rounded-xl bg-slate-50 text-slate-600 hover:text-indigo-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    &larr; Kembali ke Mode Harian
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Sidebar Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <div className="text-[11px] text-slate-600 leading-tight">
                <span className="font-bold text-slate-800 block">Sistem Siap Pakai</span>
                <span className="text-[10px] text-slate-400">Database SQLite Aktif</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Backdrop for Mobile */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/30 z-30 md:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
