# PRD: Tuckpointing Material + Labor Calculator

> **Version:** 0.1
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Could Have (Objective Calculator)

---

## Overview

Objective calculator for estimating mortar volume, bag count, and labor time needed for tuckpointing/repointing. Designed for DIY planning and bid scoping.

---

## UX Requirements (Premium Bar)

- Complete calculation in **<60 seconds**.
- **≤4 required inputs**; advanced options (openings, waste) collapsed.
- Show inline example values (“e.g., 20 ft wall length”).
- Results update instantly as inputs change.

---

## Inputs

- Wall length (ft)
- Wall height (ft)
- Joint depth to remove (in)
- % of joints deteriorated (0–100%)
- Brick type (standard / historic / stone veneer)

---

## Logic

1. Compute wall area: `A = length × height`.
2. Convert to linear ft of joints using brick type constants.
3. Apply deterioration percent.
4. Estimate mortar volume using joint depth + standard joint width.
5. Add waste factor (10–15%).
6. Convert volume → bags needed.
7. Estimate labor hours using productivity constants.

---

## Outputs

- Linear ft of joints to repoint.
- Mortar volume (cu ft) + bag count.
- DIY material cost range.
- Typical pro labor time range.

---

## Results UX

- Materials summary in a “shopping list” card.
- Labor time + cost ranges in secondary cards.
- Provide copy/print buttons.

---

## Supporting Content Cluster (MVP)

- `/learn/how-to-measure-wall-area-for-tuckpointing` → calculator CTA.
- `/learn/tuckpointing-vs-brick-replacement` → calculator CTA.
- `/learn/can-you-diy-tuckpointing` → calculator CTA.

---

## SEO Targets

- “tuckpointing calculator”
- “how much mortar for repointing”

---

## Technical Notes

- Route: `src/app/(marketing)/tools/tuckpointing-calculator/page.tsx`.
- Constants in `src/lib/tools/tuckpointing.ts`.
