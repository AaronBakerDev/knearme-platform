'use client'

/**
 * Social Share Buttons Component
 *
 * Displays share buttons for Twitter, LinkedIn, Facebook, and Copy Link.
 * Uses client-side JavaScript for the copy functionality.
 *
 * @see PAY-057 in PRD for acceptance criteria
 * @see https://knearme.co/blog/[slug] - where these buttons appear
 */

import { useState, useCallback } from 'react'
import { Twitter, Linkedin, Facebook, Link2, Check } from 'lucide-react'

interface SocialShareProps {
  /**
   * The URL to share. Should be an absolute URL including domain.
   */
  url: string
  /**
   * The title of the content being shared (used in share previews).
   */
  title: string
  /**
   * Optional description for platforms that support it (Facebook).
   */
  description?: string
}

/**
 * Social Share Buttons
 *
 * Renders share buttons for major social platforms plus a copy link button.
 * Share URLs use standard share intents that work without API keys.
 */
export function SocialShare({ url, title, description }: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  /**
   * Copy the URL to clipboard and show feedback
   */
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      console.error('Failed to copy:', err)
    }
  }, [url])

  // Encode parameters for URL safety
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description || '')

  /**
   * Share URLs for each platform
   * @see https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/guides/web-intent
   * @see https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/plugins/share-plugin
   * @see https://developers.facebook.com/docs/plugins/share-button/
   */
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedDescription || encodedTitle}`,
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 mr-1">Share:</span>

      {/* Twitter/X */}
      <a
        href={shareUrls.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
        aria-label="Share on Twitter"
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </a>

      {/* LinkedIn */}
      <a
        href={shareUrls.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
        aria-label="Share on LinkedIn"
        title="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
      </a>

      {/* Facebook */}
      <a
        href={shareUrls.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
        aria-label="Share on Facebook"
        title="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
          copied
            ? 'bg-green-100 text-green-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
        }`}
        aria-label={copied ? 'Link copied!' : 'Copy link'}
        title={copied ? 'Link copied!' : 'Copy link'}
      >
        {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      </button>
    </div>
  )
}
