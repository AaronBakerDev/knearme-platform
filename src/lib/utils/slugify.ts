/**
 * Converts text to a URL-friendly slug.
 * Used for generating city_slug, project_type_slug, and project slugs.
 *
 * @example slugify("Denver, CO") => "denver-co"
 * @example slugify("Chimney Repair & Rebuild") => "chimney-repair-rebuild"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a city slug from city and state.
 *
 * @example generateCitySlug("Denver", "CO") => "denver-co"
 */
export function generateCitySlug(city: string, state: string): string {
  return slugify(`${city} ${state}`);
}

/**
 * Generates a unique project slug from title.
 * Appends a short random string for uniqueness.
 *
 * @example generateProjectSlug("Historic Chimney Rebuild") => "historic-chimney-rebuild-a1b2c3"
 */
export function generateProjectSlug(title: string): string {
  const baseSlug = slugify(title);
  const uniqueId = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${uniqueId}`;
}
