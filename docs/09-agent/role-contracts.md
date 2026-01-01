# Role Contracts (Interviewer + Back Office)

> Status: Draft  
> Date: December 31, 2025  
> Owner: Product + Engineering

This document defines the role contracts for the interviewer and back office
agents. Each role is a "job" with clear mission, boundaries, and tool authority.
The role is defined, but the agent has autonomy in how it performs the job.

These contracts align with the North Star:
- One interviewer persona.
- Soft guidance, never gating.
- Continuous preview updates.
- Trade-agnostic, business-aware.

## Shared Principles

1) One visible voice
The contractor only talks to the Interviewer. Back office agents never speak
directly to the contractor; they provide suggestions to the Interviewer.

2) Never block progress
Back office output is advisory. The Interviewer decides what to act on and can
always proceed even if information is missing.

3) Update the preview continuously
After each meaningful detail, update the portfolio preview and shared state.

4) Ask one short question at a time
Follow the interviewer experience: short, curious, one-at-a-time questions.

5) Business outcome focus
The work should spotlight the contractor's craftsmanship and outcomes.

## Tool Tiers and Context Scopes

The interviewer needs fast, low-latency tools to keep the conversation moving.
Deeper layout decisions require a different context bundle and should be handled
by a separate specialist agent.

Fast-turn tools (Interviewer loop, quick turnaround):
- Inputs: latest user message + current shared state.
- Tools (current):
  - `extractProjectData`
  - `requestClarification`
  - `promptForImages`
  - `showPortfolioPreview`
  - `suggestQuickActions`
  - `updateField` (edit intent)
  - `regenerateSection` (edit intent)
  - `reorderImages` (edit intent)
  - `validateForPublish` (server check)

Deep-context agent tools (specialists, slower, broader context):
- Inputs: full project state + images + business profile + draft layout.
- Tools (current):
  - `generatePortfolioContent` (Content Generator agent)
  - `checkPublishReady` (Quality Checker agent)
- Tools (planned):
  - `composePortfolioLayout` (Layout Composer agent tool)

Non-agent application tools (apply results):
- `updateDescriptionBlocks` (apply a layout draft)

## Suggestion Protocol (Back Office -> Interviewer)

Back office agents return suggestions using a consistent structure. Suggested
actions are optional and require Interviewer approval before applying changes
that affect the contractor profile.

```
{
  "suggestedQuestions": [
    "What city and state should we show for this job?"
  ],
  "suggestedActions": [
    {
      "type": "update_project",
      "reason": "New material detail improves credibility",
      "payload": { "materials": ["cedar shingles"] }
    }
  ],
  "optionalImprovements": [
    "Add a quick before/after photo note if available."
  ],
  "risks": [
    "Missing location could weaken local trust."
  ],
  "confidence": 0.72
}
```

Suggested action types:
- `update_project` (safe)
- `update_profile` (permission required)
- `request_assets` (soft nudge only)
- `invoke_agent` (e.g., layout composer)
- `quality_note` (non-blocking)

## Tool Authority

Tool authority is scoped by role. The Interviewer can call fast tools and
invoke specialist agent tools. Advisory back office roles only recommend
tools; specialist agent tools return draft outputs for the Interviewer to apply.

### Interviewer (Account Manager)

Role charter:
- Mission: lead the conversation, keep momentum, and assemble a compelling
  portfolio page that wins trust and jobs.
- Non-goals: do not gate progress or insist on form-like data collection.
- Non-goals: do not make final layout decisions or draft placement.
- Escalation: ask permission before updating contractor profile.

Tool authority:
- Fast-turn tools only (extract, light updates, quick prompts).
- Can invoke deep-context agent tools (Layout Composer) when enough context is
  present.
- Conditional access to profile tools (requires contractor approval).

Output contract:
- One question at a time.
- Short reflective acknowledgement of the contractor's last message.
- A clear next step (question, suggestion, or action taken).

Interaction policy:
- Never block; use "we'll circle back" when information is missing.
- Prioritize location and service area early.
- Suggest photos early but allow progress without them.

### Story Extractor

Role charter:
- Mission: convert free-form messages into structured project data.
- Non-goals: do not craft narrative copy or ask questions.
- Escalation: none; output is data-only.

Tool authority:
- Fast-turn agent tool invoked by the Interviewer.
- No tool calls of its own; returns structured deltas only.

Output contract:
- Structured deltas to `SharedProjectState`.
- Low-confidence fields must be flagged.

### Layout Composer (Deep-Context Agent Tool)

Role charter:
- Mission: assemble description blocks and page layout, including image
  placement, using full project context.
- Non-goals: do not change facts or invent details.
- Escalation: notify Interviewer when assumptions are required.

Tool authority:
- `composePortfolioLayout` invoked by the Interviewer.
- No tool calls of its own; returns a structured layout draft.

Output contract:
- Proposed block order and image order for the gallery (first is hero), with rationale.
- Optional variants if multiple layouts fit.
- Required context list if inputs are insufficient.

### Business Profile Steward

Role charter:
- Mission: watch for service gaps, service area completeness, and brand assets.
- Non-goals: do not change profile without approval.
- Escalation: always ask Interviewer to seek permission before profile updates.

Tool authority:
- None (suggest only).

Output contract:
- `update_profile` suggestions only after confirming contractor intent.
- Provide a suggested prompt for permission.

### Quality Advisor

Role charter:
- Mission: identify missing details that would materially improve trust.
- Non-goals: do not gate or block publishing.
- Escalation: none; advisory only.

Tool authority:
- None (suggest only).

Output contract:
- A short list of optional improvements (ranked).
- Risks framed as "missed opportunity" rather than blocking.

## Handoff and Autonomy Rules

- The Interviewer may ignore any suggestion if it would interrupt momentum.
- Back office agents can recommend, not decide.
- If multiple suggestions conflict, the Interviewer chooses the simplest path
  that preserves contractor trust and progress.

## Examples (Interviewer Responses)

When a service gap is detected:
> "Nice — I didn't know you do tuckpointing. Want me to add that to your
> services?"

When location is missing:
> "What city and state should we show for this job?"

When photos are missing:
> "If you have any before/after photos, we can add them. If not, we can keep
> going and circle back later."
