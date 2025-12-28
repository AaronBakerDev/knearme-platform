/**
 * Project Publish API - Publish or unpublish a project.
 *
 * POST /api/projects/[id]/publish - Publish a draft project
 * DELETE /api/projects/[id]/publish - Unpublish (revert to draft)
 *
 * @see /docs/02-requirements/user-journeys.md J3
 */

import { NextRequest } from 'next/server';
import { requireAuthUnified, isAuthError, getAuthClient } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import { composeProjectDescription } from '@/lib/projects/compose-description';
import { trackProjectPublished } from '@/lib/observability/kpi-events';
import type { ProjectWithImages } from '@/types/database';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/publish
 *
 * Publish a project, making it visible on the public portfolio.
 * Validates that the project has required content before publishing.
 *
 * Query Parameters:
 * - dry_run=true: Only validate without publishing, returns { valid, missing }
 *
 * Requirements for publishing:
 * - title
 * - project type + slug
 * - city + state
 * - hero image (auto-set to first upload if missing)
 * - at least 1 image
 *
 * @see Issue #6 in todo/ai-sdk-phase-6-edit-mode.md for dry_run implementation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthUnified();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { id } = await params;
    const { contractor } = auth;
    const supabase = await getAuthClient(auth);

    // Issue #6: Support dry_run parameter for validation-only checks
    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dry_run') === 'true';

    // Get project with images to validate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error: fetchError } = await (supabase as any)
      .from('projects')
      .select('*, project_images!project_images_project_id_fkey(*)')
      .eq('id', id)
      .eq('contractor_id', contractor.id)
      .single();

    // Type assertion for project with images
    type ProjectData = {
      id: string;
      title?: string | null;
      description?: string | null;
      project_type?: string | null;
      project_type_slug?: string | null;
      city?: string | null;
      state?: string | null;
      hero_image_id?: string | null;
      description_manual?: boolean | null;
      summary?: string | null;
      challenge?: string | null;
      solution?: string | null;
      results?: string | null;
      outcome_highlights?: string[] | null;
      status: string;
      seo_title?: string | null;
      seo_description?: string | null;
      created_at?: string | null;
      project_images?: Array<Record<string, unknown>>;
    };
    const projectData = project as ProjectData | null;

    if (fetchError || !projectData) {
      return apiError('NOT_FOUND', 'Project not found');
    }

    // Validate publishability
    const errors: string[] = [];

    if (!projectData.title) {
      errors.push('Project must have a title');
    }
    if (!projectData.project_type) {
      errors.push('Project must have a project type');
    } else if (!projectData.project_type_slug) {
      errors.push('Project type slug is missing. Please re-save the project type.');
    }
    if (!projectData.city) {
      errors.push('Project must have a city');
    }
    if (!projectData.state) {
      errors.push('Project must have a state');
    }
    if (!projectData.project_images || projectData.project_images.length === 0) {
      errors.push('Project must have at least one image');
    }
    if (!projectData.hero_image_id && projectData.project_images && projectData.project_images.length > 0) {
      // Auto-assign hero image from the first image (by display_order if available)
      const sortedImages = [...projectData.project_images].sort((a, b) => {
        const orderA = (a as { display_order?: number }).display_order ?? 0;
        const orderB = (b as { display_order?: number }).display_order ?? 0;
        return orderA - orderB;
      });
      projectData.hero_image_id = (sortedImages[0] as { id?: string }).id ?? null;
    }
    if (!projectData.hero_image_id) {
      errors.push('Project must have a hero image');
    }

    // Issue #6: For dry_run, skip the "already published" check since we just want validation
    if (!dryRun && projectData.status === 'published') {
      return apiError('CONFLICT', 'Project is already published');
    }

    // Issue #6: If dry_run, return validation result without publishing
    if (dryRun) {
      return apiSuccess({
        valid: errors.length === 0,
        missing: errors,
      });
    }

    if (errors.length > 0) {
      return apiError('VALIDATION_ERROR', 'Project cannot be published', {
        missing: errors,
      });
    }

    const shouldComposeDescription = !projectData.description && !projectData.description_manual;
    const composedDescription = shouldComposeDescription
      ? composeProjectDescription({
          summary: projectData.summary,
          challenge: projectData.challenge,
          solution: projectData.solution,
          results: projectData.results,
          outcome_highlights: projectData.outcome_highlights,
        })
      : null;

    const descriptionForSeo = projectData.description ?? composedDescription ?? '';

    // Generate SEO fields if not set
    const seoTitle = projectData.seo_title ?? `${projectData.title} | ${contractor.business_name}`;
    const seoDescription =
      projectData.seo_description ??
      (descriptionForSeo ? descriptionForSeo.slice(0, 157) + '...' : '');

    const updatePayload: Record<string, unknown> = {
      status: 'published',
      published_at: new Date().toISOString(),
      seo_title: seoTitle,
      seo_description: seoDescription,
    };

    if (composedDescription) {
      updatePayload.description = composedDescription;
    }
    if (projectData.hero_image_id) {
      updatePayload.hero_image_id = projectData.hero_image_id;
    }

    // Update to published
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: published, error: updateError } = await (supabase as any)
      .from('projects')
      .update(updatePayload)
      .eq('id', id)
      .eq('contractor_id', contractor.id)
      .select('*, project_images!project_images_project_id_fkey(*)')
      .single();

    if (updateError) {
      console.error('[POST /api/projects/[id]/publish] Update error:', updateError);
      return handleApiError(updateError);
    }

    // Track time-to-publish KPI
    // Fire-and-forget: don't block response on tracking
    if (projectData.created_at) {
      trackProjectPublished({
        contractorId: contractor.id,
        projectId: id,
        createdAt: projectData.created_at,
        publishedAt: new Date(),
      }).catch((err) => console.error('[KPI] trackProjectPublished failed:', err));
    }

    return apiSuccess({ project: published as ProjectWithImages });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/projects/[id]/publish
 *
 * Unpublish a project, reverting it to draft status.
 * The project remains intact but is hidden from public view.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthUnified();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { id } = await params;
    const { contractor } = auth;
    const supabase = await getAuthClient(auth);

    // Verify project exists and is published
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error: fetchError } = await (supabase as any)
      .from('projects')
      .select('id, status')
      .eq('id', id)
      .eq('contractor_id', contractor.id)
      .single();

    // Type assertion
    const projectData = project as { id: string; status: string } | null;

    if (fetchError || !projectData) {
      return apiError('NOT_FOUND', 'Project not found');
    }

    if (projectData.status !== 'published') {
      return apiError('CONFLICT', 'Project is not published');
    }

    // Revert to draft
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: unpublished, error: updateError } = await (supabase as any)
      .from('projects')
      .update({
        status: 'draft',
        published_at: null,
      })
      .eq('id', id)
      .eq('contractor_id', contractor.id)
      .select('*, project_images!project_images_project_id_fkey(*)')
      .single();

    if (updateError) {
      console.error('[DELETE /api/projects/[id]/publish] Update error:', updateError);
      return handleApiError(updateError);
    }

    return apiSuccess({ project: unpublished as ProjectWithImages });
  } catch (error) {
    return handleApiError(error);
  }
}
