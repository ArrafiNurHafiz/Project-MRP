'use client';

import { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  User,
  ArrowRight,
  ShieldCheck,
  Building,
  Package,
  FileText,
  X,
} from 'lucide-react';
import {
  apiFetch,
  MitraShipment,
  Product,
  User as UserType,
  getStoredUser,
  hasPermission,
  isSuperuser,
  hasRole,
} from '@/lib/api';

export default function LogisticsPage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [shipments, setShipments] = useState<MitraShipment[]>([]);
  const [mitraUsers, setMitraUsers] = useState<UserType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [vehicleGateStatus, setVehicleGateStatus] = useState<'keluar' | 'masuk'>('keluar');
  const [productAction, setProductAction] = useState<'kirim' | 'ambil'>('kirim');
  const [driverName, setDriverName] = useState('Joko Susilo');
  const [helperName, setHelperName] = useState('Bambang');
  const [vehicleType, setVehicleType] = useState('L300 Pick Up');
  const [licensePlate, setLicensePlate] = useState('AD 8623 KW');
  const [mitraId, setMitraId] = useState<number>(0);
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split('T')[0]);
  const [movementTime, setMovementTime] = useState('09:30');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState([
    { product_id: 0, raw_item_name: 'Kayu Potongan Setengah Jadi', qty: 150, status_category: 'revisi_total' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const canManageLogistics =
    isSuperuser(currentUser) ||
    hasRole(currentUser, 'PPIC') ||
    hasRole(currentUser, 'Logistik') ||
    hasPermission(currentUser, 'kelola mutasi logistik');

  const fetchShipments = async () => {
    try {
      const res = await apiFetch<{ shipments: MitraShipment[]; total: number }>(
        '/logistics?limit=100'
      );
      if (res.success && res.data) {
        setShipments(res.data.shipments || []);
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
    } catch (err) {
      // Ignored
    }
  };

  useEffect(() => {
    Promise.all([fetchShipments(), fetchMeta()]).finally(() => setLoading(false));
  }, []);

  const handleAddItem = () => {
    setItems([
      ...items,
      { product_id: 0, raw_item_name: 'Bahan Olahan Tambahan', qty: 50, status_category: 'revisi_total' },
    ]);
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch('/logistics', {
        method: 'POST',
        body: JSON.stringify({
          vehicle_gate_status: vehicleGateStatus,
          product_action: productAction,
          movement_date: movementDate,
          movement_time: movementTime,
          driver_name: driverName,
          helper_name: helperName,
          vehicle_type: vehicleType,
          license_plate: licensePlate,
          mitra_id: mitraId ? Number(mitraId) : null,
          notes: notes,
          items: items.map((it) => ({
            product_id: it.product_id ? Number(it.product_id) : null,
            raw_item_name: it.raw_item_name,
            qty: Number(it.qty),
            status_category: it.status_category,
          })),
        }),
      });

      if (!res.success) {
        setError(res.message || 'Gagal menerbitkan Surat Jalan armada');
        setSubmitting(false);
        return;
      }

      setSuccess('Surat Jalan dan Mutasi Armada Logistik berhasil diterbitkan!');
      setShowModal(false);
      fetchShipments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Truck className="w-5 h-5" />
            </div>
            Mutasi Logistik Armada &amp; Surat Jalan (SJ)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan pergerakan armada pabrik: Gate Out (Kirim bahan baku ke mitra) &amp; Gate In (Jemput hasil olahan mitra).
          </p>
        </div>

        {canManageLogistics && (
          <button
            onClick={() => {
              if (mitraUsers.length > 0 && !mitraId) setMitraId(mitraUsers[0].id);
              setShowModal(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Terbitkan Surat Jalan Baru
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

      {/* Shipments Table */}
      <div className="berry-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
              <tr>
                <th className="py-4 px-5">No. Surat Jalan</th>
                <th className="py-4 px-5">Arah Gerbang</th>
                <th className="py-4 px-5">Aksi Muatan</th>
                <th className="py-4 px-5">Bengkel Mitra Tujuan</th>
                <th className="py-4 px-5">Driver &amp; Armada</th>
                <th className="py-4 px-5">Waktu Mutasi</th>
                <th className="py-4 px-5">Rincian Muatan Barang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Memuat data logistik armada...
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada manifest surat jalan tercatat.
                  </td>
                </tr>
              ) : (
                shipments.map((s) => {
                  const isOut = s.vehicle_gate_status === 'keluar';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-indigo-600">
                        {s.sj_number}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                            isOut
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Gate {s.vehicle_gate_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-slate-900 capitalize">
                          {s.product_action === 'kirim' ? 'Kirim Bahan Baku' : 'Jemput Hasil Olahan'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-800">
                        {s.mitra?.name || 'In-House Pabrik'}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{s.driver_name}</div>
                        <div className="text-[10px] text-slate-500">
                          {s.vehicle_type} ({s.license_plate})
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-600 text-[11px]">
                        {s.movement_date} {s.movement_time}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="space-y-1">
                          {s.items?.map((it, idx) => (
                            <div key={idx} className="text-slate-700 text-[11px]">
                              • {it.product?.product_name || it.raw_item_name}{' '}
                              <b className="text-indigo-600 font-mono">({it.qty} pcs)</b>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Terbitkan Surat Jalan */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                Penerbitan Surat Jalan Armada Logistik
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Arah Gerbang Pabrik</label>
                  <select
                    value={vehicleGateStatus}
                    onChange={(e) => setVehicleGateStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  >
                    <option value="keluar">Keluar (Gate Out)</option>
                    <option value="masuk">Masuk (Gate In)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tujuan Operasional</label>
                  <select
                    value={productAction}
                    onChange={(e) => setProductAction(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  >
                    <option value="kirim">Kirim Bahan Baku ke Mitra</option>
                    <option value="ambil">Jemput Hasil Olahan dari Mitra</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bengkel Mitra Terkait</label>
                  <select
                    value={mitraId}
                    onChange={(e) => setMitraId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="0">-- Pabrik / Internal --</option>
                    {mitraUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Driver &amp; Kenek</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Nama Supir"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kendaraan &amp; Plat Nomor</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                      placeholder="L300"
                    />
                    <input
                      type="text"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                      placeholder="AD 8623 KW"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal &amp; Jam Muat</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={movementDate}
                      onChange={(e) => setMovementDate(e.target.value)}
                      className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                    <input
                      type="text"
                      value={movementTime}
                      onChange={(e) => setMovementTime(e.target.value)}
                      className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                      placeholder="09:30"
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-indigo-700 uppercase">
                    Rincian Muatan Barang
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                  >
                    + Tambah Baris Barang
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="col-span-5">
                      <select
                        value={it.product_id}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].product_id = Number(e.target.value);
                          setItems(updated);
                        }}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                      >
                        <option value="0">-- Custom / Bahan --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.product_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Nama Barang"
                        value={it.raw_item_name}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].raw_item_name = e.target.value;
                          setItems(updated);
                        }}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={it.qty}
                        onChange={(e) => {
                          const updated = [...items];
                          updated[idx].qty = Number(e.target.value);
                          setItems(updated);
                        }}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 text-center font-bold"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
                  {submitting ? 'Menerbitkan...' : 'Terbitkan Surat Jalan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
