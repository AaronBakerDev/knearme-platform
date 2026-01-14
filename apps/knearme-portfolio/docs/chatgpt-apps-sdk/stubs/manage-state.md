# Managing State in ChatGPT Apps

> Source: https://developers.openai.com/apps-sdk/build/state-management

## Overview

State in ChatGPT apps using the Apps SDK falls into three distinct categories with different ownership and lifetimes:

| State Type | Owner | Duration | Use Cases |
|---|---|---|---|
| Business data | MCP server/backend | Long-lived | Tasks, tickets, documents |
| UI state | Widget instance | Active widget only | Selected rows, expanded panels, sort order |
| Cross-session state | Backend storage | Across conversations | Saved filters, workspace selection |

## Widget Lifecycle

Custom UI components render inside ChatGPT widgets tied to specific conversation messages. Key behaviors:

- "Widgets are message-scoped" — each response creates a fresh instance with its own UI state
- Widget state persists when reopening the same message
- Server data serves as the authoritative source when tool calls complete

## Business Data (Authoritative State)

Business data must live on the MCP server or backend service, never within the widget. When users act:

1. UI invokes a server tool
2. Server updates data
3. Server returns the new authoritative snapshot
4. Widget re-renders with that snapshot

This prevents UI-server divergence.

## UI State (Ephemeral)

UI state describes how data displays, not the data itself. Manage it using:

- `window.openai.widgetState` — read current state
- `window.openai.setWidgetState(newState)` — write state synchronously
- `useWidgetState()` hook — React wrapper handling subscription and persistence

**State persists only for the active widget instance.**

### Widget State with Images

For image-heavy components, use structured state:

```javascript
{
  modelContent: string | JSON | null,
  privateContent: Record<string, unknown> | null,
  imageIds: string[]
}
```

Only file IDs from `window.openai.uploadFile()` or file parameters qualify for `imageIds`.

## Cross-Session State

Preferences spanning conversations need backend persistence. Key considerations:

- **Data residency** — establish compliance agreements before transferring regulated data
- **Rate limiting** — protect APIs against bursty model retries
- **Versioning** — include schema versions for migration without breaking conversations

Integrate with existing APIs via OAuth authentication to map ChatGPT identities to internal accounts.

## Key Principle

"Every piece of state belongs where it belongs so the UI stays consistent and the chat matches the expected intent."
