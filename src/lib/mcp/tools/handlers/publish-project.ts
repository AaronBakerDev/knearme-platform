import { z } from 'zod';
import {
  attachHeroImageUrl,
  toImageOutput,
  toProjectOutput,
} from '../../portfolio-client';
import { buildWidgetMeta } from '../../widget';
import type { AuthContext, PublishProjectOutput } from '../../types';
import { finalizeProjectSchema } from '@/lib/chat/tool-schemas';
import { createClient, type ToolResult } from '../shared';

export async function handlePublishProject(
  input: z.infer<typeof finalizeProjectSchema>,
  auth: AuthContext,
  baseUrl: string
): Promise<ToolResult<PublishProjectOutput>> {
  const client = createClient(auth, baseUrl);
  const result = await client.publishProject(input.project_id);
  if (!result.success) return { success: false, error: result.error };

  const project = toProjectOutput(result.data.project as unknown as Record<string, unknown>);
  const images = (result.data.project as { project_images?: unknown[] }).project_images || [];
  const isPublished = project.status === 'published';
  const imageOutputs = images.map((img) =>
    toImageOutput(img as unknown as Record<string, unknown>, { isPublished })
  );
  const projectWithHero = attachHeroImageUrl(project, imageOutputs);

  const basePublicUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.co';
  // Phase 10 note: keep '/masonry/' until trade segment routes are restructured.
  // @see /docs/philosophy/universal-portfolio-agents.md for multi-trade vision
  const tradeSegment = 'masonry'; // Will become dynamic: project.trade_slug || 'construction'
  const url = project.city_slug && project.project_type_slug && project.slug
    ? `${basePublicUrl}/${project.city_slug}/${tradeSegment}/${project.project_type_slug}/${project.slug}`
    : basePublicUrl;

  return {
    success: true,
    result: {
      structuredContent: { project_id: input.project_id, status: 'published', url },
      _meta: buildWidgetMeta(
        'project-status',
        { project: { ...projectWithHero, images: imageOutputs }, missing_fields: [], can_publish: false, public_url: url },
        { project: { ...projectWithHero, images: imageOutputs } }
      ),
    },
  };
}
