/**
 * DataForSEO API Client for Contractor Review Agent
 *
 * Provides access to Google Maps search and Google Reviews APIs
 * for discovering contractors and collecting their reviews.
 *
 * API Documentation:
 * - Google Maps: https://docs.dataforseo.com/v3/serp/google/maps/live/advanced/
 * - Google Reviews: https://docs.dataforseo.com/v3/business_data/google/reviews/task_post/
 * - Google Reviews Task Get: https://docs.dataforseo.com/v3/business_data/google/reviews/task_get/
 */

import type {
  DataForSEOCredentials,
  TaskMeta,
  GoogleMapsResult,
  GoogleReview,
  GoogleReviewsResult,
} from './types';

const BASE_URL = 'https://api.dataforseo.com/v3';

/**
 * Maximum time to wait for async task completion (90 seconds)
 * DataForSEO tasks typically complete in 10-20 seconds but can take longer
 */
const TASK_POLL_TIMEOUT_MS = 90000;

/**
 * Interval between polling for task results (3 seconds)
 * Gives the API time to process without hammering it
 */
const TASK_POLL_INTERVAL_MS = 3000;

/**
 * Initial wait before first poll (5 seconds)
 * DataForSEO needs time to queue and start processing the task
 */
const TASK_INITIAL_WAIT_MS = 5000;

/**
 * DataForSEO API Client
 *
 * Provides methods to search Google Maps for contractors and fetch their reviews.
 *
 * @example
 * ```typescript
 * const client = new DataForSEOClient({
 *   login: 'your-login',
 *   password: 'your-password'
 * });
 *
 * // Find contractors
 * const { results } = await client.getGoogleMapsResults(
 *   'masonry contractor',
 *   1014395, // Denver location code
 *   20
 * );
 *
 * // Get reviews for a contractor
 * const { results: reviewData } = await client.getGoogleReviews(
 *   results[0].cid!,           // CID is primary identifier
 *   'Denver,Colorado,United States',  // Specific location
 *   results[0].place_id,       // Optional place_id
 *   100                        // Max reviews
 * );
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
   *
   * @param endpoint - API endpoint path (e.g., '/serp/google/maps/live/advanced')
   * @param body - Request body (for POST requests)
   * @param method - HTTP method (default: POST)
   * @returns Parsed JSON response
   * @throws Error if the request fails or returns non-2xx status
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

  /**
   * Extract status metadata from API response
   */
  private extractMeta(response: {
    tasks?: Array<{ status_code?: number; status_message?: string }>;
  }): TaskMeta {
    const task = response?.tasks?.[0];
    return {
      status_code: task?.status_code,
      status_message: task?.status_message,
    };
  }

  /**
   * Sleep utility for polling
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get contractors from Google Maps search
   *
   * Returns business listings with place_id and cid for subsequent review lookups.
   * The place_id and cid are critical - you need at least one of them to fetch reviews.
   *
   * @param keyword - Search query (e.g., "masonry contractor Denver")
   * @param locationCode - DataForSEO location code (e.g., 1014395 for Denver)
   *                       See types.ts for US_LOCATION_CODES and CANADA_LOCATION_CODES
   * @param limit - Maximum number of results (default 20, max 100)
   * @returns Object with results array and meta status
   *
   * @see https://docs.dataforseo.com/v3/serp/google/maps/live/advanced/
   */
  async getGoogleMapsResults(
    keyword: string,
    locationCode: number,
    limit: number = 20
  ): Promise<{ results: GoogleMapsResult[]; meta: TaskMeta }> {
    console.log(
      `[DataForSEO] Searching Google Maps for: "${keyword}" (location: ${locationCode}, limit: ${limit})`
    );

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
          // Only process maps_search items (filter out ads, etc.)
          if (item.type === 'maps_search') {
            // Format work hours if available
            let formattedHours: Record<string, string> | null = null;
            if (item.work_hours?.work_hours) {
              formattedHours = {};
              for (const [day, hours] of Object.entries(
                item.work_hours.work_hours
              )) {
                if (Array.isArray(hours) && hours.length > 0) {
                  formattedHours[day] = `${hours[0].open} - ${hours[0].close}`;
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

    console.log(`[DataForSEO] Found ${results.length} contractors`);
    return { results, meta: this.extractMeta(response) };
  }

  /**
   * Get Google reviews for a business using the Business Data API
   *
   * Uses async task workflow:
   * 1. POST task to /business_data/google/reviews/task_post
   * 2. Poll /business_data/google/reviews/tasks_ready until task appears
   * 3. GET results from /business_data/google/reviews/task_get/{task_id}
   *
   * CRITICAL: The API works best with:
   * - `cid` as the primary identifier (more reliable than place_id)
   * - `location_name` in "City,State,Country" format (e.g., "Denver,Colorado,United States")
   *
   * @param cid - Google CID (primary identifier, from Maps results)
   * @param locationName - Location in "City,State,Country" format for best results
   * @param placeId - Google Place ID (fallback identifier, optional)
   * @param maxReviews - Maximum number of reviews to fetch (default 100)
   * @returns Object with GoogleReviewsResult (or null if failed) and meta status
   *
   * @see https://docs.dataforseo.com/v3/business_data/google/reviews/task_post/
   * @see https://docs.dataforseo.com/v3/business_data/google/reviews/task_get/
   */
  async getGoogleReviews(
    cid: string,
    locationName: string = 'United States',
    placeId?: string | null,
    maxReviews: number = 100
  ): Promise<{ results: GoogleReviewsResult | null; meta: TaskMeta }> {
    console.log(
      `[DataForSEO] Fetching reviews for cid: ${cid}${placeId ? `, place_id: ${placeId}` : ''} (location: ${locationName}, max: ${maxReviews})`
    );

    // Step 1: Post the task
    // Use CID as the ONLY identifier - do NOT include place_id even if available
    // Including both cid and place_id causes the task to never complete!
    // Location format: "City,State,Country" works best
    const postResponse = await this.request<{
      tasks: Array<{
        id: string;
        status_code?: number;
        status_message?: string;
      }>;
    }>('/business_data/google/reviews/task_post', [
      {
        cid,
        // NOTE: Do NOT include place_id - it causes tasks to hang indefinitely
        location_name: locationName,
        language_name: 'English',
        depth: maxReviews,
        sort_by: 'newest',
      },
    ]);

    const taskId = postResponse.tasks?.[0]?.id;
    if (!taskId) {
      console.error('[DataForSEO] Failed to create reviews task:', postResponse.tasks?.[0]?.status_message);
      return {
        results: null,
        meta: {
          status_code: postResponse.tasks?.[0]?.status_code || 500,
          status_message: postResponse.tasks?.[0]?.status_message || 'Failed to create reviews task',
        },
      };
    }

    console.log(`[DataForSEO] Reviews task created: ${taskId}`);

    // Step 2: Poll tasks_ready endpoint until our task appears
    console.log(`[DataForSEO] Waiting ${TASK_INITIAL_WAIT_MS / 1000}s before polling...`);
    await this.sleep(TASK_INITIAL_WAIT_MS);

    const startTime = Date.now();
    let attempts = 0;

    while (Date.now() - startTime < TASK_POLL_TIMEOUT_MS) {
      attempts++;

      // Check tasks_ready endpoint
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
      console.log(`[DataForSEO] Polling (attempt ${attempts}): ${readyTasks.length} tasks ready`);

      const ourTask = readyTasks.find((t) => t.id === taskId);

      if (ourTask) {
        console.log(`[DataForSEO] Task ${taskId} is ready, fetching results...`);

        // Fetch results using task_get
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
          console.error(`[DataForSEO] Task get failed: ${task?.status_code} - ${task?.status_message}`);
          return { results: null, meta: this.extractMeta(getResponse) };
        }

        const resultData = task.result?.[0];
        if (!resultData) {
          console.log('[DataForSEO] Task completed but no result data');
          return { results: null, meta: this.extractMeta(getResponse) };
        }

        // Parse reviews
        // Note: API returns type 'google_reviews_search' not 'google_review'
        const reviews: GoogleReview[] = [];
        for (const item of resultData.items || []) {
          if (item.type === 'google_reviews_search' || item.type === 'google_review') {
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
              review_images: item.review_images?.map((img) => img.image_url) || null,
            });
          }
        }

        console.log(`[DataForSEO] Retrieved ${reviews.length} reviews`);

        return {
          results: {
            place_id: resultData.place_id,
            cid: resultData.cid || null,
            reviews,
            rating: resultData.rating?.value || null,
            reviews_count: resultData.reviews_count || resultData.rating?.votes_count || null,
          },
          meta: this.extractMeta(getResponse),
        };
      }

      // Task not ready yet, wait and retry
      await this.sleep(TASK_POLL_INTERVAL_MS);
    }

    console.error(`[DataForSEO] Task timed out after ${attempts} attempts`);
    return {
      results: null,
      meta: { status_code: 408, status_message: `Task timed out after ${attempts} attempts` },
    };
  }

  /**
   * Check API balance/credits
   *
   * @returns Current balance and currency
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
      const result = response.tasks[0].result?.[0];
      return {
        balance: result?.money?.balance || 0,
        currency: result?.money?.currency || 'USD',
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
 * @returns Configured DataForSEOClient instance
 * @throws Error if credentials are missing
 *
 * @example
 * ```typescript
 * // Ensure env vars are set:
 * // DATAFORSEO_LOGIN=your-login
 * // DATAFORSEO_PASSWORD=your-password
 *
 * const client = createDataForSEOClient();
 * const { results } = await client.getGoogleMapsResults('masonry contractor', 1014395, 20);
 * ```
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
