'use client'

/**
 * Animated FeaturesGrid Block Component for Puck Visual Editor
 *
 * Features:
 * - Three style variants: glass (modern glassmorphism), minimal (clean), bento (featured layout)
 * - Staggered fade-in animation on scroll into view
 * - Hover effects: cards lift with shadow progression
 * - Icons animate on hover (scale + rotate)
 * - Gradient border animation on hover for glass variant
 * - Respects prefers-reduced-motion accessibility setting
 *
 * @see PUCK-043 for acceptance criteria
 * @see src/lib/puck/design-system.ts for animation configurations
 * @see src/components/puck/Stats.tsx for reference implementation
 */

import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { animations, glass } from '@/lib/puck/design-system'
import {
  Zap,
  Shield,
  Heart,
  Star,
  Sparkles,
  Rocket,
  Globe,
  Lock,
  Cloud,
  Users,
  Target,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  Lightbulb,
  Settings,
  Code,
  Layers,
  Database,
  Cpu,
  Wifi,
  Bell,
  Mail,
  MessageCircle,
  Phone,
  Calendar,
  Search,
  Home,
  Building,
  Briefcase,
  DollarSign,
  CreditCard,
  ShoppingCart,
  Package,
  type LucideIcon,
} from 'lucide-react'

// ============================================================================
// ICON MAP (matches config.tsx LUCIDE_ICON_MAP)
// ============================================================================

/**
 * Map of icon names to Lucide components for FeaturesGrid block.
 * Curated list of 36 marketing-relevant icons.
 */
const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap,
  shield: Shield,
  heart: Heart,
  star: Star,
  sparkles: Sparkles,
  rocket: Rocket,
  globe: Globe,
  lock: Lock,
  cloud: Cloud,
  users: Users,
  target: Target,
  award: Award,
  'trending-up': TrendingUp,
  clock: Clock,
  'check-circle': CheckCircle,
  lightbulb: Lightbulb,
  settings: Settings,
  code: Code,
  layers: Layers,
  database: Database,
  cpu: Cpu,
  wifi: Wifi,
  bell: Bell,
  mail: Mail,
  'message-circle': MessageCircle,
  phone: Phone,
  calendar: Calendar,
  search: Search,
  home: Home,
  building: Building,
  briefcase: Briefcase,
  'dollar-sign': DollarSign,
  'credit-card': CreditCard,
  'shopping-cart': ShoppingCart,
  package: Package,
}

/**
 * Get Lucide icon component by name with fallback
 */
function getLucideIcon(name: string): LucideIcon {
  return LUCIDE_ICON_MAP[name] || Star
}

// ============================================================================
// TYPES
// ============================================================================

export interface FeatureItem {
  icon: string
  title: string
  description: string
  featured?: boolean // For bento layout
}

export interface PuckFeaturesGridProps {
  items: FeatureItem[]
  columns: 2 | 3 | 4
  iconStyle: 'filled' | 'outlined'
  variant: 'default' | 'glass' | 'minimal' | 'bento'
  animate?: boolean
}

// ============================================================================
// SINGLE FEATURE CARD COMPONENT
// ============================================================================

interface FeatureCardProps {
  item: FeatureItem
  iconStyle: 'filled' | 'outlined'
  variant: PuckFeaturesGridProps['variant']
  shouldAnimate: boolean
  index: number
  isFeatured?: boolean
}

function FeatureCard({
  item,
  iconStyle,
  variant,
  shouldAnimate,
  index,
  isFeatured = false,
}: FeatureCardProps) {
  const IconComponent = getLucideIcon(item.icon)
  const isFilled = iconStyle === 'filled'

  // Base card styles by variant
  const cardStyles: Record<string, string> = {
    default: 'p-6 rounded-lg',
    glass: cn(
      glass.medium.className,
      'p-6 rounded-xl relative overflow-hidden',
      'before:absolute before:inset-0 before:rounded-xl before:border before:border-transparent',
      'before:transition-colors before:duration-300',
      'hover:before:border-primary/30'
    ),
    minimal: 'p-4',
    bento: cn(
      'p-6 rounded-xl bg-muted/30 border border-border/50',
      isFeatured && 'md:col-span-2 md:row-span-2'
    ),
  }

  // Icon container styles by variant
  const iconContainerStyles: Record<string, string> = {
    default: isFilled
      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
      : 'bg-muted text-foreground',
    glass: isFilled
      ? 'bg-primary/90 text-primary-foreground shadow-lg'
      : 'bg-background/60 text-foreground border border-border/50',
    minimal: isFilled
      ? 'bg-primary text-primary-foreground'
      : 'bg-muted/50 text-muted-foreground',
    bento: isFilled
      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
      : 'bg-muted text-foreground',
  }

  // Hover shadow progression
  const hoverShadow = variant === 'glass' || variant === 'bento'
    ? 'hover:shadow-lg hover:shadow-primary/10'
    : 'hover:shadow-md'

  return (
    <motion.div
      variants={animations.variants.fadeUp}
      custom={index}
      className={cn(
        'flex flex-col items-center text-center transition-all duration-300',
        cardStyles[variant] || cardStyles.default,
        shouldAnimate && hoverShadow
      )}
      whileHover={shouldAnimate ? {
        y: -8,
        transition: { duration: 0.25, ease: 'easeOut' }
      } : undefined}
    >
      {/* Icon container with hover animation */}
      <motion.div
        className={cn(
          'mb-4 flex items-center justify-center rounded-xl',
          isFeatured ? 'h-16 w-16' : 'h-12 w-12',
          iconContainerStyles[variant] || iconContainerStyles.default
        )}
        whileHover={shouldAnimate ? {
          scale: 1.1,
          rotate: 5,
          transition: { duration: 0.2, ease: 'easeOut' }
        } : undefined}
      >
        <IconComponent className={cn(
          isFeatured ? 'h-8 w-8' : 'h-6 w-6'
        )} />
      </motion.div>

      {/* Title */}
      <h3 className={cn(
        'font-semibold mb-2',
        isFeatured ? 'text-xl md:text-2xl' : 'text-lg'
      )}>
        {item.title}
      </h3>

      {/* Description */}
      <p className={cn(
        'text-muted-foreground leading-relaxed',
        isFeatured ? 'text-base md:text-lg' : 'text-sm'
      )}>
        {item.description}
      </p>
    </motion.div>
  )
}

// ============================================================================
// MAIN FEATURES GRID COMPONENT
// ============================================================================

export function PuckFeaturesGrid({
  items,
  columns,
  iconStyle,
  variant = 'default',
  animate = true,
}: PuckFeaturesGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })
  const prefersReducedMotion = useReducedMotion()

  // Disable animations if user prefers reduced motion
  const shouldAnimate = animate && !prefersReducedMotion

  // Grid classes based on variant and columns
  const getGridClasses = (): string => {
    if (variant === 'bento') {
      // Bento uses auto-fit grid with potential spanning
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    }

    const gridClasses: Record<2 | 3 | 4, string> = {
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    }

    return gridClasses[columns] || gridClasses[3]
  }

  // Container animation variants with staggered children
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldAnimate ? 0.1 : 0,
        delayChildren: 0.1,
      },
    },
  }

  return (
    <motion.div
      ref={containerRef}
      className={cn('grid gap-8', getGridClasses())}
      variants={containerVariants}
      initial={shouldAnimate ? 'hidden' : 'visible'}
      animate={isInView ? 'visible' : 'hidden'}
    >
      {items.map((item, i) => (
        <FeatureCard
          key={i}
          item={item}
          iconStyle={iconStyle}
          variant={variant}
          shouldAnimate={shouldAnimate}
          index={i}
          isFeatured={variant === 'bento' && Boolean(item.featured)}
        />
      ))}
    </motion.div>
  )
}

export default PuckFeaturesGrid
