/**
 * Puck Visual Editor Design System
 *
 * Comprehensive design tokens for creating beautiful marketing pages.
 * All values are production-ready and optimized for the KnearMe marketing site.
 *
 * @example
 * ```ts
 * import { typography, spacing, colors, gradients, animations } from '@/lib/puck/design-system'
 *
 * // Use in component
 * const heroStyle = {
 *   fontSize: typography.size['5xl'],
 *   padding: spacing.section.spacious.py,
 *   background: gradients.ocean.css,
 * }
 * ```
 *
 * @see Plan: /Users/aaronbaker/.claude/plans/noble-snuggling-cerf.md
 */

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================

/**
 * Typography configuration for consistent text styling across all blocks.
 * Based on system fonts with semantic variants.
 */
export const typography = {
  /**
   * Font family stacks
   */
  fontFamily: {
    sans: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)',
    serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
    mono: 'var(--font-mono, ui-monospace, "SF Mono", Monaco, "Cascadia Code", monospace)',
    display: 'var(--font-display, var(--font-sans, ui-sans-serif, system-ui, sans-serif))',
  },

  /**
   * Font size scale (px values for reference)
   * xs: 12px, sm: 14px, base: 16px, lg: 18px, xl: 20px
   * 2xl: 24px, 3xl: 30px, 4xl: 36px, 5xl: 48px, 6xl: 60px, 7xl: 72px
   */
  size: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
    '7xl': '4.5rem',   // 72px
  },

  /**
   * Line height scale
   */
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  /**
   * Letter spacing scale
   */
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  /**
   * Font weight scale
   */
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  /**
   * Semantic heading styles - Tailwind class combinations
   */
  heading: {
    h1: 'text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight',
    h2: 'text-3xl md:text-4xl font-bold leading-tight tracking-tight',
    h3: 'text-2xl md:text-3xl font-bold leading-snug tracking-tight',
    h4: 'text-xl md:text-2xl font-semibold leading-snug',
    h5: 'text-lg md:text-xl font-semibold leading-normal',
    h6: 'text-base md:text-lg font-semibold leading-normal',
  },

  /**
   * Body text styles - Tailwind class combinations
   */
  body: {
    large: 'text-lg md:text-xl leading-relaxed',
    base: 'text-base md:text-lg leading-relaxed',
    small: 'text-sm md:text-base leading-relaxed',
  },
} as const

// ============================================================================
// SPACING SCALE
// ============================================================================

/**
 * Spacing tokens for consistent layout and rhythm.
 * Based on 4px base unit (0.25rem).
 */
export const spacing = {
  /**
   * Base spacing tokens (Tailwind class values)
   */
  tokens: {
    0: '0',
    1: '0.25rem',    // 4px
    2: '0.5rem',     // 8px
    3: '0.75rem',    // 12px
    4: '1rem',       // 16px
    6: '1.5rem',     // 24px
    8: '2rem',       // 32px
    12: '3rem',      // 48px
    16: '4rem',      // 64px
    24: '6rem',      // 96px
    32: '8rem',      // 128px
  },

  /**
   * Section padding presets - vertical spacing for major sections
   */
  section: {
    compact: {
      py: '2rem',
      className: 'py-8',
    },
    comfortable: {
      py: '4rem',
      className: 'py-16',
    },
    spacious: {
      py: '6rem',
      className: 'py-24',
    },
    hero: {
      py: '8rem',
      className: 'py-32',
    },
  },

  /**
   * Component internal spacing
   */
  component: {
    tight: {
      gap: '0.5rem',
      padding: '0.75rem',
      className: 'gap-2 p-3',
    },
    default: {
      gap: '1rem',
      padding: '1.5rem',
      className: 'gap-4 p-6',
    },
    relaxed: {
      gap: '1.5rem',
      padding: '2rem',
      className: 'gap-6 p-8',
    },
    spacious: {
      gap: '2rem',
      padding: '3rem',
      className: 'gap-8 p-12',
    },
  },

  /**
   * Container max-widths
   */
  container: {
    sm: 'max-w-2xl',     // 640px
    md: 'max-w-3xl',     // 768px
    lg: 'max-w-4xl',     // 896px
    xl: 'max-w-6xl',     // 1152px
    '2xl': 'max-w-7xl',  // 1280px
    full: 'max-w-full',
  },
} as const

// ============================================================================
// COLOR SYSTEM
// ============================================================================

/**
 * Color palette using CSS custom properties from globals.css
 * These reference the existing theme variables for consistency.
 */
export const colors = {
  /**
   * Theme-aware semantic colors
   */
  semantic: {
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    card: 'hsl(var(--card))',
    cardForeground: 'hsl(var(--card-foreground))',
    primary: 'hsl(var(--primary))',
    primaryForeground: 'hsl(var(--primary-foreground))',
    secondary: 'hsl(var(--secondary))',
    secondaryForeground: 'hsl(var(--secondary-foreground))',
    muted: 'hsl(var(--muted))',
    mutedForeground: 'hsl(var(--muted-foreground))',
    accent: 'hsl(var(--accent))',
    accentForeground: 'hsl(var(--accent-foreground))',
    destructive: 'hsl(var(--destructive))',
    border: 'hsl(var(--border))',
    ring: 'hsl(var(--ring))',
  },

  /**
   * Status colors for feedback
   */
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
} as const

// ============================================================================
// GRADIENT PRESETS
// ============================================================================

/**
 * Beautiful gradient presets for backgrounds, buttons, and feature sections.
 * Each gradient includes CSS string and Tailwind classes.
 */
export const gradients = {
  sunset: {
    name: 'Sunset',
    from: '#FF6B6B',
    to: '#FFD93D',
    css: 'linear-gradient(135deg, #FF6B6B 0%, #FFA07A 50%, #FFD93D 100%)',
    tailwind: 'from-[#FF6B6B] via-[#FFA07A] to-[#FFD93D]',
  },
  ocean: {
    name: 'Ocean',
    from: '#667eea',
    to: '#f093fb',
    css: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    tailwind: 'from-[#667eea] via-[#764ba2] to-[#f093fb]',
  },
  aurora: {
    name: 'Aurora',
    from: '#a8edea',
    to: '#f093fb',
    css: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #f093fb 100%)',
    tailwind: 'from-[#a8edea] via-[#fed6e3] to-[#f093fb]',
  },
  midnight: {
    name: 'Midnight',
    from: '#232526',
    to: '#414345',
    css: 'linear-gradient(135deg, #232526 0%, #414345 50%, #232526 100%)',
    tailwind: 'from-[#232526] via-[#414345] to-[#232526]',
  },
  forest: {
    name: 'Forest',
    from: '#134E5E',
    to: '#71B280',
    css: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
    tailwind: 'from-[#134E5E] to-[#71B280]',
  },
  royal: {
    name: 'Royal',
    from: '#7F00FF',
    to: '#E100FF',
    css: 'linear-gradient(135deg, #7F00FF 0%, #E100FF 100%)',
    tailwind: 'from-[#7F00FF] to-[#E100FF]',
  },
} as const

export type GradientPreset = keyof typeof gradients

// ============================================================================
// SHADOW & EFFECTS
// ============================================================================

/**
 * Shadow scale for depth and elevation.
 */
export const shadows = {
  xs: 'shadow-sm',
  sm: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',
  none: 'shadow-none',

  /**
   * Custom glow effects for CTAs and interactive elements
   */
  glow: {
    primary: '0 0 20px hsl(var(--primary) / 0.3)',
    primaryStrong: '0 0 30px hsl(var(--primary) / 0.5)',
  },
} as const

/**
 * Glass morphism styles for modern, translucent UI elements
 */
export const glass = {
  subtle: {
    className: 'bg-background/40 backdrop-blur-sm border border-border/50',
  },
  medium: {
    className: 'bg-background/60 backdrop-blur-md border border-border/50',
  },
  strong: {
    className: 'bg-background/80 backdrop-blur-lg border border-border/50',
  },
} as const

/**
 * Border radius scale
 */
export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
} as const

// ============================================================================
// ANIMATION PRESETS
// ============================================================================

/**
 * Framer Motion animation configurations for entrance effects and micro-interactions.
 */
export const animations = {
  /**
   * Duration scale (seconds for Framer Motion)
   */
  duration: {
    fast: 0.15,
    base: 0.25,
    slow: 0.35,
    slower: 0.5,
  },

  /**
   * Easing curves
   */
  easing: {
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    spring: [0.34, 1.56, 0.64, 1],
  },

  /**
   * Entrance animation variants for Framer Motion
   */
  variants: {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    fadeUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
    fadeDown: {
      hidden: { opacity: 0, y: -20 },
      visible: { opacity: 1, y: 0 },
    },
    fadeLeft: {
      hidden: { opacity: 0, x: 30 },
      visible: { opacity: 1, x: 0 },
    },
    fadeRight: {
      hidden: { opacity: 0, x: -30 },
      visible: { opacity: 1, x: 0 },
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
    },
    slideUp: {
      hidden: { opacity: 0, y: 50 },
      visible: { opacity: 1, y: 0 },
    },
  },

  /**
   * Container variant for staggered children
   */
  staggerContainer: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },

  /**
   * Stagger delays for list animations
   */
  stagger: {
    fast: 0.05,
    base: 0.1,
    slow: 0.15,
  },

  /**
   * Hover effects
   */
  hover: {
    lift: { y: -8 },
    scale: { scale: 1.05 },
    glow: { boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' },
  },

  /**
   * Spring configurations for natural motion
   */
  spring: {
    gentle: { type: 'spring', stiffness: 120, damping: 14 },
    bouncy: { type: 'spring', stiffness: 260, damping: 20 },
    stiff: { type: 'spring', stiffness: 400, damping: 30 },
  },
} as const

export type AnimationVariant = keyof typeof animations.variants

// ============================================================================
// PUCK FIELD OPTIONS
// ============================================================================

/**
 * Pre-built options for Puck select fields
 */
export const fieldOptions = {
  /**
   * Gradient preset options for Puck select fields
   */
  gradients: Object.entries(gradients).map(([value, preset]) => ({
    label: preset.name,
    value,
  })),

  /**
   * Animation preset options for Puck select fields
   */
  animations: [
    { label: 'None', value: 'none' },
    { label: 'Fade In', value: 'fadeIn' },
    { label: 'Fade Up', value: 'fadeUp' },
    { label: 'Fade Down', value: 'fadeDown' },
    { label: 'Scale In', value: 'scaleIn' },
    { label: 'Slide Up', value: 'slideUp' },
  ],

  /**
   * Section padding options
   */
  sectionPadding: [
    { label: 'Compact', value: 'compact' },
    { label: 'Comfortable', value: 'comfortable' },
    { label: 'Spacious', value: 'spacious' },
    { label: 'Hero', value: 'hero' },
  ],

  /**
   * Glass effect options
   */
  glassEffect: [
    { label: 'None', value: 'none' },
    { label: 'Subtle', value: 'subtle' },
    { label: 'Medium', value: 'medium' },
    { label: 'Strong', value: 'strong' },
  ],
} as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get gradient CSS by preset name
 */
export function getGradientCSS(preset: GradientPreset | 'none'): string {
  if (preset === 'none') return 'transparent'
  return gradients[preset]?.css || 'transparent'
}

/**
 * Get animation variant by name
 */
export function getAnimationVariant(name: AnimationVariant | 'none') {
  if (name === 'none') return undefined
  return animations.variants[name]
}

/**
 * Get section padding class by preset name
 */
export function getSectionPadding(preset: keyof typeof spacing.section): string {
  return spacing.section[preset]?.className || spacing.section.comfortable.className
}

/**
 * Get glass effect class by preset name
 */
export function getGlassClass(preset: keyof typeof glass | 'none'): string {
  if (preset === 'none') return ''
  return glass[preset]?.className || ''
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

const designSystem = {
  typography,
  spacing,
  colors,
  gradients,
  shadows,
  glass,
  borderRadius,
  animations,
  fieldOptions,
  // Helpers
  getGradientCSS,
  getAnimationVariant,
  getSectionPadding,
  getGlassClass,
} as const

export default designSystem
