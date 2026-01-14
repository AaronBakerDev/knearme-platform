/**
 * Next.js Instrumentation Hook for OpenTelemetry + Langfuse.
 *
 * This file is automatically loaded by Next.js at application startup
 * when experimental.instrumentationHook is enabled in next.config.ts.
 *
 * It registers the Vercel OpenTelemetry integration with Langfuse as the
 * trace exporter, enabling automatic tracing of:
 * - Vercel AI SDK calls (generateText, streamText, generateObject)
 * - HTTP requests
 * - Database queries (via instrumented clients)
 *
 * Environment Variables Required:
 * - LANGFUSE_PUBLIC_KEY: Project public key (pk-lf-...)
 * - LANGFUSE_SECRET_KEY: Project secret key (sk-lf-...)
 * - LANGFUSE_BASEURL: Optional, defaults to https://cloud.langfuse.com
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * @see https://langfuse.com/integrations/frameworks/vercel-ai-sdk
 * @see /src/lib/observability/langfuse.ts
 */

import { registerOTel } from '@vercel/otel';
import { getLangfuseExporter, isLangfuseEnabled } from '@/lib/observability/langfuse';

/**
 * Register OpenTelemetry instrumentation.
 *
 * This function is called once per Next.js server instance at startup.
 * It sets up the trace pipeline with Langfuse as the destination.
 *
 * The exporter will:
 * - Capture all spans from the Vercel AI SDK (experimental_telemetry enabled)
 * - Include metadata like functionId, userId, sessionId
 * - Track token usage and estimated costs
 * - Support correlation IDs for distributed tracing
 */
export function register() {
  // Only register if Langfuse is configured
  if (!isLangfuseEnabled()) {
    console.log('[Instrumentation] Langfuse not configured - tracing disabled');
    console.log('[Instrumentation] Set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY to enable');
    return;
  }

  const exporter = getLangfuseExporter();

  if (!exporter) {
    console.warn('[Instrumentation] Failed to create Langfuse exporter');
    return;
  }

  // Register OpenTelemetry with Langfuse exporter
  registerOTel({
    serviceName: 'knearme-portfolio',
    traceExporter: exporter,
  });

  console.log('[Instrumentation] OpenTelemetry registered with Langfuse exporter');
  console.log('[Instrumentation] Service: knearme-portfolio');
  console.log('[Instrumentation] AI SDK traces will be sent to Langfuse dashboard');
}
