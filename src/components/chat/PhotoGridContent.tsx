'use client';

/**
 * Photo grid content for the responsive photo modal.
 *
 * Displays uploaded images in a responsive grid with:
 * - Add button for uploading new photos
 * - Remove button on hover/focus
 * - Image type badges (before/after/progress/detail)
 * - Loading state during uploads
 * - Empty state with helpful guidance
 *
 * Responsive columns:
 * - Mobile: 3 columns (compact for thumb navigation)
 * - Tablet (md): 4 columns
 * - Desktop (lg): 5 columns
 *
 * @see /src/components/chat/ResponsivePhotoModal.tsx - Parent container
 * @see /src/components/chat/ChatPhotoSheet.tsx - Consumer component
 */

import Image from 'next/image';
import { Plus, X, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UploadedImage } from '@/components/upload/ImageUploader';

const MAX_IMAGES = 10;

interface PhotoGridContentProps {
  /** Current uploaded images */
  images: UploadedImage[];
  /** Whether an upload is in progress */
  isUploading: boolean;
  /** Error message to display */
  uploadError: string | null;
  /** Whether uploads are disabled */
  disabled?: boolean;
  /** Callback when files are selected */
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Callback when an image is removed */
  onRemoveImage: (imageId: string) => void;
  /** Ref for the file input (to reset after upload) */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Photo grid with upload capability and remove actions.
 */
export function PhotoGridContent({
  images,
  isUploading,
  uploadError,
  disabled = false,
  onFileSelect,
  onRemoveImage,
  fileInputRef,
}: PhotoGridContentProps) {
  const canAddMore = images.length < MAX_IMAGES;

  return (
    <div className="space-y-4">
      {/* Error display */}
      {uploadError && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {uploadError}
        </div>
      )}

      {/* Photo grid - responsive columns */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
        {images.map((img) => {
          const isProxyImage = img.url.startsWith('/api/');
          return (
          <div
            key={img.id}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
          >
            <Image
              src={img.url}
              alt=""
              fill
              unoptimized={isProxyImage}
              className="object-cover"
              sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
            {/* Remove button - visible on hover/focus */}
            <button
              onClick={() => onRemoveImage(img.id)}
              className={cn(
                'absolute top-1.5 right-1.5 p-1.5 rounded-full',
                'bg-black/60 text-white',
                'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
                'transition-opacity focus:opacity-100',
                'hover:bg-black/80',
                'touch-manipulation' // Improves touch response
              )}
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {/* Image type badge */}
            {img.image_type && (
              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium uppercase">
                {img.image_type}
              </span>
            )}
          </div>
          );
        })}

        {/* Add photo button */}
        {canAddMore && (
          <label
            className={cn(
              'aspect-square rounded-lg border-2 border-dashed border-border',
              'flex flex-col items-center justify-center gap-1 cursor-pointer',
              'transition-colors hover:border-primary hover:bg-muted/50',
              'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
              (disabled || isUploading) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Plus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add</span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onFileSelect}
              disabled={disabled || isUploading}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {/* Empty state */}
      {images.length === 0 && !isUploading && (
        <div className="flex flex-col items-center justify-center py-6 md:py-8 text-center">
          <ImageIcon className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            Add photos of your project
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Before, during, and after shots work best
          </p>
        </div>
      )}

      {/* Upload hint when photos exist */}
      {images.length > 0 && canAddMore && !isUploading && (
        <p className="text-xs text-muted-foreground text-center">
          {MAX_IMAGES - images.length} more photo{MAX_IMAGES - images.length !== 1 ? 's' : ''} can be added
        </p>
      )}
    </div>
  );
}
