import { z } from 'zod';
import {
  attachHeroImageUrl,
  canPublish,
  getMissingPublishFields,
  toImageOutput,
  toProjectOutput,
} from '../../portfolio-client';
import { buildWidgetMeta } from '../../widget';
import type { AuthContext, UnpublishProjectOutput } from '../../types';
import { finalizeProjectSchema } from '@/lib/chat/tool-schemas';
import { createClient, type ToolResult } from '../shared';

export async function handleUnpublishProject(
  input: z.infer<typeof finalizeProjectSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<UnpublishProjectOutput>> {
  const client = createClient(auth, baseUrl);
  const result = await client.unpublishProject(input.project_id);
  if (!result.success) return { success: false, error: result.error };

  const project = toProjectOutput(result.data.project as unknown as Record<string, unknown>);
  const images = (result.data.project as { project_images?: unknown[] }).project_images || [];
  const isPublished = project.status === 'published';
  const imageOutputs = images.map((img) =>
    toImageOutput(img as unknown as Record<string, unknown>, { isPublished })
  );
  const projectWithHero = attachHeroImageUrl(project, imageOutputs);

  const missing = getMissingPublishFields(projectWithHero);
  if (imageOutputs.length === 0) missing.push('images');
  const publishable = canPublish(projectWithHero, imageOutputs.length);

  return {
    success: true,
    result: {
      structuredContent: { project_id: input.project_id, status: 'draft' },
      _meta: buildWidgetMeta(
        'project-status',
        { project: { ...projectWithHero, images: imageOutputs }, missing_fields: missing, can_publish: publishable },
        { project: { ...projectWithHero, images: imageOutputs } }
      ),
    },
  };
}
