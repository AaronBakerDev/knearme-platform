# AI SDK Implementation Plan — Central Index

> Single reference point for the AI SDK build plan, phase files, and specs.
> Last Updated: December 26, 2025

---

## Purpose

This document anchors the phased implementation of the AI SDK experience (artifacts + live preview + edit mode). It links the specs, roadmap, and phase task files so execution stays aligned.

---

## Phase Map (Source of Truth: `implementation-roadmap.md`)

| Phase | Focus | Task File |
|------:|-------|-----------|
| 1 | Foundation + SDK alignment | `todo/ai-sdk-phase-1-foundation.md` |
| 2 | Image Integration | `todo/ai-sdk-phase-2-image-integration.md` |
| 3 | Live Preview | `todo/ai-sdk-phase-3-live-preview.md` |
| 4 | Content Editor | `todo/ai-sdk-phase-4-content-editor.md` |
| 5 | Polish | `todo/ai-sdk-phase-5-polish.md` |
| 6 | Unified Edit Mode | `todo/ai-sdk-phase-6-edit-mode.md` |
| 7 | Persistence & Memory | `todo/ai-sdk-phase-7-persistence-memory.md` |
| 8 | Agent Architecture + Observability | `todo/ai-sdk-phase-8-agent-architecture.md` |

---

## Core Specs & References

- **Implementation Roadmap:** `docs/ai-sdk/implementation-roadmap.md`
- **Chat UX Patterns:** `docs/ai-sdk/chat-ux-patterns.md`
- **Chat Artifacts Spec:** `docs/ai-sdk/chat-artifacts-spec.md`
- **Observability Spec:** `docs/ai-sdk/observability-spec.md`
- **AI SDK Reference:** `docs/ai-sdk/vercel-ai-sdk-reference.md`
- **Provider ADR:** `docs/05-decisions/adr/ADR-003-openai.md`
- **Product Vision:** `docs/01-vision/vision.md`

---

## Research Findings & Plan Adjustments (Dec 26, 2025)

1. **Tool part states** — AI SDK v6 emits tool parts with `input-streaming`, `input-available`, `output-available`, `output-error`, and approval states. Artifact rendering must handle all states to avoid missing UI updates.
2. **RSC usage** — `@ai-sdk/rsc` remains experimental. If we use generative UI, explicitly add the dependency and treat it as optional/flagged in production.
3. **Model IDs** — Gemini 3 exists but is preview in the Gemini API. Use `gemini-3-flash-preview` (Gemini API) or `google/gemini-3-flash` (AI Gateway) and keep a stable fallback (e.g., `gemini-2.5-flash`). Align ADR + reference docs + code.
4. **Transcription** — `experimental_transcribe` is still experimental. Add client/server limits, retries, and explicit error UI for low-connectivity field use.
5. **Voice-first gap** — The AI SDK plan lacked an explicit voice interview flow despite being MVP-critical. Added tasks in Phase 1 to align with product goals.
6. **Speed-to-publish** — Add a fast path (“Accept & Publish”) to hit <3 minute goal for contractors who skip editing.
7. **Instrumentation** — Observability spec exists, but KPI instrumentation (time-to-publish, interview completion, regeneration usage) must be added in Phase 8.

---

## Execution Notes

- Use `todo/README.md` as the active phase pointer.
- Any new tooling decisions (model swaps, provider changes) must update **ADR-003**, the **AI SDK Reference**, and the phase task files.
- Keep changes reversible per-phase (feature flags if needed).
