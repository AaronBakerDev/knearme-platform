# Vercel AI SDK Reference Guide

> Comprehensive reference for the Vercel AI SDK as used in knearme-portfolio.
> Last Updated: December 2024 | AI SDK Version: 6.x

---

## Table of Contents

1. [Overview](#overview)
2. [Dependencies](#dependencies)
3. [Core Hooks](#core-hooks)
4. [Tool Calling](#tool-calling)
5. [Message Structure](#message-structure)
6. [Streaming Patterns](#streaming-patterns)
7. [Generative UI](#generative-ui)
8. [Current Implementation](#current-implementation)
9. [API Patterns](#api-patterns)
10. [Best Practices](#best-practices)

---

## Overview

The Vercel AI SDK is a TypeScript library for building AI-powered applications. It provides:

- **AI SDK Core**: Unified API for LLM providers (OpenAI, Anthropic, etc.)
- **AI SDK UI**: React hooks for chat interfaces (`useChat`, `useCompletion`, `useObject`)
- **AI SDK RSC**: React Server Components for Generative UI

**Official Documentation:** https://ai-sdk.dev/docs/introduction

---

## Dependencies

### Package Versions (knearme-portfolio)

```json
{
  "ai": "^6.0.3",                    // Core AI SDK (streaming, tools, UI)
  "@ai-sdk/openai": "^3.0.1",        // OpenAI provider
  "@ai-sdk/react": "^3.0.3"          // React hooks (useChat)
}
```

### Import Map

```typescript
// Client-side hooks
import { useChat } from '@ai-sdk/react';

// Core utilities
import {
  streamText,
  tool,
  convertToModelMessages,
  stepCountIs,
  type UIMessage
} from 'ai';

// Transport for custom API endpoints
import { DefaultChatTransport } from 'ai';

// OpenAI provider
import { openai } from '@ai-sdk/openai';
```

---

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

const result = streamText({
  model: openai('gpt-4o'),
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

When a tool is called, the message parts include:

```typescript
// Tool call part (before execution)
{
  type: 'tool-{toolName}',
  state: 'call',
  toolCallId: 'call_abc123',
  toolName: 'extractProjectData',
  args: { project_type: 'chimney', ... }
}

// Tool result part (after execution)
{
  type: 'tool-{toolName}',
  state: 'output-available',
  toolCallId: 'call_abc123',
  toolName: 'extractProjectData',
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
  | { type: `tool-${string}`; state: string; toolCallId: string; args?: unknown; output?: unknown }
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
import { openai } from '@ai-sdk/openai';

export const maxDuration = 60; // Allow up to 60s streaming

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: openai('gpt-4o'),
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

Generative UI allows streaming React components from the server. This is the foundation for artifacts.

### streamUI (Recommended for Artifacts)

```typescript
import { streamUI } from 'ai/rsc';

async function submitMessage(message: string) {
  'use server';

  return streamUI({
    model: openai('gpt-4o'),
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
import { createStreamableUI } from 'ai/rsc';

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
import { createStreamableValue } from 'ai/rsc';

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
export async function POST(request: Request) {
  // Auth check
  const auth = await requireAuth();

  // Parse messages
  const { messages }: { messages: UIMessage[] } = await request.json();

  // Stream with tools
  const result = streamText({
    model: openai('gpt-4o'),
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

    if (!isNew && session.messages?.length > 0) {
      // Restore messages
      const uiMessages = session.messages.map(dbMessageToUIMessage);
      setMessages(uiMessages);
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
GET /api/chat/sessions/by-project/[projectId]  # Get or create by project
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

### 5. Limit Tool Calling Steps

```typescript
// Prevent infinite tool calling loops
const result = streamText({
  // ...
  stopWhen: stepCountIs(3),  // Max 3 tool calls per response
});
```

### 6. Set Appropriate Timeouts

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
