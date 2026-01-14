# PRD: Basement Leak Source Triage + Fix‑Order Tool

> **Version:** 0.1
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Should Have (Waterproofing funnel)

---

## Overview

Fast homeowner triage tool that helps identify the most likely source of basement moisture/leaks and outputs a conservative fix order (drainage → cracks/mortar → waterproofing).

---

## UX Requirements (Premium Bar)

- Complete plan in **<60 seconds**.
- **≤3 required inputs**; detailed drainage/history optional.
- Plain‑English outputs with strong safety triggers.

---

## Inputs

Required:
- Where water appears (floor joint / wall mid‑height / wall‑floor corner / window well / near chimney).
- Does it happen mainly after rain/snowmelt? (yes / no / not sure).
- Visible masonry symptoms (none / efflorescence / cracks / crumbling mortar).

Optional (collapsed):
- Gutters/downspouts condition (good / overflowing / not sure).
- Grading/drainage near house (slopes away / flat / slopes toward).
- Sump/French drain present (yes / no).
- Age of home (years).

---

## Logic

- Rule matrix maps location + rain‑linked behavior to likely source bucket:
  - surface runoff / downspouts
  - wall cracks/mortar gaps
  - window well/penetrations
  - hydrostatic pressure / high water table
  - chimney/roofline path
- Apply risk multiplier for freeze‑thaw climates and older homes.
- Output ordered “do first” list:
  1. fix drainage and downspouts
  2. repair cracks/mortar/penetrations
  3. only then consider sealing or interior waterproofing
- Trigger “call a pro now” if active leak, widening cracks, mold, or standing water.

---

## Outputs

- Likely source (with confidence tier).
- Fix‑order checklist.
- Urgency/risk tier and pro triggers.
- Cross‑links to Waterproofing Checklist + Foundation Crack Checker.

---

## Results UX

- Top banner: risk tier + “most likely source”.
- Step list for fix order with brief reasoning.
- Print/save friendly.

---

## Supporting Content Cluster (MVP)

- `/learn/basement-leak-after-rain` → triage CTA.
- `/learn/how-to-route-downspouts` → triage CTA.
- `/learn/basement-hydrostatic-pressure` → triage CTA.

---

## SEO Targets

- “basement leak after rain”
- “water in basement where is it coming from”

---

## Technical Notes

- Route: `src/app/(public)/tools/basement-leak-triage/page.tsx`.
- Rules in `src/lib/tools/basement-leak-triage.ts`.

