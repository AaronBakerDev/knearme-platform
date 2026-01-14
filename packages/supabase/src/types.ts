/**
 * Database types - placeholder until generated from Supabase
 *
 * Run `pnpm --filter @knearme/supabase generate-types` to regenerate
 * Or copy from apps/knearme-portfolio/src/types/database.ts
 */

// Re-export from the main app for now
// TODO: Generate these directly in this package
export type { Database } from '../../../apps/knearme-portfolio/src/types/database';

// Common type aliases for convenience
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
