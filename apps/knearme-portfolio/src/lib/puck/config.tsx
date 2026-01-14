/**
 * Puck Visual Editor Configuration
 *
 * Defines all 16 block components for the drag-and-drop page builder.
 * Each block has TypeScript-typed props, configurable fields, and render output.
 *
 * Categories:
 * - Layout: Section, Columns, Spacer
 * - Content: Hero, RichText, Heading, Image, Video
 * - Marketing: FeaturesGrid, Testimonials, PricingTable, CTABanner, FAQAccordion, Stats
 * - Blog: CodeBlock, Callout, Table, ImageGallery
 *
 * @see PUCK-003 in PRD for acceptance criteria
 * @see https://puckeditor.com/docs/configuration for Puck config docs
 */

import type { Config, Data } from '@puckeditor/core'
import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { PuckCodeBlock } from '@/components/puck/CodeBlock'
import { PuckFAQAccordion } from '@/components/puck/FAQAccordion'
import { PuckFeaturesGrid } from '@/components/puck/FeaturesGrid'
import { PuckHero } from '@/components/puck/Hero'
import { PuckImageGallery } from '@/components/puck/ImageGallery'
import { PuckStats } from '@/components/puck/Stats'
import { fieldOptions } from '@/lib/puck/design-system'
import { cn } from '@/lib/utils'
import {
  Zap,
  Shield,
  Heart,
  Star,
  Clock,
  Users,
  Camera,
  FileText,
  TrendingUp,
  MessageSquare,
  Settings,
  CheckCircle,
  Award,
  Target,
  Lightbulb,
  Rocket,
  Globe,
  Lock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  BarChart,
  Briefcase,
  Building,
  Code,
  Cpu,
  Database,
  Edit,
  Eye,
  Gift,
  Headphones,
  Home,
  Layers,
  Link,
  // Icons for Callout block (PUCK-028)
  Info,
  AlertTriangle,
  CircleCheck,
  CircleX,
  type LucideIcon,
} from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  Table as ShadcnTable,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'

// ============================================================================
// LUCIDE ICON MAP
// ============================================================================

/**
 * Map of icon names to Lucide components for FeaturesGrid block.
 * Users select from this curated list of commonly-used marketing icons.
 *
 * @see PUCK-021 in PRD for FeaturesGrid implementation
 * @see src/components/marketing/FeatureGrid.tsx for similar pattern
 */
const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap,
  shield: Shield,
  heart: Heart,
  star: Star,
  clock: Clock,
  users: Users,
  camera: Camera,
  'file-text': FileText,
  'trending-up': TrendingUp,
  'message-square': MessageSquare,
  settings: Settings,
  'check-circle': CheckCircle,
  award: Award,
  target: Target,
  lightbulb: Lightbulb,
  rocket: Rocket,
  globe: Globe,
  lock: Lock,
  mail: Mail,
  phone: Phone,
  'map-pin': MapPin,
  calendar: Calendar,
  'dollar-sign': DollarSign,
  'bar-chart': BarChart,
  briefcase: Briefcase,
  building: Building,
  code: Code,
  cpu: Cpu,
  database: Database,
  edit: Edit,
  eye: Eye,
  gift: Gift,
  headphones: Headphones,
  home: Home,
  layers: Layers,
  link: Link,
}

/**
 * Icon select options for Puck field dropdown.
 * Labels are human-readable, values match LUCIDE_ICON_MAP keys.
 */
const ICON_OPTIONS = [
  { label: '⚡ Zap', value: 'zap' },
  { label: '🛡️ Shield', value: 'shield' },
  { label: '❤️ Heart', value: 'heart' },
  { label: '⭐ Star', value: 'star' },
  { label: '🕐 Clock', value: 'clock' },
  { label: '👥 Users', value: 'users' },
  { label: '📷 Camera', value: 'camera' },
  { label: '📄 File Text', value: 'file-text' },
  { label: '📈 Trending Up', value: 'trending-up' },
  { label: '💬 Message', value: 'message-square' },
  { label: '⚙️ Settings', value: 'settings' },
  { label: '✅ Check Circle', value: 'check-circle' },
  { label: '🏆 Award', value: 'award' },
  { label: '🎯 Target', value: 'target' },
  { label: '💡 Lightbulb', value: 'lightbulb' },
  { label: '🚀 Rocket', value: 'rocket' },
  { label: '🌍 Globe', value: 'globe' },
  { label: '🔒 Lock', value: 'lock' },
  { label: '📧 Mail', value: 'mail' },
  { label: '📞 Phone', value: 'phone' },
  { label: '📍 Map Pin', value: 'map-pin' },
  { label: '📅 Calendar', value: 'calendar' },
  { label: '💵 Dollar Sign', value: 'dollar-sign' },
  { label: '📊 Bar Chart', value: 'bar-chart' },
  { label: '💼 Briefcase', value: 'briefcase' },
  { label: '🏢 Building', value: 'building' },
  { label: '👨‍💻 Code', value: 'code' },
  { label: '🖥️ CPU', value: 'cpu' },
  { label: '🗄️ Database', value: 'database' },
  { label: '✏️ Edit', value: 'edit' },
  { label: '👁️ Eye', value: 'eye' },
  { label: '🎁 Gift', value: 'gift' },
  { label: '🎧 Headphones', value: 'headphones' },
  { label: '🏠 Home', value: 'home' },
  { label: '📚 Layers', value: 'layers' },
  { label: '🔗 Link', value: 'link' },
]

/**
 * Get Lucide icon component from icon name string
 */
function getLucideIcon(iconName: string): LucideIcon {
  return LUCIDE_ICON_MAP[iconName] || Star
}

// ============================================================================
// PROP TYPE DEFINITIONS
// ============================================================================

/**
 * Common button/CTA configuration
 */
export interface CTAButtonProps {
  text: string
  href: string
  variant: 'primary' | 'secondary' | 'outline'
}

/**
 * Media reference from Payload CMS
 * Includes optional dimensions for image optimization
 */
export interface MediaRef {
  id: string
  url: string
  alt: string
  width?: number
  height?: number
  thumbnailUrl?: string
}

/**
 * Media item returned from /api/puck/media endpoint
 * Used by Puck external field fetchList
 */
interface MediaListItem {
  id: string
  title: string
  description: string
  url: string
  alt: string
  width?: number
  height?: number
  thumbnailUrl?: string
}

/**
 * Shared external field configuration for Payload Media integration
 * @see PUCK-010 for implementation details
 * @see /api/puck/media for the API endpoint
 */
const createMediaExternalField = (label: string) => ({
  type: 'external' as const,
  label,
  placeholder: 'Select image...',
  showSearch: true,
  fetchList: async ({ query }: { query?: string }) => {
    const params = new URLSearchParams()
    if (query) params.set('query', query)
    const response = await fetch(`/api/puck/media?${params.toString()}`)
    if (!response.ok) throw new Error('Failed to fetch media')
    return response.json() as Promise<MediaListItem[]>
  },
  mapRow: (item: MediaListItem) => ({
    title: item.title,
    description: item.description,
  }),
  mapProp: (item: MediaListItem): MediaRef => ({
    id: item.id,
    url: item.url,
    alt: item.alt,
    width: item.width,
    height: item.height,
    thumbnailUrl: item.thumbnailUrl,
  }),
  getItemSummary: (item: MediaRef | null) => item?.alt || 'No image selected',
})

// ============================================================================
// LAYOUT BLOCKS
// ============================================================================

/**
 * Section - Container wrapper with background and spacing options
 */
export interface SectionProps {
  backgroundColor: string
  paddingTop: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  paddingBottom: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  maxWidth: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

/**
 * Columns - Multi-column responsive grid layout
 */
export interface ColumnsProps {
  layout: '50-50' | '33-33-33' | '25-75' | '75-25' | '33-66' | '66-33'
  gap: 'none' | 'sm' | 'md' | 'lg'
  verticalAlign: 'top' | 'center' | 'bottom'
}

/**
 * Spacer - Vertical spacing utility
 */
export interface SpacerProps {
  size: 'sm' | 'md' | 'lg' | 'xl' | 'custom'
  customSize: number
}

// ============================================================================
// CONTENT BLOCKS
// ============================================================================

/**
 * Hero - Page header with heading, subheading, background, and CTAs
 *
 * Enhanced with gradient backgrounds, animation presets, and overlay controls.
 * @see PUCK-044 for acceptance criteria
 * @see src/components/puck/Hero.tsx for client component implementation
 */
export interface HeroProps {
  heading: string
  subheading: string
  // Background options
  backgroundType: 'solid' | 'gradient' | 'image' | 'pattern'
  backgroundColor: string
  gradientPreset: 'sunset' | 'ocean' | 'aurora' | 'midnight' | 'forest' | 'royal'
  backgroundImage: MediaRef | null
  patternType: 'dots' | 'grid' | 'diagonal'
  // Overlay configuration
  overlayEnabled: boolean
  overlayColor: string
  overlayOpacity: number
  overlayBlur: number
  // Animation
  animationPreset: 'none' | 'fadeIn' | 'fadeUp' | 'slideUp' | 'scaleIn'
  // Layout
  alignment: 'left' | 'center' | 'right'
  ctaButtons: CTAButtonProps[]
}

/**
 * RichText - WYSIWYG formatted content
 * Uses Puck's native richtext field (Tiptap-powered)
 * @see PUCK-015 for acceptance criteria
 */
export interface RichTextProps {
  content: import('@puckeditor/core').RichText // Tiptap rich text (string | ReactNode)
}

/**
 * Heading - Semantic heading element (H1-H6)
 */
export interface HeadingProps {
  text: string
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  alignment: 'left' | 'center' | 'right'
  color: string
}

/**
 * Image - Single image with caption and sizing
 */
export interface ImageProps {
  image: MediaRef | null
  alt: string
  caption: string
  size: 'small' | 'medium' | 'large' | 'full'
  alignment: 'left' | 'center' | 'right'
}

/**
 * Video - YouTube/Vimeo embedded video
 */
export interface VideoProps {
  url: string
  aspectRatio: '16:9' | '4:3' | '1:1'
  autoplay: boolean
  caption: string
}

// ============================================================================
// MARKETING BLOCKS
// ============================================================================

/**
 * FeaturesGrid - Feature cards with icons
 * @see PUCK-043 for animation and style variant enhancements
 */
export interface FeaturesGridProps {
  items: Array<{
    icon: string // lucide icon name
    title: string
    description: string
  }>
  columns: 2 | 3 | 4
  iconStyle: 'filled' | 'outlined'
  variant: 'default' | 'glass' | 'minimal' | 'bento'
  animate: boolean
}

/**
 * Testimonials - Customer quotes display
 */
export interface TestimonialsProps {
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
 * PricingTable - Pricing tier comparison
 * Note: features is stored as newline-separated string in Puck textarea
 */
export interface PricingTableProps {
  tiers: Array<{
    name: string
    price: number
    period: 'monthly' | 'yearly'
    features: string // Newline-separated features (textarea)
    ctaText: string
    ctaLink: string
    isHighlighted: boolean
  }>
  showToggle: boolean
  highlightTier: number | null
}

/**
 * CTABanner - Call-to-action banner section
 */
export interface CTABannerProps {
  heading: string
  description: string
  buttons: CTAButtonProps[]
  backgroundColor: string
  style: 'centered' | 'left-aligned'
}

/**
 * FAQAccordion - Expandable Q&A section
 */
export interface FAQAccordionProps {
  items: Array<{
    question: string
    answer: string // HTML content
  }>
  allowMultiple: boolean
  defaultOpen: number | null
}

/**
 * Stats - Key metrics display
 */
export interface StatsProps {
  items: Array<{
    number: string
    label: string
    prefix: string
    suffix: string
    icon?: string
  }>
  columns: 2 | 3 | 4
  style: 'default' | 'card' | 'minimal' | 'glass' | 'gradient'
  gradient?: 'sunset' | 'ocean' | 'aurora' | 'midnight' | 'forest' | 'royal'
  animate?: boolean
}

// ============================================================================
// BLOG BLOCKS
// ============================================================================

/**
 * CodeBlock - Syntax-highlighted code snippet
 */
export interface CodeBlockProps {
  code: string
  language: 'javascript' | 'typescript' | 'python' | 'bash' | 'json' | 'html' | 'css' | 'sql'
  showLineNumbers: boolean
  filename: string
}

/**
 * Callout - Info/warning/tip boxes
 */
export interface CalloutProps {
  type: 'info' | 'warning' | 'success' | 'error' | 'tip'
  title: string
  content: string // HTML content
}

/**
 * Table - Data table with headers
 * Note: Puck array fields store objects, not plain strings
 */
export interface TableProps {
  headers: Array<{ value: string }>
  rows: Array<{ cells: string }> // Newline-separated cells per row
  striped: boolean
  bordered: boolean
}

/**
 * ImageGallery - Multi-image grid with lightbox
 * Note: images is an array of objects containing the image MediaRef
 * This structure is required by Puck's array field with external type
 */
export interface ImageGalleryProps {
  images: Array<{ image: MediaRef | null }>
  columns: 2 | 3 | 4
  lightbox: boolean
}

// ============================================================================
// COMBINED PROPS TYPE
// ============================================================================

/**
 * Union of all block prop types for type-safe config
 */
export type Props = {
  Section: SectionProps
  Columns: ColumnsProps
  Spacer: SpacerProps
  Hero: HeroProps
  RichText: RichTextProps
  Heading: HeadingProps
  Image: ImageProps
  Video: VideoProps
  FeaturesGrid: FeaturesGridProps
  Testimonials: TestimonialsProps
  PricingTable: PricingTableProps
  CTABanner: CTABannerProps
  FAQAccordion: FAQAccordionProps
  Stats: StatsProps
  CodeBlock: CodeBlockProps
  Callout: CalloutProps
  Table: TableProps
  ImageGallery: ImageGalleryProps
}

// ============================================================================
// SPACING UTILITIES
// ============================================================================
// Note: Most blocks now use Tailwind classes directly for spacing.
// Section block: paddingTopClass, paddingBottomClass, maxWidthClass
// Columns block: gapClasses (gap-0, gap-4, gap-6, gap-8, gap-12)

// ============================================================================
// PUCK CONFIG
// ============================================================================

/**
 * Puck Editor Configuration
 *
 * Defines all available blocks, their fields, default values, and render components.
 * Organized into categories for better UX in the editor drawer.
 */
export const config: Config<Props> = {
  categories: {
    layout: {
      title: 'Layout',
      components: ['Section', 'Columns', 'Spacer'],
    },
    content: {
      title: 'Content',
      components: ['Hero', 'RichText', 'Heading', 'Image', 'Video'],
    },
    marketing: {
      title: 'Marketing',
      components: ['FeaturesGrid', 'Testimonials', 'PricingTable', 'CTABanner', 'FAQAccordion', 'Stats'],
    },
    blog: {
      title: 'Blog',
      components: ['CodeBlock', 'Callout', 'Table', 'ImageGallery'],
    },
  },
  components: {
    // ========================================================================
    // LAYOUT BLOCKS
    // ========================================================================
    Section: {
      label: 'Section',
      fields: {
        backgroundColor: {
          type: 'text',
          label: 'Background Color',
        },
        paddingTop: {
          type: 'select',
          label: 'Padding Top',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
            { label: 'Extra Large', value: 'xl' },
          ],
        },
        paddingBottom: {
          type: 'select',
          label: 'Padding Bottom',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
            { label: 'Extra Large', value: 'xl' },
          ],
        },
        maxWidth: {
          type: 'select',
          label: 'Max Width',
          options: [
            { label: 'Small (640px)', value: 'sm' },
            { label: 'Medium (768px)', value: 'md' },
            { label: 'Large (1024px)', value: 'lg' },
            { label: 'Extra Large (1280px)', value: 'xl' },
            { label: 'Full Width', value: 'full' },
          ],
        },
      },
      defaultProps: {
        backgroundColor: 'transparent',
        paddingTop: 'md',
        paddingBottom: 'md',
        maxWidth: 'lg',
      },
      render: ({ backgroundColor, paddingTop, paddingBottom, maxWidth, puck }) => {
        // Map padding values to Tailwind classes
        const paddingTopClass: Record<string, string> = {
          none: 'pt-0',
          sm: 'pt-4',
          md: 'pt-8',
          lg: 'pt-16',
          xl: 'pt-24',
        }
        const paddingBottomClass: Record<string, string> = {
          none: 'pb-0',
          sm: 'pb-4',
          md: 'pb-8',
          lg: 'pb-16',
          xl: 'pb-24',
        }
        const maxWidthClass: Record<string, string> = {
          sm: 'max-w-screen-sm',
          md: 'max-w-screen-md',
          lg: 'max-w-screen-lg',
          xl: 'max-w-screen-xl',
          full: 'max-w-full',
        }

        return (
          <section
            className={`${paddingTopClass[paddingTop]} ${paddingBottomClass[paddingBottom]}`}
            style={{ backgroundColor }}
          >
            <div className={`${maxWidthClass[maxWidth]} mx-auto px-4`}>
              {puck.renderDropZone({ zone: 'content' })}
            </div>
          </section>
        )
      },
    },

    Columns: {
      label: 'Columns',
      fields: {
        layout: {
          type: 'select',
          label: 'Layout',
          options: [
            { label: '50/50', value: '50-50' },
            { label: '33/33/33', value: '33-33-33' },
            { label: '25/75', value: '25-75' },
            { label: '75/25', value: '75-25' },
            { label: '33/66', value: '33-66' },
            { label: '66/33', value: '66-33' },
          ],
        },
        gap: {
          type: 'select',
          label: 'Gap',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
        verticalAlign: {
          type: 'select',
          label: 'Vertical Align',
          options: [
            { label: 'Top', value: 'top' },
            { label: 'Center', value: 'center' },
            { label: 'Bottom', value: 'bottom' },
          ],
        },
      },
      defaultProps: {
        layout: '50-50',
        gap: 'md',
        verticalAlign: 'top',
      },
      render: ({ layout, gap, verticalAlign, puck }) => {
        /**
         * Responsive column layouts using Tailwind CSS
         * All layouts stack to single column on mobile (< md breakpoint)
         * @see PUCK-018 for acceptance criteria
         */
        const layoutConfig: Record<string, { count: number; classes: string; widths: string[] }> = {
          '50-50': {
            count: 2,
            classes: 'grid-cols-1 md:grid-cols-2',
            widths: ['w-full', 'w-full'],
          },
          '33-33-33': {
            count: 3,
            classes: 'grid-cols-1 md:grid-cols-3',
            widths: ['w-full', 'w-full', 'w-full'],
          },
          '25-75': {
            count: 2,
            classes: 'grid-cols-1 md:grid-cols-4',
            widths: ['md:col-span-1', 'md:col-span-3'],
          },
          '75-25': {
            count: 2,
            classes: 'grid-cols-1 md:grid-cols-4',
            widths: ['md:col-span-3', 'md:col-span-1'],
          },
          '33-66': {
            count: 2,
            classes: 'grid-cols-1 md:grid-cols-3',
            widths: ['md:col-span-1', 'md:col-span-2'],
          },
          '66-33': {
            count: 2,
            classes: 'grid-cols-1 md:grid-cols-3',
            widths: ['md:col-span-2', 'md:col-span-1'],
          },
        }

        // Map gap values to Tailwind classes
        const gapClasses: Record<string, string> = {
          none: 'gap-0',
          sm: 'gap-4',
          md: 'gap-6 md:gap-8',
          lg: 'gap-8 md:gap-12',
        }

        // Map vertical alignment to Tailwind classes
        const alignClasses: Record<string, string> = {
          top: 'items-start',
          center: 'items-center',
          bottom: 'items-end',
        }

        // Fallback to 50-50 layout if layout value is invalid
        // Non-null assertion is safe here: layoutConfig['50-50'] always exists
        const layoutData = layoutConfig[layout] ?? layoutConfig['50-50']!

        return (
          <div
            className={cn(
              'grid',
              layoutData.classes,
              gapClasses[gap],
              alignClasses[verticalAlign]
            )}
          >
            {Array.from({ length: layoutData.count }, (_, i) => (
              <div key={i} className={layoutData.widths[i]}>
                {puck.renderDropZone({ zone: `column-${i}` })}
              </div>
            ))}
          </div>
        )
      },
    },

    Spacer: {
      label: 'Spacer',
      fields: {
        size: {
          type: 'select',
          label: 'Size',
          options: [
            { label: 'Small (1rem)', value: 'sm' },
            { label: 'Medium (2rem)', value: 'md' },
            { label: 'Large (4rem)', value: 'lg' },
            { label: 'Extra Large (6rem)', value: 'xl' },
            { label: 'Custom', value: 'custom' },
          ],
        },
        customSize: {
          type: 'number',
          label: 'Custom Size (px)',
        },
      },
      defaultProps: {
        size: 'md',
        customSize: 32,
      },
      render: ({ size, customSize, puck }) => {
        /**
         * Spacer block - adds configurable vertical space between content
         * Shows a visible indicator in editor mode, renders as empty space on frontend
         * @see PUCK-020 for acceptance criteria
         */
        const sizeMap: Record<string, number> = {
          sm: 16,
          md: 32,
          lg: 64,
          xl: 96,
          custom: customSize,
        }
        const heightPx = sizeMap[size] ?? 32

        // In editor mode, show dashed border indicator for visibility
        // On frontend (Render component), show clean empty space
        if (puck.isEditing) {
          return (
            <div
              className="flex items-center justify-center border border-dashed border-muted-foreground/30 bg-muted/30 text-xs text-muted-foreground"
              style={{ height: `${heightPx}px` }}
            >
              Spacer ({heightPx}px)
            </div>
          )
        }

        // Clean render for published pages - just empty vertical space
        return <div aria-hidden="true" style={{ height: `${heightPx}px` }} />
      },
    },

    // ========================================================================
    // CONTENT BLOCKS
    // ========================================================================

    /**
     * Hero block with gradient backgrounds, animation presets, and overlay controls.
     * Uses PuckHero client component for Framer Motion animations.
     * @see PUCK-044 for acceptance criteria
     */
    Hero: {
      label: 'Hero',
      fields: {
        heading: {
          type: 'text',
          label: 'Heading',
        },
        subheading: {
          type: 'textarea',
          label: 'Subheading',
        },
        // Background type selection
        backgroundType: {
          type: 'select',
          label: 'Background Type',
          options: [
            { label: 'Solid Color', value: 'solid' },
            { label: 'Gradient', value: 'gradient' },
            { label: 'Image', value: 'image' },
            { label: 'Pattern', value: 'pattern' },
          ],
        },
        backgroundColor: {
          type: 'text',
          label: 'Background Color (hex)',
        },
        gradientPreset: {
          type: 'select',
          label: 'Gradient Preset',
          options: fieldOptions.gradients,
        },
        backgroundImage: createMediaExternalField('Background Image'),
        patternType: {
          type: 'select',
          label: 'Pattern Style',
          options: [
            { label: 'Dots', value: 'dots' },
            { label: 'Grid', value: 'grid' },
            { label: 'Diagonal', value: 'diagonal' },
          ],
        },
        // Overlay controls
        overlayEnabled: {
          type: 'radio',
          label: 'Enable Overlay',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        overlayColor: {
          type: 'text',
          label: 'Overlay Color (hex)',
        },
        overlayOpacity: {
          type: 'number',
          label: 'Overlay Opacity (0-100)',
          min: 0,
          max: 100,
        },
        overlayBlur: {
          type: 'number',
          label: 'Overlay Blur (px)',
          min: 0,
          max: 20,
        },
        // Animation
        animationPreset: {
          type: 'select',
          label: 'Animation',
          options: fieldOptions.animations,
        },
        // Layout
        alignment: {
          type: 'select',
          label: 'Alignment',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
          ],
        },
        ctaButtons: {
          type: 'array',
          label: 'CTA Buttons',
          arrayFields: {
            text: { type: 'text', label: 'Button Text' },
            href: { type: 'text', label: 'Link URL' },
            variant: {
              type: 'select',
              label: 'Style',
              options: [
                { label: 'Primary', value: 'primary' },
                { label: 'Secondary', value: 'secondary' },
                { label: 'Outline', value: 'outline' },
              ],
            },
          },
          defaultItemProps: { text: 'Get Started', href: '/', variant: 'primary' },
        },
      },
      defaultProps: {
        heading: 'Welcome to Our Site',
        subheading: 'Discover what makes us different.',
        backgroundType: 'solid',
        backgroundColor: '',
        gradientPreset: 'ocean',
        backgroundImage: null,
        patternType: 'dots',
        overlayEnabled: false,
        overlayColor: '#000000',
        overlayOpacity: 50,
        overlayBlur: 0,
        animationPreset: 'none',
        alignment: 'center',
        ctaButtons: [{ text: 'Get Started', href: '/signup', variant: 'primary' }],
      },
      render: (props) => {
        // Delegate to PuckHero client component for Framer Motion support
        return <PuckHero {...props} />
      },
    },

    RichText: {
      label: 'Rich Text',
      fields: {
        content: {
          type: 'richtext',
          label: 'Content',
          // Enable inline editing on the canvas for better UX
          contentEditable: true,
          // Configure heading levels (all other extensions enabled by default)
          options: {
            heading: { levels: [2, 3, 4] },
          },
        },
      },
      defaultProps: {
        content: 'Enter your content here...',
      },
      render: ({ content }) => (
        <div className="prose prose-neutral max-w-none dark:prose-invert">
          {/* Puck richtext returns string | ReactNode - render directly */}
          {content}
        </div>
      ),
    },

    Heading: {
      label: 'Heading',
      fields: {
        text: {
          type: 'text',
          label: 'Text',
        },
        level: {
          type: 'select',
          label: 'Level',
          options: [
            { label: 'H1', value: 'h1' },
            { label: 'H2', value: 'h2' },
            { label: 'H3', value: 'h3' },
            { label: 'H4', value: 'h4' },
            { label: 'H5', value: 'h5' },
            { label: 'H6', value: 'h6' },
          ],
        },
        alignment: {
          type: 'select',
          label: 'Alignment',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
          ],
        },
        color: {
          type: 'text',
          label: 'Color',
        },
      },
      defaultProps: {
        text: 'Heading',
        level: 'h2',
        alignment: 'left',
        color: '',
      },
      render: ({ text, level, alignment, color }) => {
        /**
         * Heading block with Tailwind typography classes
         * Uses design system text sizes for consistency
         * Color kept as inline style for arbitrary color support
         * @see PUCK-019 for acceptance criteria
         */
        const sizeClasses: Record<string, string> = {
          h1: 'text-4xl md:text-5xl lg:text-6xl',
          h2: 'text-3xl md:text-4xl',
          h3: 'text-2xl md:text-3xl',
          h4: 'text-xl md:text-2xl',
          h5: 'text-lg md:text-xl',
          h6: 'text-base md:text-lg',
        }
        const alignClasses: Record<string, string> = {
          left: 'text-left',
          center: 'text-center',
          right: 'text-right',
        }

        // Compose Tailwind classes for typography
        const className = cn(
          sizeClasses[level],
          alignClasses[alignment],
          'font-bold tracking-tight',
          // Use foreground color if no custom color specified
          !color && 'text-foreground'
        )

        // Inline style only for custom color (preserves arbitrary color values)
        const style = color ? { color } : undefined

        // Semantic HTML output using explicit elements
        switch (level) {
          case 'h1': return <h1 className={className} style={style}>{text}</h1>
          case 'h2': return <h2 className={className} style={style}>{text}</h2>
          case 'h3': return <h3 className={className} style={style}>{text}</h3>
          case 'h4': return <h4 className={className} style={style}>{text}</h4>
          case 'h5': return <h5 className={className} style={style}>{text}</h5>
          case 'h6': return <h6 className={className} style={style}>{text}</h6>
          default: return <h2 className={className} style={style}>{text}</h2>
        }
      },
    },

    Image: {
      label: 'Image',
      fields: {
        image: createMediaExternalField('Image'),
        alt: {
          type: 'text',
          label: 'Alt Text',
        },
        caption: {
          type: 'text',
          label: 'Caption',
        },
        size: {
          type: 'select',
          label: 'Size',
          options: [
            { label: 'Small', value: 'small' },
            { label: 'Medium', value: 'medium' },
            { label: 'Large', value: 'large' },
            { label: 'Full Width', value: 'full' },
          ],
        },
        alignment: {
          type: 'select',
          label: 'Alignment',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
          ],
        },
      },
      defaultProps: {
        image: null,
        alt: '',
        caption: '',
        size: 'medium',
        alignment: 'center',
      },
      render: ({ image, alt, caption, size, alignment }) => {
        // Map size to max-width for responsive sizing
        const sizeClasses: Record<string, string> = {
          small: 'max-w-[300px]',
          medium: 'max-w-[500px]',
          large: 'max-w-[800px]',
          full: 'w-full',
        }
        const alignmentClasses: Record<string, string> = {
          left: 'items-start',
          center: 'items-center',
          right: 'items-end',
        }

        return (
          <figure className={cn('flex flex-col', alignmentClasses[alignment])}>
            {image?.url ? (
              <div className={cn('relative w-full', sizeClasses[size])}>
                {/* Use next/image with intrinsic dimensions from Payload Media */}
                {image.width && image.height ? (
                  <Image
                    src={image.url}
                    alt={alt || image.alt || ''}
                    width={image.width}
                    height={image.height}
                    className="h-auto w-full rounded-lg"
                    sizes={size === 'full' ? '100vw' : size === 'large' ? '800px' : size === 'medium' ? '500px' : '300px'}
                  />
                ) : (
                  // Fallback for images without dimensions - use fill mode
                  <div className="relative aspect-video w-full">
                    <Image
                      src={image.url}
                      alt={alt || image.alt || ''}
                      fill
                      className="rounded-lg object-cover"
                      sizes={size === 'full' ? '100vw' : size === 'large' ? '800px' : size === 'medium' ? '500px' : '300px'}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div
                className={cn(
                  'flex h-[200px] items-center justify-center rounded-lg bg-muted text-muted-foreground',
                  sizeClasses[size]
                )}
              >
                No image selected
              </div>
            )}
            {caption && (
              <figcaption className="mt-2 text-sm text-muted-foreground">
                {caption}
              </figcaption>
            )}
          </figure>
        )
      },
    },

    Video: {
      label: 'Video',
      fields: {
        url: {
          type: 'text',
          label: 'Video URL (YouTube/Vimeo)',
        },
        aspectRatio: {
          type: 'select',
          label: 'Aspect Ratio',
          options: [
            { label: '16:9', value: '16:9' },
            { label: '4:3', value: '4:3' },
            { label: '1:1', value: '1:1' },
          ],
        },
        autoplay: {
          type: 'radio',
          label: 'Autoplay',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        caption: {
          type: 'text',
          label: 'Caption',
        },
      },
      defaultProps: {
        url: '',
        aspectRatio: '16:9',
        autoplay: false,
        caption: '',
      },
      render: ({ url, aspectRatio, autoplay, caption }) => {
        /**
         * Video block - embeds YouTube/Vimeo videos with responsive aspect ratio
         * Uses Tailwind aspect-ratio utilities for clean responsive embeds
         * Lazy loading defers iframe load until near viewport for performance
         * @see PUCK-025 for acceptance criteria
         */

        // Map aspect ratio values to Tailwind classes
        const aspectClasses: Record<string, string> = {
          '16:9': 'aspect-video', // 16/9 = 1.777...
          '4:3': 'aspect-[4/3]',
          '1:1': 'aspect-square',
        }

        /**
         * Parse video URL to extract embed URL with optional autoplay param
         * Supports: youtube.com/watch?v=, youtu.be/, vimeo.com/
         */
        const getEmbedUrl = (): string | null => {
          if (!url) return null

          // YouTube patterns: youtube.com/watch?v=ID, youtube.com/embed/ID, youtu.be/ID
          if (url.includes('youtube.com') || url.includes('youtu.be')) {
            // Match watch?v=ID, embed/ID, or youtu.be/ID patterns
            const videoId = url.match(
              /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
            )?.[1]
            if (videoId) {
              const params = new URLSearchParams()
              if (autoplay) {
                params.set('autoplay', '1')
                params.set('mute', '1') // Required for autoplay in most browsers
              }
              const queryString = params.toString()
              return `https://www.youtube.com/embed/${videoId}${queryString ? `?${queryString}` : ''}`
            }
          }

          // Vimeo patterns: vimeo.com/ID, player.vimeo.com/video/ID
          if (url.includes('vimeo.com')) {
            const videoId = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1]
            if (videoId) {
              const params = new URLSearchParams()
              if (autoplay) {
                params.set('autoplay', '1')
                params.set('muted', '1') // Required for autoplay
              }
              const queryString = params.toString()
              return `https://player.vimeo.com/video/${videoId}${queryString ? `?${queryString}` : ''}`
            }
          }

          return null
        }

        const embedUrl = getEmbedUrl()

        return (
          <figure className="w-full">
            <div
              className={cn(
                'relative w-full overflow-hidden rounded-lg',
                aspectClasses[aspectRatio] || 'aspect-video'
              )}
            >
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={caption || 'Embedded video'}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
                  {/* Video placeholder icon */}
                  <svg
                    className="h-12 w-12 opacity-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                  <span className="text-sm">Enter a YouTube or Vimeo URL</span>
                </div>
              )}
            </div>
            {caption && (
              <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                {caption}
              </figcaption>
            )}
          </figure>
        )
      },
    },

    // ========================================================================
    // MARKETING BLOCKS
    // ========================================================================
    FeaturesGrid: {
      label: 'Features Grid',
      fields: {
        items: {
          type: 'array',
          label: 'Features',
          arrayFields: {
            icon: {
              type: 'select',
              label: 'Icon',
              options: ICON_OPTIONS,
            },
            title: { type: 'text', label: 'Title' },
            description: { type: 'textarea', label: 'Description' },
          },
          defaultItemProps: { icon: 'star', title: 'Feature', description: 'Feature description' },
        },
        columns: {
          type: 'select',
          label: 'Columns',
          options: [
            { label: '2 Columns', value: 2 },
            { label: '3 Columns', value: 3 },
            { label: '4 Columns', value: 4 },
          ],
        },
        iconStyle: {
          type: 'select',
          label: 'Icon Style',
          options: [
            { label: 'Filled', value: 'filled' },
            { label: 'Outlined', value: 'outlined' },
          ],
        },
        variant: {
          type: 'select',
          label: 'Style Variant',
          options: [
            { label: 'Default (Clean)', value: 'default' },
            { label: 'Glass (Modern Cards)', value: 'glass' },
            { label: 'Minimal (Subtle)', value: 'minimal' },
            { label: 'Bento (Featured Layout)', value: 'bento' },
          ],
        },
        animate: {
          type: 'radio',
          label: 'Animate',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        items: [
          { icon: 'zap', title: 'Fast', description: 'Lightning fast performance' },
          { icon: 'shield', title: 'Secure', description: 'Enterprise-grade security' },
          { icon: 'heart', title: 'Loved', description: 'Trusted by thousands' },
        ],
        columns: 3,
        iconStyle: 'outlined',
        variant: 'default',
        animate: true,
      },
      render: ({ items, columns, iconStyle, variant, animate }) => {
        /**
         * FeaturesGrid block - displays feature cards with icons and animations
         * Uses PuckFeaturesGrid client component for Framer Motion animations
         * @see PUCK-043 for acceptance criteria
         * @see src/components/puck/FeaturesGrid.tsx for implementation
         */
        return (
          <PuckFeaturesGrid
            items={items}
            columns={columns as 2 | 3 | 4}
            iconStyle={iconStyle as 'filled' | 'outlined'}
            variant={variant as 'default' | 'glass' | 'minimal' | 'bento'}
            animate={animate}
          />
        )
      },
    },

    Testimonials: {
      label: 'Testimonials',
      fields: {
        items: {
          type: 'array',
          label: 'Testimonials',
          arrayFields: {
            quote: { type: 'textarea', label: 'Quote' },
            author: { type: 'text', label: 'Author' },
            title: { type: 'text', label: 'Title/Company' },
            avatar: createMediaExternalField('Avatar'),
          },
          defaultItemProps: { quote: 'Great product!', author: 'John Doe', title: 'CEO', avatar: null },
        },
        layout: {
          type: 'select',
          label: 'Layout',
          options: [
            { label: 'Carousel', value: 'carousel' },
            { label: 'Grid', value: 'grid' },
          ],
        },
        showAvatar: {
          type: 'radio',
          label: 'Show Avatar',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        items: [{ quote: 'This changed everything for us!', author: 'Jane Smith', title: 'CEO, Acme Inc', avatar: null }],
        layout: 'grid',
        showAvatar: true,
      },
      render: ({ items, layout, showAvatar }) => {
        /**
         * Testimonials block - displays customer quotes in carousel or grid layout
         * Carousel uses CSS scroll-snap for smooth horizontal scrolling with navigation
         * Grid uses responsive auto-fit layout for optimal display
         * @see PUCK-022 for acceptance criteria
         */

        // Single testimonial card component
        const TestimonialCard = ({
          item,
          isCarousel,
        }: {
          item: { quote: string; author: string; title: string; avatar: MediaRef | null }
          isCarousel: boolean
        }) => (
          <blockquote
            className={cn(
              'flex flex-col rounded-xl bg-muted/50 p-6 shadow-sm',
              isCarousel ? 'min-w-[320px] snap-center sm:min-w-[400px]' : ''
            )}
          >
            {/* Quote icon */}
            <svg
              className="mb-4 h-8 w-8 text-primary/20"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>

            {/* Quote text */}
            <p className="flex-1 text-base leading-relaxed text-foreground/90 italic">
              &ldquo;{item.quote}&rdquo;
            </p>

            {/* Author section */}
            <footer className="mt-6 flex items-center gap-4">
              {/* Avatar - conditionally rendered based on showAvatar prop */}
              {showAvatar && item.avatar?.url && (
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={item.avatar.url}
                    alt={item.avatar.alt || item.author}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              )}
              {/* Placeholder avatar when no image */}
              {showAvatar && !item.avatar?.url && (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-lg font-semibold">
                    {item.author?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div>
                <div className="font-semibold text-foreground">{item.author}</div>
                <div className="text-sm text-muted-foreground">{item.title}</div>
              </div>
            </footer>
          </blockquote>
        )

        // Carousel layout with horizontal scroll and snap behavior
        if (layout === 'carousel') {
          return (
            <div className="relative">
              {/* Scrollable container with snap points */}
              <div
                className="flex gap-6 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
                style={{
                  // Ensure items at edges can be scrolled fully into view
                  scrollPaddingInline: '1rem',
                }}
              >
                {items.map((item, i) => (
                  <TestimonialCard key={i} item={item} isCarousel={true} />
                ))}
              </div>

              {/* Navigation hint for carousel - shows scroll indicators */}
              {items.length > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                  {items.map((_, i) => (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-full bg-muted-foreground/30"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              )}
            </div>
          )
        }

        // Grid layout - responsive auto-fit columns
        return (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <TestimonialCard key={i} item={item} isCarousel={false} />
            ))}
          </div>
        )
      },
    },

    PricingTable: {
      label: 'Pricing Table',
      fields: {
        tiers: {
          type: 'array',
          label: 'Pricing Tiers',
          arrayFields: {
            name: { type: 'text', label: 'Tier Name' },
            price: { type: 'number', label: 'Price' },
            period: {
              type: 'select',
              label: 'Period',
              options: [
                { label: 'Monthly', value: 'monthly' },
                { label: 'Yearly', value: 'yearly' },
              ],
            },
            features: { type: 'textarea', label: 'Features (one per line)' },
            ctaText: { type: 'text', label: 'CTA Text' },
            ctaLink: { type: 'text', label: 'CTA Link' },
            isHighlighted: { type: 'radio', label: 'Highlight', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
          },
          defaultItemProps: { name: 'Basic', price: 0, period: 'monthly', features: 'Feature 1\nFeature 2', ctaText: 'Get Started', ctaLink: '/signup', isHighlighted: false },
        },
        showToggle: {
          type: 'radio',
          label: 'Show Monthly/Yearly Toggle',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        highlightTier: {
          type: 'number',
          label: 'Highlight Tier Index',
        },
      },
      defaultProps: {
        tiers: [
          { name: 'Free', price: 0, period: 'monthly', features: '5 projects\nBasic support', ctaText: 'Start Free', ctaLink: '/signup', isHighlighted: false },
          { name: 'Pro', price: 29, period: 'monthly', features: 'Unlimited projects\nPriority support\nAnalytics', ctaText: 'Go Pro', ctaLink: '/signup?plan=pro', isHighlighted: true },
        ],
        showToggle: false,
        highlightTier: 1,
      },
      render: ({ tiers }) => {
        /**
         * PricingTable block - displays pricing tier comparison cards
         * Uses responsive grid that stacks on mobile, expands on larger screens
         * Highlighted tiers get primary color background with inverted text/buttons
         * @see PUCK-023 for acceptance criteria
         */

        // Responsive grid based on number of tiers (max 4 columns)
        const getGridClasses = (count: number) => {
          if (count === 1) return 'grid-cols-1 max-w-md mx-auto'
          if (count === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
          if (count === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }

        return (
          <div className={cn('grid gap-6 md:gap-8', getGridClasses(tiers.length))}>
            {tiers.map((tier, i) => {
              const isHighlighted = tier.isHighlighted
              const features = tier.features.split('\n').filter(f => f.trim())

              return (
                <div
                  key={i}
                  className={cn(
                    'relative flex flex-col rounded-2xl p-6 md:p-8',
                    isHighlighted
                      ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 ring-2 ring-primary'
                      : 'bg-muted/50 text-foreground'
                  )}
                >
                  {/* Popular badge for highlighted tier */}
                  {isHighlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-block rounded-full bg-primary-foreground px-3 py-1 text-xs font-semibold text-primary">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Tier name */}
                  <h3 className="text-lg font-semibold">{tier.name}</h3>

                  {/* Price display */}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight md:text-5xl">
                      ${tier.price}
                    </span>
                    <span className={cn(
                      'text-sm',
                      isHighlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      /{tier.period === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>

                  {/* Features list */}
                  <ul className="mt-6 flex-1 space-y-3">
                    {features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle className={cn(
                          'h-5 w-5 flex-shrink-0 mt-0.5',
                          isHighlighted ? 'text-primary-foreground' : 'text-primary'
                        )} />
                        <span className={cn(
                          'text-sm',
                          isHighlighted ? 'text-primary-foreground/90' : 'text-muted-foreground'
                        )}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    className={cn(
                      'mt-8 w-full',
                      isHighlighted
                        ? 'bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                        : ''
                    )}
                    variant={isHighlighted ? 'secondary' : 'default'}
                    size="lg"
                    asChild
                  >
                    <a href={tier.ctaLink}>{tier.ctaText}</a>
                  </Button>
                </div>
              )
            })}
          </div>
        )
      },
    },

    CTABanner: {
      label: 'CTA Banner',
      fields: {
        heading: {
          type: 'text',
          label: 'Heading',
        },
        description: {
          type: 'textarea',
          label: 'Description',
        },
        buttons: {
          type: 'array',
          label: 'Buttons',
          arrayFields: {
            text: { type: 'text', label: 'Button Text' },
            href: { type: 'text', label: 'Link URL' },
            variant: {
              type: 'select',
              label: 'Style',
              options: [
                { label: 'Primary', value: 'primary' },
                { label: 'Secondary', value: 'secondary' },
                { label: 'Outline', value: 'outline' },
              ],
            },
          },
          defaultItemProps: { text: 'Get Started', href: '/', variant: 'primary' },
        },
        backgroundColor: {
          type: 'text',
          label: 'Background Color',
        },
        style: {
          type: 'select',
          label: 'Style',
          options: [
            { label: 'Centered', value: 'centered' },
            { label: 'Left Aligned', value: 'left-aligned' },
          ],
        },
      },
      defaultProps: {
        heading: 'Ready to get started?',
        description: 'Join thousands of happy customers today.',
        buttons: [{ text: 'Get Started', href: '/signup', variant: 'primary' }],
        backgroundColor: '#0070f3',
        style: 'centered',
      },
      render: ({ heading, description, buttons, backgroundColor, style }) => {
        // Determine if background is dark for contrast calculations
        // Simple heuristic: if not white/transparent-ish, assume dark
        const isDarkBg = backgroundColor && backgroundColor !== 'transparent' && !backgroundColor.match(/^#f|^white|^rgb\(2[45]\d/i)

        // Map CTA variants to shadcn Button - on dark backgrounds, invert colors
        const getButtonVariant = (variant: string): 'default' | 'secondary' | 'outline' => {
          if (variant === 'primary') return 'default'
          if (variant === 'secondary') return 'secondary'
          return 'outline'
        }

        return (
          <div
            className={cn(
              'rounded-xl px-6 py-12 sm:px-8 md:py-16',
              style === 'centered' ? 'text-center' : 'text-left'
            )}
            style={{ backgroundColor }}
          >
            <div className="mx-auto max-w-3xl">
              <h2
                className={cn(
                  'text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl',
                  isDarkBg ? 'text-white' : 'text-foreground'
                )}
              >
                {heading}
              </h2>
              {description && (
                <p
                  className={cn(
                    'mt-3 text-base sm:text-lg md:text-xl',
                    isDarkBg ? 'text-white/90' : 'text-muted-foreground'
                  )}
                >
                  {description}
                </p>
              )}
              {buttons.length > 0 && (
                <div
                  className={cn(
                    'mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4',
                    style === 'centered' ? 'justify-center' : 'justify-start'
                  )}
                >
                  {buttons.map((btn, i) => (
                    <Button
                      key={i}
                      variant={getButtonVariant(btn.variant)}
                      size="lg"
                      asChild
                      className={cn(
                        // On dark backgrounds: primary buttons stay default, others get white text/border
                        isDarkBg && btn.variant === 'primary' && 'bg-white text-foreground hover:bg-white/90',
                        isDarkBg && btn.variant !== 'primary' && 'border-white text-white hover:bg-white/20'
                      )}
                    >
                      <a href={btn.href}>{btn.text}</a>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      },
    },

    FAQAccordion: {
      label: 'FAQ Accordion',
      fields: {
        items: {
          type: 'array',
          label: 'Questions',
          arrayFields: {
            question: { type: 'text', label: 'Question' },
            answer: { type: 'textarea', label: 'Answer' },
          },
          defaultItemProps: { question: 'How does it work?', answer: 'It works great!' },
        },
        allowMultiple: {
          type: 'radio',
          label: 'Allow Multiple Open',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        defaultOpen: {
          type: 'number',
          label: 'Default Open Index',
        },
      },
      defaultProps: {
        items: [
          { question: 'How does it work?', answer: 'Simply upload photos, record your voice, and get a professional project page.' },
          { question: 'Is there a free plan?', answer: 'Yes! Our free plan includes 5 projects.' },
        ],
        allowMultiple: false,
        defaultOpen: null,
      },
      render: ({ items, allowMultiple, defaultOpen }) => {
        /**
         * FAQ Accordion block - animated expandable Q&A section
         * Uses PuckFAQAccordion client component for Framer Motion animations
         * Built on Radix UI primitives for full accessibility (keyboard nav, ARIA)
         * Features smooth height animations and chevron rotation
         * @see PUCK-045 for animation acceptance criteria
         * @see src/components/puck/FAQAccordion.tsx for implementation
         */
        return (
          <PuckFAQAccordion
            items={items}
            allowMultiple={allowMultiple}
            defaultOpen={defaultOpen}
          />
        )
      },
    },

    Stats: {
      label: 'Stats',
      fields: {
        items: {
          type: 'array',
          label: 'Stats',
          arrayFields: {
            number: { type: 'text', label: 'Number' },
            label: { type: 'text', label: 'Label' },
            prefix: { type: 'text', label: 'Prefix' },
            suffix: { type: 'text', label: 'Suffix' },
            icon: {
              type: 'select',
              label: 'Icon (optional)',
              options: [
                { label: 'None', value: '' },
                { label: '⚡ Zap', value: 'Zap' },
                { label: '🎯 Target', value: 'Target' },
                { label: '🏆 Award', value: 'Award' },
                { label: '👥 Users', value: 'Users' },
                { label: '📈 TrendingUp', value: 'TrendingUp' },
                { label: '⏱️ Clock', value: 'Clock' },
                { label: '🌍 Globe', value: 'Globe' },
                { label: '✅ CheckCircle', value: 'CheckCircle' },
                { label: '💡 Lightbulb', value: 'Lightbulb' },
                { label: '🚀 Rocket', value: 'Rocket' },
                { label: '❤️ Heart', value: 'Heart' },
                { label: '⭐ Star', value: 'Star' },
              ],
            },
          },
          defaultItemProps: { number: '100', label: 'Projects', prefix: '', suffix: '+', icon: '' },
        },
        columns: {
          type: 'select',
          label: 'Columns',
          options: [
            { label: '2 Columns', value: 2 },
            { label: '3 Columns', value: 3 },
            { label: '4 Columns', value: 4 },
          ],
        },
        style: {
          type: 'select',
          label: 'Style',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Card', value: 'card' },
            { label: 'Minimal', value: 'minimal' },
            { label: 'Glass (Modern)', value: 'glass' },
            { label: 'Gradient', value: 'gradient' },
          ],
        },
        gradient: {
          type: 'select',
          label: 'Gradient (if style is Gradient)',
          options: fieldOptions.gradients,
        },
        animate: {
          type: 'radio',
          label: 'Animate Numbers',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        items: [
          { number: '500', label: 'Projects', prefix: '', suffix: '+', icon: 'Target' },
          { number: '98', label: 'Satisfaction', prefix: '', suffix: '%', icon: 'Heart' },
          { number: '24', label: 'Support', prefix: '', suffix: '/7', icon: 'Clock' },
        ],
        columns: 3,
        style: 'default',
        gradient: 'ocean',
        animate: true,
      },
      render: ({ items, columns, style, gradient, animate }) => {
        /**
         * Stats block - Animated key metrics display with multiple style variants
         *
         * Features:
         * - Animated counters that count up from 0 on scroll into view
         * - Five style variants: default, card, minimal, glass, gradient
         * - Optional icon support for each stat
         * - Staggered entrance animations with Framer Motion
         * - Respects prefers-reduced-motion accessibility setting
         *
         * @see PUCK-042 for acceptance criteria (animated upgrade)
         * @see PUCK-026 for original implementation criteria
         */
        return (
          <PuckStats
            items={items}
            columns={columns as 2 | 3 | 4}
            style={style}
            gradient={gradient}
            animate={animate}
          />
        )
      },
    },

    // ========================================================================
    // BLOG BLOCKS
    // ========================================================================
    CodeBlock: {
      label: 'Code Block',
      fields: {
        code: {
          type: 'textarea',
          label: 'Code',
        },
        language: {
          type: 'select',
          label: 'Language',
          options: [
            { label: 'JavaScript', value: 'javascript' },
            { label: 'TypeScript', value: 'typescript' },
            { label: 'Python', value: 'python' },
            { label: 'Bash', value: 'bash' },
            { label: 'JSON', value: 'json' },
            { label: 'HTML', value: 'html' },
            { label: 'CSS', value: 'css' },
            { label: 'SQL', value: 'sql' },
          ],
        },
        showLineNumbers: {
          type: 'radio',
          label: 'Show Line Numbers',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        filename: {
          type: 'text',
          label: 'Filename',
        },
      },
      defaultProps: {
        code: 'console.log("Hello, world!");',
        language: 'javascript',
        showLineNumbers: true,
        filename: '',
      },
      render: ({ code, language, showLineNumbers, filename }) => (
        <PuckCodeBlock
          code={code}
          language={language}
          showLineNumbers={showLineNumbers}
          filename={filename}
        />
      ),
    },

    /**
     * Callout/Alert Block (PUCK-028)
     *
     * Displays styled alert boxes for info, warnings, tips, success, and error states.
     * Uses shadcn Alert component for design system consistency and accessibility.
     *
     * @see src/components/ui/alert.tsx for underlying Alert component
     * @see https://ui.shadcn.com/docs/components/alert for shadcn docs
     */
    Callout: {
      label: 'Callout',
      fields: {
        type: {
          type: 'select',
          label: 'Type',
          options: [
            { label: 'Info', value: 'info' },
            { label: 'Warning', value: 'warning' },
            { label: 'Success', value: 'success' },
            { label: 'Error', value: 'error' },
            { label: 'Tip', value: 'tip' },
          ],
        },
        title: {
          type: 'text',
          label: 'Title',
        },
        content: {
          type: 'textarea',
          label: 'Content',
        },
      },
      defaultProps: {
        type: 'info',
        title: 'Note',
        content: 'This is important information.',
      },
      render: ({ type, title, content }) => {
        /**
         * Callout type configuration mapping.
         * Each type has:
         * - Icon: Lucide icon component for visual identification
         * - className: Tailwind classes for background, border, and text colors
         *
         * Colors designed for WCAG AA contrast compliance.
         */
        const typeConfig: Record<
          CalloutProps['type'],
          { Icon: LucideIcon; className: string }
        > = {
          info: {
            Icon: Info,
            className: 'border-blue-500 bg-blue-50 text-blue-900 [&>svg]:text-blue-600 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-700 dark:[&>svg]:text-blue-400',
          },
          warning: {
            Icon: AlertTriangle,
            className: 'border-amber-500 bg-amber-50 text-amber-900 [&>svg]:text-amber-600 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-700 dark:[&>svg]:text-amber-400',
          },
          success: {
            Icon: CircleCheck,
            className: 'border-green-500 bg-green-50 text-green-900 [&>svg]:text-green-600 dark:bg-green-950 dark:text-green-100 dark:border-green-700 dark:[&>svg]:text-green-400',
          },
          error: {
            Icon: CircleX,
            className: 'border-red-500 bg-red-50 text-red-900 [&>svg]:text-red-600 dark:bg-red-950 dark:text-red-100 dark:border-red-700 dark:[&>svg]:text-red-400',
          },
          tip: {
            Icon: Lightbulb,
            className: 'border-purple-500 bg-purple-50 text-purple-900 [&>svg]:text-purple-600 dark:bg-purple-950 dark:text-purple-100 dark:border-purple-700 dark:[&>svg]:text-purple-400',
          },
        }

        const { Icon, className } = typeConfig[type]

        return (
          <Alert className={cn('border-l-4', className)}>
            <Icon className="h-4 w-4" />
            {title && <AlertTitle>{title}</AlertTitle>}
            <AlertDescription className="whitespace-pre-wrap leading-relaxed">
              {content}
            </AlertDescription>
          </Alert>
        )
      },
    },

    Table: {
      label: 'Table',
      fields: {
        headers: {
          type: 'array',
          label: 'Headers',
          arrayFields: {
            value: { type: 'text', label: 'Header' },
          },
          defaultItemProps: { value: 'Column' },
        },
        rows: {
          type: 'array',
          label: 'Rows',
          arrayFields: {
            cells: { type: 'textarea', label: 'Cells (one per line)' },
          },
          defaultItemProps: { cells: 'Cell 1\nCell 2\nCell 3' },
        },
        striped: {
          type: 'radio',
          label: 'Striped',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        bordered: {
          type: 'radio',
          label: 'Bordered',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        headers: [{ value: 'Name' }, { value: 'Value' }, { value: 'Status' }],
        rows: [
          { cells: 'Item A\n100\nActive' },
          { cells: 'Item B\n200\nPending' },
        ],
        striped: true,
        bordered: true,
      },
      render: ({ headers, rows, striped, bordered }) => {
        /**
         * Table block - displays data in responsive rows/columns
         * Uses shadcn Table components with Tailwind styling
         * Horizontal scroll container ensures mobile usability
         * @see PUCK-029 for acceptance criteria
         */
        return (
          <ShadcnTable
            className={cn(
              bordered && 'border',
              // Override shadcn default hover states when not needed
              '[&_tr]:transition-none'
            )}
          >
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {headers.map((h: { value: string }, i: number) => (
                  <TableHead
                    key={i}
                    className={cn(
                      'font-semibold',
                      bordered && 'border'
                    )}
                  >
                    {h.value}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row: { cells: string }, i: number) => (
                <TableRow
                  key={i}
                  className={cn(
                    'hover:bg-transparent',
                    striped && i % 2 === 1 && 'bg-muted/30'
                  )}
                >
                  {row.cells.split('\n').map((cell: string, j: number) => (
                    <TableCell
                      key={j}
                      className={cn(bordered && 'border')}
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </ShadcnTable>
        )
      },
    },

    ImageGallery: {
      label: 'Image Gallery',
      fields: {
        images: {
          type: 'array',
          label: 'Images',
          arrayFields: {
            image: createMediaExternalField('Image'),
          },
          defaultItemProps: { image: null },
          getItemSummary: (item: { image: MediaRef | null }) => item?.image?.alt || 'No image selected',
        },
        columns: {
          type: 'select',
          label: 'Columns',
          options: [
            { label: '2 Columns', value: 2 },
            { label: '3 Columns', value: 3 },
            { label: '4 Columns', value: 4 },
          ],
        },
        lightbox: {
          type: 'radio',
          label: 'Enable Lightbox',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
      },
      defaultProps: {
        images: [],
        columns: 3,
        lightbox: true,
      },
      render: ({ images, columns, lightbox }) => (
        <PuckImageGallery images={images} columns={columns} lightbox={lightbox} />
      ),
    },
  },
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Type for Puck page data
 * Used for type-safe data handling in API routes and components
 */
export type PuckPageData = Data

/**
 * Default export for convenience
 */
export default config
