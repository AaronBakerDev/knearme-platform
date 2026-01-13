/**
 * Articles Collection - Blog Posts
 *
 * Core blog collection for managing articles. Articles are the primary content type
 * for the blog, supporting rich content, author attribution, categorization, and SEO.
 *
 * Key Features:
 * - Rich text content with Lexical editor
 * - Author, Category, Tags relationships
 * - Related articles (manual curation)
 * - Auto-computed: readingTime, wordCount, tableOfContents
 * - Versioning with drafts and autosave
 * - SEO fields for search optimization
 *
 * @see PAY-032 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/configuration/collections
 */
import type { CollectionConfig, Field, FieldHook } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { createRevalidateHook, revalidatePaths } from '../hooks/revalidate'

/**
 * Upload field referencing the media collection.
 * Uses type assertion because 'media' isn't in generated CollectionSlug yet.
 * TODO: Remove eslint-disable after running `npx payload generate:types`
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
 * Extracts plain text from Lexical rich text content.
 * Recursively processes nodes to get text content.
 *
 * @param content - Lexical JSON content structure
 * @returns Plain text string with all formatting removed
 */
function extractTextFromLexical(content: unknown): string {
  if (!content || typeof content !== 'object') return ''

  const contentObj = content as Record<string, unknown>
  const root = contentObj.root as Record<string, unknown> | undefined

  if (!root || !Array.isArray(root.children)) return ''

  function processNode(node: unknown): string {
    if (!node || typeof node !== 'object') return ''

    const nodeObj = node as Record<string, unknown>

    // Text node
    if (nodeObj.type === 'text' && typeof nodeObj.text === 'string') {
      return nodeObj.text
    }

    // Process children recursively
    if (Array.isArray(nodeObj.children)) {
      return nodeObj.children.map(processNode).join(' ')
    }

    return ''
  }

  return (root.children as unknown[]).map(processNode).join(' ').trim()
}

/**
 * Extracts headings (H2, H3) from Lexical content for table of contents.
 *
 * @param content - Lexical JSON content structure
 * @returns Array of heading objects with id, text, and level
 */
function extractHeadings(
  content: unknown
): Array<{ id: string; text: string; level: number }> {
  if (!content || typeof content !== 'object') return []

  const contentObj = content as Record<string, unknown>
  const root = contentObj.root as Record<string, unknown> | undefined

  if (!root || !Array.isArray(root.children)) return []

  const headings: Array<{ id: string; text: string; level: number }> = []

  function processNode(node: unknown): void {
    if (!node || typeof node !== 'object') return

    const nodeObj = node as Record<string, unknown>

    // Check for heading nodes
    if (nodeObj.type === 'heading' && typeof nodeObj.tag === 'string') {
      const tag = nodeObj.tag as string
      const level = tag === 'h2' ? 2 : tag === 'h3' ? 3 : 0

      if (level > 0) {
        const text = Array.isArray(nodeObj.children)
          ? (nodeObj.children as unknown[])
              .map((child) => {
                if (
                  child &&
                  typeof child === 'object' &&
                  (child as Record<string, unknown>).type === 'text'
                ) {
                  return (child as Record<string, unknown>).text || ''
                }
                return ''
              })
              .join('')
          : ''

        if (text) {
          // Generate slug for anchor ID
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

          headings.push({ id, text, level })
        }
      }
    }

    // Process children
    if (Array.isArray(nodeObj.children)) {
      nodeObj.children.forEach(processNode)
    }
  }

  ;(root.children as unknown[]).forEach(processNode)

  return headings
}

/**
 * beforeChange hook to compute derived fields:
 * - readingTime: Based on ~200 words per minute
 * - wordCount: Total words in content
 * - tableOfContents: H2/H3 headings with anchor IDs
 */
const computeDerivedFields: FieldHook = ({ data }) => {
  if (!data) return data

  // Extract text from content
  const text = extractTextFromLexical(data.content)
  const words = text.split(/\s+/).filter((word) => word.length > 0)

  // Calculate word count and reading time
  data.wordCount = words.length
  data.readingTime = Math.max(1, Math.ceil(words.length / 200))

  // Extract table of contents
  data.tableOfContents = extractHeadings(data.content)

  return data
}

/**
 * Articles collection configuration
 *
 * Fields:
 * - title (required): Article headline
 * - slug (unique): URL identifier (/blog/[slug])
 * - excerpt: Short summary (160 chars for SEO)
 * - content: Rich text body (Lexical)
 * - featuredImage: Hero image
 * - author: Relationship to Authors collection
 * - category: Relationship to Categories collection
 * - tags: hasMany relationship to Tags collection
 * - relatedArticles: hasMany self-reference for related content
 * - publishedAt: Publication date
 * - status: draft | scheduled | published | archived
 * - SEO group: metaTitle, metaDescription, ogImage, canonicalUrl, noIndex
 * - Computed: readingTime, wordCount, tableOfContents
 */
export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'author', 'category', 'publishedAt'],
    description: 'Blog articles with rich content and SEO optimization.',
  },
  // Enable versioning with drafts and autosave
  versions: {
    drafts: {
      autosave: {
        interval: 1000, // Save every second while editing
      },
    },
    maxPerDoc: 25, // Keep last 25 versions
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        return computeDerivedFields({ data } as Parameters<FieldHook>[0])
      },
    ],
    afterChange: [
      // Trigger ISR revalidation when article is created or updated
      // Revalidates: /blog listing and /blog/[slug] detail page
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createRevalidateHook(revalidatePaths.article, 'articles') as any,
    ],
  },
  fields: [
    // Core Content
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
      admin: {
        description: 'Article headline (appears in browser tab and search results)',
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: {
        description: 'URL identifier (e.g., "getting-started-guide" for /blog/getting-started-guide)',
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
      name: 'excerpt',
      type: 'textarea',
      label: 'Excerpt',
      maxLength: 160,
      admin: {
        description: 'Short summary for article cards and SEO (max 160 characters)',
      },
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Content',
      required: true,
      editor: lexicalEditor({}),
      admin: {
        description: 'Article body content',
      },
    },
    mediaUploadField('featuredImage', 'Featured Image', 'Hero image for article (1200x630px recommended)'),

    // Relationships
    // Author relationship - uses type assertion due to CollectionSlug type generation
    {
      name: 'author',
      type: 'relationship',
      label: 'Author',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      relationTo: 'authors' as any,
      required: true,
      admin: {
        description: 'Article author (displayed on article page)',
      },
    },
    // Category relationship - uses type assertion due to CollectionSlug type generation
    {
      name: 'category',
      type: 'relationship',
      label: 'Category',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      relationTo: 'categories' as any,
      admin: {
        description: 'Primary category for article organization',
      },
    },
    // Tags relationship (hasMany) - uses type assertion due to CollectionSlug type generation
    {
      name: 'tags',
      type: 'relationship',
      label: 'Tags',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      relationTo: 'tags' as any,
      hasMany: true,
      admin: {
        description: 'Tags for cross-cutting topics (e.g., "SEO", "Tips")',
      },
    },
    // Related articles (hasMany self-reference) - uses type assertion
    {
      name: 'relatedArticles',
      type: 'relationship',
      label: 'Related Articles',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      relationTo: 'articles' as any,
      hasMany: true,
      maxRows: 3,
      admin: {
        description: 'Manually curated related articles (max 3)',
      },
    },

    // Publishing
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Published Date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Publication date and time',
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'draft',
      required: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        description: 'Publication status',
      },
    },

    // Computed fields (read-only, populated by hooks)
    {
      name: 'readingTime',
      type: 'number',
      label: 'Reading Time (minutes)',
      admin: {
        readOnly: true,
        description: 'Auto-calculated based on ~200 words per minute',
      },
    },
    {
      name: 'wordCount',
      type: 'number',
      label: 'Word Count',
      admin: {
        readOnly: true,
        description: 'Auto-calculated total words in content',
      },
    },
    {
      name: 'tableOfContents',
      type: 'json',
      label: 'Table of Contents',
      admin: {
        readOnly: true,
        description: 'Auto-generated from H2/H3 headings',
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
            description: 'Override page title for search engines (defaults to article title)',
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Meta Description',
          admin: {
            description: 'Description for search results (defaults to excerpt)',
          },
        },
        mediaUploadField('ogImage', 'Social Share Image', 'Image for social sharing (1200x630px recommended)'),
        {
          name: 'canonicalUrl',
          type: 'text',
          label: 'Canonical URL',
          admin: {
            description: 'Canonical URL if content exists elsewhere',
          },
        },
        {
          name: 'noIndex',
          type: 'checkbox',
          label: 'No Index',
          defaultValue: false,
          admin: {
            description: 'Prevent search engines from indexing this article',
          },
        },
      ],
    },
  ],
  access: {
    // Published articles are publicly readable
    read: ({ req: { user } }) => {
      if (user) return true // Logged in users can see all
      // Public can only see published
      return {
        status: { equals: 'published' },
      }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  // Default sort by published date descending
  defaultSort: '-publishedAt',
}

export default Articles
