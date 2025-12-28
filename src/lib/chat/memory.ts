/**
 * Memory System for AI Chat Sessions.
 *
 * Enables AI to remember key facts across sessions by:
 * 1. Summarizing conversations at session end
 * 2. Extracting key facts (preferences, corrections, context)
 * 3. Building context from previous sessions for new conversations
 *
 * Storage:
 * - chat_sessions.session_summary: Brief summary of what was discussed
 * - chat_sessions.key_facts: JSONB array of important facts
 * - projects.ai_memory: Persistent memory across all sessions
 *
 * @see /todo/ai-sdk-phase-7-persistence-memory.md
 * @see /supabase/migrations/XXX_add_memory_columns.sql
 */

import { createClient } from '@/lib/supabase/server';

/**
 * A key fact extracted from conversation.
 * Examples:
 * - { type: 'preference', content: 'Prefers formal tone' }
 * - { type: 'correction', content: 'Project was in Denver, not Boulder' }
 * - { type: 'context', content: 'This is a historical building renovation' }
 */
export interface KeyFact {
  /** Type of fact */
  type: 'preference' | 'correction' | 'context' | 'instruction';
  /** The fact content */
  content: string;
  /** When this fact was recorded */
  timestamp: string;
  /** Optional source (e.g., which message or session) */
  source?: string;
}

/**
 * Project-level memory that persists across all sessions.
 */
export interface ProjectMemory {
  /** Key facts about this project */
  facts: KeyFact[];
  /** User preferences for this project */
  preferences: {
    tone?: 'formal' | 'casual' | 'professional';
    focusAreas?: string[];
    avoidTopics?: string[];
  };
  /** Last updated timestamp */
  updatedAt: string;
}

/**
 * Session context built from previous sessions.
 * Passed to AI to provide continuity.
 */
export interface SessionContext {
  /** Summary of previous sessions */
  previousSummaries: string[];
  /** Key facts from all sessions */
  keyFacts: KeyFact[];
  /** Project-level memory */
  projectMemory: ProjectMemory | null;
  /** Number of previous sessions */
  sessionCount: number;
}

/**
 * Save a session summary and key facts.
 *
 * Called when a session ends (tab close, explicit end, or inactivity).
 *
 * @param sessionId - The chat session ID
 * @param summary - AI-generated summary of the conversation
 * @param keyFacts - Key facts extracted from the conversation
 */
export async function saveSessionSummary(
  sessionId: string,
  summary: string,
  keyFacts: KeyFact[]
): Promise<void> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('chat_sessions')
    .update({
      session_summary: summary,
      key_facts: keyFacts,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('[Memory] Failed to save session summary:', error);
    throw error;
  }
}

/**
 * Update project-level memory with new facts.
 *
 * Merges new facts with existing memory, deduplicating where possible.
 *
 * @param projectId - The project ID
 * @param newFacts - New facts to add
 * @param preferences - Optional preferences to update
 */
export async function updateProjectMemory(
  projectId: string,
  newFacts: KeyFact[],
  preferences?: Partial<ProjectMemory['preferences']>
): Promise<void> {
  const supabase = await createClient();

  // Get existing memory
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: project, error: fetchError } = await (supabase as any)
    .from('projects')
    .select('ai_memory')
    .eq('id', projectId)
    .single();

  if (fetchError) {
    console.error('[Memory] Failed to fetch project memory:', fetchError);
    throw fetchError;
  }

  // Parse existing memory or create new
  const existingMemory: ProjectMemory = project?.ai_memory || {
    facts: [],
    preferences: {},
    updatedAt: new Date().toISOString(),
  };

  // Merge facts (avoid duplicates based on content)
  const existingContents = new Set(existingMemory.facts.map((f) => f.content));
  const uniqueNewFacts = newFacts.filter((f) => !existingContents.has(f.content));

  const updatedMemory: ProjectMemory = {
    facts: [...existingMemory.facts, ...uniqueNewFacts],
    preferences: {
      ...existingMemory.preferences,
      ...preferences,
    },
    updatedAt: new Date().toISOString(),
  };

  // Save updated memory
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('projects')
    .update({ ai_memory: updatedMemory })
    .eq('id', projectId);

  if (updateError) {
    console.error('[Memory] Failed to update project memory:', updateError);
    throw updateError;
  }
}

/**
 * Build session context from previous sessions.
 *
 * Retrieves summaries and facts from past sessions to provide
 * continuity for the AI in new conversations.
 *
 * @param projectId - The project ID
 * @param limit - Maximum number of previous sessions to include
 * @returns Session context for AI
 */
export async function buildSessionContext(
  projectId: string,
  limit = 5
): Promise<SessionContext> {
  const supabase = await createClient();

  // Get previous sessions with summaries (most recent first)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessions, error: sessionsError } = await (supabase as any)
    .from('chat_sessions')
    .select('id, session_summary, key_facts, created_at')
    .eq('project_id', projectId)
    .not('session_summary', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (sessionsError) {
    console.error('[Memory] Failed to fetch previous sessions:', sessionsError);
    // Return empty context on error rather than failing
    return {
      previousSummaries: [],
      keyFacts: [],
      projectMemory: null,
      sessionCount: 0,
    };
  }

  // Get project memory
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: project, error: projectError } = await (supabase as any)
    .from('projects')
    .select('ai_memory')
    .eq('id', projectId)
    .single();

  if (projectError && projectError.code !== 'PGRST116') {
    // PGRST116 = no rows (project not found) - that's OK
    console.error('[Memory] Failed to fetch project memory:', projectError);
  }

  // Collect summaries and facts
  const previousSummaries: string[] = [];
  const allKeyFacts: KeyFact[] = [];

  for (const session of sessions || []) {
    if (session.session_summary) {
      previousSummaries.push(session.session_summary);
    }
    if (session.key_facts && Array.isArray(session.key_facts)) {
      allKeyFacts.push(...(session.key_facts as KeyFact[]));
    }
  }

  // Deduplicate facts
  const seenContents = new Set<string>();
  const uniqueFacts = allKeyFacts.filter((fact) => {
    if (seenContents.has(fact.content)) return false;
    seenContents.add(fact.content);
    return true;
  });

  return {
    previousSummaries,
    keyFacts: uniqueFacts,
    projectMemory: project?.ai_memory || null,
    sessionCount: sessions?.length || 0,
  };
}

/**
 * Format session context for inclusion in AI system prompt.
 *
 * Creates a human-readable context block that can be prepended
 * to the system prompt for continuity.
 *
 * @param context - Session context from buildSessionContext
 * @returns Formatted context string for system prompt
 */
export function formatContextForPrompt(context: SessionContext): string {
  const parts: string[] = [];

  // Add session count
  if (context.sessionCount > 0) {
    parts.push(`You have had ${context.sessionCount} previous conversation(s) about this project.`);
  }

  // Add key facts
  if (context.keyFacts.length > 0) {
    parts.push('\nImportant facts to remember:');
    for (const fact of context.keyFacts.slice(0, 10)) {
      // Limit to 10 facts
      parts.push(`- [${fact.type}] ${fact.content}`);
    }
  }

  // Add preferences
  if (context.projectMemory?.preferences) {
    const prefs = context.projectMemory.preferences;
    if (prefs.tone) {
      parts.push(`\nPreferred tone: ${prefs.tone}`);
    }
    if (prefs.focusAreas?.length) {
      parts.push(`Focus areas: ${prefs.focusAreas.join(', ')}`);
    }
    if (prefs.avoidTopics?.length) {
      parts.push(`Avoid: ${prefs.avoidTopics.join(', ')}`);
    }
  }

  // Add recent summaries (just the most recent)
  if (context.previousSummaries.length > 0 && context.previousSummaries[0]) {
    parts.push('\nMost recent conversation summary:');
    parts.push(context.previousSummaries[0]);
  }

  return parts.length > 0 ? parts.join('\n') : '';
}

/**
 * Generate a summary prompt for the AI.
 *
 * Returns a prompt that asks the AI to summarize a conversation
 * and extract key facts.
 *
 * @param messageCount - Number of messages in the conversation
 * @returns Prompt for summarization
 */
export function getSummarizePrompt(_messageCount: number): string {
  return `Please summarize this conversation in 2-3 sentences. Focus on:
1. What was discussed about the project
2. Any decisions made
3. Current state (e.g., "ready to generate", "needs more photos")

Also extract any key facts worth remembering for future conversations:
- User preferences (tone, style, focus areas)
- Corrections (things that were misunderstood and corrected)
- Important context (historical building, special requirements, etc.)

Format your response as JSON:
{
  "summary": "Brief 2-3 sentence summary",
  "keyFacts": [
    { "type": "preference|correction|context|instruction", "content": "The fact" }
  ]
}`;
}
