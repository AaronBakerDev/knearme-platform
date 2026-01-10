/**
 * Simple Image Identification Utilities
 *
 * Provides lightweight image identification for portfolio photos.
 * Focuses on: what the image shows + SEO-friendly alt text.
 *
 * Design Decision: Intentionally minimal analysis.
 * We don't need complex image understanding - just identification
 * and accessibility text. The contractor's narrative provides context.
 *
 * @see /src/lib/trades/config.ts for trade-specific context
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { logger } from '@/lib/logging';
import type { TradeConfig } from '@/lib/trades/config';

/**
 * Result of identifying an image.
 */
export interface ImageIdentification {
  /** What the image primarily shows (e.g., "brick chimney", "installed deadbolt") */
  subject: string;
  /** Suggested image type classification */
  imageType: 'before' | 'after' | 'progress' | 'detail';
  /** Generated alt text for accessibility and SEO (50-125 chars) */
  altText: string;
  /** Confidence level of the identification */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Identify what's in a project image and generate alt text.
 *
 * This is intentionally simple - we're not trying to understand
 * the full context of the project, just identify what's visible
 * and create accessible alt text.
 *
 * @param imageUrl - URL of the image to identify
 * @param tradeConfig - Trade configuration for context
 * @returns Image identification with alt text
 */
export async function identifyImage(
  imageUrl: string,
  tradeConfig: TradeConfig
): Promise<ImageIdentification> {
  const prompt = `
You are identifying a ${tradeConfig.displayName} project photo for a contractor portfolio.

Your task:
1. Identify what the image shows (be specific but brief)
2. Classify the image type:
   - "before": ${tradeConfig.imageGuidance.before}
   - "after": ${tradeConfig.imageGuidance.after}
   - "progress": ${tradeConfig.imageGuidance.progress}
   - "detail": ${tradeConfig.imageGuidance.detail}
3. Write alt text (50-125 characters, descriptive for accessibility)

Common ${tradeConfig.displayName} subjects: ${tradeConfig.terminology.materials.slice(0, 8).join(', ')}

Respond in this exact JSON format:
{
  "subject": "brief description of what's shown",
  "imageType": "before" | "after" | "progress" | "detail",
  "altText": "descriptive alt text for accessibility",
  "confidence": "high" | "medium" | "low"
}
`.trim();

  try {
    const result = await generateText({
      model: google('gemini-2.0-flash'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: new URL(imageUrl) },
          ],
        },
      ],
    });

    // Parse the JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return createFallbackIdentification(tradeConfig);
    }

    const parsed = JSON.parse(jsonMatch[0]) as ImageIdentification;

    // Validate required fields
    if (!parsed.subject || !parsed.imageType || !parsed.altText) {
      return createFallbackIdentification(tradeConfig);
    }

    // Ensure valid image type
    if (!['before', 'after', 'progress', 'detail'].includes(parsed.imageType)) {
      parsed.imageType = 'detail';
    }

    // Ensure valid confidence
    if (!['high', 'medium', 'low'].includes(parsed.confidence)) {
      parsed.confidence = 'medium';
    }

    return parsed;
  } catch (error) {
    logger.error('[ImageUtils] Image identification failed', { error });
    return createFallbackIdentification(tradeConfig);
  }
}

/**
 * Create a fallback identification when AI analysis fails.
 */
function createFallbackIdentification(tradeConfig: TradeConfig): ImageIdentification {
  return {
    subject: `${tradeConfig.displayName} project photo`,
    imageType: 'detail',
    altText: `${tradeConfig.displayName} work in progress`,
    confidence: 'low',
  };
}

/**
 * Batch identify multiple images.
 * Processes in parallel for efficiency.
 *
 * @param imageUrls - Array of image URLs
 * @param tradeConfig - Trade configuration for context
 * @returns Array of identifications in same order as input
 */
export async function identifyImages(
  imageUrls: string[],
  tradeConfig: TradeConfig
): Promise<ImageIdentification[]> {
  const results = await Promise.all(
    imageUrls.map((url) => identifyImage(url, tradeConfig))
  );
  return results;
}

/**
 * Generate a concise image description for use in project content.
 * Combines subject identification with image type context.
 *
 * @param identification - The image identification result
 * @returns A brief description suitable for embedding in content
 */
export function formatImageDescription(identification: ImageIdentification): string {
  const typeLabels: Record<string, string> = {
    before: 'Before',
    after: 'After',
    progress: 'In progress',
    detail: 'Detail',
  };

  const label = typeLabels[identification.imageType] || 'Photo';
  return `${label}: ${identification.subject}`;
}
