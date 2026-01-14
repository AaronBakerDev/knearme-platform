/**
 * Features Collection - Product Feature Highlights
 *
 * Manages product feature content for the landing page. Replaces hardcoded
 * features in /src/components/marketing/FeatureGrid.tsx with CMS-managed content.
 *
 * Fields:
 * - title: Feature title (e.g., "Voice-First Creation")
 * - description: Feature description text
 * - icon: Icon identifier from lucide-react
 * - order: Display order
 * - showOnLanding: Whether to display on landing page
 *
 * @see PAY-017 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/configuration/collections
 */
import type { CollectionConfig } from 'payload'
import { createRevalidateHook, createRevalidateDeleteHook, revalidatePaths } from '../hooks/revalidate.ts'

/**
 * Available icons from lucide-react for feature display.
 * These map to the icons used in FeatureGrid.tsx and common marketing icons.
 *
 * To add more icons:
 * 1. Import the icon in FeatureGrid.tsx from 'lucide-react'
 * 2. Add the option here with the exact icon name (case-sensitive)
 */
const iconOptions = [
  // Current icons used in FeatureGrid
  { label: 'Microphone', value: 'Mic' },
  { label: 'Search', value: 'Search' },
  { label: 'Layout', value: 'Layout' },
  // Common marketing/product icons
  { label: 'Zap (Lightning)', value: 'Zap' },
  { label: 'Shield', value: 'Shield' },
  { label: 'Star', value: 'Star' },
  { label: 'Check Circle', value: 'CheckCircle' },
  { label: 'Clock', value: 'Clock' },
  { label: 'Users', value: 'Users' },
  { label: 'Globe', value: 'Globe' },
  { label: 'Smartphone', value: 'Smartphone' },
  { label: 'Camera', value: 'Camera' },
  { label: 'Image', value: 'Image' },
  { label: 'Heart', value: 'Heart' },
  { label: 'Rocket', value: 'Rocket' },
  { label: 'Settings', value: 'Settings' },
  { label: 'Lock', value: 'Lock' },
  { label: 'Sparkles', value: 'Sparkles' },
  { label: 'Lightbulb', value: 'Lightbulb' },
  { label: 'Target', value: 'Target' },
]

/**
 * Features collection configuration
 *
 * Product feature highlights displayed on the landing page.
 * Each feature has a title, description, and icon for visual appeal.
 */
export const Features: CollectionConfig = {
  slug: 'features',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'icon', 'order', 'showOnLanding'],
    description: 'Product features displayed on the landing page feature grid.',
  },
  // Enable versioning with drafts for content review workflow
  versions: {
    drafts: true,
    maxPerDoc: 25, // Keep last 25 versions
  },
  fields: [
    // Feature Content
    {
      name: 'title',
      type: 'text',
      label: 'Feature Title',
      required: true,
      admin: {
        description: 'Short, compelling feature title (e.g., "Voice-First Creation")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      required: true,
      admin: {
        description: 'Feature description explaining the benefit to users',
      },
    },

    // Visual Settings
    {
      name: 'icon',
      type: 'select',
      label: 'Icon',
      required: true,
      defaultValue: 'Star',
      options: iconOptions,
      admin: {
        description: 'Icon displayed next to the feature (from lucide-react)',
      },
    },

    // Display Settings
    {
      name: 'order',
      type: 'number',
      label: 'Display Order',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first (left to right, top to bottom)',
      },
    },
    {
      name: 'showOnLanding',
      type: 'checkbox',
      label: 'Show on Landing Page',
      defaultValue: true,
      admin: {
        description: 'Include this feature in the landing page feature grid',
      },
    },
  ],
  access: {
    read: () => true, // Features are public for landing page
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    afterChange: [createRevalidateHook(revalidatePaths.landingContent, 'features') as any],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    afterDelete: [createRevalidateDeleteHook(revalidatePaths.landingContent, 'features') as any],
  },
  defaultSort: 'order',
}

export default Features
