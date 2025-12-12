import type { NextRequest } from 'next/server';
import { updateSession } from './src/lib/supabase/middleware';

/**
 * Next.js Middleware entrypoint.
 *
 * Refreshes Supabase auth sessions and protects contractor routes.
 * See src/lib/supabase/middleware.ts for logic.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

