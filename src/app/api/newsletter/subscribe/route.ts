/**
 * Newsletter Subscription API Route
 *
 * Handles newsletter signups by forwarding to the configured provider.
 * Supports multiple providers: mailchimp, convertkit, buttondown, webhook.
 *
 * @see PAY-056 in PRD for acceptance criteria
 * @see /src/payload/globals/Newsletter.ts - Newsletter CMS config
 * @see /src/components/newsletter/NewsletterForm.tsx - Frontend form
 */

import { NextResponse } from 'next/server'
import { getNewsletter, type Newsletter, type NewsletterProviderConfig } from '@/lib/payload/client'

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
 * @see https://mailchimp.com/developer/marketing/api/list-members/
 */
async function subscribeViaMailchimp(
  email: string,
  config?: NewsletterProviderConfig
): Promise<{ success: boolean; error?: string }> {
  const { mailchimpApiKey, mailchimpAudienceId } = config || {}

  if (!mailchimpApiKey || !mailchimpAudienceId) {
    return { success: false, error: 'Mailchimp not configured' }
  }

  // Extract datacenter from API key (e.g., "abc123-us14" -> "us14")
  const dc = mailchimpApiKey.split('-').pop()
  const url = `https://${dc}.api.mailchimp.com/3.0/lists/${mailchimpAudienceId}/members`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `apikey ${mailchimpApiKey}`,
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
 * @see https://developers.convertkit.com/#add-subscriber-to-a-form
 */
async function subscribeViaConvertKit(
  email: string,
  config?: NewsletterProviderConfig
): Promise<{ success: boolean; error?: string }> {
  const { convertkitApiKey, convertkitFormId } = config || {}

  if (!convertkitApiKey || !convertkitFormId) {
    return { success: false, error: 'ConvertKit not configured' }
  }

  const url = `https://api.convertkit.com/v3/forms/${convertkitFormId}/subscribe`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: convertkitApiKey,
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
 * @see https://api.buttondown.email/v1/docs/introduction
 */
async function subscribeViaButtondown(
  email: string,
  config?: NewsletterProviderConfig
): Promise<{ success: boolean; error?: string }> {
  const { buttondownApiKey } = config || {}

  if (!buttondownApiKey) {
    return { success: false, error: 'Buttondown not configured' }
  }

  const url = 'https://api.buttondown.email/v1/subscribers'

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${buttondownApiKey}`,
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
