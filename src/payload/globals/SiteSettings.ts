/**
 * Site Settings Global - Site-wide Configuration
 *
 * Manages global site configuration accessible across all pages.
 * Includes branding, contact info, social links, and SEO defaults.
 *
 * Usage:
 *   import { getSiteSettings } from '@/lib/payload/client'
 *   const settings = await getSiteSettings()
 *
 * @see PAY-019 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/configuration/globals
 */
import type { GlobalConfig, Field } from 'payload'

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
 * Site Settings global configuration
 *
 * Fields:
 * - siteName: Primary site/brand name
 * - tagline: Site tagline/slogan
 * - logo: Site logo image
 * - contactEmail: Primary contact email
 * - socialLinks: Group with twitter, linkedin, facebook URLs
 * - SEO defaults: defaultMetaDescription, defaultOgImage
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings',
    description: 'Global site configuration for branding, contact, and SEO defaults.',
  },
  access: {
    read: () => true, // Anyone can read site settings (needed for public pages)
    update: ({ req: { user } }) => Boolean(user), // Only authenticated users can update
  },
  fields: [
    // Branding Section
    {
      type: 'collapsible',
      label: 'Branding',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'siteName',
          type: 'text',
          label: 'Site Name',
          required: true,
          defaultValue: 'KnearMe',
          admin: {
            description: 'Primary site/brand name displayed in header and title',
          },
        },
        {
          name: 'tagline',
          type: 'text',
          label: 'Tagline',
          admin: {
            description: 'Short tagline or slogan (e.g., "Turn your finished work into your best salesperson")',
          },
        },
        mediaUploadField('logo', 'Site Logo', 'Main logo displayed in header (recommended: SVG or PNG with transparency)'),
      ],
    },

    // Contact Section
    {
      type: 'collapsible',
      label: 'Contact Information',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'contactEmail',
          type: 'email',
          label: 'Contact Email',
          admin: {
            description: 'Primary contact email address (displayed in footer, contact pages)',
          },
        },
      ],
    },

    // Social Links Section
    {
      type: 'collapsible',
      label: 'Social Links',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'socialLinks',
          type: 'group',
          label: 'Social Media Links',
          admin: {
            description: 'Links to social media profiles',
          },
          fields: [
            {
              name: 'twitter',
              type: 'text',
              label: 'Twitter/X URL',
              admin: {
                description: 'Full Twitter/X profile URL (e.g., https://twitter.com/knearme)',
              },
            },
            {
              name: 'linkedin',
              type: 'text',
              label: 'LinkedIn URL',
              admin: {
                description: 'Full LinkedIn company page URL',
              },
            },
            {
              name: 'facebook',
              type: 'text',
              label: 'Facebook URL',
              admin: {
                description: 'Full Facebook page URL',
              },
            },
          ],
        },
      ],
    },

    // SEO Defaults Section
    {
      type: 'collapsible',
      label: 'SEO Defaults',
      admin: {
        initCollapsed: true,
        description: 'Default SEO values used when pages don\'t specify their own',
      },
      fields: [
        {
          name: 'defaultMetaDescription',
          type: 'textarea',
          label: 'Default Meta Description',
          admin: {
            description: 'Default description for search results (150-160 characters). Used when pages don\'t specify their own.',
          },
        },
        mediaUploadField('defaultOgImage', 'Default Social Share Image', 'Default image for social sharing when pages don\'t specify one (1200x630px recommended)'),
      ],
    },
  ],
}

export default SiteSettings
