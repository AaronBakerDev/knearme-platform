/**
 * Typed Supabase Query Wrappers
 *
 * This module provides typed wrapper functions for common Supabase queries.
 * These wrappers handle the RLS type inference issue where Supabase infers
 * `never` for query results due to Row Level Security policies.
 *
 * WHY THIS EXISTS:
 * Supabase's TypeScript types cannot infer the correct return types when RLS
 * policies are in effect. This previously led to lint suppressions scattered
 * across API routes. By centralizing the query patterns here, we:
 * 1. Keep type workarounds in one place (if needed)
 * 2. Provide proper TypeScript types for consumers
 * 3. Make query patterns consistent and reusable
 *
 * USAGE:
 * ```typescript
 * import { selectBusinessById, updateProject } from '@/lib/supabase/typed-queries';
 *
 * const { data: business } = await selectBusinessById(supabase, authUserId);
 * await updateProject(supabase, projectId, { title: 'New Title' });
 * ```
 *
 * @see /docs/philosophy/over-engineering-audit.md for context on RLS type issues
 * @see https://github.com/supabase/supabase-js/issues/551 for upstream discussion
 */

import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  Business,
  BusinessUpdate,
  Contractor,
  ContractorUpdate,
  Project,
  ProjectUpdate,
  ProjectImage,
  ProjectImageInsert,
  Conversation,
  ConversationInsert,
  ConversationUpdate,
  InterviewSession,
  Json,
} from '@/types/database';

// =============================================================================
// Types
// =============================================================================

/**
 * Generic Supabase client type for shared typed queries.
 */
type DbClient = SupabaseClient<Database>;

/**
 * Standard query result with typed data and error.
 */
export type SupabaseQueryResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

/**
 * Array query result.
 */
export type SupabaseArrayResult<T> = {
  data: T[];
  error: PostgrestError | null;
};

/**
 * Count query result.
 */
export type SupabaseCountResult = {
  count: number;
  error: PostgrestError | null;
};

/**
 * Simple error-only result for mutations.
 */
export type SupabaseMutationResult = {
  error: PostgrestError | null;
};

// =============================================================================
// Business Queries
// =============================================================================

/**
 * Select a business by auth user ID.
 *
 * @param client - Supabase client (regular or admin)
 * @param authUserId - The auth.users.id to match
 * @returns Business record or null with error
 */
export async function selectBusinessById(
  client: DbClient,
  authUserId: string
): Promise<SupabaseQueryResult<Business>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('businesses')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  return {
    data: result.data as Business | null,
    error: result.error,
  };
}

/**
 * Select a business by its primary ID.
 *
 * @param client - Supabase client
 * @param businessId - The business ID
 * @returns Business record or null
 */
export async function selectBusinessByPrimaryId(
  client: DbClient,
  businessId: string
): Promise<SupabaseQueryResult<Business>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  return {
    data: result.data as Business | null,
    error: result.error,
  };
}

/**
 * Select a business by legacy contractor ID.
 *
 * @param client - Supabase client
 * @param contractorId - The legacy_contractor_id to match
 * @returns Business record or null
 */
export async function selectBusinessByContractorId(
  client: DbClient,
  contractorId: string
): Promise<SupabaseQueryResult<Business>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('businesses')
    .select('*')
    .eq('legacy_contractor_id', contractorId)
    .single();

  return {
    data: result.data as Business | null,
    error: result.error,
  };
}

/**
 * Insert a new business.
 *
 * @param client - Supabase client
 * @param data - Business data to insert
 * @returns Inserted business or error
 */
export async function insertBusiness(
  client: DbClient,
  data: {
    id?: string;
    auth_user_id: string;
    email?: string;
    legacy_contractor_id?: string;
  }
): Promise<SupabaseQueryResult<{ id: string }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('businesses')
    .insert(data)
    .select('id')
    .single();

  return {
    data: result.data as { id: string } | null,
    error: result.error,
  };
}

/**
 * Update a business by ID.
 *
 * @param client - Supabase client
 * @param businessId - The business ID
 * @param updates - Partial business data to update
 * @returns Updated business or error
 */
export async function updateBusiness(
  client: DbClient,
  businessId: string,
  updates: BusinessUpdate
): Promise<SupabaseQueryResult<Business>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('businesses')
    .update(updates)
    .eq('id', businessId)
    .select('*')
    .single();

  return {
    data: result.data as Business | null,
    error: result.error,
  };
}

/**
 * Update a business by legacy contractor ID.
 *
 * @param client - Supabase client
 * @param contractorId - The legacy contractor ID
 * @param updates - Partial business data to update
 * @returns Error if present
 */
export async function updateBusinessByContractorId(
  client: DbClient,
  contractorId: string,
  updates: BusinessUpdate
): Promise<SupabaseMutationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('businesses')
    .update(updates)
    .eq('legacy_contractor_id', contractorId);

  return { error: result.error };
}

// =============================================================================
// Contractor Queries (Legacy - Use Business queries for new code)
// =============================================================================

/**
 * Select a contractor by auth user ID.
 *
 * @param client - Supabase client
 * @param authUserId - The auth.users.id to match
 * @param columns - Optional columns to select (default: all)
 * @returns Contractor record or null
 *
 * @deprecated Use selectBusinessById for new code
 */
export async function selectContractorById(
  client: DbClient,
  authUserId: string,
  columns: string = '*'
): Promise<SupabaseQueryResult<Contractor>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('contractors')
    .select(columns)
    .eq('auth_user_id', authUserId)
    .single();

  return {
    data: result.data as Contractor | null,
    error: result.error,
  };
}

/**
 * Select a contractor by primary ID.
 *
 * @param client - Supabase client
 * @param contractorId - The contractor ID
 * @returns Contractor record or null
 *
 * @deprecated Use selectBusinessByPrimaryId for new code
 */
export async function selectContractorByPrimaryId(
  client: DbClient,
  contractorId: string
): Promise<SupabaseQueryResult<Contractor>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('contractors')
    .select('*')
    .eq('id', contractorId)
    .single();

  return {
    data: result.data as Contractor | null,
    error: result.error,
  };
}

/**
 * Update a contractor by ID.
 *
 * @param client - Supabase client
 * @param contractorId - The contractor ID
 * @param updates - Partial contractor data to update
 * @returns Error if present
 *
 * @deprecated Use updateBusiness for new code
 */
export async function updateContractor(
  client: DbClient,
  contractorId: string,
  updates: ContractorUpdate
): Promise<SupabaseMutationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('contractors')
    .update(updates)
    .eq('id', contractorId);

  return { error: result.error };
}

/**
 * Insert a new contractor.
 *
 * @param client - Supabase client
 * @param data - Contractor data to insert
 * @returns Inserted contractor ID or error
 *
 * @deprecated Use insertBusiness for new code
 */
export async function insertContractor(
  client: DbClient,
  data: { auth_user_id: string; email?: string }
): Promise<SupabaseQueryResult<{ id: string }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('contractors')
    .insert(data)
    .select('id')
    .single();

  return {
    data: result.data as { id: string } | null,
    error: result.error,
  };
}

// =============================================================================
// Project Queries
// =============================================================================

/**
 * Select a project by ID.
 *
 * @param client - Supabase client
 * @param projectId - The project ID
 * @returns Project record or null
 */
export async function selectProjectById(
  client: DbClient,
  projectId: string
): Promise<SupabaseQueryResult<Project>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  return {
    data: result.data as Project | null,
    error: result.error,
  };
}

/**
 * Select a project by ID with ownership verification.
 *
 * @param client - Supabase client
 * @param projectId - The project ID
 * @param contractorId - The contractor ID for ownership check
 * @returns Project record or null
 */
export async function selectProjectByIdForContractor(
  client: DbClient,
  projectId: string,
  contractorId: string
): Promise<SupabaseQueryResult<Project>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('contractor_id', contractorId)
    .single();

  return {
    data: result.data as Project | null,
    error: result.error,
  };
}

/**
 * Select specific columns from a project.
 *
 * @param client - Supabase client
 * @param projectId - The project ID
 * @param columns - Columns to select
 * @param contractorId - Optional contractor ID for ownership check
 * @returns Project columns or null
 */
export async function selectProjectColumns<T extends Record<string, unknown>>(
  client: DbClient,
  projectId: string,
  columns: string,
  contractorId?: string
): Promise<SupabaseQueryResult<T>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (client as any)
    .from('projects')
    .select(columns)
    .eq('id', projectId);

  if (contractorId) {
    query = query.eq('contractor_id', contractorId);
  }

  const result = await query.single();

  return {
    data: result.data as T | null,
    error: result.error,
  };
}

/**
 * Update a project by ID.
 *
 * @param client - Supabase client
 * @param projectId - The project ID
 * @param updates - Partial project data to update
 * @param contractorId - Optional contractor ID for ownership check
 * @returns Error if present
 */
export async function updateProject(
  client: DbClient,
  projectId: string,
  updates: ProjectUpdate,
  contractorId?: string
): Promise<SupabaseMutationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (client as any)
    .from('projects')
    .update(updates)
    .eq('id', projectId);

  if (contractorId) {
    query = query.eq('contractor_id', contractorId);
  }

  const result = await query;

  return { error: result.error };
}

// =============================================================================
// Project Images Queries
// =============================================================================

/**
 * Select all images for a project, ordered by display_order.
 *
 * @param client - Supabase client
 * @param projectId - The project ID
 * @returns Array of project images
 */
export async function selectProjectImages(
  client: DbClient,
  projectId: string
): Promise<SupabaseArrayResult<ProjectImage>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('project_images')
    .select('*')
    .eq('project_id', projectId)
    .order('display_order', { ascending: true });

  return {
    data: (result.data ?? []) as ProjectImage[],
    error: result.error,
  };
}

/**
 * Get count of images for a project.
 *
 * @param client - Supabase client
 * @param projectId - The project ID
 * @returns Count of images
 */
export async function countProjectImages(
  client: DbClient,
  projectId: string
): Promise<SupabaseCountResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('project_images')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  return {
    count: result.count ?? 0,
    error: result.error,
  };
}

/**
 * Insert a new project image.
 *
 * @param client - Supabase client
 * @param data - Project image data
 * @returns Inserted image or error
 */
export async function insertProjectImage(
  client: DbClient,
  data: ProjectImageInsert
): Promise<SupabaseQueryResult<ProjectImage>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('project_images')
    .insert(data)
    .select('*')
    .single();

  return {
    data: result.data as ProjectImage | null,
    error: result.error,
  };
}

/**
 * Delete a project image by ID.
 *
 * @param client - Supabase client
 * @param imageId - The image ID
 * @returns Error if present
 */
export async function deleteProjectImage(
  client: DbClient,
  imageId: string
): Promise<SupabaseMutationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('project_images')
    .delete()
    .eq('id', imageId);

  return { error: result.error };
}

/**
 * Select a project image with its project for ownership verification.
 *
 * @param client - Supabase client
 * @param imageId - The image ID
 * @param projectId - The project ID
 * @returns Image with project contractor_id or null
 */
export async function selectProjectImageWithProject(
  client: DbClient,
  imageId: string,
  projectId: string
): Promise<SupabaseQueryResult<ProjectImage & { project: { contractor_id: string } }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('project_images')
    .select(`
      *,
      project:projects!inner(contractor_id)
    `)
    .eq('id', imageId)
    .eq('project_id', projectId)
    .single();

  return {
    data: result.data as (ProjectImage & { project: { contractor_id: string } }) | null,
    error: result.error,
  };
}

/**
 * Update a project image's display order.
 *
 * @param client - Supabase client
 * @param imageId - The image ID
 * @param displayOrder - New display order
 * @returns Error if present
 */
export async function updateProjectImageOrder(
  client: DbClient,
  imageId: string,
  displayOrder: number
): Promise<SupabaseMutationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('project_images')
    .update({ display_order: displayOrder })
    .eq('id', imageId);

  return { error: result.error };
}

/**
 * Update a project image's labels (type and alt text).
 *
 * @param client - Supabase client
 * @param imageId - The image ID
 * @param updates - Label updates
 * @returns Error if present
 */
export async function updateProjectImageLabels(
  client: DbClient,
  imageId: string,
  updates: { image_type?: string | null; alt_text?: string | null }
): Promise<SupabaseMutationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('project_images')
    .update(updates)
    .eq('id', imageId);

  return { error: result.error };
}

/**
 * Verify multiple image IDs belong to a project.
 *
 * @param client - Supabase client
 * @param projectId - The project ID
 * @param imageIds - Array of image IDs to verify
 * @returns Array of valid image IDs
 */
export async function verifyProjectImageIds(
  client: DbClient,
  projectId: string,
  imageIds: string[]
): Promise<SupabaseArrayResult<{ id: string }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('project_images')
    .select('id')
    .eq('project_id', projectId)
    .in('id', imageIds);

  return {
    data: (result.data ?? []) as { id: string }[],
    error: result.error,
  };
}

// =============================================================================
// Conversation Queries
// =============================================================================

/**
 * Select a conversation by business ID and purpose.
 *
 * @param client - Supabase client
 * @param businessId - The business ID
 * @param purpose - Optional conversation purpose filter
 * @returns Conversation record or null
 */
export async function selectConversationByBusinessId(
  client: DbClient,
  businessId: string,
  purpose?: string
): Promise<SupabaseQueryResult<Conversation>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (client as any)
    .from('conversations')
    .select('*')
    .eq('business_id', businessId);

  if (purpose) {
    query = query.eq('purpose', purpose);
  }

  const result = await query.single();

  return {
    data: result.data as Conversation | null,
    error: result.error,
  };
}

/**
 * Insert a new conversation.
 *
 * @param client - Supabase client
 * @param data - Conversation data
 * @returns Inserted conversation or error
 */
export async function insertConversation(
  client: DbClient,
  data: ConversationInsert
): Promise<SupabaseQueryResult<Conversation>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('conversations')
    .insert(data)
    .select('*')
    .single();

  return {
    data: result.data as Conversation | null,
    error: result.error,
  };
}

/**
 * Update a conversation by ID.
 *
 * @param client - Supabase client
 * @param conversationId - The conversation ID
 * @param updates - Partial conversation data
 * @returns Updated conversation or error
 */
export async function updateConversation(
  client: DbClient,
  conversationId: string,
  updates: ConversationUpdate
): Promise<SupabaseQueryResult<Conversation>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('conversations')
    .update(updates)
    .eq('id', conversationId)
    .select('*')
    .single();

  return {
    data: result.data as Conversation | null,
    error: result.error,
  };
}

/**
 * Insert or update a conversation (upsert by business_id + purpose).
 * Note: This requires a unique constraint on (business_id, purpose).
 *
 * @param client - Supabase client
 * @param data - Conversation data
 * @returns Upserted conversation or error
 */
export async function upsertConversation(
  client: DbClient,
  data: ConversationInsert
): Promise<SupabaseQueryResult<Conversation>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('conversations')
    .upsert(data, { onConflict: 'business_id,purpose' })
    .select('*')
    .single();

  return {
    data: result.data as Conversation | null,
    error: result.error,
  };
}

// =============================================================================
// Interview Session Queries
// =============================================================================

/**
 * Select an interview session by project ID.
 *
 * @param client - Supabase client
 * @param projectId - The project ID
 * @returns Interview session or null
 */
export async function selectInterviewSession(
  client: DbClient,
  projectId: string
): Promise<SupabaseQueryResult<InterviewSession>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('interview_sessions')
    .select('*')
    .eq('project_id', projectId)
    .single();

  return {
    data: result.data as InterviewSession | null,
    error: result.error,
  };
}

/**
 * Insert or update an interview session (upsert by project_id).
 *
 * @param client - Supabase client
 * @param data - Session data including project_id
 * @returns Error if present
 */
export async function upsertInterviewSession(
  client: DbClient,
  data: {
    project_id: string;
    image_analysis?: Json | null;
    questions?: Json | null;
    generated_content?: Json | null;
    status?: 'in_progress' | 'completed' | 'approved';
  }
): Promise<SupabaseMutationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('interview_sessions')
    .upsert(data, { onConflict: 'project_id' });

  return { error: result.error };
}

/**
 * Update an interview session by project ID.
 *
 * @param client - Supabase client
 * @param projectId - The project ID
 * @param updates - Partial session data
 * @returns Error if present
 */
export async function updateInterviewSession(
  client: DbClient,
  projectId: string,
  updates: {
    questions?: Json | null;
    image_analysis?: Json | null;
    generated_content?: Json | null;
    status?: 'in_progress' | 'completed' | 'approved';
  }
): Promise<SupabaseMutationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('interview_sessions')
    .update(updates)
    .eq('project_id', projectId);

  return { error: result.error };
}

// =============================================================================
// Onboarding Conversation Queries
// =============================================================================

/**
 * Message structure for conversations.
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

/**
 * Conversation row with parsed fields.
 */
export interface ConversationRow {
  id: string;
  messages: ConversationMessage[] | null;
  extracted: Record<string, unknown> | null;
  summary: string | null;
}

/**
 * Select a conversation by business ID and purpose with specific columns.
 *
 * @param client - Supabase client
 * @param businessId - The business ID
 * @param purpose - The conversation purpose
 * @returns Conversation row or null
 */
export async function selectOnboardingConversation(
  client: DbClient,
  businessId: string,
  purpose: string
): Promise<SupabaseQueryResult<ConversationRow>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('conversations')
    .select('id, messages, extracted, summary')
    .eq('business_id', businessId)
    .eq('purpose', purpose)
    .single();

  return {
    data: result.data as ConversationRow | null,
    error: result.error,
  };
}

/**
 * Insert a new onboarding conversation.
 *
 * @param client - Supabase client
 * @param data - Conversation insert data
 * @returns Inserted conversation row
 */
export async function insertOnboardingConversation(
  client: DbClient,
  data: {
    business_id: string;
    purpose: string;
    status: string;
    messages: ConversationMessage[];
    extracted: Record<string, unknown>;
  }
): Promise<SupabaseQueryResult<ConversationRow>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('conversations')
    .insert(data)
    .select('id, messages, extracted, summary')
    .single();

  return {
    data: result.data as ConversationRow | null,
    error: result.error,
  };
}

/**
 * Update a conversation by ID.
 *
 * @param client - Supabase client
 * @param conversationId - The conversation ID
 * @param updates - Fields to update
 * @returns Updated conversation row or null
 */
export async function updateOnboardingConversation(
  client: DbClient,
  conversationId: string,
  updates: {
    messages?: ConversationMessage[];
    extracted?: Record<string, unknown>;
    status?: string;
  }
): Promise<SupabaseQueryResult<ConversationRow>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('conversations')
    .update(updates)
    .eq('id', conversationId)
    .select('id, messages, extracted, summary')
    .single();

  return {
    data: result.data as ConversationRow | null,
    error: result.error,
  };
}

/**
 * Update a conversation by ID (fire-and-forget mutation).
 *
 * @param client - Supabase client
 * @param conversationId - The conversation ID
 * @param updates - Fields to update
 * @returns Error if present
 */
export async function updateConversationMessages(
  client: DbClient,
  conversationId: string,
  updates: {
    messages?: ConversationMessage[];
    extracted?: Record<string, unknown>;
    status?: string;
  }
): Promise<SupabaseMutationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('conversations')
    .update(updates)
    .eq('id', conversationId);

  return { error: result.error };
}

// =============================================================================
// Business Update Queries (Extended)
// =============================================================================

/**
 * Update a business with full onboarding data.
 *
 * @param client - Supabase client
 * @param businessId - The business ID
 * @param updates - Onboarding profile updates
 * @returns Error if present
 */
export async function updateBusinessOnboarding(
  client: DbClient,
  businessId: string,
  updates: {
    name?: string | null;
    address?: string | null;
    postal_code?: string | null;
    phone?: string | null;
    website?: string | null;
    city?: string | null;
    state?: string | null;
    services?: string[] | null;
    service_areas?: string[] | null;
    description?: string | null;
    location?: Json | null;
    understanding?: Json | null;
    discovered_data?: Json | null;
    google_place_id?: string | null;
    google_cid?: string | null;
    onboarding_method?: string | null;
    onboarding_completed_at?: string | null;
  }
): Promise<SupabaseMutationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('businesses')
    .update(updates)
    .eq('id', businessId);

  return { error: result.error };
}

/**
 * Update a contractor by ID with onboarding data.
 *
 * @param client - Supabase client
 * @param contractorId - The contractor ID
 * @param updates - Contractor profile updates
 * @returns Error if present
 */
export async function updateContractorOnboarding(
  client: DbClient,
  contractorId: string,
  updates: {
    business_name?: string | null;
    city?: string | null;
    state?: string | null;
    description?: string | null;
    services?: string[] | null;
    service_areas?: string[] | null;
    address?: string | null;
    postal_code?: string | null;
    phone?: string | null;
    website?: string | null;
    google_place_id?: string | null;
    google_cid?: string | null;
    onboarding_method?: string | null;
  }
): Promise<SupabaseMutationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('contractors')
    .update(updates)
    .eq('id', contractorId);

  return { error: result.error };
}

// =============================================================================
// Project Images Extended Queries
// =============================================================================

/**
 * Insert a project image with all metadata.
 *
 * @param client - Supabase client
 * @param data - Image data with all fields
 * @returns Inserted image
 */
export async function insertProjectImageFull(
  client: DbClient,
  data: {
    project_id: string;
    storage_path: string;
    image_type?: string | null;
    display_order?: number;
    width?: number | null;
    height?: number | null;
  }
): Promise<SupabaseQueryResult<ProjectImage>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('project_images')
    .insert(data)
    .select('*')
    .single();

  return {
    data: result.data as ProjectImage | null,
    error: result.error,
  };
}

/**
 * Update project hero image.
 *
 * @param client - Supabase client
 * @param projectId - The project ID
 * @param contractorId - The contractor ID for ownership
 * @param heroImageId - The new hero image ID
 * @returns Error if present
 */
export async function updateProjectHeroImage(
  client: DbClient,
  projectId: string,
  contractorId: string,
  heroImageId: string
): Promise<SupabaseMutationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any)
    .from('projects')
    .update({ hero_image_id: heroImageId })
    .eq('id', projectId)
    .eq('contractor_id', contractorId);

  return { error: result.error };
}
