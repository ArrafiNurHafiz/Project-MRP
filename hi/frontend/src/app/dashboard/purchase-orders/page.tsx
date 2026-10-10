'use client';

import { useState, useEffect } from 'react';
import { apiFetch, PurchaseOrder, Vendor, Material, User, CurrencyFX, getStoredUser } from '@/lib/api';
import { ShoppingCart, Plus, Search, CheckCircle2, Box, Calendar, XCircle, Building2, Printer, Eye, Truck, DollarSign, FileText, AlertCircle } from 'lucide-react';

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyFX[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalPO, setDetailModalPO] = useState<PurchaseOrder | null>(null);

  // Form State
  const [vendorId, setVendorId] = useState<number>(0);
  const [currency, setCurrency] = useState('IDR');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [recipientName, setRecipientName] = useState('Gudang Bahan Baku Utama KWAS');
  const [recipientAddress, setRecipientAddress] = useState('Kawasan Industri Mebel Kayu KWAS, Sukoharjo');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Barang diperiksa di gudang pembeli; retur berlaku bila kayu cacat/jamur');
  const [items, setItems] = useState([
    { material_id: 0, qty: 100, unit_cost: 15000 },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (statusFilter) query.set('status', statusFilter);

    const [pRes, vRes, mRes, curRes] = await Promise.all([
      apiFetch<any>(`/purchase-orders?${query.toString()}`),
      apiFetch<any>('/vendors'),
      apiFetch<any>('/materials'),
      apiFetch<any>('/fx-currencies'),
    ]);

    if (pRes.success && pRes.data) setPos(pRes.data.purchase_orders || []);
    if (vRes.success && vRes.data) setVendors(vRes.data.vendors || []);
    if (mRes.success && mRes.data) setMaterials(mRes.data.materials || []);
    if (curRes.success && curRes.data) setCurrencies(curRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleAddItem = () => {
    setItems([...items, { material_id: 0, qty: 50, unit_cost: 10000 }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === 'material_id') {
      const m = materials.find((mat) => mat.id === Number(value));
      if (m) {
        updated[index].unit_cost = m.cost_per_unit;
      }
    }
    setItems(updated);
  };

  const calcTotalPO = items.reduce((acc, it) => acc + Number(it.qty) * Number(it.unit_cost), 0);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || items.length === 0) {
      alert('Pilih vendor dan minimal satu material yang dipesan');
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload = {
      vendor_id: Number(vendorId),
      po_date: poDate ? new Date(poDate).toISOString() : new Date().toISOString(),
      expected_date: expectedDate ? new Date(expectedDate).toISOString() : undefined,
      notes: `${notes} | Penerima: ${recipientName} (${recipientAddress}) | Syarat: ${terms}`,
      items: items.map((it) => ({
        material_id: Number(it.material_id),
        qty: Number(it.qty),
        unit_cost: Number(it.unit_cost),
      })),
    };

    const res = await apiFetch('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      setSuccess('Purchase Order material berhasil diterbitkan!');
      setModalOpen(false);
      loadData();
    } else {
      setError(res.message || 'Gagal menerbitkan PO');
    }
    setSubmitting(false);
  };

  const handleReceivePO = async (id: number) => {
    if (!confirm('Konfirmasi penerimaan material dari PO ini? Stok aktual gudang akan bertambah secara otomatis.')) return;
    const res = await apiFetch(`/purchase-orders/${id}/receive`, { method: 'PATCH' });
    if (res.success) {
      alert('Material berhasil diterima dan stok gudang bertambah!');
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
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
            Procurement &amp; Material Purchase Orders (PO)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengadaan bahan baku ke vendor supplier, estimasi jadwal kedatangan di gudang, syarat penerimaan mutu &amp; penerimaan stok otomatis.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Terbitkan PO Material Baru
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

      {/* Filter Bar */}
      <div className="berry-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor PO (cth: PO-2026-09-1234) atau nama vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="">Semua Status PO</option>
          <option value="DRAFT">DRAFT (Pemesanan Terkirim ke Vendor)</option>
          <option value="RECEIVED">RECEIVED (Material Diterima di Gudang)</option>
        </select>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-all cursor-pointer"
        >
          Cari
        </button>
      </div>

      {/* Table */}
      <div className="berry-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
            <tr>
              <th className="p-4">No. PO</th>
              <th className="p-4">Vendor Pemasok</th>
              <th className="p-4">Daftar Material Dipesan</th>
              <th className="p-4 text-right">Total Biaya PO</th>
              <th className="p-4">Tanggal Penerbitan</th>
              <th className="p-4 text-center">Status PO</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Memuat data Purchase Orders...
                </td>
              </tr>
            ) : pos.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Belum ada Purchase Order material.
                </td>
              </tr>
            ) : (
              pos.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-indigo-600">{po.po_number}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{po.vendor?.name}</div>
                    <div className="text-[10px] text-slate-500">{po.vendor?.pic_phone || po.vendor?.pic_name || '-'}</div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {po.items?.map((it, idx) => (
                        <div key={idx} className="text-slate-700 font-medium">
                          • {it.material?.name} <span className="text-indigo-600 font-bold">({it.qty} {it.material?.unit})</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-600 font-mono text-sm">
                    Rp {po.total_amount.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-slate-600">
                    {new Date(po.po_date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        po.status === 'RECEIVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setDetailModalPO(po)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                        title="Lihat Detail PO"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {po.status !== 'RECEIVED' && (
                        <button
                          onClick={() => handleReceivePO(po.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Terima di Gudang
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

      {/* Modal Detail PO */}
      {detailModalPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Purchase Order: {detailModalPO.po_number}
                </h2>
                <span className="text-[11px] text-slate-500">Tanggal: {new Date(detailModalPO.po_date).toLocaleDateString('id-ID')}</span>
              </div>
              <button onClick={() => setDetailModalPO(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Vendor / Supplier:</span>
                <b className="text-slate-900">{detailModalPO.vendor?.name}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Alamat Vendor:</span>
                <span className="text-slate-700">{detailModalPO.vendor?.address || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Catatan &amp; Terms:</span>
                <span className="text-slate-700">{detailModalPO.notes || '-'}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Material</th>
                    <th className="p-2.5 text-center">Kuantitas</th>
                    <th className="p-2.5 text-right">Biaya Satuan</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailModalPO.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-slate-900">{it.material?.name}</td>
                      <td className="p-2.5 text-center font-bold">{it.qty} {it.material?.unit}</td>
                      <td className="p-2.5 text-right font-mono">Rp {it.unit_cost.toLocaleString('id-ID')}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">Rp {it.subtotal.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between font-extrabold text-sm text-indigo-950">
              <span>Total Biaya Pengadaan:</span>
              <span className="font-mono text-indigo-700">Rp {detailModalPO.total_amount.toLocaleString('id-ID')}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Dokumen PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat PO Baru */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                Formulir Penerbitan Purchase Order (PO) Bahan Baku
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Vendor / Supplier *</label>
                  <select
                    required
                    value={vendorId}
                    onChange={(e) => setVendorId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="0">-- Pilih Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.alias || 'Supplier'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal PO</label>
                  <input
                    type="date"
                    required
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimasi Tanggal Tiba</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Recipient & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama PIC Penerima Gudang</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alamat Gudang Bongkar</label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                    Daftar Material yang Dipesan
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                  >
                    + Tambah Baris Material
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <div className="col-span-6">
                      <select
                        value={it.material_id}
                        onChange={(e) => handleItemChange(idx, 'material_id', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                      >
                        <option value="0">-- Pilih Material --</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.material_code}) - Stok: {m.stock_qty} {m.unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={it.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 text-center font-bold"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Harga Satuan"
                        value={it.unit_cost}
                        onChange={(e) => handleItemChange(idx, 'unit_cost', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 font-bold text-base cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex justify-between items-center text-xs">
                <span className="font-bold text-indigo-950">Total Biaya PO Bahan:</span>
                <span className="font-mono text-base font-extrabold text-indigo-700">Rp {calcTotalPO.toLocaleString('id-ID')}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instruksi pengiriman..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Syarat &amp; Ketentuan Penerimaan</label>
                  <textarea
                    rows={2}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Terbitkan Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
