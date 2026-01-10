/**
 * Upload images from URLs - designed for MCP/ChatGPT integration.
 *
 * POST /api/projects/[id]/images/from-url
 *
 * This endpoint allows uploading images by providing URLs. The server
 * downloads the images and stores them in Supabase Storage. This is
 * necessary because ChatGPT cannot perform the two-step signed URL
 * upload flow that the standard images endpoint uses.
 *
 * @see /src/lib/mcp/tools.ts - add_project_media tool
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuthUnified, isAuthError, getAuthClient } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import { buildStoragePath, generateUniqueFilename } from '@/lib/storage/upload';
import { copyDraftImagesToPublic } from '@/lib/storage/upload.server';
import { resolveProjectImageUrl } from '@/lib/storage/project-images';
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import type { Project, ProjectImage, ProjectImageInsert, ProjectUpdate } from '@/types/database';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Schema for URL-based image upload.
 */
const uploadFromUrlSchema = z.object({
  images: z.array(z.object({
    /** URL of the image to download */
    url: z.string().url(),
    /** Filename to use (optional, will be derived from URL if not provided) */
    filename: z.string().optional(),
    /** Image classification */
    image_type: z.enum(['before', 'after', 'progress', 'detail']).optional(),
    /** Alt text for accessibility */
    alt_text: z.string().optional(),
  })).min(1).max(10),
});

/**
 * Detect content type from response headers or URL.
 */
function detectContentType(response: Response, url: string): string {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.startsWith('image/')) {
    const parts = contentType.split(';');
    return parts[0] ?? 'image/jpeg'; // Remove charset etc.
  }

  // Fallback to URL extension
  const urlLower = url.toLowerCase();
  if (urlLower.includes('.png')) return 'image/png';
  if (urlLower.includes('.webp')) return 'image/webp';
  if (urlLower.includes('.gif')) return 'image/gif';
  return 'image/jpeg'; // Default
}

/**
 * Extract filename from URL or generate one.
 */
function extractFilename(url: string, providedName?: string): string {
  if (providedName) return providedName;

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    if (lastSegment && /\.(jpg|jpeg|png|webp|gif)$/i.test(lastSegment)) {
      return lastSegment;
    }
  } catch {
    // Ignore URL parsing errors
  }

  return `image-${Date.now()}.jpg`;
}

/**
 * POST /api/projects/[id]/images/from-url
 *
 * Download images from provided URLs and store them in Supabase Storage.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthUnified();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { id: projectId } = await params;
    const { contractor } = auth;

    // Parse and validate body
    const body = await request.json();
    const parsed = uploadFromUrlSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid request', {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { images } = parsed.data;
    const supabase = await getAuthClient(auth);
    const adminClient = createAdminClient();

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, hero_image_id, status')
      .eq('id', projectId)
      .eq('contractor_id', contractor.id)
      .single();

    const typedProject = project as Pick<Project, 'id' | 'hero_image_id' | 'status'> | null;

    if (projectError || !typedProject) {
      return apiError('NOT_FOUND', 'Project not found');
    }

    // Get current image count for display_order
    const { count: existingCount } = await supabase
      .from('project_images')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    let currentOrder = existingCount ?? 0;
    const uploadedImages: Array<{
      id: string;
      url: string;
      image_type: string | null;
      display_order: number;
    }> = [];
    const errors: Array<{ url: string; error: string }> = [];

    const isPublished = typedProject?.status === 'published';

    // Process each image
    for (const img of images) {
      try {
        // Download the image
        const response = await fetch(img.url, {
          headers: {
            'User-Agent': 'KnearMe-Portfolio/1.0',
          },
        });

        if (!response.ok) {
          errors.push({ url: img.url, error: `HTTP ${response.status}` });
          continue;
        }

        const contentType = detectContentType(response, img.url);
        if (!contentType.startsWith('image/')) {
          errors.push({ url: img.url, error: 'Not an image' });
          continue;
        }

        // Get image data as buffer
        const imageBuffer = await response.arrayBuffer();
        const imageBlob = new Blob([imageBuffer], { type: contentType });

        // Check file size (max 10MB)
        if (imageBlob.size > 10 * 1024 * 1024) {
          errors.push({ url: img.url, error: 'Image too large (max 10MB)' });
          continue;
        }

        // Generate storage path
        const filename = extractFilename(img.url, img.filename);
        const extension = contentType.split('/')[1] || 'jpg';
        const uniqueFilename = generateUniqueFilename(filename, extension);
        const storagePath = buildStoragePath('project-images-draft', contractor.id, uniqueFilename, projectId);

        // Upload to Supabase Storage using admin client (bypasses RLS)
        const { error: uploadError } = await adminClient.storage
          .from('project-images-draft')
          .upload(storagePath, imageBlob, {
            contentType,
            upsert: false,
          });

        if (uploadError) {
          logger.error('[from-url] Storage upload error', { error: uploadError, url: img.url });
          errors.push({ url: img.url, error: uploadError.message });
          continue;
        }

        // Create database record
        const insertPayload: ProjectImageInsert = {
          project_id: projectId,
          storage_path: storagePath,
          image_type: img.image_type ?? null,
          alt_text: img.alt_text ?? null,
          display_order: currentOrder++,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: imageRecord, error: insertError } = await (supabase as any)
          .from('project_images')
          .insert(insertPayload)
          .select('id')
          .single();

        if (insertError) {
          logger.error('[from-url] DB insert error', { error: insertError, url: img.url });
          // Try to clean up the uploaded file
          await adminClient.storage.from('project-images-draft').remove([storagePath]);
          errors.push({ url: img.url, error: insertError.message });
          continue;
        }

        const imageRecordData = imageRecord as Pick<ProjectImage, 'id'>;
        if (isPublished) {
          const { errors } = await copyDraftImagesToPublic([storagePath]);
          if (errors.length > 0) {
            logger.warn('[from-url] Failed to copy to public', { errors });
          }
        }

        uploadedImages.push({
          id: imageRecordData.id,
          url: resolveProjectImageUrl({
            projectId,
            imageId: imageRecordData.id,
            storagePath,
            isPublished,
          }),
          image_type: img.image_type ?? null,
          display_order: currentOrder - 1,
        });

        // Set hero image if this is the first image and no hero is set
        if (!typedProject.hero_image_id && uploadedImages.length === 1) {
          const heroUpdate: ProjectUpdate = { hero_image_id: imageRecordData.id };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('projects')
            .update(heroUpdate)
            .eq('id', projectId)
            .eq('contractor_id', contractor.id);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error('[from-url] Error processing image', { error: err, url: img.url });
        errors.push({ url: img.url, error: message });
      }
    }

    return apiSuccess({
      uploaded: uploadedImages.length,
      failed: errors.length,
      images: uploadedImages,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
