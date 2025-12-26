'use client';

/**
 * Photo management sheet for chat interface.
 *
 * Design: Bottom sheet (drawer) pattern for managing project photos.
 * Replaces the floating ChatPhotoPanel with a cleaner sheet pattern.
 *
 * Features:
 * - Bottom sheet with 60vh height
 * - Photo grid (3 columns)
 * - Add/remove photos
 * - Max 10 photos
 * - Upload progress indication
 *
 * @see /src/components/upload/ImageUploader.tsx for upload logic
 */

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Plus, X, Loader2, ImageIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import type { UploadedImage } from '@/components/upload/ImageUploader';
import { cn } from '@/lib/utils';

interface ChatPhotoSheetProps {
  /** Whether sheet is open */
  open: boolean;
  /** Callback to control open state */
  onOpenChange: (open: boolean) => void;
  /** Project ID for upload endpoint */
  projectId: string;
  /** Current uploaded images */
  images: UploadedImage[];
  /** Callback when images change */
  onImagesChange: (images: UploadedImage[]) => void;
  /** Whether uploads are disabled */
  disabled?: boolean;
}

const MAX_IMAGES = 10;

/**
 * Photo management bottom sheet.
 */
export function ChatPhotoSheet({
  open,
  onOpenChange,
  projectId,
  images,
  onImagesChange,
  disabled = false,
}: ChatPhotoSheetProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection and upload.
   */
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // Check max limit
      const remainingSlots = MAX_IMAGES - images.length;
      if (remainingSlots <= 0) {
        setUploadError(`Maximum ${MAX_IMAGES} photos allowed`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      setIsUploading(true);
      setUploadError(null);

      try {
        const uploadedImages: UploadedImage[] = [];

        for (const file of filesToUpload) {
          // Validate file type
          if (!file.type.startsWith('image/')) {
            continue;
          }

          // Create form data
          const formData = new FormData();
          formData.append('image', file);
          formData.append('image_type', 'process'); // Default type

          // Upload to API
          const response = await fetch(`/api/projects/${projectId}/images`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Upload failed');
          }

          const { image } = await response.json();
          uploadedImages.push(image);
        }

        // Update images state
        onImagesChange([...images, ...uploadedImages]);
      } catch (err) {
        console.error('[ChatPhotoSheet] Upload error:', err);
        setUploadError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [projectId, images, onImagesChange]
  );

  /**
   * Handle image removal.
   */
  const handleRemoveImage = useCallback(
    async (imageId: string) => {
      try {
        // Optimistically update UI
        const updatedImages = images.filter((img) => img.id !== imageId);
        onImagesChange(updatedImages);

        // Delete from server
        await fetch(`/api/projects/${projectId}/images/${imageId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('[ChatPhotoSheet] Delete error:', err);
        // Revert on error by keeping the image
      }
    },
    [projectId, images, onImagesChange]
  );

  const canAddMore = images.length < MAX_IMAGES;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[60vh] max-h-[600px] rounded-t-2xl px-0"
      >
        <SheetHeader className="px-4 pb-4 border-b">
          <SheetTitle className="text-center">
            Project Photos
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({images.length}/{MAX_IMAGES})
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Error display */}
          {uploadError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {uploadError}
            </div>
          )}

          {/* Photo grid */}
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 200px"
                />
                {/* Remove button - visible on hover/touch */}
                <button
                  onClick={() => handleRemoveImage(img.id)}
                  className={cn(
                    'absolute top-1.5 right-1.5 p-1.5 rounded-full',
                    'bg-black/60 text-white opacity-0 group-hover:opacity-100',
                    'transition-opacity focus:opacity-100',
                    'hover:bg-black/80'
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
            ))}

            {/* Add photo button */}
            {canAddMore && (
              <label
                className={cn(
                  'aspect-square rounded-lg border-2 border-dashed border-border',
                  'flex flex-col items-center justify-center gap-1 cursor-pointer',
                  'transition-colors hover:border-primary hover:bg-muted/50',
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
                  onChange={handleFileChange}
                  disabled={disabled || isUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Empty state */}
          {images.length === 0 && !isUploading && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Add photos of your project
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Before, during, and after shots work best
              </p>
            </div>
          )}
        </div>

        {/* Done button */}
        <div className="p-4 border-t">
          <Button
            className="w-full rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Done{images.length > 0 && ` (${images.length} photo${images.length !== 1 ? 's' : ''})`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
