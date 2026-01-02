/**
 * Voice usage tracking service.
 * Logs voice session starts/ends for fair-use monitoring.
 *
 * Database table: voice_usage (see supabase/migrations/027_add_voice_usage.sql)
 * TypeScript types: src/types/database.ts (VoiceUsage, VoiceUsageInsert, VoiceUsageUpdate)
 *
 * Usage:
 *   - Call startVoiceSession() when a voice session begins
 *   - Call endVoiceSession() when the session ends to record duration
 *   - Use getMonthlyUsage() to check usage against fair-use caps
 */

import { createClient } from '@/lib/supabase/server';

export type VoiceMode = 'voice_text' | 'voice_voice';

export interface VoiceUsageRecord {
  id: string;
  user_id: string;
  contractor_id?: string;
  session_id?: string;
  mode: VoiceMode;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  token_count?: number;
}

/**
 * Start tracking a voice session.
 * Returns the usage record ID to be used when ending the session.
 *
 * @param params.userId - The authenticated user's ID
 * @param params.businessId - Optional business ID associated with the session
 * @param params.sessionId - Optional chat session ID for correlation
 * @param params.mode - 'voice_text' for voice-to-text or 'voice_voice' for live voice
 * @returns The usage record ID, or null if tracking failed
 */
export async function startVoiceSession(params: {
  userId: string;
  businessId?: string;
  sessionId?: string;
  mode: VoiceMode;
}): Promise<string | null> {
  const supabase = await createClient();

  // Type assertion needed due to manually maintained types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('voice_usage')
    .insert({
      user_id: params.userId,
      // DB column is still contractor_id, uses business ID value
      contractor_id: params.businessId ?? null,
      session_id: params.sessionId ?? null,
      mode: params.mode,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[VoiceUsage] Failed to start session:', error);
    return null;
  }

  return data?.id ?? null;
}

/**
 * End a voice session and record its duration.
 * Calculates duration from started_at to now.
 *
 * @param usageId - The usage record ID returned from startVoiceSession
 */
export async function endVoiceSession(usageId: string): Promise<void> {
  const supabase = await createClient();

  // Type assertion needed due to manually maintained types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // First get the start time to calculate duration
  const { data: record } = await sb
    .from('voice_usage')
    .select('started_at')
    .eq('id', usageId)
    .single();

  if (!record) {
    console.error('[VoiceUsage] Session not found:', usageId);
    return;
  }

  const endedAt = new Date();
  const startedAt = new Date(record.started_at);
  const durationSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);

  const { error } = await sb
    .from('voice_usage')
    .update({
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq('id', usageId);

  if (error) {
    console.error('[VoiceUsage] Failed to end session:', error);
  }
}

/**
 * Get total voice usage in seconds for the current month.
 * Useful for checking against fair-use caps.
 *
 * @param userId - The user to check usage for
 * @param mode - Optional: filter by voice mode
 * @returns Total duration in seconds for the current month
 */
export async function getMonthlyUsage(userId: string, mode?: VoiceMode): Promise<number> {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Type assertion needed due to manually maintained types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('voice_usage')
    .select('duration_seconds')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())
    .not('duration_seconds', 'is', null);

  if (mode) {
    query = query.eq('mode', mode);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[VoiceUsage] Failed to get monthly usage:', error);
    return 0;
  }

  return data?.reduce((sum: number, r: { duration_seconds: number | null }) => sum + (r.duration_seconds || 0), 0) ?? 0;
}

/**
 * Get count of voice sessions for the current month.
 * Useful for session-based rate limiting.
 *
 * @param userId - The user to check usage for
 * @param mode - Optional: filter by voice mode
 * @returns Number of sessions started this month
 */
export async function getMonthlySessionCount(userId: string, mode?: VoiceMode): Promise<number> {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Type assertion needed due to manually maintained types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('voice_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  if (mode) {
    query = query.eq('mode', mode);
  }

  const { count, error } = await query;

  if (error) {
    console.error('[VoiceUsage] Failed to get session count:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Format seconds into a human-readable duration string.
 * Useful for displaying usage to users.
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string like "2h 30m" or "45m"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
