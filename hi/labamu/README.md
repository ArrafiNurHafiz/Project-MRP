# Dokumentasi Lengkap Sistem MRP Labamu (mrp.labamu.co.id)

Dokumentasi arsitektur, spesifikasi teknis, data dictionary, model database, panduan alur proses produksi dari awal sampai akhir, dan panduan cloning untuk sistem **Manufacturing Resource Planning (MRP) Labamu**.

---

## 📑 Struktur & Daftar Dokumen Lengkap

| File Dokumen | Topik & Cakupan |
|---|---|
| **[01_ARCHITECTURE_TECH_STACK.md](01_ARCHITECTURE_TECH_STACK.md)** | Arsitektur Frontend Next.js (App Router, Turbopack, Tailwind, Radix UI, TanStack Query, Zustand) & Gateway Microservices Backend (`mrp-api.cashenable.com`), serta komunikasi realtime SSE. |
| **[02_AUTHENTICATION_AND_SECURITY.md](02_AUTHENTICATION_AND_SECURITY.md)** | Mekanisme SSO terpusat (`sso.cashenable.com`), alur pengiriman dan verifikasi OTP (WhatsApp/SMS/Email), session cookie, serta matriks granular RBAC 5-level action (`READ`, `CREATE`, `UPDATE`, `DELETE`, `APPROVE`). |
| **[03_MODULES_AND_FEATURES.md](03_MODULES_AND_FEATURES.md)** | Spesifikasi mendalam untuk 30+ halaman aktif, form inputs, data tables, header kolom, status pills, dan fitur simulator. |
| **[04_API_SPECIFICATION.md](04_API_SPECIFICATION.md)** | Spesifikasi lengkap endpoint REST API (`/product/v1/*`, `/sales/v1/*`, `/inventory/v1/*`, `/user/v1/*`, `/storage/v1/*`, `/notification/v1/*`) dengan contoh response JSON riil. |
| **[05_DATABASE_AND_DATA_MODELS.md](05_DATABASE_AND_DATA_MODELS.md)** | Skema database PostgreSQL DDL lengkap (20+ tabel relasional dengan foreign key, UUID, dan constraints). |
| **[06_UI_UX_AND_PAGE_SPECIFICATION.md](06_UI_UX_AND_PAGE_SPECIFICATION.md)** | Design tokens, palet warna, tipografi, spesifikasi layout grid, header, sidebar, badge status, dan interaksi komponen. |
| **[07_CLONE_IMPLEMENTATION_GUIDE.md](07_CLONE_IMPLEMENTATION_GUIDE.md)** | Panduan arsitektur clone, struktur direktori proyek, dan roadmap fase implementasi untuk developer & AI. |
| **[08_DATA_DICTIONARY_AND_FORM_FIELDS.md](08_DATA_DICTIONARY_AND_FORM_FIELDS.md)** | Kamus data dan spesifikasi validasi form (Zod/Formik rules, min/max length, regex, auto-calculation formula) untuk seluruh form entri. |
| **[09_OFFICIAL_BUSINESS_WORKFLOW.md](09_OFFICIAL_BUSINESS_WORKFLOW.md)** | Panduan alur bisnis operasional resmi manufaktur 12 langkah (Master Data -> RFQ -> CPR -> Quote -> Order -> Work Order -> PO -> Invoice). |
| **[10_END_TO_END_PRODUCTION_PROCESS.md](10_END_TO_END_PRODUCTION_PROCESS.md)** | **Dokumentasi Detail Proses Produksi Dari Awal Sampai Akhir**: Persiapan master data, pemicu SO, alokasi bahan (Auto Allocate / Shortage PO), eksekusi lantai pabrik (In-house vs Subkontrak Maklon Finishing), QC, dampak pengurangan stok bahan & penambahan stok barang jadi. |

---

## 🔍 Ringkasan Sistem MRP Labamu

- **URL Aplikasi**: `https://mrp.labamu.co.id`
- **SSO Gateway**: `https://sso.cashenable.com`
- **API Gateway Backend**: `https://mrp-api.cashenable.com`
- **Tujuan Sistem**: Solusi ERP/MRP terintegrasi dari tahap Sales Quotation, Perencanaan Bahan Baku (BOM), Perintah Kerja Produksi (Work Order), Pengadaan Pemasok (Purchase Order), hingga Faktur Penagihan (Invoice) & Laporan Keuangan/Inventori.
