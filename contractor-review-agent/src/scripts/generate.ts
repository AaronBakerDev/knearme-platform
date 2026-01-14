#!/usr/bin/env tsx
/**
 * Generate Script - Create SEO-optimized articles from review analysis
 *
 * This script reads analysis from Supabase and uses Gemini to:
 * - Generate article titles optimized for search
 * - Write engaging content with customer quotes
 * - Create SEO metadata (description, keywords)
 * - Save articles to review_articles table
 *
 * Usage:
 *   npm run generate -- --contractor-id <uuid>      # Generate for single contractor
 *   npm run generate -- --all                       # Generate for all analyzed
 *   npm run generate -- --city "Denver"             # Filter by city
 *   npm run generate -- --regenerate                # Regenerate existing articles
 *   npm run generate -- --publish                   # Auto-publish articles
 *
 * @see /docs/content-strategy/05-content-pipeline.md
 */

import 'dotenv/config';
import { Command } from 'commander';
import { createSupabaseClient } from '../lib/supabase.js';
import { createGeminiClient } from '../lib/gemini.js';
import type { DBContractor, DBAnalysis } from '../lib/types.js';

// =============================================================================
// CLI Setup
// =============================================================================

const program = new Command();

program
  .name('generate')
  .description('Generate SEO articles from review analysis using Gemini 3 Flash')
  .option('--contractor-id <id>', 'Generate for specific contractor')
  .option('--all', 'Generate for all analyzed contractors')
  .option('--city <city>', 'Filter by city')
  .option('--limit <n>', 'Maximum articles to generate', parseInt)
  .option('--regenerate', 'Regenerate existing articles')
  .option('--publish', 'Automatically set status to published')
  .option('--dry-run', 'Show what would be generated without calling API')
  .option('--json', 'Output results as JSON')
  .parse(process.argv);

const options = program.opts();

// =============================================================================
// Types
// =============================================================================

interface GenerateResult {
  success: boolean;
  generated: number;
  skipped: number;
  errors: string[];
  totalTokens: number;
  estimatedCost: number;
  articles: Array<{
    id: string;
    contractorName: string;
    title: string;
    slug: string;
    tokensUsed: number;
    status: 'generated' | 'skipped' | 'error';
    error?: string;
  }>;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate URL-friendly slug from business name
 */
function generateSlug(businessName: string, city: string): string {
  const base = `${businessName}-${city}-reviews`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);

  // Add timestamp suffix for uniqueness
  const timestamp = Date.now().toString(36).slice(-4);
  return `${base}-${timestamp}`;
}

// =============================================================================
// Main Function
// =============================================================================

async function main(): Promise<GenerateResult> {
  const result: GenerateResult = {
    success: false,
    generated: 0,
    skipped: 0,
    errors: [],
    totalTokens: 0,
    estimatedCost: 0,
    articles: [],
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
    log('[Generate] Initializing clients...');
    const db = createSupabaseClient();
    const gemini = options.dryRun ? null : createGeminiClient();

    // Get contractors with analysis
    let contractorsToProcess: Array<{ contractor: DBContractor; analysis: DBAnalysis }> = [];

    if (options.contractorId) {
      const contractor = await db.getContractorById(options.contractorId);
      if (!contractor) {
        throw new Error(`Contractor not found: ${options.contractorId}`);
      }

      const analysis = await db.getAnalysis(contractor.id);
      if (!analysis) {
        throw new Error(`No analysis found for contractor. Run 'npm run analyze' first.`);
      }

      contractorsToProcess = [{ contractor, analysis }];
    } else {
      // Get all contractors with analysis
      const contractors = await db.getContractors({
        city: options.city,
        minReviews: 1,
      });

      for (const contractor of contractors) {
        const analysis = await db.getAnalysis(contractor.id);
        if (analysis) {
          contractorsToProcess.push({ contractor, analysis });
        }
      }
    }

    log(`[Generate] Found ${contractorsToProcess.length} contractors with analysis`);

    // Apply limit
    if (options.limit && contractorsToProcess.length > options.limit) {
      contractorsToProcess = contractorsToProcess.slice(0, options.limit);
      log(`[Generate] Limited to ${options.limit} contractors`);
    }

    // Process each contractor
    for (let i = 0; i < contractorsToProcess.length; i++) {
      const { contractor, analysis } = contractorsToProcess[i];
      const progress = `[${i + 1}/${contractorsToProcess.length}]`;

      log(`\n${progress} Processing: ${contractor.business_name}`);

      // Check if already generated (unless --regenerate)
      if (!options.regenerate) {
        const existing = await db.getArticle(contractor.id);
        if (existing) {
          log(`  ⏭️  Article exists, skipping (use --regenerate to override)`);
          result.skipped++;
          result.articles.push({
            id: contractor.id,
            contractorName: contractor.business_name,
            title: existing.title,
            slug: existing.slug,
            tokensUsed: 0,
            status: 'skipped',
          });
          continue;
        }
      }

      // Get reviews for quotes
      const reviews = await db.getReviews(contractor.id);
      log(`  📊 Analysis: ${analysis.analysis_json.summary.total_reviews} reviews analyzed`);

      // Dry run - just show what would happen
      if (options.dryRun) {
        const slug = generateSlug(contractor.business_name, contractor.city);
        log(`  🔍 [DRY RUN] Would generate article with slug: ${slug}`);
        result.articles.push({
          id: contractor.id,
          contractorName: contractor.business_name,
          title: `${contractor.business_name} Reviews`,
          slug,
          tokensUsed: 0,
          status: 'generated',
        });
        result.generated++;
        continue;
      }

      try {
        // Generate article with Gemini
        log(`  ✍️  Generating article with Gemini...`);
        const { title, content, metadata, tokensUsed, model, costEstimate, durationMs } = await gemini!.generateArticle(
          contractor,
          analysis.analysis_json,
          reviews
        );

        const slug = generateSlug(contractor.business_name, contractor.city);
        const status = options.publish ? 'published' : 'draft';

        // Save to database with tracking data
        await db.saveArticle(contractor.id, {
          title,
          slug,
          content_markdown: content,
          metadata_json: metadata,
          status,
          model_used: model,
          tokens_used: tokensUsed,
          cost_estimate: costEstimate,
        });

        // Log AI usage for observability
        await db.logAIUsage({
          operation: 'generate',
          contractor_id: contractor.id,
          model,
          total_tokens: tokensUsed,
          cost_estimate: costEstimate,
          duration_ms: durationMs,
          success: true,
        });

        log(`  ✅ Article saved (${tokensUsed} tokens, ${durationMs}ms, ~$${costEstimate.toFixed(4)})`);
        log(`     Title: ${title}`);
        log(`     Slug: ${slug}`);
        log(`     Status: ${status}`);

        result.generated++;
        result.totalTokens += tokensUsed;
        result.estimatedCost += costEstimate;
        result.articles.push({
          id: contractor.id,
          contractorName: contractor.business_name,
          title,
          slug,
          tokensUsed,
          status: 'generated',
        });

        // Rate limiting - wait between API calls
        if (i < contractorsToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        log(`  ❌ Error: ${errorMsg}`);
        result.errors.push(`${contractor.business_name}: ${errorMsg}`);
        result.articles.push({
          id: contractor.id,
          contractorName: contractor.business_name,
          title: '',
          slug: '',
          tokensUsed: 0,
          status: 'error',
          error: errorMsg,
        });

        // Log failed AI usage
        await db.logAIUsage({
          operation: 'generate',
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
    log('[Generate] Complete!');
    log(`  ✅ Generated: ${result.generated}`);
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
      console.error(`[Generate] Fatal error: ${errorMsg}`);
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
