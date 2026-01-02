/**
 * Context Compactor - Creates intelligent summaries for long conversations.
 *
 * When conversation history exceeds the context budget, this module
 * generates a summary that preserves:
 * - Key facts about the project
 * - User preferences and corrections
 * - Current state (what's been discussed, what's pending)
 * - Any critical context for content generation
 *
 * @see /src/lib/chat/context-loader.ts for loading strategy
 * @see /src/app/api/ai/summarize-conversation/route.ts for API endpoint
 */

import { createClient } from '@/lib/supabase/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import type { UIMessage } from 'ai';
import type { ProjectContextData } from './context-loader';

// ============================================
// Types
// ============================================

/**
 * Summary result from compaction.
 */
export interface CompactionResult {
  /** Generated summary of the conversation */
  summary: string;
  /** Key facts extracted from the conversation */
  keyFacts: string[];
  /** Estimated token count of the summary */
  estimatedTokens: number;
}

// ============================================
// Core Functions
// ============================================

/**
 * Generate a summary of a long conversation.
 *
 * Uses Gemini to create a concise summary that preserves
 * important context for future interactions.
 *
 * @param messages - Full message history to summarize
 * @param projectData - Current project data for context
 * @returns Compaction result with summary and key facts
 *
 * @example
 * ```ts
 * const result = await compactConversation(messages, projectData);
 * console.log(result.summary);
 * ```
 */
export async function compactConversation(
  messages: UIMessage[],
  projectData: ProjectContextData
): Promise<CompactionResult> {
  // Build the conversation text for summarization
  const conversationText = messages
    .filter((m) => m.role !== 'system')
    .map((m) => {
      const role = m.role === 'user' ? 'User' : 'Assistant';
      const content =
        m.parts
          ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join('\n') || '';
      return `${role}: ${content}`;
    })
    .join('\n\n');

  // Build project context
  const projectContext = buildProjectContext(projectData);

  // Generate summary using Gemini
  const prompt = buildSummarizationPrompt(conversationText, projectContext);

  try {
    // Generate summary (Gemini handles output length naturally)
    const result = await generateText({
      model: google('gemini-2.0-flash'),
      prompt,
    });

    // Parse the response
    const parsed = parseSummaryResponse(result.text);

    return {
      summary: parsed.summary,
      keyFacts: parsed.keyFacts,
      estimatedTokens: Math.ceil(parsed.summary.length / 4), // Rough estimate
    };
  } catch (error) {
    console.error('[ContextCompactor] Failed to generate summary:', error);
    // Return a basic fallback summary
    return {
      summary: `Previous conversation about ${projectData.project_type || 'project'} in ${projectData.city || 'unknown location'}. ${messages.length} messages exchanged.`,
      keyFacts: [],
      estimatedTokens: 50,
    };
  }
}

/**
 * Save conversation summary to both project and session.
 *
 * @param projectId - Project ID
 * @param sessionId - Session ID
 * @param summary - Generated summary
 * @returns Promise that resolves after persistence attempts
 */
export async function saveConversationSummary(
  projectId: string,
  sessionId: string,
  summary: string
): Promise<void> {
  const supabase = await createClient();

  // Update project with summary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: projectError } = await (supabase as any)
    .from('projects')
    .update({
      conversation_summary: summary,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (projectError) {
    console.error(
      '[ContextCompactor] Failed to save project summary:',
      projectError
    );
  }

  // Update session with summary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: sessionError } = await (supabase as any)
    .from('chat_sessions')
    .update({
      session_summary: summary,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (sessionError) {
    console.error(
      '[ContextCompactor] Failed to save session summary:',
      sessionError
    );
  }
}

/**
 * Check if a session needs compaction based on message count.
 *
 * @param sessionId - Session ID to check
 * @returns True if compaction is recommended
 */
export async function needsCompaction(sessionId: string): Promise<boolean> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error } = await (supabase as any)
    .from('chat_sessions')
    .select('message_count, session_summary')
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    return false;
  }

  // Need compaction if:
  // 1. Message count exceeds threshold
  // 2. No summary exists yet
  const COMPACTION_THRESHOLD = 50; // ~50 messages ≈ 7500 tokens
  return (
    session.message_count > COMPACTION_THRESHOLD && !session.session_summary
  );
}

// ============================================
// Helper Functions
// ============================================

/**
 * Build project context string for summarization.
 */
function buildProjectContext(projectData: ProjectContextData): string {
  const parts: string[] = [];

  if (projectData.project_type) {
    parts.push(`Project type: ${projectData.project_type}`);
  }
  if (projectData.city && projectData.state) {
    parts.push(`Location: ${projectData.city}, ${projectData.state}`);
  }
  if (projectData.title) {
    parts.push(`Title: ${projectData.title}`);
  }
  if (projectData.status) {
    parts.push(`Status: ${projectData.status}`);
  }

  return parts.length > 0 ? parts.join('\n') : 'No project data available';
}

/**
 * Build the prompt for summarization.
 */
function buildSummarizationPrompt(
  conversationText: string,
  projectContext: string
): string {
  return `You are summarizing a conversation between a contractor and an AI assistant about a portfolio project.

## Current Project State
${projectContext}

## Conversation to Summarize
${conversationText}

## Instructions
Create a concise summary (2-4 paragraphs) that captures:
1. What was discussed about the project
2. Any decisions made or preferences expressed
3. Current state (what's complete, what's pending)
4. Any corrections or clarifications the user made

Also extract key facts worth remembering for future conversations.

Format your response as JSON:
{
  "summary": "Your summary here...",
  "keyFacts": [
    "Fact 1",
    "Fact 2"
  ]
}

Only output the JSON, nothing else.`;
}

/**
 * Parse the summary response from AI.
 */
function parseSummaryResponse(response: string): {
  summary: string;
  keyFacts: string[];
} {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || response,
        keyFacts: Array.isArray(parsed.keyFacts) ? parsed.keyFacts : [],
      };
    }
  } catch {
    // JSON parsing failed, use raw response
  }

  // Fallback: use entire response as summary
  return {
    summary: response.trim(),
    keyFacts: [],
  };
}
