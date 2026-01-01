/**
 * Voice usage limits - Client-safe utilities.
 *
 * This file contains pure utility functions that can be used
 * in both client and server contexts.
 *
 * For server-only functions that need database access,
 * use usage-limits.server.ts
 *
 * @see /src/lib/voice/usage-limits.server.ts for server-only functions
 * @see /src/lib/billing/plan-limits.ts for plan tier definitions
 */

import { PLAN_LIMITS, type PlanTier } from '@/lib/billing/plan-limits';
import type { VoiceMode } from './usage-tracking';

// Re-export PLAN_LIMITS for convenience
export { PLAN_LIMITS };

/**
 * Result of a voice quota check.
 */
export interface VoiceQuotaResult {
  /** Whether the user is allowed to start a voice session */
  allowed: boolean;
  /** Remaining minutes for today */
  remainingMinutes: number;
  /** Daily quota in minutes (null = unlimited) */
  dailyQuotaMinutes: number | null;
  /** Usage so far today in minutes */
  usedMinutes: number;
  /** Human-readable reason if not allowed */
  reason?: string;
  /** User's plan tier */
  planTier: PlanTier;
}

/**
 * Daily usage summary for a user.
 */
export interface DailyUsage {
  /** Total minutes used today */
  totalMinutes: number;
  /** Number of sessions started today */
  sessions: number;
  /** Date string for the usage (YYYY-MM-DD) */
  date: string;
}

/**
 * Get the daily quota in minutes for a given plan tier and voice mode.
 *
 * @param tier - The plan tier ('free' or 'pro')
 * @param mode - The voice mode ('voice_text' or 'voice_voice')
 * @returns Daily quota in minutes, or null for unlimited
 */
export function getDailyQuotaMinutes(tier: PlanTier, mode: VoiceMode): number | null {
  if (mode === 'voice_voice') {
    return PLAN_LIMITS[tier].voiceVoiceMinutesPerDay;
  }
  // voice_text mode - currently no daily limit enforced
  // (monthly limits are handled separately)
  return null;
}

/**
 * Format remaining quota for display.
 *
 * @param remainingMinutes - Minutes remaining
 * @param dailyQuota - Daily quota (null = unlimited)
 * @returns Formatted string like "15m / 30m" or "unlimited"
 */
export function formatQuotaDisplay(remainingMinutes: number, dailyQuota: number | null): string {
  if (dailyQuota === null) {
    return 'unlimited';
  }

  if (remainingMinutes === Infinity) {
    return 'unlimited';
  }

  const usedMinutes = dailyQuota - remainingMinutes;
  return `${Math.round(usedMinutes)}m / ${dailyQuota}m used`;
}

/**
 * Get quota status category for UI display.
 *
 * @param remainingMinutes - Minutes remaining
 * @param dailyQuota - Daily quota (null = unlimited)
 * @returns Status category: 'ok' | 'warning' | 'critical' | 'exceeded'
 */
export function getQuotaStatus(
  remainingMinutes: number,
  dailyQuota: number | null
): 'ok' | 'warning' | 'critical' | 'exceeded' {
  if (dailyQuota === null || remainingMinutes === Infinity) {
    return 'ok';
  }

  if (remainingMinutes <= 0) {
    return 'exceeded';
  }

  if (remainingMinutes < 5) {
    return 'critical';
  }

  if (remainingMinutes < 10) {
    return 'warning';
  }

  return 'ok';
}
