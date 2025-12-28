# Implementation Roadmap

> Phased plan for implementing the enhanced chat experience with artifacts.
> Each phase is self-contained and delivers incremental value.

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Foundation](#phase-1-foundation)
3. [Phase 2: Image Integration](#phase-2-image-integration)
4. [Phase 3: Live Preview](#phase-3-live-preview)
5. [Phase 4: Content Editor](#phase-4-content-editor)
6. [Phase 5: Polish](#phase-5-polish)
7. [Phase 6: Unified Edit Mode](#phase-6-unified-edit-mode)
8. [Phase 7: Persistence & Memory](#phase-7-persistence--memory-system)
9. [Phase 8: Agent Architecture](#phase-8-agent-architecture)
10. [Migration Strategy](#migration-strategy)
11. [Testing Strategy](#testing-strategy)
12. [Risk Mitigation](#risk-mitigation)

---

## Overview

### Goals

1. Transform the chat experience with inline artifacts
2. Provide real-time visual feedback as portfolio is built
3. Make image management natural within conversation
4. Enable inline editing of AI-generated content
5. Celebrate progress to improve completion rates

### Timeline Estimate

| Phase | Focus | Complexity |
|-------|-------|------------|
| Phase 1 | Foundation | Medium |
| Phase 2 | Image Integration | Medium |
| Phase 3 | Live Preview | High |
| Phase 4 | Content Editor | Medium |
| Phase 5 | Polish | Low |

### Dependencies

```
Phase 1 (Foundation)
    └─► Phase 2 (Images) ─► Phase 3 (Preview)
                               │
                               └─► Phase 4 (Editor)
                                       │
                                       └─► Phase 5 (Polish)
```

---

## Research Findings & Adjustments (Dec 26, 2025)

1. **Tool part states** — AI SDK v6 emits tool parts with `input-streaming`, `input-available`, `output-available`, and `output-error`. Artifact rendering must handle all states.
2. **RSC usage** — `@ai-sdk/rsc` is experimental. Treat generative UI as optional/flagged for production.
3. **Model IDs** — Gemini 3 is preview in the Gemini API. Use `gemini-3-flash-preview` (Gemini API) or `google/gemini-3-flash` (AI Gateway) and keep a stable fallback (e.g., `gemini-2.5-flash`).
4. **Transcription** — `experimental_transcribe` is still experimental; add size/type limits and explicit error UI.
5. **Voice-first gap** — MVP requires a voice interview path; add explicit tasks in Phase 1.
6. **Fast path** — Add “Accept & Publish” to maintain <3 minute publish target.
7. **Instrumentation** — Add KPI events in Phase 8 (time-to-publish, interview completion, regeneration).

---

## Phase 1: Foundation

**Goal:** Establish the artifact rendering system without breaking existing functionality.

### Tasks

#### 1.1 Create Artifact Directory Structure

```bash
mkdir -p src/components/chat/artifacts/shared
mkdir -p src/components/chat/hooks
mkdir -p src/components/chat/types
```

**Files to create:**

| File | Purpose |
|------|---------|
| `artifacts/index.ts` | Exports and registry |
| `artifacts/ArtifactRenderer.tsx` | Central dispatcher |
| `artifacts/shared/ArtifactCard.tsx` | Common card wrapper |
| `artifacts/shared/ArtifactSkeleton.tsx` | Loading states |
| `types/artifacts.ts` | Type definitions |

#### 1.2 Implement ArtifactRenderer

**File:** `src/components/chat/artifacts/ArtifactRenderer.tsx`

```typescript
import { ProjectDataCard } from './ProjectDataCard';
import { ArtifactSkeleton } from './shared/ArtifactSkeleton';
import type { ToolPart, ArtifactType } from '../types/artifacts';

const ARTIFACT_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'extractProjectData': ProjectDataCard,
};

export function ArtifactRenderer({ part, onAction }: { part: ToolPart; onAction?: Function }) {
  const toolName = part.type.replace('tool-', '');
  const Component = ARTIFACT_COMPONENTS[toolName];

  if (!Component) return null;

  if (part.state === 'call') {
    return <ArtifactSkeleton type={toolName} />;
  }

  if (part.state === 'output-available' && 'output' in part) {
    return <Component data={part.output} onAction={onAction} />;
  }

  return null;
}
```

#### 1.3 Create ProjectDataCard

**File:** `src/components/chat/artifacts/ProjectDataCard.tsx`

Basic version showing extracted data with visual styling:
- Project type with icon
- Materials as chips
- Duration and location
- Edit button (placeholder)

#### 1.4 Update ChatMessage

**File:** `src/components/chat/ChatMessage.tsx`

Add artifact rendering for tool parts:

```typescript
// In the parts mapping
if (part.type.startsWith('tool-')) {
  return <ArtifactRenderer key={index} part={part} onAction={handleAction} />;
}
```

#### 1.5 Create Type Definitions

**File:** `src/components/chat/types/artifacts.ts`

Define all artifact-related types.

#### 1.6 Voice Interview Foundation (MVP Alignment)

Add baseline voice interview support to match product goals:
- Mic permissions + error handling
- Record → transcribe → text injection flow
- Fallback to text input when transcription fails

### Deliverables

- [ ] Artifact directory structure created
- [ ] `ArtifactRenderer` dispatches to correct components
- [ ] `ProjectDataCard` renders extraction results inline
- [ ] Existing chat continues to work unchanged
- [ ] Loading skeleton shown during tool execution
- [ ] Voice interview flow works on mobile

### Verification

```bash
# Test that existing functionality works
npm run dev
# Navigate to /projects/new
# Start a conversation, verify ProjectDataCard appears inline
```

---

## Phase 2: Image Integration

**Goal:** Make images feel native to the conversation, not a separate task.

### Tasks

#### 2.1 Create ImageGalleryArtifact

**File:** `src/components/chat/artifacts/ImageGalleryArtifact.tsx`

Features:
- 2-3 column responsive grid
- Category badges (before/after/progress/detail)
- Add more button
- Remove button per image

#### 2.2 Add promptForImages Tool

**File:** `src/app/api/chat/route.ts`

```typescript
promptForImages: tool({
  description: 'Prompt user to add photos with inline upload UI',
  inputSchema: z.object({
    existingCount: z.number().default(0),
    suggestedCategories: z.array(z.enum(['before', 'after', 'progress', 'detail'])).optional(),
    message: z.string().optional(),
  }),
  execute: async (args) => args,
}),
```

#### 2.3 Add Drag-Drop to ChatInput

**File:** `src/components/chat/ChatInput.tsx`

```typescript
// Add drop zone wrapper
const { isDragging, handlers } = useDropZone(handleImageDrop);

<div {...handlers} className={cn(isDragging && 'ring-2 ring-primary')}>
  {/* Existing input */}
</div>
```

#### 2.4 Implement useInlineImages Hook

**File:** `src/components/chat/hooks/useInlineImages.ts`

Manages images within chat context:
- Track pending uploads
- Handle optimistic UI
- Sync with ChatWizard state

#### 2.5 Add Image Category Quick-Select

Long-press or context menu on images to categorize:
- Before (orange)
- After (green)
- Progress (blue)
- Detail (purple)

### Deliverables

- [ ] `ImageGalleryArtifact` renders inline in chat
- [ ] Drag-drop images into chat area
- [ ] Images show with category badges
- [ ] Quick category selection via popover
- [ ] AI prompts for images at appropriate times

### Verification

```bash
# Test image upload
# 1. Drag image onto chat area
# 2. Verify it appears inline
# 3. Long-press to categorize
# 4. Verify category badge appears
```

---

## Phase 3: Live Preview

**Goal:** Show the portfolio coming together in real-time on desktop.

### Tasks

#### 3.1 Create LivePortfolioCanvas

**File:** `src/components/chat/LivePortfolioCanvas.tsx`

Features:
- Hero image grid (1 large + 2 small)
- Title with typewriter animation
- Materials chips with slide-in
- Description placeholder/preview
- Completeness indicator

#### 3.2 Implement Split-Pane Layout

**File:** Update `src/components/chat/ChatWizard.tsx`

```typescript
// Desktop: split view
// Mobile/Tablet: single column with alternative preview access

<div className="grid lg:grid-cols-[400px_1fr] h-full">
  <div className="chat-column">
    <ChatMessages />
    <ChatInput />
  </div>
  <div className="hidden lg:block canvas-column">
    <LivePortfolioCanvas
      data={extractedData}
      images={uploadedImages}
      completeness={completeness}
    />
  </div>
</div>
```

#### 3.3 Create useProjectData Hook

**File:** `src/components/chat/hooks/useProjectData.ts`

Accumulates extracted data and calculates completeness.

#### 3.4 Add showPortfolioPreview Tool

**File:** `src/app/api/chat/route.ts`

For explicit preview updates triggered by AI.

#### 3.5 Create useCompleteness Hook

**File:** `src/components/chat/hooks/useCompleteness.ts`

Calculates and tracks completion percentage.

#### 3.6 Mobile: Add Swipe-to-Preview

For mobile, add gesture to reveal canvas:
- Swipe up on CollectedDataPeekBar
- Opens full-screen canvas overlay
- Swipe down to dismiss

### Deliverables

- [ ] `LivePortfolioCanvas` shows real-time preview
- [ ] Desktop: Split view layout
- [ ] Canvas updates in real-time as data extracted
- [ ] Completeness percentage displayed
- [ ] Mobile: Swipe gesture to reveal preview
- [ ] Animations on data updates

### Verification

```bash
# Desktop test
# 1. Open /projects/new on desktop
# 2. See split view with canvas on right
# 3. Chat, see canvas update in real-time
# 4. See completeness increase

# Mobile test
# 1. Open /projects/new on mobile
# 2. See peek bar at bottom
# 3. Swipe up to see full canvas
```

---

## Phase 4: Content Editor

**Goal:** Enable inline editing of AI-generated content.

### Tasks

#### 4.1 Create ContentEditor Artifact

**File:** `src/components/chat/artifacts/ContentEditor.tsx`

Features:
- Title field (editable)
- Description with TipTap editor
- SEO title/description preview
- Materials/techniques chips (editable)
- Accept/Reject buttons

#### 4.2 Integrate TipTap

Already in project (`src/components/edit/RichTextEditor.tsx`):
- Reuse existing editor component
- Simplified toolbar for inline use
- Character count display

#### 4.3 Add showContentEditor Tool

**File:** `src/app/api/chat/route.ts`

```typescript
showContentEditor: tool({
  description: 'Display generated content for inline editing',
  inputSchema: z.object({
    title: z.string(),
    description: z.string(),
    seo_title: z.string().optional(),
    seo_description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    editable: z.boolean().default(true),
  }),
  execute: async (args) => args,
}),
```

#### 4.4 Add Save/Accept Flow

When user accepts content:
1. PATCH to `/api/projects/[id]` with edited content
2. Update ChatWizard state
3. Show confirmation

#### 4.5 Add Regenerate Section

Button to regenerate specific sections:
- "Regenerate title"
- "Regenerate description"
- Triggers new AI generation with context

### Deliverables

- [ ] `ContentEditor` artifact with full editing
- [ ] TipTap integration for description
- [ ] Accept/Reject content flow
- [ ] Section regeneration
- [ ] Saves edits to database

### Verification

```bash
# Test content editing
# 1. Complete conversation and image upload
# 2. Click "Generate Portfolio Page"
# 3. See ContentEditor artifact in chat
# 4. Edit title and description
# 5. Click Accept, verify save
```

---

## Phase 5: Polish

**Goal:** Add delight and ensure accessibility.

### Tasks

#### 5.1 Create ProgressTracker Artifact

**File:** `src/components/chat/artifacts/ProgressTracker.tsx`

Visual checklist of collected info with checkmarks.

#### 5.2 Add MilestoneToast

**File:** `src/components/chat/MilestoneToast.tsx`

Celebrate progress:
- First photo added
- Project type detected
- Ready to generate
- Generation complete

#### 5.3 Add Animations

Apply animation classes from UX spec:
- `animate-canvas-item-in` for artifacts
- `animate-chip-slide-in` for chips
- `animate-toast-slide-up` for toasts
- `animate-glow-pulse` for generate button

#### 5.4 Add SmartSuggestionPill

**File:** `src/components/chat/SmartSuggestionPill.tsx`

Contextual hints above input:
- "Add some photos" when missing
- "What materials did you use?" when detected
- "Ready to generate!" when complete

#### 5.5 Accessibility Audit

- ARIA live regions for updates
- Focus management
- Keyboard navigation
- Screen reader testing

#### 5.6 Mobile Refinements

- Touch target sizes (44px minimum)
- Swipe gesture polish
- Haptic feedback for actions

### Deliverables

- [ ] `ProgressTracker` artifact
- [ ] `MilestoneToast` celebrations
- [ ] All animations implemented
- [ ] Smart suggestion pills
- [ ] WCAG 2.1 AA compliance
- [ ] Mobile gesture polish

### Verification

```bash
# Accessibility test
# 1. Navigate with keyboard only
# 2. Test with VoiceOver/NVDA
# 3. Verify all announcements

# Animation test
# 1. Complete full flow
# 2. Observe all animations
# 3. Check milestone toasts appear
```

---

## Phase 6: Unified Edit Mode

**Goal:** Enable the same chat interface for editing existing projects, replacing the tab-based edit page.

### Prerequisites

- Phase 1-5 complete (artifact system working for creation)
- All artifacts support editable mode

### Tasks

#### 6.1 Add Chat Mode Support

**File:** `src/components/chat/ChatWizard.tsx`

```typescript
interface ChatWizardProps {
  mode: 'create' | 'edit';
  projectId?: string;
}

// Mode-specific initialization
useEffect(() => {
  if (mode === 'edit' && projectId) {
    initializeEditMode(projectId);
  } else {
    initializeCreateMode();
  }
}, [mode, projectId]);
```

#### 6.2 Implement Edit Mode Initialization

Load existing project and build initial artifacts:

```typescript
async function initializeEditMode(projectId: string) {
  // Fetch project and images
  const [project, images] = await Promise.all([
    fetchProject(projectId),
    fetchImages(projectId),
  ]);

  // Build initial artifacts
  const artifacts = [
    { type: 'projectDataCard', data: project, mode: 'editable' },
    { type: 'imageGallery', data: images, mode: 'editable' },
    { type: 'contentEditor', data: extractContent(project), mode: 'editable' },
    { type: 'progressTracker', data: calculateProgress(project), mode: 'view' },
  ];

  // Set welcome message with artifacts
  setMessages([{
    id: 'welcome',
    role: 'assistant',
    parts: [
      { type: 'text', text: `Here's your "${project.title}" project. What would you like to change?` },
      ...artifacts.map(toArtifactPart),
    ],
  }]);
}
```

#### 6.3 Add Edit Mode API Route

**File:** `src/app/api/chat/edit/route.ts`

Separate route with edit-specific tools and system prompt:

```typescript
import { getChatModel } from '@/lib/ai/providers';

const EDITING_TOOLS = {
  ...COMMON_TOOLS,
  updateField: tool({...}),
  regenerateSection: tool({...}),
  reorderImages: tool({...}),
  validateForPublish: tool({...}),
};

const result = streamText({
  model: getChatModel(),  // Gemini 3 Flash (preview)
  system: EDITING_SYSTEM_PROMPT,
  messages: await convertToModelMessages(messages),
  tools: EDITING_TOOLS,
});
```

> Note (Dec 28, 2025): `/api/chat/edit` is now deprecated and forwards to the unified `/api/chat` route.

#### 6.4 Make Artifacts Editable

Update each artifact to support direct inline editing:

**ProjectDataCard:**
- Add pencil icons on hoverable fields
- Click-to-edit input fields
- Save/Cancel buttons

**ImageGalleryArtifact:**
- Enable @dnd-kit drag-drop reordering
- Add delete button per image
- Add "Set as hero" option

**ContentEditor:**
- Full TipTap integration
- Real-time character counts
- Regenerate buttons per section

#### 6.5 Add Edit Mode Tools

```typescript
// Update specific field
updateField: tool({
  description: 'Update a specific project field',
  inputSchema: z.object({
    field: z.enum([
      'title', 'description', 'project_type',
      'materials', 'techniques', 'tags',
      'seo_title', 'seo_description'
    ]),
    value: z.unknown(),
  }),
  execute: async ({ field, value }, { projectId }) => {
    await patchProject(projectId, { [field]: value });
    return { field, value, updated: true };
  },
}),

// Regenerate content section with AI
regenerateSection: tool({
  description: 'Regenerate a section with AI assistance',
  inputSchema: z.object({
    section: z.enum(['title', 'description', 'seo_title', 'seo_description']),
    context: z.string().optional(),
  }),
  execute: async ({ section, context }, { projectId }) => {
    const newContent = await generateSection(projectId, section, context);
    await patchProject(projectId, { [section]: newContent });
    return { section, newContent, regenerated: true };
  },
}),

// Reorder images
reorderImages: tool({
  description: 'Change the display order of images',
  inputSchema: z.object({
    imageOrder: z.array(z.string()),
  }),
  execute: async ({ imageOrder }, { projectId }) => {
    await patchImageOrder(projectId, imageOrder);
    return { imageOrder, reordered: true };
  },
}),

// Validate for publish
validateForPublish: tool({
  description: 'Check if project is ready to publish',
  inputSchema: z.object({}),
  execute: async (_, { projectId }) => {
    const validation = await validateProject(projectId);
    return validation;
  },
}),
```

#### 6.6 Update Routing

**File:** `src/app/(contractor)/projects/[id]/edit/page.tsx`

Replace tab-based edit page with ChatWizard in edit mode:

```typescript
export default function EditProjectPage({ params }: { params: { id: string } }) {
  return (
    <ChatWizard
      mode="edit"
      projectId={params.id}
    />
  );
}
```

#### 6.7 Fresh Start Session Management

Each edit session starts clean:

```typescript
// No session restoration in edit mode
// Each visit shows current project state
// Conversation doesn't persist between edit sessions

const getWelcomeMessage = (project: Project) => ({
  id: 'welcome',
  role: 'assistant',
  parts: [
    {
      type: 'text',
      text: `Here's your "${project.title}" project. What would you like to change?`
    },
    // ... initial artifacts
  ],
});
```

### Deliverables

- [ ] ChatWizard supports `mode` prop ('create' | 'edit')
- [ ] Edit mode loads existing project into artifacts
- [ ] All artifacts support inline editing
- [ ] Edit-specific tools (updateField, regenerateSection, etc.)
- [ ] Fresh start per edit session
- [ ] Deprecate old tab-based edit page

### Verification

```bash
# Test edit mode
# 1. Create and publish a project
# 2. Navigate to /projects/[id]/edit
# 3. See current project in artifacts
# 4. Type "make title more catchy"
# 5. Verify AI regenerates title
# 6. Click title to edit directly
# 7. Drag images to reorder
# 8. Ask "what's missing for publish?"
# 9. Verify all changes saved
```

### E2E Test for Edit Mode

```typescript
test('edit existing project via chat', async ({ page }) => {
  // Login and create a project first
  await login(page);
  const projectId = await createTestProject(page);

  // Navigate to edit
  await page.goto(`/projects/${projectId}/edit`);

  // Verify artifacts loaded
  await expect(page.locator('[data-testid="project-data-card"]')).toBeVisible();
  await expect(page.locator('[data-testid="image-gallery"]')).toBeVisible();
  await expect(page.locator('[data-testid="content-editor"]')).toBeVisible();

  // Ask AI to improve title
  await page.fill('[data-testid="chat-input"]', 'Make the title more SEO-friendly');
  await page.click('[data-testid="send-button"]');

  // Wait for regeneration
  await expect(page.locator('[data-testid="content-editor"] [data-testid="title"]'))
    .not.toHaveText(originalTitle);

  // Direct edit
  await page.click('[data-testid="content-editor"] [data-testid="edit-description"]');
  await page.fill('[data-testid="description-editor"]', 'Updated description');
  await page.click('[data-testid="save-button"]');

  // Verify saved
  await page.reload();
  await expect(page.locator('[data-testid="content-editor"] [data-testid="description"]'))
    .toContainText('Updated description');
});
```

---

## Phase 7: Persistence & Memory System

**Goal:** Enable incremental data persistence and multi-session memory for project continuity.

### Prerequisites

- Phase 1-6 complete (full artifact system working)
- Stable tool calling patterns

### Overview

This phase addresses two key improvements:
1. **Incremental Persistence:** Save data as it's collected, not just at the end
2. **Project Memory:** Enable multi-session continuity through summarization

### Tasks

#### 7.1 Add Session Recovery (localStorage)

**File:** `src/components/chat/hooks/useSessionRecovery.ts`

Checkpoint unsaved changes to localStorage for recovery if tab closes:

```typescript
interface SessionRecoveryData {
  projectId: string;
  lastMessageId: string;
  unsavedChanges: Partial<ExtractedProjectData>;
  uploadedImages: string[];
  timestamp: Date;
}

function useSessionRecovery(projectId: string) {
  // Save to localStorage on every change
  // Check for recovery data on mount
  // Show recovery prompt if recent data found
  return { showRecoveryPrompt, recoveryData, applyRecovery, discardRecovery };
}
```

#### 7.2 Add PATCH Endpoint for Partial Updates

**File:** `src/app/api/projects/[id]/route.ts`

```typescript
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const updates = await request.json();

  const allowedFields = [
    'title', 'description', 'project_type_slug', 'city_slug',
    'materials', 'techniques', 'tags',
    'seo_title', 'seo_description', 'status',
  ];

  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowedFields.includes(k))
  );

  // Update and return
}
```

#### 7.3 Update extractProjectData to Save Incrementally

**File:** `src/app/api/chat/route.ts`

```typescript
extractProjectData: tool({
  description: 'Extract and save project information',
  inputSchema: extractProjectDataSchema,
  execute: async (args, context) => {
    const { projectId } = context;

    // Build update object (only non-null fields)
    const updates = buildProjectUpdates(args);

    // Save to database immediately
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);
    }

    // Return with save confirmation
    return {
      ...args,
      saved: true,
      savedAt: new Date().toISOString(),
    };
  },
}),
```

#### 7.4 Add Save Status to Artifacts

**File:** `src/components/chat/artifacts/shared/SaveStatusBadge.tsx`

```typescript
interface ArtifactSaveStatus {
  status: 'saved' | 'saving' | 'unsaved' | 'error';
  lastSaved: Date | null;
  error: string | null;
}

function SaveStatusBadge({ status }: { status: ArtifactSaveStatus }) {
  // Render check, spinner, or error icon based on status
}
```

#### 7.5 Implement Optimistic Updates Hook

**File:** `src/components/chat/hooks/useOptimisticSave.ts`

```typescript
function useOptimisticSave<T>(
  initialData: T,
  saveFn: (data: T) => Promise<void>
) {
  // Immediate UI update
  // Save in background
  // Rollback on error
  return { data, save, isSaving, error };
}
```

#### 7.6 Add Error Recovery Queue

**File:** `src/lib/chat/save-queue.ts`

```typescript
interface SaveQueue {
  pending: SaveOperation[];
  failed: SaveOperation[];
}

class SaveQueueManager {
  enqueue(operation: SaveOperation): void;
  retry(): Promise<void>;
  clear(): void;
}
```

#### 7.7 Add Database Schema for Memory

**File:** `supabase/migrations/XXX_add_project_memory.sql`

```sql
-- Add memory to projects table
ALTER TABLE projects ADD COLUMN memory JSONB DEFAULT '{
  "decisions": [],
  "preferences": {},
  "keyFacts": [],
  "questionsAnswered": [],
  "topicsDiscussed": []
}';

-- Add summary to chat_sessions
ALTER TABLE chat_sessions ADD COLUMN summary TEXT;
ALTER TABLE chat_sessions ADD COLUMN key_points JSONB DEFAULT '[]';

-- Optional: persistence tracking
ALTER TABLE projects ADD COLUMN last_chat_update TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN chat_update_count INTEGER DEFAULT 0;
```

#### 7.8 Implement summarizeSession Tool

**File:** `src/app/api/chat/route.ts` (add to tools)

```typescript
summarizeSession: tool({
  description: 'Summarize conversation for future reference',
  inputSchema: z.object({
    summary: z.string(),
    decisions: z.array(z.string()),
    preferences: z.record(z.unknown()),
    keyFacts: z.array(z.string()),
    questionsAnswered: z.array(z.string()),
  }),
  execute: async (args, { projectId, sessionId }) => {
    // Merge with existing memory
    const existing = await getProjectMemory(projectId);
    const updated = mergeMemory(existing, args);

    await saveProjectMemory(projectId, updated);
    await saveSessionSummary(sessionId, args.summary);

    return { saved: true };
  },
}),
```

#### 7.9 Build Context from Memory

**File:** `src/lib/chat/memory-context.ts`

```typescript
async function buildSessionContext(projectId: string): Promise<string> {
  const project = await getProject(projectId);
  const memory = await getProjectMemory(projectId);
  const recentSessions = await getRecentSessions(projectId, 2);

  return `
## Current Project State
Title: ${project.title || 'Untitled'}
Type: ${project.project_type_slug || 'Not set'}

## Working Memory
Key Decisions: ${memory.decisions.slice(-5).join('; ')}
Key Facts: ${memory.keyFacts.slice(-5).join('; ')}

## Recent Sessions
${recentSessions.map(s => `- ${s.summary}`).join('\n')}

## Already Discussed
${memory.questionsAnswered.slice(-10).join(', ')}
`;
}
```

#### 7.10 Auto-Summarize on Session End

Trigger summarization when:
- User navigates away (beforeunload event)
- Session timeout (inactivity)
- Explicit "save progress" request
- Before content generation

### Deliverables

- [ ] `useSessionRecovery` hook with recovery prompt
- [ ] PATCH endpoint for partial project updates
- [ ] Incremental save in `extractProjectData` tool
- [ ] `SaveStatusBadge` component on all artifacts
- [ ] `useOptimisticSave` hook
- [ ] `SaveQueueManager` for error recovery
- [ ] Database migration for memory columns
- [ ] `summarizeSession` tool
- [ ] `buildSessionContext` function
- [ ] Auto-summarize integration

### Verification

```bash
# Test incremental save
# 1. Start new project chat
# 2. Mention project details
# 3. Close tab without generating
# 4. Reopen - verify data was saved to database

# Test session recovery
# 1. Start chat, add some messages
# 2. Close tab
# 3. Reopen same project
# 4. See "Resume previous session?" prompt

# Test memory continuity
# 1. Complete a conversation
# 2. Return next day
# 3. Verify AI remembers key facts
# 4. Verify AI doesn't re-ask answered questions
```

### Memory System Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Data loss rate | 0% | Projects with unsaved chat data |
| Session recovery usage | 50% | Users who apply recovered data |
| Memory relevance | 4/5 | User rating of AI recall |
| Context token usage | <2K | Memory context size |

---

## Phase 8: Agent Architecture

**Goal:** Improve agent reliability, observability, and capability through architectural enhancements.

### Prerequisites

- Phase 1 complete (basic artifact system)
- Langfuse account configured

### Overview

This phase addresses critical gaps in the current agent implementation:
1. **Step Limit:** Increase from 3 to 10 for multi-tool flows
2. **Additional Tools:** Add `requestClarification` for uncertainty handling
3. **Observability:** Integrate Langfuse for full tracing
4. **Type Safety:** Improve tool context typing

### Tasks

#### 8.1 Increase Step Limit

**File:** `src/app/api/chat/route.ts`

Change step limit to allow multi-tool responses:

```typescript
// Current (too restrictive):
stopWhen: stepCountIs(3)   // ❌ Only allows 3 tool calls total

// Recommended:
stopWhen: stepCountIs(10)  // ✅ Allows multiple tools per response
```

**Rationale:**
- Allows `extractProjectData` + `showProgress` + text response in single turn
- Handles retry scenarios gracefully
- Aligns with typical conversation complexity

#### 8.2 Add requestClarification Tool

**File:** `src/app/api/chat/route.ts`

Add tool for uncertainty handling:

```typescript
requestClarification: tool({
  description: `Ask the user to clarify when confidence is low.
    Use when:
    - Confidence < 0.7 on extracted data
    - Multiple interpretations possible
    - Critical fields need confirmation`,
  inputSchema: z.object({
    field: z.string(),
    currentValue: z.string().optional(),
    alternatives: z.array(z.string()).optional(),
    question: z.string(),
    confidence: z.number().min(0).max(1),
    context: z.string().optional(),
  }),
  execute: async (args) => args,
}),
```

**See:** `chat-artifacts-spec.md` for ClarificationCard component spec.

#### 8.3 Add Langfuse Integration

**File:** `src/lib/observability/langfuse.ts` (new)

```typescript
import { Langfuse } from 'langfuse';

export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
  enabled: process.env.LANGFUSE_ENABLED !== 'false',
});

export function isLangfuseEnabled(): boolean {
  return !!(
    process.env.LANGFUSE_PUBLIC_KEY &&
    process.env.LANGFUSE_SECRET_KEY &&
    process.env.LANGFUSE_ENABLED !== 'false'
  );
}
```

#### 8.4 Add Tracing to Chat Route

**File:** `src/app/api/chat/route.ts`

Wrap chat processing with Langfuse traces:

```typescript
import { createChatTrace, trackError, trackUsage } from '@/lib/observability/tracing';

export async function POST(request: Request) {
  const startTime = Date.now();
  const trace = isLangfuseEnabled()
    ? createChatTrace({ userId: 'pending', sessionId: 'pending', messageCount: 0 })
    : null;

  try {
    // Auth, parse, process...

    const result = streamText({
      // ...existing config
      onFinish: async (result) => {
        if (result.usage && trace?.trace) {
          trackUsage(trace.trace, {
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            totalTokens: result.usage.totalTokens,
          });
        }
        await langfuse.flush();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    if (trace?.trace) {
      trackError(trace.trace, error as Error, ChatErrorCategory.UNKNOWN);
    }
    await langfuse.flush();
    throw error;
  }
}
```

#### 8.5 Create Tracing Utilities

**File:** `src/lib/observability/tracing.ts` (new)

```typescript
import { langfuse } from './langfuse';
import type { Trace } from 'langfuse';

export interface TraceContext {
  trace: Trace;
  userId: string;
  sessionId: string;
  projectId?: string;
}

export function createChatTrace(params: {
  userId: string;
  sessionId: string;
  projectId?: string;
  messageCount: number;
}): TraceContext {
  const trace = langfuse.trace({
    name: 'chat_message',
    userId: params.userId,
    sessionId: params.sessionId,
    metadata: {
      projectId: params.projectId,
      messageCount: params.messageCount,
    },
    tags: ['chat', params.projectId ? 'with-project' : 'new-project'],
  });

  return { trace, ...params };
}

export function trackUsage(trace: Trace, usage: {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}): void {
  // Gemini 2.0 Flash pricing
  const GEMINI_INPUT_COST = 0.075 / 1_000_000;
  const GEMINI_OUTPUT_COST = 0.30 / 1_000_000;

  const cost =
    (usage.promptTokens * GEMINI_INPUT_COST) +
    (usage.completionTokens * GEMINI_OUTPUT_COST);

  trace.update({
    metadata: { ...usage, estimatedCostUsd: cost.toFixed(6) },
  });
}

export function trackError(
  trace: Trace,
  error: Error,
  category: string,
  context?: Record<string, unknown>
): void {
  trace.event({
    name: 'error',
    level: 'ERROR',
    statusMessage: error.message,
    metadata: { category, ...context },
  });
}
```

#### 8.6 Add Tool Context Typing

**File:** `src/app/api/chat/route.ts`

Pass typed context to tool execute functions:

```typescript
interface ToolContext {
  projectId: string;
  sessionId: string;
  userId: string;
}

// In streamText config:
experimental_toolContext: {
  projectId,
  sessionId: session.id,
  userId: auth.user.id,
} satisfies ToolContext,
```

#### 8.7 Add ClarificationCard Component

**File:** `src/components/chat/artifacts/ClarificationCard.tsx`

See `chat-artifacts-spec.md` for full implementation spec.

Key features:
- Question header with context
- Confidence indicator bar
- Confirm/Alternative/Custom input options
- Amber styling for uncertainty state

#### 8.8 Update System Prompt for Clarification

**File:** `src/lib/chat/chat-prompts.ts`

Add clarification guidance:

```typescript
const CLARIFICATION_GUIDANCE = `
## Handling Uncertainty

When you're not sure about something:
1. For ambiguous terms, call requestClarification with alternatives
2. Set confidence (0.0 = guess, 1.0 = certain)
3. If confidence < 0.5, ALWAYS ask for clarification
4. For critical fields (project type, materials), ask if confidence < 0.7

DO NOT just assume. Users prefer being asked over having wrong data.
`;

export const CONVERSATION_SYSTEM_PROMPT = `${BASE_PROMPT}\n\n${CLARIFICATION_GUIDANCE}`;
```

#### 8.9 Add Environment Variables

**File:** `.env.example`

```bash
# Langfuse Observability
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
LANGFUSE_ENABLED=true
```

### Deliverables

- [ ] Change `stepCountIs(3)` to `stepCountIs(10)` in chat route
- [ ] Add `requestClarification` tool with confidence scoring
- [ ] Create `src/lib/observability/langfuse.ts` client
- [ ] Create `src/lib/observability/tracing.ts` utilities
- [ ] Wrap chat route with Langfuse traces
- [ ] Track token usage and costs
- [ ] Add `ClarificationCard` artifact component
- [ ] Update ArtifactRenderer for requestClarification
- [ ] Add clarification guidance to system prompt
- [ ] Add Langfuse environment variables to `.env.example`

### Verification

```bash
# Test step limit
# 1. Start conversation that triggers multiple tools
# 2. Verify all tools execute (not cut off at 3)

# Test clarification
# 1. Send ambiguous message: "I did some brick work"
# 2. Verify ClarificationCard appears with options
# 3. Click an option, verify AI proceeds with confirmed value

# Test observability
# 1. Open Langfuse dashboard
# 2. Send chat message
# 3. Verify trace appears with:
#    - Tool calls as spans
#    - Token usage
#    - Duration metrics
```

### Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `langfuse` | `^3.x` | Observability client |
| `@langfuse/vercel-ai` | `^1.x` | AI SDK integration (optional) |

### Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Tool calls per session | 1-2 | 4-6 |
| Step limit errors | Unknown | 0 |
| Error visibility | 0% | 100% |
| Cost tracking | None | Per-session |
| Clarification accuracy | N/A | 90% user acceptance |

---

## Migration Strategy

### Backward Compatibility

All phases maintain backward compatibility:

1. **Phase 1:** Adds artifact rendering alongside existing text messages
2. **Phase 2:** Adds inline images, existing photo sheet still works
3. **Phase 3:** Desktop gets split view, mobile unchanged initially
4. **Phase 4:** Adds inline editing, review page still accessible
5. **Phase 5:** Adds polish, no functional changes
6. **Phase 6:** Edit mode replaces tabs (can run in parallel initially)
7. **Phase 7:** Adds persistence/memory, existing batch save still works as fallback
8. **Phase 8:** Adds observability and new tools, existing functionality unchanged

### Feature Flags (Optional)

If needed, wrap new features:

```typescript
// In ChatWizard
const enableArtifacts = useFeatureFlag('chat-artifacts');
const enableSplitView = useFeatureFlag('chat-split-view');

{enableArtifacts ? (
  <ArtifactRenderer part={part} />
) : (
  <LegacyToolResult part={part} />
)}
```

### Rollback Plan

Each phase can be rolled back independently:
- Remove new components
- Revert ChatMessage changes
- Keep database/API unchanged

---

## Testing Strategy

### Unit Tests

| Component | Test Cases |
|-----------|------------|
| `ArtifactRenderer` | Dispatches to correct component, handles unknown types |
| `ProjectDataCard` | Renders all data fields, handles missing fields |
| `ImageGalleryArtifact` | Grid layout, category badges, add/remove |
| `LivePortfolioCanvas` | Updates on data change, empty state |
| `ContentEditor` | Edits save, TipTap integration |
| `useProjectData` | Accumulates data, calculates completeness |

### Integration Tests

| Flow | Test Cases |
|------|------------|
| Conversation | Messages render, tool parts become artifacts |
| Image Upload | Drag-drop works, optimistic UI, category select |
| Content Generation | Flows through all phases, edits save |
| Session Persistence | Resume conversation, artifacts restore |

### E2E Tests (Playwright)

```typescript
test('complete project creation with artifacts', async ({ page }) => {
  // Login
  await login(page);

  // Navigate to new project
  await page.goto('/projects/new');

  // Send message
  await page.fill('[data-testid="chat-input"]', 'I rebuilt a chimney');
  await page.click('[data-testid="send-button"]');

  // Verify artifact appears
  await expect(page.locator('[data-testid="project-data-card"]')).toBeVisible();

  // Upload image
  await page.setInputFiles('[data-testid="image-input"]', 'test-image.jpg');
  await expect(page.locator('[data-testid="image-gallery-artifact"]')).toBeVisible();

  // Generate content
  await page.click('[data-testid="generate-button"]');
  await expect(page.locator('[data-testid="content-editor"]')).toBeVisible();

  // Accept and publish
  await page.click('[data-testid="accept-button"]');
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
});
```

---

## Risk Mitigation

### Risk: Message Payload Size

**Problem:** Tool outputs could make messages large.

**Mitigation:**
- Store artifact data in session, reference by ID
- Lazy load artifact content
- Compress image URLs

### Risk: Tool Call Latency

**Problem:** Users waiting for tool execution.

**Mitigation:**
- Show skeleton immediately on tool call
- Stream partial results where possible
- Optimistic UI for common operations

### Risk: State Synchronization

**Problem:** Multiple sources of truth (chat state, artifacts, canvas).

**Mitigation:**
- Single source of truth in `useProjectData`
- Derive other state from accumulated data
- Use React context if needed

### Risk: Mobile Performance

**Problem:** Animations and canvas updates could be slow.

**Mitigation:**
- Lazy load canvas on mobile
- Use CSS animations (GPU-accelerated)
- Debounce rapid updates

### Risk: Breaking Changes

**Problem:** New features could break existing flow.

**Mitigation:**
- Feature flags for gradual rollout
- Comprehensive test coverage
- Each phase is independently revertible

### Risk: SDK Version Drift

**Problem:** AI SDK 6 APIs may change while still in beta.

**Mitigation:**
- Pin exact AI SDK versions
- Update tool part rendering for new states
- Verify provider model IDs before release

### Risk: Model ID Mismatch

**Problem:** Provider config uses model IDs not supported by `@ai-sdk/google`.

**Mitigation:**
- Validate model IDs in development
- Centralize model config in `src/lib/ai/providers.ts`
- Update ADR + reference docs on change

---

## Success Metrics

Track these metrics before and after implementation:

### Creation Flow Metrics

| Metric | Baseline | Target | How to Measure |
|--------|----------|--------|----------------|
| Time to complete | 5+ min | < 3 min | Session duration |
| Completion rate | ~60% | 85% | Projects reaching published |
| Photos per project | 3 | 5+ | Average images uploaded |
| Inline edits | 0 | 3+ | Content editor interactions |
| User satisfaction | N/A | 4.5/5 | Post-completion survey |

### Edit Flow Metrics (Phase 6)

| Metric | Baseline | Target | How to Measure |
|--------|----------|--------|----------------|
| Time to edit | N/A | < 2 min | Session duration for edits |
| AI-assisted edits | 0 | 40% | Edits using regenerate tools |
| Direct edit usage | 100% | 60% | Click-to-edit interactions |
| Edit satisfaction | N/A | 4.5/5 | Post-edit survey |
| Tab page deprecation | 0% | 100% | Traffic to old vs new edit UI |

---

## Related Documentation

- **Central Plan**: `./plan.md`
- **SDK Reference**: `./vercel-ai-sdk-reference.md`
- **Artifacts Spec**: `./chat-artifacts-spec.md`
- **UX Patterns**: `./chat-ux-patterns.md`
- **Observability Spec**: `./observability-spec.md`

---

## Checklist Summary

### Phase 1: Foundation
- [ ] Artifact directory structure
- [ ] `ArtifactRenderer` component
- [ ] `ProjectDataCard` component
- [ ] Update `ChatMessage` for artifacts
- [ ] Type definitions
- [ ] Tool part state handling (`input-*`, `output-*`)
- [ ] Voice interview foundation (record → transcribe → inject)

### Phase 2: Image Integration
- [ ] `ImageGalleryArtifact` component
- [ ] `promptForImages` tool
- [ ] Drag-drop in `ChatInput`
- [ ] `useInlineImages` hook
- [ ] Category quick-select

### Phase 3: Live Preview
- [ ] `LivePortfolioCanvas` component
- [ ] Split-pane layout
- [ ] `useProjectData` hook
- [ ] `showPortfolioPreview` tool
- [ ] Mobile swipe gesture

### Phase 4: Content Editor
- [ ] `ContentEditor` artifact
- [ ] TipTap integration
- [ ] `showContentEditor` tool
- [ ] Save/accept flow
- [ ] Section regeneration
- [ ] Fast path: “Accept & Publish”

### Phase 5: Polish
- [ ] `ProgressTracker` artifact
- [ ] `MilestoneToast` component
- [ ] All animations
- [ ] `SmartSuggestionPill`
- [ ] Accessibility audit
- [ ] Mobile refinements

### Phase 6: Unified Edit Mode
- [ ] Add `mode` prop to ChatWizard ('create' | 'edit')
- [ ] Edit mode initialization (load project + images)
- [ ] Initial artifacts from existing data
- [ ] Edit-specific API route with tools
- [ ] Make all artifacts support inline editing
- [ ] `updateField` tool
- [ ] `regenerateSection` tool
- [ ] `reorderImages` tool
- [ ] `validateForPublish` tool
- [ ] Fresh start session management
- [ ] Update routing to use ChatWizard
- [ ] Deprecate tab-based edit page

### Phase 7: Persistence & Memory System
- [ ] Add localStorage session recovery
- [ ] Add PATCH `/api/projects/[id]` for partial updates
- [ ] Update `extractProjectData` tool to save incrementally
- [ ] Add save status indicators to artifacts
- [ ] Implement optimistic updates with rollback
- [ ] Add error recovery queue for failed saves
- [ ] Add `memory` JSONB column to `projects` table
- [ ] Add `summary` and `key_points` columns to `chat_sessions` table
- [ ] Implement `summarizeSession` tool
- [ ] Build context from memory on session start
- [ ] Auto-summarize on session end
- [ ] Debounced auto-save for ContentEditor

### Phase 8: Agent Architecture
- [ ] Change `stepCountIs(3)` to `stepCountIs(10)`
- [ ] Add `requestClarification` tool
- [ ] Create `ClarificationCard` artifact component
- [ ] Create `src/lib/observability/langfuse.ts`
- [ ] Create `src/lib/observability/tracing.ts`
- [ ] Wrap chat route with Langfuse traces
- [ ] Track token usage and costs
- [ ] Track KPI events (time-to-publish, interview completion, regeneration)
- [ ] Add tool context typing (`experimental_toolContext`)
- [ ] Update system prompt with clarification guidance
- [ ] Add Langfuse env vars to `.env.example`
