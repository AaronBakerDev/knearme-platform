# PRD: Retaining Wall Planner

> **Version:** 0.1
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Could Have (Expand Beyond Masonry)

---

## Overview

Planner that computes block counts, base/backfill materials, drainage needs, and safety thresholds for retaining walls.

---

## UX Requirements (Premium Bar)

- Complete plan in **<75 seconds**.
- **≤5 required inputs**; soil + drainage advanced.
- Show units clearly and allow ft/in toggles.
- Instant materials list.

---

## Inputs

- Wall length (ft)
- Wall height (ft)
- Block type (segmental / stone / concrete)
- Soil type (clay / loam / sand)
- Slope/tiering (yes/no)
- Drainage option (none / gravel / perforated pipe)

---

## Logic

- Block count by type and wall dimensions.
- Base gravel volume based on standard footing depth.
- Backfill volume.
- Drainage pipe length.
- Safety warnings when height > local DIY threshold (default 3–4 ft).

---

## Outputs

- Materials list (blocks, gravel, pipe).
- DIY difficulty tier.
- “Engineer required?” warning if above threshold.

---

## Results UX

- Materials list grouped by category (blocks, base, drainage).
- Safety warnings pinned at top of results.

---

## Supporting Content Cluster (MVP)

- `/learn/retaining-wall-materials-calculator-guide` → planner CTA.
- `/learn/retaining-wall-height-requirements` → planner CTA.
- `/learn/retaining-wall-drainage-guide` → planner CTA.

---

## SEO Targets

- “retaining wall calculator”
- “how many blocks for retaining wall”

---

## Technical Notes

- Route: `src/app/(public)/tools/retaining-wall-planner/page.tsx`.
- Constants in `src/lib/tools/retaining-wall.ts`.
