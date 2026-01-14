#!/usr/bin/env npx tsx
/**
 * Contractor Review Agent - Full Pipeline Orchestrator
 *
 * Runs the complete workflow:
 * 1. Discover contractors via Google Maps
 * 2. Collect reviews for each contractor
 * 3. (Optional) Analyze reviews with Claude
 * 4. (Optional) Generate articles
 *
 * Usage:
 *   npm run pipeline -- --search "masonry contractors" --city "Denver" --limit 5
 *
 * @see ../lib/dataforseo.ts - DataForSEO API client
 * @see ../lib/supabase.ts - Supabase database client
 * @see ../lib/types.ts - Type definitions
 */

import 'dotenv/config';
import { Command } from 'commander';
import { createDataForSEOClient } from '../lib/dataforseo.js';
import { createSupabaseClient } from '../lib/supabase.js';
import type { PipelineOptions, PipelineResult, GoogleMapsResult } from '../lib/types.js';
import { resolveLocationCode } from '../lib/types.js';

// =============================================================================
// CLI Setup
// =============================================================================

const program = new Command();

program
  .name('run-pipeline')
  .description('Run the complete contractor review analysis pipeline')
  .requiredOption('-s, --search <query>', 'Search query (e.g., "masonry contractors")')
  .requiredOption('-c, --city <city>', 'City name (e.g., "Denver")')
  .option('--state <state>', 'State (e.g., "CO")')
  .option('--country <country>', 'Country (default: US)', 'US')
  .option('-l, --limit <number>', 'Max contractors to process', '10')
  .option('--min-rating <number>', 'Minimum star rating', '4.0')
  .option('--min-reviews <number>', 'Minimum review count', '5')
  .option('--max-reviews <number>', 'Max reviews per contractor', '100')
  .option('--skip-analysis', 'Skip Claude analysis step')
  .option('--skip-articles', 'Skip article generation')
  .option('--json', 'Output results as JSON')
  .option('--dry-run', 'Show what would be done without making API calls')
  .parse();

const opts = program.opts();

// =============================================================================
// Pipeline Implementation
// =============================================================================

async function runPipeline(): Promise<PipelineResult> {
  const options: PipelineOptions = {
    search: opts.search,
    city: opts.city,
    state: opts.state,
    country: opts.country,
    limit: parseInt(opts.limit, 10),
    minRating: parseFloat(opts.minRating),
    minReviews: parseInt(opts.minReviews, 10),
    maxReviewsPerContractor: parseInt(opts.maxReviews || '100', 10),
    skipAnalysis: opts.skipAnalysis,
    skipArticles: opts.skipArticles,
  };

  const result: PipelineResult = {
    discovered: 0,
    reviewsCollected: 0,
    analyzed: 0,
    articlesGenerated: 0,
    errors: [],
  };

  if (opts.dryRun) {
    console.log('\n[DRY RUN] Would execute pipeline with options:');
    console.log(JSON.stringify(options, null, 2));
    return result;
  }

  console.log('\n========================================');
  console.log('CONTRACTOR REVIEW AGENT - PIPELINE');
  console.log('========================================\n');

  console.log('Configuration:');
  console.log(`  Search: "${options.search}"`);
  console.log(`  Location: ${options.city}${options.state ? `, ${options.state}` : ''}`);
  console.log(`  Limit: ${options.limit} contractors`);
  console.log(`  Min Rating: ${options.minRating}+`);
  console.log(`  Min Reviews: ${options.minReviews}+`);
  console.log(`  Skip Analysis: ${options.skipAnalysis || false}`);
  console.log(`  Skip Articles: ${options.skipArticles || false}`);
  console.log('');

  // Initialize clients
  const dataForSEO = createDataForSEOClient();
  const supabase = createSupabaseClient();

  // -------------------------------------------------------------------------
  // STEP 1: Discover Contractors
  // -------------------------------------------------------------------------
  console.log('STEP 1: Discovering contractors...');
  console.log('─'.repeat(40));

  const locationCode = resolveLocationCode(options.city);
  const searchQuery = options.state
    ? `${options.search} ${options.city} ${options.state}`
    : `${options.search} ${options.city}`;

  console.log(`  Query: "${searchQuery}"`);
  console.log(`  Location Code: ${locationCode}`);

  let contractors: GoogleMapsResult[] = [];

  try {
    const limit = options.limit ?? 10;
    const mapsResult = await dataForSEO.getGoogleMapsResults(
      searchQuery,
      locationCode,
      limit * 2 // Fetch extra to account for filtering
    );

    // Filter by rating and review count
    contractors = mapsResult.results.filter((c) => {
      const meetsRating = !options.minRating || (c.rating && c.rating >= options.minRating);
      const meetsReviews = !options.minReviews || (c.reviews_count && c.reviews_count >= options.minReviews);
      return meetsRating && meetsReviews;
    }).slice(0, limit);

    result.discovered = contractors.length;
    console.log(`\n  Found ${mapsResult.results.length} total, ${contractors.length} after filtering\n`);

    // Save to Supabase
    for (const contractor of contractors) {
      if (!contractor.place_id) {
        console.log(`  ⚠ Skipping "${contractor.title}" - no place_id`);
        continue;
      }

      try {
        await supabase.upsertContractor({
          place_id: contractor.place_id,
          cid: contractor.cid ?? undefined,
          business_name: contractor.title,
          category: contractor.category ?? undefined,
          city: options.city,
          state: options.state,
          country: options.country || 'US',
          rating: contractor.rating ?? undefined,
          review_count: contractor.reviews_count ?? undefined,
          address: contractor.address ?? undefined,
          phone: contractor.phone ?? undefined,
          website: contractor.website ?? undefined,
          latitude: contractor.latitude ?? undefined,
          longitude: contractor.longitude ?? undefined,
          is_claimed: contractor.is_claimed,
        });
        console.log(`  ✓ Saved: ${contractor.title} (${contractor.rating}★, ${contractor.reviews_count} reviews)`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`Failed to save ${contractor.title}: ${msg}`);
        console.log(`  ✗ Error saving ${contractor.title}: ${msg}`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Discovery failed: ${msg}`);
    console.error(`\n  ✗ Discovery failed: ${msg}\n`);
    return result;
  }

  // -------------------------------------------------------------------------
  // STEP 2: Collect Reviews
  // -------------------------------------------------------------------------
  console.log('\nSTEP 2: Collecting reviews...');
  console.log('─'.repeat(40));

  for (const contractor of contractors) {
    if (!contractor.place_id) continue;

    console.log(`\n  Processing: ${contractor.title}`);

    try {
      // Get stored contractor to get the DB ID
      const dbContractor = await supabase.getContractor(contractor.place_id);
      if (!dbContractor) {
        console.log(`    ⚠ Not found in database, skipping reviews`);
        continue;
      }

      // Fetch reviews from DataForSEO
      // Note: getGoogleReviews(cid, locationName, placeId, maxReviews)
      const locationName = `${dbContractor.city},${dbContractor.state || ''},${dbContractor.country}`;
      const reviewsResult = await dataForSEO.getGoogleReviews(
        contractor.cid || contractor.place_id,  // cid (prefer CID, fallback to place_id)
        locationName,
        contractor.place_id,
        options.maxReviewsPerContractor
      );

      if (!reviewsResult.results || reviewsResult.results.reviews.length === 0) {
        console.log(`    ⚠ No reviews found`);
        continue;
      }

      const reviews = reviewsResult.results.reviews;
      console.log(`    Fetched ${reviews.length} reviews`);

      // Save reviews to Supabase
      const saveResult = await supabase.upsertReviews(
        dbContractor.id,
        reviews.map((r) => ({
          review_id: r.review_id,
          review_text: r.review_text,
          rating: r.rating,
          reviewer_name: r.reviewer_name,
          review_date: r.timestamp,
          owner_response: r.owner_response,
        }))
      );

      result.reviewsCollected += saveResult.inserted;
      console.log(`    ✓ Saved ${saveResult.inserted} reviews (${saveResult.skipped} duplicates skipped)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Failed to collect reviews for ${contractor.title}: ${msg}`);
      console.log(`    ✗ Error: ${msg}`);
    }

    // Small delay to avoid rate limiting
    await sleep(500);
  }

  // -------------------------------------------------------------------------
  // STEP 3: Analysis (if not skipped)
  // -------------------------------------------------------------------------
  if (!options.skipAnalysis) {
    console.log('\nSTEP 3: AI Analysis...');
    console.log('─'.repeat(40));
    console.log('  ℹ Analysis requires interactive Claude session.');
    console.log('  Run: /review-analyze "contractor-name"');
    console.log('  Or use the skill workflow for batch processing.');
  } else {
    console.log('\nSTEP 3: AI Analysis... SKIPPED');
  }

  // -------------------------------------------------------------------------
  // STEP 4: Article Generation (if not skipped)
  // -------------------------------------------------------------------------
  if (!options.skipArticles) {
    console.log('\nSTEP 4: Article Generation...');
    console.log('─'.repeat(40));
    console.log('  ℹ Article generation requires interactive Claude session.');
    console.log('  Run: /review-generate "contractor-name"');
    console.log('  Or use the skill workflow for batch processing.');
  } else {
    console.log('\nSTEP 4: Article Generation... SKIPPED');
  }

  return result;
}

// =============================================================================
// Utilities
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Main Entry Point
// =============================================================================

async function main() {
  try {
    const result = await runPipeline();

    console.log('\n========================================');
    console.log('PIPELINE COMPLETE');
    console.log('========================================\n');

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('Summary:');
      console.log(`  Contractors discovered: ${result.discovered}`);
      console.log(`  Reviews collected: ${result.reviewsCollected}`);
      console.log(`  Analyses completed: ${result.analyzed}`);
      console.log(`  Articles generated: ${result.articlesGenerated}`);

      if (result.errors.length > 0) {
        console.log(`\n  Errors (${result.errors.length}):`);
        result.errors.slice(0, 5).forEach((e) => console.log(`    - ${e}`));
        if (result.errors.length > 5) {
          console.log(`    ... and ${result.errors.length - 5} more`);
        }
      }
    }

    console.log('\nNext Steps:');
    console.log('  1. Review discovered contractors in Supabase');
    console.log('  2. Run /review-analyze for AI analysis');
    console.log('  3. Run /review-generate for article creation');
    console.log('');

    process.exit(result.errors.length > 0 ? 1 : 0);
  } catch (err) {
    console.error('\n[FATAL ERROR]', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
