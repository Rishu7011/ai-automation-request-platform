// proxy.ts — Route Protection
//
// Protects all private app routes using NextAuth session validation.
// Unauthenticated users are redirected to /login.
// Authenticated users are redirected away from public auth pages.
//
// Runs on the Edge Runtime (no DB calls — session is read from the JWT cookie).

import { auth } from './auth.config';
import { NextResponse } from 'next/server';

// Routes accessible without a session
const PUBLIC_PATHS = ['/login', '/register'];

// Routes that are only accessible to admins (eng_admin or sys_admin)
const ADMIN_ONLY_PATHS = ['/admin'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAdminPath = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));

  // ── Unauthenticated user trying to access a protected route ──────────────────
  if (!session && !isPublic) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Authenticated user trying to access a public auth page ───────────────────
  if (session && isPublic) {
    return NextResponse.redirect(new URL('/my-requests', req.url));
  }

  // ── RBAC: non-admin user trying to access an admin-only page ─────────────────
  if (session && isAdminPath) {
    const role = (session.user as unknown as { role?: string })?.role;
    if (role !== 'eng_admin' && role !== 'sys_admin') {
      // Redirect to their dashboard instead of showing a blank error
      return NextResponse.redirect(new URL('/my-requests', req.url));
    }
  }

  return NextResponse.next();
});

// Apply middleware/proxy to all routes except Next.js internals and static assets
export const config = {
  matcher: [
    /*
     * Match every route EXCEPT:
     *   - Next.js internal routes (_next/static, _next/image)
     *   - API routes (/api) — protected individually by session checks in each handler
     *   - Static files (favicon.ico, robots.txt, etc.)
     *   - Files served from /public (images, fonts, etc.) — these are served at the
     *     site root (e.g. public/logo.png -> /logo.png), so they're excluded here by
     *     matching any path that ends in a common static file extension.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|css|js|map|woff|woff2|ttf|eot)$).*)',
  ],
};
