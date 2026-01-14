/**
 * Preview Button Component for Payload Admin
 *
 * Displays a button to open draft article previews in a new tab.
 * Shows the preview URL and expiration date for shareable links.
 * Allows regenerating or revoking preview tokens.
 *
 * Only visible for non-published articles (draft/scheduled).
 *
 * @see PAY-066 in PRD for basic preview functionality
 * @see PAY-067 in PRD for shareable preview links (regenerate/revoke)
 * @see https://payloadcms.com/docs/fields/ui for UI field pattern
 */
'use client'

import React from 'react'
import { useFormFields, useDocumentInfo } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'
import { format, formatDistanceToNow } from 'date-fns'

/**
 * Field state interface from Payload's form system
 */
interface FieldState {
  value?: unknown
  valid?: boolean
  errorMessage?: string
}

/**
 * Preview button styles
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: '1rem',
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.5rem',
    border: '1px solid #E5E7EB',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: '#6B7280',
    marginBottom: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontSize: '0.875rem',
    fontWeight: 500,
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  buttonHover: {
    backgroundColor: '#2563EB',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    cursor: 'not-allowed',
  },
  urlContainer: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#FFFFFF',
    borderRadius: '0.375rem',
    border: '1px solid #E5E7EB',
    fontFamily: 'ui-monospace, monospace',
    fontSize: '0.8125rem',
    color: '#374151',
    wordBreak: 'break-all' as const,
  },
  copyButton: {
    marginTop: '0.5rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: '#FFFFFF',
    color: '#374151',
    fontSize: '0.75rem',
    fontWeight: 500,
    borderRadius: '0.25rem',
    border: '1px solid #D1D5DB',
    cursor: 'pointer',
  },
  expiration: {
    marginTop: '0.75rem',
    fontSize: '0.75rem',
    color: '#6B7280',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  warningText: {
    color: '#F59E0B',
    fontWeight: 500,
  },
  successText: {
    color: '#10B981',
    fontWeight: 500,
  },
  notAvailable: {
    fontSize: '0.875rem',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.75rem',
  },
  regenerateButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: '#FFFFFF',
    color: '#374151',
    fontSize: '0.75rem',
    fontWeight: 500,
    borderRadius: '0.25rem',
    border: '1px solid #D1D5DB',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  revokeButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: '#FFFFFF',
    color: '#DC2626',
    fontSize: '0.75rem',
    fontWeight: 500,
    borderRadius: '0.25rem',
    border: '1px solid #FCA5A5',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  loadingButton: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  errorText: {
    color: '#DC2626',
    fontSize: '0.75rem',
    marginTop: '0.5rem',
  },
}

/**
 * Eye icon SVG for Preview button
 */
function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

/**
 * Copy icon SVG for Copy URL button
 */
function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

/**
 * Check icon SVG for copied confirmation
 */
function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

/**
 * Clock icon SVG for expiration
 */
function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

/**
 * Refresh icon SVG for regenerate button
 */
function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
    </svg>
  )
}

/**
 * X icon SVG for revoke button
 */
function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

/**
 * Preview Button UI Component
 *
 * Shows preview URL and button for draft/scheduled articles.
 * Hidden for published articles since they're publicly accessible.
 * Provides token regeneration and revocation for shareable previews.
 *
 * @see PAY-067 for regenerate/revoke functionality
 */
export const PreviewButton: UIFieldClientComponent = () => {
  const [copied, setCopied] = React.useState(false)
  const [isHovering, setIsHovering] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Local state for token (allows updates without page refresh)
  const [localToken, setLocalToken] = React.useState<string | null>(null)
  const [localExpiresAt, setLocalExpiresAt] = React.useState<string | null>(null)

  // Get document ID from Payload's document context
  const { id: documentId } = useDocumentInfo()

  // Watch relevant fields for preview
  const formData = useFormFields(([fields]) => {
    const getFieldValue = (path: string): unknown => {
      const field = fields[path] as FieldState | undefined
      return field?.value
    }

    return {
      status: getFieldValue('status') as string | undefined,
      previewToken: getFieldValue('previewToken') as string | undefined,
      previewTokenExpiresAt: getFieldValue('previewTokenExpiresAt') as string | undefined,
      slug: getFieldValue('slug') as string | undefined,
    }
  })

  const { status, slug } = formData

  // Use local state if set, otherwise use form data
  const previewToken = localToken ?? formData.previewToken
  const previewTokenExpiresAt = localExpiresAt ?? formData.previewTokenExpiresAt

  // Stable timestamp for expiration calculations
  // Re-computed when expiration changes to ensure accuracy
  const [now] = React.useState(() => Date.now())

  /**
   * Handle token regeneration - creates new token, invalidates old
   * Calls POST /api/articles/preview-token with action: 'regenerate'
   */
  const handleRegenerate = async () => {
    if (!documentId || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/articles/preview-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: documentId,
          action: 'regenerate',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate token')
      }

      // Update local state with new token
      setLocalToken(data.previewToken)
      setLocalExpiresAt(data.previewTokenExpiresAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate token')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle token revocation - removes token entirely
   * Calls POST /api/articles/preview-token with action: 'revoke'
   */
  const handleRevoke = async () => {
    if (!documentId || isLoading) return

    // Confirm revocation since it invalidates shared links
    const confirmed = window.confirm(
      'Revoke preview link? Any shared links will stop working immediately.'
    )
    if (!confirmed) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/articles/preview-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: documentId,
          action: 'revoke',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke token')
      }

      // Clear local state
      setLocalToken(null)
      setLocalExpiresAt(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke token')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show for published articles - they're publicly accessible
  if (status === 'published') {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.co'
    const publicUrl = slug ? `${siteUrl}/blog/${slug}` : null

    return publicUrl ? (
      <div style={styles.container}>
        <div style={styles.label}>Article URL</div>
        <p style={{ fontSize: '0.875rem', color: '#059669', marginBottom: '0.5rem' }}>
          ✓ This article is published and publicly accessible
        </p>
        <div style={styles.urlContainer}>{publicUrl}</div>
        <button
          style={styles.copyButton}
          onClick={() => {
            navigator.clipboard.writeText(publicUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Copied!' : 'Copy URL'}
        </button>
      </div>
    ) : null
  }

  // Check if preview token exists and is valid
  const hasValidToken = previewToken && previewTokenExpiresAt &&
    new Date(previewTokenExpiresAt).getTime() > now

  // Calculate expiration info
  const expiresAt = previewTokenExpiresAt ? new Date(previewTokenExpiresAt) : null
  const isExpiringSoon = expiresAt && (expiresAt.getTime() - now) < (24 * 60 * 60 * 1000)

  // Build preview URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.co'
  const previewUrl = previewToken ? `${siteUrl}/blog/preview/${previewToken}` : null

  // Handle opening preview
  const handlePreviewClick = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Handle copy URL
  const handleCopyUrl = () => {
    if (previewUrl) {
      navigator.clipboard.writeText(previewUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!hasValidToken) {
    return (
      <div style={styles.container}>
        <div style={styles.label}>Preview</div>
        <p style={styles.notAvailable}>
          {documentId
            ? 'No preview link available. Click below to generate one.'
            : `Save this ${status || 'draft'} article to generate a preview link.`}
        </p>

        {/* Allow generating a new token even if none exists (PAY-067) */}
        {documentId && (
          <>
            <button
              style={{
                ...styles.regenerateButton,
                marginTop: '0.75rem',
                ...(isLoading ? styles.loadingButton : {}),
              }}
              onClick={handleRegenerate}
              disabled={isLoading}
            >
              <RefreshIcon />
              {isLoading ? 'Generating...' : 'Generate Preview Link'}
            </button>

            {error && (
              <div style={styles.errorText}>
                Error: {error}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.label}>Preview</div>

      {/* Preview Button */}
      <button
        style={{
          ...styles.button,
          ...(isHovering ? styles.buttonHover : {}),
        }}
        onClick={handlePreviewClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <EyeIcon />
        Open Preview
      </button>

      {/* Preview URL */}
      {previewUrl && (
        <div style={styles.urlContainer}>
          {previewUrl}
        </div>
      )}

      {/* Copy Button */}
      <button style={styles.copyButton} onClick={handleCopyUrl}>
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? 'Copied!' : 'Copy Preview URL'}
      </button>

      {/* Expiration Info */}
      {expiresAt && (
        <div style={styles.expiration}>
          <ClockIcon />
          <span>
            Preview link expires{' '}
            <span style={isExpiringSoon ? styles.warningText : undefined}>
              {formatDistanceToNow(expiresAt, { addSuffix: true })}
            </span>
            {' '}({format(expiresAt, 'MMM d, yyyy')})
          </span>
        </div>
      )}

      {/* Token Management Actions (PAY-067) */}
      <div style={styles.actionButtons}>
        <button
          style={{
            ...styles.regenerateButton,
            ...(isLoading ? styles.loadingButton : {}),
          }}
          onClick={handleRegenerate}
          disabled={isLoading}
          title="Generate a new preview link (invalidates the current one)"
        >
          <RefreshIcon />
          {isLoading ? 'Regenerating...' : 'Regenerate Link'}
        </button>

        <button
          style={{
            ...styles.revokeButton,
            ...(isLoading ? styles.loadingButton : {}),
          }}
          onClick={handleRevoke}
          disabled={isLoading}
          title="Revoke preview access (shared links will stop working)"
        >
          <XIcon />
          {isLoading ? 'Revoking...' : 'Revoke'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={styles.errorText}>
          Error: {error}
        </div>
      )}
    </div>
  )
}

export default PreviewButton
