'use client';

import { useState, useEffect } from 'react';
import {
  apiFetch,
  DeliveryOrder,
  SalesOrder,
  Warehouse,
  Customer,
  Product,
  getDeliveryOrders,
  createDeliveryOrder,
  shipDeliveryOrder,
  deliverDeliveryOrder,
  checkMTSAvailability,
  MTSAvailabilityResult,
} from '@/lib/api';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Calendar,
  Eye,
  XCircle,
  FileText,
  Printer,
  Package,
  Layers,
  Check,
} from 'lucide-react';

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalDO, setDetailModalDO] = useState<DeliveryOrder | null>(null);

  // MTS Check State
  const [mtsResult, setMtsResult] = useState<MTSAvailabilityResult | null>(null);
  const [mtsLoading, setMtsLoading] = useState(false);

  // Form State
  const [soId, setSoId] = useState<number>(0);
  const [whId, setWhId] = useState<number>(0);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [driverName, setDriverName] = useState('Bpk. Slamet Riyadi');
  const [vehiclePlate, setVehiclePlate] = useState('AD 8899 KW');
  const [expedition, setExpedition] = useState('Armada Truk Mandiri KWAS');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{
    sales_order_item_id?: number;
    product_id: number;
    ordered_qty: number;
    shipped_qty: number;
    notes: string;
  }>>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [doRes, soRes, whRes, cRes, pRes] = await Promise.all([
      getDeliveryOrders(search, statusFilter),
      apiFetch<any>('/orders'),
      apiFetch<any>('/warehouses'),
      apiFetch<any>('/customers'),
      apiFetch<any>('/products'),
    ]);

    if (doRes.success && doRes.data) setOrders(doRes.data.delivery_orders || []);
    if (soRes.success && soRes.data) setSalesOrders(soRes.data.sales_orders || []);
    if (whRes.success && whRes.data) setWarehouses(whRes.data.warehouses || []);
    if (cRes.success && cRes.data) setCustomers(cRes.data.customers || []);
    if (pRes.success && pRes.data) setProducts(pRes.data.products || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSelectSO = async (id: number) => {
    setSoId(id);
    const selected = salesOrders.find((s) => s.id === id);
    if (selected) {
      if (selected.customer) {
        setRecipientName(selected.customer.name);
        setShippingAddress(selected.customer.address || '');
      }

      if (selected.items) {
        setItems(
          selected.items.map((it) => ({
            sales_order_item_id: it.id,
            product_id: it.product_id,
            ordered_qty: it.qty,
            shipped_qty: it.qty,
            notes: 'Packing peti kayu pallet standar ekspor',
          }))
        );
      }

      // Jalankan pengecekan ketersediaan stok MTS
      setMtsLoading(true);
      const res = await checkMTSAvailability(id);
      if (res.success && res.data) {
        setMtsResult(res.data);
      }
      setMtsLoading(false);
    }
  };

  const handleCreateDO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soId || items.length === 0) {
      setError('Pilih Sales Order dan minimal satu produk yang dikirim');
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload = {
      sales_order_id: Number(soId),
      warehouse_id: whId ? Number(whId) : undefined,
      delivery_date: deliveryDate,
      driver_name: driverName,
      vehicle_plate: vehiclePlate,
      expedition,
      tracking_number: trackingNumber,
      recipient_name: recipientName,
      shipping_address: shippingAddress,
      notes,
      items: items.map((it) => ({
        sales_order_item_id: it.sales_order_item_id,
        product_id: Number(it.product_id),
        ordered_qty: Number(it.ordered_qty),
        shipped_qty: Number(it.shipped_qty),
        notes: it.notes,
      })),
    };

    const res = await createDeliveryOrder(payload);
    if (res.success) {
      setSuccess('Surat Jalan Pengiriman (DO) berhasil diterbitkan!');
      setModalOpen(false);
      loadData();
    } else {
      setError(res.message || 'Gagal menerbitkan Surat Jalan');
    }
    setSubmitting(false);
  };

  const handleShip = async (id: number) => {
    if (!confirm('Berangkatkan pengiriman ini? Stok barang jadi di gudang akan otomatis terpotong.')) return;
    const res = await shipDeliveryOrder(id);
    if (res.success) {
      setSuccess('Pengiriman telah diberangkatkan dan stok gudang terpotong.');
      loadData();
    } else {
      alert(res.message);
    }
  };

  const handleDeliver = async (id: number) => {
    if (!confirm('Tandai surat jalan ini sebagai selesai diterima oleh pelanggan?')) return;
    const res = await deliverDeliveryOrder(id);
    if (res.success) {
      setSuccess('Surat jalan telah ditandai selesai diterima pelanggan.');
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
              <Truck className="w-5 h-5" />
            </div>
            Customer Delivery Orders (Surat Jalan Pengiriman)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Surat jalan pengiriman produk jadi ke pelanggan, pengecekan ketersediaan stok Make-to-Stock (MTS), pemotongan stok gudang, dan tracking ekspedisi.
          </p>
        </div>
        <button
          onClick={() => {
            setModalOpen(true);
            setError(null);
            setMtsResult(null);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Terbitkan Surat Jalan (DO Baru)
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-600 font-bold hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="berry-card p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor Surat Jalan (DO), supir, plat nomor, nomor resi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="PACKED">Sedang Dipacking (PACKED)</option>
            <option value="SHIPPED">Dalam Perjalanan (SHIPPED)</option>
            <option value="DELIVERED">Diterima (DELIVERED)</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="berry-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">No. Surat Jalan (DO)</th>
                <th className="py-3 px-4">Sales Order</th>
                <th className="py-3 px-4">Pelanggan Penerima</th>
                <th className="py-3 px-4">Supir &amp; Kendaraan</th>
                <th className="py-3 px-4">Ekspedisi / Resi</th>
                <th className="py-3 px-4">Tanggal Kirim</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat data surat jalan...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada surat jalan pengiriman diterbitkan.
                  </td>
                </tr>
              ) : (
                orders.map((doItem) => (
                  <tr key={doItem.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{doItem.do_number}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{doItem.sales_order?.order_number || `#${doItem.sales_order_id}`}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{doItem.customer?.name || doItem.recipient_name}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{doItem.driver_name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{doItem.vehicle_plate}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{doItem.expedition || 'Mandiri'}</div>
                      {doItem.tracking_number && <div className="font-mono text-[10px] text-blue-600">{doItem.tracking_number}</div>}
                    </td>
                    <td className="py-3 px-4">
                      {doItem.delivery_date ? new Date(doItem.delivery_date).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        doItem.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : doItem.status === 'SHIPPED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {doItem.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailModalDO(doItem)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          title="Lihat Surat Jalan"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {doItem.status === 'PACKED' && (
                          <button
                            onClick={() => handleShip(doItem.id)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                          >
                            Kirim
                          </button>
                        )}
                        {doItem.status === 'SHIPPED' && (
                          <button
                            onClick={() => handleDeliver(doItem.id)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          >
                            Diterima
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Terbitkan DO Baru */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Terbitkan Surat Jalan Pengiriman (Delivery Order)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih Sales Order, periksa ketersediaan stok fisik di gudang, dan tentukan supir serta alamat tujuan.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDO} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Sales Order *</label>
                  <select
                    value={soId}
                    onChange={(e) => handleSelectSO(Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  >
                    <option value={0}>-- Pilih Sales Order --</option>
                    {salesOrders.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.order_number} - {s.customer?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gudang Pengeluaran</label>
                  <select
                    value={whId}
                    onChange={(e) => setWhId(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>-- Gudang Barang Jadi (Default) --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name} ({w.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Pengiriman</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* MTS Check Live Widget */}
              {mtsResult && (
                <div className={`p-4 rounded-xl border text-xs ${
                  mtsResult.all_items_ready
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold flex items-center gap-1.5">
                      <Package className="w-4 h-4" />
                      Status Ketersediaan Stok Make-to-Stock (MTS) di Gudang
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      mtsResult.all_items_ready ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {mtsResult.all_items_ready ? '100% Siap Kirim (In Stock)' : 'Stok Parsial / Butuh Produksi'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {mtsResult.items.map((it) => (
                      <div key={it.product_id} className="p-2.5 rounded-lg bg-white/80 border border-slate-200/60 flex items-center justify-between">
                        <div>
                          <span className="font-semibold block text-slate-800">{it.product_name}</span>
                          <span className="text-[11px] text-slate-500">
                            Pesan: {it.ordered_qty} pcs | Tersedia di Gudang: {it.available_qty} pcs
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          it.is_mts_ready ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {it.is_mts_ready ? 'Cukup' : `Kurang ${it.shortage_qty}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Driver & Expedition */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Supir / Kurir</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Plat Nomor Kendaraan</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ekspedisi / Pengangkut</label>
                  <input
                    type="text"
                    value={expedition}
                    onChange={(e) => setExpedition(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Recipient */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Penerima Pelanggan</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Pengiriman</label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Daftar Produk yang Dikirim
                  </h3>
                  <span className="text-[11px] text-slate-400">Total {items.length} item</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Produk</th>
                        <th className="py-2.5 px-3 w-28">Qty Dipesan</th>
                        <th className="py-2.5 px-3 w-32">Qty Dikirim (DO)</th>
                        <th className="py-2.5 px-3">Catatan Kemasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => {
                        const p = products.find((prod) => prod.id === it.product_id);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {p ? p.product_name : `Produk #${it.product_id}`}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">{it.ordered_qty} pcs</td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                value={it.shipped_qty}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const updated = [...items];
                                  updated[idx].shipped_qty = val;
                                  setItems(updated);
                                }}
                                className="w-24 px-2 py-1 text-xs border border-blue-300 rounded-lg font-bold text-blue-700 bg-blue-50/40"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={it.notes}
                                onChange={(e) => {
                                  const updated = [...items];
                                  updated[idx].notes = e.target.value;
                                  setItems(updated);
                                }}
                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg text-slate-800"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menerbitkan...' : 'Terbitkan Surat Jalan (Packing Siap)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail / Print Preview Modal */}
      {detailModalDO && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{detailModalDO.do_number}</span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  Surat Jalan Pengiriman Barang (Delivery Order)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Surat Jalan
                </button>
                <button onClick={() => setDetailModalDO(null)} className="p-2 text-slate-400 hover:text-slate-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sales Order</span>
                  <span className="font-mono font-bold text-slate-800">
                    {detailModalDO.sales_order?.order_number || `#${detailModalDO.sales_order_id}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Penerima</span>
                  <span className="font-semibold text-slate-800">{detailModalDO.recipient_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Supir &amp; Plat</span>
                  <span className="font-semibold text-slate-800">{detailModalDO.driver_name} ({detailModalDO.vehicle_plate})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-bold text-blue-700">{detailModalDO.status}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Alamat Tujuan Pengiriman</span>
                <span className="text-slate-700 mt-1 block">{detailModalDO.shipping_address || 'Alamat kantor/pabrik pelanggan'}</span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Item Barang yang Dikirim</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Nama Produk</th>
                        <th className="py-2.5 px-3 w-28">Qty Kirim</th>
                        <th className="py-2.5 px-3">Keterangan Kemasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailModalDO.items?.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{it.product?.product_name || `Produk #${it.product_id}`}</td>
                          <td className="py-2.5 px-3 font-bold text-blue-700">{it.shipped_qty} pcs</td>
                          <td className="py-2.5 px-3 text-slate-600">{it.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
