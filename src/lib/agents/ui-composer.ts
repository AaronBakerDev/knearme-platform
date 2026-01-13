/**
 * UI Composer Agent (DESIGN AGENT SUBAGENT)
 *
 * ARCHITECTURE: Subagent of Account Manager Orchestrator
 *
 * The Design Agent handles layout composition, design tokens, and preview
 * generation. It writes to the `design` section of the shared ProjectState.
 *
 * Persona: "I compose visual presentations that let the work shine.
 * I pick from curated options, not arbitrary CSS."
 *
 * Generates unique portfolio layouts by choosing design tokens and
 * arranging semantic blocks based on the project's character.
 *
 * KEY PRINCIPLE: Design tokens are guardrails, preventing "MySpace syndrome".
 * Agent picks from curated options:
 * - layouts: ['hero-focused', 'gallery-grid', 'story-flow', 'comparison', 'minimal']
 * - spacings: ['compact', 'comfortable', 'spacious']
 * - headings: ['bold', 'elegant', 'technical', 'playful']
 * - colors: ['slate', 'warm', 'cool', 'earth', 'vibrant']
 *
 * Tools: selectTokens, composeLayout, selectHero, renderPreview
 *
 * @see /.claude/skills/agent-atlas/references/AGENT-PERSONAS.md
 * @see /todo/ai-sdk-phase-10-persona-agents.md
 * @see /src/lib/design/tokens.ts for token schema
 * @see /src/lib/design/semantic-blocks.ts for block schema
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import {
  getGenerationModel,
  isGoogleAIEnabled,
  OUTPUT_LIMITS,
} from '@/lib/ai/providers';
import {
  DesignTokenSchema,
  type DesignTokens,
} from '@/lib/design/tokens';
import { logger } from '@/lib/logging';
import {
  SemanticBlocksSchema,
  type SemanticBlock,
} from '@/lib/design/semantic-blocks';
import { withCircuitBreaker } from '@/lib/agents/circuit-breaker';
import type { SharedProjectState } from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the UI composition process.
 * Supports iterative refinement based on user feedback.
 */
export interface UIComposerOptions {
  /** User feedback for iteration (e.g., "make it more modern") */
  feedback?: string;
  /** Areas to focus on (e.g., ["hero", "stats"]) */
  focusAreas?: string[];
  /** Elements to keep unchanged during iteration */
  preserveElements?: string[];
}

/**
 * Result from the UI Composer agent.
 * Contains the complete layout specification.
 */
export interface UIComposerResult {
  /** Design tokens defining visual treatment */
  designTokens: DesignTokens;
  /** Ordered array of semantic blocks */
  blocks: SemanticBlock[];
  /** Brief explanation of design choices */
  rationale: string;
  /** Confidence score (0-1) for the layout */
  confidence: number;
}

// ============================================================================
// Schema
// ============================================================================

/**
 * Schema for AI-generated layout output.
 * Combines design tokens with semantic blocks.
 */
const UIComposerOutputSchema = z.object({
  designTokens: DesignTokenSchema,
  blocks: SemanticBlocksSchema,
  rationale: z
    .string()
    .describe('Brief explanation of design choices (1-2 sentences)'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence in layout appropriateness (0-1)'),
});

// ============================================================================
// System Prompt
// ============================================================================

/**
 * System prompt for the UI Composer agent.
 * Emphasizes story-driven design over template-based layouts.
 *
 * Token values available:
 * - layout: hero-gallery | split-image | masonry-grid | full-bleed | cards
 * - spacing: compact | comfortable | spacious
 * - typography.headingStyle: bold | elegant | industrial | warm
 * - typography.bodySize: sm | base | lg
 * - colors.accent: primary | earth | slate | copper | forest
 * - colors.background: light | warm | dark
 * - imageDisplay: rounded | sharp | shadowed | framed
 * - heroStyle: large-single | grid-3 | side-by-side | carousel
 */
const UI_COMPOSER_SYSTEM_PROMPT = `You are a portfolio layout designer for business projects.

Your job is to create unique, compelling layouts that tell each project's story visually.

DESIGN PHILOSOPHY:
- Let the project's character guide design choices
- A historic restoration feels different than modern construction
- Use the content to inform layout decisions
- Each portfolio should feel authentic, not templated

DESIGN TOKEN GUIDANCE:
- layout: hero-gallery (visual projects), split-image (detailed work), masonry-grid (many images)
- spacing: compact (dense info), comfortable (default), spacious (premium)
- typography.headingStyle: bold (dramatic), elegant (refined), industrial (technical), warm (friendly)
- typography.bodySize: sm (dense), base (standard), lg (accessible)
- colors.accent: primary (brand), earth (traditional masonry), slate (professional), copper (metallic warmth), forest (natural)
- colors.background: light (clean), warm (cozy cream tint), dark (dramatic)
- imageDisplay: rounded (approachable), sharp (precise), shadowed (depth), framed (gallery-like)
- heroStyle: large-single (one standout), grid-3 (multiple highlights), side-by-side (comparisons), carousel (many images)

SEMANTIC BLOCK TYPES:
- hero-section: Lead images with layout (large-single | grid | side-by-side), optional title/subtitle
- before-after: Transformation showcase with beforeImageId, afterImageId, optional caption
- paragraph: Body text (2-4 sentences max)
- heading: Section headers with level ('2' | '3')
- list: Bullet or numbered items (style: bullet | number)
- callout: Highlighted info (variant: info | tip | warning)
- stats: Key metrics as items array with {label, value}
- image-gallery: Additional photos with layout (grid-2 | grid-3 | masonry | carousel)
- testimonial: Customer quote with attribution
- feature-card: Highlight with icon, title, content, variant
- materials-list: Showcase materials with name and description
- process-step: Workflow step with stepNumber, title, content, optional imageId
- cta-section: Call-to-action with heading, body, buttonText, buttonAction
- divider: Visual separation (style: line | dots | space)

LAYOUT PRINCIPLES:
1. Start with strong visual (hero-section or before-after)
2. Tell the story (problem -> solution flow via paragraphs)
3. Provide specifics (stats, materials-list, techniques)
4. End with impact (proud moment callout or image-gallery)

If user provides feedback, adjust the layout accordingly while maintaining overall coherence.
Focus on requested areas while ensuring the whole layout still works together.`;

// ============================================================================
// Prompt Builder
// ============================================================================

/**
 * Build the user prompt from project state and options.
 * Structures data for optimal AI understanding.
 *
 * @param state - Current shared project state
 * @param options - Composition options including feedback
 * @returns Formatted prompt string
 */
function buildUIComposerPrompt(
  state: SharedProjectState,
  options: UIComposerOptions
): string {
  const sections: string[] = [];

  // Project data section
  sections.push('PROJECT DATA:');
  if (state.projectType) sections.push(`Type: ${state.projectType}`);
  if (state.title) sections.push(`Title: ${state.title}`);
  if (state.customerProblem) sections.push(`Problem: ${state.customerProblem}`);
  if (state.solutionApproach) sections.push(`Solution: ${state.solutionApproach}`);
  if (state.materials.length > 0) {
    sections.push(`Materials: ${state.materials.join(', ')}`);
  }
  if (state.techniques.length > 0) {
    sections.push(`Techniques: ${state.techniques.join(', ')}`);
  }
  if (state.duration) sections.push(`Duration: ${state.duration}`);
  if (state.proudOf) sections.push(`Proud of: ${state.proudOf}`);
  if (state.city && state.state) {
    sections.push(`Location: ${state.city}, ${state.state}`);
  } else if (state.location) {
    sections.push(`Location: ${state.location}`);
  }
  if (state.tags.length > 0) {
    sections.push(`Tags: ${state.tags.join(', ')}`);
  }

  // Images section - provide context for layout decisions
  if (state.images.length > 0) {
    sections.push('');
    sections.push(`IMAGES (${state.images.length} total):`);
    state.images.forEach((img) => {
      const typeLabel = img.imageType || 'untyped';
      const altLabel = img.altText ? ` - "${img.altText}"` : '';
      sections.push(`- ${img.id}: ${typeLabel}${altLabel}`);
    });

    // Provide image type summary for layout decisions
    const imageTypes = state.images.reduce(
      (acc, img) => {
        const type = img.imageType || 'other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    sections.push(`Image breakdown: ${JSON.stringify(imageTypes)}`);
  }

  // User feedback for iteration
  if (options.feedback) {
    sections.push('');
    sections.push(`USER FEEDBACK: ${options.feedback}`);
    sections.push('Adjust the layout based on this feedback while maintaining coherence.');
  }

  if (options.focusAreas && options.focusAreas.length > 0) {
    sections.push('');
    sections.push(`FOCUS AREAS: ${options.focusAreas.join(', ')}`);
    sections.push('Pay special attention to these areas when designing.');
  }

  if (options.preserveElements && options.preserveElements.length > 0) {
    sections.push('');
    sections.push(`PRESERVE THESE ELEMENTS: ${options.preserveElements.join(', ')}`);
    sections.push('Keep these elements largely unchanged.');
  }

  sections.push('');
  sections.push('Generate a portfolio layout with design tokens and semantic blocks.');
  sections.push('Return JSON matching the schema exactly.');

  return sections.join('\n');
}

// ============================================================================
// Fallback Layout
// ============================================================================

/**
 * Build a sensible fallback layout when AI is unavailable.
 * Creates a reasonable default based on available data.
 *
 * @param state - Current shared project state
 * @returns Fallback UIComposerResult
 */
function buildFallbackLayout(state: SharedProjectState): UIComposerResult {
  const blocks: SemanticBlock[] = [];

  // Determine image layout based on what's available
  const hasBeforeAfter =
    state.images.some((img) => img.imageType === 'before') &&
    state.images.some((img) => img.imageType === 'after');

  // Hero or before-after section
  if (hasBeforeAfter) {
    const beforeImg = state.images.find((img) => img.imageType === 'before');
    const afterImg = state.images.find((img) => img.imageType === 'after');
    if (beforeImg && afterImg) {
      blocks.push({
        type: 'before-after',
        beforeImageId: beforeImg.id,
        afterImageId: afterImg.id,
        caption: state.title,
      });
    }
  } else if (state.images.length > 0) {
    // Use available images for hero section
    // Layout options: 'large-single' | 'grid' | 'side-by-side'
    const heroImages = state.images.slice(0, 3);
    const heroLayout =
      heroImages.length >= 3 ? 'grid' : heroImages.length === 2 ? 'side-by-side' : 'large-single';
    blocks.push({
      type: 'hero-section',
      imageIds: heroImages.map((img) => img.id),
      layout: heroLayout,
      title: state.title,
    });
  }

  // Problem/solution paragraphs
  if (state.customerProblem) {
    blocks.push({
      type: 'paragraph',
      text: state.customerProblem,
    });
  }
  if (state.solutionApproach) {
    blocks.push({
      type: 'paragraph',
      text: state.solutionApproach,
    });
  }

  // Stats section
  const statsItems: Array<{ label: string; value: string }> = [];
  if (state.duration) {
    statsItems.push({ label: 'Timeline', value: state.duration });
  }
  if (state.materials.length > 0) {
    statsItems.push({
      label: 'Materials',
      value: String(state.materials.length),
    });
  }
  if (state.city && state.state) {
    statsItems.push({
      label: 'Location',
      value: `${state.city}, ${state.state}`,
    });
  }
  if (statsItems.length > 0) {
    blocks.push({
      type: 'stats',
      items: statsItems,
    });
  }

  // Materials and techniques list
  const craftDetails = [...state.materials, ...state.techniques];
  if (craftDetails.length > 0) {
    blocks.push({
      type: 'list',
      style: 'bullet',
      items: craftDetails.slice(0, 8), // Limit to 8 items
    });
  }

  // Proud of callout
  if (state.proudOf) {
    blocks.push({
      type: 'callout',
      variant: 'tip',
      title: 'Craftsmanship Highlight',
      text: state.proudOf,
    });
  }

  // Remaining images as gallery
  const usedImageIds = new Set(
    blocks.flatMap((block) => {
      if (block.type === 'hero-section') return block.imageIds;
      if (block.type === 'before-after') {
        return [block.beforeImageId, block.afterImageId];
      }
      return [];
    })
  );
  const remainingImages = state.images.filter(
    (img) => !usedImageIds.has(img.id)
  );
  if (remainingImages.length > 0) {
    // Layout options: 'grid-2' | 'grid-3' | 'masonry' | 'carousel'
    const galleryLayout = remainingImages.length <= 2 ? 'grid-2' : 'grid-3';
    blocks.push({
      type: 'image-gallery',
      imageIds: remainingImages.map((img) => img.id),
      layout: galleryLayout,
    });
  }

  return {
    designTokens: {
      layout: 'hero-gallery',
      spacing: 'comfortable',
      typography: {
        headingStyle: 'bold',
        bodySize: 'base',
      },
      colors: {
        accent: 'primary',
        background: 'light',
      },
      imageDisplay: 'rounded',
      // HeroStyle options: 'large-single' | 'grid-3' | 'side-by-side' | 'carousel'
      heroStyle: hasBeforeAfter ? 'side-by-side' : 'large-single',
    },
    blocks,
    rationale: 'Fallback layout - AI unavailable',
    confidence: 0.3,
  };
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Compose a portfolio UI layout from project state.
 *
 * Uses AI to generate design tokens and semantic blocks that
 * best represent the project's story visually.
 *
 * @param state - Current shared project state with extracted story data
 * @param options - Optional composition parameters for iteration
 * @returns UIComposerResult with design tokens, blocks, and metadata
 *
 * @example
 * ```typescript
 * const result = await composeUI(projectState);
 * // result.designTokens -> { layout: 'hero-gallery', ... }
 * // result.blocks -> [{ type: 'hero-section', ... }, ...]
 * ```
 *
 * @example With feedback iteration
 * ```typescript
 * const refined = await composeUI(projectState, {
 *   feedback: 'Make the hero section larger',
 *   preserveElements: ['stats'],
 * });
 * ```
 */
export async function composeUI(
  state: SharedProjectState,
  options: UIComposerOptions = {}
): Promise<UIComposerResult> {
  // Return fallback when AI is unavailable
  if (!isGoogleAIEnabled()) {
    logger.warn('[UIComposer] Google AI not enabled, using fallback layout');
    return buildFallbackLayout(state);
  }

  try {
    const { object } = await withCircuitBreaker('ui-composer', async () => {
      return generateObject({
        model: getGenerationModel(),
        schema: UIComposerOutputSchema,
        system: UI_COMPOSER_SYSTEM_PROMPT,
        prompt: buildUIComposerPrompt(state, options),
        maxOutputTokens: OUTPUT_LIMITS.contentGeneration,
        temperature: 0.7, // Higher temperature for creative layout decisions
      });
    });

    // Validate that returned imageIds reference actual images
    const validImageIds = new Set(state.images.map((img) => img.id));
    const validatedBlocks = object.blocks.map((block) => {
      if (block.type === 'hero-section') {
        const filteredIds = block.imageIds.filter((id) => validImageIds.has(id));
        // Must have at least 1 image to keep hero-section
        if (filteredIds.length === 0) return null;
        return {
          ...block,
          imageIds: filteredIds,
        };
      }
      if (block.type === 'image-gallery') {
        const filteredIds = block.imageIds.filter((id) => validImageIds.has(id));
        // Must have at least 1 image to keep gallery
        if (filteredIds.length === 0) return null;
        return {
          ...block,
          imageIds: filteredIds,
        };
      }
      if (block.type === 'before-after') {
        // If either image is invalid, skip this block
        if (
          !validImageIds.has(block.beforeImageId) ||
          !validImageIds.has(block.afterImageId)
        ) {
          return null;
        }
      }
      if (block.type === 'testimonial' && block.imageId) {
        // If testimonial has invalid image, remove the image but keep the quote
        if (!validImageIds.has(block.imageId)) {
          return { ...block, imageId: undefined };
        }
      }
      if (block.type === 'process-step' && block.imageId) {
        // If process-step has invalid image, remove the image but keep the step
        if (!validImageIds.has(block.imageId)) {
          return { ...block, imageId: undefined };
        }
      }
      return block;
    }).filter((block): block is SemanticBlock => block !== null);

    return {
      designTokens: object.designTokens,
      blocks: validatedBlocks,
      rationale: object.rationale,
      confidence: object.confidence,
    };
  } catch (error) {
    logger.error('[UIComposer] Error composing layout', { error });
    return buildFallbackLayout(state);
  }
}
