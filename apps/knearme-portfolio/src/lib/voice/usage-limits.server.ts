/**
 * Voice usage limits - Server-only functions.
 *
 * This file contains functions that require database access.
 * For client-safe utilities, use usage-limits.ts
 *
 * @see /src/lib/voice/usage-limits.ts for client-safe utilities
 * @see /src/lib/billing/plan-limits.ts for plan tier definitions
 * @see /src/lib/voice/usage-tracking.ts for session tracking
 */

import { createClient } from '@/lib/supabase/server';
import { normalizePlanTier } from '@/lib/billing/plan-limits';
import { getDailyQuotaMinutes, PLAN_LIMITS } from './usage-limits';
import type { VoiceMode } from './usage-tracking';
import type { VoiceQuotaResult, DailyUsage } from './usage-limits';
import { logger } from '@/lib/logging';

/**
 * Get the start of today in UTC for database queries.
 * Uses UTC to ensure consistent quota reset timing globally.
 */
function getStartOfDayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Get today's date string in YYYY-MM-DD format (UTC).
 */
function getTodayDateString(): string {
  const isoString = getStartOfDayUTC().toISOString();
  // ISO string format is always YYYY-MM-DDTHH:mm:ss.sssZ
  return isoString.split('T')[0] ?? isoString.substring(0, 10);
}

/**
 * Check if a user is within their voice quota for today.
 *
 * @param userId - The authenticated user's ID
 * @param contractorId - The contractor ID (used to look up plan tier)
 * @param mode - Voice mode to check quota for (defaults to 'voice_voice')
 * @returns Quota check result with remaining minutes and allow/deny status
 *
 * @example
 * const quota = await checkVoiceQuota(userId, contractorId);
 * if (!quota.allowed) {
 *   return apiError('QUOTA_EXCEEDED', quota.reason);
 * }
 */
export async function checkVoiceQuota(
  userId: string,
  contractorId: string,
  mode: VoiceMode = 'voice_voice'
): Promise<VoiceQuotaResult> {
  // Bypass quota in development mode for easier testing
  if (process.env.NODE_ENV === 'development') {
    return {
      allowed: true,
      remainingMinutes: 999,
      dailyQuotaMinutes: 999,
      usedMinutes: 0,
      planTier: 'pro',
    };
  }

  const supabase = await createClient();

  // Get contractor's plan tier
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: contractor, error: contractorError } = await (supabase as any)
    .from('contractors')
    .select('plan_tier')
    .eq('id', contractorId)
    .single();

  const contractorData = contractor as { plan_tier?: string } | null;

  if (contractorError || !contractorData) {
    // Default to free tier if contractor not found (shouldn't happen)
    logger.warn('[VoiceQuota] Contractor not found, defaulting to free tier', {
      contractorId,
      error: contractorError,
    });
  }

  const planTier = normalizePlanTier(contractorData?.plan_tier);

  // Get the daily quota for this mode and tier
  const dailyQuotaMinutes = getDailyQuotaMinutes(planTier, mode);

  // If unlimited (null), always allow
  if (dailyQuotaMinutes === null) {
    return {
      allowed: true,
      remainingMinutes: Infinity,
      dailyQuotaMinutes: null,
      usedMinutes: 0,
      planTier,
    };
  }

  // Get today's usage
  const { totalMinutes } = await getUsageToday(userId, mode);
  const usedMinutes = Math.ceil(totalMinutes);
  const remainingMinutes = Math.max(0, dailyQuotaMinutes - usedMinutes);

  // Check if over quota
  if (remainingMinutes <= 0) {
    return {
      allowed: false,
      remainingMinutes: 0,
      dailyQuotaMinutes,
      usedMinutes,
      reason: planTier === 'free'
        ? `You've used all ${dailyQuotaMinutes} minutes of voice today. Upgrade to Pro for ${PLAN_LIMITS.pro.voiceVoiceMinutesPerDay} minutes/day.`
        : `You've used all ${dailyQuotaMinutes} minutes of voice today. Your quota resets at midnight UTC.`,
      planTier,
    };
  }

  // Warn if low on quota (less than 5 minutes)
  const lowQuotaWarning = remainingMinutes < 5
    ? `You have less than 5 minutes of voice remaining today.`
    : undefined;

  return {
    allowed: true,
    remainingMinutes,
    dailyQuotaMinutes,
    usedMinutes,
    reason: lowQuotaWarning,
    planTier,
  };
}

/**
 * Get voice usage for today.
 *
 * @param userId - The user to check usage for
 * @param mode - Optional: filter by voice mode
 * @returns Daily usage summary with total minutes and session count
 *
 * @example
 * const usage = await getUsageToday(userId);
 * console.log(`Used ${usage.totalMinutes} minutes across ${usage.sessions} sessions today`);
 */
export async function getUsageToday(userId: string, mode?: VoiceMode): Promise<DailyUsage> {
  const supabase = await createClient();
  const startOfDay = getStartOfDayUTC();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('voice_usage')
    .select('duration_seconds')
    .eq('user_id', userId)
    .gte('started_at', startOfDay.toISOString());

  if (mode) {
    query = query.eq('mode', mode);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('[VoiceQuota] Failed to get daily usage', { error });
    return {
      totalMinutes: 0,
      sessions: 0,
      date: getTodayDateString(),
    };
  }

  const records = (data ?? []) as Array<{ duration_seconds?: number }>;
  const totalSeconds = records.reduce(
    (sum, record) => sum + (record.duration_seconds ?? 0),
    0
  );

  return {
    totalMinutes: totalSeconds / 60,
    sessions: records.length,
    date: getTodayDateString(),
  };
}
