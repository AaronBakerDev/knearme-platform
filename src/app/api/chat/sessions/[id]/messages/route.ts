/**
 * Chat Messages API - Add messages to a session.
 *
 * POST /api/chat/sessions/[id]/messages - Add a message
 *
 * @see /src/lib/chat/chat-types.ts for type definitions
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

    const body = await request.json();
    const { role, content, metadata } = body;

    if (!role || !content) {
      return NextResponse.json(
        { error: 'role and content are required' },
        { status: 400 }
      );
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be user, assistant, or system' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify session exists and belongs to user (RLS will handle this)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session, error: sessionError } = await (supabase as any)
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Insert message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: message, error } = await (supabase as any)
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/chat/sessions/[id]/messages] Error:', error);
      throw error;
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/chat/sessions/[id]/messages] Error:', error);
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

    const supabase = await createClient();

    // Get messages ordered by creation time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: messages, error } = await (supabase as any)
      .from('chat_messages')
      .select('id, role, content, metadata, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('[GET /api/chat/sessions/[id]/messages] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
