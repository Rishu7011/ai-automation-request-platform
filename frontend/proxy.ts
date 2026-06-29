import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const role = (req.auth?.user as { role?: string } | null)?.role;
  const isAdmin = role === 'sys_admin' || role === 'eng_admin';

  const isPublicRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/api/auth');

  // 1. Unauthenticated users access protection
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 2. Already logged in users accessing auth pages redirect to main app
  if (isLoggedIn && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
    return NextResponse.redirect(
      new URL(isAdmin ? '/admin/requests' : '/my-requests', req.nextUrl)
    );
  }

  // 3. Admin-only route protection (/admin/*)
  if (isLoggedIn && pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/my-requests', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
