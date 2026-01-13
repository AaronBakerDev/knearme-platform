/**
 * Bio Synthesis for Discovery Agent
 *
 * Generates a quality business bio by blending:
 * - Customer reviews (voice of the customer)
 * - Web content (business positioning)
 * - Business info (factual details)
 *
 * The bio should:
 * - Read like a human wrote it
 * - Highlight what customers value
 * - Convey professionalism
 * - Be 2-3 paragraphs
 *
 * @see /docs/specs/typeform-onboarding-spec.md - Phase 4: Bio Synthesis
 */

import { generateText } from 'ai';
import { getChatModel, isGoogleAIEnabled } from '@/lib/ai/providers';
import { withCircuitBreaker } from '@/lib/agents/circuit-breaker';
import type { DiscoveryState, DiscoveryReview } from './types';

export interface BioSynthesisInput {
  businessName: string;
  city?: string;
  state?: string;
  services: string[];
  reviews?: DiscoveryReview[];
  webSearchInfo?: DiscoveryState['webSearchInfo'];
  rating?: number;
  reviewCount?: number;
}

export interface BioSynthesisResult {
  bio: string;
  highlights: string[]; // 2-3 best quotes from reviews
  yearsInBusiness?: string;
}

/**
 * Build the bio synthesis prompt
 */
function buildBioSynthesisPrompt(input: BioSynthesisInput): string {
  const parts: string[] = [];

  parts.push('You are a skilled copywriter helping create a professional business bio.');
  parts.push('');
  parts.push('Write a 2-3 paragraph bio for this business. The bio should:');
  parts.push('- Sound natural, like a human wrote it');
  parts.push('- Weave in what customers love (from reviews) without just listing quotes');
  parts.push('- Convey professionalism and expertise');
  parts.push('- Be warm and approachable, not corporate');
  parts.push('- Focus on benefits to customers, not just features');
  parts.push('');
  parts.push('BUSINESS INFO:');
  parts.push(`Name: ${input.businessName}`);
  if (input.city && input.state) {
    parts.push(`Location: ${input.city}, ${input.state}`);
  }
  if (input.services.length > 0) {
    parts.push(`Services: ${input.services.join(', ')}`);
  }
  if (input.rating) {
    parts.push(`Google Rating: ${input.rating} stars`);
  }
  if (input.reviewCount) {
    parts.push(`Reviews: ${input.reviewCount}+ customer reviews`);
  }

  if (input.webSearchInfo) {
    parts.push('');
    parts.push('FROM THEIR WEBSITE:');
    if (input.webSearchInfo.aboutDescription) {
      parts.push(`About: ${input.webSearchInfo.aboutDescription}`);
    }
    if (input.webSearchInfo.yearsInBusiness) {
      parts.push(`Years in business: ${input.webSearchInfo.yearsInBusiness}`);
    }
    if (input.webSearchInfo.specialties && input.webSearchInfo.specialties.length > 0) {
      parts.push(`Specialties: ${input.webSearchInfo.specialties.join(', ')}`);
    }
    if (input.webSearchInfo.serviceAreas && input.webSearchInfo.serviceAreas.length > 0) {
      parts.push(`Service Areas: ${input.webSearchInfo.serviceAreas.join(', ')}`);
    }
  }

  if (input.reviews && input.reviews.length > 0) {
    parts.push('');
    parts.push('CUSTOMER REVIEWS:');
    // Take top reviews (prioritize 5-star reviews with text)
    const topReviews = input.reviews
      .filter((r) => r.text && r.text.length > 20)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);

    topReviews.forEach((review, i) => {
      parts.push(`Review ${i + 1} (${review.rating}⭐): "${review.text}"`);
    });
  }

  parts.push('');
  parts.push('OUTPUT FORMAT (JSON):');
  parts.push('{');
  parts.push('  "bio": "The 2-3 paragraph bio text",');
  parts.push('  "highlights": ["quote 1", "quote 2"], // 2-3 short, impactful quotes from reviews');
  parts.push('  "yearsInBusiness": "15 years" // if known');
  parts.push('}');
  parts.push('');
  parts.push('Write the bio now:');

  return parts.join('\n');
}

/**
 * Generate a quality bio from reviews and web content
 */
export async function synthesizeBio(input: BioSynthesisInput): Promise<BioSynthesisResult> {
  // Fallback if AI not available
  if (!isGoogleAIEnabled()) {
    return createFallbackBio(input);
  }

  try {
    const model = getChatModel();
    const prompt = buildBioSynthesisPrompt(input);

    const result = await withCircuitBreaker('bio-synthesis', async () => {
      return generateText({
        model,
        prompt,
        maxOutputTokens: 1024,
      });
    });

    // Parse JSON response
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          bio: parsed.bio || createFallbackBio(input).bio,
          highlights: parsed.highlights || extractHighlights(input.reviews),
          yearsInBusiness: parsed.yearsInBusiness || input.webSearchInfo?.yearsInBusiness,
        };
      }
    } catch {
      // If JSON parsing fails, treat the whole response as the bio
      return {
        bio: result.text,
        highlights: extractHighlights(input.reviews),
        yearsInBusiness: input.webSearchInfo?.yearsInBusiness,
      };
    }

    // If no valid response, return fallback
    return createFallbackBio(input);
  } catch (error) {
    console.error('[BioSynthesis] Error:', error);
    return createFallbackBio(input);
  }
}

/**
 * Create a fallback bio when AI is unavailable
 */
function createFallbackBio(input: BioSynthesisInput): BioSynthesisResult {
  const parts: string[] = [];

  // Opening paragraph
  let opener = `${input.businessName}`;
  if (input.city && input.state) {
    opener += ` is a trusted service provider in ${input.city}, ${input.state}`;
  }
  if (input.services.length > 0) {
    opener += `, specializing in ${input.services.slice(0, 3).join(', ')}`;
  }
  opener += '.';
  parts.push(opener);

  // Rating/review paragraph
  if (input.rating && input.reviewCount) {
    parts.push(
      `With a ${input.rating}-star rating from over ${input.reviewCount} customer reviews, ` +
        `${input.businessName} has built a reputation for quality work and reliable service.`
    );
  }

  // Website info paragraph
  if (input.webSearchInfo?.aboutDescription) {
    parts.push(input.webSearchInfo.aboutDescription);
  }

  return {
    bio: parts.join(' '),
    highlights: extractHighlights(input.reviews),
    yearsInBusiness: input.webSearchInfo?.yearsInBusiness,
  };
}

/**
 * Extract the best quotes from reviews for highlights
 */
function extractHighlights(reviews?: DiscoveryReview[]): string[] {
  if (!reviews || reviews.length === 0) return [];

  // Get quotes from 5-star reviews
  const fiveStarReviews = reviews
    .filter((r) => r.rating >= 4.5 && r.text && r.text.length > 20 && r.text.length < 200)
    .sort((a, b) => a.text.length - b.text.length) // Prefer shorter, punchier quotes
    .slice(0, 3);

  return fiveStarReviews.map((r) => {
    // Try to extract a good quote segment
    const text = r.text;
    // If short enough, use the whole thing
    if (text.length < 100) return text;
    // Otherwise, try to find a sentence
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    const firstSentence = sentences[0];
    if (firstSentence) {
      return firstSentence.trim() + '.';
    }
    return text.slice(0, 100) + '...';
  });
}
