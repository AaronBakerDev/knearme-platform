/**
 * Service Catalog Module — Single source of truth for service data.
 *
 * This module provides a unified API for accessing service type data,
 * combining database records with fallback content from SERVICE_CONTENT.
 *
 * PHILOSOPHY: Database is canonical; SERVICE_CONTENT is editorial fallback.
 *
 * Usage:
 * ```ts
 * import { getServiceCatalog, getServiceBySlug, getServiceById } from '@/lib/services/catalog';
 *
 * // Get all published services
 * const services = await getServiceCatalog();
 *
 * // Get by URL slug (for routing)
 * const service = await getServiceBySlug('stone-masonry');
 *
 * // Get by internal ID (for queries)
 * const service = await getServiceById('stone-work');
 * ```
 *
 * CACHE BEHAVIOR:
 * - In-memory cache with 1-hour TTL
 * - Call clearCatalogCache() after updating service_types in database
 * - Server restart clears cache automatically
 * - Run seed script before app starts, not during runtime
 *
 * @see supabase/migrations/032_add_service_types.sql
 * @see src/lib/constants/service-content.ts (fallback content)
 * @see src/lib/services/slug-mappings.ts (slug/icon fallbacks)
 */

import { createAdminClient } from '@/lib/supabase/server';
import { SERVICE_CONTENT, type ServiceContent as FallbackContent } from '@/lib/constants/service-content';
import { getUrlSlugForService, getIconForService } from './slug-mappings';
import { logger } from '@/lib/logging';

/**
 * Unified service type combining database and fallback content.
 *
 * All fields are guaranteed to have values (from DB or fallback).
 */
export interface CatalogService {
  /** UUID from database (null if from fallback only) */
  id: string | null;
  /** Internal service ID (e.g., 'stone-work') */
  serviceId: string;
  /** URL slug for routing (e.g., 'stone-masonry') */
  urlSlug: string;
  /** Display label */
  label: string;
  /** Short description (~100 chars) */
  shortDescription: string;
  /** Long description (HTML, 300-400 words) */
  longDescription: string;
  /** SEO title template */
  seoTitle: string;
  /** SEO description template */
  seoDescription: string;
  /** Common issues array */
  commonIssues: string[];
  /** Target keywords */
  keywords: string[];
  /** Process steps with title, description, duration */
  processSteps: ProcessStep[];
  /** Cost factors with label, description, range */
  costFactors: CostFactor[];
  /** FAQ items */
  faqs: FAQ[];
  /** Related service IDs */
  relatedServices: string[];
  /** Trade category (e.g., 'masonry', 'plumbing') */
  trade: string;
  /** Emoji icon */
  iconEmoji: string;
  /** Display order */
  sortOrder: number;
  /** Whether service is published */
  isPublished: boolean;
  /** Data source indicator */
  source: 'database' | 'fallback' | 'merged';
}

export interface ProcessStep {
  title: string;
  description: string;
  duration?: string;
}

export interface CostFactor {
  label: string;
  description: string;
  typicalRange?: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

/**
 * Raw database row from service_types table.
 */
interface DbServiceType {
  id: string;
  service_id: string;
  url_slug: string;
  label: string;
  short_description: string;
  long_description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  common_issues: string[] | null;
  keywords: string[] | null;
  process_steps: ProcessStep[] | null;
  cost_factors: CostFactor[] | null;
  faqs: FAQ[] | null;
  trade: string;
  is_published: boolean;
  sort_order: number;
  icon_emoji: string | null;
}

/**
 * In-memory cache for service catalog.
 */
let catalogCache: CatalogService[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 3600000; // 1 hour

/**
 * Clear the service catalog cache.
 * Call this after updating service types in the database.
 */
export function clearCatalogCache(): void {
  catalogCache = null;
  cacheTimestamp = 0;
}

/**
 * Get the full service catalog.
 *
 * Returns all published services from the database, merged with
 * fallback content from SERVICE_CONTENT for any missing fields.
 *
 * If the database has no service_types, falls back entirely to SERVICE_CONTENT.
 *
 * @param forceRefresh - Bypass cache and fetch fresh data
 * @returns Array of services sorted by sort_order
 */
export async function getServiceCatalog(forceRefresh = false): Promise<CatalogService[]> {
  const now = Date.now();

  // Return cached data if valid
  if (!forceRefresh && catalogCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return catalogCache;
  }

  // Use admin client - service_types is public data and this runs in
  // server context where no user session is available for RLS.
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('service_types')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error) {
    logger.error('[getServiceCatalog] Database error', { error });
    // Fall back to SERVICE_CONTENT on error
    return getFallbackCatalog();
  }

  const dbServices = (data || []) as DbServiceType[];

  // If database is empty, use fallback
  if (dbServices.length === 0) {
    logger.info('[getServiceCatalog] No database services, using fallback');
    catalogCache = getFallbackCatalog();
    cacheTimestamp = now;
    return catalogCache;
  }

  // Merge database services with fallback content
  catalogCache = dbServices.map((db) => mergeWithFallback(db));
  cacheTimestamp = now;

  return catalogCache;
}

/**
 * Get a service by its URL slug.
 *
 * @param urlSlug - The URL slug (e.g., 'stone-masonry')
 * @returns Service or null if not found
 */
export async function getServiceBySlug(urlSlug: string): Promise<CatalogService | null> {
  const catalog = await getServiceCatalog();
  return catalog.find((s) => s.urlSlug === urlSlug) || null;
}

/**
 * Get a service by its internal service ID.
 *
 * @param serviceId - The internal ID (e.g., 'stone-work')
 * @returns Service or null if not found
 */
export async function getServiceById(serviceId: string): Promise<CatalogService | null> {
  const catalog = await getServiceCatalog();
  return catalog.find((s) => s.serviceId === serviceId) || null;
}

/**
 * Get all URL slugs for static generation.
 *
 * @returns Array of URL slugs
 */
export async function getServiceSlugs(): Promise<string[]> {
  const catalog = await getServiceCatalog();
  return catalog.map((s) => s.urlSlug);
}

/**
 * Get services filtered by trade.
 *
 * @param trade - Trade category (e.g., 'masonry')
 * @returns Array of services for that trade
 */
export async function getServicesByTrade(trade: string): Promise<CatalogService[]> {
  const catalog = await getServiceCatalog();
  return catalog.filter((s) => s.trade === trade);
}

/**
 * Get services as options for form select fields.
 *
 * @param trade - Optional trade filter
 * @returns Array of { id, label, icon } for form usage
 */
export async function getServiceOptions(trade?: string): Promise<Array<{ id: string; label: string; icon: string }>> {
  const catalog = trade ? await getServicesByTrade(trade) : await getServiceCatalog();
  return catalog.map((s) => ({
    id: s.serviceId,
    label: s.label,
    icon: s.iconEmoji,
  }));
}

/**
 * Convert database row to CatalogService, merging with fallback.
 */
function mergeWithFallback(db: DbServiceType): CatalogService {
  const fallback = SERVICE_CONTENT[db.service_id as keyof typeof SERVICE_CONTENT] as FallbackContent | undefined;

  return {
    id: db.id,
    serviceId: db.service_id,
    urlSlug: db.url_slug,
    label: db.label,
    shortDescription: db.short_description,
    longDescription: db.long_description || fallback?.longDescription || '',
    seoTitle: db.seo_title || fallback?.seoTitleTemplate || '',
    seoDescription: db.seo_description || fallback?.seoDescriptionTemplate || '',
    commonIssues: db.common_issues || fallback?.commonIssues || [],
    keywords: db.keywords || fallback?.keywords || [],
    processSteps: db.process_steps || fallback?.processSteps || [],
    costFactors: db.cost_factors || fallback?.costFactors || [],
    faqs: db.faqs || fallback?.faqs || [],
    relatedServices: fallback?.relatedServices || [],
    trade: db.trade,
    iconEmoji: db.icon_emoji || getIconForService(db.service_id),
    sortOrder: db.sort_order,
    isPublished: db.is_published,
    source: fallback ? 'merged' : 'database',
  };
}

/**
 * Generate catalog from SERVICE_CONTENT fallback.
 * Used when database has no service_types.
 */
function getFallbackCatalog(): CatalogService[] {
  const entries = Object.entries(SERVICE_CONTENT) as [string, FallbackContent][];

  return entries.map(([serviceId, content], index) => ({
    id: null,
    serviceId,
    urlSlug: getUrlSlugForService(serviceId),
    label: content.label,
    shortDescription: content.shortDescription,
    longDescription: content.longDescription,
    seoTitle: content.seoTitleTemplate,
    seoDescription: content.seoDescriptionTemplate,
    commonIssues: content.commonIssues,
    keywords: content.keywords,
    processSteps: content.processSteps,
    costFactors: content.costFactors,
    faqs: content.faqs || [],
    relatedServices: content.relatedServices,
    trade: 'masonry',
    iconEmoji: getIconForService(serviceId),
    sortOrder: index,
    isPublished: true,
    source: 'fallback',
  }));
}

// Slug and icon mapping functions imported from ./slug-mappings.ts
