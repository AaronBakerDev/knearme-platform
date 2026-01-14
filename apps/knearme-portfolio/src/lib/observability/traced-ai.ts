/**
 * Traced AI helpers for automatic Langfuse observability.
 *
 * Provides convenience functions to generate telemetry configurations
 * for different types of AI operations. These wrap the base getTelemetryConfig
 * from langfuse.ts with operation-specific defaults.
 *
 * @see https://langfuse.com/integrations/frameworks/vercel-ai-sdk
 * @see /docs/ai-sdk/observability-spec.md
 */

import type { AttributeValue } from '@opentelemetry/api';
import { getTelemetryConfig } from './langfuse';

// ============================================================================
// Telemetry Configuration Types
// ============================================================================

/**
 * Metadata that can be attached to telemetry spans.
 *
 * These values appear in the Langfuse dashboard for filtering and analysis.
 * Values must be compatible with OpenTelemetry AttributeValue.
 *
 * Note: Optional fields are omitted from the metadata if not provided,
 * rather than being set to undefined.
 */
export interface TelemetryMetadata {
  /** Project ID being worked on */
  projectId?: string;
  /** Chat session ID */
  sessionId?: string;
  /** Business ID (replaces contractorId) */
  businessId?: string;
  /** Custom tags for filtering */
  tags?: string[];
  /** Additional context (must be OTel-compatible values) */
  [key: string]: AttributeValue | undefined;
}

// ============================================================================
// Telemetry Configuration Factories
// ============================================================================

/**
 * Filter out undefined values from metadata to ensure OTel compatibility.
 * OpenTelemetry AttributeValue doesn't accept undefined at runtime.
 *
 * @see https://opentelemetry.io/docs/concepts/signals/traces/#attributes
 */
function filterUndefined(
  obj: Record<string, AttributeValue | undefined>
): Record<string, AttributeValue> {
  const result: Record<string, AttributeValue> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Create telemetry config for chat completions.
 *
 * Use this in the chat API route for conversational interactions.
 *
 * @param metadata - Optional metadata to include in traces
 * @returns Telemetry configuration for streamText
 *
 * @example
 * ```typescript
 * import { chatTelemetry } from '@/lib/observability/traced-ai';
 *
 * const result = streamText({
 *   model: getChatModel(),
 *   messages,
 *   experimental_telemetry: chatTelemetry({
 *     projectId: project.id,
 *     sessionId: session.id,
 *   }),
 * });
 * ```
 */
export function chatTelemetry(metadata?: TelemetryMetadata) {
  return getTelemetryConfig({
    functionId: 'chat-completion',
    metadata: filterUndefined({
      operationType: 'chat',
      ...metadata,
    }),
  });
}

/**
 * Create telemetry config for content generation.
 *
 * Use this when generating portfolio content (title, description, SEO).
 *
 * @param metadata - Optional metadata to include in traces
 * @returns Telemetry configuration for generateText
 */
export function generationTelemetry(metadata?: TelemetryMetadata) {
  return getTelemetryConfig({
    functionId: 'content-generation',
    metadata: filterUndefined({
      operationType: 'generation',
      ...metadata,
    }),
  });
}

/**
 * Create telemetry config for image analysis.
 *
 * Use this when analyzing project photos with vision models.
 *
 * @param metadata - Optional metadata to include in traces
 * @returns Telemetry configuration for generateText (vision)
 */
export function analysisTelemetry(metadata?: TelemetryMetadata) {
  return getTelemetryConfig({
    functionId: 'image-analysis',
    metadata: filterUndefined({
      operationType: 'analysis',
      ...metadata,
    }),
  });
}

/**
 * Create telemetry config for edit mode operations.
 *
 * Use this in the edit chat API route for content refinement.
 *
 * @param metadata - Optional metadata to include in traces
 * @returns Telemetry configuration for streamText
 */
export function editTelemetry(metadata?: TelemetryMetadata) {
  return getTelemetryConfig({
    functionId: 'edit-completion',
    metadata: filterUndefined({
      operationType: 'chat',
      mode: 'edit',
      ...metadata,
    }),
  });
}

/**
 * Create telemetry config for audio transcription.
 *
 * Use this when transcribing voice recordings with Whisper.
 *
 * @param metadata - Optional metadata to include in traces
 * @returns Telemetry configuration for transcription operations
 */
export function transcriptionTelemetry(metadata?: TelemetryMetadata) {
  return getTelemetryConfig({
    functionId: 'audio-transcription',
    metadata: filterUndefined({
      operationType: 'transcription',
      ...metadata,
    }),
  });
}

// ============================================================================
// Generic Telemetry Factory
// ============================================================================

/**
 * Create a custom telemetry configuration.
 *
 * Use this for operations that don't fit the standard categories.
 *
 * @param functionId - Identifier for this operation type
 * @param metadata - Optional metadata to include in traces
 * @returns Telemetry configuration
 *
 * @example
 * ```typescript
 * import { createTelemetry } from '@/lib/observability/traced-ai';
 *
 * const result = generateText({
 *   model: getChatModel(),
 *   prompt: '...',
 *   experimental_telemetry: createTelemetry('custom-operation', {
 *     customField: 'value',
 *   }),
 * });
 * ```
 */
export function createTelemetry(functionId: string, metadata?: TelemetryMetadata) {
  return getTelemetryConfig({
    functionId,
    metadata: metadata ? filterUndefined(metadata) : undefined,
  });
}

// ============================================================================
// Re-exports
// ============================================================================

export { isLangfuseEnabled, flushLangfuse, getTelemetryConfig } from './langfuse';
