/**
 * Server-only Supabase Storage utilities.
 * These functions use the server Supabase client and must only be imported in server code.
 *
 * @see /supabase/migrations/002_storage_buckets.sql for bucket configurations
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { BucketName } from './upload';

/**
 * Create a signed upload URL for secure client-side uploads.
 * Use this when you need to upload without exposing the service key.
 *
 * Server-side only.
 *
 * @param bucket - Target bucket
 * @param path - Full path for the upload
 * @param expiresIn - URL expiration in seconds (default: 60)
 */
export async function createSignedUploadUrl(
  bucket: BucketName,
  path: string
): Promise<{ signedUrl: string; token: string } | { error: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);

  if (error) {
    console.error('[createSignedUploadUrl] Error:', error);
    return { error: error.message };
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
  };
}

/**
 * Create a signed URL for reading from a private bucket.
 * Server-side only.
 *
 * @param bucket - Target bucket
 * @param path - Full path to the file
 * @param expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
 */
export async function createSignedReadUrl(
  bucket: BucketName,
  path: string,
  expiresIn = 3600
): Promise<{ signedUrl: string } | { error: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('[createSignedReadUrl] Error:', error);
    return { error: error.message };
  }

  return { signedUrl: data.signedUrl };
}
