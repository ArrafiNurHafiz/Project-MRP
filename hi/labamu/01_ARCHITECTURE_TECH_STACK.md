# 01. Arsitektur & Tech Stack Sistem MRP Labamu

Dokumen ini menjelaskan arsitektur tingkat tinggi dan teknologi yang digunakan oleh sistem `mrp.labamu.co.id`.

---

## 1. Arsitektur Sistem

Sistem Labamu MRP mengadopsi pola **Single Page Application (SPA) / Server-Driven Hybrid Next.js** yang terhubung ke **Backend API Gateway Microservices** terpusat serta **Centralized Identity Provider (SSO)**.

```
+------------------------+      +--------------------------+
|  User Browser / Client | <--> |   mrp.labamu.co.id       | (Next.js App Router)
+------------------------+      +--------------------------+
           |                                  |
           | Redirect Auth (OAuth/SSO)         | Backend Proxy / SSR
           v                                  v
+------------------------+      +--------------------------+
|   sso.cashenable.com   |      |  mrp-api.cashenable.com  | (Core API Gateway)
| (Identity & OTP Auth)  |      +--------------------------+
+------------------------+                    |
                                              +---> /product/v1/
                                              +---> /sales/v1/
                                              +---> /inventory/v1/
                                              +---> /user/v1/
                                              +---> /storage/v1/
                                              +---> /notification/v1/ (SSE)
```

---

## 2. Frontend Tech Stack

| Lapisan / Kategori | Teknologi / Library | Keterangan & Penggunaan |
|---|---|---|
| **Framework** | Next.js (App Router, Turbopack) | SSR, CSR, Static Optimization |
| **Bahasa** | TypeScript / Modern ES | Strict type-safety |
| **Styling** | Tailwind CSS | Utility-first styling dengan prefix modern |
| **Komponen UI** | Radix UI Primitives / Shadcn UI | Accessible headless primitives (Dialog, Popover, Card, Dropdown) |
| **Icons** | Lucide React | Ikon sistem (`lucide-loader-2`, dsb.) |
| **State Management** | Zustand (`useAuthStore`) | Global auth store, tenant context |
| **Server State** | TanStack React Query (`@tanstack/react-query`) | Query caching, invalidation, mutation |
| **Form Management** | React Hook Form + Zod | Validasi skema formulir kompleks |
| **Realtime Updates** | Server-Sent Events (SSE) | Event notification stream via ticket token |
| **Analytics & Telemetry**| PostHog (`PostHogProvider`) | User tracking, funnel metrics |
| **URL State Adapter** | Nuqs (`NuqsAdapter`) | Type-safe URL query state management |
| **Font** | Google Fonts: Inter & Lato | Font primer UI & Dashboard |

---

## 3. Backend Microservices Architecture

Backend diekspos melalui subdomain gateway tunggal `https://mrp-api.cashenable.com` dengan routing prefix per modul domain:

1. **`/product/v1`**:
   - Manajemen katalog produk jadi / setengah jadi
   - Kategori produk
   - Relasi produk dengan BOM (Bill of Materials)
2. **`/sales/v1`**:
   - RFQ (Request for Quotations) & pengaturan RFQ
   - Quotes (Penawaran harga) & pengaturan Quote
   - Orders (Pesanan penjualan terkonfirmasi)
   - Invoices (Faktur penjualan)
   - Customers & Customer Tags
   - Work Order Users & Assignments
   - Currency / Mata uang
3. **`/inventory/v1`**:
   - Bahan mentah (Materials)
   - Kategori bahan & Satuan (UOM - Unit of Measure)
   - Vendor & Supplier
   - Batch tracking & Stock transactions
4. **`/user/v1`**:
   - User profile (`/users/me`)
   - Employee & Group management
   - Role-Based Access Control (RBAC) & Group Permissions
   - Tenant Bank Accounts (`/tenant-bank-accounts/me`)
   - Tenant Tokens (`/tenant-tokens/me`)
5. **`/storage/v1`**:
   - Asset dokumen, upload lampiran PO/Invoice/Produk
   - Bulk upload & Bulk delete
6. **`/notification/v1`**:
   - Tiket SSE realtime (`/notifications/events/ticket`)
   - Event streaming (`/notifications/events?ticket=...`)
   - Todo counts & Unread badges

---

## 4. Pola Komunikasi Realtime (SSE)

1. Client mengirimkan permintaan POST ke `/notification/v1/notifications/events/ticket` dengan cookie session yang valid.
2. Server mengembalikan token `ticket` (UUID).
3. Client membuka koneksi `EventSource` ke `/notification/v1/notifications/events?ticket={UUID}&lang=en` dengan `withCredentials: true`.
4. Server mengirimkan event broadcast terkait status order, todo approval, stok menipis, atau perubahan work order secara instan ke UI.
