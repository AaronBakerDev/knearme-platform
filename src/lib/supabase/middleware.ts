import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Check if request is for Payload CMS routes.
 * Payload routes should bypass Supabase auth as they have their own auth system.
 *
 * @see PAY-004 in PRD for acceptance criteria
 */
function isPayloadRoute(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/api/faqs') ||
    pathname.startsWith('/api/pricing-tiers') || pathname.startsWith('/api/users');
}

/**
 * Check if path should be checked for redirects.
 *
 * We skip:
 * - API routes (except /api/redirects/lookup could cause infinite loop)
 * - Static assets (_next, images, favicon)
 * - Payload admin routes
 * - Auth routes
 *
 * @see PAY-052 in PRD for acceptance criteria
 */
function shouldCheckRedirect(pathname: string): boolean {
  // Skip API routes
  if (pathname.startsWith('/api/')) return false
  // Skip Next.js internals
  if (pathname.startsWith('/_next/')) return false
  // Skip Payload admin
  if (pathname.startsWith('/admin')) return false
  // Skip static files
  if (pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf)$/)) return false
  // Skip auth callback
  if (pathname.startsWith('/auth/')) return false

  return true
}

/**
 * Check for CMS-managed redirects.
 *
 * Calls the /api/redirects/lookup endpoint to check if the current path
 * has a redirect configured in Payload CMS.
 *
 * @param request - The incoming request
 * @returns NextResponse redirect if found, null otherwise
 *
 * @see PAY-052 in PRD for acceptance criteria
 */
async function checkRedirect(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname

  // Skip paths that shouldn't be checked
  if (!shouldCheckRedirect(pathname)) {
    return null
  }

  try {
    // Build the lookup URL using the request's origin
    const lookupUrl = new URL('/api/redirects/lookup', request.nextUrl.origin)
    lookupUrl.searchParams.set('path', pathname)

    // Fetch redirect info from API
    const response = await fetch(lookupUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Short timeout to avoid blocking requests
      signal: AbortSignal.timeout(3000),
    })

    // No redirect found (404) or error
    if (!response.ok) {
      return null
    }

    const data = await response.json()

    // No redirect found
    if (!data.redirect) {
      return null
    }

    const { destination, type } = data.redirect

    // Build redirect URL
    let redirectUrl: URL
    if (destination.startsWith('http://') || destination.startsWith('https://')) {
      // External URL
      redirectUrl = new URL(destination)
    } else {
      // Internal path
      redirectUrl = new URL(destination, request.nextUrl.origin)
    }

    // Return redirect response with appropriate status code
    const statusCode = parseInt(type, 10)
    return NextResponse.redirect(redirectUrl, { status: statusCode })
  } catch (error) {
    // Log error but don't block the request
    console.error('[Middleware] Redirect check failed:', error)
    return null
  }
}

/**
 * Updates Supabase session in middleware.
 * Called on every request to refresh the session cookie if needed.
 *
 * Note: Payload CMS routes (/admin, /api/faqs, /api/pricing-tiers, /api/users)
 * are excluded from Supabase auth to avoid conflicts with Payload's own auth.
 *
 * Redirect checking (PAY-052):
 * Before processing auth, we check if the current path has a CMS-managed redirect.
 * This allows marketing to create redirects without code deploys.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 * @see PAY-052 in PRD for redirect acceptance criteria
 */
export async function updateSession(request: NextRequest) {
  // Check for CMS-managed redirects first
  const redirectResponse = await checkRedirect(request)
  if (redirectResponse) {
    return redirectResponse
  }

  // Skip Supabase auth for Payload CMS routes
  if (isPayloadRoute(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

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
