# PRD: Paver Base + Materials Calculator (Brick/Stone Patio & Walkway)

> **Version:** 0.1
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Should Have (Traffic Spear)

---

## Overview

A deterministic calculator for homeowners planning a brick/stone paver patio, walkway, or driveway. It outputs excavation depth, gravel base volume, bedding sand volume, and an optional paver count. Designed to be the fastest, cleanest “materials list” tool in the category.

---

## Goals

1. Rank for “paver base calculator / how much gravel under pavers” queries.
2. Provide an accurate, easy materials list homeowners can order from.
3. Funnel into patio/paver service pages (future) and related learn content.

### Non‑Goals (MVP)

- Structural soil bearing calculations.
- Curved/stepped layouts beyond a simple area input.
- AI recommendations.

---

## UX Requirements (Premium Bar)

- Complete in **<60 seconds**.
- **Area input first**, advanced options collapsed by default.
- Mobile‑first, thumb‑reachable CTAs.
- Results update instantly.
- Show “what to buy” summary at top of results.

---

## SEO Targets

- “paver base calculator”
- “paver gravel amount”
- “patio base depth”
- “how much sand for pavers”

---

## Inputs

### Required

1. **Project type**
   - Walkway / patio (pedestrian)
   - Driveway / heavy load

2. **Area**
   - Rectangle: length × width
   - Or “enter total sq ft” toggle

3. **Paver thickness**
   - 1.75 in (standard brick paver)
   - 2.5 in (thick / driveway rated)
   - Custom

### Optional

4. **Soil type**
   - Well‑draining / sandy
   - Average
   - Clay / poor drainage

5. **Freeze‑thaw climate?** yes/no

6. **Waste/overage %** default 10%.

---

## Logic (Deterministic v1)

### Base depth rules

- **Walkway/patio:** 4–6 in compacted gravel base + ~1 in bedding sand.
- **Driveway/heavy load:** 6–8+ in compacted gravel base + ~1 in bedding sand.

Modifiers:

- Clay soil or freeze‑thaw → add +2 in gravel depth.
- Thin pavers (<2 in) → add +1 in gravel depth.

### Formulas

- `areaSqFt = length × width`.
- `gravelCuYd = areaSqFt × (gravelDepthIn / 12) / 27`.
- `sandCuYd = areaSqFt × (sandDepthIn / 12) / 27`.
- Optional paver count: `paversNeeded = areaSqFt / paverSqFt × (1 + waste%)`.

---

## Outputs

1. **Excavation depth** (gravel + sand + paver thickness).
2. **Gravel base needed** (cu yd + cu ft).
3. **Bedding sand needed** (cu yd + cu ft).
4. **Optional paver count** with waste.
5. **Quick tips** (edge restraint, compaction passes, slope for drainage).

---

## Results UX

- “Shopping list” card first.
- Breakdown sections for excavation + installation tips.
- Copy/print buttons (Phase 2).

---

## Disclaimers (required)

> “This calculator uses standard residential paver rules of thumb. Always confirm depths with your local supplier and code requirements.”

---

## CTAs

- “Read the full install guide” → `/learn/how-to-build-a-paver-base`.
- “Plan another masonry repair” → `/tools` hub.

---

## Success Metrics

- Organic entrances.
- Completion rate (>60%).
- Share/print clicks (Phase 2).

---

## Technical Notes

- Route: `src/app/(public)/tools/paver-base-calculator/page.tsx`.
- Logic in `src/lib/tools/paver-base.ts`.
- No DB required.

---

## Supporting Content Cluster (MVP)

- `/learn/how-to-build-a-paver-base` — full tutorial → tool CTA.
- `/learn/paver-base-depth-by-climate` — depth rationale → tool CTA.
- `/learn/paver-patio-cost-guide` — cost intent → tool CTA.

