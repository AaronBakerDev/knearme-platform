export type PlanTier = 'free' | 'pro';

/**
 * Plan limits for KnearMe tiers.
 *
 * Voice quotas are enforced DAILY for fair use:
 * - Free tier: 30 minutes/day of voice_voice
 * - Pro tier: 120 minutes/day of voice_voice
 *
 * Monthly limits are kept for backward compatibility but
 * daily limits are the primary enforcement mechanism.
 *
 * @see /src/lib/voice/usage-limits.ts for quota enforcement
 */
export const PLAN_LIMITS = {
  free: {
    publishedProjects: 5,
    voiceTextMinutesPerMonth: 30,
    voiceVoiceMinutesPerMonth: 0,
    /** Daily voice_voice quota in minutes (null = unlimited) */
    voiceVoiceMinutesPerDay: 30,
  },
  pro: {
    publishedProjects: null,
    voiceTextMinutesPerMonth: null,
    voiceVoiceMinutesPerMonth: 200,
    /** Daily voice_voice quota in minutes (null = unlimited) */
    voiceVoiceMinutesPerDay: 120,
  },
} as const;

export function normalizePlanTier(tier?: string | null): PlanTier {
  return tier === 'pro' ? 'pro' : 'free';
}

export function getPublishedProjectLimit(tier: PlanTier): number | null {
  return PLAN_LIMITS[tier].publishedProjects;
}
