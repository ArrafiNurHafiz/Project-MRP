# 07. Panduan Implementasi Clone MRP Labamu

Panduan langkah-demi-langkah bagi pengembang untuk mereplikasi dan membangun sistem clone MRP Labamu.

---

## 1. Rekomendasi Tech Stack Clone

### Frontend
- **Framework**: Next.js 14/15 (App Router, React 19 / 18)
- **Styling**: Tailwind CSS + Shadcn UI (Radix UI)
- **State Management**: Zustand (Client state & Auth) + TanStack React Query v5 (Server state)
- **Form & Validation**: React Hook Form + Zod
- **Icons**: Lucide React
- **Table**: TanStack Table

### Backend (Pilihan Opsi)
- **Opsi A (Node.js / TypeScript)**: NestJS / Fastify + Prisma ORM + PostgreSQL
- **Opsi B (Go)**: Go Fiber / Gin + GORM + PostgreSQL
- **Opsi C (Fullstack Next.js)**: Next.js API Routes + Server Actions + Drizzle ORM + PostgreSQL

---

## 2. Struktur Folder Proyek Rekomendasi

```
labamu-mrp-clone/
├── apps/
│   ├── web/                     # Next.js Frontend
│   │   ├── app/
│   │   │   ├── (auth)/login/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── page.tsx               # Dashboard
│   │   │   │   ├── products/              # Katalog & Buat Produk
│   │   │   │   ├── rfq/                   # Request for Quotes
│   │   │   │   ├── quotes/                # Surat Penawaran
│   │   │   │   ├── orders/                # Sales Orders
│   │   │   │   ├── invoices/              # Faktur Tagihan
│   │   │   │   ├── customers/             # Pelanggan
│   │   │   │   ├── purchase-orders/       # Pengadaan PO
│   │   │   │   ├── materials/             # Bahan Baku
│   │   │   │   ├── vendors/               # Suplier
│   │   │   │   ├── bill-of-materials/     # Resep BOM
│   │   │   │   ├── routing/               # Jalur Produksi
│   │   │   │   ├── work-orders/           # Surat Perintah Kerja
│   │   │   │   ├── material-requests/     # Permintaan Bahan
│   │   │   │   ├── reports/               # Laporan Penjualan/Keuangan
│   │   │   │   ├── user-management/       # Grup Pengguna & RBAC
│   │   │   │   ├── company-settings/      # Profil Perusahaan
│   │   │   │   ├── fx-management/         # Kurs Mata Uang
│   │   │   │   └── order-simulation/      # Simulator Order
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                        # Button, Dialog, Card, Input
│   │   │   ├── layout/                    # Sidebar, Header, Breadcrumb
│   │   │   └── modules/                   # Komponen spesifik modul
│   │   ├── hooks/                         # useAuth, usePermissions, etc.
│   │   ├── lib/                           # axios/fetch client, utils
│   │   └── store/                         # Zustand stores
│   └── api/                     # Backend API Services
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── product/
│       │   │   ├── sales/
│       │   │   ├── inventory/
│       │   │   ├── manufacturing/
│       │   │   └── notification/
│       │   └── prisma/
│       └── package.json
└── README.md
```

---

## 3. Tahapan Implementasi (Roadmap Pengembangan)

### Fase 1: Fondasi & Auth RBAC
1. Setup database schema PostgreSQL (lihat `05_DATABASE_AND_DATA_MODELS.md`).
2. Implementasi login (Password/OTP) dan session cookie.
3. Buat middleware RBAC untuk memeriksa `access_path` (misal: `SALES:QUOTES`).

### Fase 2: Master Data
1. CRUD UOM & Kategori Bahan (`/materials/uom`, `/materials/categories`).
2. CRUD Materials & Vendors (`/materials`, `/vendors`).
3. CRUD Bill of Materials (BOM) (`/bill-of-materials`).
4. CRUD Products & Customers (`/products`, `/customers`).

### Fase 3: Siklus Penjualan (Sales Flow)
1. Modul RFQ (`/rfq`).
2. Modul Quotes dengan kalkulasi subtotal, diskon, PPN, dan print PDF penawaran (`/quotes`).
3. Konversi Quote menjadi Sales Order (`/orders`).
4. Pembuatan Invoice dari Sales Order & pencatatan pembayaran (`/invoices`).

### Fase 4: Siklus Manufaktur & Pengadaan
1. Order Simulation engine (`/order-simulation`) untuk menghitung kebutuhan bahan dari BOM.
2. Pembuatan Work Order (`/work-orders`) dan penugasan operator.
3. Material Request & Purchase Order (`/purchase-orders`) jika stok bahan di gudang kurang dari kebutuhan.
4. Update progres produksi hingga produk jadi masuk stok.

### Fase 5: Reporting & Realtime Notification
1. Laporan sales funnel, valuasi inventori, profitabilitas order.
2. Integrasi SSE (Server-Sent Events) untuk notifikasi penugasan dan alert stok minimum.
