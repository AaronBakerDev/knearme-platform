# PRD: Masonry Maintenance Scheduler

> **Version:** 0.1
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Could Have (Retention)

---

## Overview

Tool that generates a maintenance calendar and annual checklist for masonry elements (chimney, brick walls, stone veneer, patios).

---

## UX Requirements (Premium Bar)

- Complete schedule in **<60 seconds**.
- **≤3 required inputs**; optional last‑service dates collapsed.
- Outputs printable and easy to save.

---

## Inputs

- Masonry type (brick / stone / concrete / chimney)
- Age of home/masonry
- Climate exposure tier
- Last inspection/repair year (optional)

---

## Logic

- Rule table per type + climate defines:
  - inspection frequency
  - sealing/waterproofing frequency
  - cleaning frequency
- Produce seasonal task list.

---

## Outputs

- Printable yearly schedule.
- Seasonal checklist.
- Optional email reminders (Phase 2).

---

## Results UX

- Calendar summary by season + a printable yearly checklist.
- “Set reminders” email capture CTA.

---

## Supporting Content Cluster (MVP)

- `/learn/masonry-maintenance-schedule` → scheduler CTA.
- `/learn/how-often-to-seal-brick` → scheduler CTA.
- `/learn/chimney-inspection-frequency` → scheduler CTA.

---

## SEO Targets

- “masonry maintenance schedule”
- “how often to seal brick”

---

## Technical Notes

- Route: `src/app/(public)/tools/masonry-maintenance-scheduler/page.tsx`.
- Rules in `src/lib/tools/maintenance-scheduler.ts`.
