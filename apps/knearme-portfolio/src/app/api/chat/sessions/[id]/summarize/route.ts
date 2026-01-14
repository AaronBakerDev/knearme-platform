/**
 * Session Summarize API - Generate summary and extract key facts.
 *
 * POST /api/chat/sessions/[id]/summarize
 *
 * Called when a session ends to:
 * 1. Generate a brief summary of the conversation
 * 2. Extract key facts for future reference
 * 3. Update project-level memory
 *
 * @see /src/lib/chat/memory.ts for memory helpers
 * @see /todo/ai-sdk-phase-7-persistence-memory.md
 */

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { getChatModel, isGoogleAIEnabled } from '@/lib/ai/providers';
import {
  saveSessionSummary,
  updateProjectMemory,
  getSummarizePrompt,
  type KeyFact,
} from '@/lib/chat/memory';
import { logger } from '@/lib/logging';
import type { Database, Json } from '@/types/database';

// Allow up to 30 seconds for summarization
export const maxDuration = 30;

interface SummarizeResponse {
  summary: string;
  keyFacts: KeyFact[];
}

type ChatMessageRow = {
  role: string;
  content: string;
  created_at: string;
};

type ChatSessionRow = {
  id: string;
  project_id: string | null;
  contractor_id: string;
  phase: string | null;
  extracted_data: Json | null;
};

type ChatSessionWithMessages = ChatSessionRow & {
  chat_messages: ChatMessageRow[];
};

type ChatDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      chat_sessions: {
        Row: ChatSessionRow;
        Insert: ChatSessionRow;
        Update: Partial<ChatSessionRow>;
      };
    };
  };
};

type ChatSupabaseClient = SupabaseClient<ChatDatabase>;

/**
 * POST /api/chat/sessions/[id]/summarize
 *
 * Generate a summary of the session and extract key facts.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    // Check if AI is available
    if (!isGoogleAIEnabled()) {
      return NextResponse.json(
        { error: 'AI is not available. Please configure GOOGLE_GENERATIVE_AI_API_KEY.' },
        { status: 503 }
      );
    }

    // Verify authentication
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.message },
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const supabase = (await createClient()) as ChatSupabaseClient;

    // Get the session with messages
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select(`
        id,
        project_id,
        contractor_id,
        phase,
        extracted_data,
        chat_messages (
          role,
          content,
          created_at
        )
      `)
      .eq('id', sessionId)
      .single();

    const sessionData = session as ChatSessionWithMessages | null;

    if (sessionError || !sessionData) {
      logger.error('[Summarize] Session fetch error', { error: sessionError });
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (sessionData.contractor_id !== auth.contractor.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if there are messages to summarize
    const messages = sessionData.chat_messages || [];
    if (messages.length < 2) {
      return NextResponse.json(
        { error: 'Not enough messages to summarize' },
        { status: 400 }
      );
    }

    // Build conversation text for summarization
    const conversationText = messages
      .map(
        (msg: { role: string; content: string }) =>
          `${msg.role === 'assistant' ? 'AI' : 'User'}: ${msg.content}`
      )
      .join('\n\n');

    // Generate summary using AI
    const { text: responseText } = await generateText({
      model: getChatModel(),
      system: `You are a helpful assistant that summarizes conversations.
Your summaries should be brief and focus on actionable information.
Always respond with valid JSON.`,
      prompt: `${getSummarizePrompt(messages.length)}

Conversation to summarize:
${conversationText}`,
    });

    // Parse the AI response
    let summary = '';
    let keyFacts: KeyFact[] = [];

    try {
      // Try to parse as JSON
      const parsed = JSON.parse(responseText) as SummarizeResponse;
      summary = parsed.summary || '';
      keyFacts = (parsed.keyFacts || []).map((fact) => ({
        ...fact,
        timestamp: new Date().toISOString(),
        source: sessionId,
      }));
    } catch {
      // If JSON parsing fails, use the raw text as summary
      logger.warn('[Summarize] Failed to parse AI response as JSON, using raw text');
      summary = responseText.slice(0, 500); // Limit length
    }

    // Save to session
    await saveSessionSummary(sessionId, summary, keyFacts);

    // Update project memory with new facts
    if (keyFacts.length > 0 && sessionData.project_id) {
      try {
        await updateProjectMemory(sessionData.project_id, keyFacts);
      } catch (memoryError) {
        // Log but don't fail the request
        logger.error('[Summarize] Failed to update project memory', { error: memoryError });
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      keyFacts,
    });
  } catch (error) {
    logger.error('[Summarize] Error', { error });
    return NextResponse.json(
      { error: 'Failed to summarize session' },
      { status: 500 }
    );
  }
}
