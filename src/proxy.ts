import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Public routes — mirrors (public) route group in src/app/
// Update both when adding new public pages.
const PUBLIC_PATHS = ['/login', '/docs', '/api/auth'];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
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

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    if (user && pathname === '/login' && !request.nextUrl.searchParams.has('error')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  if (!user && process.env.NODE_ENV === 'production') {
    // API routes get JSON 401; page navigations redirect to login
    if (pathname.startsWith('/api/')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const allowedEmail = process.env.ALLOWED_EMAIL;
  if (allowedEmail && process.env.NODE_ENV === 'production' && user && user.email !== allowedEmail) {
    if (pathname.startsWith('/api/')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
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
