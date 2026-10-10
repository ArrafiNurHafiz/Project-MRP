'use client';

import { useState, useEffect } from 'react';
import {
  apiFetch,
  Quotation,
  Customer,
  Product,
  User,
  CurrencyFX,
  getStoredUser,
  approveQuotation,
  convertQuoteToSalesOrder,
  rejectQuotation,
} from '@/lib/api';
import { LifecycleStepper } from '@/components/LifecycleStepper';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Search,
  Calendar,
  DollarSign,
  Building2,
  ShieldAlert,
  Truck,
  Scale,
  Printer,
  Eye,
  Percent,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';

const QUOTE_LIFECYCLE_STEPS = [
  { id: 'DRAFT', label: 'Draft Penawaran', sublabel: 'Penyusunan Harga' },
  { id: 'APPROVED', label: 'Disetujui (ACC)', sublabel: 'Disetujui Pelanggan' },
  { id: 'CONVERTED', label: 'Pesanan (SO)', sublabel: 'Terbit ke Penjualan' },
];

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyFX[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalQuote, setDetailModalQuote] = useState<Quotation | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState<number>(0);
  const [currency, setCurrency] = useState('IDR');
  const [paymentTerms, setPaymentTerms] = useState('50% DP, 50% Before Shipment');
  const [downPaymentPct, setDownPaymentPct] = useState(50);
  const [validUntil, setValidUntil] = useState('');
  const [incoterms, setIncoterms] = useState('FOB');
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [shippingMethod, setShippingMethod] = useState('Darat / Truk Box');
  const [taxRate, setTaxRate] = useState(11);
  const [shippingFee, setShippingFee] = useState(0);
  const [otherFee, setOtherFee] = useState(0);
  const [includeForceMajeure, setIncludeForceMajeure] = useState(true);
  const [includeLatePenalty, setIncludeLatePenalty] = useState(true);
  const [customerNotes, setCustomerNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const [items, setItems] = useState([
    { product_id: 0, item_name: '', description: '', qty: 100, unit: 'pcs', unit_price: 35000, discount_pct: 0 },
  ]);

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (statusFilter) query.set('status', statusFilter);

    const [qRes, cRes, pRes, curRes] = await Promise.all([
      apiFetch<any>(`/quotes?${query.toString()}`),
      apiFetch<any>('/customers'),
      apiFetch<any>('/products'),
      apiFetch<any>('/fx-currencies'),
    ]);

    if (qRes.success && qRes.data) setQuotes(qRes.data.quotes || []);
    if (cRes.success && cRes.data) setCustomers(cRes.data.customers || []);
    if (pRes.success && pRes.data) setProducts(pRes.data.products || []);
    if (curRes.success && curRes.data) setCurrencies(curRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleAddItem = () => {
    setItems([...items, { product_id: 0, item_name: '', description: '', qty: 10, unit: 'pcs', unit_price: 0, discount_pct: 0 }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === 'product_id') {
      const prod = products.find((p) => p.id === Number(value));
      if (prod) {
        updated[index].item_name = prod.product_name;
      }
    }
    setItems(updated);
  };

  // Calculations
  const calcSubtotal = items.reduce((acc, it) => acc + Number(it.qty) * Number(it.unit_price) * (1 - Number(it.discount_pct) / 100), 0);
  const calcTaxAmount = calcSubtotal * (Number(taxRate) / 100);
  const calcGrandTotal = calcSubtotal + calcTaxAmount + Number(shippingFee) + Number(otherFee);
  const calcDownPaymentAmount = calcGrandTotal * (Number(downPaymentPct) / 100);
  const calcRemainingBalance = calcGrandTotal - calcDownPaymentAmount;

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0) {
      alert('Pilih pelanggan dan minimal satu item produk');
      return;
    }

    const payload = {
      customer_id: Number(customerId),
      currency,
      down_payment_pct: Number(downPaymentPct),
      valid_until: validUntil ? new Date(validUntil).toISOString() : undefined,
      payment_terms: paymentTerms,
      incoterms,
      risk_level: riskLevel,
      customer_notes: customerNotes,
      internal_notes: internalNotes,
      tax_rate: Number(taxRate),
      shipping_fee: Number(shippingFee),
      other_fee: Number(otherFee),
      items: items.map((it) => ({
        product_id: it.product_id ? Number(it.product_id) : undefined,
        item_name: it.item_name,
        description: it.description,
        qty: Number(it.qty),
        unit: it.unit,
        unit_price: Number(it.unit_price),
        discount_pct: Number(it.discount_pct),
      })),
    };

    const res = await apiFetch<Quotation>('/quotes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      setModalOpen(false);
      loadData();
    } else {
      alert(res.message || 'Gagal membuat penawaran');
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('ACC / Setujui surat penawaran ini?')) return;
    const res = await approveQuotation(id);
    if (res.success) loadData();
    else alert(res.message);
  };

  const handleConvertToOrder = async (id: number) => {
    if (!confirm('Ubah penawaran yang sudah di-ACC ini menjadi Pesanan Penjualan (Sales Order)?')) return;
    const res = await convertQuoteToSalesOrder(id);
    if (res.success) {
      alert('Berhasil diubah menjadi Pesanan Penjualan (Draft)!');
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
            Commercial Quotations &amp; Sales Pricing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penerbitan Surat Penawaran Harga resmi dengan klausul hukum, kalkulasi PPN &amp; DP, risiko kredit, serta konversi otomatis ke Sales Order.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Buat Penawaran Baru
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="berry-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor penawaran (cth: QUO-2026-09-1234)..."
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
          <option value="">Semua Status</option>
          <option value="DRAFT">DRAFT (Menunggu ACC)</option>
          <option value="SENT">SENT (Terkirim ke Pembeli)</option>
          <option value="APPROVED">APPROVED (Sudah di-ACC)</option>
          <option value="REJECTED">REJECTED</option>
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
              <th className="p-4">No. Penawaran</th>
              <th className="p-4">Pelanggan</th>
              <th className="p-4">Rincian Produk</th>
              <th className="p-4 text-right">Nilai Grand Total</th>
              <th className="p-4">Termin Pembayaran</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Aksi Alur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Memuat data penawaran...
                </td>
              </tr>
            ) : quotes.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Belum ada surat penawaran. Klik &quot;Buat Penawaran Baru&quot; di atas.
                </td>
              </tr>
            ) : (
              quotes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-indigo-600">
                    <div>{q.quote_number}</div>
                    <span className="text-[10px] text-slate-400 font-normal">Valuta: {q.currency}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{q.customer?.name || 'Customer'}</div>
                    <div className="text-[10px] text-slate-500">{q.customer?.phone || q.customer?.email || '-'}</div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {q.items?.map((it, idx) => (
                        <div key={idx} className="text-slate-700">
                          • {it.item_name} <span className="text-slate-400">({it.qty} {it.unit})</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-600 font-mono text-sm">
                    {q.currency} {q.total_amount.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="font-semibold text-slate-800">DP {q.down_payment_pct}%</div>
                    <div className="text-[10px] text-slate-400">{q.payment_terms}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        q.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : q.status === 'DRAFT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setDetailModalQuote(q)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                        title="Lihat Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {q.public_token && (
                        <a
                          href={`/quote-portal/${q.public_token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-all"
                          title="Buka Microsite Pelanggan"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Portal
                        </a>
                      )}
                      {q.status === 'DRAFT' && (
                        <button
                          onClick={() => handleApprove(q.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ACC / Setujui
                        </button>
                      )}
                      {q.status === 'APPROVED' && (
                        <button
                          onClick={() => handleConvertToOrder(q.id)}
                          className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        >
                          Ubah Jadi Pesanan
                          <ArrowRight className="w-3.5 h-3.5" />
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

      {/* Modal Form Pembuatan Penawaran Baru */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Penerbitan Surat Penawaran Harga (Commercial Quotation)
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
              {/* Customer & Terms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Pelanggan / Buyer *</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="0">-- Pilih Pelanggan --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone || c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Uang Transaksi</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    {currencies.map((cur) => (
                      <option key={cur.id} value={cur.code}>
                        {cur.code} - {cur.name} ({cur.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batas Masa Berlaku (Valid Until) *</label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Commercial Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Down Payment (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={downPaymentPct}
                    onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Syarat Pembayaran</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="50% DP, 50% Before Shipment"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Incoterms</label>
                  <select
                    value={incoterms}
                    onChange={(e) => setIncoterms(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="FOB">FOB (Free On Board)</option>
                    <option value="CIF">CIF (Cost, Insurance &amp; Freight)</option>
                    <option value="EXW">EXW (Ex Works / Gudang Pabrik)</option>
                    <option value="DDP">DDP (Delivered Duty Paid)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penilaian Risiko Kredit</label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="LOW">LOW Risk</option>
                    <option value="MEDIUM">MEDIUM Risk</option>
                    <option value="HIGH">HIGH Risk</option>
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                    Daftar Produk &amp; Harga Penawaran
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                  >
                    + Tambah Baris Produk
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <div className="col-span-4">
                      <select
                        value={it.product_id}
                        onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                      >
                        <option value="0">-- Pilih Katalog Produk --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.product_name} ({p.product_code})
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
                        value={it.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Disc %"
                        value={it.discount_pct}
                        onChange={(e) => handleItemChange(idx, 'discount_pct', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 text-center"
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

              {/* Cost & Tax Breakdown Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tarif PPN (%)</label>
                      <input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ongkir (Rp)</label>
                      <input
                        type="number"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Biaya Lain (Rp)</label>
                      <input
                        type="number"
                        value={otherFee}
                        onChange={(e) => setOtherFee(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  {/* Legal Clauses */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-700 block mb-1">Klausul Hukum Perjanjian:</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeForceMajeure}
                        onChange={(e) => setIncludeForceMajeure(e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded"
                      />
                      <span>Cantumkan Klausul Keadaan Kahar (Force Majeure)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeLatePenalty}
                        onChange={(e) => setIncludeLatePenalty(e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded"
                      />
                      <span>Klausul Denda Keterlambatan Pembayaran (1% / Minggu)</span>
                    </label>
                  </div>
                </div>

                {/* Grand Total Calculation Card */}
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Produk:</span>
                    <span className="font-mono font-bold text-slate-900">{currency} {calcSubtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>PPN ({taxRate}%):</span>
                    <span className="font-mono text-slate-800">{currency} {calcTaxAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Pengiriman &amp; Lain:</span>
                    <span className="font-mono text-slate-800">{currency} {(Number(shippingFee) + Number(otherFee)).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="pt-2 border-t border-indigo-200/80 flex justify-between font-extrabold text-sm text-indigo-950">
                    <span>Grand Total Penawaran:</span>
                    <span className="font-mono text-indigo-700 text-base">{currency} {calcGrandTotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="pt-1.5 border-t border-indigo-100 flex justify-between font-semibold text-[11px] text-slate-600">
                    <span>Uang Muka Disyaratkan ({downPaymentPct}%):</span>
                    <span className="font-mono font-bold text-emerald-700">{currency} {calcDownPaymentAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan untuk Pelanggan</label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Instruksi kemasan kayu ekspor, jadwal inspeksi pabrik..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
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
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  Simpan &amp; Terbitkan Draf Penawaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail & PDF Print Preview */}
      {detailModalQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Surat Penawaran: {detailModalQuote.quote_number}
                </h2>
                <span className="text-[11px] text-slate-500">Dibuat: {new Date(detailModalQuote.created_at).toLocaleString('id-ID')}</span>
              </div>
              <button onClick={() => setDetailModalQuote(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Katana MRP Visual Lifecycle Stepper */}
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                Alur Tahapan Dokumen (Katana Lifecycle):
              </span>
              <LifecycleStepper
                steps={QUOTE_LIFECYCLE_STEPS}
                currentStepId={detailModalQuote.status}
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <b className="text-slate-900">{detailModalQuote.customer?.name}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Alamat:</span>
                <span className="text-slate-700 text-right max-w-[280px]">{detailModalQuote.customer?.address || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Termin Pembayaran:</span>
                <span className="font-semibold text-slate-800">{detailModalQuote.payment_terms} (DP {detailModalQuote.down_payment_pct}%)</span>
              </div>
            </div>

            {/* Items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Produk</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Harga</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailModalQuote.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-slate-900">{it.item_name}</td>
                      <td className="p-2.5 text-center">{it.qty} {it.unit}</td>
                      <td className="p-2.5 text-right font-mono">{detailModalQuote.currency} {it.unit_price.toLocaleString('id-ID')}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">{detailModalQuote.currency} {it.total_price.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between font-extrabold text-sm text-indigo-950">
              <span>Grand Total:</span>
              <span className="font-mono text-indigo-700">{detailModalQuote.currency} {detailModalQuote.total_amount.toLocaleString('id-ID')}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Dokumen Penawaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
