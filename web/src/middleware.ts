// Temporarily disabled next-intl middleware to fix routing issues
// TODO: Re-enable after fixing page structure for i18n
// import createMiddleware from 'next-intl/middleware';
// import { locales, defaultLocale } from './i18n/config';

// export default createMiddleware({
//   locales,
//   defaultLocale,
//   localePrefix: 'never'
// });

// export const config = {
//   matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
// };

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/landing',
  '/pricing',
  '/privacy',
  '/terms',
  '/support',
  '/',
];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_vercel') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth verification cookie
  const authCookie = request.cookies.get('auth_verified');
  const hasValidSession = authCookie?.value === 'true';

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // Check if route is an auth page
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // If user is authenticated and trying to access auth pages, redirect to home ("/")
  // BUT allow /auth/register even when a cookie is present, so landing CTA always shows the register flow
  if (hasValidSession && isAuthRoute && !pathname.startsWith("/auth/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If user is not authenticated and trying to access protected route, redirect to login
  if (!hasValidSession && !isPublicRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
