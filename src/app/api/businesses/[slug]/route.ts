/**
 * Public Business API - Retrieve business public profiles by slug.
 *
 * GET /api/businesses/[slug] - Get public business profile
 *
 * This endpoint is unauthenticated and returns only published business data.
 * Used by public profile pages and SEO.
 *
 * @see /docs/04-apis/api-design.md
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import type { Project, ProjectImage } from '@/types/database';

/**
 * Public business profile response.
 * Excludes sensitive fields like auth_user_id and email.
 */
interface PublicBusiness {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  city_slug: string;
  services: string[];
  service_areas: string[];
  description: string | null;
  profile_photo_url: string | null;
  phone: string | null;
  website: string | null;
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
 * GET /api/businesses/[slug]
 *
 * Get a public business profile by their slug.
 * Only returns businesses with complete profiles.
 * Includes their published projects with thumbnails.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<ReturnType<typeof apiSuccess | typeof apiError>> {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return apiError('VALIDATION_ERROR', 'Business slug is required');
    }

    const supabase = await createClient();

    // Fetch business by slug
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: business, error: businessError } = await (supabase as any)
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .not('name', 'is', null)  // Only complete profiles
      .single();

    if (businessError || !business) {
      // Fallback: check legacy contractors table by profile_slug
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: contractor, error: contractorError } = await (supabase as any)
        .from('contractors')
        .select('*')
        .eq('profile_slug', slug)
        .not('business_name', 'is', null)
        .single();

      if (contractorError || !contractor) {
        return apiError('NOT_FOUND', 'Business not found');
      }

      // Return contractor data in business shape
      // CR-4 fix: Use actual contractor phone/website instead of hardcoded nulls
      const publicBusiness: PublicBusiness = {
        id: contractor.id,
        name: contractor.business_name,
        slug: contractor.profile_slug,
        city: contractor.city ?? '',
        state: contractor.state ?? '',
        city_slug: contractor.city_slug ?? '',
        services: contractor.services ?? [],
        service_areas: contractor.service_areas ?? [],
        description: contractor.description,
        profile_photo_url: contractor.profile_photo_url,
        phone: contractor.phone ?? null,
        website: contractor.website ?? null,
      };

      // Fetch projects using contractor_id (legacy)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: projects } = await (supabase as any)
        .from('projects')
        .select(`
          id, title, slug, project_type, project_type_slug,
          city, city_slug, description, seo_description, published_at,
          project_images (id, storage_path, display_order)
        `)
        .eq('contractor_id', contractor.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      const publicProjects = transformProjects(projects ?? [], publicBusiness);

      return apiSuccess({
        business: publicBusiness,
        projects: publicProjects,
        project_count: publicProjects.length,
        _source: 'contractor_fallback',
      });
    }

    // Transform to public shape (strip sensitive data)
    const publicBusiness: PublicBusiness = {
      id: business.id,
      name: business.name,
      slug: business.slug,
      city: business.city ?? '',
      state: business.state ?? '',
      city_slug: business.city_slug ?? '',
      services: business.services ?? [],
      service_areas: business.service_areas ?? [],
      description: business.description,
      profile_photo_url: business.profile_photo_url,
      phone: business.phone,
      website: business.website,
    };

    // Fetch published projects for this business
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
      .eq('business_id', business.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (projectsError) {
      console.error('[GET /api/businesses/[slug]] Projects error:', projectsError);
      // Continue without projects rather than failing completely
    }

    const publicProjects = transformProjects(projects ?? [], publicBusiness);

    return apiSuccess({
      business: publicBusiness,
      projects: publicProjects,
      project_count: publicProjects.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Transform projects with thumbnail from first image.
 */
function transformProjects(
  projects: (Project & { project_images: ProjectImage[] })[],
  business: PublicBusiness
): PublicProject[] {
  return projects.map((project) => {
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
      city: project.city ?? business.city ?? '',
      city_slug: project.city_slug ?? business.city_slug ?? '',
      description: project.description ?? '',
      seo_description: project.seo_description,
      published_at: project.published_at ?? project.created_at,
      thumbnail_url: thumbnailUrl,
    };
  });
}
