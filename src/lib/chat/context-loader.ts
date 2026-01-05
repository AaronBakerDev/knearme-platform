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

import type { UIMessage } from 'ai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import type { Database } from '@/types/database';
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

export interface ContextLoadOptions {
  /** Hard cap on message count for UI loading. */
  maxMessages?: number;
  /** Override for the number of recent messages to include when compacting. */
  recentMessagesCount?: number;
}

// Types are now defined in ./context-shared.ts and re-exported above
import type { ProjectContextData, ContextLoadResult } from './context-shared';

/**
 * Message part types from Vercel AI SDK.
 * Stored in metadata.parts for tool call visibility.
 */
type MessageParts = UIMessage['parts'];

type ChatMessageMetadata = {
  parts?: MessageParts;
  [key: string]: unknown;
};

type ChatSessionRow = {
  id: string;
  message_count: number | null;
  session_summary: string | null;
  estimated_tokens: number | null;
};

type ChatSessionInsert = {
  id?: string;
  message_count?: number | null;
  session_summary?: string | null;
  estimated_tokens?: number | null;
};

type ChatSessionUpdate = {
  message_count?: number | null;
  session_summary?: string | null;
  estimated_tokens?: number | null;
  updated_at?: string | null;
};

type ChatMessageRow = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: ChatMessageMetadata | null;
  created_at: string;
};

type ChatMessageInsert = {
  id?: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: ChatMessageMetadata | null;
  created_at?: string;
};

type ChatMessageUpdate = {
  content?: string;
  metadata?: ChatMessageMetadata | null;
  updated_at?: string | null;
};

type ChatDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      chat_sessions: {
        Row: ChatSessionRow;
        Insert: ChatSessionInsert;
        Update: ChatSessionUpdate;
      };
      chat_messages: {
        Row: ChatMessageRow;
        Insert: ChatMessageInsert;
        Update: ChatMessageUpdate;
      };
    };
  };
};

type ChatSupabaseClient = SupabaseClient<ChatDatabase>;

/**
 * Database message format from chat_messages table.
 */
type DbMessage = ChatMessageRow;

// ============================================
// Core Functions
// ============================================

/**
 * Determine if conversation should be compacted based on message count.
 *
 * @param messageCount - Number of messages in the session
 * @param estimatedTokens - Optional precomputed token estimate
 * @returns True if compaction is needed
 */
export function shouldCompact(
  messageCount: number,
  estimatedTokens?: number
): boolean {
  const tokenEstimate =
    typeof estimatedTokens === 'number'
      ? estimatedTokens
      : messageCount * TOKENS_PER_MESSAGE + PROJECT_DATA_TOKENS;
  return tokenEstimate > MAX_CONTEXT_TOKENS;
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
 * Estimate token count for a single message payload.
 * Uses JSON size of parts when available to account for tool outputs.
 *
 * @param content - Plain text content of the message
 * @param parts - Structured parts stored alongside the message
 * @returns Estimated token count for the message
 */
export function estimateMessageTokens(
  content: string,
  parts?: MessageParts
): number {
  if (Array.isArray(parts) && parts.length > 0) {
    try {
      return Math.max(1, Math.ceil(JSON.stringify(parts).length / 4));
    } catch (error) {
      logger.warn('[ContextLoader] Failed to stringify message parts', {
        error,
      });
    }
  }

  const text = typeof content === 'string' ? content : '';
  return Math.max(1, Math.ceil(text.length / 4));
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
 * @param options - Optional limits for context loading
 * @returns Context load result with messages and project data
 *
 * @example
 * ```ts
 * const context = await loadConversationContext(projectId, sessionId, {
 *   maxMessages: 25,
 *   recentMessagesCount: 8,
 * });
 * ```
 */
export async function loadConversationContext(
  projectId: string,
  sessionId: string,
  options: ContextLoadOptions = {}
): Promise<ContextLoadResult> {
  const supabase = (await createClient()) as ChatSupabaseClient;

  // 1. Load project data
  const projectData = await loadProjectContext(supabase, projectId);

  // 2. Get message count from session
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('message_count, session_summary, estimated_tokens')
    .eq('id', sessionId)
    .single();

  if (sessionError) {
    logger.error('[ContextLoader] Failed to load session', {
      error: sessionError,
      sessionId,
    });
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
  const sessionEstimatedTokens =
    typeof session?.estimated_tokens === 'number'
      ? session.estimated_tokens
      : estimateTokens(messageCount, true, false);
  const maxMessages = options.maxMessages ?? Number.POSITIVE_INFINITY;
  const recentMessagesCount = options.recentMessagesCount ?? RECENT_MESSAGES_COUNT;

  // 3. Determine loading strategy
  if (!shouldCompact(messageCount, sessionEstimatedTokens) && messageCount <= maxMessages) {
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
  const recentLimit = Number.isFinite(maxMessages)
    ? Math.min(recentMessagesCount, maxMessages)
    : recentMessagesCount;
  const recentMessages = await loadRecentMessages(
    supabase,
    sessionId,
    recentLimit
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
  supabase: ChatSupabaseClient,
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
    logger.error('[ContextLoader] Failed to load project', {
      error,
      projectId,
    });
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
  supabase: ChatSupabaseClient,
  sessionId: string
): Promise<UIMessage[]> {
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, metadata, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('[ContextLoader] Failed to load messages', {
      error,
      sessionId,
    });
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
  supabase: ChatSupabaseClient,
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
    logger.error('[ContextLoader] Failed to load recent messages', {
      error,
      sessionId,
    });
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
      parts: storedParts,
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
 * @param estimatedTokens - Optional updated token estimate
 * @returns Promise that resolves when the session is updated
 */
export async function updateSessionMessageCount(
  sessionId: string,
  newCount: number,
  estimatedTokens?: number
): Promise<void> {
  const supabase = (await createClient()) as ChatSupabaseClient;

  const { error } = await supabase
    .from('chat_sessions')
    .update({
      message_count: newCount,
      estimated_tokens:
        typeof estimatedTokens === 'number'
          ? estimatedTokens
          : estimateTokens(newCount, true, false),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    logger.error('[ContextLoader] Failed to update message count', {
      error,
      sessionId,
    });
  }
}

// formatProjectDataForPrompt is now in ./context-shared.ts
