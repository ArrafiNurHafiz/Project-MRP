# BUKU PANDUAN OPERASIONAL DETIL: END-TO-END LABAMU MRP DARI NOL (STEP-BY-STEP)
## Manual Prosedur Lengkap, Validasi Form, Formula Matematis, dan Eksekusi Antar-Divisi

Dokumen ini adalah buku panduan operasional definitif untuk menjalankan sistem **Labamu Manufacturing Resource Planning (MRP)** dari kondisi sistem yang masih kosong (*cold start / 0 data*) hingga siklus penuh penutupan buku pesanan manufaktur.

---

## DAFTAR ISI
1. [BAB 1: Persiapan & Inisialisasi Perusahaan (Company Setup, FX, & RBAC)](#bab-1-persiapan--inisialisasi-perusahaan-company-setup-fx--rbac)
2. [BAB 2: Master Inventory Bahan Baku & Batch Stok Fisik Gudang](#bab-2-master-inventory-bahan-baku--batch-stok-fisik-gudang)
3. [BAB 3: Master Vendor Rekanan & Pelanggan Multi-PIC](#bab-3-master-vendor-rekanan--pelanggan-multi-pic)
4. [BAB 4: Rekayasa Manufaktur: Master Routing & Bill of Materials (BOM)](#bab-4-rekayasa-manufaktur-master-routing--bill-of-materials-bom)
5. [BAB 5: Siklus Penjualan: RFQ $\to$ CPR Rekayasa Kustom $\to$ Quotation Multi-Valuta](#bab-5-siklus-penjualan-rfq--cpr-rekayasa-kustom--quotation-multi-valuta)
6. [BAB 6: Persetujuan Digital Microsite & Otomasi Sistem (SO, WO, DP Invoice)](#bab-6-persetujuan-digital-microsite--otomasi-sistem-so-wo-dp-invoice)
7. [BAB 7: Eksekusi Lantai Pabrik: Auto-Allocation, Routing In-House & Subkontrak](#bab-7-eksekusi-lantai-pabrik-auto-allocation-routing-in-house--subkontrak)
8. [BAB 8: Quality Control (QC), Pemotongan Bahan Baku & Penambahan Barang Jadi](#bab-8-quality-control-qc-pemotongan-bahan-baku--penambahan-barang-jadi)
9. [BAB 9: Logistik Pengiriman (Surat Jalan & Resi) $\to$ Pelunasan Invoice $\to$ Closed](#bab-9-logistik-pengiriman-surat-jalan--resi--pelunasan-invoice--closed)
10. [BAB 10: Analitik Finansial, HPP Aktual vs Standar, & Troubleshooting Lapangan](#bab-10-analitik-finansial-hpp-aktual-vs-standar--troubleshooting-lapangan)

---

# BAB 1: Persiapan & Inisialisasi Perusahaan (Company Setup, FX, & RBAC)

### 1.1. Profil Perusahaan & Legalitas (`/company-settings/`)
Akses: **Menu Sidebar $\to$ Administration $\to$ Company Settings**

#### Langkah-langkah Pengisian:
1. **Logo Perusahaan:**
   - Unggah file logo format `.png` (latar transparan) atau `.webp`, resolusi rekomendasi `500x500 px`, ukuran maks `2 MB`.
   - *Fungsi:* Dicetak otomatis pada kop surat Quotation, Work Order, Surat Jalan (Delivery Note), dan Invoice PDF.
2. **Identitas Legal:**
   - **Company Name:** Masukkan nama badan hukum resmi (contoh: `PT Presisi Logam Indonesia`).
   - **Company Code:** Masukkan 3-4 huruf singkatan unik (contoh: `PLI`). Digunakan sebagai prefix penomoran dokumen.
   - **NPWP:** Masukkan 16 digit NPWP perusahaan (contoh: `01.234.567.8-012.000`).
   - **Default Tax (PPN):** Set ke `11%`.
3. **Alamat Operasional & Kontak:**
   - **Alamat Pabrik/Kantor:** Masukkan alamat lengkap beserta kode pos untuk pencetakan dokumen legalitas.
   - **Nomor Telepon & Email:** Kontak resmi divisi administrasi.
4. **Rekening Bank Pembayaran (Payment Gateway / Bank Account):**
   - **Nama Bank:** Contoh `Bank Central Asia (BCA)` / `Bank Mandiri`.
   - **Nomor Rekening:** Masukkan nomor rekening penerimaan pembayaran DP & Pelunasan.
   - **Atas Nama:** Masukkan nama rekening resmi perusahaan.
5. Klik **"Save Settings"**.

---

### 1.2. Manajemen Nilai Tukar Valuta Asing (`/fx-management/`)
Akses: **Menu Sidebar $\to$ Administration $\to$ FX Management**

*Jika perusahaan menerima pesanan luar negeri (ekspor) atau membeli material berdenominasi mata uang asing.*

#### Langkah-langkah:
1. Klik tombol **"+ Add Currency Rate"**.
2. Masukkan mata uang:
   - **USD (US Dollar):** Input nilai kurs tengah acuan, contoh: `Rp 16.200`.
   - **SGD (Singapore Dollar):** Input nilai kurs, contoh: `Rp 12.100`.
   - **EUR (Euro):** Input nilai kurs, contoh: `Rp 17.500`.
3. Klik **"Save"**. Sistem akan menggunakan kurs ini untuk kalkulasi otomatis pada Quotation multi-valuta.

---

### 1.3. Struktur Pengguna & Pembagian Peran (`/user-management/user-groups/`)
Akses: **Menu Sidebar $\to$ Administration $\to$ User Management**

Undang seluruh kepala divisi dan staf operasional pabrik:
1. Klik **"+ Invite User"**.
2. Masukkan **Nama Lengkap**, **Email**, dan **Nomor WhatsApp** (format `+628xxxxxxxxxx`).
3. Pilih **Role**:
   - `OWNER`: Hak akses penuh ke seluruh modul, pengaturan, dan laporan keuangan.
   - `SALES`: Akses RFQ, Quotation, Data Customer, Monitoring Sales Order.
   - `ENGINEERING`: Akses Routing, BOM, Custom Products Request (CPR), dan Product Catalog.
   - `PRODUCTION_PPIC`: Akses Work Orders, Material Allocation, dan Material Requests.
   - `PROCUREMENT`: Akses Vendor Rekanan, Purchase Orders, dan Hutang Usaha (AP).
   - `WAREHOUSE`: Akses Saldo Batch Material, Penerimaan Barang (PO Receipts), Surat Jalan Pengiriman.
   - `QC_INSPECTOR`: Akses formulir inspeksi mutu dan kelolosan unit Work Order.
   - `FINANCE`: Akses Invoices, Pencatatan Settlement Pembayaran, dan Laporan Finansial.
4. Pengguna akan menerima link/notifikasi untuk login menggunakan verifikasi WhatsApp OTP.

---

# BAB 2: Master Inventory Bahan Baku & Batch Stok Fisik Gudang

### 2.1. Membuat Master Material (`/materials/`)
Akses: **Menu Sidebar $\to$ Resources $\to$ Materials**

Bahan baku adalah elemen dasar manufaktur. Setiap material wajib memiliki klasifikasi dan parameter risiko stok.

#### Formulir Input Material Baru (`+ Add Material`):
1. **SKU Material:** Format kode standar baku, contoh: `MAT-SS304-2MM`.
2. **Nama Material:** Penjelasan spesifik ukuran & jenis, contoh: `Plat Stainless Steel 304 (2.0 mm)`.
3. **Kategori:** Pilih/ketik kategori, contoh: `Logam & Plat`, `Fastener & Baut`, `Kimia & Cat`, `Gas Industri`.
4. **Klasifikasi ABC (Analisis Nilai Pareto):**
   - **Kelas A (High Value / Critical):** Menyerap ~80% modal inventory (contoh: Plat Stainless Steel, Pipa Besi, Motor Penggerak). Pengawasan stok ketat.
   - **Kelas B (Moderate Value):** Menyerap ~15% modal (contoh: Kawat Las TIG, Gas Argon, Roda Castor, Cat Powder Coating).
   - **Kelas C (Low Value / Consumables):** Menyerap ~5% modal (contoh: Baut M8, Mur, Ring, Kardus Box, Bubble Wrap).
5. **Tipe Material:**
   - `Raw Material`: Bahan mentah yang akan dipotong/diubah bentuknya.
   - `Finished Component`: Komponen siap pasang (baut, roda, handel).
6. **Satuan Ukur (Unit of Measurement / UoM):** `Lembar`, `Batang`, `Tube`, `Tabung`, `Pcs`, `Box`, `Zak`, `Roll`.
7. **Stock Risk Threshold (Reorder Point / ROP):**
   - Batas minimum stok sebelum memicu peringatan restock (contoh: `10 Lembar`).
8. **Harga Beli Acuan (Average Cost Price):**
   - Estimasi harga beli per unit (contoh: `Rp 1.450.000 / Lembar`).
9. Klik **"Save Material"**.

---

### 2.2. Input Saldo Stok Awal (*Initial Stock Batches*)
Akses: **Menu Sidebar $\to$ Resources $\to$ Materials $\to$ Tab "Stock Batches"**

Memasukkan stok fisik yang sudah ada di rak gudang saat sistem pertama kali dijalankan.

#### Langkah-langkah:
1. Klik tombol **"+ Batch Stock In / Initial Balance"**.
2. Pilih Material: `MAT-SS304-2MM`.
3. Masukkan **Nomor Batch**: `BAT-20260901-001`.
4. Masukkan **Kuantitas Awal**: `35 Lembar`.
5. Masukkan **Biaya Pembelian Satuan (Unit Cost)**: `Rp 1.450.000`.
6. Masukkan **Lokasi Rak Gudang**: `Gudang A - Rak Besi 01`.
7. Pilih **Vendor Penyuplai**: `PT Mega Baja Nusantara`.
8. Klik **"Submit Batch"**. Saldo stok fisik kini tercatat aktif dan siap dialokasikan untuk produksi.

---

# BAB 3: Master Vendor Rekanan & Pelanggan Multi-PIC

### 3.1. Master Data Vendor Rekanan (`/vendors/`)
Akses: **Menu Sidebar $\to$ Resources $\to$ Vendors**

Mendaftarkan penyuplai bahan baku dan mitra subkontrak (*outsourcing*):
1. Klik **"+ Add Vendor"**.
2. **Vendor Code:** Otomatis atau manual (contoh: `VEND-001`).
3. **Company Name:** Nama vendor (contoh: `PT Mega Baja Nusantara`).
4. **Kategori Vendor:**
   - `Raw Material Supplier`: Penyuplai plat & pipa.
   - `Subcontractor / Outsourcing`: Mitra jasa proses luar (contoh: `CV Warna Prima Coating` - Jasa Powder Coating).
5. **Payment Terms:** Termin pembayaran, contoh `NET 30 Hari` atau `NET 14 Hari`.
6. **Kontak PIC Vendor:** Nama, Nomor WhatsApp, Email.
7. Klik **"Save Vendor"**.

---

### 3.2. Master Data Pelanggan (*Customer Directory*) & Multi-PIC (`/customers/`)
Akses: **Menu Sidebar $\to$ Resources $\to$ Customers**

Sistem Labamu MRP mendukung **Multi-PIC per Pelanggan** untuk memisahkan wewenang persetujuan penawaran resmi dan komunikasi operasional.

#### Langkah-langkah:
1. Klik **"+ Add Customer"**.
2. **Informasi Perusahaan:**
   - Nama Perusahaan: `PT Maju Makmur Mandiri`.
   - Industri: `Farmasi & Pengolahan Makanan`.
   - Alamat Kantor & Alamat Pengiriman Pabrik.
3. **Struktur Multi-PIC (Wajib):**
   - **PIC 1 (Approver Utama):**
     - *Nama:* Ir. Bambang Sutejo
     - *Jabatan:* General Manager Procurement
     - *Email:* `bambang.sutejo@majumakmur.co.id` | *HP:* `+628119876543`
     - *Role Portal:* **`Approver`** (*Hanya PIC bertipe Approver yang dapat menandatangani dan menyetujui Quotation secara sah pada link Microsite*).
   - **PIC 2 (Viewer Teknis):**
     - *Nama:* Rian Hidayat, S.T. (Plant Supervisor)
     - *Role Portal:* **`Viewer`** (*Hanya melihat gambar teknik & spesifikasi*).
   - **PIC 3 (Viewer Keuangan):**
     - *Nama:* Siska Maharani (Finance Supervisor)
     - *Role Portal:* **`Viewer`** (*Menerima salinan faktur & jadwal jatuh tempo*).
4. Klik **"Save Customer"**.

---

# BAB 4: Rekayasa Manufaktur: Master Routing & Bill of Materials (BOM)

### 4.1. Membuat Master Routing (Tahapan Proses Pabrik) (`/routing/`)
Akses: **Menu Sidebar $\to$ Manufacturing $\to$ Routing**

Routing adalah urutan stasiun kerja yang harus dilalui oleh bahan baku hingga menjadi produk jadi.

#### Prosedur Pembuatan:
1. Klik **"+ Create Routing"**.
2. **Header:** Kode Routing: `ROUT-TBL-SS180`, Nama: *Fabrikasi Meja Stainless Heavy Duty*.
3. **Menyusun Urutan Tahapan (Step Ordering):**

| No | Kode Tahap | Nama Tahapan | Tipe Eksekusi | Standar Jam | Tarif Tenaga Kerja / Biaya Jasa |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **01** | `ROUT-CUTTING` | Pemotongan Plat & Pipa | **In-House** | 1.5 Jam | Rp 65.000 / Jam |
| **02** | `ROUT-BENDING` | Penekukan Plat CNC | **In-House** | 1.0 Jam | Rp 75.000 / Jam |
| **03** | `ROUT-WELDING` | Pengelasan TIG / Argon | **In-House** | 3.0 Jam | Rp 70.000 / Jam |
| **04** | `ROUT-FINISHING` | Grinding & Hairline Satin | **In-House** | 2.0 Jam | Rp 60.000 / Jam |
| **05** | `ROUT-POWDERCOAT` | Powder Coating Oven | **Outsource (Subkontrak)** | - | Rp 250.000 / Unit (Tarif Vendor) |
| **06** | `ROUT-ASSEMBLY` | Perakitan Roda & QC Final | **In-House** | 1.0 Jam | Rp 60.000 / Jam |

4. **Kalkulasi Biaya Operasi Routing Otomatis:**
   $$\text{Total Labor Cost} = (1.5 \times 65k) + (1.0 \times 75k) + (3.0 \times 70k) + (2.0 \times 60k) + (1.0 \times 60k) = \text{Rp } 562.500$$
   $$\text{Total Outsource Cost} = \text{Rp } 250.000$$
   $$\text{Total Routing Cost per Unit} = \text{Rp } 812.500$$
5. Klik **"Save Routing"**.

---

### 4.2. Membuat Master Produk Jadi (`/products/` $\to$ `/products/create/`)
Akses: **Menu Sidebar $\to$ Product $\to$ Product Catalog**

1. Klik **"+ Add Product"**.
2. Masukkan SKU: `PROD-TBL-SS180`.
3. Nama Produk: *Meja Kerja Stainless Heavy Duty 180x90cm*.
4. Kategori: *Furnitur Industri*, Satuan: *Unit*.
5. Tautkan Default Routing: Pilih `ROUT-TBL-SS180`.
6. Klik **"Save Product"**.

---

### 4.3. Membuat Formula Bill of Materials / BOM (`/bill-of-materials/`)
Akses: **Menu Sidebar $\to$ Manufacturing $\to$ Bill of Materials**

BOM adalah resep formula bahan baku untuk memproduksi **1 Unit Output**.

#### Prosedur Pembuatan:
1. Klik **"+ Create BOM"**.
2. Pilih Produk: `PROD-TBL-SS180`.
3. Kode BOM: `BOM-TBL-SS180-V1`, Versi: `1`.
4. **Input Daftar Komponen Bahan (Per 1 Unit Output):**

| SKU Material | Nama Bahan | Kuantitas Kebutuhan | Satuan (UoM) | Biaya Satuan | Subtotal Biaya Bahan |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `MAT-SS304-2MM` | Plat SS 304 (2.0 mm) | **1.5** | Lembar | Rp 1.450.000 | Rp 2.175.000 |
| `MAT-PIPA-SS-2IN`| Pipa Hollow 50x50x2mm | **3.0** | Batang | Rp 480.000 | Rp 1.440.000 |
| `MAT-WELD-308L` | Kawat Las TIG ER308L | **0.5** | Tube (5kg) | Rp 375.000 | Rp 187.500 |
| `MAT-GAS-ARGON` | Gas Argon UHP 6m3 | **0.4** | Tabung | Rp 320.000 | Rp 128.000 |
| `MAT-CASTOR-4IN` | Roda Heavy Duty 4 Inch | **4.0** | Pcs | Rp 85.000 | Rp 340.000 |
| `MAT-BAUT-M8X20` | Baut Hexagon SS304 M8 | **0.2** | Box (100pcs) | Rp 65.000 | Rp 13.000 |
| `MAT-KARDUS-BOX`| Kardus Double Wall Pack| **1.0** | Pcs | Rp 45.000 | Rp 45.000 |
| `MAT-BUBBLE-50M`| Bubble Wrap 50m | **0.1** | Roll | Rp 110.000 | Rp 11.000 |

5. **Kalkulasi HPP Standar Produk:**
   $$\text{Total Material Cost (BOM)} = \text{Rp } 4.339.500$$
   $$\text{Total Routing Cost} = \text{Rp } 812.500$$
   $$\text{Total HPP Standar (COGS per Unit)} = 4.339.500 + 812.500 = \text{Rp } 5.152.000$$
6. **Penetapan Harga Jual Minimum (Target Margin 25%):**
   $$\text{Harga Jual Minimum} = \frac{5.152.000}{1 - 0.25} = \text{Rp } 6.869.333 \to \text{Ditetapkan: Rp } 6.850.000$$
7. Klik **"Save & Activate BOM"**.

---

# BAB 5: Siklus Penjualan: RFQ $\to$ CPR Rekayasa Kustom $\to$ Quotation Multi-Valuta

### 5.1. Menerima Permintaan Penawaran / RFQ (`/rfq/`)
Akses: **Menu Sidebar $\to$ Sales $\to$ RFQ**

1. Klik **"+ Create RFQ"**.
2. **Pilih Pelanggan:** `PT Maju Makmur Mandiri`. Sistem otomatis mengisi alamat pengiriman dan PIC.
3. **Target Delivery Date:** Masukkan tanggal yang diminta klien (contoh: *15 Oktober 2026*).
4. **Input Item:**
   - *Kasus A (Produk Standar):* Pilih `PROD-TBL-SS180`, Qty: `10 Unit`. Status RFQ langsung `READY_TO_QUOTE`.
   - *Kasus B (Produk Kustom / Khusus):* Centang kotak `Custom Product Request`. Masukkan deskripsi pesanan khusus dan unggah file gambar CAD/PDF.
5. Klik **"Submit RFQ"**.

---

### 5.2. Analisis Rekayasa Produk Kustom / CPR (`/custom-products-request/`)
*(Hanya berjalan jika RFQ memiliki item Custom Product)*
Akses: **Menu Sidebar $\to$ Product $\to$ Custom Products Request**

1. Tim Engineering membuka tiket CPR yang masuk dari RFQ.
2. Unduh dan periksa gambar teknis CAD.
3. Susun **Estimasi Mini-BOM** (kebutuhan plat, pipa, komponen) dan **Estimasi Mini-Routing** (jam kerja mesin).
4. Masukkan target margin yang diinginkan (contoh: `30%`).
5. Sistem otomatis mengkalkulasi rekomendasi harga jual kustom.
6. Klik **"Submit Engineering Review"**. Status CPR menjadi `COMPLETED`, dan tim Sales menerima notifikasi bahwa penawaran siap diterbitkan.

---

### 5.3. Menerbitkan Surat Penawaran Harga / Quotation (`/quotes/`)
Akses: **Menu Sidebar $\to$ Sales $\to$ Quotes**

1. Klik **"+ Create Quotation"** $\to$ Pilih nomor RFQ referensi (misal: `RFQ-2026-0091`).
2. **Konfigurasi Syarat Finansial & Komersial:**
   - **Mata Uang:** `IDR` (atau pilih `USD` jika ekspor $\to$ sistem otomatis mengonversi menggunakan kurs FX).
   - **Down Payment (DP %):** Masukkan `50%` (Uang muka wajib sebelum produksi).
   - **Incoterms:** Pilih `Loco Pabrik Cikarang` / `FOB Jakarta` / `DDP Pabrik Customer`.
   - **Masa Berlaku Penawaran (Validity):** Set `14 Hari`.
3. **Review Nilai Finansial:**
   - 10 Unit Meja @ Rp 6.850.000 = `Rp 68.500.000`
   - PPN 11% = `Rp 7.535.000`
   - **Grand Total = Rp 76.035.000**
   - **Nilai DP 50% = Rp 38.017.500**
4. Klik **"Generate Quotation"**.

---

# BAB 6: Persetujuan Digital Microsite & Otomasi Sistem (SO, WO, DP Invoice)

### 6.1. Mengirim Link Persetujuan Digital ke Klien
1. Buka halaman detail Quotation `QUO-2026-0045`.
2. Klik tombol **"Share Approval Link"**.
3. Sistem membuat URL Microsite unik terenkripsi:
   `https://mrp.labamu.co.id/quote-approval?token=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`
4. Kirimkan tautan tersebut langsung ke WhatsApp PIC Approver klien (*Ir. Bambang Sutejo*).

---

### 6.2. Persetujuan Pelanggan di Microsite (Customer Side)
1. Klien membuka tautan dari smartphone atau laptop (tanpa memerlukan akun login).
2. Klien melihat ringkasan spesifikasi teknis, harga satuan, PPN, dan termin pembayaran.
3. Klien mengunggah nomor/file Purchase Order resmi mereka (`PO-MMM-2026-089`).
4. Klien menandatangani persetujuan pada layar sentuh/mouse $\to$ Klik tombol hijau **"Approve Quotation"**.

---

### 6.3. Eksekusi Otomasi Sistem Seketika (*System Auto-Triggers*)
Detik itu juga setelah klien mengklik Approve, sistem Labamu MRP menjalankan 3 aksi paralel:

```
                  +----------------------------------------------+
                  |  Customer KLIK "APPROVE" di Microsite Link   |
                  +----------------------+-----------------------+
                                         |
     +-----------------------------------+-----------------------------------+
     |                                   |                                   |
     v                                   v                                   v
+------------------------+  +------------------------+  +------------------------+
| 1. Sales Order Terbit  |  | 2. Work Order Terbit   |  | 3. DP Invoice Terbit   |
|   (Nomor: SO-2026-0038)|  |   (Nomor: WO-2026-0041)|  | (Nomor: INV-0023-DP)   |
|   Status: CONFIRMED    |  |   Status: PENDING_ALLOC|  |   Nominal: 50% DP      |
+------------------------+  +------------------------+  +------------------------+
```

---

# BAB 7: Eksekusi Lantai Pabrik: Auto-Allocation, Routing In-House & Subkontrak

### 7.1. Pembayaran DP & Persetujuan Produksi
1. Bagian Finance mengirimkan faktur DP (`INV-0023-DP`) ke klien.
2. Klien mentransfer DP Rp 38.017.500 ke rekening perusahaan.
3. Finance membuka `/invoices/` $\to$ Klik **"Record Payment Settlement"** $\to$ Masukkan bukti transfer $\to$ Status Invoice menjadi `PAID`.
4. Status Sales Order otomatis berubah menjadi **`IN_PRODUCTION`**.

---

### 7.2. Alokasi Bahan Baku Otomatis (*Auto Allocate Materials*)
Akses: **Menu Sidebar $\to$ Manufacturing $\to$ Work Order $\to$ Buka `WO-2026-0041`**

1. Pada kartu **Material Allocation**, klik tombol biru **"Auto Allocate Materials"**.
2. Sistem mengecek ketersediaan stok fisik batch gudang untuk 10 unit meja:
   - Plat SS 304 2mm: Butuh `15 Lembar` $\to$ Stok Batch ada 35 Lembar $\to$ **Teralokasi (Reserved)**.
   - Pipa Hollow 50x50: Butuh `30 Batang` $\to$ Stok Batch ada 80 Batang $\to$ **Teralokasi**.
   - Kawat Las 308L: Butuh `5 Tube` $\to$ Stok Batch ada 14 Tube $\to$ **Teralokasi**.
   - Gas Argon: Butuh `4 Tabung` $\to$ Stok Batch ada 18 Tabung $\to$ **Teralokasi**.
   - Roda Castor: Butuh `40 Pcs` $\to$ Stok Batch ada 88 Pcs $\to$ **Teralokasi**.
   - Baut M8x20: Butuh `2 Box` $\to$ Stok Batch ada 22 Box $\to$ **Teralokasi**.
   - Kardus Box: Butuh `10 Pcs` $\to$ Stok Batch ada 70 Pcs $\to$ **Teralokasi**.
3. Seluruh baris berstatus hijau `Fulfilled` $\to$ Status Work Order otomatis berubah menjadi **`ALLOCATED`**.
4. Tombol **"Start Production"** kini aktif.

---

### 7.3. Menjalankan Tahapan Kerja In-House (*Shopfloor Execution*)
1. Klik **"Start Production"** $\to$ Status WO menjadi **`IN_PROGRESS`**.
2. Buka tab **Routing Progress**:

#### Eksekusi Tahapan 1 s.d. 3 (In-House):
- **Tahap 1 (`ROUT-CUTTING`):** Operator mesin laser memotong plat & pipa $\to$ Catat jam aktual: `15 Jam` $\to$ Klik **"Complete Step"**.
- **Tahap 2 (`ROUT-BENDING`):** Operator mesin press brake menekuk plat meja $\to$ Catat jam aktual: `10 Jam` $\to$ Klik **"Complete Step"**.
- **Tahap 3 (`ROUT-WELDING`):** Welder merakit dan mengelas struktur meja $\to$ Catat jam aktual: `30 Jam` $\to$ Klik **"Complete Step"**.

---

### 7.4. Eksekusi Tahapan Subkontrak Luar (*Outsource Process*)
Tahap 4 adalah **`ROUT-POWDERCOAT`** yang dikerjakan oleh vendor luar (*CV Warna Prima Coating*).

#### Prosedur Subkontrak:
1. Pada baris Tahap 4, klik tombol **"Release to Vendor"**.
2. **Formulir Subkontrak:**
   - Pilih Vendor: `CV Warna Prima Coating`.
   - Konfirmasi Biaya Jasa: Rp 250.000 x 10 unit = `Rp 2.500.000`.
   - Estimasi Tanggal Selesai Vendor: *3 Hari Kerja*.
3. Klik **"Confirm & Issue Subcontract PO"**:
   - Sistem menerbitkan PO Jasa Subkontrak `PO-2026-0056-SUB`.
   - Cetak dokumen **Surat Jalan Pengiriman Material ke Subkontraktor**.
   - Status tahapan WO berubah menjadi **`RELEASED_TO_VENDOR`**.
4. Barang fisik dikirim ke pabrik vendor beserta Surat Jalan.
5. **Penerimaan Kembali Hasil Subkontrak:**
   - Saat 10 unit meja yang sudah dicoating kembali ke pabrik:
   - Buka menu **Procurement $\to$ Purchase Orders $\to$ Buka `PO-2026-0056-SUB`**.
   - Masuk ke tab **Receipts** $\to$ Klik **"Record Receipt"**.
   - Masukkan nomor Surat Jalan balasan vendor dan jumlah unit diterima (`10 Unit`).
   - Klik **"Confirm Receipt"**.
   - **Efek Otomatis:** Tahapan subkontrak di Work Order otomatis tercentang **`COMPLETED`**.
6. **Tahap 5 (`ROUT-ASSEMBLY`):** Pasang roda castor, baut pengunci, dan bersihkan meja $\to$ Klik **"Complete Step"**.

---

# BAB 8: Quality Control (QC), Pemotongan Bahan Baku & Penambahan Barang Jadi

### 8.1. Pemeriksaan Mutu (QC Phase)
1. Setelah seluruh tahapan routing selesai, status Work Order otomatis berpindah ke **`QUALITY_CONTROL`**.
2. QC Inspector melakukan audit fisik:
   - Ketepatan dimensi: 1800 x 900 x 850 mm.
   - Ketebalan cat powder coating: min 80 micron.
   - Uji beban statis: 300 kg tanpa defleksi.
   - Fungsi putar dan kunci pada 4 roda castor.
3. Buka tab **Quality Control** di Work Order:
   - **Passed Quantity:** Input `10`.
   - **Rejected Quantity:** Input `0`.
   - **Catatan QC:** *"Lolos seluruh parameter pengujian fisik & fungsional"*.
4. Klik **"Approve QC"**.

---

### 8.2. Penyelesaian Work Order (*Completion & Inventory Movement*)
1. Klik tombol hijau besar **"Complete Work Order"**.
2. **Tiga Efek Transaksi yang Terjadi Secara Real-Time:**
   - **Pemotongan Bahan Baku (Stock Out):**
     Saldo fisik batch bahan baku di gudang otomatis berkurang secara permanen (Plat 2mm berkurang 15 lembar, pipa berkurang 30 batang, roda berkurang 40 pcs, dst).
   - **Penambahan Barang Jadi (Stock In):**
     Katalog produk `/products/` untuk SKU `PROD-TBL-SS180` bertambah **+10 Unit**.
   - **Pembaruan Sales Order:**
     Status pesanan penjualan pelanggan di `/orders/` otomatis berubah menjadi **`READY_TO_SHIP`**.

---

# BAB 9: Logistik Pengiriman (Surat Jalan & Resi) $\to$ Pelunasan Invoice $\to$ Closed

### 9.1. Pengemasan & Pengiriman Barang (`/orders/`)
Akses: **Menu Sidebar $\to$ Sales $\to$ Orders $\to$ Buka `SO-2026-0038`**

1. Petugas gudang mengemas 10 unit meja menggunakan kardus karton dan plastik bubble wrap.
2. Buka tab **Shipping & Logistics** $\to$ Klik **"Create Delivery / Surat Jalan"**.
3. **Formulir Pengiriman:**
   - Alamat Tujuan: Alamat pabrik PT Maju Makmur Mandiri (Karawang).
   - Armada Pengangkut: Truk Engkel Box (No. Polisi: `B 9876 PLI`).
   - Nama Driver: `Maman Suparman`.
4. Klik **"Print Delivery Note (Surat Jalan)"** (Cetak 3 rangkap: 1 lembar untuk customer, 1 lembar arsip gudang, 1 lembar kembali bertanda tangan).
5. Klik **"Dispatch Shipment"** $\to$ Status Sales Order berubah menjadi **`ON_SHIPPING`**.
6. Driver mengantar barang ke lokasi pabrik klien $\to$ Tim gudang klien memeriksa barang dan menandatangani Berita Acara Serah Terima (BAST).
7. Driver kembali membawa lembar BAST bertanda tangan $\to$ Admin Logistik mengunggah foto BAST $\to$ Klik **"Mark as Delivered"** $\to$ Status Sales Order berubah menjadi **`DELIVERED`**.

---

### 9.2. Penerbitan Final Invoice & Pelunasan (`/invoices/`)
Akses: **Menu Sidebar $\to$ Sales $\to$ Invoices**

1. Sistem otomatis menerbitkan faktur pelunasan sisa 50% (`INV-2026-0023-FINAL` senilai `Rp 38.017.500`).
2. Kirimkan invoice pelunasan ke Finance PT Maju Makmur Mandiri (*Siska Maharani*).
3. Setelah pembayaran pelunasan masuk ke rekening bank:
   - Buka faktur `INV-2026-0023-FINAL` $\to$ Klik **"Record Payment Settlement"**.
   - Input tanggal bayar, nomor referensi bank, dan lampirkan bukti transfer.
   - Klik **"Confirm Payment"** $\to$ Status Invoice menjadi **`PAID`**.
4. **PENUTUPAN ORDER (ORDER CLOSING):**
   - Karena Status Pengiriman = `DELIVERED` dan Status Pembayaran = `100% PAID`, sistem secara otomatis mengubah status Sales Order `SO-2026-0038` menjadi **`COMPLETED` (Closed)**.

---

# BAB 10: Analitik Finansial, HPP Aktual vs Standar, & Troubleshooting Lapangan

### 10.1. Laporan Finansial & Margin Riil Pesanan (`/reports/financial/`)
Akses: **Menu Sidebar $\to$ Analytics $\to$ Financial Report**

Buka analisa profitabilitas untuk Sales Order `SO-2026-0038`:

```
========================================================================
LAPORAN LABA RUGI RIIL (ACTUAL PROFITABILITY REPORT)
Order No: SO-2026-0038 | Customer: PT Maju Makmur Mandiri | Qty: 10 Unit
========================================================================
Pendapatan Penjualan (Revenue Excl. PPN)        : Rp 68.500.000
------------------------------------------------------------------------
Beban Pokok Penjualan Aktual (Actual COGS):
  1. Biaya Bahan Baku (10 Unit BOM)             : Rp 43.395.000
  2. Biaya Tenaga Kerja In-House (67.5 Jam)     : Rp  4.725.000
  3. Biaya Jasa Subkontrak Powder Coating       : Rp  2.500.000
------------------------------------------------------------------------
Total HPP Aktual                                : Rp 50.620.000
========================================================================
LABA KOTOR RIIL (GROSS PROFIT)                  : Rp 17.880.000
MARGIN LABA KOTOR RIIL                          : 26.10 %
========================================================================
```

---

### 10.2. Panduan Pemecahan Masalah Lapangan (*Troubleshooting*)

| Masalah yang Terjadi | Akar Penyebab | Solusi & Tindakan Perbaikan |
| :--- | :--- | :--- |
| **Tombol "Start Production" di Work Order tidak aktif / disable.** | Status WO masih `PENDING_ALLOCATION` karena stok material kurang atau belum diklik Auto Allocate. | Buka tab *Materials Allocation* $\to$ Klik **"Auto Allocate Materials"**. Jika ada baris merah (*Shortage*), klik **"Create Material Request"** agar Procurement membeli bahan terlebih dahulu. |
| **Klien tidak menerima link persetujuan penawaran.** | Token URL belum dibuat atau nomor WhatsApp salah. | Buka detail Quotation $\to$ Klik **"Share Approval Link"** $\to$ Salin tautan dan kirimkan ulang langsung ke PIC Approver. |
| **Tahapan Subkontrak tidak bisa di-complete di Work Order.** | Hasil subkontrak fisik belum dicatat penerimaannya di modul Procurement. | Buka menu `/purchase-orders/` $\to$ Buka PO Subkontrak terkait $\to$ Buka tab *Receipts* $\to$ Klik **"Record Receipt"** dan konfirmasi penerimaan unit dari vendor. |
| **Stok fisik di rak gudang berbeda dengan angka di sistem.** | Terjadi kerusakan material saat handling atau kesalahan input manual. | Buka `/materials/` $\to$ Tab *Stock Batches* $\to$ Klik **"+ Manual Stock Adjustment"** $\to$ Masukkan kuantitas penyesuaian riil beserta alasan audit selisih stok. |
| **Sales Order tidak otomatis berstatus COMPLETED.** | Masih ada salah satu syarat yang belum tuntas: pengiriman belum `DELIVERED` atau invoice belum `100% PAID`. | Periksa tab *Shipping* (pastikan resi/BAST sudah di-deliver) dan tab *Invoices* (pastikan faktur pelunasan sudah dicatat settlement-nya). |
