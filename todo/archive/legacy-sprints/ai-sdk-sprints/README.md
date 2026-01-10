# AI SDK Sprint Archive (Phases 1-10)

> **Status:** All 10 phases completed
> **Archived:** January 2, 2026

## Summary

These phases established the core chat-based portfolio creation experience using Vercel AI SDK 6, culminating in the Orchestrator + Subagents architecture.

## Phase Overview

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| 1 | Foundation | Artifact system, tool part states, voice-first UX |
| 2 | Image Integration | Inline upload, drag-drop, image gallery artifact |
| 3 | Live Preview | Real-time canvas, split-pane layout, completeness indicator |
| 4 | Content Editor | Inline editing, regeneration, fast-path publish |
| 5 | Polish | Progress tracker, milestone toasts, WCAG 2.1 AA baseline |
| 6 | Unified Edit Mode | Edit mode API, client-side tool dispatch, artifact actions |
| 7 | Persistence & Memory | IndexedDB recovery, save queue, auto-summarization |
| 8 | Agent Architecture | Tool step limit increase, clarification flow, Langfuse tracing |
| 9 | Philosophy Alignment | Chat-only onboarding, form wizard removal |
| 10 | Orchestrator + Subagents | Account Manager, Story/Design/Quality Agents, parallel execution |

## Key Architecture Established

### Tool Classification
- **FAST_TURN_TOOLS**: Auto-allowed, <500ms response
- **DEEP_CONTEXT_TOOLS**: Requires `toolChoice`, 1-5s AI generation

### Artifact System
- `ArtifactRenderer` dispatches tool outputs to UI components
- Tool part states: `input-streaming`, `output-available`, `output-error`
- Side-effect tools (e.g., `showPortfolioPreview`) trigger UI actions

### Session Model
- Project-first architecture: `/projects/[id]` unified workspace
- Create mode: get-or-create session by project
- Edit mode: fresh session per visit
- IndexedDB checkpoints for recovery

## What's Next

Active development continues with:
- See `todo/phase-11-business-rename.md` for Contractors → Businesses rename
- See `todo/phase-12-service-catalog-migration.md` for service catalog updates
- See `todo/sprint-agent-polish.md` for deferred Phase 10 polish items

## Reference Documents

- Agent Atlas skill: `.claude/skills/agent-atlas/`
- Philosophy docs: `docs/philosophy/`
- Implementation roadmap: `docs/ai-sdk/implementation-roadmap.md`
