/**
 * Current Business API - Get and update authenticated business profile.
 *
 * GET   /api/businesses/me - Get current business profile
 * PATCH /api/businesses/me - Update profile fields
 *
 * This is the canonical endpoint for business profiles.
 * Updates sync to legacy contractors table for backward compatibility.
 *
 * @see /docs/02-requirements/capabilities.md AUTH capabilities
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import { logger } from '@/lib/logging';
import { slugify } from '@/lib/utils/slugify';
import type { Business, BusinessUpdate, Contractor, ContractorUpdate, Json } from '@/types/database';

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Validation schema for updating business profile.
 */
const updateBusinessSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).optional(),
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
  // Agentic JSONB fields
  location: z.record(z.string(), z.unknown()).optional(),
  understanding: z.record(z.string(), z.unknown()).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  discovered_data: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Find a unique slug for a business using a single SQL query.
 * BE-3 FIX: Replaced N+1 loop (up to 50 queries) with single query.
 *
 * Algorithm:
 * 1. Query all slugs matching pattern: baseSlug OR baseSlug-N
 * 2. Find highest existing suffix
 * 3. Return baseSlug if available, otherwise baseSlug-(max+1)
 */
async function findUniqueSlug(
  supabase: AdminClient,
  baseSlug: string,
  businessId: string
): Promise<string> {
  // Single query: find all slugs starting with baseSlug
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingSlugsData, error } = await (supabase as any)
    .from('businesses')
    .select('slug')
    .neq('id', businessId)
    .or(`slug.eq.${baseSlug},slug.like.${baseSlug}-%`)
    .limit(100);

  const existingSlugs = existingSlugsData as Array<{ slug: string | null }> | null;

  if (error) {
    logger.error('[findUniqueSlug] Query error', { error });
    // Fallback to random suffix on error
    return `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  // If no conflicts, use the base slug
  if (!existingSlugs || existingSlugs.length === 0) {
    return baseSlug;
  }

  // Build set of taken slugs for O(1) lookup
  const slugStrings = (existingSlugs ?? [])
    .map((row) => row.slug)
    .filter((s): s is string => typeof s === 'string');
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
 * GET /api/businesses/me
 *
 * Get the authenticated user's business profile.
 * Includes computed fields like project counts.
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { user } = auth;
    const supabase = await createClient();

    // Get business profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: businessData, error: businessError } = await (supabase as any)
      .from('businesses')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    const business = businessData as Business | null;

    if (businessError || !business) {
      // Fallback: check if there's a contractor record we can use
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: contractorData } = await (supabase as any)
        .from('contractors')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      const contractor = contractorData as Contractor | null;

      if (contractor) {
        // Return contractor data in business shape for compatibility
        return apiSuccess({
          business: {
            id: contractor.id,
            auth_user_id: contractor.auth_user_id,
            email: contractor.email,
            name: contractor.business_name,
            slug: contractor.profile_slug,
            profile_photo_url: contractor.profile_photo_url,
            city: contractor.city,
            state: contractor.state,
            city_slug: contractor.city_slug,
            services: contractor.services,
            service_areas: contractor.service_areas,
            description: contractor.description,
            plan_tier: 'free',
            legacy_contractor_id: contractor.id,
            created_at: contractor.created_at,
            updated_at: contractor.updated_at,
          },
          stats: { total_projects: 0, published_projects: 0 },
          _source: 'contractor_fallback',
        });
      }

      return apiError('NOT_FOUND', 'Business profile not found');
    }

    // Get project counts for stats (use business_id)
    const { count: totalProjects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id);

    const { count: publishedProjects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .eq('status', 'published');

    return apiSuccess({
      business,
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
 * PATCH /api/businesses/me
 *
 * Update the authenticated user's business profile.
 * Automatically regenerates city_slug when city/state changes.
 * Syncs updates to legacy contractors table for backward compatibility.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { user } = auth;

    // Parse and validate body
    const body = await request.json();
    const parsed = updateBusinessSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid profile data', {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const updates = parsed.data;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get current business
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentBusinessData, error: fetchError } = await (supabase as any)
      .from('businesses')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (fetchError || !currentBusinessData) {
      return apiError('NOT_FOUND', 'Business profile not found');
    }

    const business = currentBusinessData as Business;

    // Build update payload
    const updatePayload: BusinessUpdate = { ...updates } as BusinessUpdate;
    delete updatePayload.slug; // Handle slug separately

    // Regenerate city_slug if city or state changed
    const newCity = updates.city ?? business.city;
    const newState = updates.state ?? business.state;

    if (updates.city || updates.state) {
      if (newCity && newState) {
        updatePayload.city_slug = slugify(`${newCity}-${newState}`);
      }
    }

    // Update location JSONB if city/state/service_areas changed
    if (updates.city || updates.state || updates.service_areas) {
      const existingLocation = (typeof business.location === 'object' && business.location !== null)
        ? business.location as Record<string, unknown>
        : {};
      updatePayload.location = {
        ...existingLocation,
        city: newCity,
        state: newState,
        city_slug: updatePayload.city_slug || business.city_slug,
        service_areas: updates.service_areas ?? business.service_areas,
      } as Json;
    }

    // Update understanding JSONB if services changed
    if (updates.services) {
      const existingUnderstanding = (typeof business.understanding === 'object' && business.understanding !== null)
        ? business.understanding as Record<string, unknown>
        : {};
      updatePayload.understanding = {
        ...existingUnderstanding,
        specialties: updates.services,
      } as Json;
    }

    // Generate or update slug from name or provided slug
    const desiredSlugSource =
      updates.slug ||
      updates.name ||
      (!business.slug ? business.name : undefined);

    if (desiredSlugSource) {
      const baseSlug = slugify(desiredSlugSource);
      if (baseSlug && baseSlug !== business.slug) {
        updatePayload.slug = await findUniqueSlug(
          adminClient,
          baseSlug,
          business.id
        );
      }
    }

    // Update business
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase as any)
      .from('businesses')
      .update(updatePayload)
      .eq('id', business.id)
      .select('*')
      .single();

    if (error) {
      logger.error('[PATCH /api/businesses/me] Update error', { error });
      return handleApiError(error);
    }

    // Sync to legacy contractors table for backward compatibility
    if (business.legacy_contractor_id) {
      try {
        const contractorUpdates: ContractorUpdate = {};
        if (typeof updates.name !== 'undefined') {
          contractorUpdates.business_name = updates.name;
        }
        if (typeof updates.slug !== 'undefined' || updatePayload.slug) {
          contractorUpdates.profile_slug = updatePayload.slug || updates.slug;
        }
        if (typeof updates.city !== 'undefined') {
          contractorUpdates.city = updates.city;
        }
        if (typeof updates.state !== 'undefined') {
          contractorUpdates.state = updates.state;
        }
        if (updatePayload.city_slug) {
          contractorUpdates.city_slug = updatePayload.city_slug;
        }
        if (typeof updates.description !== 'undefined') {
          contractorUpdates.description = updates.description;
        }
        if (typeof updates.services !== 'undefined') {
          contractorUpdates.services = updates.services;
        }
        if (typeof updates.service_areas !== 'undefined') {
          contractorUpdates.service_areas = updates.service_areas;
        }
        if (typeof updates.profile_photo_url !== 'undefined') {
          contractorUpdates.profile_photo_url = updates.profile_photo_url;
        }

        if (Object.keys(contractorUpdates).length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (adminClient as any)
            .from('contractors')
            .update(contractorUpdates)
            .eq('id', business.legacy_contractor_id);
        }
      } catch (syncError) {
        logger.warn('[PATCH /api/businesses/me] Contractor sync skipped', { error: syncError });
      }
    }

    return apiSuccess({ business: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
