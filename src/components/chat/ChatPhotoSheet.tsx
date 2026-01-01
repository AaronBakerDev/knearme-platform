'use client';

/**
 * Photo management modal for chat interface.
 *
 * Design: Responsive pattern for managing project photos.
 * - Mobile (<768px): Bottom sheet for thumb-friendly interaction
 * - Desktop (≥768px): Centered dialog with constrained width (672px)
 *
 * Features:
 * - Responsive grid (3 cols mobile, 4-5 cols desktop)
 * - Add/remove photos with optimistic updates
 * - Max 10 photos
 * - Upload progress indication
 * - Lazy project creation (creates project on first image upload)
 *
 * @see /src/components/chat/ResponsivePhotoModal.tsx - Container component
 * @see /src/components/chat/PhotoGridContent.tsx - Grid component
 * @see /src/components/upload/ImageUploader.tsx - Upload logic reference
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { UploadedImage } from '@/components/upload/ImageUploader';
import { compressImage, COMPRESSION_PRESETS } from '@/lib/images/compress';
import { mergeImagesById } from '@/lib/images/mergeImagesById';
import { validateFile } from '@/lib/storage/upload';
import { ResponsivePhotoModal, PhotoModalDoneButton } from './ResponsivePhotoModal';
import { PhotoGridContent } from './PhotoGridContent';

interface ChatPhotoSheetProps {
  /** Whether sheet is open */
  open: boolean;
  /** Callback to control open state */
  onOpenChange: (open: boolean) => void;
  /**
   * Project ID for upload endpoint.
   * Can be null/empty for lazy creation pattern.
   */
  projectId: string | null;
  /** Current uploaded images */
  images: UploadedImage[];
  /** Callback when images change */
  onImagesChange: (images: UploadedImage[]) => void;
  /** Whether uploads are disabled */
  disabled?: boolean;
  /**
   * Lazy creation callback - creates project before first image upload.
   * Called when projectId is empty and user attempts to upload.
   * Returns the new project ID to use for uploads.
   */
  onEnsureProject?: () => Promise<string>;
}

const MAX_IMAGES = 10;
/** Max concurrent uploads to avoid overwhelming the server */
const MAX_CONCURRENT_UPLOADS = 3;

/**
 * Upload a single image file.
 * Returns the uploaded image data or throws on error.
 */
async function uploadSingleImage(
  file: File,
  projectId: string
): Promise<UploadedImage> {
  // Step 1: Validate file
  const validationError = validateFile(file, 'project-images');
  if (validationError) {
    throw new Error(validationError);
  }

  // Step 2: Compress to WebP
  const { blob, filename, width, height } = await compressImage(
    file,
    COMPRESSION_PRESETS.upload
  );

  // Step 3: Request signed upload URL
  const uploadUrlRes = await fetch(`/api/projects/${projectId}/images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename,
      content_type: 'image/webp',
      width,
      height,
    }),
  });

  if (!uploadUrlRes.ok) {
    const errorData = await uploadUrlRes.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message ?? `Failed to get upload URL (${uploadUrlRes.status})`
    );
  }

  const { image, upload } = await uploadUrlRes.json();

  // Step 4: Upload to Supabase Storage
  const storageRes = await fetch(upload.signed_url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/webp',
      'x-upsert': 'true',
    },
    body: blob,
  });

  if (!storageRes.ok) {
    const errText = await storageRes.text().catch(() => '');
    throw new Error(errText || `Storage upload failed (${storageRes.status})`);
  }

  return {
    id: image.id,
    url: image.url,
    filename,
    storage_path: image.storage_path,
    width,
    height,
  };
}

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
  onEnsureProject,
}: ChatPhotoSheetProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track effective project ID for lazy creation pattern
  const effectiveProjectIdRef = useRef<string>(projectId || '');

  /**
   * Ref to always access the latest images value.
   * Prevents stale closure in async upload callbacks.
   * @see https://react.dev/learn/referencing-values-with-refs#differences-between-refs-and-state
   */
  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => {
    if (images.length === 0) return;
    const uniqueCount = new Set(images.map((img) => img.id)).size;
    if (uniqueCount === images.length) return;

    const deduped = mergeImagesById(images, []);
    imagesRef.current = deduped;
    onImagesChange(deduped);
  }, [images, onImagesChange]);

  // Keep ref in sync with prop changes (e.g., when project is created via onEnsureProject)
  useEffect(() => {
    if (projectId) {
      effectiveProjectIdRef.current = projectId;
    }
  }, [projectId]);

  /**
   * Handle file selection and upload.
   * Uses JSON + signed URL flow matching useInlineImages pattern.
   *
   * LAZY CREATION: If projectId is empty and onEnsureProject is provided,
   * creates the project before uploading. This is the "image upload gate"
   * pattern that prevents orphaned draft projects.
   *
   * @see /src/components/chat/hooks/useInlineImages.ts for reference implementation
   */
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // Check max limit - use ref for latest value
      const uniqueImageCount = new Set(imagesRef.current.map((img) => img.id)).size;
      const remainingSlots = MAX_IMAGES - uniqueImageCount;
      if (remainingSlots <= 0) {
        setUploadError(`Maximum ${MAX_IMAGES} photos allowed`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      setIsUploading(true);
      setUploadError(null);

      try {
        // LAZY CREATION: Ensure project exists before uploading
        if (!effectiveProjectIdRef.current && onEnsureProject) {
          const newProjectId = await onEnsureProject();
          effectiveProjectIdRef.current = newProjectId;
        }

        // Validate we have a project ID before proceeding
        const currentProjectId = effectiveProjectIdRef.current;
        if (!currentProjectId) {
          throw new Error('No project available for upload. Please try again.');
        }

        // Upload files in parallel with concurrency limit
        // Process in batches of MAX_CONCURRENT_UPLOADS
        const failedUploads: string[] = [];

        for (let i = 0; i < filesToUpload.length; i += MAX_CONCURRENT_UPLOADS) {
          const batch = filesToUpload.slice(i, i + MAX_CONCURRENT_UPLOADS);

          const results = await Promise.allSettled(
            batch.map((file) => uploadSingleImage(file, currentProjectId))
          );

          // Process results from this batch
          const newUploads: UploadedImage[] = [];
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              newUploads.push(result.value);
            } else {
              const fileName = batch[index]?.name || 'Unknown file';
              console.warn(`[ChatPhotoSheet] Failed to upload ${fileName}:`, result.reason);
              failedUploads.push(fileName);
            }
          });

          // Update UI incrementally after each batch completes
          // Use imagesRef.current to get latest images (avoid stale closure)
          if (newUploads.length > 0) {
            const mergedImages = mergeImagesById(imagesRef.current, newUploads);
            imagesRef.current = mergedImages;
            onImagesChange(mergedImages);
          }
        }

        // Show error if any uploads failed
        if (failedUploads.length > 0) {
          setUploadError(`Failed to upload: ${failedUploads.join(', ')}`);
        }
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
    // Note: imagesRef.current is used instead of images to avoid stale closure
    [onImagesChange, onEnsureProject]
  );

  /**
   * Handle image removal.
   * Uses JSON body format matching API contract.
   *
   * @see /src/app/api/projects/[id]/images/route.ts DELETE handler
   */
  const handleRemoveImage = useCallback(
    async (imageId: string) => {
      // Capture current state for potential revert - use ref for latest value
      const beforeRemoval = imagesRef.current;
      // Optimistically update UI
      const updatedImages = beforeRemoval.filter((img) => img.id !== imageId);
      onImagesChange(updatedImages);

      const currentProjectId = effectiveProjectIdRef.current;
      if (!currentProjectId) {
        console.error('[ChatPhotoSheet] No project ID for deletion');
        return;
      }

      try {
        // Delete from server using JSON body (not path param)
        const response = await fetch(`/api/projects/${currentProjectId}/images`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_id: imageId }),
        });

        if (!response.ok) {
          // Revert on error to pre-removal state
          console.error('[ChatPhotoSheet] Delete failed, reverting');
          onImagesChange(beforeRemoval);
        }
      } catch (err) {
        console.error('[ChatPhotoSheet] Delete error:', err);
        // Revert on error to pre-removal state
        onImagesChange(beforeRemoval);
      }
    },
    // Note: imagesRef.current is used instead of images to avoid stale closure
    [onImagesChange]
  );

  const title = (
    <>
      Project Photos
      <span className="ml-2 text-sm font-normal text-muted-foreground">
        ({images.length}/{MAX_IMAGES})
      </span>
    </>
  );

  return (
    <ResponsivePhotoModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        <PhotoModalDoneButton
          onClick={() => onOpenChange(false)}
          photoCount={images.length}
        />
      }
    >
      <PhotoGridContent
        images={images}
        isUploading={isUploading}
        uploadError={uploadError}
        disabled={disabled}
        onFileSelect={handleFileChange}
        onRemoveImage={handleRemoveImage}
        fileInputRef={fileInputRef}
      />
    </ResponsivePhotoModal>
  );
}
