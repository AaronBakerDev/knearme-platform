/**
 * Model Comparison Script
 *
 * Runs the same reviews through multiple Gemini models and generates
 * a side-by-side comparison report.
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

// Test reviews (hardcoded for reproducibility)
const TEST_REVIEWS = [
  {
    id: "87f3ccb2-31f5-4a7e-8e4a-a391e51d2e29",
    reviewer_name: "Johnny Figueroa",
    rating: 5,
    review_text: "Mac was great. Prompt and professional. I'd honestly thought my fireplace was beyond help but he put in the time to get it cleaned and ready for the season. I highly recommend and will call again."
  },
  {
    id: "9cd8a7d7-ec93-48b6-9044-43e9ea163ae3",
    reviewer_name: "Victor Lebegue",
    rating: 5,
    review_text: "Booked a simple fireplace cleaning and inspection for my wood burning fireplace. With this being a recently purchased home, I expected soot and a cracked liner, but instead got wildlife. Mace found a raccoon living in my chimney like it was an Airbnb with a five-month lease. He handled the removal like a pro, got everything cleaned up, and now I can finally use my fireplace raccoon-free and ready for winter. Would 100% call again!"
  },
  {
    id: "158f05fc-cf21-49bb-be9e-b47fde77d370",
    reviewer_name: "Paula Weaver",
    rating: 5,
    review_text: "Photos and honest information on the chimney cleaning. Very efficient and super with cleaning up. Will use them again."
  },
  {
    id: "295167f3-f538-4c8d-b1bb-fc1bd2d9697f",
    reviewer_name: "Kayla",
    rating: 5,
    review_text: "Mace did an excellent job! We were so impressed with his professionalism and knowledge. He took care of the maintenance needed same day as the free inspection, making it incredibly easy - we now have a functional fireplace ready for the winter!"
  },
  {
    id: "3b2c8d53-adec-4112-9888-dafe20a7d4fa",
    reviewer_name: "Dusty Slaten",
    rating: 5,
    review_text: "This was my first time using CrownUp and they met all my expectations. Mace arrived right on time and did an excellent job. He addressed all my concerns. He was also wonderful with my dog."
  },
  {
    id: "4afdb6b2-21d1-4dde-a4dc-f7d7d2560b71",
    reviewer_name: "Herb Hoover",
    rating: 5,
    review_text: "Eli showed up and got to work quickly and explained in detail everything about the process of the work to be done and kept me informed every step of work process\nVery professional and courteous!\nDid a great job"
  },
  {
    id: "a34ba555-8221-4d1d-b89b-7fbeb08a426a",
    reviewer_name: "megan everett",
    rating: 5,
    review_text: "Mace came out and was great - went above and beyond and even showed me how to work our fire place in our new house"
  },
  {
    id: "ca3da8c6-6ad7-4df1-aab0-8e40fcb67361",
    reviewer_name: "chaddhird",
    rating: 5,
    review_text: "Mace did a great job with our cleaning. He was very knowledgeable, finished quickly, and cleaned up thoroughly."
  },
  {
    id: "8fef9cae-c3da-495b-9a4e-82f4f77b3e75",
    reviewer_name: "Kelly Straub",
    rating: 5,
    review_text: "Mace as great! Polite, timely, knowledgeable, and addressed all my concerns."
  },
  {
    id: "2f6e7207-dfb4-441b-a492-b80c64923c17",
    reviewer_name: "Chloe Anderson",
    rating: 5,
    review_text: "Mace is great, have worked with him twice. Clean at his job and respectful. See you guys next season!"
  }
];

// Models to test
const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash'
];

// Improved prompt with few-shot examples for better accuracy
const TAGGING_PROMPT = `You are analyzing contractor reviews for a chimney/fireplace service company. Extract structured data from each review.

## Output Schema
Return a JSON array with one object per review containing:
- detected_services: string[] - ONLY services explicitly mentioned. Use [] if none specified. Do NOT infer services.
- sentiment: "positive" | "negative" | "neutral" | "mixed"
- sentiment_score: number - Use realistic range: 0.7-0.85 (good), 0.85-0.95 (excellent), 0.95-1.0 (exceptional with superlatives). Never use 1.0 unless review says "perfect" or "best ever".
- themes: string[] - Key qualities mentioned (e.g., "professional", "on time", "knowledgeable")
- key_phrases: string[] - Notable direct quotes
- project_type: "repair" | "maintenance" | "consultation" | "new_construction" | null
  - Use "maintenance" for cleaning, inspections, seasonal prep
  - Use "consultation" for teaching, showing how to use, advice
  - Use "repair" for fixing broken things, wildlife removal
  - Use null if unclear
- mentions_price: boolean - TRUE if mentions cost, pricing, "free", quotes, or estimates
- mentions_timeline: boolean - TRUE if mentions timing like "on time", "quickly", "same day", "prompt", "next season"
- confidence: number - 0.7-0.9 for typical reviews, lower if ambiguous

## Examples

Input: "Mac was great. Prompt and professional. Got our fireplace cleaned and ready for winter."
Output: {"detected_services":["fireplace cleaning"],"sentiment":"positive","sentiment_score":0.85,"themes":["professional","prompt"],"key_phrases":["great","ready for winter"],"project_type":"maintenance","mentions_price":false,"mentions_timeline":true,"confidence":0.9}

Input: "Arrived on time. Did the free inspection and fixed the issue same day."
Output: {"detected_services":["inspection","repair"],"sentiment":"positive","sentiment_score":0.85,"themes":["punctual","efficient"],"key_phrases":["free inspection","same day"],"project_type":"repair","mentions_price":true,"mentions_timeline":true,"confidence":0.9}

Input: "Showed me how to use our new fireplace. Very helpful!"
Output: {"detected_services":["fireplace instruction"],"sentiment":"positive","sentiment_score":0.8,"themes":["helpful","knowledgeable"],"key_phrases":["showed me how"],"project_type":"consultation","mentions_price":false,"mentions_timeline":false,"confidence":0.85}

Input: "Great service as always. See you next season!"
Output: {"detected_services":[],"sentiment":"positive","sentiment_score":0.8,"themes":["reliable","repeat customer"],"key_phrases":["as always","next season"],"project_type":"maintenance","mentions_price":false,"mentions_timeline":true,"confidence":0.75}

## Rules
1. ONLY include services that are EXPLICITLY mentioned. Do not infer "chimney cleaning" from context.
2. Sentiment scores should vary realistically (0.7-0.95 range for positive reviews).
3. "Free inspection", "free estimate", "good price" = mentions_price: true
4. "On time", "prompt", "quickly", "same day", "next season" = mentions_timeline: true

Reviews to analyze:
`;

interface ReviewAnalysis {
  detected_services: string[];
  sentiment: string;
  sentiment_score: number;
  themes: string[];
  key_phrases: string[];
  project_type: string | null;
  mentions_price: boolean;
  mentions_timeline: boolean;
  confidence: number;
}

interface ModelResult {
  model: string;
  analyses: ReviewAnalysis[];
  tokens: number;
  timeMs: number;
  error?: string;
}

async function runModel(modelName: string, apiKey: string): Promise<ModelResult> {
  console.log(`\n🔄 Testing ${modelName}...`);
  const startTime = Date.now();

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const reviewsText = TEST_REVIEWS.map((r, i) =>
      `Review ${i + 1} (${r.rating} stars by ${r.reviewer_name}):\n"${r.review_text}"`
    ).join('\n\n');

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: TAGGING_PROMPT + reviewsText }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        // JSON Schema enforcement - guarantees valid structure
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              detected_services: { type: 'array', items: { type: 'string' } },
              sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral', 'mixed'] },
              sentiment_score: { type: 'number' },
              themes: { type: 'array', items: { type: 'string' } },
              key_phrases: { type: 'array', items: { type: 'string' } },
              project_type: { type: 'string', enum: ['repair', 'maintenance', 'consultation', 'new_construction'], nullable: true },
              mentions_price: { type: 'boolean' },
              mentions_timeline: { type: 'boolean' },
              confidence: { type: 'number' }
            },
            required: ['detected_services', 'sentiment', 'sentiment_score', 'themes', 'mentions_price', 'mentions_timeline', 'confidence']
          }
        } as any,
      },
    });

    const timeMs = Date.now() - startTime;
    const response = result.response;
    const text = response.text();
    const tokens = response.usageMetadata?.totalTokenCount || 0;

    // Parse JSON response
    const analyses = JSON.parse(text) as ReviewAnalysis[];

    console.log(`   ✅ ${modelName}: ${tokens} tokens, ${timeMs}ms`);

    return { model: modelName, analyses, tokens, timeMs };
  } catch (error) {
    const timeMs = Date.now() - startTime;
    console.log(`   ❌ ${modelName} failed: ${error}`);
    return { model: modelName, analyses: [], tokens: 0, timeMs, error: String(error) };
  }
}

function generateMarkdownReport(results: ModelResult[]): string {
  const lines: string[] = [];

  lines.push('# Gemini Model A/B Comparison Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Reviews Tested:** ${TEST_REVIEWS.length}`);
  lines.push(`**Models Tested:** ${results.map(r => r.model).join(', ')}`);
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Model | Tokens | Time (ms) | Cost Est. | Status |');
  lines.push('|-------|--------|-----------|-----------|--------|');

  for (const result of results) {
    const cost = estimateCost(result.model, result.tokens);
    const status = result.error ? '❌ Error' : '✅ Success';
    lines.push(`| ${result.model} | ${result.tokens} | ${result.timeMs} | $${cost.toFixed(6)} | ${status} |`);
  }
  lines.push('');

  // Detailed comparison per review
  lines.push('## Review-by-Review Comparison');
  lines.push('');

  for (let i = 0; i < TEST_REVIEWS.length; i++) {
    const review = TEST_REVIEWS[i];
    lines.push(`### Review ${i + 1}: ${review.reviewer_name} (${review.rating}⭐)`);
    lines.push('');
    lines.push('**Review Text:**');
    lines.push(`> ${review.review_text}`);
    lines.push('');

    // Comparison table for this review
    lines.push('| Attribute | ' + results.map(r => r.model).join(' | ') + ' |');
    lines.push('|-----------|' + results.map(() => '---').join('|') + '|');

    const attributes = [
      'detected_services',
      'sentiment',
      'sentiment_score',
      'themes',
      'project_type',
      'mentions_price',
      'mentions_timeline',
      'confidence'
    ];

    for (const attr of attributes) {
      const values = results.map(r => {
        if (r.error || !r.analyses[i]) return 'N/A';
        const val = (r.analyses[i] as any)[attr];
        if (Array.isArray(val)) return val.join(', ') || '-';
        if (val === null) return 'null';
        if (typeof val === 'boolean') return val ? '✓' : '✗';
        return String(val);
      });
      lines.push(`| **${attr}** | ${values.join(' | ')} |`);
    }
    lines.push('');
  }

  // Agreement analysis
  lines.push('## Agreement Analysis');
  lines.push('');

  const successfulResults = results.filter(r => !r.error && r.analyses.length > 0);
  if (successfulResults.length >= 2) {
    let sentimentMatches = 0;
    let scoreWithin01 = 0;
    let serviceOverlap = 0;

    for (let i = 0; i < TEST_REVIEWS.length; i++) {
      const sentiments = successfulResults.map(r => r.analyses[i]?.sentiment);
      if (new Set(sentiments).size === 1) sentimentMatches++;

      const scores = successfulResults.map(r => r.analyses[i]?.sentiment_score || 0);
      const maxDiff = Math.max(...scores) - Math.min(...scores);
      if (maxDiff <= 0.1) scoreWithin01++;

      // Check service overlap
      const allServices = successfulResults.flatMap(r => r.analyses[i]?.detected_services || []);
      const uniqueServices = new Set(allServices);
      if (uniqueServices.size > 0) {
        const avgOverlap = allServices.length / uniqueServices.size / successfulResults.length;
        if (avgOverlap > 0.5) serviceOverlap++;
      }
    }

    lines.push(`- **Sentiment Agreement:** ${sentimentMatches}/${TEST_REVIEWS.length} reviews (${(sentimentMatches/TEST_REVIEWS.length*100).toFixed(0)}%)`);
    lines.push(`- **Score within ±0.1:** ${scoreWithin01}/${TEST_REVIEWS.length} reviews (${(scoreWithin01/TEST_REVIEWS.length*100).toFixed(0)}%)`);
    lines.push(`- **Service Detection Overlap:** ${serviceOverlap}/${TEST_REVIEWS.length} reviews`);
  }

  return lines.join('\n');
}

function estimateCost(model: string, tokens: number): number {
  // Rough cost estimates per 1M tokens (input + output averaged)
  const costs: Record<string, number> = {
    'gemini-2.0-flash': 0.25,      // $0.10 input + $0.40 output avg
    'gemini-2.5-flash-lite': 0.25, // Same as 2.0
    'gemini-2.5-flash': 1.40,      // $0.30 input + $2.50 output avg
  };
  const costPer1M = costs[model] || 0.25;
  return (tokens / 1_000_000) * costPer1M;
}

async function main() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error('❌ GOOGLE_AI_API_KEY environment variable required');
    process.exit(1);
  }

  console.log('🧪 Gemini Model Comparison Test');
  console.log(`   Testing ${TEST_REVIEWS.length} reviews across ${MODELS.length} models`);

  const results: ModelResult[] = [];

  for (const modelName of MODELS) {
    const result = await runModel(modelName, apiKey);
    results.push(result);
  }

  // Generate report
  const report = generateMarkdownReport(results);
  const outputPath = path.join(process.cwd(), 'model-comparison-report.md');
  fs.writeFileSync(outputPath, report);

  console.log(`\n📄 Report saved to: ${outputPath}`);
}

main().catch(console.error);
