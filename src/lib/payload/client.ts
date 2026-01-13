/**
 * Payload CMS Client Helper
 *
 * Provides a cached Payload client and typed query functions for all collections
 * and globals. Use these helpers in Server Components for data fetching.
 *
 * Usage:
 *   import { getPayloadClient, getFAQs, getSiteSettings } from '@/lib/payload/client'
 *
 *   // In a Server Component:
 *   const faqs = await getFAQs()
 *   const settings = await getSiteSettings()
 *
 * @see PAY-008 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/local-api/overview
 */
import { getPayload as getPayloadBase, type Payload } from 'payload'
import config from '@payload-config'

// ============================================================================
// Types
// ============================================================================

/**
 * FAQ item from Payload CMS
 */
export interface FAQ {
  id: string
  question: string
  answer: string
  category: 'general' | 'pricing' | 'features' | 'technical'
  order: number
  showOnLanding: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Feature from a pricing tier
 */
export interface PricingFeature {
  text: string
}

/**
 * Pricing tier from Payload CMS
 */
export interface PricingTier {
  id: string
  name: string
  description?: string
  monthlyPrice: number
  yearlyPrice: number
  features: PricingFeature[]
  ctaText: string
  ctaLink: string
  ctaVariant: 'default' | 'outline' | 'secondary'
  isHighlighted: boolean
  badge?: string
  order: number
  createdAt: string
  updatedAt: string
}

/**
 * Testimonial from Payload CMS
 */
export interface Testimonial {
  id: string
  name: string
  role?: string
  content: unknown // Lexical rich text content
  rating?: number
  avatar?: MediaReference
  featured: boolean
  order: number
  createdAt: string
  updatedAt: string
}

/**
 * Feature highlight from Payload CMS
 */
export interface Feature {
  id: string
  title: string
  description: string
  icon: string
  order: number
  showOnLanding: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Service type from Payload CMS
 */
export interface ServiceType {
  id: string
  name: string
  slug: string
  headline: string
  description: unknown // Lexical rich text content
  features: { feature: string }[]
  metaDescription?: string
  ogImage?: MediaReference
  createdAt: string
  updatedAt: string
}

/**
 * Media reference (image/file upload)
 */
export interface MediaReference {
  id: string
  url?: string
  alt?: string
  width?: number
  height?: number
  filename?: string
  mimeType?: string
}

/**
 * Author from Payload CMS
 */
export interface Author {
  id: string
  name: string
  slug: string
  email?: string
  avatar?: MediaReference
  bio?: unknown // Lexical rich text content
  role?: string
  social?: {
    twitter?: string
    linkedin?: string
    website?: string
  }
  seo?: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: MediaReference
  }
  createdAt: string
  updatedAt: string
}

/**
 * Category from Payload CMS
 */
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent?: Category | string
  featuredImage?: MediaReference
  seo?: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: MediaReference
  }
  createdAt: string
  updatedAt: string
}

/**
 * Tag from Payload CMS
 */
export interface Tag {
  id: string
  name: string
  slug: string
  description?: string
  createdAt: string
  updatedAt: string
}

/**
 * Table of contents entry for articles
 */
export interface TOCEntry {
  id: string
  text: string
  level: number
}

/**
 * Article from Payload CMS
 */
export interface Article {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: unknown // Lexical rich text content
  featuredImage?: MediaReference
  author?: Author | string
  category?: Category | string
  tags?: (Tag | string)[]
  relatedArticles?: (Article | string)[]
  publishedAt?: string
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  readingTime?: number
  wordCount?: number
  tableOfContents?: TOCEntry[]
  seo?: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: MediaReference
    canonicalUrl?: string
    noIndex?: boolean
  }
  createdAt: string
  updatedAt: string
}

/**
 * Link item for navigation
 */
export interface NavLink {
  label: string
  href: string
  newTab?: boolean
}

/**
 * Quick link with icon and style options
 */
export interface QuickLink extends NavLink {
  icon?: string
  variant?: 'link' | 'button-primary' | 'button-secondary' | 'button-outline'
}

/**
 * Footer column with links
 */
export interface FooterColumn {
  columnTitle: string
  links: NavLink[]
}

/**
 * Navigation global from Payload CMS
 */
export interface Navigation {
  headerLinks?: NavLink[]
  footerLinks?: FooterColumn[]
  quickLinks?: QuickLink[]
}

/**
 * Social links configuration
 */
export interface SocialLinks {
  twitter?: string
  linkedin?: string
  facebook?: string
}

/**
 * Site settings global from Payload CMS
 */
export interface SiteSettings {
  siteName: string
  tagline?: string
  logo?: MediaReference
  contactEmail?: string
  socialLinks?: SocialLinks
  defaultMetaDescription?: string
  defaultOgImage?: MediaReference
}

// ============================================================================
// Payload Client
// ============================================================================

/**
 * Cached Payload client instance
 * Uses module-level caching for efficient reuse across requests
 */
let cachedPayload: Payload | null = null

/**
 * Get the Payload client instance (cached for efficiency)
 *
 * This function creates a single Payload client instance that's reused
 * across multiple requests within the same server process.
 *
 * @returns Promise<Payload> - The Payload client instance
 *
 * @example
 * const payload = await getPayloadClient()
 * const result = await payload.find({ collection: 'faqs' })
 */
export async function getPayloadClient(): Promise<Payload> {
  if (cachedPayload) {
    return cachedPayload
  }

  cachedPayload = await getPayloadBase({ config })
  return cachedPayload
}

// Alias for compatibility with PRD naming
export const getPayload = getPayloadClient

// ============================================================================
// Collection Query Functions
// ============================================================================

/**
 * Fetch FAQs from Payload CMS
 *
 * @param options.showOnLandingOnly - Only return FAQs marked for landing page
 * @param options.category - Filter by category
 * @param options.limit - Maximum number of FAQs to return
 * @returns Promise<FAQ[]> - Array of FAQ items
 *
 * @example
 * // Get all landing page FAQs
 * const faqs = await getFAQs({ showOnLandingOnly: true })
 *
 * // Get pricing FAQs only
 * const pricingFaqs = await getFAQs({ category: 'pricing' })
 */
export async function getFAQs(options?: {
  showOnLandingOnly?: boolean
  category?: 'general' | 'pricing' | 'features' | 'technical'
  limit?: number
}): Promise<FAQ[]> {
  const payload = await getPayloadClient()

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {
    _status: { equals: 'published' },
  }

  if (options?.showOnLandingOnly) {
    where.showOnLanding = { equals: true }
  }

  if (options?.category) {
    where.category = { equals: options.category }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'faqs',
    where,
    sort: 'order',
    limit: options?.limit || 100,
  })

  return (result.docs || []) as FAQ[]
}

/**
 * Fetch pricing tiers from Payload CMS
 *
 * @param options.limit - Maximum number of tiers to return
 * @returns Promise<PricingTier[]> - Array of pricing tiers sorted by order
 *
 * @example
 * const tiers = await getPricingTiers()
 */
export async function getPricingTiers(options?: {
  limit?: number
}): Promise<PricingTier[]> {
  const payload = await getPayloadClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'pricing-tiers',
    where: {
      _status: { equals: 'published' },
    },
    sort: 'order',
    limit: options?.limit || 10,
  })

  return (result.docs || []) as PricingTier[]
}

/**
 * Fetch testimonials from Payload CMS
 *
 * @param options.featuredOnly - Only return featured testimonials
 * @param options.limit - Maximum number of testimonials to return
 * @returns Promise<Testimonial[]> - Array of testimonials sorted by order
 *
 * @example
 * const testimonials = await getTestimonials({ featuredOnly: true, limit: 3 })
 */
export async function getTestimonials(options?: {
  featuredOnly?: boolean
  limit?: number
}): Promise<Testimonial[]> {
  const payload = await getPayloadClient()

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {
    _status: { equals: 'published' },
  }

  if (options?.featuredOnly) {
    where.featured = { equals: true }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'testimonials',
    where,
    sort: 'order',
    limit: options?.limit || 20,
    depth: 1, // Populate avatar
  })

  return (result.docs || []) as Testimonial[]
}

/**
 * Fetch features from Payload CMS
 *
 * @param options.showOnLandingOnly - Only return features marked for landing page
 * @param options.limit - Maximum number of features to return
 * @returns Promise<Feature[]> - Array of features sorted by order
 *
 * @example
 * const features = await getFeatures({ showOnLandingOnly: true })
 */
export async function getFeatures(options?: {
  showOnLandingOnly?: boolean
  limit?: number
}): Promise<Feature[]> {
  const payload = await getPayloadClient()

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {
    _status: { equals: 'published' },
  }

  if (options?.showOnLandingOnly) {
    where.showOnLanding = { equals: true }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'features',
    where,
    sort: 'order',
    limit: options?.limit || 20,
  })

  return (result.docs || []) as Feature[]
}

/**
 * Fetch a service type by slug from Payload CMS
 *
 * @param slug - The service type slug
 * @returns Promise<ServiceType | null> - The service type or null if not found
 *
 * @example
 * const service = await getServiceType('chimney-repair')
 */
export async function getServiceType(slug: string): Promise<ServiceType | null> {
  const payload = await getPayloadClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'service-types',
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
    limit: 1,
    depth: 1, // Populate ogImage
  })

  return (result.docs?.[0] || null) as ServiceType | null
}

/**
 * Fetch all service types from Payload CMS
 *
 * @returns Promise<ServiceType[]> - Array of all service types
 *
 * @example
 * const services = await getServiceTypes()
 */
export async function getServiceTypes(): Promise<ServiceType[]> {
  const payload = await getPayloadClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'service-types',
    where: {
      _status: { equals: 'published' },
    },
    sort: 'name',
    limit: 50,
    depth: 1,
  })

  return (result.docs || []) as ServiceType[]
}

/**
 * Fetch articles from Payload CMS
 *
 * @param options.status - Filter by status (default: published)
 * @param options.categorySlug - Filter by category slug
 * @param options.authorSlug - Filter by author slug
 * @param options.tagId - Filter by tag ID
 * @param options.limit - Maximum number of articles to return (default: 10)
 * @param options.page - Page number for pagination (default: 1)
 * @returns Promise<{ docs: Article[], totalPages: number, totalDocs: number }>
 *
 * @example
 * const { docs: articles, totalPages } = await getArticles({ limit: 10, page: 1 })
 */
export async function getArticles(options?: {
  status?: 'draft' | 'scheduled' | 'published' | 'archived'
  categorySlug?: string
  authorSlug?: string
  tagId?: string
  limit?: number
  page?: number
}): Promise<{ docs: Article[]; totalPages: number; totalDocs: number }> {
  const payload = await getPayloadClient()

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {
    status: { equals: options?.status || 'published' },
  }

  // If filtering by category, we need to look up the category first
  if (options?.categorySlug) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categoryResult = await (payload as any).find({
      collection: 'categories',
      where: { slug: { equals: options.categorySlug } },
      limit: 1,
    })
    const category = categoryResult.docs?.[0]
    if (category) {
      where['category'] = { equals: category.id }
    }
  }

  // If filtering by author, look up the author first
  if (options?.authorSlug) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authorResult = await (payload as any).find({
      collection: 'authors',
      where: { slug: { equals: options.authorSlug } },
      limit: 1,
    })
    const author = authorResult.docs?.[0]
    if (author) {
      where['author'] = { equals: author.id }
    }
  }

  // If filtering by tag
  if (options?.tagId) {
    where.tags = { contains: options.tagId }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'articles',
    where,
    sort: '-publishedAt',
    limit: options?.limit || 10,
    page: options?.page || 1,
    depth: 1, // Populate author, category
  })

  return {
    docs: (result.docs || []) as Article[],
    totalPages: result.totalPages as number,
    totalDocs: result.totalDocs as number,
  }
}

/**
 * Fetch a single article by slug from Payload CMS
 *
 * @param slug - The article slug
 * @returns Promise<Article | null> - The article or null if not found
 *
 * @example
 * const article = await getArticle('my-first-post')
 */
export async function getArticle(slug: string): Promise<Article | null> {
  const payload = await getPayloadClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'articles',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    limit: 1,
    depth: 2, // Deep populate for related articles
  })

  return (result.docs?.[0] || null) as Article | null
}

/**
 * Fetch authors from Payload CMS
 *
 * @param options.limit - Maximum number of authors to return
 * @returns Promise<Author[]> - Array of authors
 *
 * @example
 * const authors = await getAuthors()
 */
export async function getAuthors(options?: {
  limit?: number
}): Promise<Author[]> {
  const payload = await getPayloadClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'authors',
    sort: 'name',
    limit: options?.limit || 50,
    depth: 1, // Populate avatar
  })

  return (result.docs || []) as Author[]
}

/**
 * Fetch a single author by slug from Payload CMS
 *
 * @param slug - The author slug
 * @returns Promise<Author | null> - The author or null if not found
 *
 * @example
 * const author = await getAuthor('jane-smith')
 */
export async function getAuthor(slug: string): Promise<Author | null> {
  const payload = await getPayloadClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'authors',
    where: {
      slug: { equals: slug },
    },
    limit: 1,
    depth: 1,
  })

  return (result.docs?.[0] || null) as Author | null
}

/**
 * Fetch categories from Payload CMS
 *
 * @param options.limit - Maximum number of categories to return
 * @returns Promise<Category[]> - Array of categories
 *
 * @example
 * const categories = await getCategories()
 */
export async function getCategories(options?: {
  limit?: number
}): Promise<Category[]> {
  const payload = await getPayloadClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'categories',
    sort: 'name',
    limit: options?.limit || 50,
    depth: 1, // Populate parent, featuredImage
  })

  return (result.docs || []) as Category[]
}

/**
 * Fetch a single category by slug from Payload CMS
 *
 * @param slug - The category slug
 * @returns Promise<Category | null> - The category or null if not found
 *
 * @example
 * const category = await getCategory('marketing-tips')
 */
export async function getCategory(slug: string): Promise<Category | null> {
  const payload = await getPayloadClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'categories',
    where: {
      slug: { equals: slug },
    },
    limit: 1,
    depth: 1,
  })

  return (result.docs?.[0] || null) as Category | null
}

/**
 * Fetch tags from Payload CMS
 *
 * @param options.limit - Maximum number of tags to return
 * @returns Promise<Tag[]> - Array of tags
 *
 * @example
 * const tags = await getTags()
 */
export async function getTags(options?: {
  limit?: number
}): Promise<Tag[]> {
  const payload = await getPayloadClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'tags',
    sort: 'name',
    limit: options?.limit || 100,
  })

  return (result.docs || []) as Tag[]
}

/**
 * Fetch a single tag by slug from Payload CMS
 *
 * @param slug - The tag slug
 * @returns Promise<Tag | null> - The tag or null if not found
 *
 * @example
 * const tag = await getTag('seo')
 */
export async function getTag(slug: string): Promise<Tag | null> {
  const payload = await getPayloadClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'tags',
    where: {
      slug: { equals: slug },
    },
    limit: 1,
  })

  return (result.docs?.[0] || null) as Tag | null
}

// ============================================================================
// Global Query Functions
// ============================================================================

/**
 * Fetch site settings global from Payload CMS
 *
 * @returns Promise<SiteSettings | null> - Site settings or null if not configured
 *
 * @example
 * const settings = await getSiteSettings()
 * console.log(settings?.siteName)
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const payload = await getPayloadClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).findGlobal({
      slug: 'site-settings',
      depth: 1, // Populate logo, defaultOgImage
    })

    return result as SiteSettings
  } catch {
    // Global may not exist yet
    return null
  }
}

/**
 * Fetch navigation global from Payload CMS
 *
 * @returns Promise<Navigation | null> - Navigation config or null if not configured
 *
 * @example
 * const nav = await getNavigation()
 * console.log(nav?.headerLinks)
 */
export async function getNavigation(): Promise<Navigation | null> {
  const payload = await getPayloadClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).findGlobal({
      slug: 'navigation',
      depth: 1,
    })

    return result as Navigation
  } catch {
    // Global may not exist yet
    return null
  }
}
