# PRD: Chimney Water Intrusion Risk Checklist

> **Version:** 0.1
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Should Have (Chimney funnel)

---

## Overview

Checklist/scoring tool focused on chimney water intrusion (leaks, stains, efflorescence), producing a risk tier and conservative fix order.

---

## UX Requirements (Premium Bar)

- Complete in **<60 seconds**.
- **≤3 required inputs**; symptom detail optional.
- Clear safety triggers for interior leaks.

---

## Inputs

Required:
- Symptoms seen (none / staining inside / staining in attic / efflorescence / active leak).
- Visible top/roofline condition (cap/crown/flashing: good / damaged / unknown).
- Climate exposure (freeze‑thaw / no freeze‑thaw).

Optional (collapsed):
- Chimney age.
- Prior waterproofing.
- Mortar gaps/spalling.

---

## Logic

- Score risk based on symptom severity + roofline condition.
- Increase score in freeze‑thaw climates.
- Determine most likely entry path:
  - crown/cap failure
  - flashing/roofline
  - mortar/spalling
- Output fix order: cap/crown → flashing → repoint/brick repair → only then waterproofing.
- Trigger pro call for active leak, interior rot, or soft bricks.

---

## Outputs

- Risk tier + score.
- Likely entry path.
- Fix‑order checklist.
- Cross‑links to Chimney Urgency Checklist + Cost Estimator.

---

## Results UX

- Banner with tier.
- Entry‑path explanation.
- Seasonal “monitoring” tips.

---

## Supporting Content Cluster (MVP)

- `/learn/chimney-leak-causes` → checklist CTA.
- `/learn/chimney-crown-repair` → checklist CTA.

---

## SEO Targets

- “chimney leak”
- “water stains near fireplace”

---

## Technical Notes

- Route: `src/app/(marketing)/tools/chimney-water-intrusion-risk-checklist/page.tsx`.
- Rules in `src/lib/tools/chimney-water-intrusion.ts`.

