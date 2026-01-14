import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Validates required Supabase environment variables.
 * Throws a clear error if any are missing.
 */
function getSupabaseEnvVars(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
        'Please set it in your .env.local file.'
    );
  }

  if (!anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable. ' +
        'Please set it in your .env.local file.'
    );
  }

  return { url, anonKey };
}

/**
 * Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * Handles cookie management for session persistence.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseEnvVars();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from Server Components when we need to
            // refresh session cookies. This can safely be ignored if we have
            // middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase admin client with service role key.
 * Use only in secure server-side contexts for admin operations.
 *
 * WARNING: This bypasses Row Level Security - use with caution!
 */
export function createAdminClient() {
  const { url } = getSupabaseEnvVars();
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
        'Please set it in your .env.local file.'
    );
  }

  return createServerClient<Database>(
    url,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Admin client doesn't need cookies
        },
      },
    }
  );
}
