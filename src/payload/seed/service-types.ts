/**
 * ServiceTypes Seed Script
 *
 * Seeds existing service type content from service-type-descriptions.ts
 * into the Payload CMS ServiceTypes collection. This is a one-time migration script.
 *
 * Run with:
 *   npx tsx src/payload/seed/service-types.ts
 *
 * Prerequisites:
 * - DATABASE_URL environment variable set (Supabase PostgreSQL)
 * - PAYLOAD_SECRET environment variable set
 *
 * Note: The source file has 12 service types (not 11 as mentioned in PRD).
 * This script seeds all 12 service types from the source code.
 *
 * @see PAY-030 in PRD for acceptance criteria
 * @see src/lib/seo/service-type-descriptions.ts for source content
 * @see src/payload/collections/ServiceTypes.ts for collection schema
 */

import { getPayload } from 'payload'
import config from '../../payload/payload.config'

/**
 * Convert plain text to Lexical rich text format
 *
 * Lexical stores content as a structured JSON object with root > children > text.
 * This converts a simple string into the expected format.
 */
function textToLexical(text: string): object {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'text',
              version: 1,
              text: text,
              format: 0,
              style: '',
              mode: 'normal',
              detail: 0,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

/**
 * Convert slug to display name
 * e.g., "chimney-repair" -> "Chimney Repair"
 */
function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Source service type content - matches SERVICE_TYPE_DESCRIPTIONS from
 * src/lib/seo/service-type-descriptions.ts exactly
 *
 * Variables in descriptions: {city}, {state}, {projectCount}, {contractorCount}
 */
const SERVICE_TYPE_DATA = [
  {
    slug: 'chimney-repair',
    headline: 'Professional Chimney Repair & Rebuild Services',
    description:
      'Find expert chimney repair contractors in {city}. From minor mortar repairs to complete chimney rebuilds, browse completed projects and connect with local masonry professionals who specialize in chimney restoration.',
    features: [
      'Chimney cap installation',
      'Crown repair',
      'Flashing repair',
      'Tuckpointing',
      'Complete rebuilds',
    ],
  },
  {
    slug: 'tuckpointing',
    headline: 'Expert Tuckpointing & Repointing Services',
    description:
      "Browse tuckpointing projects in {city} to see the quality of work from local masonry contractors. Tuckpointing restores the mortar joints between bricks, preventing water damage and improving your home's appearance.",
    features: [
      'Mortar joint repair',
      'Historic preservation',
      'Color matching',
      'Structural reinforcement',
      'Weather sealing',
    ],
  },
  {
    slug: 'brick-repair',
    headline: 'Brick Repair & Replacement Specialists',
    description:
      'Need brick repair in {city}? Browse completed brick repair and replacement projects from local contractors. From cracked bricks to full wall restorations, find the right mason for your project.',
    features: [
      'Crack repair',
      'Brick replacement',
      'Spalling repair',
      'Efflorescence removal',
      'Brick cleaning',
    ],
  },
  {
    slug: 'stone-work',
    headline: 'Stone Work & Veneer Installation',
    description:
      'Explore stone masonry projects in {city}. Natural stone and veneer add timeless beauty to any property. See how local contractors transform homes with expert stone installation.',
    features: [
      'Natural stone installation',
      'Stone veneer',
      'Flagstone patios',
      'Stone columns',
      'Decorative accents',
    ],
  },
  {
    slug: 'retaining-walls',
    headline: 'Professional Retaining Wall Construction',
    description:
      'Looking for retaining wall contractors in {city}? Browse completed retaining wall projects that combine structural engineering with aesthetic design to manage slopes and create usable outdoor spaces.',
    features: [
      'Block retaining walls',
      'Stone retaining walls',
      'Drainage solutions',
      'Tiered walls',
      'Landscaping integration',
    ],
  },
  {
    slug: 'concrete-work',
    headline: 'Quality Concrete Work & Construction',
    description:
      'Find concrete contractors in {city} who deliver quality results. From driveways to patios, browse completed concrete projects and see the craftsmanship of local professionals.',
    features: [
      'Driveways',
      'Patios',
      'Sidewalks',
      'Foundations',
      'Decorative concrete',
    ],
  },
  {
    slug: 'foundation-repair',
    headline: 'Foundation Repair & Restoration',
    description:
      'Foundation problems require expert solutions. Browse foundation repair projects in {city} to find contractors experienced in stabilizing and restoring residential and commercial foundations.',
    features: [
      'Crack repair',
      'Wall stabilization',
      'Waterproofing',
      'Underpinning',
      'Structural assessment',
    ],
  },
  {
    slug: 'fireplace',
    headline: 'Fireplace Construction & Restoration',
    description:
      'Add warmth and character to your home with expert fireplace construction in {city}. Browse fireplace projects from local masons who specialize in both traditional and modern designs.',
    features: [
      'Indoor fireplaces',
      'Outdoor fireplaces',
      'Fire pits',
      'Hearth construction',
      'Chimney integration',
    ],
  },
  {
    slug: 'outdoor-living',
    headline: 'Outdoor Living Space Construction',
    description:
      'Transform your backyard in {city} with professional outdoor living construction. Browse patios, outdoor kitchens, and more from local masonry contractors.',
    features: [
      'Outdoor kitchens',
      'Patios',
      'Pergola bases',
      'Built-in seating',
      'Fire features',
    ],
  },
  {
    slug: 'commercial',
    headline: 'Commercial Masonry Services',
    description:
      'Browse commercial masonry projects in {city}. From storefront facades to large-scale construction, see how local contractors deliver quality workmanship on commercial properties.',
    features: [
      'Storefront construction',
      'Building facades',
      'Structural masonry',
      'ADA compliance',
      'Code compliance',
    ],
  },
  {
    slug: 'restoration',
    headline: 'Historic Restoration & Preservation',
    description:
      'Historic buildings require specialized masonry skills. Browse restoration projects in {city} from contractors who understand preservation techniques and period-appropriate materials.',
    features: [
      'Historic preservation',
      'Period-accurate materials',
      'Landmark compliance',
      'Gentle cleaning',
      'Documentation',
    ],
  },
  {
    slug: 'waterproofing',
    headline: 'Masonry Waterproofing & Sealing',
    description:
      'Protect your masonry investment with professional waterproofing in {city}. Browse completed sealing and waterproofing projects that extend the life of brick, stone, and concrete.',
    features: [
      'Brick sealing',
      'Basement waterproofing',
      'Foundation coating',
      'Drainage systems',
      'Moisture barriers',
    ],
  },
]

/**
 * Main seed function
 *
 * Inserts all service type content into Payload CMS. Skips duplicates based on
 * slug to make the script idempotent (safe to run multiple times).
 */
async function seedServiceTypes() {
  console.log('Starting ServiceTypes seed...')
  console.log(`Found ${SERVICE_TYPE_DATA.length} service types to seed`)

  // Initialize Payload client with config
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0

  for (const serviceType of SERVICE_TYPE_DATA) {
    try {
      // Check if service type already exists by slug
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = await (payload as any).find({
        collection: 'service-types',
        where: {
          slug: { equals: serviceType.slug },
        },
        limit: 1,
      })

      if (existing.docs && existing.docs.length > 0) {
        console.log(`⏭️  Skipping existing service type: "${serviceType.slug}"`)
        skipped++
        continue
      }

      // Create new service type with Lexical-formatted description
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).create({
        collection: 'service-types',
        data: {
          name: slugToName(serviceType.slug),
          slug: serviceType.slug,
          headline: serviceType.headline,
          description: textToLexical(serviceType.description),
          features: serviceType.features.map((text) => ({ text })),
          _status: 'published', // Publish immediately
        },
      })

      console.log(`✅ Created service type: "${serviceType.slug}" - ${serviceType.headline}`)
      created++
    } catch (error) {
      console.error(`❌ Failed to create service type: "${serviceType.slug}"`, error)
    }
  }

  console.log('\n--- Seed Complete ---')
  console.log(`Created: ${created}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Total: ${SERVICE_TYPE_DATA.length}`)

  // Exit cleanly
  process.exit(0)
}

// Run the seed script
seedServiceTypes().catch((error) => {
  console.error('Fatal error during seed:', error)
  process.exit(1)
})
