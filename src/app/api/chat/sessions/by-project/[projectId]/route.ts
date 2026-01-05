/**
 * Get or create chat session by project ID.
 *
 * GET /api/chat/sessions/by-project/[projectId]
 *
 * Returns existing session for the project or creates a new one.
 * This ensures each project has a single active chat session
 * shared across all chat entry points.
 *
 * Optional query params:
 * - includeMessages=true: include full message history (default: false)
 */

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { logger } from '@/lib/logging';
import type { Database, Json } from '@/types/database';

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

type ChatSessionRow = {
  id: string;
  project_id: string;
  contractor_id: string;
  title: string | null;
  phase: string | null;
  extracted_data: Json | null;
  created_at: string;
  updated_at: string;
};

type ChatSessionInsert = {
  project_id: string;
  contractor_id: string;
  phase?: string | null;
  extracted_data?: Json | null;
};

type ChatMessageRow = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Json | null;
  created_at: string;
};

type ChatDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      chat_sessions: {
        Row: ChatSessionRow;
        Insert: ChatSessionInsert;
        Update: Partial<ChatSessionRow>;
      };
      chat_messages: {
        Row: ChatMessageRow;
        Insert: Partial<ChatMessageRow>;
        Update: Partial<ChatMessageRow>;
      };
    };
  };
};

type ChatSupabaseClient = SupabaseClient<ChatDatabase>;

/**
 * GET /api/chat/sessions/by-project/[projectId]
 *
 * Get the chat session for a project, creating one if it doesn't exist.
 * Messages are excluded by default to keep payloads small.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const url = new URL(request.url);
    const includeMessages = url.searchParams.get('includeMessages') === 'true';

    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.message },
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const supabase = (await createClient()) as ChatSupabaseClient;

    // Check if session exists for this project (single shared session)
    const { data: existingSession, error: fetchError } = await supabase
      .from('chat_sessions')
      .select('id, project_id, contractor_id, title, phase, extracted_data, created_at, updated_at')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    let session = existingSession;

    // If no session exists, create one
    if (!session) {
      const insertPayload: ChatSessionInsert = {
        project_id: projectId,
        contractor_id: auth.contractor.id,
        phase: 'conversation',
        extracted_data: {},
      };

      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert(insertPayload)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      session = newSession;
    }

    const typedSession = session as ChatSessionRow;
    let messages: ChatMessageRow[] | null = null;
    if (includeMessages) {
      const { data: sessionMessages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('id, role, content, metadata, created_at')
        .eq('session_id', typedSession.id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        throw messagesError;
      }
      messages = sessionMessages || [];
    }

    return NextResponse.json({
      session: {
        ...typedSession,
        ...(includeMessages ? { messages } : {}),
      },
      isNew: !existingSession,
    });
  } catch (error) {
    logger.error('[GET /api/chat/sessions/by-project/[projectId]] Error', { error });
    return NextResponse.json(
      { error: 'Failed to get or create chat session' },
      { status: 500 }
    );
  }
}
