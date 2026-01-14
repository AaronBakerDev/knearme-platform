/**
 * QuickActions Component for Payload Admin Dashboard
 *
 * Provides quick access to common content creation workflows.
 * Displays prominent action buttons for creating articles and
 * uploading media.
 *
 * @see https://payloadcms.com/docs/custom-components/root-components
 */
import React from 'react'
import Link from 'next/link'

/**
 * Plus icon for create actions
 */
const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
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
 * Upload icon for media uploads
 */
const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17,8 12,3 7,8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

/**
 * External link icon
 */
const ExternalLinkIcon = () => (
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
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15,3 21,3 21,9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

/**
 * Styles for quick actions section
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: '2rem',
    padding: '1.25rem',
    backgroundColor: 'var(--theme-elevation-50)',
    borderRadius: 'var(--style-radius-m)',
    border: '1px solid var(--theme-elevation-150)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--theme-elevation-600)',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  viewSiteLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.8125rem',
    color: 'var(--theme-elevation-600)',
    textDecoration: 'none',
    transition: 'color 0.15s ease',
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: 'var(--color-base-500)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--style-radius-s)',
    fontSize: '0.875rem',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: 'transparent',
    color: 'var(--theme-elevation-800)',
    border: '1px solid var(--theme-elevation-300)',
    borderRadius: 'var(--style-radius-s)',
    fontSize: '0.875rem',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
}

/**
 * QuickActions Component
 *
 * Displays quick action buttons for common workflows.
 * Can be used as a standalone component or as part of
 * beforeDashboard/afterDashboard composition.
 */
export const QuickActions: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Quick Actions</h2>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.viewSiteLink}
        >
          View Site <ExternalLinkIcon />
        </Link>
      </div>

      <div style={styles.buttonGroup}>
        <Link href="/admin/collections/articles/create" style={styles.primaryButton}>
          <PlusIcon />
          Create Article
        </Link>
        <Link href="/admin/collections/media/create" style={styles.secondaryButton}>
          <UploadIcon />
          Upload Media
        </Link>
      </div>
    </div>
  )
}

export default QuickActions
