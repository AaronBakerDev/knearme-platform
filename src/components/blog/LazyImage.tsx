/**
 * LazyImage Component
 *
 * A wrapper around Next.js Image that provides:
 * - Native lazy loading (loading="lazy" by default)
 * - Animated placeholder skeleton while loading
 * - Smooth fade-in transition on load
 *
 * Uses native browser lazy loading which is performant and doesn't
 * require JavaScript Intersection Observer overhead.
 *
 * @see PAY-062 in PRD for lazy loading requirements
 */
'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'
import { cn } from '@/lib/utils'

interface LazyImageProps extends Omit<ImageProps, 'onLoad'> {
  /**
   * Whether to show the placeholder skeleton
   * @default true
   */
  showPlaceholder?: boolean
  /**
   * Additional class for the wrapper container
   */
  wrapperClassName?: string
  /**
   * Whether to use priority loading (skips lazy loading)
   * @default false
   */
  priority?: boolean
}

/**
 * LazyImage - Image component with loading state and placeholder
 *
 * Features:
 * - Shows animated skeleton placeholder while loading
 * - Smooth opacity transition when image loads
 * - Uses native loading="lazy" for below-fold images
 * - Respects priority prop for above-fold images
 *
 * @example
 * ```tsx
 * <LazyImage
 *   src="/image.jpg"
 *   alt="Description"
 *   width={400}
 *   height={300}
 *   wrapperClassName="rounded-lg overflow-hidden"
 * />
 * ```
 */
export function LazyImage({
  showPlaceholder = true,
  wrapperClassName,
  priority = false,
  className,
  alt,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // When using fill, we need to check for that prop
  const isFill = 'fill' in props && props.fill

  return (
    <div
      className={cn(
        'relative',
        // Ensure wrapper has dimensions when using fill
        isFill && 'w-full h-full',
        wrapperClassName
      )}
    >
      {/* Placeholder skeleton - shown while loading */}
      {showPlaceholder && !isLoaded && !hasError && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-200 animate-pulse',
            // Round corners if image has rounded class
            className?.includes('rounded') && 'rounded-lg'
          )}
          aria-hidden="true"
        />
      )}

      {/* Error state */}
      {hasError && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-100 flex items-center justify-center',
            className?.includes('rounded') && 'rounded-lg'
          )}
          aria-hidden="true"
        >
          <span className="text-gray-400 text-sm">Failed to load</span>
        </div>
      )}

      {/* Actual image */}
      {!hasError && (
        <Image
          {...props}
          alt={alt}
          // Use lazy loading unless priority is set
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
          className={cn(
            className,
            // Smooth fade-in transition
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  )
}

/**
 * SimpleLazyImage - Minimal lazy image without placeholder state
 *
 * For cases where you just need native lazy loading without
 * the loading state UI. Uses native Image with loading="lazy".
 *
 * @example
 * ```tsx
 * <SimpleLazyImage
 *   src="/image.jpg"
 *   alt="Description"
 *   fill
 *   className="object-cover"
 * />
 * ```
 */
export function SimpleLazyImage({
  priority = false,
  alt,
  ...props
}: Omit<ImageProps, 'loading'> & { priority?: boolean }) {
  return (
    <Image
      {...props}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      priority={priority}
    />
  )
}
