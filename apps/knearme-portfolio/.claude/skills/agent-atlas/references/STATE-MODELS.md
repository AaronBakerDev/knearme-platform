# State Models

> Data shapes, transformations, and state management for the agent system.

> **Architecture:** Orchestrator + Subagents with Shared State
>
> All agents read from and write to a common `ProjectState`. Each agent owns specific sections:
> - **Story Agent** writes: `businessContext`, `project` (content, images)
> - **Design Agent** writes: `design` (layout, tokens, hero)
> - **Quality Agent** writes: `assessment` (ready, confidence, suggestions)
>
> See [AGENT-PERSONAS.md](AGENT-PERSONAS.md) for agent definitions.
>
> **Philosophy Note:** Schemas should capture *storage needs*, not business rules.
> Structure should emerge from content, not be forced into templates.

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

> **Philosophy Note:** This fixed enum is transitional. In target architecture,
> image categories emerge from content analysis, not predefined templates.
> See [PHILOSOPHY.md](PHILOSOPHY.md) for target design principles.

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

Each agent owns specific sections (see [AGENT-PERSONAS.md](AGENT-PERSONAS.md)):

```typescript
interface SharedProjectState {
  // ─────────────────────────────────────────────
  // Story Agent writes: businessContext
  // ─────────────────────────────────────────────
  businessContext: {
    name: string;                 // Business name
    type: string;                 // Discovered, not enumerated
    voice: 'formal' | 'casual' | 'technical';
    vocabulary: string[];         // Their words, not ours
  };

  // ─────────────────────────────────────────────
  // Story Agent writes: project content
  // ─────────────────────────────────────────────
  project: {
    title: string;                // 60 chars max
    description: string;          // 300-500 words
    story: string;                // Extracted narrative
    images: ImageWithAnalysis[];  // Images with multimodal analysis
  };

  // ─────────────────────────────────────────────
  // Design Agent writes: design
  // ─────────────────────────────────────────────
  design: {
    layout: LayoutToken;          // 'hero-focused' | 'gallery-grid' | etc.
    spacing: SpacingToken;        // 'compact' | 'comfortable' | 'spacious'
    headingStyle: HeadingToken;   // 'bold' | 'elegant' | 'technical' | 'playful'
    accentColor: AccentToken;     // 'slate' | 'warm' | 'cool' | 'earth' | 'vibrant'
    heroImage: string;            // Best image for hero
  };

  // ─────────────────────────────────────────────
  // Quality Agent writes: assessment
  // ─────────────────────────────────────────────
  assessment: {
    ready: boolean;               // Is it publish-ready?
    confidence: 'high' | 'medium' | 'low';
    suggestions: string[];        // Advisory, not requirements
    contextualChecks: string[];   // What was evaluated
  };

  // ─────────────────────────────────────────────
  // Coordination (Account Manager)
  // ─────────────────────────────────────────────
  checkpoint: 'images_uploaded' | 'basic_info' | 'story_complete' |
              'design_complete' | 'ready_to_publish';
}
```

### Legacy SharedProjectState (Transitional)

> **⚠️ Legacy Pattern** - The current implementation uses a flatter structure.
> Migration to the agent-owned sections above is in progress.

```typescript
interface LegacySharedProjectState {
  // Extracted Data (from conversation)
  projectType?: string;
  projectTypeSlug?: string;
  customerProblem?: string;
  solutionApproach?: string;
  materials: string[];
  techniques: string[];
  city?: string;
  state?: string;
  location?: string;
  duration?: string;
  proudOf?: string;

  // Generated Content
  title?: string;
  suggestedTitle?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];

  // Images
  images: ProjectImageState[];
  heroImageId?: string;

  // State Flags (DEPRECATED - becoming checkpoints)
  readyForImages: boolean;        // DEPRECATED: Always true
  readyForContent: boolean;       // ADVISORY: Agent decides
  readyToPublish: boolean;        // ADVISORY: Quality check

  // Clarification Tracking
  needsClarification: string[];
  clarifiedFields: string[];
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

### readyForImages (DEPRECATED)

> ⚠️ This function now returns `true` unconditionally.
> Images enrich agent context but never block progress.
> See [PHILOSOPHY.md](PHILOSOPHY.md) "Images as Context, Not Gates".

~~Function: `checkReadyForImages()` in `story-extractor.ts`~~

~~**Conditions** (all required):~~
~~1. `projectType` is set and specific~~
~~2. `customerProblem` >= 8 words~~
~~3. `solutionApproach` >= 8 words~~
~~4. At least 1 material mentioned~~

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

## Publish Requirements (Advisory)

> **Philosophy Note:** These are advisory quality checks, not gates.
> Agent explains what would make the portfolio better, doesn't block.
> See [PHILOSOPHY.md](PHILOSOPHY.md) for target design principles.

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
