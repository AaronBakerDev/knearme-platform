/**
 * Type definitions for the chat-based project creation wizard.
 *
 * The chat wizard uses a conversational interface to gather project
 * information before image upload, making AI analysis more contextual.
 *
 * @see /docs/03-architecture/c4-container.md for AI pipeline flow
 */

import type { UploadedImage } from '@/components/upload/ImageUploader';

// Re-export for convenience
export type { UploadedImage };

/** Message sender role */
export type MessageRole = 'user' | 'assistant' | 'system';

/** Type of message content for rendering */
export type MessageType =
  | 'text'           // Regular text message
  | 'image-upload'   // Inline image uploader prompt
  | 'quick-reply'    // Message with quick reply options
  | 'content-preview' // Generated content card for review
  | 'action';        // Action button (publish, save draft)

/** Quick reply suggestion button */
export interface QuickReply {
  id: string;
  label: string;
  value: string;
}

/** Action button in chat */
export interface ChatAction {
  type: 'upload-images' | 'regenerate' | 'publish' | 'save-draft' | 'edit';
  label: string;
}

/**
 * Individual chat message.
 *
 * Messages flow in order and are rendered as bubbles.
 * Metadata varies by message type.
 */
export interface ChatMessage {
  /** Unique message ID */
  id: string;
  /** Who sent the message */
  role: MessageRole;
  /** Type determines rendering style */
  type: MessageType;
  /** Text content of the message */
  content: string;
  /** ISO timestamp */
  timestamp: string;
  /** Optional metadata for special message types */
  metadata?: {
    /** Attached images (for image-upload type) */
    images?: UploadedImage[];
    /** Quick reply options (for quick-reply type) */
    quickReplies?: QuickReply[];
    /** Generated content (for content-preview type) */
    contentPreview?: GeneratedContent;
    /** Action button (for action type) */
    action?: ChatAction;
  };
}

/**
 * Project data extracted from conversation via OpenAI function calling.
 *
 * The AI extracts this structured data from natural conversation,
 * which is then used to enhance image analysis and content generation.
 *
 * IMPORTANT: city and state are required for publishing.
 * @see /src/app/api/projects/[id]/publish/route.ts for server requirements
 */
export interface ExtractedProjectData {
  /** Detected project type (chimney, tuckpointing, etc.) */
  project_type?: string;
  /** What problem the customer had */
  customer_problem?: string;
  /** How the contractor solved it */
  solution_approach?: string;
  /** Materials mentioned in conversation */
  materials_mentioned?: string[];
  /** Techniques or methods used */
  techniques_mentioned?: string[];
  /** How long the project took */
  duration?: string;
  /** Project location (city, state) - deprecated, use city+state */
  location?: string;
  /** City where project was done (required for SEO URL) */
  city?: string;
  /** State/province where project was done (required for SEO URL) */
  state?: string;
  /** Any challenges faced */
  challenges?: string;
  /** What contractor is most proud of */
  proud_of?: string;
  /** AI determined enough info to proceed to images */
  ready_for_images?: boolean;
}

/**
 * Generated portfolio content from AI.
 *
 * This is the final output that gets saved to the project.
 */
export interface GeneratedContent {
  /** SEO-optimized project title */
  title: string;
  /** Long-form project description (400-600 words) */
  description: string;
  /** SEO meta title */
  seo_title: string;
  /** SEO meta description */
  seo_description: string;
  /** Relevant tags for categorization */
  tags: string[];
  /** Materials used */
  materials: string[];
  /** Techniques demonstrated */
  techniques: string[];
}

/**
 * Wizard phases - tracks overall progress.
 *
 * @deprecated Phase tracking is now informational only, not for gating.
 * The model decides what to do based on conversation context.
 * All UI controls are always available regardless of phase.
 *
 * Kept for:
 * - Backwards compatibility with session persistence
 * - Analytics and observability
 * - Visual progress indicators (non-blocking)
 *
 * @see /docs/philosophy/agent-philosophy.md
 */
export type ChatPhase =
  | 'conversation'  // Gathering project info via chat
  | 'uploading'     // User is uploading images
  | 'analyzing'     // GPT-4V analyzing images
  | 'generating'    // GPT-4o generating content
  | 'review'        // User reviewing generated content
  | 'published';    // Project published successfully

/**
 * Complete chat session state.
 *
 * Persisted to IndexedDB for recovery if user navigates away.
 */
export interface ChatSession {
  /** Unique session ID */
  id: string;
  /** Associated project ID */
  projectId: string;
  /** Conversation history */
  messages: ChatMessage[];
  /** Structured data extracted from chat */
  extractedData: ExtractedProjectData;
  /** Uploaded images */
  images: UploadedImage[];
  /** Generated content (after generation phase) */
  generatedContent?: GeneratedContent;
  /** Current wizard phase */
  phase: ChatPhase;
  /** ISO timestamp when created */
  createdAt: string;
  /** ISO timestamp when last updated */
  updatedAt: string;
}

/**
 * Streaming chunk from chat API.
 *
 * Server-Sent Events format for real-time streaming.
 */
export interface ChatStreamChunk {
  /** Type of chunk */
  type: 'text' | 'function_call' | 'error' | 'done';
  /** Text content (for text type) */
  content?: string;
  /** Function call name (for function_call type) */
  functionName?: string;
  /** Function call arguments (for function_call type) */
  functionArgs?: ExtractedProjectData;
  /** Error message (for error type) */
  error?: string;
}

/**
 * Request payload for chat API.
 */
export interface ChatRequest {
  /** Conversation history */
  messages: ChatMessage[];
  /** Project ID */
  projectId: string;
  /** Current phase */
  phase: ChatPhase;
  /** Extracted data so far (for context) */
  extractedData?: ExtractedProjectData;
  /** Image analysis results (for generating phase) */
  imageAnalysis?: Record<string, unknown>;
}

/**
 * Context provided to tool execute functions.
 *
 * This context enables tools to perform database operations, check permissions,
 * and access user-specific data. It is provided via closure when creating tools
 * in the chat route handlers.
 *
 * ## Usage Pattern
 *
 * Tools should receive context via closure, not execution args:
 *
 * ```typescript
 * // In route handler after auth:
 * const context: ToolContext = {
 *   userId: auth.user.id,
 *   businessId: auth.business.id,
 *   projectId: requestBody.projectId,  // from request
 *   sessionId: requestBody.sessionId,  // from request
 * };
 *
 * // Create tool with context in closure:
 * const myTool = tool({
 *   description: '...',
 *   inputSchema: z.object({ ... }),
 *   execute: async (args) => {
 *     // Context available via closure
 *     const { data } = await supabase
 *       .from('projects')
 *       .select('*')
 *       .eq('id', context.projectId)
 *       .eq('business_id', context.businessId)
 *       .single();
 *     return { ...args, data };
 *   },
 * });
 * ```
 *
 * ## Why Closure Over Execution Args
 *
 * The Vercel AI SDK's tool execute function only receives the model's
 * output (args). Context must be provided via closure because:
 *
 * 1. Security: Model can't manipulate context (userId, businessId)
 * 2. Type safety: Context is typed separately from tool input schema
 * 3. Consistency: Same pattern as other Next.js route handlers
 *
 * @see /src/app/api/chat/route.ts - Main chat route
 * @see /src/app/api/chat/edit/route.ts - Legacy edit route (forwards to unified chat)
 * @see https://ai-sdk.dev/docs/ai-sdk-core/tools - Vercel AI SDK tools
 */
export interface ToolContext {
  /**
   * Current project ID (optional - may not exist in create flow).
   * Used for project-specific operations like image upload, content save.
   */
  projectId?: string;

  /**
   * Current chat session ID (optional - may be creating new session).
   * Used for persisting conversation state and extracted data.
   */
  sessionId?: string;

  /**
   * Authenticated user's Supabase auth.users ID.
   * Always required - tools should never execute without auth.
   */
  userId: string;

  /**
   * Authenticated user's business ID from businesses table.
   * Always required - used for RLS and data access.
   */
  businessId: string;
}
