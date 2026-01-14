/**
 * Voice Session Telemetry for observability and analytics.
 *
 * Tracks metrics for live voice sessions (Gemini Live API):
 * - Session lifecycle (start, end, duration)
 * - Transcript latency (time to first transcript)
 * - Tool execution (counts and durations)
 * - Fallback events (auto-switch frequency)
 * - Error occurrences
 *
 * In development: Logs to console with structured output.
 * In production: Emits structured JSON for analytics ingestion.
 *
 * @see useLiveVoiceSession.ts - Primary consumer of this module
 * @see /docs/observability/ - Observability architecture
 */

import { logger } from '@/lib/logging';

// ============================================================================
// Types
// ============================================================================

/**
 * Voice telemetry event names.
 * Used for consistent event tracking across the application.
 */
export const VOICE_EVENTS = {
  /** Session started connecting */
  SESSION_START: 'voice.session.start',
  /** Session successfully connected */
  SESSION_CONNECTED: 'voice.session.connected',
  /** Session ended (normal or abnormal) */
  SESSION_END: 'voice.session.end',
  /** First transcript received from user or assistant */
  TRANSCRIPT_FIRST: 'voice.transcript.first',
  /** User transcript completed */
  TRANSCRIPT_USER: 'voice.transcript.user',
  /** Assistant transcript completed */
  TRANSCRIPT_ASSISTANT: 'voice.transcript.assistant',
  /** Tool execution started */
  TOOL_START: 'voice.tool.start',
  /** Tool execution completed */
  TOOL_END: 'voice.tool.end',
  /** Fallback triggered (switched to text mode) */
  FALLBACK: 'voice.fallback',
  /** Error occurred */
  ERROR: 'voice.error',
} as const;

export type VoiceEventName = (typeof VOICE_EVENTS)[keyof typeof VOICE_EVENTS];

/**
 * Session context for correlating events.
 */
export interface VoiceSessionContext {
  /** Unique session identifier */
  sessionId: string;
  /** Project being worked on (if any) */
  projectId?: string;
  /** Contractor ID */
  contractorId?: string;
  /** Whether session is in continuous mode */
  continuousMode?: boolean;
}

/**
 * Timing metrics for a voice session.
 */
export interface VoiceSessionMetrics {
  /** Session start timestamp */
  startTime: number;
  /** First transcript timestamp (if received) */
  firstTranscriptTime?: number;
  /** Session end timestamp */
  endTime?: number;
  /** Total tool calls made */
  toolCallCount: number;
  /** Total tool execution time in ms */
  toolExecutionTime: number;
  /** Number of fallbacks triggered */
  fallbackCount: number;
  /** Number of errors encountered */
  errorCount: number;
  /** Number of user transcripts */
  userTranscriptCount: number;
  /** Number of assistant transcripts */
  assistantTranscriptCount: number;
}

// ============================================================================
// Telemetry State (Client-side singleton)
// ============================================================================

/**
 * Active session state for tracking metrics.
 * Client-side only - each browser tab has its own instance.
 */
interface TelemetryState {
  context: VoiceSessionContext | null;
  metrics: VoiceSessionMetrics | null;
  pendingToolStarts: Map<string, number>;
}

const state: TelemetryState = {
  context: null,
  metrics: null,
  pendingToolStarts: new Map(),
};

// ============================================================================
// Logging Utilities
// ============================================================================

/**
 * Emit a telemetry event.
 * Development: Pretty console output.
 * Production: Structured JSON for analytics.
 */
function emitEvent(
  event: VoiceEventName,
  data: Record<string, unknown> = {}
): void {
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    ...state.context,
    ...data,
  };

  const message = `[VoiceTelemetry] ${event}`;
  if (event.includes('error')) {
    logger.error(message, payload);
    return;
  }
  if (event.includes('fallback')) {
    logger.warn(message, payload);
    return;
  }
  logger.info(message, payload);
}

// ============================================================================
// Session Lifecycle
// ============================================================================

/**
 * Track session start (connection initiated).
 *
 * Call when the voice session begins connecting to Gemini.
 *
 * @param context - Session context for correlation
 * @returns Session start time for duration calculations
 *
 * @example
 * ```typescript
 * const startTime = trackSessionStart({
 *   sessionId: 'abc123',
 *   projectId: 'proj456',
 *   continuousMode: true,
 * });
 * ```
 */
export function trackSessionStart(context: VoiceSessionContext): number {
  const startTime = Date.now();

  state.context = context;
  state.metrics = {
    startTime,
    toolCallCount: 0,
    toolExecutionTime: 0,
    fallbackCount: 0,
    errorCount: 0,
    userTranscriptCount: 0,
    assistantTranscriptCount: 0,
  };
  state.pendingToolStarts.clear();

  emitEvent(VOICE_EVENTS.SESSION_START, {
    continuousMode: context.continuousMode,
  });

  return startTime;
}

/**
 * Track session connected (WebSocket established).
 *
 * Call when the Gemini session is fully connected and ready.
 */
export function trackSessionConnected(): void {
  if (!state.metrics) return;

  const connectDuration = Date.now() - state.metrics.startTime;

  emitEvent(VOICE_EVENTS.SESSION_CONNECTED, {
    connectDurationMs: connectDuration,
  });
}

/**
 * Track session end and return final metrics.
 *
 * Call when the voice session ends (normal disconnect or error).
 *
 * @param reason - Why the session ended
 * @returns Final session metrics summary
 *
 * @example
 * ```typescript
 * const metrics = trackSessionEnd('user-disconnect');
 * console.log(`Session lasted ${metrics.durationSeconds}s`);
 * ```
 */
export function trackSessionEnd(reason: string): {
  durationSeconds: number;
  transcriptLatencyMs: number | null;
  toolCallCount: number;
  avgToolDurationMs: number | null;
  fallbackCount: number;
  errorCount: number;
} | null {
  if (!state.metrics) return null;

  const endTime = Date.now();
  state.metrics.endTime = endTime;

  const durationSeconds = Math.round((endTime - state.metrics.startTime) / 1000);
  const transcriptLatencyMs = state.metrics.firstTranscriptTime
    ? state.metrics.firstTranscriptTime - state.metrics.startTime
    : null;
  const avgToolDurationMs = state.metrics.toolCallCount > 0
    ? Math.round(state.metrics.toolExecutionTime / state.metrics.toolCallCount)
    : null;

  const summary = {
    durationSeconds,
    transcriptLatencyMs,
    toolCallCount: state.metrics.toolCallCount,
    avgToolDurationMs,
    fallbackCount: state.metrics.fallbackCount,
    errorCount: state.metrics.errorCount,
    userTranscriptCount: state.metrics.userTranscriptCount,
    assistantTranscriptCount: state.metrics.assistantTranscriptCount,
  };

  emitEvent(VOICE_EVENTS.SESSION_END, {
    reason,
    ...summary,
  });

  // Clear state
  state.context = null;
  state.metrics = null;
  state.pendingToolStarts.clear();

  return summary;
}

// ============================================================================
// Transcript Tracking
// ============================================================================

/**
 * Track first transcript received (latency metric).
 *
 * Call when the first user or assistant transcript arrives.
 * Only records the first occurrence per session.
 */
export function trackFirstTranscript(): void {
  if (!state.metrics || state.metrics.firstTranscriptTime) return;

  state.metrics.firstTranscriptTime = Date.now();
  const latencyMs = state.metrics.firstTranscriptTime - state.metrics.startTime;

  emitEvent(VOICE_EVENTS.TRANSCRIPT_FIRST, {
    latencyMs,
  });
}

/**
 * Track user transcript completion.
 *
 * Call when a user transcript is finalized and committed.
 *
 * @param charCount - Number of characters in the transcript
 */
export function trackUserTranscript(charCount: number): void {
  if (!state.metrics) return;

  // Track first transcript if not already recorded
  if (!state.metrics.firstTranscriptTime) {
    trackFirstTranscript();
  }

  state.metrics.userTranscriptCount++;

  emitEvent(VOICE_EVENTS.TRANSCRIPT_USER, {
    charCount,
    transcriptNumber: state.metrics.userTranscriptCount,
  });
}

/**
 * Track assistant transcript completion.
 *
 * Call when an assistant transcript is finalized and committed.
 *
 * @param charCount - Number of characters in the transcript
 */
export function trackAssistantTranscript(charCount: number): void {
  if (!state.metrics) return;

  state.metrics.assistantTranscriptCount++;

  emitEvent(VOICE_EVENTS.TRANSCRIPT_ASSISTANT, {
    charCount,
    transcriptNumber: state.metrics.assistantTranscriptCount,
  });
}

// ============================================================================
// Tool Execution Tracking
// ============================================================================

/**
 * Track tool execution start.
 *
 * Call when a tool call begins execution.
 *
 * @param toolName - Name of the tool being executed
 * @param toolCallId - Unique ID for this tool call
 */
export function trackToolStart(toolName: string, toolCallId: string): void {
  if (!state.metrics) return;

  state.pendingToolStarts.set(toolCallId, Date.now());

  emitEvent(VOICE_EVENTS.TOOL_START, {
    toolName,
    toolCallId,
  });
}

/**
 * Track tool execution end.
 *
 * Call when a tool call completes (success or error).
 *
 * @param toolName - Name of the tool that executed
 * @param toolCallId - Unique ID for this tool call
 * @param success - Whether the tool succeeded
 * @param errorMessage - Error message if failed
 */
export function trackToolEnd(
  toolName: string,
  toolCallId: string,
  success: boolean,
  errorMessage?: string
): void {
  if (!state.metrics) return;

  const startTime = state.pendingToolStarts.get(toolCallId);
  const durationMs = startTime ? Date.now() - startTime : 0;

  state.pendingToolStarts.delete(toolCallId);
  state.metrics.toolCallCount++;
  state.metrics.toolExecutionTime += durationMs;

  emitEvent(VOICE_EVENTS.TOOL_END, {
    toolName,
    toolCallId,
    success,
    durationMs,
    errorMessage,
    totalToolCalls: state.metrics.toolCallCount,
  });
}

// ============================================================================
// Error and Fallback Tracking
// ============================================================================

/**
 * Track fallback event (auto-switch to text mode).
 *
 * Call when the voice session falls back to text-based interaction.
 *
 * @param reason - Why the fallback occurred
 */
export function trackFallback(reason: string): void {
  if (!state.metrics) return;

  state.metrics.fallbackCount++;

  emitEvent(VOICE_EVENTS.FALLBACK, {
    reason,
    fallbackNumber: state.metrics.fallbackCount,
  });
}

/**
 * Track error occurrence.
 *
 * Call when an error occurs in the voice session.
 *
 * @param errorType - Category of error
 * @param message - Error message
 * @param recoverable - Whether the session can continue
 */
export function trackError(
  errorType: string,
  message: string,
  recoverable: boolean = true
): void {
  if (!state.metrics) return;

  state.metrics.errorCount++;

  emitEvent(VOICE_EVENTS.ERROR, {
    errorType,
    message,
    recoverable,
    errorNumber: state.metrics.errorCount,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get current session metrics (for debugging/display).
 *
 * @returns Current metrics or null if no active session
 */
export function getCurrentMetrics(): VoiceSessionMetrics | null {
  if (!state.metrics) return null;

  return { ...state.metrics };
}

/**
 * Check if a session is currently active.
 *
 * @returns True if a voice session is being tracked
 */
export function isSessionActive(): boolean {
  return state.context !== null && state.metrics !== null;
}

/**
 * Get current session context.
 *
 * @returns Session context or null if no active session
 */
export function getSessionContext(): VoiceSessionContext | null {
  return state.context ? { ...state.context } : null;
}
