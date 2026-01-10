# Tool Catalog

> Complete reference for all chat tools with schemas, executors, and artifact mappings.

> **⚠️ Current Implementation** - This documents the existing tool system.
> We're evolving toward agentic architecture where agents decide tool usage autonomously.
> See [PHILOSOPHY.md](PHILOSOPHY.md) for target design principles.
>
> **Philosophy Note:** Tools should be *capabilities*, not prescribed workflows.
> Agents should decide when to use them based on context, not fixed conditions.

## Tool Classification

| Category | Tools | Characteristics |
|----------|-------|-----------------|
| **FAST_TURN_TOOLS** | 11 tools | Auto-allowed, <500ms, immediate feedback |
| **DEEP_CONTEXT_TOOLS** | 2 tools | Requires `toolChoice`, 1-5s, AI generation |

---

## FAST_TURN_TOOLS

### extractProjectData

**Purpose**: Extract structured project information from conversation.

**Schema** (`tool-schemas.ts:44-100`):
```typescript
{
  project_type?: string,      // "kitchen-remodel", "bathroom-renovation", etc.
  customer_problem?: string,  // What issue the customer had
  solution_approach?: string, // How contractor solved it
  materials_mentioned?: string[],
  techniques_mentioned?: string[],
  duration?: string,
  city?: string,              // REQUIRED for publish
  state?: string,             // REQUIRED for publish
  location?: string,          // DEPRECATED - use city/state
  challenges?: string,
  proud_of?: string,
  ready_for_images?: boolean  // DEPRECATED - always true now
}
```

**ready_for_images Conditions** (DEPRECATED):

> ⚠️ These thresholds have been removed from the codebase.
> The function now returns `true` - images can be requested anytime.
> See [MIGRATIONS.md](MIGRATIONS.md) Phase 2 for details.

~~1. Specific project type (not "brick work")~~
~~2. customer_problem >= 8 words~~
~~3. solution_approach >= 8 words~~
~~4. At least 1 specific material~~

**Executor** (`tools-runtime.ts:303-320`):
- Merges session data with new extraction
- Calls `orchestrate()` with phase='gathering'
- Returns cleaned extracted data

**Artifact**: None (data extraction only)

---

### requestClarification

**Purpose**: Display interactive clarification card when AI is uncertain.

**Schema** (`tool-schemas.ts:179-193`):
```typescript
{
  field: string,           // Field being clarified
  currentValue?: string,   // Best guess
  alternatives?: string[], // 2-4 options
  question: string,        // Question to ask
  confidence: number,      // 0-1 confidence
  context?: string         // Why clarification needed
}
```

**Executor**: Pass-through (returns args as-is)

**Artifact**: `ClarificationCard.tsx`
- Shows current value with confidence indicator
- Renders alternatives as clickable chips
- "Something else" option for custom input

---

### promptForImages

**Purpose**: Trigger inline image upload UI.

**Schema** (`tool-schemas.ts:111-118`):
```typescript
{
  existingCount: number,                    // Default: 0
  suggestedCategories?: string[],           // Agent decides categories based on context
  message?: string                          // Optional prompt
}
```

**Executor**: Pass-through

**Artifact**: `ImagePrompt.tsx` (or `ChatPhotoSheet`)
- Drag-drop upload interface
- Category selection chips
- Progress indicators

---

### showPortfolioPreview

**Purpose**: Trigger preview panel refresh (side-effect tool).

**Schema** (`tool-schemas.ts:129-136`):
```typescript
{
  title?: string,          // Suggested title hint
  message?: string,        // "Check your preview!"
  highlightFields?: string[] // Fields to highlight
}
```

**Executor**: Pass-through

**Artifact**: Side-effect only (no inline render)
- Triggers `onPreviewRequest` callback in ChatWizard
- Opens preview overlay on mobile
- Highlights preview pane on desktop

---

### suggestQuickActions

**Purpose**: Show action chips in chat UI.

**Schema** (`tool-schemas.ts:204-227`):
```typescript
{
  actions: Array<{
    label: string,
    type: 'addPhotos' | 'generate' | 'openForm' |
          'showPreview' | 'composeLayout' |
          'checkPublishReady' | 'insert',
    value?: string  // For 'insert' type
  }>,  // max 5
  reason?: string
}
```

**Executor**: Pass-through

**Artifact**: `QuickActionsCard.tsx`
- Horizontal chip row
- Click triggers action in ChatWizard
- 'insert' type prefills chat input

---

### updateField

**Purpose**: Update a specific project field.

**Schema** (`tool-schemas.ts:361-372`):
```typescript
{
  field: 'title' | 'description' | 'seo_title' |
         'seo_description' | 'tags' | 'materials' |
         'techniques' | 'city' | 'state',
  value: string | string[],
  reason?: string
}
```

**Executor** (`tools-runtime.ts:430-436`):
- Validates field against enum
- Returns success + field + value

**Artifact**: Client-side update (ChatWizard handles)

---

### regenerateSection

**Purpose**: Request AI rewrite of content section.

**Schema** (`tool-schemas.ts:396-408`):
```typescript
{
  section: 'title' | 'description' | 'seo',
  guidance?: string,           // Style hints
  preserveElements?: string[]  // Keep these phrases
}
```

**Executor**: Returns action descriptor

**Artifact**: Client calls regeneration API

---

### reorderImages

**Purpose**: Change image display order (first = hero).

**Schema** (`tool-schemas.ts:425-433`):
```typescript
{
  imageIds: string[],  // New order
  reason?: string
}
```

**Executor**: Returns action descriptor

**Artifact**: Client updates order via API

---

### validateForPublish

**Purpose**: Validate project against server publish rules.

**Schema** (`tool-schemas.ts:456-461`):
```typescript
{
  checkFields?: ('title' | 'description' | 'images' | 'seo')[]
}
```

**Executor**: Returns action descriptor

**Artifact**: Client performs validation

---

### checkPublishReady

**Purpose**: Quality check using QualityChecker agent.

**Schema** (`tool-schemas.ts:315-320`):
```typescript
{
  showWarnings: boolean  // Default: true
}
```

**Executor** (`tools-runtime.ts:398-429`):
1. Loads project state from database
2. Calls `orchestrate({ phase: 'ready' })`
3. Runs `checkQuality()` on result
4. Formats summary with `formatQualityCheckSummary()`

**Output**:
```typescript
{
  ready: boolean,
  missing: string[],      // Blocking issues
  warnings: string[],     // Recommendations
  suggestions: string[],  // Actionable tips
  topPriority: string | null,
  summary: string
}
```

**Artifact**: `PublishReadinessCard.tsx`
- Green/yellow/red status indicator
- Missing requirements list
- Suggestions with actions

---

### updateContractorProfile

**Purpose**: Update contractor business profile fields.

**Schema** (`tool-schemas.ts:500-521`):
```typescript
{
  field: 'business_name' | 'city' | 'state' | 'services' |
         'service_areas' | 'description' | 'phone' | 'email' | 'website',
  value: string | string[],  // Array for services/service_areas
  reason?: string
}
```

**Executor** (`tools-runtime.ts:461-523`):
1. Validates contractorId exists
2. Validates field/value type compatibility
3. Updates contractor record in database
4. Returns success/error result

**Output**:
```typescript
{
  success: boolean,
  field: ContractorProfileField,
  value: string | string[],
  reason?: string,
  error?: string  // On failure
}
```

**Artifact**: None (direct database update)

**Usage Examples**:
- "Update my services to include bathroom remodels"
- "Change my business name to Smith Home Services LLC"
- "Add Denver and Boulder to my service areas"

---

## DEEP_CONTEXT_TOOLS

### generatePortfolioContent

**Purpose**: Full AI content generation using ContentGenerator agent.

**Schema** (`tool-schemas.ts:244-253`):
```typescript
{
  forceRegenerate?: boolean,
  focusAreas?: string[]  // e.g., ["craftsmanship", "materials"]
}
```

**Executor** (`tools-runtime.ts:326-378`):
1. Loads project state
2. Calls `orchestrate({ phase: 'generating' })`
3. Extracts title, description, SEO from result

**Output**:
```typescript
{
  success: boolean,
  title: string,         // 60 chars max
  description: string,   // 300-500 words
  seoTitle: string,
  seoDescription: string,
  tags: string[],
  error?: string
}
```

**Artifact**: `GeneratedContentCard.tsx`
- Shows generated content preview
- Edit buttons for each section
- Apply/discard actions

---

### composePortfolioLayout

**Purpose**: Create structured description blocks using LayoutComposer agent.

**Schema** (`tool-schemas.ts:275-288`):
```typescript
{
  goal?: string,                  // Layout focus
  focusAreas?: string[],          // Emphasis areas
  includeImageOrder?: boolean     // Return image ordering
}
```

**Executor** (`tools-runtime.ts:379-397`):
1. Loads project state
2. Calls `composePortfolioLayout()` directly

**Output**:
```typescript
{
  blocks: DescriptionBlock[],
  imageOrder?: string[],
  rationale?: string,
  missingContext?: string[],
  confidence?: number
}
```

**Block Types**:
- `paragraph` - Text block
- `heading` - H2 or H3
- `list` - Bullet or numbered
- `callout` - Info, tip, warning
- `stats` - Key metrics
- `quote` - Testimonial

**Artifact**: Block editor preview

---

## Deprecated Tools

### showContentEditor

**Status**: DEPRECATED

**Reason**: Inline editor removed from chat. Use `suggestQuickActions` with `openForm` type instead.

---

## Schema Source Files

| File | Purpose |
|------|---------|
| `src/lib/chat/tool-schemas.ts` | Zod schemas + TypeScript types |
| `src/lib/chat/tools-runtime.ts` | Executor implementations |
| `src/types/artifacts.ts` | Artifact data types |

---

*Last updated: 2026-01-01*
*See [ARTIFACT-GUIDE.md](ARTIFACT-GUIDE.md) for UI component details*
