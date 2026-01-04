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
} from '@/lib/storage/upload';
import { createSignedUploadUrl } from '@/lib/storage/upload.server';
import { resolveProjectImageUrl } from '@/lib/storage/project-images';
import {
  countProjectImages,
  deleteProjectImage,
  insertProjectImageFull,
  selectProjectByIdForContractor,
  selectProjectImageWithProject,
  selectProjectImages,
  updateProjectHeroImage,
  updateProjectImageLabels,
  updateProjectImageOrder,
  verifyProjectImageIds,
} from '@/lib/supabase/typed-queries';
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
    const { data: project, error: projectError } = await selectProjectByIdForContractor(
      supabase,
      projectId,
      contractor.id
    );

    if (projectError || !project) {
      return apiError('NOT_FOUND', 'Project not found');
    }

    // Get images
    const { data: images, error } = await selectProjectImages(supabase, projectId);

    if (error) {
      return handleApiError(error);
    }

    const imagesList = images ?? [];

    // Add URLs to images
    const isPublished = project.status === 'published';
    const imagesWithUrls = imagesList.map((img) => ({
      ...img,
      url: resolveProjectImageUrl({
        projectId,
        imageId: img.id,
        storagePath: img.storage_path,
        isPublished,
      }),
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
    const { data: typedProject, error: projectError } = await selectProjectByIdForContractor(
      supabase,
      projectId,
      contractor.id
    );

    if (projectError || !typedProject) {
      return apiError('NOT_FOUND', 'Project not found');
    }

    // Generate unique filename and storage path
    const extension = content_type === 'image/heic' ? 'jpg' : content_type.split('/')[1];
    const uniqueFilename = generateUniqueFilename(filename, extension);
    const storagePath = buildStoragePath('project-images-draft', contractor.id, uniqueFilename, projectId);

    // Get next display order if not provided
    let order = display_order;
    if (order === undefined) {
      const { count } = await countProjectImages(supabase, projectId);
      order = count;
    }

    // Create image record (will be updated after successful upload)
    const { data: image, error: insertError } = await insertProjectImageFull(supabase, {
      project_id: projectId,
      storage_path: storagePath,
      image_type: image_type ?? null,
      display_order: order,
      width: width ?? null,
      height: height ?? null,
    });

    if (insertError || !image) {
      console.error('[POST /api/projects/[id]/images] Insert error:', insertError);
      return handleApiError(insertError);
    }

    // Generate signed upload URL (draft bucket)
    const uploadResult = await createSignedUploadUrl('project-images-draft', storagePath);

    if ('error' in uploadResult) {
      // Rollback image record
      await deleteProjectImage(supabase, image.id);
      return apiError('STORAGE_ERROR', uploadResult.error);
    }

    // Auto-set hero image if missing
    if (typedProject && !typedProject.hero_image_id) {
      await updateProjectHeroImage(supabase, projectId, contractor.id, image.id);
    }

    const isPublished = typedProject?.status === 'published';

    return apiCreated({
      image: {
        ...image,
        url: resolveProjectImageUrl({
          projectId,
          imageId: image.id,
          storagePath,
          isPublished,
        }),
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
    const { data: imageData, error: fetchError } = await selectProjectImageWithProject(
      supabase,
      image_id,
      projectId
    );

    if (fetchError || !imageData) {
      return apiError('NOT_FOUND', 'Image not found');
    }

    // Verify ownership through project
    if (imageData.project.contractor_id !== contractor.id) {
      return apiError('FORBIDDEN', 'Access denied');
    }

    // Delete from database (RLS ensures ownership)
    const { error: deleteError } = await deleteProjectImage(supabase, image_id);

    if (deleteError) {
      return handleApiError(deleteError);
    }

    // Delete from storage (fire and forget)
    supabase.storage
      .from('project-images-draft')
      .remove([imageData.storage_path])
      .catch((err: Error) => console.error('[Draft storage delete failed]', err));
    supabase.storage
      .from('project-images')
      .remove([imageData.storage_path])
      .catch((err: Error) => console.error('[Public storage delete failed]', err));

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
    const { data: project, error: projectError } = await selectProjectByIdForContractor(
      supabase,
      projectId,
      contractor.id
    );

    if (projectError || !project) {
      return apiError('NOT_FOUND', 'Project not found');
    }

    const idsToVerify = new Set<string>();
    (image_ids || []).forEach((id) => idsToVerify.add(id));
    (labels || []).forEach((label) => idsToVerify.add(label.image_id));

    // Verify all image IDs belong to this project
    const { data: existingImages, error: fetchError } = await verifyProjectImageIds(
      supabase,
      projectId,
      Array.from(idsToVerify)
    );

    if (fetchError) {
      return handleApiError(fetchError);
    }

    const existingIds = new Set(existingImages.map((img) => img.id));
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
        updateProjectImageOrder(supabase, imageId, index)
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
        const updatePayload: { image_type?: string | null; alt_text?: string | null } = {};
        if (Object.prototype.hasOwnProperty.call(label, 'image_type')) {
          updatePayload.image_type = label.image_type ?? null;
        }
        if (Object.prototype.hasOwnProperty.call(label, 'alt_text')) {
          updatePayload.alt_text = label.alt_text ?? null;
        }
        if (Object.keys(updatePayload).length === 0) {
          return Promise.resolve({ error: null });
        }
        return updateProjectImageLabels(supabase, label.image_id, updatePayload);
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
