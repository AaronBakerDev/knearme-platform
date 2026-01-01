/**
 * End voice session tracking endpoint.
 *
 * POST /api/ai/end-voice-session
 *
 * Called by clients when a voice session ends to record duration.
 * The usageId is provided by the live-session endpoint.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import { endVoiceSession } from '@/lib/voice/usage-tracking';

const requestSchema = z.object({
  usageId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const start = Date.now();

  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    const body = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid request payload', {
        errors: parsed.error.flatten(),
      });
    }

    const { usageId } = parsed.data;

    // End the voice session and record duration
    await endVoiceSession(usageId);

    return apiSuccess({ ended: true });
  } catch (error) {
    return handleApiError(error, {
      route: '/api/ai/end-voice-session',
      method: 'POST',
      duration: Date.now() - start,
    });
  }
}
