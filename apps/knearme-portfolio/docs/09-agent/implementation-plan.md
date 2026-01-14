# Agent Implementation Plan (Consolidated)

Maintainer note: update this plan as you implement changes (mark phases in progress/completed and adjust scope if requirements change).

This is the single implementation plan for the interviewer + back office system. It consolidates prior plans and reviews into one actionable scope for the current requirements.

## Goals

- Deliver a conversational interviewer that feels like a personal marketing partner.
- Keep the flow non-blocking while continuously building the portfolio page.
- Make the system trade-agnostic and business-aware (company context drives questions and angles).
- Show the draft in chat, edit in the separate editor panel.

## Non-goals (for this phase)

- New AI provider or model changes.
- Full UI redesign of the preview canvas or editor.
- Multi-agent UI where the user sees multiple personas.

## Current state (summary)

- Chat runtime uses a unified system prompt with masonry-specific assumptions.
- Context loading uses summary + recent messages when needed, and project data is injected via the message list (summary system message).
- Draft generation works and now opens the editor panel, not inline chat editor.
- Interviewer behavior is documented but not yet wired into the runtime prompt or gating.

## Source docs to cherry-pick from

- interviewer-system-prompt.md (persona, interview rules, business profile injection)
- interviewer-example-conversations.md (tone, flow, recap pattern)
- interviewer-experience.md (principles, back office roles)
- role-contracts.md (authority, suggestion protocol)
- multi-agent-system-review.md (what is wired today)
- project-chat-unification.md (implemented; keep for reference only)

## Key decisions to confirm

- Tool-call budget: keep as guidance only, not a hard limit.
- Layout ownership: interviewer can update description blocks, or delegate to a layout composer later.
- Generation gates: allow draft without photos and without materials.
- Publish gates: keep city and state required at publish time only.
- AI SDK loop strategy: keep `streamText` + tool loop, or migrate to `ToolLoopAgent` in `/api/chat`.
- Tool scoping: enforce fast-turn tools via `activeTools` / `toolChoice` in interviewer loop.

## AI SDK integration notes (Vercel)

- Loop control: document and enforce `stopWhen` in `/api/chat` to prevent runaway tool loops.
- Tool streaming: ensure UI can handle partial tool parts; avoid duplicate preview updates.
- Tool scoping per step: interviewer loop should allow fast-turn tools only; deep-context tools
  should be invoked explicitly (layout composer, content generator).
- Provider options (Gemini 3): use `thinkingLevel` for deep-context tools and keep interviewer
  at low/none for quick turns; avoid `thinkingBudget` for Gemini 3.

## Implementation phases

### Phase 1 - Prompt and context injection

Status: Implemented

Scope:
- Replace the live prompt with the interviewer prompt (trade-agnostic, collaborative).
- Inject business profile into the prompt context.
- Use buildSystemPromptWithContext in /api/chat so prompt includes summary + project state + business profile.

Key files:
- src/lib/chat/chat-prompts.ts
- src/app/api/chat/route.ts
- src/lib/chat/context-shared.ts
- src/lib/chat/context-loader.ts

Acceptance:
- Interviewer tone matches examples (angle-first, recap, non-blocking).
- Business profile visibly influences follow-up questions and framing.

Status:
- Implemented. See maintainer note in this file and updates in:
  - src/lib/chat/chat-prompts.ts
  - src/lib/chat/context-shared.ts
  - src/app/api/chat/route.ts
  - docs/09-agent/interviewer-system-prompt.md
  - docs/09-agent/README.md

### Phase 2 - Gating and extraction behavior

Status: In progress

Scope:
- Relax ready_for_images criteria (no materials required, photos optional).
- Adjust completeness rules so drafts can be generated without photos.
- Keep city/state as publish-only requirements.
- Keep interviewer tools fast-turn only; layout/content decisions stay in deep-context agents.

Key files:
- src/lib/agents/story-extractor.ts
- src/components/chat/hooks/useCompleteness.ts
- src/lib/agents/quality-checker.ts

Acceptance:
- The agent can generate a draft with only problem + solution + location + one differentiator.
- The agent still suggests photos but never blocks progress.
- Interviewer does not call layout composition; it only invokes deep-context tools explicitly.

Wiring note:
- Completed tool scoping in `/api/chat` with fast-turn tools only by default and explicit deep-tool invocation.

### Phase 3 - Business profile update tooling

Status: Pending

Scope:
- Add updateContractorProfile tool with permission-first usage.
- Add contractor logo field and upload path.
- Expose logo in editor and business profile context.

Key files:
- src/lib/chat/tool-schemas.ts
- src/app/api/chat/route.ts
- src/app/api/contractors (new or extended route)
- supabase/migrations (logo field)
- src/components/edit/ (logo input in editor)

Acceptance:
- Agent can ask to add a service and update profile only after consent.
- Logo can be added to contractor profile and used on portfolio pages.

### Phase 4 - Content generation and layout

Status: In progress

Scope:
- Make content generator trade-agnostic and business-aware.
- Improve block composition rules to match story angles (scope, constraint, outcome).
- Add layout composer tool and route deep-context layout work through it.
- Define the tool contract (`composePortfolioLayout`) and map its output to `updateDescriptionBlocks`
  and optional `reorderImages`.

Key files:
- src/lib/agents/content-generator.ts
- src/lib/ai/prompts.ts
- src/lib/content/description-blocks.*
- src/lib/chat/tool-schemas.ts
- src/app/api/chat/route.ts
- src/components/chat/ChatWizard.tsx

Acceptance:
- Draft quality feels specific and aligned to the stated angle.
- Blocks are updated only when they meaningfully improve the story.
- Layout decisions (blocks + image order) are generated only by the layout composer tool.

Wiring note:
- Added the layout composer tool + agent wiring; Chat UI now applies blocks and optional image ordering.

### Phase 5 - UX polish and alignment

Status: Pending

Scope:
- Ensure draft recap and confirmation flow matches examples.
- Ensure editor panel is the only place for editing.
- Keep preview updates calm and meaningful (no spam).

Key files:
- src/lib/chat/chat-prompts.ts
- src/components/chat/ChatWizard.tsx
- src/components/chat/artifacts/GeneratedContentCard.tsx

Acceptance:
- Conversation feels like a collaborative interview, not a wizard.
- Draft appears in chat, editing happens in the panel, and the preview updates in rhythm.

## Risks and mitigations

- Overfitting to one trade: mitigate by removing masonry assumptions and using business profile context.
- Too many tool calls: add dedupe and preview throttling rather than hard limits.
- Incomplete business context: fall back to generic prompts and ask for missing profile info.

## Testing and validation

- Manual: create new project, run interview, generate draft without photos, edit in panel.
- Manual: update services via chat with permission.
- Manual: publish check uses validateForPublish.
- Automated: lint and any existing agent tests.

## Open questions

- Where should logo live in the contractor schema and UI?
- Should layout composition be handled by the interviewer or a composer tool?
- Do we want a dedicated business profile editor in chat or settings?

## Done when

- Live runtime uses the interviewer prompt + business profile context.
- Drafts can be created without photos or materials.
- Contractor profile updates are permissioned and tool-driven.
- Editor panel is the only editing surface.
- The interview feels like a human marketer in every key flow.
