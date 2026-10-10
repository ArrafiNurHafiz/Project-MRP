'use client';

import { useState, useEffect } from 'react';
import {
  apiFetch,
  SalesOrder,
  Customer,
  Product,
  User,
  getStoredUser,
  publishSalesOrder,
} from '@/lib/api';
import { LifecycleStepper } from '@/components/LifecycleStepper';
import { MaterialAllocationPill } from '@/components/MaterialAllocationPill';
import { ShoppingCart, Plus, Send, CheckCircle2, ArrowRight, Search, Calendar, Layers, Clock, XCircle, Eye, FileText, Truck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

const ORDER_LIFECYCLE_STEPS = [
  { id: 'DRAFT', label: 'Draft', sublabel: 'Penjadwalan' },
  { id: 'PUBLISHED', label: 'Terbit (SPK)', sublabel: 'SPK Terbit Otomatis' },
  { id: 'IN_PROGRESS', label: 'Produksi', sublabel: 'Pengerjaan Stasiun' },
  { id: 'COMPLETED', label: 'Selesai', sublabel: 'Produk Jadi Siap Kirim' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [detailModalOrder, setDetailModalOrder] = useState<SalesOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState<number>(0);
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [plannedStart, setPlannedStart] = useState('');
  const [plannedEnd, setPlannedEnd] = useState('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState([
    { product_id: 0, item_name: '', description: '', qty: 50, unit: 'pcs', unit_price: 45000, discount_pct: 0 },
  ]);

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (statusFilter) query.set('status', statusFilter);

    const [oRes, cRes, pRes] = await Promise.all([
      apiFetch<any>(`/orders?${query.toString()}`),
      apiFetch<any>('/customers'),
      apiFetch<any>('/products'),
    ]);

    if (oRes.success && oRes.data) setOrders(oRes.data.orders || []);
    if (cRes.success && cRes.data) setCustomers(cRes.data.customers || []);
    if (pRes.success && pRes.data) setProducts(pRes.data.products || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0) {
      alert('Pilih pelanggan dan minimal satu produk');
      return;
    }

    const payload = {
      customer_id: Number(customerId),
      priority,
      planned_start: plannedStart ? new Date(plannedStart).toISOString() : undefined,
      planned_end: plannedEnd ? new Date(plannedEnd).toISOString() : undefined,
      remarks,
      items: items.map((it) => ({
        product_id: it.product_id ? Number(it.product_id) : undefined,
        item_name: it.item_name,
        qty: Number(it.qty),
        unit_price: Number(it.unit_price),
      })),
    };

    const res = await apiFetch<SalesOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      setModalOpen(false);
      loadData();
    } else {
      alert(res.message || 'Gagal membuat pesanan');
    }
  };

  const handleOpenPublish = (order: SalesOrder) => {
    setSelectedOrder(order);
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
    setPlannedStart(today);
    setPlannedEnd(nextWeek);
    setPublishModalOpen(true);
  };

  const handlePublishOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !plannedStart || !plannedEnd) {
      alert('Tanggal mulai dan selesai wajib diisi untuk menerbitkan pesanan');
      return;
    }

    const res = await publishSalesOrder(selectedOrder.id, {
      planned_start: new Date(plannedStart).toISOString(),
      planned_end: new Date(plannedEnd).toISOString(),
      priority: selectedOrder.priority,
    });

    if (res.success) {
      alert('Pesanan berhasil DITERBITKAN! Perintah Kerja (SPK 5 Stasiun) otomatis terbit untuk lantai produksi.');
      setPublishModalOpen(false);
      loadData();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
            Commercial Sales Orders (Pesanan Penjualan)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen pesanan terkonfirmasi, penjadwalan produksi (Master Production Schedule), dan penerbitan SPK otomatis.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Buat Pesanan Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="berry-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor pesanan (cth: SO-2026-09-1234)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
        >
          <option value="">Semua Status</option>
          <option value="DRAFT">DRAFT (Belum Diterbitkan)</option>
          <option value="PUBLISHED">PUBLISHED (Diterbitkan ke SPK)</option>
          <option value="IN_PROGRESS">IN_PROGRESS (Produksi Berjalan)</option>
          <option value="COMPLETED">COMPLETED (Selesai)</option>
        </select>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-all cursor-pointer"
        >
          Cari
        </button>
      </div>

      {/* Orders Table */}
      <div className="berry-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
            <tr>
              <th className="p-4">No. Pesanan</th>
              <th className="p-4">Pelanggan</th>
              <th className="p-4">Produk Pesanan</th>
              <th className="p-4 text-right">Nilai Pesanan</th>
              <th className="p-4">Jadwal Mulai - Selesai</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Alokasi Material (Katana)</th>
              <th className="p-4 text-right">Aksi Alur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Memuat data pesanan...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Belum ada pesanan penjualan aktif.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-blue-600">
                    <div>{o.order_number}</div>
                    {o.quotation && (
                      <div className="text-[10px] text-slate-400">Ref: {o.quotation.quote_number}</div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{o.customer?.name}</div>
                    <div className="text-[10px] text-slate-500">{o.customer?.phone || '-'}</div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {o.items?.map((it, idx) => (
                        <div key={idx} className="text-slate-700 font-medium">
                          • {it.product?.product_name || 'Produk'} <span className="text-blue-600 font-bold">({it.qty} pcs)</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-600 font-mono text-sm">
                    Rp {o.total_amount.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-slate-600">
                    {o.planned_start && o.planned_end ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        {new Date(o.planned_start).toLocaleDateString('id-ID')} - {new Date(o.planned_end).toLocaleDateString('id-ID')}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Belum dijadwalkan</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        o.status === 'PUBLISHED'
                          ? 'bg-blue-100 text-blue-800'
                          : o.status === 'IN_PROGRESS'
                          ? 'bg-purple-100 text-purple-800'
                          : o.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <MaterialAllocationPill
                      compact={true}
                      status={
                        o.status === 'COMPLETED' || o.status === 'PUBLISHED' || o.status === 'IN_PROGRESS'
                          ? 'IN_STOCK'
                          : 'EXPECTED'
                      }
                    />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setDetailModalOrder(o)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                        title="Lihat Detail Pesanan"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {o.status === 'DRAFT' && (
                        <button
                          onClick={() => handleOpenPublish(o)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Terbitkan Pesanan
                        </button>
                      )}
                      {o.status === 'PUBLISHED' && (
                        <Link
                          href="/dashboard/spk"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          Lihat SPK Produksi
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Pesanan */}
      {detailModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Detail Pesanan Penjualan: {detailModalOrder.order_number}
                </h2>
                <span className="text-[11px] text-slate-500">Status: {detailModalOrder.status}</span>
              </div>
              <button onClick={() => setDetailModalOrder(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Katana MRP Visual Lifecycle Stepper */}
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                Alur Tahapan Pesanan (Katana Lifecycle):
              </span>
              <LifecycleStepper
                steps={ORDER_LIFECYCLE_STEPS}
                currentStepId={detailModalOrder.status}
              />
            </div>

            {/* Katana MRP Material Status Banner */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Status Alokasi Bahan Baku:
                </span>
                <span className="text-xs text-slate-600">
                  Cek kesiapan material gudang untuk pesanan ini
                </span>
              </div>
              <MaterialAllocationPill
                status={
                  detailModalOrder.status === 'COMPLETED' ||
                  detailModalOrder.status === 'PUBLISHED' ||
                  detailModalOrder.status === 'IN_PROGRESS'
                    ? 'IN_STOCK'
                    : 'EXPECTED'
                }
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <b className="text-slate-900">{detailModalOrder.customer?.name}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tingkat Prioritas:</span>
                <span className="font-bold uppercase">{detailModalOrder.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jadwal Mulai - Selesai:</span>
                <span className="font-semibold text-slate-800">
                  {detailModalOrder.planned_start ? new Date(detailModalOrder.planned_start).toLocaleDateString('id-ID') : '-'} s.d.{' '}
                  {detailModalOrder.planned_end ? new Date(detailModalOrder.planned_end).toLocaleDateString('id-ID') : '-'}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Produk</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Harga Satuan</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailModalOrder.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-slate-900">{it.product?.product_name || 'Item Produk'}</td>
                      <td className="p-2.5 text-center font-bold">{it.qty} pcs</td>
                      <td className="p-2.5 text-right font-mono">Rp {it.unit_price.toLocaleString('id-ID')}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">Rp {it.total_price.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between font-extrabold text-sm text-indigo-950">
              <span>Total Nilai Pesanan:</span>
              <span className="font-mono text-indigo-700">Rp {detailModalOrder.total_amount.toLocaleString('id-ID')}</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailModalOrder(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Terbitkan Pesanan */}
      {publishModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl border border-slate-200">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                Terbitkan Pesanan: {selectedOrder.order_number}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tentukan target tanggal mulai dan selesai untuk secara otomatis menerbitkan Perintah Kerja (SPK 5 Stasiun) ke lantai produksi.
              </p>
            </div>

            <form onSubmit={handlePublishOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Mulai Produksi *</label>
                  <input
                    type="date"
                    value={plannedStart}
                    onChange={(e) => setPlannedStart(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Selesai / Deadline *</label>
                  <input
                    type="date"
                    value={plannedEnd}
                    onChange={(e) => setPlannedEnd(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed">
                ℹ️ Saat pesanan diterbitkan, sistem akan otomatis membuat Surat Perintah Kerja (SPK) dengan 5 tahapan stasiun (Wood Working, Pasca WW, Finishing, Pasca Finishing, Packing) untuk dieksekusi oleh tim produksi.
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPublishModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 cursor-pointer"
                >
                  Konfirmasi &amp; Terbitkan SPK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
