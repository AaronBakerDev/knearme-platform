/**
 * Batch Review Tagging Script
 *
 * Two modes:
 *   --mode test   : Real-time API, instant results, for validation (100-1000 reviews)
 *   --mode batch  : Batch API, 24h turnaround, for production (65K reviews)
 *
 * Usage:
 *   npx tsx src/scripts/batch-tag-reviews.ts --mode test --limit 100
 *   npx tsx src/scripts/batch-tag-reviews.ts --mode batch --limit 65000
 *
 * Cost:
 *   Test mode:  ~$0.06 per 100 reviews (2x batch price, instant)
 *   Batch mode: ~$0.03 per 100 reviews (50% discount, 24h SLA)
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

// =============================================================================
// Configuration
// =============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// =============================================================================
// Types
// =============================================================================

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
}

interface TagResult {
  detected_services: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentiment_score: number;
  themes: string[];
  project_type: 'repair' | 'maintenance' | 'consultation' | 'new_construction' | null;
  mentions_price: boolean;
  mentions_timeline: boolean;
  confidence: number;
}

// =============================================================================
// Prompt
// =============================================================================

const TAGGING_PROMPT = `You are analyzing contractor reviews for home service companies.
Extract structured data following these rules:

- detected_services: ONLY services explicitly mentioned. Use empty array [] if none specified. Do NOT infer.
- sentiment: "positive", "negative", "neutral", or "mixed"
- sentiment_score: Use realistic range 0.7-0.95 for positive, -0.7 to -0.95 for negative. Never 1.0 or -1.0.
- themes: Key themes like "professional", "on time", "quality work"
- project_type: "maintenance" for cleaning/routine, "consultation" for teaching/advice, "repair" for fixing, "new_construction" for new installs, null if unclear
- mentions_price: true if mentions "free", cost, pricing, quotes, estimates, affordable, "$"
- mentions_timeline: true if mentions "on time", "quickly", "same day", "prompt", "next day", scheduling

Return ONLY valid JSON matching this schema:
{
  "detected_services": string[],
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "sentiment_score": number,
  "themes": string[],
  "project_type": "repair" | "maintenance" | "consultation" | "new_construction" | null,
  "mentions_price": boolean,
  "mentions_timeline": boolean,
  "confidence": number
}`;

// =============================================================================
// Database Functions
// =============================================================================

async function getReviewsToTag(limit: number, offset: number = 0): Promise<Review[]> {
  console.log(`Fetching ${limit} reviews (offset: ${offset})...`);

  const { data, error } = await supabase
    .from('review_data')
    .select('id, reviewer_name, rating, review_text')
    .not('review_text', 'is', null)
    .gt('review_text', '')
    .is('analysis_json', null)  // Skip already-analyzed reviews
    .order('id')
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }

  console.log(`Fetched ${data?.length || 0} reviews`);
  return data || [];
}

async function saveResults(results: { id: string; analysis_json: TagResult }[]): Promise<void> {
  console.log(`Saving ${results.length} results to database...`);

  // Update in batches of 100
  const batchSize = 100;
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);

    for (const result of batch) {
      const { error } = await supabase
        .from('review_data')
        .update({ analysis_json: result.analysis_json })
        .eq('id', result.id);

      if (error) {
        console.error(`Failed to update review ${result.id}: ${error.message}`);
      }
    }

    console.log(`  Saved ${Math.min(i + batchSize, results.length)}/${results.length}`);
  }
}

// =============================================================================
// Real-Time Mode (for testing)
// =============================================================================

async function runTestMode(limit: number): Promise<void> {
  console.log('\n=== TEST MODE (Real-Time API) ===');
  console.log(`Processing ${limit} reviews...`);
  console.log(`Estimated cost: $${(limit * 0.0006).toFixed(2)}\n`);

  const reviews = await getReviewsToTag(limit);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',  // Use stable model, not experimental
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    }
  });

  const results: { id: string; analysis_json: TagResult }[] = [];
  const startTime = Date.now();

  // Rate limit: 15 requests per minute for free tier = 4 seconds between requests
  const DELAY_MS = 4000;
  console.log(`Rate limit: 1 request every ${DELAY_MS/1000}s (15/min free tier)\n`);

  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i];

    try {
      const prompt = `${TAGGING_PROMPT}

Review from ${review.reviewer_name} (${review.rating}★):
"${review.review_text}"`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text) as TagResult;

      results.push({ id: review.id, analysis_json: parsed });

      // Progress indicator
      const pct = ((i + 1) / reviews.length * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const eta = (((reviews.length - i - 1) * DELAY_MS) / 1000 / 60).toFixed(1);
      const status = parsed.sentiment === 'positive' ? '✓' : parsed.sentiment === 'negative' ? '✗' : '○';
      console.log(`[${pct}%] ${status} ${review.reviewer_name.slice(0, 20).padEnd(20)} → ${parsed.sentiment} (${parsed.sentiment_score}) | ${elapsed}s elapsed, ~${eta}min left`);

    } catch (err: any) {
      // Handle rate limit with retry
      if (err.message?.includes('429') || err.message?.includes('Too Many Requests')) {
        console.log(`[RATE LIMITED] Waiting 60s before retry...`);
        await new Promise(r => setTimeout(r, 60000));
        i--; // Retry this review
        continue;
      }
      console.error(`[ERROR] ${review.reviewer_name}: ${err.message?.slice(0, 80)}`);
    }

    // Rate limiting
    if (i < reviews.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  const elapsed = (Date.now() - startTime) / 1000;
  console.log(`\n✓ Processed ${results.length}/${reviews.length} reviews in ${elapsed.toFixed(1)}s`);

  // Save to file for review
  const outputPath = `test_results_${limit}.json`;
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`✓ Saved results to ${outputPath}`);

  // Show sample
  console.log('\n--- Sample Results (first 3) ---');
  for (const r of results.slice(0, 3)) {
    console.log(`\n${JSON.stringify(r.analysis_json, null, 2)}`);
  }

  // Ask to save to DB
  console.log(`\n⚠️  Results saved to ${outputPath}`);
  console.log(`    Review the file, then run with --save to update database`);
}

// =============================================================================
// Batch Mode (for production)
// =============================================================================

async function runBatchMode(limit: number): Promise<void> {
  console.log('\n=== BATCH MODE (Batch API) ===');
  console.log(`Preparing up to ${limit} reviews for batch processing...`);
  console.log(`Turnaround: ~24 hours\n`);

  // Paginate through all reviews (Supabase limits to 1000 per query)
  const PAGE_SIZE = 1000;
  const allReviews: Review[] = [];
  let offset = 0;

  while (allReviews.length < limit) {
    const batch = await getReviewsToTag(Math.min(PAGE_SIZE, limit - allReviews.length), offset);
    if (batch.length === 0) break;
    allReviews.push(...batch);
    offset += PAGE_SIZE;
    console.log(`  Fetched ${allReviews.length} reviews so far...`);
  }

  const reviews = allReviews;
  console.log(`\nTotal reviews to process: ${reviews.length}`);
  console.log(`Estimated cost: $${(reviews.length * 0.0003).toFixed(2)} (50% batch discount)\n`);

  // Create JSONL file for batch upload
  // Format: https://ai.google.dev/gemini-api/docs/batch
  const batchRequests = reviews.map((review, index) => ({
    custom_id: review.id,
    request: {
      model: 'gemini-2.0-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `${TAGGING_PROMPT}

Review from ${review.reviewer_name} (${review.rating}★):
"${review.review_text}"`
        }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    }
  }));

  // Write JSONL file
  const jsonlPath = `batch_input_${reviews.length}.jsonl`;
  const jsonlContent = batchRequests.map(r => JSON.stringify(r)).join('\n');
  fs.writeFileSync(jsonlPath, jsonlContent);

  console.log(`✓ Created ${jsonlPath} (${batchRequests.length} requests)`);
  console.log(`\n--- Next Steps ---`);
  console.log(`1. Upload to Google AI Studio or via API:`);
  console.log(`   https://aistudio.google.com/batches`);
  console.log(`\n2. Or use the API:`);
  console.log(`   curl -X POST "https://generativelanguage.googleapis.com/v1beta/files:upload" \\`);
  console.log(`     -H "x-goog-api-key: $GOOGLE_AI_API_KEY" \\`);
  console.log(`     -F "file=@${jsonlPath}"`);
  console.log(`\n3. When complete, run:`);
  console.log(`   npx tsx src/scripts/batch-tag-reviews.ts --import batch_output.jsonl`);
}

// =============================================================================
// Import Batch Results
// =============================================================================

async function importBatchResults(filePath: string): Promise<void> {
  console.log(`\n=== IMPORTING BATCH RESULTS ===`);
  console.log(`Reading ${filePath}...`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  const results: { id: string; analysis_json: TagResult }[] = [];

  for (const line of lines) {
    try {
      const item = JSON.parse(line);
      const id = item.custom_id;
      const text = item.response?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        const parsed = JSON.parse(text) as TagResult;
        results.push({ id, analysis_json: parsed });
      }
    } catch (err) {
      console.error(`Failed to parse line: ${err}`);
    }
  }

  console.log(`Parsed ${results.length} results`);

  // Save to database
  await saveResults(results);
  console.log(`✓ Updated ${results.length} reviews in database`);
}

// =============================================================================
// Save Test Results to Database
// =============================================================================

async function saveTestResults(filePath: string): Promise<void> {
  console.log(`\n=== SAVING TEST RESULTS ===`);
  console.log(`Reading ${filePath}...`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const results = JSON.parse(content) as { id: string; analysis_json: TagResult }[];

  console.log(`Found ${results.length} results`);
  await saveResults(results);
  console.log(`✓ Updated ${results.length} reviews in database`);
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  const mode = args.includes('--mode')
    ? args[args.indexOf('--mode') + 1]
    : 'test';

  const limit = args.includes('--limit')
    ? parseInt(args[args.indexOf('--limit') + 1])
    : 100;

  const importPath = args.includes('--import')
    ? args[args.indexOf('--import') + 1]
    : null;

  const savePath = args.includes('--save')
    ? args[args.indexOf('--save') + 1]
    : null;

  // Validate
  if (!GEMINI_API_KEY) {
    console.error('Error: GOOGLE_AI_API_KEY environment variable required');
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(1);
  }

  // Route to correct function
  if (importPath) {
    await importBatchResults(importPath);
  } else if (savePath) {
    await saveTestResults(savePath);
  } else if (mode === 'test') {
    await runTestMode(limit);
  } else if (mode === 'batch') {
    await runBatchMode(limit);
  } else {
    console.log(`
Batch Review Tagging Script

Usage:
  # Test mode (instant, for validation)
  npx tsx src/scripts/batch-tag-reviews.ts --mode test --limit 100

  # Batch mode (24h, for production)
  npx tsx src/scripts/batch-tag-reviews.ts --mode batch --limit 65000

  # Save test results to database
  npx tsx src/scripts/batch-tag-reviews.ts --save test_results_100.json

  # Import batch results
  npx tsx src/scripts/batch-tag-reviews.ts --import batch_output.jsonl

Options:
  --mode test|batch   Processing mode (default: test)
  --limit N           Number of reviews to process (default: 100)
  --save FILE         Save test results JSON to database
  --import FILE       Import batch results JSONL to database
`);
  }
}

main().catch(console.error);
