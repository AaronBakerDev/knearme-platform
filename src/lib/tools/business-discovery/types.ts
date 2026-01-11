/**
 * Type definitions for Business Discovery tools
 *
 * These types support the Discovery Agent's ability to look up businesses
 * via DataForSEO's Google Maps and Reviews APIs.
 *
 * @see /docs/philosophy/agentic-first-experience.md - Agent Toolbox section
 */

// =============================================================================
// DataForSEO API Types
// =============================================================================

export interface DataForSEOCredentials {
  login: string;
  password: string;
}

export interface TaskMeta {
  status_code?: number;
  status_message?: string;
}

/**
 * Result from Google Maps search - business info for onboarding
 *
 * This is what the Discovery Agent shows to confirm a business identity.
 *
 * @see https://docs.dataforseo.com/v3/serp/google/maps/live/advanced/
 */
export interface GoogleMapsResult {
  /** Business name as shown on Google Maps */
  title: string;
  /** Google Place ID - unique identifier */
  place_id: string | null;
  /** Google CID - customer ID, used for reviews lookup */
  cid: string | null;
  /** Full street address */
  address: string | null;
  /** Phone number */
  phone: string | null;
  /** Website URL */
  website: string | null;
  /** Average rating (1-5) */
  rating: number | null;
  /** Total number of reviews */
  reviews_count: number | null;
  /** Business category from Google */
  category: string | null;
  /** Position in search results */
  position: number;
  /** GPS coordinates */
  latitude: number | null;
  longitude: number | null;
  /** Whether business is claimed on Google */
  is_claimed: boolean;
  /** Business hours by day */
  work_hours: Record<string, string> | null;
}

/**
 * Individual review from Google Reviews API
 *
 * @see https://docs.dataforseo.com/v3/business_data/google/reviews/task_get/
 */
export interface GoogleReview {
  review_id: string | null;
  review_text: string | null;
  original_review_text: string | null;
  rating: number;
  reviewer_name: string | null;
  reviewer_url: string | null;
  review_url: string | null;
  time_ago: string | null;
  timestamp: string | null;
  owner_response: string | null;
  owner_response_timestamp: string | null;
  review_images: string[] | null;
}

/**
 * Result from Google Reviews API
 */
export interface GoogleReviewsResult {
  place_id: string;
  cid: string | null;
  reviews: GoogleReview[];
  rating: number | null;
  reviews_count: number | null;
}

// =============================================================================
// Business Discovery Result Types (for Agent use)
// =============================================================================

/**
 * Simplified business result for Discovery Agent to present to user
 *
 * This is the "Is this you?" confirmation card data.
 */
export interface DiscoveredBusiness {
  /** Business name */
  name: string;
  /** Full address for confirmation */
  address: string | null;
  /** Phone for confirmation */
  phone: string | null;
  /** Website for confirmation */
  website: string | null;
  /** Rating to show credibility */
  rating: number | null;
  /** Review count for context */
  reviewCount: number | null;
  /** Business category (helps with type inference) */
  category: string | null;
  /** Google Place ID for storage */
  googlePlaceId: string | null;
  /** Google CID for reviews lookup */
  googleCid: string | null;
  /** Coordinates for map preview */
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  /**
   * Whether the business listing is claimed on Google.
   * Claimed listings indicate verified ownership and are more trustworthy.
   * @see GoogleMapsResult.is_claimed - source field from DataForSEO API
   */
  isClaimed?: boolean;
  /**
   * Business operating hours by day of week.
   * Format: { "Monday": "9:00 AM - 5:00 PM", "Tuesday": "9:00 AM - 5:00 PM", ... }
   * Null means hours are not available from Google.
   * @see GoogleMapsResult.work_hours - source field from DataForSEO API
   */
  workHours?: Record<string, string> | null;
}

/**
 * Business profile data to auto-populate from discovery
 *
 * Maps to contractors table columns.
 */
export interface DiscoveredProfileData {
  business_name: string;
  city: string;
  state: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  google_place_id: string | null;
  google_cid: string | null;
  /** Raw API response for future reference */
  discovered_data: GoogleMapsResult;
  /** How they onboarded */
  onboarding_method: 'conversation' | 'form';
}

// =============================================================================
// Location Mapping
// =============================================================================

/**
 * US state abbreviation to full name mapping
 * Used for formatting location names for Reviews API
 */
export const US_STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

/**
 * Canadian province abbreviation to full name mapping
 */
export const CANADA_PROVINCE_NAMES: Record<string, string> = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  NS: 'Nova Scotia',
  NT: 'Northwest Territories',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Quebec',
  SK: 'Saskatchewan',
  YT: 'Yukon',
};

/**
 * Country abbreviation to full name mapping
 */
export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  USA: 'United States',
  CA: 'Canada',
  CAN: 'Canada',
};
