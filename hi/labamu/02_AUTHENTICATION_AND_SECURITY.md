# 02. Autentikasi SSO & RBAC Permission

Dokumen ini mendokumentasikan mekanisme Autentikasi Terpusat (SSO) dan Sistem Role-Based Access Control (RBAC) pada Labamu MRP.

---

## 1. Alur Autentikasi SSO (Single Sign-On)

Labamu menggunakan gateway autentikasi terpusat pada domain `https://sso.cashenable.com`.

### Diagram Alur Login

```
[MRP Frontend]                 [SSO Gateway]                  [Auth Service]
       |                              |                              |
 1. Klik "Continue with Labamu"       |                              |
       +----------------------------->|                              |
       |  Redirect dgn URL params     |                              |
       |                              | 2. Input No HP & Check Agree |
       |                              |    +62 851-5619-7989         |
       |                              +----------------------------->|
       |                              |                              | 3. Generate OTP
       |                              |<-----------------------------+
       |                              | 4. Layar Input 6 Digit OTP   |
       |                              |    (WhatsApp/SMS/Email)      |
       |                              |    User input: 123456        |
       |                              +----------------------------->|
       |                              |                              | 5. Validasi Sukses
       |                              |<-----------------------------+    Set Auth Cookies
       | 6. Redirect to fallback_url  |
       |<-----------------------------+
       |  (e.g., /success-login)
 7. Exchange session & load dashboard
```

### Parameter URL SSO
Ketika tombol "Continue with Labamu" diklik di `mrp.labamu.co.id/login`, frontend memicu fungsi `handleSSOLogin`:

- **Target URL**: `https://sso.cashenable.com/`
- **Query Parameters**:
  - `fallback_url_failed`: `https://mrp.labamu.co.id/error?type=login`
  - `fallback_url_success`: `https://mrp.labamu.co.id/success-login`
  - `from`: `MRP`
  - `lang`: `en` (atau `id`)

### Mekanisme Pengiriman & Validasi OTP
- **Pilihan Channel**: WhatsApp (Default), SMS, Email.
- **Payload OTP Screen**:
  - `availableResendTries`: 5
  - `availableType`: `["email", "sms", "whatsapp"]`
  - `phone`: `+6285156197989`
  - Input field berupa 6 kotak digit terpisah dengan auto-focus ke digit berikutnya.
  - Timer hitung mundur resend: 5 menit (300 detik).

---

## 2. Struktur RBAC & Hierarki Permission

Labamu menerapkan granular Role-Based Access Control bertingkat (Tenant -> User Groups -> Permissions).

### Hierarki Root Modul

| Main Access Path | Modul | Deskripsi |
|---|---|---|
| `DASHBOARD` | Dashboard | Akses ringkasan metrik dan todo list |
| `PRODUCTS` | Products | Pengelolaan produk, kategori, custom product request |
| `SALES` | Sales | RFQ, Quotes, Orders, Invoices, Customers, Shipments |
| `PROCUREMENT` | Procurement | Purchase Orders & Supplier Procurement |
| `INVENTORY` | Inventory | Materials, Categories, UOM, Batches, Stock Transactions, Vendors |
| `MANUFACTURING`| Manufacturing | Bill of Materials (BOM), Routings, Work Orders, Material Requests |
| `ASSET_MANAGEMENT`| Asset Management | Pengelolaan aset mesin dan peralatan produksi |
| `ANALYTICS_AND_REPORTS`| Analytics & Reports | Laporan Penjualan, Keuangan, Order, Inventori, Work Order |
| `ADMINISTRATION` | Administration | User Management, Group Permissions, Company Settings, FX |
| `HELP` | Help | User Guide dan dokumentasi |

### Detail Kode Permission Child

#### Modul Sales (`SALES:`)
- `SALES:REQUEST_FOR_QUOTES` (RFQS)
- `SALES:QUOTES` (QUOTES)
- `SALES:ORDERS` (ORDERS)
- `SALES:INVOICES` (INVOICES)
- `SALES:CUSTOMERS` (CUSTOMERS)
- `SALES:SHIPMENT` (SHIPMENT)

#### Modul Inventory (`INVENTORY:`)
- `INVENTORY:MATERIALS` (MATERIALS)
- `INVENTORY:MATERIAL_CATEGORY` (MATERIAL_CATEGORY)
- `INVENTORY:MATERIAL_UOM` (MATERIAL_UOM)
- `INVENTORY:BATCHES` (BATCHES)
- `INVENTORY:STOCK_TRANSACTIONS` (STOCK_TRANSACTIONS)
- `INVENTORY:VENDORS` (VENDORS)
- `INVENTORY:MATERIAL_PREPARATION` (MATERIAL_PREPARATION)
- `INVENTORY:MATERIAL_RECEIPT` (MATERIAL_RECEIPT)

#### Modul Manufacturing (`MANUFACTURING:`)
- `MANUFACTURING:BILL_OF_MATERIALS` (BILL_OF_MATERIALS)
- `MANUFACTURING:ROUTINGS` (ROUTINGS)
- `MANUFACTURING:WORK_ORDERS` (WORK_ORDERS)
- `MANUFACTURING:MATERIAL_REQUESTS` (MATERIAL_REQUESTS)

#### Modul Analytics & Reports (`ANALYTICS_AND_REPORTS:`)
- `ANALYTICS_AND_REPORTS:SALES_REPORT`
- `ANALYTICS_AND_REPORTS:FINANCE_REPORT`
- `ANALYTICS_AND_REPORTS:ORDER_REPORT`
- `ANALYTICS_AND_REPORTS:INVENTORY_REPORT`
- `ANALYTICS_AND_REPORTS:WORK_ORDER_MONITORING`

#### Modul Administration (`ADMINISTRATION:`)
- `ADMINISTRATION:USER_MANAGEMENT`
- `ADMINISTRATION:COMPANY_SETTINGS`
- `ADMINISTRATION:FX_MANAGEMENT`
- `ADMINISTRATION:MODULE_SETTINGS`

### Operasi Hak Akses (Granular Actions)
Setiap permission node mendukung 5 operasi aksi:
1. `READ` (`can_read`): Melihat data dan tabel.
2. `CREATE` (`can_create`): Menambah data baru.
3. `UPDATE` (`can_update`): Mengedit data existing.
4. `DELETE` (`can_delete`): Menghapus data.
5. `APPROVE` (`can_approve`): Menyetujui dokumen transaksi (RFQ, Quote, PO, Work Order).
