/**
 * @knearme/supabase - Shared Supabase configuration and types
 *
 * This package provides:
 * - Database types (generated from Supabase schema)
 * - Shared configuration helpers
 *
 * Framework-specific client creation (Next.js cookies, etc.)
 * stays in each app's lib/supabase directory.
 */

export * from './types';
export * from './config';
