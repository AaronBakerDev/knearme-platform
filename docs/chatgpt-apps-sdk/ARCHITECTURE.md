# Architecture

This document describes the ChatGPT Apps SDK runtime and data flow. Use it to reason about what belongs in the MCP server, what belongs in the UI, and how the model interacts with both.

## Core components

1. **ChatGPT model**
   - Chooses tools based on tool metadata and conversation context.
   - Sees `structuredContent` and `content` from tool responses.
   - Does **not** see `_meta` fields from tool responses.

2. **MCP server**
   - Defines tools (schemas, descriptions, hints).
   - Handles auth and executes business logic.
   - Returns tool results and points tools to UI bundles.

3. **UI widget**
   - Runs in a sandboxed iframe.
   - Receives tool data and renders the UI.
   - Uses the `window.openai` runtime to call tools or request UI changes.

## End-to-end flow

```
User prompt
  -> Model selects tool
    -> MCP server executes tool
      -> Tool response returns data
        -> Model reads structuredContent
        -> UI renders from _meta or structuredContent
        -> Model may send follow-up or user acts in UI
```

## Ownership decisions (source of truth)

- **Publish gating:** enforced in the portfolio API (single source of truth).
  - Minimum required fields: title, project type, city + state, >= 1 image, hero image.
  - Narrative sections are recommended, not blocking, but surfaced in UI as a checklist.
- **Description composition:** owned by the API.
  - Auto-compose from summary + challenge + solution + results + outcome highlights.
  - Respect `description_manual` to prevent overwrites.
  - If empty on publish and not manual, compose once before validation.
- **Hero image:** stored explicitly on the project.
  - Auto-set to first uploaded image if missing.
  - UI still prompts for explicit selection when possible.

## Tool response shape

Keep tool outputs explicit and minimal:

- `structuredContent`:
  - Small, LLM-friendly payload.
  - Should be concise so the model can reason over it.
- `_meta`:
  - Large or sensitive payloads for the UI only.
  - Not visible to the model.
- `content`:
  - Human-readable text for the chat.

Tip: Return only the minimum data needed for the next model step, and move the rest into `_meta`.

Tool outputs should match the JSON Schema declared in the tool definition. If schemas mismatch, the model can ignore fields or fail to render the UI.

## Widget runtime: `window.openai`

### Data available to the widget
- `toolInput`: the model's tool inputs.
- `toolOutput`: the tool response payload (including `_meta`).
- `toolResponseMetadata`: metadata for the current tool response.
- `widgetState`: shared state visible to the model (keep under ~4k tokens).
- `context`:
  - `theme` (light/dark), `displayMode`, `maxHeight`.
  - `safeArea` and `view` layout bounds.
  - `userAgent`, `locale`.

### Actions the widget can call
- `callTool({ name, arguments })`: call another tool.
- `sendFollowUpMessage({ message })`: send a message to the model.
- `setWidgetState(state)`: persist widget state for this widget instance.
- `uploadFile(file)`: upload a file for the conversation.
- `getFileDownloadUrl(fileId)`: fetch a usable download URL.
- `requestDisplayMode(mode)`: request `inline`, `fullscreen`, etc.
- `requestModal({ title, content })`: ask ChatGPT to open a modal.
- `notifyIntrinsicHeight(height)`: resize the iframe height.
- `openExternal(url, options)`: open an external link.

## Media flow (widget-first)

1. Widget calls `add_project_media` with ChatGPT `file_id` metadata.
2. MCP server requests signed upload URLs from the portfolio API.
3. Widget downloads files via `getFileDownloadUrl(fileId)` and uploads bytes to storage.
4. Widget refreshes the project image list (tool call or GET).
5. Optional: widget sets hero image and labels.

Fallback: If runtime download is unavailable, open a web uploader via `openExternal`.

### Runtime contract table

| Field / API | Purpose | Notes |
| --- | --- | --- |
| `toolInput` | Tool input from the model | Do not mutate |
| `toolOutput` | Tool output including `_meta` | UI-only fields live in `_meta` |
| `toolResponseMetadata` | Response-level metadata | Useful for per-call hints |
| `widgetState` | Shared state | Visible to the model |
| `context.displayMode` | Inline/fullscreen/PiP | Keep UI responsive to changes |
| `context.safeArea` | Safe insets | Use for padding |
| `callTool` | Invoke a tool | Prefer idempotent tools |
| `sendFollowUpMessage` | Message the model | Best for clarifications |
| `requestDisplayMode` | Change display mode | Use sparingly |
| `openExternal` | Open a URL | Requires CSP allowlist |

## UI bundle registration

The UI bundle is registered as an MCP resource with:

- `mimeType: text/html+skybridge`
- `text`: your HTML bundle (often an HTML shell plus JS/CSS)
- `_meta` fields on the resource:
  - `openai/widgetCSP` to restrict network access
  - `openai/widgetDomain` to force a dedicated origin (enables fullscreen)
  - `openai/widgetPrefersBorder` to request a chrome border
  - `openai/widgetDescription` to label the UI for accessibility

If you embed iframes inside the widget, list their domains in `frame_domains`. This increases review scrutiny, so keep the list minimal.

Cache management: if you ship a breaking UI change, change the template URI to bust the cache.

## Tool definition metadata

Tools can include `_meta` fields to shape how ChatGPT invokes and renders them:

- `openai/outputTemplate`: points to the UI resource template.
- `openai/toolInvocation/invoking`: user-facing text while running.
- `openai/toolInvocation/invoked`: user-facing text after running.
- `openai/widgetAccessible`: accessibility hint for the widget.

## State design rules

- `widgetState` is visible to the model, so keep it compact.
- Store authoritative business data on the server, not in widget state.
- When sending images to the model, add their `imageId`s in `widgetState`.

## Reliability and retries

ChatGPT may retry tool calls. Tools should be idempotent or safely repeatable.
