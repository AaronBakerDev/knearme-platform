# Masonry Cost Estimator — Research Plan (v1 → v2)

> **Owner:** KnearMe
> **Created:** December 12, 2025
> **Status:** In progress

This document tracks the data‑collection and calibration work needed to upgrade the Masonry Repair Cost Estimator from conservative v1 seed constants to defensible v2 constants and multipliers.

---

## Scope Lock (Do First)

Before collecting pricing, confirm the estimator **service definitions, inclusions, and units** so that ranges aren’t mixed across different job types.

### Services & Units

| Service | Unit in estimator | In scope | Out of scope |
|---|---|---|---|
| Chimney repair | **$/vertical ft** (plus sides affected) | repointing, crown/cap repair, partial rebuild, flashing repair | full chimney replacement, fireplace rebuild |
| Tuckpointing | **$/sq ft wall area** (optional linear ft) | mortar joint replacement on exterior walls | full façade rebuild, interior plaster |
| Brick repair | **$/sq ft damaged area** or brick count | spot brick replacement/patching | full wall rebuild |
| Foundation masonry repair | **$/linear ft crack/joint** | crack/joint repair, minor wall stabilization | full underpinning, piering, waterproofing systems |

Deliverable: short “scope sheet” per service in this folder.

---

## Data Families & Targets

### A) National consumer cost guides (base ranges)

Goal: derive conservative national **low / typical / high per‑unit** prices.

Target sources (prioritize those with stated methodology and update dates):

- Angi / HomeAdvisor cost guides
- Fixr cost guides
- Thumbtack cost guides
- Bob Vila / This Old House / The Spruce / Family Handyman
- CostHelper / Porch / HomeGuide (only if assumptions are clear)

Deliverable: `National Base Range Library` table (below).

### B) Trade/industry references (scope + cost drivers)

Goal: validate what work typically includes and identify the real drivers behind cost spread.

Targets:

- International Masonry Institute (IMI)
- Brick Industry Association (BIA)
- Masonry Institute of America (MIA)
- Chimney Safety Institute / National Chimney Sweep Guild
- International Concrete Repair Institute (ICRI)
- Preservation briefs for historic masonry matching

Deliverable: per‑service notes + driver list.

### C) Construction cost indices & wages (city multipliers)

Goal: defensible city cost tiers.

Targets:

- RSMeans city indices (preferred)
- BLS metro wage data (masons/laborers)
- BEA Regional Price Parities / COL indices

Deliverable: `city-masonry-multipliers.json` mapping metro → index → tier.

### D) Local quote benchmarks (sanity checking)

Goal: check estimator outputs against real world ballparks.

Targets:

- Contractor sites with published ranges
- Yelp/Google/BBB listings that show typical pricing
- Local trade directory pages

Deliverable: `Local Quote Benchmark Set` table (below).

---

## Templates

### National Base Range Library

Copy this table into a spreadsheet or keep it here while collecting sources.

| Service | Source | URL | Last updated | Unit stated by source | Size assumption | Low | Typical | High | Notes | Confidence (H/M/L) |
|---|---|---|---|---|---|---:|---:|---:|---|---|
| Chimney repair |  |  |  |  |  |  |  |  |  |  |
| Tuckpointing |  |  |  |  |  |  |  |  |  |  |
| Brick repair |  |  |  |  |  |  |  |  |  |  |
| Foundation masonry repair |  |  |  |  |  |  |  |  |  |  |

### Local Quote Benchmark Set

| Metro | Tier | Service | Source | URL | Date | Scenario described | Price quoted | Unit | Notes |
|---|---|---|---|---|---|---|---:|---|---|

---

## Calibration & Backtesting

Once sources are collected:

1. Normalize all prices into estimator units.
2. Inflation‑adjust to a single reference quarter (CPI‑U or PPI Brick/Mortar if available).
3. Compute robust national percentiles per service:
   - **Low** ≈ 25th percentile
   - **Typical** = median
   - **High** ≈ 85th–90th percentile
4. Create city masonry index = weighted blend of wage + construction indices, normalized to 1.0 national median.
5. Backtest v2 estimator scenarios vs local quote benchmarks.
6. Adjust constants/multipliers until typical aligns within ~15–20% per tier.

Deliverables:

- Updated v2 base constants per service.
- Updated multipliers with written rationale.
- Backtest report (before/after).

---

## Maintenance Cadence

- **Quarterly refresh** of top 5 national sources per service.
- **Quarterly city index update** from latest wage/cost data.
- Incorporate first‑party KnearMe priced projects once sample size is sufficient.

Add “last updated” timestamps in the estimator UI.

