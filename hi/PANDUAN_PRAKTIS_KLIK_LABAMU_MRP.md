# PANDUAN PRAKTIS KLIK-DEMI-KLIK: CARA MENGGUNAKAN LABAMU MRP DARI NOL
## Panduan Lengkap untuk Pemula (Orang Awam): Lengkap dengan Urutan Menu, Tombol, Ready Stock Gudang, Subkontrak & Pencegahan Hutang

Panduan ini dibuat seringkas dan sejelas mungkin agar siapa saja langsung paham **menu apa di sidebar kiri yang harus diklik, tombol apa yang harus ditekan, dan bagaimana alur kerjanya**.

---

## 🧭 DAFTAR ISI TAHAPAN (URUTAN KERJA)

1. [TAHAP 0: Login ke Sistem](#tahap-0-cara-login-ke-sistem)
2. [TAHAP 1: Atur Profil Perusahaan & Bank](#tahap-1-atur-profil-perusahaan--bank)
3. [TAHAP 2: Masukkan Data Bahan Baku & Stok Awal Gudang](#tahap-2-masukkan-data-bahan-baku--stok-awal-gudang)
4. [TAHAP 3: Masukkan Data Vendor (Penyuplai & Subkontraktor)](#tahap-3-masukkan-data-vendor-penyuplai--subkontraktor)
5. [TAHAP 4: Masukkan Data Pelanggan (Customer)](#tahap-4-masukkan-data-pelanggan-customer)
6. [TAHAP 5: Buat Tahapan Kerja Pabrik (Routing)](#tahap-5-buat-tahapan-kerja-pabrik-routing)
7. [TAHAP 6: Buat Katalog Produk & Resep Bahan (BOM)](#tahap-6-buat-katalog-produk--resep-bahan-bom)
8. [TAHAP 7: Produksi Buffer Stok Barang Jadi untuk Disimpan di Gudang (Make to Stock)](#tahap-7-produksi-buffer-stok-barang-jadi-untuk-disimpan-di-gudang-make-to-stock)
9. [TAHAP 8: Saat Ada PO Masuk: Cek Ready Stock & Atur Agar Tidak Jadi Hutang](#tahap-8-saat-ada-po-masuk-cek-ready-stock--atur-agar-tidak-jadi-hutang)
10. [TAHAP 9: Eksekusi Pengiriman Barang Ready Stock (Langsung Kirim vs Jadwal Tunda)](#tahap-9-eksekusi-pengiriman-barang-ready-stock-langsung-kirim-vs-jadwal-tunda)
11. [TAHAP 10: Jika Stok Kurang / Pesanan Kustom (Jalankan Work Order Pabrik)](#tahap-10-jika-stok-kurang--pesanan-kustom-jalankan-work-order-pabrik)
    - [10.1. Alokasi Bahan Baku Otomatis](#101-alokasi-bahan-baku-otomatis)
    - [10.2. Jalur 1: Pengerjaan Sendiri di Pabrik (In-House)](#102-jalur-1-pengerjaan-sendiri-di-pabrik-in-house)
    - [10.3. Jalur 2: Pengerjaan Subkontrak Maklon (Bahan dari Kita Dikirim ke Vendor)](#103-jalur-2-pengerjaan-subkontrak-maklon-bahan-dari-kita-dikirim-ke-vendor)
    - [10.4. Jalur 3: Pengerjaan Subkontrak Turnkey (Beli Jasa + Bahan Sekaligus dari Vendor)](#104-jalur-3-pengerjaan-subkontrak-turnkey-beli-jasa--bahan-sekaligus-dari-vendor)
    - [10.5. Jalur 4: 1 Barang Dikerjakan Banyak Vendor Sekaligus (Berantai & Bagi Kuota)](#105-jalur-4-1-barang-dikerjakan-banyak-vendor-sekaligus-berantai--bagi-kuota)
12. [TAHAP 11: Selesaikan Produksi (Complete Work Order)](#tahap-11-selesaikan-produksi-complete-work-order)
13. [TAHAP 12: Kirim Barang Hasil Produksi ke Pelanggan (Surat Jalan / Delivery)](#tahap-12-kirim-barang-hasil-produksi-ke-pelanggan-surat-jalan--delivery)
14. [TAHAP 13: Tagih Sisa Pelunasan & Tutup Order (Closed)](#tahap-13-tagih-sisa-pelunasan--tutup-order-closed)

---

## TAHAP 0: CARA LOGIN KE SISTEM

1. Buka browser (Chrome / Edge / Firefox) $\to$ Ketik alamat: `https://mrp.labamu.co.id/`
2. Klik tombol biru **"Continue with Labamu"**.
3. Di layar login WhatsApp:
   - Masukkan nomor HP (misal: `85156197989` tanpa angka 0 di depan).
   - Centang kotak **"I agree to Labamu's Terms & Conditions"**.
   - Klik tombol biru **"Login"**.
4. Cek pesan WhatsApp yang masuk di HP Anda:
   - Masukkan **6 digit kode OTP** (misal: `123456`).
5. Selesai! Anda langsung masuk ke halaman utama (**Dashboard**).

---

## TAHAP 1: ATUR PROFIL PERUSAHAAN & BANK

*Lakukan ini 1 kali saja di awal saat web masih kosong.*

1. Lihat menu di sebelah kiri (Sidebar) $\to$ Klik menu **"Administration"** $\to$ Klik **"Company Settings"**.
2. **Isi formulir:**
   - Klik tombol **"Upload Logo"** $\to$ Pilih file gambar logo perusahaan Anda.
   - Kolom **Company Name**: Ketik nama pabrik/perusahaan Anda (misal: `PT Presisi Logam Indonesia`).
   - Kolom **Company Code**: Ketik singkatan 3-4 huruf (misal: `PLI`).
   - Kolom **NPWP**: Ketik nomor NPWP perusahaan.
   - Kolom **Default Tax Rate**: Isi `11` (untuk PPN 11%).
   - Kolom **Bank Details**: Masukkan Nama Bank (misal: *BCA*), Nomor Rekening, dan Nama Pemilik Rekening.
3. Klik tombol biru **"Save Settings"** di pojok kanan bawah.

---

## TAHAP 2: MASUKKAN DATA BAHAN BAKU & STOK AWAL GUDANG

### 2.1. Daftarkan Nama Bahan Baku
1. Di menu sidebar kiri $\to$ Klik **"Resources"** $\to$ Klik **"Materials"**.
2. Klik tombol biru **"+ Add Material"** di pojok kanan atas.
3. **Isi form:**
   - **SKU Material**: Ketik kode barang (contoh: `MAT-SS304-2MM`).
   - **Material Name**: Ketik nama barang (contoh: `Plat Stainless Steel 2mm`).
   - **Category**: Pilih kategori (contoh: `Logam & Plat`).
   - **ABC Classification**: 
     - Pilih **A** jika barang mahal/utama (Plat, Pipa, Motor).
     - Pilih **B** jika barang sedang (Kawat las, Cat, Gas).
     - Pilih **C** jika barang murah/baut (Baut, Mur, Kardus).
   - **Material Type**: Pilih `Raw Material`.
   - **Unit of Measurement (UoM)**: Pilih satuan (contoh: `Lembar`, `Batang`, `Pcs`, `Box`).
   - **Min Stock Risk**: Ketik batas minimal stok sebelum ada alarm habis (contoh: `10`).
   - **Average Cost Price**: Ketik harga beli per satuan (contoh: `1450000`).
4. Klik tombol **"Save"**. Ulangi untuk semua bahan baku Anda.

### 2.2. Masukkan Stok Fisik yang Ada di Gudang Saat Ini
1. Masih di halaman **Materials** $\to$ Klik tab **"Stock Batches"** (di sebelah tab Catalog).
2. Klik tombol **"+ Batch Stock In"** atau **"+ Initial Balance"**.
3. **Isi form:**
   - **Material**: Pilih nama material (contoh: `Plat Stainless Steel 2mm`).
   - **Batch Number**: Ketik nomor batch (contoh: `BAT-001`).
   - **Quantity**: Masukkan jumlah fisik yang ada di gudang (contoh: `35`).
   - **Unit Cost**: Masukkan harga belinya (contoh: `1450000`).
   - **Warehouse Rack**: Ketik lokasi rak simpan (contoh: `Rak Besi 01`).
4. Klik tombol **"Submit"**. Sekarang gudang Anda resmi punya stok.

---

## TAHAP 3: MASUKKAN DATA VENDOR (PENYUPLAI & SUBKONTRAKTOR)

1. Di menu sidebar kiri $\to$ Klik **"Resources"** $\to$ Klik **"Vendors"**.
2. Klik tombol biru **"+ Add Vendor"**.
3. **Isi form:**
   - **Vendor Name**: Ketik nama rekanan (contoh: `PT Mega Baja` untuk penyuplai plat, atau `CV Warna Prima Coating` untuk jasa cat/subkontrak).
   - **Category**: Pilih `Raw Material Supplier` (penjual bahan) atau `Subcontractor` (jasa pengerjaan luar).
   - **Payment Terms**: Pilih termin bayar (contoh: `NET 30 Days`).
   - **PIC Details**: Ketik Nama kontak, No WhatsApp, dan Email.
4. Klik tombol **"Save Vendor"**.

---

## TAHAP 4: MASUKKAN DATA PELANGGAN (CUSTOMER)

1. Di menu sidebar kiri $\to$ Klik **"Resources"** $\to$ Klik **"Customers"**.
2. Klik tombol biru **"+ Add Customer"**.
3. **Isi form:**
   - **Customer Name**: Ketik nama perusahaan pembeli (contoh: `PT Maju Makmur Mandiri`).
   - **Address**: Masukkan alamat pengiriman pabrik pembeli.
   - **Contact Persons (PIC)**:
     - Masukkan Nama PIC (contoh: `Ir. Bambang Sutejo`).
     - Masukkan Nomor WhatsApp dan Email PIC.
     - **PENTING - Role Portal**: Pilih **`Approver`** (agar orang ini berhak menyetujui penawaran harga lewat HP).
4. Klik tombol **"Save Customer"**.

---

## TAHAP 5: BUAT TAHAPAN KERJA PABRIK (ROUTING)

*Routing adalah urutan proses dari bahan mentah sampai jadi.*

1. Di menu sidebar kiri $\to$ Klik **"Manufacturing"** $\to$ Klik **"Routing"**.
2. Klik tombol biru **"+ Create Routing"**.
3. **Isi form:**
   - **Routing Code**: Ketik kode (contoh: `ROUT-MEJA-01`).
   - **Routing Name**: Ketik nama (contoh: `Pembuatan Meja Stainless`).
4. **Klik "+ Add Step" untuk menambah tahapan kerja secara berurutan:**
   - **Tahap 1:** Nama: `Pemotongan Plat`, Tipe: pilih `In-House`, Jam kerja: `1.5 Jam`.
   - **Tahap 2:** Nama: `Penekukan Plat CNC`, Tipe: pilih `In-House`, Jam kerja: `1.0 Jam`.
   - **Tahap 3:** Nama: `Pengelasan Rangka`, Tipe: pilih `In-House`, Jam kerja: `3.0 Jam`.
   - **Tahap 4:** Nama: `Powder Coating Cat Oven`, Tipe: pilih **`Outsource (Subkontrak)`**, Estimasi biaya: `Rp 250.000 / unit`.
   - **Tahap 5:** Nama: `Perakitan Roda & Baut`, Tipe: pilih `In-House`, Jam kerja: `1.0 Jam`.
5. Klik tombol **"Save Routing"**.

---

## TAHAP 6: BUAT KATALOG PRODUK & RESEP BAHAN (BOM)

### 6.1. Daftarkan Produk Jadi
1. Di sidebar kiri $\to$ Klik **"Product"** $\to$ Klik **"Product Catalog"**.
2. Klik tombol **"+ Add Product"**.
3. **Isi form:**
   - **SKU**: Ketik kode produk (contoh: `PROD-MEJA-180`).
   - **Product Name**: Ketik nama produk (contoh: `Meja Kerja Stainless 180x90cm`).
   - **Category**: Pilih `Furnitur Industri`.
   - **Selling Price**: Masukkan harga jual standar (contoh: `6850000`).
   - **Default Routing**: Pilih `Pembuatan Meja Stainless` (yang dibuat di Tahap 5).
4. Klik tombol **"Save Product"**.

### 6.2. Buat Resep Bahan Baku (Bill of Materials / BOM)
1. Di sidebar kiri $\to$ Klik **"Manufacturing"** $\to$ Klik **"Bill of Materials"**.
2. Klik tombol biru **"+ Create BOM"**.
3. **Isi form:**
   - **Product**: Pilih `Meja Kerja Stainless 180x90cm`.
   - **BOM Code**: Ketik `BOM-MEJA-V1`.
4. **Klik "+ Add Material Item" untuk memasukkan bahan pembuat 1 unit meja:**
   - Pilih `Plat Stainless Steel 2mm` $\to$ Jumlah: `1.5` Lembar.
   - Pilih `Pipa Stainless 50x50` $\to$ Jumlah: `3.0` Batang.
   - Pilih `Kawat Las TIG` $\to$ Jumlah: `0.5` Tube.
   - Pilih `Roda Castor 4 Inch` $\to$ Jumlah: `4` Pcs.
   - Pilih `Baut M8x20` $\to$ Jumlah: `0.2` Box.
5. Sistem akan otomatis menjumlahkan total modal bahan baku per unit meja.
6. Klik tombol **"Save & Activate BOM"**.

---

## TAHAP 7: PRODUKSI BUFFER STOK BARANG JADI UNTUK DISIMPAN DI GUDANG (MAKE TO STOCK)

*Lakukan langkah ini jika perusahaan Anda ingin membuat stok meja terlebih dahulu di gudang sebelum ada pembeli.*

1. Di sidebar kiri $\to$ Klik **"Manufacturing"** $\to$ Klik **"Work Order"** $\to$ Klik **"+ Create Work Order"**.
2. **Pilih Produk**: `Meja Kerja Stainless 180x90cm` $\to$ Masukkan kuantitas (misal: `50 Unit`).
3. Klik tombol biru **"Auto Allocate Materials"** (bahan baku di gudang otomatis teralokasi).
4. Klik tombol hijau **"Start Process"** $\to$ Operator selesaikan tahapan pabrik.
5. Klik tombol hijau besar **"Complete Work Order"**.
6. **Hasilnya:** Stok barang jadi di katalog produk (`/products/`) otomatis bertambah **`+50 Unit Ready Stock`** siap jual di gudang!

---

## TAHAP 8: SAAT ADA PO MASUK: CEK READY STOCK & ATUR AGAR TIDAK JADI HUTANG

Saat pelanggan mengirim PO (misal: Pesan 10 Unit Meja):

### 8.1. Cek Ketersediaan di Order Simulation
1. Di sidebar kiri $\to$ Klik **"Tools"** $\to$ Klik **"Order Simulation"**.
2. Masukkan nama produk: `Meja Kerja Stainless 180x90cm`, Qty: `10 Unit` $\to$ Klik **"Run Simulation"**.
3. Sistem menampilkan status: **`100% Available in Warehouse`** (Artinya barang ready, tidak butuh tunggu pabrik bikin).

### 8.2. Buat Quotation & Kunci Pembayaran (Mencegah Piutang Macet / Hutang)
1. Di sidebar kiri $\to$ Klik **"Sales"** $\to$ Klik **"Quotes"** $\to$ Klik **"+ Create Quotation"**.
2. Pilih Customer: `PT Maju Makmur Mandiri` $\to$ Masukkan item: `10 Unit Meja`.
3. **PENGATURAN KUNCI AGAR TIDAK JADI HUTANG:**
   - **Opsi Cash Before Delivery (Aman 100%):** Pada kolom **Down Payment (DP %)**, ketik `100%` (Pembeli wajib lunas sebelum barang dikirim).
   - **Opsi Termin:** Pasang DP `50%`, sisa pelunasan jatuh tempo `NET 30 Days` setelah surat jalan diterima.
4. Klik tombol **"Generate Quotation"**.
5. Klik **"Share Approval Link"** $\to$ Kirimkan link WhatsApp ke pelanggan $\to$ Pelanggan tanda tangan digital di HP dan klik **"Approve Quotation"**.
6. **Sales Order resmi terbit!**

---

## TAHAP 9: EKSEKUSI PENGIRIMAN BARANG READY STOCK (LANGSUNG KIRIM VS JADWAL TUNDA)

Setelah Sales Order terbit untuk barang ready stock, Anda memiliki 2 pilihan:

### PILIHAN A: LANGSUNG DIKIRIM HARI INI (INSTANT DISPATCH)
*Jika pembeli minta barang langsung dikirim hari ini:*
1. Di sidebar kiri $\to$ Klik **"Sales"** $\to$ Klik **"Orders"** $\to$ Buka Sales Order tersebut (Status: `Ready to Ship`).
2. Buka bagian **"Shipment Section"** $\to$ Klik **"Create Delivery / Surat Jalan"**.
3. Pilih armada truk, masukkan plat nomor (misal: `B 9876 PLI`), nama supir, dan klik **"Print Delivery Note (Surat Jalan)"**.
4. Klik tombol **"Save & Dispatch"**:
   - Status Sales Order berubah menjadi **`On Shipping`**.
   - **Stok barang jadi di gudang `/products/` otomatis terpotong seketika (dari 50 unit menjadi 40 unit).**
5. Saat supir sampai di lokasi pembeli $\to$ Minta tanda tangan Surat Jalan $\to$ Unggah foto Surat Jalan di sistem $\to$ Klik **"Mark as Delivered"**.

---

### PILIHAN B: MENUNGGU BEBERAPA WAKTU BARU DIKIRIM (SCHEDULED DELIVERY)
*Jika pembeli minta barang baru dikirim 2 minggu lagi:*
1. Buka Sales Order di menu **Sales $\to$ Orders**.
2. Pada kolom **"Target Delivery Date"**: Masukkan tanggal pengiriman yang diminta (misal: *25 Oktober 2026*).
3. **PROTEKSI SISTEM LABAMU (STOCK LOCK):**
   - 10 unit meja tersebut secara otomatis masuk ke status **`Allocated / Reserved`**.
   - **Barang tetap aman di gudang Anda dan TERKUNCI di sistem**, sehingga tim sales lain tidak akan bisa menjual 10 unit ini ke pelanggan lain secara tidak sengaja.
4. Saat tanggal 25 Oktober tiba $\to$ Buka tab **Shipment** di Sales Order $\to$ Cetak Surat Jalan $\to$ Berangkatkan armada.

---

## TAHAP 10: JIKA STOK KURANG / PESANAN KUSTOM (JALANKAN WORK ORDER PABRIK)

*Gunakan alur ini jika barang TIDAK ADA di gudang atau STOK KURANG.*

### 10.1. Alokasi Bahan Baku Otomatis
1. Di sidebar kiri $\to$ Klik **"Manufacturing"** $\to$ Klik **"Work Order"** $\to$ Buka Work Order yang berstatus `Pending Allocation`.
2. Klik tombol biru **"Auto Allocate Materials"**:
   - Jika bahan lengkap: Status menjadi **`Ready to Process`**.
   - Jika bahan kurang: Klik **"Request Material"** $\to$ Beli bahan via menu *Purchase Orders* $\to$ Gudang konfirmasi terima di tab *Receipt* $\to$ Klik ulang *Auto Allocate*.
3. Klik tombol hijau **"Start Process"** $\to$ Status WO resmi menjadi **`In Progress`**.

---

### 10.2. Jalur 1: Pengerjaan Sendiri di Pabrik (In-House)
1. Pada tahapan in-house di Work Order (misal: *Pemotongan Plat*):
2. Klik tombol **"Manage"**.
3. Operator kerjakan mesin sampai selesai $\to$ Masukkan jumlah yang selesai pada kolom **"Completed"** (misal: `10`) $\to$ Klik **"Save"**.

---

### 10.3. Jalur 2: Pengerjaan Subkontrak Maklon (Bahan dari Kita Dikirim ke Vendor)
*Contoh: Rangka meja hasil las kita kirim ke vendor cat Powder Coating.*

1. Pada tahapan *Powder Coating* di Work Order $\to$ Klik tombol **"Assign Vendor"**.
2. Pilih nama vendor: `CV Warna Prima Coating` $\to$ Masukkan kuantitas: `10` Unit $\to$ Tautkan ke PO bertipe **Work Order** $\to$ Klik **"Save"**.
3. **Keluarkan Barang dari Pabrik (Wajib):**
   - Klik ikon **"Release to Vendor"** $\to$ Masukkan angka `10` $\to$ Unggah surat jalan keluar $\to$ Klik **"Submit"** (Status: `Waiting Receipt`).
4. Truk kirim barang ke vendor.
5. **Saat Barang Selesai & Kembali ke Pabrik Kita:**
   - Buka menu **"Procurement"** $\to$ Klik **"Purchase Orders"** $\to$ Buka PO Subkontrak tersebut.
   - Buka tab **"Receipt"** $\to$ Masukkan angka `10` di kolom **"Receive Now"** $\to$ Unggah bukti surat jalan vendor $\to$ Klik **"Confirm Receipt"**.
6. **Otomatis!** Tahapan Powder Coating di Work Order langsung selesai **100% (Completed)**!

---

### 10.4. Jalur 3: Pengerjaan Subkontrak Turnkey (Beli Jasa + Bahan Sekaligus dari Vendor)
*Contoh: Pesan part khusus/gearbox di mana vendor beli besi sendiri dan bubut sendiri.*

1. Di sidebar kiri $\to$ Klik **"Procurement"** $\to$ Klik **"Purchase Orders"** $\to$ Buat PO bertipe **`Material`**.
2. Masukkan nama barang, kuantitas, dan harga borongan $\to$ Submit PO.
3. Kita **tidak perlu mengirim bahan dari gudang**.
4. Saat vendor kirim barang jadi ke pabrik $\to$ Buka tab **Receipt** di PO $\to$ Konfirmasi terima barang $\to$ Barang masuk gudang siap dirakit.

---

### 10.5. Jalur 4: 1 Barang Dikerjakan Banyak Vendor Sekaligus (Berantai & Bagi Kuota)

#### Skenario Berantai (Vendor A $\to$ Vendor B $\to$ Vendor C):
1. Tahap 1: *Assign Vendor A* $\to$ *Release to Vendor* $\to$ Saat balik, gudang klik *Confirm Receipt* di PO A $\to$ Tahap 1 Selesai.
2. Tahap 2: *Assign Vendor B* $\to$ *Release to Vendor* $\to$ Saat balik, gudang klik *Confirm Receipt* di PO B $\to$ Tahap 2 Selesai.
3. Tahap 3: *Assign Vendor C* $\to$ *Release to Vendor* $\to$ Saat balik, gudang klik *Confirm Receipt* di PO C $\to$ Tahap 3 Selesai.

#### Skenario Bagi Kuota (Split 60 Unit ke Vendor A & 40 Unit ke Vendor B):
1. Pada tahap yang sama di Work Order $\to$ Klik **Assign Vendor** pertama (Vendor A, Qty: `60`) $\to$ Tautkan ke PO A.
2. Klik **Assign Vendor** kedua (Vendor B, Qty: `40`) $\to$ Tautkan ke PO B.
3. Rilis dan terima masing-masing di PO A dan PO B. Sistem otomatis menjumlahkan `60 + 40 = 100 unit` untuk menyelesaikan tahapan tersebut.

---

## TAHAP 11: SELESAIKAN PRODUKSI (COMPLETE WORK ORDER)

1. Petugas QC memeriksa fisik produk akhir.
2. Di halaman Work Order $\to$ Klik tombol hijau besar **"Complete Work Order"**.
3. **Efek Otomatis:**
   - Stok bahan baku di gudang otomatis terpotong permanen.
   - Stok produk jadi bertambah di katalog `/products/`.
   - Status Sales Order otomatis berubah menjadi **`Ready to Ship`**.

---

## TAHAP 12: KIRIM BARANG HASIL PRODUKSI KE PELANGGAN (SURAT JALAN / DELIVERY)

1. Buka menu **Sales $\to$ Orders** $\to$ Buka pesanan yang berstatus `Ready to Ship`.
2. Di bagian **Shipment Section** $\to$ Masukkan nomor plat truk, nama driver, unggah dokumen Surat Jalan.
3. Klik **"Save"** $\to$ Status berubah menjadi **`On Shipping`**.
4. Setelah pembeli menerima barang dan menandatangani BAST $\to$ Unggah foto BAST $\to$ Status berubah menjadi **`Delivered`**.

---

## TAHAP 13: TAGIH SISA PELUNASAN & TUTUP ORDER (CLOSED)

1. Di sidebar kiri $\to$ Klik **"Sales"** $\to$ Klik **"Invoices"**.
2. Buka faktur pelunasan sisa tagihan (`Repayment Invoice`) $\to$ Kirimkan ke pelanggan.
3. Setelah pelanggan transfer sisa uang:
   - Buka invoice $\to$ Klik tombol **"Add Payment"**.
   - Masukkan nominal pelunasan dan bukti transfer $\to$ Klik **"Save"**. Status invoice menjadi **`Paid (100%)`**.
4. **Selesai!** Status Sales Order otomatis berubah menjadi **`Completed` (Closed)**. Tidak ada hutang piutang menggantung.

---

## 📊 TABEL RINGKASAN MENU CEPAT

| Kebutuhan Anda | Menu yang Harus Diklik di Sidebar | Tombol Kunci |
| :--- | :--- | :--- |
| **Produksi Buffer Stok Gudang** | `Manufacturing` $\to$ `Work Order` | `+ Create Work Order` $\to$ `Complete Work Order` |
| **Cek Ketersediaan Ready Stock** | `Tools` $\to$ `Order Simulation` | `Run Simulation` |
| **Kirim Langsung Barang Ready** | `Sales` $\to$ `Orders` $\to$ Tab *Shipment* | `Create Delivery` $\to$ `Print Surat Jalan` $\to$ `Dispatch` |
| **Tahan Stok untuk Jadwal Nanti** | `Sales` $\to$ `Orders` | Kolom `Target Delivery Date` *(Sistem otomatis Lock Stok)* |
| **Kirim Barang ke Subkontraktor** | Di dalam *Work Order* pada tahap terkait | `Assign Vendor` $\to$ `Release to Vendor` *(Upload Surat Jalan Keluar)* |
| **Terima Barang dari Subkontraktor**| `Procurement` $\to$ `Purchase Orders` $\to$ Tab *Receipt* | `Receive Now` $\to$ `Confirm Receipt` *(WO otomatis terupdate)* |
| **Catat Pembayaran Masuk** | `Sales` $\to$ `Invoices` | `Add Payment` |
