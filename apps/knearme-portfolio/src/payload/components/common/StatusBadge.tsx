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
    label: 'Draft',
  },
  published: {
    label: 'Published',
  },
  archived: {
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
 * Automatically adapts to light/dark theme via CSS variables.
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
    backgroundColor: `var(--status-${status}-bg)`,
    color: `var(--status-${status}-text)`,
    border: `1px solid var(--status-${status}-border)`,
    transition: 'all 0.15s ease',
  }

  const dotStyles: React.CSSProperties = {
    width: sizeStyles.dotSize,
    height: sizeStyles.dotSize,
    borderRadius: '50%',
    backgroundColor: `var(--status-${status}-dot)`,
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
