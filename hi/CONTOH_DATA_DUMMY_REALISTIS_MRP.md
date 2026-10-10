# DATA DUMMY REALISTIS: SIMULASI OPERASIONAL END-TO-END LABAMU MRP
**Studi Kasus Perusahaan:** PT Presisi Logam Indonesia (Manufaktur Fabrikasi Baja & Furnitur Industri)  
**Tujuan:** Dataset komprehensif yang siap disalin (*plug-and-play*) untuk pengujian master data, transaksi penjualan, manufaktur, pengadaan, hingga laporan keuangan di `https://mrp.labamu.co.id/`.

---

## 1. Master Data Bahan Baku & Batch Stok (Materials & Stock Batches)

### A. Tabel Master Bahan Baku (`/materials/`)

| SKU | Nama Material | Kategori | Klasifikasi ABC | Tipe Material | UoM | Stock Risk | Harga Beli Rata-rata | Deskripsi |
| :--- | :--- | :--- | :---: | :--- | :---: | :---: | :--- | :--- |
| `MAT-SS304-2MM` | Plat Stainless Steel 304 (2.0 mm) | Logam & Plat | **A** | Raw Material | Lembar | 10 | Rp 1.450.000 | Plat SS 304 finish 2B ukuran 4x8 feet (1220x2440 mm) |
| `MAT-SS304-1MM` | Plat Stainless Steel 304 (1.2 mm) | Logam & Plat | **A** | Raw Material | Lembar | 15 | Rp 920.000 | Plat SS 304 finish hairline ukuran 4x8 feet |
| `MAT-PIPA-SS-2IN`| Pipa Stainless Steel Hollow 50x50x2mm | Logam & Plat | **A** | Raw Material | Batang | 20 | Rp 480.000 | Pipa kotak SS 304 panjang 6 meter |
| `MAT-WELD-308L` | Kawat Las TIG Stainless ER308L 2.4mm | Pengelasan | **B** | Raw Material | Tube (5kg) | 5 | Rp 375.000 | Kawat las TIG untuk pengelasan SS 304 |
| `MAT-GAS-ARGON` | Gas Argon Ultra High Purity (UHP) 6m3 | Gas Industri | **B** | Raw Material | Tabung | 8 | Rp 320.000 | Gas pelindung pengelasan TIG UHP 99.99% |
| `MAT-CASTOR-4IN` | Roda Heavy Duty Swivel Lockable 4 Inch | Komponen Mekikal| **B** | Finished Material | Pcs | 40 | Rp 85.000 | Roda Polyurethane kapasitas 150 kg per roda |
| `MAT-BAUT-M8X20` | Baut Hexagon SS 304 M8x20mm + Mur | Fastener & Baut | **C** | Finished Material | Box (100pcs) | 10 | Rp 65.000 | Baut dan mur anti karat SS 304 |
| `MAT-KARDUS-BOX`| Kardus Karton Double Wall 190x100x20cm| Kemasan | **C** | Raw Material | Pcs | 30 | Rp 45.000 | Kemasan corrugated box tebal 7mm |
| `MAT-BUBBLE-50M`| Plastik Bubble Wrap Heavy Duty 50m | Kemasan | **C** | Raw Material | Roll | 5 | Rp 110.000 | Lebar 125 cm panjang 50 meter |
| `MAT-COAT-POWDER`| Serbuk Powder Coating Epoxy Black Matt | Kimia & Cat | **B** | Raw Material | Zak (20kg) | 4 | Rp 850.000 | Powder coating warna hitam doff tahan gores |

---

### B. Tabel Batch Stok Aktif (`/materials/` $\to$ *Tab Stock Batches*)

| SKU Material | Batch ID | Kuantitas Awal | Sisa Stok (*Current*) | Biaya Satuan | Tgl Pembelian | Tgl Kedaluwarsa | Status Batch | Lokasi Rak Gudang | Nama Vendor |
| :--- | :--- | :---: | :---: | :--- | :---: | :---: | :---: | :--- | :--- |
| `MAT-SS304-2MM` | `BAT-20260901-001` | 50 Lembar | **35 Lembar** | Rp 1.450.000 | 01/09/2026 | - | `Received` | Gudang A - Rak Besi 01 | PT Mega Baja Nusantara |
| `MAT-PIPA-SS-2IN`| `BAT-20260901-002` | 100 Batang | **80 Batang** | Rp 480.000 | 01/09/2026 | - | `Received` | Gudang A - Rak Pipa P-02 | PT Mega Baja Nusantara |
| `MAT-WELD-308L` | `BAT-20260905-001` | 20 Tube | **14 Tube** | Rp 375.000 | 05/09/2026 | 05/09/2028 | `Received` | Gudang B - Lemari Las L-01 | CV Sumber Teknik Las |
| `MAT-GAS-ARGON` | `BAT-20260910-001` | 25 Tabung | **18 Tabung** | Rp 320.000 | 10/09/2026 | 10/09/2027 | `Received` | Gudang C - Depo Gas | PT Aneka Gas Industri |
| `MAT-CASTOR-4IN` | `BAT-20260912-001` | 120 Pcs | **88 Pcs** | Rp 85.000 | 12/09/2026 | - | `Received` | Gudang B - Bin Box B-15 | Toko Roda Cikarang |
| `MAT-BAUT-M8X20` | `BAT-20260915-001` | 30 Box | **22 Box** | Rp 65.000 | 15/09/2026 | - | `Received` | Gudang B - Bin Box B-02 | PT Cipta Fastener Mandiri |
| `MAT-KARDUS-BOX`| `BAT-20260918-001` | 100 Pcs | **70 Pcs** | Rp 45.000 | 18/09/2026 | - | `Received` | Gudang C - Pallet Pack 01 | CV Karton Prima Packing |

---

## 2. Master Vendor & Customer dengan Multi-PIC

### A. Master Vendor Rekanan (`/vendors/`)

1. **Vendor 1: PT Mega Baja Nusantara (Penyuplai Plat & Pipa Stainless)**
   - *Alamat:* Kawasan Industri Jababeka 1, Jl. Industri Raya No. 45, Cikarang, Jawa Barat
   - *PIC:* Budi Santoso (`budi.s@megabaja.co.id` / `+6281288991122`)
   - *Payment Terms:* NET 30 Hari
2. **Vendor 2: PT Cipta Fastener Mandiri (Penyuplai Baut & Aksesoris)**
   - *Alamat:* Jl. Raden Saleh No. 18, Karangtengah, Tangerang
   - *PIC:* Linda Herlina (`sales@ciptafastener.com` / `+6281377889900`)
   - *Payment Terms:* NET 14 Hari
3. **Vendor 3: CV Warna Prima Coating (Subkontraktor Powder Coating - Outsource)**
   - *Alamat:* Jl. Raya Serang Km 12, Cikupa, Banten
   - *PIC:* Hendra Wijaya (`hendra@warnaprima.co.id` / `+6281122334455`)
   - *Payment Terms:* NET 30 Hari

---

### B. Master Customer Pembeli (`/customers/`)

**Perusahaan:** PT Maju Makmur Mandiri (Pabrik Farmasi & Pengolahan Makanan)
- *Alamat Kantor & Pabrik:* Kawasan Industri Surya Cipta, Kav. B-12, Karawang Timur, Jawa Barat
- *Email Kantor:* `procurement@majumakmur.co.id` | *Telepon:* `021-89112233`
- **Konfigurasi Multi-PIC (3 Kontak Terdaftar):**
  1. **PIC 1 (Primary & Approver):**
     - *Nama:* Ir. Bambang Sutejo
     - *Jabatan:* General Manager Procurement & Facility
     - *Email:* `bambang.sutejo@majumakmur.co.id` | *HP:* `+628119876543`
     - *Role di Portal:* **`Approver`** (Berhak menyetujui Quotation secara sah pada Microsite)
  2. **PIC 2 (Viewer / Tim Teknis):**
     - *Nama:* Rian Hidayat, S.T.
     - *Jabatan:* Plant Engineer Supervisor
     - *Email:* `rian.hidayat@majumakmur.co.id` | *HP:* `+628123456789`
     - *Role di Portal:* **`Viewer`** (Hanya melihat gambar teknik dan spesifikasi)
  3. **PIC 3 (Viewer / Keuangan):**
     - *Nama:* Siska Maharani
     - *Jabatan:* Finance & AP Supervisor
     - *Email:* `ap.finance@majumakmur.co.id` | *HP:* `+628156789012`
     - *Role di Portal:* **`Viewer`** (Menerima salinan faktur dan jadwal jatuh tempo)

---

## 3. Master Routing (Tahapan Operasi Kerja) (`/routing/`)

| No. Tahap | Nama Tahapan Routing | Deskripsi / Instruksi Mesin | Kategori Pengerjaan Standar |
| :---: | :--- | :--- | :--- |
| **01** | `ROUT-CUTTING` (Pemotongan Plat & Pipa) | Pemotongan plat menggunakan Mesin Fiber Laser Cutting CNC dan gergaji pita pipa | In-House |
| **02** | `ROUT-BENDING` (Penekukan Plat CNC) | Pembentukan radius sudut meja dan lekukan menggunakan Mesin Press Brake CNC 100 Ton | In-House |
| **03** | `ROUT-WELDING` (Pengelasan TIG / Argon) | Pengelasan presisi tanpa percikan menggunakan Kawat Las ER308L dan Gas Argon UHP | In-House |
| **04** | `ROUT-FINISHING` (Grinding & Hairline) | Penghalusan bekas sambungan las dan pembuatan motif serat satin/hairline | In-House |
| **05** | `ROUT-POWDERCOAT` (Powder Coating Epoxy)| Pengecatan oven serbuk elektrostatis tahan kimia & suhu tinggi | **Outsource (Subkontrak)** |
| **06** | `ROUT-ASSEMBLY` (Perakitan & QC Final) | Pemasangan roda castor, baut pengunci, pengetesan beban 300kg, dan pembersihan | In-House |

---

## 4. Master Bill of Materials (BOM) & Katalog Produk

### A. Produk 1 (Standar): Meja Kerja Stainless Heavy Duty 180x90cm (`PROD-TBL-SS180`)

#### Formula BOM: `BOM-TBL-SS180-V1` (Output: 1 Unit Meja)
1. **Daftar Kebutuhan Material Komponen:**
   - 1.0 Lembar `MAT-SS304-2MM` @ Rp 1.450.000 = Rp 1.450.000
   - 0.5 Lembar `MAT-SS304-1MM` @ Rp 920.000 = Rp 460.000
   - 2.0 Batang `MAT-PIPA-SS-2IN` @ Rp 480.000 = Rp 960.000
   - 0.2 Tube `MAT-WELD-308L` @ Rp 375.000 = Rp 75.000
   - 0.2 Tabung `MAT-GAS-ARGON` @ Rp 320.000 = Rp 64.000
   - 4.0 Pcs `MAT-CASTOR-4IN` @ Rp 85.000 = Rp 340.000
   - 0.1 Box `MAT-BAUT-M8X20` @ Rp 65.000 = Rp 6.500
   - 1.0 Pcs `MAT-KARDUS-BOX` @ Rp 45.000 = Rp 45.000
   - 0.2 Roll `MAT-BUBBLE-50M` @ Rp 110.000 = Rp 22.000
   - **Subtotal Biaya Bahan Baku:** **Rp 3.422.500**

2. **Daftar Tahapan Routing & Estimasi Jam Kerja (Labor Rate: Rp 50.000/Jam):**
   - Tahap 1: `ROUT-CUTTING` (Pemotongan) — Durasi: 1.5 Jam = Rp 75.000
   - Tahap 2: `ROUT-BENDING` (Penekukan) — Durasi: 1.0 Jam = Rp 50.000
   - Tahap 3: `ROUT-WELDING` (Pengelasan) — Durasi: 3.5 Jam = Rp 175.000
   - Tahap 4: `ROUT-FINISHING` (Grinding & Hairline) — Durasi: 2.0 Jam = Rp 100.000
   - Tahap 6: `ROUT-ASSEMBLY` (Perakitan & QC) — Durasi: 1.0 Jam = Rp 50.000
   - **Subtotal Biaya Tenaga Kerja (9.0 Jam):** **Rp 450.000**

3. **Biaya Overhead Pabrik & Listrik:** Rp 200.000
4. **Total HPP / Base Cost (COGS) per Unit:**
   $$\text{HPP (Base Price)} = \text{Rp } 3.422.500 + \text{Rp } 450.000 + \text{Rp } 200.000 = \mathbf{Rp\ 4.072.500}$$

#### Atribut Katalog Produk (`/products/`):
- **SKU:** `PROD-TBL-SS180`
- **Product Name:** Meja Kerja Industri Stainless Steel Heavy Duty 180x90x85 cm
- **Category:** Industrial Furniture
- **Base Price:** Rp 4.072.500
- **Selling Price:** **Rp 6.500.000** (Margin Kotor: ~37.3%)
- **Lead Time:** 7 Hari Kerja
- **Status:** `Active`

---

## 5. Simulasi Transaksi End-to-End Lengkap (Kasus Nyata)

### Skenario Transaksi:
PT Maju Makmur Mandiri memesan **10 Unit** *Meja Kerja Industri Stainless Steel Heavy Duty* (`PROD-TBL-SS180`) dengan total nilai transaksi **Rp 65.000.000 (sebelum PPN)**.

---

### FASE 1: Request for Quotation (RFQ)
- **No. RFQ:** `RFQ-20260925-000001`
- **Customer:** PT Maju Makmur Mandiri
- **Target Tanggal Kirim:** 15 Oktober 2026
- **Daftar Barang:**
  - 10 Unit $\times$ `PROD-TBL-SS180`
- **Customer Notes:** *"Wajib roda heavy duty dengan rem ganda dan sertifikat food grade SS 304."*
- **Status:** `Approved` (Persetujuan internal selesai dalam 15 menit)

---

### FASE 2: Order Simulation (BETA)
Sebelum menerbitkan penawaran, Sales & PPIC menjalankan Order Simulation:
- **Input:** 10 Unit `PROD-TBL-SS180`, Target Selesai: 15/10/2026
- **Hasil Simulasi:**
  1. *Total Estimasi Jam Kerja:* 90 Jam Mesin/Operator (Kapasitas pabrik mencukupi).
  2. *Kebutuhan Material vs Ketersediaan:*
     - `MAT-SS304-2MM`: Butuh 10 Lembar | Stok Tersedia: 35 Lembar (**Aman**)
     - `MAT-PIPA-SS-2IN`: Butuh 20 Batang | Stok Tersedia: 80 Batang (**Aman**)
     - `MAT-CASTOR-4IN`: Butuh 40 Pcs | Stok Tersedia: 88 Pcs (**Aman**)
     - `MAT-KARDUS-BOX`: Butuh 10 Pcs | Stok Tersedia: 70 Pcs (**Aman**)
     - *Defisit Bahan Baku:* **0 Item (Stok 100% Siap)**
  3. *Proyeksi Finansial:*
     - Total Revenue: Rp 65.000.000
     - Total Estimasi HPP (COGS): Rp 40.725.000
     - Proyeksi Laba Kotor (*Gross Profit*): **Rp 24.275.000 (Margin 37.3%)**

---

### FASE 3: Penerbitan Penawaran Resmi (Quotation)
- **No. Quote:** `QUO-20260925-000001`
- **Mata Uang:** IDR (Indonesian Rupiah)
- **Rincian Finansial:**
  - Subtotal Produk (10 Unit $\times$ Rp 6.500.000): Rp 65.000.000
  - Diskon Volume (2%): -Rp 1.300.000
  - DPP (Dasar Pengenaan Pajak): Rp 63.700.000
  - PPN 11%: Rp 7.007.000
  - Biaya Pengiriman Truk ke Karawang: Rp 1.500.000
  - **Grand Total Tagihan:** **Rp 72.207.000**
- **Syarat & Ketentuan Perdagangan:**
  - `Down Payment Percentage`: **30%** (Senilai **Rp 21.662.100**)
  - `Payment Terms`: Pelunasan 70% dengan termin NET 30 hari setelah barang diterima.
  - `Incoterms`: CIF Karawang Industrial Estate
  - `Klausul Aktif`: *Force Majeure*, Denda Keterlambatan 0.1%/hari, Jaminan Garansi 12 Bulan.
- **Proses Approval:**
  - Sales submit $\to$ Manager Sales approve $\to$ Status berubah menjadi `Issued`.
  - Tautan digital *Microsite* terkirim ke `bambang.sutejo@majumakmur.co.id`.
  - Bpk. Bambang Sutejo membuka portal dan mengklik **Approve Quotation**.

---

### FASE 4: Otomasi Pasca-Approval & Pembayaran DP
Saat klik *Approve* di portal Microsite, sistem menghasilkan 3 entri instan:
1. **Sales Order Dibuat:** `SO-20260925-000001` (Status: `Confirmed`).
2. **Work Order Dibuat:** `WO-20260925-000001` (Status: `Not Started`).
3. **Down Payment Invoice Diterbitkan:**
   - **No. Invoice:** `INV-DP-20260925-000001`
   - **Nilai Tagihan DP 30%:** **Rp 21.662.100**
   - **Jatuh Tempo:** 28 September 2026
   - **Status Pembayaran:** Pelanggan mentransfer ke rekening BCA perusahaan $\to$ Keuangan mencatat di sistem $\to$ Status invoice: `Paid`.

---

### FASE 5: Alokasi Bahan Baku Produksi (Material Allocation)
1. PPIC membuka `WO-20260925-000001`.
2. Klik tombol **Auto Allocate**.
3. Sistem memotong kuantitas stok batch aktif:
   - `MAT-SS304-2MM` terpotong 10 lembar (Sisa stok: 25 lembar)
   - `MAT-PIPA-SS-2IN` terpotong 20 batang (Sisa stok: 60 batang)
   - `MAT-CASTOR-4IN` terpotong 40 pcs (Sisa stok: 48 pcs)
4. Status Work Order otomatis berubah menjadi **`Ready to Process`**.

---

### FASE 6: Eksekusi Lantai Pabrik & Kontrol Subkontrak
1. Kepala Produksi klik **Start Process** (Status WO: `In Progress`).
2. **Progres Tahapan Kerja:**
   - *Tahap 1 Cutting (In-House):* 10 unit dipotong plat & rangka $\to$ Mandor update 10 unit *Completed*.
   - *Tahap 2 Bending (In-House):* 10 unit ditekuk CNC $\to$ Mandor update 10 unit *Completed*.
   - *Tahap 3 Welding (In-House):* 10 unit dirakit & dilas TIG $\to$ Mandor update 10 unit *Completed*.
   - *Tahap 4 Finishing (In-House):* 10 unit digrinding hairline $\to$ Mandor update 10 unit *Completed*.
   - *Tahap 6 Assembly & QC Final (In-House):* Pemasangan 40 roda castor, baut, dan uji beban 300kg $\to$ 10 unit lolos uji QC 100%.
3. Kepala Produksi mengklik **Complete Work Order**:
   - Status Work Order menjadi **`Completed`**.
   - Stok gudang barang jadi bertambah **+10 Pcs `PROD-TBL-SS180`**.
   - Status Sales Order `SO-20260925-000001` otomatis berubah menjadi **`Ready to Ship`**.

---

### FASE 7: Pengemasan & Pengiriman Logistik
1. Bagian Gudang melakukan wrapping busa dan membungkus 10 unit meja ke dalam karton pallet kardus (`MAT-KARDUS-BOX`).
2. Bagian Logistik membuka `SO-20260925-000001` $\to$ Buka bagian **Shipment**:
   - *No. Pengiriman:* `SHP-20260925-000001`
   - *No. Surat Jalan:* `SJ-20261010-0012`
   - *Armada Pengangkut:* Truk Colt Diesel Double Perusahaan (No. Polisi: `B 9845 TIS`)
   - *Nama Driver:* Joko Prasetyo (`+628176543210`)
   - *Tanggal Berangkat:* 10 Oktober 2026, Pukul 09:00 WIB
   - *Lampiran:* Foto Surat Jalan pengeluaran gudang.
   - Status pesanan berubah menjadi **`On Shipping`**.
3. Pukul 13:30 WIB, truk tiba di Karawang. PIC Rian Hidayat memeriksa 10 unit meja dan menandatangani Surat Jalan bertanda tangan basah & stempel pabrik.
4. Logistik mencatat tanggal terima (10/10/2026) $\to$ Status kirim: **`Delivered`**.

---

### FASE 8: Penagihan Pelunasan & Tutup Buku (Closing)
1. Divisi Keuangan menerbitkan faktur pelunasan:
   - **No. Invoice:** `INV-FP-20261010-000002` (Tipe: *Repayment*)
   - **Total Tagihan:** Rp 72.207.000
   - **Potongan DP yang Sudah Dibayar:** -Rp 21.662.100
   - **Sisa yang Wajib Dibayar:** **Rp 50.544.900**
   - **Termin Pembayaran:** NET 30 Hari (Jatuh tempo: 09 November 2026)
2. Tanggal 25 Oktober 2026 (lebih cepat dari jatuh tempo), PT Maju Makmur Mandiri melunasi sisa tagihan Rp 50.544.900 via transfer bank.
3. Keuangan membuka faktur, klik **Add Payment**, dan mencatat pelunasan (*Settlement Progress: 100%*).
4. **Penutupan Otomatis:**
   - Karena barang sudah `Delivered` dan total tagihan telah `Paid 100%`, sistem secara otomatis mengubah status `SO-20260925-000001` menjadi **`Completed`**.
   - Transaksi resmi masuk ke dalam laporan keuangan laba/rugi dan analitik kinerja penjualan.

---

## 6. Format Data CSV Siap Impor (Bulk Upload)

### A. Format CSV Master Materials (`materials_import_template.csv`)
```csv
Material Name,SKU,Category,ABC Classification,Material Type,Unit of Measure,Stock Risk,Description,Average Cost
Plat Stainless Steel 304 (2.0 mm),MAT-SS304-2MM,Logam & Plat,A,Raw Material,Lembar,10,Plat SS 304 finish 2B 4x8 feet,1450000
Plat Stainless Steel 304 (1.2 mm),MAT-SS304-1MM,Logam & Plat,A,Raw Material,Lembar,15,Plat SS 304 finish hairline 4x8 feet,920000
Pipa Stainless Hollow 50x50x2mm,MAT-PIPA-SS-2IN,Logam & Plat,A,Raw Material,Batang,20,Pipa kotak SS 304 panjang 6m,480000
Kawat Las TIG Stainless ER308L 2.4mm,MAT-WELD-308L,Pengelasan,B,Raw Material,Tube,5,Kawat las TIG untuk SS 304 5kg,375000
Gas Argon Ultra High Purity 6m3,MAT-GAS-ARGON,Gas Industri,B,Raw Material,Tabung,8,Gas argon UHP 99.99 persen 6m3,320000
Roda Heavy Duty Swivel Lockable 4 Inch,MAT-CASTOR-4IN,Komponen Mekanikal,B,Finished Material,Pcs,40,Roda PU kapasitas 150kg dengan rem,85000
Baut Hexagon SS 304 M8x20mm + Mur,MAT-BAUT-M8X20,Fastener & Baut,C,Finished Material,Box,10,Baut mur anti karat isi 100pcs,65000
Kardus Karton Double Wall 190x100x20cm,MAT-KARDUS-BOX,Kemasan,C,Raw Material,Pcs,30,Kardus packing heavy duty 7mm,45000
Plastik Bubble Wrap Heavy Duty 50m,MAT-BUBBLE-50M,Kemasan,C,Raw Material,Roll,5,Bubble wrap 125cm x 50m,110000
Serbuk Powder Coating Epoxy Black Matt,MAT-COAT-POWDER,Kimia & Cat,B,Raw Material,Zak,4,Powder coating hitam doff tahan panas 20kg,850000
```

### B. Format CSV Master Products (`products_import_template.csv`)
```csv
Product Name,SKU,Category,Status,Base Price,Selling Price,Lead Time,Description
Meja Kerja Industri Stainless Steel 180x90cm,PROD-TBL-SS180,Industrial Furniture,Active,4072500,6500000,7 Days,Meja kerja pabrik stainless steel 304 heavy duty kapasitas 300kg
Trolley Stainless 3 Susun Heavy Duty,PROD-TRL-SS3S,Industrial Furniture,Active,1850000,2950000,5 Days,Trolley dorong 3 tingkat untuk dapur dan rumah sakit
Tangki Storage Stainless 1000 Liter,PROD-TNK-SS1000,Storage Tank,Active,8500000,14000000,14 Days,Tangki penampungan cairan kimia dan air food grade SS 304
Wastafel Industri Stainless 2 Bowl Sensor,PROD-WSF-SS2B,Sanitary,Active,3200000,5200000,7 Days,Wastafel cuci tangan otomatis higienis untuk pabrik farmasi
Rak Gudang Stainless Heavy Duty 4 Susun,PROD-RAK-SS4S,Storage System,Active,4200000,6800000,10 Days,Rak susun gudang beban 500kg per tingkat
```
