/**
 * StatCard Component for Payload Admin Dashboard
 *
 * A reusable card component for displaying metrics and statistics
 * on the admin dashboard. Uses Payload's native styling with
 * professional polish.
 *
 * @see Payload admin dashboard customization docs
 */
import React from 'react'

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
 * Inline styles for the stat card
 * Uses Payload CSS variables for consistency with admin theme
 */
const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--theme-elevation-100)',
    borderRadius: 'var(--style-radius-m)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    border: '1px solid var(--theme-elevation-150)',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    color: 'inherit',
  },
  cardHoverable: {
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  iconWrapper: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: 'var(--style-radius-s)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--theme-elevation-200)',
    color: 'var(--theme-elevation-800)',
    flexShrink: 0,
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
 * Variant-specific accent colors
 */
const variantStyles: Record<string, React.CSSProperties> = {
  default: {
    backgroundColor: 'var(--theme-elevation-200)',
  },
  success: {
    backgroundColor: 'var(--theme-success-100)',
    color: 'var(--theme-success-500)',
  },
  warning: {
    backgroundColor: 'var(--theme-warning-100)',
    color: 'var(--theme-warning-500)',
  },
  info: {
    backgroundColor: 'var(--theme-elevation-200)',
    color: 'var(--color-base-500)',
  },
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  subtitle,
  href,
  variant = 'default',
}) => {
  const cardStyle = {
    ...styles.card,
    ...(href ? styles.cardHoverable : {}),
  }

  const iconStyle = {
    ...styles.iconWrapper,
    ...variantStyles[variant],
  }

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

  if (href) {
    return (
      <a href={href} style={cardStyle}>
        {content}
      </a>
    )
  }

  return <div style={cardStyle}>{content}</div>
}

export default StatCard
