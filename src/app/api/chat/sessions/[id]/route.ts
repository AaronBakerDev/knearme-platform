/**
 * Single Chat Session API - Get, update, delete a session.
 *
 * GET /api/chat/sessions/[id] - Get session with messages
 * PATCH /api/chat/sessions/[id] - Update session (phase, extracted_data, title)
 * DELETE /api/chat/sessions/[id] - Delete a session
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
 * GET /api/chat/sessions/[id]
 *
 * Get a chat session with all its messages.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.message },
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const supabase = await createClient();

    // Get session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session, error: sessionError } = await (supabase as any)
      .from('chat_sessions')
      .select(`
        id,
        project_id,
        contractor_id,
        title,
        phase,
        extracted_data,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      throw sessionError;
    }

    // Get messages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: messages, error: messagesError } = await (supabase as any)
      .from('chat_messages')
      .select('id, role, content, metadata, created_at')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    // Type assertion for RLS tables
    const typedSession = session as Record<string, unknown> | null;

    return NextResponse.json({
      session: {
        ...typedSession,
        messages: messages || [],
      },
    });
  } catch (error) {
    console.error('[GET /api/chat/sessions/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat session' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chat/sessions/[id]
 *
 * Update a chat session.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.message },
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const body = await request.json();
    const { title, phase, extracted_data } = body;

    const supabase = await createClient();

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title;
    if (phase !== undefined) updates.phase = phase;
    if (extracted_data !== undefined) updates.extracted_data = extracted_data;

    // Update session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session, error } = await (supabase as any)
      .from('chat_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('[PATCH /api/chat/sessions/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update chat session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/sessions/[id]
 *
 * Delete a chat session and all its messages.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.message },
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const supabase = await createClient();

    // Delete session (messages will cascade delete)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('chat_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/chat/sessions/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat session' },
      { status: 500 }
    );
  }
}
