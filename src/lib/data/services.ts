/**
 * Data layer for national service landing pages.
 *
 * Provides query functions for:
 * - Cities offering a specific service type
 * - Featured projects by service type
 *
 * Used by: app/(public)/services/[type]/page.tsx
 *
 * @see /docs/11-seo-discovery/page-templates/national-service.md
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { Contractor, Project, ProjectImage } from '@/types/database';

/**
 * City info with project count for a service type.
 */
export interface CityWithProjects {
  citySlug: string;
  cityName: string;
  state: string;
  projectCount: number;
}

/**
 * Project with contractor and cover image for featured display.
 */
export interface ProjectWithDetails extends Project {
  contractor: Contractor;
  cover_image?: ProjectImage;
}

/**
 * Get all cities that have published projects for a specific service type.
 * Used to populate the "Find by City" section on national service pages.
 *
 * @param serviceTypeSlug - The service type slug (e.g., 'chimney-repair')
 * @returns Array of cities sorted by project count (descending)
 *
 * @example
 * const cities = await getCitiesByServiceType('chimney-repair');
 * // Returns: [{ citySlug: 'denver-co', cityName: 'Denver', state: 'CO', projectCount: 5 }, ...]
 */
export async function getCitiesByServiceType(
  serviceTypeSlug: string
): Promise<CityWithProjects[]> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('projects')
    .select('city_slug, city, contractor:contractors(state)')
    .eq('project_type_slug', serviceTypeSlug)
    .eq('status', 'published')
    .not('city_slug', 'is', null)
    .not('city', 'is', null);

  if (error) {
    console.error('[getCitiesByServiceType] Error:', error);
    return [];
  }

  type ProjectRow = { city_slug: string; city: string; contractor: { state: string } | null };
  const projects = (data || []) as ProjectRow[];

  // Aggregate by city
  const cityMap = new Map<string, CityWithProjects>();

  projects.forEach((project) => {
    if (!project.city_slug || !project.city) return;

    const existing = cityMap.get(project.city_slug);
    if (existing) {
      existing.projectCount++;
    } else {
      cityMap.set(project.city_slug, {
        citySlug: project.city_slug,
        cityName: project.city,
        state: project.contractor?.state || '',
        projectCount: 1,
      });
    }
  });

  // Sort by project count descending
  return Array.from(cityMap.values()).sort(
    (a, b) => b.projectCount - a.projectCount
  );
}

/**
 * Get featured projects for a service type (national, no city filter).
 * Used to showcase portfolio examples on national service pages.
 *
 * @param serviceTypeSlug - The service type slug (e.g., 'chimney-repair')
 * @param limit - Maximum number of projects to return (default: 6)
 * @returns Array of projects with contractor info and cover image
 *
 * @example
 * const projects = await getFeaturedProjectsByService('chimney-repair', 6);
 */
export async function getFeaturedProjectsByService(
  serviceTypeSlug: string,
  limit: number = 6
): Promise<ProjectWithDetails[]> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('projects')
    .select(`
      *,
      contractor:contractors(id, business_name, city, state, city_slug, profile_photo_url),
      project_images(id, storage_path, alt_text, display_order, image_type)
    `)
    .eq('project_type_slug', serviceTypeSlug)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getFeaturedProjectsByService] Error:', error);
    return [];
  }

  type ProjectWithRelations = Project & {
    contractor: Contractor;
    project_images: ProjectImage[];
  };
  const projects = (data || []) as ProjectWithRelations[];

  // Add cover image to each project (first image by display_order)
  return projects.map((project) => {
    const sortedImages = [...(project.project_images || [])].sort(
      (a, b) => a.display_order - b.display_order
    );
    return {
      ...project,
      cover_image: sortedImages[0],
    };
  });
}

/**
 * Get total project count for a service type (national).
 * Used for stats display on service pages.
 *
 * @param serviceTypeSlug - The service type slug
 * @returns Total count of published projects
 */
export async function getProjectCountByService(
  serviceTypeSlug: string
): Promise<number> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (supabase as any)
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('project_type_slug', serviceTypeSlug)
    .eq('status', 'published');

  if (error) {
    console.error('[getProjectCountByService] Error:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get unique contractor count for a service type (national).
 * Used for stats display on service pages.
 *
 * @param serviceTypeSlug - The service type slug
 * @returns Count of unique contractors with projects of this type
 */
export async function getContractorCountByService(
  serviceTypeSlug: string
): Promise<number> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('projects')
    .select('contractor_id')
    .eq('project_type_slug', serviceTypeSlug)
    .eq('status', 'published');

  if (error) {
    console.error('[getContractorCountByService] Error:', error);
    return 0;
  }

  type ContractorRow = { contractor_id: string };
  const projects = (data || []) as ContractorRow[];

  // Count unique contractor IDs
  const uniqueContractors = new Set(projects.map((p) => p.contractor_id));
  return uniqueContractors.size;
}

/**
 * Maps URL slugs to SERVICE_CONTENT IDs where they differ.
 *
 * The national service page URLs use slightly different slugs
 * than the internal SERVICE_CONTENT keys for SEO purposes.
 *
 * @param urlSlug - The slug from the URL (e.g., 'stone-masonry')
 * @returns The SERVICE_CONTENT key (e.g., 'stone-work')
 */
export function mapUrlSlugToServiceId(urlSlug: string): string {
  const slugMapping: Record<string, string> = {
    'stone-masonry': 'stone-work',
    'historic-restoration': 'restoration',
    'masonry-waterproofing': 'waterproofing',
    // Direct mappings (same slug)
    'chimney-repair': 'chimney-repair',
    'tuckpointing': 'tuckpointing',
    'brick-repair': 'brick-repair',
    'foundation-repair': 'foundation-repair',
    'efflorescence-removal': 'efflorescence-removal',
  };

  return slugMapping[urlSlug] || urlSlug;
}

/**
 * Maps SERVICE_CONTENT IDs to URL slugs where they differ.
 * Inverse of mapUrlSlugToServiceId.
 *
 * @param serviceId - The SERVICE_CONTENT key (e.g., 'stone-work')
 * @returns The URL slug (e.g., 'stone-masonry')
 */
export function mapServiceIdToUrlSlug(serviceId: string): string {
  const idMapping: Record<string, string> = {
    'stone-work': 'stone-masonry',
    'restoration': 'historic-restoration',
    'waterproofing': 'masonry-waterproofing',
  };

  return idMapping[serviceId] || serviceId;
}

/**
 * List of service types available for national service pages.
 * These are the 8 services with dedicated landing pages.
 */
export const NATIONAL_SERVICE_TYPES = [
  'chimney-repair',
  'tuckpointing',
  'brick-repair',
  'stone-masonry',
  'foundation-repair',
  'historic-restoration',
  'masonry-waterproofing',
  'efflorescence-removal',
] as const;

export type NationalServiceType = (typeof NATIONAL_SERVICE_TYPES)[number];

/**
 * Check if a slug is a valid national service type.
 */
export function isValidNationalServiceType(
  slug: string
): slug is NationalServiceType {
  return NATIONAL_SERVICE_TYPES.includes(slug as NationalServiceType);
}
