'use client';

/**
 * Floating photo panel for the chat wizard.
 *
 * Shows a floating album icon that expands to display uploaded photos
 * and allows adding more photos at any point in the conversation.
 *
 * @see /src/components/chat/ChatWizard.tsx
 */

import { useState, useRef } from 'react';
import { Images, X, Plus, ChevronDown, Upload, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UploadedImage } from '@/components/upload/ImageUploader';
import { cn } from '@/lib/utils';

interface ChatPhotoPanelProps {
  /** Project ID for image uploads */
  projectId: string;
  /** Currently uploaded images */
  images: UploadedImage[];
  /** Callback when images change */
  onImagesChange: (images: UploadedImage[]) => void;
  /** Whether uploads are disabled */
  disabled?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * Floating photo panel component.
 *
 * States:
 * - Collapsed: Shows just the album icon with badge count
 * - Expanded: Shows thumbnail grid + simple upload button
 */
export function ChatPhotoPanel({
  projectId,
  images,
  onImagesChange,
  disabled = false,
  className,
}: ChatPhotoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageCount = images.length;

  /**
   * Handle file selection and upload.
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const newImages: UploadedImage[] = [];

      for (const file of Array.from(files)) {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('project_id', projectId);

        // Upload to API
        const response = await fetch('/api/projects/images', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          console.error('Upload failed:', await response.text());
          continue;
        }

        const data = await response.json();
        if (data.image) {
          newImages.push(data.image);
        }
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
      }
    } catch (err) {
      console.error('[ChatPhotoPanel] Upload error:', err);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Remove an image.
   */
  const handleRemoveImage = (imageId: string) => {
    onImagesChange(images.filter((img) => img.id !== imageId));
  };

  return (
    <div className={cn('absolute bottom-20 right-4 z-10', className)}>
      {/* Expanded Panel */}
      {isExpanded && (
        <div className="mb-2 w-72 bg-card border rounded-lg shadow-lg overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
            <span className="text-sm font-medium">
              Project Photos {imageCount > 0 && `(${imageCount})`}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-3">
            {imageCount > 0 && (
              /* Thumbnail Grid */
              <div className="grid grid-cols-3 gap-2 mb-3">
                {images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="relative aspect-square rounded-md overflow-hidden bg-muted group"
                  >
                    <img
                      src={img.url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveImage(img.id)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {img.image_type && (
                      <span className="absolute bottom-0 left-0 right-0 text-[10px] bg-black/60 text-white px-1 py-0.5 text-center truncate">
                        {img.image_type}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload Area */}
            <div className="space-y-2">
              {imageCount === 0 && (
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Add photos of your project anytime
                </p>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || isUploading}
              />

              {/* Upload buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading || imageCount >= 10}
                >
                  {isUploading ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Photos
                    </>
                  )}
                </Button>
              </div>

              {imageCount >= 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  Maximum 10 photos
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <Button
        variant={imageCount > 0 ? 'default' : 'outline'}
        size="icon"
        className={cn(
          'h-12 w-12 rounded-full shadow-lg transition-all hover:scale-105',
          imageCount > 0 && 'bg-primary hover:bg-primary/90'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
      >
        <div className="relative">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <>
              <Images className="h-5 w-5" />
              {imageCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                  {imageCount}
                </span>
              )}
            </>
          )}
        </div>
      </Button>
    </div>
  );
}
