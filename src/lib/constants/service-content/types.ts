import type { ServiceId } from '../services';

/**
 * FAQ item for FAQ schema markup.
 */
export interface ServiceFAQ {
  question: string;
  answer: string;
}

/**
 * Standardized process step for service pages.
 */
export interface ServiceProcessStep {
  /** Step title shown in the Process Overview */
  title: string;
  /** Brief explanation of what happens during this step */
  description: string;
  /** Optional time expectation shown as a chip (e.g., "1-2 days") */
  duration?: string;
}

/**
 * Cost factor displayed in the pricing guidance section.
 */
export interface ServiceCostFactor {
  /** What drives the cost */
  label: string;
  /** How the factor affects pricing */
  description: string;
  /** Typical dollar range to set expectations */
  typicalRange?: string;
}

/**
 * Complete content definition for a service type.
 * Used to generate programmatic SEO pages.
 */
export interface ServiceContent {
  /** Service identifier (matches ServiceId from services.ts) */
  id: ServiceId;
  /** Display label for the service */
  label: string;
  /** Short description for cards/lists (~100 chars) */
  shortDescription: string;
  /** Long description for service pages (300-400 words, can include HTML) */
  longDescription: string;
  /** SEO title template with {city}, {state} placeholders */
  seoTitleTemplate: string;
  /** SEO description template with {city}, {count} placeholders (max 155 chars) */
  seoDescriptionTemplate: string;
  /** Common issues/problems this service addresses (4-6 items) */
  commonIssues: string[];
  /** Target keywords for this service */
  keywords: string[];
  /** Related service IDs for internal linking */
  relatedServices: ServiceId[];
  /** FAQ items for FAQ schema (optional, 3-5 items) */
  faqs?: ServiceFAQ[];
  /** Process overview steps for the service (4-6 items) */
  processSteps: ServiceProcessStep[];
  /** Cost guidance factors for the service */
  costFactors: ServiceCostFactor[];
}

export type ServiceContentMap = Record<ServiceId, ServiceContent>;
export type ServiceContentPartial = Partial<ServiceContentMap>;
