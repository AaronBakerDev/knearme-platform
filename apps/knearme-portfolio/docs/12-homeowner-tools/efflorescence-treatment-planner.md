# PRD: Efflorescence Cause + Treatment Planner

> **Version:** 0.1
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Should Have (Traffic Spear)

---

## Overview

A deterministic client tool that identifies the most likely cause of efflorescence (white powdery salt staining) and outputs a safe DIY removal plan plus prevention steps. The tool also flags cases that require professional moisture inspection.

---

## Goals

1. Rank for “efflorescence removal / causes” keyword cluster.
2. Provide a clear step‑by‑step treatment plan users can follow today.
3. Route users into waterproofing checklist and related services.

### Non‑Goals (MVP)

- Chemical product endorsements.
- AI diagnosis.
- Guarantee that staining will not return.

---

## UX Requirements (Premium Bar)

- Complete in **<45 seconds**.
- Simple toggles/checkboxes; no text inputs.
- Results show **cause first**, then treatment plan.
- Avoid overwhelming users with options.

---

## SEO Targets

- “efflorescence removal”
- “white powder on brick”
- “efflorescence causes”
- “salt stains on masonry”

---

## Inputs

1. **Where is the efflorescence?**
   - Exterior wall
   - Interior basement / crawlspace wall
   - Chimney / roofline area

2. **How bad is it?**
   - Light dusting
   - Noticeable streaking
   - Heavy crust / flaking surface

3. **When does it show up?**
   - After rain / snow melt
   - Year‑round
   - Mostly winter / freeze‑thaw

4. **Any of these present?** (checkboxes)
   - Damp interior surface behind the wall
   - Active water leak nearby
   - Spalling/flaking bricks
   - Mortar gaps/cracking
   - Gutters/downspouts dumping near wall

5. **Wall age**
   - New build / <2 years
   - 2–20 years
   - 20+ years

---

## Logic (Deterministic v1)

### Cause categories

Map inputs to one of:

1. **New‑construction salts (curing moisture)**
   - New build + light dusting + no other moisture symptoms.
2. **Surface water intrusion**
   - Exterior wall + after rain + gutters/drainage issues.
3. **Subsurface / hydrostatic pressure**
   - Interior basement + dampness/leaks.
4. **Roofline/chimney entry**
   - Chimney/roofline + leak after rain.

### Treatment plan selection

- Light/moderate: dry brushing → mild soap/water rinse.
- Heavy crust: dry brush → wet wash → **mild acid cleaner (vinegar or commercial efflorescence cleaner)**.
- Any spalling or active leak: stop at brushing and recommend pro.

---

## Outputs

1. **Likely cause** + 1‑sentence explanation.
2. **DIY removal steps** (3–6 numbered steps).
3. **Prevention checklist**
   - Fix water source first.
   - Improve drainage / gutters.
   - Repoint/tuckpoint if mortar is failing.
   - Only seal once dry and repairs complete.
4. **When to call a pro** triggers.

---

## Results UX

- Cause callout card.
- Treatment steps in numbered list with safety notes.
- Prevention accordion.

---

## Disclaimers (required)

> “Always test cleaners on a small area first. Avoid harsh acids on historic or soft brick. This guide is informational only.”

---

## CTAs

- “Check moisture risk” → `/tools/waterproofing-risk-checklist`.
- “Estimate repointing cost” → `/tools/masonry-cost-estimator` prefilled to tuckpointing/waterproofing.
- “See efflorescence guide” → `/services/efflorescence-removal`.

---

## Success Metrics

- Organic entrances to tool.
- Completion rate (>55%).
- CTR to waterproofing checklist (>10%).

---

## Technical Notes

- Route: `src/app/(public)/tools/efflorescence-treatment-planner/page.tsx`.
- Rules in `src/lib/tools/efflorescence.ts`.

---

## Supporting Content Cluster (MVP)

- `/learn/efflorescence-causes-and-fixes` — deep dive → tool CTA.
- `/learn/how-to-clean-efflorescence-safely` — DIY guide → tool CTA.
- `/learn/efflorescence-vs-mold-vs-mineral-stains` — comparison intent → tool CTA.

