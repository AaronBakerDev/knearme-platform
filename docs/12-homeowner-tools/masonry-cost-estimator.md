# PRD: Masonry Repair Cost Estimator

> **Version:** 0.1
> **Last Updated:** December 12, 2025
> **Status:** Proposed
> **Priority:** Should Have (Traffic Spear)

---

## Overview

An interactive estimator that provides a **planning‑level cost range** for common masonry services based on location, project size, severity, and access. The tool is intentionally transparent and conservative, designed to help homeowners budget and decide next steps.

---

## Goals

1. Rank for high‑intent cost queries (national + city‑modified).
2. Deliver a defensible **low / typical / high** range with clear assumptions.
3. Drive users into service hubs and future bid funnel.

### Non‑Goals (MVP)

- Perfect accuracy or contractor‑grade quoting.
- AI‑based pricing.
- Storing estimates as public report pages (Phase 2).

---

## UX Requirements (Premium Bar)

- Complete estimate in **<60 seconds**.
- **≤5 required inputs**; advanced fields hidden by default.
- Inline helper text and examples for every input.
- Results update instantly as inputs change.
- Clear “How this was calculated” section visible without scrolling.
- Mobile layout first; no horizontal scrolling; thumb‑reachable CTAs.

---

## SEO Targets

Primary keywords:

- “masonry repair cost”
- “chimney repair cost”
- “tuckpointing cost”
- “brick repair cost”
- “foundation repair cost”

Secondary:

- “{service} cost in {city}”
- “how much does {service} cost”

---

## User Flow

1. User lands on `/tools/masonry-cost-estimator`.
2. Selects city (or ZIP → city slug).
3. Selects service type.
4. Enters size + severity + access.
5. Sees instant range + explanation.
6. Clicks into local projects / pros or leaves email for report.

---

## Inputs

### Required

1. **Location**
   - City/state search or ZIP.
2. **Service Type**
   - From `MASONRY_SERVICES` / `SERVICE_CONTENT`.
3. **Project Size** (service‑specific)
   - Chimney repair: height (ft) + # sides affected.
   - Tuckpointing: wall area (sq ft) or linear ft of joints.
   - Brick repair: area (sq ft) or brick count.
   - Foundation repair: crack length (ft) or wall area.

### Optional

- **Severity:** minor / standard / structural.
- **Access:** single‑story / two‑story / steep roof / limited access.
- **Historic match needed:** yes/no.

---

## Calculation Model (Deterministic v1)

**EstimatedRange = BaseRange(service, size) × CityMultiplier × SeverityMultiplier × AccessMultiplier × HistoricMultiplier**

### BaseRange(service, size)

Start with conservative national ranges derived from existing `costFactors.typicalRange` in `SERVICE_CONTENT`. Each service defines:

- `baseLowPerUnit`
- `baseTypicalPerUnit`
- `baseHighPerUnit`
- `unitLabel`

Example (chimney repair, per vertical ft):

- low: $150/ft
- typical: $250/ft
- high: $450/ft

---

## Source Ranges by Service (Draft v2 Constants — Dec 2025 Research)

These v2 base constants are derived from a first sweep of reputable national cost guides (Angi/HomeAdvisor, Fixr, HomeGuide, BobVila, Modernize). They represent **non‑structural / planning‑level work** before multipliers.

| Service | Unit | Low / Typical / High per unit | Typical project range | Notes |
|---|---|---|---|---|
| Chimney repair | vertical ft | **$100 / $180 / $300** | $200 – $1,200 (repairs) • $40–$250/ft (rebuild band) | Converted from $10–$25/sq‑ft chimney tuckpointing. Assumes a typical chimney perimeter of 8–12 ft (≈8–12 sq ft surface per vertical ft). Use severity + access to reach rebuild‑level cases. |
| Tuckpointing | sq ft wall area | **$5 / $14 / $25** | $400 – $3,500+ | National guides converge on $5–$25/sq‑ft with ~$14–$15 typical. |
| Brick repair | sq ft damaged area | **$10 / $20 / $35** | $300 – $2,600+ | Spot replacement/patching; labor‑only sources run $20–$40/sq‑ft, so high band is conservative before access/severity. |
| Foundation masonry repair | linear ft crack / joint | **$40 / $90 / $140** | $250 – $800 per non‑structural crack • $1k–$5k+ structural | Per‑crack guides ($250–$800) converted assuming ~6 ft typical crack length for non‑structural cases. Structural cases require a higher severity uplift (see below). |

If inputs imply a rebuild‑level job (high severity + large size), we cap ranges at conservative “structural” bands to avoid under‑estimating.

### Multipliers

- **CityMultiplier**
  - Tier A (low cost): 0.85
  - Tier B (baseline): 1.0
  - Tier C (high cost): 1.2
  - Tier map maintained in a simple JSON file (Phase 1).

- **SeverityMultiplier**
  - minor: 0.7
  - standard: 1.0
  - structural: 1.6 *(default)*
  - **Foundation structural override (recommended v2): 4.0**
    - National foundation guides show structural crack work often running 2–5× non‑structural crack repair. The override prevents systematic under‑estimation for foundation jobs.

- **AccessMultiplier**
  - single story: 1.0
  - two story: 1.15
  - steep/complex roof: 1.3
  - limited access/staging: 1.45

- **HistoricMultiplier**
  - no: 1.0
  - yes: 1.25

---

## Outputs

1. **Low / Typical / High Range**
2. **Timeline estimate** (service‑specific)
3. **Top cost drivers**
   - Render `SERVICE_CONTENT[service].costFactors`.
4. **Assumptions box**
   - Standard materials, normal access, no hidden structural damage, etc.
5. **Confidence label**
   - v1: “Planning‑level estimate (national averages).”
   - v2: data‑based confidence from priced projects.

---

## Results UX

- Display low/typical/high in a single **range card** with clear labels.
- Add a short “What this usually includes” block per service.
- Show “Top cost drivers” as an accordion list.
- Provide actions: **Copy range**, **Print**, **Email me results**.

---

## Disclaimers (required)

Above results:

> “This is a planning estimate. Actual bids vary by contractor and site conditions. Use this range to budget, then confirm with local quotes.”

Below results:

- Not a quote or contract.
- Assumptions list.
- Encourage 2–3 bids.

---

## Success Metrics

- Organic entrances to tool
- Completion rate
- Click‑through to service pages and city hubs
- Email captures

---

## Technical Notes

- Route: `src/app/(public)/tools/masonry-cost-estimator/page.tsx`.
- Client form component for instant calc.
- Shared cost constants live in `src/lib/tools/cost-estimator.ts`.
- No DB required in v1.

---

## Supporting Content Cluster (MVP)

For each priority service, publish 3 satellites that link into this estimator.

**Chimney repair cluster**

- `/learn/chimney-repair-cost` — national + local factors, CTA into tool.
- `/learn/signs-your-chimney-needs-repair` — diagnosis intent → tool.
- `/learn/how-to-measure-chimney-for-repair` — measurement guide → tool.

**Tuckpointing cluster**

- `/learn/tuckpointing-cost-per-sq-ft` — cost intent → tool.
- `/learn/tuckpointing-vs-brick-replacement` — decision intent → tool.
- `/learn/how-to-measure-wall-area-for-tuckpointing` — measurement → tool.

### Phase 2 Enhancements

- Add optional price ranges to contractor publish flow.
- Compute per‑city medians.
- Add shareable report pages.

- Local expansion once data exists:
  - `/tools/masonry-cost-estimator/in/{city}` pages targeting “{service} cost {city}”.
