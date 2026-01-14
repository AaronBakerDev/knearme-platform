#!/usr/bin/env node
/**
 * sync.ts - Utility to sync data between Supabase and local JSON files
 *
 * Exports data from Supabase to JSON files or imports JSON files back to Supabase.
 * Useful for backups, migrations, and offline analysis.
 *
 * Usage:
 *   npm run sync -- --export
 *   npm run sync -- --export --output ./backup
 *   npm run sync -- --import --input ./backup
 *   npm run sync -- --export --contractors-only --json
 *
 * @see ../lib/supabase.ts for database operations
 */

import 'dotenv/config';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { createSupabaseClient } from '../lib/supabase.js';
import type { DBContractor, DBReview, DBAnalysis, DBArticle } from '../lib/types.js';

interface ExportData {
  exportedAt: string;
  version: string;
  counts: {
    contractors: number;
    reviews: number;
    analyses: number;
    articles: number;
  };
  data: {
    contractors: DBContractor[];
    reviews: DBReview[];
    analyses: DBAnalysis[];
    articles: DBArticle[];
  };
}

interface SyncResult {
  success: boolean;
  operation: 'export' | 'import';
  counts: {
    contractors: number;
    reviews: number;
    analyses: number;
    articles: number;
  };
  outputPath?: string;
  errors: string[];
}

/**
 * Exports all data from Supabase to JSON files
 */
async function exportData(options: {
  output: string;
  contractorsOnly?: boolean;
  reviewsOnly?: boolean;
  jsonOutput?: boolean;
}): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    operation: 'export',
    counts: { contractors: 0, reviews: 0, analyses: 0, articles: 0 },
    errors: [],
  };

  try {
    // Validate environment
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    }

    const log = (message: string) => {
      if (!options.jsonOutput) {
        console.log(message);
      }
    };

    log(`\n[Sync] Starting data export...`);
    log(`[Sync] Output directory: ${options.output}`);
    log('');

    // Ensure output directory exists
    if (!fs.existsSync(options.output)) {
      fs.mkdirSync(options.output, { recursive: true });
      log(`[Sync] Created output directory: ${options.output}`);
    }

    const db = createSupabaseClient();

    // Fetch data from Supabase
    log('[Sync] Fetching contractors...');
    const contractors = await db.getContractors({ limit: 10000 });
    result.counts.contractors = contractors.length;
    log(`[Sync] Found ${contractors.length} contractors`);

    let reviews: DBReview[] = [];
    let analyses: DBAnalysis[] = [];
    let articles: DBArticle[] = [];

    if (!options.contractorsOnly) {
      // Fetch reviews for all contractors
      log('[Sync] Fetching reviews...');
      for (const contractor of contractors) {
        const contractorReviews = await db.getReviews(contractor.id);
        reviews.push(...contractorReviews);
      }
      result.counts.reviews = reviews.length;
      log(`[Sync] Found ${reviews.length} reviews`);

      if (!options.reviewsOnly) {
        // Fetch analyses
        log('[Sync] Fetching analyses...');
        for (const contractor of contractors) {
          const analysis = await db.getAnalysis(contractor.id);
          if (analysis) {
            analyses.push(analysis);
          }
        }
        result.counts.analyses = analyses.length;
        log(`[Sync] Found ${analyses.length} analyses`);

        // Fetch articles
        log('[Sync] Fetching articles...');
        for (const contractor of contractors) {
          const article = await db.getArticle(contractor.id);
          if (article) {
            articles.push(article);
          }
        }
        result.counts.articles = articles.length;
        log(`[Sync] Found ${articles.length} articles`);
      }
    }

    // Create export data object
    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      counts: result.counts,
      data: {
        contractors,
        reviews,
        analyses,
        articles,
      },
    };

    // Write to files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // Write combined export file
    const combinedPath = path.join(options.output, `export-${timestamp}.json`);
    fs.writeFileSync(combinedPath, JSON.stringify(exportData, null, 2));
    log(`[Sync] Wrote combined export: ${combinedPath}`);

    // Also write individual files for easier inspection
    if (contractors.length > 0) {
      const contractorsPath = path.join(options.output, `contractors-${timestamp}.json`);
      fs.writeFileSync(contractorsPath, JSON.stringify(contractors, null, 2));
      log(`[Sync] Wrote contractors: ${contractorsPath}`);
    }

    if (reviews.length > 0) {
      const reviewsPath = path.join(options.output, `reviews-${timestamp}.json`);
      fs.writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2));
      log(`[Sync] Wrote reviews: ${reviewsPath}`);
    }

    if (analyses.length > 0) {
      const analysesPath = path.join(options.output, `analyses-${timestamp}.json`);
      fs.writeFileSync(analysesPath, JSON.stringify(analyses, null, 2));
      log(`[Sync] Wrote analyses: ${analysesPath}`);
    }

    if (articles.length > 0) {
      const articlesPath = path.join(options.output, `articles-${timestamp}.json`);
      fs.writeFileSync(articlesPath, JSON.stringify(articles, null, 2));
      log(`[Sync] Wrote articles: ${articlesPath}`);
    }

    result.success = true;
    result.outputPath = combinedPath;

    log('');
    log(`[Sync] Export complete!`);
    log(`[Sync] Contractors: ${result.counts.contractors}`);
    log(`[Sync] Reviews: ${result.counts.reviews}`);
    log(`[Sync] Analyses: ${result.counts.analyses}`);
    log(`[Sync] Articles: ${result.counts.articles}`);

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    result.errors.push(errorMsg);

    if (!options.jsonOutput) {
      console.error(`[Sync] Fatal error: ${errorMsg}`);
    }
  }

  return result;
}

/**
 * Imports data from JSON file to Supabase
 */
async function importData(options: {
  input: string;
  jsonOutput?: boolean;
}): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    operation: 'import',
    counts: { contractors: 0, reviews: 0, analyses: 0, articles: 0 },
    errors: [],
  };

  try {
    // Validate environment
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    }

    const log = (message: string) => {
      if (!options.jsonOutput) {
        console.log(message);
      }
    };

    log(`\n[Sync] Starting data import...`);
    log(`[Sync] Input file: ${options.input}`);
    log('');

    // Check if input file exists
    if (!fs.existsSync(options.input)) {
      throw new Error(`Input file not found: ${options.input}`);
    }

    // Read and parse input file
    const fileContent = fs.readFileSync(options.input, 'utf-8');
    let importData: ExportData;

    try {
      importData = JSON.parse(fileContent);
    } catch (parseErr) {
      throw new Error(`Failed to parse JSON file: ${parseErr}`);
    }

    // Validate import data structure
    if (!importData.data) {
      throw new Error('Invalid import file: missing "data" field');
    }

    log(`[Sync] Import file version: ${importData.version || 'unknown'}`);
    log(`[Sync] Exported at: ${importData.exportedAt || 'unknown'}`);
    log(`[Sync] Counts: ${JSON.stringify(importData.counts || {})}`);
    log('');

    const db = createSupabaseClient();

    // Import contractors
    if (importData.data.contractors && importData.data.contractors.length > 0) {
      log(`[Sync] Importing ${importData.data.contractors.length} contractors...`);

      for (const contractor of importData.data.contractors) {
        try {
          // Handle category: could be string (old format) or string[] (new format)
          // Pass full arrays to preserve all data during sync
          const categoryArray = Array.isArray(contractor.category)
            ? contractor.category
            : contractor.category ? [contractor.category] : undefined;

          // Handle search_terms: pass full array if present
          const searchTermsArray = Array.isArray(contractor.search_terms)
            ? contractor.search_terms
            : undefined;

          await db.upsertContractor({
            place_id: contractor.place_id,
            business_name: contractor.business_name,
            city: contractor.city,
            country: contractor.country,
            state: contractor.state || undefined,
            cid: contractor.cid || undefined,
            categories: categoryArray,       // Pass full array
            search_terms: searchTermsArray,  // Pass full array
            rating: contractor.rating || undefined,
            review_count: contractor.review_count || undefined,
            address: contractor.address || undefined,
            phone: contractor.phone || undefined,
            website: contractor.website || undefined,
            latitude: contractor.latitude || undefined,
            longitude: contractor.longitude || undefined,
            is_claimed: contractor.is_claimed,
            discovered_at: contractor.discovered_at,
          });
          result.counts.contractors++;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          result.errors.push(`Contractor ${contractor.business_name}: ${errorMsg}`);
        }
      }
      log(`[Sync] Imported ${result.counts.contractors} contractors`);
    }

    // Import reviews
    if (importData.data.reviews && importData.data.reviews.length > 0) {
      log(`[Sync] Importing ${importData.data.reviews.length} reviews...`);

      // Group reviews by contractor_id for batch insert
      const reviewsByContractor = new Map<string, DBReview[]>();
      for (const review of importData.data.reviews) {
        const existing = reviewsByContractor.get(review.contractor_id) || [];
        existing.push(review);
        reviewsByContractor.set(review.contractor_id, existing);
      }

      for (const [contractorId, reviews] of reviewsByContractor) {
        try {
          const reviewsToSave = reviews.map(r => ({
            review_id: r.review_id,
            review_text: r.review_text,
            rating: r.rating,
            reviewer_name: r.reviewer_name,
            review_date: r.review_date,
            owner_response: r.owner_response,
          }));

          const saveResult = await db.upsertReviews(contractorId, reviewsToSave);
          result.counts.reviews += saveResult.inserted;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          result.errors.push(`Reviews for ${contractorId}: ${errorMsg}`);
        }
      }
      log(`[Sync] Imported ${result.counts.reviews} reviews`);
    }

    // Import analyses
    if (importData.data.analyses && importData.data.analyses.length > 0) {
      log(`[Sync] Importing ${importData.data.analyses.length} analyses...`);

      for (const analysis of importData.data.analyses) {
        try {
          await db.saveAnalysis(analysis.contractor_id, analysis.analysis_json);
          result.counts.analyses++;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          result.errors.push(`Analysis for ${analysis.contractor_id}: ${errorMsg}`);
        }
      }
      log(`[Sync] Imported ${result.counts.analyses} analyses`);
    }

    // Import articles
    if (importData.data.articles && importData.data.articles.length > 0) {
      log(`[Sync] Importing ${importData.data.articles.length} articles...`);

      for (const article of importData.data.articles) {
        try {
          await db.saveArticle(article.contractor_id, {
            title: article.title,
            slug: article.slug,
            content_markdown: article.content_markdown,
            metadata_json: article.metadata_json,
          });
          result.counts.articles++;
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          result.errors.push(`Article for ${article.contractor_id}: ${errorMsg}`);
        }
      }
      log(`[Sync] Imported ${result.counts.articles} articles`);
    }

    result.success = result.errors.length === 0 ||
      (result.counts.contractors > 0 || result.counts.reviews > 0);

    log('');
    log(`[Sync] Import complete!`);
    log(`[Sync] Contractors: ${result.counts.contractors}`);
    log(`[Sync] Reviews: ${result.counts.reviews}`);
    log(`[Sync] Analyses: ${result.counts.analyses}`);
    log(`[Sync] Articles: ${result.counts.articles}`);
    if (result.errors.length > 0) {
      log(`[Sync] Errors: ${result.errors.length}`);
    }

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    result.errors.push(errorMsg);

    if (!options.jsonOutput) {
      console.error(`[Sync] Fatal error: ${errorMsg}`);
    }
  }

  return result;
}

// =============================================================================
// CLI Setup
// =============================================================================

const program = new Command();

program
  .name('sync')
  .description('Sync data between Supabase and local JSON files')
  .version('1.0.0');

program
  .command('export')
  .description('Export data from Supabase to JSON files')
  .option('-o, --output <directory>', 'Output directory', './output')
  .option('--contractors-only', 'Only export contractors (skip reviews, analyses, articles)')
  .option('--reviews-only', 'Export contractors and reviews only (skip analyses, articles)')
  .option('--json', 'Output result summary as JSON')
  .action(async (opts: {
    output: string;
    contractorsOnly?: boolean;
    reviewsOnly?: boolean;
    json?: boolean;
  }) => {
    const result = await exportData({
      output: opts.output,
      contractorsOnly: opts.contractorsOnly,
      reviewsOnly: opts.reviewsOnly,
      jsonOutput: opts.json,
    });

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    }

    process.exit(result.success ? 0 : 1);
  });

program
  .command('import')
  .description('Import data from JSON file to Supabase')
  .requiredOption('-i, --input <file>', 'Input JSON file path')
  .option('--json', 'Output result summary as JSON')
  .action(async (opts: {
    input: string;
    json?: boolean;
  }) => {
    const result = await importData({
      input: opts.input,
      jsonOutput: opts.json,
    });

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    }

    process.exit(result.success ? 0 : 1);
  });

// Default action for backwards compatibility
program
  .option('-e, --export', 'Export data from Supabase')
  .option('-I, --do-import', 'Import data to Supabase')
  .option('-o, --output <directory>', 'Output directory for export', './output')
  .option('--input <file>', 'Input JSON file for import')
  .option('--json', 'Output result summary as JSON')
  .action(async (opts: {
    export?: boolean;
    doImport?: boolean;
    output: string;
    input?: string;
    json?: boolean;
  }) => {
    if (opts.export) {
      const result = await exportData({
        output: opts.output,
        jsonOutput: opts.json,
      });

      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      }

      process.exit(result.success ? 0 : 1);
    } else if (opts.doImport) {
      if (!opts.input) {
        console.error('Error: --input is required for import operation');
        process.exit(1);
      }

      const result = await importData({
        input: opts.input,
        jsonOutput: opts.json,
      });

      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      }

      process.exit(result.success ? 0 : 1);
    } else {
      program.help();
    }
  });

program.parse(process.argv);
