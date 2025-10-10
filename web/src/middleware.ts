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

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
