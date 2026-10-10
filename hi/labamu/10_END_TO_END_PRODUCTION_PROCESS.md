# 10. Dokumentasi Detail Proses Produksi Dari Awal Sampai Akhir (Labamu MRP)

Dokumentasi alur proses produksi menyeluruh (*End-to-End Production Process*) pada sistem **Labamu Manufacturing (MRP)** (`mrp.labamu.co.id`), dari inisiasi master data, perencanaan, alokasi material, eksekusi lantai pabrik, subkontrak maklon, hingga pencatatan produk jadi ke inventaris.

---

## 🗺️ Diagram Alur Produksi Lengkap

```
[FASE 1: PERSIAPAN MASTER DATA]
1. Resources -> Materials (Input Bahan Baku, UOM, Kategori, Klasifikasi ABC)
2. Resources -> Vendors (Input Pemasok Bahan & Vendor Maklon/Finishing)
3. Resources -> Customers (Input Data Pembeli & PIC)
4. Manufacturing -> Routing (Definisi Urutan Operasi / Work Centers)
5. Manufacturing -> Bill of Materials / BOM (Formula Resep: Bahan + Jam Kerja Routing + Biaya Overhead)
6. Product -> Product Catalog (Daftarkan Produk Jadi yang Menunjuk ke BOM Terkait)

[FASE 2: PEMICU PRODUKSI / SALES FLOW]
7. Sales -> Request for Quotes / RFQ (Permintaan Harga Pelanggan)
   └── Jika Produk Kustom -> Product -> Custom Products Request (CPR) -> Tim R&D Isi Spek & Approve
8. Sales -> Quotes (Terbitkan Penawaran Resmi + Down Payment % + Klausul Legal)
9. Sales -> Orders (Pelanggan Setuju -> Order Berstatus 'Confirmed')
   └── OTOMASI SISTEM: Status 'Confirmed' Otomatis Membuat Work Order di /work-orders/

[FASE 3: PERENCANAAN MATERIAL & PENGADAAN]
10. Fitur Cek Mandiri: Order Simulation (BETA) -> Uji Kapasitas & Shortage
11. Buka Manufacturing -> Work Order -> Buka Detail SPK
    ├── Klik 'Auto Allocate' untuk mereservasi bahan baku di gudang
    ├── Kondisi A (Stok Cukup): Work Order berubah status menjadi 'Ready to Process'
    └── Kondisi B (Stok Kurang):
        ├── Klik 'Request Material' -> Muncul di Resources -> Material Requests
        ├── Buka Procurement -> Purchase Orders -> Klik 'New PO' (Pesan bahan ke Vendor)
        └── Barang Tiba -> Gudang Catat di Tab 'Receipt' PO -> Stok Bertambah -> Lakukan 'Auto Allocate'

[FASE 4: EKSEKUSI LANTAI PRODUKSI]
12. Pada Detail Work Order -> Klik 'Start Process' -> Status berubah 'In Progress'
13. Jalankan Setiap Tahapan Sesuai Routing:
    ├── Jalur A (Pengerjaan Internal / In-House):
    │   └── Operator mesin bekerja -> Klik 'Manage' pada tahap terkait -> Pindahkan Qty ke 'Completed'
    ├── Jalur B (Subkontrak Maklon / Finishing Luar - Benda dari Kita):
    │   ├── 1. Assign Vendor & Buat PO Jasa Subkontrak
    │   ├── 2. Klik 'Release to Vendor' & Terbitkan Surat Jalan Kirim Benda Kerja
    │   ├── 3. Vendor Kerjakan (Powder Coating / Chrome / Painting)
    │   ├── 4. Benda Kembali -> Gudang Terima di Tab 'Receipt' PO -> Inspeksi QC
    │   └── 5. 'Confirm Receipt' -> Progres Tahapan WO otomatis terisi 100%
    └── Jalur C (Beli Komponen Jadi / Turnkey):
        └── Pengadaan via Purchase Order Material langsung dari vendor luar

[FASE 5: QUALITY CONTROL, PENYELESAIAN & DAMPAK SISTEM]
14. Semua tahapan routing mencapai 100% -> Pemeriksaan Mutu (QC Akhir)
15. Klik 'Complete Work Order'
    ├── A. Stok fisik bahan baku di gudang terpotong otomatis dari batch terkait
    ├── B. Kuantitas stok produk jadi otomatis bertambah di Product -> Product Catalog
    └── C. Status pesanan di Sales -> Orders berubah menjadi 'Ready to Ship'
16. Sales -> Invoices (Terbitkan Faktur Pelunasan / Remaining Payment) & Catat Pembayaran
```

---

## 📋 Detail Tiap Tahapan Produksi

### 1. Inisiasi Master Data Manufaktur

#### 1.1 Input Materials (`/materials/create`)
- **Aksi**: Buka `Resources` &rarr; `Materials` &rarr; Klik <span style="color:#1476FF;font-weight:bold;">New Material</span>.
- **Form Input**:
  - `* Material Name`: Nama bahan (contoh: *Besi Holo 4x4 2mm*, *Plat Baja 1.5mm*, *Cat Epoxy*).
  - `SKU`: Kode unik (auto-generate jika kosong).
  - `* Category`: Pilih dari kategori inventori (contoh: *Raw Material*, *Semi Finishing*, *Packaging*).
  - `* ABC Classification`: Pilih `A - High Value` (stok utama bernilai tinggi), `B - Medium Value`, atau `C - Low Value`.
  - `* Material Type`: `Raw Material`, `Packaging`, atau `Consumable`.
  - `* Unit of Measure`: Satuan hitung (`PCS`, `KG`, `METER`, `LITER`, `ROLL`, `BOX`).
  - `Stock Risk`: Keterangan risiko (misal: *Mudah korosi jika lembab*).
  - `Description`: Detail dimensi dan spesifikasi bahan baku.
- **Tombol**: Klik <span style="color:#1476FF;font-weight:bold;">Save</span>.

#### 1.2 Input Vendors (`/vendors/create`)
- **Aksi**: Buka `Resources` &rarr; `Vendors` &rarr; Klik <span style="color:#1476FF;font-weight:bold;">+ Add Vendor</span>.
- **Form Input**:
  - `* Vendor Name`: Nama badan usaha pemasok (contoh: *PT Baja Mandiri Sentosa*).
  - `Alias`, `PIC Name`, `PIC Email`, `PIC Phone`, `Business Address`.
  - `Status`: Toggle `ACTIVE`.
- **Tombol**: Klik <span style="color:#1476FF;font-weight:bold;">Save</span>.

#### 1.3 Input Routing (`/routing/create/`)
- **Aksi**: Buka `Manufacturing` &rarr; `Routing` &rarr; Klik <span style="color:#1476FF;font-weight:bold;">Add Routing</span>.
- **Form Input**:
  - `* Routing Name`: Nama alur pengerjaan (contoh: *Alur Pembuatan Meja Kerja Logam*).
  - `Description`: Rincian alur proses.
  - Klik <span style="color:#1476FF;font-weight:bold;">+ Add Operation</span> untuk menyusun tahapan urut:
    - *Operation 1*: `Pemotongan & Bending Besi` (Mesin Cutting).
    - *Operation 2*: `Pengelasan & Assembling Rangka` (Stasiun Las).
    - *Operation 3*: `Finishing Powder Coating` (Bisa In-house atau Subkontrak Maklon).
    - *Operation 4*: `Pemasangan Top Table & Packing` (Stasiun QC & Kemas).
- **Tombol**: Klik <span style="color:#1476FF;font-weight:bold;">Save Routing</span>.

#### 1.4 Penyusunan Bill of Materials / BOM (`/bill-of-materials/create`)
- **Aksi**: Buka `Manufacturing` &rarr; `Bill of Materials` &rarr; Klik <span style="color:#1476FF;font-weight:bold;">+ Create BOM</span>.
- **Syarat Wajib Sistem**: Wajib menyertakan **minimal 1 baris Material** dan **minimal 1 Routing** sebelum bisa disimpan.
- **Form Input**:
  - `* BOM Name`: Nama resep (contoh: *BOM Meja Kerja Logam Seri M-01*).
  - **Daftar Material**: Klik <span style="color:#1476FF;font-weight:bold;">+ Add Material</span> &rarr; Pilih bahan baku &rarr; Isi `Quantity` per unit & `Waste %`. *Material Cost terhitung otomatis*.
  - **Daftar Routing**: Klik <span style="color:#1476FF;font-weight:bold;">+ Add Routing</span> &rarr; Pilih routing yang sudah dibuat.
  - **Rincian Ongkos Pabrik**:
    - `* Labour Cost`: Estimasi upah tenaga kerja per unit produk.
    - `* Packing Cost`: Biaya bahan dan pengerjaan kemasan.
    - `* Other Cost`: Biaya overhead/listrik mesin per unit.
  - `Total Cost`: *Otomatis terjumlah (Material Cost + Labour + Packing + Other)*.
- **Tombol**: Klik <span style="color:#1476FF;font-weight:bold;">Save</span>.

#### 1.5 Pendaftaran Produk Jadi (`/products/create`)
- **Aksi**: Buka `Product` &rarr; `Product Catalog` &rarr; Klik <span style="color:#1476FF;font-weight:bold;">+ Create Product</span>.
- **Form Input**:
  - `* Product Name`: Nama barang jadi (contoh: *Meja Kerja Logam Seri M-01*).
  - `SKU`: Kode barang (auto-generate jika kosong).
  - `* Category`: Pilih dari kategori produk.
  - `* Status`: `Active`.
  - `Bill of Materials`: **Pilih BOM yang telah dibuat pada langkah 1.4.**
  - `Base Price`: *Otomatis terisi dari Total Cost BOM (COGS dasar)*.
  - `* Lead Time`: Estimasi waktu produksi (contoh: `2 Week(s)`).
  - `* Selling Price`: Klik <span style="color:#1476FF;font-weight:bold;">Add Price</span> &rarr; Pilih Currency (`IDR`) &rarr; Masukkan harga jual ke pembeli.
- **Tombol**: Klik <span style="color:#1476FF;font-weight:bold;">Save</span>.

---

### 2. Pemicu Produksi Melalui Siklus Penjualan

#### 2.1 Permintaan RFQ & Penanganan Produk Kustom
1. Buka `Sales` &rarr; `Request for Quotes` &rarr; Klik <span style="color:#1476FF;font-weight:bold;">+ Create RFQ</span> (`/rfq/create`).
2. Masukkan data `* Customer Name`, kontak PIC, dan item produk yang diminta:
   - Jika **Standard Product**: Pilih langsung dari katalog.
   - Jika **Custom Product**: Pilih tipe *Custom* &rarr; Sistem otomatis membuatkan dokumen **CPR** di `Product` &rarr; `Custom Products Request` (`/custom-products-request`). Tim R&D mengisi spesifikasi & menyetujui (<span style="color:#1476FF;font-weight:bold;">Approve</span>) CPR tersebut.
3. Klik <span style="color:#1476FF;font-weight:bold;">Submit RFQ</span>.

#### 2.2 Pembuatan & Persetujuan Quotes (`/quotes/create`)
1. Buka `Sales` &rarr; `Quotes` &rarr; Klik <span style="color:#1476FF;font-weight:bold;">+ Create Quote</span>.
2. Pilih nomor RFQ terkait, tentukan `* Valid Until`, `Down Payment Percentage` (misal `50%`), `* Bank Account`, `* Payment Terms`, dan PPN (`11%`).
3. Klik <span style="color:#1476FF;font-weight:bold;">Submit</span> &rarr; Kirim penawaran ke pelanggan.

#### 2.3 Konfirmasi Order & Auto-Generate Work Order
1. Saat pelanggan menyetujui penawaran, buka `Sales` &rarr; `Orders` (`/orders`).
2. Pesanan berada pada status <span style="background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px;font-weight:bold;">Waiting for Approval</span>.
3. Lakukan approval hingga status berubah menjadi <span style="background:#dcfce7;color:#15803d;padding:2px 6px;border-radius:4px;font-weight:bold;">Confirmed</span>.
4. **OTOMASI SISTEM**: Begitu Order berstatus `Confirmed`, sistem **secara otomatis membuat Work Order (SPK)** baru di menu `Manufacturing` &rarr; `Work Order` dengan nomor terstruktur (contoh: `WO-20260926-000010`) dan menarik formula BOM dari produk terkait.

---

### 3. Alokasi Bahan Baku & Pengadaan Kekurangan Stok

#### 3.1 Pengecekan Kebutuhan & Alokasi Material di SPK
1. Buka `Manufacturing` &rarr; `Work Order` (`/work-orders`).
2. Buka baris SPK yang baru dibuat (status awal: <span style="background:#f1f5f9;color:#475569;padding:2px 6px;border-radius:4px;font-weight:bold;">Not Started</span>).
3. Klik tombol <span style="color:#1476FF;font-weight:bold;">Auto Allocate</span> / periksa kebutuhan komponen bahan:
   - **Kondisi 1: Stok Bahan di Gudang CUKUP**:
     - Sistem langsung mengalokasikan stok bahan untuk nomor SPK tersebut.
     - Status Work Order berubah otomatis menjadi <span style="background:#dbeafe;color:#1e40af;padding:2px 6px;border-radius:4px;font-weight:bold;">Ready to Process</span>.
   - **Kondisi 2: Stok Bahan di Gudang KURANG (Shortage)**:
     - Sistem memberi tanda kekurangan kuantitas bahan.
     - Klik <span style="color:#1476FF;font-weight:bold;">Request Material</span> &rarr; Data permintaan material masuk ke menu `Resources` &rarr; `Material Requests` (`/material-requests/`).
     - Lanjutkan ke langkah pengadaan bahan (Langkah 3.2).

#### 3.2 Pengadaan Bahan via Purchase Order (`/purchase-orders/create`)
1. Buka `Procurement` &rarr; `Purchase Orders` &rarr; Klik <span style="color:#1476FF;font-weight:bold;">New PO</span>.
2. Pilih `* Vendor Name`, tentukan `* Purchase Order Date` dan `Expected Delivery Date`.
3. Pada tabel baris PO, klik <span style="color:#1476FF;font-weight:bold;">+ Add PO Line</span> &rarr; Pilih nama material yang kurang &rarr; Masukkan kuantitas dan harga satuan (`Unit Cost`).
4. Klik <span style="color:#1476FF;font-weight:bold;">Submit PO</span>.
5. **Penerimaan Barang**: Saat vendor mengirimkan barang ke pabrik, buka PO tersebut &rarr; Tab `Receipt` &rarr; Masukkan kuantitas barang masuk &rarr; Klik `Receive`. Stok fisik di `Resources` &rarr; `Materials` bertambah seketika.
6. Kembali ke detail Work Order &rarr; Klik ulang <span style="color:#1476FF;font-weight:bold;">Auto Allocate</span> &rarr; Status Work Order kini menjadi <span style="background:#dbeafe;color:#1e40af;padding:2px 6px;border-radius:4px;font-weight:bold;">Ready to Process</span>.

---

### 4. Pelaksanaan Produksi di Lantai Pabrik (Work Order Execution)

1. Buka detail Work Order yang sudah berstatus `Ready to Process`.
2. Klik tombol <span style="color:#1476FF;font-weight:bold;">Start Process</span> &rarr; Status SPK berubah menjadi <span style="background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px;font-weight:bold;">In Progress</span>.
3. Eksekusi tahapan kerja sesuai urutan routing yang ada di dalam SPK:

#### Mode A: Pengerjaan Internal (In-House Production)
- Operator mesin mengerjakan tahapan di stasiun kerja pabrik.
- Setelah selesai, PIC/Supervisor mengklik tombol <span style="color:#1476FF;font-weight:bold;">Manage</span> pada operasi terkait &rarr; Memasukkan kuantitas unit yang selesai &rarr; Status operasi berubah menjadi `Completed` (100%).

#### Mode B: Subkontrak Maklon Finishing Luar (Material dari Kita)
*Contoh: Jasa Powder Coating, Hard Chrome, Galvanis, Painting Oven di bengkel rekanan.*
1. Pada tahapan operasi terkait, klik tombol <span style="color:#1476FF;font-weight:bold;">Assign Vendor</span> &rarr; Pilih vendor maklon & Tautkan ke Purchase Order tipe Jasa.
2. Klik ikon <span style="color:#1476FF;font-weight:bold;">Release to Vendor</span> &rarr; Sistem menerbitkan dokumen Surat Jalan pengiriman benda kerja mentah ke vendor.
3. Status tahapan di sistem tercatat: `Waiting Receipt`.
4. **Penerimaan & Inspeksi QC Hasil Finishing**:
   - Setelah vendor selesai mengerjakan dan mengirim kembali benda kerja ke pabrik, buka tab `Receipt` pada PO terkait.
   - Petugas QC memeriksa hasil pengerjaan:
     - **Lolos QC 100%**: Masukkan jumlah unit yang diterima &rarr; Klik <span style="color:#1476FF;font-weight:bold;">Confirm Receipt</span> &rarr; Progres tahapan di Work Order otomatis terupdate menjadi 100% Selesai.
     - **Cacat / Retur Rework**: Jika sebagian unit cacat (misal 2 dari 10 unit catnya belang), input penerimaan parsial (8 unit diterima, 2 ditolak) &rarr; Sistem membuatkan surat jalan retur pengerjaan ulang (*Rework*) ke vendor tanpa menambah tagihan baru.
     - **Benda Rusak / Scrap di Vendor**: Jika vendor merusak benda kerja, catat sebagai scrap &rarr; Buat `Material Request` bahan pengganti dari gudang &rarr; Operator pabrik membuat ulang komponen pengganti.
     - **Vendor Macet / Overcapacity**: Sisa unit yang belum dikerjakan dapat ditarik kembali & dialihkan (*Re-assign*) ke Vendor Finishing alternatif B di dalam SPK yang sama.

---

### 5. Quality Control Akhir, Penyelesaian SPK & Dampak Sistem

1. Setelah seluruh tahapan operasi pada Work Order mencapai progres 100%, tim QC melakukan audit mutu akhir barang jadi.
2. Pada halaman detail Work Order, klik tombol <span style="color:#1476FF;font-weight:bold;">Complete Work Order</span>.
3. **DAMPAK OTOMATIS PADA DATABASE SISTEM**:
   - **Pemotongan Bahan Baku**: Kuantitas fisik stok bahan baku di gudang otomatis terpotong (*deducted*) dari nomor batch yang dialokasikan.
   - **Penambahan Stok Barang Jadi**: Kuantitas produk jadi otomatis bertambah dan masuk ke katalog `Product` &rarr; `Product Catalog` (`/products/`).
   - **Update Status Pesanan**: Status pesanan pada `Sales` &rarr; `Orders` (`/orders/`) otomatis terupdate menjadi <span style="background:#dcfce7;color:#15803d;padding:2px 6px;border-radius:4px;font-weight:bold;">Ready to Ship</span>.
   - **Biaya Aktual (Actual Costing)**: Sistem menghitung total biaya aktual produksi (Material riil terpakai + jam kerja aktual + ongkos subkontrak) untuk dibandingkan dengan standar biaya BOM di modul `Analytics` &rarr; `Financial Report` (`/reports/financial/`).

---

### 6. Pengiriman & Penagihan Akhir (Invoicing & Settlement)

1. **Penerbitan Invoice Pelunasan**:
   - Buka `Sales` &rarr; `Invoices` &rarr; Klik <span style="color:#1476FF;font-weight:bold;">+ Create Invoice</span> (`/invoices/create`).
   - Pilih `* Invoice Type` = `Remaining Payment` (atau `Full Payment`).
   - Pilih nomor `* Order No` &rarr; Nominal sisa tagihan otomatis terhitung dikurangi Down Payment (DP) yang telah dibayar sebelumnya.
   - Tentukan `* Issue Date` dan `Due Date`.
   - Klik <span style="color:#1476FF;font-weight:bold;">Save</span>.
2. **Pencatatan Pembayaran**:
   - Setelah pelanggan mentransfer pembayaran ke rekening bank tenant, ubah status pembayaran invoice menjadi <span style="background:#dcfce7;color:#15803d;padding:2px 6px;border-radius:4px;font-weight:bold;">Paid</span>.
3. Transaksi selesai sempurna dan tercatat di seluruh laporan analitik keuangan dan penjualan.
