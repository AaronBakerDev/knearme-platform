'use client'

/**
 * Animated Hero Block Component for Puck Visual Editor
 *
 * Features:
 * - Multiple background types: solid, gradient, image, pattern
 * - Gradient presets from design system (sunset, ocean, aurora, midnight, forest, royal)
 * - Animation presets for entrance effects (fadeIn, fadeUp, slideUp, scaleIn)
 * - Configurable overlay with color, opacity, and blur controls
 * - Framer Motion animations with reduced motion support
 *
 * @see PUCK-044 for acceptance criteria
 * @see src/lib/puck/design-system.ts for gradient and animation configurations
 */

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  animations,
  gradients,
  type GradientPreset,
  type AnimationVariant,
} from '@/lib/puck/design-system'

// ============================================================================
// TYPES
// ============================================================================

export interface CTAButtonConfig {
  text: string
  href: string
  variant: 'primary' | 'secondary' | 'outline'
}

export interface MediaRef {
  url: string
  alt?: string
  width?: number
  height?: number
}

export type BackgroundType = 'solid' | 'gradient' | 'image' | 'pattern'

export interface OverlayConfig {
  color: string
  opacity: number
  blur: number
}

export interface PuckHeroProps {
  heading: string
  subheading: string
  // Background options
  backgroundType: BackgroundType
  backgroundColor?: string
  gradientPreset?: GradientPreset
  backgroundImage?: MediaRef | null
  patternType?: 'dots' | 'grid' | 'diagonal'
  // Overlay configuration
  overlayEnabled?: boolean
  overlayColor?: string
  overlayOpacity?: number
  overlayBlur?: number
  // Animation
  animationPreset: AnimationVariant | 'none'
  // Layout
  alignment: 'left' | 'center' | 'right'
  ctaButtons: CTAButtonConfig[]
}

// ============================================================================
// PATTERN BACKGROUNDS
// ============================================================================

/**
 * SVG patterns for decorative backgrounds
 */
const PATTERNS: Record<string, string> = {
  dots: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.1'/%3E%3C/svg%3E")`,
  grid: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1v38h38V1H1z' fill='%23ffffff' fill-opacity='0.05'/%3E%3C/svg%3E")`,
  diagonal: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40' fill='%23ffffff' fill-opacity='0.05'/%3E%3C/svg%3E")`,
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PuckHero({
  heading,
  subheading,
  backgroundType = 'solid',
  backgroundColor = '',
  gradientPreset = 'ocean',
  backgroundImage,
  patternType = 'dots',
  overlayEnabled = false,
  overlayColor = '#000000',
  overlayOpacity = 50,
  overlayBlur = 0,
  animationPreset = 'none',
  alignment = 'center',
  ctaButtons = [],
}: PuckHeroProps) {
  const prefersReducedMotion = useReducedMotion()
  const shouldAnimate = animationPreset !== 'none' && !prefersReducedMotion

  // Get animation variant from design system
  const animationVariant = shouldAnimate
    ? animations.variants[animationPreset as AnimationVariant]
    : undefined

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

  // Determine background styles
  const getBackgroundStyle = (): React.CSSProperties => {
    switch (backgroundType) {
      case 'gradient':
        return {
          background: gradients[gradientPreset]?.css || gradients.ocean.css,
        }
      case 'image':
        return backgroundImage?.url
          ? { backgroundImage: `url(${backgroundImage.url})` }
          : {}
      case 'pattern':
        return {
          backgroundColor: backgroundColor || 'hsl(var(--primary))',
          backgroundImage: PATTERNS[patternType] || PATTERNS.dots,
        }
      case 'solid':
      default:
        return backgroundColor ? { backgroundColor } : {}
    }
  }

  // Determine if we need light text (dark backgrounds)
  const needsLightText = (): boolean => {
    if (backgroundType === 'image' && backgroundImage?.url) return true
    if (backgroundType === 'gradient') {
      // Most gradients are colorful/dark enough to need light text
      return ['midnight', 'ocean', 'forest', 'royal'].includes(gradientPreset)
    }
    if (backgroundType === 'pattern') return true
    // For solid backgrounds, check if it's a dark color
    if (backgroundColor) {
      const color = backgroundColor.toLowerCase()
      return (
        color.startsWith('#0') ||
        color.startsWith('#1') ||
        color.startsWith('#2') ||
        color.startsWith('#3') ||
        color.includes('dark') ||
        color.includes('black')
      )
    }
    return false
  }

  const hasLightText = needsLightText()

  // Animation configuration
  const containerAnimation = shouldAnimate
    ? {
        initial: 'hidden',
        animate: 'visible',
        transition: {
          duration: animations.duration.slow,
          ease: animations.easing.easeOut,
          staggerChildren: 0.15,
        },
      }
    : {}

  const itemAnimation = shouldAnimate
    ? {
        variants: animationVariant,
        transition: {
          duration: animations.duration.base,
          ease: animations.easing.easeOut,
        },
      }
    : {}

  // Content wrapper - conditionally use motion.div
  const ContentWrapper = shouldAnimate ? motion.div : 'div'
  const ContentItem = shouldAnimate ? motion.div : 'div'

  return (
    <div
      className={cn(
        'relative py-16 px-4 sm:py-20 sm:px-6 md:py-24 lg:py-32',
        backgroundType === 'image' && 'bg-cover bg-center bg-no-repeat',
        backgroundType === 'solid' && !backgroundColor && 'bg-muted'
      )}
      style={getBackgroundStyle()}
    >
      {/* Overlay for background readability */}
      {(overlayEnabled || (backgroundType === 'image' && backgroundImage?.url)) && (
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundColor: overlayColor || '#000000',
            opacity: (overlayOpacity ?? 50) / 100,
            backdropFilter: overlayBlur ? `blur(${overlayBlur}px)` : undefined,
          }}
        />
      )}

      {/* Pattern overlay for pattern backgrounds */}
      {backgroundType === 'pattern' && (
        <div
          className="absolute inset-0 opacity-30"
          aria-hidden="true"
          style={{
            backgroundImage: PATTERNS[patternType] || PATTERNS.dots,
            backgroundRepeat: 'repeat',
          }}
        />
      )}

      {/* Content container */}
      <ContentWrapper
        className={cn('relative z-10 mx-auto max-w-4xl', align.text)}
        {...containerAnimation}
      >
        {/* Heading */}
        <ContentItem {...itemAnimation}>
          <h1
            className={cn(
              'text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl',
              hasLightText ? 'text-white' : 'text-foreground'
            )}
          >
            {heading}
          </h1>
        </ContentItem>

        {/* Subheading */}
        {subheading && (
          <ContentItem {...itemAnimation}>
            <p
              className={cn(
                'mt-4 text-lg sm:text-xl md:text-2xl',
                hasLightText ? 'text-white/90' : 'text-muted-foreground'
              )}
            >
              {subheading}
            </p>
          </ContentItem>
        )}

        {/* CTA Buttons */}
        {ctaButtons.length > 0 && (
          <ContentItem {...itemAnimation}>
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
                    hasLightText &&
                      btn.variant !== 'primary' &&
                      'border-white text-white hover:bg-white/20'
                  )}
                >
                  <a href={btn.href}>{btn.text}</a>
                </Button>
              ))}
            </div>
          </ContentItem>
        )}
      </ContentWrapper>
    </div>
  )
}

export default PuckHero
