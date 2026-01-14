#!/usr/bin/env npx tsx
/**
 * Seed Script: Populate Payload Navigation global with initial content.
 *
 * This script seeds the Navigation global with marketing and portfolio
 * navigation content for the split navigation architecture.
 *
 * Usage:
 *   # Option 1: Run while dev server is running (requires DATABASE_URL)
 *   DATABASE_URL="postgresql://..." npx tsx scripts/seed-navigation.ts
 *
 *   # Option 2: Use the admin UI at /admin → Settings → Navigation
 *
 * Prerequisites:
 * - DATABASE_URL environment variable set (Supabase connection string)
 * - OR use the Payload admin UI to edit Navigation global directly
 *
 * Note: The MarketingHeader/Footer and PortfolioHeader/Footer components
 * have sensible defaults and work without CMS content. This seed script
 * is optional - content can be edited via /admin at any time.
 *
 * @see src/payload/globals/Navigation.ts
 * @see .claude/plans/jolly-coalescing-feather.md (split navigation architecture)
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { getPayload } from 'payload'
import payloadConfig from '../src/payload/payload.config'

// Load .env.local from project root
config({ path: resolve(process.cwd(), '.env.local') })

/**
 * Marketing header navigation links
 */
const marketingHeaderLinks = [
  { label: 'Services', href: '/services/masonry', newTab: false },
  { label: 'Tools', href: '/tools', newTab: false },
  { label: 'Learn', href: '/learn', newTab: false },
  { label: 'Blog', href: '/blog', newTab: false },
]

/**
 * Marketing header CTA button
 */
const marketingHeaderCta = {
  label: 'Get Started',
  href: '/signup',
  variant: 'default' as const,
}

/**
 * Marketing footer columns with links
 */
const marketingFooterColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features', newTab: false },
      { label: 'Portfolio Examples', href: '/examples', newTab: false },
      { label: 'Pricing', href: '/pricing', newTab: false },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/blog', newTab: false },
      { label: 'Learn', href: '/learn', newTab: false },
      { label: 'Tools', href: '/tools', newTab: false },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about', newTab: false },
      { label: 'Contact', href: '/contact', newTab: false },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Masonry', href: '/services/masonry', newTab: false },
      { label: 'Chimney Repair', href: '/services/chimney-repair', newTab: false },
      { label: 'Tuckpointing', href: '/services/tuckpointing', newTab: false },
    ],
  },
]

/**
 * Marketing footer legal links
 */
const marketingFooterLegal = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
]

/**
 * Portfolio navigation config
 */
const portfolioConfig = {
  headerStyle: 'minimal' as const,
  backText: '← Back to search',
  cta: {
    enabled: true,
    label: 'Need Similar Work?',
    href: '/signup',
  },
  footerText: 'Portfolio powered by KnearMe',
  footerLinks: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
}

async function seedNavigation() {
  console.log('🌱 Seeding Navigation global...\n')

  try {
    // Initialize Payload
    const payload = await getPayload({ config: payloadConfig })

    // Update the Navigation global
    await payload.updateGlobal({
      slug: 'navigation',
      data: {
        // Marketing Navigation
        marketingHeaderLinks,
        marketingHeaderCta,
        marketingFooterColumns,
        marketingFooterLegal,

        // Portfolio Navigation
        portfolioHeaderStyle: portfolioConfig.headerStyle,
        portfolioBackText: portfolioConfig.backText,
        portfolioCta: portfolioConfig.cta,
        portfolioFooterText: portfolioConfig.footerText,
        portfolioFooterLinks: portfolioConfig.footerLinks,
      },
    })

    console.log('✅ Navigation global seeded successfully!\n')
    console.log('Marketing Header Links:', marketingHeaderLinks.length)
    console.log('Marketing Footer Columns:', marketingFooterColumns.length)
    console.log('Portfolio Header Style:', portfolioConfig.headerStyle)
    console.log('Portfolio CTA Enabled:', portfolioConfig.cta.enabled)

    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to seed Navigation global:', error)
    process.exit(1)
  }
}

seedNavigation()
