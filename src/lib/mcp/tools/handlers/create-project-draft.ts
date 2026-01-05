import { z } from 'zod';
import {
  attachHeroImageUrl,
  getMissingPublishFields,
  toImageOutput,
  toProjectOutput,
} from '../../portfolio-client';
import { buildWidgetMeta } from '../../widget';
import type { AuthContext, CreateProjectDraftOutput } from '../../types';
import { createProjectDraftSchema } from '@/lib/chat/tool-schemas';
import { createClient, type ToolResult } from '../shared';

export async function handleCreateProjectDraft(
  input: z.infer<typeof createProjectDraftSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<CreateProjectDraftOutput>> {
  const client = createClient(auth, baseUrl);
  const result = await client.createProject(input);

  if (!result.success) return { success: false, error: result.error };

  const project = toProjectOutput(result.data.project as unknown as Record<string, unknown>);
  const images = (result.data.project as unknown as { project_images?: unknown[] }).project_images || [];
  const isPublished = project.status === 'published';
  const imageOutputs = images.map((img) =>
    toImageOutput(img as unknown as Record<string, unknown>, { isPublished })
  );
  const projectWithHero = attachHeroImageUrl(project, imageOutputs);
  const missing = getMissingPublishFields(projectWithHero);
  if (imageOutputs.length === 0) missing.push('images');

  return {
    success: true,
    result: {
      structuredContent: { project_id: project.id, missing_fields: missing },
      _meta: buildWidgetMeta(
        'project-draft',
        { project: projectWithHero, missing_fields: missing, can_publish: false },
        { project: projectWithHero }
      ),
    },
  };
}
