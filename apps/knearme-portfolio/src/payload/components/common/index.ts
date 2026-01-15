/**
 * Common Payload Admin Components
 *
 * Reusable UI components for the Payload CMS admin panel.
 * These components follow Payload's styling patterns and use
 * CSS variables for theme consistency.
 *
 * @see StatusBadge - Content status indicators (draft/published/archived)
 * @see Skeleton - Loading placeholder animations
 * @see EmptyState - No content display with optional CTA
 */

export { StatusBadge } from './StatusBadge'
export type { StatusBadgeProps, StatusType, BadgeSize } from './StatusBadge'

export {
  Skeleton,
  SkeletonGroup,
  StatCardSkeleton,
  ActivityItemSkeleton,
} from './Skeleton'
export type { SkeletonProps, SkeletonVariant, SkeletonGroupProps } from './Skeleton'

export {
  EmptyState,
  NoArticlesEmptyState,
  NoMediaEmptyState,
  NoResultsEmptyState,
  NoSubmissionsEmptyState,
} from './EmptyState'
export type { EmptyStateProps, EmptyStateIcon } from './EmptyState'
