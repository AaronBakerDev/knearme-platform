/**
 * Legacy Edit Mode Chat API Route.
 *
 * Deprecated: unified chat flow now lives at POST /api/chat.
 * This handler forwards requests to the unified route for backwards compatibility.
 */

import { POST as unifiedPost, maxDuration } from '@/app/api/chat/route';

export { maxDuration };

/**
 * POST /api/chat/edit
 *
 * Forward to unified chat handler.
 */
export async function POST(request: Request) {
  console.warn('[POST /api/chat/edit] Deprecated. Forwarding to /api/chat.');
  return unifiedPost(request);
}
