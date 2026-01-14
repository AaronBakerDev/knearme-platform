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

import { Puck, type Data } from '@puckeditor/core'
import '@puckeditor/core/puck.css'
import '@/styles/puck-theme.css'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { config } from '@/lib/puck/config'
import { DrawerItem } from '@/components/puck/DrawerItem'

interface PuckEditorClientProps {
  slug: string
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
      if (isSaving) return

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
        setIsSaving(false)
      }
    },
    [slug, isSaving]
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

  // Render Puck editor with custom drawer items
  return (
    <Puck
      config={config}
      data={data || emptyData}
      onPublish={handlePublish}
      headerTitle={`Editing: ${slug}`}
      overrides={{
        // Custom drawer item with icon thumbnails
        // @see PUCK-031 for acceptance criteria
        drawerItem: ({ name }) => <DrawerItem name={name} />,
      }}
    />
  )
}
