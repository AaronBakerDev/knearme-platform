/**
 * Shared project/session state loaders for chat tooling.
 */

import type { ExtractedProjectData } from '@/lib/chat/chat-types';
import {
  checkReadyForImages,
  createEmptyProjectState,
  type SharedProjectState,
} from '@/lib/agents';
import { formatProjectLocation } from '@/lib/utils/location';
import { createClient } from '@/lib/supabase/server';
import { resolveProjectImageUrl } from '@/lib/storage/project-images';

export async function loadProjectState({
  projectId,
  businessId,
}: {
  projectId?: string;
  businessId?: string;
}): Promise<SharedProjectState | null> {
  if (!projectId || !businessId) {
    // Require business scoping to avoid unbounded cross-tenant reads.
    return null;
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch (err) {
    console.error('[loadProjectState] Failed to create Supabase client:', err);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = (supabase as any)
    .from('projects')
    .select(`
      id,
      title,
      description,
      project_type,
      project_type_slug,
      city,
      state,
      materials,
      techniques,
      challenge,
      solution,
      duration,
      status,
      ai_context,
      seo_title,
      seo_description,
      hero_image_id,
      project_images!project_images_project_id_fkey (
        id,
        storage_path,
        image_type,
        alt_text,
        display_order
      )
    `)
    .eq('id', projectId)
    .eq('business_id', businessId);

  const { data: project, error } = await query.single();

  if (error || !project) {
    console.error('[loadProjectState] Failed to load project:', error);
    return null;
  }

  const aiContext = project.ai_context as Record<string, unknown> | null;
  const images = project.project_images || [];
  const heroImageId =
    (project as { hero_image_id?: string | null }).hero_image_id ?? images[0]?.id;
  const isPublished = project.status === 'published';

  const imagesWithUrls = images.map((img: {
    id: string;
    storage_path: string;
    image_type?: string;
    alt_text?: string;
    display_order?: number;
  }) => ({
    id: img.id,
    url: resolveProjectImageUrl({
      projectId,
      imageId: img.id,
      storagePath: img.storage_path,
      isPublished,
    }),
    storagePath: img.storage_path,
    bucket: 'project-images-draft' as const,
    imageType: img.image_type as 'before' | 'after' | 'progress' | 'detail' | undefined,
    altText: img.alt_text,
    displayOrder: img.display_order || 0,
  }));

  const readyForImages = checkReadyForImages({
    projectType: project.project_type || undefined,
    customerProblem:
      (aiContext?.customer_problem as string) ||
      (project.challenge as string | null) ||
      undefined,
    solutionApproach:
      (aiContext?.solution_approach as string) ||
      (project.solution as string | null) ||
      undefined,
    materials: project.materials || [],
  });

  const state: SharedProjectState = {
    ...createEmptyProjectState(),
    projectType: project.project_type || undefined,
    projectTypeSlug: project.project_type_slug || undefined,
    city: project.city || undefined,
    state: project.state || undefined,
    location: formatProjectLocation({ city: project.city, state: project.state }) || undefined,
    title: project.title || undefined,
    description: project.description || undefined,
    seoTitle: project.seo_title || undefined,
    seoDescription: project.seo_description || undefined,
    materials: project.materials || [],
    techniques: project.techniques || [],
    tags: [],
    customerProblem:
      (aiContext?.customer_problem as string) ||
      (project.challenge as string | null) ||
      undefined,
    solutionApproach:
      (aiContext?.solution_approach as string) ||
      (project.solution as string | null) ||
      undefined,
    duration:
      (aiContext?.duration as string) ||
      (project.duration as string | null) ||
      undefined,
    proudOf: (aiContext?.proud_of as string) || undefined,
    images: imagesWithUrls,
    heroImageId,
    readyForImages,
    readyForContent: Boolean(
      project.project_type &&
      images.length > 0 &&
      heroImageId
    ),
    readyToPublish: project.status === 'published',
    needsClarification: [],
    clarifiedFields: [],
  };

  return state;
}

export async function loadSessionExtractedData({
  sessionId,
  businessId,
}: {
  sessionId?: string;
  businessId?: string;
}): Promise<ExtractedProjectData | null> {
  if (!sessionId || !businessId) return null;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error } = await (supabase as any)
    .from('chat_sessions')
    .select('extracted_data')
    .eq('id', sessionId)
    // Scope session reads to the authenticated business (defense in depth).
    .eq('business_id', businessId)
    .single();

  if (error || !session) {
    console.warn('[loadSessionExtractedData] Failed to load session:', error);
    return null;
  }

  return (session.extracted_data as ExtractedProjectData) || null;
}

export function cleanExtractedData(data: ExtractedProjectData): ExtractedProjectData {
  const cleaned: ExtractedProjectData = {};
  const addString = (key: keyof ExtractedProjectData, value?: string) => {
    if (!value) return;
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      cleaned[key] = trimmed as never;
    }
  };
  const addArray = (key: keyof ExtractedProjectData, value?: string[]) => {
    if (!value || value.length === 0) return;
    const filtered = value.map((item) => item.trim()).filter(Boolean);
    if (filtered.length > 0) {
      cleaned[key] = filtered as never;
    }
  };

  addString('project_type', data.project_type);
  addString('customer_problem', data.customer_problem);
  addString('solution_approach', data.solution_approach);
  addArray('materials_mentioned', data.materials_mentioned);
  addArray('techniques_mentioned', data.techniques_mentioned);
  addString('duration', data.duration);
  addString('city', data.city);
  addString('state', data.state);
  addString('location', data.location);
  addString('proud_of', data.proud_of);
  if (data.ready_for_images) {
    cleaned.ready_for_images = true;
  }
  return cleaned;
}

export function mapExtractedDataToState(data?: ExtractedProjectData): Partial<SharedProjectState> {
  if (!data) return {};

  const locationLabel =
    data.location ||
    formatProjectLocation({ city: data.city, state: data.state }) ||
    undefined;

  return {
    projectType: data.project_type || undefined,
    customerProblem: data.customer_problem || undefined,
    solutionApproach: data.solution_approach || undefined,
    materials: data.materials_mentioned || [],
    techniques: data.techniques_mentioned || [],
    duration: data.duration || undefined,
    proudOf: data.proud_of || undefined,
    city: data.city || undefined,
    state: data.state || undefined,
    location: locationLabel,
  };
}

export function mapStateToExtractedData(state: SharedProjectState): ExtractedProjectData {
  const locationLabel =
    state.location ||
    formatProjectLocation({ city: state.city, state: state.state }) ||
    undefined;

  return cleanExtractedData({
    project_type: state.projectType,
    customer_problem: state.customerProblem,
    solution_approach: state.solutionApproach,
    materials_mentioned: state.materials,
    techniques_mentioned: state.techniques,
    duration: state.duration,
    city: state.city,
    state: state.state,
    location: locationLabel,
    proud_of: state.proudOf,
    ready_for_images: state.readyForImages || undefined,
  });
}
