/**
 * Project Publish API - Publish or unpublish a project.
 *
 * POST /api/projects/[id]/publish - Publish a draft project
 * DELETE /api/projects/[id]/publish - Unpublish (revert to draft)
 *
 * @see /docs/02-requirements/user-journeys.md J3
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import type { ProjectWithImages } from '@/types/database';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/publish
 *
 * Publish a project, making it visible on the public portfolio.
 * Validates that the project has required content before publishing.
 *
 * Requirements for publishing:
 * - title (AI-generated or manual)
 * - description (AI-generated or manual)
 * - At least 1 image
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { id } = await params;
    const { contractor } = auth;
    const supabase = await createClient();

    // Get project with images to validate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error: fetchError } = await (supabase as any)
      .from('projects')
      .select('*, project_images(*)')
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
      status: string;
      seo_title?: string | null;
      seo_description?: string | null;
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
    if (!projectData.description) {
      errors.push('Project must have a description');
    }
    if (!projectData.project_type) {
      errors.push('Project must have a project type');
    } else if (!projectData.project_type_slug) {
      errors.push('Project type slug is missing. Please re-save the project type.');
    }
    if (!projectData.project_images || projectData.project_images.length === 0) {
      errors.push('Project must have at least one image');
    }
    if (projectData.status === 'published') {
      return apiError('CONFLICT', 'Project is already published');
    }

    if (errors.length > 0) {
      return apiError('VALIDATION_ERROR', 'Project cannot be published', {
        missing: errors,
      });
    }

    // Generate SEO fields if not set
    const seoTitle = projectData.seo_title ?? `${projectData.title} | ${contractor.business_name}`;
    const seoDescription =
      projectData.seo_description ??
      (projectData.description ? projectData.description.slice(0, 157) + '...' : '');

    // Update to published
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: published, error: updateError } = await (supabase as any)
      .from('projects')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        seo_title: seoTitle,
        seo_description: seoDescription,
      })
      .eq('id', id)
      .eq('contractor_id', contractor.id)
      .select('*, project_images(*)')
      .single();

    if (updateError) {
      console.error('[POST /api/projects/[id]/publish] Update error:', updateError);
      return handleApiError(updateError);
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
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { id } = await params;
    const { contractor } = auth;
    const supabase = await createClient();

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
      .select('*, project_images(*)')
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
