#!/usr/bin/env tsx
/**
 * Analyze Script - Extract insights from collected reviews using Gemini 3 Flash
 *
 * This script reads reviews from Supabase and uses Gemini to:
 * - Extract positive and negative themes
 * - Identify notable customer quotes
 * - Determine sentiment and recommendations
 * - Save structured analysis to review_analysis table
 *
 * Usage:
 *   npm run analyze -- --contractor-id <uuid>        # Analyze single contractor
 *   npm run analyze -- --all                         # Analyze all with reviews
 *   npm run analyze -- --all --min-reviews 20        # Only contractors with 20+ reviews
 *   npm run analyze -- --city "Denver"               # Filter by city
 *   npm run analyze -- --reanalyze                   # Re-analyze already analyzed
 *
 * @see /docs/content-strategy/05-content-pipeline.md
 */

import 'dotenv/config';
import { Command } from 'commander';
import { createSupabaseClient } from '../lib/supabase.js';
import { createGeminiClient } from '../lib/gemini.js';
import type { DBContractor, DBReview } from '../lib/types.js';

// =============================================================================
// CLI Setup
// =============================================================================

const program = new Command();

program
  .name('analyze')
  .description('Analyze contractor reviews using Gemini 3 Flash')
  .option('--contractor-id <id>', 'Analyze specific contractor by ID')
  .option('--all', 'Analyze all contractors with reviews')
  .option('--city <city>', 'Filter by city')
  .option('--min-reviews <n>', 'Minimum reviews required', parseInt)
  .option('--limit <n>', 'Maximum contractors to analyze', parseInt)
  .option('--reanalyze', 'Re-analyze contractors that already have analysis')
  .option('--dry-run', 'Show what would be analyzed without calling API')
  .option('--json', 'Output results as JSON')
  .parse(process.argv);

const options = program.opts();

// =============================================================================
// Types
// =============================================================================

interface AnalyzeResult {
  success: boolean;
  analyzed: number;
  skipped: number;
  errors: string[];
  totalTokens: number;
  estimatedCost: number;
  contractors: Array<{
    id: string;
    name: string;
    reviewCount: number;
    tokensUsed: number;
    status: 'analyzed' | 'skipped' | 'error';
    error?: string;
  }>;
}

// =============================================================================
// Main Function
// =============================================================================

async function main(): Promise<AnalyzeResult> {
  const result: AnalyzeResult = {
    success: false,
    analyzed: 0,
    skipped: 0,
    errors: [],
    totalTokens: 0,
    estimatedCost: 0,
    contractors: [],
  };

  const log = (message: string) => {
    if (!options.json) {
      console.log(message);
    }
  };

  try {
    // Validate options
    if (!options.contractorId && !options.all) {
      throw new Error('Must specify --contractor-id <id> or --all');
    }

    // Initialize clients
    log('[Analyze] Initializing clients...');
    const db = createSupabaseClient();
    const gemini = options.dryRun ? null : createGeminiClient();

    // Get contractors to analyze
    let contractors: DBContractor[] = [];

    if (options.contractorId) {
      const contractor = await db.getContractorById(options.contractorId);
      if (!contractor) {
        throw new Error(`Contractor not found: ${options.contractorId}`);
      }
      contractors = [contractor];
    } else {
      // Get all contractors with reviews
      contractors = await db.getContractors({
        city: options.city,
        minReviews: options.minReviews || 1,
      });
    }

    log(`[Analyze] Found ${contractors.length} contractors`);

    // Apply limit
    if (options.limit && contractors.length > options.limit) {
      contractors = contractors.slice(0, options.limit);
      log(`[Analyze] Limited to ${options.limit} contractors`);
    }

    // Process each contractor
    for (let i = 0; i < contractors.length; i++) {
      const contractor = contractors[i];
      const progress = `[${i + 1}/${contractors.length}]`;

      log(`\n${progress} Processing: ${contractor.business_name}`);

      // Check if already analyzed (unless --reanalyze)
      if (!options.reanalyze) {
        const existing = await db.getAnalysis(contractor.id);
        if (existing) {
          log(`  ⏭️  Already analyzed, skipping (use --reanalyze to override)`);
          result.skipped++;
          result.contractors.push({
            id: contractor.id,
            name: contractor.business_name,
            reviewCount: contractor.review_count || 0,
            tokensUsed: 0,
            status: 'skipped',
          });
          continue;
        }
      }

      // Get reviews for this contractor
      const reviews = await db.getReviews(contractor.id);

      if (reviews.length === 0) {
        log(`  ⚠️  No reviews found, skipping`);
        result.skipped++;
        result.contractors.push({
          id: contractor.id,
          name: contractor.business_name,
          reviewCount: 0,
          tokensUsed: 0,
          status: 'skipped',
        });
        continue;
      }

      log(`  📊 Found ${reviews.length} reviews`);

      // Dry run - just show what would happen
      if (options.dryRun) {
        log(`  🔍 [DRY RUN] Would analyze ${reviews.length} reviews`);
        result.contractors.push({
          id: contractor.id,
          name: contractor.business_name,
          reviewCount: reviews.length,
          tokensUsed: 0,
          status: 'analyzed',
        });
        result.analyzed++;
        continue;
      }

      try {
        // Analyze reviews with Gemini
        log(`  🤖 Analyzing with Gemini...`);
        const { analysis, tokensUsed, model, costEstimate, durationMs } = await gemini!.analyzeReviews(contractor, reviews);

        // Save to database with tracking data
        await db.saveAnalysis(contractor.id, analysis, {
          model_used: model,
          tokens_used: tokensUsed,
          cost_estimate: costEstimate,
        });

        // Log AI usage for observability
        await db.logAIUsage({
          operation: 'analyze',
          contractor_id: contractor.id,
          model,
          total_tokens: tokensUsed,
          cost_estimate: costEstimate,
          duration_ms: durationMs,
          success: true,
        });

        log(`  ✅ Analysis saved (${tokensUsed} tokens, ${durationMs}ms, ~$${costEstimate.toFixed(4)})`);
        log(`     Sentiment: ${analysis.sentiment.overall} (${analysis.sentiment.score.toFixed(2)})`);
        log(`     Positive themes: ${analysis.themes.positive.length}`);
        log(`     Negative themes: ${analysis.themes.negative.length}`);

        result.analyzed++;
        result.totalTokens += tokensUsed;
        result.estimatedCost += costEstimate;
        result.contractors.push({
          id: contractor.id,
          name: contractor.business_name,
          reviewCount: reviews.length,
          tokensUsed,
          status: 'analyzed',
        });

        // Rate limiting - wait between API calls
        if (i < contractors.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        log(`  ❌ Error: ${errorMsg}`);
        result.errors.push(`${contractor.business_name}: ${errorMsg}`);
        result.contractors.push({
          id: contractor.id,
          name: contractor.business_name,
          reviewCount: reviews.length,
          tokensUsed: 0,
          status: 'error',
          error: errorMsg,
        });

        // Log failed AI usage
        await db.logAIUsage({
          operation: 'analyze',
          contractor_id: contractor.id,
          model: gemini!.getModelName(),
          total_tokens: 0,
          cost_estimate: 0,
          duration_ms: 0,
          success: false,
          error_message: errorMsg,
        });
      }
    }

    result.success = result.errors.length === 0;

    // Summary
    log('\n' + '='.repeat(50));
    log('[Analyze] Complete!');
    log(`  ✅ Analyzed: ${result.analyzed}`);
    log(`  ⏭️  Skipped: ${result.skipped}`);
    log(`  ❌ Errors: ${result.errors.length}`);
    log(`  🔢 Total tokens: ${result.totalTokens.toLocaleString()}`);
    log(`  💰 Estimated cost: $${result.estimatedCost.toFixed(4)}`);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    }

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMsg);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error(`[Analyze] Fatal error: ${errorMsg}`);
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
