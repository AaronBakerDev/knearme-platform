# PRD: Masonry Waterproofing Risk + Decision Checklist

> **Version:** 0.2
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Should Have (Traffic Spear)

---

## Overview

A rules‑based homeowner tool that (1) scores moisture/water‑damage risk for brick/stone masonry and (2) recommends the **most appropriate path**: drainage first, repointing, flashing repair, sealing, or professional inspection.

The tool is intentionally conservative and explanatory. No AI.

---

## Goals

1. Capture high‑intent waterproofing and water‑damage searches.
2. Provide a simple decision answer (“what should I do first?”) with transparent reasons.
3. Funnel into waterproofing / tuckpointing services and cost estimator.

### Non‑Goals (MVP)

- Precise leak diagnosis.
- Product recommendations or affiliate listings.
- AI reasoning.

---

## UX Requirements (Premium Bar)

- Complete assessment in **<60 seconds**.
- **All inputs are checkboxes or short selects**; no text fields.
- One‑screen desktop; <2 scrolls on mobile.
- Results appear immediately after final input change.
- Show **risk tier first**, then **recommended first action**, then plan.

---

## SEO Targets

Primary:

- “brick waterproofing”
- “masonry water damage signs”
- “should I seal brick”
- “water coming through brick wall”

Secondary:

- “efflorescence on brick”
- “chimney flashing leak”
- “repointing vs sealing”

---

## Inputs

### Required

1. **Climate / freeze‑thaw exposure**
   - Freeze‑thaw (cold/mixed)
   - No freeze‑thaw (warm/dry)

2. **Masonry type**
   - Brick
   - Stone
   - Block / foundation masonry

3. **Exposure**
   - Wind‑driven rain / high exposure
   - Moderate exposure
   - Sheltered / covered

4. **Symptoms checklist** (multi‑select)
   - White staining (efflorescence)
   - Spalling/flaking brick
   - Damp interior wall/basement
   - Active leak during rain
   - Musty odor / visible mold nearby
   - Mortar gaps/cracking

5. **Drainage & gutters**
   - Good
   - OK
   - Poor (overflowing gutters, negative grade, standing water)

### Optional

6. **Location of issue**
   - Near roofline / chimney
   - Mid‑wall
   - At grade / basement

---

## Logic (Deterministic v1)

### Risk score

Weighted scoring using:

- Climate (freeze‑thaw increases risk).
- Exposure level.
- Symptom weights (active leak + spalling highest).
- Drainage quality.

Map score to tier:

- **Low:** mostly cosmetic or early risk.
- **Medium:** likely moisture path needing planned repair.
- **High:** active water damage; prioritize professional inspection.

### Recommended first action (rule table)

Rules in order of precedence:

1. **Active leak present** → “Inspect flashing / roofline and call a pro.”
2. **Spalling + freeze‑thaw** → “Repoint/repair first; do not seal yet.”
3. **Poor drainage/gutters** → “Fix drainage first (gutters, downspouts, grade).”
4. **Efflorescence only** → “Clean + find moisture source; consider breathable sealer after fully dry.”
5. **Mortar gaps/cracking** → “Repoint/tuckpoint before sealing.”
6. **No symptoms but high exposure** → “Preventive breathable waterproofing + maintenance.”

---

## Outputs

1. **Risk tier** with short explanation.
2. **Recommended first action** (single clear sentence).
3. **Prioritized plan (3–6 steps)**
   - Fix water source.
   - Repair mortar/flashing/brick as needed.
   - Dry out masonry.
   - Optional sealing (only when safe).
4. **When to call a pro** triggers.
5. Standard assumptions list.

---

## Results UX

- Tier card at top with label + 1‑line summary.
- “First thing to do” highlighted callout.
- Prioritized steps as numbered list.
- Compact assumptions + disclaimer accordion.

---

## Disclaimers (required)

> “Water intrusion can cause hidden structural damage. This checklist is informational only and not a substitute for a professional inspection.”

---

## CTAs

- “Estimate repair cost” → `/tools/masonry-cost-estimator` pre‑filled to waterproofing/tuckpointing.
- “Treat efflorescence” → `/tools/efflorescence-treatment-planner`.
- “See waterproofing guide” → `/services/masonry-waterproofing`.

---

## Success Metrics

- Organic entrances to tool.
- Completion rate (>50%).
- CTR to cost estimator (>8%).

---

## Technical Notes

- Route: `src/app/(public)/tools/waterproofing-risk-checklist/page.tsx`.
- Rules in `src/lib/tools/waterproofing-risk.ts`.

---

## Supporting Content Cluster (MVP)

- `/learn/how-to-waterproof-brick` — method & timing → tool CTA.
- `/learn/signs-of-masonry-water-damage` — diagnosis → tool CTA.
- `/learn/repointing-vs-sealing` — decision intent → tool CTA.
