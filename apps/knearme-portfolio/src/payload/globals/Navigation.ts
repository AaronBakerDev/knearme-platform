/**
 * Navigation Global - Split Navigation Architecture
 *
 * Manages context-aware site navigation for different page types:
 * - Marketing pages: Full CMS-controlled navigation with CTAs
 * - Portfolio pages: Minimal chrome where business work is the star
 *
 * Usage:
 *   import { getMarketingNav, getPortfolioNav } from '@/lib/payload/client'
 *   const marketingNav = await getMarketingNav()  // For marketing pages
 *   const portfolioNav = await getPortfolioNav()  // For portfolio/UGC pages
 *
 * @see PAY-020 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/configuration/globals
 * @see .claude/plans/jolly-coalescing-feather.md for split navigation architecture
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
 * Split navigation architecture provides context-aware menus:
 *
 * MARKETING PAGES (full navigation):
 * - Blog, Learn, Services, Tools, About, Contact, Landing page
 * - Full header with nav links + CTA
 * - Multi-column footer with links
 *
 * PORTFOLIO PAGES (minimal chrome):
 * - Business profiles, project showcases, city pages
 * - Minimal header (logo + back link)
 * - Subtle footer with attribution
 * - Optional floating CTA
 */
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation',
  admin: {
    group: 'Settings',
    description: 'Context-aware navigation for marketing and portfolio pages.',
  },
  access: {
    read: () => true, // Anyone can read navigation (needed for rendering menus)
    update: ({ req: { user } }) => Boolean(user), // Only authenticated users can update
  },
  fields: [
    // ══════════════════════════════════════════════════════════════════════════
    // MARKETING NAVIGATION
    // Full header/footer for blog, learn, services, landing page, etc.
    // ══════════════════════════════════════════════════════════════════════════

    // Marketing Header
    {
      type: 'collapsible',
      label: 'Marketing Header',
      admin: {
        initCollapsed: false,
        description: 'Full navigation header for marketing pages (blog, services, landing)',
      },
      fields: [
        {
          name: 'marketingHeaderLinks',
          type: 'array',
          label: 'Header Links',
          minRows: 0,
          maxRows: 8,
          admin: {
            description: 'Main navigation links in the header (max 8 recommended)',
          },
          fields: linkFields,
        },
        {
          name: 'marketingHeaderCta',
          type: 'group',
          label: 'Header CTA Button',
          admin: {
            description: 'Call-to-action button in the header (e.g., "Get Started")',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              label: 'Button Text',
              defaultValue: 'Get Started',
            },
            {
              name: 'href',
              type: 'text',
              label: 'Button Link',
              defaultValue: '/signup',
            },
            {
              name: 'variant',
              type: 'select',
              label: 'Button Style',
              defaultValue: 'default',
              options: [
                { label: 'Primary (Solid)', value: 'default' },
                { label: 'Outline', value: 'outline' },
                { label: 'Secondary', value: 'secondary' },
              ],
            },
          ],
        },
      ],
    },

    // Marketing Footer
    {
      type: 'collapsible',
      label: 'Marketing Footer',
      admin: {
        initCollapsed: true,
        description: 'Multi-column footer for marketing pages',
      },
      fields: [
        {
          name: 'marketingFooterColumns',
          type: 'array',
          label: 'Footer Columns',
          minRows: 0,
          maxRows: 4,
          admin: {
            description: 'Each column has a title and list of links (e.g., Product, Company, Resources)',
          },
          fields: [
            {
              name: 'title',
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
        {
          name: 'marketingFooterLegal',
          type: 'array',
          label: 'Legal Links',
          minRows: 0,
          maxRows: 6,
          admin: {
            description: 'Legal links shown at the bottom (Privacy, Terms, etc.)',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              label: 'Label',
              required: true,
            },
            {
              name: 'href',
              type: 'text',
              label: 'URL',
              required: true,
            },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // PORTFOLIO NAVIGATION
    // Minimal chrome for business profiles, project pages, city listings (UGC)
    // ══════════════════════════════════════════════════════════════════════════

    {
      type: 'collapsible',
      label: 'Portfolio Pages',
      admin: {
        initCollapsed: true,
        description: 'Minimal navigation for business profiles and project showcases. The work is the star.',
      },
      fields: [
        {
          name: 'portfolioHeaderStyle',
          type: 'select',
          label: 'Header Style',
          defaultValue: 'minimal',
          options: [
            { label: 'Minimal (Logo + Back)', value: 'minimal' },
            { label: 'Hidden', value: 'hidden' },
          ],
          admin: {
            description: 'How much header chrome to show on portfolio pages',
          },
        },
        {
          name: 'portfolioBackText',
          type: 'text',
          label: 'Back Link Text',
          defaultValue: '← Back to search',
          admin: {
            description: 'Text for the back/home link in the minimal header',
          },
        },
        {
          name: 'portfolioCta',
          type: 'group',
          label: 'Floating CTA',
          admin: {
            description: 'Optional floating call-to-action button on portfolio pages',
          },
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              label: 'Enable Floating CTA',
              defaultValue: true,
              admin: {
                description: 'Show a floating CTA button on portfolio pages',
              },
            },
            {
              name: 'label',
              type: 'text',
              label: 'CTA Text',
              defaultValue: 'Need Similar Work?',
              admin: {
                condition: (_, siblingData) => siblingData?.enabled,
              },
            },
            {
              name: 'href',
              type: 'text',
              label: 'CTA Link',
              defaultValue: '/signup',
              admin: {
                condition: (_, siblingData) => siblingData?.enabled,
              },
            },
          ],
        },
        {
          name: 'portfolioFooterText',
          type: 'text',
          label: 'Footer Attribution',
          defaultValue: 'Portfolio powered by KnearMe',
          admin: {
            description: 'Subtle attribution text in the portfolio footer',
          },
        },
        {
          name: 'portfolioFooterLinks',
          type: 'array',
          label: 'Footer Links',
          minRows: 0,
          maxRows: 4,
          admin: {
            description: 'Minimal links in portfolio footer (e.g., Privacy, Terms)',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              label: 'Label',
              required: true,
            },
            {
              name: 'href',
              type: 'text',
              label: 'URL',
              required: true,
            },
          ],
        },
      ],
    },

    // ══════════════════════════════════════════════════════════════════════════
    // LEGACY FIELDS (kept for backward compatibility during migration)
    // These will be removed after all components are migrated
    // ══════════════════════════════════════════════════════════════════════════

    {
      type: 'collapsible',
      label: 'Legacy Navigation (Deprecated)',
      admin: {
        initCollapsed: true,
        description: '⚠️ These fields are deprecated. Use Marketing/Portfolio sections above.',
      },
      fields: [
        {
          name: 'headerLinks',
          type: 'array',
          label: 'Header Links (Legacy)',
          minRows: 0,
          maxRows: 8,
          admin: {
            description: '⚠️ Deprecated: Use marketingHeaderLinks instead',
          },
          fields: linkFields,
        },
        {
          name: 'footerLinks',
          type: 'array',
          label: 'Footer Columns (Legacy)',
          minRows: 0,
          maxRows: 4,
          admin: {
            description: '⚠️ Deprecated: Use marketingFooterColumns instead',
          },
          fields: [
            {
              name: 'columnTitle',
              type: 'text',
              label: 'Column Title',
              required: true,
            },
            {
              name: 'links',
              type: 'array',
              label: 'Links',
              minRows: 1,
              fields: linkFields,
            },
          ],
        },
        {
          name: 'quickLinks',
          type: 'array',
          label: 'Quick Links (Legacy)',
          minRows: 0,
          maxRows: 6,
          admin: {
            description: '⚠️ Deprecated: Use marketingHeaderCta instead',
          },
          fields: [
            ...linkFields,
            {
              name: 'icon',
              type: 'select',
              label: 'Icon',
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
            },
          ],
        },
      ],
    },
  ],
}

export default Navigation
