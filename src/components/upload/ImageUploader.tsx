'use client';

/**
 * Multi-image uploader with drag-drop, compression, and preview.
 * Designed for mobile-first use by contractors on job sites.
 *
 * Features:
 * - Drag and drop support
 * - Camera capture on mobile
 * - Client-side WebP compression
 * - Upload progress tracking
 * - Preview with delete capability
 *
 * @see /docs/02-requirements/capabilities.md UPLOAD capabilities
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Camera, ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { compressImage, COMPRESSION_PRESETS, createPreviewUrl } from '@/lib/images/compress';
import { validateFile } from '@/lib/storage/upload';

export interface UploadedImage {
  id: string;
  url: string;
  filename: string;
  storage_path: string;
  width?: number;
  height?: number;
  image_type?: 'before' | 'after' | 'progress' | 'detail';
}

interface PendingUpload {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  error?: string;
  compressed?: Blob;
}

interface ImageUploaderProps {
  /** Project ID for upload path */
  projectId: string;
  /** Already uploaded images */
  images?: UploadedImage[];
  /** Callback when images change */
  onImagesChange: (images: UploadedImage[]) => void;
  /** Max number of images allowed */
  maxImages?: number;
  /** Disable uploads (view-only mode) */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Upload progress callback */
  onUploadProgress?: (payload: {
    fileName: string;
    progress: number;
    status: 'uploading' | 'processing' | 'complete' | 'error';
  }) => void;
}

/**
 * ImageUploader component for project photo uploads.
 *
 * Upload flow:
 * 1. User selects/drops files
 * 2. Files are validated and compressed client-side
 * 3. Request signed upload URL from API
 * 4. Upload compressed file directly to Supabase Storage
 * 5. Image record is created and returned
 */
export function ImageUploader({
  projectId,
  images = [],
  onImagesChange,
  maxImages = 10,
  disabled = false,
  className,
  onUploadProgress,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = maxImages - images.length - pendingUploads.length;

  /**
   * Process and upload files.
   */
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).slice(0, remainingSlots);
      if (fileArray.length === 0) return;

      // Create pending upload entries
      const newPending: PendingUpload[] = fileArray.map((file) => ({
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: createPreviewUrl(file),
        progress: 0,
      }));

      setPendingUploads((prev) => [...prev, ...newPending]);

      // Process each file
      for (const pending of newPending) {
        try {
          // Validate file
          const validationError = validateFile(pending.file, 'project-images');
          if (validationError) {
            setPendingUploads((prev) =>
              prev.map((p) =>
                p.id === pending.id ? { ...p, error: validationError, progress: 100 } : p
              )
            );
            continue;
          }

          // Compress image
          setPendingUploads((prev) =>
            prev.map((p) => (p.id === pending.id ? { ...p, progress: 20 } : p))
          );
          onUploadProgress?.({ fileName: pending.file.name, progress: 20, status: 'uploading' });

          const { blob, filename, width, height } = await compressImage(
            pending.file,
            COMPRESSION_PRESETS.upload
          );

          setPendingUploads((prev) =>
            prev.map((p) =>
              p.id === pending.id ? { ...p, compressed: blob, progress: 40 } : p
            )
          );
          onUploadProgress?.({ fileName: pending.file.name, progress: 40, status: 'uploading' });

          // Request signed upload URL
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
            const errorData = await uploadUrlRes.json();
            throw new Error(errorData.error?.message ?? 'Failed to get upload URL');
          }

          const { image, upload } = await uploadUrlRes.json();

          setPendingUploads((prev) =>
            prev.map((p) => (p.id === pending.id ? { ...p, progress: 60 } : p))
          );
          onUploadProgress?.({ fileName: pending.file.name, progress: 60, status: 'uploading' });

          // Upload to Supabase Storage
          const uploadRes = await fetch(upload.signed_url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'image/webp',
            },
            body: blob,
          });

          if (!uploadRes.ok) {
            throw new Error('Failed to upload to storage');
          }

          setPendingUploads((prev) =>
            prev.map((p) => (p.id === pending.id ? { ...p, progress: 100 } : p))
          );
          onUploadProgress?.({ fileName: pending.file.name, progress: 100, status: 'processing' });

          // Add to uploaded images
          const uploadedImage: UploadedImage = {
            id: image.id,
            url: image.url,
            filename,
            storage_path: image.storage_path,
            width,
            height,
          };

          onImagesChange([...images, uploadedImage]);
          onUploadProgress?.({ fileName: pending.file.name, progress: 100, status: 'complete' });

          // Clean up pending entry
          URL.revokeObjectURL(pending.previewUrl);
          setPendingUploads((prev) => prev.filter((p) => p.id !== pending.id));
        } catch (err) {
          console.error('[ImageUploader] Upload error:', err);
          const errorMessage = err instanceof Error ? err.message : 'Upload failed';

          setPendingUploads((prev) =>
            prev.map((p) =>
              p.id === pending.id ? { ...p, error: errorMessage, progress: 100 } : p
            )
          );
          onUploadProgress?.({ fileName: pending.file.name, progress: 100, status: 'error' });
        }
      }
    },
    [projectId, images, onImagesChange, remainingSlots, onUploadProgress]
  );

  /**
   * Handle file input change.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = ''; // Reset input for re-selection
    }
  };

  /**
   * Handle drag events.
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && remainingSlots > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!disabled && remainingSlots > 0 && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  /**
   * Delete an uploaded image.
   */
  const handleDeleteImage = async (imageId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: imageId }),
      });

      if (!res.ok) {
        throw new Error('Failed to delete image');
      }

      onImagesChange(images.filter((img) => img.id !== imageId));
    } catch (err) {
      console.error('[ImageUploader] Delete error:', err);
    }
  };

  /**
   * Remove a pending upload (failed or user cancelled).
   */
  const handleRemovePending = (pendingId: string) => {
    const pending = pendingUploads.find((p) => p.id === pendingId);
    if (pending) {
      URL.revokeObjectURL(pending.previewUrl);
    }
    setPendingUploads((prev) => prev.filter((p) => p.id !== pendingId));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          isDragging && 'border-primary bg-primary/5',
          disabled || remainingSlots <= 0
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:border-primary/50',
          'min-h-[150px] flex flex-col items-center justify-center gap-3'
        )}
        onClick={() => !disabled && remainingSlots > 0 && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          onChange={handleInputChange}
          disabled={disabled || remainingSlots <= 0}
          className="hidden"
          capture="environment" // Use back camera on mobile
        />

        <div className="flex items-center gap-3 text-muted-foreground">
          <Upload className="h-8 w-8" />
          <Camera className="h-8 w-8" />
        </div>

        <div className="text-center">
          <p className="font-medium">
            {isDragging ? 'Drop images here' : 'Tap to add photos'}
          </p>
          <p className="text-sm text-muted-foreground">
            {remainingSlots > 0
              ? `${remainingSlots} of ${maxImages} slots remaining`
              : 'Maximum images reached'}
          </p>
        </div>

        {/* Mobile-specific buttons */}
        <div className="flex gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || remainingSlots <= 0}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Gallery
          </Button>
        </div>
      </div>

      {/* Image grid */}
      {(images.length > 0 || pendingUploads.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/* Uploaded images */}
          {images.map((image) => (
            <Card key={image.id} className="relative group aspect-square overflow-hidden">
              <img
                src={image.url}
                alt={image.filename}
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleDeleteImage(image.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete image"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </Card>
          ))}

          {/* Pending uploads */}
          {pendingUploads.map((pending) => (
            <Card
              key={pending.id}
              className="relative aspect-square overflow-hidden bg-muted"
            >
              <img
                src={pending.previewUrl}
                alt="Uploading..."
                className={cn(
                  'w-full h-full object-cover',
                  pending.error && 'opacity-50'
                )}
              />

              {/* Progress overlay */}
              {!pending.error && pending.progress < 100 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1" />
                    <span className="text-sm">{pending.progress}%</span>
                  </div>
                </div>
              )}

              {/* Error overlay */}
              {pending.error && (
                <div className="absolute inset-0 bg-red-500/20 flex flex-col items-center justify-center p-2">
                  <AlertCircle className="h-6 w-6 text-red-500 mb-1" />
                  <span className="text-xs text-center text-red-700 line-clamp-2">
                    {pending.error}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePending(pending.id)}
                    className="mt-2 h-7 text-xs"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
