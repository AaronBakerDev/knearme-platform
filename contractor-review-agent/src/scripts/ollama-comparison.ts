/**
 * Ollama Model Comparison Script
 *
 * Runs the same reviews through multiple local Ollama models and generates
 * a side-by-side comparison report.
 */

import * as fs from 'fs';
import * as path from 'path';

// Test reviews (same as Gemini test for comparison)
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

// Models to test (ordered by size for efficiency comparison)
const MODELS = [
  'gemma3:4b',      // Smallest Gemma 3 (3.3GB)
  'qwen2.5:14b',    // Best for JSON structured output (9GB)
  'gemma2:9b',      // Proven quality (5.4GB)
];

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
5. Return ONLY valid JSON array. No markdown, no explanation.

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
  timeMs: number;
  tokensPerSecond?: number;
  error?: string;
}

async function runOllamaModel(modelName: string): Promise<ModelResult> {
  console.log(`\n🔄 Testing ${modelName}...`);
  const startTime = Date.now();

  try {
    const reviewsText = TEST_REVIEWS.map((r, i) =>
      `Review ${i + 1} (${r.rating} stars by ${r.reviewer_name}):\n"${r.review_text}"`
    ).join('\n\n');

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt: TAGGING_PROMPT + reviewsText,
        stream: false,
        // Note: format: 'json' causes parsing issues with some models
        options: {
          temperature: 0.1,
          num_predict: 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const timeMs = Date.now() - startTime;
    const text = data.response;

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    } else {
      // Try to find JSON array directly
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonText = arrayMatch[0];
      }
    }

    // Parse JSON response
    const analyses = JSON.parse(jsonText) as ReviewAnalysis[];

    // Calculate tokens per second from Ollama metrics
    const tokensPerSecond = data.eval_count ?
      (data.eval_count / (data.eval_duration / 1e9)) : undefined;

    console.log(`   ✅ ${modelName}: ${timeMs}ms${tokensPerSecond ? `, ${tokensPerSecond.toFixed(1)} tok/s` : ''}`);

    return { model: modelName, analyses, timeMs, tokensPerSecond };
  } catch (error) {
    const timeMs = Date.now() - startTime;
    console.log(`   ❌ ${modelName} failed: ${error}`);
    return { model: modelName, analyses: [], timeMs, error: String(error) };
  }
}

function generateMarkdownReport(results: ModelResult[]): string {
  const lines: string[] = [];

  lines.push('# Ollama Local Model A/B Comparison Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Reviews Tested:** ${TEST_REVIEWS.length}`);
  lines.push(`**Models Tested:** ${results.map(r => r.model).join(', ')}`);
  lines.push(`**Hardware:** Apple M4 Max, 128GB RAM`);
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Model | Time (ms) | Tok/s | Cost | Status |');
  lines.push('|-------|-----------|-------|------|--------|');

  for (const result of results) {
    const status = result.error ? '❌ Error' : '✅ Success';
    const tps = result.tokensPerSecond ? `${result.tokensPerSecond.toFixed(1)}` : 'N/A';
    lines.push(`| ${result.model} | ${result.timeMs} | ${tps} | $0.00 | ${status} |`);
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

  // Cost comparison with Gemini
  lines.push('');
  lines.push('## Cost Comparison vs Gemini API');
  lines.push('');
  lines.push('| Model | Cost per 10 Reviews | Annual (10K reviews) |');
  lines.push('|-------|---------------------|----------------------|');
  lines.push('| Ollama (local) | $0.00 | $0.00 |');
  lines.push('| Gemini 2.0 Flash | $0.0006 | $6.00 |');
  lines.push('| Gemini 2.5 Flash-Lite | $0.0006 | $6.00 |');
  lines.push('| Gemini 2.5 Flash | $0.0076 | $76.00 |');

  return lines.join('\n');
}

async function main() {
  // Check if Ollama is running
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) throw new Error('Ollama not responding');
  } catch (error) {
    console.error('❌ Ollama is not running. Start it with: ollama serve');
    process.exit(1);
  }

  console.log('🧪 Ollama Local Model Comparison Test');
  console.log(`   Testing ${TEST_REVIEWS.length} reviews across ${MODELS.length} models`);
  console.log(`   Hardware: Apple M4 Max, 128GB RAM`);

  const results: ModelResult[] = [];

  for (const modelName of MODELS) {
    const result = await runOllamaModel(modelName);
    results.push(result);
  }

  // Generate report
  const report = generateMarkdownReport(results);
  const outputPath = path.join(process.cwd(), 'ollama-comparison-report.md');
  fs.writeFileSync(outputPath, report);

  console.log(`\n📄 Report saved to: ${outputPath}`);
}

main().catch(console.error);
