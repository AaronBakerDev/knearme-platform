/**
 * PageViews Collection - Privacy-Friendly Page View Tracking
 *
 * Stores anonymous page view data for articles without collecting PII.
 * Respects Do Not Track (DNT) browser settings.
 *
 * Privacy principles:
 * - No user IDs or email addresses stored
 * - IP addresses are NOT stored (only derived country if needed)
 * - Respects DNT header (tracking script checks before sending)
 * - Minimal data collection for analytics purposes only
 *
 * @see PAY-064 in PRD for acceptance criteria
 */
import type { CollectionConfig } from 'payload'

/**
 * PageViews Collection Configuration
 *
 * Tracks article views with minimal, privacy-respecting data.
 */
export const PageViews: CollectionConfig = {
  slug: 'page-views',
  admin: {
    useAsTitle: 'articleId',
    defaultColumns: ['articleId', 'timestamp', 'source', 'device'],
    description: 'Anonymous page view tracking for articles.',
    group: 'Analytics',
  },
  fields: [
    // Article reference - stores slug for flexibility (article may be deleted)
    {
      name: 'articleId',
      type: 'text',
      label: 'Article ID',
      required: true,
      index: true,
      admin: {
        description: 'Article slug or ID being viewed',
        readOnly: true,
      },
    },

    // View timestamp
    {
      name: 'timestamp',
      type: 'date',
      label: 'Viewed At',
      required: true,
      index: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        readOnly: true,
      },
      defaultValue: () => new Date().toISOString(),
    },

    // Referrer source (document.referrer)
    {
      name: 'source',
      type: 'text',
      label: 'Source',
      admin: {
        description: 'Referrer URL or "direct" if no referrer',
        readOnly: true,
      },
    },

    // Device type (derived from user agent)
    {
      name: 'device',
      type: 'select',
      label: 'Device Type',
      options: [
        { label: 'Desktop', value: 'desktop' },
        { label: 'Mobile', value: 'mobile' },
        { label: 'Tablet', value: 'tablet' },
        { label: 'Unknown', value: 'unknown' },
      ],
      admin: {
        description: 'Device category derived from user agent',
        readOnly: true,
      },
    },

    // Country code (derived from request, not stored IP)
    {
      name: 'country',
      type: 'text',
      label: 'Country',
      admin: {
        description: 'ISO country code (e.g., US, GB) - derived, not from IP storage',
        readOnly: true,
      },
    },

    // Session identifier for deduplication (anonymous, rotates daily)
    {
      name: 'sessionId',
      type: 'text',
      label: 'Session ID',
      admin: {
        description: 'Anonymous session hash for deduplication (no PII)',
        readOnly: true,
      },
    },
  ],
  access: {
    // Only authenticated users can read analytics
    read: ({ req: { user } }) => Boolean(user),
    // API route creates views (public endpoint with validation)
    create: () => true,
    // No updates to view records
    update: () => false,
    // Only admins can delete analytics data
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  // Sort by newest first
  defaultSort: '-timestamp',
  // Note: Field-level indexes are set via `index: true` on articleId and timestamp fields.
  // Compound indexes would require direct database configuration.
}

export default PageViews
