'use client';

import { useState, useEffect } from 'react';
import { apiFetch, RFQ, Customer, Product, User, getStoredUser } from '@/lib/api';
import { FileText, Plus, CheckCircle2, ArrowRight, Search, Building2, XCircle, DollarSign, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function RFQPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('');
  const [procStatusFilter, setProcStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [customerId, setCustomerId] = useState<number>(0);
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [items, setItems] = useState([
    { product_id: 0, custom_name: 'Piring Saji Mahoni Kustom (Dia 28cm)', target_quantity: 250, target_budget: 35000, specs_notes: 'Finishing Beeswax natural' },
  ]);

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (subStatusFilter) query.set('submission_status', subStatusFilter);
    if (procStatusFilter) query.set('processing_status', procStatusFilter);

    const [rRes, cRes, pRes] = await Promise.all([
      apiFetch<any>(`/rfq?${query.toString()}`),
      apiFetch<any>('/customers'),
      apiFetch<any>('/products'),
    ]);

    if (rRes.success && rRes.data) setRfqs(rRes.data.rfqs || []);
    if (cRes.success && cRes.data) setCustomers(cRes.data.customers || []);
    if (pRes.success && pRes.data) setProducts(pRes.data.products || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [subStatusFilter, procStatusFilter]);

  const handleAddItem = () => {
    setItems([...items, { product_id: 0, custom_name: '', target_quantity: 100, target_budget: 0, specs_notes: '' }]);
  };

  const handleCreateRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0) {
      alert('Pilih pelanggan dan minimal satu produk/kustom permintaan');
      return;
    }

    const payload = {
      customer_id: Number(customerId),
      is_custom_product: isCustomProduct,
      target_date: targetDate ? new Date(targetDate).toISOString() : undefined,
      customer_notes: customerNotes,
      internal_notes: internalNotes,
      items: items.map((it) => ({
        product_id: it.product_id ? Number(it.product_id) : undefined,
        custom_name: it.custom_name,
        target_quantity: Number(it.target_quantity),
        target_budget: Number(it.target_budget),
        specs_notes: it.specs_notes,
      })),
    };

    const res = await apiFetch('/rfq', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      setModalOpen(false);
      loadData();
    } else {
      alert(res.message);
    }
  };

  const handleApproveRFQ = async (id: number) => {
    const res = await apiFetch(`/rfq/${id}/approve`, { method: 'PATCH' });
    if (res.success) {
      alert('RFQ disetujui untuk penawaran harga!');
      loadData();
    } else {
      alert(res.message);
    }
  };

  const handleConvertToQuote = async (id: number) => {
    const res = await apiFetch(`/rfq/${id}/convert-to-quote`, { method: 'POST' });
    if (res.success) {
      alert('RFQ berhasil dikonversi menjadi Surat Penawaran Harga (Draft Quotation)!');
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
              <FileText className="w-5 h-5" />
            </div>
            Request for Quotes (Permohonan Penawaran Harga)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen permintaan penawaran harga pelanggan &amp; penanganan Custom Product Request (CPR) sebelum diterbitkan Surat Penawaran (Quotation).
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Buat RFQ Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="berry-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor RFQ (cth: RFQ-2026-09-1234)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>
        <select
          value={procStatusFilter}
          onChange={(e) => setProcStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="">Semua Tahap Proses</option>
          <option value="ANALYSIS_PENDING">ANALYSIS PENDING (Produk Kustom / R&amp;D)</option>
          <option value="READY_TO_QUOTE">READY TO QUOTE (Siap Ditawarkan)</option>
          <option value="QUOTED">QUOTED (Sudah Menjadi Penawaran)</option>
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
              <th className="p-4">No. RFQ</th>
              <th className="p-4">Pelanggan</th>
              <th className="p-4">Tipe Produk</th>
              <th className="p-4">Target Kuantitas &amp; Budget</th>
              <th className="p-4">Target Selesai</th>
              <th className="p-4">Status Proses</th>
              <th className="p-4 text-right">Aksi Alur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Memuat data RFQ...
                </td>
              </tr>
            ) : rfqs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Belum ada permohonan penawaran harga terdaftar.
                </td>
              </tr>
            ) : (
              rfqs.map((rfq) => (
                <tr key={rfq.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-indigo-600">{rfq.rfq_number}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{rfq.customer?.name}</div>
                    <div className="text-[10px] text-slate-500">{rfq.customer?.phone || '-'}</div>
                  </td>
                  <td className="p-4">
                    {rfq.is_custom_product ? (
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-extrabold text-[10px]">
                        Custom Product (CPR)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-extrabold text-[10px]">
                        Standard Catalog
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {rfq.items?.map((it, idx) => (
                        <div key={idx} className="text-slate-700">
                          • {it.product?.product_name || it.custom_name}{' '}
                          <b className="text-slate-900">({it.target_quantity} pcs)</b>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">
                    {rfq.target_date ? new Date(rfq.target_date).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        rfq.processing_status === 'QUOTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rfq.processing_status === 'READY_TO_QUOTE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rfq.processing_status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {rfq.processing_status === 'ANALYSIS_PENDING' && (
                        <button
                          onClick={() => handleApproveRFQ(rfq.id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Setujui Desain
                        </button>
                      )}
                      {rfq.processing_status === 'READY_TO_QUOTE' && (
                        <button
                          onClick={() => handleConvertToQuote(rfq.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          Terbitkan Penawaran
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {rfq.processing_status === 'QUOTED' && (
                        <Link
                          href="/dashboard/quotes"
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                        >
                          Lihat Quotes <ArrowRight className="w-3.5 h-3.5" />
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

      {/* Modal Buat RFQ Baru */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Formulir Request for Quotation (RFQ) Baru
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRFQ} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Pelanggan *</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="0">-- Pilih Pelanggan --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Selesai Yang Diminta</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3">
                <input
                  type="checkbox"
                  id="customToggle"
                  checked={isCustomProduct}
                  onChange={(e) => setIsCustomProduct(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <label htmlFor="customToggle" className="text-xs text-purple-900 font-bold cursor-pointer">
                  Ini adalah Permintaan Produk Kustom Baru (Custom Product Request / R&amp;D Analysis)
                </label>
              </div>

              {/* Items */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-indigo-700 uppercase">
                    Detail Produk / Spesifikasi Yang Diminta
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                  >
                    + Tambah Baris
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="Nama Barang Kustom / Pilih Produk"
                          value={it.custom_name}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].custom_name = e.target.value;
                            setItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-bold"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Target Qty"
                          value={it.target_quantity}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].target_quantity = Number(e.target.value);
                            setItems(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 text-center font-bold"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Target Budget (Rp)"
                          value={it.target_budget}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].target_budget = Number(e.target.value);
                            setItems(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-mono"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Spesifikasi / Ukuran (cth: Kayu Jati tebal 2.5cm, finishing rustic)"
                      value={it.specs_notes}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx].specs_notes = e.target.value;
                        setItems(updated);
                      }}
                      className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  Simpan RFQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
