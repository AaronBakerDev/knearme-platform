/**
 * Gemini 3 Flash Client for Contractor Review Agent
 *
 * Uses Google's Gemini 3 Flash model for:
 * - Review analysis (theme extraction, sentiment analysis)
 * - Article generation (SEO-optimized content)
 *
 * Model: gemini-3-flash-preview
 * Pricing: $0.50/1M input tokens, $3.00/1M output tokens
 *
 * @see https://ai.google.dev/gemini-api/docs
 * @see /docs/content-strategy/05-content-pipeline.md
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { ReviewAnalysis, ArticleMetadata, DBContractor, DBReview } from './types.js';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Thinking levels control reasoning depth vs speed/cost tradeoff
 * - minimal: Fastest, cheapest, simple tasks
 * - low: Quick responses, basic reasoning
 * - medium: Balanced (default for analysis)
 * - high: Deep reasoning (default for generation)
 */
export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  thinkingLevel?: ThinkingLevel;
}

const DEFAULT_MODEL = 'gemini-2.0-flash';  // Gemini 2.0 Flash (for A/B test)
const DEFAULT_THINKING_LEVEL: ThinkingLevel = 'medium';

// =============================================================================
// Client Class
// =============================================================================

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private modelName: string;

  constructor(config: GeminiConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.modelName = config.model || DEFAULT_MODEL;
    this.model = this.genAI.getGenerativeModel({
      model: this.modelName,
    });
  }

  /**
   * Analyze contractor reviews and extract structured insights
   *
   * @param contractor - The contractor being analyzed
   * @param reviews - Array of reviews to analyze
   * @returns Structured analysis with themes, quotes, sentiment
   */
  /**
   * Get the model name being used
   */
  getModelName(): string {
    return this.modelName;
  }

  async analyzeReviews(
    contractor: DBContractor,
    reviews: DBReview[]
  ): Promise<{
    analysis: ReviewAnalysis;
    tokensUsed: number;
    model: string;
    costEstimate: number;
    durationMs: number;
  }> {
    const startTime = Date.now();

    const reviewTexts = reviews
      .filter(r => r.review_text && r.review_text.trim().length > 0)
      .map(r => `[${r.rating}★] ${r.review_text}${r.owner_response ? `\n  Owner reply: ${r.owner_response}` : ''}`)
      .join('\n\n');

    const prompt = this.buildAnalysisPrompt(contractor, reviewTexts, reviews.length);

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,  // Lower temp for consistent structured output
        topP: 0.8,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });

    const response = result.response;
    const text = response.text();
    const durationMs = Date.now() - startTime;

    // Parse the JSON response
    let analysis: ReviewAnalysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      // If JSON parsing fails, try to extract JSON from markdown code block
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error(`Failed to parse Gemini response as JSON: ${text.substring(0, 200)}...`);
      }
    }

    // Calculate tokens (approximate - 4 chars per token)
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(text.length / 4);
    const tokensUsed = inputTokens + outputTokens;

    // Calculate cost: $0.50/1M input, $3.00/1M output
    const costEstimate = (inputTokens * 0.5 + outputTokens * 3.0) / 1_000_000;

    return {
      analysis,
      tokensUsed,
      model: this.modelName,
      costEstimate,
      durationMs,
    };
  }

  /**
   * Generate an SEO-optimized article for a contractor
   *
   * @param contractor - The contractor
   * @param analysis - Previously generated analysis
   * @param reviews - Original reviews for quotes
   * @returns Generated article content and metadata
   */
  async generateArticle(
    contractor: DBContractor,
    analysis: ReviewAnalysis,
    reviews: DBReview[]
  ): Promise<{
    title: string;
    content: string;
    metadata: ArticleMetadata;
    tokensUsed: number;
    model: string;
    costEstimate: number;
    durationMs: number;
  }> {
    const startTime = Date.now();
    const prompt = this.buildGenerationPrompt(contractor, analysis, reviews);

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,  // Higher temp for more creative writing
        topP: 0.9,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    const response = result.response;
    const text = response.text();
    const durationMs = Date.now() - startTime;

    // Parse the JSON response
    let parsed: { title: string; content: string; seo: { description: string; keywords: string[] } };
    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error(`Failed to parse Gemini response as JSON: ${text.substring(0, 200)}...`);
      }
    }

    const metadata: ArticleMetadata = {
      seo: {
        title: parsed.title,
        description: parsed.seo?.description || `Read ${analysis.summary.total_reviews} customer reviews for ${contractor.business_name} in ${contractor.city}.`,
        keywords: parsed.seo?.keywords || [contractor.business_name, contractor.city, ...(contractor.category?.length ? contractor.category : ['contractor'])],
      },
      structured_data: {
        type: 'LocalBusiness',
        name: contractor.business_name,
        aggregateRating: {
          ratingValue: contractor.rating || analysis.summary.average_rating,
          reviewCount: contractor.review_count || analysis.summary.total_reviews,
        },
      },
      generated_with: {
        model: this.modelName,
        timestamp: new Date().toISOString(),
        review_count: reviews.length,
      },
    };

    // Calculate tokens (approximate - 4 chars per token)
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(text.length / 4);
    const tokensUsed = inputTokens + outputTokens;

    // Calculate cost: $0.50/1M input, $3.00/1M output
    const costEstimate = (inputTokens * 0.5 + outputTokens * 3.0) / 1_000_000;

    return {
      title: parsed.title,
      content: parsed.content,
      metadata,
      tokensUsed,
      model: this.modelName,
      costEstimate,
      durationMs,
    };
  }

  /**
   * Analyze individual reviews and tag them with detected services, sentiment, etc.
   * Uses batch processing for efficiency - sends multiple reviews in one API call.
   *
   * @param reviews - Array of reviews to analyze (max 20 per batch for best results)
   * @param contractorContext - Optional context about the contractor (business name, category)
   * @returns Analysis for each review, keyed by review ID
   */
  async tagReviewsBatch(
    reviews: Array<{ id: string; review_text: string | null; rating: number }>,
    contractorContext?: { business_name: string; category: string[] }
  ): Promise<{
    results: Map<string, ReviewTagAnalysis>;
    tokensUsed: number;
    model: string;
    costEstimate: number;
    durationMs: number;
  }> {
    const startTime = Date.now();

    // Filter reviews with actual text
    const reviewsWithText = reviews.filter(r => r.review_text && r.review_text.trim().length > 10);

    if (reviewsWithText.length === 0) {
      return {
        results: new Map(),
        tokensUsed: 0,
        model: this.modelName,
        costEstimate: 0,
        durationMs: Date.now() - startTime,
      };
    }

    const prompt = this.buildReviewTaggingPrompt(reviewsWithText, contractorContext);

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,  // Lower temp for consistent tagging
        topP: 0.8,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    const response = result.response;
    const text = response.text();
    const durationMs = Date.now() - startTime;

    // Parse the JSON response
    let parsed: Record<string, ReviewTagAnalysis>;
    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error(`Failed to parse Gemini response as JSON: ${text.substring(0, 200)}...`);
      }
    }

    // Convert to Map
    const results = new Map<string, ReviewTagAnalysis>();
    for (const [id, analysis] of Object.entries(parsed)) {
      results.set(id, analysis);
    }

    // Calculate tokens (approximate - 4 chars per token)
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(text.length / 4);
    const tokensUsed = inputTokens + outputTokens;

    // Calculate cost: $0.50/1M input, $3.00/1M output
    const costEstimate = (inputTokens * 0.5 + outputTokens * 3.0) / 1_000_000;

    return {
      results,
      tokensUsed,
      model: this.modelName,
      costEstimate,
      durationMs,
    };
  }

  // ===========================================================================
  // Prompt Builders
  // ===========================================================================

  /**
   * Build prompt for review-level tagging
   *
   * Key design decisions:
   * - Open-ended service detection (no predefined list)
   * - Infer from context, don't assume
   * - Low confidence when unsure
   */
  private buildReviewTaggingPrompt(
    reviews: Array<{ id: string; review_text: string | null; rating: number }>,
    contractorContext?: { business_name: string; category: string[] }
  ): string {
    const reviewsFormatted = reviews
      .map(r => `[ID: ${r.id}] [${r.rating}★]\n${r.review_text}`)
      .join('\n\n---\n\n');

    // Join categories for display, fall back to 'contractor' if empty
    const categoryDisplay = contractorContext?.category?.length
      ? contractorContext.category.join(', ')
      : 'contractor';

    const contextLine = contractorContext
      ? `These reviews are for "${contractorContext.business_name}" (listed as: ${categoryDisplay}).`
      : 'These reviews are for a contractor (category unknown).';

    return `You are analyzing individual customer reviews to tag them with services and attributes.

## Context
${contextLine}

## Your Task
For each review below, determine:
1. **What service(s) the customer received** - Infer from context. Examples: "chimney repair", "tuckpointing", "brick restoration", "foundation waterproofing", "fireplace installation", "stone veneer", "concrete work", etc. If the review doesn't mention a specific service, return an empty array.
2. **Sentiment** - Is the customer happy (positive), unhappy (negative), mixed feelings (mixed), or just factual (neutral)?
3. **Key themes** - What does the review talk about? Examples: "quality work", "on time", "professional crew", "pricing", "communication", "clean up", "would recommend", etc.
4. **Project type** - Was this a repair, new construction, maintenance/upkeep, or consultation? Null if unclear.
5. **Mentions price/timeline** - Does the review discuss cost or how long the work took?
6. **Confidence** - How confident are you in your analysis? 0.0-0.3 for vague reviews, 0.7-1.0 for detailed reviews.

## Important Guidelines
- **DO NOT assume services** - Only tag services explicitly mentioned or clearly implied
- **Be specific** - "chimney cap repair" is better than just "chimney work"
- **Multiple services are OK** - A review might mention several projects
- **Empty is fine** - If a review says "Great company!" with no details, detected_services = []
- **Local terminology** - "parging", "repointing", "tuckpointing" are all valid service names
- **Don't restrict to masonry** - If they mention a different trade, tag it

## Reviews to Analyze
${reviewsFormatted}

## Output Format
Return a JSON object where keys are review IDs and values are the analysis:

{
  "<review_id>": {
    "detected_services": ["<service 1>", "<service 2>"],
    "sentiment": "positive" | "negative" | "neutral" | "mixed",
    "sentiment_score": <-1.0 to 1.0>,
    "themes": ["<theme 1>", "<theme 2>"],
    "key_phrases": ["<notable phrase from review>"],
    "project_type": "repair" | "new_construction" | "maintenance" | "consultation" | null,
    "mentions_price": true | false,
    "mentions_timeline": true | false,
    "confidence": <0.0 to 1.0>
  }
}

Return ONLY the JSON object, no markdown or explanation.`;
  }

  private buildAnalysisPrompt(
    contractor: DBContractor,
    reviewTexts: string,
    totalReviews: number
  ): string {
    return `You are analyzing customer reviews for "${contractor.business_name}", a ${contractor.category?.length ? contractor.category.join(', ') : 'contractor'} in ${contractor.city}, ${contractor.state || ''}.

## Task
Analyze these ${totalReviews} Google reviews and extract structured insights.

## Reviews
${reviewTexts}

## Output Format
Return a JSON object with this exact structure:

{
  "summary": {
    "total_reviews": ${totalReviews},
    "average_rating": <calculated from reviews>,
    "rating_distribution": {"5": <count>, "4": <count>, "3": <count>, "2": <count>, "1": <count>}
  },
  "sentiment": {
    "overall": "<positive|negative|mixed|neutral>",
    "score": <-1 to 1, where 1 is very positive>
  },
  "themes": {
    "positive": [
      {"theme": "<theme name>", "count": <how many reviews mention it>, "examples": ["<quote 1>", "<quote 2>"]}
    ],
    "negative": [
      {"theme": "<theme name>", "count": <how many reviews mention it>, "examples": ["<quote>"]}
    ]
  },
  "notable_quotes": [
    {"quote": "<exact quote>", "rating": <1-5>, "context": "<what makes this notable>", "sentiment": "<positive|negative|neutral>"}
  ],
  "red_flags": ["<any concerning patterns>"],
  "strengths": ["<key business strengths>"],
  "recommendations": ["<what type of customer/project this contractor is best for>"]
}

## Guidelines
- Extract 3-5 positive themes and 1-3 negative themes (if any)
- Include 3-5 notable quotes that best represent the business
- Be specific - use actual quotes from the reviews as evidence
- Red flags should only include serious concerns (safety, fraud, etc.)
- Strengths should be actionable and specific
- Recommendations should help homeowners decide if this is the right contractor for them`;
  }

  private buildGenerationPrompt(
    contractor: DBContractor,
    analysis: ReviewAnalysis,
    reviews: DBReview[]
  ): string {
    const topQuotes = analysis.notable_quotes
      .slice(0, 5)
      .map(q => `"${q.quote}" (${q.rating}★)`)
      .join('\n');

    const positiveThemes = analysis.themes.positive
      .map(t => `- ${t.theme} (${t.count} mentions)`)
      .join('\n');

    const negativeThemes = analysis.themes.negative
      .map(t => `- ${t.theme} (${t.count} mentions)`)
      .join('\n');

    return `You are a professional content writer creating an SEO-optimized review article for a contractor.

## Business Information
- Name: ${contractor.business_name}
- Category: ${contractor.category?.length ? contractor.category.join(', ') : 'Contractor'}
- Location: ${contractor.city}, ${contractor.state || ''}
- Rating: ${contractor.rating || analysis.summary.average_rating}★
- Total Reviews: ${analysis.summary.total_reviews}

## Analysis Summary
Sentiment: ${analysis.sentiment.overall} (score: ${analysis.sentiment.score})

### What Customers Love
${positiveThemes || 'No major positive themes identified'}

### Areas for Improvement
${negativeThemes || 'No significant concerns noted'}

### Top Customer Quotes
${topQuotes}

### Who This Contractor Is Best For
${analysis.recommendations.join(', ')}

## Task
Write an engaging, SEO-optimized article (400-600 words) that:
1. Helps homeowners decide if this contractor is right for them
2. Uses actual customer quotes as evidence
3. Is balanced and fair (mention both positives and any concerns)
4. Follows a clear structure with headers

## Output Format
Return a JSON object with this structure:

{
  "title": "<SEO-optimized title, e.g., 'Business Name Reviews: What 107 Customers Say (2025)'>",
  "content": "<full article in markdown format with headers>",
  "seo": {
    "description": "<meta description, 150-160 characters>",
    "keywords": ["<keyword1>", "<keyword2>", "<keyword3>"]
  }
}

## Article Structure (use these headers)
- ## The Bottom Line (2-3 sentence summary)
- ## What Customers Love (positive themes with quotes)
- ## Areas to Consider (any concerns, balanced tone)
- ## Who This Contractor Is Best For
- ## Recent Customer Experiences (2-3 recent quotes)

## Guidelines
- Write in second person ("you'll find...")
- Include the business name and city naturally for SEO
- Use actual quotes from the reviews
- Be helpful, not promotional
- If there are few/no concerns, skip that section`;
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a Gemini client from environment variables
 *
 * Required env vars:
 * - GOOGLE_AI_API_KEY or GEMINI_API_KEY
 *
 * Optional env vars:
 * - GEMINI_MODEL (default: gemini-2.0-flash)
 */
/**
 * Review-level analysis result (stored in review_data.analysis_json)
 *
 * @see add_review_analysis_column migration
 */
export interface ReviewTagAnalysis {
  detected_services: string[];      // Open-ended, inferred from context
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentiment_score: number;          // -1 to 1
  themes: string[];                 // What the review talks about
  key_phrases: string[];            // Notable phrases from the review
  project_type: 'repair' | 'new_construction' | 'maintenance' | 'consultation' | null;
  mentions_price: boolean;
  mentions_timeline: boolean;
  confidence: number;               // 0 to 1, how confident the analysis is
}

export function createGeminiClient(): GeminiClient {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing Gemini API key. Set GOOGLE_AI_API_KEY or GEMINI_API_KEY environment variable.'
    );
  }

  return new GeminiClient({
    apiKey,
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
  });
}
