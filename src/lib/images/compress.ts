/**
 * Client-side image compression utilities.
 * Compresses and converts images to WebP before upload for faster loading.
 *
 * @see /docs/02-requirements/nfr.md for image size targets
 */

export interface CompressionOptions {
  /** Max width in pixels (height scales proportionally) */
  maxWidth: number;
  /** Max height in pixels (width scales proportionally) */
  maxHeight: number;
  /** Quality 0-1 for lossy compression */
  quality: number;
  /** Output format */
  format: 'webp' | 'jpeg';
}

/** Default compression settings per use case */
export const COMPRESSION_PRESETS = {
  /** Thumbnail for grid views: <30KB target */
  thumbnail: {
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.7,
    format: 'webp' as const,
  },
  /** Medium for detail views: <150KB target */
  medium: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8,
    format: 'webp' as const,
  },
  /** Full for lightbox/zoom: <400KB target */
  full: {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.85,
    format: 'webp' as const,
  },
  /** Upload default: balance between quality and size */
  upload: {
    maxWidth: 2000,
    maxHeight: 2000,
    quality: 0.85,
    format: 'webp' as const,
  },
} as const;

/**
 * Compress and resize an image file.
 *
 * @param file - Original image file
 * @param options - Compression options (use COMPRESSION_PRESETS)
 * @returns Compressed Blob with updated filename
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = COMPRESSION_PRESETS.upload
): Promise<{ blob: Blob; filename: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      const aspectRatio = width / height;

      if (width > options.maxWidth) {
        width = options.maxWidth;
        height = Math.round(width / aspectRatio);
      }

      if (height > options.maxHeight) {
        height = options.maxHeight;
        width = Math.round(height * aspectRatio);
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Use high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      const mimeType = options.format === 'webp' ? 'image/webp' : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // Generate new filename with correct extension
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const extension = options.format;
          const filename = `${baseName}.${extension}`;

          resolve({ blob, filename, width, height });
        },
        mimeType,
        options.quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Check if browser supports WebP encoding.
 */
export function supportsWebP(): boolean {
  if (typeof document === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

/**
 * Get image dimensions from a File.
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.readAsDataURL(file);
  });
}

/**
 * Create a preview URL for an image file.
 * Remember to call URL.revokeObjectURL when done!
 */
export function createPreviewUrl(file: File | Blob): string {
  return URL.createObjectURL(file);
}
