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
  Trash2,
  UserX,
  UserCheck,
  Building,
  DollarSign,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import {
  apiFetch,
  MitraProductStationAssignment,
  Product,
  WorkStation,
  User as UserType,
  getStoredUser,
  hasPermission,
  isSuperuser,
  hasRole,
} from '@/lib/api';
import ImportDataModal from '@/components/ImportDataModal';

export default function MitraAssignmentsPage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [assignments, setAssignments] = useState<MitraProductStationAssignment[]>([]);
  const [mitraUsers, setMitraUsers] = useState<UserType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [mitraUserId, setMitraUserId] = useState<number>(0);
  const [productId, setProductId] = useState<number>(0);
  const [stationId, setStationId] = useState<number>(1);
  const [pieceRateFee, setPieceRateFee] = useState<number>(3500);
  const [dailyCapacity, setDailyCapacity] = useState<number>(150);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const canManage =
    isSuperuser(currentUser) ||
    hasRole(currentUser, 'PPIC') ||
    hasRole(currentUser, 'Mandor') ||
    hasPermission(currentUser, 'kelola spk');

  const fetchAssignments = async () => {
    try {
      const res = await apiFetch<MitraProductStationAssignment[]>('/mitra-assignments');
      if (res.success && res.data) {
        setAssignments(res.data || []);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchMeta = async () => {
    try {
      const userRes = await apiFetch<{ users: UserType[] }>('/users?limit=100');
      if (userRes.success && userRes.data) {
        setMitraUsers(
          userRes.data.users?.filter(
            (u) =>
              u.roles?.some((r) => r.name.toLowerCase() === 'mitra') ||
              u.roles?.some((r) => r.name.toLowerCase() === 'operator')
          ) || []
        );
      }

      const prodRes = await apiFetch<{ products: Product[] }>('/products?limit=100');
      if (prodRes.success && prodRes.data) {
        setProducts(prodRes.data.products || []);
      }

      const stRes = await apiFetch<WorkStation[]>('/stations');
      if (stRes.success && stRes.data) {
        setStations(stRes.data?.filter((s) => s.is_external_allowed) || []);
      }
    } catch (err) {
      // Ignored
    }
  };

  useEffect(() => {
    Promise.all([fetchAssignments(), fetchMeta()]).finally(() => setLoading(false));
  }, []);

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mitraUserId || !productId || !stationId) {
      setError('Mitra, Produk, dan Stasiun kerja wajib dipilih');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch('/mitra-assignments', {
        method: 'POST',
        body: JSON.stringify({
          mitra_user_id: Number(mitraUserId),
          product_id: Number(productId),
          station_id: Number(stationId),
          piece_rate_fee: Number(pieceRateFee),
          daily_capacity_estimate: Number(dailyCapacity),
          notes: notes,
        }),
      });

      if (!res.success) {
        setError(res.message || 'Gagal menyimpan spesialisasi mitra');
        setSubmitting(false);
        return;
      }

      setSuccess('Spesialisasi dan tarif borongan mitra berhasil dikonfigurasi!');
      setShowModal(false);
      fetchAssignments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus penugasan spesialisasi mitra ini?')) return;
    try {
      const res = await apiFetch(`/mitra-assignments/${id}`, { method: 'DELETE' });
      if (res.success) {
        setSuccess('Penugasan spesialisasi berhasil dihapus');
        fetchAssignments();
      }
    } catch (err: any) {
      setError(err.message);
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
            Spesialisasi &amp; Tarif Borongan Mitra
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penetapan kapasitas harian dan upah borongan per pcs untuk mitra bengkel luar di Stasiun 1 (Wood Working), Stasiun 2 (Pasca WW), dan Stasiun 3 (Finishing).
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setImportModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Import Mitra CSV
            </button>
            <button
              onClick={() => {
                if (mitraUsers.length > 0 && !mitraUserId) setMitraUserId(mitraUsers[0].id);
                if (products.length > 0 && !productId) setProductId(products[0].id);
                if (stations.length > 0 && !stationId) setStationId(stations[0].id);
                setShowModal(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Spesialisasi
            </button>
          </div>
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

      {/* Table of Assignments */}
      <div className="berry-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
              <tr>
                <th className="py-4 px-5">Nama Mitra</th>
                <th className="py-4 px-5">Produk Kitchenware</th>
                <th className="py-4 px-5">Stasiun Kerja</th>
                <th className="py-4 px-5 text-right">Tarif Borongan / Pcs</th>
                <th className="py-4 px-5 text-right">Kapasitas Harian</th>
                <th className="py-4 px-5">Catatan Spesifikasi</th>
                {canManage && <th className="py-4 px-5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Memuat data spesialisasi mitra...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada spesialisasi mitra yang didaftarkan.
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{a.mitra_user?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {a.mitra_user?.phone_number || a.mitra_user?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-indigo-600">
                      {a.product?.product_name}
                      <span className="block text-[10px] text-slate-400 font-normal font-mono">
                        [{a.product?.product_code}]
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {a.station?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-extrabold text-sm text-emerald-600">
                      Rp {a.piece_rate_fee.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-700 font-bold">
                      {a.daily_capacity_estimate} pcs/hari
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 text-[11px]">
                      {a.notes || '-'}
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal Tambah Spesialisasi */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Tambah Spesialisasi Mitra
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Pengrajin / Bengkel Mitra *</label>
                <select
                  required
                  value={mitraUserId}
                  onChange={(e) => setMitraUserId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                >
                  <option value="0">-- Pilih Mitra --</option>
                  {mitraUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.phone_number || u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Produk *</label>
                  <select
                    required
                    value={productId}
                    onChange={(e) => setProductId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="0">-- Pilih Produk --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_name} ({p.product_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stasiun Kerja (1-3) *</label>
                  <select
                    required
                    value={stationId}
                    onChange={(e) => setStationId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    {stations.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.station_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarif Borongan (Rp / Pcs) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={pieceRateFee}
                    onChange={(e) => setPieceRateFee(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-emerald-600 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimasi Kapasitas (Pcs/Hari)</label>
                  <input
                    type="number"
                    min={1}
                    value={dailyCapacity}
                    onChange={(e) => setDailyCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Spesialisasi</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keahlian khusus serat kayu, amplas halus..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Spesialisasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Data Spesialisasi Mitra */}
      <ImportDataModal
        moduleName="mitra-assignments"
        moduleLabel="Spesialisasi Bengkel & Tarif Borongan Mitra"
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          fetchAssignments();
          setSuccess('Import data spesialisasi mitra berhasil diproses!');
        }}
      />
    </div>
  );
}
