'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ShareableLinkButtonProps {
  /** Function that returns the full shareable URL */
  getUrl: () => string
  /** Button variant style */
  variant?: 'default' | 'ghost' | 'outline' | 'secondary'
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Additional CSS classes */
  className?: string
  /** Custom label text (default: "Share Link") */
  label?: string
}

/**
 * Button component that copies a shareable URL to clipboard.
 * Shows a success toast and temporary checkmark icon on copy.
 *
 * @example
 * ```tsx
 * <ShareableLinkButton
 *   getUrl={getShareableUrl}
 *   variant="outline"
 *   size="sm"
 *   label="Copy Calculator Link"
 * />
 * ```
 */
export function ShareableLinkButton({
  getUrl,
  variant = 'outline',
  size = 'default',
  className,
  label = 'Share Link'
}: ShareableLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      const url = getUrl()
      await navigator.clipboard.writeText(url)

      setCopied(true)
      toast.success('Link copied to clipboard!', {
        description: 'Share this link to preserve the current calculator values.'
      })

      // Reset icon after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
      toast.error('Failed to copy link', {
        description: 'Please try again or copy the URL manually from the address bar.'
      })
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn('gap-2', className)}
      aria-label={copied ? 'Link copied' : 'Copy shareable link'}
    >
      {copied ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Link2 className="h-4 w-4" aria-hidden="true" />
      )}
      {size !== 'icon' && (
        <span>{copied ? 'Copied!' : label}</span>
      )}
    </Button>
  )
}
