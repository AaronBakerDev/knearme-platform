# Tool Call Budget and Decision Rules

This document defines how many tool calls the interviewer should make per turn, which tools are safe to call immediately, and when to defer or ask for permission. It keeps the experience fast, predictable, and conversational.

## Core Budget (per user message)

Default budget: **0-2 tool calls**

Allowed combinations:
- **1 call**: extractProjectData
- **2 calls**: extractProjectData + showPortfolioPreview

Occasional 3-call case (rare):
- extractProjectData + updateDescriptionBlocks + showPortfolioPreview

Hard limit (do not exceed): **3 tool calls** per user message

Why: The user should feel a natural conversation, not a machine firing actions after every line. Too many calls slow the UI and create cognitive noise.

## Tool Priority (in order)

1) **extractProjectData**
- Call after any user message that contains project info.
- This is the anchor for everything else.

2) **updateDescriptionBlocks**
- Only when a new detail improves the story structure (scope, constraint, outcome, highlight).
- Do not update on every minor detail.

3) **showPortfolioPreview**
- Use to show momentum after meaningful updates.
- Avoid calling after every message; use it when a section is ready or improved.

4) **suggestQuickActions**
- Use sparingly when the user might benefit from a shortcut.
- Avoid stacking with other tools unless the moment is critical.

## When to defer tool calls

Defer if:
- The user is mid-stream (multi-message explanation).
- The new detail is too small to change the draft.
- You already hit the 2-call budget on this turn.

Rule of thumb: If the user is still "telling the story," prefer one extraction call and save updates for the next beat.

## Permission-first actions

Always ask before:
- Updating contractor profile (services, service area, logo).
- Publishing or finalizing content.
- Making irreversible changes.

## Decision rules by phase

**Early interview (gathering)**
- extractProjectData is mandatory.
- showPortfolioPreview only after core story beats appear.
- updateDescriptionBlocks only when a story angle or outcome is clear.

**Mid interview (shaping)**
- Use updateDescriptionBlocks when you can turn specifics into blocks.
- One preview update after each major beat (scope, constraint, outcome).

**Drafting**
- If content is generated, summarize the draft in chat.
- Open editor panel with an action (openForm) rather than inline editing.

**Review**
- Prefer updateDescriptionBlocks or updateField when the user asks for edits.
- Use validateForPublish only when they ask about publish readiness.

## Signals to split into sub-agents

Consider a specialist only if:
- You need more than 3 tool calls per turn.
- The agent repeatedly misses updates or forgets constraints.
- You introduce high-risk tools (billing, scheduling, reviews, publishing).

## Example budgets

- "We rebuilt a chimney" -> extractProjectData (1 call)
- "We rebuilt a chimney, in Mt. Lebanon" -> extractProjectData + showPortfolioPreview (2 calls)
- "Finished in 2 days and homeowner was relieved" -> extractProjectData + updateDescriptionBlocks + showPortfolioPreview (3 calls)

## Non-goals

- Do not optimize for maximum automation.
- Do not fire tools just to show activity.
- Do not let tool usage slow the conversation.
