import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Updates Supabase session in middleware.
 * Called on every request to refresh the session cookie if needed.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session - important for keeping session alive
  // Don't use supabase.auth.getUser() directly in middleware
  // as it can cause issues with session refresh
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect contractor routes - redirect to login if not authenticated
  const isContractorRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/projects') ||
    request.nextUrl.pathname.startsWith('/profile');

  if (isContractorRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const getSafeRedirect = (requestToCheck: NextRequest) => {
    const redirectParam = requestToCheck.nextUrl.searchParams.get('redirect') ??
      requestToCheck.nextUrl.searchParams.get('next');

    if (!redirectParam) return null;
    if (!redirectParam.startsWith('/')) return null;
    if (redirectParam.startsWith('//')) return null;
    if (redirectParam.includes('://')) return null;

    return redirectParam;
  };

  // Redirect authenticated users away from auth pages
  const authRoutes = new Set([
    '/login',
    '/signup',
    '/reset-password',
    '/reset-password/confirm',
  ]);
  const isAuthRoute = authRoutes.has(request.nextUrl.pathname);

  if (isAuthRoute && user) {
    const safeRedirect = getSafeRedirect(request);
    const target = safeRedirect ?? '/dashboard';
    return NextResponse.redirect(new URL(target, request.nextUrl.origin));
  }

  return supabaseResponse;
}
