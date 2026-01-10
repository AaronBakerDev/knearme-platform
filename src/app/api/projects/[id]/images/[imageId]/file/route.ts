import { NextRequest } from 'next/server';
import { requireAuthUnified, isAuthError, getAuthClient } from '@/lib/api/auth';
import { apiError, handleApiError } from '@/lib/api/errors';
import { createAdminClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ id: string; imageId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuthUnified();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const { id: projectId, imageId } = await params;
    const { contractor } = auth;
    const supabase = await getAuthClient(auth);

    // Verify ownership and fetch storage path
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

    const adminClient = createAdminClient();
    const draftDownload = await adminClient.storage
      .from('project-images-draft')
      .download(imageData.storage_path);

    let blob = draftDownload.data;
    let contentType = draftDownload.data?.type;

    if (draftDownload.error || !blob) {
      const publicDownload = await adminClient.storage
        .from('project-images')
        .download(imageData.storage_path);
      blob = publicDownload.data;
      contentType = publicDownload.data?.type;
    }

    if (!blob) {
      return apiError('NOT_FOUND', 'Image not available');
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
