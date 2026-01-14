import { z } from 'zod';

/**
 * Design tokens for the agentic UI system.
 *
 * These tokens define the visual language that AI agents can choose from
 * when generating portfolio layouts. Each token maps to specific Tailwind
 * CSS classes via the `tokensToClasses` function.
 *
 * @see tokensToClasses - Converts tokens to Tailwind class strings
 * @see /docs/03-architecture/agentic-ui.md - Architecture documentation
 */

// =============================================================================
// Layout Tokens
// =============================================================================

/**
 * Layout style options for project pages.
 * Determines the overall structure and arrangement of content sections.
 */
export const LayoutStyleSchema = z.enum([
  'hero-gallery',   // Large hero image + gallery grid below
  'split-image',    // Images on one side, content on the other
  'masonry-grid',   // Pinterest-style staggered grid
  'full-bleed',     // Full-width edge-to-edge images
  'cards',          // Card-based sections with contained images
]);

export type LayoutStyle = z.infer<typeof LayoutStyleSchema>;

// =============================================================================
// Spacing Tokens
// =============================================================================

/**
 * Spacing density options.
 * Controls vertical rhythm and whitespace between sections.
 */
export const SpacingSchema = z.enum([
  'compact',      // Tight spacing, dense information display
  'comfortable',  // Balanced spacing, default choice
  'spacious',     // Generous whitespace, premium feel
]);

export type Spacing = z.infer<typeof SpacingSchema>;

// =============================================================================
// Typography Tokens
// =============================================================================

/**
 * Heading style options.
 * Sets the typographic personality of headings.
 */
export const HeadingStyleSchema = z.enum([
  'bold',       // Strong, impactful headings (sans-serif, heavy weight)
  'elegant',    // Refined, sophisticated (serif, light weight)
  'industrial', // Utilitarian, technical (mono, uppercase)
  'warm',       // Friendly, approachable (medium weight, normal case)
]);

export type HeadingStyle = z.infer<typeof HeadingStyleSchema>;

/**
 * Body text size options.
 * Controls readability and text density.
 */
export const BodySizeSchema = z.enum([
  'sm',    // Compact text (14px)
  'base',  // Standard size (16px)
  'lg',    // Large, easy to read (18px)
]);

export type BodySize = z.infer<typeof BodySizeSchema>;

/**
 * Combined typography settings.
 */
export const TypographySchema = z.object({
  headingStyle: HeadingStyleSchema,
  bodySize: BodySizeSchema,
});

export type Typography = z.infer<typeof TypographySchema>;

// =============================================================================
// Color Tokens
// =============================================================================

/**
 * Accent color palettes.
 * Used for interactive elements, highlights, and brand expression.
 */
export const AccentColorSchema = z.enum([
  'primary',  // Default brand blue
  'earth',    // Warm terracotta/brick tones (masonry-appropriate)
  'slate',    // Cool professional gray-blue
  'copper',   // Metallic warm accent
  'forest',   // Natural green tones
]);

export type AccentColor = z.infer<typeof AccentColorSchema>;

/**
 * Background color modes.
 * Sets the overall page tone.
 */
export const BackgroundColorSchema = z.enum([
  'light',  // Clean white background
  'warm',   // Slight cream/beige tint
  'dark',   // Dark mode with light text
]);

export type BackgroundColor = z.infer<typeof BackgroundColorSchema>;

/**
 * Combined color settings.
 */
export const ColorSchema = z.object({
  accent: AccentColorSchema,
  background: BackgroundColorSchema,
});

export type Colors = z.infer<typeof ColorSchema>;

// =============================================================================
// Image Display Tokens
// =============================================================================

/**
 * Image display style options.
 * Controls how images are visually presented.
 */
export const ImageDisplaySchema = z.enum([
  'rounded',   // Soft rounded corners
  'sharp',     // No border radius, crisp edges
  'shadowed',  // Subtle drop shadow for depth
  'framed',    // Border/frame effect
]);

export type ImageDisplay = z.infer<typeof ImageDisplaySchema>;

// =============================================================================
// Hero Section Tokens
// =============================================================================

/**
 * Hero section layout options.
 * Determines how the main hero images are displayed.
 */
export const HeroStyleSchema = z.enum([
  'large-single',   // Single dominant image
  'grid-3',         // 3-image grid layout
  'side-by-side',   // Two images side by side
  'carousel',       // Swipeable image carousel
]);

export type HeroStyle = z.infer<typeof HeroStyleSchema>;

// =============================================================================
// Complete Design Token Schema
// =============================================================================

/**
 * Complete design tokens for a project page.
 * AI agents select values for each token based on project characteristics,
 * image analysis, and contractor preferences.
 *
 * @example
 * ```typescript
 * const tokens: DesignTokens = {
 *   layout: 'hero-gallery',
 *   spacing: 'comfortable',
 *   typography: { headingStyle: 'bold', bodySize: 'base' },
 *   colors: { accent: 'earth', background: 'light' },
 *   imageDisplay: 'rounded',
 *   heroStyle: 'large-single',
 * };
 * ```
 */
export const DesignTokenSchema = z.object({
  layout: LayoutStyleSchema,
  spacing: SpacingSchema,
  typography: TypographySchema,
  colors: ColorSchema,
  imageDisplay: ImageDisplaySchema,
  heroStyle: HeroStyleSchema,
});

export type DesignTokens = z.infer<typeof DesignTokenSchema>;

// =============================================================================
// Default Tokens
// =============================================================================

/**
 * Default design tokens used when AI doesn't specify values.
 * Provides a safe, professional baseline.
 */
export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
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
  heroStyle: 'large-single',
};

// =============================================================================
// Tailwind Class Mappings
// =============================================================================

/**
 * Maps spacing tokens to Tailwind classes.
 */
const SPACING_CLASSES = {
  compact: {
    container: 'space-y-4',
    section: 'py-4',
    gap: 'gap-3',
  },
  comfortable: {
    container: 'space-y-8',
    section: 'py-8',
    gap: 'gap-6',
  },
  spacious: {
    container: 'space-y-12',
    section: 'py-12',
    gap: 'gap-8',
  },
} as const;

/**
 * Maps heading style tokens to Tailwind classes.
 */
const HEADING_CLASSES = {
  bold: 'font-bold tracking-tight',
  elegant: 'font-serif font-light tracking-wide',
  industrial: 'font-mono uppercase tracking-widest text-sm',
  warm: 'font-medium tracking-normal',
} as const;

/**
 * Maps body size tokens to Tailwind classes.
 */
const BODY_SIZE_CLASSES = {
  sm: 'text-sm leading-relaxed',
  base: 'text-base leading-relaxed',
  lg: 'text-lg leading-loose',
} as const;

/**
 * Maps accent color tokens to Tailwind color classes.
 * Uses CSS custom properties for theme consistency.
 */
const ACCENT_CLASSES = {
  primary: {
    text: 'text-primary',
    bg: 'bg-primary',
    border: 'border-primary',
    hover: 'hover:bg-primary/90',
  },
  earth: {
    text: 'text-amber-700 dark:text-amber-500',
    bg: 'bg-amber-600',
    border: 'border-amber-600',
    hover: 'hover:bg-amber-700',
  },
  slate: {
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-600',
    border: 'border-slate-500',
    hover: 'hover:bg-slate-700',
  },
  copper: {
    text: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-600',
    border: 'border-orange-600',
    hover: 'hover:bg-orange-700',
  },
  forest: {
    text: 'text-emerald-700 dark:text-emerald-500',
    bg: 'bg-emerald-600',
    border: 'border-emerald-600',
    hover: 'hover:bg-emerald-700',
  },
} as const;

/**
 * Maps background color tokens to Tailwind classes.
 */
const BACKGROUND_CLASSES = {
  light: {
    page: 'bg-white',
    card: 'bg-gray-50',
    text: 'text-gray-900',
    muted: 'text-gray-600',
  },
  warm: {
    page: 'bg-amber-50/50',
    card: 'bg-white',
    text: 'text-gray-900',
    muted: 'text-gray-600',
  },
  dark: {
    page: 'bg-gray-950',
    card: 'bg-gray-900',
    text: 'text-gray-100',
    muted: 'text-gray-400',
  },
} as const;

/**
 * Maps image display tokens to Tailwind classes.
 */
const IMAGE_DISPLAY_CLASSES = {
  rounded: 'rounded-lg overflow-hidden',
  sharp: 'rounded-none',
  shadowed: 'rounded-lg shadow-lg overflow-hidden',
  framed: 'rounded-sm ring-1 ring-gray-200 dark:ring-gray-700 p-1 bg-white dark:bg-gray-800',
} as const;

/**
 * Maps layout tokens to container and grid classes.
 */
const LAYOUT_CLASSES = {
  'hero-gallery': {
    container: 'max-w-5xl mx-auto',
    grid: 'grid grid-cols-2 md:grid-cols-3',
  },
  'split-image': {
    container: 'max-w-6xl mx-auto',
    grid: 'grid grid-cols-1 lg:grid-cols-2',
  },
  'masonry-grid': {
    container: 'max-w-6xl mx-auto',
    grid: 'columns-2 md:columns-3',
  },
  'full-bleed': {
    container: 'max-w-none',
    grid: 'grid grid-cols-1',
  },
  cards: {
    container: 'max-w-5xl mx-auto',
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  },
} as const;

/**
 * Maps hero style tokens to layout classes.
 */
const HERO_STYLE_CLASSES = {
  'large-single': {
    container: 'aspect-video w-full',
    grid: '',
  },
  'grid-3': {
    container: 'grid grid-cols-3 gap-2',
    grid: 'aspect-video',
  },
  'side-by-side': {
    container: 'grid grid-cols-2 gap-4',
    grid: 'aspect-[4/3]',
  },
  carousel: {
    container: 'relative overflow-hidden',
    grid: 'aspect-video',
  },
} as const;

/**
 * Resolved class mappings for a complete set of design tokens.
 * Use this interface to type the return value of `tokensToClasses`.
 */
export interface ResolvedClasses {
  /** Spacing-related classes */
  spacing: typeof SPACING_CLASSES[Spacing];
  /** Heading typography classes */
  heading: string;
  /** Body text classes */
  body: string;
  /** Accent color classes */
  accent: typeof ACCENT_CLASSES[AccentColor];
  /** Background color classes */
  background: typeof BACKGROUND_CLASSES[BackgroundColor];
  /** Image display classes */
  image: string;
  /** Layout container/grid classes */
  layout: typeof LAYOUT_CLASSES[LayoutStyle];
  /** Hero section classes */
  hero: typeof HERO_STYLE_CLASSES[HeroStyle];
}

/**
 * Converts design tokens to Tailwind CSS class strings.
 *
 * Use this function to translate AI-selected design tokens into
 * actual CSS classes that can be applied to components.
 *
 * @param tokens - The design tokens to convert
 * @returns An object containing Tailwind class strings for each token category
 *
 * @example
 * ```typescript
 * const tokens: DesignTokens = {
 *   layout: 'hero-gallery',
 *   spacing: 'comfortable',
 *   typography: { headingStyle: 'bold', bodySize: 'base' },
 *   colors: { accent: 'earth', background: 'light' },
 *   imageDisplay: 'rounded',
 *   heroStyle: 'large-single',
 * };
 *
 * const classes = tokensToClasses(tokens);
 * // classes.heading => 'font-bold tracking-tight'
 * // classes.spacing.container => 'space-y-8'
 * // classes.accent.text => 'text-amber-700 dark:text-amber-500'
 * ```
 */
export function tokensToClasses(tokens: DesignTokens): ResolvedClasses {
  return {
    spacing: SPACING_CLASSES[tokens.spacing],
    heading: HEADING_CLASSES[tokens.typography.headingStyle],
    body: BODY_SIZE_CLASSES[tokens.typography.bodySize],
    accent: ACCENT_CLASSES[tokens.colors.accent],
    background: BACKGROUND_CLASSES[tokens.colors.background],
    image: IMAGE_DISPLAY_CLASSES[tokens.imageDisplay],
    layout: LAYOUT_CLASSES[tokens.layout],
    hero: HERO_STYLE_CLASSES[tokens.heroStyle],
  };
}

/**
 * Merges partial tokens with defaults.
 * Useful when AI provides only some token values.
 *
 * @param partial - Partial design tokens from AI
 * @returns Complete design tokens with defaults applied
 */
export function mergeWithDefaults(partial: Partial<DesignTokens>): DesignTokens {
  return {
    layout: partial.layout ?? DEFAULT_DESIGN_TOKENS.layout,
    spacing: partial.spacing ?? DEFAULT_DESIGN_TOKENS.spacing,
    typography: {
      headingStyle: partial.typography?.headingStyle ?? DEFAULT_DESIGN_TOKENS.typography.headingStyle,
      bodySize: partial.typography?.bodySize ?? DEFAULT_DESIGN_TOKENS.typography.bodySize,
    },
    colors: {
      accent: partial.colors?.accent ?? DEFAULT_DESIGN_TOKENS.colors.accent,
      background: partial.colors?.background ?? DEFAULT_DESIGN_TOKENS.colors.background,
    },
    imageDisplay: partial.imageDisplay ?? DEFAULT_DESIGN_TOKENS.imageDisplay,
    heroStyle: partial.heroStyle ?? DEFAULT_DESIGN_TOKENS.heroStyle,
  };
}

/**
 * Validates and parses design tokens from unknown input.
 * Returns default tokens if parsing fails.
 *
 * @param input - Unknown input to parse as design tokens
 * @returns Validated design tokens (defaults if invalid)
 */
export function parseDesignTokens(input: unknown): DesignTokens {
  const result = DesignTokenSchema.safeParse(input);
  if (result.success) {
    return result.data;
  }
  return DEFAULT_DESIGN_TOKENS;
}
