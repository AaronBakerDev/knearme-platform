/**
 * Redirects Collection - URL Redirect Management
 *
 * Infrastructure collection for managing URL redirects without code deploys.
 * Allows marketing and SEO teams to create, update, and toggle redirects
 * directly from the CMS admin panel.
 *
 * Common use cases:
 * - Moving content to new URLs while preserving SEO juice (301)
 * - Temporary redirects during maintenance (302)
 * - Vanity URLs for campaigns (/promo -> /signup?utm_campaign=...)
 * - Legacy URL support after site restructuring
 *
 * @see PAY-052 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/configuration/collections
 * @see middleware.ts for redirect checking logic
 */
import type { CollectionConfig } from 'payload'

/**
 * Redirect type options with HTTP status codes
 *
 * 301 - Permanent redirect (SEO: transfers link equity)
 * 302 - Temporary redirect (SEO: does not transfer link equity)
 * 307 - Temporary redirect (preserves HTTP method, e.g., POST stays POST)
 * 308 - Permanent redirect (preserves HTTP method)
 */
const REDIRECT_TYPES = [
  {
    label: '301 - Permanent (recommended for SEO)',
    value: '301',
  },
  {
    label: '302 - Temporary',
    value: '302',
  },
  {
    label: '307 - Temporary (preserves method)',
    value: '307',
  },
  {
    label: '308 - Permanent (preserves method)',
    value: '308',
  },
]

/**
 * Redirects collection configuration
 *
 * Fields:
 * - source (required): The URL path to redirect from (e.g., "/old-page")
 * - destination (required): Where to redirect to (path or full URL)
 * - type: HTTP status code for the redirect (default: 301)
 * - enabled: Toggle to quickly enable/disable without deleting
 * - notes: Internal documentation for why this redirect exists
 */
export const Redirects: CollectionConfig = {
  slug: 'redirects',
  admin: {
    useAsTitle: 'source',
    defaultColumns: ['source', 'destination', 'type', 'enabled', 'updatedAt'],
    description: 'Manage URL redirects without code deploys.',
    group: 'Settings',
  },
  fields: [
    {
      name: 'source',
      type: 'text',
      label: 'Source Path',
      required: true,
      unique: true,
      admin: {
        description: 'The URL path to redirect from (e.g., "/old-page", "/blog/old-post")',
        placeholder: '/old-page',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            // Normalize: ensure leading slash, remove trailing slash
            if (!value) return value
            let normalized = value.trim()
            if (!normalized.startsWith('/')) {
              normalized = '/' + normalized
            }
            if (normalized.length > 1 && normalized.endsWith('/')) {
              normalized = normalized.slice(0, -1)
            }
            return normalized
          },
        ],
      },
    },
    {
      name: 'destination',
      type: 'text',
      label: 'Destination',
      required: true,
      admin: {
        description: 'Where to redirect to. Can be a path ("/new-page") or full URL ("https://example.com/page")',
        placeholder: '/new-page',
      },
    },
    {
      name: 'type',
      type: 'select',
      label: 'Redirect Type',
      required: true,
      defaultValue: '301',
      options: REDIRECT_TYPES,
      admin: {
        description: 'HTTP status code. Use 301 for permanent moves (SEO-friendly), 302 for temporary.',
      },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Enabled',
      defaultValue: true,
      admin: {
        description: 'Toggle to quickly enable/disable this redirect without deleting it.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes',
      admin: {
        description: 'Internal notes about why this redirect exists (not public).',
        placeholder: 'e.g., "Migrated blog post to new URL structure on Jan 2025"',
      },
    },
  ],
  access: {
    // Redirects are server-side only, no public read needed
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  // Note: Database indexes are handled automatically by Payload.
  // The `unique: true` on source field creates a unique index.
}

export default Redirects
