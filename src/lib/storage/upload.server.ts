/**
 * Server-only Supabase Storage utilities.
 * These functions use the server Supabase client and must only be imported in server code.
 *
 * @see /supabase/migrations/002_storage_buckets.sql for bucket configurations
 */

import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
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
    logger.error('[createSignedUploadUrl] Error', { error });
    return { error: error.message };
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
  };
}

/**
 * Download a storage object as a Buffer.
 */
export async function downloadStorageObject(
  bucket: BucketName,
  path: string
): Promise<{ data: Buffer; contentType?: string } | { error: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error) {
    logger.error('[downloadStorageObject] Error', { error });
    return { error: error.message };
  }

  if (!data) {
    return { error: 'No data returned from storage' };
  }

  const arrayBuffer = await data.arrayBuffer();
  return {
    data: Buffer.from(arrayBuffer),
    contentType: data.type || undefined,
  };
}

/**
 * Download a project image, preferring the draft bucket and falling back to public.
 */
export async function downloadProjectImage(
  storagePath: string
): Promise<{ data: Buffer; contentType?: string; bucket: BucketName } | { error: string }> {
  if (!storagePath) {
    return { error: 'Missing storage path' };
  }

  const draftResult = await downloadStorageObject('project-images-draft', storagePath);
  if (!('error' in draftResult)) {
    return { ...draftResult, bucket: 'project-images-draft' };
  }

  const publicResult = await downloadStorageObject('project-images', storagePath);
  if (!('error' in publicResult)) {
    return { ...publicResult, bucket: 'project-images' };
  }

  return { error: draftResult.error };
}

/**
 * Copy draft images to the public bucket (for publishing).
 */
export async function copyDraftImagesToPublic(
  storagePaths: string[]
): Promise<{ copied: number; errors: Array<{ path: string; error: string }> }> {
  const supabase = createAdminClient();
  const errors: Array<{ path: string; error: string }> = [];
  let copied = 0;

  for (const path of storagePaths) {
    if (!path) continue;
    const { data, error } = await supabase.storage.from('project-images-draft').download(path);
    if (error || !data) {
      errors.push({ path, error: error?.message ?? 'Download failed' });
      continue;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(path, buffer, {
        contentType: data.type || undefined,
        upsert: true,
      });

    if (uploadError) {
      errors.push({ path, error: uploadError.message });
      continue;
    }

    copied += 1;
  }

  return { copied, errors };
}

/**
 * Remove images from the public bucket (for unpublish).
 */
export async function removePublicImages(
  storagePaths: string[]
): Promise<{ removed: number; errors: Array<{ path: string; error: string }> }> {
  if (storagePaths.length === 0) {
    return { removed: 0, errors: [] };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from('project-images').remove(storagePaths);

  if (error) {
    return {
      removed: 0,
      errors: storagePaths.map((path) => ({ path, error: error.message })),
    };
  }

  return { removed: data?.length ?? 0, errors: [] };
}
