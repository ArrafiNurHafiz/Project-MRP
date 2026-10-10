'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  ShieldPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Lock,
  X,
  Sparkles,
  Key,
  Plus,
  Edit2,
} from 'lucide-react';
import { apiFetch, Role, Permission, User as UserType, getStoredUser, hasPermission, isSuperuser } from '@/lib/api';
import AccessDenied from '@/components/AccessDenied';

export default function RolesPage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit Permissions Modal
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  // Create Role Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [creatingRole, setCreatingRole] = useState(false);

  const fetchData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        apiFetch<Role[]>('/roles'),
        apiFetch<Permission[]>('/permissions'),
      ]);

      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data);
      }
      if (permsRes.success && permsRes.data) {
        setPermissions(permsRes.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
    if (user && (isSuperuser(user) || hasPermission(user, 'kelola peran') || hasPermission(user, 'kelola akses'))) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  if (!loading && currentUser && !isSuperuser(currentUser) && !hasPermission(currentUser, 'kelola peran') && !hasPermission(currentUser, 'kelola akses')) {
    return <AccessDenied requiredPermission="kelola peran / kelola akses" />;
  }

  const handleOpenEditPerms = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermIds(role.permissions?.map((p) => p.id) || []);
    setError(null);
    setSuccess(null);
  };

  const handleTogglePerm = (permId: number) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSavePerms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setSavingPerms(true);
    setError(null);

    try {
      const res = await apiFetch(`/roles/${selectedRole.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permission_ids: selectedPermIds }),
      });

      if (!res.success) {
        setError(res.message || 'Gagal memperbarui izin peran');
        setSavingPerms(false);
        return;
      }

      setSuccess(`Hak akses untuk peran ${selectedRole.name} berhasil diperbarui!`);
      setSelectedRole(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingPerms(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setCreatingRole(true);
    setError(null);

    try {
      const res = await apiFetch('/roles', {
        method: 'POST',
        body: JSON.stringify({ name: newRoleName.trim() }),
      });

      if (!res.success) {
        setError(res.message || 'Gagal membuat peran baru');
        setCreatingRole(false);
        return;
      }

      setSuccess(`Peran baru ${newRoleName} berhasil dibuat!`);
      setShowCreateModal(false);
      setNewRoleName('');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingRole(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Shield className="w-5 h-5" />
            </div>
            Peran &amp; Matriks Hak Akses (RBAC)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengaturan peran operasional pabrik (PPIC, Mandor, QC, Operator, Mitra, Logistik) dan izin fungsional per modul.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Peran Baru
        </button>
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

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400 berry-card">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Memuat data peran...
          </div>
        ) : (
          roles.map((r) => {
            const isSuper = r.name.toLowerCase() === 'superuser';
            return (
              <div
                key={r.id}
                className="berry-card p-6 space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{r.name}</h3>
                      <span className="text-[10px] text-slate-500">ID Peran: {r.id}</span>
                    </div>
                    {isSuper ? (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-purple-100 text-purple-800 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Full Access
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700">
                        {r.permissions?.length || 0} Izin
                      </span>
                    )}
                  </div>

                  {/* Permissions Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Daftar Izin Terpasang:
                    </span>
                    <div className="flex flex-wrap gap-1.5 min-h-[48px]">
                      {isSuper ? (
                        <span className="text-[11px] text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md font-semibold border border-purple-100">
                          Bypass otomatis seluruh otorisasi sistem
                        </span>
                      ) : r.permissions && r.permissions.length > 0 ? (
                        r.permissions.map((p) => (
                          <span
                            key={p.id}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200"
                          >
                            {p.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum ada izin dikonfigurasi</span>
                      )}
                    </div>
                  </div>
                </div>

                {!isSuper && (
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditPerms(r)}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Atur Hak Akses
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Edit Hak Akses */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600" />
                Matriks Hak Akses: {selectedRole.name}
              </h2>
              <button
                onClick={() => setSelectedRole(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePerms} className="space-y-4 text-xs">
              <div className="space-y-2 max-h-[60vh] overflow-y-auto p-1">
                {permissions.map((p) => {
                  const isChecked = selectedPermIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleTogglePerm(p.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="capitalize">{p.name}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingPerms}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  {savingPerms ? 'Menyimpan...' : 'Simpan Perubahan Hak Akses'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Peran Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Tambah Peran / Jabatan Baru
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Peran *</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Contoh: Auditor Mutu"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                />
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
                  disabled={creatingRole}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  {creatingRole ? 'Menyimpan...' : 'Simpan Peran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
