/**
 * Tracing utilities for AI observability.
 *
 * Provides helpers for creating manual traces, spans, and tracking
 * tool executions within the chat system.
 *
 * NOTE: With the OpenTelemetry-based approach (langfuse-vercel), most tracing
 * is automatic when you enable experimental_telemetry on AI SDK calls.
 * This module provides additional manual tracing capabilities for:
 * - Custom spans for non-AI operations
 * - Tool execution tracking
 * - Custom metadata and scoring
 *
 * @see https://langfuse.com/docs/tracing
 * @see /docs/ai-sdk/observability-spec.md
 */

import { Langfuse } from 'langfuse';
import { isLangfuseEnabled } from './langfuse';

// ============================================================================
// Langfuse Client for Manual Tracing
// ============================================================================

/**
 * Langfuse client singleton for manual trace creation.
 *
 * Use this for creating custom traces and spans outside of
 * the automatic OpenTelemetry integration.
 */
let _langfuseClient: Langfuse | null = null;

function getLangfuseClient(): Langfuse | null {
  if (!isLangfuseEnabled()) {
    return null;
  }

  if (!_langfuseClient) {
    _langfuseClient = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com',
    });
  }

  return _langfuseClient;
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Langfuse trace object type.
 * Using ReturnType to get the actual type from the Langfuse client.
 */
type LangfuseTrace = ReturnType<Langfuse['trace']>;
type LangfuseSpan = ReturnType<LangfuseTrace['span']>;

/**
 * Context object containing trace and session information.
 * Passed through the request lifecycle for consistent tracing.
 */
export interface TraceContext {
  /** The Langfuse trace object (null if tracing disabled) */
  trace: LangfuseTrace | null;
  /** User ID from authentication */
  userId: string;
  /** Session ID for conversation grouping */
  sessionId: string;
  /** Project ID if working on existing project */
  projectId?: string;
}

/**
 * Parameters for creating a new chat trace.
 */
export interface CreateChatTraceParams {
  /** Authenticated user ID */
  userId: string;
  /** Session ID for conversation grouping */
  sessionId: string;
  /** Project ID if editing existing project */
  projectId?: string;
  /** Number of messages in conversation */
  messageCount: number;
}

// ============================================================================
// Trace Creation
// ============================================================================

/**
 * Create a new trace for a chat message.
 *
 * Each chat request creates a new trace that groups all related
 * operations (LLM calls, tool executions, database operations).
 *
 * NOTE: When using experimental_telemetry with the AI SDK, traces are
 * created automatically. Use this function for additional custom tracing
 * or when you need to link manual spans to a parent trace.
 *
 * @param params - Trace creation parameters
 * @returns TraceContext with trace object and metadata
 *
 * @example
 * ```typescript
 * const traceContext = createChatTrace({
 *   userId: auth.user.id,
 *   sessionId: `session-${projectId}`,
 *   projectId,
 *   messageCount: messages.length,
 * });
 *
 * // Use trace for spans
 * const span = createSpan(traceContext.trace, 'parse_request', { body: req.body });
 * ```
 */
export function createChatTrace(params: CreateChatTraceParams): TraceContext {
  const client = getLangfuseClient();

  if (!client) {
    return {
      trace: null,
      userId: params.userId,
      sessionId: params.sessionId,
      projectId: params.projectId,
    };
  }

  const trace = client.trace({
    name: 'chat_message',
    userId: params.userId,
    sessionId: params.sessionId,
    metadata: {
      projectId: params.projectId,
      messageCount: params.messageCount,
    },
    tags: ['chat', params.projectId ? 'with-project' : 'new-project'],
  });

  return {
    trace,
    userId: params.userId,
    sessionId: params.sessionId,
    projectId: params.projectId,
  };
}

// ============================================================================
// Span Helpers
// ============================================================================

/**
 * Create a span within a trace.
 *
 * Spans represent discrete operations within a trace, such as:
 * - Authentication checks
 * - Request parsing
 * - Database operations
 * - Tool executions
 *
 * @param trace - The parent trace (or null if tracing disabled)
 * @param name - Name of the operation
 * @param input - Optional input data to log
 * @returns Span object (or null if trace is null)
 *
 * @example
 * ```typescript
 * const authSpan = createSpan(trace, 'auth_check');
 * const auth = await requireAuth();
 * endSpan(authSpan, { userId: auth.user.id });
 * ```
 */
export function createSpan(
  trace: LangfuseTrace | null,
  name: string,
  input?: unknown
): LangfuseSpan | null {
  if (!trace) {
    return null;
  }

  return trace.span({
    name,
    input,
    startTime: new Date(),
  });
}

/**
 * End a span with output data.
 *
 * Should be called when the operation completes successfully.
 * For errors, use endSpanWithError instead.
 *
 * @param span - The span to end (or null if tracing disabled)
 * @param output - Optional output data to log
 * @param metadata - Optional metadata to attach
 */
export function endSpan(
  span: LangfuseSpan | null,
  output?: unknown,
  metadata?: Record<string, unknown>
): void {
  if (!span) {
    return;
  }

  span.end({
    output,
    metadata,
  });
}

/**
 * End a span with error information.
 *
 * Marks the span as failed and records error details
 * for debugging in the Langfuse dashboard.
 *
 * @param span - The span to end (or null if tracing disabled)
 * @param error - The error that occurred
 */
export function endSpanWithError(
  span: LangfuseSpan | null,
  error: Error
): void {
  if (!span) {
    return;
  }

  span.end({
    level: 'ERROR',
    statusMessage: error.message,
    metadata: {
      errorName: error.name,
      errorStack: error.stack,
    },
  });
}

// ============================================================================
// Tool Execution Tracing
// ============================================================================

/**
 * Wrap a tool execution with tracing.
 *
 * Creates a span for the tool execution, records input/output,
 * and handles errors appropriately.
 *
 * @param trace - The parent trace (or null if tracing disabled)
 * @param toolName - Name of the tool being executed
 * @param args - Tool input arguments
 * @param execute - The tool execution function
 * @returns Result of the tool execution
 *
 * @example
 * ```typescript
 * const result = await traceToolExecution(
 *   trace,
 *   'extractProjectData',
 *   { title: 'My Project', description: '...' },
 *   async () => {
 *     await saveProjectData(projectId, args);
 *     return { saved: true };
 *   }
 * );
 * ```
 */
export async function traceToolExecution<T>(
  trace: LangfuseTrace | null,
  toolName: string,
  args: unknown,
  execute: () => Promise<T>
): Promise<T> {
  // If tracing disabled, just execute
  if (!trace) {
    return execute();
  }

  const span = trace.span({
    name: `tool_${toolName}`,
    input: args,
    metadata: { toolName },
    startTime: new Date(),
  });

  try {
    const result = await execute();

    span.end({
      output: result,
      level: 'DEFAULT',
    });

    return result;
  } catch (error) {
    span.end({
      level: 'ERROR',
      statusMessage: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        errorName: error instanceof Error ? error.name : 'Error',
        errorStack: error instanceof Error ? error.stack : undefined,
      },
    });

    throw error;
  }
}

// ============================================================================
// Trace Updates and Scoring
// ============================================================================

/**
 * Update a trace with additional metadata.
 *
 * Use this to add information that becomes available
 * after trace creation (e.g., after authentication).
 *
 * @param trace - The trace to update (or null if tracing disabled)
 * @param updates - Metadata updates to apply
 */
export function updateTrace(
  trace: LangfuseTrace | null,
  updates: {
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
    tags?: string[];
    output?: unknown;
  }
): void {
  if (!trace) {
    return;
  }

  trace.update(updates);
}

/**
 * Add a score to a trace for quality evaluation.
 *
 * Scores can be used for:
 * - Completeness tracking (0-1 scale)
 * - User satisfaction (binary: edited vs accepted)
 * - Cost tracking (USD value)
 *
 * @param trace - The trace to score (or null if tracing disabled)
 * @param name - Score name (e.g., 'completeness', 'cost_usd')
 * @param value - Numeric score value
 * @param comment - Optional comment explaining the score
 */
export function addTraceScore(
  trace: LangfuseTrace | null,
  name: string,
  value: number,
  comment?: string
): void {
  if (!trace) {
    return;
  }

  trace.score({
    name,
    value,
    comment,
  });
}

// ============================================================================
// Usage Tracking
// ============================================================================

/**
 * Track token usage and estimated cost.
 *
 * Attaches usage metadata to the trace and adds a cost score
 * for easy aggregation in the Langfuse dashboard.
 *
 * NOTE: When using experimental_telemetry, token usage is automatically
 * captured. Use this for additional cost tracking or custom metrics.
 *
 * @param trace - The trace to update (or null if tracing disabled)
 * @param usage - Token usage from the LLM response
 */
export function trackUsage(
  trace: LangfuseTrace | null,
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }
): void {
  if (!trace) {
    return;
  }

  // Gemini 3.0 Flash pricing (as of Dec 2024)
  // Input: $0.50 / 1M tokens, Output: $3.00 / 1M tokens
  const GEMINI_INPUT_COST_PER_TOKEN = 0.50 / 1_000_000;
  const GEMINI_OUTPUT_COST_PER_TOKEN = 3.00 / 1_000_000;

  const estimatedCost =
    (usage.promptTokens * GEMINI_INPUT_COST_PER_TOKEN) +
    (usage.completionTokens * GEMINI_OUTPUT_COST_PER_TOKEN);

  // Update trace metadata
  trace.update({
    metadata: {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      estimatedCostUsd: estimatedCost.toFixed(6),
    },
  });

  // Add score for easy aggregation
  trace.score({
    name: 'cost_usd',
    value: estimatedCost,
  });
}

// ============================================================================
// Flush Helper
// ============================================================================

/**
 * Flush the manual tracing client.
 *
 * Should be called alongside flushLangfuse() from ./langfuse.ts
 * if you're using both automatic telemetry and manual tracing.
 */
export async function flushTracing(): Promise<void> {
  const client = getLangfuseClient();
  if (client) {
    await client.flush();
  }
}
