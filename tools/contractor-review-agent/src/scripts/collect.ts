#!/usr/bin/env node
/**
 * collect.ts - CLI tool for collecting contractor reviews via DataForSEO Reviews API
 *
 * Fetches reviews for contractors stored in Supabase and saves them to the database.
 *
 * Usage:
 *   npm run collect -- --contractor-id "uuid"
 *   npm run collect -- --all --min-reviews 10
 *   npm run collect -- --all --max-reviews 50 --json
 *
 * @see ../lib/dataforseo.ts for DataForSEO client
 * @see ../lib/supabase.ts for database operations
 */

import 'dotenv/config';
import { Command } from 'commander';
import { createDataForSEOClient } from '../lib/dataforseo.js';
import { createSupabaseClient } from '../lib/supabase.js';
import { formatLocationName, type DBContractor } from '../lib/types.js';

interface CollectResult {
  success: boolean;
  contractorsProcessed: number;
  reviewsCollected: number;
  reviewsInserted: number;
  reviewsSkipped: number;
  contractors: Array<{
    id: string;
    business_name: string;
    reviews_fetched: number;
    reviews_inserted: number;
  }>;
  errors: string[];
}

/**
 * Collects reviews for contractors and saves to Supabase
 */
async function collectReviews(options: {
  contractorId?: string;
  all?: boolean;
  city?: string;
  category?: string;
  minReviews?: number;
  maxReviews?: number;
  limit?: number;
  jsonOutput?: boolean;
}): Promise<CollectResult> {
  const result: CollectResult = {
    success: false,
    contractorsProcessed: 0,
    reviewsCollected: 0,
    reviewsInserted: 0,
    reviewsSkipped: 0,
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

    // Validate options
    if (!options.contractorId && !options.all) {
      throw new Error('Either --contractor-id or --all flag is required');
    }

    const log = (message: string) => {
      if (!options.jsonOutput) {
        console.log(message);
      }
    };

    log(`\n[Collect] Starting review collection...`);
    if (options.contractorId) {
      log(`[Collect] Contractor ID: ${options.contractorId}`);
    } else {
      log(`[Collect] Mode: All contractors`);
      if (options.city) log(`[Collect] City Filter: ${options.city}`);
      if (options.category) log(`[Collect] Category Filter: ${options.category}`);
      if (options.minReviews) log(`[Collect] Min Reviews Filter: ${options.minReviews}`);
      if (options.limit) log(`[Collect] Contractor Limit: ${options.limit}`);
    }
    log(`[Collect] Max reviews per contractor: ${options.maxReviews || 100}`);
    log('');

    // Create clients (reads credentials from environment variables)
    const dataForSEO = createDataForSEOClient();
    const db = createSupabaseClient();

    // Check API balance first
    log('[Collect] Checking DataForSEO API balance...');
    const balance = await dataForSEO.getBalance();
    log(`[Collect] API Balance: ${balance.balance} ${balance.currency}`);

    if (balance.balance <= 0) {
      throw new Error('Insufficient DataForSEO API balance');
    }

    // Get contractors to process
    let contractors: DBContractor[] = [];

    if (options.contractorId) {
      const contractor = await db.getContractorById(options.contractorId);
      if (!contractor) {
        throw new Error(`Contractor not found: ${options.contractorId}`);
      }
      contractors = [contractor];
    } else {
      // Get all contractors matching filters
      contractors = await db.getContractors({
        city: options.city,
        category: options.category,
        minReviews: options.minReviews,
        limit: options.limit,
      });
    }

    log(`[Collect] Found ${contractors.length} contractor(s) to process`);

    // Process each contractor
    for (const contractor of contractors) {
      log(`\n[Collect] Processing: ${contractor.business_name}`);
      log(`[Collect] Place ID: ${contractor.place_id}`);
      log(`[Collect] Google review count: ${contractor.review_count || 'unknown'}`);

      try {
        // Validate that contractor has a CID (required for Reviews API)
        if (!contractor.cid) {
          throw new Error('Contractor has no CID - cannot fetch reviews');
        }

        // Build location string in "City,State,Country" format for best API results
        // formatLocationName expands abbreviations: "CO" -> "Colorado", "USA" -> "United States"
        const locationName = formatLocationName(
          contractor.city,
          contractor.state,
          contractor.country
        );

        log(`[Collect] Location: ${locationName}`);

        // Fetch reviews from DataForSEO using CID as primary identifier
        const { results: reviewsResult } = await dataForSEO.getGoogleReviews(
          contractor.cid,
          locationName,
          contractor.place_id,
          options.maxReviews || 100
        );

        if (!reviewsResult) {
          throw new Error('Failed to fetch reviews - no result returned');
        }

        result.reviewsCollected += reviewsResult.reviews.length;
        log(`[Collect] Fetched ${reviewsResult.reviews.length} reviews`);

        // Transform reviews for database
        const reviewsToSave = reviewsResult.reviews.map((review) => ({
          review_id: review.review_id,
          review_text: review.review_text,
          rating: review.rating,
          reviewer_name: review.reviewer_name,
          review_date: review.timestamp,
          owner_response: review.owner_response,
        }));

        // Save reviews to Supabase
        const saveResult = await db.upsertReviews(contractor.id, reviewsToSave);

        result.reviewsInserted += saveResult.inserted;
        result.reviewsSkipped += saveResult.skipped;

        result.contractors.push({
          id: contractor.id,
          business_name: contractor.business_name,
          reviews_fetched: reviewsResult.reviews.length,
          reviews_inserted: saveResult.inserted,
        });

        log(`[Collect] Saved ${saveResult.inserted} new reviews, skipped ${saveResult.skipped} existing`);
        result.contractorsProcessed++;

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        result.errors.push(`${contractor.business_name}: ${errorMsg}`);
        log(`[Collect] Error: ${errorMsg}`);
      }

      // Add a small delay between contractors to avoid rate limiting
      if (contractors.indexOf(contractor) < contractors.length - 1) {
        log('[Collect] Waiting 2 seconds before next contractor...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    result.success = result.errors.length === 0 || result.contractorsProcessed > 0;

    log('');
    log(`[Collect] Complete!`);
    log(`[Collect] Contractors processed: ${result.contractorsProcessed}`);
    log(`[Collect] Total reviews collected: ${result.reviewsCollected}`);
    log(`[Collect] New reviews saved: ${result.reviewsInserted}`);
    log(`[Collect] Existing reviews skipped: ${result.reviewsSkipped}`);
    if (result.errors.length > 0) {
      log(`[Collect] Errors: ${result.errors.length}`);
    }

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    result.errors.push(errorMsg);

    if (!options.jsonOutput) {
      console.error(`[Collect] Fatal error: ${errorMsg}`);
    }
  }

  return result;
}

// =============================================================================
// CLI Setup
// =============================================================================

const program = new Command();

program
  .name('collect')
  .description('Collect contractor reviews via DataForSEO Reviews API')
  .version('1.0.0')
  .option('-i, --contractor-id <uuid>', 'Specific contractor ID to collect reviews for')
  .option('-a, --all', 'Collect reviews for all contractors in database')
  .option('-c, --city <name>', 'Filter by city name (for --all mode)')
  .option('--category <name>', 'Filter by category, e.g. "Chimney sweep" (for --all mode)')
  .option('--min-reviews <number>', 'Minimum review count filter (for --all mode)', parseInt)
  .option('--max-reviews <number>', 'Maximum reviews to fetch per contractor', parseInt, 300)
  .option('-l, --limit <number>', 'Maximum number of contractors to process (for --all mode)', parseInt)
  .option('--json', 'Output results as JSON')
  .action(async (opts: {
    contractorId?: string;
    all?: boolean;
    city?: string;
    category?: string;
    minReviews?: number;
    maxReviews: number;
    limit?: number;
    json?: boolean;
  }) => {
    const result = await collectReviews({
      contractorId: opts.contractorId,
      all: opts.all,
      city: opts.city,
      category: opts.category,
      minReviews: opts.minReviews,
      maxReviews: opts.maxReviews,
      limit: opts.limit,
      jsonOutput: opts.json,
    });

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    }

    process.exit(result.success ? 0 : 1);
  });

program.parse(process.argv);
