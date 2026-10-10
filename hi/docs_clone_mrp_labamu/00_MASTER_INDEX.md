# DOKUMENTASI SISTEM & ARSITEKTUR CLONE: LABAMU MANUFACTURING (MRP)
## Master Blueprint, Skema Database & Buku Manual Operasional

**Target Sistem:** Labamu MRP (`https://mrp.labamu.co.id/`)  
**Auth / SSO Provider:** Labamu SSO (`https://sso.cashenable.com/`)  
**Tujuan Dokumen:** Spesifikasi teknis, arsitektur, dan panduan operasional 100% lengkap dan terperinci untuk mereplikasi serta mengoperasikan sistem MRP Labamu dari kondisi nol (*cold start*).

---

## 📚 STRUKTUR & DAFTAR LENGKAP BERKAS DOKUMENTASI

Seluruh berkas dokumentasi tersimpan di dalam direktori `docs_clone_mrp_labamu/` dan root workspace:

| No | File Dokumen | Isi & Fokus Utama |
| :---: | :--- | :--- |
| **00** | **`PANDUAN_PRAKTIS_KLIK_LABAMU_MRP.md`** *(Di Root)* | **Panduan Klik-demi-Klik untuk Orang Awam (13 Tahap Lengkap)**: Cara login, isi bahan, buat BOM, routing, RFQ, quote approval microsite, alokasi bahan, eksekusi in-house, subkontrak maklon, subkontrak turnkey, multi-vendor, QC, kirim barang, hingga tagih pelunasan. |
| **01** | **`flow.md`** *(Di Root)* | **Dokumentasi Resmi Alur Produksi & Subkontrak**: Sequence diagram, penanganan 2 jalur subkontrak (Maklon vs Turnkey), dan penanganan 1 barang dikerjakan banyak vendor (Sequential vs Split Batch). |
| **02** | **`docs_clone_mrp_labamu/00_MASTER_INDEX.md`** | Peta indeks umum, ringkasan arsitektur, dan direktori dokumen clone. |
| **03** | **`docs_clone_mrp_labamu/01_TECH_STACK_AND_ARCHITECTURE.md`** | Arsitektur sistem (Next.js 15, PostgreSQL, Redis, S3), integrasi SSO WhatsApp OTP, keamanan multi-tenant, & ACID guarantees. |
| **04** | **`docs_clone_mrp_labamu/02_DATABASE_SCHEMA_AND_MODELS.md`** | Skema basis data relasional lengkap **Prisma ORM (`schema.prisma`)**: Material, Batch Stok, BOM, Routing, RFQ, CPR, PO, Invoice, FX. |
| **05** | **`docs_clone_mrp_labamu/03_AUTHENTICATION_AND_RBAC.md`** | Alur WhatsApp OTP, struktur JWT Session Token, Next.js Middleware, dan Matriks RBAC 8 peran. |
| **06** | **`docs_clone_mrp_labamu/04_MODULE_SPECIFICATIONS_AND_ROUTES.md`** | Spesifikasi 29 modul/rute halaman: form input, tabel, modal dialog, filter, dan tombol aksi. |
| **07** | **`docs_clone_mrp_labamu/05_BUSINESS_LOGIC_AND_WORKFLOWS.md`** | State machine transaksi, formula matematis HPP/Margin/FX, algoritma *Auto-Allocation* stok FIFO, & Subkontrak. |
| **08** | **`docs_clone_mrp_labamu/06_API_ENDPOINTS_SPECIFICATIONS.md`** | Kontrak REST API / Server Actions payload (Request JSON, Query params, Response payload, error codes). |
| **09** | **`docs_clone_mrp_labamu/07_UI_UX_DESIGN_SYSTEM.md`** | Design tokens Tailwind CSS (`#006BFF`), App Shell layout, status badges, dan standar komponen visual. |
| **10** | **`docs_clone_mrp_labamu/08_PANDUAN_PROSES_PRODUKSI.md`** | Panduan operasional khusus divisi manufaktur/PPIC: Work Order, Auto Allocate, Routing In-house/Subkontrak, QC. |
| **11** | **`docs_clone_mrp_labamu/09_PANDUAN_SETUP_DARI_NOL_COLD_START.md`** | Panduan alur setup dan transaksi pertama kali saat database masih kosong. |
| **12** | **`docs_clone_mrp_labamu/10_BUKU_PANDUAN_OPERASIONAL_DETIL_STEP_BY_STEP.md`** | Buku Manual Operasional Super Detil (10 Bab Lengkap). |

---

## 🚀 RINGKASAN TEKNOLOGI UNTUK CLONE

- **Frontend:** Next.js 15 (App Router, Server Components), Tailwind CSS v4, Lucide Icons, Shadcn UI / Radix UI, TanStack Table & Query, Recharts.
- **Backend:** Next.js Server Actions / API Routes + PostgreSQL 16 + Prisma ORM.
- **Cache & Task Queue:** Redis + BullMQ (Task Queue alokasi stok, webhook, sinkronisasi kurs FX harian).
- **Storage & PDF:** AWS S3 / Cloudflare R2 + `@react-pdf/renderer` (Cetak Surat Jalan, PO, Quotation, Invoices).
- **Auth:** WhatsApp OTP Service (Fonnte / Wablas / Twilio) + JWT HTTP-Only Secure Cookies.
