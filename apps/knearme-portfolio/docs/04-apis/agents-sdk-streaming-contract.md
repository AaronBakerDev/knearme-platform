# Agents SDK Streaming Contract (Option C)

This document defines the custom server-to-client streaming contract for migrating off the Vercel AI SDK while preserving the existing chat UI and artifact rendering.

## Goals

- Stable, provider-agnostic stream protocol for `/api/chat` and `/api/onboarding`.
- Preserve existing UIMessage parts (`text`, `tool-*`, `source-url`) and artifact rendering.
- Allow streaming text, tool calls/results, and citations without client coupling to OpenAI event types.
- Simple client parser that replaces `@ai-sdk/react` while keeping the current UI behavior.

## Transport

- Protocol: Server-Sent Events (SSE)
- Response header: `Content-Type: text/event-stream`
- Each event is `event: <type>` with `data: <json>`
- Events are ordered and append-only; the client applies them in order.

## Event Types

### `meta`
Run-level metadata. Emitted once at start.

```json
{
  "requestId": "req_...",
  "runId": "run_...",
  "sessionId": "session_...",
  "conversationId": "conv_...",
  "model": "gpt-5.1",
  "endpoint": "/api/chat",
  "createdAt": "2026-01-11T18:22:00.000Z"
}
```

### `message.start`
Start a new assistant message.

```json
{
  "messageId": "msg_...",
  "role": "assistant",
  "createdAt": "2026-01-11T18:22:01.000Z"
}
```

### `message.delta`
Text delta for the current assistant message.

```json
{
  "messageId": "msg_...",
  "delta": "Here is what I found..."
}
```

### `message.end`
Marks the assistant message as complete.

```json
{
  "messageId": "msg_..."
}
```

### `tool.call`
Tool call is ready (input is available). Emits when the model decides to call a tool.

```json
{
  "toolCallId": "tool_...",
  "toolName": "extractProjectData",
  "input": { "project_type": "chimney-repair" },
  "state": "input-available",
  "messageId": "msg_..."
}
```

### `tool.delta` (optional)
Tool input streaming (if the model streams tool args).

```json
{
  "toolCallId": "tool_...",
  "delta": "{ \"project_type\": \"chimney-",
  "state": "input-streaming",
  "messageId": "msg_..."
}
```

### `tool.result`
Tool execution result (success or error).

```json
{
  "toolCallId": "tool_...",
  "toolName": "extractProjectData",
  "output": { "project_type": "chimney-repair", "city": "Denver" },
  "state": "output-available",
  "messageId": "msg_..."
}
```

Error case:

```json
{
  "toolCallId": "tool_...",
  "toolName": "extractProjectData",
  "errorText": "Tool failed to execute.",
  "state": "output-error",
  "messageId": "msg_..."
}
```

### `source`
Grounding/citation payloads (usually from web search tools).

```json
{
  "sourceId": "src_1",
  "url": "https://example.com",
  "title": "Example result",
  "toolCallId": "tool_...",
  "messageId": "msg_..."
}
```

### `status`
Optional run status updates for UI overlays.

```json
{
  "state": "streaming",
  "message": "Model is responding"
}
```

### `error`
Terminal or non-terminal error.

```json
{
  "message": "Failed to process request",
  "code": "server_error",
  "retryable": true
}
```

### `done`
End of stream.

```json
{
  "runId": "run_...",
  "finishReason": "stop",
  "usage": { "inputTokens": 1234, "outputTokens": 456 }
}
```

## Client Mapping to UIMessage Parts

The client maintains `UIMessage[]` with `parts` consistent with the current UI.

### Text
- On `message.start`, create a new assistant message with empty parts.
- On `message.delta`, append to the last `text` part or create a new `text` part.

### Tools
- On `tool.call`, add a tool part:
  - `type: "tool-${toolName}"`
  - `state: "input-available"`
  - `toolCallId`
  - `input` (if provided)
- On `tool.delta`, update the same tool part:
  - `state: "input-streaming"`
  - merge/append `input` (if streaming args)
- On `tool.result`, update tool part:
  - `state: "output-available"` and attach `output`, or
  - `state: "output-error"` and attach `errorText`.

### Sources
- On `source`, add a `source-url` part:
  - `{ type: "source-url", sourceId, url, title }`
  - Attach to the same assistant message as the tool call.

## Client Parser Plan

### New Hook
Create a lightweight hook to replace `@ai-sdk/react`:

- `useChatStream({ api, initialMessages })`
  - State: `messages`, `status` (`ready|submitted|streaming|error`), `error`
  - Actions: `sendMessage`, `setMessages`, `abort`
  - Internals: SSE parser and message reducer

### Request Shape
The hook should POST to the same endpoints using existing request bodies:

- `/api/chat`: `{ messages, projectId, sessionId, toolChoice }`
- `/api/onboarding`: `{ messages, selectedBusiness }`

### Parser Steps (SSE)
1) `meta` -> update session state (optional).
2) `message.start` -> push new assistant `UIMessage`.
3) `message.delta` -> append text to last assistant message.
4) `tool.call` / `tool.delta` -> insert or update tool part in the current assistant message.
5) `tool.result` -> set final state and attach output/error.
6) `source` -> append `source-url` part.
7) `message.end` -> finalize.
8) `done` -> set status to `ready`.
9) `error` -> set status to `error` + expose message.

### Minimal Reducer API (sketch)

```ts
type StreamEvent = { type: string; data: unknown };

function applyEvent(messages: UIMessage[], event: StreamEvent): UIMessage[] {
  // Create or update the last assistant message
  // Create or update tool parts by toolCallId
  // Append source parts
  return nextMessages;
}
```

## Notes and Constraints

- This contract is stable across providers and not tied to OpenAI event names.
- Tool part `state` values match existing artifact rendering logic.
- The server should always emit `message.start` before tool events to ensure there is an assistant message to attach parts to.
- If the model emits tool calls before any assistant text, create the assistant message anyway and attach tool parts.

## Example Stream (SSE)

```
event: meta
data: {"runId":"run_1","model":"gpt-5.1"}

event: message.start
data: {"messageId":"msg_1","role":"assistant"}

event: message.delta
data: {"messageId":"msg_1","delta":"Got it. Let me check that."}

event: tool.call
data: {"toolCallId":"tool_1","toolName":"webSearchBusiness","input":{"query":"Smith Masonry Denver"},"state":"input-available","messageId":"msg_1"}

event: tool.result
data: {"toolCallId":"tool_1","toolName":"webSearchBusiness","output":{"results":[...]},"state":"output-available","messageId":"msg_1"}

event: source
data: {"sourceId":"src_1","url":"https://example.com","title":"Example","toolCallId":"tool_1","messageId":"msg_1"}

event: message.end
data: {"messageId":"msg_1"}

event: done
data: {"runId":"run_1","finishReason":"stop"}
```

