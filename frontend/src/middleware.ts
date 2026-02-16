import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // First, handle i18n routing
  const intlResponse = intlMiddleware(request);

  // Check if the request is for admin routes (excluding login page)
  const isAdminRoute = pathname.match(/^\/[^\/]+\/admin/) && !pathname.includes('/admin/login');

  if (isAdminRoute) {
    // Get session token from cookies
    const sessionToken = request.cookies.get('admin_session');

    if (!sessionToken) {
      // Redirect to login if no session
      const locale = pathname.split('/')[1] || 'en';
      return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
    }

    try {
      // Verify the session token
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(sessionToken.value, secret);

      // Check if session has expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        // Session expired, redirect to login
        const locale = pathname.split('/')[1] || 'en';
        const response = NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
        response.cookies.delete('admin_session');
        response.cookies.delete('admin_user');
        return response;
      }

      // Session is valid, continue with i18n response
      return intlResponse;
    } catch (error) {
      // Invalid session token, redirect to login
      const locale = pathname.split('/')[1] || 'en';
      const response = NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
      response.cookies.delete('admin_session');
      response.cookies.delete('admin_user');
      return response;
    }
  }

  // Return i18n response for non-admin routes
  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
