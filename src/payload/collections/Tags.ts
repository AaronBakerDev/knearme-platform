/**
 * Tags Collection - Article Tagging
 *
 * Flat taxonomy for cross-cutting concerns that span multiple categories.
 * Unlike Categories (hierarchical), Tags are a simple list without parent/child
 * relationships. Used for topics like "SEO", "Tips", "Featured", etc.
 *
 * @see PAY-035 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/configuration/collections
 */
import type { CollectionConfig } from 'payload'

/**
 * Tags collection configuration
 *
 * Fields:
 * - name (required): Tag display name
 * - slug (unique): URL identifier for tag filtering (/blog?tag=[slug])
 * - description: Optional description of what the tag represents
 */
export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    description: 'Tags for article categorization (flat taxonomy).',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Tag Name',
      required: true,
      admin: {
        description: 'Display name for the tag (e.g., "SEO", "Tips", "Featured")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: {
        description: 'URL identifier (e.g., "seo" for /blog?tag=seo)',
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
        description: 'Optional description of what this tag represents',
      },
    },
  ],
  access: {
    read: () => true, // Tags are public for blog filtering
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
}

export default Tags
