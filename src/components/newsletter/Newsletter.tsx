/**
 * Newsletter Signup Component - Server Component Wrapper
 *
 * Fetches newsletter configuration from Payload CMS and renders
 * the NewsletterForm client component with CMS data.
 *
 * Features:
 * - CMS-configurable copy (title, description, button text)
 * - Provider-agnostic submission (mailchimp, convertkit, buttondown, webhook)
 * - Graceful fallback when CMS unavailable
 *
 * @see PAY-056 in PRD for acceptance criteria
 * @see /src/payload/globals/Newsletter.ts - Newsletter CMS config
 */

import { getNewsletter, type Newsletter as NewsletterConfig } from '@/lib/payload/client'
import { NewsletterForm } from './NewsletterForm'

/**
 * Fallback configuration when CMS is unavailable
 */
const FALLBACK_CONFIG: NewsletterConfig = {
  enabled: true,
  title: 'Stay Updated',
  description: 'Get the latest tips and insights delivered to your inbox.',
  placeholder: 'Enter your email',
  buttonText: 'Subscribe',
  successMessage: 'Thanks for subscribing!',
  provider: 'webhook',
}

/**
 * Newsletter signup section with CMS configuration
 *
 * @example
 * // In a page or layout:
 * <Newsletter />
 */
export async function Newsletter() {
  let config: NewsletterConfig

  try {
    const cmsConfig = await getNewsletter()
    config = cmsConfig ?? FALLBACK_CONFIG
  } catch (error) {
    console.error('Failed to fetch newsletter config:', error)
    config = FALLBACK_CONFIG
  }

  // Don't render if newsletter is disabled
  if (!config.enabled) {
    return null
  }

  return (
    <section className="py-12 px-4 bg-zinc-50 dark:bg-zinc-900">
      <div className="container mx-auto max-w-xl text-center">
        {config.title && (
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            {config.title}
          </h2>
        )}
        {config.description && (
          <p className="text-muted-foreground mb-6">
            {config.description}
          </p>
        )}
        <NewsletterForm
          placeholder={config.placeholder ?? 'Enter your email'}
          buttonText={config.buttonText ?? 'Subscribe'}
          successMessage={config.successMessage ?? 'Thanks for subscribing!'}
        />
      </div>
    </section>
  )
}

export default Newsletter
