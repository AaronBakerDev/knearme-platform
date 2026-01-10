# Phase Flows

> Chat orchestration logic and agent coordination.

> **⚠️ Architectural Evolution** - The rigid phase state machine is being replaced
> by the **Orchestrator + Subagents** pattern. Phases become checkpoints that agents
> signal, not gates that block progress.
>
> See [AGENT-PERSONAS.md](AGENT-PERSONAS.md) for the new architecture.
> See [PHILOSOPHY.md](PHILOSOPHY.md) for design principles.

---

## Philosophy: Images as Context, Not Gates

**Current (Legacy):** Images are a phase gate. The agent asks `readyForImages?` and transitions to an "images phase" before generating content.

**Target (Agentic):** Images are **context that enriches the agent's understanding** of the project. The agent:

1. **Knows images matter** - They reveal craftsmanship, scale, materials, and story details that conversation alone can't capture
2. **Invites them naturally** - When it feels helpful ("Got any photos of that?"), not at a prescribed moment
3. **Uses them as thinking context** - Images influence how the agent writes, what it emphasizes, and what questions it asks
4. **Never blocks on them** - A project can progress without images, but images make it better

### Why This Matters

When the agent sees images, it thinks differently:
- A before/after photo reveals transformation magnitude
- A detail shot shows craftsmanship worth highlighting
- A progress photo suggests process-focused storytelling

The agent should be **goal-aware** (get images because they help) but **not procedure-bound** (don't force a specific phase).

### Current vs Target

| Aspect | Current (Phase-Based) | Target (Context-Based) |
|--------|----------------------|------------------------|
| When to ask | `readyForImages === true` | When it feels natural |
| Blocking | Can't generate until images | Can generate anytime, images enhance |
| Agent thinking | Images after story | Images inform story understanding |
| User experience | "Now upload photos" | "Got any pics of that?" mid-conversation |

---

## Target: Orchestrator + Subagents Flow

> **This is the target architecture.** See [AGENT-PERSONAS.md](AGENT-PERSONAS.md) for full details.

```
User Request
      ↓
┌─────────────────────────────────────────────────┐
│           ACCOUNT MANAGER (Orchestrator)         │
│       Lightweight tools • Delegates complex work │
└───────────────────────┬─────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │  STORY  │    │ DESIGN  │    │ QUALITY │
   │  AGENT  │    │  AGENT  │    │  AGENT  │
   └─────────┘    └─────────┘    └─────────┘
        │               │               │
        └───────────────┼───────────────┘
                        ↓
               Shared ProjectState
```

### Checkpoint-Based Coordination

Instead of rigid phase gates, agents signal checkpoints:

| Checkpoint | Triggered By | What Happens |
|------------|--------------|--------------|
| `images_uploaded` | User uploads images | Story Agent sees images, Design Agent can start layout |
| `basic_info` | Story Agent has enough context | Design Agent composes initial layout |
| `story_complete` | Story Agent signals done | Quality Agent begins assessment |
| `design_complete` | Design Agent renders preview | Quality Agent includes design in assessment |
| `ready_to_publish` | Quality Agent approves | Account Manager offers publish action |

### Parallel Execution

Independent subagents can run simultaneously:

```
User uploads images
         │
    ┌────┴────┐
    ▼         ▼
 Story     Design
 Agent     Agent
(analyze)  (initial
           layout)
    │         │
    └────┬────┘
         ▼
   Account Manager
   (synthesize)
```

---

## Project-First Entry Flow

All project work now enters through a unified route. The agent adapts to project state:

```mermaid
graph TB
    subgraph "Entry Points"
        N[/projects/new] -->|eager-create| C[Create Draft Project]
        E[/projects/:id/edit] -->|redirect| U
        D[Dashboard/List] --> U
    end

    C --> U[/projects/:id<br/>Unified Workspace]

    subgraph "State Derivation"
        U --> DS[deriveProjectState]
        DS --> IP[getInitialPhase]
        DS --> IC[getInitialCanvasSize]
        DS --> AM[getAdaptiveOpeningMessage]
    end

    subgraph "Adaptive Behavior"
        IP -->|isEmpty| CONV[phase: conversation]
        IP -->|hasContent| REV[phase: review]
        IC -->|isEmpty| COLL[canvas: collapsed]
        IC -->|hasContent| MED[canvas: medium]
    end
```

### Adaptive Greeting Messages

Based on `ProjectState`, the agent greets appropriately:

| State | Greeting Style |
|-------|---------------|
| `isEmpty && !hasExistingSession` | "Hey - what project are we documenting today?" |
| `isEmpty && hasExistingSession` | "Picking up where we left off - what's this project about?" |
| `hasImages && !hasContent` | "Got your photos - want me to write up the story?" |
| `hasContent` (draft) | "Back to work on [title] - what needs tweaking?" |
| `isPublished` | "[title] is live - anything you want to update?" |

---

## Phase State Machine

> **⚠️ Legacy Pattern** - This rigid state machine is being replaced by fluid, context-aware behavior.
> In the target architecture, there are no enforced phases - just an agent that knows what good looks like
> and naturally guides the conversation toward a publishable portfolio.

```mermaid
stateDiagram-v2
    [*] --> gathering

    gathering --> gathering: extract more data
    gathering --> images: readyForImages=true

    images --> images: waiting for uploads
    images --> generating: images + heroImageId

    generating --> review: content generated
    generating --> generating: generation failed (retry)

    review --> review: user edits
    review --> ready: all requirements met

    ready --> [*]: publish
```

**Target Vision:** Replace this with goal-based behavior:
- Agent knows the goal: create a compelling, publishable portfolio page
- Agent naturally gathers story, invites images, generates content - in whatever order makes sense
- Images can arrive anytime and enrich the agent's understanding
- No `readyForImages` gate - just "would photos help here?"

## Phase Definitions

Defined in: `src/lib/agents/orchestrator.ts:54-62`

```typescript
type Phase = 'gathering' | 'images' | 'generating' | 'review' | 'ready';
```

### Phase Determination

Function: `determinePhase()` in `orchestrator.ts:67-73`

```typescript
function determinePhase(state: SharedProjectState): Phase {
  if (state.readyToPublish) return 'ready';
  if (state.title && state.description) return 'review';
  if (state.readyForContent) return 'generating';
  if (state.readyForImages) return 'images';
  return 'gathering';
}
```

---

## Phase Handlers

### 1. Gathering Phase

**Entry**: Session start or incomplete story data

**Goal**: Extract project information from conversation

**Handler**: `handleGatheringPhase()` in `orchestrator.ts:116-146`

```mermaid
flowchart TD
    A[User Message] --> B[extractStory]
    B --> C{needsClarification?}
    C -->|Yes| D[request_clarification action]
    C -->|No| E{readyForImages?}
    E -->|Yes| F[prompt_images action]
    E -->|No| G[Continue gathering]
```

**Tools Used**:
- `extractProjectData` - Parse conversation
- `requestClarification` - Ask for clarity
- `suggestQuickActions` - Guide user

**Transition Trigger**:
- `readyForImages === true`

**Target Vision:**
- No rigid "gathering" phase - conversation flows naturally
- Images can arrive during gathering and inform the agent's questions
- Agent knows the goal (publishable portfolio) and guides conversation toward it
- No `readyForImages` gate - agent invites photos when it feels natural

---

### 2. Images Phase

> **⚠️ Legacy Pattern** - In the target architecture, there is no "images phase."
> Images flow into the conversation naturally and enrich the agent's context at any time.
> See [Philosophy: Images as Context](#philosophy-images-as-context-not-gates) above.

**Entry**: Story data complete, waiting for photos

**Goal**: Collect project images

**Handler**: `handleImagesPhase()` in `orchestrator.ts:151-167`

```mermaid
flowchart TD
    A[Phase: images] --> B{images.length > 0?}
    B -->|No| C[Wait for uploads]
    B -->|Yes| D{heroImageId set?}
    D -->|No| E[Ask user to select hero]
    D -->|Yes| F[readyForContent = true]
    F --> G[generate_content action]
```

**Tools Used**:
- `promptForImages` - Show upload UI
- `showPortfolioPreview` - Preview with images
- `suggestQuickActions` - "Generate content" chip

**Transition Trigger**:
- `images.length > 0 && heroImageId`

**Target Vision:**
- No dedicated "images phase" - images can arrive anytime
- Agent invites images naturally: "Got any photos of that work?"
- When images arrive, agent's understanding deepens
- Content generation can happen before, during, or after images

---

### 3. Generating Phase

**Entry**: Has images and hero, ready for AI content

**Goal**: Create polished portfolio content

**Handler**: `handleGeneratingPhase()` in `orchestrator.ts:172-201`

```mermaid
flowchart TD
    A[Phase: generating] --> B[generateContent]
    B --> C{Error?}
    C -->|Yes - Retryable| D[Show error, allow retry]
    C -->|Yes - Fatal| E[Show error message]
    C -->|No| F[Update state with content]
    F --> G[Transition to review]
```

**Tools Used**:
- `generatePortfolioContent` - Full AI generation
- `composePortfolioLayout` - Block structure (optional)

**Transition Trigger**:
- `title && description` populated

---

### 4. Review Phase

**Entry**: Content generated, user reviewing

**Goal**: Let user review and edit before publish

**Handler**: `handleReviewPhase()` in `orchestrator.ts:206-228`

```mermaid
flowchart TD
    A[Phase: review] --> B[checkQuality]
    B --> C{ready?}
    C -->|Yes| D[readyToPublish = true]
    C -->|No| E[request_clarification for missing]
    D --> F[ready_to_publish action]
```

**Tools Used**:
- `checkPublishReady` - Validate requirements
- `updateField` - Edit fields
- `regenerateSection` - AI rewrite
- `reorderImages` - Change order
- `showPortfolioPreview` - Show changes

**Transition Trigger**:
- `checkQuality().ready === true`

---

### 5. Ready Phase

**Entry**: All requirements met

**Goal**: Final validation and publish

**Handler**: `handleReadyPhase()` in `orchestrator.ts:233-261`

```mermaid
flowchart TD
    A[Phase: ready] --> B[checkQuality]
    B --> C{Still ready?}
    C -->|Yes| D[ready_to_publish action]
    C -->|No| E[Show missing/warnings]
    D --> F[User clicks Publish]
    F --> G[API: /api/projects/id/publish]
```

**Tools Used**:
- `validateForPublish` - Server-side check
- `checkPublishReady` - Client display

---

## Orchestrator Actions

Defined in `orchestrator.ts:25-31`:

```typescript
type OrchestratorAction =
  | { type: 'extract_story'; message: string }
  | { type: 'generate_content' }
  | { type: 'check_quality' }
  | { type: 'request_clarification'; fields: string[] }
  | { type: 'prompt_images' }
  | { type: 'ready_to_publish' };
```

---

## Chat Route Integration

The chat route (`/api/chat/route.ts`) doesn't directly call the orchestrator for every message. Instead:

1. **Tool Selection**: Route selects which tools are active based on `toolChoice`
2. **Tool Execution**: Individual tools may call orchestrator internally
3. **Streaming**: Response streams back with tool results

```mermaid
sequenceDiagram
    participant Client
    participant ChatRoute
    participant Tool
    participant Orchestrator
    participant Agent

    Client->>ChatRoute: POST {messages, projectId, toolChoice}
    ChatRoute->>ChatRoute: streamText() with activeTools

    alt Model calls tool
        ChatRoute->>Tool: execute(args)
        Tool->>Orchestrator: orchestrate(context)
        Orchestrator->>Agent: delegate
        Agent-->>Orchestrator: result
        Orchestrator-->>Tool: updated state
        Tool-->>ChatRoute: tool output
    end

    ChatRoute-->>Client: streaming response
```

---

## toolChoice Parameter

Controls which deep tools are available:

```typescript
// Request body
{
  messages: [...],
  projectId: "uuid",
  sessionId: "uuid",
  toolChoice: "generatePortfolioContent"  // or "composePortfolioLayout"
}

// Route logic
const requestedDeepTool = DEEP_CONTEXT_TOOLS.includes(toolChoice)
  ? toolChoice
  : undefined;

const activeTools = requestedDeepTool
  ? [...FAST_TURN_TOOLS, requestedDeepTool]
  : [...FAST_TURN_TOOLS];

const enforcedToolChoice = requestedDeepTool
  ? { type: 'tool', toolName: requestedDeepTool }
  : 'auto';
```

---

## Phase Recovery

If phase is lost (e.g., session timeout):

1. Load project state from database
2. Call `determinePhase(state)` to infer current phase
3. Resume from appropriate handler

---

*Last updated: 2026-01-01*
*See [ARCHITECTURE.md](ARCHITECTURE.md) for system overview*
