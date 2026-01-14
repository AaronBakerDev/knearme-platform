/**
 * Chat Messages API - Add messages to a session.
 *
 * POST /api/chat/sessions/[id]/messages - Add a message
 *
 * @see /src/lib/chat/chat-types.ts for type definitions
 */

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { estimateTokens, estimateMessageTokens } from '@/lib/chat/context-loader';
import { logger } from '@/lib/logging';
import type { Database, Json } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

type MessageParts = NonNullable<Parameters<typeof estimateMessageTokens>[1]>;

type IncomingMessage = {
  role?: 'user' | 'assistant' | 'system';
  content?: string;
  parts?: MessageParts;
  metadata?: Record<string, unknown> | null;
};

type ChatSessionRow = {
  id: string;
  message_count: number | null;
  estimated_tokens: number | null;
};

type ChatSessionUpdate = {
  message_count?: number | null;
  estimated_tokens?: number | null;
  updated_at?: string | null;
};

type ChatMessageRow = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Json | null;
  created_at: string;
};

type ChatMessageInsert = {
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Json | null;
};

type ChatDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      chat_sessions: {
        Row: ChatSessionRow;
        Update: ChatSessionUpdate;
        Insert: ChatSessionRow;
      };
      chat_messages: {
        Row: ChatMessageRow;
        Update: Partial<ChatMessageRow>;
        Insert: ChatMessageInsert;
      };
    };
  };
};

type ChatSupabaseClient = SupabaseClient<ChatDatabase>;

/**
 * POST /api/chat/sessions/[id]/messages
 *
 * Add a message to a chat session.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: sessionId } = await params;

    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.message },
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const body = (await request.json()) as IncomingMessage;
    const { role, content, parts, metadata } = body;
    const contentValue = typeof content === 'string' ? content : '';
    const hasParts = Array.isArray(parts) && parts.length > 0;

    if (!role || (!contentValue && !hasParts)) {
      return NextResponse.json(
        { error: 'role and content or parts are required' },
        { status: 400 }
      );
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be user, assistant, or system' },
        { status: 400 }
      );
    }

    const supabase = (await createClient()) as ChatSupabaseClient;

    // Verify session exists and belongs to user (RLS will handle this)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sessionData, error: sessionError } = await (supabase as any)
      .from('chat_sessions')
      .select('id, message_count, estimated_tokens')
      .eq('id', sessionId)
      .single();

    const session = sessionData as ChatSessionRow | null;

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const fallbackParts: MessageParts = [{ type: 'text', text: contentValue }];
    const messageMetadata = {
      ...(metadata ?? {}),
      // Store full parts array if provided, otherwise create text-only parts
      parts: hasParts ? parts : fallbackParts,
    } as Json;

    const insertPayload: ChatMessageInsert = {
      session_id: sessionId,
      role,
      content: contentValue,
      metadata: messageMetadata,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: message, error } = await (supabase as any)
      .from('chat_messages')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      logger.error('[POST /api/chat/sessions/[id]/messages] Error', { error });
      throw error;
    }

    // Update session message count + estimated tokens for context loading
    const newCount = (session.message_count ?? 0) + 1;
    const messageTokens = estimateMessageTokens(
      contentValue,
      hasParts ? (parts as typeof parts) : undefined
    );
    const newEstimatedTokens =
      (session.estimated_tokens ?? estimateTokens(session.message_count ?? 0, true, false)) +
      messageTokens;

    const updates: ChatSessionUpdate = {
      message_count: newCount,
      estimated_tokens: newEstimatedTokens,
      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('chat_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (updateError) {
      logger.error('[POST /api/chat/sessions/[id]/messages] Failed to update message count', {
        error: updateError,
        sessionId,
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    logger.error('[POST /api/chat/sessions/[id]/messages] Error', { error });
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/sessions/[id]/messages
 *
 * Get all messages for a session.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: sessionId } = await params;

    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.message },
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const supabase = (await createClient()) as ChatSupabaseClient;

    // Get messages ordered by creation time
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('id, role, content, metadata, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    logger.error('[GET /api/chat/sessions/[id]/messages] Error', { error });
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
