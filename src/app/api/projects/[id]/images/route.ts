/**
 * Project Images API - Upload and manage project images.
 *
 * GET    /api/projects/[id]/images - List project images
 * POST   /api/projects/[id]/images - Get signed upload URL + create image record
 * PATCH  /api/projects/[id]/images - Reorder images and update labels
 * DELETE /api/projects/[id]/images - Delete an image
 *
 * @see /docs/03-architecture/c4-container.md for upload flow
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuthUnified, isAuthError, getAuthClient } from '@/lib/api/auth';
import { apiError, apiSuccess, apiCreated, handleApiError } from '@/lib/api/errors';
import {
  buildStoragePath,
  generateUniqueFilename,
  getPublicUrl,
} from '@/lib/storage/upload';
import { createSignedUploadUrl } from '@/lib/storage/upload.server';
import type { ProjectImage } from '@/types/database';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Schema for requesting an upload URL.
 */
const requestUploadSchema = z.object({
  /** Original filename (used to generate unique name) */
  filename: z.string().min(1).max(255),
  /** MIME type for validation */
  content_type: z.string().regex(/^image\/(jpeg|png|webp|heic)$/),
  /** Image type classification */
  image_type: z.enum(['before', 'after', 'progress', 'detail']).optional(),
  /** Display order in gallery */
  display_order: z.number().int().min(0).optional(),
  /** Image dimensions (optional, for responsive handling) */
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

/**
 * Schema for deleting an image.
 */
const deleteImageSchema = z.object({
  image_id: z.string().uuid(),
});

/**
 * Schema for reordering images.
 */
const updateImagesSchema = z.object({
  /** Array of image IDs in the new order */
  image_ids: z.array(z.string().uuid()).min(1).optional(),
  /** Array of label updates */
  labels: z.array(
    z.object({
      image_id: z.string().uuid(),
      image_type: z.enum(['before', 'after', 'progress', 'detail']).nullable().optional(),
      alt_text: z.string().nullable().optional(),
    })
  ).min(1).optional(),
}).refine((data) => !!data.image_ids || !!data.labels, {
  message: 'image_ids or labels required',
});

/**
 * GET /api/projects/[id]/images
 *
 * List all images for a project, ordered by display_order.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthUnified();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { id: projectId } = await params;
    const { contractor } = auth;
    const supabase = await getAuthClient(auth);

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('contractor_id', contractor.id)
      .single();

    if (projectError || !project) {
      return apiError('NOT_FOUND', 'Project not found');
    }

    // Get images
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: images, error } = await (supabase as any)
      .from('project_images')
      .select('*')
      .eq('project_id', projectId)
      .order('display_order', { ascending: true });

    if (error) {
      return handleApiError(error);
    }

    // Type assertion for images
    type ImageData = ProjectImage & { storage_path: string };
    const imagesList = (images ?? []) as ImageData[];

    // Add public URLs to images
    const imagesWithUrls = imagesList.map((img) => ({
      ...img,
      url: getPublicUrl('project-images', img.storage_path),
    }));

    return apiSuccess({ images: imagesWithUrls });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/projects/[id]/images
 *
 * Request a signed upload URL and create a placeholder image record.
 *
 * Flow:
 * 1. Client calls this endpoint with file metadata
 * 2. Server returns signed upload URL + image record ID
 * 3. Client uploads file directly to Supabase Storage
 * 4. Client confirms upload by updating image record (or it gets cleaned up)
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
    const parsed = requestUploadSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid upload request', {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { filename, content_type, image_type, display_order, width, height } = parsed.data;
    const supabase = await getAuthClient(auth);

    // Verify project ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error: projectError } = await (supabase as any)
      .from('projects')
      .select('id, hero_image_id')
      .eq('id', projectId)
      .eq('contractor_id', contractor.id)
      .single();

    const typedProject = project as { id: string; hero_image_id: string | null } | null;

    if (projectError || !typedProject) {
      return apiError('NOT_FOUND', 'Project not found');
    }

    // Generate unique filename and storage path
    const extension = content_type === 'image/heic' ? 'jpg' : content_type.split('/')[1];
    const uniqueFilename = generateUniqueFilename(filename, extension);
    const storagePath = buildStoragePath('project-images', contractor.id, uniqueFilename, projectId);

    // Get next display order if not provided
    let order = display_order;
    if (order === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase as any)
        .from('project_images')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      order = count ?? 0;
    }

    // Create image record (will be updated after successful upload)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: image, error: insertError } = await (supabase as any)
      .from('project_images')
      .insert({
        project_id: projectId,
        storage_path: storagePath,
        image_type: image_type ?? null,
        display_order: order,
        width: width ?? null,
        height: height ?? null,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('[POST /api/projects/[id]/images] Insert error:', insertError);
      return handleApiError(insertError);
    }

    // Generate signed upload URL
    const uploadResult = await createSignedUploadUrl('project-images', storagePath);

    if ('error' in uploadResult) {
      // Rollback image record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('project_images').delete().eq('id', image.id);
      return apiError('STORAGE_ERROR', uploadResult.error);
    }

    // Auto-set hero image if missing
    if (typedProject && !typedProject.hero_image_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('projects')
        .update({ hero_image_id: image.id })
        .eq('id', projectId)
        .eq('contractor_id', contractor.id);
    }

    return apiCreated({
      image: {
        ...image,
        url: getPublicUrl('project-images', storagePath),
      } as ProjectImage & { url: string },
      upload: {
        signed_url: uploadResult.signedUrl,
        token: uploadResult.token,
        path: storagePath,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/projects/[id]/images
 *
 * Delete an image from the project.
 * Removes both the database record and the storage file.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthUnified();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { id: projectId } = await params;
    const { contractor } = auth;

    // Parse body
    const body = await request.json();
    const parsed = deleteImageSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid request', {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { image_id } = parsed.data;
    const supabase = await getAuthClient(auth);

    // Verify project ownership and get image
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: image, error: fetchError } = await (supabase as any)
      .from('project_images')
      .select(`
        *,
        project:projects!inner(contractor_id)
      `)
      .eq('id', image_id)
      .eq('project_id', projectId)
      .single();

    // Type assertion for image with project
    type ImageWithProject = {
      id: string;
      storage_path: string;
      project: { contractor_id: string };
    };
    const imageData = image as ImageWithProject | null;

    if (fetchError || !imageData) {
      return apiError('NOT_FOUND', 'Image not found');
    }

    // Verify ownership through project
    if (imageData.project.contractor_id !== contractor.id) {
      return apiError('FORBIDDEN', 'Access denied');
    }

    // Delete from database (RLS ensures ownership)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('project_images')
      .delete()
      .eq('id', image_id);

    if (deleteError) {
      return handleApiError(deleteError);
    }

    // Delete from storage (fire and forget)
    supabase.storage
      .from('project-images')
      .remove([imageData.storage_path])
      .catch((err: Error) => console.error('[Storage delete failed]', err));

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/projects/[id]/images
 *
 * Reorder images by updating their display_order and/or update labels.
 * Accepts image_ids for ordering and labels for before/after + alt text.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthUnified();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { id: projectId } = await params;
    const { contractor } = auth;

    // Parse body
    const body = await request.json();
    const parsed = updateImagesSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid request', {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { image_ids, labels } = parsed.data;
    const supabase = await getAuthClient(auth);

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('contractor_id', contractor.id)
      .single();

    if (projectError || !project) {
      return apiError('NOT_FOUND', 'Project not found');
    }

    const idsToVerify = new Set<string>();
    (image_ids || []).forEach((id) => idsToVerify.add(id));
    (labels || []).forEach((label) => idsToVerify.add(label.image_id));

    // Verify all image IDs belong to this project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingImages, error: fetchError } = await (supabase as any)
      .from('project_images')
      .select('id')
      .eq('project_id', projectId)
      .in('id', Array.from(idsToVerify));

    if (fetchError) {
      return handleApiError(fetchError);
    }

    const existingIds = new Set((existingImages || []).map((img: { id: string }) => img.id));
    const invalidIds = Array.from(idsToVerify).filter((id) => !existingIds.has(id));

    if (invalidIds.length > 0) {
      return apiError('VALIDATION_ERROR', 'Some image IDs do not belong to this project', {
        invalidIds,
      });
    }

    // Update display_order for each image
    let reorderedCount = 0;
    let labelsUpdatedCount = 0;

    if (image_ids && image_ids.length > 0) {
      const reorderPromises = image_ids.map((imageId, index) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('project_images')
          .update({ display_order: index })
          .eq('id', imageId)
      );

      const reorderResults = await Promise.all(reorderPromises);
      const reorderErrors = reorderResults.filter((r) => r.error);
      if (reorderErrors.length > 0) {
        console.error('[PATCH /api/projects/[id]/images] Reorder errors:', reorderErrors);
        return apiError('INTERNAL_ERROR', 'Failed to reorder some images');
      }
      reorderedCount = image_ids.length;
    }

    if (labels && labels.length > 0) {
      const labelPromises = labels.map((label) => {
        const updatePayload: Record<string, unknown> = {};
        if (Object.prototype.hasOwnProperty.call(label, 'image_type')) {
          updatePayload.image_type = label.image_type ?? null;
        }
        if (Object.prototype.hasOwnProperty.call(label, 'alt_text')) {
          updatePayload.alt_text = label.alt_text ?? null;
        }
        if (Object.keys(updatePayload).length === 0) {
          return Promise.resolve({ error: null });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (supabase as any)
          .from('project_images')
          .update(updatePayload)
          .eq('id', label.image_id);
      });

      const labelResults = await Promise.all(labelPromises);
      const labelErrors = labelResults.filter((r) => r.error);
      if (labelErrors.length > 0) {
        console.error('[PATCH /api/projects/[id]/images] Label update errors:', labelErrors);
        return apiError('INTERNAL_ERROR', 'Failed to update some image labels');
      }
      labelsUpdatedCount = labels.length;
    }

    return apiSuccess({
      reordered: reorderedCount > 0,
      reorderedCount,
      labelsUpdated: labelsUpdatedCount > 0,
      labelsUpdatedCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
