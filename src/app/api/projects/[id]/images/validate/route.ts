/**
 * Project Images Validation API - Check and clean up orphaned images.
 *
 * GET    /api/projects/[id]/images/validate - Check which images exist in storage
 * DELETE /api/projects/[id]/images/validate - Delete orphaned database records
 *
 * Orphaned records occur when:
 * - Files are deleted from storage without updating the database
 * - Upload fails after database record is created
 * - Storage bucket is cleared
 *
 * @see /src/lib/storage/validate.ts - Validation utilities
 * @see /src/components/ui/safe-image.tsx - Client-side error handling
 */

import { NextRequest } from 'next/server';
import { requireAuthUnified, isAuthError, getAuthClient } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import { findOrphanedImageIds, validateStorageImages } from '@/lib/storage/validate';
import type { ProjectImage } from '@/types/database';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/[id]/images/validate
 *
 * Check which project images exist in storage and which are orphaned.
 *
 * @returns Object with valid and orphaned image IDs
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

    // Get all images for this project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: images, error } = await (supabase as any)
      .from('project_images')
      .select('id, storage_path')
      .eq('project_id', projectId);

    if (error) {
      throw error;
    }

    const imageRecords = (images || []) as Pick<ProjectImage, 'id' | 'storage_path'>[];

    if (imageRecords.length === 0) {
      return apiSuccess({
        total: 0,
        valid: [],
        orphaned: [],
      });
    }

    // Validate storage paths
    const storagePaths = imageRecords.map((img) => img.storage_path);
    const result = await validateStorageImages('project-images', storagePaths);

    // Map back to image IDs
    const pathToId = new Map(imageRecords.map((img) => [img.storage_path, img.id]));
    const validIds = result.valid.map((path) => pathToId.get(path)!).filter(Boolean);
    const orphanedIds = result.invalid.map((path) => pathToId.get(path)!).filter(Boolean);

    return apiSuccess({
      total: imageRecords.length,
      valid: validIds,
      orphaned: orphanedIds,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/projects/[id]/images/validate
 *
 * Delete orphaned database records (images that don't exist in storage).
 *
 * This is a cleanup operation - it only removes database records,
 * not the actual storage files (which are already missing).
 *
 * @returns Object with count of deleted records
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Get all images for this project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: images, error } = await (supabase as any)
      .from('project_images')
      .select('id, storage_path')
      .eq('project_id', projectId);

    if (error) {
      throw error;
    }

    const imageRecords = (images || []) as Pick<ProjectImage, 'id' | 'storage_path'>[];

    if (imageRecords.length === 0) {
      return apiSuccess({ deleted: 0 });
    }

    // Find orphaned image IDs
    const orphanedIds = await findOrphanedImageIds(imageRecords);

    if (orphanedIds.length === 0) {
      return apiSuccess({ deleted: 0 });
    }

    // Delete orphaned records
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('project_images')
      .delete()
      .in('id', orphanedIds)
      .eq('project_id', projectId); // Double-check project ownership

    if (deleteError) {
      throw deleteError;
    }

    return apiSuccess({
      deleted: orphanedIds.length,
      deletedIds: orphanedIds,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
