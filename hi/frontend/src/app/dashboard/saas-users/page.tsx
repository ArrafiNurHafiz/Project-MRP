'use client';

import { useState, useEffect } from 'react';
import { apiFetch, User, Tenant, getStoredUser } from '@/lib/api';
import { ShieldAlert, Users, Search, CheckCircle2, XCircle, Globe, Building2, UserPlus, Key, Mail, Phone, Lock, Filter } from 'lucide-react';
import Link from 'next/link';

export default function SaaSUsersPortalPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form Onboard User baru ke Tenant
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedTenantSlug, setSelectedTenantSlug] = useState('');
  const [roleName, setRoleName] = useState('PPIC');
  const [initialPassword, setInitialPassword] = useState('AdminKWAS2026!');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set('search', search);

    const [uRes, tRes] = await Promise.all([
      apiFetch<any>(`/users?${query.toString()}`),
      apiFetch<any>('/saas/tenants'),
    ]);

    if (uRes.success && uRes.data) setUsers(uRes.data.users || []);
    if (tRes.success && tRes.data) setTenants(tRes.data.tenants || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreateTenantUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Nama dan email pengguna wajib diisi');
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        phone_number: phoneNumber || undefined,
        role_ids: [1], // Superuser / PPIC mapping
        password: initialPassword,
      }),
    });

    if (res.success) {
      setSuccess(`Pengguna ${name} berhasil didaftarkan ke portal tenant ${selectedTenantSlug || 'Umum'}!`);
      setModalOpen(false);
      setName('');
      setEmail('');
      setPhoneNumber('');
      loadData();
    } else {
      setError(res.message || 'Gagal mendaftarkan pengguna');
    }
    setSubmitting(false);
  };

  const handleToggleActive = async (id: number) => {
    const res = await apiFetch(`/users/${id}/toggle-active`, { method: 'PATCH' });
    if (res.success) {
      setSuccess('Status akses pengguna berhasil diubah!');
      loadData();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner Subdomain Controller */}
      <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold">
            <Globe className="w-3.5 h-3.5" />
            admin.mrp.emtku.co.id • SuperAdmin Central Subdomain Control
          </div>
          <h1 className="text-lg font-extrabold tracking-tight">
            Kontrol Akses Multi-Tenant &amp; Pengguna Lintas Perusahaan
          </h1>
          <p className="text-xs text-slate-300">
            Kelola seluruh akun PIC perusahaan, aktivasi WhatsApp 2FA, kuota pengguna per paket SaaS, dan reset kredensial.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/tenants"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            Daftar Perusahaan (Tenants)
          </Link>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Daftarkan User Baru
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="berry-card p-4 space-y-1">
          <span className="text-[11px] text-slate-500 block">Total Pengguna Terdaftar</span>
          <div className="text-xl font-extrabold text-slate-900 font-mono">{users.length} Akun</div>
        </div>
        <div className="berry-card p-4 space-y-1">
          <span className="text-[11px] text-slate-500 block">Pengguna Aktif</span>
          <div className="text-xl font-extrabold text-emerald-600 font-mono">
            {users.filter((u) => u.is_active).length} Aktif
          </div>
        </div>
        <div className="berry-card p-4 space-y-1">
          <span className="text-[11px] text-slate-500 block">Total Perusahaan Klien</span>
          <div className="text-xl font-extrabold text-indigo-700 font-mono">{tenants.length} Tenant</div>
        </div>
        <div className="berry-card p-4 space-y-1">
          <span className="text-[11px] text-slate-500 block">Verifikasi WhatsApp 2FA</span>
          <div className="text-xl font-extrabold text-blue-600 font-mono">
            {users.filter((u) => u.phone_number).length} Terkoneksi
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="berry-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pengguna, email, atau nomor WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={tenantFilter}
          onChange={(e) => setTenantFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="">Semua Perusahaan (Tenant)</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.name} ({t.slug}.mrp.emtku.co.id)
            </option>
          ))}
        </select>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl cursor-pointer"
        >
          Cari
        </button>
      </div>

      {/* Users Table */}
      <div className="berry-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
            <tr>
              <th className="p-4">Nama Pengguna</th>
              <th className="p-4">Email Resmi</th>
              <th className="p-4">No. WhatsApp (2FA)</th>
              <th className="p-4">Peran / Role</th>
              <th className="p-4">Tanggal Registrasi</th>
              <th className="p-4 text-center">Status Akses</th>
              <th className="p-4 text-right">Aksi Kontrol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Memuat data pengguna tenant...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Belum ada pengguna terdaftar.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs flex items-center justify-center">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td className="p-4 font-mono text-slate-600">{u.email}</td>
                  <td className="p-4 font-mono text-slate-600">{u.phone_number || '-'}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px]">
                      {u.roles?.map((r) => r.name).join(', ') || 'Staff / Operator'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">
                    {new Date(u.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        u.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {u.is_active ? 'AKTIF' : 'NON-AKTIF'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleActive(u.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        u.is_active
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {u.is_active ? 'Non-aktifkan' : 'Aktifkan Akun'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah User ke Subdomain Tenant */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Registrasi Akun Pengguna Subdomain Tenant
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenantUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Perusahaan Tenant *</label>
                <select
                  value={selectedTenantSlug}
                  onChange={(e) => setSelectedTenantSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                >
                  <option value="">-- Pusat Admin (Kayu KWAS Master) --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.slug}>
                      {t.name} ({t.slug}.mrp.emtku.co.id)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap PIC / Staff *</label>
                <input
                  type="text"
                  required
                  placeholder="Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Akun *</label>
                  <input
                    type="email"
                    required
                    placeholder="budi@furnindo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp (OTP)</label>
                  <input
                    type="tel"
                    placeholder="081234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran / Jabatan</label>
                  <select
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="PPIC">PPIC (Production Planning)</option>
                    <option value="Mandor">Mandor / Supervisor Pabrik</option>
                    <option value="QC">Quality Control (QC)</option>
                    <option value="Logistik">Logistik &amp; Gudang</option>
                    <option value="Superuser">Administrator Perusahaan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kata Sandi Awal</label>
                  <input
                    type="text"
                    value={initialPassword}
                    onChange={(e) => setInitialPassword(e.target.value)}
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
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Daftarkan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
