/**
 * StatCard Component for Payload Admin Dashboard
 *
 * A reusable card component for displaying metrics and statistics
 * on the admin dashboard. Features gradient backgrounds, smooth hover
 * effects, and variant-specific accent colors for professional polish.
 *
 * Design enhancements (PAYLOAD-002):
 * - Subtle gradient backgrounds based on variant
 * - Smooth hover lift effect (translateY + shadow)
 * - Icon accent backgrounds matching variant colors
 * - 0.2s ease transitions throughout
 * - WCAG AA compliant color contrast
 *
 * @see Payload admin dashboard customization docs
 * @see custom.scss for brand color definitions
 */
'use client'

import React, { useState } from 'react'

export interface StatCardProps {
  /** The metric label (e.g., "Total Articles") */
  label: string
  /** The metric value to display */
  value: number | string
  /** Optional icon component */
  icon?: React.ReactNode
  /** Optional subtitle or additional context */
  subtitle?: string
  /** Optional link URL for the card */
  href?: string
  /** Optional accent color variant */
  variant?: 'default' | 'success' | 'warning' | 'info'
}

/**
 * Variant-specific gradient backgrounds and icon accent colors
 * Using subtle gradients for visual interest without overwhelming
 *
 * Color choices ensure WCAG AA contrast:
 * - Background gradients are subtle (opacity-based)
 * - Icon containers use appropriate contrast ratios
 * - Text colors remain highly readable
 */
const variantConfig = {
  default: {
    // Neutral gradient with slight warm tint
    gradient: 'linear-gradient(135deg, var(--theme-elevation-100) 0%, var(--theme-elevation-150) 100%)',
    iconBg: 'var(--theme-elevation-200)',
    iconColor: 'var(--theme-elevation-700)',
    borderColor: 'var(--theme-elevation-200)',
    hoverShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
  },
  success: {
    // Soft green gradient
    gradient: 'linear-gradient(135deg, var(--theme-success-100) 0%, rgba(145, 200, 160, 0.15) 100%)',
    iconBg: 'var(--theme-success-200)',
    iconColor: 'var(--theme-success-500)',
    borderColor: 'var(--theme-success-200)',
    hoverShadow: '0 8px 24px rgba(16, 185, 129, 0.15)',
  },
  warning: {
    // Soft amber gradient
    gradient: 'linear-gradient(135deg, var(--theme-warning-100) 0%, rgba(245, 200, 120, 0.15) 100%)',
    iconBg: 'var(--theme-warning-200)',
    iconColor: 'var(--theme-warning-500)',
    borderColor: 'var(--theme-warning-200)',
    hoverShadow: '0 8px 24px rgba(245, 158, 11, 0.15)',
  },
  info: {
    // Soft teal gradient (brand color)
    gradient: 'linear-gradient(135deg, rgba(var(--color-base-500-rgb), 0.08) 0%, rgba(var(--color-base-500-rgb), 0.03) 100%)',
    iconBg: 'rgba(var(--color-base-500-rgb), 0.15)',
    iconColor: 'var(--color-base-500)',
    borderColor: 'rgba(var(--color-base-500-rgb), 0.2)',
    hoverShadow: '0 8px 24px rgba(var(--color-base-500-rgb), 0.2)',
  },
} as const

/**
 * Base styles for the stat card
 * Uses Payload CSS variables for theme consistency
 */
const getCardStyles = (
  variant: keyof typeof variantConfig,
  isHovered: boolean,
  isHoverable: boolean
): React.CSSProperties => {
  const config = variantConfig[variant]

  return {
    background: config.gradient,
    borderRadius: 'var(--style-radius-m)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    border: `1px solid ${config.borderColor}`,
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    color: 'inherit',
    cursor: isHoverable ? 'pointer' : 'default',
    // Hover lift effect
    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow: isHovered ? config.hoverShadow : '0 1px 3px rgba(0, 0, 0, 0.05)',
  }
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--theme-elevation-600)',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
  },
  value: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--theme-elevation-1000)',
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '0.75rem',
    color: 'var(--theme-elevation-500)',
    margin: 0,
  },
}

/**
 * Get icon wrapper styles based on variant and hover state
 */
const getIconStyles = (
  variant: keyof typeof variantConfig,
  isHovered: boolean
): React.CSSProperties => {
  const config = variantConfig[variant]

  return {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: 'var(--style-radius-s)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: config.iconBg,
    color: config.iconColor,
    flexShrink: 0,
    transition: 'all 0.2s ease',
    // Subtle scale on card hover for micro-interaction
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
  }
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  subtitle,
  href,
  variant = 'default',
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const isHoverable = Boolean(href)

  const cardStyle = getCardStyles(variant, isHovered, isHoverable)
  const iconStyle = getIconStyles(variant, isHovered)

  const content = (
    <>
      <div style={styles.header}>
        <p style={styles.label}>{label}</p>
        {icon && <div style={iconStyle}>{icon}</div>}
      </div>
      <p style={styles.value}>{value}</p>
      {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
    </>
  )

  const hoverHandlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  }

  if (href) {
    return (
      <a href={href} style={cardStyle} {...hoverHandlers}>
        {content}
      </a>
    )
  }

  return (
    <div style={cardStyle} {...hoverHandlers}>
      {content}
    </div>
  )
}

export default StatCard
