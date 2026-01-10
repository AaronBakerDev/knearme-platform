/**
 * Current Contractor API - Get and update authenticated contractor's profile.
 *
 * GET   /api/contractors/me - Get current contractor profile
 * PATCH /api/contractors/me - Update profile fields
 *
 * @see /docs/02-requirements/capabilities.md AUTH capabilities
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import { slugify } from '@/lib/utils/slugify';
import { logger } from '@/lib/logging';
import type { Contractor, Database } from '@/types/database';

/**
 * Validation schema for updating contractor profile.
 */
const updateContractorSchema = z.object({
  business_name: z.string().min(2).max(100).optional(),
  profile_slug: z.string().min(2).max(100).optional(),
  address: z.string().max(200).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  website: z.string().max(200).optional().nullable(),
  city: z.string().min(2).max(100).optional(),
  state: z.string().length(2).optional(),
  description: z.string().max(1000).optional(),
  services: z.array(z.string()).max(20).optional(),
  service_areas: z.array(z.string()).max(30).optional(),
  profile_photo_url: z.string().url().optional().nullable(),
});

/**
 * Find a unique profile slug for a contractor using a single SQL query.
 * CT-1 FIX: Replaced N+1 loop (up to 50 queries) with single query.
 *
 * Algorithm:
 * 1. Query all slugs matching pattern: baseSlug OR baseSlug-N
 * 2. Find highest existing suffix
 * 3. Return baseSlug if available, otherwise baseSlug-(max+1)
 */
async function findUniqueProfileSlug(
  supabase: SupabaseClient<Database>,
  baseSlug: string,
  contractorId: string
): Promise<string> {
  // Single query: find all slugs starting with baseSlug
  const { data: existingSlugs, error } = await supabase
    .from('contractors')
    .select('profile_slug')
    .neq('id', contractorId)
    .or(`profile_slug.eq.${baseSlug},profile_slug.like.${baseSlug}-%`)
    .limit(100);

  if (error) {
    logger.error('[findUniqueProfileSlug] Query error', { error });
    // Fallback to random suffix on error
    return `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  // If no conflicts, use the base slug
  if (!existingSlugs || existingSlugs.length === 0) {
    return baseSlug;
  }

  // Build set of taken slugs for O(1) lookup
  const slugStrings = existingSlugs
    .map((row: { profile_slug: string | null }) => row.profile_slug)
    .filter((s: string | null): s is string => typeof s === 'string');
  const takenSlugs = new Set<string>(slugStrings);

  // If base slug is available, use it
  if (!takenSlugs.has(baseSlug)) {
    return baseSlug;
  }

  // Find highest suffix and return next
  let maxSuffix = 1;
  for (const slug of slugStrings) {
    const match = slug.match(new RegExp(`^${baseSlug}-(\\d+)$`));
    if (match && match[1]) {
      maxSuffix = Math.max(maxSuffix, parseInt(match[1], 10));
    }
  }

  return `${baseSlug}-${maxSuffix + 1}`;
}

/**
 * GET /api/contractors/me
 *
 * Get the authenticated contractor's full profile.
 * Includes computed fields like project counts.
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { contractor } = auth;
    const supabase = (await createClient()) as SupabaseClient<Database>;

    // Get project counts for stats
    const { count: totalProjects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('contractor_id', contractor.id);

    const { count: publishedProjects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('contractor_id', contractor.id)
      .eq('status', 'published');

    return apiSuccess({
      contractor,
      stats: {
        total_projects: totalProjects ?? 0,
        published_projects: publishedProjects ?? 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/contractors/me
 *
 * Update the authenticated contractor's profile.
 * Automatically regenerates city_slug when city/state changes.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { contractor } = auth;

    // Parse and validate body
    const body = await request.json();
    const parsed = updateContractorSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid profile data', {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const updates = parsed.data;
    const supabase = (await createClient()) as SupabaseClient<Database>;

    // Build update payload
    const updatePayload: Partial<Contractor> = { ...updates };
    delete updatePayload.profile_slug;

    // Regenerate city_slug if city or state changed
    const newCity = updates.city ?? contractor.city;
    const newState = updates.state ?? contractor.state;

    if (updates.city || updates.state) {
      if (newCity && newState) {
        updatePayload.city_slug = slugify(`${newCity}-${newState}`);
      }
    }

    // Generate or update profile_slug from business_name or provided slug
    const desiredSlugSource =
      updates.profile_slug ||
      updates.business_name ||
      (!contractor.profile_slug ? contractor.business_name : undefined);

    if (desiredSlugSource) {
      const baseSlug = slugify(desiredSlugSource);
      if (baseSlug && baseSlug !== contractor.profile_slug) {
        updatePayload.profile_slug = await findUniqueProfileSlug(
          supabase,
          baseSlug,
          contractor.id
        );
      }
    }

    // Update contractor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase as any)
      .from('contractors')
      .update(updatePayload)
      .eq('id', contractor.id)
      .select('*')
      .single();

    if (error) {
      logger.error('[PATCH /api/contractors/me] Update error', { error });
      return handleApiError(error);
    }

    // CT-3 FIX: Removed bidirectional sync to businesses table.
    // Businesses table is now the source of truth. Updates to contractors
    // are allowed for backward compatibility but do NOT sync to businesses.
    // Use /api/businesses/me for canonical updates (which syncs TO contractors).

    return apiSuccess({ contractor: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
