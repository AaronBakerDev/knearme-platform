/**
 * Features Seed Script
 *
 * Seeds existing feature content from the hardcoded fallback in FeatureGrid.tsx
 * into the Payload CMS Features collection. This is a one-time migration script.
 *
 * Run with:
 *   npx tsx src/payload/seed/features.ts
 *
 * Prerequisites:
 * - DATABASE_URL environment variable set (Supabase PostgreSQL)
 * - PAYLOAD_SECRET environment variable set
 *
 * Note: PRD mentions 7 features but FALLBACK_FEATURES in FeatureGrid.tsx only
 * contains 3. This script seeds the 3 actual features from the source code.
 *
 * @see PAY-029 in PRD for acceptance criteria
 * @see src/components/marketing/FeatureGrid.tsx for source content (FALLBACK_FEATURES)
 * @see src/payload/collections/Features.ts for icon options
 */

import { getPayload } from 'payload'
import config from '../../payload/payload.config.ts'

/**
 * Source feature content - matches FALLBACK_FEATURES from FeatureGrid.tsx exactly
 *
 * Each feature has:
 * - icon: String identifier matching lucide-react icon name (from Features.ts collection)
 * - title: Feature headline
 * - description: Detailed feature description
 * - order: Display order
 * - showOnLanding: Whether to show on landing page
 */
const FEATURE_DATA = [
  {
    icon: 'Mic',
    title: 'Voice-First Creation',
    description:
      "Describe your project like you're talking to a customer. We turn your words into polished case studies—no typing, no staring at a blank page.",
    order: 1,
    showOnLanding: true,
  },
  {
    icon: 'Search',
    title: 'Built for Local Search',
    description:
      "Every project page is structured to help you show up when homeowners search for services in your area. Real visibility, not just a pretty portfolio.",
    order: 2,
    showOnLanding: true,
  },
  {
    icon: 'Layout',
    title: 'Professional Without the Price Tag',
    description:
      "Clean, modern layouts that make your work look as good as it deserves. Mobile-friendly and ready to impress potential customers.",
    order: 3,
    showOnLanding: true,
  },
]

/**
 * Main seed function
 *
 * Inserts all feature content into Payload CMS. Skips duplicates based on
 * feature title to make the script idempotent (safe to run multiple times).
 */
async function seedFeatures() {
  console.log('Starting Features seed...')
  console.log(`Found ${FEATURE_DATA.length} features to seed`)

  // Initialize Payload client with config
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0

  for (const feature of FEATURE_DATA) {
    try {
      // Check if feature already exists by title
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = await (payload as any).find({
        collection: 'features',
        where: {
          title: { equals: feature.title },
        },
        limit: 1,
      })

      if (existing.docs && existing.docs.length > 0) {
        console.log(`⏭️  Skipping existing feature: "${feature.title}"`)
        skipped++
        continue
      }

      // Create new feature
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).create({
        collection: 'features',
        data: {
          title: feature.title,
          description: feature.description,
          icon: feature.icon,
          order: feature.order,
          showOnLanding: feature.showOnLanding,
          _status: 'published', // Publish immediately
        },
      })

      console.log(`✅ Created feature: "${feature.title}" (${feature.icon})`)
      created++
    } catch (error) {
      console.error(`❌ Failed to create feature: "${feature.title}"`, error)
    }
  }

  console.log('\n--- Seed Complete ---')
  console.log(`Created: ${created}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Total: ${FEATURE_DATA.length}`)

  // Exit cleanly
  process.exit(0)
}

// Run the seed script
seedFeatures().catch((error) => {
  console.error('Fatal error during seed:', error)
  process.exit(1)
})
