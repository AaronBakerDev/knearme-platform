#!/usr/bin/env tsx
/**
 * Tag Reviews Script - Analyze individual reviews with AI
 *
 * This script reads reviews from Supabase and uses Gemini to:
 * - Detect what services the review is about (open-ended, not restricted)
 * - Extract sentiment and themes
 * - Tag with project type, pricing/timeline mentions
 * - Store analysis back in review_data.analysis_json
 *
 * Key difference from `analyze.ts`:
 * - analyze.ts: Contractor-level (aggregate all reviews into themes)
 * - tag-reviews.ts: Review-level (tag each review individually)
 *
 * Usage:
 *   npm run tag-reviews -- --city "Denver" --limit 100    # Tag 100 Denver reviews
 *   npm run tag-reviews -- --contractor-id <uuid>         # Tag all reviews for one contractor
 *   npm run tag-reviews -- --all --limit 500              # Tag 500 reviews globally
 *   npm run tag-reviews -- --city "Toronto" --retag       # Re-tag already analyzed reviews
 *   npm run tag-reviews -- --batch-size 10                # Process 10 reviews per API call
 *
 * @see /docs/content-strategy/05-content-pipeline.md
 * @see review_data.analysis_json for the storage schema
 */

import 'dotenv/config';
import { Command } from 'commander';
import { createSupabaseClient } from '../lib/supabase.js';
import { createGeminiClient, type ReviewTagAnalysis } from '../lib/gemini.js';
import type { DBContractor, DBReview } from '../lib/types.js';

// =============================================================================
// CLI Setup
// =============================================================================

const program = new Command();

program
  .name('tag-reviews')
  .description('Tag individual reviews with AI-detected services, sentiment, and themes')
  .option('--contractor-id <id>', 'Tag reviews for a specific contractor')
  .option('--city <city>', 'Filter by city')
  .option('--all', 'Tag all untagged reviews')
  .option('--limit <n>', 'Maximum reviews to process', (val) => parseInt(val, 10), 100)
  .option('--batch-size <n>', 'Reviews per API call (default 15, max 20)', (val) => parseInt(val, 10), 15)
  .option('--retag', 'Re-tag reviews that already have analysis')
  .option('--dry-run', 'Show what would be tagged without calling API')
  .option('--json', 'Output results as JSON')
  .parse(process.argv);

const options = program.opts();

// =============================================================================
// Types
// =============================================================================

interface TagResult {
  success: boolean;
  tagged: number;
  skipped: number;
  errors: string[];
  totalTokens: number;
  estimatedCost: number;
  batches: number;
  /** Summary of detected services across all reviews */
  servicesSummary: Map<string, number>;
}

// =============================================================================
// Main Function
// =============================================================================

async function main(): Promise<TagResult> {
  const result: TagResult = {
    success: false,
    tagged: 0,
    skipped: 0,
    errors: [],
    totalTokens: 0,
    estimatedCost: 0,
    batches: 0,
    servicesSummary: new Map(),
  };

  const log = (message: string) => {
    if (!options.json) {
      console.log(message);
    }
  };

  try {
    // Validate options
    if (!options.contractorId && !options.all && !options.city) {
      throw new Error('Must specify --contractor-id <id>, --city <city>, or --all');
    }

    // Validate batch size
    const batchSize = Math.min(options.batchSize || 15, 20);
    if (batchSize < 1) {
      throw new Error('Batch size must be at least 1');
    }

    // Initialize clients
    log('[TagReviews] Initializing clients...');
    const db = createSupabaseClient();
    const gemini = options.dryRun ? null : createGeminiClient();

    // Get reviews to tag
    log('[TagReviews] Fetching reviews to tag...');
    const reviews = await db.getReviewsNeedingTags({
      contractorId: options.contractorId,
      city: options.city,
      limit: options.limit,
      includeAnalyzed: options.retag,
    });

    if (reviews.length === 0) {
      log('[TagReviews] No reviews found to tag');
      result.success = true;
      return result;
    }

    log(`[TagReviews] Found ${reviews.length} reviews to tag`);
    log(`[TagReviews] Batch size: ${batchSize} reviews per API call`);

    // Group reviews by contractor for context
    const reviewsByContractor = new Map<string, Array<typeof reviews[0]>>();
    for (const review of reviews) {
      const contractorId = review.contractor_id;
      if (!reviewsByContractor.has(contractorId)) {
        reviewsByContractor.set(contractorId, []);
      }
      reviewsByContractor.get(contractorId)!.push(review);
    }

    log(`[TagReviews] Reviews span ${reviewsByContractor.size} contractors`);

    // Process in batches
    const allReviews = [...reviews];
    let processed = 0;

    while (processed < allReviews.length) {
      const batch = allReviews.slice(processed, processed + batchSize);
      result.batches++;

      const batchStart = processed + 1;
      const batchEnd = Math.min(processed + batchSize, allReviews.length);
      log(`\n[Batch ${result.batches}] Processing reviews ${batchStart}-${batchEnd} of ${allReviews.length}`);

      // Get contractor context for the first review in batch
      // (In reality, batches might span contractors, but the prompt handles this)
      const firstReview = batch[0];
      const contractorContext = firstReview.contractor
        ? {
            business_name: firstReview.contractor.business_name,
            category: firstReview.contractor.category,
          }
        : undefined;

      if (options.dryRun) {
        log(`  [DRY RUN] Would analyze ${batch.length} reviews`);
        result.tagged += batch.length;
        processed += batch.length;
        continue;
      }

      try {
        // Call Gemini to tag the batch
        const {
          results: tagResults,
          tokensUsed,
          model,
          costEstimate,
          durationMs,
        } = await gemini!.tagReviewsBatch(
          batch.map(r => ({
            id: r.id,
            review_text: r.review_text,
            rating: r.rating,
          })),
          contractorContext
        );

        log(`  API call completed: ${tagResults.size} results (${tokensUsed} tokens, ${durationMs}ms, ~$${costEstimate.toFixed(4)})`);

        // Save results back to database
        const updates: Array<{ id: string; analysis: ReviewTagAnalysis }> = [];
        for (const [reviewId, analysis] of tagResults) {
          updates.push({ id: reviewId, analysis });

          // Track services for summary (handle edge case where AI returns non-array)
          const services = Array.isArray(analysis.detected_services)
            ? analysis.detected_services
            : [];
          for (const service of services) {
            if (typeof service === 'string') {
              const normalizedService = service.toLowerCase().trim();
              result.servicesSummary.set(
                normalizedService,
                (result.servicesSummary.get(normalizedService) || 0) + 1
              );
            }
          }
        }

        const { updated, errors } = await db.updateReviewsAnalysisBatch(updates);

        result.tagged += updated;
        result.totalTokens += tokensUsed;
        result.estimatedCost += costEstimate;

        if (errors.length > 0) {
          result.errors.push(...errors);
          log(`  ⚠️  ${errors.length} database errors`);
        }

        log(`  ✅ Saved ${updated} analyses`);

        // Log AI usage
        await db.logAIUsage({
          operation: 'analyze',
          model,
          total_tokens: tokensUsed,
          cost_estimate: costEstimate,
          duration_ms: durationMs,
          success: true,
        });

        // Rate limiting between batches
        if (processed + batch.length < allReviews.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        log(`  ❌ Batch error: ${errorMsg}`);
        result.errors.push(`Batch ${result.batches}: ${errorMsg}`);

        // Log failed AI usage
        if (gemini) {
          await db.logAIUsage({
            operation: 'analyze',
            model: gemini.getModelName(),
            total_tokens: 0,
            cost_estimate: 0,
            duration_ms: 0,
            success: false,
            error_message: errorMsg,
          });
        }
      }

      processed += batch.length;
    }

    result.success = result.errors.length === 0;

    // Summary
    log('\n' + '='.repeat(60));
    log('[TagReviews] Complete!');
    log(`  ✅ Tagged: ${result.tagged}`);
    log(`  ⏭️  Skipped: ${result.skipped}`);
    log(`  ❌ Errors: ${result.errors.length}`);
    log(`  📊 Batches: ${result.batches}`);
    log(`  🔢 Total tokens: ${result.totalTokens.toLocaleString()}`);
    log(`  💰 Estimated cost: $${result.estimatedCost.toFixed(4)}`);

    // Show top detected services
    if (result.servicesSummary.size > 0) {
      log('\n📋 Top Detected Services:');
      const sortedServices = [...result.servicesSummary.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      for (const [service, count] of sortedServices) {
        log(`  - ${service}: ${count} reviews`);
      }
    }

    if (options.json) {
      // Convert Map to object for JSON output
      const jsonResult = {
        ...result,
        servicesSummary: Object.fromEntries(result.servicesSummary),
      };
      console.log(JSON.stringify(jsonResult, null, 2));
    }

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMsg);

    if (options.json) {
      const jsonResult = {
        ...result,
        servicesSummary: Object.fromEntries(result.servicesSummary),
      };
      console.log(JSON.stringify(jsonResult, null, 2));
    } else {
      console.error(`[TagReviews] Fatal error: ${errorMsg}`);
    }

    return result;
  }
}

// =============================================================================
// Run
// =============================================================================

main()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
