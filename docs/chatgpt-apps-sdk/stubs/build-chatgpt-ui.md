# Build Your ChatGPT UI

> Source: https://developers.openai.com/apps-sdk/build/chatgpt-ui

## Core Purpose

This guide explains how to create custom UI components for ChatGPT apps that transform structured tool results into user-friendly interfaces running within an iframe.

## Key Architecture Components

**The `window.openai` API** serves as the bridge between your frontend component and ChatGPT, providing:

- **State management**: `toolInput`, `toolOutput`, `toolResponseMetadata`, `widgetState`
- **Runtime operations**: Tool invocation, follow-up messages, file uploads/downloads
- **Display control**: Modal requests, fullscreen/PiP modes, height notifications
- **Context data**: Theme, locale, display mode, safe area information

## Development Workflow

### Project Structure

```
app/
  server/          # MCP server (Python or Node)
  web/             # Component bundle
    src/component.tsx
    dist/component.js
```

### Tech Stack Requirements

- React 18+
- TypeScript
- esbuild for bundling
- Node 18+

## Essential Patterns

### State Persistence

Components use `setWidgetState()` to persist data across renders, keeping payloads under 4,000 tokens for efficiency.

### Reactive Hooks

The `useOpenAiGlobal` hook enables React components to subscribe to host environment changes (theme, locale, display mode).

### Tool Calls

Components trigger server actions via `window.openai.callTool()`, which must be marked for component-initiated access in the MCP server.

## Build & Integration

The bundled component is a single JavaScript module (`component.js`) embedded in the server response. Development allows hot-reloading when React code changes.

## Localization

Components read `window.openai.locale` and load corresponding translation files, formatting dates/numbers appropriately for the user's region.
