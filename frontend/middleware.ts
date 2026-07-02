// middleware.ts — Comprehensive Role-Based Access Control (RBAC) & Route Protection
//
// Protects all private routes and enforces role accessibility:
//   • Public routes (/login, /register): accessible to unauthenticated users; authenticated users redirected to /my-requests.
//   • Employee / Requester routes (/my-requests, /ledger, /requests/[id], /intake/*): accessible to all active employees.
//   • Engineering Admin routes (/admin/requests, /admin/analytics): accessible to 'eng_admin' and 'sys_admin'.
//   • System Admin routes (/admin/users, /admin/settings/*, /admin/audit-log): strictly restricted to 'sys_admin'.
//
// Runs on Edge Runtime (reads session JWT from cookie without DB overhead).

import { auth } from './auth.config';
import { NextResponse } from 'next/server';

// Public routes accessible without authentication
const PUBLIC_PATHS = ['/login', '/register'];

// Routes strictly restricted to System Administrators ('sys_admin')
const SYS_ADMIN_ONLY_PATHS = ['/admin/users', '/admin/settings', '/admin/audit-log'];

// Routes accessible to both Engineering Admins ('eng_admin') and System Admins ('sys_admin')
const ADMIN_PATHS = ['/admin'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isSysAdminPath = SYS_ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  // ── 1. Unauthenticated User Protection ─────────────────────────────────────
  if (!session && !isPublic) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 2. Authenticated User Redirection from Auth Pages ─────────────────────
  if (session && isPublic) {
    return NextResponse.redirect(new URL('/my-requests', req.url));
  }

  // ── 3. Role-Based Access Control (RBAC) ───────────────────────────────────
  if (session) {
    const role = (session.user as unknown as { role?: string })?.role;

    // Strict Sys Admin restriction for user management, audit logs & system settings
    if (isSysAdminPath && role !== 'sys_admin') {
      // If eng_admin tries to access sys_admin settings/users, redirect to admin requests
      const fallbackUrl = role === 'eng_admin' ? '/admin/requests' : '/my-requests';
      return NextResponse.redirect(new URL(fallbackUrl, req.url));
    }

    // General Admin restriction for all /admin routes (requester & dept_reviewer blocked)
    if (isAdminPath && role !== 'eng_admin' && role !== 'sys_admin') {
      return NextResponse.redirect(new URL('/my-requests', req.url));
    }
  }

  return NextResponse.next();
});

// Apply middleware to all routes except Next.js internals, API routes, and static assets
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|css|js|map|woff|woff2|ttf|eot)$).*)',
  ],
};
