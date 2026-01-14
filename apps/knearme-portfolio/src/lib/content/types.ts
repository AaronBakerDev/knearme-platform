/**
 * Shared content type definitions for SEO pages.
 *
 * These types define the structure of content used across
 * programmatic SEO pages and future editorial content.
 *
 * @see /docs/11-seo-discovery/ for content strategy documentation
 */

import type { ServiceId } from '@/lib/constants/services';

/**
 * Variables available for template interpolation.
 * Used in SEO title/description templates.
 */
export interface ServicePageVariables {
  /** City name (e.g., "Denver") */
  city: string;
  /** State abbreviation (e.g., "CO") */
  state: string;
  /** Full state name (e.g., "Colorado") */
  stateFull: string;
  /** URL-safe city slug (e.g., "denver-co") */
  citySlug: string;
  /** Number of published projects in this city/service */
  projectCount: number;
  /** Number of contractors serving this city/service */
  contractorCount: number;
  /** Service display label (e.g., "Chimney Repair") */
  serviceLabel: string;
  /** Service slug (e.g., "chimney-repair") */
  serviceSlug: ServiceId;
}

/**
 * Generated content for a service page.
 * Output from the template generator.
 */
export interface ServicePageContent {
  /** Page H1 heading */
  h1: string;
  /** SEO meta title (max 60 chars) */
  seoTitle: string;
  /** SEO meta description (max 155 chars) */
  seoDescription: string;
  /** Intro paragraph with city-specific content */
  introText: string;
  /** Main service description (HTML) */
  description: string;
  /** List of common issues this service addresses */
  commonIssues: string[];
  /** Related service IDs for internal linking */
  relatedServices: ServiceId[];
  /** FAQ items for structured data */
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

/**
 * Breadcrumb item for navigation and structured data.
 */
export interface BreadcrumbItem {
  /** Display name */
  name: string;
  /** URL path (relative) */
  url: string;
}

/**
 * Page metadata for SEO.
 */
export interface PageMeta {
  /** Page title for <title> tag */
  title: string;
  /** Meta description */
  description: string;
  /** Canonical URL */
  canonicalUrl?: string;
  /** Open Graph image URL */
  ogImage?: string;
  /** Keywords array */
  keywords?: string[];
  /** Structured data objects */
  structuredData?: Record<string, unknown>[];
}

/**
 * MDX frontmatter for editorial content (Phase 3).
 * Used in /content/services/, /content/learn/, /content/guides/
 */
export interface EditorialFrontmatter {
  /** Article title */
  title: string;
  /** SEO meta description */
  description: string;
  /** Publication date (ISO string) */
  publishedAt: string;
  /** Last updated date (ISO string) */
  updatedAt?: string;
  /** Content author */
  author?: string;
  /** Featured image URL */
  featuredImage?: string;
  /** Content category */
  category: 'service' | 'guide' | 'article';
  /** Related service IDs */
  relatedServices?: ServiceId[];
  /** Target keywords */
  keywords?: string[];
  /** Reading time in minutes */
  readingTime?: number;
  /** Draft status */
  draft?: boolean;
}

/**
 * Editorial content item (parsed MDX).
 */
export interface EditorialContent {
  /** URL slug */
  slug: string;
  /** Frontmatter metadata */
  frontmatter: EditorialFrontmatter;
  /** Raw MDX content */
  content: string;
}

/**
 * City data for geographic pages.
 */
export interface CityData {
  /** City name */
  name: string;
  /** State abbreviation */
  state: string;
  /** Full state name */
  stateFull: string;
  /** URL-safe slug */
  slug: string;
  /** Population (for prioritization) */
  population?: number;
  /** Metro area name */
  metroArea?: string;
}

/**
 * Content block for flexible page layouts.
 */
export interface ContentBlock {
  /** Block type */
  type: 'hero' | 'text' | 'projects' | 'contractors' | 'cta' | 'faq';
  /** Block heading */
  heading?: string;
  /** Block content (HTML or plain text) */
  content?: string;
  /** Additional block data */
  data?: Record<string, unknown>;
}
