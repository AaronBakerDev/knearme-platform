/**
 * Service ID to URL Slug Mappings
 *
 * These 3 services have different internal IDs vs URL slugs for SEO stability.
 * The URL slugs were established before the service_types table and must remain
 * stable to preserve search rankings.
 *
 * Mappings:
 * - Internal: 'stone-work' → URL: 'stone-masonry'
 * - Internal: 'restoration' → URL: 'historic-restoration'
 * - Internal: 'waterproofing' → URL: 'masonry-waterproofing'
 *
 * IMPORTANT: This is the single source of truth for slug mappings.
 * Both the catalog runtime fallback and seed script import from here.
 *
 * @see supabase/migrations/032_add_service_types.sql
 * @see scripts/seed-service-types.ts
 */

export const SERVICE_SLUG_MAPPINGS: Record<string, string> = {
  'stone-work': 'stone-masonry',
  'restoration': 'historic-restoration',
  'waterproofing': 'masonry-waterproofing',
};

/**
 * Default icon emojis for services (fallback when DB is empty).
 */
export const SERVICE_ICONS: Record<string, string> = {
  'chimney-repair': '🏠',
  'tuckpointing': '🧱',
  'brick-repair': '🔧',
  'stone-work': '🪨',
  'retaining-walls': '🧱',
  'concrete-work': '🏗️',
  'foundation-repair': '🏚️',
  'fireplace': '🔥',
  'outdoor-living': '🌳',
  'commercial': '🏢',
  'restoration': '🏛️',
  'waterproofing': '💧',
  'efflorescence-removal': '✨',
};

/**
 * Get URL slug for a service ID.
 *
 * Most services use their ID as the slug, but 3 have different slugs
 * for SEO compatibility with pre-existing URLs.
 *
 * @param serviceId - Internal service ID (e.g., 'stone-work')
 * @returns URL slug (e.g., 'stone-masonry')
 */
export function getUrlSlugForService(serviceId: string): string {
  return SERVICE_SLUG_MAPPINGS[serviceId] || serviceId;
}

/**
 * Get icon emoji for a service ID.
 *
 * @param serviceId - Internal service ID
 * @returns Emoji icon or default wrench
 */
export function getIconForService(serviceId: string): string {
  return SERVICE_ICONS[serviceId] || '🔧';
}
