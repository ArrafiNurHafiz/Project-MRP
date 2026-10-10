# 06. UI/UX & Spesifikasi Halaman Labamu MRP

Dokumen panduan antarmuka (Design System, tata letak, warna, tipografi, dan interaksi komponen).

---

## 1. Design Tokens & Visual Hierarchy

### Palet Warna Utama
- **Primary Brand**: `#1476FF` (Labamu Blue / `bg-blue-600` to `from-blue-600 to-indigo-600`)
- **Primary Hover**: `#005CE6` (`hover:bg-blue-700`)
- **Background App**: `#F8FAFC` (Slate-50) / `#F9FAFB` (Gray-50)
- **Card Background**: `#FFFFFF` dengan shadow lembut (`shadow-sm`, `rounded-xl`, `border border-gray-100`)
- **Sidebar Background**: `#FFFFFF` dengan border kanan `#E2E8F0`
- **Text Primary**: `#0F172A` (Slate-900 / Gray-900)
- **Text Muted/Secondary**: `#64748B` (Slate-500 / Gray-600)
- **Border**: `#E2E8F0` (Slate-200)

### Status Badges Color Map
- `ACTIVE` / `COMPLETED` / `PAID`: `bg-emerald-50 text-emerald-700 border-emerald-200`
- `IN_PROGRESS` / `PARTIAL`: `bg-blue-50 text-blue-700 border-blue-200`
- `DRAFT` / `PLANNED`: `bg-slate-100 text-slate-700 border-slate-200`
- `REJECTED` / `CANCELLED` / `OVERDUE`: `bg-rose-50 text-rose-700 border-rose-200`
- `BETA Badge`: `bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded`

### Tipografi
- **Headings & Display**: `Inter, sans-serif` (Semi-bold / Bold, tracking-tight)
- **Body & Data Tables**: `Lato, Inter, sans-serif` (Regular 14px/15px, tabular nums untuk angka mata uang dan jumlah)

---

## 2. Layout & Shell Aplikasi

### Struktur Grid Halaman Utama
```
+-------------------------------------------------------------------------+
| [Sidebar Navigation] (W: 260px)   | [Top Header Bar] (H: 64px)          |
| - Logo: Labamu Manufacturing      | - Breadcrumbs                       |
| - Menu Accordions:                | - Language Selector (EN/ID)         |
|   * Dashboard                     | - Notification Bell (Badge counter) |
|   * Resources                     | - User Avatar & Tenant switcher     |
|   * Manufacturing                 +-------------------------------------+
|   * Product                       | [Main Content Area]                 |
|   * Sales                         | - Page Title & Action Buttons       |
|   * Procurement                   | - Filter Bar (Search, Status, Date) |
|   * Analytics                     | - Data Table / Cards Grid           |
|   * Administration                | - Pagination Controls               |
|   * Help / User Guide             |                                     |
+-----------------------------------+-------------------------------------+
```

---

## 3. Spesifikasi Komponen Utama

### 3.1 Data Table (Tabel Manajemen)
- **Header**: Sticky header dengan sort indicator (ikon panah).
- **Row Hover**: `hover:bg-slate-50/80 transition-colors`.
- **Action Column**: Dropdown menu tiga titik (`MoreVertical` icon) berisi opsi *View Details*, *Edit*, *Duplicate*, *Delete*, *Print/Export PDF*.
- **Empty State**: Ilustrasi SVG minimalis + judul "No data found" + tombol CTA "Create New".

### 3.2 Form & Input Field
- Input teks dengan label di atas, border `#CBD5E1`, focus ring `#1476FF`.
- Select dropdown dengan fitur search (Combobox berbasis Radix Popover).
- Currency input otomatis memformat format Rupiah (`Rp 15.000,00`).
- Date picker kalender range.

### 3.3 Dynamic Form Item List (BOM & Quote Items)
- Baris tabel dinamis untuk menambahkan beberapa komponen bahan baku atau produk sekaligus.
- Tombol "+ Add Item" di bawah tabel.
- Kolom Subtotal, Pajak, dan Grand Total yang terkalkulasi otomatis secara reactive.
