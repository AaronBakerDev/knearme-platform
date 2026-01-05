/**
 * Shared project/session state loaders for chat tooling.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExtractedProjectData } from '@/lib/chat/chat-types';
import {
  checkReadyForImages,
  createEmptyProjectState,
  type SharedProjectState,
} from '@/lib/agents';
import { formatProjectLocation } from '@/lib/utils/location';
import { createClient } from '@/lib/supabase/server';
import { resolveProjectImageUrl } from '@/lib/storage/project-images';
import { logger } from '@/lib/logging';
import type { Database, Json } from '@/types/database';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type ProjectImageRow = Database['public']['Tables']['project_images']['Row'];

type ProjectImageSummary = Pick<
  ProjectImageRow,
  'id' | 'storage_path' | 'image_type' | 'alt_text' | 'display_order'
>;

type ProjectWithImages = ProjectRow & {
  project_images: ProjectImageSummary[];
};

type ChatSessionRow = {
  id: string;
  business_id: string;
  extracted_data: Json | null;
};

type ChatSessionInsert = ChatSessionRow;
type ChatSessionUpdate = Partial<ChatSessionRow>;

type ChatDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      chat_sessions: {
        Row: ChatSessionRow;
        Insert: ChatSessionInsert;
        Update: ChatSessionUpdate;
      };
    };
  };
};

type ChatSupabaseClient = SupabaseClient<ChatDatabase>;

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

  let supabase: ChatSupabaseClient;
  try {
    supabase = (await createClient()) as ChatSupabaseClient;
  } catch (err) {
    logger.error('[loadProjectState] Failed to create Supabase client', { error: err });
    return null;
  }

  const query = supabase
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
    logger.error('[loadProjectState] Failed to load project', { error });
    return null;
  }

  const typedProject = project as ProjectWithImages;
  const aiContext =
    typedProject.ai_context &&
    typeof typedProject.ai_context === 'object' &&
    !Array.isArray(typedProject.ai_context)
      ? (typedProject.ai_context as Record<string, unknown>)
      : null;
  const images = typedProject.project_images ?? [];
  const heroImageId = typedProject.hero_image_id ?? images[0]?.id;
  const isPublished = typedProject.status === 'published';

  const imagesWithUrls = images.map((img: {
    id: string;
    storage_path: string;
    image_type: ProjectImageRow['image_type'];
    alt_text: string | null;
    display_order: number | null;
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
    imageType: img.image_type ?? undefined,
    altText: img.alt_text ?? undefined,
    displayOrder: img.display_order ?? 0,
  }));

  const readyForImages = checkReadyForImages({
    projectType: typedProject.project_type || undefined,
    customerProblem:
      (aiContext?.customer_problem as string) ||
      typedProject.challenge ||
      undefined,
    solutionApproach:
      (aiContext?.solution_approach as string) ||
      typedProject.solution ||
      undefined,
    materials: typedProject.materials || [],
  });

  const state: SharedProjectState = {
    ...createEmptyProjectState(),
    projectType: typedProject.project_type || undefined,
    projectTypeSlug: typedProject.project_type_slug || undefined,
    city: typedProject.city || undefined,
    state: typedProject.state || undefined,
    location:
      formatProjectLocation({ city: typedProject.city, state: typedProject.state }) || undefined,
    title: typedProject.title || undefined,
    description: typedProject.description || undefined,
    seoTitle: typedProject.seo_title || undefined,
    seoDescription: typedProject.seo_description || undefined,
    materials: typedProject.materials || [],
    techniques: typedProject.techniques || [],
    tags: [],
    customerProblem:
      (aiContext?.customer_problem as string) ||
      typedProject.challenge ||
      undefined,
    solutionApproach:
      (aiContext?.solution_approach as string) ||
      typedProject.solution ||
      undefined,
    duration:
      (aiContext?.duration as string) ||
      typedProject.duration ||
      undefined,
    proudOf: (aiContext?.proud_of as string) || undefined,
    images: imagesWithUrls,
    heroImageId,
    readyForImages,
    readyForContent: Boolean(
      typedProject.project_type &&
      images.length > 0 &&
      heroImageId
    ),
    readyToPublish: typedProject.status === 'published',
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
  const supabase = (await createClient()) as ChatSupabaseClient;

  const { data: session, error } = await supabase
    .from('chat_sessions')
    .select('extracted_data')
    .eq('id', sessionId)
    // Scope session reads to the authenticated business (defense in depth).
    .eq('business_id', businessId)
    .single();

  if (error || !session) {
    logger.warn('[loadSessionExtractedData] Failed to load session', { error });
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
