# PRD: Chimney Repair Urgency Checklist

> **Version:** 0.1
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Should Have (Trust Builder)

---

## Overview

A rules‑based checklist that helps homeowners determine whether chimney issues are low‑risk, need a scheduled repair, or require urgent professional attention.

---

## Goals

1. Capture “do I need repair / how urgent” intent.
2. Provide clear next steps without AI.
3. Funnel into cost estimator + local service pages.

---

## UX Requirements (Premium Bar)

- Complete checklist in **<45 seconds**.
- All inputs visible on one screen on desktop; minimal scrolling on mobile.
- Each symptom has a 1‑line “what this looks like” helper.
- Results appear immediately after last check (no submit required).
- Clear safety language for high‑tier outcomes.

---

## SEO Targets

- “does my chimney need repair”
- “chimney repair signs”
- “is cracked chimney dangerous”

---

## Inputs

Checklist (yes/no):

- Cracked or missing mortar joints
- Bricks spalling/flaking
- White staining (efflorescence)
- Water leak or dampness inside
- Crown cracked/missing
- Flashing separated
- Chimney leaning/tilting
- Debris/odor in firebox
- Age > 25 years without repair

---

## Scoring Logic

Assign weights per symptom:

- **High‑risk (3 pts):** leaning, structural cracks, missing crown, major spalling, active water leak.
- **Medium (2 pts):** mortar gaps, flashing failure, large efflorescence, interior dampness.
- **Low (1 pt):** minor cracks, age, cosmetic staining.

Total score → urgency tier:

- **0–3:** Monitor / routine maintenance
- **4–7:** Schedule inspection & repair
- **8+:** Urgent repair; avoid fireplace use

---

## Outputs

- Urgency tier + score.
- “Why you got this result” mapping checked items → tier.
- Top likely repair types (from fixed mapping).
- Safety warnings for high tier.

---

## Results UX

- Display urgency tier in a large status card (color + label + score).
- “Why you got this result” shown directly under the tier (no hidden logic).
- Likely repair categories as bullets with short explanations.

---

## CTAs

- “Estimate cost for your likely repair” → pre‑fill Cost Estimator.
- “Browse chimney repair projects near you” → `/services/chimney-repair` and `/{city}/masonry/chimney-repair`.

---

## Success Metrics

- Completion rate (>60%)
- CTR to cost estimator (>12%)
- Time on page (>2 min)

---

## Technical Notes

- Route: `src/app/(public)/tools/chimney-repair-urgency-checklist/page.tsx`.
- Scoring rules in `src/lib/tools/chimney-urgency.ts`.

---

## Supporting Content Cluster (MVP)

- `/learn/signs-your-chimney-needs-repair` — symptom education → checklist CTA.
- `/learn/chimney-repair-vs-rebuild` — decision intent → checklist CTA.
- `/learn/chimney-maintenance-schedule` — prevention intent → checklist CTA.

