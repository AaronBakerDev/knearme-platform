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
  features: { text: string }[] // Array field with 'text' subfield
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
 * Redirect from Payload CMS
 *
 * Used for URL redirect management without code deploys.
 * @see PAY-052 in PRD for acceptance criteria
 */
export interface Redirect {
  id: string
  source: string
  destination: string
  type: '301' | '302' | '307' | '308'
  enabled: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

/**
 * Page view from Payload CMS
 *
 * Privacy-friendly page view tracking without PII.
 * @see PAY-064 in PRD for acceptance criteria
 */
export interface PageView {
  id: string
  articleId: string
  timestamp: string
  source?: string
  device?: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  country?: string
  sessionId?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Form Types
// ============================================================================

/**
 * Text field block configuration
 */
export interface FormTextField {
  blockType: 'textField'
  name: string
  label: string
  placeholder?: string
  required?: boolean
  width?: 'full' | 'half'
}

/**
 * Email field block configuration
 */
export interface FormEmailField {
  blockType: 'emailField'
  name: string
  label: string
  placeholder?: string
  required?: boolean
  width?: 'full' | 'half'
}

/**
 * Textarea field block configuration
 */
export interface FormTextareaField {
  blockType: 'textareaField'
  name: string
  label: string
  placeholder?: string
  required?: boolean
  rows?: number
}

/**
 * Select field block configuration
 */
export interface FormSelectField {
  blockType: 'selectField'
  name: string
  label: string
  required?: boolean
  options: Array<{ label: string; value: string }>
  width?: 'full' | 'half'
}

/**
 * Checkbox field block configuration
 */
export interface FormCheckboxField {
  blockType: 'checkboxField'
  name: string
  label: string
  required?: boolean
  defaultChecked?: boolean
}

/**
 * Hidden field block configuration
 */
export interface FormHiddenField {
  blockType: 'hiddenField'
  name: string
  value?: string
}

/**
 * Union type for all form field blocks
 */
export type FormFieldBlock =
  | FormTextField
  | FormEmailField
  | FormTextareaField
  | FormSelectField
  | FormCheckboxField
  | FormHiddenField

/**
 * Form from Payload CMS
 *
 * Dynamic forms for contact, lead capture, and engagement.
 * @see PAY-055 in PRD for acceptance criteria
 */
export interface Form {
  id: string
  name: string
  slug: string
  fields: FormFieldBlock[]
  submitButton?: string
  successMessage?: string
  emailNotification?: {
    enabled?: boolean
    to?: string
    subject?: string
  }
  redirectUrl?: string
  createdAt: string
  updatedAt: string
}

/**
 * Form submission from Payload CMS
 */
export interface FormSubmission {
  id: string
  form: Form | string
  submissionData: Record<string, unknown>
  email?: string
  submittedAt: string
  pageUrl?: string
  userAgent?: string
  ipAddress?: string
  processed?: boolean
  notes?: string
  createdAt: string
  updatedAt: string
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

/**
 * Provider configuration for newsletter integrations
 *
 * SECURITY: API keys are NOT stored in the CMS - they come from environment variables:
 * - MAILCHIMP_API_KEY
 * - CONVERTKIT_API_KEY
 * - BUTTONDOWN_API_KEY
 *
 * Only non-sensitive identifiers are stored in the CMS.
 */
export interface NewsletterProviderConfig {
  webhookUrl?: string
  mailchimpAudienceId?: string
  convertkitFormId?: string
  // Status fields (read-only, for admin display)
  mailchimpStatus?: string
  convertkitStatus?: string
  buttondownStatus?: string
}

/**
 * Newsletter global from Payload CMS
 * @see PAY-056 in PRD
 */
export interface Newsletter {
  enabled: boolean
  title?: string
  description?: string
  placeholder?: string
  buttonText?: string
  successMessage?: string
  provider: 'mailchimp' | 'convertkit' | 'buttondown' | 'webhook'
  providerConfig?: NewsletterProviderConfig
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
// Content Scheduling Helpers
// ============================================================================

/**
 * Build a where clause for publicly visible articles.
 *
 * Articles are visible if:
 * 1. Status is 'published', OR
 * 2. Status is 'scheduled' AND publishedAt is in the past (or now)
 *
 * This enables content scheduling without requiring a cron job to change statuses.
 * Scheduled articles automatically become visible when their publishedAt date passes.
 *
 * @returns Where clause for visible articles (published or past-scheduled)
 *
 * @example
 * const where = {
 *   ...buildVisibleArticlesWhere(),
 *   category: { equals: categoryId }, // Additional filters
 * }
 */
export function buildVisibleArticlesWhere(): Record<string, unknown> {
  return {
    or: [
      // Published articles are always visible
      { status: { equals: 'published' } },
      // Scheduled articles with past publishedAt are visible (auto-published)
      {
        and: [
          { status: { equals: 'scheduled' } },
          { publishedAt: { less_than_equal: new Date().toISOString() } },
        ],
      },
    ],
  }
}

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
  /** Filter by specific status (draft, scheduled, published, archived) */
  status?: 'draft' | 'scheduled' | 'published' | 'archived'
  /**
   * Use visibility-based filtering (default: true for public pages)
   * When true, returns published articles AND scheduled articles with past publishedAt.
   * When false, use the explicit `status` option for filtering.
   */
  useVisibilityFilter?: boolean
  categorySlug?: string
  authorSlug?: string
  tagId?: string
  limit?: number
  page?: number
}): Promise<{ docs: Article[]; totalPages: number; totalDocs: number }> {
  const payload = await getPayloadClient()

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {}

  // Determine status filtering strategy
  // By default (useVisibilityFilter !== false), use visibility-based filtering for public pages
  const useVisibility = options?.useVisibilityFilter !== false && !options?.status

  if (useVisibility) {
    // Use visibility filter: published OR (scheduled AND past publishedAt)
    Object.assign(where, buildVisibleArticlesWhere())
  } else {
    // Use explicit status filter
    where.status = { equals: options?.status || 'published' }
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
 * Returns visible articles only: published OR (scheduled with past publishedAt).
 * This supports content scheduling without status changes.
 *
 * @param slug - The article slug
 * @returns Promise<Article | null> - The article or null if not found
 *
 * @example
 * const article = await getArticle('my-first-post')
 */
export async function getArticle(slug: string): Promise<Article | null> {
  const payload = await getPayloadClient()

  // Build where clause: match slug AND use visibility filter
  const visibilityFilter = buildVisibleArticlesWhere()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (payload as any).find({
    collection: 'articles',
    where: {
      slug: { equals: slug },
      // Combine visibility filter with slug match
      ...visibilityFilter,
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

/**
 * Fetch newsletter global from Payload CMS
 *
 * @returns Promise<Newsletter | null> - Newsletter config or null if not configured
 *
 * @example
 * const newsletter = await getNewsletter()
 * if (newsletter?.enabled) {
 *   // Render newsletter form
 * }
 *
 * @see PAY-056 in PRD
 */
export async function getNewsletter(): Promise<Newsletter | null> {
  const payload = await getPayloadClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).findGlobal({
      slug: 'newsletter',
      depth: 0, // No relations to populate
    })

    return result as Newsletter
  } catch {
    // Global may not exist yet
    return null
  }
}

// ============================================================================
// Redirect Functions
// ============================================================================

/**
 * Fetch a redirect by source path from Payload CMS
 *
 * Used by middleware to check if a URL should be redirected.
 * Only returns enabled redirects.
 *
 * @param sourcePath - The source path to look up (e.g., "/old-page")
 * @returns Promise<Redirect | null> - The redirect or null if not found
 *
 * @example
 * const redirect = await getRedirect('/old-page')
 * if (redirect) {
 *   // Redirect to redirect.destination with redirect.type status code
 * }
 *
 * @see PAY-052 in PRD for acceptance criteria
 */
export async function getRedirect(sourcePath: string): Promise<Redirect | null> {
  const payload = await getPayloadClient()

  try {
    // Normalize path: ensure leading slash, remove trailing slash
    let normalizedPath = sourcePath.trim()
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath
    }
    if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
      normalizedPath = normalizedPath.slice(0, -1)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'redirects',
      where: {
        source: { equals: normalizedPath },
        enabled: { equals: true },
      },
      limit: 1,
    })

    return (result.docs?.[0] || null) as Redirect | null
  } catch {
    // Collection may not exist or query failed
    return null
  }
}

/**
 * Fetch all enabled redirects from Payload CMS
 *
 * Useful for caching all redirects at build time or for admin displays.
 *
 * @returns Promise<Redirect[]> - Array of enabled redirects
 *
 * @example
 * const redirects = await getAllRedirects()
 */
export async function getAllRedirects(): Promise<Redirect[]> {
  const payload = await getPayloadClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'redirects',
      where: {
        enabled: { equals: true },
      },
      limit: 1000, // Reasonable limit for redirects
      sort: 'source',
    })

    return (result.docs || []) as Redirect[]
  } catch {
    // Collection may not exist or query failed
    return []
  }
}

// ============================================================================
// Form Query Functions
// ============================================================================

/**
 * Fetch a form by slug from Payload CMS
 *
 * Used by DynamicForm component to load form configuration.
 *
 * @param slug - The form slug
 * @returns Promise<Form | null> - The form or null if not found
 *
 * @example
 * const form = await getForm('contact')
 * if (form) {
 *   // Render DynamicForm with form configuration
 * }
 *
 * @see PAY-055 in PRD for acceptance criteria
 */
export async function getForm(slug: string): Promise<Form | null> {
  const payload = await getPayloadClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'forms',
      where: {
        slug: { equals: slug },
      },
      limit: 1,
    })

    return (result.docs?.[0] || null) as Form | null
  } catch {
    // Collection may not exist or query failed
    return null
  }
}

/**
 * Fetch a form by ID from Payload CMS
 *
 * @param id - The form ID
 * @returns Promise<Form | null> - The form or null if not found
 */
export async function getFormById(id: string): Promise<Form | null> {
  const payload = await getPayloadClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).findByID({
      collection: 'forms',
      id,
    })

    return result as Form | null
  } catch {
    // Form not found or query failed
    return null
  }
}

/**
 * Fetch all forms from Payload CMS
 *
 * @returns Promise<Form[]> - Array of forms
 *
 * @example
 * const forms = await getForms()
 */
export async function getForms(): Promise<Form[]> {
  const payload = await getPayloadClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'forms',
      sort: 'name',
      limit: 100,
    })

    return (result.docs || []) as Form[]
  } catch {
    // Collection may not exist or query failed
    return []
  }
}

/**
 * Fetch form submissions from Payload CMS
 *
 * @param options.formId - Filter by form ID
 * @param options.formSlug - Filter by form slug
 * @param options.processed - Filter by processed status
 * @param options.limit - Maximum number of submissions to return
 * @param options.page - Page number for pagination
 * @returns Promise<{ docs: FormSubmission[], totalPages: number, totalDocs: number }>
 *
 * @example
 * const { docs: submissions } = await getFormSubmissions({ formSlug: 'contact' })
 */
export async function getFormSubmissions(options?: {
  formId?: string
  formSlug?: string
  processed?: boolean
  limit?: number
  page?: number
}): Promise<{ docs: FormSubmission[]; totalPages: number; totalDocs: number }> {
  const payload = await getPayloadClient()

  try {
    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {}

    if (options?.formId) {
      where.form = { equals: options.formId }
    }

    if (options?.formSlug) {
      // Look up form by slug first
      const form = await getForm(options.formSlug)
      if (form) {
        where.form = { equals: form.id }
      }
    }

    if (options?.processed !== undefined) {
      where.processed = { equals: options.processed }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'form-submissions',
      where,
      sort: '-submittedAt',
      limit: options?.limit || 50,
      page: options?.page || 1,
      depth: 1, // Populate form
    })

    return {
      docs: (result.docs || []) as FormSubmission[],
      totalPages: result.totalPages as number,
      totalDocs: result.totalDocs as number,
    }
  } catch {
    // Collection may not exist or query failed
    return { docs: [], totalPages: 0, totalDocs: 0 }
  }
}

// ============================================================================
// Page View Analytics
// ============================================================================

/**
 * Fetch page views from Payload CMS
 *
 * Privacy-friendly analytics queries. Does not return PII.
 *
 * @param options.articleId - Filter by article slug/ID
 * @param options.startDate - Filter views after this date (ISO string)
 * @param options.endDate - Filter views before this date (ISO string)
 * @param options.limit - Maximum number of views to return
 * @param options.page - Page number for pagination
 * @returns Promise<{ docs: PageView[], totalPages: number, totalDocs: number }>
 *
 * @see PAY-064 in PRD for acceptance criteria
 *
 * @example
 * // Get views for a specific article
 * const { docs: views, totalDocs } = await getPageViews({ articleId: 'test-post' })
 *
 * @example
 * // Get all views in the last week
 * const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
 * const { docs: views } = await getPageViews({ startDate: weekAgo })
 */
export async function getPageViews(options?: {
  articleId?: string
  startDate?: string
  endDate?: string
  limit?: number
  page?: number
}): Promise<{ docs: PageView[]; totalPages: number; totalDocs: number }> {
  const payload = await getPayloadClient()

  try {
    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {}

    if (options?.articleId) {
      where.articleId = { equals: options.articleId }
    }

    if (options?.startDate || options?.endDate) {
      where.timestamp = {}
      if (options.startDate) {
        where.timestamp.greater_than_equal = options.startDate
      }
      if (options.endDate) {
        where.timestamp.less_than_equal = options.endDate
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'page-views',
      where,
      sort: '-timestamp',
      limit: options?.limit || 100,
      page: options?.page || 1,
    })

    return {
      docs: (result.docs || []) as PageView[],
      totalPages: result.totalPages as number,
      totalDocs: result.totalDocs as number,
    }
  } catch {
    // Collection may not exist or query failed
    return { docs: [], totalPages: 0, totalDocs: 0 }
  }
}

/**
 * Time period options for analytics queries
 */
export type TimePeriod = 'week' | 'month' | 'all'

/**
 * Helper to calculate start date based on time period
 */
function getStartDateForPeriod(period: TimePeriod): string | undefined {
  if (period === 'all') return undefined

  const now = new Date()
  if (period === 'week') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
  if (period === 'month') {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
  return undefined
}

/**
 * Get aggregate page view statistics for articles
 *
 * Returns total view counts and basic breakdown by device/country.
 *
 * @param options.articleId - Filter by article slug/ID (optional)
 * @param options.startDate - Filter views after this date (ISO string)
 * @param options.endDate - Filter views before this date (ISO string)
 * @returns Promise<PageViewStats>
 *
 * @example
 * // Get overall stats
 * const stats = await getPageViewStats()
 * console.log(`Total views: ${stats.totalViews}`)
 *
 * @example
 * // Get stats for specific article
 * const stats = await getPageViewStats({ articleId: 'test-post' })
 */
export interface PageViewStats {
  totalViews: number
  uniqueSessions: number
  byDevice: Record<string, number>
  byCountry: Record<string, number>
  topArticles: Array<{ articleId: string; views: number }>
}

export async function getPageViewStats(options?: {
  articleId?: string
  startDate?: string
  endDate?: string
  topN?: number
}): Promise<PageViewStats> {
  const payload = await getPayloadClient()

  try {
    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {}

    if (options?.articleId) {
      where.articleId = { equals: options.articleId }
    }

    if (options?.startDate || options?.endDate) {
      where.timestamp = {}
      if (options.startDate) {
        where.timestamp.greater_than_equal = options.startDate
      }
      if (options.endDate) {
        where.timestamp.less_than_equal = options.endDate
      }
    }

    // Fetch all matching views (with pagination for large datasets)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (payload as any).find({
      collection: 'page-views',
      where,
      limit: 10000, // Max for aggregation
      pagination: false,
      overrideAccess: true,
    })

    const views = (result.docs || []) as PageView[]

    // Compute aggregates
    const sessionSet = new Set<string>()
    const deviceCounts: Record<string, number> = {}
    const countryCounts: Record<string, number> = {}
    const articleCounts: Record<string, number> = {}

    for (const view of views) {
      // Unique sessions
      if (view.sessionId) {
        sessionSet.add(view.sessionId)
      }

      // Device breakdown
      const device = view.device || 'unknown'
      deviceCounts[device] = (deviceCounts[device] || 0) + 1

      // Country breakdown
      const country = view.country || 'unknown'
      countryCounts[country] = (countryCounts[country] || 0) + 1

      // Article counts
      articleCounts[view.articleId] = (articleCounts[view.articleId] || 0) + 1
    }

    // Sort articles by view count
    const sortedArticles = Object.entries(articleCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, options?.topN || 10)
      .map(([articleId, views]) => ({ articleId, views }))

    return {
      totalViews: views.length,
      uniqueSessions: sessionSet.size,
      byDevice: deviceCounts,
      byCountry: countryCounts,
      topArticles: sortedArticles,
    }
  } catch {
    // Collection may not exist or query failed
    return {
      totalViews: 0,
      uniqueSessions: 0,
      byDevice: {},
      byCountry: {},
      topArticles: [],
    }
  }
}

/**
 * Popular article with view count
 */
export interface PopularArticle {
  article: Article
  views: number
}

/**
 * Get popular articles with full article data
 *
 * Returns top articles by view count within a time period, with full article
 * details (title, slug, featuredImage, etc.) for display in widgets.
 *
 * @param options.period - Time period: 'week', 'month', or 'all' (default: 'week')
 * @param options.limit - Maximum number of articles to return (default: 5)
 * @returns Promise<PopularArticle[]> - Array of articles with view counts
 *
 * @example
 * // Get top 5 articles from the past week
 * const popular = await getPopularArticles({ period: 'week', limit: 5 })
 *
 * @example
 * // Get top 10 articles of all time
 * const allTime = await getPopularArticles({ period: 'all', limit: 10 })
 *
 * @see PAY-065 in PRD for acceptance criteria
 */
export async function getPopularArticles(options?: {
  period?: TimePeriod
  limit?: number
}): Promise<PopularArticle[]> {
  const period = options?.period || 'week'
  const limit = options?.limit || 5

  try {
    // Get page view stats for the time period
    const startDate = getStartDateForPeriod(period)
    const stats = await getPageViewStats({
      startDate,
      topN: limit * 2, // Fetch extra in case some articles are not found/published
    })

    if (stats.topArticles.length === 0) {
      return []
    }

    // Fetch full article data for each popular article
    const payload = await getPayloadClient()
    const popularArticles: PopularArticle[] = []

    for (const { articleId, views } of stats.topArticles) {
      if (popularArticles.length >= limit) break

      // Try to find article by slug (articleId is stored as slug)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (payload as any).find({
        collection: 'articles',
        where: {
          slug: { equals: articleId },
          ...buildVisibleArticlesWhere(),
        },
        limit: 1,
        depth: 1, // Populate featuredImage, author
      })

      const article = result.docs?.[0] as Article | undefined
      if (article) {
        popularArticles.push({ article, views })
      }
    }

    return popularArticles
  } catch {
    // Collection may not exist or query failed
    return []
  }
}
