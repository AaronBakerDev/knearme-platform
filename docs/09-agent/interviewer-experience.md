# Interviewer Experience & Back Office Architecture

This document captures the intended experience for the interviewing agent and the supporting "back office" agents/tools. It is a living spec we will update as the system evolves.

## North Star

The agent should feel like a teammate who:
- interviews naturally (curious, short questions, one at a time),
- keeps the conversation moving without blocking,
- quietly builds the portfolio page in real time,
- and advocates for the contractor's business (best light, best outcome).

## Experience Principles

1) Interviewer tone over form-filling
- Ask one short question at a time.
- React to what the contractor says before steering.
- Avoid "we can't yet" language; use "we'll circle back."

2) Business-aware, trade-agnostic
- Use business context (services, location, brand) to decide what matters.
- Do not assume materials or trade-specific details unless they are relevant.
- When a project type is outside known services, ask to add it.

3) Continuous preview (magic)
- After each meaningful detail, update the live portfolio preview.
- The contractor should see the page assembling as they talk.

4) Soft guidance, never gating
- Suggest photos early but allow generation with none.
- Keep city/state as a priority ask for service area and SEO URLs.
- Nudge for missing brand assets (logo) once, at a natural moment.

5) Free-form case study
- The portfolio page should be block-based and flexible.
- Let the agent shape layout using description blocks as data accrues.

## Back Office Architecture (Concept)

The interviewing agent should not do everything itself. It should hand context to specialized helpers that recommend tool calls:

- Interviewer (Account Manager persona)
  - Owns the conversation tone and flow.
  - Decides which question to ask next.
  - Receives suggestions from back office.

- Story Extractor
  - Extracts project details from each contractor message.
  - Updates extracted data and preview.

- Business Profile Steward
  - Watches for service gaps (e.g., tuckpointing not in services).
  - Suggests profile updates (services, service areas, logo).
  - Asks permission before applying changes.

- Portfolio Composer
  - Proposes description blocks and layout based on collected details.
  - Keeps draft in sync with conversation.

- Quality Advisor (non-blocking)
  - Flags missing details that would improve the final story.
  - Provides "optional improvements" without stopping progress.

The Interviewer chooses which suggestions to act on and uses tools to make updates.

## Tools & Capabilities (Current + Needed)

Current tools support:
- Extract project data.
- Update project fields and description blocks.
- Reorder images.
- Generate and refine content.

Needed additions:
- Update contractor profile (services, service areas, logo).
- Suggest missing brand assets once (non-blocking).

## Behavior Examples

- Services gap
  - "Nice — I didn't know you do tuckpointing. Want me to add that to your services?"
  - If yes, update contractor profile.

- Service area
  - "What service area should we show for this one? City and state are perfect."

- Missing logo (optional nudge)
  - "If you have a logo, we can add it to the profile to make the page feel more official."

## Open Questions

- Where should contractor logo live (new field vs reuse profile_photo_url)?
- How should "business context" be injected into the system prompt?
- When should the agent switch from "interviewing" to "composing" blocks?
- What is the minimal info required to generate a useful draft?

## Implementation Status

### Trade-Agnostic Architecture ✅
The story extractor (`src/lib/agents/story-extractor.ts`) now uses the trade config system:
- Project types derived from `TradeConfig.terminology.projectTypes`
- Materials vocabulary from `TradeConfig.terminology.materials`
- Techniques vocabulary from `TradeConfig.terminology.techniques`
- System prompt built dynamically using `buildTradeContext(config)`
- Deduplication helpers use trade-aware vocabulary

To add a new trade:
1. Create a new config in `src/lib/trades/config.ts`
2. Update `getTradeConfig()` to return the appropriate config (e.g., based on contractor trade)
3. All extraction and prompts automatically adapt

### Current Trade: Masonry
The `MASONRY_CONFIG` in `src/lib/trades/config.ts` defines the current vocabulary.

## Next Steps

- ~~Update system prompts to reflect interviewer principles and trade-agnostic logic.~~ ✅ Done
- Relax generation gates (allow no photos; keep city/state priority).
- Add contractor logo field and profile update tool.
- Add back office recommendations (services, service areas, brand assets).
- Add additional trades (plumbing, roofing, etc.) when ready to expand.
