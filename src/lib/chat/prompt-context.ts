/**
 * Shared prompt context loader for chat + live voice sessions.
 *
 * Loads project data, images, business profile, and conversation summary
 * to provide rich context for the AI agent.
 *
 * @see /src/lib/chat/context-shared.ts for type definitions
 */

import type { BusinessProfileContext, ProjectContextData, ImageContextData } from '@/lib/chat/context-shared';
import type { ExtractedProjectData } from '@/lib/chat/chat-types';
import { createClient } from '@/lib/supabase/server';

function normalizeText(value?: string | null, maxLength = 200): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxLength - 3))}...`;
}

export async function loadPromptContext({
  projectId,
  sessionId,
  contractorId,
  includeSummary,
}: {
  projectId?: string;
  sessionId?: string;
  contractorId?: string;
  includeSummary: boolean;
}): Promise<{
  projectData: ProjectContextData | null;
  summary: string | null;
  businessProfile: BusinessProfileContext | null;
}> {
  const supabase = await createClient();
  let projectData: ProjectContextData | null = null;
  let summary: string | null = null;

  if (projectId) {
    // Load project with images in parallel
    // RLS type handling - see CLAUDE.md for pattern explanation
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const [projectResult, imagesResult] = await Promise.all([
      (supabase as any)
        .from('projects')
        .select(
          `
          id,
          title,
          description,
          project_type,
          city,
          state,
          materials,
          techniques,
          status,
          conversation_summary,
          ai_context,
          hero_image_id
        `
        )
        .eq('id', projectId)
        .single(),
      // Fetch images separately to get metadata for agent context
      (supabase as any)
        .from('project_images')
        .select('id, image_type, alt_text, display_order')
        .eq('project_id', projectId)
        .order('display_order', { ascending: true }),
    ]);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const project = projectResult.data;
    const images = imagesResult.data || [];

    if (!projectResult.error && project) {
      // Map images to context format
      const imageContextData: ImageContextData[] = images.map((img: {
        id: string;
        image_type: 'before' | 'after' | 'progress' | 'detail' | null;
        alt_text: string | null;
        display_order: number;
      }) => ({
        id: img.id,
        imageType: img.image_type,
        altText: img.alt_text,
        displayOrder: img.display_order,
        isHero: img.id === project.hero_image_id,
      }));

      projectData = {
        id: project.id,
        title: project.title,
        description: project.description,
        project_type: project.project_type,
        city: project.city,
        state: project.state,
        materials: project.materials,
        techniques: project.techniques,
        status: project.status,
        extractedData: (project.ai_context as ExtractedProjectData) || {},
        conversationSummary: project.conversation_summary,
        images: imageContextData,
      };
      summary = project.conversation_summary ?? null;
    }
  }

  if (!summary && includeSummary && sessionId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session, error } = await (supabase as any)
      .from('chat_sessions')
      .select('session_summary')
      .eq('id', sessionId)
      .single();
    if (!error && session?.session_summary) {
      summary = session.session_summary;
    }
  }

  let businessProfile: BusinessProfileContext | null = null;
  if (contractorId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contractor, error } = await (supabase as any)
      .from('contractors')
      .select('business_name, city, state, services, service_areas, description')
      .eq('id', contractorId)
      .single();

    if (!error && contractor) {
      const differentiator = normalizeText(contractor.description, 180);
      businessProfile = {
        businessName: contractor.business_name ?? null,
        services: contractor.services ?? null,
        serviceAreas: contractor.service_areas ?? null,
        city: contractor.city ?? null,
        state: contractor.state ?? null,
        differentiators: differentiator ? [differentiator] : null,
      };
    }
  }

  return { projectData, summary, businessProfile };
}
