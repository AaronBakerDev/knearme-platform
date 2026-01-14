/**
 * Testimonials Seed Script
 *
 * Seeds existing testimonial content from the hardcoded fallback in Testimonials.tsx
 * into the Payload CMS Testimonials collection. This is a one-time migration script.
 *
 * Run with:
 *   npx tsx src/payload/seed/testimonials.ts
 *
 * Prerequisites:
 * - DATABASE_URL environment variable set (Supabase PostgreSQL)
 * - PAYLOAD_SECRET environment variable set
 *
 * @see PAY-028 in PRD for acceptance criteria
 * @see src/components/marketing/Testimonials.tsx for source content (FALLBACK_TESTIMONIALS)
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
 * Source testimonial content - matches FALLBACK_TESTIMONIALS from Testimonials.tsx exactly
 *
 * These are the 3 hardcoded testimonials that will be migrated to the CMS.
 */
const TESTIMONIAL_DATA = [
  {
    name: 'Mike R.',
    role: 'Rocky Mountain Masonry',
    content:
      'A customer told me they hired me because they saw my chimney work online. That one project paid for a year of KnearMe.',
    rating: 5,
    featured: true,
    order: 1,
  },
  {
    name: 'Carlos M.',
    role: 'Heritage Brickwork',
    content:
      "I used to lose jobs to guys with flashy websites. Now my work speaks for itself. Three new customers last month found me through my projects.",
    rating: 5,
    featured: true,
    order: 2,
  },
  {
    name: 'Tom K.',
    role: 'Keystone Masonry',
    content:
      "My nephew set up my website years ago with three photos. Now I've got 40 projects and customers actually call me saying they found me on Google.",
    rating: 5,
    featured: true,
    order: 3,
  },
]

/**
 * Main seed function
 *
 * Inserts all testimonial content into Payload CMS. Skips duplicates based on
 * customer name to make the script idempotent (safe to run multiple times).
 */
async function seedTestimonials() {
  console.log('Starting Testimonials seed...')
  console.log(`Found ${TESTIMONIAL_DATA.length} testimonials to seed`)

  // Initialize Payload client with config
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0

  for (const testimonial of TESTIMONIAL_DATA) {
    try {
      // Check if testimonial already exists by name
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = await (payload as any).find({
        collection: 'testimonials',
        where: {
          name: { equals: testimonial.name },
        },
        limit: 1,
      })

      if (existing.docs && existing.docs.length > 0) {
        console.log(`⏭️  Skipping existing testimonial: "${testimonial.name}"`)
        skipped++
        continue
      }

      // Create new testimonial with Lexical-formatted content
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).create({
        collection: 'testimonials',
        data: {
          name: testimonial.name,
          role: testimonial.role,
          content: textToLexical(testimonial.content),
          rating: testimonial.rating,
          featured: testimonial.featured,
          order: testimonial.order,
          _status: 'published', // Publish immediately
        },
      })

      console.log(`✅ Created testimonial: "${testimonial.name}" - ${testimonial.role}`)
      created++
    } catch (error) {
      console.error(`❌ Failed to create testimonial: "${testimonial.name}"`, error)
    }
  }

  console.log('\n--- Seed Complete ---')
  console.log(`Created: ${created}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Total: ${TESTIMONIAL_DATA.length}`)

  // Exit cleanly
  process.exit(0)
}

// Run the seed script
seedTestimonials().catch((error) => {
  console.error('Fatal error during seed:', error)
  process.exit(1)
})
