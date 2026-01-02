/**
 * Storage validation utilities for checking image existence.
 *
 * Used to detect orphaned database records that reference
 * non-existent files in Supabase Storage.
 *
 * @see /src/components/ui/safe-image.tsx - Client-side error handling
 * @see /src/app/api/projects/[id]/images/validate/route.ts - Cleanup endpoint
 */

import { STORAGE_BUCKETS, type BucketName } from './upload';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Result of validating storage images.
 */
export interface ValidationResult {
  /** Storage paths that exist and are accessible */
  valid: string[];
  /** Storage paths that don't exist or are inaccessible */
  invalid: string[];
  /** Total paths checked */
  total: number;
}

/**
 * Build the full public URL for a storage path.
 *
 * @param bucket - Storage bucket name
 * @param storagePath - Path within the bucket (e.g., "contractor-id/project-id/filename.webp")
 * @returns Full public URL
 */
export function buildPublicUrl(bucket: BucketName, storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }

  // Ensure bucket is public
  const bucketConfig = STORAGE_BUCKETS[bucket];
  if (!bucketConfig.public) {
    throw new Error(`Bucket "${bucket}" is not public`);
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
}

/**
 * Check if a single image exists in storage using a HEAD request.
 *
 * Uses HEAD request to minimize bandwidth - only checks existence,
 * doesn't download the full image.
 *
 * @param bucket - Storage bucket name
 * @param storagePath - Path within the bucket
 * @returns True if image exists and is accessible
 */
export async function checkImageExists(
  bucket: BucketName,
  storagePath: string
): Promise<boolean> {
  try {
    const bucketConfig = STORAGE_BUCKETS[bucket];
    if (bucketConfig.public) {
      const url = buildPublicUrl(bucket, storagePath);

      const response = await fetch(url, {
        method: 'HEAD',
        // Don't follow redirects - we just want to check existence
        redirect: 'manual',
      });

      // 200 = exists, anything else = doesn't exist or error
      return response.status === 200;
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(bucket).download(storagePath);
    return !error && Boolean(data);
  } catch (error) {
    // Network error or other issue - treat as not existing
    console.error(`Error checking image existence: ${storagePath}`, error);
    return false;
  }
}

/**
 * Validate multiple storage paths in parallel.
 *
 * Checks each path and returns categorized results.
 * Uses parallel requests with concurrency limit to avoid overwhelming the server.
 *
 * @param bucket - Storage bucket name
 * @param storagePaths - Array of paths to check
 * @param concurrency - Maximum concurrent requests (default: 5)
 * @returns Validation result with valid and invalid paths
 *
 * @example
 * ```typescript
 * const result = await validateStorageImages('project-images', [
 *   'abc/123/image1.webp',
 *   'abc/123/image2.webp',
 *   'abc/123/missing.webp',
 * ]);
 * // result.valid = ['abc/123/image1.webp', 'abc/123/image2.webp']
 * // result.invalid = ['abc/123/missing.webp']
 * ```
 */
export async function validateStorageImages(
  bucket: BucketName,
  storagePaths: string[],
  concurrency = 5
): Promise<ValidationResult> {
  const valid: string[] = [];
  const invalid: string[] = [];

  // Process in batches for controlled concurrency
  for (let i = 0; i < storagePaths.length; i += concurrency) {
    const batch = storagePaths.slice(i, i + concurrency);

    const results = await Promise.all(
      batch.map(async (path) => {
        const exists = await checkImageExists(bucket, path);
        return { path, exists };
      })
    );

    for (const { path, exists } of results) {
      if (exists) {
        valid.push(path);
      } else {
        invalid.push(path);
      }
    }
  }

  return {
    valid,
    invalid,
    total: storagePaths.length,
  };
}

/**
 * Validate project images and return orphaned image IDs.
 *
 * Convenience function that takes project_images records
 * and returns IDs of records with missing storage files.
 *
 * @param images - Array of image records with id and storage_path
 * @returns Array of image IDs that have missing storage files
 */
export async function findOrphanedImageIds(
  images: { id: string; storage_path: string }[]
): Promise<string[]> {
  if (images.length === 0) return [];

  const storagePaths = images.map((img) => img.storage_path);
  const result = await validateStorageImages('project-images-draft', storagePaths);

  // Find IDs of images with invalid (missing) storage paths
  const invalidPathSet = new Set(result.invalid);
  return images
    .filter((img) => invalidPathSet.has(img.storage_path))
    .map((img) => img.id);
}
