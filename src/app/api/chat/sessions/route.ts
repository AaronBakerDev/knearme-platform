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

interface ChatSession {
  id: string;
  project_id: string;
  contractor_id: string;
  title: string | null;
  phase: string;
  extracted_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/chat/sessions
 *
 * List all chat sessions for the current contractor.
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.message },
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    const supabase = await createClient();

    // Get sessions ordered by most recent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sessions, error } = await (supabase as any)
      .from('chat_sessions')
      .select(`
        id,
        project_id,
        contractor_id,
        title,
        phase,
        extracted_data,
        created_at,
        updated_at,
        projects (
          id,
          title,
          status
        )
      `)
      .order('updated_at', { ascending: false });

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

    const body = await request.json();
    const { project_id, title } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create the session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session, error } = await (supabase as any)
      .from('chat_sessions')
      .insert({
        project_id,
        contractor_id: auth.contractor.id,
        title: title || null,
        phase: 'conversation',
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
