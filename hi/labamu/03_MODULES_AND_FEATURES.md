# 03. Spesifikasi Mendalam Modul & Fitur Labamu MRP

Dokumen ini berisi spesifikasi teknis dan fungsional yang sangat mendalam untuk seluruh modul yang ada pada sistem `mrp.labamu.co.id`, diekstrak langsung dari elemen DOM, input fields, labels, data tables, actions, dan alur bisnis sistem yang sedang berjalan.

---

## 📑 Daftar Modul yang Didokumentasikan

1. [Dashboard & To-Do List](#1-dashboard--to-do-list)
2. [Modul Products & Custom Products Request (CPR)](#2-modul-products--custom-products-request-cpr)
3. [Modul Sales (RFQ, Quotes, Orders, Invoices, Customers)](#3-modul-sales)
4. [Modul Procurement (Purchase Orders)](#4-modul-procurement)
5. [Modul Inventory (Materials & Vendors)](#5-modul-inventory)
6. [Modul Manufacturing (BOM, Routing, Work Orders, Material Requests)](#6-modul-manufacturing)
7. [Modul Analytics & Reports](#7-modul-analytics--reports)
8. [Modul Administration (User Groups, Company Settings, FX Management)](#8-modul-administration)
9. [Modul Khusus: Order Simulation (BETA)](#9-modul-khusus-order-simulation-beta)
10. [Panduan Alur Sistem (User Guide 10 Steps)](#10-panduan-alur-sistem-user-guide-10-steps)

---

## 1. Dashboard & To-Do List

- **Rute**: `/`
- **Tujuan**: Memberikan ringkasan KPI performa operasional manufaktur secara real-time dan daftar pekerjaan yang memerlukan tindakan pengguna (Approval / Action Item).

### Elemen Tampilan & Kartu Metrik
1. **Header User & Tanggal**: Menampilkan nama akun (misal: *Ryan Saputra - Owner*), ucapan selamat datang, serta tanggal aktif.
2. **Kartu Statistik Utama**:
   - **Products**: Menampilkan jumlah total produk aktif (cth: `2 Total Products`) -> Navigasi ke `/products`.
   - **RFQs**: Menampilkan total permohonan harga (cth: `2 Total requests`) -> Navigasi ke `/rfq`.
   - **Quotes**: Menampilkan total penawaran dibuat (cth: `9 Total quotes`) -> Navigasi ke `/quotes`.
   - **Orders**: Menampilkan total pesanan terkonfirmasi (cth: `8 Total orders`) -> Navigasi ke `/orders`.
   - **Invoices**: Menampilkan total faktur diterbitkan (cth: `2 Total invoices`) -> Navigasi ke `/invoices`.
3. **Widget "Need To Do"**:
   - Menampilkan tabel tugas mendesak yang menunggu approval atau eksekusi pengguna.
   - Kolom: `Module`, `Status`, `Oldest`.
   - Filter & Pencarian: Search box "Search to-do" + Filter Status Sorting ("Oldest", "Newest").
   - Empty State: *"You are all caught up — no actions needed right now."*

---

## 2. Modul Products & Custom Products Request (CPR)

### 2.1 Katalog Produk (`/products`)
- **Tabel Utama**:
  - Kolom: `Image` | `Product Name` | `SKU` | `Category` | `Price` | `Lead Time` | `Source` | `Status` (`ACTIVE` / `INACTIVE`).
  - Fitur: Search by Name/SKU, Filter Kategori, Filter Status, Tombol "Bulk Upload", Tombol "+ Create Product", Pagination.
  - Quick Action per Baris: *View Detail*, *Edit*, *Duplicate*, *Delete*.

### 2.2 Form Tambah/Edit Produk (`/products/create`)
- **Struktur Form**:
  - `* Product Name` (Text Input): Nama produk jadi.
  - `SKU` (Text Input): Kode unik produk. *Jika dikosongkan, sistem otomatis membuatkan SKU secara auto-generate*.
  - `* Category` (Select Dropdown): Memilih dari `/product/v1/categories`.
  - `* Status` (Radio Toggle): Pilihan `Active` atau `Inactive`.
  - `Description` (Rich Text / Textarea): Keterangan detail produk.
  - `Product Images` (Drag-and-drop Multi-Upload): Maksimum 5 file gambar, maksimal 5MB per gambar.
  - **Spesifikasi Fisik & Kemasan**:
    - `Primary Material` (Select / Text): Bahan utama pembentuk.
    - `Finishing` (Text Input): Jenis perlakuan akhir (misal: Glossy, Matte, Powder Coating).
    - `Weight` (Numeric Input): Berat satuan (kg/gram).
    - `Dimensions` (Height, Width, Length): Dimensi produk.
    - `Packaging Dimensions` (Height, Width, Length): Dimensi saat dikemas.
    - `Container Capacity`:
      - `20 ft Container` (Kapasitas muat unit)
      - `40 ft Container` (Kapasitas muat unit)
      - `40 ft High Cube Container` (Kapasitas muat unit)
  - **Manufaktur & Penetapan Harga**:
    - `Bill of Materials` (Select Combobox): Memilih BOM yang sudah dibuat di modul Manufaktur.
    - `* Lead Time` (Numeric Input + Unit Select `Week(s)` / `Day(s)`): Estimasi waktu produksi.
    - `Base Price` (Read-only Auto-calculated): *Dihitung otomatis berdasarkan COGS (Cost of Goods Sold) dari bahan & ongkos kerja pada BOM terkait*.
    - `* Selling Price Table` (Multi-currency Pricing Grid):
      - Kolom: `Currency` (IDR, USD, dll.) | `Selling Price` | `Action`.
      - Tombol: "+ Add Price" untuk menambahkan variasi harga valuta asing.

### 2.3 Custom Products Request (CPR) (`/custom-products-request`)
- **Tujuan**: Mengelola permintaan pembuatan produk kustom baru yang masuk melalui jalur RFQ pelanggan.
- **Tabel Data**:
  - Kolom: `CPR Number` | `RFQ Number` | `Customer Name` | `Request Product Name` | `Requested Quantity` | `Created Date` | `Created By` | `Status`.
- **Alur Kerja**:
  1. Saat RFQ dibuat dengan tipe produk "Custom", CPR otomatis ter-generate.
  2. Tim R&D/Engineering mengisi spesifikasi teknis dan membuatkan draft BOM.
  3. CPR disetujui (Approved) -> Harga pokok dihitung -> Penawaran (Quote) baru dapat diterbitkan.

---

## 3. Modul Sales

### 3.1 Request for Quotes (RFQ) (`/rfq`, `/rfq/create`)
- **Tabel Daftar RFQ**:
  - Kolom: `RFQ Number` | `Customer Name` | `Created By` | `Created At` | `Submission Status` | `Processing Status`.
  - Status Tab Pills: `Approved (n)`, `Customer`, `Internal Review`.
- **Form Pembuatan RFQ (`/rfq/create`)**:
  - **Identitas Pelanggan**:
    - `* Customer Name` (Auto-complete search / Create New): Nama perusahaan pelanggan.
    - `Customer Email` (Email): Email resmi perusahaan.
    - `Customer Phone` (Tel with Country Code `+62`): Nomor telepon kantor.
    - `* Customer Address` (Textarea): Alamat terdaftar/kantor pusat.
    - `Customer Tag` (Multi-select Tag): Maksimal 5 tags (misal: VIP, Corporate, Reseller).
  - **Daftar PIC (Person in Charge)**:
    - Tabel PIC: `Primary (Radio)` | `Name` | `Email` | `Role` | `Phone` | `Actions`. Tombol "+ Add PIC".
  - **Lampiran & Catatan**:
    - `Upload Documents`: Drag & Drop hingga 10 file, masing-masing maks 30MB.
    - `Customer Notes`: Catatan dari customer.
    - `Internal Notes`: Catatan internal tim sales.

### 3.2 Quotes (Surat Penawaran) (`/quotes`, `/quotes/create`)
- **Tabel Daftar Quotes**:
  - Kolom: `Quote No` | `RFQ No` | `Customer Name` | `Created By` | `Created At` | `Status` (`Draft`, `Sent`, `Accepted`, `Rejected`, `Expired`).
- **Form Pembuatan Quotes (`/quotes/create`)**:
  - **Header & Periode**:
    - `* Currency`: Pilihan mata uang transaksi (IDR, USD, dll.).
    - `Down Payment Percentage`: Nilai persentase DP yang disyaratkan (misal: `30%`, `50%`).
    - `* Valid Until` (Date Picker): Batas waktu berlakunya surat penawaran.
  - **Data Pelanggan**: Dipilih dari direktori customer atau terisi otomatis jika dibuat dari RFQ.
  - **Item Produk & Harga**:
    - Baris dinamis: Nama Produk, Deskripsi Kustom, Qty, Satuan, Unit Price, Diskon per item, Total Harga.
  - **Kalkulasi Biaya & Pajak**:
    - `Subtotal` (Otomatis)
    - `Tax Rate` (% PPN, misal 11%) & `Tax Total`
    - `Shipping Fee` (Biaya Kirim)
    - `Other Fee` (Biaya Lain-lain)
    - `Total Amount` (Grand Total terhitung otomatis)
  - **Ketentuan Finansial & Legal**:
    - `* Bank Account`: Pilihan rekening bank perusahaan yang terdaftar.
    - `* Payment Terms`: Pilihan termin pembayaran (misal: *50% DP, 50% Before Shipment*, *NET 30*).
    - `Incoterms`: FOB, CIF, EXW, DDP, dll.
    - `Risk Level`: Penilaian risiko kredit pelanggan.
    - `Shipping Method` & `Estimated Delivery Date`.
    - `Dispute Resolution Method` (Metode penyelesaian sengketa: Arbitrase BANI, Pengadilan Negeri, dll.).
    - `Governing Law` (Hukum yang berlaku: Hukum RI).
    - Klausul Hukum Tambahan (Checkboxes):
      - `Include Force Majeure Clause`
      - `Include Late Payment Penalties`
      - `Include Performance Guarantees`
  - **Aksi Tombol**: `Save Draft`, `Submit`, `Print PDF Preview`.

### 3.3 Sales Orders (`/orders`, `/orders/create`)
- **Tabel Daftar Order**:
  - Kolom: `Order No` | `Quote No` | `Customer Name` | `Priority` (`Low`, `Medium`, `High`, `Urgent`) | `Planned Start` | `Planned End` | `Created By` | `Created At` | `Status`.
  - Filter Status Tabs: `Waiting for Approval`, `Confirmed`, `In Progress`, `Completed`, `Cancelled`.
- **Form Order (`/orders/create`)**:
  - `Order Type`: Standard, Kustom, Maklon.
  - `Priority`: Pilihan prioritas lantai produksi.
  - `Planned Start Date` & `Planned End Date` (Target jadwal produksi).
  - `Actual Start Date` & `Actual End Date` (Realisasi produksi).
  - `Remarks`: Catatan instruksi khusus pengiriman atau produksi.

### 3.4 Invoices (`/invoices`, `/invoices/create`)
- **Tabel Daftar Faktur**:
  - Kolom: `Invoice No` | `Order No` | `Type` (Down Payment, Full Payment, Final Settlement) | `Customer` | `Issue Date` | `Due Date` | `Total Due` | `Payment Status` (`Unpaid`, `Partial`, `Paid`, `Overdue`) | `Status` (`Active`, `Void`).
- **Form Buat Faktur (`/invoices/create`)**:
  - `Invoice No` (Auto/Manual).
  - `* Invoice Type` (Down Payment / Progress Billing / Final Invoice).
  - `* Order No` (Select dari Sales Order terkonfirmasi).
  - `* Issue Date` & `Due Date` (Kalender jatuh tempo).
  - Upload bukti faktur pajak / lampiran dokumen pendukung.

### 3.5 Customers (`/customers`, `/customers/create`)
- **Tabel**: `Customer Name` | `Customer Email` | `Customer Phone`.
- **Form Buat Customer**:
  - `* Customer Name`, `Customer Email`, `Customer Phone`, `Customer Tag`, `* Customer Address`.
  - Tabel Multi-PIC: `Primary Check`, `Name`, `Email`, `Role`, `Phone`.

---

## 4. Modul Procurement

### 4.1 Purchase Orders (`/purchase-orders`, `/purchase-orders/create`)
- **Tabel Daftar PO**:
  - Kolom: `PO No` | `Vendor Name` | `Total Amount` | `PO Date` | `Created Date` | `Payment Status` | `PO Status` (`Draft`, `Waiting for Approval`, `Approved`, `In Delivery`, `Completed`, `Cancelled`).
- **Form Buat PO (`/purchase-orders/create`)**:
  - **Vendor Information**:
    - `* Vendor Name` (Search/Select dari `/inventory/v1/vendors`).
    - `Phone Number`, `Email`, `Address` (Auto-fill dari database vendor).
  - **PO Details**:
    - `* Purchase Order Date` (Date Picker).
    - `Expected Delivery Date` (Estimasi tanggal tiba di gudang).
    - `* Currency` (IDR, USD, dll.).
  - **Shipping & Penerima (Recipient)**:
    - `Recipient Name`, `Phone Number`, `Email`, `Address` (Alamat gudang penerimaan).
  - **Daftar Material yang Dipesan**:
    - Baris: Material (Select dari `/inventory/v1/materials`), Qty, Unit Cost, Subtotal.
  - **Footer & Terms**:
    - `Notes` & `Terms and Conditions`.
    - Tombol: `Save as Draft`, `Add Fee`, `Submit PO`.

---

## 5. Modul Inventory

### 5.1 Materials (`/materials`, `/materials/create`)
- **Tabel Daftar Bahan**:
  - Kolom: `Image` | `Name` | `Category` | `ABC Classification` (`A`, `B`, `C`) | `Type` (`Raw Material`, `Packaging`, `Consumable`) | `On-Hand Stock` | `Average Cost` | `Status`.
  - Tab Filter: `A Classification (n)`, `B Classification (n)`, `C Classification (n)`.
- **Form Tambah Material (`/materials/create`)**:
  - `SKU` (Text Input - Auto-generated jika kosong).
  - `* Material Name` (Text Input).
  - `* Category` (Select dari kategori material).
  - `* ABC Classification` (Select `A` = Nilai tinggi volume rendah, `B` = Menengah, `C` = Nilai rendah volume tinggi).
  - `* Material Type` (Select: *Raw Material*, *Packaging*, *Consumable*).
  - `* Unit of Measure (UOM)` (Select: *Pcs*, *Kg*, *Meter*, *Liter*, *Roll*, dll.).
  - `Stock Risk` (Peringatan risiko kadaluarsa atau kerusakan).
  - `Description` (Textarea).
  - `Select Images` (Upload gambar sampel bahan).

### 5.2 Vendors (`/vendors`, `/vendors/create`)
- **Tabel**: `Name` | `Alias` | `PIC Name` | `Phone` | `Status` (`ACTIVE`/`INACTIVE`).
- **Form Buat Vendor**:
  - `* Vendor Name`, `Alias`, `Status` (Toggle Active), `PIC Name`, `PIC Email`, `PIC Phone`, `Business Address`.

---

## 6. Modul Manufacturing

### 6.1 Bill of Materials (BOM) (`/bill-of-materials`, `/bill-of-materials/create`)
- **Tabel Daftar BOM**:
  - Kolom: `BOM Name` | `Version` (v1.0, v1.1) | `Created At` | `Updated At` | `Created By` | `Status` (`Active`, `Draft`, `Archived`).
- **Form Buat BOM (`/bill-of-materials/create`)**:
  - `* BOM Name`: Nama formula/resep produksi.
  - `Description`: Deskripsi instruksi perakitan.
  - **Struktur Rincian Biaya**:
    - `Material Cost`: Terhitung otomatis dari penjumlahan `(Quantity Material * Unit Cost)`.
    - `* Labour Cost` (Input Rupiah): Ongkos tenaga kerja langsung.
    - `* Packing Cost` (Input Rupiah): Ongkos pengemasan.
    - `* Other Cost` (Input Rupiah): Biaya overhead/listrik/mesin.
    - `Total Cost`: Penjumlahan otomatis seluruh komponen biaya di atas.
  - **Tabel Komponen Bahan**:
    - Tombol: "+ Add Material".
    - Baris: Material (Select), Jumlah Kebutuhan (Quantity), Satuan (UOM), Estimasi Waste/Scrap (%).

### 6.2 Routings (`/routing`)
- **Tabel**: `Routing Name` | `Description` | `Status` | `Created At`.
- **Fungsi**: Mendefinisikan tahapan stasiun kerja (Work Centers) dan urutan proses perakitan (misal: *Cutting -> Printing -> Folding -> Quality Control -> Packaging*).

### 6.3 Work Orders (Surat Perintah Kerja) (`/work-orders`)
- **Tabel Daftar SPK**:
  - Kolom: `Work Order No.` | `Order Number` | `Product` | `Qty` | `Priority` | `Planned Start Date` | `Planned End Date` | `Created By` | `Status`.
  - Filter Status Tabs: `Not Started`, `In Progress`, `Completed`, `Cancelled`.

### 6.4 Material Requests (`/material-requests`)
- **Tabel**: `Requested Date` | `Request ID` | `Requested By` | `Work Order No` | `Total Item Type` | `Status` (`Draft`, `Preparing`, `Allocated`, `Issued`).
- **Fungsi**: Permintaan alokasi dan serah terima bahan dari staf gudang ke operator lantai produksi berdasarkan Work Order aktif.

---

## 7. Modul Analytics & Reports

### 7.1 Sales Funnel Report (`/reports/sales`)
- **Sales Conversion Funnel**:
  - Persentase konversi tahap ke tahap: `RFQs -> Quotes -> Orders -> Work Orders` (Contoh rasio sukses: `88.89%`).
  - Grafik tren nominal penawaran vs realisasi penjualan per bulan.

### 7.2 Financial Report (`/reports/financial`)
- **Tab Laporan**:
  - `Order Financials`: Omset kotor, diskon, margin per pesanan.
  - `Work Order Costs`: Realisasi biaya produksi aktual vs standar BOM.
  - `Product Profitability`: Produk dengan kontribusi margin tertinggi.
  - `Invoice Status`: Ringkasan piutang (AR) belum terbayar.

### 7.3 Inventory Report (`/reports/inventory`)
- **Tabel 1: Material Consumption & Allocation**:
  - Kolom: `No` | `Material Name` | `SKU` | `On-Hand Qty` | `Classification` (`A`/`B`/`C`) | `Avg. Daily Allocated (Last 30d)`.
- **Tabel 2: Inventory Valuation**:
  - Kolom: `No` | `Material Name` | `SKU` | `Classification` | `On-Hand Stock` | `Average Cost (IDR)` | `Inventory Value (IDR)`.

### 7.4 Procurement & AP Report (`/reports/procurement-ap`)
- Analisis belanja material ke vendor.
- `Vendor Liability` & `Accounts Payable Aging` (Hutang jatuh tempo 0-30 hari, 31-60 hari, >90 hari).

---

## 8. Modul Administration

### 8.1 User Groups & Permissions (`/user-management/user-groups`)
- **Tabel**: `Name` | `Description` | `Created`.
- **Matriks Hak Akses**: Pengaturan checklist `can_read`, `can_create`, `can_update`, `can_delete`, `can_approve` untuk setiap modul.

### 8.2 Company Settings (`/company-settings`)
- Profil perusahaan, logo, NPWP, alamat kantor.
- **Tabel Rekening Bank Tenant**:
  - Kolom: `Account Name` | `Account Number` | `Bank Name` | `Supported Currencies` | `Swift Code` | `Branch` | `Actions`.

### 8.3 FX Management (`/fx-management`)
- **Tabel Mata Uang**:
  - Kolom: `Code` (IDR, USD, SGD) | `Name` | `Active (Toggle)` | `Exchange Rate to Base Currency`.

---

## 9. Modul Khusus: Order Simulation (BETA)

- **Rute**: `/order-simulation`
- **Tujuan**: Simulator kapasitas material dan kelayakan lead time sebelum menerbitkan Order resmi.
- **Form Input**:
  - `* Order Required Date` (Target tanggal selesai yang diminta pelanggan).
  - **Tabel Simulasi Produk**:
    - Tombol: "+ Add Product".
    - Kolom: `Product` (Pilih dari katalog) | `Quantity` (Jumlah pesanan) | `Selling Price / Unit` | `Forecasted Revenue`.
- **Output Hasil Simulasi**:
  - Analisis ketersediaan stok bahan di gudang saat ini vs kebutuhan BOM.
  - Rekomendasi otomatis: *"Bahan Cukup, Produksi Dapat Dimulai"* ATAU *"Perlu PO Tambahan untuk [Nama Material] sebanyak X Unit dengan estimasi lead time Y hari"*.

---

## 10. Panduan Alur Sistem (User Guide 10 Steps)

Berdasarkan dokumentasi resmi yang tertanam pada sistem (`/help/user-guide`):

1. **Step 1: Getting Started**: Setup akun, profil perusahaan, dan pemahaman layout navigasi.
2. **Step 2: Manage Materials**: Daftarkan seluruh bahan baku, kategori, satuan (UOM), dan klasifikasi ABC.
3. **Step 3: Create Routing**: Definisikan stasiun kerja dan tahapan proses produksi.
4. **Step 4: Create Bill of Materials (BOM)**: Susun formula bahan baku dan biaya tenaga kerja per produk.
5. **Step 5: Create Products**: Tentukan katalog produk jadi yang menunjuk ke BOM terkait.
6. **Step 6: Manage Customers & Vendors**: Daftarkan rekanan bisnis pembeli dan pemasok.
7. **Step 7: Custom Products Request (CPR)**: Tangani spesifikasi produk kustom dari RFQ pelanggan.
8. **Step 8: Manage Quotes**: Terbitkan surat penawaran harga resmi dengan kalkulasi pajak & terms.
9. **Step 9: Manage Orders**: Konfirmasi pesanan penjualan menjadi Sales Order aktif.
10. **Step 10: Manage Work Order**: Eksekusi proses produksi SPK, serah terima bahan gudang, hingga produk jadi siap dikirim dan ditagihkan melalui Invoice.
