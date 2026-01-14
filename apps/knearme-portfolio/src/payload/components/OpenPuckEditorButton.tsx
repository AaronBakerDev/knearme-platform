/**
 * OpenPuckEditorButton Component
 *
 * Custom Payload UI field component that displays a button to open
 * the Puck visual editor for the current page.
 *
 * Registered in PuckPages collection as a UI field.
 * Only displays when the document has been saved (has a slug).
 *
 * @see PUCK-009 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/fields/ui
 */
'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

/**
 * Style constants for consistent button appearance
 * Matches Payload admin theme variables
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: '1.5rem',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: 'var(--theme-elevation-150)',
    color: 'var(--theme-elevation-900)',
    border: '1px solid var(--theme-elevation-250)',
    borderRadius: 'var(--style-radius-s)',
    fontSize: '0.875rem',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  description: {
    marginTop: '0.5rem',
    fontSize: '0.8125rem',
    color: 'var(--theme-elevation-500)',
  },
}

/**
 * Edit icon for the button
 */
const EditIcon = () => (
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
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

/**
 * OpenPuckEditorButton - UI Field Component
 *
 * Renders a button that links to the Puck visual editor for this page.
 * Uses the document's slug to construct the editor URL.
 */
export const OpenPuckEditorButton: React.FC = () => {
  const { id } = useDocumentInfo()

  // Get slug from URL params or document data
  // This is a placeholder - actual implementation will read from document data
  // For now, we construct based on ID which will be replaced with slug logic

  if (!id) {
    return (
      <div style={styles.container}>
        <p style={styles.description}>
          Save this page first to enable the Visual Editor.
        </p>
      </div>
    )
  }

  // TODO: In PUCK-009, enhance this to read the actual slug from document data
  // For now, link to the editor with the document ID
  const editorUrl = `/admin/puck/${id}`

  return (
    <div style={styles.container}>
      <a
        href={editorUrl}
        style={styles.button}
        target="_blank"
        rel="noopener noreferrer"
      >
        <EditIcon />
        Open Visual Editor
      </a>
      <p style={styles.description}>
        Edit this page with the drag-and-drop visual editor.
      </p>
    </div>
  )
}

export default OpenPuckEditorButton
