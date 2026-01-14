'use client'

/**
 * Animated Stats Block Component for Puck Visual Editor
 *
 * Features:
 * - Animated counters that count up from 0 when scrolled into view
 * - Three style variants: glass (modern glassmorphism), gradient, minimal
 * - Optional icon support for each stat item
 * - Staggered entrance animations using Framer Motion
 * - Respects prefers-reduced-motion accessibility setting
 *
 * @see PUCK-042 for acceptance criteria
 * @see src/lib/puck/design-system.ts for animation configurations
 */

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { animations, gradients, glass, type GradientPreset } from '@/lib/puck/design-system'
import {
  Zap,
  Target,
  Award,
  Users,
  TrendingUp,
  Clock,
  Globe,
  CheckCircle,
  Lightbulb,
  Rocket,
  Heart,
  Star,
  type LucideIcon,
} from 'lucide-react'

// Icon map for Stats block
const STATS_ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Target,
  Award,
  Users,
  TrendingUp,
  Clock,
  Globe,
  CheckCircle,
  Lightbulb,
  Rocket,
  Heart,
  Star,
}

// ============================================================================
// TYPES
// ============================================================================

export interface StatItem {
  number: string
  label: string
  prefix?: string
  suffix?: string
  icon?: string
}

export interface PuckStatsProps {
  items: StatItem[]
  columns: 2 | 3 | 4
  style: 'glass' | 'gradient' | 'minimal' | 'default' | 'card'
  gradient?: GradientPreset
  animate?: boolean
}

// ============================================================================
// ANIMATED COUNTER HOOK
// ============================================================================

/**
 * Custom hook for animated number counting
 * Uses requestAnimationFrame for smooth animation
 */
function useAnimatedCounter(
  targetValue: number,
  isInView: boolean,
  shouldAnimate: boolean,
  duration: number = 2000
): number {
  const [displayValue, setDisplayValue] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    // If animations disabled or not in view, show final value
    if (!shouldAnimate || !isInView) {
      setDisplayValue(shouldAnimate ? 0 : targetValue)
      return
    }

    // Reset when entering view
    startTimeRef.current = null
    setDisplayValue(0)

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplayValue(Math.round(targetValue * eased))

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [targetValue, isInView, shouldAnimate, duration])

  return displayValue
}

// ============================================================================
// SINGLE STAT ITEM COMPONENT
// ============================================================================

interface StatItemComponentProps {
  item: StatItem
  style: PuckStatsProps['style']
  gradient?: GradientPreset
  isInView: boolean
  shouldAnimate: boolean
  index: number
}

function StatItemComponent({
  item,
  style,
  gradient,
  isInView,
  shouldAnimate,
  index
}: StatItemComponentProps) {
  // Parse numeric value from string (handles formats like "500", "98%", "$1.5M")
  const numericValue = parseFloat(item.number.replace(/[^0-9.-]/g, '')) || 0
  const animatedValue = useAnimatedCounter(numericValue, isInView, shouldAnimate)

  // Check if number has decimals
  const hasDecimals = item.number.includes('.')
  const decimalPlaces = hasDecimals ? (item.number.split('.')[1]?.length || 0) : 0

  // Format the displayed number
  const displayNumber = shouldAnimate && isInView
    ? (hasDecimals ? animatedValue.toFixed(decimalPlaces) : animatedValue.toString())
    : item.number

  // Get icon component if specified
  const IconComponent = item.icon ? STATS_ICON_MAP[item.icon] : null

  // Style-specific classes
  const itemClasses: Record<string, string> = {
    default: 'py-6 px-4',
    card: 'py-8 px-6 bg-muted/50 rounded-xl shadow-sm',
    minimal: 'py-4 px-2',
    glass: cn(glass.medium.className, 'py-8 px-6 rounded-xl'),
    gradient: 'py-8 px-6 rounded-xl text-white',
  }

  // Get gradient CSS if style is gradient
  const gradientStyle = style === 'gradient' && gradient
    ? { background: gradients[gradient]?.css || gradients.ocean.css }
    : undefined

  return (
    <motion.div
      variants={animations.variants.fadeUp}
      custom={index}
      className={cn(
        'flex flex-col items-center text-center',
        itemClasses[style] || itemClasses.default,
        style === 'glass' && 'hover:bg-background/70 transition-colors',
        style === 'gradient' && 'shadow-lg'
      )}
      style={gradientStyle}
      whileHover={shouldAnimate ? { y: -4, transition: { duration: 0.2 } } : undefined}
    >
      {/* Optional Icon */}
      {IconComponent && (
        <motion.div
          className={cn(
            'mb-4 flex h-14 w-14 items-center justify-center rounded-full',
            style === 'gradient' ? 'bg-white/20' : 'bg-primary/10'
          )}
          whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
        >
          <IconComponent
            className={cn(
              'h-7 w-7',
              style === 'gradient' ? 'text-white' : 'text-primary'
            )}
          />
        </motion.div>
      )}

      {/* Stat number with prefix/suffix */}
      <div className={cn(
        'text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl',
        style === 'gradient' ? 'text-white' : 'text-primary'
      )}>
        {item.prefix && (
          <span className="text-3xl sm:text-4xl md:text-5xl">{item.prefix}</span>
        )}
        {displayNumber}
        {item.suffix && (
          <span className="text-3xl sm:text-4xl md:text-5xl">{item.suffix}</span>
        )}
      </div>

      {/* Stat label */}
      <div className={cn(
        'mt-2 font-medium',
        style === 'minimal' ? 'text-sm text-muted-foreground' : 'text-base',
        style === 'gradient' ? 'text-white/80' : 'text-muted-foreground'
      )}>
        {item.label}
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN STATS COMPONENT
// ============================================================================

export function PuckStats({
  items,
  columns,
  style = 'default',
  gradient = 'ocean',
  animate = true
}: PuckStatsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 })
  const prefersReducedMotion = useReducedMotion()

  // Disable animations if user prefers reduced motion
  const shouldAnimate = animate && !prefersReducedMotion

  // Responsive grid classes based on column count
  const gridClasses: Record<2 | 3 | 4, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
  }

  // Container animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldAnimate ? 0.15 : 0,
        delayChildren: 0.1,
      },
    },
  }

  return (
    <motion.div
      ref={containerRef}
      className={cn('grid gap-6 md:gap-8', gridClasses[columns] || gridClasses[3])}
      variants={containerVariants}
      initial={shouldAnimate ? 'hidden' : 'visible'}
      animate={isInView ? 'visible' : 'hidden'}
    >
      {items.map((item, i) => (
        <StatItemComponent
          key={i}
          item={item}
          style={style}
          gradient={gradient}
          isInView={isInView}
          shouldAnimate={shouldAnimate}
          index={i}
        />
      ))}
    </motion.div>
  )
}

export default PuckStats
