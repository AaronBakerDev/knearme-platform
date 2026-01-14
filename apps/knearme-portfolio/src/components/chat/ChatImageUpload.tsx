'use client';

/**
 * Inline image uploader for chat interface.
 *
 * Wraps the existing ImageUploader component in a chat-friendly format.
 * Displayed when the AI prompts for photos.
 */

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { ImageUploader, type UploadedImage } from '@/components/upload/ImageUploader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatImageUploadProps {
  /** Project ID for upload path */
  projectId: string;
  /** Called when images are uploaded */
  onImagesUploaded: (images: UploadedImage[]) => void;
  /** Whether upload is disabled */
  disabled?: boolean;
  /** Optional additional className */
  className?: string;
}

/**
 * Image upload component styled for chat interface.
 */
export function ChatImageUpload({
  projectId,
  onImagesUploaded,
  disabled = false,
  className,
}: ChatImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Handle images change from uploader.
   */
  const handleImagesChange = (newImages: UploadedImage[]) => {
    setImages(newImages);
  };

  /**
   * Handle continue button click.
   */
  const handleContinue = () => {
    if (images.length > 0) {
      onImagesUploaded(images);
    }
  };

  return (
    <div
      className={cn(
        'bg-muted/50 rounded-2xl p-4 max-w-[90%]',
        className
      )}
    >
      {!isExpanded ? (
        // Collapsed state - show button to expand
        <Button
          variant="outline"
          onClick={() => setIsExpanded(true)}
          disabled={disabled}
          className="w-full"
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Add Project Photos
        </Button>
      ) : (
        // Expanded state - show uploader
        <div className="space-y-4">
          <ImageUploader
            projectId={projectId}
            images={images}
            onImagesChange={handleImagesChange}
            maxImages={10}
            disabled={disabled}
          />

          {/* Continue button when images are uploaded */}
          {images.length > 0 && (
            <Button
              onClick={handleContinue}
              disabled={disabled}
              className="w-full"
            >
              Continue with {images.length} photo{images.length !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
