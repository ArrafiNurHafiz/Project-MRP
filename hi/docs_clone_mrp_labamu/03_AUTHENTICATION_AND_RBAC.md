# AUTENTIKASI, SESI & ROLE-BASED ACCESS CONTROL (RBAC)
## Spesifikasi Lengkap Sistem Autentikasi Labamu MRP Clone

Dokumen ini menjelaskan implementasi otentikasi berbasis nomor WhatsApp OTP (seperti Labamu SSO di `sso.cashenable.com`), manajemen sesi JWT, serta pemetaan hak akses berbasis peran (RBAC).

---

## 1. Arsitektur Autentikasi (WhatsApp OTP Auth Flow)

```
[User Browser]             [MRP Next.js App]            [Auth/SSO Service]          [WhatsApp API / Gateway]
      |                            |                            |                              |
      | 1. Akses /login            |                            |                              |
      |--------------------------->|                            |                              |
      |                            | 2. Redirect ke SSO         |                              |
      |                            |--------------------------->|                              |
      | 3. Input No HP (851...)    |                            |                              |
      |-------------------------------------------------------->|                              |
      |                            |                            | 4. Generate OTP (mis: 123456)|
      |                            |                            |    Simpan di Redis (TTL 5m)  |
      |                            |                            | 5. Kirim Pesan OTP           |
      |                            |                            |----------------------------->|
      | 6. Terima WhatsApp OTP     |<----------------------------------------------------------|
      | 7. Input 6 Digit OTP       |                            |                              |
      |-------------------------------------------------------->|                              |
      |                            |                            | 8. Verifikasi OTP di Redis   |
      |                            |                            |    Generate JWT Token        |
      |                            | 9. Callback dengan Token   |                              |
      |                            |<---------------------------|                              |
      | 10. Set Cookie (HTTP-Only) |                            |                              |
      |<---------------------------|                            |                              |
      | 11. Masuk ke Dashboard (/) |                            |                              |
```

---

## 2. Struktur Payload JWT Token

Token sesi disimpan dalam HTTP-Only Cookie berlabel `session_token` dengan masa aktif 7 hari (dapat di-refresh):

```json
{
  "sub": "usr_9a8b7c6d-5e4f-3a2b-1c0d",
  "companyId": "cmp_11223344-5566-7788-99aa",
  "companyCode": "PLI",
  "companyName": "PT Presisi Logam Indonesia",
  "fullName": "Ryan Saputra",
  "phoneNumber": "+6285156197989",
  "role": "OWNER",
  "permissions": [
    "dashboard:view",
    "materials:read",
    "materials:write",
    "vendors:read",
    "vendors:write",
    "customers:read",
    "customers:write",
    "boms:read",
    "boms:write",
    "routing:read",
    "routing:write",
    "work_orders:read",
    "work_orders:write",
    "work_orders:allocate",
    "work_orders:complete",
    "rfq:read",
    "rfq:write",
    "quotes:read",
    "quotes:write",
    "orders:read",
    "orders:write",
    "invoices:read",
    "invoices:write",
    "purchase_orders:read",
    "purchase_orders:write",
    "reports:view_all",
    "settings:manage"
  ],
  "iat": 1758852000,
  "exp": 1759456800
}
```

---

## 3. Matriks Peran & Hak Akses (RBAC Matrix)

| Modul / Rute | Owner | Sales | Engineering | PPIC / Prod | Procurement | Warehouse | QC Inspector | Finance |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dashboard (`/`)** | Full | Sales KPI | Tech KPI | Prod KPI | PO KPI | Stock KPI | QC KPI | Finance KPI |
| **Materials (`/materials/`)** | Full | Read | Read | Read | Full | Full (Batch) | Read | Read |
| **Vendors (`/vendors/`)** | Full | Read | Read | Read | Full | Read | Read | Read |
| **Customers (`/customers/`)** | Full | Full | Read | Read | Read | Read | Read | Read |
| **RFQ (`/rfq/`)** | Full | Full | Read | Read | - | - | - | Read |
| **CPR (`/custom-products-request/`)** | Full | Read | Full | Read | Read | - | - | Read |
| **BOM & Routing (`/bill-of-materials/`)**| Full | Read | Full | Read | Read | - | - | Read |
| **Quotes (`/quotes/`)** | Full | Full | Read | Read | - | - | - | Read |
| **Sales Orders (`/orders/`)** | Full | Full | Read | Read | Read | Update Resi | - | Read |
| **Work Orders (`/work-orders/`)** | Full | Read | Read | Full | Read | Allocate | QC Approve | Read |
| **Material Requests (`/material-requests/`)** | Full | - | Read | Create | Full | Read | - | Read |
| **Purchase Orders (`/purchase-orders/`)**| Full | - | Read | Read | Full | Receive | - | Read |
| **Invoices (`/invoices/`)** | Full | Read | - | - | - | - | - | Full |
| **Financial Reports (`/reports/financial/`)**| Full | - | - | - | - | - | - | Full |
| **Company Settings & FX** | Full | - | - | - | - | - | - | Read |

---

## 4. Middleware Perlindungan Rute (Next.js Middleware Implementation)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/logout', '/success-login', '/api/auth', '/quote-approval'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Izinkan rute publik & microsite persetujuan pelanggan
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('session_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyJwt(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('session_token');
    return response;
  }

  // Inject user info ke request header untuk Server Components
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', payload.sub);
  requestHeaders.set('x-company-id', payload.companyId);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!api/public|_next/static|_next/image|favicon.ico).*)'],
};
```
