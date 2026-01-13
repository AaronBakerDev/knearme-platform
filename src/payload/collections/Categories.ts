/**
 * Categories Collection - Blog Category Organization
 *
 * Manages hierarchical categories for blog posts. Articles have a category
 * relationship for organization and filtering. Category pages aggregate
 * articles by topic.
 *
 * @see PAY-034 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/configuration/collections
 */
import type { CollectionConfig, Field } from 'payload'

/**
 * Upload field referencing the media collection.
 * Uses type assertion because 'media' isn't in generated CollectionSlug yet.
 * TODO: Remove eslint-disable after running `npx payload generate:types`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mediaUploadField = (name: string, label: string, description: string): Field => ({
  name,
  type: 'upload',
  label,
  relationTo: 'media' as any,
  admin: { description },
})

/**
 * Categories collection configuration
 *
 * Fields:
 * - name (required): Category display name
 * - slug (unique): URL identifier for category pages (/blog/category/[slug])
 * - description: Category description (textarea)
 * - parent: Self-referential relationship for hierarchical categories
 * - featuredImage: Category banner/header image
 * - SEO group: metaTitle, metaDescription, ogImage
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'parent', 'updatedAt'],
    description: 'Blog categories for organizing articles.',
  },
  fields: [
    // Basic Info
    {
      name: 'name',
      type: 'text',
      label: 'Category Name',
      required: true,
      admin: {
        description: 'Display name for the category',
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: {
        description: 'URL identifier (e.g., "marketing-tips" for /blog/category/marketing-tips)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            // Auto-generate slug from name if not provided
            if (!value && data?.name) {
              return data.name
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
      name: 'description',
      type: 'textarea',
      label: 'Description',
      admin: {
        description: 'Brief description of this category (displayed on category page)',
      },
    },

    // Hierarchy - self-referential relationship
    // Uses type assertion because 'categories' isn't in generated CollectionSlug yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {
      name: 'parent',
      type: 'relationship',
      label: 'Parent Category',
      relationTo: 'categories' as any,
      admin: {
        description: 'Optional parent category for hierarchical organization',
      },
    },

    // Featured Image
    mediaUploadField('featuredImage', 'Featured Image', 'Category banner image (1200x630px recommended)'),

    // SEO Group
    {
      name: 'seo',
      type: 'group',
      label: 'SEO Settings',
      admin: {
        description: 'Search engine optimization for category page',
      },
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          label: 'Meta Title',
          admin: {
            description: 'Override page title for search engines (defaults to category name)',
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Meta Description',
          admin: {
            description: 'Description for search results (150-160 characters)',
          },
        },
        mediaUploadField('ogImage', 'Social Share Image', 'Image for social sharing (1200x630px recommended)'),
      ],
    },
  ],
  access: {
    read: () => true, // Categories are public for blog pages
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
}

export default Categories
