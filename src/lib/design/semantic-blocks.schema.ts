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

const paragraphBlock = z.object({
  type: z.literal('paragraph'),
  text: textSchema,
});

export type ParagraphBlock = z.infer<typeof paragraphBlock>;

const headingBlock = z.object({
  type: z.literal('heading'),
  level: z.enum(['2', '3']),
  text: textSchema,
});

export type HeadingBlock = z.infer<typeof headingBlock>;

const listBlock = z.object({
  type: z.literal('list'),
  style: z.enum(['bullet', 'number']),
  items: z.array(textSchema).max(MAX_LIST_ITEMS),
});

export type ListBlock = z.infer<typeof listBlock>;

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

const heroSectionBlock = z.object({
  type: z.literal('hero-section'),
  imageIds: z.array(imageIdSchema).min(1).max(5),
  layout: z.enum(['large-single', 'grid', 'side-by-side']),
  title: shortTextSchema.optional(),
  subtitle: shortTextSchema.optional(),
});

export type HeroSectionBlock = z.infer<typeof heroSectionBlock>;

const beforeAfterBlock = z.object({
  type: z.literal('before-after'),
  beforeImageId: imageIdSchema,
  afterImageId: imageIdSchema,
  caption: shortTextSchema.optional(),
});

export type BeforeAfterBlock = z.infer<typeof beforeAfterBlock>;

const featureCardBlock = z.object({
  type: z.literal('feature-card'),
  icon: z.string().trim().max(50).optional(),
  title: shortTextSchema,
  content: textSchema,
  variant: z.enum(['default', 'highlight', 'subtle']),
});

export type FeatureCardBlock = z.infer<typeof featureCardBlock>;

const imageGalleryBlock = z.object({
  type: z.literal('image-gallery'),
  imageIds: z.array(imageIdSchema).min(1).max(MAX_GALLERY_IMAGES),
  layout: z.enum(['grid-2', 'grid-3', 'masonry', 'carousel']),
  captions: z.record(z.string(), shortTextSchema).optional(),
});

export type ImageGalleryBlock = z.infer<typeof imageGalleryBlock>;

const testimonialBlock = z.object({
  type: z.literal('testimonial'),
  quote: textSchema,
  attribution: shortTextSchema.optional(),
  imageId: imageIdSchema.optional(),
});

export type TestimonialBlock = z.infer<typeof testimonialBlock>;

const ctaSectionBlock = z.object({
  type: z.literal('cta-section'),
  heading: shortTextSchema,
  body: textSchema.optional(),
  buttonText: shortTextSchema,
  buttonAction: z.enum(['contact', 'view-more', 'share']),
});

export type CtaSectionBlock = z.infer<typeof ctaSectionBlock>;

const statsBlock = z.object({
  type: z.literal('stats'),
  items: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        value: z.string().trim().min(1).max(60),
      })
    )
    .min(1)
    .max(MAX_STATS),
});

export type StatsBlock = z.infer<typeof statsBlock>;

const processStepBlock = z.object({
  type: z.literal('process-step'),
  stepNumber: z.number().int().min(1).max(20),
  title: shortTextSchema,
  content: textSchema,
  imageId: imageIdSchema.optional(),
});

export type ProcessStepBlock = z.infer<typeof processStepBlock>;

const materialsListBlock = z.object({
  type: z.literal('materials-list'),
  title: shortTextSchema.optional(),
  items: z
    .array(
      z.object({
        name: shortTextSchema,
        description: shortTextSchema.optional(),
      })
    )
    .min(1)
    .max(MAX_LIST_ITEMS),
});

export type MaterialsListBlock = z.infer<typeof materialsListBlock>;

const dividerBlock = z.object({
  type: z.literal('divider'),
  style: z.enum(['line', 'dots', 'space']).default('line'),
});

export type DividerBlock = z.infer<typeof dividerBlock>;

// =============================================================================
// Combined Schema
// =============================================================================

export const SemanticBlockSchema = z.discriminatedUnion('type', [
  paragraphBlock,
  headingBlock,
  listBlock,
  calloutBlock,
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

export const SemanticBlocksSchema = z.array(SemanticBlockSchema).max(MAX_BLOCKS);

export type SemanticBlocks = z.infer<typeof SemanticBlocksSchema>;
