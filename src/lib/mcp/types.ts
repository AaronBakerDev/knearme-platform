/**
 * MCP type definitions for the KnearMe contractor ChatGPT app.
 *
 * @see /docs/chatgpt-apps-sdk/MCP_CONTRACTOR_INTERFACE.md
 */

// ============================================================================
// SHARED TYPES
// ============================================================================

export interface ProjectImageOutput {
  id: string;
  url: string;
  image_type: 'before' | 'after' | 'progress' | 'detail' | null;
  alt_text: string | null;
  display_order: number;
}

export type ProjectStatus = 'draft' | 'published' | 'archived';
export type ClientType = 'residential' | 'commercial' | 'municipal' | 'other';
export type BudgetRange = '<5k' | '5k-10k' | '10k-25k' | '25k-50k' | '50k+';

export interface ProjectOutput {
  id: string;
  title: string | null;
  description: string | null;
  project_type: string | null;
  project_type_slug: string | null;
  city: string | null;
  state: string | null;
  city_slug: string | null;
  status: ProjectStatus;
  slug: string | null;
  summary: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  outcome_highlights: string[] | null;
  hero_image_id: string | null;
  client_type: ClientType | null;
  budget_range: BudgetRange | null;
  materials: string[] | null;
  techniques: string[] | null;
  duration: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ProjectWithImages extends ProjectOutput {
  images: ProjectImageOutput[];
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthContext {
  contractorId: string;
  accessToken: string;
}

export interface TokenPayload {
  sub: string;
  contractor_id: string;
  email: string;
  iat: number;
  exp: number;
}

// ============================================================================
// MCP PROTOCOL TYPES
// ============================================================================

export interface McpRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface McpResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// ============================================================================
// WIDGET TYPES
// ============================================================================

export interface WidgetMetaFields {
  'openai/widgetCSP'?: {
    connect_domains?: string[];
    resource_domains?: string[];
    frame_domains?: string[];
  };
  'openai/widgetDomain'?: string;
  'openai/widgetPrefersBorder'?: boolean;
  'openai/outputTemplate'?: string;
  widgetTemplate?: string;
  widgetData?: unknown;
}

// ============================================================================
// TOOL OUTPUT TYPES
// ============================================================================

export interface CreateProjectDraftOutput {
  structuredContent: {
    project_id: string;
    missing_fields: string[];
  };
  _meta: { project: ProjectOutput } & WidgetMetaFields;
}

export interface AddProjectMediaOutput {
  structuredContent: {
    project_id: string;
    media_count: number;
    missing_fields: string[];
    upload_status?: string;
    upload_errors?: Array<{ url: string; error: string }>;
  };
  _meta: { images: ProjectImageOutput[] } & WidgetMetaFields;
}

export interface MediaUpdateOutput {
  structuredContent: {
    project_id: string;
    status: 'ok';
  };
  _meta: { images: ProjectImageOutput[] } & WidgetMetaFields;
}

export interface UpdateProjectSectionsOutput {
  structuredContent: {
    project_id: string;
    missing_fields: string[];
  };
  _meta: { project: ProjectOutput } & WidgetMetaFields;
}

export interface UpdateProjectMetaOutput {
  structuredContent: {
    project_id: string;
    status: 'ok';
  };
  _meta: { project: ProjectOutput } & WidgetMetaFields;
}

export interface FinalizeProjectOutput {
  structuredContent: {
    project_id: string;
    status: 'published';
    url: string;
  };
  _meta: { project: ProjectWithImages } & WidgetMetaFields;
}

export interface ListContractorProjectsOutput {
  structuredContent: {
    count: number;
    has_more: boolean;
  };
  _meta: { projects: ProjectOutput[] } & WidgetMetaFields;
}

export interface GetProjectStatusOutput {
  structuredContent: {
    project_id: string;
    status: ProjectStatus;
    missing_fields: string[];
    can_publish: boolean;
  };
  _meta: { project: ProjectWithImages } & WidgetMetaFields;
}
