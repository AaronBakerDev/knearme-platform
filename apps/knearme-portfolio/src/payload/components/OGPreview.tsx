/**
 * OG Preview Component for Payload Admin
 *
 * Provides a live preview of how content will appear when shared on social media.
 * Uses Open Graph meta tags (title, description, image) to render a preview card
 * that updates in real-time as users edit SEO fields.
 *
 * Used in: Articles, Authors, Categories, ServiceTypes SEO groups
 *
 * @see PAY-060 in PRD for acceptance criteria
 * @see https://payloadcms.com/docs/fields/ui for UI field pattern
 */
'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'

/**
 * Field state interface from Payload's form system
 */
interface FieldState {
  value?: unknown
  valid?: boolean
  errorMessage?: string
}

/**
 * Media object structure from Payload uploads
 */
interface MediaObject {
  url?: string
  filename?: string
  alt?: string
  width?: number
  height?: number
}

/**
 * Preview card styles for social media appearance
 * Based on common OG preview patterns (Twitter, LinkedIn, Facebook)
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: '1rem',
    marginBottom: '1rem',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: '#6B7280',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  card: {
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    maxWidth: '500px',
  },
  imageContainer: {
    backgroundColor: '#F3F4F6',
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  imagePlaceholder: {
    color: '#9CA3AF',
    fontSize: '0.875rem',
    textAlign: 'center' as const,
    padding: '1rem',
  },
  content: {
    padding: '0.75rem 1rem',
  },
  domain: {
    fontSize: '0.75rem',
    color: '#6B7280',
    marginBottom: '0.25rem',
    textTransform: 'lowercase' as const,
  },
  title: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: '0.25rem',
    lineHeight: 1.3,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  description: {
    fontSize: '0.8125rem',
    color: '#4B5563',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  hint: {
    fontSize: '0.75rem',
    color: '#9CA3AF',
    marginTop: '0.5rem',
    fontStyle: 'italic',
  },
}

/**
 * Extracts the image URL from a media field value.
 * Handles both populated objects and ID references.
 *
 * @param value - The field value (can be object, string ID, or undefined)
 * @returns The image URL or undefined
 */
function getImageUrl(value: unknown): string | undefined {
  if (!value) return undefined

  // If it's a populated media object with URL
  if (typeof value === 'object' && value !== null) {
    const media = value as MediaObject
    if (media.url) {
      return media.url
    }
  }

  // If it's just an ID reference, we can't show the image
  // (would need additional API call)
  return undefined
}

/**
 * Truncates text to a maximum length with ellipsis.
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum character length
 * @returns Truncated text with ellipsis if needed
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * OG Preview UI Component
 *
 * Renders a social media share preview card that updates in real-time.
 * Watches the following fields:
 * - title (fallback for og:title)
 * - excerpt (fallback for og:description)
 * - seo.metaTitle (og:title override)
 * - seo.metaDescription (og:description override)
 * - seo.ogImage (og:image)
 * - featuredImage (fallback for og:image)
 */
export const OGPreview: UIFieldClientComponent = () => {

  // Watch all relevant fields for the preview
  // Using useFormFields with a selector that returns multiple values
  const formData = useFormFields(([fields]) => {
    const getFieldValue = (path: string): unknown => {
      const field = fields[path] as FieldState | undefined
      return field?.value
    }

    return {
      // Common fields
      title: getFieldValue('title') as string | undefined,
      excerpt: getFieldValue('excerpt') as string | undefined,
      // SEO group fields (Articles, Authors, Categories)
      metaTitle: getFieldValue('seo.metaTitle') as string | undefined,
      metaDescription: getFieldValue('seo.metaDescription') as string | undefined,
      ogImage: getFieldValue('seo.ogImage'),
      featuredImage: getFieldValue('featuredImage'),
      // For authors
      name: getFieldValue('name') as string | undefined,
      bio: getFieldValue('bio'),
      // For categories
      description: getFieldValue('description') as string | undefined,
      // For service types (root-level SEO fields)
      headline: getFieldValue('headline') as string | undefined,
      rootMetaDescription: getFieldValue('metaDescription') as string | undefined,
      rootOgImage: getFieldValue('ogImage'),
    }
  })

  // Determine the display values with fallbacks
  // Priority: SEO override > grouped SEO > content field > fallback
  const displayTitle =
    formData.metaTitle ||
    formData.headline || // ServiceTypes headline
    formData.title ||
    formData.name ||
    'Untitled'

  const displayDescription =
    formData.metaDescription ||
    formData.rootMetaDescription || // ServiceTypes root-level metaDescription
    formData.excerpt ||
    formData.description ||
    (typeof formData.bio === 'string' ? formData.bio : '') ||
    'No description provided'

  // Get image URL with fallbacks
  // Check grouped SEO image, then root-level ogImage, then featuredImage
  const imageUrl =
    getImageUrl(formData.ogImage) ||
    getImageUrl(formData.rootOgImage) ||
    getImageUrl(formData.featuredImage) ||
    undefined

  // Determine domain based on environment
  const domain = process.env.NEXT_PUBLIC_SITE_URL || 'knearme.co'
  const displayDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <div style={styles.container}>
      <div style={styles.label}>Social Share Preview</div>
      <div style={styles.card}>
        {/* Image Section */}
        <div style={styles.imageContainer}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="OG Preview"
              style={styles.image}
              onError={(e) => {
                // Hide broken images
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div style={styles.imagePlaceholder}>
              <div>No image selected</div>
              <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                Upload an OG Image or Featured Image
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div style={styles.content}>
          <div style={styles.domain}>{displayDomain}</div>
          <div style={styles.title}>{truncate(displayTitle, 70)}</div>
          <div style={styles.description}>
            {truncate(displayDescription, 160)}
          </div>
        </div>
      </div>

      <div style={styles.hint}>
        This preview shows how your content will appear when shared on social
        media. Edit the SEO fields above to customize.
      </div>
    </div>
  )
}

export default OGPreview
