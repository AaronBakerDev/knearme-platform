/**
 * Centralized page descriptions for public pages.
 *
 * This module consolidates service-related content used across public pages,
 * eliminating duplication of SERVICE_ICONS and SERVICE_TYPE_DESCRIPTIONS.
 *
 * USAGE:
 * ```ts
 * import { SERVICE_ICONS, getServiceIcon, SERVICE_TYPE_DESCRIPTIONS } from '@/lib/constants/page-descriptions';
 * ```
 *
 * @see /src/lib/services/slug-mappings.ts - Canonical source for SERVICE_ICONS
 * @see /src/lib/seo/service-type-descriptions.ts - City-specific service descriptions
 */

// Re-export SERVICE_ICONS from canonical source
export { SERVICE_ICONS, getIconForService as getServiceIcon } from '@/lib/services/slug-mappings';

// Re-export service type descriptions for city pages
export { SERVICE_TYPE_DESCRIPTIONS, type ServiceTypeDescription } from '@/lib/seo/service-type-descriptions';

/**
 * Common page metadata patterns for public SEO pages.
 */
export const PAGE_META = {
  /** Base site URL from environment */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com',

  /** Default site name for titles */
  siteName: 'KnearMe',

  /** Common keywords prefix */
  keywordsPrefix: 'masonry, contractors, local',
} as const;

/**
 * Generate a consistent page title with site suffix.
 *
 * @param title - Page-specific title
 * @returns Full title with site name
 *
 * @example
 * getPageTitle('Chimney Repair') // "Chimney Repair | KnearMe"
 */
export function getPageTitle(title: string): string {
  return `${title} | ${PAGE_META.siteName}`;
}

/**
 * Get canonical URL for a page path.
 *
 * @param path - Page path (e.g., '/services' or '/denver-co/masonry')
 * @returns Full canonical URL
 *
 * @example
 * getCanonicalUrl('/services') // "https://knearme.com/services"
 */
export function getCanonicalUrl(path: string): string {
  const base = PAGE_META.siteUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Format a city slug into a display name.
 *
 * This utility is duplicated across several city page files.
 * Consolidating here for consistency.
 *
 * @param citySlug - URL slug (e.g., 'denver-co')
 * @returns Formatted name (e.g., 'Denver, CO')
 *
 * @example
 * formatCityName('denver-co') // "Denver, CO"
 * formatCityName('new-york-ny') // "New York, NY"
 */
export function formatCityName(citySlug: string): string {
  const parts = citySlug.split('-');
  if (parts.length < 2) return citySlug;

  const state = parts.pop()?.toUpperCase() || '';
  const city = parts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return `${city}, ${state}`;
}

/**
 * Format a service type slug into a display name.
 *
 * @param typeSlug - URL slug (e.g., 'chimney-repair')
 * @returns Formatted name (e.g., 'Chimney Repair')
 *
 * @example
 * formatServiceName('chimney-repair') // "Chimney Repair"
 */
export function formatServiceName(typeSlug: string): string {
  return typeSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
