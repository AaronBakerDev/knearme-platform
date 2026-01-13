/**
 * Media Collection - Centralized Asset Management
 *
 * Manages all uploaded media (images, documents) for the CMS.
 * Used by Articles, Authors, and other collections for image fields.
 *
 * Image variants are auto-generated for performance optimization:
 * - thumbnail: 150x150px - for admin lists, small previews
 * - card: 400x300px - for article cards, thumbnails
 * - featured: 1200x630px - for social sharing, hero images
 *
 * @see PAY-051 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/upload/overview
 */
import type { CollectionConfig } from 'payload'

/**
 * Media collection configuration
 *
 * Provides centralized asset management with:
 * - Required alt text for accessibility
 * - Auto-extracted metadata (dimensions, file size, mime type)
 * - Image variants for responsive delivery
 * - Folder organization for large libraries
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'mimeType', 'fileSize', 'updatedAt'],
    description: 'Images and files for blog posts and marketing content.',
  },
  upload: {
    // Store files in /media directory (relative to project root)
    staticDir: 'media',
    // Generate responsive image variants
    imageSizes: [
      {
        name: 'thumbnail',
        width: 150,
        height: 150,
        position: 'centre',
      },
      {
        name: 'card',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'featured',
        width: 1200,
        height: 630,
        position: 'centre',
      },
    ],
    // Allowed file types
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt Text',
      required: true,
      admin: {
        description: 'Describe the image for accessibility (required)',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
      admin: {
        description: 'Optional caption displayed below the image',
      },
    },
    {
      name: 'folder',
      type: 'text',
      label: 'Folder',
      admin: {
        description: 'Organize media into folders (e.g., "blog", "authors", "marketing")',
      },
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      admin: {
        description: 'Tags for filtering and search',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
          label: 'Tag',
        },
      ],
    },
  ],
  access: {
    read: () => true, // Media is public for display
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
}

export default Media
