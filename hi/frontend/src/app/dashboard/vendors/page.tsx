'use client';

import { useState, useEffect } from 'react';
import { apiFetch, Vendor, Material, User, getStoredUser } from '@/lib/api';
import { Truck, Plus, Search, Mail, Phone, MapPin, XCircle, Users, CheckCircle2, AlertCircle, ShoppingCart, Building, Archive } from 'lucide-react';
import Link from 'next/link';
import ImportDataModal from '@/components/ImportDataModal';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [picName, setPicName] = useState('');
  const [picEmail, setPicEmail] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set('search', search);

    const res = await apiFetch<any>(`/vendors?${query.toString()}`);
    if (res.success && res.data) {
      setVendors(res.data.vendors || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Nama vendor/supplier wajib diisi');
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload = {
      name,
      alias,
      pic_name: picName,
      pic_email: picEmail,
      pic_phone: picPhone,
      address,
    };

    const res = await apiFetch('/vendors', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      setSuccess(`Vendor ${name} berhasil didaftarkan!`);
      setModalOpen(false);
      setName('');
      setAlias('');
      setPicName('');
      setPicEmail('');
      setPicPhone('');
      setAddress('');
      loadData();
    } else {
      setError(res.message || 'Gagal mendaftarkan vendor');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Building className="w-5 h-5" />
            </div>
            Direktori Vendor &amp; Supplier Bahan Baku
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Master database mitra pemasok kayu log, cat finishing, kemasan, serta rekanan subkontrak maklon pabrik.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Archive className="w-3.5 h-3.5 text-indigo-600" />
            Import Vendor CSV
          </button>
          <button
            onClick={() => setShowModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Tambah Vendor Baru
          </button>
        </div>
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

      {/* Search Bar */}
      <div className="berry-card p-4 flex items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama vendor, alias, PIC, atau alamat pemasok..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-all cursor-pointer"
        >
          Cari
        </button>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 p-12 text-center text-slate-400 berry-card">
            Memuat data vendor...
          </div>
        ) : vendors.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-slate-400 berry-card">
            Belum ada vendor terdaftar. Klik &quot;Tambah Vendor Baru&quot; di atas.
          </div>
        ) : (
          vendors.map((v) => (
            <div
              key={v.id}
              className="berry-card p-5 space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{v.name}</h3>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold inline-block mt-1">
                      {v.alias || 'Supplier Utama'}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-700 font-extrabold text-xs">
                    {v.name.substring(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>PIC: <b>{v.pic_name || '-'}</b></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{v.pic_phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{v.pic_email || '-'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{v.address || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                  Active Supplier
                </span>
                <Link
                  href="/dashboard/purchase-orders"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Buat PO
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Tambah Vendor */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                Tambah Vendor / Supplier Bahan Baku
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Vendor / Perusahaan *</label>
                  <input
                    type="text"
                    required
                    placeholder="PT Kayu Rimba Sejahtera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alias / Kode Panggilan</label>
                  <input
                    type="text"
                    placeholder="Supplier Kayu Mahoni"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama PIC</label>
                  <input
                    type="text"
                    placeholder="Bpk. Hendra"
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Telp / WA</label>
                  <input
                    type="tel"
                    placeholder="08123456789"
                    value={picPhone}
                    onChange={(e) => setPicPhone(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="sales@rimba.com"
                    value={picEmail}
                    onChange={(e) => setPicEmail(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Kantor / Gudang Pemasok</label>
                <textarea
                  rows={2}
                  placeholder="Jl. Perhutani Raya No. 45, Jepara..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
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
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Data Vendor */}
      <ImportDataModal
        moduleName="vendors"
        moduleLabel="Master Direktori Vendor & Pemasok Bahan Baku"
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          loadData();
          setSuccess('Import data vendor berhasil diproses!');
        }}
      />
    </div>
  );

  function setShowModal() {
    setModalOpen(true);
  }
}
