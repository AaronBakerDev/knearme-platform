/**
 * Newsletter Subscription API Route
 *
 * Handles newsletter signups by forwarding to the configured provider.
 * Supports multiple providers: mailchimp, convertkit, buttondown, webhook.
 *
 * SECURITY: API keys are read from environment variables, not from CMS:
 * - MAILCHIMP_API_KEY
 * - CONVERTKIT_API_KEY
 * - BUTTONDOWN_API_KEY
 *
 * @see PAY-056 in PRD for acceptance criteria
 * @see /src/payload/globals/Newsletter.ts - Newsletter CMS config
 * @see /src/components/newsletter/NewsletterForm.tsx - Frontend form
 */

import { NextResponse } from 'next/server'
import { getNewsletter, type Newsletter, type NewsletterProviderConfig } from '@/lib/payload/client'

/**
 * Get API key from environment variable
 */
function getEnvApiKey(provider: string): string | undefined {
  switch (provider) {
    case 'mailchimp':
      return process.env.MAILCHIMP_API_KEY
    case 'convertkit':
      return process.env.CONVERTKIT_API_KEY
    case 'buttondown':
      return process.env.BUTTONDOWN_API_KEY
    default:
      return undefined
  }
}

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /api/newsletter/subscribe
 *
 * Subscribe an email address to the newsletter.
 *
 * Request body:
 * - email: string (required) - Email address to subscribe
 *
 * Response:
 * - 200: { success: true, message: string }
 * - 400: { error: string } - Invalid email or missing email
 * - 500: { error: string } - Provider error
 * - 503: { error: string } - Newsletter not configured
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { email } = body as { email?: string }

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Get newsletter configuration from CMS
    const newsletter = await getNewsletter()

    if (!newsletter || !newsletter.enabled) {
      return NextResponse.json(
        { error: 'Newsletter is not configured' },
        { status: 503 }
      )
    }

    // Forward to provider
    const result = await subscribeToProvider(
      email,
      newsletter.provider,
      newsletter.providerConfig
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Subscription failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: newsletter.successMessage || 'Thanks for subscribing!',
    })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Forward subscription to the configured provider
 */
async function subscribeToProvider(
  email: string,
  provider: Newsletter['provider'],
  config?: NewsletterProviderConfig
): Promise<{ success: boolean; error?: string }> {
  switch (provider) {
    case 'webhook':
      return subscribeViaWebhook(email, config?.webhookUrl)
    case 'mailchimp':
      return subscribeViaMailchimp(email, config)
    case 'convertkit':
      return subscribeViaConvertKit(email, config)
    case 'buttondown':
      return subscribeViaButtondown(email, config)
    default:
      return { success: false, error: 'Unknown provider' }
  }
}

/**
 * Subscribe via custom webhook (for testing or custom integrations)
 */
async function subscribeViaWebhook(
  email: string,
  webhookUrl?: string
): Promise<{ success: boolean; error?: string }> {
  if (!webhookUrl) {
    return { success: false, error: 'Webhook URL not configured' }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        timestamp: new Date().toISOString(),
        source: 'knearme-newsletter',
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('Webhook error:', text)
      return { success: false, error: 'Webhook request failed' }
    }

    return { success: true }
  } catch (error) {
    console.error('Webhook error:', error)
    return { success: false, error: 'Failed to reach webhook' }
  }
}

/**
 * Subscribe via Mailchimp API
 * API key from MAILCHIMP_API_KEY env var, audience ID from CMS config
 * @see https://mailchimp.com/developer/marketing/api/list-members/
 */
async function subscribeViaMailchimp(
  email: string,
  config?: NewsletterProviderConfig
): Promise<{ success: boolean; error?: string }> {
  const apiKey = getEnvApiKey('mailchimp')
  const audienceId = config?.mailchimpAudienceId

  if (!apiKey) {
    return { success: false, error: 'Mailchimp API key not configured (set MAILCHIMP_API_KEY)' }
  }
  if (!audienceId) {
    return { success: false, error: 'Mailchimp Audience ID not configured in CMS' }
  }

  // Extract datacenter from API key (e.g., "abc123-us14" -> "us14")
  const dc = apiKey.split('-').pop()
  const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `apikey ${apiKey}`,
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      // Handle "already subscribed" as success
      if (data.title === 'Member Exists') {
        return { success: true }
      }
      console.error('Mailchimp error:', data)
      return { success: false, error: data.detail || 'Mailchimp subscription failed' }
    }

    return { success: true }
  } catch (error) {
    console.error('Mailchimp error:', error)
    return { success: false, error: 'Failed to reach Mailchimp' }
  }
}

/**
 * Subscribe via ConvertKit API
 * API key from CONVERTKIT_API_KEY env var, form ID from CMS config
 * @see https://developers.convertkit.com/#add-subscriber-to-a-form
 */
async function subscribeViaConvertKit(
  email: string,
  config?: NewsletterProviderConfig
): Promise<{ success: boolean; error?: string }> {
  const apiKey = getEnvApiKey('convertkit')
  const formId = config?.convertkitFormId

  if (!apiKey) {
    return { success: false, error: 'ConvertKit API key not configured (set CONVERTKIT_API_KEY)' }
  }
  if (!formId) {
    return { success: false, error: 'ConvertKit Form ID not configured in CMS' }
  }

  const url = `https://api.convertkit.com/v3/forms/${formId}/subscribe`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        email,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      console.error('ConvertKit error:', data)
      return { success: false, error: 'ConvertKit subscription failed' }
    }

    return { success: true }
  } catch (error) {
    console.error('ConvertKit error:', error)
    return { success: false, error: 'Failed to reach ConvertKit' }
  }
}

/**
 * Subscribe via Buttondown API
 * API key from BUTTONDOWN_API_KEY env var
 * @see https://api.buttondown.email/v1/docs/introduction
 */
async function subscribeViaButtondown(
  email: string,
  _config?: NewsletterProviderConfig
): Promise<{ success: boolean; error?: string }> {
  const apiKey = getEnvApiKey('buttondown')

  if (!apiKey) {
    return { success: false, error: 'Buttondown API key not configured (set BUTTONDOWN_API_KEY)' }
  }

  const url = 'https://api.buttondown.email/v1/subscribers'

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const data = await response.json()
      // Handle "already subscribed" as success
      if (response.status === 400 && data.email?.[0]?.includes('already')) {
        return { success: true }
      }
      console.error('Buttondown error:', data)
      return { success: false, error: 'Buttondown subscription failed' }
    }

    return { success: true }
  } catch (error) {
    console.error('Buttondown error:', error)
    return { success: false, error: 'Failed to reach Buttondown' }
  }
}
