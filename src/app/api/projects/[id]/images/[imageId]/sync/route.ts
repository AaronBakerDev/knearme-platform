import { NextRequest } from 'next/server';
import { requireAuthUnified, isAuthError, getAuthClient } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import { copyDraftImagesToPublic } from '@/lib/storage/upload.server';
import { logger } from '@/lib/logging';

type RouteParams = { params: Promise<{ id: string; imageId: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthUnified();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { id: projectId, imageId } = await params;
    const { contractor } = auth;
    const supabase = await getAuthClient(auth);

    // Verify ownership and get project status + storage path
    const { data: image, error } = await supabase
      .from('project_images')
      .select(
        `
        id,
        storage_path,
        project:projects!inner(id, contractor_id, status)
      `
      )
      .eq('id', imageId)
      .eq('project_id', projectId)
      .single();

    const imageData = image as
      | { storage_path: string; project: { contractor_id: string; status: string } }
      | null;

    if (error || !imageData) {
      return apiError('NOT_FOUND', 'Image not found');
    }

    if (imageData.project.contractor_id !== contractor.id) {
      return apiError('FORBIDDEN', 'Access denied');
    }

    if (imageData.project.status !== 'published') {
      return apiSuccess({ synced: false });
    }

    const { errors } = await copyDraftImagesToPublic([imageData.storage_path]);
    if (errors.length > 0) {
      logger.warn('[POST /api/projects/[id]/images/[imageId]/sync] Copy warnings', { errors });
    }

    return apiSuccess({ synced: errors.length === 0 });
  } catch (error) {
    return handleApiError(error);
  }
}
