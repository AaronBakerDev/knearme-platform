# Widget System Reference

This document describes the ChatGPT widget system used by the KnearMe MCP server.

## Overview

Widgets are React components that render inside ChatGPT's conversation as iframes. They provide rich UI for:

- Viewing project status and progress
- Editing narrative content
- Managing project images
- Quick actions (publish, edit, etc.)

## Widget Templates

| Template | Display Mode | Description |
|----------|--------------|-------------|
| `project-draft` | Inline | Draft editing with narrative sections |
| `project-status` | Inline | Status view with progress bar and actions |
| `project-media` | Fullscreen | Image management with drag-drop reordering |
| `project-list` | Inline | List of contractor's projects |

---

## Template Details

### `project-status`

**Purpose:** Display project status with completion progress and quick actions.

**Display Mode:** Inline

**Features:**
- Hero image preview
- Project title and location
- Status badge (draft/published)
- Completion percentage progress bar
- Missing fields list
- Action buttons: Edit Content, Manage Media, Publish

**Data Shape:**
```typescript
interface ProjectStatusData {
  project: {
    id: string;
    title: string;
    status: 'draft' | 'published' | 'archived';
    summary?: string;
    city?: string;
    state?: string;
    project_type?: string;
    hero_image_url?: string;
    images?: Array<{
      id: string;
      url: string;
      image_type?: string | null;
    }>;
  };
  missing_fields: string[];
  can_publish: boolean;
  public_url?: string;
}
```

---

### `project-draft`

**Purpose:** Edit narrative content sections.

**Display Mode:** Inline (expands to fullscreen for editing)

**Features:**
- Tabbed interface for sections (Summary, Challenge, Solution, Results)
- Inline text editing
- "Help me write this" button for AI assistance
- Auto-save on blur
- Character count indicators

**Data Shape:**
```typescript
interface ProjectDraftData {
  project: {
    id: string;
    title: string;
    project_type?: string;
    city?: string;
    state?: string;
    summary?: string;
    challenge?: string;
    solution?: string;
    results?: string;
    outcome_highlights?: string[];
    hero_image_url?: string;
  };
  missing_fields: string[];
  can_publish: boolean;
}
```

---

### `project-media`

**Purpose:** Organize project images.

**Display Mode:** Fullscreen (auto-requested on mount)

**Features:**
- Drag-and-drop reordering
- Hero image selection
- Image type labels (before/after/progress/detail)
- Grid layout with thumbnails
- Delete confirmation

**Data Shape:**
```typescript
interface ProjectMediaData {
  project: {
    id: string;
    title: string;
    hero_image_id?: string | null;
    hero_image_url?: string | null;
  };
  images: Array<{
    id: string;
    url: string;
    image_type?: 'before' | 'after' | 'progress' | 'detail';
    display_order: number;
  }>;
}
```

---

### `project-list`

**Purpose:** Display list of contractor's projects.

**Display Mode:** Inline

**Features:**
- Project cards with thumbnail
- Status badges
- Last updated timestamp
- Click to view project details

**Data Shape:**
```typescript
interface ProjectListData {
  projects: Array<{
    id: string;
    title: string;
    status: 'draft' | 'published' | 'archived';
    project_type?: string;
    city?: string;
    state?: string;
    hero_image_url?: string;
    updated_at: string;
  }>;
  count: number;
  has_more: boolean;
}
```

---

## window.openai API

The widget has access to `window.openai` for interacting with ChatGPT.

### Available APIs

```typescript
interface OpenAiApi {
  // Data from tool response
  toolOutput: unknown;
  toolResponseMetadata: {
    widgetTemplate: string;
    widgetData?: unknown;
  };

  // Context
  theme: 'light' | 'dark';
  displayMode: 'inline' | 'fullscreen' | 'pip';
  maxHeight: number;
  safeArea: { top: number; bottom: number; left: number; right: number };

  // State management
  widgetState: Record<string, unknown> | null;
  setWidgetState: (state: Record<string, unknown>) => void;

  // Actions
  callTool: (name: string, args: Record<string, unknown>) => Promise<void>;
  sendFollowUpMessage: (options: { prompt: string }) => Promise<void>;
  requestDisplayMode: (options: { mode: DisplayMode }) => Promise<void>;
  requestClose: () => void;

  // File handling
  uploadFile: (file: File) => Promise<{ fileId: string }>;
  getFileDownloadUrl: (options: { fileId: string }) => Promise<{ downloadUrl: string }>;

  // Layout
  notifyIntrinsicHeight: (height: number) => void;

  // External links
  openExternal: (options: { href: string }) => void;
}
```

### Usage Examples

**Call a tool:**
```typescript
await window.openai.callTool('update_project_sections', {
  project_id: 'uuid',
  summary: 'New summary text'
});
```

**Send follow-up message:**
```typescript
await window.openai.sendFollowUpMessage({
  prompt: 'Please publish this project now'
});
```

**Request fullscreen:**
```typescript
await window.openai.requestDisplayMode({ mode: 'fullscreen' });
```

**Persist state:**
```typescript
window.openai.setWidgetState({
  activeTab: 'challenge',
  hasUnsavedChanges: true
});
```

---

## React Hooks

The widget provides custom hooks for common patterns.

### `useRuntimeContext()`

Subscribe to runtime context changes.

```typescript
import { useRuntimeContext } from './runtime';

function MyWidget() {
  const context = useRuntimeContext();
  // context.displayMode, context.colorScheme, etc.
}
```

### `useToolCall()`

Call tools with loading and error state.

```typescript
import { useToolCall } from './runtime';

function MyWidget() {
  const { callTool, loading, error } = useToolCall();

  const handleSave = async () => {
    await callTool('update_project_sections', { ... });
  };
}
```

### `useAutoHeight()`

Automatically report widget height to ChatGPT.

```typescript
import { useAutoHeight } from './runtime';

function MyWidget() {
  const heightRef = useAutoHeight();

  return <div ref={heightRef}>...</div>;
}
```

---

## Styling

Widgets use CSS custom properties for theming:

```css
/* Colors */
--color-bg: #ffffff;
--color-bg-subtle: #f8f9fa;
--color-text: #1a1a1a;
--color-text-muted: #6b7280;
--color-primary: #2563eb;
--color-success: #10b981;
--color-warning: #f59e0b;
--color-error: #ef4444;

/* Spacing */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;

/* Typography */
--font-size-xs: 11px;
--font-size-sm: 13px;
--font-size-md: 14px;
--font-size-lg: 16px;

/* Borders */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
```

Dark mode is applied via `@media (prefers-color-scheme: dark)` or when `data-theme="dark"` is set.

---

## Building Widgets

```bash
# Development (with hot reload)
cd mcp-server/widgets
npm run dev

# Production build
npm run build
# Creates dist/widget.html (self-contained bundle)
```

The built widget is automatically loaded by `src/lib/mcp/widget.ts` and served via the MCP `resources/read` method.

---

## Best Practices

1. **Keep widgets fast** - Minimize bundle size, lazy load heavy components
2. **Handle errors gracefully** - Show user-friendly error messages
3. **Use inline mode by default** - Only request fullscreen when necessary
4. **Report height changes** - Use `useAutoHeight()` or call `notifyIntrinsicHeight()`
5. **Persist state** - Use `setWidgetState()` to survive re-renders
6. **Follow accessibility** - Use semantic HTML and ARIA labels
