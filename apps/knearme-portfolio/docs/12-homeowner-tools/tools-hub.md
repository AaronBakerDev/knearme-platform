# PRD: Client Tools Hub

> **Version:** 0.1
> **Last Updated:** January 2, 2026
> **Status:** Proposed
> **Priority:** Must Have (Foundation)

---

## Overview

Create a dedicated public “Tools” section that hosts multiple interactive, non‑AI client utilities. The Tools Hub is a long‑term inbound marketing engine that:

- Ranks for high‑intent DIY/planning searches.
- Captures emails and lead intent before users are ready to hire.
- Feeds authority and internal links into programmatic SEO city/service routes.

This PRD defines shared UX, SEO, analytics, and technical patterns for all tools.

**Vertical note:** The current tool library is masonry‑specific. The hub architecture should generalize to any portfolio‑based business category over time.

---

## Goals

1. Launch a scalable hub for client tools at `/tools`.
2. Establish a repeatable “tool page” template and internal linking rules.
3. Enable rapid shipping of new tools without custom infra.

### Non‑Goals (MVP)

- User accounts or persistent dashboards for clients.
- AI/vision analysis.
- Storing user inputs server‑side (except optional email capture).

---

## Target Users

- Clients researching masonry repairs, costs, and DIY feasibility.
- DIYers planning materials and scope.
- Clients who will later seek bids.

---

## Information Architecture

### Routes

- **Index:** `/tools`
- **Tool detail:** `/tools/{tool-slug}`
- (Phase 2) **Shareable report:** `/tools/{tool-slug}/report/{id}`

### Tool Slug Convention

- Kebab‑case, descriptive of intent (e.g., `masonry-cost-estimator`).
- One primary tool per slug to avoid cannibalization.

---

## Shared Page Template

Every tool uses the same page skeleton:

1. **Hero**
   - Clear promise (“Get a planning‑level cost range in 60 seconds”).
   - One‑sentence disclaimer if tool involves estimates.
2. **Inputs Form**
   - Minimal steps; progressive disclosure for optional fields.
3. **Results Panel**
   - Instant output; no page reload.
   - “How this was calculated” + assumptions.
4. **Interpretation / Next Steps**
   - What the results mean.
   - When to DIY vs hire a pro.
5. **Local Proof / Internal Links**
   - “See real projects like yours in {city}” → `/{city}/masonry/{type}`
   - “Browse local pros” → `/businesses/{city}/{slug}` (current route)
6. **Email Capture (optional but recommended)**
   - “Email me this report / checklist.”
   - Plain email + consent.

---

## Design System for Tools

Tools must outcompete on **clarity, speed, and polish**. This section defines the shared “premium KnearMe” UX bar.

### Visual Language

- Clean, modern layout with subtle “craft & earth” texture cues (stone/brick‑inspired gradients).
- Large, high‑contrast typography; mobile‑first spacing.
- Zero clutter: no ads, no sidebars competing with the form/results.
- Consistent iconography (lucide) and button hierarchy across all tools.

### Interaction / UX Bar

- **Time‑to‑value:** user sees a meaningful result in **<60 seconds**.
- **Required inputs:** **≤5 required fields**. Everything else lives behind “Show advanced options.”
- **Progressive disclosure:** defaults pre‑filled; helper text under every input.
- **Instant results:** results update client‑side without full reload.
- **Explainability:** every result includes “how we calculated this” + assumptions.
- **Shareability:** provide copy / print actions (PDF export Phase 2).

### Results Presentation

- Primary output appears in a large, scannable card (range, tier, or materials list).
- Secondary details in collapsible sections (drivers, assumptions, next steps).
- Always end with:
  - a local proof link (projects in city/service)
  - a next action CTA (cost estimator, checklist, or bids/waitlist)

---

## SEO Requirements

### Helpful Content Signals

- Tool must provide **task completion**, not just text.
- Outputs must be **transparent and replicable** (no black‑box claims).
- Include at least one unique element per tool (calculations, tables, printable output).

### Metadata

- Unique title + description per tool.
- Canonical to the clean tool URL.
- Avoid indexing “state URLs” (`?inputs=`) unless Phase 2 share pages.

### Structured Data

- Use `FAQPage` for tools with FAQ blocks.
- Use `HowTo` when steps are part of output.
- Use `BreadcrumbList` (already handled by `Breadcrumbs`).

### Internal Linking Rules

- At least **2 contextual links** from each tool into:
  - relevant service pillar page (`/services/{type}`)
  - relevant city/service hub (`/{city}/masonry/{type}`)
- Add reciprocal links from service pages to the tool once live.

---

## Analytics / Success Metrics

Track per tool:

| Metric | Target | Notes |
|---|---|---|
| Organic entrances | Growing WoW | Primary KPI |
| Tool completion rate | >50% | Inputs → results |
| CTA clickthrough | >8% | To services/business profiles |
| Email capture | 1–3% of sessions | Depends on traffic |
| Time on tool | >90s | Indicates usefulness |

Event names:
- `tool_viewed`
- `tool_started`
- `tool_completed`
- `tool_cta_clicked`
- `tool_email_submitted`

---

## Technical Notes

### Implementation Pattern

- Tool pages live under `src/app/(marketing)/tools/{tool-slug}/page.tsx`.
- Server component wraps a lightweight client form for interactivity.
- Calculations are deterministic and run client‑side (MVP).
- No database writes in MVP except email capture.

### Shared Components

Create reusable UI in `src/components/tools/`:

- `ToolLayout` (hero + breadcrumbs + standard sections)
- `ToolForm` (consistent spacing + validation)
- `ToolResults` (cards + confidence + assumptions)
- `EmailCapture` (shared form + success toast)

### Content Sources

- Service names/labels from `src/lib/constants/services.ts`.
- Cost factors and guidance from `src/lib/constants/service-content.ts`.

---

## Rollout Plan

1. **Phase A (MVP):** `/tools` hub + first two tools.
2. **Phase B:** Add 3–5 more tools, plus internal links from service pages.
3. **Phase C:** Shareable report pages + stored outputs.
