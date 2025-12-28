/**
 * Langfuse OpenTelemetry integration for AI observability.
 *
 * Uses the LangfuseExporter from langfuse-vercel to capture OpenTelemetry
 * spans from the Vercel AI SDK and send them to Langfuse for analysis.
 *
 * The Vercel AI SDK has built-in telemetry that automatically sends traces
 * when experimental_telemetry is enabled on streamText/generateText calls.
 *
 * @see https://langfuse.com/integrations/frameworks/vercel-ai-sdk
 * @see https://ai-sdk.dev/providers/observability/langfuse
 * @see /docs/ai-sdk/observability-spec.md
 */

import { LangfuseExporter } from 'langfuse-vercel';
import type { AttributeValue } from '@opentelemetry/api';

// ============================================================================
// Environment Validation
// ============================================================================

/**
 * Check if Langfuse is configured and enabled.
 *
 * Returns true only when:
 * 1. Both LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY are set
 * 2. LANGFUSE_ENABLED is not explicitly set to 'false'
 *
 * @returns boolean indicating if Langfuse tracing is available
 */
export function isLangfuseEnabled(): boolean {
  return !!(
    process.env.LANGFUSE_PUBLIC_KEY &&
    process.env.LANGFUSE_SECRET_KEY &&
    process.env.LANGFUSE_ENABLED !== 'false'
  );
}

// ============================================================================
// Exporter Singleton
// ============================================================================

/**
 * LangfuseExporter singleton instance.
 *
 * The LangfuseExporter is an OpenTelemetry SpanExporter that captures
 * spans from the Vercel AI SDK and sends them to Langfuse.
 *
 * Configuration via environment variables:
 * - LANGFUSE_PUBLIC_KEY: Project public key (pk-lf-...)
 * - LANGFUSE_SECRET_KEY: Project secret key (sk-lf-...)
 * - LANGFUSE_BASEURL: API endpoint (defaults to https://cloud.langfuse.com)
 * - LANGFUSE_ENABLED: Set to 'false' to disable (defaults to enabled)
 *
 * @example
 * ```typescript
 * // In instrumentation.ts (Next.js)
 * import { registerOTel } from '@vercel/otel';
 * import { getLangfuseExporter } from '@/lib/observability/langfuse';
 *
 * export function register() {
 *   const exporter = getLangfuseExporter();
 *   if (exporter) {
 *     registerOTel({
 *       serviceName: 'knearme-portfolio',
 *       traceExporter: exporter,
 *     });
 *   }
 * }
 * ```
 */
let _exporter: LangfuseExporter | null = null;

/**
 * Get the LangfuseExporter singleton.
 *
 * Creates the exporter lazily to avoid initialization issues
 * when environment variables aren't available.
 *
 * @returns LangfuseExporter instance or null if disabled
 */
export function getLangfuseExporter(): LangfuseExporter | null {
  if (!isLangfuseEnabled()) {
    return null;
  }

  if (!_exporter) {
    _exporter = new LangfuseExporter({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com',
      debug: process.env.NODE_ENV === 'development',
    });
  }

  return _exporter;
}

// ============================================================================
// Telemetry Configuration
// ============================================================================

/**
 * Get the telemetry configuration for Vercel AI SDK calls.
 *
 * Returns the experimental_telemetry config object with
 * isEnabled set based on Langfuse availability.
 *
 * @param options - Optional configuration
 * @param options.functionId - Identifier for this operation type
 * @param options.metadata - Metadata to include in traces
 * @returns Telemetry configuration object
 *
 * @example
 * ```typescript
 * import { getTelemetryConfig } from '@/lib/observability/langfuse';
 *
 * const result = streamText({
 *   model: getChatModel(),
 *   messages,
 *   experimental_telemetry: getTelemetryConfig({
 *     functionId: 'chat-completion',
 *     metadata: {
 *       projectId: 'abc123',
 *       sessionId: 'session-xyz',
 *       userId: 'user-123',
 *     },
 *   }),
 * });
 * ```
 */
export function getTelemetryConfig(options?: {
  functionId?: string;
  metadata?: Record<string, AttributeValue>;
}) {
  return {
    isEnabled: isLangfuseEnabled(),
    functionId: options?.functionId || 'chat-completion',
    metadata: options?.metadata,
  };
}

// ============================================================================
// Lifecycle Management
// ============================================================================

/**
 * Flush pending traces to Langfuse.
 *
 * IMPORTANT: Must be called at the end of each serverless request
 * to ensure traces are sent before the function terminates.
 *
 * For streaming responses in Next.js, use the `after()` API:
 * ```typescript
 * import { after } from 'next/server';
 *
 * after(async () => {
 *   await flushLangfuse();
 * });
 * ```
 *
 * Should be called:
 * - At the end of each API route
 * - Before process shutdown
 * - After errors to ensure error traces are captured
 *
 * This is a no-op if Langfuse is disabled.
 */
export async function flushLangfuse(): Promise<void> {
  const exporter = getLangfuseExporter();
  if (exporter) {
    await exporter.forceFlush();
  }
}

/**
 * Shutdown the Langfuse exporter.
 *
 * Call this during application shutdown to ensure all traces
 * are flushed and resources are cleaned up.
 */
export async function shutdownLangfuse(): Promise<void> {
  const exporter = getLangfuseExporter();
  if (exporter) {
    await exporter.shutdown();
    _exporter = null;
  }
}

// ============================================================================
// Development Logging
// ============================================================================

// Log status at module load (development only)
if (process.env.NODE_ENV === 'development') {
  if (isLangfuseEnabled()) {
    console.log('[Langfuse] Observability enabled (OpenTelemetry mode via langfuse-vercel)');
  } else if (process.env.LANGFUSE_ENABLED === 'false') {
    console.log('[Langfuse] Explicitly disabled via LANGFUSE_ENABLED=false');
  } else {
    console.log('[Langfuse] Not configured - set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY to enable');
  }
}
