/**
 * Puck CTA Banner Block - Client Component
 *
 * Displays call-to-action banner with heading, description, and animated buttons.
 * Uses Framer Motion for:
 * - Pulse animation on button hover (scale: 1.05 with spring)
 * - Smooth entrance animations
 * - Respects prefers-reduced-motion
 *
 * @see PUCK-046 for hover effects acceptance criteria
 * @see PUCK-017 for base implementation criteria
 * @see src/lib/puck/design-system.ts for animation constants
 */
'use client'

import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { animations } from '@/lib/puck/design-system'

/**
 * CTA button configuration from Puck config
 */
interface CTAButtonProps {
  text: string
  href: string
  variant: 'primary' | 'secondary' | 'outline'
}

/**
 * Props for PuckCTABanner component
 */
interface PuckCTABannerProps {
  heading: string
  description: string
  buttons: CTAButtonProps[]
  backgroundColor: string
  style: 'centered' | 'left-aligned'
}

/**
 * Container animation variants
 */
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animations.duration.slow,
      ease: animations.easing.easeOut as [number, number, number, number],
      staggerChildren: 0.1,
    },
  },
}

/**
 * Content item animation variants
 */
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animations.duration.base,
      ease: animations.easing.easeOut as [number, number, number, number],
    },
  },
}

/**
 * Button pulse animation on hover
 */
const buttonPulse = {
  scale: 1.05,
  transition: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 10,
  },
}

/**
 * Map CTA variants to shadcn Button variants
 */
function getButtonVariant(variant: string): 'default' | 'secondary' | 'outline' {
  if (variant === 'primary') return 'default'
  if (variant === 'secondary') return 'secondary'
  return 'outline'
}

/**
 * Main CTA Banner component with animations and button pulse effects
 */
export function PuckCTABanner({
  heading,
  description,
  buttons,
  backgroundColor,
  style,
}: PuckCTABannerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 })
  const shouldReduceMotion = useReducedMotion() ?? false

  // Determine if background is dark for contrast calculations
  // Simple heuristic: if not white/transparent-ish, assume dark
  const isDarkBg =
    backgroundColor &&
    backgroundColor !== 'transparent' &&
    !backgroundColor.match(/^#f|^white|^rgb\(2[45]\d/i)

  return (
    <motion.div
      ref={containerRef}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={cn(
        'rounded-xl px-6 py-12 sm:px-8 md:py-16',
        style === 'centered' ? 'text-center' : 'text-left'
      )}
      style={{ backgroundColor }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Heading */}
        <motion.h2
          variants={itemVariants}
          className={cn(
            'text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl',
            isDarkBg ? 'text-white' : 'text-foreground'
          )}
        >
          {heading}
        </motion.h2>

        {/* Description */}
        {description && (
          <motion.p
            variants={itemVariants}
            className={cn(
              'mt-3 text-base sm:text-lg md:text-xl',
              isDarkBg ? 'text-white/90' : 'text-muted-foreground'
            )}
          >
            {description}
          </motion.p>
        )}

        {/* Buttons with pulse animation */}
        {buttons.length > 0 && (
          <motion.div
            variants={itemVariants}
            className={cn(
              'mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4',
              style === 'centered' ? 'justify-center' : 'justify-start'
            )}
          >
            {buttons.map((btn, i) => (
              <motion.div
                key={i}
                whileHover={shouldReduceMotion ? undefined : buttonPulse}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              >
                <Button
                  variant={getButtonVariant(btn.variant)}
                  size="lg"
                  asChild
                  className={cn(
                    // Smooth transition for all properties
                    'transition-all duration-200',
                    // On dark backgrounds: primary buttons stay default, others get white text/border
                    isDarkBg &&
                      btn.variant === 'primary' &&
                      'bg-white text-foreground hover:bg-white/90',
                    isDarkBg &&
                      btn.variant !== 'primary' &&
                      'border-white text-white hover:bg-white/20'
                  )}
                >
                  <a href={btn.href}>{btn.text}</a>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default PuckCTABanner
