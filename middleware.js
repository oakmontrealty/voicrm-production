import { NextResponse } from 'next/server';

export function middleware(request) {
  try {
    const path = request.nextUrl.pathname;
    
    // Allow these paths without authentication
    if (
      path === '/login' ||
      path.startsWith('/api/auth') ||
      path.startsWith('/api/') ||
      path.startsWith('/_next') ||
      path.startsWith('/favicon') ||
      path.includes('.') ||
      path === '/'
    ) {
      return NextResponse.next();
    }
    
    // Check for auth cookie
    const authToken = request.cookies.get('auth-token');
    
    if (authToken && authToken.value === 'authenticated') {
      // User is logged in, allow access
      return NextResponse.next();
    }
    
    // Not logged in, redirect to login
    const loginUrl = new URL('/login', request.url);
    if (path !== '/') {
      loginUrl.searchParams.set('from', path);
    }
    
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, allow access to prevent blocking the site
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};