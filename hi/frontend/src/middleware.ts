import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || 'localhost:3000';

  // 1. Dapatkan subdomain
  // Contoh hostname: "admin.mrp.emtku.co.id", "kwas.mrp.emtku.co.id", "admin.localhost:3000"
  let currentHost = hostname.replace(`:${url.port}`, '');

  // Deteksi Subdomain khusus Admin SaaS Central (admin.* atau super.*)
  const isSuperAdminSubdomain =
    currentHost.startsWith('admin.') ||
    currentHost.startsWith('super.') ||
    url.searchParams.get('portal') === 'admin';

  // Header identitas tenant ke downstream request
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-url-host', currentHost);

  if (isSuperAdminSubdomain) {
    requestHeaders.set('x-saas-portal', 'superadmin');
  }

  // Rewrite / routing jika mengakses subdomain admin langsung
  if (isSuperAdminSubdomain && url.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard/tenants', req.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
