# Agent System Change Log

> Chronological record of significant changes to the agent system.

---

## 2026-01-01

### Image metadata added to prompt context

**Category**: Context Loading / State Model
**Files Changed**:
- `src/lib/chat/context-shared.ts`
- `src/lib/chat/prompt-context.ts`

**Description**: Agent now receives image metadata in the system prompt for awareness of project images without vision API calls.

**New Interface** (`context-shared.ts`):
```typescript
interface ImageContextData {
  id: string;
  imageType: 'before' | 'after' | 'progress' | 'detail' | null;
  altText: string | null;
  displayOrder: number;
  isHero: boolean;
}
```

**Changes**:
1. `ProjectContextData` now includes `images?: ImageContextData[]`
2. `loadPromptContext()` fetches images in parallel with project data
3. `formatProjectDataForPrompt()` includes image inventory:
   - Total count and hero image
   - Group by type (e.g., "2 before, 3 after, 1 detail")
   - Alt text descriptions (up to 5 images)

**Token Impact**: ~50-150 tokens vs ~258 tokens/image for vision API

**Rationale**: Gives the main chat agent visibility into project images without expensive vision API calls. Layout Composer already had access via SharedProjectState; now the Account Manager persona does too.

---

### updateContractorProfile tool added

**Category**: Tool Schema / Tool Executor
**Files Changed**:
- `src/lib/chat/tool-schemas.ts`
- `src/lib/chat/tools-runtime.ts`
- `src/app/api/chat/route.ts`

**Description**: New tool allows the agent to update contractor business profile fields during conversation.

**Schema** (`tool-schemas.ts`):
```typescript
const contractorProfileFields = [
  'business_name', 'city', 'state', 'services',
  'service_areas', 'description', 'phone', 'email', 'website',
] as const;

updateContractorProfileSchema = z.object({
  field: z.enum([...contractorProfileFields]),
  value: z.union([z.string(), z.array(z.string())]),
  reason: z.string().optional(),
});
```

**Output** (`UpdateContractorProfileOutput`):
```typescript
{
  success: boolean;
  field: ContractorProfileField;
  value: string | string[];
  reason?: string;
  error?: string;
}
```

**Classification**: Added to `FAST_TURN_TOOLS` (auto-allowed, low latency)

**Rationale**: Previously the agent had no way to update contractor profile information. Users had to leave chat and use the profile edit page. Now the agent can handle requests like "Update my services to include chimney repair".

---

## 2025-01-01

### Unified Agent Interface (Project-First Architecture)

**Category**: Architecture / Routes / State Model
**Files Changed**:
- `src/lib/chat/project-state.ts` (NEW)
- `src/lib/chat/chat-prompts.ts`
- `src/components/chat/ChatWizard.tsx`
- `src/app/(dashboard)/projects/[id]/page.tsx` (NEW)
- `src/app/(dashboard)/projects/[id]/edit/page.tsx`
- `src/app/(dashboard)/projects/new/page.tsx`

**Problem**:
Two entry points (`/projects/new` and `/projects/[id]/edit`) had different behaviors:
- Different opening messages
- Different initial phases ('conversation' vs 'review')
- Different canvas states ('collapsed' vs 'medium')
- 20+ conditional branches based on `isEditMode`

**Solution**:
Project-first architecture where user picks project BEFORE entering chat:

```
User picks project → Enters /projects/[id] → Agent adapts to project STATE
                                              └─ Empty? → "What are we documenting?"
                                              └─ Has content? → "Back to work on [title]"
                                              └─ Published? → "[title] is live - updates?"
```

**New Helper** (`src/lib/chat/project-state.ts`):
```typescript
interface ProjectState {
  isEmpty: boolean;       // No title, description, or images
  hasContent: boolean;    // Has generated content
  hasImages: boolean;     // Has at least one image
  isPublished: boolean;   // status === 'published'
  hasTitle: boolean;
  hasSeo: boolean;
}

function deriveProjectState(project, images): ProjectState
function getInitialPhase(state): 'conversation' | 'review'
function getInitialCanvasSize(state): 'collapsed' | 'medium'
```

**New Function** (`chat-prompts.ts`):
```typescript
function getAdaptiveOpeningMessage(options: {
  projectState: ProjectState;
  title?: string;
  hasExistingSession: boolean;
}): string
```

**Route Changes**:
| Old Route | New Behavior |
|-----------|--------------|
| `/projects/new` | Eager-create draft → redirect to `/projects/[id]` |
| `/projects/[id]/edit` | Redirect to `/projects/[id]` (backward compat) |
| `/projects/[id]` | Unified workspace (NEW) |

**ChatWizard Changes**:
- `mode` prop deprecated (still accepted for backward compat)
- Behavior derived from `projectState` instead of explicit mode
- Uses `getAdaptiveOpeningMessage()` for welcome message

**Rationale**: Single interface for all project work. Agent naturally adapts to project state rather than requiring explicit mode flags.

---

### story-extractor maxOutputTokens increased

**Category**: Bug Fix
**Files Changed**:
- `src/lib/agents/story-extractor.ts`

**Before**:
```typescript
maxOutputTokens: 1000,
```

**After**:
```typescript
maxOutputTokens: 2048, // Increased - structured response needs room for all fields
```

**Rationale**: Structured responses with confidence scores and multiple fields were being truncated, causing `AI_NoObjectGeneratedError` with `finishReason: 'length'`.

---

### checkPublishReady moved to FAST_TURN_TOOLS

**Category**: Tool Classification
**Files Changed**:
- `src/lib/chat/tools-runtime.ts`

**Before**:
```typescript
export const DEEP_CONTEXT_TOOLS = [
  'generatePortfolioContent',
  'composePortfolioLayout',
  'checkPublishReady',  // Was here
] as const;
```

**After**:
```typescript
export const FAST_TURN_TOOLS = [
  // ... other tools
  'checkPublishReady',  // Moved here - cheap validation check
] as const;

export const DEEP_CONTEXT_TOOLS = [
  'generatePortfolioContent',
  'composePortfolioLayout',
] as const;
```

**Rationale**: `checkPublishReady` is a validation check that doesn't require the `toolChoice` parameter or deep context loading. Moving it to FAST_TURN_TOOLS allows it to be called without explicit request.

---

### city/state added to updateFieldSchema

**Category**: Tool Schema
**Files Changed**:
- `src/lib/chat/tool-schemas.ts`

**Before**:
```typescript
field: z.enum(['title', 'description', 'seo_title', 'seo_description', 'tags', 'materials', 'techniques'])
```

**After**:
```typescript
field: z.enum(['title', 'description', 'seo_title', 'seo_description', 'tags', 'materials', 'techniques', 'city', 'state'])
```

**Rationale**: Location updates (city/state) are required for publishing. Without these in the schema, the AI couldn't update location fields via the updateField tool.

---

### ThinkingBlock component added

**Category**: UI Component
**Files Changed**:
- `src/components/chat/ThinkingBlock.tsx` (new)
- `src/components/chat/utils/parseThinking.ts` (new)
- `src/components/chat/ChatMessage.tsx`

**Description**: Added collapsible display for AI thinking/reasoning blocks. Reasoning is now collapsed by default with expandable disclosure.

---

### stripToolMarkers() added

**Category**: UI Utility
**Files Changed**:
- `src/components/chat/utils/parseThinking.ts`

**Description**: Filters `[Tool: ...]` text patterns from displayed messages to clean up raw tool markers in the chat UI.

---

## Template Entry

Copy this template for new entries:

```markdown
## YYYY-MM-DD

### Change Title

**Category**: Tool Schema | Tool Executor | Agent | State Model | UI Artifact | Phase Logic
**Files Changed**:
- `path/to/file.ts`

**Before**:
```typescript
// old code
```

**After**:
```typescript
// new code
```

**Rationale**: Why this change was made.
```

---

*Maintained by: agent-atlas skill*
*Last audit: 2026-01-01*
