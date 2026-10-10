'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Package,
  ClipboardList,
  Truck,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ShoppingCart,
  Receipt,
  Boxes,
  Activity,
  PackageCheck,
  Calendar,
  Sparkles,
  Info,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import {
  apiFetch,
  User,
  WorkOrder,
  SalesOrder,
  MaterialRequest,
  getStoredUser,
} from '@/lib/api';

export default function DashboardOverviewPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // MRP Stats
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [matRequests, setMatRequests] = useState<MaterialRequest[]>([]);
  const [productsCount, setProductsCount] = useState(47);

  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);

    async function loadData() {
      try {
        const [oRes, wRes, mrRes, pRes] = await Promise.all([
          apiFetch<any>('/orders?limit=10'),
          apiFetch<any>('/spk?limit=10'),
          apiFetch<any>('/material-requests?limit=10'),
          apiFetch<any>('/products?limit=100'),
        ]);

        if (oRes.success && oRes.data) setOrders(oRes.data.orders || []);
        if (wRes.success && wRes.data) setWorkOrders(wRes.data.work_orders || []);
        if (mrRes.success && mrRes.data) setMatRequests(mrRes.data.requests || []);
        if (pRes.success && pRes.data) setProductsCount(pRes.data.total || (pRes.data.products?.length || 47));
      } catch (err) {
        console.error('Gagal memuat ringkasan dashboard', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Welcome & Greeting Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Pusat Kendali Operasional
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Selamat datang, {currentUser?.name || 'Rekan Pabrik'}!
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Kelola pesanan pelanggan, jadwal pengerjaan tukang, stok gudang, dan surat jalan pengiriman dalam satu layar praktis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-right">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Mode Tampilan</span>
            <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Operasional Harian
            </span>
          </div>
        </div>
      </div>

      {/* 2. Empat Aksi Cepat Utama (Quick Action Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Aksi Cepat Hari Ini
          </h2>
          <span className="text-xs text-slate-400">Pilih tindakan yang ingin Anda lakukan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Catat Pesanan */}
          <Link
            href="/dashboard/orders"
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                Langkah 1
              </span>
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                + Catat Pesanan Baru
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Input order masuk dari pelanggan</div>
            </div>
          </Link>

          {/* Action 2: Buat SPK */}
          <Link
            href="/dashboard/spk"
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                Langkah 2
              </span>
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                + Terbitkan SPK Pabrik
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Mulai perintah potong &amp; rakit</div>
            </div>
          </Link>

          {/* Action 3: Terima Bahan Vendor */}
          <Link
            href="/dashboard/goods-receipts"
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <PackageCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Gudang
              </span>
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                + Terima Barang Masuk
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Catat kiriman material vendor (GRN)</div>
            </div>
          </Link>

          {/* Action 4: Buat Surat Jalan */}
          <Link
            href="/dashboard/delivery-orders"
            className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                Pengiriman
              </span>
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
                + Buat Surat Jalan (DO)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Kirim produk jadi ke pelanggan</div>
            </div>
          </Link>
        </div>
      </div>

      {/* 3. Panduan Langkah Alur Kerja Digital (Friendly Visual Guide) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" />
              Panduan 4 Langkah Kerja Digitalisasi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Alur operasional yang urut dari penerimaan pesanan sampai pengiriman produk ke tangan pembeli.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">
                1
              </span>
              <span className="text-[11px] font-bold text-blue-600">Langkah Pertama</span>
            </div>
            <div className="font-bold text-xs text-slate-900">1. Catat Pesanan Masuk</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Input rincian produk yang dipesan oleh pelanggan dan tetapkan target tanggal kirim.
            </p>
            <Link
              href="/dashboard/orders"
              className="text-xs text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 pt-1"
            >
              Buka Pesanan <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center">
                2
              </span>
              <span className="text-[11px] font-bold text-indigo-600">Langkah Kedua</span>
            </div>
            <div className="font-bold text-xs text-slate-900">2. Siapkan Bahan di Gudang</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Sistem otomatis menghitung kebutuhan bahan baku (kayu, baut, finishing) sesuai resep BOM.
            </p>
            <Link
              href="/dashboard/material-requests"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 pt-1"
            >
              Cek Alokasi Bahan <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                3
              </span>
              <span className="text-[11px] font-bold text-amber-700">Langkah Ketiga</span>
            </div>
            <div className="font-bold text-xs text-slate-900">3. Kerjakan di Bengkel (SPK)</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Mandor/operator memproses pekerjaan di stasiun (Cutting, Assembly, Sanding, Finishing, Packing).
            </p>
            <Link
              href="/dashboard/spk"
              className="text-xs text-amber-600 hover:text-amber-800 font-bold inline-flex items-center gap-1 pt-1"
            >
              Buka SPK Produksi <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
                4
              </span>
              <span className="text-[11px] font-bold text-emerald-700">Langkah Selesai</span>
            </div>
            <div className="font-bold text-xs text-slate-900">4. Kirim &amp; Cetak Surat Jalan</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Barang jadi dimutasi ke gudang dan dicetak surat jalan pengiriman untuk supir/ekspedisi.
            </p>
            <Link
              href="/dashboard/delivery-orders"
              className="text-xs text-emerald-600 hover:text-emerald-800 font-bold inline-flex items-center gap-1 pt-1"
            >
              Kirim Pesanan <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Kondisi Operasional Hari Ini (Simple Status Numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{orders.length}</div>
            <div className="text-xs font-semibold text-slate-500">Pesanan Aktif</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{workOrders.length}</div>
            <div className="text-xs font-semibold text-slate-500">SPK Dikerjakan</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{matRequests.length}</div>
            <div className="text-xs font-semibold text-slate-500">Permintaan Bahan</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{productsCount}</div>
            <div className="text-xs font-semibold text-slate-500">Jenis Produk Terdaftar</div>
          </div>
        </div>
      </div>

      {/* 5. Daftar Pekerjaan Aktif (Friendly Activity Tables) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SPK Active Queue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Perintah Kerja (SPK) Berjalan</h3>
                <p className="text-[11px] text-slate-400">Instruksi kerja di lantai produksi saat ini</p>
              </div>
            </div>
            <Link
              href="/dashboard/spk"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Semua SPK <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {workOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada SPK terbit. Klik &quot;+ Terbitkan SPK Pabrik&quot; di atas untuk memulai.
              </div>
            ) : (
              workOrders.slice(0, 4).map((wo) => (
                <div
                  key={wo.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition"
                >
                  <div>
                    <span className="font-mono text-xs font-extrabold text-indigo-600 block">
                      {wo.spk_number}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {wo.product?.product_name || `Produk #${wo.product_id}`}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Jumlah: {wo.total_target_qty} unit
                    </span>
                  </div>
                  <div className="text-right space-y-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        wo.status === 'in_progress'
                          ? 'bg-indigo-100 text-indigo-700'
                          : wo.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {wo.status === 'in_progress'
                        ? 'Sedang Dikerjakan'
                        : wo.status === 'completed'
                        ? 'Selesai'
                        : 'Menunggu'}
                    </span>
                    <div>
                      <Link
                        href="/dashboard/spk"
                        className="text-[11px] font-bold text-indigo-600 hover:underline"
                      >
                        Perbarui &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Permintaan Material Gudang Queue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pengeluaran Bahan Baku Gudang</h3>
                <p className="text-[11px] text-slate-400">Bahan yang dialokasikan untuk kebutuhan SPK</p>
              </div>
            </div>
            <Link
              href="/dashboard/material-requests"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              Semua Bahan <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {matRequests.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada permintaan bahan dari SPK.
              </div>
            ) : (
              matRequests.slice(0, 4).map((mr) => (
                <div
                  key={mr.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition"
                >
                  <div>
                    <span className="font-mono text-xs font-extrabold text-emerald-700 block">
                      {mr.request_number}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Untuk SPK: {mr.work_order?.spk_number || '-'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Total item: {mr.items?.length || 0} macam bahan
                    </span>
                  </div>
                  <div className="text-right space-y-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        mr.status === 'ISSUED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : mr.status === 'AVAILABLE'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {mr.status === 'ISSUED'
                        ? 'Sudah Dikeluarkan'
                        : mr.status === 'AVAILABLE'
                        ? 'Siap Diambil'
                        : 'Cek Stok'}
                    </span>
                    <div>
                      <Link
                        href="/dashboard/material-requests"
                        className="text-[11px] font-bold text-emerald-700 hover:underline"
                      >
                        Serahkan Bahan &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
