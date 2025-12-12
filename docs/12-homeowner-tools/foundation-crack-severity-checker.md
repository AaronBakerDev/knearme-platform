# PRD: Foundation Crack Severity Checker

> **Version:** 0.1
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Should Have (Trust + Traffic Spear)

---

## Overview

A fast, rules‑based triage tool that helps homeowners understand whether a foundation crack is likely cosmetic, monitor‑worthy, or needs prompt professional inspection. The tool avoids engineering claims and is explicitly **planning / safety guidance only**.

---

## Goals

1. Rank for high‑intent “is my foundation crack serious?” queries.
2. Provide a clear, defensible severity tier with transparent reasoning.
3. Funnel users into foundation repair guides, local service pages, and the cost estimator.

### Non‑Goals (MVP)

- Structural engineering diagnosis.
- Guaranteeing safety or exact repair scope.
- AI/ML scoring.

---

## UX Requirements (Premium Bar)

- Complete assessment in **<60 seconds**.
- **≤6 required inputs**, all multiple‑choice / checkboxes.
- One‑screen desktop layout; short scroll on mobile.
- Immediate results update (no submit button).
- Result tier shown first, then “why,” then next steps.
- Clear “call a pro now” language only for high‑tier cases.

---

## SEO Targets

Primary:

- “foundation crack serious”
- “horizontal foundation crack”
- “stair step crack foundation”
- “foundation crack width meaning”

Secondary:

- “vertical foundation crack repair”
- “diagonal crack in basement wall”
- “foundation crack leaking water”

---

## User Flow

1. User lands on `/tools/foundation-crack-severity-checker`.
2. Selects crack type + width + symptoms.
3. Tool assigns severity tier + shows why.
4. User clicks into “learn more” or cost estimator.

---

## Inputs

### Required

1. **Foundation material**
   - Poured concrete
   - Concrete block / brick
   - Stone / other

2. **Crack orientation**
   - Vertical
   - Diagonal
   - Horizontal
   - Stair‑step / stepped

3. **Approximate crack width (widest point)**
   - Hairline / < 1⁄8 in
   - 1⁄8 – 1⁄4 in
   - > 1⁄4 in

4. **Water intrusion present?**
   - No
   - Dampness only
   - Active leak during rain / melt

### Optional (adds confidence)

5. **Movement or displacement?**
   - None
   - Crack edges offset / wall bulging

6. **Related home symptoms** (checkboxes)
   - Doors/windows sticking
   - Sloping floors
   - Recent crack growth (last 6–12 months)

---

## Scoring Logic (Deterministic v1)

### Hard‑rule triggers

Any of these immediately set **High Severity**:

- Horizontal crack **with width ≥ 1⁄8 in**.
- Stair‑step crack **plus** displacement/bulging.
- Crack width **> 1⁄4 in** anywhere.
- Active water leak **plus** diagonal/stair‑step crack.

### Weighted score (for remaining cases)

Assign points and sum:

- Orientation: vertical (0), diagonal (2), stair‑step (3), horizontal (4).
- Width: hairline (0), 1⁄8–1⁄4 (2), >1⁄4 (4).
- Water: none (0), damp (1), active leak (3).
- Displacement: none (0), present (3).
- Related symptoms: each checked adds (1).

Tier mapping:

- **0–3:** Low — likely cosmetic/shrinkage.
- **4–7:** Medium — monitor & schedule inspection.
- **8+:** High — prompt professional evaluation.

---

## Outputs

1. **Severity tier** (Low / Medium / High) + short label.
2. **Why you got this result**
   - List checked items that drove the tier.
3. **Likely cause category** (rule‑based):
   - Shrinkage / settling (typical vertical hairline)
   - Differential settlement (diagonal / stepped)
   - Lateral pressure / hydrostatic (horizontal)
4. **Next steps**
   - Low: monitor, seal small cracks, water management tips.
   - Medium: measure + recheck in 3–6 months, get 1–2 bids.
   - High: call a licensed foundation pro/engineer; avoid DIY structural fixes.

---

## Results UX

- Large status card at top with tier color + label.
- “Why you got this result” bullets immediately under tier.
- “What this usually means” block for cause category.
- CTA row at bottom.

---

## Disclaimers (required)

Above results:

> “This tool provides planning‑level guidance, not engineering advice. Cracks can signal hidden damage. Always confirm with a licensed professional.”

Below results:

- Not a quote or inspection.
- Local codes and soil conditions vary.

---

## CTAs

- “Estimate foundation repair cost” → `/tools/masonry-cost-estimator` pre‑filled to foundation repair.
- “See foundation repair guide” → `/services/foundation-repair`.
- “Find pros near you” → `/{city}/masonry/foundation-repair`.

---

## Success Metrics

- Organic entrances to tool.
- Completion rate (>55%).
- CTR to cost estimator (>10%).
- Scroll depth / time on page.

---

## Technical Notes

- Route: `src/app/(public)/tools/foundation-crack-severity-checker/page.tsx`.
- Scoring rules in `src/lib/tools/foundation-cracks.ts`.
- No DB required in v1.

---

## Supporting Content Cluster (MVP)

- `/learn/foundation-crack-types-explained` — orientation & causes → tool CTA.
- `/learn/how-to-measure-foundation-crack-width` — measurement guide → tool CTA.
- `/learn/foundation-crack-repair-options` — repair paths & costs → tool CTA.

