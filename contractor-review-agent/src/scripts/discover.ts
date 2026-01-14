#!/usr/bin/env node
/**
 * discover.ts - CLI tool for discovering contractors via DataForSEO Google Maps API
 *
 * Searches Google Maps for contractors matching the search query and saves them to Supabase.
 *
 * Usage:
 *   npm run discover -- --search "masonry contractors" --city "Denver" --limit 10
 *   npm run discover -- --search "brick repair" --city "Toronto" --state "ON" --country "Canada"
 *   npm run discover -- --search "chimney repair" --city "Denver" --min-reviews 10 --json
 *
 * @see ../lib/dataforseo.ts for DataForSEO client
 * @see ../lib/supabase.ts for database operations
 */

import 'dotenv/config';
import { Command } from 'commander';
import { createDataForSEOClient } from '../lib/dataforseo.js';
import { createSupabaseClient } from '../lib/supabase.js';
import { resolveLocationCode, detectCountry } from '../lib/types.js';
import type { GoogleMapsResult } from '../lib/types.js';

interface DiscoverResult {
  success: boolean;
  discovered: number;
  saved: number;
  contractors: Array<{
    id: string;
    business_name: string;
    place_id: string;
    rating: number | null;
    review_count: number | null;
    address: string | null;
  }>;
  errors: string[];
}

/**
 * Discovers contractors via Google Maps search and saves to Supabase
 */
async function discoverContractors(options: {
  search: string;
  city: string;
  state?: string;
  country?: string;
  limit?: number;
  minRating?: number;
  minReviews?: number;
  jsonOutput?: boolean;
  force?: boolean;
}): Promise<DiscoverResult> {
  const result: DiscoverResult = {
    success: false,
    discovered: 0,
    saved: 0,
    contractors: [],
    errors: [],
  };

  try {
    // Validate environment variables
    if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
      throw new Error('DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables are required');
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    }

    const log = (message: string) => {
      if (!options.jsonOutput) {
        console.log(message);
      }
    };

    // Auto-detect country from state (e.g., ON → Canada)
    const detectedCountry = detectCountry(options.state, options.country);

    log(`\n[Discover] Starting contractor discovery...`);
    log(`[Discover] Search: "${options.search}"`);
    log(`[Discover] City: ${options.city}${options.state ? `, ${options.state}` : ''}, ${detectedCountry}`);
    log(`[Discover] Limit: ${options.limit || 20}`);
    if (options.minRating) log(`[Discover] Min Rating: ${options.minRating}`);
    if (options.minReviews) log(`[Discover] Min Reviews: ${options.minReviews}`);
    log('');

    // Create clients (reads credentials from environment variables)
    const dataForSEO = createDataForSEOClient();
    const db = createSupabaseClient();

    // Check if this city/search has already been done
    const previousSearch = await db.hasBeenSearched(
      options.city,
      options.search,
      options.state,
      detectedCountry
    );

    if (previousSearch.searched && !options.force) {
      log(`[Discover] Already searched "${options.search}" in ${options.city} on ${new Date(previousSearch.searchedAt!).toLocaleDateString()}`);
      log(`[Discover] Found ${previousSearch.contractorsFound} contractors previously`);
      log(`[Discover] Use --force to re-search`);
      result.success = true;
      return result;
    }

    if (previousSearch.searched && options.force) {
      log(`[Discover] Re-searching (--force flag used)`);
    }

    // Check API balance first
    log('[Discover] Checking DataForSEO API balance...');
    const balance = await dataForSEO.getBalance();
    log(`[Discover] API Balance: ${balance.balance} ${balance.currency}`);

    if (balance.balance <= 0) {
      throw new Error('Insufficient DataForSEO API balance');
    }

    // Build search keyword and resolve location code
    const keyword = options.state
      ? `${options.search} ${options.city} ${options.state}`
      : `${options.search} ${options.city}`;
    const locationCode = resolveLocationCode(options.city);

    // Search Google Maps
    log('[Discover] Searching Google Maps...');
    const { results: mapsResults } = await dataForSEO.getGoogleMapsResults(
      keyword,
      locationCode,
      options.limit || 20
    );

    // Apply client-side filtering for rating and review count
    const filteredResults = mapsResults.filter((r: GoogleMapsResult) => {
      if (options.minRating && (r.rating || 0) < options.minRating) {
        return false;
      }
      if (options.minReviews && (r.reviews_count || 0) < options.minReviews) {
        return false;
      }
      return true;
    });

    result.discovered = filteredResults.length;
    log(`[Discover] Found ${mapsResults.length} contractors, ${filteredResults.length} after filtering`);

    // Save each contractor to Supabase
    log('[Discover] Saving contractors to database...');

    for (const mapResult of filteredResults) {
      if (!mapResult.place_id) {
        log(`[Discover] Skipping "${mapResult.title}" - no place_id`);
        result.errors.push(`Skipped "${mapResult.title}" - no place_id`);
        continue;
      }

      try {
        // Check if contractor already exists
        const existing = await db.getContractor(mapResult.place_id);

        const contractorData = {
          place_id: mapResult.place_id,
          cid: mapResult.cid || undefined,
          business_name: mapResult.title,
          category: mapResult.category || undefined,
          // Track which search term discovered this contractor (merged into search_terms array)
          search_term: options.search,
          city: options.city,
          state: options.state || undefined,
          country: detectedCountry,
          rating: mapResult.rating || undefined,
          review_count: mapResult.reviews_count || undefined,
          address: mapResult.address || undefined,
          phone: mapResult.phone || undefined,
          website: mapResult.website || undefined,
          latitude: mapResult.latitude || undefined,
          longitude: mapResult.longitude || undefined,
          is_claimed: mapResult.is_claimed,
        };

        const saved = await db.upsertContractor(contractorData);

        result.saved++;
        result.contractors.push({
          id: saved.id,
          business_name: saved.business_name,
          place_id: saved.place_id,
          rating: saved.rating,
          review_count: saved.review_count,
          address: saved.address,
        });

        if (existing) {
          log(`[Discover] Updated: ${saved.business_name} (${saved.review_count} reviews)`);
        } else {
          log(`[Discover] Saved: ${saved.business_name} (${saved.review_count} reviews)`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        result.errors.push(`Failed to save "${mapResult.title}": ${errorMsg}`);
        log(`[Discover] Error saving "${mapResult.title}": ${errorMsg}`);
      }
    }

    result.success = true;

    // Record this search to avoid duplicate API calls in the future
    await db.recordSearch(
      options.city,
      options.search,
      result.saved,
      options.state,
      detectedCountry
    );

    log('');
    log(`[Discover] Complete!`);
    log(`[Discover] Discovered: ${result.discovered}, Saved: ${result.saved}, Errors: ${result.errors.length}`);
    log(`[Discover] Search recorded - won't repeat unless --force is used`);

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    result.errors.push(errorMsg);

    if (!options.jsonOutput) {
      console.error(`[Discover] Fatal error: ${errorMsg}`);
    }
  }

  return result;
}

// =============================================================================
// CLI Setup
// =============================================================================

const program = new Command();

program
  .name('discover')
  .description('Discover contractors via DataForSEO Google Maps API')
  .version('1.0.0')
  .requiredOption('-s, --search <query>', 'Search query (e.g., "masonry contractors")')
  .requiredOption('-c, --city <city>', 'City name (e.g., "Denver")')
  .option('--state <state>', 'State/Province code (e.g., "CO", "ON")')
  .option('--country <country>', 'Country name (default: "USA")', 'USA')
  .option('-l, --limit <number>', 'Maximum number of results', parseInt, 20)
  .option('--min-rating <number>', 'Minimum rating filter', parseFloat)
  .option('--min-reviews <number>', 'Minimum review count filter', parseInt)
  .option('--force', 'Re-search even if city was already searched')
  .option('--json', 'Output results as JSON')
  .action(async (opts: {
    search: string;
    city: string;
    state?: string;
    country: string;
    limit: number;
    minRating?: number;
    minReviews?: number;
    force?: boolean;
    json?: boolean;
  }) => {
    const result = await discoverContractors({
      search: opts.search,
      city: opts.city,
      state: opts.state,
      country: opts.country,
      limit: opts.limit,
      minRating: opts.minRating,
      minReviews: opts.minReviews,
      force: opts.force,
      jsonOutput: opts.json,
    });

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    }

    process.exit(result.success ? 0 : 1);
  });

program.parse(process.argv);
