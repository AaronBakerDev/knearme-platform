/**
 * Design System - Agentic UI Foundation
 *
 * This module provides the design token schemas and semantic block types
 * that power the AI-generated portfolio layouts.
 *
 * @module design
 *
 * @example
 * ```typescript
 * import {
 *   DesignTokenSchema,
 *   tokensToClasses,
 *   SemanticBlocksSchema,
 *   sanitizeSemanticBlocks,
 * } from '@/lib/design';
 *
 * // Parse AI-generated tokens
 * const tokens = DesignTokenSchema.parse(aiResponse.tokens);
 * const classes = tokensToClasses(tokens);
 *
 * // Parse AI-generated blocks
 * const blocks = sanitizeSemanticBlocks(aiResponse.blocks);
 * ```
 */

// Design Tokens
export {
  // Schemas
  LayoutStyleSchema,
  SpacingSchema,
  HeadingStyleSchema,
  BodySizeSchema,
  TypographySchema,
  AccentColorSchema,
  BackgroundColorSchema,
  ColorSchema,
  ImageDisplaySchema,
  HeroStyleSchema,
  DesignTokenSchema,
  // Types
  type LayoutStyle,
  type Spacing,
  type HeadingStyle,
  type BodySize,
  type Typography,
  type AccentColor,
  type BackgroundColor,
  type Colors,
  type ImageDisplay,
  type HeroStyle,
  type DesignTokens,
  type ResolvedClasses,
  // Functions
  tokensToClasses,
  mergeWithDefaults,
  parseDesignTokens,
  // Constants
  DEFAULT_DESIGN_TOKENS,
} from './tokens';

// Semantic Blocks
export {
  // Schemas
  SemanticBlockSchema,
  SemanticBlocksSchema,
  // Types
  type SemanticBlock,
  type SemanticBlocks,
  type ParagraphBlock,
  type HeadingBlock,
  type ListBlock,
  type CalloutBlock,
  type HeroSectionBlock,
  type BeforeAfterBlock,
  type FeatureCardBlock,
  type ImageGalleryBlock,
  type TestimonialBlock,
  type CtaSectionBlock,
  type StatsBlock,
  type ProcessStepBlock,
  type MaterialsListBlock,
  type DividerBlock,
  // Type Guards
  isTextBlock,
  isImageBlock,
  isActionBlock,
  // Functions
  extractImageIds,
  sanitizeSemanticBlocks,
  semanticBlocksToPlainText,
  countBlocksByType,
} from './semantic-blocks';
