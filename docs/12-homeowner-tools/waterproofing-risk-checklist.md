# PRD: Masonry Waterproofing Risk + Prevention Checklist

> **Version:** 0.1
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Could Have

---

## Overview

Rules‑based assessment that predicts moisture risk and outputs a prioritized prevention plan.

---

## UX Requirements (Premium Bar)

- Complete assessment in **<60 seconds**.
- All symptoms are checkboxes; no long text inputs.
- Results show risk tier first, steps second.

---

## Inputs

- Climate zone (cold / mixed / hot‑humid / dry)
- Exposure (full sun / shaded / wind‑driven rain)
- Symptoms checklist (efflorescence, interior damp, spalling, mold smell)
- Drainage/gutter quality (good / ok / poor)
- Masonry age bracket

---

## Logic

- Weighted risk score.
- Map score to low/medium/high.
- Generate top prevention actions from rule table.

---

## Outputs

- Risk tier + explanation.
- 3–6 prevention steps.
- “When to call a pro” triggers.

---

## Results UX

- Risk tier shown in a large card with short explanation.
- Prevention steps as a numbered list.

---

## Supporting Content Cluster (MVP)

- `/learn/efflorescence-causes-and-fixes` → checklist CTA.
- `/learn/how-to-waterproof-brick` → checklist CTA.
- `/learn/signs-of-masonry-water-damage` → checklist CTA.

---

## SEO Targets

- “masonry waterproofing checklist”
- “efflorescence causes”

---

## Technical Notes

- Route: `src/app/(public)/tools/waterproofing-risk-checklist/page.tsx`.
- Rules in `src/lib/tools/waterproofing-risk.ts`.
