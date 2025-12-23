/**
 * MCP type definitions for the KnearMe contractor ChatGPT app.
 *
 * @see /docs/chatgpt-apps-sdk/MCP_CONTRACTOR_INTERFACE.md
 */

// ============================================================================
// SHARED TYPES
// ============================================================================

/**
 * Project narrative sections used across multiple tools.
 */
export interface ProjectNarrative {
  summary?: string | null;
  challenge?: string | null;
  solution?: string | null;
  results?: string | null;
  outcome_highlights?: string[] | null;
}

/**
 * Image object returned in tool responses.
 */
export interface ProjectImageOutput {
  id: string;
  url: string;
  image_type: 'before' | 'after' | 'progress' | 'detail' | null;
  alt_text: string | null;
  display_order: number;
}

/**
 * Project status enum.
 */
export type ProjectStatus = 'draft' | 'published' | 'archived';

/**
 * Client type enum.
 */
export type ClientType = 'residential' | 'commercial' | 'municipal' | 'other';

/**
 * Budget range enum.
 */
export type BudgetRange = '<5k' | '5k-10k' | '10k-25k' | '25k-50k' | '50k+';

/**
 * Project object returned in tool responses.
 */
export interface ProjectOutput {
  id: string;
  title: string | null;
  description: string | null;
  project_type: string | null;
  city: string | null;
  state: string | null;
  status: ProjectStatus;
  slug: string | null;
  // Narrative fields
  summary: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  outcome_highlights: string[] | null;
  // Media
  hero_image_id: string | null;
  // Context
  client_type: ClientType | null;
  budget_range: BudgetRange | null;
  // Metadata
  materials: string[] | null;
  techniques: string[] | null;
  duration: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

/**
 * Project with images (full response).
 */
export interface ProjectWithImages extends ProjectOutput {
  images: ProjectImageOutput[];
}

// ============================================================================
// TOOL INPUT TYPES
// ============================================================================

/**
 * Input for create_project_draft tool.
 */
export interface CreateProjectDraftInput {
  project_type?: string;
  city?: string;
  state?: string;
  summary?: string;
  challenge?: string;
  solution?: string;
  results?: string;
  outcome_highlights?: string[];
}

/**
 * Input for add_project_media tool.
 */
export interface AddProjectMediaInput {
  project_id: string;
  files: Array<{
    file_id: string;
    filename: string;
    content_type: string;
    image_type?: 'before' | 'after' | 'progress' | 'detail';
  }>;
}

/**
 * Input for reorder_project_media tool.
 */
export interface ReorderProjectMediaInput {
  project_id: string;
  image_ids: string[];
}

/**
 * Input for set_project_hero_media tool.
 */
export interface SetProjectHeroMediaInput {
  project_id: string;
  hero_image_id: string;
}

/**
 * Input for set_project_media_labels tool.
 */
export interface SetProjectMediaLabelsInput {
  project_id: string;
  labels: Array<{
    image_id: string;
    image_type?: 'before' | 'after' | 'progress' | 'detail' | null;
    alt_text?: string | null;
  }>;
}

/**
 * Input for update_project_sections tool.
 */
export interface UpdateProjectSectionsInput {
  project_id: string;
  summary?: string;
  challenge?: string;
  solution?: string;
  results?: string;
  outcome_highlights?: string[];
}

/**
 * Input for update_project_meta tool.
 */
export interface UpdateProjectMetaInput {
  project_id: string;
  title?: string;
  project_type?: string;
  city?: string;
  state?: string;
  duration?: string;
  tags?: string[];
  materials?: string[];
  techniques?: string[];
  seo_title?: string;
  seo_description?: string;
}

/**
 * Input for finalize_project tool.
 */
export interface FinalizeProjectInput {
  project_id: string;
}

/**
 * Input for list_contractor_projects tool.
 */
export interface ListContractorProjectsInput {
  status?: ProjectStatus;
  limit?: number;
  offset?: number;
}

/**
 * Input for get_project_status tool.
 */
export interface GetProjectStatusInput {
  project_id: string;
}

// ============================================================================
// TOOL OUTPUT TYPES
// ============================================================================

/**
 * Widget metadata fields added to _meta for ChatGPT rendering.
 * These fields enable widget UI rendering via the outputTemplate system.
 *
 * @see /docs/chatgpt-apps-sdk/BUILDING.md - Resource registration
 */
export interface WidgetMetaFields {
  /** CSP policy for widget network requests */
  'openai/widgetCSP'?: {
    connect_domains?: string[];
    resource_domains?: string[];
    frame_domains?: string[];
  };
  /** Domain for fullscreen widget */
  'openai/widgetDomain'?: string;
  /** Widget styling preference */
  'openai/widgetPrefersBorder'?: boolean;
  /** Resource template URI */
  'openai/outputTemplate'?: string;
  /** Widget template to render */
  widgetTemplate?: string;
  /** Data passed to widget */
  widgetData?: unknown;
}

/**
 * Standard MCP tool response structure.
 * structuredContent is for the LLM, _meta is for the UI widget only.
 */
export interface McpToolResponse<T = unknown, M = unknown> {
  structuredContent: T;
  _meta?: M;
}

/**
 * Output for create_project_draft tool.
 */
export interface CreateProjectDraftOutput {
  structuredContent: {
    project_id: string;
    missing_fields: string[];
  };
  _meta: { project: ProjectOutput } & WidgetMetaFields;
}

/**
 * Output for add_project_media tool.
 */
export interface AddProjectMediaOutput {
  structuredContent: {
    project_id: string;
    media_count: number;
    missing_fields: string[];
  };
  _meta: { images: ProjectImageOutput[] } & WidgetMetaFields;
}

/**
 * Output for reorder/hero/labels tools.
 */
export interface MediaUpdateOutput {
  structuredContent: {
    project_id: string;
    status: 'ok';
  };
  _meta: { images: ProjectImageOutput[] } & WidgetMetaFields;
}

/**
 * Output for update_project_sections tool.
 */
export interface UpdateProjectSectionsOutput {
  structuredContent: {
    project_id: string;
    missing_fields: string[];
  };
  _meta: { project: ProjectOutput } & WidgetMetaFields;
}

/**
 * Output for update_project_meta tool.
 */
export interface UpdateProjectMetaOutput {
  structuredContent: {
    project_id: string;
    status: 'ok';
  };
  _meta: { project: ProjectOutput } & WidgetMetaFields;
}

/**
 * Output for finalize_project tool.
 */
export interface FinalizeProjectOutput {
  structuredContent: {
    project_id: string;
    status: 'published';
    url: string;
  };
  _meta: { project: ProjectWithImages } & WidgetMetaFields;
}

/**
 * Output for list_contractor_projects tool.
 */
export interface ListContractorProjectsOutput {
  structuredContent: {
    count: number;
    has_more: boolean;
  };
  _meta: { projects: ProjectOutput[] } & WidgetMetaFields;
}

/**
 * Output for get_project_status tool.
 */
export interface GetProjectStatusOutput {
  structuredContent: {
    project_id: string;
    status: ProjectStatus;
    missing_fields: string[];
    can_publish: boolean;
  };
  _meta: { project: ProjectWithImages } & WidgetMetaFields;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

/**
 * Authenticated contractor context passed to tools.
 */
export interface AuthContext {
  contractorId: string;
  accessToken: string;
}

/**
 * OAuth token payload.
 */
export interface TokenPayload {
  sub: string; // Supabase user ID
  contractor_id: string;
  email: string;
  iat: number;
  exp: number;
}
