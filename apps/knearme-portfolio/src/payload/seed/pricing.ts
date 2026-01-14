/**
 * Pricing Tiers Seed Script
 *
 * Seeds existing pricing tier content from the hardcoded fallback in Pricing.tsx
 * into the Payload CMS PricingTiers collection. This is a one-time migration script.
 *
 * Run with:
 *   npx tsx src/payload/seed/pricing.ts
 *
 * Prerequisites:
 * - DATABASE_URL environment variable set (Supabase PostgreSQL)
 * - PAYLOAD_SECRET environment variable set
 *
 * @see PAY-010 in PRD for acceptance criteria
 * @see src/components/marketing/Pricing.tsx for source content (FALLBACK_TIERS)
 */

import { getPayload } from 'payload'
import config from '../../payload/payload.config.ts'

/**
 * Source pricing tier content - matches FALLBACK_TIERS from Pricing.tsx exactly
 *
 * These are the 2 hardcoded pricing tiers that will be migrated to the CMS.
 * The features array structure matches the Payload collection schema.
 */
const PRICING_DATA = [
  {
    name: 'Free',
    description: 'Try it on a real job',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { text: 'Publish up to 5 projects' },
      { text: 'Keep them live forever' },
      { text: 'Describe the job by voice' },
      { text: 'Shareable project links' },
    ],
    ctaText: 'Get Started Free',
    ctaLink: '/signup',
    ctaVariant: 'outline' as const,
    isHighlighted: false,
    order: 1,
  },
  {
    name: 'Pro',
    description: 'For contractors ready to grow',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      { text: 'Unlimited projects' },
      { text: 'Everything in Free' },
      { text: 'Voice included (fair use)' },
      { text: 'Get found locally' },
      { text: 'Priority support' },
    ],
    ctaText: 'Start Free Trial',
    ctaLink: '/signup',
    ctaVariant: 'default' as const,
    isHighlighted: true,
    badge: 'Most Popular',
    order: 2,
  },
]

/**
 * Main seed function
 *
 * Inserts all pricing tier content into Payload CMS. Skips duplicates based on
 * tier name to make the script idempotent (safe to run multiple times).
 */
async function seedPricingTiers() {
  console.log('Starting Pricing Tiers seed...')
  console.log(`Found ${PRICING_DATA.length} tiers to seed`)

  // Initialize Payload client with config
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0

  for (const tier of PRICING_DATA) {
    try {
      // Check if tier already exists by name
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = await (payload as any).find({
        collection: 'pricing-tiers',
        where: {
          name: { equals: tier.name },
        },
        limit: 1,
      })

      if (existing.docs && existing.docs.length > 0) {
        console.log(`⏭️  Skipping existing tier: "${tier.name}"`)
        skipped++
        continue
      }

      // Create new pricing tier
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).create({
        collection: 'pricing-tiers',
        data: {
          name: tier.name,
          description: tier.description,
          monthlyPrice: tier.monthlyPrice,
          yearlyPrice: tier.yearlyPrice,
          features: tier.features,
          ctaText: tier.ctaText,
          ctaLink: tier.ctaLink,
          ctaVariant: tier.ctaVariant,
          isHighlighted: tier.isHighlighted,
          badge: tier.badge,
          order: tier.order,
          _status: 'published', // Publish immediately
        },
      })

      console.log(`✅ Created tier: "${tier.name}" - $${tier.monthlyPrice}/mo`)
      created++
    } catch (error) {
      console.error(`❌ Failed to create tier: "${tier.name}"`, error)
    }
  }

  console.log('\n--- Seed Complete ---')
  console.log(`Created: ${created}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Total: ${PRICING_DATA.length}`)

  // Exit cleanly
  process.exit(0)
}

// Run the seed script
seedPricingTiers().catch((error) => {
  console.error('Fatal error during seed:', error)
  process.exit(1)
})
