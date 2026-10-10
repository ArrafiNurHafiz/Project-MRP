# DESIGN SYSTEM, UI/UX KOMPONEN & TATA LETAK
## Design Tokens, Component Standards & Layout Specs for Labamu MRP Clone

Dokumen ini berisi spesifikasi visual, token warna Tailwind CSS, tipografi, struktur tata letak (sidebar & topbar), serta pola komponen UI yang digunakan pada Labamu MRP.

---

## 1. Palette Warna & Design Tokens

Labamu MRP menggunakan basis palet warna biru modern korporat yang bersih dengan kontras tinggi:

### A. Token Warna Utama (Tailwind CSS Config)
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        lb: {
          brand: '#006BFF',          // Warna Brand Biru Labamu
          'brand-hover': '#0056D2',
          'brand-light': '#006BFF0D', // Transparan 5% untuk menu aktif / hover
          surface: '#FFFFFF',
          'surface-grey': '#F8FAFC',
          'surface-card': '#FFFFFF',
          'line-1': '#E2E8F0',
          'line-2': '#CBD5E1',
          'on-surface-1': '#0F172A',  // Teks Utama (Hitam Pekat)
          'on-surface-2': '#475569',  // Teks Sekunder (Abu-abu)
          'on-surface-3': '#94A3B8',  // Teks Placeholder / Muted
          success: '#10B981',        // Status Approved / Completed
          warning: '#F59E0B',        // Status Pending / Warning
          danger: '#EF4444',         // Status Rejected / Overdue / Stock Risk
          info: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  }
}
```

---

## 2. Struktur Tata Letak Aplikasi (App Shell Layout)

```
+-----------------------------------------------------------------------------------------------+
| TOPBAR: [Logo MRP] | [Search Bar Ctrl+K] | [Language: EN/ID] | [Notif Bell (7)] | [User Profile]|
+-----------------------------------------------------------------------------------------------+
| SIDEBAR (Fixed 260px)        | MAIN CONTENT AREA (P-6, Max-W-7xl, Auto Scroll)                 |
|                              |                                                                |
| 📂 DASHBOARD                 |  Breadcrumbs: Home > Sales > Quotes                            |
|                              |                                                                |
| 📦 RESOURCES                 |  +-----------------------------------------------------------+ |
|   ├── Materials              |  | Page Header: Quotes                                       | |
|   ├── Vendors                |  | Subtitle: Manage and track your sales quotations          | |
|   └── Customers              |  | Action: [+ Create Quotation Button]                       | |
|                              |  +-----------------------------------------------------------+ |
| ⚙️ MANUFACTURING             |                                                                |
|   ├── Material Requests      |  +-----------------------------------------------------------+ |
|   ├── Bill of Materials (BOM)|  | Filter Bar: [Search...] [Status Filter] [Date Range]      | |
|   ├── Routing                |  +-----------------------------------------------------------+ |
|   └── Work Order             |                                                                |
|                              |  +-----------------------------------------------------------+ |
| 🛍️ PRODUCT                   |  | Data Table:                                               | |
|   ├── Product Catalog        |  | Quote No | Customer | Value | DP % | Status | Actions   | |
|   └── Custom Request (CPR)   |  | --------------------------------------------------------- | |
|                              |  | QUO-0045 | PT Maju  | 68.5M | 50%  | Apprv  | [Eye][PDF]| |
| 💼 SALES                     |  +-----------------------------------------------------------+ |
|   ├── RFQ                    |                                                                |
|   ├── Quotes                 |  Pagination: Showing 1-10 of 45 items | [Prev] 1 2 3 [Next]    |
|   ├── Orders                 |                                                                |
|   └── Invoices               |                                                                |
|                              |                                                                |
| 🛒 PROCUREMENT               |                                                                |
|   └── Purchase Orders        |                                                                |
|                              |                                                                |
| 📊 ANALYTICS                 |                                                                |
|   ├── Financial Report       |                                                                |
|   ├── Inventory Report       |                                                                |
|   ├── Sales Funnel           |                                                                |
|   ├── Work Order Monitor     |                                                                |
|   └── Procurement & AP       |                                                                |
|                              |                                                                |
| 🔧 ADMINISTRATION            |                                                                |
|   ├── User Management        |                                                                |
|   ├── FX Management          |                                                                |
|   └── Company Settings       |                                                                |
+-----------------------------------------------------------------------------------------------+
```

---

## 3. Spesifikasi Komponen UI Utama (Component Library)

### A. Status Badges
Setiap status memiliki warna badge khusus:
- **`APPROVED` / `COMPLETED` / `PAID`:**
  - `bg-emerald-50 text-emerald-700 border border-emerald-200`
- **`IN_PROGRESS` / `ON_SHIPPING` / `ALLOCATED`:**
  - `bg-blue-50 text-blue-700 border border-blue-200`
- **`PENDING` / `DRAFT` / `UNPAID`:**
  - `bg-amber-50 text-amber-700 border border-amber-200`
- **`REJECTED` / `CANCELLED` / `OVERDUE`:**
  - `bg-rose-50 text-rose-700 border border-rose-200`

### B. Tombol Aksi Utama (Buttons)
- **Primary Action Button:**
  - `bg-[#006BFF] hover:bg-[#0056D2] text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition-all active:scale-[0.98]`
- **Secondary / Outline Button:**
  - `border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-lg`
- **Destructive Button:**
  - `bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg`

### C. Tabel Data Interaktif (Data Tables)
- Header: `bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider py-3 px-4 border-b`
- Baris: `hover:bg-slate-50/80 transition-colors border-b text-slate-700 text-sm py-3 px-4`
- Sorting Icon: Panah naik/turun indikator kolom aktif.
- Empty State: Ilustrasi SVG kosong + judul *"No data found"* + tombol aksi tambah.
