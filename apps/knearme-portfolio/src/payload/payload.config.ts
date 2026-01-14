/**
 * Payload CMS Configuration for KnearMe Portfolio
 *
 * Colocated deployment strategy: Payload runs inside the Next.js app,
 * sharing the same server and database connection (Supabase PostgreSQL).
 *
 * MVP Scope:
 * - FAQs collection for marketing content
 * - PricingTiers collection for pricing page
 * - Users collection for CMS admin access (separate from Supabase auth)
 *
 * Note: Collections are defined inline due to tsx module resolution constraints
 * in Payload's CLI. This is a known workaround for type generation.
 *
 * @see https://payloadcms.com/docs/configuration/overview
 * @see PAY-001 in PRD for acceptance criteria
 */
import { buildConfig, type CollectionConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import path from 'path'
import { fileURLToPath } from 'url'

// Blog collections
import { Articles } from './collections/Articles'
import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Tags } from './collections/Tags'

// Marketing collections
import { Features } from './collections/Features'
import { ServiceTypes } from './collections/ServiceTypes'
import { Testimonials } from './collections/Testimonials'

// Infrastructure collections
import { Redirects } from './collections/Redirects'

// Engagement collections
import { Forms } from './collections/Forms'
import { FormSubmissions } from './collections/FormSubmissions'

// Analytics collections
import { PageViews } from './collections/PageViews'

// Globals
import { Navigation } from './globals/Navigation'
import { Newsletter } from './globals/Newsletter'
import { SiteSettings } from './globals/SiteSettings'

// Revalidation hooks for ISR
import { createRevalidateHook, createRevalidateDeleteHook, revalidatePaths } from './hooks/revalidate'

// ESM-compatible __dirname
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Users Collection - Payload CMS Admin Authentication
 *
 * Manages CMS admin users, separate from Supabase auth.users.
 * First user created via /admin becomes the initial admin.
 *
 * @see PAY-005 in PRD for acceptance criteria
 */
const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    description: 'CMS admin users. First user becomes admin.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Display Name',
    },
    {
      name: 'role',
      type: 'select',
      label: 'Role',
      defaultValue: 'editor',
      required: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      admin: {
        description: 'Admin has full access. Editor can manage content.',
      },
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { id: { equals: user.id } }
    },
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { id: { equals: user.id } }
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
}

/**
 * FAQs Collection - Marketing FAQ Content
 *
 * Manages FAQ content for the landing page. Replaces hardcoded FAQ data
 * in /src/components/marketing/FAQ.tsx with CMS-managed content.
 *
 * @see PAY-006 in PRD for acceptance criteria
 */
const FAQs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', 'order', 'showOnLanding'],
    description: 'FAQ content for the marketing landing page.',
  },
  // Enable versioning with drafts for content review workflow
  versions: {
    drafts: true,
    maxPerDoc: 25, // Keep last 25 versions
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      label: 'Question',
      required: true,
      admin: {
        description: 'The FAQ question (appears as accordion header)',
      },
    },
    {
      name: 'answer',
      type: 'textarea',
      label: 'Answer',
      required: true,
      admin: {
        description: 'The FAQ answer (plain text for MVP)',
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      defaultValue: 'general',
      options: [
        { label: 'General', value: 'general' },
        { label: 'Pricing', value: 'pricing' },
        { label: 'Features', value: 'features' },
        { label: 'Technical', value: 'technical' },
      ],
      admin: {
        description: 'Category for grouping/filtering FAQs',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Display Order',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first',
      },
    },
    {
      name: 'showOnLanding',
      type: 'checkbox',
      label: 'Show on Landing Page',
      defaultValue: true,
      admin: {
        description: 'Include this FAQ in the landing page section',
      },
    },
  ],
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    afterChange: [createRevalidateHook(revalidatePaths.landingContent, 'faqs') as any],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    afterDelete: [createRevalidateDeleteHook(revalidatePaths.landingContent, 'faqs') as any],
  },
  defaultSort: 'order',
}

/**
 * PricingTiers Collection - Pricing Page Content
 *
 * Manages pricing tier content for the landing page. Replaces hardcoded
 * tier data in /src/components/marketing/Pricing.tsx with CMS-managed content.
 *
 * @see PAY-007 in PRD for acceptance criteria
 */
const PricingTiers: CollectionConfig = {
  slug: 'pricing-tiers',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'monthlyPrice', 'isHighlighted', 'order'],
    description: 'Pricing tiers displayed on the landing page.',
  },
  // Enable versioning with drafts for content review workflow
  versions: {
    drafts: true,
    maxPerDoc: 25, // Keep last 25 versions
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Tier Name',
      required: true,
      admin: {
        description: 'e.g., "Free", "Pro", "Enterprise"',
      },
    },
    {
      name: 'description',
      type: 'text',
      label: 'Short Description',
      admin: {
        description: 'Brief tagline for the tier (appears below name)',
      },
    },
    {
      name: 'monthlyPrice',
      type: 'number',
      label: 'Monthly Price ($)',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Price in dollars (0 for free tier)',
      },
    },
    {
      name: 'yearlyPrice',
      type: 'number',
      label: 'Yearly Price ($)',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Annual price in dollars (0 for free tier)',
      },
    },
    {
      name: 'features',
      type: 'array',
      label: 'Features',
      minRows: 1,
      admin: {
        description: 'List of features included in this tier',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          label: 'Feature Text',
          required: true,
        },
      ],
    },
    {
      name: 'ctaText',
      type: 'text',
      label: 'CTA Button Text',
      defaultValue: 'Get Started',
      admin: {
        description: 'Text for the call-to-action button',
      },
    },
    {
      name: 'ctaLink',
      type: 'text',
      label: 'CTA Button Link',
      defaultValue: '/signup',
      admin: {
        description: 'URL or path for the CTA button',
      },
    },
    {
      name: 'ctaVariant',
      type: 'select',
      label: 'CTA Button Style',
      defaultValue: 'default',
      options: [
        { label: 'Default (Primary)', value: 'default' },
        { label: 'Outline', value: 'outline' },
        { label: 'Secondary', value: 'secondary' },
      ],
      admin: {
        description: 'Visual style of the CTA button',
      },
    },
    {
      name: 'isHighlighted',
      type: 'checkbox',
      label: 'Highlight This Tier',
      defaultValue: false,
      admin: {
        description: 'Add visual emphasis (border, shadow)',
      },
    },
    {
      name: 'badge',
      type: 'text',
      label: 'Badge Text',
      admin: {
        description: 'Optional badge text (e.g., "Most Popular")',
        condition: (data) => data?.isHighlighted,
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Display Order',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first (left to right)',
      },
    },
  ],
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    afterChange: [createRevalidateHook(revalidatePaths.landingContent, 'pricing-tiers') as any],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    afterDelete: [createRevalidateDeleteHook(revalidatePaths.landingContent, 'pricing-tiers') as any],
  },
  defaultSort: 'order',
}

export default buildConfig({
  /**
   * Database Configuration
   *
   * Uses Supabase PostgreSQL with a separate 'payload' schema to avoid
   * conflicts with existing Supabase tables (auth, public, etc.)
   *
   * Connection string format:
   * postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   */
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Use separate schema to avoid conflicts with Supabase
    schemaName: 'payload',
    // Enable auto-push for development (creates tables automatically)
    push: process.env.NODE_ENV === 'development',
  }),

  /**
   * Admin Panel Configuration
   *
   * The admin panel is accessible at /admin and uses Payload's own
   * authentication system (separate from Supabase auth).
   */
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '- KnearMe CMS',
      icons: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          url: '/favicon.svg',
        },
      ],
    },
    /**
     * Custom Admin Views
     *
     * Analytics dashboard for content performance insights.
     * @see PAY-063 in PRD
     */
    components: {
      views: {
        analytics: {
          Component: './views/AnalyticsDashboard',
          path: '/analytics',
        },
      },
    },
  },

  // Rich text editor is configured at runtime via Next.js
  // Lexical import causes ESM/CJS issues with Payload CLI

  /**
   * Collections
   *
   * - Users: CMS admin authentication
   * - Media: Centralized asset management (images, files)
   * - FAQs: Marketing FAQ content
   * - PricingTiers: Pricing page content
   * - Testimonials: Customer testimonials for landing page
   * - Features: Product feature highlights for landing page
   * - ServiceTypes: SEO service descriptions for service pages
   * - Authors: Blog post authors
   * - Categories: Blog category organization
   * - Tags: Article tagging (flat taxonomy)
   * - Articles: Blog posts with rich content
   * - Redirects: URL redirect management (infrastructure)
   * - Forms: Dynamic form builder (engagement)
   * - FormSubmissions: Form response storage (engagement)
   * - PageViews: Anonymous page view tracking (analytics)
   */
  collections: [Users, Media, FAQs, PricingTiers, Testimonials, Features, ServiceTypes, Authors, Categories, Tags, Articles, Redirects, Forms, FormSubmissions, PageViews],

  /**
   * Globals - Site-wide Singletons
   *
   * - SiteSettings: Branding, contact info, social links, SEO defaults
   * - Navigation: Header, footer, and quick access links
   */
  globals: [Navigation, Newsletter, SiteSettings],

  /**
   * JWT Secret for authentication
   *
   * Must be at least 32 characters. Generate with:
   * openssl rand -base64 32
   */
  secret: process.env.PAYLOAD_SECRET || 'DEVELOPMENT-SECRET-CHANGE-IN-PRODUCTION',

  /**
   * TypeScript Type Generation
   *
   * Generates types to /src/types/payload-types.ts for type-safe queries.
   * Run: npx payload generate:types
   */
  typescript: {
    outputFile: path.resolve(dirname, '../types/payload-types.ts'),
  },
})
