/**
 * Authors Collection - Blog Post Authors
 *
 * Manages author profiles for blog posts. Each article has an author relationship
 * that links to this collection. Author pages provide E-E-A-T signals for SEO.
 *
 * @see PAY-033 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/configuration/collections
 */
import type { CollectionConfig, Field } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { createRevalidateHook, createRevalidateDeleteHook, revalidatePaths } from '../hooks/revalidate.ts'

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
 * Authors collection configuration
 *
 * Fields:
 * - name (required): Author display name
 * - slug (unique): URL identifier for author pages (/blog/author/[slug])
 * - email: Contact email (optional)
 * - avatar: Profile image
 * - bio: Rich text biography
 * - role: Author's role/title (e.g., "Staff Writer", "Editor")
 * - social: Group with twitter, linkedin, website links
 * - SEO group: metaTitle, metaDescription, ogImage
 */
export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'role', 'updatedAt'],
    description: 'Blog post authors with bio and social links.',
  },
  fields: [
    // Basic Info
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      required: true,
      admin: {
        description: 'Author display name',
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: {
        description: 'URL identifier (e.g., "jane-smith" for /blog/author/jane-smith)',
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
      name: 'email',
      type: 'email',
      label: 'Email',
      admin: {
        description: 'Contact email (not publicly displayed)',
      },
    },
    mediaUploadField('avatar', 'Avatar', 'Profile photo (recommended: 400x400px)'),
    {
      name: 'bio',
      type: 'richText',
      label: 'Biography',
      editor: lexicalEditor({}),
      admin: {
        description: 'Author biography displayed on author page',
      },
    },
    {
      name: 'role',
      type: 'text',
      label: 'Role',
      admin: {
        description: 'Job title or role (e.g., "Staff Writer", "Editor")',
      },
    },

    // Social Links Group
    {
      name: 'social',
      type: 'group',
      label: 'Social Links',
      admin: {
        description: 'Social media and website links',
      },
      fields: [
        {
          name: 'twitter',
          type: 'text',
          label: 'Twitter/X Handle',
          admin: {
            description: 'Twitter handle without @ (e.g., "johndoe")',
          },
        },
        {
          name: 'linkedin',
          type: 'text',
          label: 'LinkedIn URL',
          admin: {
            description: 'Full LinkedIn profile URL',
          },
        },
        {
          name: 'website',
          type: 'text',
          label: 'Personal Website',
          admin: {
            description: 'Personal website or portfolio URL',
          },
        },
      ],
    },

    // SEO Group
    {
      name: 'seo',
      type: 'group',
      label: 'SEO Settings',
      admin: {
        description: 'Search engine optimization for author page',
      },
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          label: 'Meta Title',
          admin: {
            description: 'Override page title for search engines (defaults to author name)',
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
        // OG Preview - shows live preview of social share appearance
        {
          name: 'ogPreview',
          type: 'ui',
          admin: {
            components: {
              Field: './components/OGPreview',
            },
          },
        },
      ],
    },
  ],
  access: {
    read: () => true, // Authors are public for blog pages
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    afterChange: [createRevalidateHook(revalidatePaths.author, 'authors') as any],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    afterDelete: [createRevalidateDeleteHook(revalidatePaths.author, 'authors') as any],
  },
}

export default Authors
