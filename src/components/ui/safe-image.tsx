'use client';

/**
 * SafeImage - A wrapper around next/image with graceful error handling.
 *
 * Handles cases where images fail to load (404, network errors, etc.)
 * by showing a fallback placeholder instead of breaking the UI.
 *
 * @see https://nextjs.org/docs/app/api-reference/components/image
 */

import { useState, useCallback } from 'react';
import Image, { type ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Shimmer placeholder for loading state.
 * Neutral gray SVG that works with blur placeholder.
 */
const SHIMMER_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=';

export interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  /**
   * Custom fallback element to show when image fails to load.
   * If not provided, shows a default placeholder with ImageOff icon.
   */
  fallback?: React.ReactNode;
  /**
   * Callback fired when image fails to load.
   * Useful for parent components to track failed images.
   */
  onImageError?: () => void;
  /**
   * Additional class name for the fallback container.
   */
  fallbackClassName?: string;
  /**
   * If true, completely hides the element when image fails.
   * Useful for thumbnail strips where you want to filter out broken images.
   */
  hideOnError?: boolean;
}

/**
 * SafeImage component - wraps next/image with error handling.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <SafeImage
 *   src="/path/to/image.jpg"
 *   alt="Description"
 *   fill
 *   className="object-cover"
 * />
 *
 * // With error callback
 * <SafeImage
 *   src={imageUrl}
 *   alt="Project photo"
 *   fill
 *   onImageError={() => console.log('Image failed')}
 * />
 *
 * // Hide completely on error (for thumbnail strips)
 * <SafeImage
 *   src={thumbnail.src}
 *   alt={thumbnail.alt}
 *   fill
 *   hideOnError
 * />
 * ```
 */
export function SafeImage({
  fallback,
  onImageError,
  fallbackClassName,
  hideOnError = false,
  className,
  alt,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
    onImageError?.();
  }, [onImageError]);

  // Completely hide element if hideOnError is true
  if (hasError && hideOnError) {
    return null;
  }

  // Show fallback if error occurred
  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default fallback: gray background with icon
    return (
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center bg-muted',
          fallbackClassName
        )}
        role="img"
        aria-label={`Image unavailable: ${alt}`}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImageOff className="h-8 w-8" />
          <span className="text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <Image
      {...props}
      alt={alt}
      className={className}
      onError={handleError}
      placeholder={props.placeholder ?? 'blur'}
      blurDataURL={props.blurDataURL ?? SHIMMER_PLACEHOLDER}
    />
  );
}

export default SafeImage;
