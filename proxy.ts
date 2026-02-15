import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Skip auth when Supabase is not configured (demo mode with mock data)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Allow /login and /api/auth/* without auth
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    // Redirect authenticated users away from /login (unless access denied)
    if (user && pathname === '/login' && !request.nextUrl.searchParams.has('error')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  // Redirect unauthenticated users to /login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Restrict to specific email if configured (production only)
  const allowedEmail = process.env.ALLOWED_EMAIL;
  if (allowedEmail && process.env.NODE_ENV === 'production' && user.email !== allowedEmail) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'access_denied');
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest\\.json|sw\\.js).*)',
  ],
};
