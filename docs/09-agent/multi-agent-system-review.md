# Multi-Agent System Review

> Status: Updated  
> Date: December 31, 2025  
> Owner: Engineering

Update (Dec 31, 2025):
- Documented that `extractProjectData` merges session extracted data + tool args, then re-extracts from the latest user message.
- Clarified that orchestrator actions are not surfaced; `promptForImages` / `requestClarification` remain prompt-driven.

Update (Dec 28, 2025):
- Story Extractor + Orchestrator are wired into `/api/chat` tool execution.
- `checkPublishReady` now aligns with publish requirements (city/state/slug).
- `validateForPublish` remains the authoritative server check for final publish gating.

## Executive Summary

The multi‑agent system is now wired end‑to‑end. Story extraction runs server‑side
via the Story Extractor + Orchestrator during `extractProjectData`, and content
generation / publish validation flow through the Orchestrator in the
`generatePortfolioContent` and `checkPublishReady` tools. Shared state now
includes `city`, `state`, and `projectTypeSlug`, aligning publish readiness with
the real publish endpoint. Orchestrator actions are still prompt-driven in the
chat runtime (no automatic `promptForImages` / `requestClarification` calls).

## What’s Actually Wired In

Runtime use today:
- `extractProjectData` tool → `StoryExtractor` (via Orchestrator gather phase, seeded by session extracted data + tool args)
- `generatePortfolioContent` tool → `ContentGenerator` (via Orchestrator generate phase)
- `checkPublishReady` tool → `QualityChecker` (via Orchestrator ready phase)
- `validateForPublish` tool → publish validation endpoint (`/api/projects/[id]/publish?dry_run=true`)
- `promptForImages` / `requestClarification` → model-driven tool calls (prompt guidance)
- `Orchestrator` coordinates state + readiness (actions not surfaced)

Relevant files:
- `src/app/api/chat/route.ts` (tool wiring)
- `src/lib/agents/story-extractor.ts`
- `src/lib/agents/orchestrator.ts`
- `src/lib/agents/content-generator.ts`
- `src/lib/agents/quality-checker.ts`

## Findings (Updated)

### 1) Multi-agent orchestration wired

Story extraction and orchestration now run server‑side during tool execution,
so the chat runtime is no longer single‑agent with helper tools.

### 2) Publish‑readiness alignment fixed

`SharedProjectState` includes `city`, `state`, and `projectTypeSlug`, and
`checkPublishReady` validates the same requirements as
`/api/projects/[id]/publish`.

### 3) Tool‑driven UX improvements

Tool outputs are now grounded in server‑side extraction + state alignment,
reducing the gap between conversation guidance and publish validation. Final
publish gating still routes through `validateForPublish` for server rules.

### 4) Orchestrator actions not surfaced

The orchestrator currently returns actions internally, but those are not wired
into the chat runtime. Image prompts and clarifications remain prompt-driven.

## Evaluation: Structure & Extensibility

Strengths:
- Clean separation of agent responsibilities in `/src/lib/agents`.
- Tool schemas are well‑typed and consistent.
- `SharedProjectState` is a solid abstraction for content generation.

Weaknesses:
- Orchestration still relies on tool calls; deeper multi‑agent planning could
  be added if needed.
- Orchestrator actions are not surfaced to tools, so clarifications and photo
  prompts depend entirely on the model following the prompt.

Overall: **Wired and aligned.** The architecture is now end‑to‑end functional,
with state aligned to publish requirements and orchestration integrated.

## Recommendations (Prioritized)

1) **Keep publish‑readiness checks in sync with API**
   - Continue to validate against `/api/projects/[id]/publish` as requirements evolve.
   - Use `validateForPublish` for final gating; `checkPublishReady` for coaching.

2) **Refine orchestration heuristics**
   - Add more nuanced review‑phase behaviors if needed (e.g., edit intents).

3) **Quick action suggestions**
   - Expand `suggestQuickActions` with richer agent context if needed.

## Suggested Next Doc Updates

- Keep `docs/09-agent/project-chat-unification.md` as UI unification history.
- Add this review as a separate doc (this file).
- Update `docs/09-agent/README.md` to link here.

## References

- `src/app/api/chat/route.ts`
- `src/lib/agents/story-extractor.ts`
- `src/lib/agents/orchestrator.ts`
- `src/lib/agents/quality-checker.ts`
- `src/app/api/projects/[id]/publish/route.ts`
