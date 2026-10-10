# ARSITEKTUR SISTEM & SPESIFIKASI TEKNOLOGI (TECH STACK)
## Labamu MRP Clone Architecture Blueprint

Dokumen ini mendefinisikan arsitektur sistem, infrastruktur, pilihan teknologi, dan aliran data untuk mereplikasi sistem Labamu Manufacturing Resource Planning (MRP).

---

## 1. Topologi Arsitektur Tingkat Tinggi (High-Level Architecture)

```
                       +-----------------------------------+
                       |      Web Client (Desktop/Mobile)  |
                       +-----------------+-----------------+
                                         |
                                         | HTTPS (Next.js App / CDN)
                                         v
                       +-----------------------------------+
                       |    Reverse Proxy / Load Balancer  |
                       |       (Nginx / Istio Envoy / Caddy)|
                       +-----------------+-----------------+
                                         |
                     +-------------------+-------------------+
                     |                                       |
                     v                                       v
      +-----------------------------+         +-----------------------------+
      |      Frontend & BFF         |         |      Auth / SSO Service     |
      |   Next.js 15 (App Router)   |<------->|    (WhatsApp / Email OTP)   |
      +--------------+--------------+         +--------------+--------------+
                     |                                       |
                     | Internal RPC / Server Actions         | JWT / Token Verify
                     v                                       v
      +-------------------------------------------------------------+
      |                     Core Backend Services                   |
      |  - Sales & RFQ / Quotation Engine                           |
      |  - Engineering & BOM / CPR Engine                           |
      |  - Production, Routing & Work Order Engine                  |
      |  - Procurement & Inventory (Stock Batch, ABC) Engine        |
      |  - Finance, Invoicing & FX Rate Engine                      |
      +--------------+------------------------------+---------------+
                     |                              |
                     v                              v
      +-----------------------------+  +-----------------------------+
      |    PostgreSQL Database      |  |    Redis Cache & Pub/Sub    |
      |  (ACID Relational Storage)  |  |  (Session, Locks, Queues)   |
      +-----------------------------+  +-----------------------------+
                     |
                     v
      +-----------------------------+
      |  Object Storage (S3/MinIO)  |
      |  (Attachments, Drawings, PDF)|
      +-----------------------------+
```

---

## 2. Pilihan Teknologi (Recommended Tech Stack)

### A. Frontend Layer
- **Framework:** Next.js 15 (React 19, App Router, React Server Components).
- **Styling:** Tailwind CSS v4 / v3.4 dengan class konfigurasi kustom (warna primer `#006BFF`).
- **Komponen UI:** Radix UI Primitives / Shadcn UI (Dialog, DropdownMenu, Popover, Tabs, Tooltip, Select, Command).
- **Icons:** Lucide React.
- **Form Handling:** `react-hook-form` + `@hookform/resolvers` + `zod` untuk validasi schema di client dan server.
- **Tabel & Data Grid:** `@tanstack/react-table` (sorting, filtering, pagination, selection).
- **Visualisasi & Grafik:** `recharts` untuk Analytics & Monitoring.
- **Client State / Cache:** `@tanstack/react-query` + `zustand` (untuk state sidebar, filter global, draft form).

### B. Backend Layer
- **Pilihan 1 (Monolith Terpadu):** Next.js Server Actions + API Route Handlers dengan Prisma / Drizzle ORM.
- **Pilihan 2 (Modular Service):** NestJS (TypeScript) atau Go (Fiber / Gin) untuk backend REST/gRPC terpisah, Next.js murni untuk presentation layer.
- **Validasi Data:** Zod / Class-Validator.
- **Background Jobs & Scheduler:** BullMQ / Redis worker (untuk sinkronisasi FX harian, kalkulasi auto-allocate, pengiriman webhook/notifikasi WA/Email).
- **PDF Generation:** `@react-pdf/renderer` atau Puppeteer Chromium headless untuk render PDF Quotation, Work Order, Surat Jalan, Purchase Order, dan Invoice.

### C. Database & Storage Layer
- **Database Utama:** PostgreSQL 16+ (mendukung relasi kompleks, indexing B-Tree & GIN, JSONB untuk spesifikasi teknis dinamis, dan transaksi ACID ketat).
- **In-Memory Cache:** Redis 7+ (Rate limiting OTP, caching session token, mutex lock pada saat alokasi stok batch).
- **File Storage:** AWS S3 / Cloudflare R2 / MinIO (Penyimpanan gambar teknis CPR, lampiran RFQ, bukti transfer, dan cetakan PDF).

---

## 3. Integrasi Single Sign-On (SSO) & Alur Autentikasi

Labamu MRP menggunakan eksternal SSO (`sso.cashenable.com`). Pada versi clone, dapat diimplementasikan baik sebagai layanan SSO terpisah atau modul Auth internal:

### Alur Kerja Auth:
1. **Inisiasi:** Pengguna membuka `/login/` -> Klik "Continue with Labamu".
2. **Redirect SSO:** Pengguna dialihkan ke portal SSO dengan parameter `?fallback_url_success=...&from=MRP`.
3. **Input Nomor Telepon:** Format internasional `+628xxxxxxxxxx`.
4. **Verifikasi OTP:**
   - Provider mengirim 6-digit OTP via WhatsApp API (misal: Fonnte, Wablas, Twilio, atau Qiscus).
   - Fallback kirim OTP via Email / SMS jika WA gagal.
5. **Penerbitan Token:**
   - Setelah 6-digit OTP valid, SSO menerbitkan JWT Session Token yang memuat `userId`, `companyId`, `role`, dan `permissions`.
6. **Redirect Kembali ke MRP:** Pengguna diarahkan ke `https://mrp.domain.com/success-login?token=...` -> Token disimpan dalam HTTP-Only Secure Cookie `session_token`.
7. **Middleware Next.js:** Setiap request dicek validitas JWT-nya dan hak akses perannya.

---

## 4. Keamanan Sistem & Standar Transaksi (Security & ACID Guarantees)

1. **Pencegahan Race Condition pada Stok (Stock Concurrency):**
   - Menggunakan PostgreSQL `SELECT ... FOR UPDATE` saat Work Order mengeksekusi `Auto Allocate` atau saat Sales Order memotong stok barang jadi.
2. **Multi-Tenancy Isolation:**
   - Setiap tabel memiliki kolom `company_id`. Seluruh query SQL di-filter berdasarkan `company_id` dari session JWT aktif.
3. **Audit Log & Provenance:**
   - Tabel `audit_logs` mencatat setiap perubahan status kritis (Quotation disetujui, Work Order selesai, PO diterima, Pembayaran diverifikasi).
4. **Role-Based Access Control (RBAC):**
   - 8 Role bawaan: `Owner`, `Engineering`, `PPIC/Production`, `Sales/Marketing`, `Procurement`, `Warehouse`, `QC/Inspector`, `Finance/Accounting`.
