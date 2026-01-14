/**
 * Articles Seed Script
 *
 * Seeds sample blog content into Payload CMS for testing and demonstration.
 * Creates 1 author, 2 categories, 5 tags, and 3 sample articles with
 * relationships configured.
 *
 * Run with:
 *   npx tsx src/payload/seed/articles.ts
 *
 * Prerequisites:
 * - DATABASE_URL environment variable set (Supabase PostgreSQL)
 * - PAYLOAD_SECRET environment variable set
 *
 * @see PAY-050 in PRD for acceptance criteria
 * @see src/payload/collections/Articles.ts for collection schema
 */

import { getPayload } from 'payload'
import config from '../../payload/payload.config.ts'

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
 * Creates Lexical content with multiple paragraphs and headings
 *
 * @param sections - Array of {type: 'paragraph'|'heading', text, level?}
 */
function createRichContent(
  sections: Array<{ type: 'paragraph' | 'heading'; text: string; level?: 2 | 3 }>
): object {
  const children = sections.map((section) => {
    if (section.type === 'heading') {
      return {
        type: 'heading',
        version: 1,
        tag: `h${section.level || 2}`,
        children: [
          {
            type: 'text',
            version: 1,
            text: section.text,
            format: 0,
            style: '',
            mode: 'normal',
            detail: 0,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
      }
    }
    return {
      type: 'paragraph',
      version: 1,
      children: [
        {
          type: 'text',
          version: 1,
          text: section.text,
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
    }
  })

  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

// ============================================================================
// SEED DATA
// ============================================================================

/**
 * Author data - 1 author as specified in PAY-050
 */
const AUTHOR_DATA = {
  name: 'Sarah Mitchell',
  slug: 'sarah-mitchell',
  email: 'sarah@knearme.co',
  role: 'Content Strategist',
  bio: 'Sarah helps contractors tell their stories and showcase their best work. With 10 years in construction marketing, she knows what makes a project stand out.',
  social: {
    twitter: 'sarahmitchell',
    linkedin: 'https://linkedin.com/in/sarahmitchell',
    website: 'https://sarahmitchell.co',
  },
}

/**
 * Categories data - 2 categories as specified in PAY-050
 */
const CATEGORY_DATA = [
  {
    name: 'Business Tips',
    slug: 'business-tips',
    description:
      'Practical advice for growing your contracting business, from marketing to customer relationships.',
  },
  {
    name: 'Industry News',
    slug: 'industry-news',
    description:
      'Stay updated on trends, regulations, and innovations in the construction and masonry industry.',
  },
]

/**
 * Tags data - 5 tags as specified in PAY-050
 */
const TAG_DATA = [
  { name: 'Marketing', slug: 'marketing', description: 'Tips for promoting your work' },
  { name: 'SEO', slug: 'seo', description: 'Search engine optimization for contractors' },
  { name: 'Photography', slug: 'photography', description: 'Capturing your best work' },
  { name: 'Customer Relations', slug: 'customer-relations', description: 'Building trust with clients' },
  { name: 'Featured', slug: 'featured', description: 'Editor picks and highlighted content' },
]

/**
 * Articles data - 3 sample articles with varied content
 * Each article references author, category, and multiple tags
 */
const ARTICLE_DATA = [
  {
    title: 'How to Photograph Your Masonry Projects Like a Pro',
    slug: 'how-to-photograph-masonry-projects',
    excerpt:
      'Learn the simple techniques that make your brick, stone, and concrete work look stunning in photos. No expensive equipment needed.',
    content: createRichContent([
      {
        type: 'paragraph',
        text: 'Great photos can be the difference between winning a job and losing it. When a homeowner is browsing contractors online, they judge your work by what they see. Blurry, dark, or poorly composed photos make even excellent craftsmanship look amateur.',
      },
      { type: 'heading', text: 'The Golden Hour Advantage', level: 2 },
      {
        type: 'paragraph',
        text: "The best time to photograph exterior masonry is during the golden hour - the hour after sunrise or before sunset. The warm, diffused light brings out the texture in brick and stone without creating harsh shadows. If you can only shoot midday, wait for a lightly overcast day when clouds act as a natural diffuser.",
      },
      { type: 'heading', text: 'Composition Tips', level: 2 },
      {
        type: 'paragraph',
        text: 'Stand back far enough to capture the full project in context. Show how your work fits with the house or landscape. Then take close-up shots that highlight details - the precision of your mortar joints, the pattern of your brickwork, or the smooth finish of your stonework.',
      },
      { type: 'heading', text: 'Before and After Magic', level: 3 },
      {
        type: 'paragraph',
        text: "Nothing tells your story better than before and after photos. Take your 'before' shot from the exact same angle you plan to use for 'after'. This makes the transformation undeniable and gives potential customers confidence in your abilities.",
      },
      { type: 'heading', text: 'Your Phone Is Enough', level: 2 },
      {
        type: 'paragraph',
        text: "You don't need a fancy camera. Modern smartphones take excellent photos. Just clean your lens (seriously, wipe it on your shirt), hold the phone steady, and tap to focus on your work. The key is consistency - develop a routine and your portfolio will look professional.",
      },
    ]),
    categorySlug: 'business-tips',
    tagSlugs: ['photography', 'marketing', 'featured'],
    status: 'published' as const,
    publishedAt: new Date('2026-01-10T10:00:00Z').toISOString(),
  },
  {
    title: 'Why Local SEO Matters for Masonry Contractors',
    slug: 'local-seo-masonry-contractors',
    excerpt:
      "When homeowners search 'masonry contractor near me', will they find you? Understanding local search can transform your business.",
    content: createRichContent([
      {
        type: 'paragraph',
        text: "Every day, thousands of homeowners search for contractors online. They type things like 'brick repair Denver' or 'stone mason near me' and choose from whoever appears. If you're not showing up in those searches, you're invisible to a huge pool of potential customers.",
      },
      { type: 'heading', text: 'What is Local SEO?', level: 2 },
      {
        type: 'paragraph',
        text: "Local SEO is simply making sure your business appears when people in your area search for your services. Google uses hundreds of factors to decide who shows up first, but the basics are straightforward: claim your Google Business Profile, get reviews, and have a website that mentions your location and services.",
      },
      { type: 'heading', text: 'The Portfolio Advantage', level: 2 },
      {
        type: 'paragraph',
        text: "Here's where most contractors miss out. Search engines love fresh, detailed content about specific services. Every project you publish creates a new page that can rank for searches like 'chimney rebuild Lakewood CO' or 'brick patio installation Aurora'. The more projects you document, the more chances you have to be found.",
      },
      { type: 'heading', text: 'Reviews Build Trust and Rankings', level: 3 },
      {
        type: 'paragraph',
        text: "Google rewards businesses with genuine reviews. After completing a job, ask satisfied customers to leave a review. It doesn't need to be complicated - a simple 'If you're happy with the work, a Google review would mean a lot' works perfectly.",
      },
      { type: 'heading', text: 'Start Small, Stay Consistent', level: 2 },
      {
        type: 'paragraph',
        text: "You don't need to become an SEO expert. Focus on documenting your work consistently, keeping your business information accurate across the web, and delivering great results that earn reviews. The search rankings will follow.",
      },
    ]),
    categorySlug: 'business-tips',
    tagSlugs: ['seo', 'marketing'],
    status: 'published' as const,
    publishedAt: new Date('2026-01-08T14:00:00Z').toISOString(),
  },
  {
    title: 'Building Trust: How Your Portfolio Wins Jobs Before You Say a Word',
    slug: 'building-trust-portfolio-wins-jobs',
    excerpt:
      'Discover why homeowners choose contractors based on visible proof of work - and how to give them exactly what they need to say yes.',
    content: createRichContent([
      {
        type: 'paragraph',
        text: 'Ninety-two percent of homeowners trust personal referrals when hiring contractors. But what happens when they don\'t have a referral? They Google. And in those crucial moments, your visible portfolio becomes your silent salesperson.',
      },
      { type: 'heading', text: 'The Trust Gap', level: 2 },
      {
        type: 'paragraph',
        text: "Homeowners hiring contractors face a real dilemma. They're about to hand over thousands of dollars to someone they've never met, for work they can't easily evaluate until it's done. They're looking for any signal that reduces their risk. Your documented work provides that signal.",
      },
      { type: 'heading', text: 'What Homeowners Actually Look For', level: 2 },
      {
        type: 'paragraph',
        text: "When browsing contractor portfolios, homeowners aren't just looking at pretty pictures. They're asking: Does this contractor do work similar to what I need? Is their work quality visible and consistent? Do they work in my area? Can I imagine this person working at my home?",
      },
      { type: 'heading', text: 'Quality Over Quantity', level: 3 },
      {
        type: 'paragraph',
        text: "You don't need 100 projects to win trust. Five to ten well-documented projects with clear photos and honest descriptions can be more powerful than a massive portfolio of low-quality entries. Each project should tell a story: what the customer needed, what you did, and how it turned out.",
      },
      { type: 'heading', text: 'Your Work Speaks Louder Than Ads', level: 2 },
      {
        type: 'paragraph',
        text: "Advertising tells people you're a good contractor. Your portfolio proves it. When a homeowner can see a chimney rebuild that looks exactly like what they need, in a neighborhood near theirs, that's worth more than any marketing message. Let your craftsmanship do the convincing.",
      },
    ]),
    categorySlug: 'industry-news',
    tagSlugs: ['customer-relations', 'marketing', 'featured'],
    status: 'published' as const,
    publishedAt: new Date('2026-01-05T09:00:00Z').toISOString(),
  },
]

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

/**
 * Seeds the author and returns their ID
 */
async function seedAuthor(payload: Awaited<ReturnType<typeof getPayload>>): Promise<string | null> {
  console.log('\n📝 Seeding author...')

  try {
    // Check if author already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (payload as any).find({
      collection: 'authors',
      where: { slug: { equals: AUTHOR_DATA.slug } },
      limit: 1,
    })

    if (existing.docs && existing.docs.length > 0) {
      console.log(`⏭️  Author already exists: "${AUTHOR_DATA.name}"`)
      return existing.docs[0].id
    }

    // Create author
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const author = await (payload as any).create({
      collection: 'authors',
      data: {
        name: AUTHOR_DATA.name,
        slug: AUTHOR_DATA.slug,
        email: AUTHOR_DATA.email,
        role: AUTHOR_DATA.role,
        bio: textToLexical(AUTHOR_DATA.bio),
        social: AUTHOR_DATA.social,
      },
    })

    console.log(`✅ Created author: "${AUTHOR_DATA.name}"`)
    return author.id
  } catch (error) {
    console.error(`❌ Failed to create author:`, error)
    return null
  }
}

/**
 * Seeds categories and returns a map of slug -> ID
 */
async function seedCategories(
  payload: Awaited<ReturnType<typeof getPayload>>
): Promise<Map<string, string>> {
  console.log('\n📁 Seeding categories...')
  const categoryMap = new Map<string, string>()

  for (const category of CATEGORY_DATA) {
    try {
      // Check if category already exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = await (payload as any).find({
        collection: 'categories',
        where: { slug: { equals: category.slug } },
        limit: 1,
      })

      if (existing.docs && existing.docs.length > 0) {
        console.log(`⏭️  Category already exists: "${category.name}"`)
        categoryMap.set(category.slug, existing.docs[0].id)
        continue
      }

      // Create category
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created = await (payload as any).create({
        collection: 'categories',
        data: {
          name: category.name,
          slug: category.slug,
          description: category.description,
        },
      })

      console.log(`✅ Created category: "${category.name}"`)
      categoryMap.set(category.slug, created.id)
    } catch (error) {
      console.error(`❌ Failed to create category: "${category.name}"`, error)
    }
  }

  return categoryMap
}

/**
 * Seeds tags and returns a map of slug -> ID
 */
async function seedTags(
  payload: Awaited<ReturnType<typeof getPayload>>
): Promise<Map<string, string>> {
  console.log('\n🏷️  Seeding tags...')
  const tagMap = new Map<string, string>()

  for (const tag of TAG_DATA) {
    try {
      // Check if tag already exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = await (payload as any).find({
        collection: 'tags',
        where: { slug: { equals: tag.slug } },
        limit: 1,
      })

      if (existing.docs && existing.docs.length > 0) {
        console.log(`⏭️  Tag already exists: "${tag.name}"`)
        tagMap.set(tag.slug, existing.docs[0].id)
        continue
      }

      // Create tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created = await (payload as any).create({
        collection: 'tags',
        data: {
          name: tag.name,
          slug: tag.slug,
          description: tag.description,
        },
      })

      console.log(`✅ Created tag: "${tag.name}"`)
      tagMap.set(tag.slug, created.id)
    } catch (error) {
      console.error(`❌ Failed to create tag: "${tag.name}"`, error)
    }
  }

  return tagMap
}

/**
 * Seeds articles with relationships to author, category, and tags
 */
async function seedArticles(
  payload: Awaited<ReturnType<typeof getPayload>>,
  authorId: string,
  categoryMap: Map<string, string>,
  tagMap: Map<string, string>
): Promise<number> {
  console.log('\n📰 Seeding articles...')
  let created = 0

  for (const article of ARTICLE_DATA) {
    try {
      // Check if article already exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = await (payload as any).find({
        collection: 'articles',
        where: { slug: { equals: article.slug } },
        limit: 1,
      })

      if (existing.docs && existing.docs.length > 0) {
        console.log(`⏭️  Article already exists: "${article.title}"`)
        continue
      }

      // Get category ID
      const categoryId = categoryMap.get(article.categorySlug)
      if (!categoryId) {
        console.error(`❌ Category not found: "${article.categorySlug}"`)
        continue
      }

      // Get tag IDs
      const tagIds = article.tagSlugs
        .map((slug) => tagMap.get(slug))
        .filter((id): id is string => id !== undefined)

      // Create article with relationships
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).create({
        collection: 'articles',
        data: {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          author: authorId,
          category: categoryId,
          tags: tagIds,
          status: article.status,
          publishedAt: article.publishedAt,
          _status: 'published',
        },
      })

      console.log(`✅ Created article: "${article.title}"`)
      created++
    } catch (error) {
      console.error(`❌ Failed to create article: "${article.title}"`, error)
    }
  }

  return created
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

/**
 * Main seed function
 *
 * Creates all entities in order: author -> categories -> tags -> articles
 * The script is idempotent (safe to run multiple times).
 */
async function seedBlogContent() {
  console.log('🚀 Starting blog content seed...')
  console.log('   - 1 author')
  console.log('   - 2 categories')
  console.log('   - 5 tags')
  console.log('   - 3 articles')

  // Initialize Payload client with config
  const payload = await getPayload({ config })

  // Seed in order (respecting dependencies)
  const authorId = await seedAuthor(payload)
  if (!authorId) {
    console.error('\n❌ Failed to create/find author. Aborting.')
    process.exit(1)
  }

  const categoryMap = await seedCategories(payload)
  if (categoryMap.size === 0) {
    console.error('\n❌ Failed to create/find categories. Aborting.')
    process.exit(1)
  }

  const tagMap = await seedTags(payload)
  if (tagMap.size === 0) {
    console.error('\n❌ Failed to create/find tags. Aborting.')
    process.exit(1)
  }

  const articlesCreated = await seedArticles(payload, authorId, categoryMap, tagMap)

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('✨ Blog Content Seed Complete!')
  console.log('='.repeat(50))
  console.log(`Author:     1 (${AUTHOR_DATA.name})`)
  console.log(`Categories: ${categoryMap.size}`)
  console.log(`Tags:       ${tagMap.size}`)
  console.log(`Articles:   ${articlesCreated} created`)
  console.log('')

  // Exit cleanly
  process.exit(0)
}

// Run the seed script
seedBlogContent().catch((error) => {
  console.error('Fatal error during seed:', error)
  process.exit(1)
})
