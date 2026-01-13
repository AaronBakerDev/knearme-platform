/**
 * Navigation Global - Menu Management
 *
 * Manages site navigation menus accessible across all pages.
 * Replaces hardcoded navigation arrays with CMS-managed content.
 *
 * Sections:
 * - headerLinks: Primary navigation in the header
 * - footerLinks: Footer navigation organized by columns
 * - quickLinks: Quick access links (e.g., social icons, CTAs)
 *
 * Usage:
 *   import { getNavigation } from '@/lib/payload/client'
 *   const navigation = await getNavigation()
 *
 * @see PAY-020 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/configuration/globals
 */
import type { GlobalConfig, Field } from 'payload'

/**
 * Reusable link field configuration
 * Creates a group with label, href, and newTab fields
 */
const linkFields: Field[] = [
  {
    name: 'label',
    type: 'text',
    label: 'Label',
    required: true,
    admin: {
      description: 'Display text for the link',
    },
  },
  {
    name: 'href',
    type: 'text',
    label: 'URL',
    required: true,
    admin: {
      description: 'Link destination (e.g., /blog, https://example.com)',
    },
  },
  {
    name: 'newTab',
    type: 'checkbox',
    label: 'Open in New Tab',
    defaultValue: false,
    admin: {
      description: 'Open link in a new browser tab',
    },
  },
]

/**
 * Navigation global configuration
 *
 * Provides centralized menu management for:
 * - Header navigation (primary site navigation)
 * - Footer links (organized by column/section)
 * - Quick links (CTAs, social icons, utility links)
 */
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation',
  admin: {
    group: 'Settings',
    description: 'Manage site navigation menus for header, footer, and quick access links.',
  },
  access: {
    read: () => true, // Anyone can read navigation (needed for rendering menus)
    update: ({ req: { user } }) => Boolean(user), // Only authenticated users can update
  },
  fields: [
    // Header Navigation Section
    {
      type: 'collapsible',
      label: 'Header Navigation',
      admin: {
        initCollapsed: false,
        description: 'Primary navigation links displayed in the site header',
      },
      fields: [
        {
          name: 'headerLinks',
          type: 'array',
          label: 'Header Links',
          minRows: 0,
          maxRows: 8, // Reasonable limit for header navigation
          admin: {
            description: 'Main navigation links in the header (max 8 recommended)',
          },
          fields: linkFields,
        },
      ],
    },

    // Footer Navigation Section
    {
      type: 'collapsible',
      label: 'Footer Navigation',
      admin: {
        initCollapsed: true,
        description: 'Footer links organized by column/section',
      },
      fields: [
        {
          name: 'footerLinks',
          type: 'array',
          label: 'Footer Columns',
          minRows: 0,
          maxRows: 4, // Typical footer has 3-4 columns
          admin: {
            description: 'Each item represents a column/section in the footer',
          },
          fields: [
            {
              name: 'columnTitle',
              type: 'text',
              label: 'Column Title',
              required: true,
              admin: {
                description: 'Heading for this footer column (e.g., "Product", "Company")',
              },
            },
            {
              name: 'links',
              type: 'array',
              label: 'Links',
              minRows: 1,
              admin: {
                description: 'Links in this footer column',
              },
              fields: linkFields,
            },
          ],
        },
      ],
    },

    // Quick Links Section
    {
      type: 'collapsible',
      label: 'Quick Links',
      admin: {
        initCollapsed: true,
        description: 'Quick access links for CTAs, social icons, or utility navigation',
      },
      fields: [
        {
          name: 'quickLinks',
          type: 'array',
          label: 'Quick Links',
          minRows: 0,
          maxRows: 6, // Keep quick links concise
          admin: {
            description: 'Quick access links (e.g., "Get Started", social icons)',
          },
          fields: [
            ...linkFields,
            {
              name: 'icon',
              type: 'select',
              label: 'Icon',
              admin: {
                description: 'Optional icon to display with the link',
              },
              options: [
                { label: 'None', value: '' },
                { label: 'Twitter/X', value: 'twitter' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'Facebook', value: 'facebook' },
                { label: 'GitHub', value: 'github' },
                { label: 'Instagram', value: 'instagram' },
                { label: 'YouTube', value: 'youtube' },
                { label: 'Arrow Right', value: 'arrow-right' },
                { label: 'External Link', value: 'external-link' },
              ],
            },
            {
              name: 'variant',
              type: 'select',
              label: 'Style',
              defaultValue: 'link',
              options: [
                { label: 'Link', value: 'link' },
                { label: 'Button (Primary)', value: 'button-primary' },
                { label: 'Button (Secondary)', value: 'button-secondary' },
                { label: 'Button (Outline)', value: 'button-outline' },
              ],
              admin: {
                description: 'Visual style of the link',
              },
            },
          ],
        },
      ],
    },
  ],
}

export default Navigation
