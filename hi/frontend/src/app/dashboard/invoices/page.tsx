'use client';

import { useState, useEffect } from 'react';
import { apiFetch, Invoice, SalesOrder, User, getStoredUser } from '@/lib/api';
import { Receipt, Plus, Search, CheckCircle2, DollarSign, Calendar, FileText, XCircle } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [salesOrderId, setSalesOrderId] = useState<number>(0);
  const [invoiceType, setInvoiceType] = useState('DOWN_PAYMENT');
  const [dueDate, setDueDate] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (statusFilter) query.set('status', statusFilter);

    const [iRes, oRes] = await Promise.all([
      apiFetch<any>(`/invoices?${query.toString()}`),
      apiFetch<any>('/orders'),
    ]);

    if (iRes.success && iRes.data) setInvoices(iRes.data.invoices || []);
    if (oRes.success && oRes.data) setOrders(oRes.data.orders || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesOrderId || totalAmount <= 0) {
      alert('Pilih pesanan penjualan dan isi nominal tagihan');
      return;
    }

    const payload = {
      sales_order_id: Number(salesOrderId),
      invoice_type: invoiceType,
      issue_date: new Date().toISOString(),
      due_date: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      total_amount: Number(totalAmount),
      notes,
    };

    const res = await apiFetch('/invoices', {
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

  const handlePayInvoice = async (id: number) => {
    if (!confirm('Tandai faktur tagihan ini sebagai LUNAS (PAID)?')) return;
    const res = await apiFetch(`/invoices/${id}/pay`, { method: 'PATCH' });
    if (res.success) {
      alert('Faktur berhasil dilunasi!');
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
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <Receipt className="w-5 h-5" />
            </div>
            Faktur &amp; Penagihan (Invoices)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan faktur uang muka (DP), penagihan bertahap, dan pelunasan pembayaran pesanan penjualan
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Terbitkan Faktur Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="berry-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor faktur (cth: INV-2026-09-1234)..."
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
          <option value="">Semua Status Pembayaran</option>
          <option value="UNPAID">UNPAID (Belum Dibayar)</option>
          <option value="PARTIAL">PARTIAL (Dibayar Sebagian)</option>
          <option value="PAID">PAID (Lunas)</option>
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
              <th className="p-4">No. Faktur</th>
              <th className="p-4">Pesanan / Pelanggan</th>
              <th className="p-4">Jenis Tagihan</th>
              <th className="p-4">Total Tagihan</th>
              <th className="p-4">Jatuh Tempo</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Memuat data faktur...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Belum ada faktur penagihan terbit.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-indigo-600">{inv.invoice_number}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{inv.sales_order?.customer?.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Ref: {inv.sales_order?.order_number}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-slate-700 font-semibold">
                      {inv.invoice_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-emerald-600 font-mono text-sm">
                    Rp {inv.total_amount.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-slate-600">
                    {new Date(inv.due_date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        inv.payment_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.payment_status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {inv.payment_status !== 'PAID' && (
                      <button
                        onClick={() => handlePayInvoice(inv.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Tandai Lunas
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Terbitkan Faktur */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                Terbitkan Faktur Tagihan Baru
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Pesanan Penjualan (Sales Order) *</label>
                <select
                  required
                  value={salesOrderId}
                  onChange={(e) => {
                    const sid = Number(e.target.value);
                    setSalesOrderId(sid);
                    const so = orders.find((o) => o.id === sid);
                    if (so) setTotalAmount(so.total_amount);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="0">-- Pilih Sales Order --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} - {o.customer?.name} (Rp {o.total_amount.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Tagihan</label>
                  <select
                    value={invoiceType}
                    onChange={(e) => setInvoiceType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="DOWN_PAYMENT">Uang Muka (DP)</option>
                    <option value="FULL_PAYMENT">Pelunasan Penuh (100%)</option>
                    <option value="FINAL_SETTLEMENT">Tagihan Akhir / Sisa</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nominal Tagihan (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  Terbitkan Faktur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
