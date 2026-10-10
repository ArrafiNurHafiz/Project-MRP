# 08. Kamus Data & Spesifikasi Input Form Lengkap

Dokumen referensi mendalam untuk setiap field form di seluruh aplikasi agar AI dan developer dapat mengimplementasikan validasi Zod / form generator tanpa ambiguitas.

---

## 1. Modul Products (`/products/create`)

| Nama Field | Label UI | Tipe Data / Input | Validasi & Rule | Keterangan & Sumber Data |
|---|---|---|---|---|
| `name` | `* Product Name` | Text Input | Required, Min 3, Max 255 | Nama produk jadi |
| `sku` | `SKU` | Text Input | Optional (Auto-generate jika kosong) | Kode unik barang |
| `category_id` | `* Category` | Select / Combobox | Required, UUID | Dari `/product/v1/categories` |
| `status` | `* Status` | Radio Group | Required, `ACTIVE` \| `INACTIVE` | Status katalog |
| `description` | `Description` | Textarea | Optional | Keterangan produk |
| `images` | `Product Images` | Multi File Upload | Max 5 files, Max 5MB/file, Image MIME | Upload via `/storage/v1/document-assets/upload` |
| `primary_material` | `Primary Material` | Text Input | Optional | Bahan baku dominan |
| `finishing` | `Finishing` | Text Input | Optional | Jenis finishing |
| `weight` | `Weight` | Number (Float) | Min 0, Step 0.01 | Berat dalam kg |
| `height`, `width`, `length` | `Height`, `Width`, `Length` | Number | Min 0 | Dimensi unit dalam cm |
| `pkg_height`, `pkg_width`, `pkg_length` | `Pkg Dim.` | Number | Min 0 | Dimensi kemasan luar |
| `container_20ft_capacity` | `20 ft Container` | Integer | Min 0 | Muatan kontainer 20ft |
| `container_40ft_capacity` | `40 ft Container` | Integer | Min 0 | Muatan kontainer 40ft |
| `container_40hc_capacity` | `40 ft High Cube` | Integer | Min 0 | Muatan kontainer 40ft HC |
| `bom_id` | `Bill of Materials` | Select Dropdown | Optional / Required for MRP | Dari `/product/v1/boms` |
| `lead_time` | `* Lead Time` | Integer + Unit Select | Required, Min 1, Unit: `Week(s)` / `Day(s)` | Estimasi lama pengerjaan |
| `base_price` | `Base Price` | Read-only Text | Auto-calculated | Terhitung dari total COGS pada BOM |
| `prices` | `* Selling Price` | Array Table | Min 1 row (`currency_code`, `selling_price`) | Multi-currency harga jual |

---

## 2. Modul Sales RFQ (`/rfq/create`)

| Nama Field | Label UI | Tipe Data / Input | Validasi & Rule | Keterangan |
|---|---|---|---|---|
| `customer_id` | `* Customer Name` | Async Combobox / Create | Required, UUID | Auto-complete dari `/sales/v1/customers` |
| `customer_email` | `Customer Email` | Email Input | Email format | Email kantor |
| `customer_phone` | `Customer Phone` | Tel (`+62` prefix) | Min 8 digits | No telp kantor |
| `customer_address` | `* Customer Address` | Textarea | Required, Min 5 | Alamat kantor terdaftar |
| `customer_tags` | `Customer Tag` | Multi-select Badges | Max 5 tags | Dari `/sales/v1/customer-tags` |
| `customer_pics` | `PIC Table` | Dynamic Table | Min 1 row, 1 Primary PIC | Nama, Email, Role (Approver, Finance), Phone |
| `documents` | `Upload Documents` | Multi File Upload | Max 10 files, Max 30MB/file | Lampiran TOR/Spesifikasi |
| `customer_notes` | `Customer Notes` | Textarea | Optional | Catatan khusus dari pelanggan |
| `internal_notes` | `Internal Notes` | Textarea | Optional | Catatan rahasia internal tim sales |

---

## 3. Modul Quotes (`/quotes/create`)

| Nama Field | Label UI | Tipe Data / Input | Validasi & Rule | Keterangan |
|---|---|---|---|---|
| `currency_code` | `* Currency` | Select Dropdown | Required | Pilihan mata uang (`/sales/v1/currencies`) |
| `down_payment_percentage` | `Down Payment %` | Number (0 - 100) | Min 0, Max 100 | Persentase uang muka |
| `valid_until` | `* Valid Until` | Date Picker | Required, Date >= Today | Batas waktu berlakunya penawaran |
| `bank_account_id` | `* Bank Account` | Select Dropdown | Required, UUID | Rekening tujuan dari `/user/v1/tenant-bank-accounts/me` |
| `payment_terms` | `* Payment Terms` | Select / Text | Required | Syarat pembayaran (cth: *50% DP, 50% Before Shipment*) |
| `incoterms` | `Incoterms` | Select Dropdown | Optional (`FOB`, `CIF`, `EXW`, `DDP`) | Klausul perdagangan internasional |
| `risk_level` | `Risk Level` | Select Dropdown | `LOW` \| `MEDIUM` \| `HIGH` | Tingkat risiko kredit transaksi |
| `shipping_method` | `Shipping Method` | Text Input | Optional | Jalur pengiriman (Darat, Laut, Udara) |
| `estimated_delivery` | `Estimated Delivery` | Date Picker | Optional | Perkiraan tanggal kirim |
| `dispute_resolution` | `Dispute Resolution Method` | Select / Text | Optional | Arbitrase BANI / Pengadilan Negeri |
| `governing_law` | `Governing Law` | Text Input | Default: Hukum Republik Indonesia | Yurisdiksi hukum perjanjian |
| `include_force_majeure` | `Include Force Majeure Clause` | Checkbox | Boolean (Default: True) | Klausul keadaan kahar |
| `include_late_payment_penalties` | `Include Late Payment Penalties` | Checkbox | Boolean (Default: True) | Klausul denda keterlambatan |
| `include_performance_guarantees` | `Include Performance Guarantees` | Checkbox | Boolean (Default: False) | Jaminan performa |
| `items` | `Quote Items` | Dynamic Table | Min 1 row | Product, Custom Desc, Qty, Unit Price, Disc |
| `tax_rate` | `Tax Rate` | Number (0 - 100) | Default: 11% (PPN) | Persentase pajak |
| `shipping_fee` | `Shipping Fee` | Number Currency | Min 0 | Ongkos kirim |
| `other_fee` | `Other Fee` | Number Currency | Min 0 | Biaya asuransi / handling |

---

## 4. Modul Purchase Orders (`/purchase-orders/create`)

| Nama Field | Label UI | Tipe Data / Input | Validasi & Rule | Keterangan |
|---|---|---|---|---|
| `vendor_id` | `* Vendor Name` | Select Combobox | Required, UUID | Pemasok dari `/inventory/v1/vendors` |
| `po_date` | `* Purchase Order Date` | Date Picker | Required | Tanggal penerbitan PO |
| `expected_delivery_date` | `Expected Delivery Date` | Date Picker | Date >= po_date | Target tiba di gudang |
| `currency_code` | `* Currency` | Select Dropdown | Required | Mata uang PO |
| `recipient_name` | `Recipient Name` | Text Input | Optional | Nama PIC penerima di gudang |
| `recipient_address` | `Recipient Address` | Textarea | Optional | Alamat gudang tujuan bongkar |
| `items` | `PO Items` | Dynamic Table | Min 1 row | Material (dari `/materials`), Qty, Unit Cost |
| `notes` | `Notes` | Textarea | Optional | Catatan instruksi pengemasan |
| `terms` | `Terms` | Textarea | Optional | Syarat retur & penerimaan barang |

---

## 5. Modul Materials (`/materials/create`)

| Nama Field | Label UI | Tipe Data / Input | Validasi & Rule | Keterangan |
|---|---|---|---|---|
| `sku` | `SKU` | Text Input | Optional (Auto-generate jika kosong) | Kode unik material |
| `name` | `* Material Name` | Text Input | Required, Min 3 | Nama bahan baku mentah |
| `category_id` | `* Category` | Select Dropdown | Required, UUID | Dari `/inventory/v1/categories` |
| `abc_classification` | `* ABC Classification` | Select Radio | Required (`A`, `B`, `C`) | Klasifikasi prioritas nilai inventori |
| `material_type` | `* Material Type` | Select Dropdown | Required (`Raw Material`, `Packaging`, `Consumable`) | Tipe penggunaan bahan |
| `uom_id` | `* Unit of Measure` | Select Dropdown | Required, UUID | Satuan baku dari `/inventory/v1/uom` |
| `stock_risk` | `Stock Risk` | Text Input | Optional | Catatan risiko kerusakan / expired |
| `description` | `Description` | Textarea | Optional | Detail spesifikasi bahan baku |

---

## 6. Modul Bill of Materials (BOM) (`/bill-of-materials/create`)

| Nama Field | Label UI | Tipe Data / Input | Validasi & Rule | Keterangan |
|---|---|---|---|---|
| `name` | `* BOM Name` | Text Input | Required, Min 3 | Nama formula BOM |
| `description` | `Description` | Textarea | Optional | Petunjuk urutan perakitan |
| `materials` | `BOM Materials Table` | Dynamic Table | Min 1 row | Material, Qty, UOM, Waste %, Unit Cost |
| `material_cost` | `Material Cost` | Read-only Currency | Auto-sum | Total biaya bahan mentah |
| `labour_cost` | `* Labour Cost` | Number Currency | Required, Min 0 | Biaya tenaga kerja per unit |
| `packing_cost` | `* Packing Cost` | Number Currency | Required, Min 0 | Biaya pengemasan per unit |
| `other_cost` | `* Other Cost` | Number Currency | Required, Min 0 | Biaya overhead & listrik per unit |
| `total_cost` | `Total Cost` | Read-only Currency | Auto-sum | `Material + Labour + Packing + Other` |

---

## 7. Modul Order Simulation (BETA) (`/order-simulation`)

| Nama Field | Label UI | Tipe Data / Input | Validasi & Rule | Keterangan |
|---|---|---|---|---|
| `required_date` | `* Order Required Date` | Date Picker | Required, Date > Today | Tanggal selesai yang ditargetkan |
| `products` | `Simulation Items Table` | Dynamic Table | Min 1 row | Product ID, Quantity, Selling Price |
| *Engine Output* | Analisis Kebutuhan MRP | Read-only Card & Table | - | 1. Kebutuhan tiap material<br>2. On-hand stock saat ini<br>3. Status Cukup / Kurang (Shortage)<br>4. Estimasi hari pengadaan PO |
