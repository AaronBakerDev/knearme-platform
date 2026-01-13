/**
 * Forms Collection - Dynamic Form Builder
 *
 * Manages dynamic forms for contact, lead capture, and user engagement.
 * Forms are built using a blocks-based field system that allows flexible
 * form construction without code changes.
 *
 * Field Types:
 * - text: Single-line text input
 * - email: Email input with validation
 * - textarea: Multi-line text input
 * - select: Dropdown selection
 * - checkbox: Boolean checkbox
 * - hidden: Hidden field for tracking data
 *
 * @see PAY-055 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/fields/blocks
 */
import type { CollectionConfig, Block } from 'payload'

/**
 * Text Field Block
 *
 * Single-line text input for names, titles, etc.
 */
const textFieldBlock: Block = {
  slug: 'textField',
  labels: {
    singular: 'Text Field',
    plural: 'Text Fields',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Field Name',
      required: true,
      admin: {
        description: 'Unique identifier (e.g., "firstName", "company")',
      },
    },
    {
      name: 'label',
      type: 'text',
      label: 'Label',
      required: true,
      admin: {
        description: 'Display label shown to users',
      },
    },
    {
      name: 'placeholder',
      type: 'text',
      label: 'Placeholder',
      admin: {
        description: 'Placeholder text shown in empty field',
      },
    },
    {
      name: 'required',
      type: 'checkbox',
      label: 'Required',
      defaultValue: false,
    },
    {
      name: 'width',
      type: 'select',
      label: 'Width',
      defaultValue: 'full',
      options: [
        { label: 'Full Width', value: 'full' },
        { label: 'Half Width', value: 'half' },
      ],
    },
  ],
}

/**
 * Email Field Block
 *
 * Email input with built-in validation.
 */
const emailFieldBlock: Block = {
  slug: 'emailField',
  labels: {
    singular: 'Email Field',
    plural: 'Email Fields',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Field Name',
      required: true,
      defaultValue: 'email',
      admin: {
        description: 'Unique identifier (typically "email")',
      },
    },
    {
      name: 'label',
      type: 'text',
      label: 'Label',
      required: true,
      defaultValue: 'Email',
    },
    {
      name: 'placeholder',
      type: 'text',
      label: 'Placeholder',
      defaultValue: 'your@email.com',
    },
    {
      name: 'required',
      type: 'checkbox',
      label: 'Required',
      defaultValue: true,
    },
    {
      name: 'width',
      type: 'select',
      label: 'Width',
      defaultValue: 'full',
      options: [
        { label: 'Full Width', value: 'full' },
        { label: 'Half Width', value: 'half' },
      ],
    },
  ],
}

/**
 * Textarea Field Block
 *
 * Multi-line text input for messages, descriptions, etc.
 */
const textareaFieldBlock: Block = {
  slug: 'textareaField',
  labels: {
    singular: 'Textarea Field',
    plural: 'Textarea Fields',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Field Name',
      required: true,
      admin: {
        description: 'Unique identifier (e.g., "message", "description")',
      },
    },
    {
      name: 'label',
      type: 'text',
      label: 'Label',
      required: true,
    },
    {
      name: 'placeholder',
      type: 'text',
      label: 'Placeholder',
    },
    {
      name: 'required',
      type: 'checkbox',
      label: 'Required',
      defaultValue: false,
    },
    {
      name: 'rows',
      type: 'number',
      label: 'Rows',
      defaultValue: 4,
      min: 2,
      max: 10,
      admin: {
        description: 'Number of visible text rows',
      },
    },
  ],
}

/**
 * Select Field Block
 *
 * Dropdown selection with configurable options.
 */
const selectFieldBlock: Block = {
  slug: 'selectField',
  labels: {
    singular: 'Select Field',
    plural: 'Select Fields',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Field Name',
      required: true,
    },
    {
      name: 'label',
      type: 'text',
      label: 'Label',
      required: true,
    },
    {
      name: 'required',
      type: 'checkbox',
      label: 'Required',
      defaultValue: false,
    },
    {
      name: 'options',
      type: 'array',
      label: 'Options',
      minRows: 1,
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Option Label',
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          label: 'Option Value',
          required: true,
        },
      ],
    },
    {
      name: 'width',
      type: 'select',
      label: 'Width',
      defaultValue: 'full',
      options: [
        { label: 'Full Width', value: 'full' },
        { label: 'Half Width', value: 'half' },
      ],
    },
  ],
}

/**
 * Checkbox Field Block
 *
 * Boolean checkbox for terms acceptance, newsletter signup, etc.
 */
const checkboxFieldBlock: Block = {
  slug: 'checkboxField',
  labels: {
    singular: 'Checkbox Field',
    plural: 'Checkbox Fields',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Field Name',
      required: true,
    },
    {
      name: 'label',
      type: 'text',
      label: 'Label',
      required: true,
      admin: {
        description: 'Text shown next to the checkbox',
      },
    },
    {
      name: 'required',
      type: 'checkbox',
      label: 'Required',
      defaultValue: false,
      admin: {
        description: 'If checked, user must check this checkbox to submit',
      },
    },
    {
      name: 'defaultChecked',
      type: 'checkbox',
      label: 'Default Checked',
      defaultValue: false,
    },
  ],
}

/**
 * Hidden Field Block
 *
 * Hidden field for passing tracking data, source info, etc.
 */
const hiddenFieldBlock: Block = {
  slug: 'hiddenField',
  labels: {
    singular: 'Hidden Field',
    plural: 'Hidden Fields',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Field Name',
      required: true,
      admin: {
        description: 'Unique identifier for the hidden value',
      },
    },
    {
      name: 'value',
      type: 'text',
      label: 'Value',
      admin: {
        description: 'Static value or use {{pageUrl}} for dynamic values',
      },
    },
  ],
}

/**
 * Forms Collection Configuration
 *
 * Dynamic forms for contact, lead capture, and engagement.
 * Forms use a blocks-based field system for flexible construction.
 */
export const Forms: CollectionConfig = {
  slug: 'forms',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    description: 'Dynamic forms for contact, lead capture, and user engagement.',
    group: 'Engagement',
  },
  fields: [
    // Form Identity
    {
      name: 'name',
      type: 'text',
      label: 'Form Name',
      required: true,
      admin: {
        description: 'Internal name for the form (e.g., "Contact Form")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: {
        description: 'URL-safe identifier (e.g., "contact")',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            // Auto-generate slug from name if not provided
            if (!value && data?.name) {
              return data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
            }
            return value
          },
        ],
      },
    },

    // Form Fields (Blocks)
    {
      name: 'fields',
      type: 'blocks',
      label: 'Form Fields',
      minRows: 1,
      blocks: [
        textFieldBlock,
        emailFieldBlock,
        textareaFieldBlock,
        selectFieldBlock,
        checkboxFieldBlock,
        hiddenFieldBlock,
      ],
      admin: {
        description: 'Add and configure form fields',
      },
    },

    // Submit Configuration
    {
      type: 'collapsible',
      label: 'Submit Settings',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'submitButton',
          type: 'text',
          label: 'Submit Button Text',
          defaultValue: 'Submit',
          admin: {
            description: 'Text displayed on the submit button',
          },
        },
        {
          name: 'successMessage',
          type: 'textarea',
          label: 'Success Message',
          defaultValue: 'Thank you for your submission!',
          admin: {
            description: 'Message shown after successful form submission',
          },
        },
      ],
    },

    // Advanced Settings
    {
      type: 'collapsible',
      label: 'Advanced Settings',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'emailNotification',
          type: 'group',
          label: 'Email Notification',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              label: 'Send Email Notification',
              defaultValue: false,
            },
            {
              name: 'to',
              type: 'text',
              label: 'Notification Email',
              admin: {
                description: 'Email address to receive form submissions',
                condition: (data, siblingData) => siblingData?.enabled,
              },
            },
            {
              name: 'subject',
              type: 'text',
              label: 'Email Subject',
              defaultValue: 'New Form Submission',
              admin: {
                condition: (data, siblingData) => siblingData?.enabled,
              },
            },
          ],
        },
        {
          name: 'redirectUrl',
          type: 'text',
          label: 'Redirect URL',
          admin: {
            description: 'Optional URL to redirect after submission (leave empty to show success message)',
          },
        },
      ],
    },
  ],
  access: {
    read: () => true, // Forms are public for rendering
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
}

export default Forms
