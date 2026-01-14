# Multi-Agent Architecture

This document describes the multi-agent system for KNearMe's portfolio wizard.

## Design Philosophy

### Single Account Manager Persona

The contractor always communicates with **one persona** - their dedicated Account Manager. Behind the scenes, specialized agents handle different aspects of content creation.

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONTRACTOR INTERFACE                        │
│                                                                 │
│   Contractor ←──────────────────→ Account Manager               │
│                                   (Single Persona)              │
│                                        │                        │
│                                        │ delegates to           │
│                           ┌────────────┼────────────┐           │
│                           ▼            ▼            ▼           │
│                    ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│                    │  Tool    │  │  Content │  │  Quality │    │
│                    │ Extraction│ │ Generator│  │  Checker │    │
│                    └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Agent Responsibilities

| Agent | Purpose | When Called | Current Implementation |
|-------|---------|-------------|------------------------|
| **Account Manager** | Single persona contractors talk to. Orchestrates tool usage. | Every message | Implemented via system prompt + tool calling in `/src/app/api/chat/route.ts` and `/src/lib/chat/chat-prompts.ts`. |
| **Story Extractor** | Extracts structured data from natural conversation | When `extractProjectData` runs | Server-side Gemini extraction during tool execution; merges `chat_sessions.extracted_data` + tool args + latest user message. Falls back to heuristic extraction when AI is disabled. |
| **Content Generator** | Creates title, description, SEO metadata | When ready to generate content | Used via `generatePortfolioContent` tool (server-side agent). |
| **Quality Checker** | Validates publish requirements are met | Before publishing (coaching) | Used via `checkPublishReady` tool (server-side agent). Final publish gating uses `validateForPublish` (dry_run on `/api/projects/[id]/publish`). |

Note: `checkPublishReady` is guidance based on `SharedProjectState`; `validateForPublish` is the authoritative server check for final publish readiness.

## Shared Project State

All agents read from and write to a shared state object:

```typescript
interface SharedProjectState {
  // Extracted data
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

  // Generated content
  title?: string;
  suggestedTitle?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];

  // Images
  images: ProjectImageState[];
  heroImageId?: string;

  // State flags
  readyForImages: boolean;
  readyForContent: boolean;
  readyToPublish: boolean;

  // Clarification tracking
  needsClarification: string[];
  clarifiedFields: string[];
}
```

```typescript
interface ProjectImageState {
  id: string;
  url: string;
  imageType?: 'before' | 'after' | 'progress' | 'detail';
  altText?: string;
  displayOrder: number;
}
```

## Implementation Files

| File | Purpose |
|------|---------|
| `/src/lib/agents/types.ts` | Agent interfaces and SharedProjectState |
| `/src/lib/agents/story-extractor.ts` | Story extraction agent (wired via extractProjectData tool) |
| `/src/lib/agents/content-generator.ts` | Content generation agent (used via tool) |
| `/src/lib/agents/quality-checker.ts` | Quality validation agent (used via tool) |
| `/src/lib/agents/orchestrator.ts` | Account Manager orchestration (wired via chat tools) |
| `/src/app/api/chat/route.ts` | Tool-driven chat runtime (Account Manager persona + tool calls) |
| `/src/lib/chat/tool-schemas.ts` | Tool input/output schemas for extraction, generation, quality checks |

## Tool Wiring Notes

- `extractProjectData` builds state by merging session extracted data + tool args, then runs Story Extractor on the latest user message.
- `generatePortfolioContent` loads project data (including images + AI context) to build `SharedProjectState` before running Content Generator.
- `checkPublishReady` loads project data, runs Quality Checker, and returns optional warnings; final gating remains `validateForPublish`.
- Orchestrator actions (`prompt_images`, `request_clarification`) are not surfaced to the model; the prompt decides when to call `promptForImages` or `requestClarification`.

## Image Handling

Simplified image identification - just what's needed:
1. **Subject**: What the image shows
2. **Type**: before/after/progress/detail
3. **Alt text**: SEO-friendly accessibility text

See `/src/lib/ai/image-utils.ts`

## Conversation History & Tool Calls

The chat system persists the **full message history** including tool parts (tool calls + tool results). This enables:

- Accurate rehydration of chat artifacts on reload
- More reliable context loading and summarization
- Debugging of tool outputs over time

Key files:
- `/src/app/api/chat/sessions/[id]/messages/route.ts` stores `parts` in `chat_messages.metadata.parts`
- `/src/lib/chat/context-loader.ts` loads full messages or summary + recent, with a UI cap when `mode=ui`
- `/src/components/chat/ChatWizard.tsx` restores tool parts into the UI

## Testing Strategy

Each agent has focused, testable responsibilities:

```typescript
// Quality Checker tests
describe('QualityChecker', () => {
  it('returns ready when all requirements met', () => {
    const state = createCompleteState();
    expect(checkReadiness(state).ready).toBe(true);
  });

  it('identifies missing required fields', () => {
    const state = { ...createCompleteState(), title: undefined };
    expect(checkReadiness(state).missing).toContain('title');
  });
});
```
