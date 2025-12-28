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
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import {
  compactConversation,
  saveConversationSummary,
} from '@/lib/chat/context-compactor';
import type { UIMessage } from 'ai';
import type { ProjectContextData } from '@/lib/chat/context-loader';

interface SummarizeRequest {
  sessionId: string;
  projectId: string;
}

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

    const supabase = await createClient();

    // 3. Verify ownership of session and project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session, error: sessionError } = await (supabase as any)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: messages, error: messagesError } = await (supabase as any)
      .from('chat_messages')
      .select('id, role, content, metadata, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error(
        '[SummarizeConversation] Failed to load messages:',
        messagesError
      );
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error: projectError } = await (supabase as any)
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
      console.error(
        '[SummarizeConversation] Failed to load project:',
        projectError
      );
      return NextResponse.json(
        { error: 'Failed to load project' },
        { status: 500 }
      );
    }

    // 6. Convert messages to UIMessage format
    const uiMessages: UIMessage[] = messages.map(
      (m: { id: string; role: string; content: string }) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        parts: [{ type: 'text', text: m.content }],
      })
    );

    // 7. Build project context data
    const projectData: ProjectContextData = {
      id: project.id,
      title: project.title,
      description: project.description,
      project_type: project.project_type,
      city: project.city,
      state: project.state,
      materials: project.materials,
      techniques: project.techniques,
      status: project.status,
      extractedData: project.ai_context || {},
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
    console.error('[SummarizeConversation] Error:', error);
    return NextResponse.json(
      { error: 'Failed to summarize conversation' },
      { status: 500 }
    );
  }
}
