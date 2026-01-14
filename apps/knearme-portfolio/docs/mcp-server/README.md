# KnearMe MCP Server Documentation

This folder contains documentation for the KnearMe Model Context Protocol (MCP) server, which enables ChatGPT integration for contractor portfolio management.

## Overview

The MCP server allows contractors to manage their portfolios directly through ChatGPT using natural conversation. It provides:

- **11 MCP Tools** for project CRUD, image management, and publishing
- **React Widgets** for rich UI in ChatGPT conversations
- **JWT Authentication** via Supabase tokens

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        ChatGPT                              │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   Conversation  │◄──►│        Widget (iframe)          │ │
│  │                 │    │  - ProjectStatus                │ │
│  │  "Create a new  │    │  - ProjectDraft                 │ │
│  │   project..."   │    │  - ProjectMedia                 │ │
│  └────────┬────────┘    │  - ProjectList                  │ │
│           │             └─────────────────────────────────┘ │
└───────────┼─────────────────────────────────────────────────┘
            │ MCP Protocol (JSON-RPC 2.0)
            ▼
┌───────────────────────────────────────────────────────────┐
│                  Next.js App (/api/mcp)                    │
│  ┌─────────────────┐    ┌───────────────────────────────┐ │
│  │  MCP Handler    │───►│  Tool Dispatcher              │ │
│  │  (route.ts)     │    │  - create_project_draft       │ │
│  │                 │    │  - update_project_sections    │ │
│  │                 │    │  - add_project_media          │ │
│  │                 │    │  - publish_project            │ │
│  └─────────────────┘    │  - ... (11 tools)             │ │
│                         └───────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────────────┐
│                     Supabase                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │ PostgreSQL  │  │   Storage   │  │   Auth (JWT)        ││
│  │ (projects,  │  │  (images)   │  │                     ││
│  │  images)    │  │             │  │                     ││
│  └─────────────┘  └─────────────┘  └─────────────────────┘│
└───────────────────────────────────────────────────────────┘
```

## Documentation Index

### Core Documentation

| Document | Description |
|----------|-------------|
| [TOOLS.md](./TOOLS.md) | All 11 MCP tools with parameters and examples |
| [WIDGETS.md](./WIDGETS.md) | Widget templates and window.openai API |
| [AUTHENTICATION.md](./AUTHENTICATION.md) | JWT token validation and security |

### Related Documentation

| Document | Description |
|----------|-------------|
| [../chatgpt-apps-sdk/README.md](../chatgpt-apps-sdk/README.md) | ChatGPT Apps SDK overview |
| [../chatgpt-apps-sdk/BUILDING.md](../chatgpt-apps-sdk/BUILDING.md) | Building ChatGPT widgets |
| [../chatgpt-apps-sdk/UI_UX.md](../chatgpt-apps-sdk/UI_UX.md) | UI/UX guidelines for widgets |

## Quick Start

### 1. Build the Widget

```bash
# Build the React widget bundle
cd mcp-server/widgets
npm install
npm run build
```

### 2. Start Development Server

```bash
# Start Next.js (includes MCP endpoint)
npm run dev
```

### 3. Test MCP Endpoint

```bash
# Health check
curl http://localhost:3000/api/mcp

# Initialize (JSON-RPC)
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'

# List tools
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

## File Structure

```
knearme-portfolio/
├── src/
│   ├── app/api/mcp/
│   │   └── route.ts          # MCP endpoint (POST /api/mcp)
│   └── lib/mcp/
│       ├── tools.ts          # Tool definitions and dispatcher
│       ├── widget.ts         # Widget resource handler
│       ├── token-validator.ts # JWT validation
│       └── types.ts          # TypeScript types
│
├── mcp-server/
│   └── widgets/
│       ├── src/
│       │   ├── index.tsx     # Widget entry point
│       │   ├── runtime.ts    # window.openai bridge
│       │   ├── types.ts      # Widget types
│       │   ├── templates/    # Widget templates
│       │   │   ├── ProjectDraft.tsx
│       │   │   ├── ProjectStatus.tsx
│       │   │   ├── ProjectMedia.tsx
│       │   │   └── ProjectList.tsx
│       │   └── styles/
│       │       └── global.css
│       └── dist/
│           └── widget.html   # Built bundle (served to ChatGPT)
│
└── docs/
    └── mcp-server/           # This folder
        ├── README.md
        ├── TOOLS.md
        ├── WIDGETS.md
        └── AUTHENTICATION.md
```

## MCP Protocol

The server implements [Model Context Protocol](https://modelcontextprotocol.io/) version `2024-11-05`.

### Supported Methods

| Method | Description |
|--------|-------------|
| `initialize` | Returns server info and capabilities |
| `tools/list` | Returns all available tools |
| `tools/call` | Invokes a tool with arguments |
| `resources/list` | Returns available resources (widget) |
| `resources/read` | Returns widget HTML bundle |

### Authentication

All `tools/call` requests require a Bearer token:

```
Authorization: Bearer <supabase-jwt>
```

The JWT must contain a valid `contractor_id` claim.

## Widget Templates

| Template | Display Mode | Description |
|----------|--------------|-------------|
| `project-draft` | Inline | Draft editing with narrative sections |
| `project-status` | Inline | Status view with progress bar |
| `project-media` | Fullscreen | Image management with drag-drop |
| `project-list` | Inline | List of contractor's projects |

## Development

### Build Commands

```bash
# Build widget only
npm run build:widget

# Full build (widget + Next.js)
npm run build

# Development with hot reload
npm run dev
```

### Testing Widgets Locally

The widget includes a dev mode that mocks `window.openai`:

```bash
cd mcp-server/widgets
npm run dev
# Opens http://localhost:5173 with mock data
```

## Deployment

The MCP server is deployed as part of the Next.js app on Vercel:

- **Production**: `https://knearme.co/api/mcp`
- **Preview**: `https://knearme-portfolio.vercel.app/api/mcp`

The widget bundle is built during `npm run build` and bundled with the deployment.
