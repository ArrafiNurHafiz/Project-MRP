# CETAK BIRU ARSITEKTUR SISTEM ENTERPRISE MRP (KATANA BENCHMARK)
**Fokus Rekayasa (Insinyur): Multi-Tenant SaaS, Net Requirements Engine, & Maklon 3-Tier**
**Dokumen Arsitektur & Architecture Decision Record (ADR)**

---

## 1. Fondasi Multi-Enterprise (Multi-Tenant Isolation)

### 1.1 Model Isolasi Data
- **Strategi**: *Shared Database, Discriminator Column (`tenant_id`)*.
- **Implementasi**:
  - Seluruh entitas transaksional dan master data (`tenants`, `users`, `customers`, `vendors`, `materials`, `products`, `quotations`, `sales_orders`, `work_orders`, `material_requests`, `purchase_orders`, `warehouses`, `inventory_batches`) mengikat `tenant_id uint64` dengan indeks `gorm:"index;not null"`.
  - Foreign key referensial di level aplikasi dan skema database diarahkan ke tabel induk `tenants(id)`.
- **Middleware Keamanan Context**:
  - `TenantMiddleware`: Membaca klaim JWT (`tenant_id`) atau header API `X-Tenant-ID`.
  - Disimpan dalam context request Go Fiber (`c.Locals("tenant_id")`).
  - Repository layer wajib membubuhkan filter `.Where("tenant_id = ?", tenantID)` pada seluruh query SELECT, UPDATE, DELETE untuk menjamin *zero data leakage*.

### 1.2 Konfigurasi Tenant
- Setiap tenant memiliki konfigurasi independen:
  - Format penomoran dokumen (misal: `QUO-{YYYY}-{MM}-{SEQ}`, `SPK-{YYYY}-{MM}-{SEQ}`).
  - Formula kalkulasi HPP (`FIFO` default vs `Average Costing`).
  - Safety stock threshold & lead-time buffer persentase.

---

## 2. Peningkatan Fitur & Logika Inti MRP (Katana Benchmark)

### 2.1 Alur Integrasi End-to-End
```
[ Penawaran (Quotation) ] 
       │ (Status: APPROVED / ACC)
       ▼
[ Pesanan Penjualan (Sales Order) ]
       │ (Status: PUBLISHED)
       ├────────────────────────────────────────┐
       ▼                                        ▼
[ SPK / Work Order ]                  [ Net Requirements Engine ]
       │                                        │
       ▼                                        ▼
[ Auto Material Request Gudang ]      [ Auto-Generate PO Shortage ]
       │ (Status: WAITING_CHECK)                │ (Status: DRAFT)
       ▼                                        ▼
[ Katana Visual Allocation:           [ Supplier / Vendor Procurement ]
  - Hijau: IN_STOCK / ALLOCATED
  - Kuning: EXPECTED_PO
  - Merah: SHORTAGE ]
```

### 2.2 Algoritma Net Requirements Engine
Formula perhitungan kebutuhan bersih material:
$$\text{Net Shortage} = \max\Big(0,\ \text{Gross Demand} - (\text{Stock On Hand} + \text{Open PO Expected} - \text{Already Allocated})\Big)$$
- Jika $\text{Net Shortage} > 0$: Sistem otomatis menandai status alokasi sebagai `SHORTAGE` (Merah) dan menyiapkan draf Purchase Order ke vendor terkait dengan kuantitas yang dibutuhkan.
- Jika $\text{Net Shortage} = 0$: Material dialokasikan (Hijau: `IN_STOCK`) dan siap diserahkan ke bagian produksi (status `ISSUED`).

### 2.3 Siklus Subkontrak & Maklon 3-Tier (Bahan dari Perusahaan)
1. **Tier 1 - Pengeluaran Bahan**: Terbit Surat Jalan Bahan Baku (`SJ-Kirim`) keluar dari gudang menuju workshop vendor maklon. Bahan tetap tercatat sebagai aset perusahaan dalam perjalanan / di pihak ketiga (*subcontracted inventory*).
2. **Tier 2 - Inbound QC Gate**: Penerimaan bertahap barang hasil pengerjaan maklon di Gudang Inbound:
   - **Lolos QC**: Diterima masuk stok produk setengah jadi / jadi.
   - **Rework / Retur**: Surat Jalan Retur Rp0 ke vendor untuk perbaikan tanpa penambahan biaya pokok.
   - **Scrap / Rusak Mutlak**: Diterbitkan klaim / scrap record, memicu otomatis `MaterialRequest` bahan pengganti ke gudang untuk mengejar target SPK.
3. **Tier 3 - Rekonsiliasi Jasa & HPP**: Tagihan jasa maklon hanya dihitung berdasarkan barang yang lolos QC (`Qty Passed * Tarif Maklon`).

---

## 3. Standar Arsitektur UI/UX (High-Affordance & Shopfloor)

### 3.1 Komponen Lifecycle Stepper Terpadu
- Komponen visual linear responsif di header halaman transaksi:
  `Draft` $\rightarrow$ `Disetujui` $\rightarrow$ `Terbit` $\rightarrow$ `Alokasi Bahan` $\rightarrow$ `Produksi` $\rightarrow$ `QC` $\rightarrow$ `Selesai`.
- Menampilkan waktu pergantian status, penanggung jawab, dan aksi berikutnya yang direkomendasikan.

### 3.2 Visual Material Allocation Pills (Katana Style)
- **Hijau (`bg-emerald-500/20 text-emerald-400 border-emerald-500/30`)**: *In Stock* — Seluruh kebutuhan bahan baku tercukupi dan teralokasi.
- **Kuning (`bg-amber-500/20 text-amber-400 border-amber-500/30`)**: *Expected* — Sebagian/seluruh bahan menunggu kedatangan Purchase Order terbit.
- **Merah (`bg-rose-500/20 text-rose-400 border-rose-500/30`)**: *Shortage* — Bahan baku kurang, butuh tindakan pengadaan (1-Click Auto PO).

### 3.3 Shopfloor Tablet Kiosk
- Tampilan beresolusi sentuh tinggi (touch-friendly minimum target area 48px).
- Mode kerja operator stasiun:
  - Pilihan SPK berjalan.
  - Counter sentuh cepat (+1, +5, +10) untuk hasil bagus (*Good Output*).
  - Counter cepat cacat & scrap (*Scrap Output*) dengan pilihan alasan (pecah, retak, cacat dimensi).
  - Integrasi instan ke pencatatan `production_logs`.

---

## 4. Keamanan, Skalabilitas Database, & ADR

### 4.1 Indexing & Query Plan
- Indeks komposit wajib pada database:
  - `(tenant_id, status)` pada `sales_orders`, `work_orders`, `material_requests`.
  - `(tenant_id, material_id)` pada `warehouse_stocks`.
  - `(tenant_id, work_order_id)` pada `material_request_items`.
- Menghindari N+1 query melalui eager loading terstruktur GORM (`Preload`) pada handler.

### 4.2 Verifikasi Status
- Seluruh unit test, service test, dan regression test E2E terpasang di `backend/internal/service/` telah divalidasi 100% PASS.
- Build frontend Next.js 16 (43 rute App Router) telah terverifikasi 100% lulus.
