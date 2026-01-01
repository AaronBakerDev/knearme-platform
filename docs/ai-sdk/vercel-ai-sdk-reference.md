# Vercel AI SDK Reference Guide

> Comprehensive reference for the Vercel AI SDK as used in knearme-portfolio.
> Last Updated: December 2025 | AI SDK Version: 6.x
> **Primary Provider:** Google Gemini 3 Flash (preview) | **Transcription:** OpenAI Whisper

---

## Table of Contents

1. [Overview](#overview)
2. [Dependencies](#dependencies)
3. [Core Hooks](#core-hooks)
4. [Tool Calling](#tool-calling)
5. [Agent Patterns](#agent-patterns)
6. [Tool Choice Strategies](#tool-choice-strategies)
7. [Step Limits & Loops](#step-limits--loops)
8. [Type Safety](#type-safety)
9. [Message Structure](#message-structure)
10. [Streaming Patterns](#streaming-patterns)
11. [Generative UI](#generative-ui)
12. [Current Implementation](#current-implementation)
13. [API Patterns](#api-patterns)
14. [Best Practices](#best-practices)

---

## Overview

The Vercel AI SDK is a TypeScript library for building AI-powered applications. It provides:

- **AI SDK Core**: Unified API for LLM providers (Google, OpenAI, Anthropic, etc.)
- **AI SDK UI**: React hooks for chat interfaces (`useChat`, `useCompletion`, `useObject`)
- **AI SDK RSC**: React Server Components for Generative UI

**KnearMe uses:**
- **Gemini 3 Flash (preview)** for vision, generation, and chat (via `@ai-sdk/google`)
- **OpenAI Whisper** for transcription only (via `@ai-sdk/openai`)

**Official Documentation:** https://ai-sdk.dev/docs/introduction
**Gemini Models (API):** https://ai.google.dev/gemini-api/docs/models/gemini
**Gemini 3 Guide:** https://ai.google.dev/gemini-api/docs/gemini-3
**AI Gateway Models:** https://vercel.com/ai-gateway/models

---

## Dependencies

### Package Versions (knearme-portfolio)

```json
{
  "ai": "^6.0.3",                    // Core AI SDK (streaming, tools, UI)
  "@ai-sdk/google": "^3.0.1",        // Google Gemini provider (primary)
  "@ai-sdk/openai": "^3.0.1",        // OpenAI provider (Whisper only)
  "@ai-sdk/react": "^3.0.3",         // React hooks (useChat)
  "@ai-sdk/rsc": "^0.x"              // Optional: Generative UI (experimental)
}
```

### Import Map

```typescript
// Client-side hooks
import { useChat } from '@ai-sdk/react';

// Core utilities
import {
  streamText,
  generateObject,
  experimental_transcribe as transcribe,
  tool,
  convertToModelMessages,
  stepCountIs,
  type UIMessage
} from 'ai';

// Transport for custom API endpoints
import { DefaultChatTransport } from 'ai';

// Optional Generative UI (RSC, experimental)
import { streamUI } from '@ai-sdk/rsc';

// Providers
import { google } from '@ai-sdk/google';  // Primary: Gemini 3 Flash (preview)
import { openai } from '@ai-sdk/openai';  // Secondary: Whisper transcription

// Centralized provider config (preferred)
import { getChatModel, getVisionModel, getTranscriptionModel } from '@/lib/ai/providers';
```

---

## Model IDs (Gemini API vs AI Gateway)

**Gemini API (@ai-sdk/google) model IDs:**
- `gemini-3-flash-preview` (preview)
- `gemini-3-pro-preview` (preview)
- `gemini-3-pro-image-preview` (preview)

**Vercel AI Gateway model IDs:**
- `google/gemini-3-flash`
- `google/gemini-3-pro-preview`

**Reliability note:** All Gemini 3 models are currently in preview. For reliability-first flows, pin a stable fallback (for example `gemini-2.5-flash`) and gate preview usage behind a feature flag.
**Preview gating:** Set `AI_PREVIEW_MODELS=true` to opt into preview Gemini 3 models; otherwise the app uses the stable fallback.

## Core Hooks

### useChat

The primary hook for building chat interfaces with streaming support.

```typescript
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';

const {
  messages,      // UIMessage[] - conversation history
  sendMessage,   // (options: { text: string }) => Promise<void>
  status,        // 'ready' | 'streaming' | 'submitted' | 'error'
  setMessages,   // React.Dispatch<SetStateAction<UIMessage[]>>
  error,         // Error | undefined
  stop,          // () => void - abort streaming
  reload,        // () => Promise<void> - regenerate last response
  isLoading,     // boolean
} = useChat({
  id: 'unique-chat-id',              // Session identifier
  messages: [initialMessage],         // Initial messages (sets initial value only)
  transport: new DefaultChatTransport({
    api: '/api/chat',                 // Custom endpoint
  }),
  onFinish: (message) => {},          // Called when response completes
  onError: (error) => {},             // Called on error
});
```

**Important Notes:**

1. The `messages` prop only sets the **initial value** - use `setMessages()` for async updates
2. Status values:
   - `'ready'` - Idle, ready for input
   - `'submitted'` - Request sent, waiting for response
   - `'streaming'` - Receiving streamed response
   - `'error'` - Error occurred

### useObject (Streaming Structured Data)

For streaming JSON objects with real-time updates:

```typescript
import { useObject } from '@ai-sdk/react';

const { object, submit, isLoading, error } = useObject({
  api: '/api/generate-object',
  schema: myZodSchema,
  onFinish: ({ object }) => {},
});

// Trigger generation
submit({ prompt: 'Generate a portfolio preview' });

// Access partial results (may have undefined fields)
if (object?.title) {
  console.log(object.title);
}
```

---

## Tool Calling

### Defining Tools (Server-side)

Tools enable function calling within streaming responses:

```typescript
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getChatModel } from '@/lib/ai/providers';

const result = streamText({
  model: getChatModel(),  // google('gemini-3-flash-preview')
  system: 'You are a helpful assistant...',
  messages: await convertToModelMessages(messages),
  tools: {
    extractProjectData: tool({
      description: 'Extract project information from the conversation',
      inputSchema: z.object({
        project_type: z.string().optional(),
        materials_mentioned: z.array(z.string()).optional(),
        // ... more fields
      }),
      execute: async (args) => {
        // Return data that will be available in tool result
        return args;
      },
    }),

    showProgress: tool({
      description: 'Display progress to the user',
      inputSchema: z.object({
        collected: z.record(z.boolean()),
        message: z.string().optional(),
      }),
      execute: async (args) => args,
    }),
  },
  stopWhen: stepCountIs(3),  // Limit tool calling steps
  temperature: 0.7,
});
```

### Tool Result Structure

When a tool is called, the message parts include tool invocations with explicit state transitions. Core states to handle in the UI:

- `input-streaming`
- `input-available`
- `approval-requested`
- `approval-responded`
- `output-available`
- `output-error`
- `output-denied` (if tool approvals are enabled)

```typescript
// Tool input part (after input is available)
{
  type: 'tool-{toolName}',
  state: 'input-available',
  toolCallId: 'call_abc123',
  input: { project_type: 'chimney', ... }
}

// Tool result part (after execution)
{
  type: 'tool-{toolName}',
  state: 'output-available',
  toolCallId: 'call_abc123',
  input: { project_type: 'chimney', ... },
  output: { project_type: 'chimney', ... }
}
```

### Detecting Tool Results (Client-side)

```typescript
useEffect(() => {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === 'assistant' && lastMessage.parts) {
    for (const part of lastMessage.parts) {
      // Check for tool result
      if (
        part.type === 'tool-extractProjectData' &&
        'state' in part &&
        part.state === 'output-available' &&
        'output' in part
      ) {
        const result = part.output as ExtractedProjectData;
        handleExtractedData(result);
      }
    }
  }
}, [messages]);
```

---

## Agent Patterns

The AI SDK provides multiple approaches for building AI agents. This section documents when to use each approach.

### streamText vs ToolLoopAgent

The AI SDK offers two main patterns for tool-calling agents:

| Pattern | Use Case | Complexity | Control |
|---------|----------|------------|---------|
| `streamText` with tools | Single-response tool calls, data extraction | Low | High |
| `ToolLoopAgent` | Multi-step reasoning, autonomous workflows | Medium | Lower |

**KnearMe Decision:** We use **`streamText`** for the following reasons:
1. **More control** over tool execution and error handling
2. **Simpler state management** - no agent lifecycle to manage
3. **Sufficient for our use case** - extracting data from conversation doesn't need autonomous multi-step reasoning
4. **Better debugging** - direct tool call visibility

### When to Use ToolLoopAgent

Consider `ToolLoopAgent` when you need:
- **Autonomous multi-step reasoning** (ReAct pattern)
- **Dynamic tool selection** based on previous results
- **Built-in retry logic** and step management
- **Self-correcting behavior** from tool errors

```typescript
// Example: ToolLoopAgent (NOT used in KnearMe, shown for reference)
import { ToolLoopAgent } from 'ai';

const agent = new ToolLoopAgent({
  model: getChatModel(),
  system: 'You are a research assistant...',
  tools: {
    search: searchTool,
    summarize: summarizeTool,
    save: saveTool,
  },
  maxSteps: 20,
});

const result = await agent.run('Research and summarize recent news about AI');
```

### When to Use streamText (KnearMe Approach)

Use `streamText` with tools when:
- **Extracting structured data** from conversation
- **Single-response tool calls** are sufficient
- **Fine-grained control** over tool execution is needed
- **Streaming to UI** is required during tool execution

```typescript
// KnearMe pattern: streamText with tools
const result = streamText({
  model: getChatModel(),
  messages: await convertToModelMessages(messages),
  tools: {
    extractProjectData: tool({
      description: 'Extract project info from conversation',
      inputSchema: extractProjectDataSchema,
      execute: async (args, { projectId }) => {
        // Direct control: save to database immediately
        await saveProjectData(projectId, args);
        return { ...args, saved: true };
      },
    }),
  },
  stopWhen: stepCountIs(10),  // Allow up to 10 tool calls
});

return result.toUIMessageStreamResponse();
```

---

## Tool Choice Strategies

Control how the model decides whether to call tools.

### Available Strategies

```typescript
const result = streamText({
  model: getChatModel(),
  messages,
  tools: { extractData, showProgress, promptForImages },

  // Strategy options:
  toolChoice: 'auto',              // Model decides (default)
  toolChoice: 'required',          // Must call at least one tool
  toolChoice: 'none',              // Disable all tools
  toolChoice: { type: 'tool', toolName: 'extractData' },  // Force specific tool
});
```

### Strategy Selection Guide

| Strategy | When to Use | Example |
|----------|-------------|---------|
| `'auto'` (default) | Most conversations - let model decide | General chat flow |
| `'required'` | Ensure data extraction happens | Final message before phase change |
| `'none'` | Disable tools temporarily | Error recovery, simple responses |
| `{ type: 'tool', toolName }` | Force specific tool | Testing, guaranteed extraction |

### Dynamic Tool Choice

Change tool availability based on conversation state:

```typescript
async function POST(request: Request) {
  const { messages, phase } = await request.json();

  // Adjust tools based on conversation phase
  const activeTools = {
    extractProjectData: extractProjectDataTool,
    ...(phase === 'gathering' && { showProgress: showProgressTool }),
    ...(phase === 'complete' && { promptForImages: promptForImagesTool }),
  };

  // Adjust choice based on message count
  const toolChoice = messages.length > 6 ? 'required' : 'auto';

  const result = streamText({
    model: getChatModel(),
    messages: await convertToModelMessages(messages),
    tools: activeTools,
    toolChoice,
  });

  return result.toUIMessageStreamResponse();
}
```

---

## Step Limits & Loops

Control how many times the model can call tools in a single response.

### Why Step Limits Matter

Without limits, an agent could:
- Enter infinite loops calling tools repeatedly
- Rack up API costs from excessive calls
- Timeout before completing

### Recommended Settings

```typescript
import { stepCountIs } from 'ai';

const result = streamText({
  model: getChatModel(),
  messages,
  tools: { /* ... */ },

  // Step limit options:
  stopWhen: stepCountIs(10),    // RECOMMENDED: Allow up to 10 tool calls
  // stopWhen: stepCountIs(3),  // TOO RESTRICTIVE for multi-tool flows
  // stopWhen: stepCountIs(20), // DEFAULT if not specified
});
```

### Step Limit Guidelines

| Limit | Use Case | Rationale |
|-------|----------|-----------|
| 3 | Single-purpose extraction | Too restrictive for multi-tool agents |
| **10** | **Recommended default** | Balances capability with safety |
| 20 | Complex autonomous workflows | SDK default, use for ToolLoopAgent |
| 50+ | Long-running research tasks | Requires careful monitoring |

### KnearMe Recommendation

**Use `stepCountIs(10)`** for the chat wizard:

```typescript
// Current (too restrictive):
stopWhen: stepCountIs(3)   // ❌ Only allows 3 tool calls total

// Recommended:
stopWhen: stepCountIs(10)  // ✅ Allows multiple tools per response
```

**Why 10 steps?**
1. Allows `extractProjectData` + `showProgress` + text response
2. Handles retry scenarios gracefully
3. Prevents runaway loops
4. Aligns with typical conversation complexity

### Monitoring Step Usage

```typescript
// Track tool calls for observability
let toolCallCount = 0;

const result = streamText({
  model: getChatModel(),
  tools: {
    extractData: tool({
      // ...
      execute: async (args) => {
        toolCallCount++;
        console.log(`Tool call #${toolCallCount}:`, args);
        return args;
      },
    }),
  },
  stopWhen: stepCountIs(10),
  onFinish: () => {
    // Log total for observability
    metrics.record('tool_calls_per_response', toolCallCount);
  },
});
```

---

## Type Safety

Ensure type safety across the tool calling boundary.

### Tool Input/Output Types

Define explicit types for tool schemas:

```typescript
import { z } from 'zod';
import { tool } from 'ai';

// Define schema with Zod
const extractProjectDataSchema = z.object({
  project_type: z.string().optional(),
  materials_mentioned: z.array(z.string()).optional(),
  ready_for_images: z.boolean().optional(),
});

// Infer TypeScript type from schema
type ExtractedProjectData = z.infer<typeof extractProjectDataSchema>;

// Tool with typed execute function
const extractProjectDataTool = tool({
  description: 'Extract project information',
  inputSchema: extractProjectDataSchema,
  execute: async (args: ExtractedProjectData): Promise<ExtractedProjectData & { saved: boolean }> => {
    await saveToDatabase(args);
    return { ...args, saved: true };
  },
});
```

### UIMessage Type Extensions

Extend UIMessage for custom tool parts:

```typescript
import type { UIMessage } from 'ai';

// Define tool-specific part types
interface ExtractProjectDataPart {
  type: 'tool-extractProjectData';
  state:
    | 'input-streaming'
    | 'input-available'
    | 'approval-requested'
    | 'approval-responded'
    | 'output-available'
    | 'output-error'
    | 'output-denied';
  toolCallId: string;
  input?: ExtractedProjectData;
  output?: ExtractedProjectData & { saved: boolean };
  errorText?: string;
}

interface ShowProgressPart {
  type: 'tool-showProgress';
  state:
    | 'input-streaming'
    | 'input-available'
    | 'approval-requested'
    | 'approval-responded'
    | 'output-available'
    | 'output-error'
    | 'output-denied';
  toolCallId: string;
  input?: { completeness: number; collected: Record<string, boolean> };
  output?: { completeness: number; collected: Record<string, boolean> };
  errorText?: string;
}

// Union of all custom parts
type CustomToolPart = ExtractProjectDataPart | ShowProgressPart;

// Extend UIMessage parts
interface ExtendedUIMessage extends Omit<UIMessage, 'parts'> {
  parts: (UIMessage['parts'][number] | CustomToolPart)[];
}
```

### Type-Safe Tool Result Extraction

```typescript
/**
 * Extract typed tool result from a message.
 * @see https://ai-sdk.dev/docs/agents/tool-calling#extracting-tool-results
 */
function extractToolResult<T>(
  message: UIMessage,
  toolName: string
): T | null {
  if (!message.parts) return null;

  const part = message.parts.find(
    (p): p is { type: string; state: string; output: T } =>
      p.type === `tool-${toolName}` &&
      'state' in p &&
      p.state === 'output-available' &&
      'output' in p
  );

  return part?.output ?? null;
}

// Usage with explicit type
const projectData = extractToolResult<ExtractedProjectData>(
  lastMessage,
  'extractProjectData'
);

if (projectData?.ready_for_images) {
  setPhase('uploading');
}
```

### Tool Context Typing

Pass typed context to tool execute functions:

```typescript
interface ToolContext {
  projectId: string;
  sessionId: string;
  userId: string;
}

const extractProjectDataTool = tool({
  description: 'Extract project information',
  inputSchema: extractProjectDataSchema,
  execute: async (args, context: ToolContext) => {
    // TypeScript knows context shape
    await supabase
      .from('projects')
      .update(args)
      .eq('id', context.projectId);

    return { ...args, saved: true };
  },
});

// Pass context when creating streamText
const result = streamText({
  model: getChatModel(),
  tools: { extractProjectData: extractProjectDataTool },
  // Context passed to all tool execute functions
  experimental_toolContext: {
    projectId,
    sessionId: session.id,
    userId: auth.user.id,
  } satisfies ToolContext,
});
```

---

## Message Structure

### UIMessage Type

```typescript
interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
}

type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'image'; image: string | Uint8Array }
  | {
      type: `tool-${string}`;
      state:
        | 'input-streaming'
        | 'input-available'
        | 'approval-requested'
        | 'approval-responded'
        | 'output-available'
        | 'output-error'
        | 'output-denied';
      toolCallId: string;
      input?: unknown;
      output?: unknown;
      errorText?: string;
    }
  | { type: 'file'; mimeType: string; data: string };
```

### Converting to Model Messages

When sending to the API, convert UI messages to model format:

```typescript
import { convertToModelMessages } from 'ai';

const modelMessages = await convertToModelMessages(uiMessages);
```

### Extracting Text Content

```typescript
function getTextContent(message: UIMessage): string {
  return message.parts
    ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('\n') || '';
}
```

---

## Streaming Patterns

### Server-Side Streaming (API Route)

```typescript
// app/api/chat/route.ts
import { streamText, tool, convertToModelMessages } from 'ai';
import { getChatModel } from '@/lib/ai/providers';

export const maxDuration = 60; // Allow up to 60s streaming

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: getChatModel(),  // Gemini 3 Flash (preview)
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: { /* ... */ },
    temperature: 0.7,
  });

  // Return as UIMessage stream (for useChat)
  return result.toUIMessageStreamResponse();
}
```

### Stream Response Types

```typescript
// For useChat hook
return result.toUIMessageStreamResponse();

// For raw text streaming
return result.toTextStreamResponse();

// For data streaming with metadata
return result.toDataStreamResponse();
```

### Handling Streaming Status

```typescript
const { status, isLoading } = useChat({ /* ... */ });

// Derived state
const isStreaming = status === 'streaming' || status === 'submitted';

// Show typing indicator
{isStreaming && <TypingIndicator />}

// Disable input during streaming
<ChatInput disabled={isStreaming} />
```

---

## Generative UI

> Note: Generative UI (RSC) is experimental in AI SDK v6. Use feature flags and prefer AI SDK UI for production-critical flows.

Generative UI allows streaming React components from the server. This is the foundation for artifacts.

### streamUI (Recommended for Artifacts)

```typescript
import { streamUI } from '@ai-sdk/rsc';
import { getChatModel } from '@/lib/ai/providers';

async function submitMessage(message: string) {
  'use server';

  return streamUI({
    model: getChatModel(),  // Gemini 3 Flash (preview)
    system: 'You are a helpful assistant...',
    messages: [{ role: 'user', content: message }],

    // Default text rendering
    text: ({ content }) => <p>{content}</p>,

    // Tool renders as components
    tools: {
      showWeather: {
        description: 'Show weather for a city',
        parameters: z.object({
          city: z.string(),
        }),
        // Generator function: yield loading, return final
        render: async function* ({ city }) {
          yield <WeatherSkeleton />;
          const weather = await getWeather(city);
          return <WeatherCard data={weather} />;
        },
      },

      showPortfolioPreview: {
        description: 'Show portfolio preview',
        parameters: portfolioPreviewSchema,
        render: async function* ({ data }) {
          yield <PreviewSkeleton />;
          return <PortfolioPreview data={data} />;
        },
      },
    },
  });
}
```

### createStreamableUI (Lower-level)

For more control over streaming:

```typescript
import { createStreamableUI } from '@ai-sdk/rsc';

async function generateUI() {
  'use server';

  const ui = createStreamableUI(<LoadingSpinner />);

  // Update the UI over time
  setTimeout(() => {
    ui.update(<ProgressBar value={50} />);
  }, 1000);

  setTimeout(() => {
    ui.done(<FinalComponent />);
  }, 2000);

  return ui.value;
}
```

### createStreamableValue

For streaming non-component values:

```typescript
import { createStreamableValue } from '@ai-sdk/rsc';

async function streamProgress() {
  'use server';

  const stream = createStreamableValue(0);

  for (let i = 0; i <= 100; i += 10) {
    await delay(100);
    stream.update(i);
  }

  stream.done(100);
  return stream.value;
}
```

---

## Current Implementation

### ChatWizard.tsx Architecture

Location: `/src/components/chat/ChatWizard.tsx`

```typescript
// Key state
const [phase, setPhase] = useState<ChatPhase>('conversation');
const [extractedData, setExtractedData] = useState<ExtractedProjectData>({});
const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
const [sessionId, setSessionId] = useState<string | null>(null);

// AI SDK hook
const { messages, sendMessage, status, setMessages } = useChat({
  id: `chat-${projectId}`,
  messages: [welcomeMessage],
  transport: new DefaultChatTransport({
    api: '/api/chat',
  }),
});
```

### API Route Architecture

Location: `/src/app/api/chat/route.ts`

```typescript
import { getChatModel } from '@/lib/ai/providers';

export async function POST(request: Request) {
  // Auth check
  const auth = await requireAuth();

  // Parse messages
  const { messages }: { messages: UIMessage[] } = await request.json();

  // Stream with tools using Gemini 3 Flash (preview)
  const result = streamText({
    model: getChatModel(),
    system: CONVERSATION_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
      extractProjectData: tool({
        description: '...',
        inputSchema: extractProjectDataSchema,
        execute: async (args) => args,
      }),
    },
    stopWhen: stepCountIs(3),
    temperature: 0.7,
  });

  return result.toUIMessageStreamResponse();
}
```

### Session Persistence Pattern

```typescript
// Load session on mount
useEffect(() => {
  async function loadSession() {
    const response = await fetch(`/api/chat/sessions/by-project/${projectId}`);
    const { session, isNew } = await response.json();

    setSessionId(session.id);

    if (!isNew) {
      const contextResponse = await fetch(
        `/api/chat/sessions/${session.id}/context?projectId=${projectId}&mode=ui`
      );
      const context = await contextResponse.json();

      if (context.messages?.length) {
        let messagesToLoad = context.messages;
        if (!context.loadedFully && context.summary) {
          messagesToLoad = [
            createSummarySystemMessage(context.summary, context.projectData),
            ...context.messages,
          ];
        }
        setMessages(messagesToLoad);
      }
    }
  }
  loadSession();
}, [projectId, setMessages]);

// Save after response completes
useEffect(() => {
  if (!sessionId || status !== 'ready') return;
  if (messages.length <= lastMessageCount.current) return;

  // Save new messages
  saveNewMessages(messages.slice(lastMessageCount.current));
  lastMessageCount.current = messages.length;
}, [sessionId, status, messages]);
```

Notes:
- `/api/chat/sessions/by-project/:id` returns session metadata only; load messages via `/context`.
- Use `mode=ui` to cap message payloads for faster resume.

---

## API Patterns

### Standard Chat Endpoint

```
POST /api/chat
Content-Type: application/json

Request:
{
  "messages": [
    { "id": "1", "role": "user", "parts": [{ "type": "text", "text": "Hello" }] }
  ]
}

Response: Server-Sent Events stream
```

### Session Management

```
GET /api/chat/sessions              # List sessions
POST /api/chat/sessions             # Create session
GET /api/chat/sessions/[id]         # Get session
PATCH /api/chat/sessions/[id]       # Update session
POST /api/chat/sessions/[id]/messages  # Add message
GET /api/chat/sessions/by-project/[projectId]  # Get or create by project (metadata only)
GET /api/chat/sessions/by-project/[projectId]?includeMessages=true  # Optional full messages
```

---

## Best Practices

### 1. Handle Streaming States

```typescript
// Always show loading states during streaming
const isLoading = status === 'streaming' || status === 'submitted';

return (
  <>
    <ChatMessages messages={messages} />
    {isLoading && <TypingIndicator />}
    <ChatInput disabled={isLoading} />
  </>
);
```

### 2. Optimistic Updates

```typescript
// Add user message immediately, before API call
const handleSend = async (text: string) => {
  // sendMessage handles optimistic update internally
  await sendMessage({ text });
};
```

### 3. Error Recovery

```typescript
const { error, reload } = useChat({ /* ... */ });

if (error) {
  return (
    <ErrorDisplay
      message={error.message}
      onRetry={reload}
    />
  );
}
```

### 4. Tool Detection Pattern

```typescript
// Generic tool result extractor
function extractToolResult<T>(
  message: UIMessage,
  toolName: string
): T | null {
  const part = message.parts?.find(
    p => p.type === `tool-${toolName}` &&
         'state' in p &&
         p.state === 'output-available'
  );
  return part && 'output' in part ? part.output as T : null;
}

// Usage
const projectData = extractToolResult<ExtractedProjectData>(
  lastMessage,
  'extractProjectData'
);
```

### 5. Reliability-First Defaults

- Prefer AI SDK UI (`@ai-sdk/react`) over RSC in production.
- Gate preview models (Gemini 3) and keep a stable fallback (e.g., `gemini-2.5-flash`).
- Pin AI SDK versions to known-good releases before shipping.

### 6. Limit Tool Calling Steps

```typescript
// Prevent infinite tool calling loops
const result = streamText({
  // ...
  stopWhen: stepCountIs(3),  // Max 3 tool calls per response
});
```

### 7. Set Appropriate Timeouts

```typescript
// API route timeout
export const maxDuration = 60; // 60 seconds max

// Client-side abort
const { stop } = useChat({ /* ... */ });

// Manual timeout
setTimeout(() => {
  if (status === 'streaming') {
    stop();
  }
}, 30000);
```

---

## Related Documentation

- **Chat Artifacts Spec**: `./chat-artifacts-spec.md`
- **UX Patterns**: `./chat-ux-patterns.md`
- **Implementation Roadmap**: `./implementation-roadmap.md`

## External Resources

- [AI SDK Documentation](https://ai-sdk.dev/docs/introduction)
- [AI SDK GitHub](https://github.com/vercel/ai)
- [AI SDK 6 Announcement](https://vercel.com/blog/ai-sdk-6)
- [Generative UI Blog Post](https://vercel.com/blog/ai-sdk-3-generative-ui)
