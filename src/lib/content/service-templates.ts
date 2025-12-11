/**
 * Service page content generator.
 *
 * Generates dynamic content for Service Type by City pages
 * by interpolating templates with city-specific variables.
 *
 * Usage:
 * ```typescript
 * import { generateServicePageContent } from '@/lib/content/service-templates';
 *
 * const content = generateServicePageContent('chimney-repair', {
 *   city: 'Denver',
 *   state: 'CO',
 *   stateFull: 'Colorado',
 *   citySlug: 'denver-co',
 *   projectCount: 15,
 *   contractorCount: 8,
 *   serviceLabel: 'Chimney Repair',
 *   serviceSlug: 'chimney-repair',
 * });
 * ```
 *
 * @see /docs/11-seo-discovery/page-templates/service-type-city.md
 */

import type { ServiceId } from '@/lib/constants/services';
import { SERVICE_CONTENT, type ServiceContent } from '@/lib/constants/service-content';
import type { ServicePageContent, ServicePageVariables, BreadcrumbItem } from './types';

/**
 * Interpolate template string with variables.
 * Replaces {variableName} placeholders with values.
 *
 * @example
 * interpolate('Hello {name}!', { name: 'World' }) // 'Hello World!'
 */
export function interpolate(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Generate complete content for a service type by city page.
 *
 * @param serviceId - The service type identifier
 * @param variables - City and context variables for interpolation
 * @returns Generated page content with SEO metadata
 */
export function generateServicePageContent(
  serviceId: ServiceId,
  variables: ServicePageVariables
): ServicePageContent {
  const content = SERVICE_CONTENT[serviceId];

  if (!content) {
    throw new Error(`Service content not found for: ${serviceId}`);
  }

  const templateVars: Record<string, string | number> = {
    city: variables.city,
    state: variables.state,
    stateFull: variables.stateFull,
    citySlug: variables.citySlug,
    count: variables.projectCount,
    projectCount: variables.projectCount,
    contractorCount: variables.contractorCount,
    service: content.label,
    serviceLabel: variables.serviceLabel,
  };

  return {
    h1: `${content.label} in ${variables.city}, ${variables.state}`,
    seoTitle: truncate(interpolate(content.seoTitleTemplate, templateVars), 60),
    seoDescription: truncate(interpolate(content.seoDescriptionTemplate, templateVars), 155),
    introText: generateIntroText(content, variables),
    description: content.longDescription.trim(),
    commonIssues: content.commonIssues,
    relatedServices: content.relatedServices,
    faqs: content.faqs || [],
  };
}

/**
 * Generate intro text with city-specific content.
 */
function generateIntroText(content: ServiceContent, variables: ServicePageVariables): string {
  const { city, state, projectCount, contractorCount } = variables;

  if (projectCount > 0 && contractorCount > 0) {
    return `Looking for professional ${content.label.toLowerCase()} services in ${city}, ${state}? Browse ${projectCount} completed projects from ${contractorCount} local masonry contractors. View before and after photos, read about each project, and find the right contractor for your ${content.label.toLowerCase()} needs.`;
  }

  if (contractorCount > 0) {
    return `Find trusted ${content.label.toLowerCase()} contractors in ${city}, ${state}. Our network of ${contractorCount} local masonry professionals is ready to help with your project. Browse portfolios, view past work, and connect with experienced contractors.`;
  }

  return `Looking for ${content.label.toLowerCase()} services in ${city}, ${state}? Professional masonry contractors in the ${city} area specialize in ${content.label.toLowerCase()} and related services. Get quotes from local experts who understand ${state} building requirements and climate conditions.`;
}

/**
 * Generate SEO keywords for a service page.
 */
export function generateServiceKeywords(
  serviceId: ServiceId,
  variables: ServicePageVariables
): string[] {
  const content = SERVICE_CONTENT[serviceId];

  if (!content) {
    return [];
  }

  const { city, state } = variables;
  const baseKeywords = content.keywords;

  // Add city-specific keyword variations
  const cityKeywords = baseKeywords.flatMap((keyword) => [
    `${keyword} ${city}`,
    `${keyword} ${city} ${state}`,
    `${city} ${keyword}`,
  ]);

  return [...baseKeywords, ...cityKeywords];
}

/**
 * Generate breadcrumb items for a service page.
 */
export function generateServiceBreadcrumbs(
  serviceId: ServiceId,
  variables: ServicePageVariables
): BreadcrumbItem[] {
  const content = SERVICE_CONTENT[serviceId];
  const { city, state, citySlug } = variables;

  return [
    { name: 'Home', url: '/' },
    { name: `${city}, ${state}`, url: `/${citySlug}/masonry` },
    { name: content?.label || serviceId, url: `/${citySlug}/masonry/${serviceId}` },
  ];
}

/**
 * Get related services with content for internal linking.
 */
export function getRelatedServicesContent(
  serviceId: ServiceId
): Array<{ id: ServiceId; label: string; shortDescription: string }> {
  const content = SERVICE_CONTENT[serviceId];

  if (!content) {
    return [];
  }

  return content.relatedServices
    .map((id) => {
      const related = SERVICE_CONTENT[id];
      if (!related) return null;
      return {
        id: related.id,
        label: related.label,
        shortDescription: related.shortDescription,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

/**
 * Generate canonical URL for a service page.
 */
export function generateServiceCanonicalUrl(
  serviceId: ServiceId,
  citySlug: string,
  baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com'
): string {
  return `${baseUrl}/${citySlug}/masonry/${serviceId}`;
}

/**
 * Generate Open Graph data for a service page.
 */
export function generateServiceOGData(
  serviceId: ServiceId,
  variables: ServicePageVariables
): {
  title: string;
  description: string;
  url: string;
  type: string;
} {
  const pageContent = generateServicePageContent(serviceId, variables);

  return {
    title: pageContent.seoTitle,
    description: pageContent.seoDescription,
    url: generateServiceCanonicalUrl(serviceId, variables.citySlug),
    type: 'website',
  };
}

/**
 * Truncate string to max length, preserving word boundaries.
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }

  const truncated = str.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace).trim();
  }

  return truncated.trim();
}

/**
 * Check if a service has complete content for SEO pages.
 */
export function hasCompleteServiceContent(serviceId: ServiceId): boolean {
  const content = SERVICE_CONTENT[serviceId];

  if (!content) {
    return false;
  }

  return Boolean(
    content.longDescription &&
      content.longDescription.length > 200 &&
      content.seoTitleTemplate &&
      content.seoDescriptionTemplate &&
      content.commonIssues.length >= 3
  );
}

/**
 * Get all services with complete content.
 * Useful for determining which service pages to generate.
 */
export function getServicesWithCompleteContent(): ServiceId[] {
  return (Object.keys(SERVICE_CONTENT) as ServiceId[]).filter(hasCompleteServiceContent);
}
