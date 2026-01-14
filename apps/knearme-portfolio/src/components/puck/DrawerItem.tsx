/**
 * Custom Puck Drawer Item with Thumbnails
 *
 * Renders block items in the component drawer with visual icon previews.
 * Uses Lucide icons to represent each block type for quick visual identification.
 *
 * @see PUCK-031 for acceptance criteria
 * @see https://puckeditor.com/docs/extending-puck/ui-overrides for drawerItem override
 */
'use client'

import {
  LayoutTemplate,
  Columns3,
  Minus,
  Image,
  Type,
  Heading1,
  Video,
  Grid3X3,
  Quote,
  CreditCard,
  Megaphone,
  HelpCircle,
  BarChart3,
  Code2,
  AlertCircle,
  Table2,
  Images,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Block icon mapping - each block type has a corresponding Lucide icon
 * Icons chosen to visually represent the block's purpose
 */
const BLOCK_ICONS: Record<string, LucideIcon> = {
  // Layout blocks
  Section: LayoutTemplate,
  Columns: Columns3,
  Spacer: Minus,
  // Content blocks
  Hero: Image,
  RichText: Type,
  Heading: Heading1,
  Image: Image,
  Video: Video,
  // Marketing blocks
  FeaturesGrid: Grid3X3,
  Testimonials: Quote,
  PricingTable: CreditCard,
  CTABanner: Megaphone,
  FAQAccordion: HelpCircle,
  Stats: BarChart3,
  // Blog blocks
  CodeBlock: Code2,
  Callout: AlertCircle,
  Table: Table2,
  ImageGallery: Images,
}

/**
 * Block color mapping - each category has a distinct accent color
 * Helps users quickly identify block types by category
 */
const BLOCK_COLORS: Record<string, string> = {
  // Layout - blue
  Section: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  Columns: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  Spacer: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  // Content - green
  Hero: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  RichText: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  Heading: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  Image: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  Video: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  // Marketing - purple
  FeaturesGrid: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  Testimonials: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  PricingTable: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  CTABanner: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  FAQAccordion: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  Stats: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  // Blog - orange
  CodeBlock: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  Callout: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  Table: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  ImageGallery: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
}

/**
 * Human-readable labels for blocks (since Puck uses PascalCase internally)
 */
const BLOCK_LABELS: Record<string, string> = {
  Section: 'Section',
  Columns: 'Columns',
  Spacer: 'Spacer',
  Hero: 'Hero',
  RichText: 'Rich Text',
  Heading: 'Heading',
  Image: 'Image',
  Video: 'Video',
  FeaturesGrid: 'Features Grid',
  Testimonials: 'Testimonials',
  PricingTable: 'Pricing Table',
  CTABanner: 'CTA Banner',
  FAQAccordion: 'FAQ Accordion',
  Stats: 'Stats',
  CodeBlock: 'Code Block',
  Callout: 'Callout',
  Table: 'Table',
  ImageGallery: 'Image Gallery',
}

interface DrawerItemProps {
  /** Block component name from Puck config */
  name: string
  /** Optional children (default Puck content) */
  children?: React.ReactNode
}

/**
 * Custom drawer item component with icon thumbnails
 *
 * Renders a visual preview card for each block in the component drawer:
 * - Icon representing the block type
 * - Color-coded by category (layout, content, marketing, blog)
 * - Human-readable label
 * - Hover effect for interactivity
 */
export function DrawerItem({ name }: DrawerItemProps) {
  const Icon = BLOCK_ICONS[name] || LayoutTemplate
  const colorClass = BLOCK_COLORS[name] || 'bg-gray-100 text-gray-700'
  const label = BLOCK_LABELS[name] || name

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3',
        'transition-all duration-200 hover:border-border hover:shadow-sm',
        'cursor-grab active:cursor-grabbing'
      )}
    >
      {/* Icon thumbnail */}
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md',
          colorClass
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Label */}
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  )
}

export default DrawerItem
