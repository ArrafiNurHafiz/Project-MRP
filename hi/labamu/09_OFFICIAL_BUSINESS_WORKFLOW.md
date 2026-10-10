# 09. Panduan Alur Bisnis Operasional Resmi (Official 12-Step MRP Guide)

Dokumentasi ini merangkum seluruh logika bisnis operasional manufaktur 12 langkah resmi dari Labamu MRP (`/help/user-guide`) yang menjadi acuan alur kerja sistem.

---

## Ringkasan 12 Langkah Alur Manufaktur Labamu MRP

```
[FASE 1: MASTER DATA]
  Step 1: Getting Started & Account Setup
  Step 2: Manage Materials (Bahan Baku & Klasifikasi ABC)
  Step 3: Create Routing (Tahapan Stasiun Kerja Produksi)
  Step 4: Create Bill of Materials / BOM (Formula Resep Produk + Jam Kerja)
  Step 5: Create Products (Katalog Produk Jadi / Setengah Jadi)

[FASE 2: SIKLUS PENJUALAN & PERMINTAAN KUSTOM]
  Step 6: Request for Quotation / RFQ (Permintaan Penawaran Pelanggan)
  Step 7: Custom Products Request / CPR (Spesifikasi Produk Kustom)
  Step 8: Manage Quotes (Surat Penawaran Harga Resmi)
  Step 9: Manage Orders (Konfirmasi Pesanan Penjualan)

[FASE 3: EKSEKUSI MANUFAKTUR & PENGADAAN]
  Step 10: Manage Work Order (SPK Produksi & Alokasi Bahan Otomatis)
  Step 11: Manage Purchase Orders / PO (Pengadaan Bahan / Jasa Maklon Outsource)
  Step 12: Create Invoice (Faktur DP / Termin / Pelunasan)
```

---

## Rincian Detail 12 Langkah Bisnis

### Step 1: Getting Started & Pengaturan Awal
- Modul MRP aktif setelah tenant bisnis terverifikasi.
- Struktur menu utama terbagi menjadi 7 area:
  1. **Dashboard**: Ringkasan KPI dan antrian To-Do persetujuan.
  2. **Products**: Katalog Produk Jadi & Custom Products Request (CPR).
  3. **Sales**: RFQ, Quotes, Sales Orders, Invoices, Customers.
  4. **Resources**: Materials, Vendors, Material Requests, Purchase Orders.
  5. **Manufacturing**: Work Orders (SPK), Bill of Materials (BOM), Routings.
  6. **Analytics**: Financial Report, Inventory Report, Sales Funnel, Work Order Monitoring, Procurement & AP Report.
  7. **Administration**: User Management (Groups & RBAC), FX Management (Mata Uang & Kurs), Company Settings (Profil & Rekening Bank).

---

### Step 2: Manage Materials (Bahan Baku)
- **Tujuan**: Mendaftarkan seluruh bahan baku, material kemasan, dan bahan habis pakai.
- **Field & Aturan Input**:
  - `SKU`: Kode unik material (Auto-generated jika kosong).
  - `Material Name` *(Mandatory)*: Nama bahan spesifik (misal: *Steel Plate 2mm*, *Kardus Single Wall*).
  - `Category` *(Mandatory)*: Kategori bahan (misal: *Metal*, *Plastic*, *Paper*, *Chemical*).
  - `ABC Classification` *(Mandatory)*:
    - **A**: Nilai finansial tinggi (70-80% nilai inventori), volume penggunaan rendah. Pengawasan ketat.
    - **B**: Nilai finansial menengah (15-25% nilai inventori), volume penggunaan sedang.
    - **C**: Nilai finansial rendah (5% nilai inventori), volume besar (cth: baut, lakban).
  - `Material Type` *(Mandatory)*: *Raw Material*, *Packaging*, *Consumable*.
  - `Unit of Measure (UOM)` *(Mandatory)*: Satuan hitung baku (Pcs, Kg, Meter, Liter, Roll, Box).
  - `Stock Risk`: Risiko susut, kadaluarsa, atau kelembaban.
- **Bulk Upload Materials**: Mendukung upload Excel/CSV massal untuk inisialisasi awal.

---

### Step 3: Create Routing (Tahapan & Stasiun Kerja)
- **Tujuan**: Mendefinisikan urutan tahapan operasi lantai pabrik untuk membuat suatu produk.
- **Aturan & Komponen**:
  - Setiap routing terdiri dari 1 atau lebih tahapan berurutan (*Sequence Steps*).
  - Setiap tahap mendefinisikan:
    - `Step Name`: Nama tahapan (misal: *Cutting*, *CNC Machining*, *Painting*, *Assembly*, *QC & Packing*).
    - `Work Center`: Lokasi mesin atau stasiun kerja (misal: *Lantai 1 Mesin Potong*, *Ruang Spray Painting*).
    - `Estimated Hours`: Perkiraan waktu pengerjaan per unit produk.
    - `Hourly Rate`: Biaya tenaga kerja mesin/operator per jam.

---

### Step 4: Create Bill of Materials (BOM)
- **Tujuan**: Formula resep produksi yang menggabungkan daftar bahan dan tahapan routing.
- **Syarat Validasi Sistem**: *Sistem mensyaratkan minimal 1 baris bahan baku (Material Line) dan minimal 1 tahapan routing (Routing Step) sebelum BOM dapat disimpan*.
- **Komponen Kalkulasi Otomatis**:
  $$\text{Material Cost} = \sum (\text{Qty Material} \times \text{Unit Cost} \times (1 + \text{Waste } \%))$$
  $$\text{Labour Cost} = \sum (\text{Estimated Hours} \times \text{Hourly Rate})$$
  $$\text{Total Cost (COGS)} = \text{Material Cost} + \text{Labour Cost} + \text{Packing Cost} + \text{Other Cost}$$

---

### Step 5: Create Products (Katalog Produk Jadi)
- **Tujuan**: Mendefinisikan produk akhir yang siap dijual ke customer.
- **Keterikatan dengan BOM**: Setiap produk jadi menunjuk ke satu BOM aktif.
- **Base Price**: Terisi otomatis dari `Total Cost` BOM sebagai acuan dasar harga pokok.
- **Selling Price**: Ditentukan dalam satu atau lebih mata uang (Multi-currency Pricing Grid).
- **Spesifikasi Logistik**: Dimensi produk, dimensi karton kemasan, dan kapasitas hitung muatan kontainer (*20ft*, *40ft*, *40ft HC*).

---

### Step 6: Request for Quotation (RFQ)
- **Tujuan**: Mendokumentasikan permintaan penawaran harga yang masuk dari calon pelanggan.
- **Tipe Item RFQ**:
  - **Standard Product**: Produk yang sudah ada di katalog.
  - **Custom Product**: Produk baru dengan spesifikasi kustom yang diminta pelanggan (memicu CPR di Step 7).

---

### Step 7: Custom Products Request (CPR)
- **Tujuan**: Menjembatani tim Sales dan tim Engineering saat ada permintaan produk non-standar.
- **Alur Kerja**:
  1. CPR otomatis tercipta saat RFQ memuat produk bertipe *Custom*.
  2. Tim teknis mengisi spesifikasi material, rancangan gambar, dan draft BOM sementara.
  3. Setelah estimasi biaya selesai, CPR di-*Approve*.
  4. Sales baru diizinkan membuat surat penawaran (Quote) resmi kepada pelanggan.

---

### Step 8: Manage Quotes (Surat Penawaran Harga)
- **Tujuan**: Menyusun surat penawaran harga resmi yang mengikat jangka waktu tertentu.
- **Fitur Utama**:
  - Pilihan rekening bank penerima pembayaran DP.
  - Pilihan klausul hukum (Incoterms, Dispute Resolution BANI/Pengadilan, Force Majeure, Denda Keterlambatan, Jaminan Kinerja).
  - Kalkulasi otomatis: Subtotal, Diskon Baris/Global, PPN (11%), Ongkos Kirim, Biaya Lain-lain, Grand Total.
  - Opsi: *Save Draft*, *Send to Customer*, *Print PDF*.

---

### Step 9: Manage Orders (Sales Orders Terkonfirmasi)
- **Tujuan**: Mengonversi Quotation yang disetujui pelanggan menjadi Surat Pesanan (SO) mengikat.
- **Efek Otomatis Sistem**:
  - Mengunci harga dan kuantitas pesanan.
  - **Secara otomatis men-generate Work Order (SPK) di modul Manufaktur**.
  - Mengubah status pesanan menjadi `Confirmed`.

---

### Step 10: Manage Work Order (Surat Perintah Kerja)
- **Tujuan**: Menjalankan eksekusi proses produksi di lantai pabrik.
- **Syarat Mulai Produksi**:
  - Work Order hanya dapat diubah statusnya menjadi `In Progress` apabila Sales Order berstatus `Confirmed` DAN seluruh bahan baku telah dialokasikan melalui **Material Request**.
- **Material Request & Reservasi**:
  - Sistem otomatis mengecek stok di gudang.
  - Jika stok cukup -> Bahan langsung dialokasikan (*Allocated*).
  - Jika stok kurang -> Sistem memberi peringatan kekurangan bahan (*Shortage*) untuk dipicu Purchase Order (PO).

---

### Step 11: Manage Purchase Orders (PO Pengadaan)
- **Tujuan**: Melakukan pengadaan bahan baku ke vendor atau memesan jasa maklon/outsource untuk tahapan routing tertentu.
- **Tipe Garis PO**:
  1. **Material Line**: Membeli bahan baku mentah -> Menambah stok inventori saat barang diterima (*Material Receipt*).
  2. **Subcontract / Service Line**: Membayar jasa pihak ketiga untuk tahapan tertentu (misal: jasa chrome/coating di luar pabrik).

---

### Step 12: Create Invoice (Faktur Penagihan)
- **Tujuan**: Menerbitkan faktur tagihan pembayaran kepada customer.
- **Jenis Faktur**:
  - **Down Payment (DP)**: Penagihan uang muka sesuai % pada Quote sebelum produksi dimulai.
  - **Progress Billing**: Penagihan bertahap berdasarkan milestone penyelesaian produksi.
  - **Final Settlement**: Penagihan sisa pelunasan sebelum atau sesaat setelah barang dikirim (*Shipment*).
- **Pencatatan Pembayaran**: Mendukung pembayaran parsial (*Partial Paid*) hingga lunas (*Paid*), terhubung langsung ke laporan keuangan di modul Analytics.
