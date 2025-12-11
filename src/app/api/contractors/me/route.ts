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
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import { slugify } from '@/lib/utils/slugify';
import type { Contractor } from '@/types/database';

/**
 * Validation schema for updating contractor profile.
 */
const updateContractorSchema = z.object({
  business_name: z.string().min(2).max(100).optional(),
  city: z.string().min(2).max(100).optional(),
  state: z.string().length(2).optional(),
  description: z.string().max(1000).optional(),
  services: z.array(z.string()).max(20).optional(),
  service_areas: z.array(z.string()).max(30).optional(),
  profile_photo_url: z.string().url().optional().nullable(),
});

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
    const supabase = await createClient();

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
    const supabase = await createClient();

    // Build update payload
    const updatePayload: Partial<Contractor> = { ...updates };

    // Regenerate city_slug if city or state changed
    const newCity = updates.city ?? contractor.city;
    const newState = updates.state ?? contractor.state;

    if (updates.city || updates.state) {
      if (newCity && newState) {
        updatePayload.city_slug = slugify(`${newCity}-${newState}`);
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
      console.error('[PATCH /api/contractors/me] Update error:', error);
      return handleApiError(error);
    }

    return apiSuccess({ contractor: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
