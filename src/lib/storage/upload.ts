/**
 * Supabase Storage upload utilities (client-safe).
 * Provides helpers for generating upload URLs and managing file paths.
 *
 * NOTE: Server-only functions are in upload.server.ts
 *
 * @see /supabase/migrations/002_storage_buckets.sql for bucket configurations
 * @see /docs/03-architecture/c4-container.md for storage flow
 */

import { createClient } from '@/lib/supabase/client';

/** Supported storage buckets with their configurations */
export const STORAGE_BUCKETS = {
  'project-images': {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    public: true,
  },
  'profile-images': {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    public: true,
  },
  'voice-recordings': {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav'],
    public: false,
  },
} as const;

export type BucketName = keyof typeof STORAGE_BUCKETS;

/**
 * Generate a unique filename with timestamp to avoid collisions.
 *
 * @param originalName - Original filename from upload
 * @param extension - Optional extension override (e.g., 'webp' after conversion)
 * @returns Unique filename like "photo-abc123def.webp"
 */
export function generateUniqueFilename(originalName: string, extension?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);

  // Extract original extension or use provided one
  const ext = extension ?? originalName.split('.').pop() ?? 'jpg';
  const baseName = originalName
    .split('.')
    .slice(0, -1)
    .join('.')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .toLowerCase()
    .slice(0, 30);

  return `${baseName}-${timestamp}${random}.${ext}`;
}

/**
 * Build a storage path following our folder structure convention.
 *
 * Project images: {contractor_id}/{project_id}/{filename}
 * Profile images: {contractor_id}/{filename}
 * Voice recordings: {contractor_id}/{session_id}/{filename}
 */
export function buildStoragePath(
  bucket: BucketName,
  contractorId: string,
  filename: string,
  subFolder?: string
): string {
  if (subFolder) {
    return `${contractorId}/${subFolder}/${filename}`;
  }
  return `${contractorId}/${filename}`;
}

/**
 * Get the public URL for a file in a public bucket.
 * Uses Supabase's CDN for optimal delivery.
 *
 * @param bucket - Storage bucket name
 * @param path - Full path within the bucket
 * @returns Public URL string
 */
export function getPublicUrl(bucket: BucketName, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Validate a file before upload.
 *
 * @param file - File to validate
 * @param bucket - Target bucket (determines size/type limits)
 * @returns Error message or null if valid
 */
export function validateFile(file: File, bucket: BucketName): string | null {
  const config = STORAGE_BUCKETS[bucket];

  if (file.size > config.maxSize) {
    const maxMB = config.maxSize / (1024 * 1024);
    return `File size exceeds ${maxMB}MB limit`;
  }

  // Check if file type is allowed
  const allowedTypes = config.allowedTypes as readonly string[];
  if (!allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not allowed. Accepted: ${config.allowedTypes.join(', ')}`;
  }

  return null;
}

/**
 * Upload a file to Supabase Storage from the client.
 *
 * @param bucket - Target bucket
 * @param path - Full path including filename
 * @param file - File or Blob to upload
 * @returns Object with path or error
 */
export async function uploadFile(
  bucket: BucketName,
  path: string,
  file: File | Blob
): Promise<{ path: string } | { error: string }> {
  const supabase = createClient();

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    console.error('[uploadFile] Error:', error);
    return { error: error.message };
  }

  return { path: data.path };
}

/**
 * Delete a file from Supabase Storage from the client.
 *
 * @param bucket - Target bucket
 * @param path - Full path to delete
 */
export async function deleteFile(
  bucket: BucketName,
  path: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error('[deleteFile] Error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
