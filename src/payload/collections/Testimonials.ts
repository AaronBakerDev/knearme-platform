/**
 * Testimonials Collection - Customer Testimonials
 *
 * Manages customer testimonial content for the landing page. Replaces hardcoded
 * testimonials in /src/components/marketing/Testimonials.tsx with CMS-managed content.
 *
 * Fields:
 * - name: Customer name
 * - role: Customer role/company (e.g., "Acme Corp")
 * - content: Testimonial text (richText)
 * - rating: 1-5 star rating
 * - avatar: Customer photo
 * - featured: Highlight on landing page
 * - order: Display order
 *
 * @see PAY-016 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/configuration/collections
 */
import type { CollectionConfig, Field } from 'payload'

/**
 * Upload field referencing the media collection.
 * Uses type assertion because 'media' isn't in generated CollectionSlug yet.
 * TODO: Remove type assertion after running `npx payload generate:types`
 */
const mediaUploadField = (name: string, label: string, description: string): Field => ({
  name,
  type: 'upload',
  label,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  relationTo: 'media' as any,
  admin: { description },
})

/**
 * Testimonials collection configuration
 *
 * Displays customer quotes on the landing page. Featured testimonials
 * appear prominently; others can be shown in a carousel or grid.
 */
export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'rating', 'featured', 'order'],
    description: 'Customer testimonials displayed on the landing page.',
  },
  fields: [
    // Customer Info
    {
      name: 'name',
      type: 'text',
      label: 'Customer Name',
      required: true,
      admin: {
        description: 'Name of the customer providing the testimonial',
      },
    },
    {
      name: 'role',
      type: 'text',
      label: 'Role / Company',
      admin: {
        description: 'Customer\'s role or company (e.g., "CEO at Acme Corp")',
      },
    },

    // Testimonial Content
    {
      name: 'content',
      type: 'richText',
      label: 'Testimonial',
      required: true,
      admin: {
        description: 'The customer\'s testimonial text',
      },
    },
    {
      name: 'rating',
      type: 'number',
      label: 'Rating',
      min: 1,
      max: 5,
      defaultValue: 5,
      admin: {
        description: 'Star rating (1-5)',
      },
    },

    // Avatar
    mediaUploadField('avatar', 'Avatar', 'Customer photo (recommended: 100x100px)'),

    // Display Settings
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Featured',
      defaultValue: false,
      admin: {
        description: 'Feature this testimonial prominently on the landing page',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Display Order',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first',
      },
    },
  ],
  access: {
    read: () => true, // Testimonials are public for landing page
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  defaultSort: 'order',
}

export default Testimonials
