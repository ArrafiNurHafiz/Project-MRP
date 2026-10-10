'use client';

import { useState, useEffect } from 'react';
import { apiFetch, Tenant, SaaSPlanInfo, User, getStoredUser } from '@/lib/api';
import { Building2, Plus, Search, CheckCircle2, ShieldCheck, DollarSign, Calendar, Users, Globe, ArrowUpRight, Sparkles, XCircle, AlertCircle, ShoppingCart } from 'lucide-react';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<SaaSPlanInfo[]>([]);
  const [overview, setOverview] = useState<{ total_companies: number; active_clients: number; total_mrr_idr: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [extendModalTenant, setExtendModalTenant] = useState<Tenant | null>(null);

  // Form State Create
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [industry, setIndustry] = useState('Furniture & Kayu Olahan');
  const [planTier, setPlanTier] = useState('PROFESSIONAL');
  const [monthlyPrice, setMonthlyPrice] = useState<number>(3499000);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [npwp, setNpwp] = useState('');

  // Form State Extend
  const [monthsToAdd, setMonthsToAdd] = useState<number>(12);
  const [extendTier, setExtendTier] = useState('PROFESSIONAL');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (tierFilter) query.set('tier', tierFilter);

    const [tRes, pRes, oRes] = await Promise.all([
      apiFetch<any>(`/saas/tenants?${query.toString()}`),
      apiFetch<any>('/saas/plans'),
      apiFetch<any>('/saas/overview'),
    ]);

    if (tRes.success && tRes.data) setTenants(tRes.data.tenants || []);
    if (pRes.success && pRes.data) setPlans(pRes.data || []);
    if (oRes.success && oRes.data) setOverview(oRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tierFilter]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      setError('Nama perusahaan dan subdomain/slug wajib diisi');
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await apiFetch('/saas/tenants', {
      method: 'POST',
      body: JSON.stringify({
        name,
        slug,
        industry,
        plan_tier: planTier,
        monthly_price: Number(monthlyPrice),
        email,
        phone,
        address,
        npwp,
      }),
    });

    if (res.success) {
      setSuccess(`Perusahaan klien "${name}" berhasil didaftarkan ke platform SaaS!`);
      setModalOpen(false);
      setName('');
      setSlug('');
      loadData();
    } else {
      setError(res.message || 'Gagal mendaftarkan tenant');
    }
    setSubmitting(false);
  };

  const handleExtendSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendModalTenant) return;
    setSubmitting(true);

    const res = await apiFetch(`/saas/tenants/${extendModalTenant.id}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify({
        plan_tier: extendTier,
        months_to_add: Number(monthsToAdd),
        monthly_price: extendTier === 'ENTERPRISE' ? 7999000 : extendTier === 'PROFESSIONAL' ? 3499000 : 1499000,
        status: 'ACTIVE',
      }),
    });

    if (res.success) {
      setSuccess(`Langganan ${extendModalTenant.name} berhasil diperpanjang ${monthsToAdd} bulan!`);
      setExtendModalTenant(null);
      loadData();
    } else {
      alert(res.message);
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
              <Globe className="w-5 h-5" />
            </div>
            Multi-Tenant SaaS Management &amp; B2B Subscription Billing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Portal manajemen tenant klien manufaktur (White-label), kontrol kuota pengguna, dan aktivasi paket langganan (Starter, Pro, Enterprise).
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Onboard Perusahaan Klien Baru
        </button>
      </div>

      {/* SaaS Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="berry-card p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Klien Perusahaan:</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            {overview?.total_companies || tenants.length} <span className="text-xs font-normal text-slate-400">Pabrik</span>
          </div>
        </div>

        <div className="berry-card p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Langganan Aktif:</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-600">
            {overview?.active_clients || tenants.filter((t) => t.status === 'ACTIVE').length} <span className="text-xs font-normal text-slate-400">Active Tenants</span>
          </div>
        </div>

        <div className="berry-card p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Monthly Recurring Revenue (MRR):</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-indigo-700">
            Rp {(overview?.total_mrr_idr || 0).toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Notifications */}
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
            placeholder="Cari nama pabrik, slug subdomain, atau industri..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="">Semua Paket SaaS</option>
          <option value="TRIAL">Trial 14 Hari</option>
          <option value="STARTER">Starter SME (Rp 1.49jt/bln)</option>
          <option value="PROFESSIONAL">Professional (Rp 3.49jt/bln)</option>
          <option value="ENTERPRISE">Enterprise Multi-Plant (Rp 7.99jt/bln)</option>
        </select>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl cursor-pointer"
        >
          Cari
        </button>
      </div>

      {/* Tenants Table */}
      <div className="berry-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
            <tr>
              <th className="p-4">Nama Perusahaan Pabrik</th>
              <th className="p-4">Subdomain / Slug</th>
              <th className="p-4">Sektor Industri</th>
              <th className="p-4">Paket Langganan</th>
              <th className="p-4 text-right">Biaya / Bulan</th>
              <th className="p-4">Masa Aktif s.d</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Memuat data klien SaaS...
                </td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Belum ada perusahaan klien terdaftar.
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-[10px] text-slate-500">{t.email || t.phone || '-'}</div>
                  </td>
                  <td className="p-4 font-mono font-bold text-indigo-600">
                    {t.slug}.mrp.emtku.co.id
                  </td>
                  <td className="p-4 text-slate-700 font-medium">{t.industry}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                        t.plan_tier === 'ENTERPRISE'
                          ? 'bg-purple-100 text-purple-800'
                          : t.plan_tier === 'PROFESSIONAL'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {t.plan_tier}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-emerald-600">
                    Rp {t.monthly_price.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-slate-600">
                    {t.subscription_expires_at
                      ? new Date(t.subscription_expires_at).toLocaleDateString('id-ID')
                      : 'Lifetime'}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        t.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        setExtendModalTenant(t);
                        setExtendTier(t.plan_tier);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Kelola Langganan
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pricing Tier Reference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
        {plans.map((p, idx) => (
          <div key={idx} className="berry-card p-5 space-y-3 flex flex-col justify-between border-t-4 border-t-indigo-600">
            <div className="space-y-2">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-extrabold uppercase">
                {p.tier}
              </span>
              <h3 className="text-sm font-extrabold text-slate-900">{p.name}</h3>
              <div className="text-base font-extrabold font-mono text-emerald-600">
                {p.price_idr_per_month > 0 ? `Rp ${p.price_idr_per_month.toLocaleString('id-ID')} / bln` : 'Gratis'}
              </div>
              <ul className="space-y-1 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                {p.features.map((f, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Onboard Client */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                Formulir Onboarding Klien Perusahaan SaaS Baru
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Perusahaan Pabrik *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Jepara Furnindo Internasional"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subdomain / Slug Unik *</label>
                  <input
                    type="text"
                    required
                    placeholder="jepara-furnindo"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sektor Industri</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="Furniture & Kayu Olahan">Furniture &amp; Kayu Olahan (Kitchenware)</option>
                    <option value="Garment & Tekstil">Garment &amp; Tekstil</option>
                    <option value="Food & Beverage (F&B)">Food &amp; Beverage (F&amp;B Manufaktur)</option>
                    <option value="Metal & Fabrikasi Mesin">Metal &amp; Fabrikasi Mesin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paket SaaS yang Dipilih</label>
                  <select
                    value={planTier}
                    onChange={(e) => {
                      const t = e.target.value;
                      setPlanTier(t);
                      if (t === 'STARTER') setMonthlyPrice(1499000);
                      else if (t === 'PROFESSIONAL') setMonthlyPrice(3499000);
                      else if (t === 'ENTERPRISE') setMonthlyPrice(7999000);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  >
                    <option value="STARTER">Starter SME (Rp 1.49jt/bln)</option>
                    <option value="PROFESSIONAL">Professional (Rp 3.49jt/bln)</option>
                    <option value="ENTERPRISE">Enterprise Multi-Plant (Rp 7.99jt/bln)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Resmi Korporat</label>
                  <input
                    type="email"
                    placeholder="corp@furnindo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Telepon Kantor</label>
                  <input
                    type="tel"
                    placeholder="+62 291-591234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Kantor / Kompleks Pabrik</label>
                <textarea
                  rows={2}
                  placeholder="Kawasan Industri Terboyo Blok F No. 12, Semarang..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
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
                  {submitting ? 'Mendaftarkan...' : 'Aktifkan Tenant Klien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Perpanjang Langganan */}
      {extendModalTenant && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-200">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Kelola Langganan: {extendModalTenant.name}
            </h2>

            <form onSubmit={handleExtendSubscription} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Paket SaaS</label>
                <select
                  value={extendTier}
                  onChange={(e) => setExtendTier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                >
                  <option value="STARTER">Starter SME (Rp 1.490.000 / bln)</option>
                  <option value="PROFESSIONAL">Professional (Rp 3.490.000 / bln)</option>
                  <option value="ENTERPRISE">Enterprise Multi-Plant (Rp 7.990.000 / bln)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Durasi Perpanjangan (Bulan)</label>
                <select
                  value={monthsToAdd}
                  onChange={(e) => setMonthsToAdd(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                >
                  <option value={1}>1 Bulan</option>
                  <option value={3}>3 Bulan (Diskon 5%)</option>
                  <option value={6}>6 Bulan (Diskon 10%)</option>
                  <option value={12}>12 Bulan / 1 Tahun (Diskon 20%)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExtendModalTenant(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/25"
                >
                  Konfirmasi Perpanjangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
