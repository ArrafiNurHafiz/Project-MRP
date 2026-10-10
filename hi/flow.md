# DOKUMENTASI FLOW PRODUKSI, SUBKONTRAK & PENANGANAN KENDALA FINISHING
## Berdasarkan Fitur, Logika, dan Mekanisme Asli Sistem Labamu Manufacturing

Dokumen ini memetakan seluruh alur proses manufaktur pada sistem **Labamu MRP** (`https://mrp.labamu.co.id/`) secara faktual, mencakup model **Make to Order (MTO)**, model **Make to Stock (MTS / Ready Stock)**, penanganan 2 jalur subkontrak (*Maklon vs Turnkey*), multi-vendor, serta **SOP penanganan kendala khusus pada vendor finishing (material dari kita)**.

---

## 1. PETA ALUR PRODUKSI UTAMA (MASTER WORKFLOW)

```mermaid
flowchart TD
    %% 1. Inisiasi
    SO[1. Sales Order Dikonfirmasi / DP Terbayar] --> WO_GEN[2. Sistem Otomatis Generate Work Order di /work-orders/]
    
    %% 2. Alokasi Bahan
    WO_GEN --> WO_ALLOC{3. Buka Detail WO & Klik 'Auto Allocate'}
    WO_ALLOC -->|Kondisi: Stok Cukup| WO_READY[Status WO: Ready to Process]
    WO_ALLOC -->|Kondisi: Stok Kurang| MR_ACT[Klik 'Request Material' -> Masuk ke /material-requests/]
    MR_ACT --> PO_MAT[Purchasing Buat PO Tipe: Material]
    PO_MAT --> WH_REC[Gudang Terima di PO Tab 'Receipt' -> Status Batch: Received]
    WH_REC --> WO_ALLOC
    
    %% 3. Eksekusi Produksi
    WO_READY --> WO_START[4. Klik 'Start Process' -> Status WO: In Progress]
    WO_START --> ROUTING_EXEC[5. Eksekusi Daftar Tahapan Routing]
    
    %% 4. Pilihan Mode Pengerjaan
    subgraph Routing_Modes [Mode Pengerjaan Tahapan Routing di Labamu MRP]
        direction TB
        ROUTING_EXEC --> ROUTE_CHOICE{Pilih Mode Tahap Routing}
        
        %% Jalur 1: In-House
        ROUTE_CHOICE -->|Mode In-House| IN_HOUSE[A. Pengerjaan Internal di Mesin Pabrik]
        IN_HOUSE --> IN_MANAGE[Klik 'Manage' pada Tahapan -> Pindahkan Qty ke 'Completed']
        IN_MANAGE --> STEP_OK[Tahapan Selesai]
        
        %% Jalur 2: Subkontrak Maklon Finishing (Bahan dari Kita)
        ROUTE_CHOICE -->|Mode Subkontrak Maklon Finishing| SUB_MAKLON[B. Subkontrak Finishing: Benda dari Kita]
        SUB_MAKLON --> SUB_ASSIGN[1. Klik 'Assign Vendor' & Tautkan ke PO Work Order]
        SUB_ASSIGN --> SUB_REL[2. Klik ikon 'Release to Vendor' & Upload Surat Jalan Kirim]
        SUB_REL --> SUB_W_REC[Status Tahapan di Sistem: Waiting Receipt]
        SUB_W_REC --> SUB_PO_REC[3. Gudang Terima di Tab 'Receipt' PO]
        SUB_PO_REC --> SUB_INSPECT{Inspeksi Hasil Finishing di Tab Receipt}
        
        SUB_INSPECT -->|Lolos QC 100%| SUB_CONFIRM[Klik 'Confirm Receipt' -> Selesai]
        SUB_INSPECT -->|Cacat / Reject Sebagian| SUB_REWORK[Catat Parsial & Terbitkan Surat Jalan Retur/Rework]
        SUB_INSPECT -->|Rusak Total / Scrap| SUB_SCRAP[Ajukan Material Request Bahan Pengganti]
        SUB_INSPECT -->|Vendor Macet / Telat| SUB_SWITCH[Alihkan Sisa Unit ke Vendor Finishing B]
        
        SUB_CONFIRM --> SUB_SYNC[Progres Tahapan WO Otomatis Terupdate 100%]
        SUB_REWORK --> SUB_SYNC
        SUB_SCRAP --> SUB_SYNC
        SUB_SWITCH --> SUB_SYNC
        SUB_SYNC --> STEP_OK
        
        %% Jalur 3: Subkontrak Jasa Murni / Beli Komponen
        ROUTE_CHOICE -->|Mode Beli Komponen / Turnkey| SUB_BUY[C. Beli Komponen Jadi dari Vendor]
        SUB_BUY --> SUB_PO_MAT[1. Purchasing Buat PO Tipe: Material]
        SUB_PO_MAT --> SUB_BUY_REC[2. Gudang Terima di Tab 'Receipt' PO]
        SUB_BUY_REC --> STEP_OK
    end
    
    %% 5. Penyelesaian & QC
    STEP_OK --> CHECK_NEXT{Masih Ada Tahapan Routing Lain?}
    CHECK_NEXT -->|Ya| ROUTING_EXEC
    CHECK_NEXT -->|Semua Tahap 100% Selesai| WO_QC[6. Quality Control / Uji Mutu]
    WO_QC --> WO_COMPLETE_BTN[7. Klik 'Complete Work Order']
    
    %% 6. Dampak Transaksi
    subgraph System_Impact [Dampak Otomatis di Sistem Labamu]
        WO_COMPLETE_BTN --> DEDUCT_STOCK[A. Stok Batch Bahan Baku Terpotong Otomatis]
        WO_COMPLETE_BTN --> ADD_FG[B. Kuantitas Produk Jadi Masuk ke Inventaris /products/]
        WO_COMPLETE_BTN --> UPDATE_SO[C. Status Sales Order Otomatis: READY TO SHIP]
    end
```

---

## 2. PENANGANAN 4 KENDALA KHUSUS PADA VENDOR FINISHING (*Bahan dari Kita*)

Proses finishing luar (seperti *Powder Coating, Hard Chrome, Anodizing, Galvanizing, Sandblasting, dan Pengecatan Oven*) seringkali menghadapi kendala di lapangan karena **benda kerja fisiknya berasal dari pabrik kita**.

Berikut adalah cara sistem Labamu MRP mengatasi **4 masalah utama finishing**:

```
+---------------------------------------------------------------------------------------------------------------+
|                       CARA SISTEM LABAMU MRP MENGATASI 4 KENDALA VENDOR FINISHING                             |
+------------------------------------+------------------------------------+-------------------------------------+
| KASUS 1: HASIL CACAT / REJECT QC   | KASUS 2: BARANG RUSAK / HILANG     | KASUS 3: VENDOR FINISHING TELAT     |
+------------------------------------+------------------------------------+-------------------------------------+
| Masalah:                           | Masalah:                           | Masalah:                            |
| 10 unit dikirim, saat balik 2 unit | 1 unit meja penyok parah / hilang  | Vendor A macet / over capacity,     |
| cat mengelupas / baret.            | di pabrik vendor saat diproses.    | pesanan harus cepat dikirim.        |
|                                    |                                    |                                     |
| Solusi Labamu MRP:                 | Solusi Labamu MRP:                 | Solusi Labamu MRP:                  |
| 1. Di PO Receipt: Input 8 unit     | 1. Di PO Receipt: Terima 9 unit    | 1. Tarik sisa unit dari Vendor A.   |
|    "Receive Now", 2 unit ditolak.  |    (1 unit dicatat rusak/scrap).   | 2. Di Work Order: Assign Vendor B   |
| 2. Progres WO terisi 80%.          | 2. Klik "Request Material" di WO   |    untuk sisa unit yang belum jadi. |
| 3. Terbitkan "Surat Jalan Retur    |    untuk ambil plat/bahan pengganti| 3. Terbitkan PO baru ke Vendor B    |
|    Rework" ke vendor (Rp 0).       | 3. Operator pabrik bikin 1 unit.   |    -> Release ke Vendor B -> Terima |
| 4. Saat 2 unit selesai diperbaiki  | 4. Kirim ke vendor via Release baru|    di PO Vendor B.                  |
|    -> Terima di PO -> Progres 100%.| 5. Potong tagihan jasa vendor.     | 4. Progres WO genap 100% selesai.   |
+------------------------------------+------------------------------------+-------------------------------------+
| KASUS 4: PERBEDAAN HARGA / BIAYA TAMBAHAN (SURCHARGE CHEMICAL / OVEN KHUSUS)                          |
+-------------------------------------------------------------------------------------------------------+
| Solusi Labamu MRP:                                                                                    |
| Update unit price di Purchase Order Subkontrak sebelum approval keuangan. Nilai HPP aktual produk     |
| di sistem otomatis mengkalkulasi kenaikan biaya finishing tersebut secara transparan.                |
+-------------------------------------------------------------------------------------------------------+
```

---

### 2.1. SOP KASUS 1: HASIL FINISHING CACAT / REWORK (*Cat Baret, Mengelupas, Belang*)
*Contoh:* Kirim 10 unit meja ke *CV Warna Prima Coating*. Saat kembali, **8 unit mulus**, **2 unit cat mengelupas**.

```mermaid
sequenceDiagram
    autonumber
    actor WH as Gudang Pabrik Kita
    actor VEND as Vendor Finishing
    actor WO as Work Order di Sistem

    VEND->>WH: Kirim 10 unit meja selesai finishing + Surat Jalan
    WH->>WH: Inspeksi fisik: 8 Unit Lolos QC, 2 Unit Cacat
    
    WH->>WO: Buka PO Subkontrak -> Tab "Receipt"
    WH->>WO: Masukkan "Receive Now: 8", Catat 2 Unit "Returned for Rework"
    WH->>WO: Klik "Confirm Receipt" (8 Unit lolos)
    Note over WO: Progres Tahap Finishing di Work Order tercatat 80% (Kurang 2 Unit)
    
    WH->>VEND: Kirim balik 2 unit cacat + Cetak "Surat Jalan Retur Rework"
    Note over VEND: Vendor mencat ulang 2 unit tersebut tanpa tagihan baru (Garansi)
    
    VEND-->>WH: Vendor kirim kembali 2 unit yang sudah diperbaiki
    WH->>WO: Buka PO Subkontrak -> Tab "Receipt" -> Masukkan "Receive Now: 2"
    WH->>WO: Klik "Confirm Receipt"
    Note over WO: Total = 8 + 2 = 10 Unit -> Progres Tahap Finishing Otomatis 100% (Completed)!
```

#### Langkah-Langkah di Sistem Labamu MRP:
1. **Pencatatan Parsial di PO Receipts (`/purchase-orders/[id]`):**
   - Buka PO Subkontrak $\to$ Tab **Receipt**.
   - Pada kolom **Receive Now**, masukkan angka `8`.
   - Unggah foto surat jalan vendor dan foto bagian cat yang cacat sebagai bukti dokumentasi.
   - Klik **"Confirm Receipt"**.
   - *Status Sistem:* Work Order otomatis mencatat progres **8 dari 10 unit selesai (80%)**. Sistem tidak akan menutup tahapan ini sampai 2 unit sisanya berstatus diterima.
2. **Penerbitan Surat Jalan Retur Rework:**
   - Bagian gudang mencetak dokumen **Surat Jalan Pengeluaran Barang (Kategori: Retur Pengerjaan Ulang / Rework)** untuk membawa 2 unit tersebut kembali ke fasilitas vendor.
3. **Penerimaan Sisa Unit Rework:**
   - Setelah 2 unit selesai dicat ulang dan tiba di pabrik $\to$ Buka kembali tab **Receipt** pada PO yang sama.
   - Masukkan angka `2` pada kolom **Receive Now** $\to$ Klik **"Confirm Receipt"**.
   - **Otomatis!** Progres tahapan finishing di Work Order langsung tuntas **100% (Completed)**.

---

### 2.2. SOP KASUS 2: BARANG RUSAK TOTAL / HILANG OLEH VENDOR (*Scrapped by Vendor*)
*Contoh:* 1 unit meja terjatuh di tempat vendor hingga rangkanya patah/penyok parah dan tidak bisa diperbaiki lagi.

#### Langkah Penanganan di Sistem:
1. **Konfirmasi Penerimaan Unit yang Selamat:**
   - Di PO Receipt, terima `9 Unit` yang dalam kondisi baik.
   - Sisa `1 Unit` dicatat sebagai *Damaged / Scrapped*.
2. **Keluarkan Bahan Baku Pengganti di Work Order:**
   - Buka Work Order $\to$ Klik tombol **"Request Material"**.
   - Ajukan bahan baku tambahan dari gudang (1.5 lembar plat + 3 batang pipa) khusus untuk membuat 1 unit pengganti.
   - Tim internal pabrik memotong dan mengelas 1 unit rangka baru.
3. **Kirim Ulang 1 Unit ke Vendor Finishing:**
   - Pada tahapan finishing di Work Order, klik **Release to Vendor** $\to$ Masukkan kuantitas `1 Unit` $\to$ Cetak surat jalan pengiriman baru.
   - Saat 1 unit selesai dicat dan kembali $\to$ Gudang klik *Confirm Receipt* di PO.
   - Total kuantitas WO genap 10 unit.
4. **Klaim Ganti Rugi Finansial:**
   - Biaya bahan baku tambahan yang terpakai dapat dipotongkan langsung dari nilai tagihan faktur vendor finishing saat rekonsiliasi di modul Keuangan (`/invoices/`).

---

### 2.3. SOP KASUS 3: VENDOR FINISHING MACET / GANTI VENDOR (*Vendor Replacement*)
*Contoh:* Vendor A (*CV Warna Prima*) mengalami kerusakan mesin oven sehingga proses finishing 10 unit meja macet, padahal tanggal pengiriman pesanan ke customer sudah sangat mendesak.

#### Langkah Penanganan di Sistem:
1. **Tarik Barang Kembali dari Vendor A:**
   - Ambil seluruh barang setengah jadi dari fasilitas Vendor A.
   - Jika Vendor A sempat menyelesaikan 3 unit $\to$ Catat *Receipt 3 Unit* pada PO Vendor A.
   - Jika belum ada yang selesai $\to$ Batalkan alokasi sisa di PO Vendor A.
2. **Alihkan Sisa Unit ke Vendor Finishing B (*PT Cikupa Coating*):**
   - Buka Work Order $\to$ Pada tahapan finishing yang sama, klik **Assign Vendor** kedua.
   - Pilih vendor baru: `PT Cikupa Coating Mandiri`.
   - Masukkan kuantitas sisa: `7 Unit` (atau `10 Unit`).
   - Tautkan ke PO baru untuk Vendor B.
3. **Pelepasan & Penerimaan di Vendor B:**
   - Klik **Release to Vendor B** $\to$ Unggah surat jalan kirim ke Tangerang.
   - Saat Vendor B selesai dan mengirim barang $\to$ Gudang buka tab *Receipt* pada PO Vendor B $\to$ Klik **Confirm Receipt**.
   - Sistem mengakumulasi total penerimaan dari Vendor A dan Vendor B hingga genap 10 unit $\to$ Status tahapan finishing di Work Order otomatis **`Completed`**.

---

## 3. MATRIKS RINGKASAN AKSI SISTEM

| Kendala Lapangan | Tindakan di Work Order | Tindakan di Modul PO / Gudang | Dampak Finansial / Stok |
| :--- | :--- | :--- | :--- |
| **Cat Cacat Sebagian** | Status tahap tetap terbuka (*Progress 80%*). | Terima parsial (8 unit) di PO Receipt $\to$ Kirim 2 unit retur $\to$ Terima 2 unit sisa di PO yang sama. | Tidak ada tambahan biaya jasa (Garansi Vendor). |
| **Barang Rusak Total** | Klik **Request Material** untuk bahan pengganti 1 unit $\to$ Buat baru. | Terima 9 unit di PO Receipt $\to$ Rilis 1 unit pengganti $\to$ Terima 1 unit sisa. | Klaim potong tagihan jasa vendor senilai bahan yang rusak. |
| **Ganti Vendor di Tengah Jalan** | Klik **Assign Vendor** kedua untuk sisa kuantitas pada tahap yang sama. | Buat PO baru ke Vendor B $\to$ Rilis ke Vendor B $\to$ Gudang konfirmasi terima di PO B. | HPP mengakumulasi tagihan riil dari Vendor A + Vendor B. |
| **Normal (Tanpa Kendala)** | Klik **Assign Vendor** $\to$ Klik **Release to Vendor**. | Buka PO $\to$ Tab **Receipt** $\to$ Masukkan *Receive Now* $\to$ Klik **Confirm Receipt**. | Progres WO otomatis terupdate 100% Completed. |
