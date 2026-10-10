'use client';

import { useState, useEffect } from 'react';
import { apiFetch, MaintenanceTask, WorkStation, User, getStoredUser } from '@/lib/api';
import { Wrench, Plus, Search, CheckCircle2, Clock, Calendar, AlertCircle, XCircle, ShieldAlert } from 'lucide-react';

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [completeModalTask, setCompleteModalTask] = useState<MaintenanceTask | null>(null);

  // Form State Create
  const [stationId, setStationId] = useState<number>(1);
  const [machineName, setMachineName] = useState('');
  const [taskType, setTaskType] = useState<'PREVENTIVE' | 'CORRECTIVE' | 'CALIBRATION'>('PREVENTIVE');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [technicianUserId, setTechnicianUserId] = useState<number>(0);
  const [sparePartNotes, setSparePartNotes] = useState('Pelumasan rel linear bearing & penggantian filter kompresor');
  const [costEstimated, setCostEstimated] = useState<number>(250000);

  // Form State Complete
  const [actionLog, setActionLog] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (statusFilter) query.set('status', statusFilter);

    const [tRes, sRes, uRes] = await Promise.all([
      apiFetch<any>(`/enterprise/maintenance?${query.toString()}`),
      apiFetch<any>('/stations'),
      apiFetch<any>('/users?limit=100'),
    ]);

    if (tRes.success && tRes.data) setTasks(tRes.data.tasks || []);
    if (sRes.success && sRes.data) setStations(sRes.data || []);
    if (uRes.success && uRes.data) {
      setTechnicians(uRes.data.users || []);
      if (uRes.data.users && uRes.data.users.length > 0) {
        setTechnicianUserId(uRes.data.users[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationId || !machineName) {
      setError('Stasiun dan nama mesin wajib diisi');
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await apiFetch('/enterprise/maintenance', {
      method: 'POST',
      body: JSON.stringify({
        station_id: Number(stationId),
        machine_name: machineName,
        task_type: taskType,
        scheduled_date: new Date(scheduledDate).toISOString(),
        technician_user_id: Number(technicianUserId),
        spare_part_notes: sparePartNotes,
        cost_estimated: Number(costEstimated),
      }),
    });

    if (res.success) {
      setSuccess('Jadwal perawatan mesin berhasil dibuat!');
      setModalOpen(false);
      setMachineName('');
      loadData();
    } else {
      setError(res.message || 'Gagal membuat jadwal perawatan');
    }
    setSubmitting(false);
  };

  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalTask) return;
    setSubmitting(true);

    const res = await apiFetch(`/enterprise/maintenance/${completeModalTask.id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({
        action_log: actionLog || 'Perawatan & pelumasan selesai, mesin siap beroperasi 100%',
      }),
    });

    if (res.success) {
      setSuccess(`Perawatan mesin ${completeModalTask.machine_name} selesai dicatat!`);
      setCompleteModalTask(null);
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
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Wrench className="w-5 h-5" />
            </div>
            Preventive &amp; Corrective Maintenance Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standar industri Infor &amp; ECOUNT: Jadwal servis berkala mesin, kalibrasi sensor laser, penggantian spare-part &amp; riwayat pemeliharaan.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Jadwalkan Servis Baru
        </button>
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

      {/* Filter */}
      <div className="berry-card p-4 flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="">Semua Status Jadwal</option>
          <option value="SCHEDULED">SCHEDULED (Terjadwal)</option>
          <option value="COMPLETED">COMPLETED (Selesai Servis)</option>
        </select>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl cursor-pointer"
        >
          Cari
        </button>
      </div>

      {/* Table */}
      <div className="berry-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
            <tr>
              <th className="p-4">No. Perawatan</th>
              <th className="p-4">Mesin / Lokasi</th>
              <th className="p-4">Tipe Servis</th>
              <th className="p-4">Jadwal Pelaksanaan</th>
              <th className="p-4">Teknisi Penanggung Jawab</th>
              <th className="p-4 text-right">Estimasi Biaya</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Memuat jadwal perawatan mesin...
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Belum ada jadwal pemeliharaan mesin.
                </td>
              </tr>
            ) : (
              tasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-blue-600">{t.task_number}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{t.machine_name}</div>
                    <div className="text-[10px] text-slate-500">{t.station?.name}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-bold text-[10px]">
                      {t.task_type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">
                    {new Date(t.scheduled_date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="p-4 font-bold text-slate-800">{t.technician_user?.name || 'Staff Mekanik'}</td>
                  <td className="p-4 text-right font-mono font-bold text-slate-900">
                    Rp {t.cost_estimated.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {t.status !== 'COMPLETED' && (
                      <button
                        onClick={() => {
                          setCompleteModalTask(t);
                          setActionLog('Pemeriksaan motor listrik & pelumasan selesai, hasil uji kalibrasi presisi');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Tandai Selesai
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Buat Tugas Servis */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                Jadwalkan Perawatan Mesin Baru
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stasiun Kerja *</label>
                  <select
                    value={stationId}
                    onChange={(e) => setStationId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    {stations.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.station_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Mesin *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Mesin Serut Jointer 16 Inch"
                    value={machineName}
                    onChange={(e) => setMachineName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Servis</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  >
                    <option value="PREVENTIVE">Servis Berkala (Preventive)</option>
                    <option value="CORRECTIVE">Perbaikan (Corrective)</option>
                    <option value="CALIBRATION">Kalibrasi Akurasi</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Rencana</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimasi Biaya (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={costEstimated}
                    onChange={(e) => setCostEstimated(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Teknisi / Mekanik Penanggung Jawab</label>
                <select
                  value={technicianUserId}
                  onChange={(e) => setTechnicianUserId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                >
                  {technicians.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Daftar Sparepart &amp; Rencana Servis</label>
                <textarea
                  rows={2}
                  value={sparePartNotes}
                  onChange={(e) => setSparePartNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/25"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Selesaikan Servis */}
      {completeModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-200">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Selesaikan Servis: {completeModalTask.machine_name}
            </h2>

            <form onSubmit={handleCompleteTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tindakan Teknisi</label>
                <textarea
                  rows={3}
                  required
                  value={actionLog}
                  onChange={(e) => setActionLog(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompleteModalTask(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/25"
                >
                  Simpan Hasil Servis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
