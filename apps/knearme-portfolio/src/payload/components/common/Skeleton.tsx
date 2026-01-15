/**
 * Skeleton Component for Payload Admin Dashboard
 *
 * A reusable loading placeholder component that displays animated
 * skeleton states while content is being fetched. Uses CSS classes
 * defined in custom.scss for consistent styling.
 *
 * @see PAYLOAD-006 in PRD for acceptance criteria
 * @see custom.scss for skeleton animation keyframes
 */
import React from 'react'

/**
 * Skeleton variant types for common use cases
 */
export type SkeletonVariant =
  | 'text'
  | 'text-sm'
  | 'text-lg'
  | 'text-xl'
  | 'stat'
  | 'avatar'
  | 'avatar-sm'
  | 'avatar-lg'
  | 'thumbnail'
  | 'custom'

export interface SkeletonProps {
  /**
   * Pre-defined skeleton variant for common use cases
   * @default 'text'
   */
  variant?: SkeletonVariant
  /**
   * Custom width (only used when variant is 'custom')
   */
  width?: string | number
  /**
   * Custom height (only used when variant is 'custom')
   */
  height?: string | number
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Number of skeleton lines to render (useful for text placeholders)
   * @default 1
   */
  count?: number
  /**
   * Gap between multiple skeleton lines
   * @default '0.5rem'
   */
  gap?: string
  /**
   * Whether to animate the skeleton
   * @default true
   */
  animate?: boolean
}

/**
 * Map variants to CSS class names
 */
const variantClassMap: Record<SkeletonVariant, string> = {
  text: 'skeleton skeleton-text',
  'text-sm': 'skeleton skeleton-text skeleton-text--sm',
  'text-lg': 'skeleton skeleton-text skeleton-text--lg',
  'text-xl': 'skeleton skeleton-text skeleton-text--xl',
  stat: 'skeleton skeleton-stat',
  avatar: 'skeleton skeleton-avatar',
  'avatar-sm': 'skeleton skeleton-avatar skeleton-avatar--sm',
  'avatar-lg': 'skeleton skeleton-avatar skeleton-avatar--lg',
  thumbnail: 'skeleton skeleton-thumbnail',
  custom: 'skeleton',
}

/**
 * Skeleton - Loading Placeholder Component
 *
 * Renders animated skeleton placeholders for loading states.
 * Uses CSS classes from custom.scss for consistent Payload admin styling.
 *
 * @example
 * // Single text skeleton
 * <Skeleton variant="text" />
 *
 * @example
 * // Multiple text lines
 * <Skeleton variant="text" count={3} />
 *
 * @example
 * // Stat card skeleton
 * <Skeleton variant="stat" />
 *
 * @example
 * // Custom dimensions
 * <Skeleton variant="custom" width="100px" height="50px" />
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
  gap = '0.5rem',
  animate = true,
}) => {
  const baseClassName = variantClassMap[variant]
  const finalClassName = `${baseClassName}${className ? ` ${className}` : ''}`

  // Build custom styles for 'custom' variant or overrides
  const customStyle: React.CSSProperties = {}
  if (variant === 'custom' || width) {
    customStyle.width = typeof width === 'number' ? `${width}px` : width
  }
  if (variant === 'custom' || height) {
    customStyle.height = typeof height === 'number' ? `${height}px` : height
  }
  if (!animate) {
    customStyle.animation = 'none'
  }

  // Render multiple skeletons if count > 1
  if (count > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className={finalClassName}
            style={{
              ...customStyle,
              // Vary width slightly for natural look on text lines
              ...(variant.startsWith('text') && i > 0
                ? { width: `${85 - i * 10}%` }
                : {}),
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={finalClassName}
      style={Object.keys(customStyle).length > 0 ? customStyle : undefined}
    />
  )
}

/**
 * SkeletonGroup - Container for multiple skeleton elements
 *
 * Useful for creating complex loading layouts with proper spacing.
 */
export interface SkeletonGroupProps {
  children: React.ReactNode
  /**
   * Gap between skeleton elements
   * @default '1rem'
   */
  gap?: string
  /**
   * Direction of skeleton layout
   * @default 'column'
   */
  direction?: 'row' | 'column'
  /**
   * Additional CSS classes
   */
  className?: string
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  children,
  gap = '1rem',
  direction = 'column',
  className = '',
}) => {
  const style: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    gap,
  }

  return (
    <div style={style} className={className}>
      {children}
    </div>
  )
}

/**
 * StatCardSkeleton - Pre-configured skeleton for StatCard loading
 *
 * Matches the layout of StatCard component for seamless loading states.
 */
export const StatCardSkeleton: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const containerStyle: React.CSSProperties = {
    background: 'var(--theme-elevation-100)',
    borderRadius: 'var(--style-radius-m)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    border: '1px solid var(--theme-elevation-150)',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
  }

  return (
    <div style={containerStyle} className={className}>
      <div style={headerStyle}>
        <Skeleton variant="text-sm" />
        <Skeleton variant="avatar" />
      </div>
      <Skeleton variant="text-xl" />
      <Skeleton variant="text-sm" />
    </div>
  )
}

/**
 * ActivityItemSkeleton - Pre-configured skeleton for RecentActivity items
 *
 * Matches the layout of activity list items for seamless loading states.
 */
export const ActivityItemSkeleton: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1.25rem',
    borderBottom: '1px solid var(--theme-elevation-100)',
  }

  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  }

  return (
    <div style={itemStyle} className={className}>
      <Skeleton variant="avatar-sm" />
      <div style={contentStyle}>
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text-sm" width="40%" />
      </div>
    </div>
  )
}

export default Skeleton
