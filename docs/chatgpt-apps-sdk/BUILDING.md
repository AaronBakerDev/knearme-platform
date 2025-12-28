# Building the app

This section covers implementation details for both the MCP server and the UI bundle.

## MCP server build

### SDK choices

OpenAI recommends using official MCP SDKs (Node or Python) to build the server. The SDKs handle the MCP transport and schema validation so you can focus on tool logic.

### Responsibilities

- Define tools and their JSON Schemas.
- Enforce auth and access control.
- Execute business logic.
- Return tool results and UI metadata.

### Tool definition essentials

Each tool definition should include:

- `name` (unique, short, verb-first)
- `title` (human-friendly label)
- `description` (model-facing; include "Use this when...")
- `inputSchema` (JSON Schema)
- `_meta` (OpenAI-specific hints and UI template references)

Important `_meta` keys:

- `openai/outputTemplate`: MCP resource URI for the UI.
- `openai/toolInvocation/invoking`: text while running.
- `openai/toolInvocation/invoked`: text after completion.
- `openai/widgetAccessible`: accessibility hint for the widget.
- `openai/toolHints`: model hints (`readOnlyHint`, `destructiveHint`, `openWorldHint`).
- `openai/visibility`: set to `private` to hide legacy tools from model selection.

### Tool schema tips

- Keep schemas small and focused. Fewer fields means higher tool precision.
- Describe parameters in plain language and include examples when helpful.
- Prefer enums for controlled inputs to reduce model ambiguity.

### Output patterns

Return a small `structuredContent` object with just what the model needs next. Put all heavy or sensitive data in `_meta`.

Example shape:

```
{
  "structuredContent": {
    "summary": "3 matches",
    "ids": ["loc_1", "loc_2", "loc_3"]
  },
  "_meta": {
    "fullResults": [ ... ],
    "mapTiles": { ... }
  }
}
```

If the UI should close after rendering, include metadata (for example `openai/closeWidget`) alongside the tool response.

### Resource registration (UI)

Register the UI as an MCP resource with:

- `mimeType: text/html+skybridge`
- `text`: HTML bundle content
- `_meta`:
  - `openai/widgetCSP` (network allowlist)
  - `openai/widgetDomain` (dedicated origin; enables fullscreen)
  - `openai/widgetPrefersBorder`

For UI templates, use a stable URI (often `template://<name>`). Change the URI when you need to invalidate the UI cache.

Set `openai/widgetCSP` to the minimum required domains:

```
"openai/widgetCSP": {
  "connect_domains": ["api.knearme.com"],
  "resource_domains": ["https://assets.knearme.com"],
  "frame_domains": []
}
```

If you need to open external links and return to ChatGPT, add a `redirect_domains` allowlist.

### Cache strategy

If you ship a breaking UI change, use a new template URI for the resource to avoid cached bundles.

## UI bundle build

### Runtime environment

The widget runs in a sandboxed iframe with a `window.openai` bridge. You are responsible for rendering all UI and wiring it to tools and follow-up messages.

The iframe can only access network resources allowed by `openai/widgetCSP`. Avoid direct calls to external hosts that are not explicitly allowed.

Key calls:

- `callTool` to run tools.
- `sendFollowUpMessage` to send text to the model.
- `requestDisplayMode` to switch to fullscreen when needed.
- `notifyIntrinsicHeight` to resize the widget.
- `openExternal` for external URLs.

### Widget state

Use `widgetState` for short, model-visible state. Keep it small and use it to pass ids, not full data. This is the main mechanism for follow-up reasoning from widget actions.

When the UI needs the model to see an image, store the `imageId` in `widgetState` so the model can reference it.

### Local development

- Run the MCP server locally with `/mcp` exposed.
- Build the UI bundle and reload it via the MCP resource.
- Use the MCP Inspector or ChatGPT developer mode to test flows.
- When using a tunnel (ngrok), refresh the connector after changes.
