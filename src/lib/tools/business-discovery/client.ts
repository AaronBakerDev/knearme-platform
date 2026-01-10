/**
 * DataForSEO API Client for Business Discovery
 *
 * Enables the Discovery Agent to look up businesses by name and location,
 * supporting the "Is this you?" onboarding flow.
 *
 * Cost estimates (as of Jan 2025):
 * - Google Maps search: ~$0.001 per search
 * - Google Reviews: ~$0.00075 per 10 reviews
 *
 * @see /docs/philosophy/agentic-first-experience.md - Business Discovery Tools section
 * @see https://docs.dataforseo.com/v3/serp/google/maps/live/advanced/
 */

import type {
  DataForSEOCredentials,
  TaskMeta,
  GoogleMapsResult,
  GoogleReviewsResult,
  DiscoveredBusiness,
  DiscoveredProfileData,
} from './types';
import { logger } from '@/lib/logging';

const BASE_URL = 'https://api.dataforseo.com/v3';

/** Maximum time to wait for async task completion (90 seconds) */
const TASK_POLL_TIMEOUT_MS = 90000;

/** Interval between polling for task results (3 seconds) */
const TASK_POLL_INTERVAL_MS = 3000;

/** Initial wait before first poll (5 seconds) */
const TASK_INITIAL_WAIT_MS = 5000;

/**
 * DataForSEO location codes for different countries
 * @see https://docs.dataforseo.com/v3/appendix/locations/
 */
const DATAFORSEO_LOCATION_CODES = {
  US: 2840,     // United States
  CA: 2124,     // Canada
  GB: 2826,     // United Kingdom
  AU: 2036,     // Australia
} as const;

/**
 * Canadian province abbreviations for location detection
 */
const CANADA_PROVINCES = new Set([
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
]);

/**
 * Detect country from location string and return DataForSEO location code.
 * Looks for Canadian province codes or country indicators.
 *
 * @param location - Location string (e.g., "Hamilton, ON", "Denver, CO", "Toronto, Canada")
 * @returns DataForSEO location code (defaults to US if not detected)
 *
 * @example
 * getLocationCode("Hamilton, ON") // → 2124 (Canada)
 * getLocationCode("Denver, CO")   // → 2840 (US)
 * getLocationCode("Toronto")      // → 2840 (US, default)
 */
function getLocationCode(location: string): number {
  const upperLocation = location.toUpperCase();

  // Check for Canadian province codes (e.g., "ON", "BC", "QC")
  for (const province of CANADA_PROVINCES) {
    // Match province code as word boundary (e.g., ", ON" or " ON " but not "ONTARIO")
    const provinceRegex = new RegExp(`\\b${province}\\b`);
    if (provinceRegex.test(upperLocation)) {
      return DATAFORSEO_LOCATION_CODES.CA;
    }
  }

  // Check for explicit country names
  if (upperLocation.includes('CANADA') || upperLocation.includes(', CA')) {
    return DATAFORSEO_LOCATION_CODES.CA;
  }
  if (upperLocation.includes('UNITED KINGDOM') || upperLocation.includes(', UK') || upperLocation.includes(', GB')) {
    return DATAFORSEO_LOCATION_CODES.GB;
  }
  if (upperLocation.includes('AUSTRALIA') || upperLocation.includes(', AU')) {
    return DATAFORSEO_LOCATION_CODES.AU;
  }

  // Default to US
  return DATAFORSEO_LOCATION_CODES.US;
}

/**
 * Get country name from location string for reviews API.
 * @param location - Location string
 * @returns Country name for DataForSEO reviews API
 */
export function getCountryName(location: string): string {
  const locationCode = getLocationCode(location);
  switch (locationCode) {
    case DATAFORSEO_LOCATION_CODES.CA:
      return 'Canada';
    case DATAFORSEO_LOCATION_CODES.GB:
      return 'United Kingdom';
    case DATAFORSEO_LOCATION_CODES.AU:
      return 'Australia';
    default:
      return 'United States';
  }
}

/**
 * DataForSEO API Client
 *
 * Provides methods to search Google Maps for businesses and fetch their reviews.
 * Optimized for the agentic onboarding flow where a user says their business name
 * and the agent confirms their identity.
 *
 * @example
 * ```typescript
 * const client = new DataForSEOClient({
 *   login: process.env.DATAFORSEO_LOGIN!,
 *   password: process.env.DATAFORSEO_PASSWORD!
 * });
 *
 * // User says "I'm Rocky Mountain Woodworks"
 * const businesses = await client.searchBusinesses('Rocky Mountain Woodworks', 'Denver');
 *
 * // Show confirmation: "Is this you at 1234 Pine St?"
 * logger.info('Business match', {
 *   name: businesses[0].name,
 *   address: businesses[0].address,
 * });
 * ```
 */
export class DataForSEOClient {
  private credentials: DataForSEOCredentials;
  private authHeader: string;

  constructor(credentials: DataForSEOCredentials) {
    this.credentials = credentials;
    this.authHeader = `Basic ${Buffer.from(
      `${credentials.login}:${credentials.password}`
    ).toString('base64')}`;
  }

  /**
   * Make an authenticated request to the DataForSEO API
   */
  private async request<T>(
    endpoint: string,
    body?: unknown,
    method: 'POST' | 'GET' = 'POST'
  ): Promise<T> {
    const options: RequestInit = {
      method,
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
    };

    if (method === 'POST' && body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `DataForSEO API error: ${response.status} - ${errorText}`
      );
    }

    return response.json() as Promise<T>;
  }

  private extractMeta(response: {
    tasks?: Array<{ status_code?: number; status_message?: string }>;
  }): TaskMeta {
    const task = response?.tasks?.[0];
    return {
      status_code: task?.status_code,
      status_message: task?.status_message,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Search for businesses by name and location
   *
   * This is the primary method for the Discovery Agent's "Is this you?" flow.
   * The agent asks for the business name, searches, and presents matches.
   *
   * @param businessName - The business name to search for
   * @param location - City or location (e.g., "Denver", "Denver CO")
   * @param limit - Maximum number of results (default 5, max 20)
   * @returns Array of discovered businesses for confirmation
   *
   * @example
   * ```typescript
   * // User: "I'm Rocky Mountain Woodworks in Denver"
   * const results = await client.searchBusinesses('Rocky Mountain Woodworks', 'Denver', 5);
   * // Agent: "Is this you? Rocky Mountain Woodworks at 1234 Pine St, Denver CO"
   * ```
   */
  async searchBusinesses(
    businessName: string,
    location: string,
    limit: number = 5
  ): Promise<DiscoveredBusiness[]> {
    // Combine business name and location for the search
    const keyword = `${businessName} ${location}`;

    logger.info('[DataForSEO] Searching for business', { keyword, limit });

    const response = await this.request<{
      tasks: Array<{
        result: Array<{
          items: Array<{
            type: string;
            rank_absolute: number;
            rank_group: number;
            title: string;
            place_id?: string;
            cid?: string;
            address?: string;
            phone?: string;
            url?: string;
            rating?: {
              value: number;
              votes_count: number;
            };
            category?: string;
            latitude?: number;
            longitude?: number;
            is_claimed?: boolean;
          }>;
        }>;
        status_code?: number;
        status_message?: string;
      }>;
    }>('/serp/google/maps/live/advanced', [
      {
        keyword,
        location_code: getLocationCode(location), // Dynamic: US, Canada, UK, etc.
        language_code: 'en',
        depth: Math.min(limit, 20),
      },
    ]);

    const results: DiscoveredBusiness[] = [];

    for (const task of response.tasks || []) {
      for (const result of task.result || []) {
        for (const item of result.items || []) {
          if (item.type === 'maps_search' && results.length < limit) {
            results.push({
              name: item.title,
              address: item.address || null,
              phone: item.phone || null,
              website: item.url || null,
              rating: item.rating?.value || null,
              reviewCount: item.rating?.votes_count || null,
              category: item.category || null,
              googlePlaceId: item.place_id || null,
              googleCid: item.cid || null,
              coordinates:
                item.latitude && item.longitude
                  ? { lat: item.latitude, lng: item.longitude }
                  : null,
            });
          }
        }
      }
    }

    logger.info('[DataForSEO] Found businesses', { count: results.length });
    return results;
  }

  /**
   * Get full Google Maps data for a business (raw result)
   *
   * Used when we need the complete data for storage.
   */
  async getGoogleMapsResults(
    keyword: string,
    locationCode: number = 2840,
    limit: number = 20
  ): Promise<{ results: GoogleMapsResult[]; meta: TaskMeta }> {
    logger.info('[DataForSEO] Searching Google Maps', {
      keyword,
      locationCode,
      limit,
    });

    const response = await this.request<{
      tasks: Array<{
        result: Array<{
          items: Array<{
            type: string;
            rank_absolute: number;
            rank_group: number;
            title: string;
            place_id?: string;
            cid?: string;
            address?: string;
            phone?: string;
            url?: string;
            rating?: {
              value: number;
              votes_count: number;
            };
            category?: string;
            latitude?: number;
            longitude?: number;
            is_claimed?: boolean;
            work_hours?: {
              work_hours?: Record<string, { open: string; close: string }[]>;
            };
          }>;
        }>;
        status_code?: number;
        status_message?: string;
      }>;
    }>('/serp/google/maps/live/advanced', [
      {
        keyword,
        location_code: locationCode,
        language_code: 'en',
        depth: limit,
      },
    ]);

    const results: GoogleMapsResult[] = [];

    for (const task of response.tasks || []) {
      for (const result of task.result || []) {
        for (const item of result.items || []) {
          if (item.type === 'maps_search') {
            let formattedHours: Record<string, string> | null = null;
            if (item.work_hours?.work_hours) {
              formattedHours = {};
              for (const [day, hours] of Object.entries(
                item.work_hours.work_hours
              )) {
                if (Array.isArray(hours) && hours.length > 0 && hours[0]) {
                  formattedHours[day] = `${hours[0].open || ''} - ${hours[0].close || ''}`;
                }
              }
            }

            results.push({
              title: item.title,
              place_id: item.place_id || null,
              cid: item.cid || null,
              address: item.address || null,
              phone: item.phone || null,
              website: item.url || null,
              rating: item.rating?.value || null,
              reviews_count: item.rating?.votes_count || null,
              category: item.category || null,
              position: item.rank_absolute || item.rank_group || 0,
              latitude: item.latitude || null,
              longitude: item.longitude || null,
              is_claimed: item.is_claimed || false,
              work_hours: formattedHours,
            });
          }
        }
      }
    }

    logger.info('[DataForSEO] Found Google Maps results', {
      count: results.length,
    });
    return { results, meta: this.extractMeta(response) };
  }

  /**
   * Get Google reviews for a business
   *
   * Used to fetch recent reviews for context during onboarding.
   * The agent might use this to understand the business better.
   *
   * @param cid - Google CID (from search results)
   * @param locationName - Location in "City,State,Country" format
   * @param maxReviews - Maximum reviews to fetch (default 10)
   */
  async getGoogleReviews(
    cid: string,
    locationName: string = 'United States',
    maxReviews: number = 10
  ): Promise<{ results: GoogleReviewsResult | null; meta: TaskMeta }> {
    logger.info('[DataForSEO] Fetching reviews', {
      cid,
      locationName,
      maxReviews,
    });

    // Post the task
    const postResponse = await this.request<{
      tasks: Array<{
        id: string;
        status_code?: number;
        status_message?: string;
      }>;
    }>('/business_data/google/reviews/task_post', [
      {
        cid,
        location_name: locationName,
        language_name: 'English',
        depth: maxReviews,
        sort_by: 'newest',
      },
    ]);

    const taskId = postResponse.tasks?.[0]?.id;
    if (!taskId) {
      logger.error('[DataForSEO] Failed to create reviews task', {
        statusMessage: postResponse.tasks?.[0]?.status_message,
      });
      return {
        results: null,
        meta: {
          status_code: postResponse.tasks?.[0]?.status_code || 500,
          status_message:
            postResponse.tasks?.[0]?.status_message ||
            'Failed to create reviews task',
        },
      };
    }

    logger.info('[DataForSEO] Reviews task created', { taskId });

    // Poll for results
    await this.sleep(TASK_INITIAL_WAIT_MS);

    const startTime = Date.now();
    let attempts = 0;

    while (Date.now() - startTime < TASK_POLL_TIMEOUT_MS) {
      attempts++;

      const readyResponse = await this.request<{
        tasks: Array<{
          status_code?: number;
          result: Array<{
            id: string;
            endpoint: string;
          }>;
        }>;
      }>('/business_data/google/reviews/tasks_ready', undefined, 'GET');

      const readyTasks = readyResponse.tasks?.[0]?.result || [];
      const ourTask = readyTasks.find((t) => t.id === taskId);

      if (ourTask) {
        logger.info('[DataForSEO] Reviews task ready', { taskId });

        const getResponse = await this.request<{
          tasks: Array<{
            status_code?: number;
            status_message?: string;
            result: Array<{
              place_id: string;
              cid?: string;
              rating?: { value: number; votes_count: number };
              reviews_count?: number;
              items: Array<{
                type: string;
                review_id?: string;
                review_text?: string;
                original_review_text?: string;
                rating?: { value: number };
                profile_name?: string;
                profile_url?: string;
                review_url?: string;
                time_ago?: string;
                timestamp?: string;
                owner_answer?: string;
                owner_timestamp?: string;
                review_images?: Array<{ image_url: string }>;
              }>;
            }>;
          }>;
        }>(`/business_data/google/reviews/task_get/${taskId}`, undefined, 'GET');

        const task = getResponse.tasks?.[0];
        if (task?.status_code !== 20000) {
          logger.error('[DataForSEO] Reviews task get failed', {
            taskId,
            statusCode: task?.status_code,
            statusMessage: task?.status_message,
          });
          return { results: null, meta: this.extractMeta(getResponse) };
        }

        const resultData = task.result?.[0];
        if (!resultData) {
          logger.warn('[DataForSEO] Reviews task completed without result data', {
            taskId,
          });
          return { results: null, meta: this.extractMeta(getResponse) };
        }

        const reviews = [];
        for (const item of resultData.items || []) {
          if (
            item.type === 'google_reviews_search' ||
            item.type === 'google_review'
          ) {
            reviews.push({
              review_id: item.review_id || null,
              review_text: item.review_text || null,
              original_review_text: item.original_review_text || null,
              rating: item.rating?.value || 0,
              reviewer_name: item.profile_name || null,
              reviewer_url: item.profile_url || null,
              review_url: item.review_url || null,
              time_ago: item.time_ago || null,
              timestamp: item.timestamp || null,
              owner_response: item.owner_answer || null,
              owner_response_timestamp: item.owner_timestamp || null,
              review_images:
                item.review_images?.map((img) => img.image_url) || null,
            });
          }
        }

        logger.info('[DataForSEO] Retrieved reviews', { count: reviews.length });

        return {
          results: {
            place_id: resultData.place_id,
            cid: resultData.cid || null,
            reviews,
            rating: resultData.rating?.value || null,
            reviews_count:
              resultData.reviews_count ||
              resultData.rating?.votes_count ||
              null,
          },
          meta: this.extractMeta(getResponse),
        };
      }

      await this.sleep(TASK_POLL_INTERVAL_MS);
    }

    logger.error('[DataForSEO] Reviews task timed out', { attempts, taskId });
    return {
      results: null,
      meta: {
        status_code: 408,
        status_message: `Task timed out after ${attempts} attempts`,
      },
    };
  }

  /**
   * Check API balance/credits
   */
  async getBalance(): Promise<{ balance: number; currency: string }> {
    const response = await this.request<{
      tasks: Array<{
        result?: Array<{
          money?: {
            balance: number;
            currency: string;
          };
        }>;
      }>;
    }>('/appendix/user_data', undefined, 'GET');

    if (response.tasks && response.tasks.length > 0) {
      const firstTask = response.tasks[0];
      const result = firstTask?.result?.[0];
      return {
        balance: result?.money?.balance ?? 0,
        currency: result?.money?.currency ?? 'USD',
      };
    }

    return { balance: 0, currency: 'USD' };
  }
}

/**
 * Create a DataForSEO client from environment variables
 *
 * Required environment variables:
 * - DATAFORSEO_LOGIN: API login/email
 * - DATAFORSEO_PASSWORD: API password
 *
 * @throws Error if credentials are missing
 */
export function createDataForSEOClient(): DataForSEOClient {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error(
      'Missing DataForSEO credentials. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables.'
    );
  }

  return new DataForSEOClient({ login, password });
}

/**
 * Parse city and state from an address string
 *
 * @example
 * parseLocationFromAddress("1234 Pine St, Denver, CO 80202")
 * // => { city: "Denver", state: "CO" }
 */
export function parseLocationFromAddress(
  address: string
): { city: string; state: string | null } | null {
  if (!address) return null;

  // Try to match "City, STATE ZIP" or "City, STATE" pattern
  const match = address.match(/,\s*([^,]+),\s*([A-Z]{2})\s*\d*/);
  if (match && match[1] && match[2]) {
    return {
      city: match[1].trim(),
      state: match[2],
    };
  }

  // Try to match just "City, STATE"
  const simpleMatch = address.match(/([^,]+),\s*([A-Z]{2})$/);
  if (simpleMatch && simpleMatch[1] && simpleMatch[2]) {
    return {
      city: simpleMatch[1].trim(),
      state: simpleMatch[2],
    };
  }

  return null;
}

/**
 * Convert a discovered business to profile data for storage
 *
 * Used when user confirms "Yes, that's me!" to auto-populate their profile.
 */
export function discoveredBusinessToProfile(
  business: DiscoveredBusiness,
  rawResult: GoogleMapsResult
): DiscoveredProfileData {
  const location = parseLocationFromAddress(business.address || '');

  return {
    business_name: business.name,
    city: location?.city || '',
    state: location?.state || null,
    address: business.address,
    phone: business.phone,
    website: business.website,
    google_place_id: business.googlePlaceId,
    google_cid: business.googleCid,
    discovered_data: rawResult,
    onboarding_method: 'conversation',
  };
}
