'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Layers,
  ArrowRight,
  Calculator,
  X,
  Sparkles,
  DollarSign,
  Box,
  Scale,
  Truck,
  Eye,
  Clock,
} from 'lucide-react';
import {
  apiFetch,
  Product,
  ProductBOM,
  Material,
  WorkStation,
  ProductCostCalculation,
  User as UserType,
  getStoredUser,
  hasPermission,
  isSuperuser,
  hasRole,
} from '@/lib/api';
import ImportDataModal from '@/components/ImportDataModal';

export default function ProductsPage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stations, setStations] = useState<WorkStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal Master Product Baru
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCode, setNewProductCode] = useState('');
  const [primaryMaterial, setPrimaryMaterial] = useState('Kayu Mahoni / Jati');
  const [finishing, setFinishing] = useState('Food-grade Beeswax & Mineral Oil');
  const [weight, setWeight] = useState<number>(0.85);
  const [leadTime, setLeadTime] = useState('2 Minggu');
  const [cap20ft, setCap20ft] = useState<number>(3500);
  const [cap40ft, setCap40ft] = useState<number>(7500);
  const [cap40hc, setCap40hc] = useState<number>(8500);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Detail Modal
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  // Drawer / Modal Kelola Resep BOM
  const [selectedProductForBOM, setSelectedProductForBOM] = useState<Product | null>(null);
  const [bomItems, setBOMItems] = useState<ProductBOM[]>([]);
  const [loadingBOM, setLoadingBOM] = useState(false);

  // Form Tambah Item BOM
  const [bomMaterialId, setBOMMaterialId] = useState<number>(0);
  const [bomStationId, setBOMStationId] = useState<number>(1);
  const [bomQuantity, setBOMQuantity] = useState<number>(1.0);
  const [bomWastePct, setBOMWastePct] = useState<number>(5.0);
  const [bomNotes, setBOMNotes] = useState<string>('');
  const [submittingBOM, setSubmittingBOM] = useState(false);

  // Modal Kalkulasi HPP
  const [calcModalProduct, setCalcModalProduct] = useState<ProductCostCalculation | null>(null);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [importProductOpen, setImportProductOpen] = useState(false);
  const [importBOMOpen, setImportBOMOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const canManageProducts =
    isSuperuser(currentUser) ||
    hasRole(currentUser, 'PPIC') ||
    hasPermission(currentUser, 'kelola spk');

  const fetchProducts = async () => {
    try {
      const res = await apiFetch<{ products: Product[]; total: number }>(
        `/products?search=${encodeURIComponent(search)}&limit=100`
      );
      if (res.success && res.data) {
        setProducts(res.data.products || []);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchMeta = async () => {
    try {
      const matRes = await apiFetch<{ materials: Material[] }>('/materials?limit=100');
      if (matRes.success && matRes.data) setMaterials(matRes.data.materials || []);

      const stRes = await apiFetch<WorkStation[]>('/stations');
      if (stRes.success && stRes.data) setStations(stRes.data || []);
    } catch (err) {
      // Ignored
    }
  };

  useEffect(() => {
    Promise.all([fetchProducts(), fetchMeta()]).finally(() => setLoading(false));
  }, [search]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProduct(true);
    setError(null);

    try {
      const res = await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          product_name: newProductName,
          product_code: newProductCode,
          primary_material: primaryMaterial,
          finishing: finishing,
          weight: Number(weight),
          lead_time: leadTime,
          container_20ft_capacity: Number(cap20ft),
          container_40ft_capacity: Number(cap40ft),
          container_40hc_capacity: Number(cap40hc),
        }),
      });

      if (!res.success) {
        setError(res.message || 'Gagal menambahkan produk');
        setSubmittingProduct(false);
        return;
      }

      setSuccess(`Produk ${newProductName} (${newProductCode}) berhasil didaftarkan lengkap dengan spesifikasi teknis & logistik!`);
      setShowProductModal(false);
      setNewProductName('');
      setNewProductCode('');
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleOpenBOMModal = async (product: Product) => {
    setSelectedProductForBOM(product);
    setLoadingBOM(true);
    setError(null);
    try {
      const res = await apiFetch<ProductBOM[]>(`/products/${product.id}/bom`);
      if (res.success && res.data) {
        setBOMItems(res.data || []);
      }
      if (materials.length > 0 && !bomMaterialId) {
        setBOMMaterialId(materials[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingBOM(false);
    }
  };

  const handleSaveBOMItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForBOM || !bomMaterialId) return;
    setSubmittingBOM(true);
    setError(null);

    try {
      const res = await apiFetch(`/products/${selectedProductForBOM.id}/bom`, {
        method: 'POST',
        body: JSON.stringify({
          product_id: selectedProductForBOM.id,
          material_id: Number(bomMaterialId),
          station_id: Number(bomStationId),
          quantity: Number(bomQuantity),
          waste_pct: Number(bomWastePct),
          notes: bomNotes,
        }),
      });

      if (!res.success) {
        setError(res.message || 'Gagal menyimpan item BOM');
        setSubmittingBOM(false);
        return;
      }

      setSuccess('Komposisi resep material BOM berhasil disimpan!');
      const refresh = await apiFetch<ProductBOM[]>(`/products/${selectedProductForBOM.id}/bom`);
      if (refresh.success && refresh.data) {
        setBOMItems(refresh.data || []);
      }
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingBOM(false);
    }
  };

  const handleDeleteBOMItem = async (bomId: number) => {
    if (!confirm('Hapus bahan ini dari resep BOM?')) return;
    try {
      const res = await apiFetch(`/products/bom/${bomId}`, { method: 'DELETE' });
      if (res.success && selectedProductForBOM) {
        const refresh = await apiFetch<ProductBOM[]>(`/products/${selectedProductForBOM.id}/bom`);
        if (refresh.success && refresh.data) setBOMItems(refresh.data || []);
        fetchProducts();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOpenHPPCalc = async (productId: number) => {
    setLoadingCalc(true);
    try {
      const res = await apiFetch<ProductCostCalculation>(`/products/${productId}/hpp-calc`);
      if (res.success && res.data) {
        setCalcModalProduct(res.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingCalc(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Package className="w-5 h-5" />
            </div>
            Katalog Master Produk, Spesifikasi Kemasan &amp; BOM
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Master 47 item kitchenware kayu dengan spesifikasi fisik, kapasitas muat kontainer (20ft, 40ft, 40HC), serta formula resep Bill of Materials berjenjang.
          </p>
        </div>

        {canManageProducts && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setImportProductOpen(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              Import Produk CSV
            </button>
            <button
              onClick={() => setImportBOMOpen(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Import BOM CSV
            </button>
            <button
              onClick={() => {
                const code = `KW-PRD-${Math.floor(100 + Math.random() * 900)}`;
                setNewProductCode(code);
                setShowProductModal(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Produk Baru
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
            placeholder="Cari kode produk (misal: KW-TLN-01) atau nama kitchenware..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs transition-all"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400 berry-card">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Memuat master produk...
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-3 berry-card p-12 text-center text-slate-400">
            Tidak ada produk ditemukan.
          </div>
        ) : (
          products.map((p) => {
            const bomCount = p.bom_items?.length || 0;
            return (
              <div
                key={p.id}
                className="berry-card p-5 space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-indigo-600 block mb-0.5">{p.product_code}</span>
                      <h3 className="text-sm font-extrabold text-slate-900">{p.product_name}</h3>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold">
                      Active
                    </span>
                  </div>

                  {/* Specs Pill */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Material &amp; Finishing:</span>
                      <span className="font-medium text-slate-800 truncate block">{p.primary_material || 'Mahoni/Jati'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Lead Time Produksi:</span>
                      <span className="font-medium text-slate-800 block">{p.lead_time || '10 Hari'}</span>
                    </div>
                  </div>

                  {/* Container Capacity Summary */}
                  <div className="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-[10px] text-indigo-900 flex justify-between">
                    <span>Muat Kontainer:</span>
                    <b className="font-mono">20ft: {p.container_20ft_capacity || 3500} pcs • 40HC: {p.container_40hc_capacity || 8500} pcs</b>
                  </div>

                  {/* BOM Recipe Tag */}
                  <div className="text-[11px] text-slate-500">
                    Resep BOM: <b className="text-slate-700">{bomCount} Bahan Terdaftar</b>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setDetailProduct(p)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                    title="Lihat Spesifikasi Lengkap"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenHPPCalc(p.id)}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                    Cek HPP
                  </button>

                  <button
                    onClick={() => handleOpenBOMModal(p)}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Kelola BOM
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tambah Produk Baru dengan Spesifikasi Lengkap */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Pendaftaran Master Produk &amp; Spesifikasi Logistik
              </h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Produk (SKU) *</label>
                  <input
                    type="text"
                    required
                    value={newProductCode}
                    onChange={(e) => setNewProductCode(e.target.value)}
                    placeholder="KW-TLN-01"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Produk Kitchenware *</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Talenan Kayu Mahoni Bulat (Dia. 25cm)"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              {/* Physical Specs */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] block">
                  Spesifikasi Fisik &amp; Kemasan Produk:
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Bahan Utama</label>
                    <input
                      type="text"
                      value={primaryMaterial}
                      onChange={(e) => setPrimaryMaterial(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Finishing</label>
                    <input
                      type="text"
                      value={finishing}
                      onChange={(e) => setFinishing(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Berat Satuan (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Lead Time</label>
                    <input
                      type="text"
                      value={leadTime}
                      onChange={(e) => setLeadTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">20ft Capacity</label>
                    <input
                      type="number"
                      value={cap20ft}
                      onChange={(e) => setCap20ft(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">40ft Capacity</label>
                    <input
                      type="number"
                      value={cap40ft}
                      onChange={(e) => setCap40ft(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">40HC Capacity</label>
                    <input
                      type="number"
                      value={cap40hc}
                      onChange={(e) => setCap40hc(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  {submittingProduct ? 'Menyimpan...' : 'Simpan Master Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Spesifikasi Lengkap Produk */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600">{detailProduct.product_code}</span>
                <h2 className="text-base font-extrabold text-slate-900">{detailProduct.product_name}</h2>
              </div>
              <button onClick={() => setDetailProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Material Utama:</span>
                <b>{detailProduct.primary_material || 'Kayu Mahoni / Jati Pilihan'}</b>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Perlakuan Akhir (Finishing):</span>
                <b>{detailProduct.finishing || 'Food-grade Beeswax Coating'}</b>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Berat Satuan:</span>
                <b>{detailProduct.weight || 0.85} kg</b>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Lead Time Produksi Standar:</span>
                <b>{detailProduct.lead_time || '10-14 Hari'}</b>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 space-y-1">
                <span className="font-bold text-indigo-950 block">Estimasi Muat Kontainer Ekspor:</span>
                <div className="flex justify-between text-indigo-800">
                  <span>Kontainer 20ft: <b>{detailProduct.container_20ft_capacity || 3500} pcs</b></span>
                  <span>Kontainer 40HC: <b>{detailProduct.container_40hc_capacity || 8500} pcs</b></span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kelola BOM */}
      {selectedProductForBOM && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  Formula Resep BOM: {selectedProductForBOM.product_name}
                </h2>
                <span className="text-[11px] font-mono text-slate-500">[{selectedProductForBOM.product_code}]</span>
              </div>
              <button
                onClick={() => setSelectedProductForBOM(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Input Tambah Item BOM */}
            <form onSubmit={handleSaveBOMItem} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-extrabold text-indigo-700 uppercase text-[11px] block">
                + Tambah Komposisi Bahan ke Resep
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Bahan Baku</label>
                  <select
                    value={bomMaterialId}
                    onChange={(e) => setBOMMaterialId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium"
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.unit}) - Rp {m.cost_per_unit.toLocaleString('id-ID')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stasiun Konsumsi</label>
                  <select
                    value={bomStationId}
                    onChange={(e) => setBOMStationId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium"
                  >
                    {stations.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.station_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kebutuhan per Unit</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={bomQuantity}
                    onChange={(e) => setBOMQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Susut / Scrap (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={bomWastePct}
                    onChange={(e) => setBOMWastePct(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan</label>
                  <input
                    type="text"
                    value={bomNotes}
                    onChange={(e) => setBOMNotes(e.target.value)}
                    placeholder="Ukuran potong..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingBOM}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  {submittingBOM ? 'Menyimpan...' : '+ Tambah ke BOM'}
                </button>
              </div>
            </form>

            {/* List BOM Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-extrabold text-[10px]">
                  <tr>
                    <th className="p-3">Bahan Baku</th>
                    <th className="p-3">Stasiun</th>
                    <th className="p-3 text-right">Kebutuhan (Qty)</th>
                    <th className="p-3 text-right">Susut (%)</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bomItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        Belum ada bahan baku dalam formula BOM ini.
                      </td>
                    </tr>
                  ) : (
                    bomItems.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-bold text-slate-800">
                          {b.material?.name} <span className="text-[10px] text-slate-400 font-normal">[{b.material?.material_code}]</span>
                        </td>
                        <td className="p-3 text-slate-600">{b.station?.name}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {b.quantity} {b.material?.unit}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500">{b.waste_pct}%</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteBOMItem(b.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cek HPP Produk */}
      {calcModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                Rincian Kalkulasi HPP: {calcModalProduct.product_name}
              </h2>
              <button onClick={() => setCalcModalProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                <span className="font-bold text-indigo-950">Total HPP Bersih / Pcs:</span>
                <span className="text-lg font-extrabold font-mono text-indigo-700">
                  Rp {calcModalProduct.total_hpp_per_unit.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-100 font-medium">
                  <span>1. Biaya Bahan Baku (BOM Formula):</span>
                  <span className="font-bold text-slate-900">Rp {calcModalProduct.total_material_cost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-100 font-medium">
                  <span>2. Biaya Ongkos Kerja (Stasiun 1 s.d. 5):</span>
                  <span className="font-bold text-slate-900">Rp {calcModalProduct.total_labor_cost.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setCalcModalProduct(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Data Produk */}
      <ImportDataModal
        moduleName="products"
        moduleLabel="Master Katalog Produk Kitchenware"
        isOpen={importProductOpen}
        onClose={() => setImportProductOpen(false)}
        onSuccess={() => {
          fetchProducts();
          setSuccess('Import data produk berhasil diproses!');
        }}
      />

      {/* Modal Import Data BOM */}
      <ImportDataModal
        moduleName="bom"
        moduleLabel="Formula Resep Bill of Materials (BOM)"
        isOpen={importBOMOpen}
        onClose={() => setImportBOMOpen(false)}
        onSuccess={() => {
          fetchProducts();
          setSuccess('Import data resep BOM berhasil diproses!');
        }}
      />
    </div>
  );
}
