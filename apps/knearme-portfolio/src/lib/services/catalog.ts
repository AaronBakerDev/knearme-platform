/**
 * Service Catalog Module — Single source of truth for service data.
 *
 * This module provides a unified API for accessing service type data,
 * with a 3-tier data source priority:
 * 1. Payload CMS (primary - for marketing team edits)
 * 2. Supabase service_types table (database canonical)
 * 3. SERVICE_CONTENT (editorial fallback)
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
 * @see src/payload/collections/ServiceTypes.ts (Payload CMS collection)
 * @see PAY-023 in PRD for Payload CMS integration requirements
 */

import { createAdminClient } from '@/lib/supabase/server';
import { SERVICE_CONTENT, type ServiceContent as FallbackContent } from '@/lib/constants/service-content';
import { getUrlSlugForService, getIconForService } from './slug-mappings';
import { logger } from '@/lib/logging';
import { getServiceType as getPayloadServiceType, getServiceTypes as getPayloadServiceTypes, type ServiceType as PayloadServiceType } from '@/lib/payload/client';
import { escapeHtml } from '@/lib/utils/html';

/**
 * Unified service type combining database, Payload CMS, and fallback content.
 *
 * All fields are guaranteed to have values (from Payload CMS, DB, or fallback).
 * Data priority: Payload CMS > Database > SERVICE_CONTENT fallback
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
  /** Optional headline from Payload CMS (for service landing pages) */
  headline?: string;
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
 * Payload CMS data and fallback content from SERVICE_CONTENT.
 *
 * Data priority: Payload CMS > Database > SERVICE_CONTENT fallback
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

  // Fetch data from both sources in parallel
  const [payloadServices, dbResult] = await Promise.all([
    tryGetPayloadServices(),
    (async () => {
      // Use admin client - service_types is public data and this runs in
      // server context where no user session is available for RLS.
      const supabase = createAdminClient();
      return supabase
        .from('service_types')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
    })(),
  ]);

  const { data, error } = dbResult;

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

  // Create lookup map for Payload services by slug for efficient merging
  const payloadBySlug = new Map(payloadServices.map((p) => [p.slug, p]));

  if (payloadServices.length > 0) {
    logger.info('[getServiceCatalog] Merging with Payload CMS data', {
      payloadCount: payloadServices.length,
      dbCount: dbServices.length,
    });
  }

  // Merge database services with Payload CMS and fallback content
  catalogCache = dbServices.map((db) => mergeWithFallback(db, payloadBySlug));
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
 * Extract plain text from Lexical rich text JSON content.
 * Used to convert Payload CMS descriptions to HTML-safe strings.
 *
 * @param lexicalContent - Lexical editor JSON content
 * @returns Plain text or HTML paragraph string
 */
function extractTextFromLexical(lexicalContent: unknown): string {
  if (!lexicalContent || typeof lexicalContent !== 'object') {
    return '';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content = lexicalContent as any;
  const root = content.root;
  if (!root?.children) {
    return '';
  }

  /**
   * Recursively extract text from Lexical nodes
   */
  function extractFromNodes(nodes: unknown[]): string {
    if (!Array.isArray(nodes)) return '';

    return nodes
      .map((node) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const n = node as any;
        if (!n) return '';

        // Text node
        if (n.type === 'text' && typeof n.text === 'string') {
          return escapeHtml(n.text);
        }

        // Paragraph, heading, list item - extract children
        if (n.children && Array.isArray(n.children)) {
          const childText = extractFromNodes(n.children);
          // Wrap in paragraph for paragraph nodes
          if (n.type === 'paragraph') {
            return `<p>${childText}</p>`;
          }
          if (n.type === 'heading') {
            const tag = n.tag || 'h2';
            return `<${tag}>${childText}</${tag}>`;
          }
          return childText;
        }

        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  return extractFromNodes(root.children);
}

/**
 * Try to get service type data from Payload CMS.
 * Returns null if Payload is unavailable or service not found.
 *
 * Note: Prefixed with _ as currently unused but kept for future single-item lookups.
 *
 * @param slug - Service type slug (URL-friendly)
 * @returns Payload service type or null
 */
async function _tryGetPayloadService(slug: string): Promise<PayloadServiceType | null> {
  try {
    return await getPayloadServiceType(slug);
  } catch {
    // Silently return null - Payload unavailability is expected during fallback
    return null;
  }
}

/**
 * Try to get all service types from Payload CMS.
 * Returns empty array if Payload is unavailable.
 */
async function tryGetPayloadServices(): Promise<PayloadServiceType[]> {
  try {
    return await getPayloadServiceTypes();
  } catch {
    // Silently return empty array - Payload unavailability is expected during fallback
    return [];
  }
}

/**
 * Convert database row to CatalogService, merging with Payload CMS data and fallback.
 * Priority: Payload CMS > Database > SERVICE_CONTENT fallback
 *
 * @param db - Database row from service_types table
 * @param payloadBySlug - Map of Payload service types by slug for efficient lookup
 */
function mergeWithFallback(db: DbServiceType, payloadBySlug?: Map<string, PayloadServiceType>): CatalogService {
  const fallback = SERVICE_CONTENT[db.service_id as keyof typeof SERVICE_CONTENT] as FallbackContent | undefined;
  const payload = payloadBySlug?.get(db.url_slug);

  // Extract description from Payload CMS if available
  const payloadDescription = payload?.description ? extractTextFromLexical(payload.description) : '';
  const payloadFeatures = payload?.features?.map((f) => f.text) || [];

  return {
    id: db.id,
    serviceId: db.service_id,
    urlSlug: db.url_slug,
    label: payload?.name || db.label,
    shortDescription: db.short_description, // Keep DB short description (not in Payload)
    // Priority: Payload CMS description > DB > fallback
    longDescription: payloadDescription || db.long_description || fallback?.longDescription || '',
    seoTitle: db.seo_title || fallback?.seoTitleTemplate || '',
    seoDescription: payload?.metaDescription || db.seo_description || fallback?.seoDescriptionTemplate || '',
    // Use Payload features as commonIssues if available (similar content type)
    commonIssues: payloadFeatures.length > 0 ? payloadFeatures : (db.common_issues || fallback?.commonIssues || []),
    keywords: db.keywords || fallback?.keywords || [],
    processSteps: db.process_steps || fallback?.processSteps || [],
    costFactors: db.cost_factors || fallback?.costFactors || [],
    faqs: db.faqs || fallback?.faqs || [],
    relatedServices: fallback?.relatedServices || [],
    trade: db.trade,
    iconEmoji: db.icon_emoji || getIconForService(db.service_id),
    sortOrder: db.sort_order,
    isPublished: db.is_published,
    source: payload ? 'merged' : (fallback ? 'merged' : 'database'),
    // Store Payload headline for service pages that want to use it
    ...(payload?.headline && { headline: payload.headline }),
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
