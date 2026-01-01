'use client';

/**
 * PhotoGallery - Interactive image gallery with lightbox for project portfolios.
 *
 * Features:
 * - Hero image with priority loading
 * - Thumbnail strip for navigation
 * - Full-screen lightbox viewer
 * - Keyboard navigation (← → Escape)
 * - Touch swipe on mobile
 * - Accessible with proper focus management
 *
 * @see /docs/02-requirements/capabilities.md Photo gallery capabilities
 * @see Sprint 4 tasks for lightbox implementation
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SafeImage } from '@/components/ui/safe-image';

/**
 * Minimum swipe distance in pixels to trigger navigation.
 * Lower = more sensitive, Higher = requires more deliberate swipes.
 */
const SWIPE_THRESHOLD = 50;

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** Optional blur data URL for placeholder */
  blurDataURL?: string;
}

/**
 * Simple shimmer placeholder - improves perceived performance while images load.
 * Uses a tiny base64 SVG that renders as a neutral gray with shimmer animation.
 */
const SHIMMER_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=';

interface PhotoGalleryProps {
  images: GalleryImage[];
  /** Title for the gallery (used in alt text fallbacks) */
  title?: string;
  /** Maximum thumbnails to show (default: 4) */
  maxThumbnails?: number;
  /** Additional class name for the container */
  className?: string;
}

/**
 * PhotoGallery component with lightbox functionality.
 *
 * @example
 * ```tsx
 * <PhotoGallery
 *   images={[
 *     { id: '1', src: '/image1.jpg', alt: 'Before renovation' },
 *     { id: '2', src: '/image2.jpg', alt: 'After renovation' },
 *   ]}
 *   title="Chimney Rebuild Project"
 * />
 * ```
 */
export function PhotoGallery({
  images,
  title = 'Gallery',
  maxThumbnails = 4,
  className,
}: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  // Filter out failed images for display
  const validImages = useMemo(
    () => images.filter((img) => !failedImageIds.has(img.id)),
    [images, failedImageIds]
  );

  // Handler to mark an image as failed
  const handleImageError = useCallback((imageId: string) => {
    setFailedImageIds((prev) => new Set([...prev, imageId]));
  }, []);

  // Touch swipe state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Handle keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setLightboxOpen(false);
          break;
        case 'ArrowLeft':
          setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
          break;
        case 'ArrowRight':
          setCurrentIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, validImages.length]);

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
  }, [validImages.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
  }, [validImages.length]);

  /**
   * Touch event handlers for swipe navigation on mobile.
   * Swipe left = next image, Swipe right = previous image.
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0]?.clientX ?? null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const distance = touchStartX.current - touchEndX.current;
    const isSwipe = Math.abs(distance) > SWIPE_THRESHOLD;

    if (isSwipe) {
      if (distance > 0) {
        // Swiped left → go to next image
        goToNext();
      } else {
        // Swiped right → go to previous image
        goToPrevious();
      }
    }

    // Reset touch state
    touchStartX.current = null;
    touchEndX.current = null;
  }, [goToNext, goToPrevious]);

  if (validImages.length === 0) {
    return null;
  }

  // Safe to access after length check - TypeScript assertion
  const heroImage = validImages[0]!;
  const thumbnails = validImages.slice(1, maxThumbnails + 1);
  const remainingCount = validImages.length - maxThumbnails - 1;

  return (
    <>
      <div className={cn('space-y-4', className)}>
        {/* Hero Image */}
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="relative aspect-video w-full rounded-xl overflow-hidden group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shadow-lg"
          aria-label={`View ${heroImage.alt ?? title} in fullscreen`}
        >
          <SafeImage
            src={heroImage.src}
            alt={heroImage.alt ?? title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority
            sizes="(max-width: 768px) 100vw, 896px"
            placeholder="blur"
            blurDataURL={heroImage.blurDataURL || SHIMMER_PLACEHOLDER}
            onImageError={() => handleImageError(heroImage.id)}
          />
          {/* Subtle gradient overlay at bottom for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60" />
          {/* Hover overlay with zoom indicator */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/90 text-black p-3 rounded-full shadow-lg transform scale-90 group-hover:scale-100">
              <ZoomIn className="h-6 w-6" />
            </div>
          </div>
        </button>

        {/* Thumbnail Grid */}
        {validImages.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {thumbnails.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => openLightbox(idx + 1)}
                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shadow-sm hover:shadow-md transition-shadow"
                aria-label={`View ${img.alt || `image ${idx + 2}`} in fullscreen`}
              >
                <SafeImage
                  src={img.src}
                  alt={img.alt || `${title} - Image ${idx + 2}`}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-110"
                  sizes="(max-width: 768px) 25vw, 224px"
                  placeholder="blur"
                  blurDataURL={img.blurDataURL || SHIMMER_PLACEHOLDER}
                  onImageError={() => handleImageError(img.id)}
                />
                {/* Hover ring effect */}
                <div className="absolute inset-0 ring-0 ring-inset ring-white/0 group-hover:ring-2 group-hover:ring-white/50 transition-all duration-200" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
              </button>
            ))}

            {/* "More" indicator for additional images */}
            {remainingCount > 0 && (
              <button
                type="button"
                onClick={() => openLightbox(maxThumbnails + 1)}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted/80 flex flex-col items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:bg-muted transition-colors shadow-sm"
                aria-label={`View ${remainingCount} more images`}
              >
                <span className="text-2xl font-bold text-muted-foreground">
                  +{remainingCount}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">more</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeLightbox();
            }
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full"
            aria-label="Close lightbox"
          >
            <X className="h-8 w-8" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-4 text-white/70 text-sm">
            {currentIndex + 1} / {validImages.length}
          </div>

          {/* Previous button */}
          {validImages.length > 1 && (
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full bg-black/30 hover:bg-black/50"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Main image with touch swipe support */}
          <div
            className="relative w-full h-full max-w-6xl max-h-[80vh] mx-16 touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {(() => {
              const currentImage = validImages[currentIndex];
              if (!currentImage) return null;
              return (
                <SafeImage
                  src={currentImage.src}
                  alt={currentImage.alt || `${title} - Image ${currentIndex + 1}`}
                  fill
                  className="object-contain pointer-events-none select-none"
                  sizes="100vw"
                  priority
                  placeholder="blur"
                  blurDataURL={currentImage.blurDataURL || SHIMMER_PLACEHOLDER}
                  draggable={false}
                  onImageError={() => handleImageError(currentImage.id)}
                />
              );
            })()}
          </div>

          {/* Next button */}
          {validImages.length > 1 && (
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full bg-black/30 hover:bg-black/50"
              aria-label="Next image"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* Caption */}
          {validImages[currentIndex]?.alt && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-center max-w-lg px-4">
              {validImages[currentIndex].alt}
            </div>
          )}

          {/* Thumbnail strip at bottom (for more than 2 images) */}
          {validImages.length > 2 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 max-w-[80%] px-4">
              {/* Scroll fade indicators */}
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/80 to-transparent pointer-events-none z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/80 to-transparent pointer-events-none z-10" />
                <div className="flex gap-2 overflow-x-auto py-2 px-2 scrollbar-hide">
                  {validImages.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        'relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-all duration-200',
                        currentIndex === idx
                          ? 'ring-2 ring-white opacity-100 scale-105'
                          : 'opacity-50 hover:opacity-90 hover:scale-105'
                      )}
                      aria-label={`View image ${idx + 1}`}
                      aria-current={currentIndex === idx ? 'true' : undefined}
                    >
                      <SafeImage
                        src={img.src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                        hideOnError
                        onImageError={() => handleImageError(img.id)}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
}

export default PhotoGallery;
