'use client';

import { useState, useEffect, use } from 'react';
import { apiFetch, Quotation } from '@/lib/api';
import { FileText, CheckCircle2, XCircle, Building2, Calendar, ShieldCheck, CreditCard, RotateCcw, Lock, ArrowRight } from 'lucide-react';

export default function QuotePortalPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [quote, setQuote] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signerName, setSignerName] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [successResult, setSuccessResult] = useState<{ sales_order_number?: string; dp_invoice_number?: string } | null>(null);

  const loadQuotation = async () => {
    setLoading(true);
    const res = await apiFetch<any>(`/public/quotes/${token}`);
    if (res.success && res.data) {
      setQuote(res.data);
      if (res.data.customer?.pics?.[0]?.name) {
        setSignerName(res.data.customer.pics[0].name);
      }
    } else {
      setError(res.error?.message || 'Surat penawaran tidak ditemukan atau tautan telah kedaluwarsa.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      loadQuotation();
    }
  }, [token]);

  const handleApprove = async () => {
    if (!signerName) {
      alert('Masukkan nama penanggung jawab / PIC yang menyetujui penawaran ini');
      return;
    }
    if (!confirm(`Setujui penawaran ini atas nama ${signerName}? Sales Order & Perintah Kerja pabrik akan diterbitkan otomatis.`)) return;

    const res = await apiFetch<any>(`/public/quotes/${token}/approve`, {
      method: 'POST',
      body: JSON.stringify({ signer_name: signerName }),
    });

    if (res.success && res.data) {
      setSuccessResult({
        sales_order_number: res.data.sales_order?.order_number,
        dp_invoice_number: res.data.dp_invoice?.invoice_number,
      });
      loadQuotation();
    } else {
      alert(res.error?.message || 'Gagal memproses persetujuan penawaran');
    }
  };

  const handleRevise = async () => {
    if (!revisionNotes) {
      alert('Tuliskan catatan revisi yang Anda minta');
      return;
    }

    const res = await apiFetch<any>(`/public/quotes/${token}/revise`, {
      method: 'POST',
      body: JSON.stringify({ revision_notes: revisionNotes }),
    });

    if (res.success) {
      alert('Permintaan revisi telah dikirim ke tim sales kami. Tim kami akan segera menghubungi Anda.');
      setShowRevisionModal(false);
      loadQuotation();
    } else {
      alert(res.error?.message || 'Gagal mengirim revisi');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-medium">Memuat portal penawaran resmi...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Tautan Tidak Tersedia</h2>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" /> Official Customer Quotation Portal
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">PT Kayu KWAS Manufaktur Indonesia</h1>
            <p className="text-xs text-slate-400 mt-1">Dokumen Resmi Penawaran Harga & Spesifikasi Teknis Manufaktur</p>
          </div>
          <div className="text-right font-mono">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
              quote.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              quote.status === 'NEED_REVISION' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {quote.status}
            </span>
            <div className="text-xs text-slate-400 mt-1 font-sans">No. {quote.quote_number}</div>
          </div>
        </div>

        {/* Success Banner */}
        {successResult && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 p-6 rounded-2xl space-y-2 shadow-xl animate-fade-in">
            <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Penawaran Resmi Telah Disetujui!
            </h3>
            <p className="text-xs text-emerald-200">
              Terima kasih atas persetujuan Anda. Pesanan pabrik <strong>{successResult.sales_order_number}</strong> dan faktur DP <strong>{successResult.dp_invoice_number}</strong> telah diterbitkan secara otomatis.
            </p>
          </div>
        )}

        {/* Customer & Quote Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-400" /> Penerima Penawaran (Buyer)
            </h3>
            <div className="text-sm font-bold text-white">{quote.customer?.name}</div>
            <div className="text-xs text-slate-400">{quote.customer?.address || 'Alamat tidak tertera'}</div>
            <div className="text-xs text-slate-400">Kontak: {quote.customer?.phone || quote.customer?.email}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" /> Syarat & Ketentuan Finansial
            </h3>
            <div className="flex justify-between text-xs py-0.5 border-b border-slate-800">
              <span className="text-slate-400">Mata Uang</span>
              <span className="font-mono font-bold text-white">{quote.currency}</span>
            </div>
            <div className="flex justify-between text-xs py-0.5 border-b border-slate-800">
              <span className="text-slate-400">Termin Pembayaran</span>
              <span className="font-bold text-slate-200">{quote.payment_terms || '50% DP, 50% Pelunasan'}</span>
            </div>
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-slate-400">Incoterms & Risiko</span>
              <span className="font-bold text-slate-200">{quote.incoterms || 'EXW'} ({quote.risk_level || 'LOW'} Risk)</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 font-bold text-sm text-white">Rincian Produk & Spesifikasi Manufaktur</div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Deskripsi Produk</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Harga Satuan ({quote.currency})</th>
                <th className="py-3 px-4 text-right">Total Harga ({quote.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {quote.items?.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{it.item_name}</div>
                    {it.description && <div className="text-[11px] text-slate-400 mt-0.5 whitespace-pre-line">{it.description}</div>}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">{it.qty} {it.unit}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300">{it.unit_price.toLocaleString('id-ID')}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{it.total_price.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pricing Summary */}
          <div className="bg-slate-950 p-6 border-t border-slate-800 flex justify-end">
            <div className="w-full sm:w-80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal Barang:</span>
                <span className="font-mono text-slate-200">{quote.currency} {quote.subtotal?.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>PPN ({quote.tax_rate}%):</span>
                <span className="font-mono text-slate-200">{quote.currency} {quote.tax_amount?.toLocaleString('id-ID')}</span>
              </div>
              {quote.shipping_fee > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Biaya Pengiriman:</span>
                  <span className="font-mono text-slate-200">{quote.currency} {quote.shipping_fee?.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-emerald-400 pt-2 border-t border-slate-800">
                <span>Total Penawaran:</span>
                <span className="font-mono">{quote.currency} {quote.total_amount?.toLocaleString('id-ID')}</span>
              </div>
              <div className="text-[11px] text-indigo-400 font-mono text-right">
                Down Payment ({quote.down_payment_pct}%): {quote.currency} {((quote.total_amount * quote.down_payment_pct) / 100).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>

        {/* Digital Approval Action Card */}
        {quote.status !== 'APPROVED' && (
          <div className="bg-gradient-to-r from-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white">Konfirmasi & Persetujuan Digital Penawaran</h3>
              <p className="text-xs text-slate-300">
                Dengan menyetujui dokumen ini, Anda mengonfirmasi rincian teknis, kuantitas, dan jadwal pengerjaan pabrikasi kami.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nama PIC Penanggung Jawab *</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Nama Lengkap Penandatangan"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div className="flex items-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(true)}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" /> Minta Revisi
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-900/40"
                >
                  <CheckCircle2 className="w-4 h-4" /> Setujui Penawaran
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Already Approved Signature Box */}
        {quote.status === 'APPROVED' && quote.customer_signed_by && (
          <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-white">Disetujui secara digital oleh: {quote.customer_signed_by}</div>
                <div className="text-slate-400 text-[11px]">
                  Tanggal ACC: {quote.customer_signed_at ? new Date(quote.customer_signed_at).toLocaleString('id-ID') : '-'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="text-sm font-bold text-white">Ajukan Revisi Spesifikasi / Harga</h3>
            <p className="text-slate-400">
              Tuliskan detail poin yang perlu disesuaikan (misal: perubahan kuantitas, target tanggal, atau diskon tambahan).
            </p>
            <textarea
              rows={4}
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Contoh: Mohon penyesuaian diskon 5% untuk kuantitas 250 pcs dan termin pembayaran NET 30."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-400"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRevise}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
              >
                Kirim Catatan Revisi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
