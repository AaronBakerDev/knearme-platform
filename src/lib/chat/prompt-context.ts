/**
 * Shared prompt context loader for chat + live voice sessions.
 */

import type { BusinessProfileContext, ProjectContextData } from '@/lib/chat/context-shared';
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error } = await (supabase as any)
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
        ai_context
      `
      )
      .eq('id', projectId)
      .single();

    if (!error && project) {
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
