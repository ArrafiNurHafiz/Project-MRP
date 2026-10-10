# SPESIFIKASI DETAIL MODUL & RUTE HALAMAN (MODULE SPECIFICATIONS)
## Detail Lengkap Form, Tabel, State, dan Aksi UI Setiap Modul Labamu MRP

Dokumen ini membedah setiap halaman dalam sistem Labamu MRP: komponen UI, filter data, dialog modal, tombol aksi, dan validasi form.

---

## 1. Modul Dashboard (`/`)

- **Header:** Tanggal hari ini, ucapan personal (*"Welcome, Ryan Saputra 👋"*), ringkasan status operasional.
- **Top KPI Cards (5 Metrik Utama):**
  1. *Products:* Total katalog produk aktif (dengan link cepat ke `/products/` dan tombol shortcut tambah).
  2. *RFQs:* Jumlah permintaan penawaran masuk (status pending & quoted).
  3. *Quotes:* Jumlah penawaran aktif & menunggu persetujuan klien.
  4. *Orders:* Total Sales Order dalam pengerjaan (In Production, Ready to Ship, On Shipping).
  5. *Invoices:* Total tagihan outstanding & tagihan DP.
- **Section "Need To Do" (Task Manager Cerdas):**
  - Menampilkan daftar antrian tugas yang membutuhkan tindakan pengguna:
    - *RFQ butuh CPR (Engineering)*
    - *Quotation disetujui butuh konfirmasi DP (Finance)*
    - *Work Order butuh Alokasi Stok (Production)*
    - *Stok menipis di bawah Stock Risk Level (Procurement)*
  - Filter: `Module`, `Status`, Sort by: `Oldest` / `Newest`.

---

## 2. Modul Resources (Bahan Baku, Vendor & Pelanggan)

### A. Materials & Stock Batches (`/materials/`)
- **Tampilan Tab:**
  1. *Tab 1: Material Catalog:*
     - Kolom Tabel: `SKU`, `Material Name`, `Category`, `ABC Classification` (Badge A/B/C), `Type` (Raw / Finished), `UoM`, `Total Stock`, `Stock Risk Min`, `Average Cost Price (IDR)`, `Actions`.
     - Tombol Aksi: `+ Add Material`, `Import CSV`, `Export Excel`.
     - Dialog Add Material: SKU auto-generator / manual, Nama, Kategori dropdown, UoM dropdown, Stock Risk threshold, Harga acuan.
  2. *Tab 2: Stock Batches:*
     - Kolom Tabel: `Batch Number`, `Material SKU & Name`, `Initial Qty`, `Current Available Qty`, `Allocated Qty (Reserved)`, `Unit Cost`, `Purchase Date`, `Expiry Date`, `Warehouse Rack`, `Vendor Name`, `Status` (Received / In Use / Depleted).
     - Tombol Aksi: `+ Manual Stock Adjustment`, `Batch Stock In`.

### B. Vendors (`/vendors/`)
- **Fitur:** Manajemen penyuplai bahan baku & rekanan jasa subkontrak.
- **Kolom Tabel:** `Vendor Code`, `Company Name`, `Category` (Raw Material, Fasteners, Outsourcing/Coating), `Primary Contact (PIC)`, `Phone`, `Email`, `Payment Terms (NET X Days)`, `Active POs`, `Actions`.
- **Form Input Vendor:** Data perusahaan, alamat pabrik, termin pembayaran, serta **Multi-PIC Form Array** (Nama, Jabatan, HP, Email, Checkbox IsPrimary).

### C. Customers (`/customers/`)
- **Fitur:** Direktori klien korporat dengan konfigurasi otorisasi multi-PIC.
- **Kolom Tabel:** `Customer Code`, `Customer Name`, `Industry`, `Primary Approver`, `Approver Phone`, `Billing Address`, `Shipping Address`, `Total Orders`, `Actions`.
- **Form Input Customer:**
  - Multi-PIC dengan peran portal:
    - `Approver`: Memiliki wewenang tanda tangan digital & persetujuan penawaran pada Microsite.
    - `Viewer`: Hanya dapat melihat status dan invoice.

---

## 3. Modul Product & Engineering (BOM, Routing & CPR)

### A. Product Catalog (`/products/` & `/products/create/`)
- **Kolom Tabel:** `Product SKU`, `Product Name`, `Category`, `UoM`, `Current Stock`, `Standard Cost (BOM + Routing)`, `Selling Price`, `Margin %`, `Status` (Active/Archived).
- **Detail Form Produk:**
  - Tab 1: Info Dasar (SKU, Nama, Kategori, Deskripsi, Dimensi, Berat, Foto Produk).
  - Tab 2: Default BOM Assignment.
  - Tab 3: Default Routing Assignment.
  - Tab 4: Penetapan Harga & Margin Simulator.

### B. Bill of Materials (`/bill-of-materials/`)
- **Tampilan:** Daftar formula produksi terdaftar.
- **Form Builder BOM:**
  - Header: Pilih Produk, Kode BOM (misal: `BOM-TBL-SS180-V1`), Versi BOM, Status Aktif.
  - Tabel Item Bahan Baku (Dynamic Form Array):
    - Baris: Pilih Material SKU, Qty yang Dibutuhkan per unit output, Satuan (UoM), Estimasi Biaya Satuan, Subtotal Biaya.
  - Summary Bar: Total Material Cost per unit produk.

### C. Routing Master (`/routing/`)
- **Tampilan:** Tahapan proses kerja lantai pabrik.
- **Form Builder Routing:**
  - Header: Kode Routing (`ROUT-TBL-SS180`), Nama Routing.
  - Urutan Tahapan (Step Ordering):
    - *Step 1:* `ROUT-CUTTING` (In-House) - Waktu standar: 1.5 jam, Biaya operator/jam.
    - *Step 2:* `ROUT-BENDING` (In-House) - Waktu standar: 1.0 jam.
    - *Step 3:* `ROUT-WELDING` (In-House) - Waktu standar: 3.0 jam.
    - *Step 4:* `ROUT-POWDERCOAT` (**Outsource / Subkontrak**) - Estimasi biaya jasa per unit, Lead time vendor.
    - *Step 5:* `ROUT-ASSEMBLY & QC` (In-House) - Waktu standar: 1.0 jam.
  - Summary: Total Lead Time (Jam) & Total Routing Cost.

### D. Custom Products Request / CPR (`/custom-products-request/`)
- **Tujuan:** Menghubungkan divisi Sales dan Engineering saat klien meminta produk kustom non-standar di RFQ.
- **Tabel CPR:** `CPR Number`, `RFQ Reference`, `Product Description`, `Requested By`, `Engineering Reviewer`, `Est. HPP`, `Suggested Price`, `Est. Lead Time`, `Status` (Submitted / In Review / Completed).
- **Halaman Form Analisis Engineering (`/custom-products-request/[id]`):**
  - Peninjauan lampiran CAD/Technical Drawing.
  - Dynamic Builder untuk Estimasi Bahan Baku (Mini-BOM).
  - Dynamic Builder untuk Estimasi Tahapan Kerja (Mini-Routing).
  - Kalkulasi Otomatis: `Total Material Cost + Total Labor/Outsource Cost = Total HPP`.
  - Margin Input (%): Menghasilkan `Suggested Selling Price` yang langsung dikirimkan kembali ke Sales di modul Quotation.

---

## 4. Modul Sales (RFQ, Quotations, Orders, Invoices)

### A. Request for Quotations (`/rfq/` & `/rfq/create/`)
- **Form Pembuatan RFQ:**
  - Pilih Pelanggan (Dropdown dengan autofill PIC & alamat).
  - Tanggal Target Pengiriman (*Target Delivery Date*).
  - Daftar Baris Permintaan (Items):
    - Tipe Item: *Standard Product* (pilih dari katalog) ATAU *Custom Product* (input nama & unggah gambar CAD/PDF).
    - Kuantitas & Satuan.
    - Catatan spesifikasi teknis.
- **Auto-Hook:** Jika terdapat item *Custom*, sistem otomatis menerbitkan tiket CPR di `/custom-products-request/`.

### B. Quotations (`/quotes/` & `/quotes/create/`)
- **Form Builder Quotation:**
  - Header: Nomor Penawaran, Tautan RFQ (opsional), Pelanggan, Tanggal Jatuh Tempo Penawaran, Multi-Valuta (IDR / USD / SGD dengan Kurs Otomatis dari FX Management), Termin Pembayaran (Down Payment % misal 50%), Incoterms (Loco / FOB / DDP).
  - Tabel Penawaran Harga: Produk, Deskripsi, Qty, Harga Satuan, Diskon %, Subtotal.
  - Ringkasan Finansial: Subtotal, Diskon Global, PPN (11%), Grand Total.
- **Fitur Digital Approval Microsite:**
  - Tombol: `Generate Shareable Approval Link` (Token URL unik).
  - Pelanggan membuka portal microsite tanpa perlu login:
    - Melihat ringkasan penawaran, spesifikasi, dan breakdown biaya resmi.
    - Menyetujui penawaran dengan mengunggah PO Pelanggan dan tanda tangan digital.
    - Sistem menerima sinyal persetujuan -> Otomatis mengubah status Quotation menjadi `Approved`.

### C. Sales Orders (`/orders/`)
- **Trigger:** Terbuat secara otomatis saat Quotation berstatus `Approved`.
- **Tabel SO:** `Order Number`, `Customer`, `Total Value`, `DP Status`, `Production Status` (% Progress), `Shipping Status`, `Target Date`, `Actions`.
- **Detail Sales Order (`/orders/[id]`):**
  - Tab 1: Ringkasan Order & Item.
  - Tab 2: Monitoring Work Order Pabrik (Status real-time dari lantai produksi).
  - Tab 3: Faktur Terkait (DP Invoice & Pelunasan).
  - Tab 4: Logistik & Pengiriman (Input Nomor Surat Jalan, Resi Pengiriman, Armada Ekspedisi, dan update status `Delivered`).

### D. Invoices & Penagihan (`/invoices/`)
- **Tipe Invoice:**
  1. *Down Payment Invoice:* Otomatis terbit saat SO aktif jika Quotation mensyaratkan DP > 0%.
  2. *Final Settlement Invoice:* Otomatis terbit saat produksi selesai dan barang siap dikirim.
- **Pencatatan Settlement (Payment Recording):**
  - Modal Input Pembayaran: Tanggal Bayar, Jumlah yang Diterima, Rekening Bank Tujuan, Metode Bayar, Lampiran Bukti Transfer.
  - Status Otomatis: `Unpaid` -> `Partially Paid` -> `Paid`.

---

## 5. Modul Manufacturing Execution (Work Orders & Material Requests)

### A. Work Orders (`/work-orders/`)
- **Trigger:** Otomatis digenerate saat Sales Order dikonfirmasi.
- **Halaman Detail Eksekusi Work Order (`/work-orders/[id]`):**
  - **Tombol Kritis 1: "Auto Allocate Materials"**
    - Sistem mencocokkan formula BOM dengan stok batch bahan baku di gudang berdasarkan metode FIFO / Expiry.
    - Jika stok cukup: Stok batch di-reserve (`allocatedQuantity += reqQty`), status WO menjadi `Allocated`.
    - Jika stok kurang: Sistem memunculkan peringatan kekurangan stok dan tombol `Create Material Request`.
  - **Eksekusi Tahapan Routing (Shopfloor Tracking):**
    - Setiap tahap memiliki operator, timer, dan status `Pending` -> `In Progress` -> `Completed`.
    - **Tahapan Subkontrak (Outsource):**
      - Terdapat tombol `Release to Vendor` -> Membuka modal pembuatan PO Jasa Subkontrak ke Vendor terkait + Cetak Surat Jalan Subkontrak.
      - Saat barang kembali dari vendor dan dicatat di *PO Receipt*, tahapan subkontrak otomatis tercentang selesai.
  - **Quality Control & Completion:**
    - Input hasil inspeksi QC (Pass/Reject count).
    - Tombol `Complete Work Order`: Menambah stok barang jadi di gudang dan mengubah status Sales Order menjadi `Ready to Ship`.

### B. Material Requests (`/material-requests/`)
- **Daftar Permintaan Bahan:** Diterbitkan oleh PPIC jika stok gudang tidak mencukupi alokasi produksi.
- **Aksi Procurement:** Tombol `Convert to Purchase Order` yang langsung mengisi vendor rekanan utama dan kuantitas kurang.

---

## 6. Modul Procurement (Purchase Orders & Receipts)

### A. Purchase Orders (`/purchase-orders/`)
- **Tipe PO:** `Raw Material Purchase` (Bahan Baku) atau `Subcontract Service` (Jasa Luar).
- **Form PO:** Pilih Vendor, Alamat Kirim, Estimasi Tanggal Datang, Tabel Item Material/Jasa, Biaya Satuan, Pajak PPN, Total.
- **Tab Goods Receipt (`PO Receipts`):**
  - Saat truk logistik vendor tiba di gudang, petugas gudang mencatat penerimaan barang:
    - Input: Nomor Surat Jalan Vendor, Kuantitas Diterima, Tanggal Kedaluwarsa, Lokasi Rak Gudang.
    - Sistem otomatis mencetak barcode / nomor Batch baru (`BAT-YYYYMMDD-XXX`) dan menambah stok aktif material.

---

## 7. Modul Analytics & Reports

1. **Financial Report (`/reports/financial/`):**
   - Pendapatan kotor, Beban Pokok Penjualan (HPP Aktual vs HPP Estimasi BOM), Gross Margin per proyek/order.
2. **Inventory Report (`/reports/inventory/`):**
   - Valuasi total aset gudang, Analisis Pareto ABC (Material kelas A menyerap 80% modal), Dead Stock alert.
3. **Sales Funnel Report (`/reports/sales/`):**
   - Conversion Rate: `Inquiry (RFQ) -> Quote Diterbitkan -> Quote Approved -> Selesai`. Rata-rata siklus penutupan transaksi (Hari).
4. **Work Order Monitoring (`/reports/work-order/`):**
   - Lead time aktual vs standar routing, utilisasi jam kerja operator, waktu henti subkontrak.
5. **Procurement & AP Report (`/reports/procurement-ap/`):**
   - Hutang usaha ke vendor, jadwal jatuh tempo pembayaran PO, histori performa ketepatan vendor.

---

## 8. Modul Order Simulation (`/order-simulation/`)

- **Fungsi:** Alat bantu cepat bagi tim Sales/Marketing untuk mengecek kelayakan order sebelum membuat Quotation resmi.
- **Input:** Pilih Produk, Masukkan Qty Pesanan, Masukkan Target Tanggal Kirim, Masukkan Rencana Diskon %.
- **Output Simulator (Instant Calculation):**
  1. *Ketersediaan Bahan Baku:* Persentase stok tersedia vs harus dibeli.
  2. *Estimasi Lead Time Produksi:* Berdasarkan total jam routing & antrian WO aktif.
  3. *Proyeksi Margin Laba Bersih:* Membandingkan HPP standar dengan harga jual setelah diskon.
