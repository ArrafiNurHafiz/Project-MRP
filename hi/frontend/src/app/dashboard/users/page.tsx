'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Phone,
  Mail,
  UserX,
  UserCheck,
  Building,
  KeyRound,
  X,
  Sparkles,
} from 'lucide-react';
import {
  apiFetch,
  User as UserType,
  Role,
  getStoredUser,
  hasPermission,
  isSuperuser,
  hasRole,
} from '@/lib/api';

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const canManageUsers = isSuperuser(currentUser) || hasPermission(currentUser, 'kelola pengguna');

  const fetchUsers = async () => {
    try {
      const res = await apiFetch<{ users: UserType[]; total: number }>(
        `/users?search=${encodeURIComponent(search)}&limit=100`
      );
      if (res.success && res.data) {
        setUsers(res.data.users || []);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await apiFetch<Role[]>('/roles');
      if (res.success && res.data) {
        setRoles(res.data || []);
      }
    } catch (err: any) {
      // Ignore if not allowed
    }
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchRoles()]).finally(() => setLoading(false));
  }, [search]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone_number: phone,
          role_ids: selectedRoleIds,
        }),
      });

      if (!res.success) {
        setError(res.message || 'Gagal mendaftarkan pengguna');
        setSubmitting(false);
        return;
      }

      setSuccess(`Calon pengguna ${name} berhasil didaftarkan! Token aktivasi WhatsApp siap dikirimkan.`);
      setShowCreateModal(false);
      setName('');
      setEmail('');
      setPhone('');
      setSelectedRoleIds([]);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: UserType) => {
    const action = user.is_active ? 'menonaktifkan' : 'mengaktifkan';
    if (!confirm(`Apakah Anda yakin ingin ${action} akun ${user.name}?`)) return;

    try {
      const res = await apiFetch(`/users/${user.id}/toggle-active`, { method: 'PATCH' });
      if (res.success) {
        setSuccess(`Status akun ${user.name} berhasil diperbarui`);
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleRoleSelection = (roleId: number) => {
    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter((id) => id !== roleId));
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId]);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            Manajemen Pengguna &amp; Cold Bonding
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Superuser mendaftarkan nomor telepon tanpa membuatkan kata sandi. Pengguna mengaktifkan mandiri via OTP WhatsApp.
          </p>
        </div>

        {canManageUsers && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Daftarkan Pengguna
          </button>
        )}
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

      {/* Search Bar */}
      <div className="berry-card p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau nomor WhatsApp pengguna..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs transition-all"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="berry-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
              <tr>
                <th className="py-4 px-5">Nama Pengguna</th>
                <th className="py-4 px-5">Kontak WhatsApp / Email</th>
                <th className="py-4 px-5">Peran &amp; Jabatan</th>
                <th className="py-4 px-5">Status Aktivasi</th>
                <th className="py-4 px-5">Status Akun</th>
                {canManageUsers && <th className="py-4 px-5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Memuat daftar pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[10px] text-slate-400">ID: {u.id}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="text-slate-800 font-medium">{u.email}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {u.phone_number || '-'}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r) => (
                            <span
                              key={r.id}
                              className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                            >
                              {r.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Tanpa Peran</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      {u.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-bold">
                          Pending Aktivasi
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {u.is_active ? (
                        <span className="text-[11px] font-bold text-emerald-600">Diizinkan</span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-600">Dinonaktifkan</span>
                      )}
                    </td>
                    {canManageUsers && (
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                            u.is_active
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Pengguna */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Pendaftaran Calon Pengguna Baru
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Budi Santoso"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Resmi *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi@kayukwas.co.id"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Telepon / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Pilih Peran &amp; Jabatan (Multi-Role Support)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => {
                    const isSelected = selectedRoleIds.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleRoleSelection(r.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{r.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Daftarkan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
