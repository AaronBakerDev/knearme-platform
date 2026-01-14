import { z } from 'zod';
import { attachHeroImageUrl, toImageOutput, toProjectOutput } from '../../portfolio-client';
import { buildWidgetMeta } from '../../widget';
import type { AuthContext, ListContractorProjectsOutput } from '../../types';
import { listContractorProjectsSchema } from '@/lib/chat/tool-schemas';
import { createClient, type ToolResult } from '../shared';

export async function handleListContractorProjects(
  input: z.infer<typeof listContractorProjectsSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<ListContractorProjectsOutput>> {
  const client = createClient(auth, baseUrl);
  const result = await client.listProjects({ status: input.status, limit: input.limit || 10, offset: input.offset || 0 });
  if (!result.success) return { success: false, error: result.error };

  const projects = result.data.projects.map((p) => {
    const project = toProjectOutput(p as unknown as Record<string, unknown>);
    const images = (p as { project_images?: unknown[] }).project_images || [];
    const isPublished = project.status === 'published';
    const imageOutputs = images.map((img) =>
      toImageOutput(img as unknown as Record<string, unknown>, { isPublished })
    );
    return attachHeroImageUrl(project, imageOutputs);
  });
  const offset = input.offset || 0;
  const count = offset + projects.length;
  const hasMore = result.data.total > count;

  return {
    success: true,
    result: {
      structuredContent: { count, has_more: hasMore },
      _meta: buildWidgetMeta(
        'project-list',
        {
          projects,
          count,
          has_more: hasMore,
          offset,
          limit: input.limit || 10,
          status_filter: input.status,
        },
        { projects }
      ),
    },
  };
}
