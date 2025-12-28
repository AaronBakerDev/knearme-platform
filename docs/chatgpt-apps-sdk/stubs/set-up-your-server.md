# Build Your MCP Server

> Source: https://developers.openai.com/apps-sdk/build/mcp-server

## Overview

The guide explains how to connect a backend MCP server to ChatGPT, establish tool definitions, register UI templates, and implement the widget runtime. ChatGPT Apps consist of three components:

- **MCP server**: "defines tools, enforces auth, returns data, and points each tool to a UI bundle"
- **Widget/UI bundle**: renders in ChatGPT's iframe
- **Model**: decides when to call tools based on metadata

## Key Prerequisites

You'll need TypeScript or Python proficiency, an HTTP-reachable MCP server, and a built UI bundle that exports a root script.

## Architecture Flow

When a user prompts ChatGPT, it calls an MCP tool, your server executes the handler and returns `structuredContent`, `_meta`, and UI metadata. ChatGPT loads the HTML template and injects the payload through `window.openai`. The widget renders from `window.openai.toolOutput`.

## Window.openai Widget Runtime

The sandboxed iframe exposes a global object providing:

- State/data access through `toolInput`, `toolOutput`, `toolResponseMetadata`
- Tool invocation via `callTool` and `sendFollowUpMessage`
- File handling with `uploadFile` and `getFileDownloadUrl`
- Layout controls through `requestModal`, `requestDisplayMode`, and `notifyIntrinsicHeight`
- Context signals including `theme`, `displayMode`, and `locale`

## Implementation Steps

### 1. Register Component Template

Register UI bundles as MCP resources with `mimeType: "text/html+skybridge"` to signal ChatGPT to render as a sandboxed widget. Include metadata for borders, domains, and CSP rules.

### 2. Describe Tools

Define tools with machine-readable names, JSON schemas, and the template URI in `_meta["openai/outputTemplate"]`. "The model inspects these descriptors to decide when a tool fits the user's request."

### 3. Return Structured Data

Tool responses include:
- **structuredContent**: concise JSON for both widget and model
- **content**: optional narration for the model
- **_meta**: large/sensitive data exclusively for the widget

### 4. Run Locally

Use MCP Inspector to test widget rendering before deployment. Build your UI bundle and start the server.

### 5. Expose HTTPS Endpoint

ChatGPT requires HTTPS. Tunnel localhost with ngrok during development; deploy to an HTTPS host for production.

## Advanced Features

- **Component-initiated calls**: Set `"openai/widgetAccessible": true` to enable `window.openai.callTool`
- **Tool visibility**: Use `"openai/visibility": "private"` to hide tools from the model
- **File parameters**: Declare file fields with `"openai/fileParams"`
- **CSP configuration**: Specify allowed domains in `"openai/widgetCSP"`
- **Localization**: ChatGPT sends locale hints in client request metadata

## Security Reminders

Never embed secrets in user-visible payloads. Don't rely on client hints for authorization—enforce authentication inside your server and APIs. Avoid exposing destructive tools without identity verification.
