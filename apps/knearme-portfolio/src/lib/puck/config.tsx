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
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
 */
export interface HeroProps {
  heading: string
  subheading: string
  backgroundImage: MediaRef | null
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
 */
export interface FeaturesGridProps {
  items: Array<{
    icon: string // lucide icon name
    title: string
    description: string
  }>
  columns: 2 | 3 | 4
  iconStyle: 'filled' | 'outlined'
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
  }>
  columns: 2 | 3 | 4
  style: 'default' | 'card' | 'minimal'
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
// SPACING UTILITIES (for blocks using inline styles)
// ============================================================================

/**
 * Gap values for CSS grid/flex layouts (used by Columns block)
 * @see Section block uses Tailwind classes directly for better consistency
 */
const gapMap = {
  none: '0',
  sm: '1rem',
  md: '2rem',
  lg: '4rem',
}

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
        const layoutMap: Record<string, string[]> = {
          '50-50': ['1fr', '1fr'],
          '33-33-33': ['1fr', '1fr', '1fr'],
          '25-75': ['1fr', '3fr'],
          '75-25': ['3fr', '1fr'],
          '33-66': ['1fr', '2fr'],
          '66-33': ['2fr', '1fr'],
        }
        const columns = layoutMap[layout] || ['1fr', '1fr']
        const alignMap = { top: 'flex-start', center: 'center', bottom: 'flex-end' }

        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: columns.join(' '),
              gap: gapMap[gap],
              alignItems: alignMap[verticalAlign],
            }}
          >
            {columns.map((_, i) => (
              <div key={i}>{puck.renderDropZone({ zone: `column-${i}` })}</div>
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
      render: ({ size, customSize }) => {
        const sizeMap = { sm: 16, md: 32, lg: 64, xl: 96, custom: customSize }
        return (
          <div
            style={{
              height: `${sizeMap[size]}px`,
              border: '1px dashed #e5e5e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a0a0a0',
              fontSize: '12px',
            }}
          >
            Spacer ({sizeMap[size]}px)
          </div>
        )
      },
    },

    // ========================================================================
    // CONTENT BLOCKS
    // ========================================================================
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
        backgroundImage: createMediaExternalField('Background Image'),
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
        backgroundImage: null,
        alignment: 'center',
        ctaButtons: [{ text: 'Get Started', href: '/signup', variant: 'primary' }],
      },
      render: ({ heading, subheading, backgroundImage, alignment, ctaButtons }) => {
        // Map alignment to Tailwind classes
        const alignmentClasses = {
          left: { text: 'text-left', items: 'justify-start' },
          center: { text: 'text-center', items: 'justify-center' },
          right: { text: 'text-right', items: 'justify-end' },
        } as const
        const align = alignmentClasses[alignment]

        // Map CTA button variants to shadcn Button variants
        const variantMap: Record<string, 'default' | 'secondary' | 'outline'> = {
          primary: 'default',
          secondary: 'secondary',
          outline: 'outline',
        }

        // Determine if we have a background image
        const hasBackgroundImage = backgroundImage?.url

        return (
          <div
            className={cn(
              'relative py-16 px-4 sm:py-20 sm:px-6 md:py-24 lg:py-32',
              hasBackgroundImage ? 'bg-cover bg-center bg-no-repeat' : 'bg-muted'
            )}
            style={hasBackgroundImage ? { backgroundImage: `url(${backgroundImage.url})` } : undefined}
          >
            {/* Overlay for background image readability */}
            {hasBackgroundImage && (
              <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
            )}

            {/* Content container */}
            <div
              className={cn(
                'relative z-10 mx-auto max-w-4xl',
                align.text
              )}
            >
              <h1
                className={cn(
                  'text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl',
                  hasBackgroundImage ? 'text-white' : 'text-foreground'
                )}
              >
                {heading}
              </h1>

              {subheading && (
                <p
                  className={cn(
                    'mt-4 text-lg sm:text-xl md:text-2xl',
                    hasBackgroundImage ? 'text-white/90' : 'text-muted-foreground'
                  )}
                >
                  {subheading}
                </p>
              )}

              {/* CTA Buttons */}
              {ctaButtons.length > 0 && (
                <div
                  className={cn(
                    'mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4',
                    align.items
                  )}
                >
                  {ctaButtons.map((btn, i) => (
                    <Button
                      key={i}
                      variant={variantMap[btn.variant] || 'default'}
                      size="lg"
                      asChild
                      className={cn(
                        // Override colors for outline/secondary on dark backgrounds
                        hasBackgroundImage && btn.variant !== 'primary' && 'border-white text-white hover:bg-white/20'
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
        color: '#111',
      },
      render: ({ text, level, alignment, color }) => {
        const sizeMap: Record<string, string> = {
          h1: '2.5rem',
          h2: '2rem',
          h3: '1.75rem',
          h4: '1.5rem',
          h5: '1.25rem',
          h6: '1rem',
        }
        const style = { textAlign: alignment as React.CSSProperties['textAlign'], color, fontSize: sizeMap[level], fontWeight: 700 }
        // Use explicit elements to avoid JSX namespace issues
        switch (level) {
          case 'h1': return <h1 style={style}>{text}</h1>
          case 'h2': return <h2 style={style}>{text}</h2>
          case 'h3': return <h3 style={style}>{text}</h3>
          case 'h4': return <h4 style={style}>{text}</h4>
          case 'h5': return <h5 style={style}>{text}</h5>
          case 'h6': return <h6 style={style}>{text}</h6>
          default: return <h2 style={style}>{text}</h2>
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
        const widthMap = { small: '300px', medium: '500px', large: '800px', full: '100%' }
        const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' }
        return (
          <figure style={{ display: 'flex', flexDirection: 'column', alignItems: justifyMap[alignment] }}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.url}
                alt={alt || image.alt}
                style={{ maxWidth: widthMap[size], height: 'auto', borderRadius: '0.5rem' }}
              />
            ) : (
              <div
                style={{
                  width: widthMap[size],
                  height: '200px',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  borderRadius: '0.5rem',
                }}
              >
                No image selected
              </div>
            )}
            {caption && (
              <figcaption style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
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
      render: ({ url, aspectRatio, caption }) => {
        const ratioMap = { '16:9': '56.25%', '4:3': '75%', '1:1': '100%' }
        // Extract video ID from YouTube/Vimeo URLs
        let embedUrl = ''
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1]
          if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`
        } else if (url.includes('vimeo.com')) {
          const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1]
          if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`
        }

        return (
          <figure>
            <div style={{ position: 'relative', paddingBottom: ratioMap[aspectRatio], height: 0 }}>
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                  }}
                >
                  Enter a YouTube or Vimeo URL
                </div>
              )}
            </div>
            {caption && (
              <figcaption style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem', textAlign: 'center' }}>
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
            icon: { type: 'text', label: 'Icon (lucide name)' },
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
      },
      defaultProps: {
        items: [
          { icon: 'zap', title: 'Fast', description: 'Lightning fast performance' },
          { icon: 'shield', title: 'Secure', description: 'Enterprise-grade security' },
          { icon: 'heart', title: 'Loved', description: 'Trusted by thousands' },
        ],
        columns: 3,
        iconStyle: 'outlined',
      },
      render: ({ items, columns }) => (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '2rem' }}>
          {items.map((item, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{item.title}</h3>
              <p style={{ color: '#666', fontSize: '0.875rem' }}>{item.description}</p>
            </div>
          ))}
        </div>
      ),
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
      render: ({ items, layout }) => (
        <div
          style={{
            display: layout === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            overflow: layout === 'carousel' ? 'auto' : undefined,
          }}
        >
          {items.map((item, i) => (
            <blockquote
              key={i}
              style={{
                padding: '1.5rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '0.5rem',
                minWidth: layout === 'carousel' ? '300px' : undefined,
              }}
            >
              <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>&ldquo;{item.quote}&rdquo;</p>
              <footer style={{ fontWeight: 600 }}>
                {item.author}
                <span style={{ color: '#666', fontWeight: 400 }}> — {item.title}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      ),
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
      render: ({ tiers }) => (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tiers.length}, 1fr)`, gap: '2rem' }}>
          {tiers.map((tier, i) => (
            <div
              key={i}
              style={{
                padding: '2rem',
                backgroundColor: tier.isHighlighted ? '#0070f3' : '#f8f9fa',
                color: tier.isHighlighted ? '#fff' : 'inherit',
                borderRadius: '0.75rem',
                textAlign: 'center',
              }}
            >
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{tier.name}</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                ${tier.price}
                <span style={{ fontSize: '1rem', fontWeight: 400 }}>/{tier.period === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '1.5rem 0', textAlign: 'left' }}>
                {tier.features.split('\n').map((f, j) => (
                  <li key={j} style={{ marginBottom: '0.5rem' }}>✓ {f}</li>
                ))}
              </ul>
              <a
                href={tier.ctaLink}
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 2rem',
                  backgroundColor: tier.isHighlighted ? '#fff' : '#0070f3',
                  color: tier.isHighlighted ? '#0070f3' : '#fff',
                  borderRadius: '0.375rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                {tier.ctaText}
              </a>
            </div>
          ))}
        </div>
      ),
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
      render: ({ heading, description, buttons, backgroundColor, style }) => (
        <div
          style={{
            padding: '4rem 2rem',
            backgroundColor,
            color: '#fff',
            textAlign: style === 'centered' ? 'center' : 'left',
            borderRadius: '0.75rem',
          }}
        >
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{heading}</h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>{description}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: style === 'centered' ? 'center' : 'flex-start' }}>
            {buttons.map((btn, i) => (
              <a
                key={i}
                href={btn.href}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: btn.variant === 'primary' ? '#fff' : 'transparent',
                  color: btn.variant === 'primary' ? backgroundColor : '#fff',
                  border: btn.variant === 'outline' ? '1px solid #fff' : 'none',
                  borderRadius: '0.375rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                {btn.text}
              </a>
            ))}
          </div>
        </div>
      ),
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
      render: ({ items }) => (
        <div style={{ border: '1px solid #e5e5e5', borderRadius: '0.5rem' }}>
          {items.map((item, i) => (
            <details key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid #e5e5e5' : 'none' }}>
              <summary
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  backgroundColor: '#f8f9fa',
                }}
              >
                {item.question}
              </summary>
              <div style={{ padding: '1rem', color: '#666' }}>{item.answer}</div>
            </details>
          ))}
        </div>
      ),
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
          },
          defaultItemProps: { number: '100', label: 'Projects', prefix: '', suffix: '+' },
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
          ],
        },
      },
      defaultProps: {
        items: [
          { number: '500', label: 'Projects', prefix: '', suffix: '+' },
          { number: '98', label: 'Satisfaction', prefix: '', suffix: '%' },
          { number: '24', label: 'Support', prefix: '', suffix: '/7' },
        ],
        columns: 3,
        style: 'default',
      },
      render: ({ items, columns, style }) => (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '2rem',
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                padding: style === 'card' ? '2rem' : '1rem',
                backgroundColor: style === 'card' ? '#f8f9fa' : 'transparent',
                borderRadius: style === 'card' ? '0.5rem' : 0,
              }}
            >
              <div style={{ fontSize: '3rem', fontWeight: 700, color: '#0070f3' }}>
                {item.prefix}{item.number}{item.suffix}
              </div>
              <div style={{ color: '#666', fontWeight: 500 }}>{item.label}</div>
            </div>
          ))}
        </div>
      ),
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
      render: ({ code, language, filename }) => (
        <div style={{ borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: '#24292e' }}>
          {filename && (
            <div style={{ padding: '0.5rem 1rem', backgroundColor: '#1e1e1e', color: '#999', fontSize: '0.75rem' }}>
              {filename}
            </div>
          )}
          <pre
            style={{
              margin: 0,
              padding: '1rem',
              overflow: 'auto',
              fontSize: '0.875rem',
              color: '#e1e4e8',
              fontFamily: 'monospace',
            }}
          >
            <code data-language={language}>{code}</code>
          </pre>
        </div>
      ),
    },

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
        const colorMap = {
          info: { bg: '#e7f3ff', border: '#0070f3', icon: 'ℹ️' },
          warning: { bg: '#fff8e6', border: '#f5a623', icon: '⚠️' },
          success: { bg: '#e6fff0', border: '#50c878', icon: '✅' },
          error: { bg: '#ffe6e6', border: '#ff4444', icon: '❌' },
          tip: { bg: '#f0e6ff', border: '#9b59b6', icon: '💡' },
        }
        const colors = colorMap[type]
        return (
          <div
            style={{
              padding: '1rem',
              backgroundColor: colors.bg,
              borderLeft: `4px solid ${colors.border}`,
              borderRadius: '0.375rem',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
              {colors.icon} {title}
            </div>
            <div style={{ color: '#333' }}>{content}</div>
          </div>
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
      render: ({ headers, rows, striped, bordered }) => (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: bordered ? '1px solid #e5e5e5' : 'none',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                {headers.map((h: { value: string }, i: number) => (
                  <th
                    key={i}
                    style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      borderBottom: '2px solid #e5e5e5',
                      border: bordered ? '1px solid #e5e5e5' : undefined,
                    }}
                  >
                    {h.value}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: { cells: string }, i: number) => (
                <tr
                  key={i}
                  style={{
                    backgroundColor: striped && i % 2 === 1 ? '#f8f9fa' : 'transparent',
                  }}
                >
                  {row.cells.split('\n').map((cell: string, j: number) => (
                    <td
                      key={j}
                      style={{
                        padding: '0.75rem',
                        borderBottom: '1px solid #e5e5e5',
                        border: bordered ? '1px solid #e5e5e5' : undefined,
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
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
      render: ({ images, columns }) => {
        // Filter out items with no image selected and type guard to ensure image is not null
        const validImages = images.filter(
          (item): item is { image: MediaRef } => item?.image != null && Boolean(item.image.url)
        )
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: '1rem',
            }}
          >
            {validImages.length > 0 ? (
              validImages.map((item, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={item.image.url}
                  alt={item.image.alt || `Gallery image ${i + 1}`}
                  style={{ width: '100%', height: 'auto', borderRadius: '0.5rem', cursor: 'pointer' }}
                />
              ))
            ) : (
              <div
                style={{
                  gridColumn: `span ${columns}`,
                  padding: '2rem',
                  backgroundColor: '#f0f0f0',
                  textAlign: 'center',
                  color: '#999',
                  borderRadius: '0.5rem',
                }}
              >
                No images selected. Add images via the fields panel.
              </div>
            )}
          </div>
        )
      },
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
