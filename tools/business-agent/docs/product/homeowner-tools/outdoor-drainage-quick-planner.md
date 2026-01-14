# PRD: Outdoor Drainage Quick Planner

> **Version:** 0.1
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Could Have (Waterproofing retention)

---

## Overview

Simple deterministic planner that tells homeowners how to route downspouts and grade soil away from masonry/foundations to reduce moisture risk.

---

## UX Requirements (Premium Bar)

- Complete in **<60 seconds**.
- **≤3 required inputs**; roof/soil extras optional.
- Output a small, actionable drainage plan.

---

## Inputs

Required:
- Distance from downspout discharge to foundation (ft).
- Yard slope near foundation (slopes toward / flat / slopes away).
- Soil absorption (fast / average / slow).

Optional (collapsed):
- Roof size / number of downspouts (rough).
- Known low spots/pooling (yes/no).
- Basement moisture history (yes/no).

---

## Logic

- Recommend minimum extension length based on distance + slope (baseline 6–10 ft).
- Target grading rule: 5% slope away for first 10 ft if possible.
- If slow soil + pooling → suggest swale/French drain consult.
- If slopes toward + moisture history → high‑priority drainage fix.

---

## Outputs

- Recommended downspout extension length.
- Grading target + simple steps.
- DIY difficulty tier + pro triggers.
- Cross‑link to Basement Leak Triage + Waterproofing Checklist.

---

## Results UX

- Compact “your drainage plan” card.
- Checklist with simple measurements.

---

## Supporting Content Cluster (MVP)

- `/learn/downspout-extension-length` → planner CTA.
- `/learn/foundation-grading-slope` → planner CTA.

---

## SEO Targets

- “downspout extension length”
- “grading away from foundation”

---

## Technical Notes

- Route: `src/app/(marketing)/tools/outdoor-drainage-quick-planner/page.tsx`.
- Rules in `src/lib/tools/outdoor-drainage.ts`.

