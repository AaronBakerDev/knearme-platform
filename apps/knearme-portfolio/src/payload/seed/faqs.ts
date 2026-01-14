/**
 * FAQ Seed Script
 *
 * Seeds existing FAQ content from the hardcoded fallback in FAQ.tsx into
 * the Payload CMS FAQs collection. This is a one-time migration script.
 *
 * Run with:
 *   npx tsx src/payload/seed/faqs.ts
 *
 * Prerequisites:
 * - DATABASE_URL environment variable set (Supabase PostgreSQL)
 * - PAYLOAD_SECRET environment variable set
 *
 * @see PAY-009 in PRD for acceptance criteria
 * @see src/components/marketing/FAQ.tsx for source content
 */

import { getPayload } from 'payload'
import config from '../../payload/payload.config'

/**
 * Source FAQ content - matches FALLBACK_FAQS from FAQ.tsx exactly
 *
 * These are the 7 hardcoded FAQs that will be migrated to the CMS.
 */
const FAQ_DATA = [
  {
    question: "Can I really do this from my phone?",
    answer:
      "Yes, KnearMe is built mobile-first. Upload photos from your camera roll, record your voice description, and publish—all from your phone or tablet. No computer needed.",
    category: 'features' as const,
    order: 1,
    showOnLanding: true,
  },
  {
    question: "What if I'm not good at speaking or describing my work?",
    answer:
      "Just talk like you're explaining the job to a customer. 'We rebuilt this chimney using matching vintage brick. Took about 3 days.' That's all we need. We turn your natural explanation into professional copy.",
    category: 'features' as const,
    order: 2,
    showOnLanding: true,
  },
  {
    question: "How long until my projects show up on Google?",
    answer:
      "Your project pages are live instantly and shareable immediately. Google typically indexes new pages within 1-4 weeks. We optimize every page for local search terms like 'masonry contractor [your city]'.",
    category: 'technical' as const,
    order: 3,
    showOnLanding: true,
  },
  {
    question: "Can I edit my projects after publishing?",
    answer:
      "Absolutely. You can update titles, descriptions, photos, and details anytime. Changes go live immediately.",
    category: 'features' as const,
    order: 4,
    showOnLanding: true,
  },
  {
    question: "What happens to my projects if I cancel?",
    answer:
      "Your published projects stay live on the free plan. If you downgrade from Pro, you keep everything you have, but you can only publish up to 5 total projects unless you upgrade.",
    category: 'pricing' as const,
    order: 5,
    showOnLanding: true,
  },
  {
    question: "Is my data backed up?",
    answer:
      "Yes. All your photos, project details, and account data are automatically backed up daily. Your work is safe with us.",
    category: 'technical' as const,
    order: 6,
    showOnLanding: true,
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Yes. If you're not satisfied with Pro within the first 30 days, we'll refund your subscription—no questions asked.",
    category: 'pricing' as const,
    order: 7,
    showOnLanding: true,
  },
]

/**
 * Main seed function
 *
 * Inserts all FAQ content into Payload CMS. Skips duplicates based on
 * question text to make the script idempotent (safe to run multiple times).
 */
async function seedFAQs() {
  console.log('Starting FAQ seed...')
  console.log(`Found ${FAQ_DATA.length} FAQs to seed`)

  // Initialize Payload client with config
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0

  for (const faq of FAQ_DATA) {
    try {
      // Check if FAQ already exists by question text
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = await (payload as any).find({
        collection: 'faqs',
        where: {
          question: { equals: faq.question },
        },
        limit: 1,
      })

      if (existing.docs && existing.docs.length > 0) {
        console.log(`⏭️  Skipping existing FAQ: "${faq.question.substring(0, 40)}..."`)
        skipped++
        continue
      }

      // Create new FAQ
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).create({
        collection: 'faqs',
        data: {
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          order: faq.order,
          showOnLanding: faq.showOnLanding,
          _status: 'published', // Publish immediately
        },
      })

      console.log(`✅ Created FAQ: "${faq.question.substring(0, 40)}..."`)
      created++
    } catch (error) {
      console.error(`❌ Failed to create FAQ: "${faq.question.substring(0, 40)}..."`, error)
    }
  }

  console.log('\n--- Seed Complete ---')
  console.log(`Created: ${created}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Total: ${FAQ_DATA.length}`)

  // Exit cleanly
  process.exit(0)
}

// Run the seed script
seedFAQs().catch((error) => {
  console.error('Fatal error during seed:', error)
  process.exit(1)
})
