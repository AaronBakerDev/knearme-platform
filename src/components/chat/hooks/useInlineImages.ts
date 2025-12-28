'use client';

/**
 * useInlineImages - Hook for managing inline image uploads in chat interface.
 *
 * Handles the complete image upload lifecycle with optimistic UI updates:
 * 1. User selects files (via drag-drop or file picker)
 * 2. Local preview URLs are created immediately for optimistic display
 * 3. Files are compressed client-side and uploaded to Supabase Storage
 * 4. Server creates database records with proper storage paths
 * 5. Images can be categorized (before/after/progress/detail) and removed
 *
 * Upload Flow (see /docs/03-architecture/c4-container.md):
 * - POST `/api/projects/[id]/images` - Creates image record + returns signed upload URL
 * - PUT to signed_url - Uploads file directly to Supabase Storage
 * - PATCH `/api/projects/[id]/images` - Updates image labels/categories
 * - DELETE `/api/projects/[id]/images` - Removes image from storage and database
 *
 * @example
 * ```tsx
 * const {
 *   uploadedImages,
 *   pendingUploads,
 *   addImages,
 *   categorizeImage,
 *   removeImage,
 *   isUploading,
 *   error,
 * } = useInlineImages({
 *   projectId: 'uuid-here',
 *   onImagesChange: (images) => updateChatSession(images),
 * });
 * ```
 *
 * @see /src/app/api/projects/[id]/images/route.ts for API implementation
 * @see /src/components/upload/ImageUploader.tsx for full uploader component
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { UploadedImage } from '@/lib/chat/chat-types';
import { compressImage, COMPRESSION_PRESETS, createPreviewUrl } from '@/lib/images/compress';
import { validateFile } from '@/lib/storage/upload';

/** Image type classification for before/after comparisons */
export type ImageType = 'before' | 'after' | 'progress' | 'detail';

/**
 * Pending upload state with optimistic preview.
 * Tracks upload progress and provides immediate visual feedback.
 */
export interface PendingUpload {
  /** Unique identifier for this pending upload */
  id: string;
  /** Original file being uploaded */
  file: File;
  /** Upload progress (0-100) */
  progress: number;
  /** Blob URL for immediate preview (cleaned up on unmount) */
  previewUrl: string;
  /** Error message if upload failed */
  error?: string;
}

/**
 * Options for configuring the useInlineImages hook.
 */
export interface UseInlineImagesOptions {
  /**
   * Project ID for upload path.
   * Can be empty string initially for lazy creation pattern.
   * If empty and onEnsureProject is provided, project will be created on first upload.
   */
  projectId: string;
  /** Pre-existing uploaded images to initialize state */
  initialImages?: UploadedImage[];
  /**
   * Callback fired when the uploaded images array changes.
   * Use this to sync with parent state (e.g., chat session).
   */
  onImagesChange?: (images: UploadedImage[]) => void;
  /** Maximum number of images allowed (default: 10) */
  maxImages?: number;
  /**
   * Lazy creation callback - creates project before first image upload.
   * Called when projectId is empty and user attempts to upload.
   * Returns the new project ID to use for uploads.
   *
   * This enables the "image upload gate" pattern to prevent orphaned drafts.
   * @see /src/app/(contractor)/projects/new/page.tsx for implementation
   */
  onEnsureProject?: () => Promise<string>;
}

/**
 * Return type for useInlineImages hook.
 */
export interface UseInlineImagesReturn {
  /** Successfully uploaded images */
  uploadedImages: UploadedImage[];
  /** Images currently being uploaded with preview URLs */
  pendingUploads: PendingUpload[];
  /**
   * Add files to upload queue.
   * Files are validated, compressed, and uploaded concurrently.
   */
  addImages: (files: File[]) => Promise<void>;
  /**
   * Update an image's category (before/after/progress/detail).
   * Calls PATCH API to persist the label change.
   */
  categorizeImage: (imageId: string, category: ImageType) => Promise<void>;
  /**
   * Remove an uploaded image.
   * Calls DELETE API to remove from storage and database.
   */
  removeImage: (imageId: string) => Promise<void>;
  /** True if any uploads are in progress */
  isUploading: boolean;
  /** Most recent error (null if no error) */
  error: Error | null;
  /** Clear the current error state */
  clearError: () => void;
}

/**
 * Hook for managing inline image uploads in chat interface.
 *
 * Provides optimistic UI with local preview URLs while uploads are in progress,
 * handles concurrent uploads with Promise.all, and manages cleanup of blob URLs.
 *
 * Error Handling:
 * - Validation errors (file type, size) are captured per-upload in pendingUploads
 * - Network/API errors set the global error state
 * - Failed uploads remain in pendingUploads with error message for retry/removal
 *
 * @param options - Configuration options including projectId and callbacks
 * @returns Object with images state and mutation functions
 */
export function useInlineImages({
  projectId,
  initialImages = [],
  onImagesChange,
  maxImages = 10,
  onEnsureProject,
}: UseInlineImagesOptions): UseInlineImagesReturn {
  // Track the effective project ID (may be set lazily via onEnsureProject)
  const effectiveProjectIdRef = useRef<string>(projectId);

  // Keep ref in sync with prop changes
  useEffect(() => {
    if (projectId) {
      effectiveProjectIdRef.current = projectId;
    }
  }, [projectId]);
  // Uploaded images (successfully completed)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(initialImages);

  // Pending uploads with optimistic previews
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);

  // Global error state for API/network errors
  const [error, setError] = useState<Error | null>(null);

  // Track blob URLs for cleanup
  const blobUrlsRef = useRef<Set<string>>(new Set());

  /**
   * Cleanup blob URLs on unmount to prevent memory leaks.
   * Blob URLs created via URL.createObjectURL must be explicitly revoked.
   */
  useEffect(() => {
    const urls = blobUrlsRef.current;
    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      urls.clear();
    };
  }, []);

  /**
   * Sync with parent when uploadedImages changes.
   * Uses a ref to avoid re-triggering on callback identity changes.
   */
  const onImagesChangeRef = useRef(onImagesChange);
  onImagesChangeRef.current = onImagesChange;

  useEffect(() => {
    onImagesChangeRef.current?.(uploadedImages);
  }, [uploadedImages]);

  /**
   * Keep local state in sync when parent-provided images change.
   * This is important for edit mode where images load asynchronously.
   */
  useEffect(() => {
    const isSameImages =
      uploadedImages.length === initialImages.length &&
      uploadedImages.every((image, index) => {
        const other = initialImages[index];
        return (
          other &&
          image.id === other.id &&
          image.url === other.url &&
          image.image_type === other.image_type
        );
      });

    if (!isSameImages) {
      setUploadedImages(initialImages);
    }
  }, [initialImages, uploadedImages]);

  /**
   * Generate a unique ID for pending uploads.
   * Format: pending-{timestamp}-{random}
   */
  const generatePendingId = useCallback((): string => {
    return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  /**
   * Update progress for a specific pending upload.
   */
  const updatePendingProgress = useCallback((id: string, progress: number) => {
    setPendingUploads((prev) =>
      prev.map((p) => (p.id === id ? { ...p, progress } : p))
    );
  }, []);

  /**
   * Mark a pending upload as failed with error message.
   */
  const markPendingError = useCallback((id: string, errorMessage: string) => {
    setPendingUploads((prev) =>
      prev.map((p) => (p.id === id ? { ...p, error: errorMessage, progress: 100 } : p))
    );
  }, []);

  /**
   * Remove a pending upload and cleanup its blob URL.
   */
  const removePending = useCallback((id: string) => {
    setPendingUploads((prev) => {
      const pending = prev.find((p) => p.id === id);
      if (pending) {
        URL.revokeObjectURL(pending.previewUrl);
        blobUrlsRef.current.delete(pending.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  /**
   * Upload a single file to storage.
   * Returns the uploaded image record or throws on error.
   *
   * Upload sequence:
   * 1. Validate file type/size
   * 2. Compress to WebP
   * 3. Request signed URL from API
   * 4. PUT file to signed URL
   * 5. Return image record
   */
  const uploadSingleFile = useCallback(
    async (file: File, pendingId: string): Promise<UploadedImage> => {
      // Step 1: Validate file
      const validationError = validateFile(file, 'project-images');
      if (validationError) {
        throw new Error(validationError);
      }

      updatePendingProgress(pendingId, 10);

      // Step 2: Compress image
      const { blob, filename, width, height } = await compressImage(
        file,
        COMPRESSION_PRESETS.upload
      );

      updatePendingProgress(pendingId, 30);

      // Step 3: Request signed upload URL
      // Use effective project ID (may have been set lazily via onEnsureProject)
      const currentProjectId = effectiveProjectIdRef.current;
      if (!currentProjectId) {
        throw new Error('No project ID available for upload');
      }

      const uploadUrlRes = await fetch(`/api/projects/${currentProjectId}/images`, {
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

      updatePendingProgress(pendingId, 50);

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

      updatePendingProgress(pendingId, 100);

      // Step 5: Return uploaded image record
      return {
        id: image.id,
        url: image.url,
        filename,
        storage_path: image.storage_path,
        width,
        height,
      };
    },
    [updatePendingProgress]
  );

  /**
   * Add files to the upload queue.
   * Creates optimistic previews and processes uploads concurrently.
   *
   * LAZY CREATION: If no projectId exists and onEnsureProject is provided,
   * creates the project before uploading. This is the "image upload gate"
   * pattern that prevents orphaned draft projects.
   *
   * @param files - Array of File objects to upload
   */
  const addImages = useCallback(
    async (files: File[]): Promise<void> => {
      setError(null);

      // Calculate remaining slots
      const currentCount = uploadedImages.length + pendingUploads.length;
      const remainingSlots = maxImages - currentCount;

      if (remainingSlots <= 0) {
        setError(new Error(`Maximum of ${maxImages} images allowed`));
        return;
      }

      // Limit files to remaining slots
      const filesToUpload = files.slice(0, remainingSlots);

      if (filesToUpload.length === 0) {
        return;
      }

      // LAZY CREATION: Ensure project exists before uploading
      // This is the "gate" that triggers project creation on first image upload
      if (!effectiveProjectIdRef.current && onEnsureProject) {
        try {
          const newProjectId = await onEnsureProject();
          effectiveProjectIdRef.current = newProjectId;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
          setError(new Error(errorMessage));
          return;
        }
      }

      // Validate we have a project ID before proceeding
      if (!effectiveProjectIdRef.current) {
        setError(new Error('No project available for upload. Please try again.'));
        return;
      }

      // Create pending entries with preview URLs
      const newPending: PendingUpload[] = filesToUpload.map((file) => {
        const previewUrl = createPreviewUrl(file);
        blobUrlsRef.current.add(previewUrl);

        return {
          id: generatePendingId(),
          file,
          progress: 0,
          previewUrl,
        };
      });

      setPendingUploads((prev) => [...prev, ...newPending]);

      // Process uploads concurrently
      const uploadPromises = newPending.map(async (pending) => {
        try {
          const uploadedImage = await uploadSingleFile(pending.file, pending.id);

          // Success: add to uploaded images and remove from pending
          setUploadedImages((prev) => [...prev, uploadedImage]);
          removePending(pending.id);

          return { success: true as const, image: uploadedImage };
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Upload failed';
          markPendingError(pending.id, errorMessage);

          return { success: false as const, error: errorMessage };
        }
      });

      const results = await Promise.all(uploadPromises);

      // Check for any failures - type guard to narrow to failed results
      const failures = results.filter(
        (r): r is { success: false; error: string } => !r.success
      );
      const firstFailure = failures[0];
      if (firstFailure && failures.length === results.length) {
        // All uploads failed - set global error
        setError(new Error(`All uploads failed: ${firstFailure.error}`));
      }
    },
    [
      uploadedImages.length,
      pendingUploads.length,
      maxImages,
      generatePendingId,
      uploadSingleFile,
      removePending,
      markPendingError,
      onEnsureProject,
    ]
  );

  /**
   * Categorize an image with a specific type (before/after/progress/detail).
   * Persists the label change via PATCH API.
   *
   * @param imageId - UUID of the image to categorize
   * @param category - Image type classification
   */
  const categorizeImage = useCallback(
    async (imageId: string, category: ImageType): Promise<void> => {
      setError(null);

      const currentProjectId = effectiveProjectIdRef.current;
      if (!currentProjectId) {
        setError(new Error('No project available'));
        return;
      }

      try {
        const res = await fetch(`/api/projects/${currentProjectId}/images`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            labels: [{ image_id: imageId, image_type: category }],
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error?.message ?? `Failed to categorize image (${res.status})`
          );
        }

        // Update local state
        setUploadedImages((prev) =>
          prev.map((img) =>
            img.id === imageId ? { ...img, image_type: category } : img
          )
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to categorize image';
        setError(new Error(errorMessage));
        throw err;
      }
    },
    []
  );

  /**
   * Remove an uploaded image.
   * Calls DELETE API to remove from both storage and database.
   *
   * @param imageId - UUID of the image to remove
   */
  const removeImage = useCallback(
    async (imageId: string): Promise<void> => {
      setError(null);

      // Check if it's a pending upload (has error, user wants to remove)
      const pendingMatch = pendingUploads.find((p) => p.id === imageId);
      if (pendingMatch) {
        removePending(imageId);
        return;
      }

      const currentProjectId = effectiveProjectIdRef.current;
      if (!currentProjectId) {
        setError(new Error('No project available'));
        return;
      }

      try {
        const res = await fetch(`/api/projects/${currentProjectId}/images`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_id: imageId }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error?.message ?? `Failed to delete image (${res.status})`
          );
        }

        // Update local state
        setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete image';
        setError(new Error(errorMessage));
        throw err;
      }
    },
    [pendingUploads, removePending]
  );

  /**
   * Clear the current error state.
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Compute derived state
  const isUploading = pendingUploads.some((p) => !p.error && p.progress < 100);

  return {
    uploadedImages,
    pendingUploads,
    addImages,
    categorizeImage,
    removeImage,
    isUploading,
    error,
    clearError,
  };
}
