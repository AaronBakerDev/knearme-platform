/**
 * Related Projects API - Fetch related published projects for preview parity.
 *
 * GET /api/projects/[id]/related
 *
 * Returns related published projects using the same algorithm as the public page.
 */

import { NextRequest } from 'next/server';
import { requireAuthUnified, isAuthError } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchRelatedProjects } from '@/lib/data/projects';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthUnified();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // Load project for ownership + related context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error } = await (supabase as any)
      .from('projects')
      .select('id, business_id, city_slug, project_type_slug')
      .eq('id', id)
      .single();

    if (error || !project) {
      return apiError('NOT_FOUND', 'Project not found');
    }

    // Check ownership via business_id (same UUID as contractor during migration)
    if (project.business_id !== auth.contractor.id) {
      return apiError('FORBIDDEN', 'Not authorized to view related projects');
    }

    if (!project.city_slug || !project.project_type_slug) {
      return apiSuccess({ projects: [] });
    }

    const related = await fetchRelatedProjects(
      supabase,
      {
        id: project.id,
        business_id: project.business_id,
        city_slug: project.city_slug,
        project_type_slug: project.project_type_slug,
      },
      6
    );

    return apiSuccess({ projects: related });
  } catch (error) {
    return handleApiError(error);
  }
}
