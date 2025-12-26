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
7. [Migration Strategy](#migration-strategy)
8. [Testing Strategy](#testing-strategy)
9. [Risk Mitigation](#risk-mitigation)

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

### Deliverables

- [ ] Artifact directory structure created
- [ ] `ArtifactRenderer` dispatches to correct components
- [ ] `ProjectDataCard` renders extraction results inline
- [ ] Existing chat continues to work unchanged
- [ ] Loading skeleton shown during tool execution

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
const EDITING_TOOLS = {
  ...COMMON_TOOLS,
  updateField: tool({...}),
  regenerateSection: tool({...}),
  reorderImages: tool({...}),
  validateForPublish: tool({...}),
};

const result = streamText({
  model: openai('gpt-4o'),
  system: EDITING_SYSTEM_PROMPT,
  messages: await convertToModelMessages(messages),
  tools: EDITING_TOOLS,
});
```

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

## Migration Strategy

### Backward Compatibility

All phases maintain backward compatibility:

1. **Phase 1:** Adds artifact rendering alongside existing text messages
2. **Phase 2:** Adds inline images, existing photo sheet still works
3. **Phase 3:** Desktop gets split view, mobile unchanged initially
4. **Phase 4:** Adds inline editing, review page still accessible
5. **Phase 5:** Adds polish, no functional changes
6. **Phase 6:** Edit mode replaces tabs (can run in parallel initially)

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

---

## Success Metrics

Track these metrics before and after implementation:

| Metric | Baseline | Target | How to Measure |
|--------|----------|--------|----------------|
| Time to complete | 5+ min | < 3 min | Session duration |
| Completion rate | ~60% | 85% | Projects reaching published |
| Photos per project | 3 | 5+ | Average images uploaded |
| Inline edits | 0 | 3+ | Content editor interactions |
| User satisfaction | N/A | 4.5/5 | Post-completion survey |

---

## Related Documentation

- **SDK Reference**: `./vercel-ai-sdk-reference.md`
- **Artifacts Spec**: `./chat-artifacts-spec.md`
- **UX Patterns**: `./chat-ux-patterns.md`

---

## Checklist Summary

### Phase 1: Foundation
- [ ] Artifact directory structure
- [ ] `ArtifactRenderer` component
- [ ] `ProjectDataCard` component
- [ ] Update `ChatMessage` for artifacts
- [ ] Type definitions

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

### Phase 5: Polish
- [ ] `ProgressTracker` artifact
- [ ] `MilestoneToast` component
- [ ] All animations
- [ ] `SmartSuggestionPill`
- [ ] Accessibility audit
- [ ] Mobile refinements
