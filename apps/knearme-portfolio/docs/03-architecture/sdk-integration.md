# SDK Integration and Observability Architecture

> **Decision Date**: January 2026
> **Status**: Implemented
> **Related ADR**: [ADR-003 - AI Provider Strategy](../05-decisions/adr/ADR-003-openai.md)

## Overview

This document describes KnearMe's AI SDK integration strategy and observability architecture following the evaluation of multiple approaches in January 2026.

## SDK Choice: Vercel AI SDK with Google Provider

### Selected Stack

| Component | Package | Purpose |
|-----------|---------|---------|
| **Core SDK** | `ai` (Vercel AI SDK) | Unified API for AI operations |
| **Google Provider** | `@ai-sdk/google` | Gemini 3.0 Flash integration |
| **React Hooks** | `@ai-sdk/react` | `useChat` hook for chat UIs |
| **Live Voice** | `@google/genai` | Multimodal Live API (experimental) |
| **Observability** | `langfuse-vercel` | OpenTelemetry tracing via Langfuse |

### Why Not Google Interactions API?

The Google Interactions API (beta) was evaluated but not adopted because:

1. **Beta Status**: Still in experimental phase with breaking changes
2. **TypeScript Issues**: Type definitions incomplete for SDK integration
3. **Provider Lock-in**: No abstraction layer for multi-provider fallback
4. **Migration Cost**: Would require rewriting all existing AI operations

The Vercel AI SDK provides:
- Stable, production-ready APIs
- Provider abstraction (can swap Google → OpenAI if needed)
- Built-in streaming support
- Native OpenTelemetry integration

## Observability Architecture

### Langfuse Integration

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
├──────────────────┬──────────────────┬───────────────────────┤
│  instrumentation.ts                 │                        │
│  ├─ registerOTel()                  │  Agent Calls           │
│  └─ LangfuseExporter                │  ├─ generateText()     │
│                                     │  ├─ generateObject()   │
│                                     │  └─ streamText()       │
├──────────────────┴──────────────────┴───────────────────────┤
│                    OpenTelemetry Spans                       │
├──────────────────────────────────────────────────────────────┤
│                     Langfuse Cloud                           │
│  ├─ Trace visualization                                      │
│  ├─ Token usage tracking                                     │
│  ├─ Cost estimation                                          │
│  └─ Agent performance metrics                                │
└──────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/instrumentation.ts` | Wires LangfuseExporter into Next.js OpenTelemetry |
| `src/lib/observability/langfuse.ts` | Langfuse configuration and telemetry helpers |
| `src/lib/observability/agent-logger.ts` | Structured agent logging with correlation IDs |

### Correlation ID Hierarchy

```
conversationId (session-level)
└── requestTraceId (per-request)
    └── agentSpanId (per-agent invocation)
        └── toolSpanId (per-tool call)
```

This hierarchy enables:
- Tracing entire conversations across multiple requests
- Linking parent-child relationships in Langfuse
- Debugging "why did the agent do that?" questions

### Agent Logger Pattern

All agents use `createAgentLogger` for structured observability:

```typescript
import { createAgentLogger, createCorrelationContext } from '@/lib/observability/agent-logger';

const correlationCtx = createCorrelationContext(conversationId, businessId);
const logger = createAgentLogger('story-extractor', correlationCtx, 'extraction');

logger.start({ inputData });
logger.decision('Extracted project type', { confidence: 0.9, decision: 'chimney-rebuild' });
logger.complete({ fieldsExtracted: 5 }, { prompt: 500, completion: 200 });
```

### Telemetry in AI SDK Calls

All `generateText` and `generateObject` calls include `experimental_telemetry`:

```typescript
import { getTelemetryConfig } from '@/lib/observability/langfuse';

const result = await generateText({
  model: getGenerationModel(),
  system: SYSTEM_PROMPT,
  prompt: userPrompt,
  experimental_telemetry: getTelemetryConfig({
    functionId: 'content-generator',
    metadata: {
      agent: 'content-generator',
      phase: 'generating',
      projectType: state.projectType,
    },
  }),
});
```

## Reliability Patterns

### Circuit Breaker

All agent AI calls are wrapped with `withCircuitBreaker`:

```typescript
import { withCircuitBreaker } from '@/lib/agents/circuit-breaker';

const result = await withCircuitBreaker('content-generator', async () => {
  return generateObject({ ... });
});
```

Configuration per agent type:
- `content-generator`: 3 failures to open (critical)
- `discovery`: 5 failures to open (external API, more lenient)
- `story-extractor`: 3 failures (critical for flow)

### Retry Logic

Transient failures use exponential backoff:

```typescript
import { withRetry, AI_RETRY_OPTIONS } from '@/lib/ai/retry';

const result = await withRetry(
  () => generateText({ ... }),
  AI_RETRY_OPTIONS  // maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 30000
);
```

## Environment Configuration

```bash
# Langfuse (required for observability)
LANGFUSE_PUBLIC_KEY=pk-lf-xxx
LANGFUSE_SECRET_KEY=sk-lf-xxx
LANGFUSE_BASEURL=https://cloud.langfuse.com  # optional, defaults to cloud

# Disable observability (optional)
LANGFUSE_ENABLED=false  # set to disable

# Google AI (required for AI features)
GOOGLE_GENERATIVE_AI_API_KEY=xxx
```

## Verification

### Smoke Tests

Run the Langfuse configuration smoke tests:

```bash
npm test src/__tests__/smoke/langfuse-tracing.test.ts
# 17 tests covering isLangfuseEnabled, getLangfuseExporter, getTelemetryConfig
```

### Integration Tests

Run the agent correlation tests:

```bash
npm test src/__tests__/integration/agent-correlation.test.ts
# 14 tests covering correlation context, event hierarchy, timing
```

### Manual Verification

1. Start dev server: `npm run dev`
2. Send a chat message that triggers content generation
3. Open Langfuse dashboard
4. Verify trace appears within 10 seconds
5. Check for: agent_start, agent_decision, agent_complete events
6. Verify correlation IDs link events together

## Migration Notes

### From OpenAI to Google

The codebase previously used OpenAI. The migration to Google Gemini preserved:
- All Vercel AI SDK patterns (`generateText`, `generateObject`, `streamText`)
- Same observability infrastructure (Langfuse via OpenTelemetry)
- Same circuit breaker and retry patterns

### Packages Removed (January 2026)

- `@ai-sdk/openai` - Not used after migration to Google
- `openai` - Only used in test scripts, not production

### Packages Kept

- `@ai-sdk/react` - Actively used for `useChat` hook in chat components
- `@google/genai` - Used for Multimodal Live API (experimental voice features)

## References

- [Langfuse Vercel AI SDK Integration](https://langfuse.com/integrations/frameworks/vercel-ai-sdk)
- [Vercel AI SDK Documentation](https://ai-sdk.dev/)
- [Agent Logger Implementation](../../src/lib/observability/agent-logger.ts)
- [Circuit Breaker Implementation](../../src/lib/agents/circuit-breaker.ts)
