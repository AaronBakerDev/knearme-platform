/**
 * Shared prompt context loader for chat + live voice sessions.
 *
 * Loads project data, images, business profile, and conversation summary
 * to provide rich context for the AI agent.
 *
 * @see /src/lib/chat/context-shared.ts for type definitions
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { BusinessProfileContext, ProjectContextData, ImageContextData } from '@/lib/chat/context-shared';
import type { ExtractedProjectData } from '@/lib/chat/chat-types';
import { createClient } from '@/lib/supabase/server';
import { buildSessionContext, formatMemoryForPrompt } from '@/lib/chat/memory';
import { logger } from '@/lib/logging';
import type { Business, Database, Project, ProjectImage } from '@/types/database';

function normalizeText(value?: string | null, maxLength = 200): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxLength - 3))}...`;
}

type ChatSessionRow = {
  id: string;
  session_summary: string | null;
};

type ChatDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      chat_sessions: {
        Row: ChatSessionRow;
        Insert: ChatSessionRow;
        Update: Partial<ChatSessionRow>;
      };
    };
  };
};

type ChatSupabaseClient = SupabaseClient<ChatDatabase>;

export async function loadPromptContext({
  projectId,
  sessionId,
  businessId,
  includeSummary,
}: {
  projectId?: string;
  sessionId?: string;
  businessId?: string;
  includeSummary: boolean;
}): Promise<{
  projectData: ProjectContextData | null;
  summary: string | null;
  businessProfile: BusinessProfileContext | null;
  memory: string | null;
}> {
  const supabase = (await createClient()) as ChatSupabaseClient;
  let projectData: ProjectContextData | null = null;
  let summary: string | null = null;
  let memory: string | null = null;

  if (projectId) {
    // Load project with images in parallel
    const [projectResult, imagesResult] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('project_images')
        .select('id, image_type, alt_text, display_order')
        .eq('project_id', projectId)
        .order('display_order', { ascending: true }),
    ]);

    const project = projectResult.data as Project | null;
    const images = (imagesResult.data || []) as Array<
      Pick<ProjectImage, 'id' | 'image_type' | 'alt_text' | 'display_order'>
    >;

    if (!projectResult.error && project) {
      // Map images to context format
      const imageContextData: ImageContextData[] = images.map((img) => ({
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
  if (businessId) {
    // Load from businesses table (primary source)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: business, error } = await (supabase as any)
      .from('businesses')
      .select('name, city, state, services, service_areas, description')
      .eq('id', businessId)
      .single();

    if (!error && business) {
      const businessData = business as Pick<
        Business,
        'name' | 'city' | 'state' | 'services' | 'service_areas' | 'description'
      >;
      const differentiator = normalizeText(businessData.description, 180);
      businessProfile = {
        businessName: businessData.name ?? null,
        services: businessData.services ?? null,
        serviceAreas: businessData.service_areas ?? null,
        city: businessData.city ?? null,
        state: businessData.state ?? null,
        differentiators: differentiator ? [differentiator] : null,
      };
    }
  }

  if (projectId) {
    try {
      const context = await buildSessionContext(projectId);
      const memoryContext = formatMemoryForPrompt(context);
      memory = memoryContext || null;
    } catch (error) {
      logger.warn('[PromptContext] Failed to load memory context', { error });
    }
  }

  return { projectData, summary, businessProfile, memory };
}
