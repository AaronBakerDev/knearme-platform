import { z } from 'zod';
import {
  attachHeroImageUrl,
  getMissingPublishFields,
  toImageOutput,
  toProjectOutput,
} from '../../portfolio-client';
import { buildWidgetMeta } from '../../widget';
import type { AddProjectMediaOutput, AuthContext } from '../../types';
import { addProjectMediaSchema } from '@/lib/chat/tool-schemas';
import { createClient, type ToolResult } from '../shared';

export async function handleAddProjectMedia(
  input: z.infer<typeof addProjectMediaSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<AddProjectMediaOutput>> {
  const client = createClient(auth, baseUrl);
  const uploadErrors: Array<{ file_id?: string; url?: string; error: string }> = [];
  const uploads: Array<{
    file_id: string;
    image_id: string;
    signed_url: string;
    token: string;
    path: string;
    content_type: string;
  }> = [];

  let urlUploaded = 0;
  let urlFailed = 0;

  if (input.files && input.files.length > 0) {
    for (const file of input.files) {
      const uploadResult = await client.requestImageUpload(input.project_id, {
        filename: file.filename,
        content_type: file.content_type,
        image_type: file.image_type,
        display_order: file.display_order,
        width: file.width,
        height: file.height,
      });

      if (!uploadResult.success) {
        uploadErrors.push({ file_id: file.file_id, error: uploadResult.error });
        continue;
      }

      uploads.push({
        file_id: file.file_id,
        image_id: uploadResult.data.image.id,
        signed_url: uploadResult.data.upload.signed_url,
        token: uploadResult.data.upload.token,
        path: uploadResult.data.upload.path,
        content_type: file.content_type,
      });
    }
  }

  if (input.images && input.images.length > 0) {
    const urlResult = await client.addImagesFromUrls(input.project_id, input.images);
    if (!urlResult.success) return { success: false, error: urlResult.error };

    urlUploaded = urlResult.data.uploaded;
    urlFailed = urlResult.data.failed;
    if (urlResult.data.errors) {
      urlResult.data.errors.forEach((error) => {
        uploadErrors.push({ url: error.url, error: error.error });
      });
    }
  }

  if (uploads.length === 0 && urlUploaded === 0 && uploadErrors.length > 0) {
    const errorMessages = uploadErrors
      .map((error) => error.file_id ? `${error.file_id}: ${error.error}` : `${error.url}: ${error.error}`)
      .join('; ');
    return { success: false, error: `Failed to add images: ${errorMessages}` };
  }

  const projectResult = await client.getProject(input.project_id);
  if (!projectResult.success) return { success: false, error: projectResult.error };

  const project = toProjectOutput(projectResult.data.project as unknown as Record<string, unknown>);
  const images = (projectResult.data.project as unknown as { project_images?: unknown[] }).project_images || [];
  const isPublished = project.status === 'published';
  const imageOutputs = images.map((img) =>
    toImageOutput(img as unknown as Record<string, unknown>, { isPublished })
  );
  const projectWithHero = attachHeroImageUrl(project, imageOutputs);
  const missing = getMissingPublishFields(projectWithHero);
  if (imageOutputs.length === 0) missing.push('images');

  const statusParts: string[] = [];
  if (uploads.length > 0) statusParts.push(`Prepared ${uploads.length} upload${uploads.length === 1 ? '' : 's'}`);
  if (urlUploaded > 0) statusParts.push(`Imported ${urlUploaded} image${urlUploaded === 1 ? '' : 's'}`);
  if (urlFailed > 0) statusParts.push(`${urlFailed} URL import failed`);
  if (uploadErrors.length > 0 && urlFailed === 0) statusParts.push(`${uploadErrors.length} upload errors`);
  const statusMessage = statusParts.length > 0 ? statusParts.join(', ') : 'No images added';

  return {
    success: true,
    result: {
      structuredContent: {
        project_id: input.project_id,
        media_count: imageOutputs.length,
        missing_fields: missing,
        upload_status: statusMessage,
        upload_errors: uploadErrors.length > 0 ? uploadErrors : undefined,
      },
      _meta: buildWidgetMeta(
        'project-media',
        { project: projectWithHero, images: imageOutputs },
        { images: imageOutputs, uploads }
      ),
    },
  };
}
