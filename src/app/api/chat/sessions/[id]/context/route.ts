/**
 * Load Conversation Context API - Smart context loading for chat sessions.
 *
 * GET /api/chat/sessions/[id]/context?projectId={projectId}
 *
 * Returns messages and project data using budget-based loading:
 * - Short conversations: Full message history
 * - Long conversations: Summary + recent messages
 *
 * @see /src/lib/chat/context-loader.ts for loading strategy
 */

import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { loadConversationContext } from '@/lib/chat/context-loader';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/chat/sessions/[id]/context
 *
 * Load conversation context with smart budget-based loading.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    // 1. Authenticate
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.message },
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    // 2. Get params
    const { id: sessionId } = await params;
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    // 3. Load conversation context using smart loading
    const context = await loadConversationContext(projectId, sessionId);

    // 4. Return context data
    return NextResponse.json({
      messages: context.messages,
      summary: context.summary,
      projectData: context.projectData,
      loadedFully: context.loadedFully,
      estimatedTokens: context.estimatedTokens,
      totalMessageCount: context.totalMessageCount,
    });
  } catch (error) {
    console.error('[LoadContext] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load conversation context' },
      { status: 500 }
    );
  }
}
