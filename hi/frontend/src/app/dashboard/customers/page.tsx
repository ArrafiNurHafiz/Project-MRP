'use client';

import { useState, useEffect } from 'react';
import { apiFetch, Customer, User, getStoredUser } from '@/lib/api';
import { Building2, Plus, Search, Mail, Phone, MapPin, XCircle, Users, CheckCircle2, AlertCircle, Eye, Tag, Trash2, Archive } from 'lucide-react';
import Link from 'next/link';
import ImportDataModal from '@/components/ImportDataModal';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tag, setTag] = useState('Corporate Horeca');

  // Multi-PIC
  const [pics, setPics] = useState([
    { name: '', email: '', phone: '', role: 'Purchasing Manager', is_primary: true },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set('search', search);

    const res = await apiFetch<any>(`/customers?${query.toString()}`);
    if (res.success && res.data) {
      setCustomers(res.data.customers || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPIC = () => {
    setPics([...pics, { name: '', email: '', phone: '', role: 'Finance / Approver', is_primary: false }]);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Nama pelanggan wajib diisi');
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload = {
      name,
      email,
      phone,
      address,
      tag,
      pics: pics.map((p, idx) => ({
        ...p,
        is_primary: idx === 0,
      })),
    };

    const res = await apiFetch('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      setSuccess(`Pelanggan ${name} berhasil didaftarkan lengkap dengan multi-PIC!`);
      setModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setPics([{ name: '', email: '', phone: '', role: 'Purchasing Manager', is_primary: true }]);
      loadData();
    } else {
      setError(res.message || 'Gagal mendaftarkan pelanggan');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Building2 className="w-5 h-5" />
            </div>
            Customer Relationship Management (CRM Directory &amp; Multi-PIC)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Direktori pelanggan korporat, pembeli ritel, dan kontak person (PIC Purchasing, Finance, Approver) untuk penerbitan penawaran &amp; faktur.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Archive className="w-3.5 h-3.5 text-purple-600" />
            Import Pelanggan CSV
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Tambah Pelanggan Baru
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
            placeholder="Cari nama pelanggan, email, nomor telepon, tag kategori, atau PIC..."
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

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 p-12 text-center text-slate-400 berry-card">
            Memuat data pelanggan...
          </div>
        ) : customers.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-slate-400 berry-card">
            Belum ada pelanggan terdaftar. Klik &quot;Tambah Pelanggan Baru&quot; di atas.
          </div>
        ) : (
          customers.map((c) => (
            <div
              key={c.id}
              className="berry-card p-5 space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{c.name}</h3>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold inline-block mt-1">
                      {c.tag || 'Corporate Buyer'}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-extrabold text-xs shadow-xs">
                    {c.name.substring(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{c.email || '-'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{c.address || '-'}</span>
                  </div>
                </div>
              </div>

              {/* PIC Summary Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                  PIC: <b className="text-slate-800">{c.pics && c.pics.length > 0 ? c.pics[0].name : 'Admin'}</b>
                </div>
                <button
                  onClick={() => setDetailCustomer(c)}
                  className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer"
                  title="Lihat Detail Customer &amp; Kontak"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Detail Pelanggan & Multi-PIC */}
      {detailCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold uppercase">{detailCustomer.tag || 'Customer'}</span>
                <h2 className="text-base font-extrabold text-slate-900 mt-1">{detailCustomer.name}</h2>
              </div>
              <button onClick={() => setDetailCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div>Email: <b>{detailCustomer.email || '-'}</b></div>
                <div>Telepon: <b>{detailCustomer.phone || '-'}</b></div>
                <div>Alamat: <b>{detailCustomer.address || '-'}</b></div>
              </div>

              {/* PIC List */}
              <div className="space-y-2 pt-2">
                <span className="font-extrabold text-indigo-950 uppercase text-[10px] block">
                  Daftar Person in Charge (PIC Multi-Kontak):
                </span>
                {detailCustomer.pics?.map((p, idx) => (
                  <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-0.5">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{p.name}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-indigo-50 text-indigo-700">{p.role || 'Contact'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">Tel: {p.phone || '-'} • Email: {p.email || '-'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailCustomer(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Pelanggan dengan Multi-PIC */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Tambah Master Pelanggan &amp; Multi-PIC
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan / Pelanggan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Kuliner Nusantara Abadi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori / Tag Pelanggan</label>
                  <input
                    type="text"
                    placeholder="VIP Corporate / Horeca / Retail"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Resmi Korporat</label>
                  <input
                    type="email"
                    placeholder="purchasing@perusahaan.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Telepon Kantor</label>
                  <input
                    type="tel"
                    placeholder="+62 812-3456-7890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Kantor / Pengiriman</label>
                <textarea
                  rows={2}
                  placeholder="Jl. Industri Raya No. 88, Kawasan Industri..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              {/* Dynamic Multi-PIC Table */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-indigo-700 uppercase">
                    Daftar Person in Charge (PIC Multi-Kontak)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPIC}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                  >
                    + Tambah Baris PIC
                  </button>
                </div>

                {pics.map((p, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-xs">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          placeholder="Nama PIC"
                          value={p.name}
                          onChange={(e) => {
                            const updated = [...pics];
                            updated[idx].name = e.target.value;
                            setPics(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-bold"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Jabatan (cth: Purchasing Manager)"
                          value={p.role}
                          onChange={(e) => {
                            const updated = [...pics];
                            updated[idx].role = e.target.value;
                            setPics(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="tel"
                          placeholder="No. WA / HP"
                          value={p.phone}
                          onChange={(e) => {
                            const updated = [...pics];
                            updated[idx].phone = e.target.value;
                            setPics(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
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
                  {submitting ? 'Menyimpan...' : 'Simpan Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Data Pelanggan */}
      <ImportDataModal
        moduleName="customers"
        moduleLabel="Master Direktori Pelanggan & Multi-PIC"
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          loadData();
          setSuccess('Import data pelanggan berhasil diproses!');
        }}
      />
    </div>
  );
}
