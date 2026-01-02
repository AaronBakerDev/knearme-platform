# State Models

> Data shapes, transformations, and state management for the agent system.

## Core State Types

### ImageContextData (Prompt Context)

Defined in `src/lib/chat/context-shared.ts`. Lightweight image metadata passed to agent in system prompt.

```typescript
interface ImageContextData {
  id: string;
  imageType: 'before' | 'after' | 'progress' | 'detail' | null;
  altText: string | null;
  displayOrder: number;
  isHero: boolean;
}
```

**Usage**:
- Loaded by `loadPromptContext()` in parallel with project data
- Formatted by `formatProjectDataForPrompt()` into concise inventory
- Gives agent awareness of images without vision API costs

**Token Impact**: ~50-150 tokens for typical project (vs ~258 tokens/image for vision)

---

### ProjectState (UI Behavior Derivation)

Defined in `src/lib/chat/project-state.ts`. Used by ChatWizard to derive UI behavior from project content.

```typescript
interface ProjectState {
  isEmpty: boolean;       // No title, description, or images
  hasContent: boolean;    // Has generated content (title + description)
  hasImages: boolean;     // Has at least one image
  isPublished: boolean;   // status === 'published'
  isArchived: boolean;    // status === 'archived'
  hasTitle: boolean;      // Has title
  hasSeo: boolean;        // Has SEO metadata
}
```

**Helper Functions**:

```typescript
// Derive state from project data
function deriveProjectState(
  project: ProjectStateInput | null,
  images: { id: string }[] = []
): ProjectState

// Get initial chat phase based on project state
function getInitialPhase(state: ProjectState): 'conversation' | 'review'
// Returns 'review' if hasContent, otherwise 'conversation'

// Get initial canvas size based on project state
function getInitialCanvasSize(state: ProjectState): 'collapsed' | 'medium'
// Returns 'medium' if hasContent or hasImages, otherwise 'collapsed'
```

**Usage in ChatWizard**:
```typescript
const projectState = deriveProjectState(project, images);
const initialPhase = getInitialPhase(projectState);
const initialCanvasSize = getInitialCanvasSize(projectState);
const welcomeMessage = getAdaptiveOpeningMessage({ projectState, title, hasExistingSession });
```

---

### SharedProjectState

The central data structure shared across all agents. Defined in `src/lib/agents/types.ts`.

```typescript
interface SharedProjectState {
  // ─────────────────────────────────────────────
  // Extracted Data (from conversation)
  // ─────────────────────────────────────────────
  projectType?: string;           // e.g., "chimney-rebuild"
  projectTypeSlug?: string;       // Database slug
  customerProblem?: string;       // What issue led to project
  solutionApproach?: string;      // How contractor solved it
  materials: string[];            // e.g., ["reclaimed brick", "Type S mortar"]
  techniques: string[];           // e.g., ["repointing", "waterproofing"]
  city?: string;                  // e.g., "Denver"
  state?: string;                 // e.g., "CO"
  location?: string;              // Formatted location string
  duration?: string;              // e.g., "3 days"
  proudOf?: string;               // What contractor is proud of

  // ─────────────────────────────────────────────
  // Generated Content (by AI)
  // ─────────────────────────────────────────────
  title?: string;                 // 60 chars max
  suggestedTitle?: string;        // Pre-confirmation title
  description?: string;           // 300-500 words
  seoTitle?: string;              // SEO page title
  seoDescription?: string;        // 160 chars max
  tags: string[];                 // Categorization

  // ─────────────────────────────────────────────
  // Images
  // ─────────────────────────────────────────────
  images: ProjectImageState[];
  heroImageId?: string;

  // ─────────────────────────────────────────────
  // State Flags
  // ─────────────────────────────────────────────
  readyForImages: boolean;        // Has enough story data
  readyForContent: boolean;       // Has images, can generate
  readyToPublish: boolean;        // All requirements met

  // ─────────────────────────────────────────────
  // Clarification Tracking
  // ─────────────────────────────────────────────
  needsClarification: string[];   // Fields needing clarity
  clarifiedFields: string[];      // Fields already clarified
}
```

### ProjectImageState

```typescript
interface ProjectImageState {
  id: string;
  url: string;
  filename?: string;
  imageType?: 'before' | 'after' | 'progress' | 'detail';
  altText?: string;
  displayOrder: number;
}
```

### ToolContext

Secure context passed to tool executors (not from model).

```typescript
interface ToolContext {
  userId: string;         // auth.users.id
  contractorId: string;   // contractors.id
  projectId?: string;     // Current project (if editing)
  sessionId?: string;     // Chat session for state
}
```

---

## State Transformations

### 1. ExtractedProjectData → SharedProjectState

Function: `mapExtractedDataToState()` in `tools-runtime.ts:252-272`

```typescript
// Input (from extractProjectData tool)
{
  project_type: "chimney rebuild",
  customer_problem: "leaking chimney causing water damage",
  materials_mentioned: ["reclaimed brick", "Type S mortar"],
  city: "Denver",
  state: "CO"
}

// Output (partial SharedProjectState)
{
  projectType: "chimney rebuild",
  customerProblem: "leaking chimney causing water damage",
  materials: ["reclaimed brick", "Type S mortar"],
  city: "Denver",
  state: "CO",
  location: "Denver, CO"
}
```

### 2. SharedProjectState → ExtractedProjectData

Function: `mapStateToExtractedData()` in `tools-runtime.ts:274-293`

Reverse transformation for API responses.

### 3. Database Project → SharedProjectState

Function: `loadProjectState()` in `tools-runtime.ts:83-196`

Maps database columns to state fields:

| Database Column | State Field |
|-----------------|-------------|
| `title` | `title` |
| `description` | `description` |
| `project_type` | `projectType` |
| `project_type_slug` | `projectTypeSlug` |
| `city` | `city` |
| `state` | `state` |
| `materials` | `materials` |
| `techniques` | `techniques` |
| `seo_title` | `seoTitle` |
| `seo_description` | `seoDescription` |
| `hero_image_id` | `heroImageId` |
| `ai_context.customer_problem` | `customerProblem` |
| `ai_context.solution_approach` | `solutionApproach` |
| `ai_context.duration` | `duration` |
| `ai_context.proud_of` | `proudOf` |

---

## State Merge Logic

Function: `mergeProjectState()` in `orchestrator.ts:267-288`

**Rules**:
1. Later values override earlier (except arrays)
2. Arrays are deduplicated and merged
3. Images replaced entirely (not merged)
4. Clarification fields are union-merged

```typescript
function mergeProjectState(
  existing: SharedProjectState,
  updates: Partial<SharedProjectState>
): SharedProjectState {
  return {
    ...existing,
    ...updates,
    // Dedupe arrays
    materials: [...new Set([...existing.materials, ...(updates.materials || [])])],
    techniques: [...new Set([...existing.techniques, ...(updates.techniques || [])])],
    tags: [...new Set([...existing.tags, ...(updates.tags || [])])],
    // Replace images entirely
    images: updates.images || existing.images,
    // Union clarification tracking
    clarifiedFields: [...new Set([
      ...existing.clarifiedFields,
      ...(updates.clarifiedFields || [])
    ])]
  };
}
```

---

## Readiness Calculations

### readyForImages

Function: `checkReadyForImages()` in `story-extractor.ts`

**Conditions** (all required):
1. `projectType` is set and specific
2. `customerProblem` >= 8 words
3. `solutionApproach` >= 8 words
4. At least 1 material mentioned

### readyForContent

**Conditions**:
1. `readyForImages === true`
2. `images.length > 0`
3. `heroImageId` is set

### readyToPublish

Function: `checkQuality()` in `quality-checker.ts`

**Required fields** (PUBLISH_REQUIREMENTS):
- `title`
- `project_type`
- `project_type_slug`
- `city`
- `state`
- At least 1 image
- Hero image selected

---

## Publish Requirements

Defined in `types.ts:214-246`:

```typescript
const PUBLISH_REQUIREMENTS = {
  required: ['title', 'project_type', 'project_type_slug', 'city', 'state'],
  minImages: 1,
  requireHeroImage: true,
};

const PUBLISH_RECOMMENDATIONS = {
  minDescriptionWords: 200,
  minMaterials: 2,
  hasTags: true,
  hasSeoMetadata: true,
};
```

---

## Empty State Factory

Function: `createEmptyProjectState()` in `types.ts:134-146`

```typescript
function createEmptyProjectState(): SharedProjectState {
  return {
    materials: [],
    techniques: [],
    tags: [],
    images: [],
    readyForImages: false,
    readyForContent: false,
    readyToPublish: false,
    needsClarification: [],
    clarifiedFields: [],
  };
}
```

---

## Description Blocks

Structured content blocks for rich descriptions.

```typescript
type DescriptionBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: '2' | '3'; text: string }
  | { type: 'list'; style: 'bullet' | 'number'; items: string[] }
  | { type: 'callout'; variant: 'info' | 'tip' | 'warning'; title?: string; text: string }
  | { type: 'stats'; items: { label: string; value: string }[] }
  | { type: 'quote'; text: string; cite?: string };
```

Defined in: `src/lib/content/description-blocks.ts`

---

*Last updated: 2026-01-01*
*See [PHASE-FLOWS.md](PHASE-FLOWS.md) for state machine details*
*See [TOOL-CATALOG.md](TOOL-CATALOG.md) for updateContractorProfile tool*
