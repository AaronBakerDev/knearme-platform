# City & Service Rollout Plan

## Current State

**Last Updated:** December 31, 2025 (Late Night)

### Collection Summary

| City | Contractors | Reviews Collected | Search Terms | Status |
|------|-------------|-------------------|--------------|--------|
| Denver | 426 | 14,430 | 10 | ✅ Discovery + Collection Complete |
| Colorado Springs | 315 | 12,742 | 5 | ✅ Discovery + Collection Complete |
| Toronto | 398 | 11,762 | 9 | ✅ Discovery + Collection Complete |
| Ottawa | 249 | 9,145 | 8 | ✅ Discovery + Collection Complete |
| Hamilton | 331 | 8,157 | 8 | ✅ Discovery + Collection Complete |
| Boise | 150 | 5,303 | 5 | ✅ Discovery + Collection Complete |
| Winnipeg | 143 | 3,686 | 5 | ✅ Discovery + Collection Complete |
| **TOTAL** | **2,015** | **65,225** | - | ✅ **PHASE 2 COLLECTION COMPLETE** |

### Recent Infrastructure Updates (Dec 31, 2025)
- ✅ **Category arrays**: `category` column now supports multiple categories per contractor
- ✅ **Search term tracking**: `search_terms` column tracks which discoveries found each contractor
- ✅ **Country auto-detect**: Script auto-detects Canada from province codes (ON, BC, AB, etc.)
- ✅ **Country normalization**: All Canadian records normalized to `country: 'Canada'`

---

## Execution Log

### Denver, CO (Pilot - Complete)

**Discovery (Dec 30, 2025):**
| Search Term | Contractors Found | Notes |
|-------------|-------------------|-------|
| masonry | 5 | Base category |
| brick repair | 100 | ✅ High volume |
| chimney repair | 100 | ✅ High volume |
| tuckpointing | 27 | Specialty |
| stone mason | 30 | Specialty |
| foundation repair | 100 | ✅ High volume |
| retaining wall | 12 | Limited results |
| concrete repair | 100 | ✅ Adjacent service |
| stucco repair | 100 | ✅ Adjacent service |
| fireplace repair | 80 | ✅ Good volume |
| **Total Unique** | **468** | After dedup |

**Collection (Dec 31, 2025):**
- 173 contractors with 20+ reviews processed
- 17,082 reviews collected
- ✅ Complete

---

### Ottawa, ON (Complete)

**Discovery (Dec 31, 2025):**
| Search Term | Contractors Found | Notes |
|-------------|-------------------|-------|
| masonry contractors | 100 | ✅ High volume |
| chimney sweep | 58 | Good volume |
| concrete contractors | 100 | ✅ High volume |
| fireplace installation | 17 | Limited |
| **Total Unique** | **247** | After dedup |

**Collection (Dec 31, 2025):**
- 96/98 contractors processed (2 API errors)
- 6,025 reviews collected
- ✅ Complete

---

### Toronto, ON (Complete)

**Discovery (Dec 31, 2025):**
| Search Term | Contractors Found | Notes |
|-------------|-------------------|-------|
| masonry contractors | 189 | ✅ Very high volume |
| chimney sweep | 35 | Moderate |
| concrete contractors | 167 | ✅ High volume |
| fireplace installation | 39 | Good volume |
| **Total Unique** | **394** | After dedup |

**Collection (Dec 31, 2025):**
- 98 contractors with 20+ reviews processed
- 7,340 reviews collected
- ✅ Complete

---

### Hamilton, ON (Complete)

**Discovery (Dec 31, 2025):**
| Search Term | Contractors Found | Notes |
|-------------|-------------------|-------|
| masonry contractors | 147 | ✅ High volume |
| chimney sweep | 31 | Moderate |
| concrete contractors | 175 | ✅ Very high volume |
| fireplace installation | 6 | Limited |
| **Total Unique** | **329** | After dedup |

**Collection (Dec 31, 2025):**
- 100 contractors with 20+ reviews processed
- 6,097 reviews collected
- ✅ Complete

---

### Colorado Springs, CO (Complete)

**Discovery (Dec 31, 2025):**
| Search Term | Contractors Found | Notes |
|-------------|-------------------|-------|
| masonry contractors | 151 | ✅ High volume |
| brick repair | 116 | ✅ Good volume |
| chimney repair | 106 | ✅ Good volume |
| stone mason | 30 | Specialty |
| tuckpointing | 11 | Limited |
| **Total Unique** | **315** | After dedup |

**Collection (Dec 31, 2025):**
- 94 contractors with 20+ reviews processed
- 12,742 reviews collected
- ✅ Complete

---

### Winnipeg, MB (Complete)

**Discovery (Dec 31, 2025):**
| Search Term | Contractors Found | Notes |
|-------------|-------------------|-------|
| masonry contractors | 106 | ✅ Good volume |
| brick repair | 57 | Moderate |
| chimney repair | 24 | Limited |
| stone mason | 25 | Limited |
| tuckpointing | 16 | Limited |
| **Total Unique** | **143** | After dedup |

**Collection (Dec 31, 2025):**
- 46 contractors with 20+ reviews processed
- 3,686 reviews collected
- ✅ Complete

---

### Boise, ID (Complete)

**Discovery (Dec 31, 2025):**
| Search Term | Contractors Found | Notes |
|-------------|-------------------|-------|
| masonry contractors | 99 | ✅ Good volume |
| brick repair | 82 | Good volume |
| chimney repair | 21 | Limited |
| stone mason | 21 | Limited |
| tuckpointing | 3 | Very limited |
| **Total Unique** | **150** | After dedup |

**Collection (Dec 31, 2025):**
- 63 contractors with 20+ reviews processed
- 5,303 reviews collected
- ✅ Complete

---

## ✅ Canadian Cities: All Tier 1 Terms Complete

All Canadian cities now have complete Tier 1 search term coverage:

| City | Search Terms Completed |
|------|------------------------|
| Ottawa | masonry contractors, chimney sweep, concrete contractors, fireplace installation, brick repair, chimney repair, tuckpointing, stone mason |
| Toronto | masonry contractors, chimney sweep, concrete contractors, fireplace installation, brick repair, chimney repair, tuckpointing, stone mason |
| Hamilton | masonry contractors, chimney sweep, concrete contractors, fireplace installation, brick repair, chimney repair, tuckpointing, stone mason |

**Notes:**
- ✅ "chimney sweep" = cleaning/maintenance service
- ✅ "chimney repair" = structural repair (separate Tier 1 term)
- ✅ "concrete contractors" = useful adjacent trade data
- ✅ Country auto-detected from province code (no `--country` flag needed)

**Example discovery command (country auto-detected):**
```bash
npm run discover -- --search "brick repair" --city "Ottawa" --state "ON"
# Output: [Discover] City: Ottawa, ON, Canada  ← Auto-detected
```

---

## Service Categories (Search Terms)

### Tier 1: Core Masonry (Launch With)
| Search Term | Slug | Why |
|-------------|------|-----|
| masonry contractors | `/masonry/` | **Preferred broad term** - returns 100+ results |
| brick repair | `/brick-repair/` | High volume, clear intent |
| chimney repair | `/chimney-repair/` | High value project (**NOT "chimney sweep"**) |
| tuckpointing | `/tuckpointing/` | Specific, less competition |
| stone mason | `/stone-masonry/` | Specialty work |

> **Important:** "masonry contractors" returns significantly more results than "masonry" alone (5 vs 100+). Use "masonry contractors" for all new cities.

### Tier 2: Adjacent Services (Add Later)
| Search Term | Slug | Why |
|-------------|------|-----|
| parging repair | `/parging/` | Foundation masonry coating, specific to trade |
| concrete repair | `/concrete-repair/` | Related trade |
| stucco repair | `/stucco-repair/` | Related trade |
| fireplace repair | `/fireplace-repair/` | Related to chimney |
| retaining wall | `/retaining-walls/` | Hardscape overlap |
| chimney sweep | `/chimney-cleaning/` | Maintenance service (different from repair) |

> **Note**: Denver pilot was searched with "foundation repair" instead of "parging repair". That data is kept. Use "parging repair" for all new cities going forward.

### Tier 3: Expansion Services (Future)
| Search Term | Slug | Notes |
|-------------|------|-------|
| brick patio | `/brick-patios/` | Residential outdoor |
| stone veneer | `/stone-veneer/` | Decorative |
| historic restoration | `/historic-restoration/` | Specialty niche |
| commercial masonry | `/commercial-masonry/` | B2B segment |

---

## City Selection Criteria

| Factor | Why It Matters | Data Source |
|--------|----------------|-------------|
| **Competition** | Less = easier to rank, faster results | SEMrush/Ahrefs |
| **Climate** | Freeze/thaw = masonry damage | Geography |
| **Housing age** | Older = more repair work | Census |
| **Population** | More searches (but also more competition) | Census |
| **Median home value** | Higher project budgets | Zillow/Census |

### SEO-First Strategy

**Why 500K-1M cities first:**
- Less established SEO competition for "[service] [city]" keywords
- Faster to rank (weeks vs months for major metros)
- Build domain authority before tackling competitive markets
- Still substantial markets with 50-100+ contractors
- Each ranking win compounds (Google trusts the domain more)

### Ideal City Profile (Sweet Spot)
- Population: **500K-1M metro** (less competition, still viable market)
- Climate: 4 seasons (freeze/thaw cycle)
- Housing stock: Pre-1980 significant
- Median home value: $300K+
- Existing content competition: **Low** (priority)

---

## City Priority List

> **Strategy**: Start with 500K-1M cities where we can rank quickly, prove the model, then scale to larger metros with established authority.

### Pilot: Denver (Complete)
Larger market but home base. Data already collected.

| City | Metro Pop | Status |
|------|-----------|--------|
| Denver | 2.9M | ✅ Discovered (426 contractors) |

---

### Tier 1: Low Competition Sweet Spot (500K-1M)
**Priority: Immediate** — Fastest path to rankings and revenue.

#### US Cities
| City | Metro Pop | State | Priority | Status |
|------|-----------|-------|----------|--------|
| Colorado Springs | 750K | CO | 1 | ✅ Discovered (315 contractors) |
| Boise | 750K | ID | 2 | ✅ Discovered (150 contractors) |
| Albuquerque | 900K | NM | 3 | Pending |
| Reno | 500K | NV | 4 | Mountain climate, 4 seasons |
| Omaha | 500K | NE | 5 | Old brick housing, harsh winters |
| Louisville | 800K | KY | 6 | Historic brick city, 4 seasons |
| Richmond | 650K | VA | 7 | Old South brick tradition |
| Tulsa | 650K | OK | 8 | Brick tradition, underserved |
| Grand Rapids | 575K | MI | 9 | Cold winters, growing city |
| Knoxville | 500K | TN | 10 | 4 seasons, older housing |

#### Canadian Cities (Priority Markets)
| City | Metro Pop | Province | Priority | Status |
|------|-----------|----------|----------|--------|
| Hamilton | 780K | ON | 11 | ✅ Discovered (331 contractors) |
| Ottawa | 1.4M | ON | 12 | ✅ Discovered (249 contractors) |
| Toronto | 6.2M | ON | 13 | ✅ Discovered (398 contractors) |
| Winnipeg | 850K | MB | 14 | ✅ Discovered (143 contractors) |

---

### Tier 2: Medium Competition (300K-500K + 1M-2M)
**Priority: After Tier 1 rankings established** — Slightly harder but still manageable.

#### Smaller US Cities (Good Masonry Markets)
| City | Metro Pop | State | Priority | Why |
|------|-----------|-------|----------|-----|
| Fort Collins | 350K | CO | 15 | Complete Colorado coverage |
| Buffalo | 580K | NY | 16 | Harsh winters, old brick |
| Rochester | 530K | NY | 17 | Harsh winters, old housing |
| Providence | 600K | RI | 18 | Old New England brick |
| Hartford | 575K | CT | 19 | Old housing, 4 seasons |
| Worcester | 550K | MA | 20 | Cold, old housing |
| Albany | 560K | NY | 21 | Cold winters, state capital |

#### Mid-Size US Metros
| City | Metro Pop | State | Priority | Why |
|------|-----------|-------|----------|-----|
| Salt Lake City | 1.2M | UT | 22 | Growing, 4 seasons |
| Milwaukee | 1.6M | WI | 23 | Brick tradition, cold |
| Oklahoma City | 1.4M | OK | 24 | Brick tradition |
| Memphis | 1.3M | TN | 25 | Old housing |

#### Canadian Mid-Size
| City | Metro Pop | Province | Priority | Notes |
|------|-----------|----------|----------|-------|
| Calgary | 1.5M | AB | 26 | Cold climate, growing |
| Edmonton | 1.4M | AB | 27 | Harsh winters |
| Quebec City | 830K | QC | 28 | Historic stone/brick, French required |
| Halifax | 465K | NS | 29 | Old port city, stone/brick |

---

### Tier 3: Higher Competition (2M-4M)
**Priority: After proving model** — Requires established domain authority.

| City | Metro Pop | State | Priority | Why |
|------|-----------|-------|----------|-----|
| Pittsburgh | 2.4M | PA | 29 | Steel city, brick tradition |
| St. Louis | 2.8M | MO | 30 | Brick city, harsh winters |
| Kansas City | 2.2M | MO/KS | 31 | 4 seasons, brick tradition |
| Cleveland | 2.0M | OH | 32 | Rust belt brick, cold |
| Cincinnati | 2.2M | OH | 33 | Old housing, 4 seasons |
| Columbus | 2.1M | OH | 34 | Growing, 4 seasons |
| Indianapolis | 2.1M | IN | 35 | 4 seasons, brick |
| Baltimore | 2.8M | MD | 36 | Historic brick rowhouses |
| Charlotte | 2.7M | NC | 37 | Growing market |
| Nashville | 2.0M | TN | 38 | Growing, brick tradition |
| Minneapolis | 3.6M | MN | 39 | Extreme cold, brick city |

#### Canadian Tier 3
| City | Metro Pop | Province | Priority | Notes |
|------|-----------|----------|----------|-------|
| Vancouver | 2.6M | BC | 40 | Milder but large market |

---

### Tier 4: Major Metros (4M+)
**Priority: Last** — Most competitive, requires strong domain authority first.

| City | Metro Pop | State | Priority | Why |
|------|-----------|-------|----------|-----|
| Detroit | 4.3M | MI | 41 | Brick city, but competitive |
| Boston | 4.9M | MA | 42 | Old brick, very competitive |
| Phoenix | 4.9M | AZ | 43 | Large but different climate |
| Philadelphia | 6.2M | PA | 44 | Brick rowhouse capital |
| Washington DC | 6.3M | DC | 45 | Historic, very competitive |
| Atlanta | 6.1M | GA | 46 | Large, competitive |
| Houston | 7.1M | TX | 47 | Huge but less masonry focus |
| Dallas | 7.6M | TX | 48 | Huge but less masonry focus |
| Chicago | 9.5M | IL | 49 | Massive brick market, very competitive |

#### Canadian Tier 4
| City | Metro Pop | Province | Priority | Notes |
|------|-----------|----------|----------|-------|
| Montreal | 4.3M | QC | 50 | Old city, French content needed |

---

### Canada Notes
- ✅ **Country auto-detected** from province code (ON, BC, AB, etc.) - no `--country` flag needed
- DataForSEO supports Canadian location codes (see `CANADA_LOCATION_CODES` in types.ts)
- **Ontario first**: Hamilton → Ottawa → Toronto (GTA corridor, same province) ✅ Complete
- Quebec cities require French-language content for SEO
- Winter damage = high demand for spring repairs (seasonal content opportunity)
- `search_terms` array tracks which discovery searches found each contractor

---

## Rollout Sequence Per City

```
WEEK 1: Discovery
├── Run all 10 search terms
├── Target: 50+ unique contractors per city
└── Store in Supabase

WEEK 2: Collection
├── Collect reviews for 20+ review contractors
├── Target: 5,000+ reviews per city
└── Store in Supabase

WEEK 3: Analysis
├── Run Claude analysis on all contractors
├── Extract themes, quotes, insights
└── Store analysis JSON

WEEK 4: Generation
├── Generate category roundups (10 per city)
├── Generate individual profiles (20+ review contractors)
└── Publish to site

ONGOING: Maintenance
├── Monthly review refresh
├── Update articles with new data
└── Track rankings and traffic
```

---

## Cost Projections Per City

### DataForSEO Pricing (Verified Dec 2024)

| API | Queue | Cost | Source |
|-----|-------|------|--------|
| Google Maps SERP | Live (6 sec) | $0.002/search | [Pricing Page](https://dataforseo.com/pricing/serp/google-maps-serp-api) |
| Google Reviews | Standard (45 min) | $0.00075/10 reviews | [Pricing Page](https://dataforseo.com/pricing/business-data/google-reviews-api) |

### Gemini 3 Flash Pricing (Dec 2025)

| Tier | Input/1M tokens | Output/1M tokens | Source |
|------|-----------------|------------------|--------|
| Standard | $0.50 | $3.00 | [Pricing Page](https://ai.google.dev/gemini-api/docs/pricing) |
| Batch | $0.25 | $1.50 | 50% discount |

### Per City Breakdown

| Phase | Calculation | Cost |
|-------|-------------|------|
| Discovery | 10 searches × $0.002 | $0.02 |
| Collection | ~5,000 reviews ÷ 10 × $0.00075 | $0.375 |
| Analysis | ~100 contractors × ~$0.02 Gemini | $2 |
| Generation | ~100 articles × ~$0.05 Gemini | $5 |
| **Per City Total** | | **~$7.40** |

> **Note**: Gemini 3 Flash is **5x cheaper** than Claude (~$7/city vs ~$35/city).

### Scale Projections

| Tier | Cities | DataForSEO | Gemini 3 Flash | Total |
|------|--------|------------|----------------|-------|
| Pilot | 1 (Denver) | ~$0.40 | ~$33 | ~$34 |
| Tier 1 | 14 (US + Ontario) | ~$6 | ~$98 | ~$104 |
| Tier 2 | 15 (Smaller + Mid) | ~$6 | ~$105 | ~$111 |
| Tier 3 | 12 (2M-4M metros) | ~$5 | ~$84 | ~$89 |
| Tier 4 | 10 (Major metros) | ~$4 | ~$70 | ~$74 |
| **Full Rollout** | **52 cities** | **~$21** | **~$390** | **~$411** |

> **Savings vs Claude**: $1,973 → $411 = **$1,562 saved (79% reduction)**

### Denver Projected Costs (Pilot)

| Phase | Gemini 3 Flash | Notes |
|-------|----------------|-------|
| Discovery | $0.02 | 10 searches completed |
| Collection | ~$3.23 | 43,034 reviews to collect |
| Analysis | ~$9.36 | 468 contractors × $0.02 |
| Generation | ~$23.40 | ~468 articles × $0.05 |
| **Denver Total** | **~$36** | Down from ~$167 with Claude |

---

## Immediate Next Steps

### Completed (Dec 31, 2025)
1. [x] Collect reviews for Denver contractors (426 contractors, 37,898 reviews)
2. [x] Discover Ontario corridor cities (Ottawa, Toronto, Hamilton)
3. [x] Fix Canadian province name expansion bug (ON → Ontario)
4. [x] Collect reviews for Ottawa contractors (249 contractors, 13,340 reviews)
5. [x] Build Gemini analysis pipeline (`npm run analyze`)
6. [x] Build article generation pipeline (`npm run generate`)
7. [x] Collect reviews for Toronto contractors (398 contractors, 18,383 reviews)
8. [x] Collect reviews for Hamilton contractors (331 contractors, 11,891 reviews)
9. [x] Complete Tier 1 search terms for all Canadian cities
10. [x] Migrate `category` to array type (supports multiple categories)
11. [x] Add `search_terms` tracking (know which searches found each contractor)
12. [x] Add country auto-detection (province code → Canada)
13. [x] Normalize all Canadian records to `country: 'Canada'`
14. [x] Discover Colorado Springs (315 contractors, Tier 1 US Priority 1)
15. [x] Discover Winnipeg (143 contractors, Tier 1 Canada Priority 14)
16. [x] Discover Boise (150 contractors, Tier 1 US Priority 2)

**Phase 2 Complete: 2,015 contractors, 65,225 reviews collected across 7 cities**

### Next Steps (Priority Order)
17. [x] Collect reviews for Colorado Springs contractors (12,742 reviews)
18. [x] Collect reviews for Winnipeg contractors (3,686 reviews)
19. [x] Collect reviews for Boise contractors (5,303 reviews)
20. [ ] Run AI analysis on all cities
21. [ ] Generate roundup articles (10 category pages per city)
22. [ ] Launch articles, monitor rankings

### Expansion (After Analysis Complete)
23. [ ] Start Tier 1 US cities (Albuquerque, Reno, Omaha, Louisville, etc.)
24. [ ] Start remaining Tier 1 Canadian cities (Calgary, Edmonton)
25. [ ] Scale to Tier 2 once rankings established

---

## Success Metrics By Phase

| Phase | Metric | Target |
|-------|--------|--------|
| Discovery | Contractors per city | 50+ |
| Collection | Reviews collected | 5,000+ per city |
| Analysis | Contractors analyzed | All with 20+ reviews |
| Generation | Articles published | 10 roundups + 50 profiles per city |
| Traffic | Monthly organic visits | 1,000+ per city after 3 months |
| Conversion | Contractor claims | 5% of featured |
