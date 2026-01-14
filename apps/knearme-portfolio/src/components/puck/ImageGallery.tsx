/**
 * Puck ImageGallery Component
 *
 * Client-side image gallery with lightbox functionality for the Puck visual editor.
 * Uses next/image for optimization and a custom modal-based lightbox.
 *
 * Features:
 * - Responsive grid layout (stacks on mobile)
 * - Optimized images via next/image
 * - Optional lightbox for full-size image viewing
 * - Keyboard navigation in lightbox (arrow keys, Escape)
 * - Touch-friendly lightbox navigation
 *
 * @see PUCK-030 in PRD for acceptance criteria
 * @see src/lib/puck/config.tsx for integration with Puck config
 */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * MediaRef interface matching the Puck config
 * @see src/lib/puck/config.tsx for the canonical definition
 */
export interface MediaRef {
  id: string
  url: string
  alt?: string
  width?: number
  height?: number
}

export interface PuckImageGalleryProps {
  /** Array of images from Payload Media */
  images: Array<{ image: MediaRef | null }>
  /** Number of columns in the grid */
  columns: 2 | 3 | 4
  /** Whether to enable lightbox on click */
  lightbox: boolean
}

/**
 * PuckImageGallery Component
 *
 * Renders a responsive image grid with optional lightbox functionality.
 * Images are optimized using next/image and the grid is responsive using Tailwind.
 */
export function PuckImageGallery({
  images,
  columns,
  lightbox,
}: PuckImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Filter out items with no image selected
  const validImages = images.filter(
    (item): item is { image: MediaRef } =>
      item?.image != null && Boolean(item.image.url)
  )

  // Open lightbox at specific index
  const openLightbox = useCallback(
    (index: number) => {
      if (lightbox) {
        setCurrentIndex(index)
        setLightboxOpen(true)
      }
    },
    [lightbox]
  )

  // Close lightbox
  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
  }, [])

  // Navigate to previous image
  const prevImage = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === 0 ? validImages.length - 1 : prev - 1
    )
  }, [validImages.length])

  // Navigate to next image
  const nextImage = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === validImages.length - 1 ? 0 : prev + 1
    )
  }, [validImages.length])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeLightbox()
          break
        case 'ArrowLeft':
          prevImage()
          break
        case 'ArrowRight':
          nextImage()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [lightboxOpen, closeLightbox, prevImage, nextImage])

  // Grid column classes based on columns prop
  const gridClasses: Record<2 | 3 | 4, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  // Empty state
  if (validImages.length === 0) {
    return (
      <div
        className={cn(
          'py-12 px-4 bg-muted/50 text-center text-muted-foreground rounded-lg',
          'col-span-full'
        )}
      >
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm">No images selected. Add images via the fields panel.</p>
      </div>
    )
  }

  return (
    <>
      {/* Image Grid */}
      <div className={cn('grid gap-4', gridClasses[columns])}>
        {validImages.map((item, index) => (
          <button
            key={item.image.id || index}
            type="button"
            onClick={() => openLightbox(index)}
            className={cn(
              'group relative aspect-square overflow-hidden rounded-lg bg-muted',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              lightbox && 'cursor-pointer hover:opacity-90 transition-opacity'
            )}
            disabled={!lightbox}
            aria-label={`View ${item.image.alt || `image ${index + 1}`} in lightbox`}
          >
            {item.image.width && item.image.height ? (
              <Image
                src={item.image.url}
                alt={item.image.alt || `Gallery image ${index + 1}`}
                fill
                className="object-cover"
                sizes={
                  columns === 2
                    ? '(max-width: 640px) 100vw, 50vw'
                    : columns === 3
                      ? '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw'
                      : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
                }
              />
            ) : (
              // Fallback for images without dimensions
              <Image
                src={item.image.url}
                alt={item.image.alt || `Gallery image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            )}
            {/* Hover overlay indicator for lightbox */}
            {lightbox && (
              <div
                className={cn(
                  'absolute inset-0 bg-black/0 transition-colors',
                  'group-hover:bg-black/20 flex items-center justify-center'
                )}
                aria-hidden="true"
              >
                <svg
                  className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && validImages[currentIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            className={cn(
              'absolute top-4 right-4 z-10 p-2 rounded-full',
              'bg-white/10 hover:bg-white/20 text-white transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-white'
            )}
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous button */}
          {validImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                prevImage()
              }}
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full',
                'bg-white/10 hover:bg-white/20 text-white transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-white'
              )}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Next button */}
          {validImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                nextImage()
              }}
              className={cn(
                'absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full',
                'bg-white/10 hover:bg-white/20 text-white transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-white'
              )}
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Main image container */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full">
              <Image
                src={validImages[currentIndex].image.url}
                alt={
                  validImages[currentIndex].image.alt ||
                  `Gallery image ${currentIndex + 1}`
                }
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </div>
          </div>

          {/* Image counter */}
          {validImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {currentIndex + 1} / {validImages.length}
            </div>
          )}

          {/* Alt text caption */}
          {validImages[currentIndex].image.alt && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 max-w-[80vw] text-white/90 text-center text-sm px-4 py-2 bg-black/50 rounded">
              {validImages[currentIndex].image.alt}
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default PuckImageGallery
