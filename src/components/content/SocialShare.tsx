'use client';

/**
 * SocialShare - Share buttons for articles and content pages.
 *
 * Features:
 * - Share to Twitter/X, Facebook, LinkedIn, Email
 * - Copy link to clipboard
 * - Uses Web Share API on mobile (native share sheet)
 * - No external dependencies (pure URLs)
 *
 * @see /docs/11-seo-discovery/SEO-DISCOVERY-STRATEGY.md
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Twitter, Facebook, Linkedin, Mail, Link2, Check, Share2 } from 'lucide-react';
import { logger } from '@/lib/logging';

interface SocialShareProps {
  /** URL to share (defaults to current page) */
  url?: string;
  /** Title/headline for the share */
  title: string;
  /** Description for email/LinkedIn shares */
  description?: string;
  /** CSS class for the container */
  className?: string;
  /** Show labels next to icons */
  showLabels?: boolean;
  /** Vertical or horizontal layout */
  direction?: 'horizontal' | 'vertical';
}

/**
 * SocialShare component with multiple platform options.
 */
export function SocialShare({
  url,
  title,
  description,
  className,
  showLabels = false,
  direction = 'horizontal',
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || title);

  // Share URLs for each platform
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('[SocialShare] Failed to copy', { error: err });
    }
  };

  // Use native share on mobile if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error - silently handle
        if ((err as Error).name !== 'AbortError') {
          logger.error('[SocialShare] Share failed', { error: err });
        }
      }
    }
  };

  // Check if native share is available
  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const buttonClass = cn(
    'h-9 w-9 p-0',
    showLabels && 'w-auto px-3 gap-2'
  );

  const containerClass = cn(
    'flex gap-2',
    direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
    className
  );

  return (
    <TooltipProvider>
      <div className={containerClass}>
        {/* Native share button (mobile) */}
        {hasNativeShare && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(buttonClass, 'lg:hidden')}
                onClick={handleNativeShare}
              >
                <Share2 className="h-4 w-4" />
                {showLabels && <span>Share</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share</TooltipContent>
          </Tooltip>
        )}

        {/* Twitter/X */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={buttonClass}
              asChild
            >
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on Twitter"
              >
                <Twitter className="h-4 w-4" />
                {showLabels && <span>Twitter</span>}
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share on Twitter</TooltipContent>
        </Tooltip>

        {/* Facebook */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={buttonClass}
              asChild
            >
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on Facebook"
              >
                <Facebook className="h-4 w-4" />
                {showLabels && <span>Facebook</span>}
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share on Facebook</TooltipContent>
        </Tooltip>

        {/* LinkedIn */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={buttonClass}
              asChild
            >
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
                {showLabels && <span>LinkedIn</span>}
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share on LinkedIn</TooltipContent>
        </Tooltip>

        {/* Email */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={buttonClass}
              asChild
            >
              <a
                href={shareLinks.email}
                aria-label="Share via Email"
              >
                <Mail className="h-4 w-4" />
                {showLabels && <span>Email</span>}
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share via Email</TooltipContent>
        </Tooltip>

        {/* Copy Link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={buttonClass}
              onClick={copyToClipboard}
              aria-label={copied ? 'Copied!' : 'Copy link'}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {showLabels && <span>{copied ? 'Copied!' : 'Copy link'}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{copied ? 'Copied!' : 'Copy link'}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export default SocialShare;
