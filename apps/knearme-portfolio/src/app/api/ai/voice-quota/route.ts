/**
 * Voice quota check endpoint.
 *
 * GET /api/ai/voice-quota
 *
 * Returns the current user's voice quota status without starting a session.
 * Useful for displaying remaining minutes in the UI before connecting.
 *
 * @see /src/lib/voice/usage-limits.ts for quota logic
 */

import { requireAuth, isAuthError } from '@/lib/api/auth';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/errors';
import { checkVoiceQuota, getUsageToday } from '@/lib/voice/usage-limits.server';

export async function GET() {
  const start = Date.now();

  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return apiError(auth.type === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN', auth.message);
    }

    // Check quota for voice_voice mode (the expensive one)
    const quota = await checkVoiceQuota(auth.user.id, auth.contractor.id, 'voice_voice');

    // Also get session count for additional context
    const { sessions } = await getUsageToday(auth.user.id, 'voice_voice');

    return apiSuccess({
      allowed: quota.allowed,
      remainingMinutes: quota.remainingMinutes,
      dailyQuotaMinutes: quota.dailyQuotaMinutes,
      usedMinutes: quota.usedMinutes,
      planTier: quota.planTier,
      sessionsToday: sessions,
      lowQuotaWarning: quota.reason,
      upgradeUrl: quota.planTier === 'free' ? '/settings/billing' : undefined,
    });
  } catch (error) {
    return handleApiError(error, {
      route: '/api/ai/voice-quota',
      method: 'GET',
      duration: Date.now() - start,
    });
  }
}
