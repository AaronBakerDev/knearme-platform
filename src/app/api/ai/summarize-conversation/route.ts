/**
 * Summarize Conversation API - Generate conversation summaries.
 *
 * POST /api/ai/summarize-conversation
 *
 * Creates an intelligent summary of a chat session for context compaction.
 * Called when conversation history exceeds the context window budget.
 *
 * @see /src/lib/chat/context-compactor.ts for summarization logic
 * @see /src/lib/chat/context-loader.ts for loading strategy
 */

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import {
  compactConversation,
  saveConversationSummary,
} from '@/lib/chat/context-compactor';
import { logger } from '@/lib/logging';
import type { UIMessage } from 'ai';
import type { ProjectContextData } from '@/lib/chat/context-loader';
import type { Database, Project } from '@/types/database';

interface SummarizeRequest {
  sessionId: string;
  projectId: string;
}

type ChatSessionRow = {
  id: string;
  contractor_id: string;
  project_id: string;
};

type ChatMessageRow = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: unknown | null;
  created_at: string;
  session_id: string;
};

type ChatDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      chat_sessions: {
        Row: ChatSessionRow;
        Update: Partial<ChatSessionRow>;
        Insert: ChatSessionRow;
      };
      chat_messages: {
        Row: ChatMessageRow;
        Update: Partial<ChatMessageRow>;
        Insert: ChatMessageRow;
      };
    };
  };
};

type ChatSupabaseClient = SupabaseClient<ChatDatabase>;

/**
 * POST /api/ai/summarize-conversation
 *
 * Generate and save a summary for a chat session.
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.message },
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    // 2. Parse request
    const body: SummarizeRequest = await request.json();
    const { sessionId, projectId } = body;

    if (!sessionId || !projectId) {
      return NextResponse.json(
        { error: 'sessionId and projectId are required' },
        { status: 400 }
      );
    }

    const supabase = (await createClient()) as ChatSupabaseClient;

    // 3. Verify ownership of session and project
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, contractor_id, project_id')
      .eq('id', sessionId)
      .eq('contractor_id', auth.contractor.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    if (session.project_id !== projectId) {
      return NextResponse.json(
        { error: 'Session does not belong to this project' },
        { status: 400 }
      );
    }

    // 4. Load all messages from the session
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id, role, content, metadata, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      logger.error('[SummarizeConversation] Failed to load messages', {
        error: messagesError,
      });
      return NextResponse.json(
        { error: 'Failed to load messages' },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages to summarize' },
        { status: 400 }
      );
    }

    // 5. Load project data for context
    const { data: project, error: projectError } = await supabase
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
        ai_context
      `
      )
      .eq('id', projectId)
      .single();

    if (projectError) {
      logger.error('[SummarizeConversation] Failed to load project', {
        error: projectError,
      });
      return NextResponse.json(
        { error: 'Failed to load project' },
        { status: 500 }
      );
    }

    // 6. Convert messages to UIMessage format
    const uiMessages: UIMessage[] = messages.map((m: ChatMessageRow) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: 'text', text: m.content }],
      }));

    // 7. Build project context data
    const projectDataRow = project as Project;
    const projectData: ProjectContextData = {
      id: projectDataRow.id,
      title: projectDataRow.title,
      description: projectDataRow.description,
      project_type: projectDataRow.project_type,
      city: projectDataRow.city,
      state: projectDataRow.state,
      materials: projectDataRow.materials,
      techniques: projectDataRow.techniques,
      status: projectDataRow.status,
      extractedData: projectDataRow.ai_context || {},
      conversationSummary: null,
    };

    // 8. Generate summary
    const result = await compactConversation(uiMessages, projectData);

    // 9. Save summary to both project and session
    await saveConversationSummary(projectId, sessionId, result.summary);

    // 10. Return result
    return NextResponse.json({
      summary: result.summary,
      keyFacts: result.keyFacts,
      messageCount: messages.length,
      estimatedTokens: result.estimatedTokens,
    });
  } catch (error) {
    logger.error('[SummarizeConversation] Error', { error });
    return NextResponse.json(
      { error: 'Failed to summarize conversation' },
      { status: 500 }
    );
  }
}
