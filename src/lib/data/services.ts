/**
 * Data layer for national service landing pages.
 *
 * Provides query functions for:
 * - Cities offering a specific service type
 * - Featured projects by service type
 *
 * SCOPE: SEO Landing Pages Only
 * ────────────────────────────────
 * This module contains masonry-specific service types for SEO landing pages.
 * The core platform (chat, AI, projects) is trade-agnostic and works for any business.
 *
 * PHASE 3 MIGRATION (Future):
 * When adding new trades, this can be:
 * 1. Extended with trade-specific service type arrays, or
 * 2. Refactored to query service types dynamically from the database
 *
 * The query functions (getCitiesByServiceType, getFeaturedProjectsByService)
 * are already generic - only NATIONAL_SERVICE_TYPES is trade-specific.
 *
 * Used by: app/(public)/services/[type]/page.tsx
 *
 * @see /docs/11-seo-discovery/page-templates/national-service.md
 * @see /docs/philosophy/universal-portfolio-agents.md
 */

import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import type { Business, Project, ProjectImage } from '@/types/database';

/**
 * Service type from database.
 * Part of Phase 3: Dynamic service types.
 */
export interface ServiceType {
  id: string;
  service_id: string;
  url_slug: string;
  label: string;
  short_description: string;
  long_description?: string;
  seo_title?: string;
  seo_description?: string;
  common_issues?: string[];
  keywords?: string[];
  trade: string;
  is_published: boolean;
  sort_order: number;
  icon_emoji?: string;
}

/**
 * In-memory cache for service types.
 * Reduces database queries for frequently accessed data.
 */
let serviceTypesCache: ServiceType[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 3600000; // 1 hour

/**
 * Get all published service types from database.
 * Uses in-memory cache with 1-hour TTL for performance.
 *
 * PHILOSOPHY: Dynamic service types enable multi-trade support
 * without code changes. Part of Phase 3 migration.
 *
 * @param forceRefresh - Bypass cache and fetch fresh data
 * @returns Array of published service types sorted by sort_order
 *
 * @example
 * const services = await getServiceTypes();
 * // Returns: [{ service_id: 'chimney-repair', label: 'Chimney Repair', ... }, ...]
 */
export async function getServiceTypes(forceRefresh = false): Promise<ServiceType[]> {
  const now = Date.now();

  // Return cached data if valid
  if (!forceRefresh && serviceTypesCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return serviceTypesCache;
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('service_types')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error) {
    logger.error('[getServiceTypes] Error', { error });
    // Return cached data on error if available, otherwise empty array
    return serviceTypesCache || [];
  }

  // Update cache
  serviceTypesCache = (data || []) as ServiceType[];
  cacheTimestamp = now;

  return serviceTypesCache;
}

/**
 * Get service type slugs for static generation.
 * Use this in generateStaticParams() for service pages.
 *
 * @returns Array of URL slugs
 */
export async function getServiceTypeSlugs(): Promise<string[]> {
  const services = await getServiceTypes();
  return services.map((s) => s.url_slug);
}

/**
 * Get a single service type by its URL slug.
 *
 * @param urlSlug - The URL slug (e.g., 'stone-masonry')
 * @returns Service type or null if not found
 */
export async function getServiceTypeBySlug(urlSlug: string): Promise<ServiceType | null> {
  const services = await getServiceTypes();
  return services.find((s) => s.url_slug === urlSlug) || null;
}

/**
 * Get a single service type by its service ID.
 *
 * @param serviceId - The internal service ID (e.g., 'stone-work')
 * @returns Service type or null if not found
 */
export async function getServiceTypeById(serviceId: string): Promise<ServiceType | null> {
  const services = await getServiceTypes();
  return services.find((s) => s.service_id === serviceId) || null;
}

/**
 * Clear the service types cache.
 * Call this after updating service types in the database.
 */
export function clearServiceTypesCache(): void {
  serviceTypesCache = null;
  cacheTimestamp = 0;
}

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
 * Project with business owner and cover image for featured display.
 */
export interface ProjectWithDetails extends Project {
  business: Business;
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

  const { data, error } = await supabase
    .from('projects')
    .select('city_slug, city, business:businesses(state)')
    .eq('project_type_slug', serviceTypeSlug)
    .eq('status', 'published')
    .not('city_slug', 'is', null)
    .not('city', 'is', null);

  if (error) {
    logger.error('[getCitiesByServiceType] Error', { error, serviceTypeSlug });
    return [];
  }

  type ProjectRow = { city_slug: string; city: string; business: { state: string } | null };
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
        state: project.business?.state || '',
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
 * @returns Array of projects with business info and cover image
 *
 * @example
 * const projects = await getFeaturedProjectsByService('chimney-repair', 6);
 */
export async function getFeaturedProjectsByService(
  serviceTypeSlug: string,
  limit: number = 6
): Promise<ProjectWithDetails[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      business:businesses(id, name, slug, city, state, city_slug, profile_photo_url),
      project_images!project_images_project_id_fkey(id, storage_path, alt_text, display_order, image_type)
    `)
    .eq('project_type_slug', serviceTypeSlug)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('[getFeaturedProjectsByService] Error', { error, serviceTypeSlug });
    return [];
  }

  type ProjectWithRelations = Project & {
    business: Business;
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

  const { count, error } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('project_type_slug', serviceTypeSlug)
    .eq('status', 'published');

  if (error) {
    logger.error('[getProjectCountByService] Error', { error, serviceTypeSlug });
    return 0;
  }

  return count || 0;
}

/**
 * Get unique business count for a service type (national).
 * Used for stats display on service pages.
 *
 * @param serviceTypeSlug - The service type slug
 * @returns Count of unique businesses with projects of this type
 */
export async function getBusinessCountByService(
  serviceTypeSlug: string
): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('projects')
    .select('business_id')
    .eq('project_type_slug', serviceTypeSlug)
    .eq('status', 'published');

  if (error) {
    logger.error('[getBusinessCountByService] Error', { error, serviceTypeSlug });
    return 0;
  }

  type BusinessRow = { business_id: string };
  const projects = (data || []) as BusinessRow[];

  // Count unique business IDs
  const uniqueBusinesses = new Set(projects.map((p) => p.business_id));
  return uniqueBusinesses.size;
}

/**
 * @deprecated Use getBusinessCountByService instead
 */
export const getContractorCountByService = getBusinessCountByService;

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
 * Masonry service types with dedicated national landing pages.
 *
 * MVP: Hardcoded for masonry (the first trade supported).
 * PHASE 3: Will be dynamic - queried from database or trade config.
 *
 * The query functions in this module work with ANY service type slug.
 * Only this array is masonry-specific.
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
