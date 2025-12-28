/**
 * Observability module for AI tracing and monitoring.
 *
 * Provides Langfuse-based observability for the chat agent system:
 * - Automatic LLM generation tracing via OpenTelemetry (langfuse-vercel)
 * - Manual trace/span creation for custom operations
 * - Tool execution tracking
 * - Usage and cost tracking
 * - Error tracking and debugging
 *
 * ## Setup
 *
 * 1. Set environment variables:
 *    ```
 *    LANGFUSE_PUBLIC_KEY=pk-lf-...
 *    LANGFUSE_SECRET_KEY=sk-lf-...
 *    LANGFUSE_BASEURL=https://cloud.langfuse.com  # optional
 *    LANGFUSE_ENABLED=true  # optional, defaults to enabled
 *    ```
 *
 * 2. Create instrumentation.ts for Next.js:
 *    ```typescript
 *    import { registerOTel } from '@vercel/otel';
 *    import { getLangfuseExporter } from '@/lib/observability';
 *
 *    export function register() {
 *      const exporter = getLangfuseExporter();
 *      if (exporter) {
 *        registerOTel({
 *          serviceName: 'knearme-portfolio',
 *          traceExporter: exporter,
 *        });
 *      }
 *    }
 *    ```
 *
 * 3. Enable telemetry on AI SDK calls:
 *    ```typescript
 *    import { chatTelemetry, flushLangfuse } from '@/lib/observability';
 *
 *    const result = streamText({
 *      model: getChatModel(),
 *      messages,
 *      experimental_telemetry: chatTelemetry({ projectId, sessionId }),
 *    });
 *
 *    // After streaming completes
 *    await flushLangfuse();
 *    ```
 *
 * @see /docs/ai-sdk/observability-spec.md for full specification
 */

// Core Langfuse client and OpenTelemetry exporter
export {
  isLangfuseEnabled,
  getLangfuseExporter,
  getTelemetryConfig,
  flushLangfuse,
  shutdownLangfuse,
} from './langfuse';

// Telemetry configuration helpers for AI SDK
export {
  chatTelemetry,
  generationTelemetry,
  analysisTelemetry,
  editTelemetry,
  createTelemetry,
  transcriptionTelemetry,
  type TelemetryMetadata,
} from './traced-ai';

// Manual tracing utilities
export {
  createChatTrace,
  createSpan,
  endSpan,
  endSpanWithError,
  traceToolExecution,
  updateTrace,
  addTraceScore,
  trackUsage,
  flushTracing,
  type TraceContext,
  type CreateChatTraceParams,
} from './tracing';

// KPI event tracking
export {
  KPI_EVENTS,
  trackProjectCreated,
  trackProjectPublished,
  trackInterviewCompleted,
  trackContentRegenerated,
  flushKpiEvents,
  type KpiEventName,
} from './kpi-events';
