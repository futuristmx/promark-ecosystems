import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Brand ecosystem (client portal) routes ──────────────────────────────
  if (pathname.startsWith('/brand-ecosystem/')) {
    const segments = pathname.split('/');
    const slug = segments[2];

    // Allow login page without auth
    if (pathname.endsWith('/login')) {
      return NextResponse.next();
    }

    // Check for client JWT in cookie
    const clientToken = request.cookies.get('promark-client-token')?.value;
    if (!clientToken) {
      return NextResponse.redirect(
        new URL(`/brand-ecosystem/${slug}/login`, request.url)
      );
    }

    // Token exists — let the page verify it server-side
    return NextResponse.next();
  }

  // ─── API routes — pass through (individual routes handle auth) ───────────
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // ─── Promark login page — pass through ───────────────────────────────────
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // ─── All other routes (Promark internal: /dashboard, /tenants, etc.) ─────
  // Use Supabase session refresh to keep auth cookies alive
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
