/**
 * Puck Editor Client Component
 *
 * Client-side component that renders the Puck visual editor.
 * Handles loading existing page data and saving changes.
 *
 * @see PUCK-005 in PRD for acceptance criteria
 * @see https://puckeditor.com/docs/api-reference/components/puck
 */
'use client'

import { Puck, createUsePuck, type Data } from '@puckeditor/core'
import '@puckeditor/core/puck.css'
import '@/styles/puck-theme.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, FileText } from 'lucide-react'

import { config } from '@/lib/puck/config'
import { DrawerItem } from '@/components/puck/DrawerItem'

/**
 * Create typed usePuck hook for accessing editor state
 * @see https://puckeditor.com/docs/api-reference/puck-api
 */
const usePuck = createUsePuck()

interface PuckEditorClientProps {
  slug: string
}

/**
 * Header actions component with Back to Payload navigation
 *
 * @see PUCK-034 for acceptance criteria
 */
interface HeaderActionsProps {
  children: React.ReactNode
  slug: string
}

function HeaderActions({ children, slug }: HeaderActionsProps) {
  const history = usePuck((state) => state.history)

  const handleBackClick = useCallback(() => {
    // Check if there are unsaved changes (history has past entries)
    if (history.hasPast) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      )
      if (!confirmed) return
    }

    // Navigate back to Payload admin - puck-pages collection
    window.location.href = `/admin/collections/puck-pages/${slug}`
  }, [history.hasPast, slug])

  return (
    <>
      {/* Back to Payload button */}
      <button
        onClick={handleBackClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--puck-color-grey-06)',
          backgroundColor: 'transparent',
          border: '1px solid var(--puck-color-grey-04)',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--puck-color-grey-03)'
          e.currentTarget.style.color = 'var(--puck-color-grey-12)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = 'var(--puck-color-grey-06)'
        }}
        title="Back to Payload Admin"
      >
        <ArrowLeft size={16} />
        <span>Back to Admin</span>
      </button>

      {/* Breadcrumb showing current page */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '13px',
          color: 'var(--puck-color-grey-05)',
        }}
      >
        <FileText size={14} />
        <span>Editing: {slug}</span>
      </div>

      {/* Default Puck header actions (Publish button, etc.) */}
      {children}
    </>
  )
}

/**
 * Empty initial data structure for new pages
 */
const emptyData: Data = {
  content: [],
  root: {},
}

/**
 * Puck Editor Client Component
 *
 * Handles:
 * - Loading existing page data on mount
 * - Rendering the Puck editor with config
 * - Saving page data via API on publish
 */
export function PuckEditorClient({ slug }: PuckEditorClientProps) {
  const [data, setData] = useState<Data | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const isSavingRef = useRef(false)

  // Load existing page data on mount
  useEffect(() => {
    async function loadPageData() {
      try {
        const response = await fetch(`/api/puck/${slug}`)

        if (response.ok) {
          const pageData = await response.json()
          setData(pageData.puckData || emptyData)
        } else if (response.status === 404) {
          // New page - start with empty data
          setData(emptyData)
        } else {
          throw new Error('Failed to load page data')
        }
      } catch (error) {
        console.error('Error loading page data:', error)
        toast.error('Failed to load page data')
        setData(emptyData)
      } finally {
        setIsLoading(false)
      }
    }

    loadPageData()
  }, [slug])

  // Handle publish - save to API
  const handlePublish = useCallback(
    async (publishData: Data) => {
      if (isSavingRef.current) return

      isSavingRef.current = true
      setIsSaving(true)
      try {
        const response = await fetch(`/api/puck/${slug}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            puckData: publishData,
            title: `Page: ${slug}`,
            status: 'published',
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to save page')
        }

        toast.success('Page published successfully!')
      } catch (error) {
        console.error('Error saving page:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to save page')
      } finally {
        isSavingRef.current = false
        setIsSaving(false)
      }
    },
    [slug]
  )

  // Show loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#f8f9fa',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e5e5',
              borderTopColor: '#0070f3',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: '#666' }}>Loading editor...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  // Render Puck editor with custom drawer items and header actions
  return (
    <Puck
      config={config}
      data={data || emptyData}
      onPublish={handlePublish}
      overrides={{
        // Custom drawer item with icon thumbnails
        // @see PUCK-031 for acceptance criteria
        drawerItem: ({ name }) => <DrawerItem name={name} />,
        // Custom header actions with Back to Payload navigation
        // @see PUCK-034 for acceptance criteria
        headerActions: ({ children }) => (
          <HeaderActions slug={slug}>{children}</HeaderActions>
        ),
      }}
    />
  )
}
