'use client';

import { useState, useEffect } from 'react';
import { apiFetch, CompanySetting } from '@/lib/api';
import { Settings, CheckCircle2, AlertCircle, Building2, Mail, Phone, MapPin, FileText } from 'lucide-react';

export default function CompanySettingsPage() {
  const [setting, setSetting] = useState<CompanySetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [npwp, setNpwp] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const loadData = async () => {
    setLoading(true);
    const res = await apiFetch<CompanySetting>('/company-settings');
    if (res.success && res.data) {
      setSetting(res.data);
      setCompanyName(res.data.company_name);
      setNpwp(res.data.npwp || '');
      setEmail(res.data.email || '');
      setPhone(res.data.phone || '');
      setAddress(res.data.address || '');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      company_name: companyName,
      npwp,
      email,
      phone,
      address,
    };

    const res = await apiFetch<CompanySetting>('/company-settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      setSuccess('Profil perusahaan berhasil disimpan!');
      loadData();
    } else {
      setError(res.message || 'Gagal menyimpan profil perusahaan');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Settings className="w-5 h-5" />
            </div>
            Company &amp; Tenant Enterprise Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengaturan data identitas resmi perusahaan, legalitas NPWP, kontak, dan alamat pabrik untuk kop surat penawaran &amp; faktur resmi.
          </p>
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

      {/* Form Container */}
      <div className="berry-card p-8 max-w-3xl">
        <form onSubmit={handleSave} className="space-y-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Resmi Perusahaan (Tenant) *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Pokok Wajib Pajak (NPWP)</label>
              <input
                type="text"
                value={npwp}
                onChange={(e) => setNpwp(e.target.value)}
                placeholder="01.234.567.8-901.000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Telepon Kantor</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Resmi Korporat</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Alamat Kantor &amp; Pabrik Manufaktur</label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
