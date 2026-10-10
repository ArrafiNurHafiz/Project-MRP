# SPESIFIKASI ENDPOINT API & KONTRAK PAYLOAD (API CONTRACTS)
## REST API & Server Actions Specification for Labamu MRP Clone

Dokumen ini mendefinisikan seluruh antarmuka API (HTTP Method, Route URL, Request Body, Response Payload, dan Error Code) untuk frontend dan integrasi backend.

---

## 1. Authentication & Session Endpoints

### `POST /api/v1/auth/request-otp`
- **Tujuan:** Mengirimkan kode 6-digit OTP ke WhatsApp pengguna.
- **Request Body:**
  ```json
  {
    "phoneNumber": "+6285156197989",
    "channel": "whatsapp"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "OTP sent successfully via WhatsApp",
    "expiresInSeconds": 300,
    "retryAfterSeconds": 60
  }
  ```

### `POST /api/v1/auth/verify-otp`
- **Tujuan:** Memverifikasi kode OTP dan menerbitkan token sesi.
- **Request Body:**
  ```json
  {
    "phoneNumber": "+6285156197989",
    "otpCode": "123456"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "usr_123",
      "fullName": "Ryan Saputra",
      "role": "OWNER",
      "company": {
        "id": "cmp_001",
        "name": "PT Presisi Logam Indonesia"
      }
    }
  }
  ```

---

## 2. Resources (Materials, Vendors, Customers)

### `GET /api/v1/materials`
- **Query Params:** `page`, `limit`, `category`, `abcClass`, `search`
- **Response `200 OK`:**
  ```json
  {
    "data": [
      {
        "id": "mat_ss304_2mm",
        "sku": "MAT-SS304-2MM",
        "name": "Plat Stainless Steel 304 (2.0 mm)",
        "category": "Logam & Plat",
        "abcClass": "A",
        "materialType": "RAW_MATERIAL",
        "uom": "Lembar",
        "totalStock": 35.0,
        "stockRiskMin": 10.0,
        "avgCostPrice": 1450000.00
      }
    ],
    "pagination": { "total": 10, "page": 1, "pageSize": 20 }
  }
  ```

### `POST /api/v1/materials`
- **Request Body:**
  ```json
  {
    "sku": "MAT-SS304-2MM",
    "name": "Plat Stainless Steel 304 (2.0 mm)",
    "category": "Logam & Plat",
    "abcClass": "A",
    "materialType": "RAW_MATERIAL",
    "uom": "Lembar",
    "minStockRisk": 10,
    "avgCostPrice": 1450000.00,
    "description": "Plat SS 304 finish 2B ukuran 4x8 feet"
  }
  ```

---

## 3. Product, BOM & Routing Endpoints

### `POST /api/v1/bill-of-materials`
- **Request Body:**
  ```json
  {
    "productId": "prod_tbl_ss180",
    "code": "BOM-TBL-SS180-V1",
    "version": 1,
    "items": [
      { "materialId": "mat_ss304_2mm", "quantity": 1.5, "unitCost": 1450000 },
      { "materialId": "mat_pipa_ss_2in", "quantity": 3.0, "unitCost": 480000 },
      { "materialId": "mat_weld_308l", "quantity": 0.5, "unitCost": 375000 },
      { "materialId": "mat_gas_argon", "quantity": 0.4, "unitCost": 320000 },
      { "materialId": "mat_castor_4in", "quantity": 4.0, "unitCost": 85000 },
      { "materialId": "mat_baut_m8x20", "quantity": 0.2, "unitCost": 65000 }
    ]
  }
  ```

### `POST /api/v1/routing`
- **Request Body:**
  ```json
  {
    "productId": "prod_tbl_ss180",
    "code": "ROUT-TBL-SS180",
    "name": "Fabrikasi Meja Stainless Heavy Duty",
    "steps": [
      { "stepNumber": 1, "code": "ROUT-CUTTING", "name": "Pemotongan Plat & Pipa", "type": "IN_HOUSE", "standardHours": 1.5, "hourlyLaborCost": 65000 },
      { "stepNumber": 2, "code": "ROUT-BENDING", "name": "Penekukan Plat CNC", "type": "IN_HOUSE", "standardHours": 1.0, "hourlyLaborCost": 75000 },
      { "stepNumber": 3, "code": "ROUT-WELDING", "name": "Pengelasan TIG / Argon", "type": "IN_HOUSE", "standardHours": 3.0, "hourlyLaborCost": 70000 },
      { "stepNumber": 4, "code": "ROUT-FINISHING", "name": "Grinding & Hairline Finish", "type": "IN_HOUSE", "standardHours": 2.0, "hourlyLaborCost": 60000 },
      { "stepNumber": 5, "code": "ROUT-POWDERCOAT", "name": "Powder Coating Oven", "type": "OUTSOURCE_SUBCONTRACT", "subcontractCost": 250000 },
      { "stepNumber": 6, "code": "ROUT-ASSEMBLY", "name": "Perakitan & QC Final", "type": "IN_HOUSE", "standardHours": 1.0, "hourlyLaborCost": 60000 }
    ]
  }
  ```

---

## 4. Sales: RFQ, Quotations & Approval Microsite

### `POST /api/v1/rfq`
- **Request Body:**
  ```json
  {
    "customerId": "cust_majumakmur",
    "targetDelivery": "2026-10-15T00:00:00Z",
    "notes": "Pesanan meja cleanroom pabrik farmasi",
    "items": [
      { "productId": "prod_tbl_ss180", "quantity": 10, "notes": "Spek standar" }
    ]
  }
  ```

### `POST /api/v1/quotes`
- **Request Body:**
  ```json
  {
    "rfqId": "rfq_0091",
    "customerId": "cust_majumakmur",
    "currencyCode": "IDR",
    "downPaymentPercent": 50.0,
    "incoterms": "Loco Pabrik Cikarang",
    "validUntil": "2026-10-05T00:00:00Z",
    "items": [
      {
        "productId": "prod_tbl_ss180",
        "description": "Meja Kerja Stainless Heavy Duty 180x90cm",
        "quantity": 10,
        "unitPrice": 6850000.00,
        "discount": 0
      }
    ]
  }
  ```

### `POST /api/v1/public/quotes/approve-by-token`
- **Tujuan:** Dipanggil dari Microsite pelanggan untuk menyetujui penawaran secara sah.
- **Request Body:**
  ```json
  {
    "token": "token-uuid-unique-microsite",
    "approvedByName": "Ir. Bambang Sutejo",
    "approvedByPhone": "+628119876543",
    "customerPoNumber": "PO-MMM-2026-089",
    "customerPoFileUrl": "https://s3.domain.com/uploads/po-mmm.pdf",
    "digitalSignature": "data:image/png;base64,iVBORw0KGgo..."
  }
  ```
- **Response `200 OK` (Auto Triggers Executed):**
  ```json
  {
    "success": true,
    "message": "Quotation approved. Sales Order, Work Order, and DP Invoice generated.",
    "salesOrderNumber": "SO-2026-0038",
    "workOrderNumbers": ["WO-2026-0041"],
    "invoiceNumber": "INV-2026-0023-DP"
  }
  ```

---

## 5. Manufacturing: Work Order Execution & Allocation

### `POST /api/v1/work-orders/:id/auto-allocate`
- **Tujuan:** Menjalankan algoritma auto-allocation stok batch material.
- **Response `200 OK`:**
  ```json
  {
    "workOrderId": "wo_0041",
    "isFullyAllocated": true,
    "allocations": [
      { "materialSku": "MAT-SS304-2MM", "batchNo": "BAT-20260901-001", "qtyAllocated": 15.0, "status": "FULFILLED" },
      { "materialSku": "MAT-PIPA-SS-2IN", "batchNo": "BAT-20260901-002", "qtyAllocated": 30.0, "status": "FULFILLED" }
    ]
  }
  ```

### `POST /api/v1/work-orders/:id/complete`
- **Request Body:**
  ```json
  {
    "qcPassedQuantity": 10,
    "qcRejectedQuantity": 0,
    "inspectorName": "Hadi Subroto",
    "notes": "Lolos uji beban 300kg dan inspeksi visual"
  }
  ```
