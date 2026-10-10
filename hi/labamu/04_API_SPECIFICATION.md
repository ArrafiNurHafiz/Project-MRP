# 04. Spesifikasi Lengkap API Endpoints (Live Data Schemas)

Dokumentasi ini berisi struktur payload, query parameters, header autentikasi, serta contoh format respon JSON nyata dari backend **`mrp-api.cashenable.com`** untuk implementasi backend/mock server AI.

---

## 1. Standar Format Respon API

Semua endpoint Labamu MRP mengembalikan struktur response envelop seragam:

### Format Sukses (200 / 201)
```json
{
  "status": 200,
  "message": "resource retrieved/created successfully",
  "data": { ... } | [ ... ],
  "meta": {
    "page": 1,
    "size": 100,
    "total": 2
  }
}
```

### Format Error (400 / 401 / 404 / 500)
```json
{
  "status": 404,
  "message": "Active tenant token not found",
  "error": {
    "type": "not_found",
    "code": "RECORD_NOT_FOUND",
    "message": "Active tenant token not found",
    "details": {
      "error": "No active token found for the given tenant ID"
    },
    "timestamp": "2026-09-26T02:26:11.05130197Z",
    "request_id": "5cb2d4b8-419d-42aa-8459-f87e57b25b6e"
  }
}
```

---

## 2. Product Service (`/product/v1`)

### 2.1 `GET /product/v1/categories`
Mengambil daftar kategori produk aktif.
- **Request**: `GET https://mrp-api.cashenable.com/product/v1/categories?name=&status=ACTIVE&page=1&size=100`
- **Response Contoh Nyata**:
```json
{
  "status": 200,
  "message": "categories list retrieved successfully",
  "data": [
    {
      "id": "7bae40f4-ed7d-4553-a16d-81c58e58ac0c",
      "tenant_id": "13d72ff8-1e73-4872-a2d0-4bb837b00bd5",
      "name": "Produksi Internal",
      "status": "ACTIVE",
      "created_at": "2026-09-25T08:53:10.152215Z",
      "updated_at": "2026-09-25T08:53:10.152215Z"
    }
  ],
  "meta": {
    "page": 1,
    "size": 100,
    "total": 1
  }
}
```

### 2.2 `GET /product/v1/boms`
Mengambil daftar Bill of Materials yang siap ditautkan ke produk.
- **Request**: `GET https://mrp-api.cashenable.com/product/v1/boms?name=&without_product=true&status=ACTIVE&page=1&size=100`

### 2.3 `GET /product/v1/products` & `POST /product/v1/products`
- **Payload POST Create Product**:
```json
{
  "name": "Kardus Master Box 50x50",
  "sku": "PRD-BOX-001",
  "category_id": "7bae40f4-ed7d-4553-a16d-81c58e58ac0c",
  "status": "ACTIVE",
  "description": "Kardus corrugated 3 lapis",
  "primary_material": "Kertas Kraft",
  "finishing": "Doft Coating",
  "weight": 0.45,
  "height": 50,
  "width": 50,
  "length": 50,
  "pkg_height": 52,
  "pkg_width": 52,
  "pkg_length": 52,
  "container_20ft_capacity": 500,
  "container_40ft_capacity": 1000,
  "container_40hc_capacity": 1200,
  "bom_id": "bom-uuid-1234",
  "lead_time": 2,
  "lead_time_unit": "WEEK",
  "prices": [
    { "currency_code": "IDR", "selling_price": 25000 },
    { "currency_code": "USD", "selling_price": 1.6 }
  ],
  "image_urls": ["https://storage.../img1.webp"]
}
```

---

## 3. Sales Service (`/sales/v1`)

### 3.1 `GET /sales/v1/customers`
Mengambil database customer beserta daftar PIC (Person In Charge).
- **Request**: `GET https://mrp-api.cashenable.com/sales/v1/customers?customer_name=&page=1&size=100`
- **Response Contoh Nyata**:
```json
{
  "status": 200,
  "message": "customers list retrieved successfully",
  "data": [
    {
      "id": "84613e05-eacb-4d3e-8a13-474ed563731a",
      "tenant_id": "13d72ff8-1e73-4872-a2d0-4bb837b00bd5",
      "customer_name": "Superepang",
      "customer_address": "Jalan Gresik",
      "customer_email": "corp@superepang.com",
      "customer_phone": "+628123456789",
      "tags": ["VIP", "Corporate"],
      "customer_pics": [
        {
          "id": "3878a252-2cf2-455d-ba08-33668f8765a1",
          "role": "APPROVER",
          "is_primary": true,
          "pic_name": "Soetomo",
          "pic_email": "abc@gmail.com",
          "pic_phone": "+6285156197989"
        }
      ]
    }
  ],
  "meta": { "page": 1, "size": 100, "total": 1 }
}
```

### 3.2 `GET /sales/v1/customer-tags`
- **Request**: `GET https://mrp-api.cashenable.com/sales/v1/customer-tags?keyword=&page=1`

### 3.3 `GET /sales/v1/rfqs/settings` & `GET /sales/v1/quotes/settings`
Mengambil format prefix penomoran dokumen (misal: `RFQ/2026/09/001`, `QUO/2026/09/001`).

### 3.4 `GET /sales/v1/currencies`
- **Response**:
```json
{
  "status": 200,
  "data": [
    { "code": "IDR", "name": "Indonesian Rupiah", "symbol": "Rp", "is_base": true },
    { "code": "USD", "name": "US Dollar", "symbol": "$", "exchange_rate": 15800 }
  ]
}
```

### 3.5 `GET /sales/v1/work-orders/users`
Daftar staff yang dapat di-assign pada Surat Perintah Kerja (SPK).
- **Response Contoh Nyata**:
```json
{
  "status": 200,
  "message": "users list retrieved successfully",
  "data": [
    {
      "id": "892cd8b4-0362-46d8-ad16-dccd5d264b76",
      "name": "Ryan Saputra",
      "email": null
    }
  ]
}
```

### 3.6 `GET /sales/v1/status-counts/{module}`
Mengambil statistik jumlah dokumen per status (misal untuk tab badge `Waiting for Approval (0)`, `Confirmed (5)`, `In Progress (2)`).

---

## 4. Inventory Service (`/inventory/v1`)

### 4.1 `GET /inventory/v1/categories`
- **Request**: `GET https://mrp-api.cashenable.com/inventory/v1/categories?keyword=&page=1&size=100`
- **Response Contoh Nyata**:
```json
{
  "status": 200,
  "message": "categories list retrieved successfully",
  "data": [
    {
      "id": "906994da-7db6-46d4-8cb9-189ba466ebcb",
      "tenant_id": "13d72ff8-1e73-4872-a2d0-4bb837b00bd5",
      "name": "Semi Finishing",
      "status": "ACTIVE",
      "materials_count": 2,
      "created_at": "2026-09-25T09:27:35.760534Z",
      "updated_at": "2026-09-25T09:27:35.760534Z"
    }
  ]
}
```

### 4.2 `GET /inventory/v1/uom`
Daftar satuan material.
- **Query Params**: `keyword`, `status=ACTIVE`, `page=1`, `size=100`
- **Nilai Satuan**: `PCS`, `KG`, `METER`, `LITER`, `ROLL`, `SHEET`, `BOX`.

### 4.3 `GET /inventory/v1/vendors` & `POST /inventory/v1/vendors`
- **Payload POST Vendor**:
```json
{
  "name": "PT Sumber Kertas Abadi",
  "alias": "SKA Paper",
  "status": "ACTIVE",
  "pic_name": "Budi Santoso",
  "pic_email": "sales@skapaper.co.id",
  "pic_phone": "+62811223344",
  "business_address": "Kawasan Industri MM2100 Blok C-12, Cikarang"
}
```

---

## 5. User & Tenant Administration (`/user/v1`)

### 5.1 `GET /user/v1/tenant-bank-accounts/me`
Daftar rekening bank perusahaan untuk dicantumkan pada Quote dan Faktur.
- **Response Contoh Nyata**:
```json
{
  "status": 200,
  "message": "tenant_bank_account list retrieved successfully",
  "data": [
    {
      "id": "b9cb6262-3e7a-477e-92a2-b6ecd8e6810a",
      "tenant_id": "13d72ff8-1e73-4872-a2d0-4bb837b00bd5",
      "account_holder_name": "Ryan",
      "bank_name": "BCA",
      "account_number": "1234567890",
      "is_default": true,
      "swift_code": "CENAIDJA",
      "currencies": [
        {
          "tenant_bank_account_id": "b9cb6262-3e7a-477e-92a2-b6ecd8e6810a",
          "currency_code": "IDR"
        }
      ]
    }
  ]
}
```

### 5.2 `GET /user/v1/groups` & `POST /user/v1/groups`
Manajemen grup pengguna (Roles).

### 5.3 `POST /user/v1/user-group-permissions/bulk-upsert`
Menyimpan konfigurasi perizinan akses untuk grup.
- **Payload POST**:
```json
{
  "group_id": "906994da-7db6-46d4-8cb9-189ba466ebcb",
  "permissions": [
    { "access_path": "SALES:QUOTES", "can_read": true, "can_create": true, "can_update": true, "can_delete": false, "can_approve": true },
    { "access_path": "SALES:ORDERS", "can_read": true, "can_create": true, "can_update": true, "can_delete": false, "can_approve": true },
    { "access_path": "MANUFACTURING:BILL_OF_MATERIALS", "can_read": true, "can_create": true, "can_update": true, "can_delete": true, "can_approve": true },
    { "access_path": "MANUFACTURING:WORK_ORDERS", "can_read": true, "can_create": true, "can_update": true, "can_delete": false, "can_approve": false }
  ]
}
```

---

## 6. Realtime Events & Notification (`/notification/v1`)

### 6.1 `POST /notification/v1/notifications/events/ticket`
Mendapatkan tiket otentikasi SSE temporer.
- **Response Contoh Nyata**:
```json
{
  "status": 200,
  "message": "SSE ticket issued",
  "data": {
    "ticket": "73665c12-5e30-4365-a9c3-9a3fb955c2db"
  }
}
```

### 6.2 `GET /notification/v1/notifications/events?ticket={ticket}&lang=en`
Stream event `text/event-stream` untuk notifikasi real-time:
```
event: NOTIFICATION_EVENT
data: {"type": "NEED_TO_DO", "module": "SALES_QUOTE", "reference_id": "QUO-001", "message": "Quote QUO-001 requires your approval"}
```
