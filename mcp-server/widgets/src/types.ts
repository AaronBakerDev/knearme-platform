/**
 * TypeScript types for KnearMe ChatGPT Widget.
 *
 * Defines the window.openai API interface and data structures
 * passed from MCP tool responses.
 *
 * @see https://developers.openai.com/apps-sdk/build/chatgpt-ui
 */

// ============================================================================
// WINDOW.OPENAI API TYPES
// ============================================================================

/**
 * Display mode options for widget layout.
 */
export type DisplayMode = 'inline' | 'pip' | 'fullscreen';

/**
 * Theme from ChatGPT host.
 */
export type Theme = 'light' | 'dark';

/**
 * Content Security Policy configuration.
 */
export interface WidgetCSP {
  connect_domains: string[];
  resource_domains: string[];
  frame_domains: string[];
  redirect_domains?: string[];
}

/**
 * OpenAI global state available on window.openai.
 */
export interface OpenAiGlobals {
  // Tool data
  toolInput: Record<string, unknown>;
  toolOutput: ToolOutput;
  toolResponseMetadata: ToolResponseMetadata;

  // Widget state
  widgetState: Record<string, unknown> | null;

  // Context signals
  theme: Theme;
  displayMode: DisplayMode;
  maxHeight: number;
  safeArea: { top: number; bottom: number; left: number; right: number };
  view: 'chat' | 'modal' | 'pip';
  userAgent: string;
  locale: string;
}

/**
 * OpenAI runtime API available on window.openai.
 */
export interface OpenAiApi extends OpenAiGlobals {
  // State management
  setWidgetState: (state: Record<string, unknown>) => void;

  // Tool invocation
  callTool: (name: string, args: Record<string, unknown>) => Promise<void>;

  // Messaging
  sendFollowUpMessage: (options: { prompt: string }) => Promise<void>;

  // File handling
  uploadFile: (file: File) => Promise<{ fileId: string }>;
  getFileDownloadUrl: (options: { fileId: string }) => Promise<{ downloadUrl: string }>;

  // Layout
  requestDisplayMode: (options: { mode: DisplayMode }) => Promise<void>;
  requestModal: (options: { url: string }) => void;
  requestClose: () => void;
  notifyIntrinsicHeight: (height: number) => void;

  // External links
  openExternal: (options: { href: string }) => void;
}

declare global {
  interface Window {
    openai?: OpenAiApi;
    __WIDGET_DATA__?: WidgetData;
  }
}

// ============================================================================
// TOOL RESPONSE TYPES
// ============================================================================

/**
 * Metadata from MCP tool response (_meta field).
 */
export interface ToolResponseMetadata {
  widgetTemplate: WidgetTemplate;
  widgetData?: unknown;
  'openai/widgetCSP'?: WidgetCSP;
  'openai/widgetDomain'?: string;
  'openai/widgetPrefersBorder'?: boolean;
  'openai/widgetSessionId'?: string;
  'openai/closeWidget'?: boolean;
  'openai/outputTemplate'?: string;
}

/**
 * Widget template types.
 */
export type WidgetTemplate =
  | 'project-draft'
  | 'project-status'
  | 'project-media'
  | 'project-list';

/**
 * Legacy widget data format (for inline HTML widget).
 */
export interface WidgetData {
  template: WidgetTemplate;
  data: unknown;
}

// ============================================================================
// PROJECT DATA TYPES
// ============================================================================

/**
 * Project status values.
 */
export type ProjectStatus = 'draft' | 'published' | 'archived';

/**
 * Image type labels for project images.
 */
export type ImageType = 'before' | 'after' | 'progress' | 'detail' | 'hero';

/**
 * Project image from the portfolio API.
 */
export interface ProjectImage {
  id: string;
  url: string;
  image_type: ImageType | null;
  alt_text: string | null;
  display_order: number;
  storage_path: string;
}

/**
 * Project data from the portfolio API.
 */
export interface Project {
  id: string;
  contractor_id: string;
  title: string | null;
  status: ProjectStatus;
  project_type: string | null;
  project_type_slug: string | null;
  city: string | null;
  city_slug: string | null;
  state: string | null;
  state_slug: string | null;
  summary: string | null;
  description: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  outcome_highlights: string[] | null;
  hero_image_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

/**
 * Tool output for project-draft and project-status templates.
 */
export interface ProjectToolOutput {
  project: Project;
  images: ProjectImage[];
  missing_fields?: string[];
  can_publish?: boolean;
  public_url?: string;
}

/**
 * Tool output for project-media template.
 */
export interface MediaToolOutput {
  project_id: string;
  images: ProjectImage[];
  hero_image_id: string | null;
}

/**
 * Tool output for project-list template.
 */
export interface ProjectListToolOutput {
  projects: Array<{
    id: string;
    title: string | null;
    status: ProjectStatus;
    project_type: string | null;
    city: string | null;
    state: string | null;
    image_count: number;
    updated_at: string;
  }>;
  total: number;
  offset: number;
  limit: number;
}

/**
 * Union type for all possible tool outputs.
 */
export type ToolOutput =
  | ProjectToolOutput
  | MediaToolOutput
  | ProjectListToolOutput
  | Record<string, unknown>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props for PortfolioPreview component.
 */
export interface PortfolioPreviewProps {
  project: Project;
  images: ProjectImage[];
  missingFields?: string[];
  canPublish?: boolean;
  publicUrl?: string;
}

/**
 * Props for MediaGrid component.
 */
export interface MediaGridProps {
  projectId: string;
  images: ProjectImage[];
  heroImageId: string | null;
  onReorder?: (imageIds: string[]) => void;
  onSetHero?: (imageId: string) => void;
}

/**
 * Props for ProjectList component.
 */
export interface ProjectListProps {
  projects: ProjectListToolOutput['projects'];
  total: number;
  onLoadMore?: () => void;
}
