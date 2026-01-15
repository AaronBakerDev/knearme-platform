/**
 * Puck Pricing Table Block - Client Component
 *
 * Displays pricing tier comparison cards with hover effects and animations.
 * Uses Framer Motion for:
 * - Glow effect on highlighted tier (persistent subtle glow, enhanced on hover)
 * - Lift effect on card hover
 * - Staggered entrance animations
 * - Respects prefers-reduced-motion
 *
 * @see PUCK-046 for hover effects acceptance criteria
 * @see PUCK-023 for base implementation criteria
 * @see src/lib/puck/design-system.ts for animation constants
 */
'use client'

import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { animations } from '@/lib/puck/design-system'

/**
 * Pricing tier shape from Puck config
 */
interface PricingTier {
  name: string
  price: number
  period: 'monthly' | 'yearly'
  features: string // Newline-separated features
  ctaText: string
  ctaLink: string
  isHighlighted: boolean
}

/**
 * Props for PuckPricingTable component
 */
interface PuckPricingTableProps {
  tiers: PricingTier[]
  showToggle?: boolean
  highlightTier?: number | null
}

/**
 * Animation variants for container (staggered children)
 */
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

/**
 * Animation variants for individual cards
 */
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animations.duration.slow,
      ease: animations.easing.easeOut as [number, number, number, number],
    },
  },
}

/**
 * Get responsive grid classes based on tier count
 */
function getGridClasses(count: number): string {
  if (count === 1) return 'grid-cols-1 max-w-md mx-auto'
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
  if (count === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
}

/**
 * Main Pricing Table component with animations and glow effects
 */
export function PuckPricingTable({ tiers }: PuckPricingTableProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })
  const shouldReduceMotion = useReducedMotion() ?? false

  return (
    <motion.div
      ref={containerRef}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={cn('grid gap-6 md:gap-8', getGridClasses(tiers.length))}
    >
      {tiers.map((tier, i) => {
        const isHighlighted = tier.isHighlighted
        const features = tier.features.split('\n').filter((f) => f.trim())

        return (
          <motion.div
            key={i}
            variants={cardVariants}
            whileHover={
              shouldReduceMotion
                ? undefined
                : {
                    y: -8,
                    boxShadow: isHighlighted
                      ? '0 0 50px hsl(var(--primary) / 0.5), 0 25px 30px -5px rgb(0 0 0 / 0.15)'
                      : '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                  }
            }
            className={cn(
              'relative flex flex-col rounded-2xl p-6 md:p-8',
              'transition-shadow duration-300',
              isHighlighted
                ? // Highlighted tier: primary bg with persistent glow
                  'bg-primary text-primary-foreground shadow-xl ring-2 ring-primary'
                : // Non-highlighted: muted bg
                  'bg-muted/50 text-foreground shadow-sm hover:shadow-lg'
            )}
            style={
              isHighlighted
                ? {
                    // Glow effect using box-shadow with primary color
                    boxShadow:
                      '0 0 30px hsl(var(--primary) / 0.3), 0 20px 25px -5px rgb(0 0 0 / 0.1)',
                  }
                : undefined
            }
            transition={{ duration: 0.2 }}
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
              <span
                className={cn(
                  'text-sm',
                  isHighlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'
                )}
              >
                /{tier.period === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>

            {/* Features list */}
            <ul className="mt-6 flex-1 space-y-3">
              {features.map((feature, j) => (
                <li key={j} className="flex items-start gap-3">
                  <CheckCircle
                    className={cn(
                      'mt-0.5 h-5 w-5 flex-shrink-0',
                      isHighlighted ? 'text-primary-foreground' : 'text-primary'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm',
                      isHighlighted ? 'text-primary-foreground/90' : 'text-muted-foreground'
                    )}
                  >
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
          </motion.div>
        )
      })}
    </motion.div>
  )
}

export default PuckPricingTable
