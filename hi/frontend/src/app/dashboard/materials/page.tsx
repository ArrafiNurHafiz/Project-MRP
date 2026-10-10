'use client';

import { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowUpDown,
  History,
  X,
  Edit2,
  DollarSign,
  Tag,
  Filter,
  Eye,
  Archive,
  BarChart,
} from 'lucide-react';
import {
  apiFetch,
  Material,
  User as UserType,
  getStoredUser,
  hasPermission,
  isSuperuser,
  hasRole,
} from '@/lib/api';
import ImportDataModal from '@/components/ImportDataModal';

export default function MaterialsPage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [abcFilter, setAbcFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State Tambah Material
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [materialCode, setMaterialCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'wood' | 'chemical' | 'packaging' | 'accessory'>('wood');
  const [abcClass, setAbcClass] = useState<'A' | 'B' | 'C'>('A');
  const [materialType, setMaterialType] = useState<'Raw Material' | 'Packaging' | 'Consumable'>('Raw Material');
  const [unit, setUnit] = useState('batang');
  const [stockQty, setStockQty] = useState<number>(100);
  const [minimumStock, setMinimumStock] = useState<number>(20);
  const [costPerUnit, setCostPerUnit] = useState<number>(15000);
  const [description, setDescription] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Detail Modal
  const [detailMaterial, setDetailMaterial] = useState<Material | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Modal State Penyesuaian Stok
  const [adjustModalMaterial, setAdjustModalMaterial] = useState<Material | null>(null);
  const [qtyDelta, setQtyDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Penerimaan pengadaan kayu log baru');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const canManageMaterials =
    isSuperuser(currentUser) ||
    hasRole(currentUser, 'PPIC') ||
    hasRole(currentUser, 'Logistik') ||
    hasPermission(currentUser, 'kelola spk');

  const fetchMaterials = async () => {
    try {
      const res = await apiFetch<{ materials: Material[]; total: number }>(
        `/materials?search=${encodeURIComponent(search)}&category=${categoryFilter}&limit=100`
      );
      if (res.success && res.data) {
        setMaterials(res.data.materials || []);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchMaterials().finally(() => setLoading(false));
  }, [search, categoryFilter]);

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCreate(true);
    setError(null);

    try {
      const res = await apiFetch('/materials', {
        method: 'POST',
        body: JSON.stringify({
          material_code: materialCode,
          name: name,
          category: category,
          abc_classification: abcClass,
          material_type: materialType,
          unit: unit,
          stock_qty: Number(stockQty),
          minimum_stock: Number(minimumStock),
          cost_per_unit: Number(costPerUnit),
          description: description,
        }),
      });

      if (!res.success) {
        setError(res.message || 'Gagal menambahkan material');
        setSubmittingCreate(false);
        return;
      }

      setSuccess(`Material ${name} (${materialCode}) berhasil didaftarkan ke inventaris MRP!`);
      setShowCreateModal(false);
      setName('');
      setDescription('');
      fetchMaterials();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalMaterial) return;
    setSubmittingAdjust(true);
    setError(null);

    try {
      const res = await apiFetch(`/materials/${adjustModalMaterial.id}/adjust-stock`, {
        method: 'PATCH',
        body: JSON.stringify({
          qty_delta: Number(qtyDelta),
          reason: adjustReason,
        }),
      });

      if (!res.success) {
        setError(res.message || 'Gagal menyesuaikan stok');
        setSubmittingAdjust(false);
        return;
      }

      setSuccess(`Stok material ${adjustModalMaterial.name} berhasil diperbarui!`);
      setAdjustModalMaterial(null);
      fetchMaterials();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const filteredMaterials = materials.filter((m) => {
    if (abcFilter === 'ALL') return true;
    return (m.abc_classification || 'A') === abcFilter;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'wood':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'chemical':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'packaging':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accessory':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Boxes className="w-5 h-5" />
            </div>
            Inventaris Bahan Baku &amp; Klasifikasi ABC (MRP Inventory)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan stok fisik kayu log, amplas, dempul, cat finishing, laser plate, dan kardus kemasan dengan kontrol Reorder Point (ROP).
          </p>
        </div>

        {canManageMaterials && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setImportModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Archive className="w-3.5 h-3.5 text-indigo-600" />
              Import CSV
            </button>
            <button
              onClick={() => {
                const code = `MAT-${category.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;
                setMaterialCode(code);
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Material Baru
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

      {/* ABC Classification Filter Pills & Search */}
      <div className="berry-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* ABC Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setAbcFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                abcFilter === 'ALL' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua Material ({materials.length})
            </button>
            <button
              onClick={() => setAbcFilter('A')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                abcFilter === 'A' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Kelas A (Nilai Tinggi / Prioritas Utama)
            </button>
            <button
              onClick={() => setAbcFilter('B')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                abcFilter === 'B' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Kelas B (Menengah)
            </button>
            <button
              onClick={() => setAbcFilter('C')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                abcFilter === 'C' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Kelas C (Volume Tinggi / Nilai Rendah)
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-medium"
            >
              <option value="all">Semua Kategori Bahan</option>
              <option value="wood">Kayu (Mahoni, Jati, Sonokeling)</option>
              <option value="chemical">Kimia &amp; Finishing (Cat, Thinner, Dempul)</option>
              <option value="packaging">Kemasan &amp; Kardus</option>
              <option value="accessory">Aksesori &amp; Label</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode material (misal: MAT-MAH-01), nama bahan, atau tipe..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs transition-all"
          />
        </div>
      </div>

      {/* Materials Table */}
      <div className="berry-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
              <tr>
                <th className="py-4 px-5">Kode SKU</th>
                <th className="py-4 px-5">Nama Bahan Baku</th>
                <th className="py-4 px-5">Kategori &amp; ABC</th>
                <th className="py-4 px-5 text-right">Stok Aktual</th>
                <th className="py-4 px-5 text-right">Batas Min (ROP)</th>
                <th className="py-4 px-5 text-right">Biaya / Unit (HPP)</th>
                <th className="py-4 px-5 text-center">Status Stok</th>
                {canManageMaterials && <th className="py-4 px-5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Memuat data bahan baku...
                  </td>
                </tr>
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada material ditemukan untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => {
                  const isLow = mat.stock_qty <= mat.minimum_stock;
                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-indigo-600">
                        {mat.material_code}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{mat.name}</div>
                        <span className="text-[10px] text-slate-400">{mat.material_type || 'Raw Material'}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md border font-bold uppercase ${getCategoryBadge(
                              mat.category
                            )}`}
                          >
                            {mat.category}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                            Kelas {mat.abc_classification || 'A'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-extrabold text-sm text-slate-900">
                        {mat.stock_qty.toLocaleString('id-ID')} <span className="text-[11px] text-slate-500 font-normal">{mat.unit}</span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono text-slate-500">
                        {mat.minimum_stock.toLocaleString('id-ID')} {mat.unit}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-emerald-600">
                        Rp {mat.cost_per_unit.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-extrabold border border-rose-200 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Stok Kurang
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                            Stok Aman
                          </span>
                        )}
                      </td>
                      {canManageMaterials && (
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDetailMaterial(mat)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setAdjustModalMaterial(mat);
                                setQtyDelta(10);
                              }}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <ArrowUpDown className="w-3.5 h-3.5" />
                              Sesuaikan
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Material */}
      {detailMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600">{detailMaterial.material_code}</span>
                <h2 className="text-base font-extrabold text-slate-900">{detailMaterial.name}</h2>
              </div>
              <button onClick={() => setDetailMaterial(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Kategori &amp; Tipe:</span>
                <b>{detailMaterial.category} • {detailMaterial.material_type || 'Raw Material'}</b>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Klasifikasi ABC:</span>
                <b>Kelas {detailMaterial.abc_classification || 'A'}</b>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Stok On-Hand:</span>
                <b className="font-mono text-slate-900 text-sm">{detailMaterial.stock_qty} {detailMaterial.unit}</b>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Batas Reorder Point (Minimum):</span>
                <b className="font-mono text-slate-900">{detailMaterial.minimum_stock} {detailMaterial.unit}</b>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Biaya Beli Rata-rata (HPP):</span>
                <b className="font-mono text-emerald-600 font-bold">Rp {detailMaterial.cost_per_unit.toLocaleString('id-ID')} / {detailMaterial.unit}</b>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailMaterial(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Material Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Tambah Master Bahan Baku Baru (MRP)
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kode Material (SKU/Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={materialCode}
                    onChange={(e) => setMaterialCode(e.target.value)}
                    placeholder="MAT-MAH-01"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori Bahan
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  >
                    <option value="wood">Kayu (Bahan Pokok)</option>
                    <option value="chemical">Kimia &amp; Finishing</option>
                    <option value="packaging">Kemasan &amp; Box</option>
                    <option value="accessory">Aksesori &amp; Label</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Material *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kayu Mahoni Grade A (30x10x2 cm)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Klasifikasi ABC</label>
                  <select
                    value={abcClass}
                    onChange={(e) => setAbcClass(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="A">Kelas A (Nilai Tinggi / Kontrol Ketat)</option>
                    <option value="B">Kelas B (Nilai Menengah)</option>
                    <option value="C">Kelas C (Volume Tinggi Nilai Rendah)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Material</label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="Raw Material">Raw Material (Bahan Mentah)</option>
                    <option value="Packaging">Packaging (Kardus / Plastik)</option>
                    <option value="Consumable">Consumable (Amplas / Dempul)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Satuan Unit (UOM) *
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="batang, kg, pcs"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stockQty}
                    onChange={(e) => setStockQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Batas Minimum (ROP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Biaya Beli per Satuan (HPP Bahan / Rp) *
                </label>
                <input
                  type="number"
                  min={0}
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(Number(e.target.value))}
                  placeholder="15000"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-emerald-600 font-mono font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  {submittingCreate ? 'Menyimpan...' : 'Simpan Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Penyesuaian Stok */}
      {adjustModalMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-indigo-600" />
                Penyesuaian Stok: {adjustModalMaterial.name}
              </h2>
              <button
                onClick={() => setAdjustModalMaterial(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Stok Saat Ini:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {adjustModalMaterial.stock_qty} {adjustModalMaterial.unit}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jumlah Perubahan (Delta Qty)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={qtyDelta}
                  onChange={(e) => setQtyDelta(Number(e.target.value))}
                  placeholder="Gunakan tanda minus (-) untuk pemotongan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alasan Penyesuaian / No. Surat Jalan
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Penerimaan dari Supplier / Pemusnahan bahan cacat..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustModalMaterial(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  {submittingAdjust ? 'Menyimpan...' : 'Perbarui Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Data Material */}
      <ImportDataModal
        moduleName="materials"
        moduleLabel="Bahan Baku & Material (MRP Inventory)"
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          fetchMaterials();
          setSuccess('Import data material bahan baku berhasil diproses!');
        }}
      />
    </div>
  );
}
