# PRD: Concrete Slab / Patio Settling Diagnostic

> **Version:** 0.1
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Should Have (Outdoor living funnel)

---

## Overview

Deterministic diagnostic that helps homeowners understand why a slab/patio/sidewalk is sinking or uneven, and what the safest next step is.

---

## UX Requirements (Premium Bar)

- Complete in **<60 seconds**.
- **≤3 required inputs**; soil/history optional.
- Clear DIY vs pro guidance.

---

## Inputs

Required:
- Settlement amount (inches; rough estimate).
- Pattern/location (edge near house / edge away from house / center dip / random spots).
- Nearby water source (downspout splash / sprinkler / pooling water / none).

Optional (collapsed):
- Soil type guess (clay / sandy / unknown).
- Slab age (years).
- Visible crack pattern (none / hairline / wide / multiple).

---

## Logic

- Use pattern + water source to bucket likely cause:
  - sub‑base washout / poor drainage
  - soil shrink‑swell (clay)
  - root heave or voids
  - structural/foundation movement
- Apply severity tier based on settlement amount + crack pattern.
- Recommend next step:
  - monitor
  - improve drainage / regrade
  - mudjacking/foam lifting consult
  - full replacement / engineer evaluation

---

## Outputs

- Likely cause bucket + confidence.
- Severity tier and safety triggers.
- Conservative repair options ordered cheapest → safest.
- Cross‑links to Drainage Planner + Cost Estimator.

---

## Results UX

- Banner showing likely cause + severity.
- Step list of recommended actions.
- “When to call a pro now” card.

---

## Supporting Content Cluster (MVP)

- `/learn/concrete-patio-sinking` → diagnostic CTA.
- `/learn/mudjacking-vs-replacement` → diagnostic CTA.

---

## SEO Targets

- “concrete patio sinking”
- “why is my slab uneven”

---

## Technical Notes

- Route: `src/app/(public)/tools/concrete-slab-settling-diagnostic/page.tsx`.
- Rules in `src/lib/tools/concrete-slab-settling.ts`.

