import type { WebSearchAgentResult, SocialProfiles } from '../web-search';

/**
 * Web enrichment data gathered in parallel with DataForSEO search.
 * This provides richer context (website, years in business, about info).
 */
export interface WebEnrichmentData {
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  aboutDescription?: string;
  yearsInBusiness?: string;
  services?: string[];
  specialties?: string[];
  serviceAreas?: string[];
  sources?: Array<{ url: string; title?: string }>;
  /**
   * Social media profile URLs discovered via web search.
   * Only populated when actual URLs are found - never guessed.
   *
   * @see SocialProfiles in ../web-search.ts
   * @see BRI-006 in .claude/ralph/prds/current.json
   */
  socialProfiles?: SocialProfiles;
  /**
   * Portfolio or gallery page URL if the business has one.
   * Could be on their main site (e.g., /gallery, /portfolio) or a third-party platform.
   *
   * @see BRI-006 in .claude/ralph/prds/current.json
   */
  portfolioUrl?: string;
}

export interface SearchBusinessResult {
  found: boolean;
  message: string;
  results: Array<{
    name: string;
    address: string | null;
    phone: string | null;
    website: string | null;
    rating: number | null;
    reviewCount: number | null;
    category: string | null;
    googlePlaceId: string | null;
    googleCid: string | null;
    coordinates: { lat: number; lng: number } | null;
    /**
     * Whether the business listing is claimed on Google.
     * Claimed listings indicate verified ownership and are more trustworthy.
     *
     * @see DiscoveredBusiness.isClaimed in ../../tools/business-discovery/types.ts
     * @see BRI-006 in .claude/ralph/prds/current.json
     */
    isClaimed?: boolean;
    /**
     * Business operating hours by day of week.
     * Format: { "Monday": "9:00 AM - 5:00 PM", "Tuesday": "9:00 AM - 5:00 PM", ... }
     * Null means hours are not available from Google.
     *
     * @see DiscoveredBusiness.workHours in ../../tools/business-discovery/types.ts
     * @see BRI-006 in .claude/ralph/prds/current.json
     */
    workHours?: Record<string, string> | null;
  }>;
  error?: boolean;
  /** Web enrichment data gathered in parallel - provides richer context */
  webEnrichment?: WebEnrichmentData;
}

export interface ConfirmBusinessResult {
  confirmed: boolean;
  data: {
    googlePlaceId: string;
    googleCid?: string;
    businessName: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    website?: string;
    category?: string;
    rating?: number;
    reviewCount?: number;
    /**
     * Whether the business listing is claimed on Google.
     * Carried through from search results when user confirms their business.
     *
     * @see DiscoveredBusiness.isClaimed in ../../tools/business-discovery/types.ts
     * @see BRI-006 in .claude/ralph/prds/current.json
     */
    isClaimed?: boolean;
    /**
     * Business operating hours by day of week.
     * Carried through from search results when user confirms their business.
     *
     * @see DiscoveredBusiness.workHours in ../../tools/business-discovery/types.ts
     * @see BRI-006 in .claude/ralph/prds/current.json
     */
    workHours?: Record<string, string> | null;
  };
}

export interface FetchReviewsResult {
  success: boolean;
  reviews: Array<{
    text: string;
    rating: number;
    reviewerName: string | null;
    timeAgo: string | null;
    hasImages: boolean;
    imageUrls: string[] | null;
  }>;
  rating: number | null;
  reviewCount: number | null;
  error?: string;
}

export interface SaveProfileResult {
  saved: boolean;
  profile: {
    businessName: string;
    address?: string;
    phone: string;
    website?: string;
    city: string;
    state: string;
    description?: string;
    services: string[];
    serviceAreas: string[];
    hideAddress?: boolean;
  };
}

/**
 * Project suggestion from reviews with photos or web portfolio.
 */
export interface ProfileRevealProjectSuggestion {
  title: string;
  description?: string;
  source: 'review' | 'web';
  imageUrls?: string[];
}

/**
 * Result from showProfileReveal tool - the "wow" moment data.
 *
 * @see /docs/specs/typeform-onboarding-spec.md - Phase 5: Reveal Artifact
 */
export interface ProfileRevealResult {
  revealed: boolean;
  profile: {
    businessName: string;
    address?: string;
    city: string;
    state: string;
    phone?: string;
    website?: string;
    services: string[];
    rating?: number;
    reviewCount?: number;
    celebrationMessage: string;
    /** AI-synthesized bio blending reviews + web content */
    bio?: string;
    /** 2-3 best review quotes */
    highlights?: string[];
    /** Years in business if discovered */
    yearsInBusiness?: string;
    /** Project suggestions from reviews with photos or web portfolio */
    projectSuggestions?: ProfileRevealProjectSuggestion[];
    /** Service area business - do not display address */
    hideAddress?: boolean;
  };
}

export type WebSearchBusinessResult = WebSearchAgentResult;
