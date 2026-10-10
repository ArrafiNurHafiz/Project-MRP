'use client';

import { useState, useEffect } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Activity,
  Filter,
} from 'lucide-react';
import { apiFetch, AuditLog, User as UserType, getStoredUser, hasPermission, isSuperuser } from '@/lib/api';
import AccessDenied from '@/components/AccessDenied';

export default function AuditLogsPage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ logs: AuditLog[]; total: number }>(
        `/audit-logs?search=${encodeURIComponent(search)}&page=${page}&limit=20`
      );
      if (res.success && res.data) {
        setLogs(res.data.logs || []);
        setTotal(res.data.total || 0);
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
    if (user && (isSuperuser(user) || hasPermission(user, 'lihat catatan aktivitas'))) {
      fetchLogs();
    } else {
      setLoading(false);
    }
  }, [page, search]);

  if (!loading && currentUser && !isSuperuser(currentUser) && !hasPermission(currentUser, 'lihat catatan aktivitas')) {
    return <AccessDenied requiredPermission="lihat catatan aktivitas" />;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <History className="w-5 h-5" />
            </div>
            Catatan Aktivitas Sistem (Audit Trail)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Jejak rekam permanen seluruh aktivitas pengguna, perubahan status penawaran, pesanan, SPK, dan alokasi material gudang.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="berry-card p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari deskripsi aksi atau tipe aktivitas..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs transition-all"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="berry-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
              <tr>
                <th className="py-4 px-5">Waktu Kejadian</th>
                <th className="py-4 px-5">Pengguna / Aktor</th>
                <th className="py-4 px-5">Tipe Tindakan</th>
                <th className="py-4 px-5">Rincian Deskripsi Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Memuat catatan aktivitas...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Belum ada riwayat catatan aktivitas.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.user?.name || 'Sistem Otomatis'}</div>
                      <div className="text-[10px] text-slate-400">{log.user?.email || '-'}</div>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-700 font-medium">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
