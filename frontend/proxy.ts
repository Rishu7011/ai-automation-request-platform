import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isPublicRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/api/auth');

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    // Admins go to the admin panel; all other users go to My Requests
    const role = (req.auth?.user as { role?: string } | null)?.role;
    const isAdmin = role === 'sys_admin' || role === 'eng_admin';
    return NextResponse.redirect(
      new URL(isAdmin ? '/admin/users' : '/my-requests', req.nextUrl)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
