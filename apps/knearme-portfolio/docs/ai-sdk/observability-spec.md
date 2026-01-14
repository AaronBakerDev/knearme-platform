# Observability Specification

> Technical specification for AI observability using Langfuse in knearme-portfolio.
> Provides tracing, metrics, and debugging for the chat agent system.

---

## Table of Contents

1. [Overview](#overview)
2. [Why Langfuse](#why-langfuse)
3. [Installation & Setup](#installation--setup)
4. [Tracing Patterns](#tracing-patterns)
5. [What to Track](#what-to-track)
6. [Structured Logging](#structured-logging)
7. [Metrics & Dashboard](#metrics--dashboard)
8. [Error Tracking](#error-tracking)
9. [Cost Monitoring](#cost-monitoring)
10. [Integration with Chat Route](#integration-with-chat-route)

---

## Overview

Observability enables visibility into AI agent behavior, performance, and reliability. Without it, debugging agent issues is guesswork.

### Goals

1. **Debug failures** - Understand why tool calls fail or produce wrong results
2. **Monitor performance** - Track latency, throughput, and error rates
3. **Optimize costs** - Track token usage per session and feature
4. **Improve quality** - Identify patterns in agent behavior for refinement

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Chat API Route                               │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Langfuse Trace                                          │   │
│   │  ├── Span: message_received                              │   │
│   │  ├── Generation: llm_call                                │   │
│   │  │   └── Usage: tokens, latency                          │   │
│   │  ├── Span: tool_call (extractProjectData)                │   │
│   │  │   └── Output: extracted data                          │   │
│   │  ├── Span: tool_call (showProgress)                      │   │
│   │  └── Span: response_streamed                             │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Langfuse Dashboard                            │
│   - Trace timeline with nested spans                             │
│   - Token usage & cost per trace                                 │
│   - Error rates and failure patterns                             │
│   - Session-level analytics                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why Langfuse

We chose Langfuse over alternatives for several reasons:

| Feature | Langfuse | LangSmith | Helicone | Custom |
|---------|----------|-----------|----------|--------|
| Open source | ✅ | ❌ | ❌ | ✅ |
| Self-hostable | ✅ | ❌ | ❌ | ✅ |
| Vercel AI SDK integration | ✅ | ⚠️ | ⚠️ | N/A |
| Free tier | Generous | Limited | Limited | ∞ |
| Trace visualization | Excellent | Excellent | Good | Manual |
| Session grouping | ✅ | ✅ | ⚠️ | Manual |

**Key reasons:**
1. **Native Vercel AI SDK support** via `@langfuse/vercel-ai`
2. **Open source** - can self-host for data privacy
3. **Generous free tier** for development
4. **Clean UI** for trace exploration

---

## Installation & Setup

### 1. Install Dependencies

```bash
npm install langfuse @langfuse/vercel-ai
```

### 2. Environment Variables

```bash
# .env.local
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com  # or self-hosted URL

# Optional: Disable in development
LANGFUSE_ENABLED=true
```

### 3. Create Langfuse Client

```typescript
// src/lib/observability/langfuse.ts

import { Langfuse } from 'langfuse';

/**
 * Langfuse client singleton.
 * @see https://langfuse.com/docs/integrations/vercel-ai-sdk
 */
export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
  enabled: process.env.LANGFUSE_ENABLED !== 'false',
});

/**
 * Check if Langfuse is configured and enabled.
 */
export function isLangfuseEnabled(): boolean {
  return !!(
    process.env.LANGFUSE_PUBLIC_KEY &&
    process.env.LANGFUSE_SECRET_KEY &&
    process.env.LANGFUSE_ENABLED !== 'false'
  );
}
```

### 4. Vercel AI SDK Integration

Use the `@langfuse/vercel-ai` package for automatic tracing:

```typescript
// src/lib/observability/traced-ai.ts

import { experimental_createLangfuseModelWrapper as createLangfuseModelWrapper } from '@langfuse/vercel-ai';
import { getChatModel } from '@/lib/ai/providers';
import { langfuse, isLangfuseEnabled } from './langfuse';

/**
 * Create a traced model wrapper.
 * Automatically logs generations to Langfuse.
 */
export function getTracedModel(traceId?: string) {
  if (!isLangfuseEnabled()) {
    return getChatModel();
  }

  return createLangfuseModelWrapper({
    model: getChatModel(),
    langfuse,
    traceId,
    generationName: 'chat_completion',
  });
}
```

---

## Tracing Patterns

### Basic Trace Structure

Each chat request creates a trace with nested spans:

```typescript
// Trace hierarchy
Trace: chat_message
├── Span: auth_check
├── Span: parse_request
├── Generation: llm_call
│   ├── Input: messages
│   ├── Output: response + tool calls
│   └── Usage: tokens, latency
├── Span: tool_execution (for each tool)
│   ├── Input: tool args
│   └── Output: tool result
└── Span: stream_response
```

### Creating Traces

```typescript
// src/lib/observability/tracing.ts

import { langfuse } from './langfuse';
import type { Trace, Span } from 'langfuse';

export interface TraceContext {
  trace: Trace;
  userId: string;
  sessionId: string;
  projectId?: string;
}

/**
 * Create a new trace for a chat message.
 */
export function createChatTrace(params: {
  userId: string;
  sessionId: string;
  projectId?: string;
  messageCount: number;
}): TraceContext {
  const trace = langfuse.trace({
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

/**
 * Create a span within a trace.
 */
export function createSpan(
  trace: Trace,
  name: string,
  input?: unknown
): Span {
  return trace.span({
    name,
    input,
    startTime: new Date(),
  });
}

/**
 * End a span with output.
 */
export function endSpan(
  span: Span,
  output?: unknown,
  metadata?: Record<string, unknown>
): void {
  span.end({
    output,
    metadata,
    endTime: new Date(),
  });
}

/**
 * End span with error.
 */
export function endSpanWithError(
  span: Span,
  error: Error
): void {
  span.end({
    level: 'ERROR',
    statusMessage: error.message,
    metadata: {
      errorName: error.name,
      errorStack: error.stack,
    },
    endTime: new Date(),
  });
}
```

### Tool Call Tracing

```typescript
/**
 * Wrap a tool execution with tracing.
 */
export function traceToolExecution<T>(
  trace: Trace,
  toolName: string,
  args: unknown,
  execute: () => Promise<T>
): Promise<T> {
  const span = trace.span({
    name: `tool_${toolName}`,
    input: args,
    metadata: { toolName },
  });

  return execute()
    .then((result) => {
      span.end({
        output: result,
        level: 'DEFAULT',
      });
      return result;
    })
    .catch((error) => {
      span.end({
        level: 'ERROR',
        statusMessage: error.message,
      });
      throw error;
    });
}
```

---

## What to Track

### Must Track (Critical)

| Event | Why | Data |
|-------|-----|------|
| LLM generations | Core functionality | Input, output, tokens, latency |
| Tool calls | Debug extraction issues | Tool name, args, result, duration |
| Errors | Identify failures | Error type, message, context |
| Session boundaries | Conversation grouping | Session ID, user ID |

### Should Track (Important)

| Event | Why | Data |
|-------|-----|------|
| Database saves | Persistence success | Table, row ID, fields updated |
| Auth checks | Security audit | User ID, success/failure |
| Message count | Conversation length | Count per session |
| Completeness scores | Progress tracking | Score, phase |

### Nice to Track (Analytics)

| Event | Why | Data |
|-------|-----|------|
| User edits | Quality feedback | Field, before/after |
| Time to completion | UX optimization | Duration per phase |
| Retry attempts | Reliability patterns | Count, reason |
| Feature usage | Product analytics | Feature name, frequency |

---

## Structured Logging

In addition to Langfuse traces, use structured logs for debugging.

### Log Format

```typescript
// src/lib/observability/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: {
    traceId?: string;
    sessionId?: string;
    userId?: string;
    projectId?: string;
    [key: string]: unknown;
  };
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Structured logger for consistent log format.
 */
export function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: {
      ...context,
    },
  };

  // In production, could send to log aggregator
  // For now, use console with JSON
  const consoleMethod = level === 'error' ? console.error :
                        level === 'warn' ? console.warn :
                        level === 'debug' ? console.debug :
                        console.log;

  consoleMethod(JSON.stringify(entry));
}

// Convenience methods
export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log('debug', msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => log('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log('error', msg, ctx),
};
```

### Log Context Propagation

```typescript
// In API route
export async function POST(request: Request) {
  const traceId = crypto.randomUUID();

  logger.info('Chat request received', {
    traceId,
    contentLength: request.headers.get('content-length'),
  });

  try {
    // ... processing
    logger.info('Chat response sent', {
      traceId,
      toolCallCount: 2,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('Chat request failed', {
      traceId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
```

---

## Metrics & Dashboard

### Key Metrics to Monitor

```typescript
// src/lib/observability/metrics.ts

export interface ChatMetrics {
  // Latency
  llm_latency_p50: number;
  llm_latency_p95: number;
  llm_latency_p99: number;

  // Throughput
  requests_per_minute: number;
  tool_calls_per_session: number;

  // Reliability
  error_rate: number;
  tool_success_rate: number;
  completion_rate: number;

  // Quality
  avg_completeness_score: number;
  clarification_request_rate: number;
  user_edit_rate: number;

  // Cost
  tokens_per_session: number;
  cost_per_session: number;
}
```

### Langfuse Dashboard Setup

Create these views in Langfuse:

1. **Session Overview**
   - Filter by: last 24h, status, user
   - Group by: session ID
   - Show: duration, token count, error status

2. **Error Investigation**
   - Filter by: level = ERROR
   - Sort by: timestamp DESC
   - Show: error message, trace link

3. **Tool Performance**
   - Filter by: span name starts with "tool_"
   - Group by: tool name
   - Show: avg duration, success rate

4. **Cost Analysis**
   - Group by: day, user
   - Show: total tokens, estimated cost
   - Compare: week over week

### Custom Scoring

Langfuse supports custom scores for quality evaluation:

```typescript
// Add custom score to a trace
trace.score({
  name: 'completeness',
  value: 0.75,  // 0-1 scale
  comment: 'Missing photos',
});

trace.score({
  name: 'user_satisfaction',
  value: 1,  // Binary: edited (0) or accepted (1)
});
```

---

## Error Tracking

### Error Categories

```typescript
export enum ChatErrorCategory {
  // Auth errors
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',

  // LLM errors
  LLM_TIMEOUT = 'LLM_TIMEOUT',
  LLM_RATE_LIMIT = 'LLM_RATE_LIMIT',
  LLM_INVALID_RESPONSE = 'LLM_INVALID_RESPONSE',

  // Tool errors
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
  TOOL_INVALID_ARGS = 'TOOL_INVALID_ARGS',

  // Database errors
  DB_CONNECTION_FAILED = 'DB_CONNECTION_FAILED',
  DB_WRITE_FAILED = 'DB_WRITE_FAILED',

  // Client errors
  REQUEST_INVALID = 'REQUEST_INVALID',
  REQUEST_TOO_LARGE = 'REQUEST_TOO_LARGE',

  // Unknown
  UNKNOWN = 'UNKNOWN',
}
```

### Error Tracking in Langfuse

```typescript
/**
 * Track an error with full context.
 */
export function trackError(
  trace: Trace,
  error: Error,
  category: ChatErrorCategory,
  context?: Record<string, unknown>
): void {
  // Add error event to trace
  trace.event({
    name: 'error',
    level: 'ERROR',
    statusMessage: error.message,
    metadata: {
      category,
      errorName: error.name,
      errorStack: error.stack,
      ...context,
    },
  });

  // Update trace status
  trace.update({
    output: {
      error: true,
      errorCategory: category,
      errorMessage: error.message,
    },
    tags: ['error', category.toLowerCase()],
  });

  // Also log for local debugging
  logger.error(`[${category}] ${error.message}`, {
    traceId: trace.id,
    category,
    ...context,
  });
}
```

### Alerting (Future)

Configure Langfuse webhooks or integrate with PagerDuty/Slack:

```typescript
// Webhook payload for error spike
{
  type: 'error_spike',
  threshold: 5,  // errors per minute
  current: 12,
  traces: ['trace_id_1', 'trace_id_2', ...],
  timeWindow: '5m'
}
```

---

## Cost Monitoring

### Token Tracking

```typescript
/**
 * Track token usage and estimated cost.
 */
export function trackUsage(
  trace: Trace,
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }
): void {
  // Gemini 2.0 Flash pricing (as of Dec 2024)
  // Input: $0.075 / 1M tokens, Output: $0.30 / 1M tokens
  const GEMINI_INPUT_COST_PER_TOKEN = 0.075 / 1_000_000;
  const GEMINI_OUTPUT_COST_PER_TOKEN = 0.30 / 1_000_000;

  const estimatedCost =
    (usage.promptTokens * GEMINI_INPUT_COST_PER_TOKEN) +
    (usage.completionTokens * GEMINI_OUTPUT_COST_PER_TOKEN);

  trace.update({
    metadata: {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      estimatedCostUsd: estimatedCost.toFixed(6),
    },
  });

  // Score for easy aggregation
  trace.score({
    name: 'cost_usd',
    value: estimatedCost,
  });
}
```

### Budget Alerts

```typescript
// Check session cost against budget
const SESSION_COST_LIMIT_USD = 0.10;  // $0.10 per session

if (sessionTotalCost > SESSION_COST_LIMIT_USD) {
  logger.warn('Session cost exceeded limit', {
    sessionId,
    cost: sessionTotalCost,
    limit: SESSION_COST_LIMIT_USD,
  });

  // Could limit further tool calls or warn user
}
```

---

## Integration with Chat Route

### Full Integration Example

```typescript
// src/app/api/chat/route.ts

import { streamText, tool, convertToModelMessages } from 'ai';
import { langfuse, isLangfuseEnabled } from '@/lib/observability/langfuse';
import { createChatTrace, createSpan, endSpan, trackError, trackUsage } from '@/lib/observability/tracing';
import { logger } from '@/lib/observability/logger';
import { ChatErrorCategory } from '@/lib/observability/errors';

export const maxDuration = 60;

export async function POST(request: Request) {
  const startTime = Date.now();

  // Create trace (if Langfuse enabled)
  const traceContext = isLangfuseEnabled()
    ? createChatTrace({
        userId: 'pending', // Set after auth
        sessionId: 'pending',
        messageCount: 0,
      })
    : null;

  const trace = traceContext?.trace;

  try {
    // Auth span
    const authSpan = trace?.span({ name: 'auth_check' });
    const auth = await requireAuth();

    if (isAuthError(auth)) {
      authSpan?.end({ level: 'WARNING', statusMessage: 'Auth failed' });
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.type === 'UNAUTHORIZED' ? 401 : 403,
      });
    }
    authSpan?.end({ output: { userId: auth.user.id } });

    // Update trace with user info
    trace?.update({
      userId: auth.user.id,
      metadata: { contractorId: auth.contractor?.id },
    });

    // Parse request
    const parseSpan = trace?.span({ name: 'parse_request' });
    const { messages, projectId, sessionId }: {
      messages: UIMessage[];
      projectId?: string;
      sessionId?: string;
    } = await request.json();
    parseSpan?.end({ output: { messageCount: messages.length, projectId } });

    // Update trace with session info
    trace?.update({
      sessionId: sessionId || `session-${projectId || 'new'}`,
      metadata: { projectId, messageCount: messages.length },
    });

    // Stream with tools
    let toolCallCount = 0;

    const result = streamText({
      model: getChatModel(),
      system: CONVERSATION_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: {
        extractProjectData: tool({
          description: 'Extract project information',
          inputSchema: extractProjectDataSchema,
          execute: async (args) => {
            const toolSpan = trace?.span({
              name: 'tool_extractProjectData',
              input: args,
            });
            toolCallCount++;

            try {
              // Save to database
              if (projectId) {
                await saveProjectData(projectId, args);
              }

              toolSpan?.end({
                output: args,
                metadata: { saved: !!projectId },
              });

              return { ...args, saved: !!projectId };
            } catch (error) {
              toolSpan?.end({
                level: 'ERROR',
                statusMessage: error.message,
              });
              throw error;
            }
          },
        }),

        showProgress: tool({
          description: 'Show progress',
          inputSchema: showProgressSchema,
          execute: async (args) => {
            trace?.span({ name: 'tool_showProgress', input: args }).end({ output: args });
            toolCallCount++;
            return args;
          },
        }),

        requestClarification: tool({
          description: 'Request clarification',
          inputSchema: requestClarificationSchema,
          execute: async (args) => {
            trace?.span({
              name: 'tool_requestClarification',
              input: args,
            }).end({
              output: args,
              metadata: { confidence: args.confidence },
            });
            toolCallCount++;
            return args;
          },
        }),
      },
      stopWhen: stepCountIs(10),
      temperature: 0.7,
      onFinish: async (result) => {
        // Track usage
        if (result.usage && trace) {
          trackUsage(trace, {
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            totalTokens: result.usage.totalTokens,
          });
        }

        // Finalize trace
        trace?.update({
          output: {
            success: true,
            toolCallCount,
            duration: Date.now() - startTime,
          },
        });

        // Flush to Langfuse
        await langfuse.flush();
      },
    });

    logger.info('Chat stream started', {
      traceId: trace?.id,
      projectId,
      messageCount: messages.length,
    });

    return result.toUIMessageStreamResponse();

  } catch (error) {
    // Track error
    if (trace) {
      trackError(
        trace,
        error as Error,
        error.name === 'AuthError' ? ChatErrorCategory.AUTH_INVALID :
        error.message?.includes('timeout') ? ChatErrorCategory.LLM_TIMEOUT :
        ChatErrorCategory.UNKNOWN,
        { duration: Date.now() - startTime }
      );
    }

    logger.error('Chat request failed', {
      traceId: trace?.id,
      error: (error as Error).message,
    });

    // Flush to Langfuse even on error
    await langfuse.flush();

    return new Response(
      JSON.stringify({ error: 'Failed to process chat message' }),
      { status: 500 }
    );
  }
}
```

---

## Environment-Specific Configuration

### Development

```bash
# .env.development
LANGFUSE_ENABLED=true
LANGFUSE_PUBLIC_KEY=pk-lf-dev-...
LANGFUSE_SECRET_KEY=sk-lf-dev-...
```

- Full tracing enabled
- Verbose logging
- Local Langfuse dashboard

### Production

```bash
# .env.production
LANGFUSE_ENABLED=true
LANGFUSE_PUBLIC_KEY=pk-lf-prod-...
LANGFUSE_SECRET_KEY=sk-lf-prod-...
```

- Sampling for high-volume routes (optional)
- Alert webhooks configured
- Cost monitoring enabled

### Testing

```bash
# .env.test
LANGFUSE_ENABLED=false
```

- Tracing disabled
- Use mock functions

---

## Related Documentation

- **SDK Reference**: `./vercel-ai-sdk-reference.md`
- **Chat Artifacts**: `./chat-artifacts-spec.md`
- **Implementation Roadmap**: `./implementation-roadmap.md`
- **Langfuse Docs**: https://langfuse.com/docs
- **Vercel AI SDK Integration**: https://langfuse.com/docs/integrations/vercel-ai-sdk
