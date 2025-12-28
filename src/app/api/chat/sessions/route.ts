/**
 * Chat Sessions API - List and create chat sessions.
 *
 * GET /api/chat/sessions - List all sessions for the current user
 * POST /api/chat/sessions - Create a new session
 *
 * @see /src/lib/chat/chat-types.ts for type definitions
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';

/**
 * Session mode is a legacy field retained for backwards compatibility.
 * Sessions are now shared across all chat entry points.
 */
type ChatSessionMode = 'create' | 'edit';

/**
 * GET /api/chat/sessions
 *
 * List chat sessions for the current contractor.
 * Optionally filter by project_id query parameter.
 *
 * @query project_id - Filter sessions to a specific project (optional)
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.message },
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const supabase = await createClient();

    // Parse query parameters
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');

    // Build query - filter by contractor (RLS handles this too, but explicit is better)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('chat_sessions')
      .select(`
        id,
        project_id,
        contractor_id,
        title,
        phase,
        mode,
        extracted_data,
        created_at,
        updated_at,
        projects (
          id,
          title,
          status
        )
      `)
      .eq('contractor_id', auth.contractor.id);

    // Filter by project if specified
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // Order by most recent
    query = query.order('updated_at', { ascending: false });

    const { data: sessions, error } = await query;

    if (error) {
      console.error('[GET /api/chat/sessions] Error:', error);
      throw error;
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('[GET /api/chat/sessions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/sessions
 *
 * Create a new chat session for a project.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.message },
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid or empty request body' },
        { status: 400 }
      );
    }
    const { project_id, title } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    // Legacy field kept for compatibility; always create unified sessions.
    const sessionMode: ChatSessionMode = 'create';

    const supabase = await createClient();

    // Create the session with mode
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session, error } = await (supabase as any)
      .from('chat_sessions')
      .insert({
        project_id,
        contractor_id: auth.contractor.id,
        title: title || null,
        phase: 'conversation',
        mode: sessionMode,
        extracted_data: {},
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/chat/sessions] Error:', error);
      throw error;
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/chat/sessions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    );
  }
}
