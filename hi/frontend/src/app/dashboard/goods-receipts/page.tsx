'use client';

import { useState, useEffect } from 'react';
import {
  apiFetch,
  GoodsReceipt,
  PurchaseOrder,
  Warehouse,
  Vendor,
  Material,
  getGoodsReceipts,
  createGoodsReceipt,
  confirmGoodsReceipt,
} from '@/lib/api';
import {
  PackageCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Calendar,
  Truck,
  ShieldCheck,
  Eye,
  XCircle,
  FileText,
  BadgeCheck,
} from 'lucide-react';

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalReceipt, setDetailModalReceipt] = useState<GoodsReceipt | null>(null);

  // Form State
  const [poId, setPoId] = useState<number>(0);
  const [whId, setWhId] = useState<number>(0);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{
    purchase_order_item_id?: number;
    material_id: number;
    ordered_qty: number;
    received_qty: number;
    accepted_qty: number;
    rejected_qty: number;
    unit_cost: number;
    batch_lot_number: string;
    moisture_content: number;
    qc_status: string;
    wood_origin: string;
    notes: string;
  }>>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [grRes, poRes, whRes, vRes, mRes] = await Promise.all([
      getGoodsReceipts(search, statusFilter),
      apiFetch<any>('/purchase-orders'),
      apiFetch<any>('/warehouses'),
      apiFetch<any>('/vendors'),
      apiFetch<any>('/materials'),
    ]);

    if (grRes.success && grRes.data) setReceipts(grRes.data.goods_receipts || []);
    if (poRes.success && poRes.data) setPurchaseOrders(poRes.data.purchase_orders || []);
    if (whRes.success && whRes.data) setWarehouses(whRes.data.warehouses || []);
    if (vRes.success && vRes.data) setVendors(vRes.data.vendors || []);
    if (mRes.success && mRes.data) setMaterials(mRes.data.materials || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // When PO is selected, populate items from PO
  const handleSelectPO = (id: number) => {
    setPoId(id);
    const selected = purchaseOrders.find((p) => p.id === id);
    if (selected && selected.items) {
      setItems(
        selected.items.map((it) => ({
          purchase_order_item_id: it.id,
          material_id: it.material_id,
          ordered_qty: it.qty,
          received_qty: it.qty,
          accepted_qty: it.qty,
          rejected_qty: 0,
          unit_cost: it.unit_cost,
          batch_lot_number: `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          moisture_content: 12.0,
          qc_status: 'PASSED',
          wood_origin: 'Perhutani SVLK Bersertifikat',
          notes: 'Mutu fisik sesuai spesifikasi',
        }))
      );
    }
  };

  const handleCreateGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || items.length === 0) {
      setError('Pilih Purchase Order dan pastikan minimal satu material diterima');
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload = {
      purchase_order_id: Number(poId),
      warehouse_id: whId ? Number(whId) : undefined,
      received_date: receivedDate,
      vendor_delivery_note: deliveryNote,
      notes,
      items: items.map((it) => ({
        purchase_order_item_id: it.purchase_order_item_id,
        material_id: Number(it.material_id),
        ordered_qty: Number(it.ordered_qty),
        received_qty: Number(it.received_qty),
        accepted_qty: Number(it.accepted_qty),
        rejected_qty: Number(it.rejected_qty),
        unit_cost: Number(it.unit_cost),
        batch_lot_number: it.batch_lot_number,
        moisture_content: Number(it.moisture_content),
        qc_status: it.qc_status,
        wood_origin: it.wood_origin,
        notes: it.notes,
      })),
    };

    const res = await createGoodsReceipt(payload);
    if (res.success) {
      setSuccess('Bukti Penerimaan Barang (GRN) berhasil diterbitkan & stok lot terdaftar!');
      setModalOpen(false);
      loadData();
    } else {
      setError(res.message || 'Gagal menerbitkan GRN');
    }
    setSubmitting(false);
  };

  const handleConfirm = async (id: number) => {
    if (!confirm('Konfirmasi penerimaan barang ini sebagai valid dan selesai?')) return;
    const res = await confirmGoodsReceipt(id);
    if (res.success) {
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
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <PackageCheck className="w-5 h-5" />
            </div>
            Inbound Goods Receipt Notes (GRN)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penerimaan barang fisik dari Purchase Order vendor, inspeksi mutu masuk (IQC), pencatatan Batch/Lot FIFO, dan auto-alokasi ke SPK.
          </p>
        </div>
        <button
          onClick={() => {
            setModalOpen(true);
            setError(null);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Terima Barang dari PO (GRN Baru)
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
            placeholder="Cari nomor GRN, nomor surat jalan vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Semua Status</option>
            <option value="RECEIVED">Diterima (RECEIVED)</option>
            <option value="CONFIRMED">Dikonfirmasi (CONFIRMED)</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="berry-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">No. Bukti GRN</th>
                <th className="py-3 px-4">Referensi PO</th>
                <th className="py-3 px-4">Vendor Supplier</th>
                <th className="py-3 px-4">Gudang Tujuan</th>
                <th className="py-3 px-4">Tanggal Terima</th>
                <th className="py-3 px-4">SJ Vendor</th>
                <th className="py-3 px-4">Status Mutu</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat data penerimaan barang...
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada bukti penerimaan barang tercatat.
                  </td>
                </tr>
              ) : (
                receipts.map((gr) => (
                  <tr key={gr.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">{gr.receipt_number}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{gr.purchase_order?.po_number || `#${gr.purchase_order_id}`}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{gr.vendor?.name || '-'}</td>
                    <td className="py-3 px-4">{gr.warehouse?.name || 'Gudang Utama'}</td>
                    <td className="py-3 px-4">
                      {gr.received_date ? new Date(gr.received_date).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{gr.vendor_delivery_note || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        gr.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}>
                        {gr.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailModalReceipt(gr)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          title="Lihat Detail & Lot"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {gr.status !== 'CONFIRMED' && (
                          <button
                            onClick={() => handleConfirm(gr.id)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
                          >
                            Konfirmasi
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

      {/* Modal Buat GRN Baru */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-teal-600" />
                  Penerimaan Barang Fisik (Goods Receipt Note)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verifikasi barang tiba dari supplier, catat nomor lot/batch, dan periksa mutu kadar air / cacat.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGRN} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Purchase Order (PO) *</label>
                  <select
                    value={poId}
                    onChange={(e) => handleSelectPO(Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  >
                    <option value={0}>-- Pilih PO Vendor --</option>
                    {purchaseOrders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.po_number} - {p.vendor?.name} (Total Rp {p.total_amount?.toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gudang Penerima</label>
                  <select
                    value={whId}
                    onChange={(e) => setWhId(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={0}>-- Gudang Default (Bahan Baku) --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name} ({w.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Surat Jalan Vendor</label>
                  <input
                    type="text"
                    placeholder="Contoh: SJ-VENDOR-2026-99"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Item Material &amp; Inspeksi Mutu Masuk (IQC)
                  </h3>
                  <span className="text-[11px] text-slate-400">Total {items.length} item</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Material</th>
                        <th className="py-2.5 px-3 w-20">Pesan</th>
                        <th className="py-2.5 px-3 w-24">Terima</th>
                        <th className="py-2.5 px-3 w-24">Lolos QC</th>
                        <th className="py-2.5 px-3 w-20">Reject</th>
                        <th className="py-2.5 px-3">No. Batch/Lot</th>
                        <th className="py-2.5 px-3 w-24">Kadar Air %</th>
                        <th className="py-2.5 px-3">Status QC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => {
                        const m = materials.find((mat) => mat.id === it.material_id);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {m ? m.name : `Material #${it.material_id}`}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">{it.ordered_qty}</td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                value={it.received_qty}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const updated = [...items];
                                  updated[idx].received_qty = val;
                                  updated[idx].accepted_qty = val - updated[idx].rejected_qty;
                                  setItems(updated);
                                }}
                                className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg text-slate-800"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                value={it.accepted_qty}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const updated = [...items];
                                  updated[idx].accepted_qty = val;
                                  updated[idx].rejected_qty = updated[idx].received_qty - val;
                                  setItems(updated);
                                }}
                                className="w-20 px-2 py-1 text-xs border border-emerald-300 rounded-lg font-bold text-emerald-700 bg-emerald-50/40"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                value={it.rejected_qty}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const updated = [...items];
                                  updated[idx].rejected_qty = val;
                                  updated[idx].accepted_qty = updated[idx].received_qty - val;
                                  setItems(updated);
                                }}
                                className="w-16 px-2 py-1 text-xs border border-rose-200 rounded-lg text-rose-600 bg-rose-50/40"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={it.batch_lot_number}
                                onChange={(e) => {
                                  const updated = [...items];
                                  updated[idx].batch_lot_number = e.target.value;
                                  setItems(updated);
                                }}
                                className="w-36 px-2 py-1 text-[11px] font-mono border border-slate-200 rounded-lg text-slate-800"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                step="0.1"
                                value={it.moisture_content}
                                onChange={(e) => {
                                  const updated = [...items];
                                  updated[idx].moisture_content = Number(e.target.value);
                                  setItems(updated);
                                }}
                                className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg text-slate-800"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <select
                                value={it.qc_status}
                                onChange={(e) => {
                                  const updated = [...items];
                                  updated[idx].qc_status = e.target.value;
                                  setItems(updated);
                                }}
                                className="px-2 py-1 text-[11px] font-bold border border-slate-200 rounded-lg text-slate-700"
                              >
                                <option value="PASSED">PASSED</option>
                                <option value="QUARANTINE">QUARANTINE</option>
                                <option value="REJECTED">REJECTED</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan Penerimaan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan kondisi fisik material, kelengkapan surat jalan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
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
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan & Tambah Stok Gudang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModalReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-teal-600">{detailModalReceipt.receipt_number}</span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  Rincian Bukti Penerimaan Barang (GRN)
                </h3>
              </div>
              <button onClick={() => setDetailModalReceipt(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Purchase Order</span>
                  <span className="font-mono font-bold text-slate-800">
                    {detailModalReceipt.purchase_order?.po_number || `#${detailModalReceipt.purchase_order_id}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Vendor</span>
                  <span className="font-semibold text-slate-800">{detailModalReceipt.vendor?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Gudang</span>
                  <span className="font-semibold text-slate-800">{detailModalReceipt.warehouse?.name || 'Gudang Utama'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-bold text-teal-700">{detailModalReceipt.status}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Lot &amp; Hasil Uji Mutu Material</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Material</th>
                        <th className="py-2.5 px-3">Batch/Lot</th>
                        <th className="py-2.5 px-3">Diterima</th>
                        <th className="py-2.5 px-3">Kadar Air</th>
                        <th className="py-2.5 px-3">Mutu QC</th>
                        <th className="py-2.5 px-3">Asal Kayu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailModalReceipt.items?.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{it.material?.name || `Material #${it.material_id}`}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-teal-700">{it.batch_lot_number}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">{it.accepted_qty} {it.material?.unit}</td>
                          <td className="py-2.5 px-3">{it.moisture_content}%</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {it.qc_status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{it.wood_origin || '-'}</td>
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
