/**
 * Puck Visual Editor Type Definitions
 *
 * TypeScript types and Zod schemas for Puck page data validation.
 * These types are critical for external AI agents to generate valid page structures.
 *
 * Structure:
 * - Block prop types (matching src/lib/puck/config.tsx)
 * - Puck Data structure types
 * - Zod schemas for runtime validation
 *
 * @see PUCK-004 in PRD for acceptance criteria
 * @see https://puckeditor.com/docs/api-reference/data for Puck Data format
 */

import { z } from 'zod'

// ============================================================================
// SHARED/UTILITY TYPES
// ============================================================================

/**
 * CTA Button configuration used across multiple blocks
 */
export interface CTAButtonConfig {
  text: string
  href: string
  variant: 'primary' | 'secondary' | 'outline'
}

/**
 * Media reference from Payload CMS
 * Used for images from the Media collection
 */
export interface MediaRef {
  id: string
  url: string
  alt: string
  width?: number
  height?: number
  thumbnailUrl?: string
  mimeType?: string
  filename?: string
}

// ============================================================================
// LAYOUT BLOCK PROPS
// ============================================================================

/**
 * Section block - Container wrapper with spacing and background
 * @category Layout
 */
export interface SectionBlockProps {
  backgroundColor: string
  paddingTop: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  paddingBottom: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  maxWidth: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

/**
 * Columns block - Multi-column responsive grid
 * @category Layout
 */
export interface ColumnsBlockProps {
  layout: '50-50' | '33-33-33' | '25-75' | '75-25' | '33-66' | '66-33'
  gap: 'none' | 'sm' | 'md' | 'lg'
  verticalAlign: 'top' | 'center' | 'bottom'
}

/**
 * Spacer block - Vertical spacing utility
 * @category Layout
 */
export interface SpacerBlockProps {
  size: 'sm' | 'md' | 'lg' | 'xl' | 'custom'
  customSize: number
}

// ============================================================================
// CONTENT BLOCK PROPS
// ============================================================================

/**
 * Hero block - Page header with background, heading, and CTAs
 * @category Content
 */
export interface HeroBlockProps {
  heading: string
  subheading: string
  backgroundImage: MediaRef | null
  alignment: 'left' | 'center' | 'right'
  ctaButtons: CTAButtonConfig[]
}

/**
 * RichText block - WYSIWYG formatted content
 * @category Content
 */
export interface RichTextBlockProps {
  content: string // HTML string
}

/**
 * Heading block - Semantic heading (H1-H6)
 * @category Content
 */
export interface HeadingBlockProps {
  text: string
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  alignment: 'left' | 'center' | 'right'
  color: string
}

/**
 * Image block - Single image with caption
 * @category Content
 */
export interface ImageBlockProps {
  image: MediaRef | null
  alt: string
  caption: string
  size: 'small' | 'medium' | 'large' | 'full'
  alignment: 'left' | 'center' | 'right'
}

/**
 * Video block - YouTube/Vimeo embedded video
 * @category Content
 */
export interface VideoBlockProps {
  url: string
  aspectRatio: '16:9' | '4:3' | '1:1'
  autoplay: boolean
  caption: string
}

// ============================================================================
// MARKETING BLOCK PROPS
// ============================================================================

/**
 * FeaturesGrid block - Feature cards with icons
 * @category Marketing
 */
export interface FeaturesGridBlockProps {
  items: Array<{
    icon: string
    title: string
    description: string
    featured?: boolean
  }>
  columns: 2 | 3 | 4
  iconStyle: 'filled' | 'outlined'
}

/**
 * Testimonials block - Customer quotes display
 * @category Marketing
 */
export interface TestimonialsBlockProps {
  items: Array<{
    quote: string
    author: string
    title: string
    avatar: MediaRef | null
  }>
  layout: 'carousel' | 'grid'
  showAvatar: boolean
}

/**
 * PricingTable block - Pricing tier comparison
 * @category Marketing
 */
export interface PricingTableBlockProps {
  tiers: Array<{
    name: string
    price: number
    period: 'monthly' | 'yearly'
    features: string // Newline-separated features
    ctaText: string
    ctaLink: string
    isHighlighted: boolean
  }>
  showToggle: boolean
  highlightTier: number | null
}

/**
 * CTABanner block - Call-to-action banner section
 * @category Marketing
 */
export interface CTABannerBlockProps {
  heading: string
  description: string
  buttons: CTAButtonConfig[]
  backgroundColor: string
  style: 'centered' | 'left-aligned'
}

/**
 * FAQAccordion block - Expandable Q&A section
 * @category Marketing
 */
export interface FAQAccordionBlockProps {
  items: Array<{
    question: string
    answer: string
  }>
  allowMultiple: boolean
  defaultOpen: number | null
}

/**
 * Stats block - Key metrics display
 * @category Marketing
 */
export interface StatsBlockProps {
  items: Array<{
    number: string
    label: string
    prefix: string
    suffix: string
  }>
  columns: 2 | 3 | 4
  style: 'default' | 'card' | 'minimal'
}

// ============================================================================
// BLOG BLOCK PROPS
// ============================================================================

/**
 * CodeBlock block - Syntax-highlighted code
 * @category Blog
 */
export interface CodeBlockBlockProps {
  code: string
  language: 'javascript' | 'typescript' | 'python' | 'bash' | 'json' | 'html' | 'css' | 'sql'
  showLineNumbers: boolean
  filename: string
}

/**
 * Callout block - Info/warning/tip boxes
 * @category Blog
 */
export interface CalloutBlockProps {
  type: 'info' | 'warning' | 'success' | 'error' | 'tip'
  title: string
  content: string
}

/**
 * Table block - Data table with headers
 * @category Blog
 */
export interface TableBlockProps {
  headers: Array<{ value: string }>
  rows: Array<{ cells: string }> // Newline-separated cells per row
  striped: boolean
  bordered: boolean
}

/**
 * ImageGallery block - Multi-image grid with lightbox
 * @category Blog
 */
export interface ImageGalleryBlockProps {
  images: MediaRef[]
  columns: 2 | 3 | 4
  lightbox: boolean
}

// ============================================================================
// PUCK DATA STRUCTURE TYPES
// ============================================================================

/**
 * All available block types
 */
export type PuckBlockType =
  | 'Section'
  | 'Columns'
  | 'Spacer'
  | 'Hero'
  | 'RichText'
  | 'Heading'
  | 'Image'
  | 'Video'
  | 'FeaturesGrid'
  | 'Testimonials'
  | 'PricingTable'
  | 'CTABanner'
  | 'FAQAccordion'
  | 'Stats'
  | 'CodeBlock'
  | 'Callout'
  | 'Table'
  | 'ImageGallery'

/**
 * Map of block types to their props
 */
export type BlockPropsMap = {
  Section: SectionBlockProps
  Columns: ColumnsBlockProps
  Spacer: SpacerBlockProps
  Hero: HeroBlockProps
  RichText: RichTextBlockProps
  Heading: HeadingBlockProps
  Image: ImageBlockProps
  Video: VideoBlockProps
  FeaturesGrid: FeaturesGridBlockProps
  Testimonials: TestimonialsBlockProps
  PricingTable: PricingTableBlockProps
  CTABanner: CTABannerBlockProps
  FAQAccordion: FAQAccordionBlockProps
  Stats: StatsBlockProps
  CodeBlock: CodeBlockBlockProps
  Callout: CalloutBlockProps
  Table: TableBlockProps
  ImageGallery: ImageGalleryBlockProps
}

/**
 * Single component/block in the page content array
 * Each item has a unique ID, type name, and props
 */
export interface PuckComponentData<T extends PuckBlockType = PuckBlockType> {
  type: T
  props: BlockPropsMap[T] & { id: string }
}

/**
 * Root data - page-level settings
 * Can contain root-level props if configured
 */
export interface PuckRootData {
  props?: {
    title?: string
    [key: string]: unknown
  }
}

/**
 * Complete Puck page data structure
 * This is the format stored in the database and used by the editor
 */
export interface PuckPageData {
  /** Root-level page configuration */
  root: PuckRootData
  /** Array of content blocks on the page */
  content: PuckComponentData[]
  /** Named zones for nested content (used by Section, Columns blocks) */
  zones?: Record<string, PuckComponentData[]>
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

/**
 * CTA Button schema
 */
export const ctaButtonSchema = z.object({
  text: z.string().min(1, 'Button text is required'),
  href: z.string().min(1, 'Button link is required'),
  variant: z.enum(['primary', 'secondary', 'outline']),
})

/**
 * Media reference schema
 */
export const mediaRefSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
}).nullable()

/**
 * Padding/size enum schemas
 */
const paddingSchema = z.enum(['none', 'sm', 'md', 'lg', 'xl'])
const maxWidthSchema = z.enum(['sm', 'md', 'lg', 'xl', 'full'])
const gapSchema = z.enum(['none', 'sm', 'md', 'lg'])
const alignmentSchema = z.enum(['left', 'center', 'right'])
const headingLevelSchema = z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

// ============================================================================
// BLOCK PROP SCHEMAS
// ============================================================================

export const sectionPropsSchema = z.object({
  backgroundColor: z.string(),
  paddingTop: paddingSchema,
  paddingBottom: paddingSchema,
  maxWidth: maxWidthSchema,
})

export const columnsPropsSchema = z.object({
  layout: z.enum(['50-50', '33-33-33', '25-75', '75-25', '33-66', '66-33']),
  gap: gapSchema,
  verticalAlign: z.enum(['top', 'center', 'bottom']),
})

export const spacerPropsSchema = z.object({
  size: z.enum(['sm', 'md', 'lg', 'xl', 'custom']),
  customSize: z.number().min(0),
})

export const heroPropsSchema = z.object({
  heading: z.string(),
  subheading: z.string(),
  backgroundImage: mediaRefSchema,
  alignment: alignmentSchema,
  ctaButtons: z.array(ctaButtonSchema),
})

export const richTextPropsSchema = z.object({
  content: z.string(),
})

export const headingPropsSchema = z.object({
  text: z.string(),
  level: headingLevelSchema,
  alignment: alignmentSchema,
  color: z.string(),
})

export const imagePropsSchema = z.object({
  image: mediaRefSchema,
  alt: z.string(),
  caption: z.string(),
  size: z.enum(['small', 'medium', 'large', 'full']),
  alignment: alignmentSchema,
})

export const videoPropsSchema = z.object({
  url: z.string(),
  aspectRatio: z.enum(['16:9', '4:3', '1:1']),
  autoplay: z.boolean(),
  caption: z.string(),
})

export const featuresGridPropsSchema = z.object({
  items: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string(),
  })),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  iconStyle: z.enum(['filled', 'outlined']),
})

export const testimonialsPropsSchema = z.object({
  items: z.array(z.object({
    quote: z.string(),
    author: z.string(),
    title: z.string(),
    avatar: mediaRefSchema,
  })),
  layout: z.enum(['carousel', 'grid']),
  showAvatar: z.boolean(),
})

export const pricingTablePropsSchema = z.object({
  tiers: z.array(z.object({
    name: z.string(),
    price: z.number(),
    period: z.enum(['monthly', 'yearly']),
    features: z.string(),
    ctaText: z.string(),
    ctaLink: z.string(),
    isHighlighted: z.boolean(),
  })),
  showToggle: z.boolean(),
  highlightTier: z.number().nullable(),
})

export const ctaBannerPropsSchema = z.object({
  heading: z.string(),
  description: z.string(),
  buttons: z.array(ctaButtonSchema),
  backgroundColor: z.string(),
  style: z.enum(['centered', 'left-aligned']),
})

export const faqAccordionPropsSchema = z.object({
  items: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
  allowMultiple: z.boolean(),
  defaultOpen: z.number().nullable(),
})

export const statsPropsSchema = z.object({
  items: z.array(z.object({
    number: z.string(),
    label: z.string(),
    prefix: z.string(),
    suffix: z.string(),
  })),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  style: z.enum(['default', 'card', 'minimal']),
})

export const codeBlockPropsSchema = z.object({
  code: z.string(),
  language: z.enum(['javascript', 'typescript', 'python', 'bash', 'json', 'html', 'css', 'sql']),
  showLineNumbers: z.boolean(),
  filename: z.string(),
})

export const calloutPropsSchema = z.object({
  type: z.enum(['info', 'warning', 'success', 'error', 'tip']),
  title: z.string(),
  content: z.string(),
})

export const tablePropsSchema = z.object({
  headers: z.array(z.object({ value: z.string() })),
  rows: z.array(z.object({ cells: z.string() })),
  striped: z.boolean(),
  bordered: z.boolean(),
})

export const imageGalleryPropsSchema = z.object({
  images: z.array(mediaRefSchema.unwrap()), // Remove nullable wrapper for array items
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  lightbox: z.boolean(),
})

/**
 * Block type enum for validation
 */
export const blockTypeSchema = z.enum([
  'Section',
  'Columns',
  'Spacer',
  'Hero',
  'RichText',
  'Heading',
  'Image',
  'Video',
  'FeaturesGrid',
  'Testimonials',
  'PricingTable',
  'CTABanner',
  'FAQAccordion',
  'Stats',
  'CodeBlock',
  'Callout',
  'Table',
  'ImageGallery',
])

/**
 * Map of block type to its props schema
 */
export const blockPropsSchemaMap: Record<PuckBlockType, z.ZodSchema> = {
  Section: sectionPropsSchema,
  Columns: columnsPropsSchema,
  Spacer: spacerPropsSchema,
  Hero: heroPropsSchema,
  RichText: richTextPropsSchema,
  Heading: headingPropsSchema,
  Image: imagePropsSchema,
  Video: videoPropsSchema,
  FeaturesGrid: featuresGridPropsSchema,
  Testimonials: testimonialsPropsSchema,
  PricingTable: pricingTablePropsSchema,
  CTABanner: ctaBannerPropsSchema,
  FAQAccordion: faqAccordionPropsSchema,
  Stats: statsPropsSchema,
  CodeBlock: codeBlockPropsSchema,
  Callout: calloutPropsSchema,
  Table: tablePropsSchema,
  ImageGallery: imageGalleryPropsSchema,
}

/**
 * Component data schema - validates a single block
 */
export const componentDataSchema = z.object({
  type: blockTypeSchema,
  props: z.record(z.string(), z.unknown()).and(z.object({ id: z.string() })),
})

/**
 * Root data schema
 */
export const rootDataSchema = z.object({
  props: z.object({
    title: z.string().optional(),
  }).passthrough().optional(),
})

/**
 * Complete Puck page data schema
 * Use this for validating incoming data in API routes
 */
export const puckPageDataSchema = z.object({
  root: rootDataSchema,
  content: z.array(componentDataSchema),
  zones: z.record(z.string(), z.array(componentDataSchema)).optional(),
})

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate Puck page data structure
 * @param data - The data to validate
 * @returns Parsed and typed data if valid
 * @throws ZodError if validation fails
 */
export function validatePuckPageData(data: unknown): PuckPageData {
  // Zod validates structure, cast to our interface for TypeScript
  return puckPageDataSchema.parse(data) as unknown as PuckPageData
}

/**
 * Safe validation that returns result object instead of throwing
 * @param data - The data to validate
 * @returns Success/error result object
 */
export function safeParsePuckPageData(data: unknown) {
  return puckPageDataSchema.safeParse(data)
}

/**
 * Validate a single block's props against its schema
 * @param type - The block type
 * @param props - The props to validate
 * @returns Validation result
 */
export function validateBlockProps(type: PuckBlockType, props: unknown) {
  const schema = blockPropsSchemaMap[type]
  if (!schema) {
    return { success: false, error: new Error(`Unknown block type: ${type}`) }
  }
  return schema.safeParse(props)
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a valid block type
 */
export function isValidBlockType(type: unknown): type is PuckBlockType {
  return blockTypeSchema.safeParse(type).success
}

/**
 * Type guard to check if data is valid Puck page data
 */
export function isPuckPageData(data: unknown): data is PuckPageData {
  return puckPageDataSchema.safeParse(data).success
}

// ============================================================================
// HELPER FUNCTIONS FOR AI AGENTS
// ============================================================================

/**
 * Get the default props for a block type
 * Useful for AI agents creating new blocks
 */
export const defaultBlockProps: Record<PuckBlockType, Record<string, unknown>> = {
  Section: {
    backgroundColor: 'transparent',
    paddingTop: 'md',
    paddingBottom: 'md',
    maxWidth: 'lg',
  },
  Columns: {
    layout: '50-50',
    gap: 'md',
    verticalAlign: 'top',
  },
  Spacer: {
    size: 'md',
    customSize: 32,
  },
  Hero: {
    heading: 'Welcome',
    subheading: 'Your tagline here',
    backgroundImage: null,
    alignment: 'center',
    ctaButtons: [{ text: 'Get Started', href: '/', variant: 'primary' }],
  },
  RichText: {
    content: '<p>Enter content here...</p>',
  },
  Heading: {
    text: 'Heading',
    level: 'h2',
    alignment: 'left',
    color: '#111',
  },
  Image: {
    image: null,
    alt: '',
    caption: '',
    size: 'medium',
    alignment: 'center',
  },
  Video: {
    url: '',
    aspectRatio: '16:9',
    autoplay: false,
    caption: '',
  },
  FeaturesGrid: {
    items: [],
    columns: 3,
    iconStyle: 'outlined',
  },
  Testimonials: {
    items: [],
    layout: 'grid',
    showAvatar: true,
  },
  PricingTable: {
    tiers: [],
    showToggle: false,
    highlightTier: null,
  },
  CTABanner: {
    heading: 'Ready to get started?',
    description: 'Join us today.',
    buttons: [{ text: 'Sign Up', href: '/signup', variant: 'primary' }],
    backgroundColor: '#0070f3',
    style: 'centered',
  },
  FAQAccordion: {
    items: [],
    allowMultiple: false,
    defaultOpen: null,
  },
  Stats: {
    items: [],
    columns: 3,
    style: 'default',
  },
  CodeBlock: {
    code: '// Your code here',
    language: 'javascript',
    showLineNumbers: true,
    filename: '',
  },
  Callout: {
    type: 'info',
    title: 'Note',
    content: 'Important information here.',
  },
  Table: {
    headers: [],
    rows: [],
    striped: true,
    bordered: true,
  },
  ImageGallery: {
    images: [],
    columns: 3,
    lightbox: true,
  },
}

/**
 * Create a new component with default props and generated ID
 * @param type - The block type to create
 * @param overrides - Optional prop overrides
 * @returns A new component data object ready to add to content
 */
export function createComponent<T extends PuckBlockType>(
  type: T,
  overrides?: Partial<BlockPropsMap[T]>
): PuckComponentData<T> {
  const id = `${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return {
    type,
    props: {
      ...defaultBlockProps[type],
      ...overrides,
      id,
    } as unknown as BlockPropsMap[T] & { id: string },
  }
}

/**
 * Create an empty Puck page data structure
 * @returns Empty page data ready for blocks
 */
export function createEmptyPuckPageData(): PuckPageData {
  return {
    root: { props: {} },
    content: [],
    zones: {},
  }
}
