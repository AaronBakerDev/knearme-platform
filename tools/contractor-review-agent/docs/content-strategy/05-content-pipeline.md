# Content Pipeline

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CONTENT PIPELINE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │
│  │DISCOVER │───►│ COLLECT │───►│ ANALYZE │───►│GENERATE │      │
│  │         │    │         │    │         │    │         │      │
│  │DataFor  │    │DataFor  │    │ Gemini  │    │ Gemini  │      │
│  │SEO Maps │    │SEO Revs │    │3 Flash│    │3 Flash│      │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘      │
│       │              │              │              │            │
│       ▼              ▼              ▼              ▼            │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │
│  │Supabase │    │Supabase │    │Supabase │    │ Publish │      │
│  │contractors│  │ reviews │    │analysis │    │         │      │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stage 1: Discover

**Tool**: `npm run discover`

**Purpose**: Find contractors via Google Maps search

**Input**:
- Search term (e.g., "chimney repair")
- City (e.g., "Denver")
- State (e.g., "CO")

**Output**: Contractors saved to `review_contractors` table

**Schema**:
```sql
review_contractors (
  id uuid PRIMARY KEY,
  place_id text UNIQUE,          -- Google Place ID
  cid text,                       -- Google CID (for reviews)
  business_name text,
  category text,
  city text,
  state text,
  country text,
  rating decimal,
  review_count int,
  address text,
  phone text,
  website text,
  latitude decimal,
  longitude decimal,
  is_claimed boolean,
  discovered_at timestamp,
  last_synced_at timestamp
)
```

**Deduplication**:
- Tracks searched city/term combinations in `searched_cities`
- Won't re-search unless `--force` flag used
- Contractors are upserted by `place_id` (no duplicates)

**Example**:
```bash
npm run discover -- --search "chimney repair" --city "Denver" --state "CO" --limit 50
```

---

## Stage 2: Collect

**Tool**: `npm run collect`

**Purpose**: Fetch reviews for discovered contractors

**Input**:
- Contractor ID (single) or `--all` flag
- Max reviews per contractor (default 300)

**Output**: Reviews saved to `review_data` table

**Schema**:
```sql
review_data (
  id uuid PRIMARY KEY,
  contractor_id uuid REFERENCES review_contractors(id),
  review_id text,                 -- Google's review ID
  review_text text,
  rating int,
  reviewer_name text,
  review_date timestamp,
  owner_response text,
  fetched_at timestamp,
  UNIQUE(contractor_id, review_id)
)
```

**API Details**:
- Uses DataForSEO Business Data API
- Async task workflow (POST → poll → GET)
- Requires CID (not place_id) for reliable results
- Location format: "City,State,Country" with full names

**Example**:
```bash
# Single contractor
npm run collect -- --contractor-id "uuid-here"

# All contractors with 10+ reviews
npm run collect -- --all --min-reviews 10
```

---

## Stage 3: Analyze (Complete)

**Tool**: `npm run analyze`

**Purpose**: Extract themes and insights from reviews using Gemini 3 Flash

**Input**: Reviews from `review_data` for a contractor

**Output**: Analysis saved to `review_analysis` table

**AI Model**: `gemini-3-flash-preview`
- **Why**: 5-6x cheaper than Claude, excellent reasoning, 1M token context
- **Pricing**: ~$0.10/1M input, ~$0.40/1M output

**Schema**:
```sql
review_analysis (
  id uuid PRIMARY KEY,
  contractor_id uuid REFERENCES review_contractors(id),
  analysis_json jsonb,           -- Structured analysis
  model_used text,               -- e.g., "gemini-3-flash-preview"
  tokens_used int,               -- For cost tracking
  analyzed_at timestamp,
  UNIQUE(contractor_id)
)
```

**Analysis Structure** (in `analysis_json`):
```json
{
  "summary": "One-paragraph overall assessment",
  "strengths": [
    {
      "theme": "Communication",
      "description": "Customers consistently praise...",
      "evidence": ["quote 1", "quote 2"],
      "frequency": 0.45
    }
  ],
  "weaknesses": [
    {
      "theme": "Pricing Transparency",
      "description": "Some customers mentioned...",
      "evidence": ["quote"],
      "frequency": 0.12
    }
  ],
  "best_for": ["emergency repairs", "residential projects"],
  "project_types": ["chimney", "brick", "tuckpointing"],
  "price_mentions": [
    {"text": "$1,500 for chimney cap", "date": "2024-10"}
  ],
  "response_quality": "Professional and timely",
  "sentiment_trend": "stable"
}
```

**Gemini Prompt** (draft):
```
Analyze these customer reviews for [Business Name], a [category]
contractor in [City], [State].

Extract:
1. Top 3-5 themes customers praise (with quotes)
2. Any patterns of criticism (with quotes)
3. What type of customer/project this contractor is best for
4. Any mentions of pricing
5. How the owner responds to reviews (if applicable)
6. Overall sentiment trend (improving, stable, declining)

Be specific and cite actual review quotes as evidence.

Reviews:
[reviews text]
```

**Batch Processing**: Use Gemini Batch API for 50% cost savings on non-urgent analysis.

---

## Stage 4: Generate (Complete)

**Tool**: `npm run generate`

**Purpose**: Create article content from analysis

**Input**: Analysis from `review_analysis` + contractor metadata

**Output**: Articles saved to `review_articles` table

**AI Model**: `gemini-3-flash-preview`
- **Pricing**: ~$0.10/1M input, ~$0.40/1M output

**Schema**:
```sql
review_articles (
  id uuid PRIMARY KEY,
  contractor_id uuid REFERENCES review_contractors(id),
  title text,
  slug text UNIQUE,
  content_markdown text,
  metadata_json jsonb,           -- SEO metadata
  model_used text,               -- e.g., "gemini-3-flash-preview"
  tokens_used int,               -- For cost tracking
  status text,                   -- draft, published
  generated_at timestamp
)
```

**Article Types Generated**:

| Type | Trigger | Template |
|------|---------|----------|
| Individual Profile | Any analyzed contractor | `templates/profile.md` |
| Category Roundup | 5+ analyzed in category | `templates/roundup.md` |

> **Note**: Comparison content is handled by an interactive tool, not static articles.
> See [06-comparison-tool.md](./06-comparison-tool.md)

---

## Automation Schedule

### Daily
- Check for new reviews on published contractors
- Update analyses if significant changes

### Weekly
- Run discover on new cities
- Collect reviews for new contractors
- Generate articles for newly analyzed contractors

### Monthly
- Full re-analysis of all contractors
- Refresh all published articles
- Report on traffic/conversions

---

## Cost Estimation

### DataForSEO Costs (Verified Dec 2024)

| API Call | Cost | Example | Total |
|----------|------|---------|-------|
| Maps Search (Live) | $0.002/search | 10 searches/city | $0.02/city |
| Reviews Fetch (Standard) | $0.00075/10 reviews | 5,000 reviews/city | $0.375/city |

**Note**: DataForSEO is very cheap. Reviews are cached - only fetch once per contractor, refresh monthly.

> **Source**: [Google Maps SERP Pricing](https://dataforseo.com/pricing/serp/google-maps-serp-api) | [Google Reviews Pricing](https://dataforseo.com/pricing/business-data/google-reviews-api)

### Gemini 3 Flash Costs (Dec 2025)

| Tier | Input/1M tokens | Output/1M tokens | Notes |
|------|-----------------|------------------|-------|
| Standard | $0.50 | $3.00 | Real-time processing |
| Batch | $0.25 | $1.50 | 50% discount, async |
| Free | Free | Free | Rate limited |

> **Source**: [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)

### AI Cost Per City (Gemini 3 Flash)

| Operation | Est. Cost | Volume | Total |
|-----------|-----------|--------|-------|
| Analyze | ~$0.02/contractor | 100 contractors | **$2/city** |
| Generate | ~$0.05/article | 100 articles | **$5/city** |

**Estimated AI Cost**: ~$7 per city (vs ~$35 with Claude = **80% savings**)

### Total Pipeline Cost Per City

| Component | One-Time | Notes |
|-----------|----------|-------|
| DataForSEO | ~$0.40 | Discovery + Collection |
| Gemini 3 Flash | ~$7 | Analysis + Generation |
| **Per City** | **~$7.40** | 5x cheaper than Claude |

### Infrastructure (Monthly)

| Component | Monthly | Notes |
|-----------|---------|-------|
| Supabase | $25 | Pro plan |
| Hosting | $20 | Vercel Pro |
| Review refresh | ~$1 | Monthly AI updates |
| **Total Infra** | ~$46/month | Fixed costs |

### Why Gemini 3 Flash

| Factor | Gemini 3 Flash | Claude Sonnet |
|--------|----------------|---------------|
| Input cost | $0.50/1M | $3.00/1M |
| Output cost | $3.00/1M | $15.00/1M |
| Context window | 1M tokens | 200K tokens |
| Reasoning | 90.4% GPQA | Comparable |
| Speed | 3x faster | - |
| Batch discount | 50% off | Not available |

> **Decision**: Gemini 3 Flash offers comparable quality at 5-6x lower cost.
> Model ID: `gemini-3-flash-preview`

---

## Implementation Roadmap

### Phase 1: Collection (Current)
- [x] Discover script working
- [x] Collect script working
- [x] Deduplication in place
- [ ] Collect reviews for all Denver 20+ review contractors

### Phase 2: Analysis (Complete)
- [x] Create analyze script
- [x] Gemini 3 Flash integration for theme extraction
- [x] Store analysis in Supabase
- [x] Test on 10 contractors

### Phase 3: Generation (Complete)
- [x] Create article templates
- [x] Create generate script
- [x] Gemini 3 Flash integration for article writing
- [x] Human review workflow

### Phase 4: Publishing
- [ ] Build article site (Next.js or Astro)
- [ ] SEO infrastructure (sitemap, schema)
- [ ] Deploy to production
- [ ] Submit to Google Search Console

### Phase 5: Conversion
- [ ] Claim profile flow
- [ ] Contractor dashboard
- [ ] Outreach automation
- [ ] Premium tier

---

## File Structure

```
contractor-review-agent/
├── src/
│   ├── scripts/
│   │   ├── discover.ts      ✅ Done
│   │   ├── collect.ts       ✅ Done
│   │   ├── analyze.ts       ✅ Done
│   │   └── generate.ts      ✅ Done
│   │
│   ├── lib/
│   │   ├── dataforseo.ts    ✅ Done
│   │   ├── supabase.ts      ✅ Done
│   │   ├── gemini.ts        ✅ Done (Gemini 3 Flash)
│   │   └── types.ts         ✅ Done
│   │
│   └── templates/
│       ├── profile.md       🔲 Planned
│       ├── roundup.md       🔲 Planned
│       └── comparison.md    🔲 Planned
│
├── supabase/
│   └── migrations/          ✅ Done
│
└── docs/
    └── content-strategy/    ✅ Done (this folder)
```

---

## Quality Gates

Before publishing any article:

| Check | Method | Threshold |
|-------|--------|-----------|
| Factual accuracy | Review quote verification | 100% quotes exist |
| Readability | Hemingway score | Grade 8 or below |
| SEO requirements | Checklist | All meta tags present |
| Legal review | Manual | No defamatory content |
| Freshness | Date check | Reviews within 6 months |
