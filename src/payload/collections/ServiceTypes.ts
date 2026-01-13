/**
 * ServiceTypes Collection - SEO Service Descriptions
 *
 * Manages service type content for SEO-optimized service pages. Replaces hardcoded
 * descriptions in /src/lib/seo/service-type-descriptions.ts with CMS-managed content.
 *
 * Each service type represents a category of masonry work (e.g., chimney repair,
 * tuckpointing, brick repair) with its own headline, description, and feature list.
 *
 * Variables available in description strings: {city}, {state}, {projectCount}, {contractorCount}
 *
 * @see PAY-018 in PRD for acceptance criteria
 * @see /src/lib/seo/service-type-descriptions.ts for the 11 existing service types
 * @see https://payloadcms.com/docs/configuration/collections
 */
import type { CollectionConfig, Field } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

/**
 * Upload field referencing the media collection.
 * Uses type assertion because 'media' isn't in generated CollectionSlug yet.
 * TODO: Remove type assertion after running `npx payload generate:types`
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
 * ServiceTypes collection configuration
 *
 * Fields:
 * - name (required): Display name (e.g., "Chimney Repair")
 * - slug (unique): URL identifier (e.g., "chimney-repair")
 * - headline: Page headline for the service type
 * - description (richText): Full service description with variable placeholders
 * - features: Array of feature/service bullet points
 * - metaDescription: SEO meta description
 * - ogImage: Social sharing image
 */
export const ServiceTypes: CollectionConfig = {
  slug: 'service-types',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'headline', 'updatedAt'],
    description: 'Service type content for SEO-optimized service pages.',
  },
  // Enable versioning with drafts for content review workflow
  versions: {
    drafts: true,
    maxPerDoc: 25, // Keep last 25 versions
  },
  fields: [
    // Basic Info
    {
      name: 'name',
      type: 'text',
      label: 'Service Name',
      required: true,
      admin: {
        description: 'Display name (e.g., "Chimney Repair", "Tuckpointing")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: {
        description: 'URL identifier (e.g., "chimney-repair" for /services/chimney-repair)',
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
      name: 'headline',
      type: 'text',
      label: 'Page Headline',
      required: true,
      admin: {
        description: 'Main headline for service pages (e.g., "Professional Chimney Repair & Rebuild Services")',
      },
    },

    // Content
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      required: true,
      editor: lexicalEditor({}),
      admin: {
        description:
          'Service description with variable placeholders: {city}, {state}, {projectCount}, {contractorCount}',
      },
    },

    // Features Array
    {
      name: 'features',
      type: 'array',
      label: 'Features / Services',
      minRows: 1,
      admin: {
        description: 'List of specific services or features offered under this service type',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          label: 'Feature',
          required: true,
          admin: {
            description: 'e.g., "Chimney cap installation", "Crown repair", "Flashing repair"',
          },
        },
      ],
    },

    // SEO Fields
    {
      name: 'metaDescription',
      type: 'textarea',
      label: 'Meta Description',
      admin: {
        description: 'SEO meta description (150-160 characters). Supports variables: {city}, {state}',
      },
    },
    mediaUploadField('ogImage', 'Social Share Image', 'Image for social sharing (1200x630px recommended)'),
  ],
  access: {
    read: () => true, // Service types are public for SEO pages
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  defaultSort: 'name',
}

export default ServiceTypes
