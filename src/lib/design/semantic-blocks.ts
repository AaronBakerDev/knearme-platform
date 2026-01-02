import { z } from 'zod';

/**
 * Semantic blocks for the agentic UI system.
 *
 * These blocks extend the existing description blocks with layout-aware
 * semantic components. AI agents generate these blocks, which are then
 * rendered by React components that respect the design tokens.
 *
 * @see /src/lib/content/description-blocks.ts - Original text-only blocks
 * @see /src/lib/design/tokens.ts - Design tokens for styling
 * @see /docs/03-architecture/agentic-ui.md - Architecture documentation
 */

// =============================================================================
// Constants
// =============================================================================

const MAX_TEXT_LENGTH = 2000;
const MAX_LIST_ITEMS = 20;
const MAX_BLOCKS = 50;
const MAX_STATS = 8;
const MAX_GALLERY_IMAGES = 20;

const textSchema = z.string().trim().min(1).max(MAX_TEXT_LENGTH);
const shortTextSchema = z.string().trim().min(1).max(200);
const imageIdSchema = z.string().trim().min(1).max(100);

// =============================================================================
// Text Content Blocks (from description-blocks.ts)
// =============================================================================

/**
 * Standard paragraph block for body text.
 */
const paragraphBlock = z.object({
  type: z.literal('paragraph'),
  text: textSchema,
});

export type ParagraphBlock = z.infer<typeof paragraphBlock>;

/**
 * Heading block for section titles.
 * Levels are strings for Gemini API compatibility.
 *
 * @see /src/lib/content/description-blocks.ts for level handling notes
 */
const headingBlock = z.object({
  type: z.literal('heading'),
  level: z.enum(['2', '3']),
  text: textSchema,
});

export type HeadingBlock = z.infer<typeof headingBlock>;

/**
 * List block for bullet or numbered lists.
 */
const listBlock = z.object({
  type: z.literal('list'),
  style: z.enum(['bullet', 'number']),
  items: z.array(textSchema).max(MAX_LIST_ITEMS),
});

export type ListBlock = z.infer<typeof listBlock>;

/**
 * Callout block for tips, warnings, or highlighted information.
 */
const calloutBlock = z.object({
  type: z.literal('callout'),
  variant: z.enum(['info', 'tip', 'warning']),
  title: z.string().trim().max(120).optional(),
  text: textSchema,
});

export type CalloutBlock = z.infer<typeof calloutBlock>;

// =============================================================================
// Layout-Aware Blocks (New for Agentic UI)
// =============================================================================

/**
 * Hero section block for prominent image display at the top of a page.
 * References images by ID for decoupled rendering.
 *
 * @example
 * ```typescript
 * const hero: HeroSectionBlock = {
 *   type: 'hero-section',
 *   imageIds: ['img-001', 'img-002', 'img-003'],
 *   layout: 'grid',
 *   title: 'Historic Brick Chimney Restoration',
 *   subtitle: 'Denver, Colorado',
 * };
 * ```
 */
const heroSectionBlock = z.object({
  type: z.literal('hero-section'),
  /** Array of image IDs to display in the hero */
  imageIds: z.array(imageIdSchema).min(1).max(5),
  /** How to arrange the hero images */
  layout: z.enum(['large-single', 'grid', 'side-by-side']),
  /** Optional main title overlaid on hero */
  title: shortTextSchema.optional(),
  /** Optional subtitle (e.g., location, date) */
  subtitle: shortTextSchema.optional(),
});

export type HeroSectionBlock = z.infer<typeof heroSectionBlock>;

/**
 * Before/after comparison block for transformation showcases.
 * Essential for contractor portfolio projects.
 *
 * @example
 * ```typescript
 * const comparison: BeforeAfterBlock = {
 *   type: 'before-after',
 *   beforeImageId: 'img-before-001',
 *   afterImageId: 'img-after-001',
 *   caption: 'Chimney restoration after 50 years of weather damage',
 * };
 * ```
 */
const beforeAfterBlock = z.object({
  type: z.literal('before-after'),
  /** ID of the "before" state image */
  beforeImageId: imageIdSchema,
  /** ID of the "after" state image */
  afterImageId: imageIdSchema,
  /** Optional caption explaining the transformation */
  caption: shortTextSchema.optional(),
});

export type BeforeAfterBlock = z.infer<typeof beforeAfterBlock>;

/**
 * Feature card block for highlighting key project attributes.
 * Used for materials, techniques, or key selling points.
 *
 * @example
 * ```typescript
 * const feature: FeatureCardBlock = {
 *   type: 'feature-card',
 *   icon: 'brick',
 *   title: 'Reclaimed Historic Brick',
 *   content: 'Sourced matching 1920s brick from a local architectural salvage yard.',
 *   variant: 'highlight',
 * };
 * ```
 */
const featureCardBlock = z.object({
  type: z.literal('feature-card'),
  /** Optional icon identifier (e.g., 'brick', 'tools', 'clock') */
  icon: z.string().trim().max(50).optional(),
  /** Card title */
  title: shortTextSchema,
  /** Card body content */
  content: textSchema,
  /** Visual emphasis level */
  variant: z.enum(['default', 'highlight', 'subtle']),
});

export type FeatureCardBlock = z.infer<typeof featureCardBlock>;

/**
 * Image gallery block for displaying multiple project images.
 * Supports various grid layouts.
 *
 * @example
 * ```typescript
 * const gallery: ImageGalleryBlock = {
 *   type: 'image-gallery',
 *   imageIds: ['img-001', 'img-002', 'img-003', 'img-004'],
 *   layout: 'grid-2',
 *   captions: {
 *     'img-001': 'Initial assessment',
 *     'img-002': 'Mortar removal in progress',
 *   },
 * };
 * ```
 */
const imageGalleryBlock = z.object({
  type: z.literal('image-gallery'),
  /** Array of image IDs to display */
  imageIds: z.array(imageIdSchema).min(1).max(MAX_GALLERY_IMAGES),
  /** Grid layout style */
  layout: z.enum(['grid-2', 'grid-3', 'masonry', 'carousel']),
  /** Optional captions keyed by image ID */
  captions: z.record(z.string(), shortTextSchema).optional(),
});

export type ImageGalleryBlock = z.infer<typeof imageGalleryBlock>;

/**
 * Testimonial/quote block with optional attribution and image.
 * For customer quotes or contractor reflections.
 *
 * @example
 * ```typescript
 * const testimonial: TestimonialBlock = {
 *   type: 'testimonial',
 *   quote: 'The attention to detail was incredible. Our chimney looks better than when the house was built.',
 *   attribution: 'Sarah M., Denver',
 *   imageId: 'customer-photo-001',
 * };
 * ```
 */
const testimonialBlock = z.object({
  type: z.literal('testimonial'),
  /** The quote text */
  quote: textSchema,
  /** Who said it (name, location) */
  attribution: shortTextSchema.optional(),
  /** Optional image (customer photo, property photo) */
  imageId: imageIdSchema.optional(),
});

export type TestimonialBlock = z.infer<typeof testimonialBlock>;

/**
 * Call-to-action section block for conversion elements.
 *
 * @example
 * ```typescript
 * const cta: CtaSectionBlock = {
 *   type: 'cta-section',
 *   heading: 'Ready to restore your chimney?',
 *   body: 'Contact us for a free inspection and estimate.',
 *   buttonText: 'Get a Free Quote',
 *   buttonAction: 'contact',
 * };
 * ```
 */
const ctaSectionBlock = z.object({
  type: z.literal('cta-section'),
  /** Main CTA heading */
  heading: shortTextSchema,
  /** Optional supporting text */
  body: textSchema.optional(),
  /** Button label */
  buttonText: shortTextSchema,
  /** Action type for button behavior */
  buttonAction: z.enum(['contact', 'view-more', 'share']),
});

export type CtaSectionBlock = z.infer<typeof ctaSectionBlock>;

/**
 * Statistics block for displaying key metrics.
 * Shows project numbers, dimensions, or achievements.
 *
 * @example
 * ```typescript
 * const stats: StatsBlock = {
 *   type: 'stats',
 *   items: [
 *     { label: 'Project Duration', value: '3 weeks' },
 *     { label: 'Bricks Replaced', value: '1,200+' },
 *     { label: 'Year Built', value: '1922' },
 *   ],
 * };
 * ```
 */
const statsBlock = z.object({
  type: z.literal('stats'),
  items: z.array(
    z.object({
      /** Metric label */
      label: z.string().trim().min(1).max(80),
      /** Metric value (as string for flexibility) */
      value: z.string().trim().min(1).max(60),
    })
  ).min(1).max(MAX_STATS),
});

export type StatsBlock = z.infer<typeof statsBlock>;

/**
 * Process step block for showing workflow or project phases.
 * Useful for explaining contractor methodology.
 *
 * @example
 * ```typescript
 * const process: ProcessStepBlock = {
 *   type: 'process-step',
 *   stepNumber: 1,
 *   title: 'Initial Inspection',
 *   content: 'We carefully assess the existing structure...',
 *   imageId: 'process-step-1',
 * };
 * ```
 */
const processStepBlock = z.object({
  type: z.literal('process-step'),
  /** Step number in sequence */
  stepNumber: z.number().int().min(1).max(20),
  /** Step title */
  title: shortTextSchema,
  /** Step description */
  content: textSchema,
  /** Optional image showing this step */
  imageId: imageIdSchema.optional(),
});

export type ProcessStepBlock = z.infer<typeof processStepBlock>;

/**
 * Materials list block for showcasing project materials.
 * Helps with SEO and demonstrates expertise.
 *
 * @example
 * ```typescript
 * const materials: MaterialsListBlock = {
 *   type: 'materials-list',
 *   title: 'Materials Used',
 *   items: [
 *     { name: 'Type S Mortar', description: 'High-strength for structural applications' },
 *     { name: 'Reclaimed Brick', description: 'Matched to original 1920s style' },
 *   ],
 * };
 * ```
 */
const materialsListBlock = z.object({
  type: z.literal('materials-list'),
  /** Section title */
  title: shortTextSchema.optional(),
  /** List of materials */
  items: z.array(
    z.object({
      /** Material name */
      name: shortTextSchema,
      /** Optional description or specification */
      description: shortTextSchema.optional(),
    })
  ).min(1).max(MAX_LIST_ITEMS),
});

export type MaterialsListBlock = z.infer<typeof materialsListBlock>;

/**
 * Divider block for visual separation.
 */
const dividerBlock = z.object({
  type: z.literal('divider'),
  /** Divider style */
  style: z.enum(['line', 'dots', 'space']).default('line'),
});

export type DividerBlock = z.infer<typeof dividerBlock>;

// =============================================================================
// Combined Schema
// =============================================================================

/**
 * Discriminated union of all semantic block types.
 * Use this schema for parsing AI-generated block arrays.
 */
export const SemanticBlockSchema = z.discriminatedUnion('type', [
  // Text content blocks
  paragraphBlock,
  headingBlock,
  listBlock,
  calloutBlock,
  // Layout-aware blocks
  heroSectionBlock,
  beforeAfterBlock,
  featureCardBlock,
  imageGalleryBlock,
  testimonialBlock,
  ctaSectionBlock,
  statsBlock,
  processStepBlock,
  materialsListBlock,
  dividerBlock,
]);

export type SemanticBlock = z.infer<typeof SemanticBlockSchema>;

/**
 * Schema for an array of semantic blocks.
 */
export const SemanticBlocksSchema = z.array(SemanticBlockSchema).max(MAX_BLOCKS);

export type SemanticBlocks = z.infer<typeof SemanticBlocksSchema>;

// =============================================================================
// Block Type Guards
// =============================================================================

/**
 * Type guard for text-only blocks (no images).
 */
export function isTextBlock(
  block: SemanticBlock
): block is ParagraphBlock | HeadingBlock | ListBlock | CalloutBlock {
  return ['paragraph', 'heading', 'list', 'callout'].includes(block.type);
}

/**
 * Type guard for blocks that contain image references.
 */
export function isImageBlock(
  block: SemanticBlock
): block is HeroSectionBlock | BeforeAfterBlock | ImageGalleryBlock | TestimonialBlock | ProcessStepBlock {
  return ['hero-section', 'before-after', 'image-gallery', 'testimonial', 'process-step'].includes(block.type);
}

/**
 * Type guard for interactive/action blocks.
 */
export function isActionBlock(
  block: SemanticBlock
): block is CtaSectionBlock {
  return block.type === 'cta-section';
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Extracts all image IDs referenced in a block array.
 * Useful for prefetching or validating image availability.
 *
 * @param blocks - Array of semantic blocks
 * @returns Array of unique image IDs
 */
export function extractImageIds(blocks: SemanticBlock[]): string[] {
  const ids = new Set<string>();

  for (const block of blocks) {
    switch (block.type) {
      case 'hero-section':
        block.imageIds.forEach((id) => ids.add(id));
        break;
      case 'before-after':
        ids.add(block.beforeImageId);
        ids.add(block.afterImageId);
        break;
      case 'image-gallery':
        block.imageIds.forEach((id) => ids.add(id));
        break;
      case 'testimonial':
        if (block.imageId) ids.add(block.imageId);
        break;
      case 'process-step':
        if (block.imageId) ids.add(block.imageId);
        break;
    }
  }

  return Array.from(ids);
}

/**
 * Normalizes whitespace in text fields.
 */
function normalizeText(text: string | undefined | null): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Sanitizes and validates semantic blocks from unknown input.
 * Returns an empty array if parsing fails completely.
 *
 * @param input - Unknown input to parse as semantic blocks
 * @returns Array of validated semantic blocks
 */
export function sanitizeSemanticBlocks(input: unknown): SemanticBlock[] {
  if (!Array.isArray(input)) return [];

  const result: SemanticBlock[] = [];

  for (const item of input) {
    const parsed = SemanticBlockSchema.safeParse(item);
    if (parsed.success) {
      // Normalize text fields
      const block = parsed.data;
      switch (block.type) {
        case 'paragraph':
          result.push({ ...block, text: normalizeText(block.text) });
          break;
        case 'heading':
          result.push({ ...block, text: normalizeText(block.text) });
          break;
        case 'callout':
          result.push({
            ...block,
            text: normalizeText(block.text),
            title: block.title ? normalizeText(block.title) : undefined,
          });
          break;
        case 'feature-card':
          result.push({
            ...block,
            title: normalizeText(block.title),
            content: normalizeText(block.content),
          });
          break;
        case 'testimonial':
          result.push({
            ...block,
            quote: normalizeText(block.quote),
            attribution: block.attribution ? normalizeText(block.attribution) : undefined,
          });
          break;
        case 'cta-section':
          result.push({
            ...block,
            heading: normalizeText(block.heading),
            body: block.body ? normalizeText(block.body) : undefined,
            buttonText: normalizeText(block.buttonText),
          });
          break;
        case 'process-step':
          result.push({
            ...block,
            title: normalizeText(block.title),
            content: normalizeText(block.content),
          });
          break;
        default:
          result.push(block);
      }
    }
  }

  return result;
}

/**
 * Converts semantic blocks to plain text for SEO/search indexing.
 *
 * @param blocks - Array of semantic blocks
 * @returns Plain text representation
 */
export function semanticBlocksToPlainText(blocks: SemanticBlock[]): string {
  const parts: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
      case 'heading':
        parts.push(block.text);
        break;
      case 'list':
        parts.push(block.items.join('\n'));
        break;
      case 'callout':
        parts.push(`${block.title ? `${block.title}: ` : ''}${block.text}`);
        break;
      case 'hero-section':
        if (block.title) parts.push(block.title);
        if (block.subtitle) parts.push(block.subtitle);
        break;
      case 'before-after':
        if (block.caption) parts.push(block.caption);
        break;
      case 'feature-card':
        parts.push(`${block.title}: ${block.content}`);
        break;
      case 'testimonial':
        parts.push(block.quote);
        if (block.attribution) parts.push(`- ${block.attribution}`);
        break;
      case 'cta-section':
        parts.push(block.heading);
        if (block.body) parts.push(block.body);
        break;
      case 'stats':
        parts.push(block.items.map((item) => `${item.label}: ${item.value}`).join('\n'));
        break;
      case 'process-step':
        parts.push(`${block.stepNumber}. ${block.title}: ${block.content}`);
        break;
      case 'materials-list':
        if (block.title) parts.push(block.title);
        parts.push(block.items.map((item) =>
          item.description ? `${item.name} - ${item.description}` : item.name
        ).join('\n'));
        break;
      // Skip image-gallery and divider - no text content
    }
  }

  return parts.join('\n\n').trim();
}

/**
 * Counts blocks by type for analytics.
 *
 * @param blocks - Array of semantic blocks
 * @returns Record of block type to count
 */
export function countBlocksByType(blocks: SemanticBlock[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const block of blocks) {
    counts[block.type] = (counts[block.type] || 0) + 1;
  }

  return counts;
}
