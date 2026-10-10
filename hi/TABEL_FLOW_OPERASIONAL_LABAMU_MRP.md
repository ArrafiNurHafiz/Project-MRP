# TABEL MATRIKS FLOW PROSES PRODUKSI LENGKAP (END-TO-END)
## Sistem Labamu Manufacturing (MRP) — https://mrp.labamu.co.id/

Dokumentasi tabel proses produksi dari awal (Master Data Setup & Penjualan) hingga akhir (Eksekusi Lantai Pabrik, Penanganan Kendala Finishing, Quality Control, Masuk Stok Jadi, dan Invoicing). Seluruh nama menu sidebar, tombol klik, label form, dan status disesuaikan 100% dengan teks aktual di website **Labamu Manufacturing**.

---

## 🧭 DAFTAR TABEL FLOW PRODUKSI

1. [TABEL 1: Persiapan Master Data Produksi (Materials, Vendors, Routing, BOM, Products)](#tabel-1-persiapan-master-data-produksi)
2. [TABEL 2: Siklus Pemicu Produksi (RFQ, Quotes, Sales Orders)](#tabel-2-siklus-pemicu-produksi)
3. [TABEL 3: Alokasi Bahan Baku & Penanganan Kekurangan Stok (Auto Allocate & Purchase Orders)](#tabel-3-alokasi-bahan-baku--penanganan-kekurangan-stok)
4. [TABEL 4: Eksekusi Produksi In-House (Lantai Pabrik Sendiri)](#tabel-4-eksekusi-produksi-in-house)
5. [TABEL 5: Eksekusi Subkontrak Maklon Finishing (Benda Kerja dari Pabrik Dikirim ke Vendor)](#tabel-5-eksekusi-subkontrak-maklon-finishing)
6. [TABEL 6: Penanganan Kendala Lapangan Khusus Vendor Finishing](#tabel-6-penanganan-kendala-lapangan-khusus-vendor-finishing)
7. [TABEL 7: Quality Control Akhir, Penutupan SPK & Update Stok Otomatis](#tabel-7-quality-control-akhir-penutupan-spk--update-stok-otomatis)
8. [TABEL 8: Faktur Pelunasan & Penutupan Transaksi (Invoices)](#tabel-8-faktur-pelunasan--penutupan-transaksi)

---

## TABEL 1: PERSIAPAN MASTER DATA PRODUKSI

| No | Aktivitas / Tahap | Pelaksana | Menu Sidebar | Tombol yang Diklik di Web | Form, Input & Pilihan yang Diisi | Hasil & Status di Web |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1.1** | Daftarkan Bahan Baku | Gudang / Purchasing | `Resources` &rarr; `Materials` | Tombol `New Material` | 1. `* Material Name`: Nama bahan (misal: *Plat Baja 2mm*)<br>2. `SKU`: Kosongkan (auto-generate)<br>3. `* Category`: Pilih kategori bahan<br>4. `* ABC Classification`: Pilih `A - High Value` / `B` / `C`<br>5. `* Material Type`: Pilih `Raw Material` / `Packaging`<br>6. `* Unit of Measure`: Pilih satuan (`PCS`, `KG`, `METER`, `LITER`)<br>7. `Stock Risk` & `Description`<br>8. Klik `Save` | Master Material tersimpan di `/materials/` |
| **1.2** | Daftarkan Vendor Bahan & Maklon | Purchasing | `Resources` &rarr; `Vendors` | Tombol `+ Add Vendor` | 1. `* Vendor Name`: Nama PT/Bengkel Vendor<br>2. `Alias`: Nama panggilan vendor<br>3. `Status`: Toggle `ACTIVE`<br>4. `PIC Name`, `PIC Email`, `PIC Phone`<br>5. `Business Address`: Alamat pengiriman/pabrik vendor<br>6. Klik `Save` | Vendor terdaftar di `/vendors/` |
| **1.3** | Daftarkan Customer Pembeli | Sales Admin | `Resources` &rarr; `Customers` | Tombol `+ Add Customer` | 1. `* Customer Name`: Nama perusahaan pembeli<br>2. `Customer Email` & `Customer Phone`<br>3. `* Customer Address`: Alamat kirim/kantor<br>4. `Customer Tag`: Pilih tag (misal: *VIP*, *Corporate*)<br>5. Klik `Add PIC`: Masukkan nama, email, role `Approver`, no telp<br>6. Klik `Save` | Customer aktif di `/customers/` |
| **1.4** | Buat Alur Stasiun Kerja (Routing) | Engineering / PPIC | `Manufacturing` &rarr; `Routing` | Tombol `Add Routing` | 1. `* Routing Name`: Nama alur (misal: *Alur Pembuatan Meja Logam*)<br>2. `Description`: Rincian pengerjaan<br>3. Klik `+ Add Operation` untuk tiap tahap berurutan:<br>&nbsp;&nbsp;• Operation 1: *Pemotongan & Bending*<br>&nbsp;&nbsp;• Operation 2: *Pengelasan Rangka*<br>&nbsp;&nbsp;• Operation 3: *Finishing Powder Coating*<br>&nbsp;&nbsp;• Operation 4: *QC & Packing*<br>4. Klik `Save Routing` | Master Routing tersimpan di `/routing/` |
| **1.5** | Susun Formula Resep Produksi (BOM) | Engineering / PPIC | `Manufacturing` &rarr; `Bill of Materials` | Tombol `+ Create BOM` | 1. `* BOM Name`: Nama formula (misal: *BOM Meja Logam M-01*)<br>2. Klik `+ Add Material`: Pilih material, isi `Quantity` & `Waste %`<br>3. Klik `+ Add Routing`: Pilih routing dari step 1.4<br>4. Isi biaya: `* Labour Cost`, `* Packing Cost`, `* Other Cost`<br>5. *(Sistem menghitung Material Cost & Total Cost COGS otomatis)*<br>6. Klik `Save` | Formula BOM aktif di `/bill-of-materials/` |
| **1.6** | Daftarkan Produk Jadi Siap Jual | Sales / PPIC | `Product` &rarr; `Product Catalog` | Tombol `+ Create Product` | 1. `* Product Name`: Nama produk jadi<br>2. `* Category`: Pilih kategori produk<br>3. `* Status`: `Active`<br>4. `Bill of Materials`: **Pilih BOM dari step 1.5**<br>5. *(Base Price otomatis terisi dari Total Cost BOM)*<br>6. `* Lead Time`: Masukkan angka & pilih `Week(s)` / `Day(s)`<br>7. `* Selling Price`: Klik `Add Price`, pilih Currency `IDR`, isi harga jual<br>8. Klik `Save` | Produk jadi aktif di `/products/` |

---

## TABEL 2: SIKLUS PEMICU PRODUKSI (SALES FLOW)

| No | Aktivitas / Tahap | Pelaksana | Menu Sidebar | Tombol yang Diklik di Web | Form, Input & Pilihan yang Diisi | Hasil & Status di Web |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **2.1** | Buat Request for Quotes (RFQ) | Marketing / Sales | `Sales` &rarr; `Request for Quotes` | Tombol `+ Create RFQ` | 1. Pilih `* Customer Name`<br>2. Pilih PIC pada tabel PIC<br>3. Klik `+ Add Product`: Pilih produk katalog atau pilih tipe *Custom* jika pesanan kustom<br>4. Masukkan `Quantity` pesanan<br>5. Klik `Submit RFQ` | Dokumen RFQ terbit di `/rfq/` |
| **2.2** | Approval CPR (Jika Produk Kustom) | Tim Teknis / R&D | `Product` &rarr; `Custom Products Request` | Klik baris CPR &rarr; Tombol `Approve` | *(Hanya jika ada item Custom)*: Isi spesifikasi teknis, rancangan gambar, estimasi biaya &rarr; Klik `Approve` | CPR disetujui, siap dibuatkan Quote |
| **2.3** | Buat Surat Penawaran (Quotes) | Sales Admin | `Sales` &rarr; `Quotes` | Tombol `+ Create Quote` | 1. `* Currency`: Pilih `IDR - Indonesian Rupiah`<br>2. `Down Payment Percentage`: Isi % DP (misal `50%`)<br>3. `* Valid Until`: Pilih tanggal expired<br>4. Pilih Customer & Produk dari RFQ<br>5. Isi `Tax Rate` (11% PPN), `Shipping Fee`<br>6. Pilih `* Bank Account` & `* Payment Terms`<br>7. Centang klausul hukum (*Force Majeure*, *Late Penalties*)<br>8. Klik `Submit` | Quotation resmi terbit di `/quotes/` |
| **2.4** | Konfirmasi Order Pelanggan | Sales Admin / Manager | `Sales` &rarr; `Orders` | Buka Order &rarr; Tombol `Approve` / `Confirm Order` | Verifikasi persetujuan penawaran & pembayaran DP pelanggan &rarr; Klik Approve | **SISTEM OTOMATIS MEMBUAT:**<br>1. Sales Order status `Confirmed`<br>2. **Work Order (SPK) otomatis terbit di `/work-orders`** |

---

## TABEL 3: ALOKASI BAHAN BAKU & PENANGANAN KEKURANGAN STOK

| No | Aktivitas / Tahap | Pelaksana | Menu Sidebar | Tombol yang Diklik di Web | Form, Input & Pilihan yang Diisi | Hasil & Status di Web |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **3.1** | Buka Detail Work Order (SPK) | PPIC | `Manufacturing` &rarr; `Work Order` | Klik baris Work Order pesanan | Buka detail SPK yang berstatus `Not Started` | Halaman detail SPK terbuka |
| **3.2** | Eksekusi Alokasi Bahan Otomatis | PPIC | Detail Work Order | Tombol `Auto Allocate` | Klik tombol `Auto Allocate` untuk mencocokkan kebutuhan BOM dengan stok gudang | Sistem memeriksa ketersediaan stok fisik |
| **3.3A**| **Kondisi A: Stok Bahan CUKUP** | Sistem & PPIC | Detail Work Order | - | Seluruh baris material berstatus `Allocated` | Status Work Order berubah otomatis: **`Ready to Process`** |
| **3.3B**| **Kondisi B: Stok Bahan KURANG** | PPIC | Detail Work Order | Tombol `Request Material` | Sistem menampilkan tanda kekurangan bahan (*Shortage*) &rarr; Klik `Request Material` | Permintaan alokasi masuk ke `Resources` &rarr; `Material Requests` |
| **3.4** | Terbitkan Purchase Order Bahan | Purchasing | `Procurement` &rarr; `Purchase Orders` | Tombol `New PO` | 1. Pilih `* Vendor Name`<br>2. Tentukan `* Purchase Order Date` & `Expected Delivery Date`<br>3. Klik `+ Add PO Line`: Pilih material yang kurang, masukkan `Quantity` & `Unit Cost`<br>4. Klik `Submit PO` | Dokumen PO terbit status `Approved` / `In Delivery` |
| **3.5** | Penerimaan Bahan di Gudang | Petugas Gudang | `Procurement` &rarr; `Purchase Orders` | Buka PO &rarr; Tab `Receipt` &rarr; Tombol `Receive` | Saat truk vendor tiba: masukkan jumlah barang fisik yang diterima & nomor batch &rarr; Klik `Receive` | Stok di `Resources` &rarr; `Materials` bertambah seketika |
| **3.6** | Re-Alokasi Bahan ke SPK | PPIC | `Manufacturing` &rarr; `Work Order` | Buka SPK &rarr; Tombol `Auto Allocate` | Klik kembali `Auto Allocate` setelah stok bahan baru masuk | Seluruh bahan terpenuhi &rarr; Status Work Order: **`Ready to Process`** |

---

## TABEL 4: EKSEKUSI PRODUKSI IN-HOUSE (LANTAI PABRIK SENDIRI)

| No | Aktivitas / Tahap | Pelaksana | Menu Sidebar | Tombol yang Diklik di Web | Form, Input & Pilihan yang Diisi | Hasil & Status di Web |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **4.1** | Mulai Pengerjaan SPK | Kepala Pabrik / PPIC | `Manufacturing` &rarr; `Work Order` | Buka SPK `Ready to Process` &rarr; Tombol `Start Process` | Klik tombol `Start Process` untuk membuka antrian pengerjaan stasiun mesin | Status Work Order resmi berubah: **`In Progress`** |
| **4.2** | Eksekusi Tahap 1: Pemotongan Bahan | Operator Mesin Cutting | Detail SPK &rarr; Tab *Routing Progress* | Tombol `Manage` pada baris operasi Pemotongan | 1. Operator memotong bahan baku sesuai ukuran pola BOM<br>2. Pada popup Manage: masukkan kuantitas potong selesai di kolom `Completed`<br>3. Klik `Save` | Progres Operasi 1 tercentang hijau (100% Completed) |
| **4.3** | Eksekusi Tahap 2: Pengelasan & Assembling | Operator Stasiun Las | Detail SPK &rarr; Tab *Routing Progress* | Tombol `Manage` pada baris operasi Pengelasan | 1. Operator merakit dan mengelas rangka meja<br>2. Masukkan kuantitas unit yang selesai dirakit di kolom `Completed`<br>3. Klik `Save` | Progres Operasi 2 tercentang hijau (100% Completed) |

---

## TABEL 5: EKSEKUSI SUBKONTRAK MAKLON FINISHING (BENDA KERJA DIKIRIM KE VENDOR)

| No | Aktivitas / Tahap | Pelaksana | Menu Sidebar | Tombol yang Diklik di Web | Form, Input & Pilihan yang Diisi | Hasil & Status di Web |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **5.1** | Tunjuk Vendor Jasa Finishing | PPIC / Purchasing | Detail SPK &rarr; Baris Operasi *Finishing* | Tombol `Assign Vendor` | 1. Pilih Vendor finishing (misal: *PT Powder Coating Prima*)<br>2. Tautkan ke Purchase Order tipe Jasa Subkontrak | Vendor resmi ditugaskan pada operasi finishing |
| **5.2** | Kirim Benda Kerja ke Vendor | Petugas Logistik / Gudang | Detail SPK &rarr; Baris Operasi *Finishing* | Ikon / Tombol `Release to Vendor` | 1. Cetak Surat Jalan pengiriman benda kerja rangka setengah jadi<br>2. Muat barang ke armada & unggah lampiran Surat Jalan keluar gerbang pabrik<br>3. Klik `Confirm Release` | Status operasi di sistem tercatat: **`Waiting Receipt`** |
| **5.3** | Penerimaan Kembali Barang Jadi | QC & Gudang | `Procurement` &rarr; `Purchase Orders` (PO Jasa) | Buka PO &rarr; Tab `Receipt` &rarr; Tombol `Receive Now` | Saat truk vendor mengembalikan barang yang sudah dicat/coating: masukkan jumlah fisik tiba | Data penerimaan tercatat di sistem |
| **5.4** | Inspeksi QC Hasil Pengerjaan Vendor | QC Inspector | Tab `Receipt` pada PO Jasa | Form Inspeksi & Tombol `Confirm Receipt` | 1. Periksa ketebalan cat, kerataan warna, dan uji gores<br>2. Masukkan jumlah **Lolos QC**<br>3. Klik `Confirm Receipt` | **Progres Operasi Finishing di Work Order otomatis terupdate 100% Completed** |

---

## TABEL 6: PENANGANAN KENDALA LAPANGAN KHUSUS VENDOR FINISHING

| Skenario Kendala Lapangan | Masalah Nyata | Menu Sidebar | Tombol & Solusi Akal dari Web | Tindakan Administratif & Operasional | Hasil Akhir di Sistem |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **KASUS 1: Hasil Cat Cacat / Reject Sebagian** | 10 unit dikirim, saat kembali 2 unit catnya belang/baret. | `Procurement` &rarr; `Purchase Orders` (PO Jasa) | Di tab `Receipt`: Klik `Receive Now` &rarr; Isi **8 unit diterima**, **2 unit ditolak** &rarr; Klik `Confirm Receipt`. | 1. Progres WO terisi 80%.<br>2. Terbitkan Surat Jalan retur pengerjaan ulang (*Rework*) garansi vendor (Rp 0).<br>3. Saat 2 unit perbaikan tiba: buka PO tab `Receipt` &rarr; Terima sisa 2 unit &rarr; Klik `Confirm Receipt`. | Progres operasi finishing di Work Order mencapai **100% Lunas & Selesai**. |
| **KASUS 2: Benda Kerja Rusak Total / Hilang di Vendor** | 1 unit rangka penyok parah / hilang di pabrik vendor saat proses coating. | `Manufacturing` &rarr; `Work Order` & `Procurement` | 1. Di tab `Receipt` PO: Terima 9 unit (1 unit dicatat rusak/scrap).<br>2. Di detail Work Order: Klik tombol `Request Material`. | 1. Ambil bahan baku pengganti dari gudang via Material Request.<br>2. Operator pabrik potong & las ulang 1 unit rangka baru.<br>3. Kirimkan 1 unit baru ke vendor finishing &rarr; Terima via tab Receipt PO.<br>4. Finance potong nilai tagihan invoice vendor senilai harga bahan yang dirusak. | Kuantitas pesanan 10 unit tetap utuh terpenuhi tanpa kerugian material. |
| **KASUS 3: Vendor Finishing Macet / Overcapacity** | Vendor A macet pengerjaannya, deadline pesanan customer sudah sangat dekat. | `Manufacturing` &rarr; `Work Order` | Pada baris operasi finishing: Klik tombol `Assign Vendor` &rarr; Pilih **Vendor Finishing B**. | 1. Tarik sisa unit yang belum selesai dari bengkel Vendor A.<br>2. Di Work Order alihkan (*Re-assign*) sisa kuantitas ke Vendor B.<br>3. Terbitkan PO baru ke Vendor B &rarr; Klik `Release to Vendor` &rarr; Terima hasil dari Vendor B. | SPK selesai tepat waktu sesuai jadwal tanpa tertunda lama. |

---

## TABEL 7: QUALITY CONTROL AKHIR, PENUTUPAN SPK & UPDATE STOK OTOMATIS

| No | Aktivitas / Tahap | Pelaksana | Menu Sidebar | Tombol yang Diklik di Web | Form, Input & Pilihan yang Diisi | Hasil & Dampak Otomatis di Web |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **7.1** | QC Akhir Produk Jadi | Tim QC | Detail Work Order &rarr; Tab *Quality Control* | Tombol `Approve QC` | 1. Periksa dimensi akhir, fungsi assembling, dan kebersihan produk<br>2. Masukkan **Passed Qty: `10`**, **Rejected Qty: `0`**<br>3. Masukkan catatan QC &rarr; Klik `Approve QC` | Status QC: **`Quality Control Passed`** |
| **7.2** | Penutupan Work Order Resmi | Kepala Pabrik / PPIC | Detail Work Order | Tombol hijau besar `Complete Work Order` | Klik tombol `Complete Work Order` untuk memfinalisasi produksi | **3 DAMPAK OTOMATIS SISTEM:**<br>1. **Stok Bahan Terpotong:** Bahan baku fisik terpotong permanen dari batch gudang.<br>2. **Stok Produk Jadi Masuk:** Kuantitas produk jadi bertambah di `/products/`.<br>3. **Status Order Terupdate:** Status pesanan di `Sales` &rarr; `Orders` otomatis berubah menjadi **`Ready to Ship`**. |

---

## TABEL 8: FAKTUR PELUNASAN & PENUTUPAN TRANSAKSI (INVOICES)

| No | Aktivitas / Tahap | Pelaksana | Menu Sidebar | Tombol yang Diklik di Web | Form, Input & Pilihan yang Diisi | Hasil & Status di Web |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **8.1** | Pengiriman Barang ke Customer | Logistik / Gudang | `Sales` &rarr; `Orders` | Buka SO &rarr; Tab *Shipment* &rarr; Tombol `Create Delivery` &rarr; `Dispatch` | 1. Muat produk jadi ke armada pengiriman<br>2. Cetak fisik Surat Jalan resmi (`Print Delivery Order`)<br>3. Unggah foto Surat Jalan jalan keluar pabrik &rarr; Klik `Dispatch` | Status Sales Order: **`On Shipping`** |
| **8.2** | Konfirmasi Terima di Lokasi Customer | Logistik / Driver | Tab *Shipment* di Sales Order | Tombol `Mark as Delivered` | Customer tanda tangani BAST/Surat Jalan fisik &rarr; Unggah foto BAST bertandatangan basah &rarr; Klik `Mark as Delivered` | Status Sales Order: **`Delivered`** |
| **8.3** | Penerbitan Faktur Pelunasan | Finance | `Sales` &rarr; `Invoices` | Tombol `+ Create Invoice` | 1. `* Invoice Type`: Pilih `Remaining Payment` (Pelunasan)<br>2. `* Order No`: Pilih nomor Sales Order terkait<br>3. *(Nominal otomatis terhitung dikurangi Down Payment yang sudah dibayar)*<br>4. Tentukan `* Issue Date` & `Due Date`<br>5. Klik `Save` | Faktur tagihan pelunasan terbit di `/invoices/` |
| **8.4** | Pencatatan Pembayaran Pelunasan | Finance | Detail Invoice Pelunasan | Tombol `Add Payment` | 1. Verifikasi transfer bank masuk rekening tenant<br>2. Masukkan `Payment Amount` & `Payment Date`<br>3. Unggah bukti transfer bank &rarr; Klik `Save` | Status Invoice berubah: **`Paid (100%)`** |
| **8.5** | Penutupan Order Sempurna (Closed) | Sistem Otomatis | `Sales` &rarr; `Orders` | - | Sistem memverifikasi:<br>1. Pengiriman barang: `Delivered`<br>2. Pembayaran finansial: `100% Paid (Settlement: 100%)` | Status Sales Order otomatis resmi berubah menjadi: **`COMPLETED` (Closed)**. |
