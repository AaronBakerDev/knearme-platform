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
import { logger } from '@/lib/logging';
import type { Business, Contractor, Project, ProjectImage } from '@/types/database';

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
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .not('name', 'is', null)  // Only complete profiles
      .single();

    if (businessError || !business) {
      // Fallback: check legacy contractors table by profile_slug
      const { data: contractor, error: contractorError } = await supabase
        .from('contractors')
        .select('*')
        .eq('profile_slug', slug)
        .not('business_name', 'is', null)
        .single();

      if (contractorError || !contractor) {
        return apiError('NOT_FOUND', 'Business not found');
      }

      const contractorData = contractor as Contractor;

      // Return contractor data in business shape
      // CR-4 fix: Use actual contractor phone/website instead of hardcoded nulls
      const publicBusiness: PublicBusiness = {
        id: contractorData.id,
        name: contractorData.business_name ?? '',
        slug: contractorData.profile_slug ?? '',
        city: contractorData.city ?? '',
        state: contractorData.state ?? '',
        city_slug: contractorData.city_slug ?? '',
        services: contractorData.services ?? [],
        service_areas: contractorData.service_areas ?? [],
        description: contractorData.description,
        profile_photo_url: contractorData.profile_photo_url,
        phone: contractorData.phone ?? null,
        website: contractorData.website ?? null,
      };

      // Fetch projects using contractor_id (legacy)
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id, title, slug, project_type, project_type_slug,
          city, city_slug, description, seo_description, published_at,
          project_images (id, storage_path, display_order)
        `)
        .eq('contractor_id', contractorData.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      const projectRows = (projects ?? []) as Array<Project & { project_images: ProjectImage[] }>;
      const publicProjects = transformProjects(projectRows, publicBusiness);

      return apiSuccess({
        business: publicBusiness,
        projects: publicProjects,
        project_count: publicProjects.length,
        _source: 'contractor_fallback',
      });
    }

    // Transform to public shape (strip sensitive data)
    const businessData = business as Business;
    const publicBusiness: PublicBusiness = {
      id: businessData.id,
      name: businessData.name ?? '',
      slug: businessData.slug ?? '',
      city: businessData.city ?? '',
      state: businessData.state ?? '',
      city_slug: businessData.city_slug ?? '',
      services: businessData.services ?? [],
      service_areas: businessData.service_areas ?? [],
      description: businessData.description,
      profile_photo_url: businessData.profile_photo_url,
      phone: businessData.phone,
      website: businessData.website,
    };

    // Fetch published projects for this business
    const { data: projects, error: projectsError } = await supabase
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
      .eq('business_id', businessData.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (projectsError) {
      logger.error('[GET /api/businesses/[slug]] Projects error', { error: projectsError });
      // Continue without projects rather than failing completely
    }

    const projectRows = (projects ?? []) as Array<Project & { project_images: ProjectImage[] }>;
    const publicProjects = transformProjects(projectRows, publicBusiness);

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
