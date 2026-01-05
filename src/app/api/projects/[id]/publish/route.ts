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
import { getPublishedProjectLimit, normalizePlanTier } from '@/lib/billing/plan-limits';
import { copyDraftImagesToPublic, removePublicImages } from '@/lib/storage/upload.server';
import { logger } from '@/lib/logging';
import type { Project, ProjectUpdate, ProjectWithImages } from '@/types/database';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/publish
 *
 * Publish a project, making it visible on the public portfolio.
 *
 * Query Parameters:
 * - dry_run=true: Only validate without publishing, returns { valid, warnings }
 * - force=true: Publish even with warnings (user override)
 *
 * PHILOSOPHY: Warn, don't block. User decides when to publish.
 * Validation issues become warnings that are logged but don't prevent publishing.
 * The model explains warnings in conversation; user can choose to proceed anyway.
 *
 * @see /docs/philosophy/agent-philosophy.md
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
    // PHILOSOPHY: force=true allows publishing with warnings (user override)
    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dry_run') === 'true';
    const force = searchParams.get('force') === 'true';

    // Get project with images to validate
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*, project_images!project_images_project_id_fkey(*)')
      .eq('id', id)
      .eq('contractor_id', contractor.id)
      .single();

    const projectData = project as ProjectWithImages | null;

    if (fetchError || !projectData) {
      return apiError('NOT_FOUND', 'Project not found');
    }

    const planTier = normalizePlanTier(contractor.plan_tier);
    const publishedProjectLimit = getPublishedProjectLimit(planTier);
    let planLimitMessage: string | null = null;

    if (publishedProjectLimit !== null) {
      const { count, error: countError } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('contractor_id', contractor.id)
        .eq('status', 'published')
        .neq('id', id);

      if (countError) {
        logger.error('[POST /api/projects/[id]/publish] Count error', {
          error: countError,
          projectId: id,
        });
        return handleApiError(countError);
      }

      if ((count ?? 0) >= publishedProjectLimit) {
        planLimitMessage = `Free plan limit reached (${publishedProjectLimit} published projects).`;

        if (!dryRun) {
          return apiError(
            'FORBIDDEN',
            'Free plan limit reached. Upgrade to publish more projects.',
            { limit: publishedProjectLimit, plan: planTier }
          );
        }
      }
    }

    // PHILOSOPHY: Collect warnings, not blocking errors.
    // User decides when to publish; model explains trade-offs.
    const warnings: string[] = [];

    if (!projectData.title) {
      warnings.push('Project is missing a title');
    }
    if (!projectData.project_type) {
      warnings.push('Project is missing a project type');
    } else if (!projectData.project_type_slug) {
      warnings.push('Project type slug is missing. Please re-save the project type.');
    }
    if (!projectData.city) {
      warnings.push('Project is missing a city (affects SEO)');
    }
    if (!projectData.state) {
      warnings.push('Project is missing a state (affects SEO)');
    }
    if (!projectData.project_images || projectData.project_images.length === 0) {
      warnings.push('Project has no images');
    }
    if (!projectData.hero_image_id && projectData.project_images && projectData.project_images.length > 0) {
      // Auto-assign hero image from the first image (by display_order if available)
      const sortedImages = [...projectData.project_images].sort((a, b) => {
        const orderA = a.display_order ?? 0;
        const orderB = b.display_order ?? 0;
        return orderA - orderB;
      });
      projectData.hero_image_id = sortedImages[0]?.id ?? null;
    }
    if (!projectData.hero_image_id) {
      warnings.push('Project has no hero image');
    }

    // Issue #6: For dry_run, skip the "already published" check since we just want validation
    if (!dryRun && projectData.status === 'published') {
      return apiError('CONFLICT', 'Project is already published');
    }

    // Issue #6: If dry_run, return validation result without publishing
    if (dryRun) {
      const allWarnings = planLimitMessage ? [...warnings, planLimitMessage] : warnings;
      return apiSuccess({
        valid: allWarnings.length === 0,
        warnings: allWarnings,
      });
    }

    // PHILOSOPHY: Warn, don't block. Unless force=false and warnings exist.
    // Model explains warnings; user can override with force=true.
    if (warnings.length > 0 && !force) {
      logger.warn('[POST /api/projects/[id]/publish] Warnings (blocking)', { warnings, projectId: id });
      return apiError('VALIDATION_ERROR', 'Project has warnings. Use force=true to publish anyway.', {
        warnings,
        canForce: true,
      });
    }

    // Log warnings but proceed when force=true
    if (warnings.length > 0) {
      logger.warn('[POST /api/projects/[id]/publish] Publishing with warnings', { warnings, projectId: id });
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

    const updatePayload: ProjectUpdate = {
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
    const { data: published, error: updateError } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', id)
      .eq('contractor_id', contractor.id)
      .select('*, project_images!project_images_project_id_fkey(*)')
      .single();

    if (updateError) {
      logger.error('[POST /api/projects/[id]/publish] Update error', { error: updateError, projectId: id });
      return handleApiError(updateError);
    }

    // Copy draft images to public bucket
    if (projectData.project_images && projectData.project_images.length > 0) {
      const storagePaths = projectData.project_images
        .map((img) => img.storage_path)
        .filter(Boolean) as string[];
      const { errors } = await copyDraftImagesToPublic(storagePaths);
      if (errors.length > 0) {
        logger.warn('[POST /api/projects/[id]/publish] Image copy warnings', {
          errors,
          projectId: id,
        });
      }
    }

    // Track time-to-publish KPI
    // Fire-and-forget: don't block response on tracking
    if (projectData.created_at) {
      trackProjectPublished({
        contractorId: contractor.id,
        projectId: id,
        createdAt: projectData.created_at,
        publishedAt: new Date(),
      }).catch((err) => logger.error('[KPI] trackProjectPublished failed', { error: err }));
    }

    // Include warnings in response so model can inform user
    return apiSuccess({
      project: published as ProjectWithImages,
      ...(warnings.length > 0 && { warnings, forcedPublish: true }),
    });
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
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, status')
      .eq('id', id)
      .eq('contractor_id', contractor.id)
      .single();

    const projectData = project as Pick<Project, 'id' | 'status'> | null;

    if (fetchError || !projectData) {
      return apiError('NOT_FOUND', 'Project not found');
    }

    if (projectData.status !== 'published') {
      return apiError('CONFLICT', 'Project is not published');
    }

    // Revert to draft
    const { data: unpublished, error: updateError } = await supabase
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
      logger.error('[DELETE /api/projects/[id]/publish] Update error', { error: updateError, projectId: id });
      return handleApiError(updateError);
    }

    // Remove public copies when unpublishing
    const unpublishedProject = unpublished as ProjectWithImages;
    const publicStoragePaths = (unpublishedProject.project_images || [])
      .map((img) => img.storage_path)
      .filter(Boolean) as string[];
    if (publicStoragePaths.length > 0) {
      const { errors } = await removePublicImages(publicStoragePaths);
      if (errors.length > 0) {
        logger.warn('[DELETE /api/projects/[id]/publish] Public image cleanup warnings', {
          errors,
          projectId: id,
        });
      }
    }

    return apiSuccess({ project: unpublishedProject });
  } catch (error) {
    return handleApiError(error);
  }
}
