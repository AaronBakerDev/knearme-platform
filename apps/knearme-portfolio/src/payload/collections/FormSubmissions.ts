/**
 * FormSubmissions Collection - Form Response Storage
 *
 * Stores all form submissions from dynamic forms. Each submission
 * links back to its parent form and stores field data as JSON.
 *
 * @see PAY-055 in PRD for acceptance criteria
 * @see Forms.ts for form configuration
 */
import type { CollectionConfig } from 'payload'

/**
 * FormSubmissions Collection Configuration
 *
 * Stores form submission data with metadata for tracking and reporting.
 */
export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  admin: {
    useAsTitle: 'submittedAt',
    defaultColumns: ['form', 'submittedAt', 'email'],
    description: 'Form submissions and responses.',
    group: 'Engagement',
  },
  fields: [
    // Reference to parent form
    {
      name: 'form',
      type: 'relationship',
      // Type assertion needed until Payload CLI type generation is fixed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      relationTo: 'forms' as any,
      required: true,
      admin: {
        description: 'The form this submission belongs to',
        readOnly: true,
      },
    },

    // Submission Data (stored as JSON for flexibility)
    {
      name: 'submissionData',
      type: 'json',
      label: 'Submission Data',
      required: true,
      admin: {
        description: 'Form field values submitted by the user',
        readOnly: true,
      },
    },

    // Convenience field for email lookups
    {
      name: 'email',
      type: 'text',
      label: 'Email',
      admin: {
        description: 'Email from submission (if present)',
        readOnly: true,
      },
      hooks: {
        beforeValidate: [
          ({ data }) => {
            // Extract email from submission data if available
            if (data?.submissionData?.email) {
              return data.submissionData.email
            }
            return null
          },
        ],
      },
    },

    // Submission Metadata
    {
      name: 'submittedAt',
      type: 'date',
      label: 'Submitted At',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        readOnly: true,
      },
      defaultValue: () => new Date().toISOString(),
    },

    // Tracking fields
    {
      type: 'collapsible',
      label: 'Tracking Information',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'pageUrl',
          type: 'text',
          label: 'Page URL',
          admin: {
            description: 'URL where the form was submitted',
            readOnly: true,
          },
        },
        {
          name: 'userAgent',
          type: 'text',
          label: 'User Agent',
          admin: {
            description: 'Browser user agent string',
            readOnly: true,
          },
        },
        {
          name: 'ipAddress',
          type: 'text',
          label: 'IP Address',
          admin: {
            description: 'Submitter IP address (if captured)',
            readOnly: true,
          },
        },
      ],
    },

    // Processing status
    {
      name: 'processed',
      type: 'checkbox',
      label: 'Processed',
      defaultValue: false,
      admin: {
        description: 'Mark as processed when handled',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Internal Notes',
      admin: {
        description: 'Internal notes about this submission',
      },
    },
  ],
  access: {
    // Submissions are only accessible to authenticated users
    read: ({ req: { user } }) => Boolean(user),
    // Only the API can create submissions (public endpoint)
    create: () => true, // Handled by API route with validation
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  // Sort by newest first
  defaultSort: '-submittedAt',
}

export default FormSubmissions
