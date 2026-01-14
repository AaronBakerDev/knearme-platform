/**
 * Extended service content for SEO pages.
 *
 * This file contains detailed content for each masonry service type,
 * used to generate Service Type by City pages (e.g., /denver-co/masonry/chimney-repair).
 *
 * Content structure:
 * - shortDescription: For cards/lists (~100 chars)
 * - longDescription: For service pages (300-400 words)
 * - seoTitleTemplate: Meta title with {city}, {state} variables
 * - seoDescriptionTemplate: Meta description with {city}, {count} variables
 * - commonIssues: H2/H3 content sections
 * - keywords: Target search terms
 * - relatedServices: For internal linking
 * - faqs: For FAQ schema (future)
 *
 * @see /docs/11-seo-discovery/page-templates/service-type-city.md
 */

import type { ServiceId } from './services';
import type { ServiceContent, ServiceContentMap } from './service-content/types';
import { REPAIR_SERVICE_CONTENT } from './service-content/repair';
import { CONSTRUCTION_SERVICE_CONTENT } from './service-content/construction';
import { SPECIALTY_SERVICE_CONTENT } from './service-content/specialty';

export type {
  ServiceContent,
  ServiceFAQ,
  ServiceProcessStep,
  ServiceCostFactor,
} from './service-content/types';

/**
 * Complete content for all masonry service types.
 *
 * Priority services (Phase 2):
 * - chimney-repair (2,400/mo search volume)
 * - foundation-repair (3,600/mo)
 * - tuckpointing (1,800/mo)
 * - brick-repair (1,600/mo)
 * - stone-work (1,200/mo)
 * - restoration (480/mo)
 */
export const SERVICE_CONTENT = {
  ...REPAIR_SERVICE_CONTENT,
  ...CONSTRUCTION_SERVICE_CONTENT,
  ...SPECIALTY_SERVICE_CONTENT,
} satisfies ServiceContentMap;

/**
 * Get service content by ID.
 */
export function getServiceContent(serviceId: ServiceId): ServiceContent | undefined {
  return SERVICE_CONTENT[serviceId];
}

/**
 * Get all service content entries.
 */
export function getAllServiceContent(): ServiceContent[] {
  return Object.values(SERVICE_CONTENT);
}

/**
 * Get priority services (high search volume).
 * These are the focus for Phase 2 SEO implementation.
 */
export function getPriorityServices(): ServiceContent[] {
  const priorityIds: ServiceId[] = [
    'chimney-repair',
    'foundation-repair',
    'tuckpointing',
    'brick-repair',
    'stone-work',
    'restoration',
  ];
  return priorityIds.map((id) => SERVICE_CONTENT[id]);
}
