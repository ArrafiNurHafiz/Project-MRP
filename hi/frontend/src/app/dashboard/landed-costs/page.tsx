'use client';

import { useState, useEffect } from 'react';
import { apiFetch, LandedCost, PurchaseOrder, Material } from '@/lib/api';
import { DollarSign, Plus, Search, CheckCircle2, Truck, ShieldCheck, ArrowRight, XCircle, AlertCircle, Eye, Check } from 'lucide-react';

export default function LandedCostsPage() {
  const [landedCosts, setLandedCosts] = useState<LandedCost[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalLC, setDetailModalLC] = useState<LandedCost | null>(null);

  // Form State
  const [purchaseOrderId, setPurchaseOrderId] = useState<number>(0);
  const [freightCost, setFreightCost] = useState<number>(1500000);
  const [customsDuty, setCustomsDuty] = useState<number>(0);
  const [insuranceFee, setInsuranceFee] = useState<number>(250000);
  const [handlingFee, setHandlingFee] = useState<number>(350000);
  const [allocationMethod, setAllocationMethod] = useState<'BY_VALUE' | 'BY_QUANTITY'>('BY_VALUE');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [lRes, pRes] = await Promise.all([
      apiFetch<any>('/asian/landed-costs'),
      apiFetch<any>('/purchase-orders?limit=100'),
    ]);

    if (lRes.success && lRes.data) setLandedCosts(lRes.data.landed_costs || []);
    if (pRes.success && pRes.data) setPurchaseOrders(pRes.data.purchase_orders || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLandedCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseOrderId) {
      setError('Pilih Purchase Order bahan baku');
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await apiFetch('/asian/landed-costs', {
      method: 'POST',
      body: JSON.stringify({
        purchase_order_id: Number(purchaseOrderId),
        freight_cost: Number(freightCost),
        customs_duty: Number(customsDuty),
        insurance_fee: Number(insuranceFee),
        handling_fee: Number(handlingFee),
        allocation_method: allocationMethod,
      }),
    });

    if (res.success) {
      setSuccess('Alokasi Landed Cost berhasil dihitung secara proporsional!');
      setModalOpen(false);
      loadData();
    } else {
      setError(res.message || 'Gagal menghitung landed cost');
    }
    setSubmitting(false);
  };

  const handlePostToInventory = async (id: number) => {
    if (!confirm('Posting HPP Final Landed Cost ke Master Bahan Baku? Nilai HPP material akan ter-update dengan biaya riil mendarat di gudang.')) return;
    const res = await apiFetch(`/asian/landed-costs/${id}/post`, { method: 'PATCH' });
    if (res.success) {
      setSuccess('HPP Riil Landed Cost berhasil diposting ke Master Bahan Baku!');
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
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Truck className="w-5 h-5" />
            </div>
            Landed Cost Allocation (HPP Riil Kedatangan Bahan)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standar industri HashMicro &amp; Deskera: Distribusi biaya ongkir kontainer, cukai, asuransi muatan &amp; bongkar muat kuli ke HPP aktual material.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Alokasikan Landed Cost
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

      {/* Table */}
      <div className="berry-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
            <tr>
              <th className="p-4">No. Dokumen</th>
              <th className="p-4">Ref. PO / Vendor</th>
              <th className="p-4 text-right">Biaya Ekspedisi</th>
              <th className="p-4 text-right">Biaya Bongkar/Asuransi</th>
              <th className="p-4 text-right">Total Landed Cost</th>
              <th className="p-4 text-center">Metode Alokasi</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Memuat data landed cost...
                </td>
              </tr>
            ) : landedCosts.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Belum ada dokumen alokasi landed cost.
                </td>
              </tr>
            ) : (
              landedCosts.map((lc) => (
                <tr key={lc.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-emerald-600">{lc.document_number}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{lc.purchase_order?.vendor?.name || 'Vendor Pemasok'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{lc.purchase_order?.po_number}</div>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-700">
                    Rp {lc.freight_cost.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-right font-mono text-slate-700">
                    Rp {(lc.handling_fee + lc.insurance_fee + lc.customs_duty).toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-emerald-700 text-sm">
                    Rp {lc.total_landed_cost.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {lc.allocation_method.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        lc.status === 'POSTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {lc.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setDetailModalLC(lc)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {lc.status !== 'POSTED' && (
                        <button
                          onClick={() => handlePostToInventory(lc.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Posting ke HPP Bahan
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

      {/* Modal Detail Landed Cost */}
      {detailModalLC && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">
                Landed Cost: {detailModalLC.document_number}
              </h2>
              <button onClick={() => setDetailModalLC(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div>Ref. Purchase Order: <b>{detailModalLC.purchase_order?.po_number}</b></div>
              <div>Vendor Pemasok: <b>{detailModalLC.purchase_order?.vendor?.name}</b></div>
              <div>Total Biaya Ekstra Logistik: <b className="text-emerald-700">Rp {detailModalLC.total_landed_cost.toLocaleString('id-ID')}</b></div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-extrabold text-slate-700 uppercase text-[10px]">Alokasi HPP Baru per Satuan Bahan:</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Material</th>
                      <th className="p-2.5 text-right">HPP Faktur Asal</th>
                      <th className="p-2.5 text-right">Biaya Ekstra/Unit</th>
                      <th className="p-2.5 text-right">HPP Riil Mendarat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailModalLC.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-900">{it.material?.name}</td>
                        <td className="p-2.5 text-right font-mono">Rp {it.base_purchased_cost.toLocaleString('id-ID')}</td>
                        <td className="p-2.5 text-right font-mono text-amber-600">+ Rp {Math.round(it.allocated_extra_cost).toLocaleString('id-ID')}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">Rp {Math.round(it.final_true_unit_cost).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailModalLC(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alokasi Landed Cost Baru */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                Alokasi Biaya Landed Cost PO Bahan
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLandedCost} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Purchase Order (PO) *</label>
                <select
                  required
                  value={purchaseOrderId}
                  onChange={(e) => setPurchaseOrderId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                >
                  <option value="0">-- Pilih PO --</option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} - {po.vendor?.name} (Rp {po.total_amount.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ongkos Kirim Truk / Ekspedisi (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={freightCost}
                    onChange={(e) => setFreightCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Biaya Bongkar Muat Kuli (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={handlingFee}
                    onChange={(e) => setHandlingFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asuransi Muatan Kayu (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={insuranceFee}
                    onChange={(e) => setInsuranceFee(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bea Masuk / Retribusi (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={customsDuty}
                    onChange={(e) => setCustomsDuty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/25 cursor-pointer"
                >
                  {submitting ? 'Menghitung...' : 'Simpan & Alokasikan HPP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
