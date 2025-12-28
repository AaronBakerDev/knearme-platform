/**
 * Context Loader - Smart context loading for chat sessions (SERVER ONLY).
 *
 * Implements budget-based context loading strategy:
 * - New/short sessions: Load full chat history + project details
 * - Long conversations: Load compacted summary + recent messages + project details
 *
 * This enables resuming conversations without exceeding token limits
 * while preserving important context for the AI.
 *
 * NOTE: This file imports server-side Supabase client. For client-side usage,
 * import types and utilities from './context-shared.ts' instead.
 *
 * @see /supabase/migrations/022_conversation_refactor.sql for schema
 * @see /src/lib/chat/context-compactor.ts for summarization
 * @see /src/lib/chat/context-shared.ts for client-safe types and utilities
 */

import { createClient } from '@/lib/supabase/server';
import type { UIMessage } from 'ai';
import type { ExtractedProjectData } from './chat-types';

// Re-export shared types and utilities for backwards compatibility
export {
  type ProjectContextData,
  type ContextLoadResult,
  createSummarySystemMessage,
  formatProjectDataForPrompt,
} from './context-shared';

// ============================================
// Constants for context budget calculation
// ============================================

/**
 * Maximum tokens to use for conversation context.
 * Conservative limit to leave room for system prompt and response.
 * Gemini 3.0 Flash has 1M context, but we use much less for performance.
 */
export const MAX_CONTEXT_TOKENS = 30_000;

/**
 * Estimated tokens per message (rough average).
 * Actual token count varies, but this gives a reasonable estimate.
 */
export const TOKENS_PER_MESSAGE = 150;

/**
 * Estimated tokens for project data context.
 */
export const PROJECT_DATA_TOKENS = 500;

/**
 * Target size for conversation summary.
 */
export const SUMMARY_TOKENS = 1000;

/**
 * Number of recent messages to always include.
 * Even when using summary, we include recent messages for immediate context.
 */
export const RECENT_MESSAGES_COUNT = 10;

// Types are now defined in ./context-shared.ts and re-exported above
import type { ProjectContextData, ContextLoadResult } from './context-shared';

/**
 * Message part types from Vercel AI SDK.
 * Stored in metadata.parts for tool call visibility.
 */
type UIMessagePart =
  | { type: 'text'; text: string }
  | { type: string; toolCallId?: string; toolName?: string; args?: unknown; result?: unknown; state?: string };

/**
 * Database message format from chat_messages table.
 */
interface DbMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    parts?: UIMessagePart[];
    [key: string]: unknown;
  };
  created_at: string;
}

// ============================================
// Core Functions
// ============================================

/**
 * Determine if conversation should be compacted based on message count.
 *
 * @param messageCount - Number of messages in the session
 * @returns True if compaction is needed
 */
export function shouldCompact(messageCount: number): boolean {
  const estimatedTokens =
    messageCount * TOKENS_PER_MESSAGE + PROJECT_DATA_TOKENS;
  return estimatedTokens > MAX_CONTEXT_TOKENS;
}

/**
 * Estimate token count for a set of messages.
 *
 * @param messageCount - Number of messages
 * @param includeProjectData - Whether project data is included
 * @param includeSummary - Whether a summary is included
 * @returns Estimated token count
 */
export function estimateTokens(
  messageCount: number,
  includeProjectData = true,
  includeSummary = false
): number {
  let tokens = messageCount * TOKENS_PER_MESSAGE;
  if (includeProjectData) tokens += PROJECT_DATA_TOKENS;
  if (includeSummary) tokens += SUMMARY_TOKENS;
  return tokens;
}

/**
 * Load conversation context for a project/session.
 *
 * Strategy:
 * 1. Load project data (always)
 * 2. Get message count to determine loading strategy
 * 3. If fits in budget: load all messages
 * 4. If exceeds budget: load summary + recent messages
 *
 * @param projectId - Project ID to load context for
 * @param sessionId - Session ID to load messages from
 * @returns Context load result with messages and project data
 */
export async function loadConversationContext(
  projectId: string,
  sessionId: string
): Promise<ContextLoadResult> {
  const supabase = await createClient();

  // 1. Load project data
  const projectData = await loadProjectContext(supabase, projectId);

  // 2. Get message count from session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error: sessionError } = await (supabase as any)
    .from('chat_sessions')
    .select('message_count, session_summary')
    .eq('id', sessionId)
    .single();

  if (sessionError) {
    console.error('[ContextLoader] Failed to load session:', sessionError);
    // Return empty context on error
    return {
      projectData,
      messages: [],
      summary: null,
      loadedFully: true,
      estimatedTokens: PROJECT_DATA_TOKENS,
      totalMessageCount: 0,
    };
  }

  const messageCount = session?.message_count || 0;
  const sessionSummary = session?.session_summary || null;

  // 3. Determine loading strategy
  if (!shouldCompact(messageCount)) {
    // Full conversation fits - load all messages
    const messages = await loadAllMessages(supabase, sessionId);
    return {
      projectData,
      messages,
      summary: null,
      loadedFully: true,
      estimatedTokens: estimateTokens(messages.length, true, false),
      totalMessageCount: messageCount,
    };
  }

  // 4. Need compaction - load summary + recent messages
  const summary =
    projectData.conversationSummary || sessionSummary || null;
  const recentMessages = await loadRecentMessages(
    supabase,
    sessionId,
    RECENT_MESSAGES_COUNT
  );

  return {
    projectData,
    messages: recentMessages,
    summary,
    loadedFully: false,
    estimatedTokens: estimateTokens(recentMessages.length, true, !!summary),
    totalMessageCount: messageCount,
  };
}

/**
 * Load project context data.
 *
 * @param supabase - Supabase client
 * @param projectId - Project ID
 * @returns Project context data
 */
async function loadProjectContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  projectId: string
): Promise<ProjectContextData> {
  const { data: project, error } = await supabase
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

  if (error) {
    console.error('[ContextLoader] Failed to load project:', error);
    // Return minimal context on error
    return {
      id: projectId,
      title: null,
      description: null,
      project_type: null,
      city: null,
      state: null,
      materials: null,
      techniques: null,
      status: 'draft',
      extractedData: {},
      conversationSummary: null,
    };
  }

  return {
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
}

/**
 * Load all messages from a session.
 *
 * @param supabase - Supabase client
 * @param sessionId - Session ID
 * @returns Array of UI messages
 */
async function loadAllMessages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  sessionId: string
): Promise<UIMessage[]> {
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, metadata, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[ContextLoader] Failed to load messages:', error);
    return [];
  }

  return (messages || []).map(dbMessageToUIMessage);
}

/**
 * Load recent messages from a session.
 *
 * @param supabase - Supabase client
 * @param sessionId - Session ID
 * @param limit - Maximum number of messages to load
 * @returns Array of UI messages (most recent)
 */
async function loadRecentMessages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  sessionId: string,
  limit: number
): Promise<UIMessage[]> {
  // Load recent messages in descending order, then reverse
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, metadata, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[ContextLoader] Failed to load recent messages:', error);
    return [];
  }

  // Reverse to get chronological order
  return (messages || []).reverse().map(dbMessageToUIMessage);
}

/**
 * Convert database message to Vercel AI SDK UIMessage format.
 *
 * Reconstructs the full parts array from metadata if stored,
 * otherwise falls back to text-only parts for legacy messages.
 *
 * @param dbMsg - Database message
 * @returns UI message for AI SDK
 */
function dbMessageToUIMessage(dbMsg: DbMessage): UIMessage {
  // Check if parts are stored in metadata (new format with tool visibility)
  const storedParts = dbMsg.metadata?.parts;

  if (storedParts && Array.isArray(storedParts) && storedParts.length > 0) {
    // Return stored parts (includes tool-call, tool-result, text, etc.)
    return {
      id: dbMsg.id,
      role: dbMsg.role,
      // Cast to any to satisfy UIMessage type - parts structure matches SDK
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parts: storedParts as any,
    };
  }

  // Fallback for legacy messages without stored parts
  return {
    id: dbMsg.id,
    role: dbMsg.role,
    parts: [{ type: 'text', text: dbMsg.content }],
  };
}

// createSummarySystemMessage is now in ./context-shared.ts

/**
 * Update session message count after saving messages.
 *
 * Call this after saving new messages to keep count accurate.
 *
 * @param sessionId - Session ID
 * @param newCount - Updated message count
 */
export async function updateSessionMessageCount(
  sessionId: string,
  newCount: number
): Promise<void> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('chat_sessions')
    .update({
      message_count: newCount,
      estimated_tokens: estimateTokens(newCount, true, false),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('[ContextLoader] Failed to update message count:', error);
  }
}

// formatProjectDataForPrompt is now in ./context-shared.ts
