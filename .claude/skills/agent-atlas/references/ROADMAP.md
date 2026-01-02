# Agent System Roadmap

> Tracks implementation progress and links to detailed planning docs.

## Source of Truth

The authoritative implementation plan lives at:
**`docs/09-agent/implementation-plan.md`**

This file summarizes status and provides quick context for development sessions.

---

## Current Phase Summary

| Phase | Name | Status | Key Files |
|-------|------|--------|-----------|
| 1 | Prompt & Context Injection | ✅ Complete | chat-prompts.ts, context-shared.ts |
| 2 | Gating & Extraction Behavior | 🔄 In Progress | story-extractor.ts, useCompleteness.ts |
| 3 | Business Profile Update Tooling | ⏳ Pending | tool-schemas.ts, contractors API |
| 4 | Content Generation & Layout | 🔄 In Progress | content-generator.ts, layout-composer.ts |
| 5 | UX Polish & Alignment | ⏳ Pending | ChatWizard.tsx, GeneratedContentCard.tsx |

---

## Recent Changes (2025-01)

### Completed
- `checkPublishReady` moved to FAST_TURN_TOOLS (no longer needs explicit toolChoice)
- city/state added to updateFieldSchema for location updates
- ThinkingBlock component for collapsed AI reasoning
- stripToolMarkers() cleans raw tool text from chat
- Layout Composer tool wired (`composePortfolioLayout`)
- Tool scoping in /api/chat (fast-turn by default, deep-context explicit)

### In Progress
- Relaxing ready_for_images criteria (no materials required)
- Trade-agnostic content generation
- Business profile context injection

### Upcoming
- updateContractorProfile tool
- Contractor logo field + upload
- Draft recap confirmation flow
- Preview update throttling

---

## Design Decisions Log

| Decision | Outcome | Reference |
|----------|---------|-----------|
| Tool-call budget | Guidance only, not hard limit | tool-call-budget.md |
| Publish gates | city/state required at publish only | implementation-plan.md |
| Draft without photos | Allowed (photos optional) | Phase 2 |
| Layout ownership | Layout Composer tool | Phase 4 |
| AI SDK loop | streamText + tool loop | implementation-plan.md |

---

## Related Documentation

### Architecture & Design
- [`docs/09-agent/README.md`](../../../docs/09-agent/README.md) - Main system overview
- [`docs/09-agent/multi-agent-architecture.md`](../../../docs/09-agent/multi-agent-architecture.md) - Agent design
- [`docs/09-agent/project-chat-unification.md`](../../../docs/09-agent/project-chat-unification.md) - Session model

### Interviewer Experience
- [`docs/09-agent/interviewer-experience.md`](../../../docs/09-agent/interviewer-experience.md) - Experience principles
- [`docs/09-agent/interviewer-system-prompt.md`](../../../docs/09-agent/interviewer-system-prompt.md) - Persona prompt
- [`docs/09-agent/interviewer-example-conversations.md`](../../../docs/09-agent/interviewer-example-conversations.md) - Example flows
- [`docs/09-agent/role-contracts.md`](../../../docs/09-agent/role-contracts.md) - Authority rules

### Implementation Details
- [`docs/09-agent/tool-call-budget.md`](../../../docs/09-agent/tool-call-budget.md) - Budget guidance
- [`docs/09-agent/voice-modes-implementation.md`](../../../docs/09-agent/voice-modes-implementation.md) - Voice features

---

## Legacy/Deprecated Items

These items in `docs/09-agent/` are **implemented or superseded**:

| File | Status | Notes |
|------|--------|-------|
| `project-chat-unification.md` | ✅ Implemented | Single session per project done |
| `multi-agent-system-review.md` | ✅ Addressed | Tool wiring complete |

---

## Updating This Roadmap

When completing work:

1. Update phase status in table above
2. Move items from "In Progress" to "Completed"
3. Add date to Recent Changes section
4. Update `implementation-plan.md` as authoritative source
5. Add entry to CHANGE-LOG.md for significant changes

---

*Last updated: 2025-01-01*
*See [implementation-plan.md](../../../docs/09-agent/implementation-plan.md) for detailed scope*
