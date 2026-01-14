# PRD: Brick Replacement Count + Budget Tool

> **Version:** 0.1
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Could Have

---

## Overview

Calculator that turns damaged area into brick count, waste factor, and a planning budget.

---

## UX Requirements (Premium Bar)

- Complete estimate in **<60 seconds**.
- **≤4 required inputs**; brick size + matching difficulty can default.
- Show a visual “brick size picker” (Phase 1.5).
- Instant results.

---

## Inputs

- Damaged area (sq ft) **or** estimated brick count
- Brick size (modular / queen / custom)
- Matching difficulty (easy / medium / historic)
- Access (ground / ladder / scaffold)

---

## Logic

- Convert sq ft → bricks using size table.
- Apply waste factor (10–15%).
- Budget range using national per‑brick + labor bands.
- Apply access + matching multipliers.

---

## Outputs

- Bricks needed + waste count.
- Material cost range.
- Labor cost range.
- When a pro is required.

---

## Results UX

- Brick count + waste shown as a single number with breakdown.
- Budget range in secondary cards.
- “Next steps” section linking to cost estimator.

---

## Supporting Content Cluster (MVP)

- `/learn/how-to-calculate-brick-count` → calculator CTA.
- `/learn/brick-repair-cost` → calculator CTA.
- `/learn/brick-repair-vs-rebuild` → calculator CTA.

---

## SEO Targets

- “brick replacement calculator”
- “how many bricks do I need”

---

## Technical Notes

- Route: `src/app/(marketing)/tools/brick-replacement-calculator/page.tsx`.
- Constants in `src/lib/tools/brick-replacement.ts`.
