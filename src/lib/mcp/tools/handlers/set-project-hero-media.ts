import { z } from 'zod';
import { attachHeroImageUrl, toImageOutput, toProjectOutput } from '../../portfolio-client';
import { buildWidgetMeta } from '../../widget';
import type { AuthContext, MediaUpdateOutput } from '../../types';
import { setProjectHeroMediaSchema } from '@/lib/chat/tool-schemas';
import { createClient, type ToolResult } from '../shared';

export async function handleSetProjectHeroMedia(
  input: z.infer<typeof setProjectHeroMediaSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<MediaUpdateOutput>> {
  const client = createClient(auth, baseUrl);
  const result = await client.updateProject(input.project_id, { hero_image_id: input.hero_image_id });
  if (!result.success) return { success: false, error: result.error };

  const projectResult = await client.getProject(input.project_id);
  if (!projectResult.success) return { success: false, error: projectResult.error };

  const project = toProjectOutput(projectResult.data.project as unknown as Record<string, unknown>);
  const images = (projectResult.data.project as unknown as { project_images?: unknown[] }).project_images || [];
  const isPublished = project.status === 'published';
  const imageOutputs = images.map((img) =>
    toImageOutput(img as unknown as Record<string, unknown>, { isPublished })
  );
  const projectWithHero = attachHeroImageUrl(project, imageOutputs);

  return {
    success: true,
    result: {
      structuredContent: { project_id: input.project_id, status: 'ok' },
      _meta: buildWidgetMeta(
        'project-media',
        { project: projectWithHero, images: imageOutputs },
        { images: imageOutputs }
      ),
    },
  };
}
