/**
 * StatusBadge Component for Payload Admin
 *
 * A reusable badge component for displaying content status indicators.
 * Shows colored dot + text label for draft, published, and archived states.
 *
 * Design aligned with KnearMe design system:
 * - Draft: amber/warning colors (content in progress)
 * - Published: green/success colors (live content)
 * - Archived: gray/muted colors (historical content)
 *
 * Uses OKLCH-equivalent HSL values from custom.scss for theming consistency.
 *
 * @example
 * ```tsx
 * <StatusBadge status="published" />
 * <StatusBadge status="draft" size="sm" />
 * <StatusBadge status="archived" showLabel />
 * ```
 *
 * @see custom.scss for brand color definitions
 * @see StatCard.tsx for similar styling patterns
 */
'use client'

import React from 'react'

export type StatusType = 'draft' | 'published' | 'archived'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface StatusBadgeProps {
  /** The status to display */
  status: StatusType
  /** Size variant (default: 'md') */
  size?: BadgeSize
  /** Whether to show the text label (default: true) */
  showLabel?: boolean
  /** Optional custom label override */
  label?: string
  /** Optional additional className */
  className?: string
}

/**
 * Status-specific styling configuration
 *
 * Colors use design system values:
 * - Draft: amber tones (--theme-warning-*)
 * - Published: green tones (--theme-success-*)
 * - Archived: neutral gray (--theme-elevation-*)
 *
 * WCAG AA contrast compliance maintained for all combinations.
 */
const statusConfig = {
  draft: {
    dotColor: 'hsl(45, 80%, 50%)',     // Amber dot
    bgColor: 'hsl(45, 90%, 95%)',       // Light amber bg
    textColor: 'hsl(40, 80%, 35%)',     // Dark amber text
    borderColor: 'hsl(45, 70%, 85%)',   // Amber border
    // Dark mode variants
    darkDotColor: 'hsl(45, 85%, 55%)',
    darkBgColor: 'hsla(45, 60%, 25%, 0.3)',
    darkTextColor: 'hsl(45, 80%, 70%)',
    darkBorderColor: 'hsla(45, 50%, 40%, 0.4)',
    label: 'Draft',
  },
  published: {
    dotColor: 'hsl(145, 50%, 40%)',     // Green dot
    bgColor: 'hsl(145, 40%, 94%)',      // Light green bg
    textColor: 'hsl(145, 55%, 28%)',    // Dark green text
    borderColor: 'hsl(145, 35%, 85%)',  // Green border
    // Dark mode variants
    darkDotColor: 'hsl(145, 55%, 50%)',
    darkBgColor: 'hsla(145, 40%, 25%, 0.3)',
    darkTextColor: 'hsl(145, 50%, 65%)',
    darkBorderColor: 'hsla(145, 40%, 40%, 0.4)',
    label: 'Published',
  },
  archived: {
    dotColor: 'hsl(260, 2%, 45%)',      // Gray dot
    bgColor: 'hsl(260, 2%, 94%)',       // Light gray bg
    textColor: 'hsl(260, 2%, 40%)',     // Dark gray text
    borderColor: 'hsl(260, 2%, 85%)',   // Gray border
    // Dark mode variants
    darkDotColor: 'hsl(260, 2%, 55%)',
    darkBgColor: 'hsla(260, 2%, 30%, 0.4)',
    darkTextColor: 'hsl(260, 2%, 70%)',
    darkBorderColor: 'hsla(260, 2%, 45%, 0.4)',
    label: 'Archived',
  },
} as const

/**
 * Size configuration for badge dimensions
 */
const sizeConfig = {
  sm: {
    dotSize: '6px',
    padding: '2px 8px',
    fontSize: '0.6875rem', // 11px
    gap: '4px',
    borderRadius: '9999px',
  },
  md: {
    dotSize: '8px',
    padding: '4px 10px',
    fontSize: '0.75rem', // 12px
    gap: '6px',
    borderRadius: '9999px',
  },
  lg: {
    dotSize: '10px',
    padding: '6px 14px',
    fontSize: '0.8125rem', // 13px
    gap: '8px',
    borderRadius: '9999px',
  },
} as const

/**
 * StatusBadge Component
 *
 * Displays a colored badge with dot indicator for content status.
 * Automatically adapts to light/dark theme via CSS media query detection.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
  label,
  className,
}) => {
  const config = statusConfig[status]
  const sizeStyles = sizeConfig[size]

  // Detect dark mode preference
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    // Check for Payload's dark theme attribute
    const checkTheme = () => {
      const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark'
      setIsDark(isDarkTheme)
    }

    checkTheme()

    // Observer for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  const displayLabel = label || config.label

  const badgeStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeStyles.gap,
    padding: sizeStyles.padding,
    borderRadius: sizeStyles.borderRadius,
    fontSize: sizeStyles.fontSize,
    fontWeight: 500,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    backgroundColor: isDark ? config.darkBgColor : config.bgColor,
    color: isDark ? config.darkTextColor : config.textColor,
    border: `1px solid ${isDark ? config.darkBorderColor : config.borderColor}`,
    transition: 'all 0.15s ease',
  }

  const dotStyles: React.CSSProperties = {
    width: sizeStyles.dotSize,
    height: sizeStyles.dotSize,
    borderRadius: '50%',
    backgroundColor: isDark ? config.darkDotColor : config.dotColor,
    flexShrink: 0,
  }

  return (
    <span style={badgeStyles} className={className}>
      <span style={dotStyles} aria-hidden="true" />
      {showLabel && <span>{displayLabel}</span>}
    </span>
  )
}

export default StatusBadge
