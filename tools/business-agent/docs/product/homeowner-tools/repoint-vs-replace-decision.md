# PRD: Repoint vs Replace Brick/Stone Decision Tool

> **Version:** 0.1
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Should Have (Core masonry funnel)

---

## Overview

Rules‑based tool that helps homeowners decide whether their wall needs repointing/tuckpointing, selective brick replacement, or a larger rebuild.

---

## UX Requirements (Premium Bar)

- Complete in **<60 seconds**.
- **≤3 required inputs**; moisture + history optional.
- Output a clear recommendation with scope ranges.

---

## Inputs

Required:
- Mortar loss depth (surface dusting / 1⁄4–1⁄2 in gaps / >1⁄2 in missing).
- Brick/stone damage rate (none / some spalling / many broken or soft units).
- Climate exposure (freeze‑thaw / no freeze‑thaw).

Optional (collapsed):
- Wall age (years).
- Moisture symptoms (efflorescence / damp interior / active leak).
- Prior sealing (never / >5 yrs ago / <5 yrs ago).

---

## Logic

- Decision tree:
  - If deep mortar loss but bricks mostly sound → repoint.
  - If significant spalling/soft bricks → replace damaged units then repoint.
  - If widespread brick failure or bowing/step cracks → pro structural evaluation / rebuild zone.
- Increase urgency in freeze‑thaw + moisture symptoms.
- Provide conservative scope estimate bands (spot / elevation / whole home).

---

## Outputs

- Primary recommendation (repoint / replace+repoint / rebuild consult).
- Severity tier + pro triggers.
- Scope band.
- Cross‑links to Tuckpointing Calculator + Brick Replacement + Cost Estimator.

---

## Results UX

- Summary card with recommendation.
- Scope + next steps list.
- “Before sealing” reminder.

---

## Supporting Content Cluster (MVP)

- `/learn/repoint-vs-replace-brick` → decision tool CTA.
- `/learn/how-deep-to-grind-mortar` → decision tool CTA.

---

## SEO Targets

- “repoint vs replace brick”
- “mortar crumbling what to do”

---

## Technical Notes

- Route: `src/app/(marketing)/tools/repoint-vs-replace-decision/page.tsx`.
- Rules in `src/lib/tools/repoint-vs-replace.ts`.

