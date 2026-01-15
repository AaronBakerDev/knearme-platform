/**
 * EmptyState Component for Payload Admin Dashboard
 *
 * A reusable component for displaying empty states when no content
 * exists in a collection or section. Provides consistent styling
 * with icon, title, description, and optional call-to-action.
 *
 * Uses CSS classes defined in custom.scss for consistent styling
 * and automatic dark mode support.
 *
 * @see PAYLOAD-006 in PRD for acceptance criteria
 * @see custom.scss for empty state classes
 */
import React from 'react'

/**
 * Common empty state icon types
 */
export type EmptyStateIcon =
  | 'document'
  | 'folder'
  | 'image'
  | 'inbox'
  | 'search'
  | 'plus'
  | 'custom'

export interface EmptyStateProps {
  /**
   * Title text for the empty state
   */
  title: string
  /**
   * Optional description text providing more context
   */
  description?: string
  /**
   * Icon to display (pre-defined icons or custom)
   * @default 'document'
   */
  icon?: EmptyStateIcon
  /**
   * Custom icon element (used when icon='custom')
   */
  customIcon?: React.ReactNode
  /**
   * Call-to-action button text
   */
  ctaText?: string
  /**
   * Call-to-action button link
   */
  ctaHref?: string
  /**
   * Call-to-action click handler (alternative to href)
   */
  onCtaClick?: () => void
  /**
   * Additional CSS classes for the container
   */
  className?: string
}

/**
 * Pre-defined SVG icons for common empty states
 */
const icons: Record<Exclude<EmptyStateIcon, 'custom'>, React.ReactNode> = {
  document: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  ),
  folder: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  image: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21,15 16,10 5,21" />
    </svg>
  ),
  inbox: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22,12 16,12 14,15 10,15 8,12 2,12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  search: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  plus: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
}

/**
 * Plus icon for CTA buttons
 */
const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

/**
 * EmptyState - No Content Placeholder Component
 *
 * Renders a centered empty state display with icon, messaging,
 * and optional call-to-action. Uses CSS classes from custom.scss
 * for consistent Payload admin styling and dark mode support.
 *
 * @example
 * // Basic empty state
 * <EmptyState
 *   title="No articles yet"
 *   description="Create your first article to get started."
 * />
 *
 * @example
 * // With CTA button
 * <EmptyState
 *   title="No media uploaded"
 *   description="Upload images and files to use across your site."
 *   icon="image"
 *   ctaText="Upload Media"
 *   ctaHref="/admin/collections/media/create"
 * />
 *
 * @example
 * // With custom icon
 * <EmptyState
 *   title="Custom empty state"
 *   icon="custom"
 *   customIcon={<MyCustomIcon />}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'document',
  customIcon,
  ctaText,
  ctaHref,
  onCtaClick,
  className = '',
}) => {
  // Determine which icon to render
  // If icon is 'custom', use customIcon; otherwise use the pre-defined icon
  const iconElement =
    icon === 'custom' && customIcon
      ? customIcon
      : icon !== 'custom'
        ? icons[icon]
        : null

  const ctaElement =
    ctaText && (ctaHref || onCtaClick) ? (
      ctaHref ? (
        <a href={ctaHref} className="empty-state__cta">
          <PlusIcon />
          {ctaText}
        </a>
      ) : (
        <button type="button" onClick={onCtaClick} className="empty-state__cta">
          <PlusIcon />
          {ctaText}
        </button>
      )
    ) : null

  return (
    <div className={`empty-state${className ? ` ${className}` : ''}`}>
      <div className="empty-state__icon">{iconElement}</div>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {ctaElement}
    </div>
  )
}

/**
 * Convenience empty state components for common use cases
 */

export const NoArticlesEmptyState: React.FC<{
  ctaHref?: string
  onCtaClick?: () => void
}> = ({ ctaHref = '/admin/collections/articles/create', onCtaClick }) => (
  <EmptyState
    icon="document"
    title="No articles yet"
    description="Create your first article to start building your content library."
    ctaText="Create Article"
    ctaHref={onCtaClick ? undefined : ctaHref}
    onCtaClick={onCtaClick}
  />
)

export const NoMediaEmptyState: React.FC<{
  ctaHref?: string
  onCtaClick?: () => void
}> = ({ ctaHref = '/admin/collections/media/create', onCtaClick }) => (
  <EmptyState
    icon="image"
    title="No media uploaded"
    description="Upload images and files to use across your site."
    ctaText="Upload Media"
    ctaHref={onCtaClick ? undefined : ctaHref}
    onCtaClick={onCtaClick}
  />
)

export const NoResultsEmptyState: React.FC<{
  searchTerm?: string
}> = ({ searchTerm }) => (
  <EmptyState
    icon="search"
    title="No results found"
    description={
      searchTerm
        ? `No items match "${searchTerm}". Try adjusting your search.`
        : 'No items match your current filters. Try adjusting your search.'
    }
  />
)

export const NoSubmissionsEmptyState: React.FC = () => (
  <EmptyState
    icon="inbox"
    title="No submissions yet"
    description="Form submissions will appear here when visitors submit your forms."
  />
)

export default EmptyState
