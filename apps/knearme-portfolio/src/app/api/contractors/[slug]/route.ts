/**
 * Public Contractor API - Retrieve contractor public profiles by slug.
 *
 * GET /api/contractors/[slug] - Get public contractor profile
 *
 * This endpoint is unauthenticated and returns only published contractor data.
 * Used by public profile pages and SEO.
 *
 * @see /docs/04-apis/api-design.md
 */

import { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import { logger } from '@/lib/logging';
import type { Contractor, Database, Project, ProjectImage } from '@/types/database';

/**
 * Public contractor profile response.
 * Excludes sensitive fields like auth_user_id and email.
 */
interface PublicContractor {
  id: string;
  business_name: string;
  profile_slug: string;
  city: string;
  state: string;
  city_slug: string;
  services: string[];
  service_areas: string[];
  description: string | null;
  profile_photo_url: string | null;
}

interface PublicProject {
  id: string;
  title: string;
  slug: string;
  project_type: string;
  project_type_slug: string;
  city: string;
  city_slug: string;
  description: string;
  seo_description: string | null;
  published_at: string;
  thumbnail_url: string | null;
}

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/contractors/[slug]
 *
 * Get a public contractor profile by their profile_slug.
 * Only returns contractors with complete profiles.
 * Includes their published projects with thumbnails.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<ReturnType<typeof apiSuccess | typeof apiError>> {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return apiError('VALIDATION_ERROR', 'Contractor slug is required');
    }

    const supabase = (await createClient()) as SupabaseClient<Database>;

    // Fetch contractor by profile_slug
    // Note: profile_slug is the URL-friendly business slug (unique)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contractorData, error: contractorError } = await (supabase as any)
      .from('contractors')
      .select('*')
      .eq('profile_slug', slug)
      .not('business_name', 'is', null)  // Only complete profiles
      .single();

    if (contractorError || !contractorData) {
      return apiError('NOT_FOUND', 'Contractor not found');
    }

    const contractor = contractorData as Contractor;

    // Fetch published projects for this contractor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: projects, error: projectsError } = await (supabase as any)
      .from('projects')
      .select(`
        id,
        title,
        slug,
        project_type,
        project_type_slug,
        city,
        city_slug,
        description,
        seo_description,
        published_at,
        project_images (
          id,
          storage_path,
          display_order
        )
      `)
      .eq('contractor_id', contractor.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (projectsError) {
      logger.error('[GET /api/contractors/[slug]] Projects error', { error: projectsError });
      // Continue without projects rather than failing completely
    }

    // Transform to public shape (strip sensitive data)
    const publicContractor: PublicContractor = {
      id: contractor.id,
      business_name: contractor.business_name!,
      profile_slug: contractor.profile_slug!,
      city: contractor.city!,
      state: contractor.state!,
      city_slug: contractor.city_slug!,
      services: contractor.services ?? [],
      service_areas: contractor.service_areas ?? [],
      description: contractor.description,
      profile_photo_url: contractor.profile_photo_url,
    };

    // Transform projects with thumbnail from first image
    type ProjectWithImages = Project & { project_images: ProjectImage[] };
    const typedProjects = (projects ?? []) as ProjectWithImages[];

    const publicProjects: PublicProject[] = typedProjects.map((project) => {
      // Get the first image as thumbnail
      const sortedImages = [...(project.project_images || [])].sort(
        (a, b) => a.display_order - b.display_order
      );
      const thumbnailPath = sortedImages[0]?.storage_path ?? null;

      // Build public URL if we have a thumbnail
      let thumbnailUrl: string | null = null;
      if (thumbnailPath) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        thumbnailUrl = `${supabaseUrl}/storage/v1/object/public/project-images/${thumbnailPath}`;
      }

      return {
        id: project.id,
        title: project.title ?? 'Untitled Project',
        slug: project.slug ?? project.id,
        project_type: project.project_type ?? 'General',
        project_type_slug: project.project_type_slug ?? 'general',
        city: project.city ?? contractor.city ?? '',
        city_slug: project.city_slug ?? contractor.city_slug ?? '',
        description: project.description ?? '',
        seo_description: project.seo_description,
        published_at: project.published_at ?? project.created_at,
        thumbnail_url: thumbnailUrl,
      };
    });

    return apiSuccess({
      contractor: publicContractor,
      projects: publicProjects,
      project_count: publicProjects.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
