/**
 * Newsletter Global - Email Capture Configuration
 *
 * CMS-configurable newsletter signup system supporting multiple providers.
 * Includes customizable copy, provider selection, and webhook integration.
 *
 * SECURITY: API credentials are read from environment variables, not stored in the CMS.
 * Configure these in .env.local:
 *   - MAILCHIMP_API_KEY, MAILCHIMP_AUDIENCE_ID
 *   - CONVERTKIT_API_KEY, CONVERTKIT_FORM_ID
 *   - BUTTONDOWN_API_KEY
 *
 * Usage:
 *   import { getNewsletter } from '@/lib/payload/client'
 *   const newsletter = await getNewsletter()
 *
 * @see PAY-056 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/configuration/globals
 */
import type { GlobalConfig } from 'payload'

/**
 * Helper to check if an env var is configured (without exposing the value)
 */
function isEnvConfigured(envVar: string): boolean {
  return Boolean(process.env[envVar])
}

/**
 * Get configuration status message for admin UI
 */
function getEnvStatus(envVar: string): string {
  return isEnvConfigured(envVar)
    ? `${envVar} is configured`
    : `${envVar} is NOT configured - add to .env.local`
}

/**
 * Newsletter provider options
 * Each provider has different configuration requirements in providerConfig
 */
const providerOptions = [
  { label: 'Mailchimp', value: 'mailchimp' },
  { label: 'ConvertKit', value: 'convertkit' },
  { label: 'Buttondown', value: 'buttondown' },
  { label: 'Custom Webhook', value: 'webhook' },
] as const

/**
 * Newsletter global configuration
 *
 * Fields:
 * - Display settings: title, description, placeholder, buttonText, successMessage
 * - Provider settings: provider (select), providerConfig (JSON for API keys, URLs)
 * - enabled: Toggle to enable/disable newsletter signup
 */
export const Newsletter: GlobalConfig = {
  slug: 'newsletter',
  label: 'Newsletter',
  admin: {
    group: 'Settings',
    description: 'Configure newsletter signup form and email provider integration.',
  },
  access: {
    read: () => true, // Anyone can read newsletter config (needed for rendering form)
    update: ({ req: { user } }) => Boolean(user), // Only authenticated users can update
  },
  fields: [
    // Enable/Disable Toggle
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Enable Newsletter Signup',
      defaultValue: true,
      admin: {
        description: 'Toggle to show/hide newsletter signup form on the site',
      },
    },

    // Display Settings Section
    {
      type: 'collapsible',
      label: 'Display Settings',
      admin: {
        initCollapsed: false,
        description: 'Customize the newsletter signup form appearance and copy',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Title',
          defaultValue: 'Stay Updated',
          admin: {
            description: 'Headline for the newsletter signup section',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          defaultValue: 'Get the latest tips and insights delivered to your inbox.',
          admin: {
            description: 'Supporting text explaining the newsletter value',
          },
        },
        {
          name: 'placeholder',
          type: 'text',
          label: 'Email Placeholder',
          defaultValue: 'Enter your email',
          admin: {
            description: 'Placeholder text shown in the email input field',
          },
        },
        {
          name: 'buttonText',
          type: 'text',
          label: 'Button Text',
          defaultValue: 'Subscribe',
          admin: {
            description: 'Text displayed on the subscribe button',
          },
        },
        {
          name: 'successMessage',
          type: 'text',
          label: 'Success Message',
          defaultValue: 'Thanks for subscribing!',
          admin: {
            description: 'Message shown after successful subscription',
          },
        },
      ],
    },

    // Provider Settings Section
    {
      type: 'collapsible',
      label: 'Provider Settings',
      admin: {
        initCollapsed: false,
        description: 'Configure the email marketing provider integration',
      },
      fields: [
        {
          name: 'provider',
          type: 'select',
          label: 'Email Provider',
          required: true,
          defaultValue: 'webhook',
          options: providerOptions.map((opt) => opt),
          admin: {
            description: 'Select the email marketing service to use for subscriptions',
          },
        },
        {
          name: 'providerConfig',
          type: 'group',
          label: 'Provider Configuration',
          admin: {
            description:
              'SECURITY: API keys are configured via environment variables (.env.local), not stored in the CMS. ' +
              'Only non-sensitive identifiers (audience IDs, form IDs) are configured here.',
            condition: (_, siblingData) => Boolean(siblingData?.provider),
          },
          fields: [
            // Webhook Configuration
            {
              name: 'webhookUrl',
              type: 'text',
              label: 'Webhook URL',
              admin: {
                description: 'URL to POST subscription data to (for webhook provider)',
                condition: (_, siblingData) => siblingData?.provider === 'webhook',
              },
            },

            // Mailchimp Configuration
            {
              name: 'mailchimpStatus',
              type: 'text',
              label: 'API Key Status',
              admin: {
                readOnly: true,
                description: getEnvStatus('MAILCHIMP_API_KEY'),
                condition: (_, siblingData) => siblingData?.provider === 'mailchimp',
              },
            },
            {
              name: 'mailchimpAudienceId',
              type: 'text',
              label: 'Mailchimp Audience ID',
              admin: {
                description: 'The audience/list ID to add subscribers to (not a secret)',
                condition: (_, siblingData) => siblingData?.provider === 'mailchimp',
              },
            },

            // ConvertKit Configuration
            {
              name: 'convertkitStatus',
              type: 'text',
              label: 'API Key Status',
              admin: {
                readOnly: true,
                description: getEnvStatus('CONVERTKIT_API_KEY'),
                condition: (_, siblingData) => siblingData?.provider === 'convertkit',
              },
            },
            {
              name: 'convertkitFormId',
              type: 'text',
              label: 'ConvertKit Form ID',
              admin: {
                description: 'The form ID to subscribe users to (not a secret)',
                condition: (_, siblingData) => siblingData?.provider === 'convertkit',
              },
            },

            // Buttondown Configuration
            {
              name: 'buttondownStatus',
              type: 'text',
              label: 'API Key Status',
              admin: {
                readOnly: true,
                description: getEnvStatus('BUTTONDOWN_API_KEY'),
                condition: (_, siblingData) => siblingData?.provider === 'buttondown',
              },
            },
          ],
        },
      ],
    },
  ],
}

export default Newsletter
