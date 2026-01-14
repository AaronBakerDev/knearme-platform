/**
 * PuckPages Collection - Visual Page Builder Content
 *
 * Stores page data for the Puck visual editor. Each document represents
 * a page that can be edited with drag-and-drop blocks in the Puck editor.
 *
 * The puckData field stores the Puck editor's JSON structure containing:
 * - root: Zone configuration for the page
 * - content: Array of component instances with their props
 * - zones: Named zones for slot-based layouts
 *
 * Key Features:
 * - JSONB storage for flexible Puck data structure
 * - Versioning with drafts for content review workflow
 * - SEO fields for search optimization
 * - ISR revalidation on publish
 *
 * @see PUCK-002 in PRD for acceptance criteria
 * @see https://puckeditor.com/docs/api-reference/data
 */
import type { CollectionConfig, Field } from 'payload'
import { createRevalidateHook, revalidatePaths } from '../hooks/revalidate.ts'

/**
 * Upload field referencing the media collection.
 * Uses type assertion because 'media' isn't in generated CollectionSlug yet.
 */
const mediaUploadField = (name: string, label: string, description: string): Field => ({
  name,
  type: 'upload',
  label,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  relationTo: 'media' as any,
  admin: { description },
})

/**
 * PuckPages collection configuration
 *
 * Fields:
 * - title (required): Page title for admin display and SEO
 * - slug (unique): URL identifier (e.g., "about" for /about)
 * - puckData (json): Full Puck editor data structure
 * - status: draft | published
 * - SEO group: metaTitle, metaDescription, ogImage
 */
export const PuckPages: CollectionConfig = {
  slug: 'puck-pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    description: 'Visual pages built with the drag-and-drop Puck editor.',
    group: 'Content',
  },
  // Enable versioning with drafts for content review workflow
  versions: {
    drafts: {
      autosave: {
        interval: 2000, // Save every 2 seconds while editing
      },
    },
    maxPerDoc: 25, // Keep last 25 versions
  },
  hooks: {
    afterChange: [
      // Trigger ISR revalidation when page is published
      // Revalidates the public page URL and sitemap
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createRevalidateHook(revalidatePaths.puckPage, 'puck-pages') as any,
    ],
  },
  fields: [
    // Core Fields
    {
      name: 'title',
      type: 'text',
      label: 'Page Title',
      required: true,
      admin: {
        description: 'Title for admin display and default SEO title',
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'URL Slug',
      required: true,
      unique: true,
      admin: {
        description: 'URL identifier (e.g., "about" for /about). Must be unique.',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            // Auto-generate slug from title if not provided
            if (!value && data?.title) {
              return data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'puckData',
      type: 'json',
      label: 'Page Content (Puck Data)',
      required: false, // Empty for new pages
      admin: {
        description: 'JSON data from Puck editor. Edit via Visual Editor, not directly.',
        // Hide the raw JSON in admin - users should use Visual Editor
        condition: () => false,
      },
    },
    // UI Field: Open Visual Editor Button
    // Custom component that links to /admin/puck/[slug]
    {
      name: 'openVisualEditor',
      type: 'ui',
      admin: {
        components: {
          Field: './components/OpenPuckEditorButton',
        },
        // Only show after document is saved (has slug)
        condition: (data) => Boolean(data?.slug),
      },
    },
    // Publishing Status
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'draft',
      required: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        description: 'Draft pages are only visible in the editor. Published pages are publicly accessible.',
      },
    },

    // SEO Group
    {
      name: 'seo',
      type: 'group',
      label: 'SEO Settings',
      admin: {
        description: 'Search engine optimization settings',
      },
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          label: 'Meta Title',
          admin: {
            description: 'Override page title for search engines (defaults to page title)',
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Meta Description',
          maxLength: 160,
          admin: {
            description: 'Description for search results (max 160 characters)',
          },
        },
        mediaUploadField('ogImage', 'Social Share Image', 'Image for social sharing (1200x630px recommended)'),
        {
          name: 'noIndex',
          type: 'checkbox',
          label: 'No Index',
          defaultValue: false,
          admin: {
            description: 'Prevent search engines from indexing this page',
          },
        },
      ],
    },
  ],
  access: {
    // Published pages are publicly readable for frontend rendering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    read: ({ req: { user } }): any => {
      if (user) return true // Logged in users can see all
      // Public can only see published pages
      return { status: { equals: 'published' } }
    },
    // Only authenticated users can create/update/delete
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  // Default sort by last updated
  defaultSort: '-updatedAt',
}

export default PuckPages
