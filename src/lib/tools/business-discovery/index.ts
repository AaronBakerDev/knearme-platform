/**
 * Business Discovery Tools
 *
 * Enables the Discovery Agent to look up businesses by name during onboarding,
 * supporting the "Is this you?" confirmation flow.
 *
 * @example
 * ```typescript
 * import { createDataForSEOClient, searchBusinesses } from '@/lib/tools/business-discovery';
 *
 * // User: "I'm Rocky Mountain Woodworks in Denver"
 * const client = createDataForSEOClient();
 * const results = await client.searchBusinesses('Rocky Mountain Woodworks', 'Denver');
 *
 * // Agent: "Is this you? Rocky Mountain Woodworks at 1234 Pine St?"
 * const match = results[0];
 * console.log(match.name, match.address);
 * ```
 *
 * @see /docs/philosophy/agentic-first-experience.md - Business Discovery Tools
 * @see /docs/philosophy/implementation-roadmap.md - Phase 1: Agentic Onboarding
 */

export {
  DataForSEOClient,
  createDataForSEOClient,
  parseLocationFromAddress,
  discoveredBusinessToProfile,
} from './client';

export type {
  DataForSEOCredentials,
  TaskMeta,
  GoogleMapsResult,
  GoogleReview,
  GoogleReviewsResult,
  DiscoveredBusiness,
  DiscoveredProfileData,
} from './types';

export {
  US_STATE_NAMES,
  CANADA_PROVINCE_NAMES,
  COUNTRY_NAMES,
} from './types';

// =============================================================================
// Convenience Functions (for agents)
// =============================================================================

import { createDataForSEOClient } from './client';
import type { DiscoveredBusiness, GoogleReviewsResult } from './types';

/** Singleton client for reuse */
let clientInstance: ReturnType<typeof createDataForSEOClient> | null = null;

function getClient() {
  if (!clientInstance) {
    clientInstance = createDataForSEOClient();
  }
  return clientInstance;
}

/**
 * Search for businesses by name and location.
 * Convenience wrapper for Discovery Agent.
 *
 * @param businessName - Business name to search for
 * @param location - City and state (e.g., "Denver, CO")
 * @param limit - Max results to return (default: 5)
 * @returns Array of discovered businesses
 */
export async function searchBusinesses(
  businessName: string,
  location: string,
  limit = 5
): Promise<DiscoveredBusiness[]> {
  const client = getClient();
  return client.searchBusinesses(businessName, location, limit);
}

/**
 * Get reviews for a confirmed business.
 * Used to gather social proof and review content for profile/bio generation.
 *
 * @param cid - Google CID from the confirmed business
 * @param locationName - Location name (e.g., "Denver,Colorado,United States")
 * @param maxReviews - Max reviews to fetch (default: 10)
 * @returns Reviews result or null if failed
 *
 * @example
 * ```typescript
 * // After user confirms business
 * const reviews = await getBusinessReviews(business.googleCid, 'United States', 10);
 * if (reviews) {
 *   console.log(`Found ${reviews.reviews.length} reviews`);
 * }
 * ```
 */
export async function getBusinessReviews(
  cid: string,
  locationName = 'United States',
  maxReviews = 10
): Promise<GoogleReviewsResult | null> {
  const client = getClient();
  const { results } = await client.getGoogleReviews(cid, locationName, maxReviews);
  return results;
}
