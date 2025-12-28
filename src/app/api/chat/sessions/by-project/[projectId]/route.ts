/**
 * Get or create chat session by project ID.
 *
 * GET /api/chat/sessions/by-project/[projectId]
 *
 * Returns existing session for the project or creates a new one.
 * This ensures each project has a single active chat session
 * shared across all chat entry points.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

/**
 * GET /api/chat/sessions/by-project/[projectId]
 *
 * Get the chat session for a project, creating one if it doesn't exist.
 * Also returns all messages for the session.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { projectId } = await params;

    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.message },
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const supabase = await createClient();

    // Check if session exists for this project (single shared session)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSession, error: fetchError } = await (supabase as any)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newSession, error: createError } = await (supabase as any)
        .from('chat_sessions')
        .insert({
          project_id: projectId,
          contractor_id: auth.contractor.id,
          phase: 'conversation',
          extracted_data: {},
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      session = newSession;
    }

    // Get messages for the session
    const typedSession = session as Record<string, unknown>;
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id, role, content, metadata, created_at')
      .eq('session_id', typedSession.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    return NextResponse.json({
      session: {
        ...typedSession,
        messages: messages || [],
      },
      isNew: !existingSession,
    });
  } catch (error) {
    console.error('[GET /api/chat/sessions/by-project/[projectId]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get or create chat session' },
      { status: 500 }
    );
  }
}
