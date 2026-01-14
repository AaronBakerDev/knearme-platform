# CLAUDE.md

This file provides guidance to Claude Code when working with the contractor-review-agent project.

## Project Overview

AI-powered contractor review analyzer and content generator. This agent discovers contractors via Google Maps, collects their reviews, analyzes sentiment/themes using Gemini 3 Flash, and generates SEO-optimized blog articles about each contractor.

**Database Status:** Schema already applied to Supabase (migration `001_review_agent_schema.sql`).

**Use Case:** Generate authentic content about contractors based on what real customers are saying about them.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 1: AUTOMATED COLLECTION                      │
│                              (Scripts / Scheduled Jobs)                       │
└─────────────────────────────────────────────────────────────────────────────┘

   DataForSEO          DataForSEO           Supabase
   Google Maps    ───▶  Reviews API   ───▶   Storage
   (discover)          (collect)            (sync)

┌─────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 2: INTERACTIVE SYNTHESIS                        │
│                           (Claude Code + Subagents)                          │
└─────────────────────────────────────────────────────────────────────────────┘

   /review-analyze      /review-generate     /review-publish
   (Gemini analysis) ─▶ (Article writing) ─▶ (Save to Supabase)
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your DataForSEO and Supabase credentials

# 3. Database migrations (already applied)
# Schema is live in Supabase - no action needed

# 4. Discover contractors
npm run discover -- --search "masonry contractors" --city "Denver" --limit 5

# 5. Collect reviews
npm run collect -- --all --min-reviews 10

# 6. Interactive analysis (in Claude Code)
# Use /review-analyze or /review-workflow commands
```

## Commands

### Automation Scripts

```bash
# Discover contractors in a location
npm run discover -- --search "masonry contractors" --city "Denver, CO" --limit 10

# Collect reviews for all discovered contractors
npm run collect -- --all

# Collect reviews for a specific contractor
npm run collect -- --contractor-id "uuid-here"

# Run full pipeline
npm run pipeline -- --search "masonry" --city "Denver" --limit 5
```

### Claude Code Skills

```bash
# Discover contractors (wrapper around npm run discover)
/review-discover "masonry contractors" "Denver CO"

# Collect reviews for a contractor
/review-collect "ABC Masonry"

# Analyze reviews using Claude
/review-analyze "ABC Masonry"

# Generate article from analysis
/review-generate "ABC Masonry"

# Full workflow
/review-workflow "masonry" "Denver CO" --limit 3
```

## Project Structure

```
contractor-review-agent/
├── CLAUDE.md              # This file
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── .env.example           # Environment template
│
├── src/
│   ├── scripts/           # CLI automation scripts
│   │   ├── discover.ts    # Find contractors via Google Maps
│   │   ├── collect.ts     # Fetch reviews via Reviews API
│   │   ├── sync.ts        # Supabase sync utilities
│   │   └── run-pipeline.ts # Orchestrate full workflow
│   │
│   ├── lib/               # Shared libraries
│   │   ├── dataforseo.ts  # DataForSEO API client
│   │   ├── supabase.ts    # Supabase client
│   │   └── types.ts       # TypeScript definitions
│   │
│   └── agents/            # Subagent definitions
│       ├── analyze-agent.ts
│       └── article-agent.ts
│
├── prompts/               # AI prompt templates
│   ├── analyze-reviews.md # Review analysis prompt
│   └── generate-article.md # Article generation prompt
│
├── .claude/
│   └── skills/
│       └── review-workflow/
│           └── SKILL.md   # Claude Code skill definition
│
├── supabase/
│   └── migrations/        # Database schema
│       └── 001_review_agent_schema.sql
│
└── output/                # Generated articles (local)
```

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `review_contractors` | Discovered contractor profiles |
| `review_data` | Raw review text and ratings |
| `review_analysis` | Gemini analysis results (JSONB) |
| `review_articles` | Generated articles + metadata |

### Key Fields

**review_contractors:**
- `place_id` - Google Place ID (unique identifier)
- `cid` - Google CID (used for reviews API)
- `business_name`, `rating`, `review_count`
- `city`, `state`, `country`

**review_data:**
- `contractor_id` - FK to review_contractors
- `review_text` - Full review content
- `rating` - 1-5 stars
- `owner_response` - Business response if any

## API Costs

| Service | Endpoint | Cost |
|---------|----------|------|
| DataForSEO | Google Maps | ~$0.001/request |
| DataForSEO | Google Reviews | ~$0.00075/10 reviews |
| Gemini | Analysis + Generation | ~$0.02/contractor (3 Flash) |

**Example:** 5 contractors with ~100 reviews each ≈ $0.05 total

## Environment Variables

```bash
# DataForSEO (required)
DATAFORSEO_LOGIN=your-email@example.com
DATAFORSEO_PASSWORD=your-api-password

# Supabase (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional
DEFAULT_LOCATION=us
DEFAULT_LOCATION_CODE=2840
```

## Workflow Details

### 1. Discovery Phase

The discover script searches Google Maps for contractors matching your criteria:

```typescript
// Example: Find masonry contractors in Denver
const results = await client.getGoogleMapsResults(
  "masonry contractors Denver CO",
  1014395, // Denver location code
  20       // max results
);
```

Returns: business name, rating, review count, address, phone, website, place_id, cid

### 2. Collection Phase

For each discovered contractor, fetch full review text:

```typescript
// Uses place_id or cid from discovery
const reviews = await client.getGoogleReviews(placeId, cid, 100);
```

Returns: review_text, rating, reviewer_name, timestamp, owner_response

### 3. Analysis Phase (Automated)

Gemini 3 Flash (model: `gemini-3-flash-preview`) analyzes the reviews and extracts:
- Overall sentiment
- Positive/negative themes with examples
- Notable quotes worth featuring
- Red flags or concerns
- Key strengths
- Recommendations

Output is stored as JSON in `review_analysis` table.

### 4. Generation Phase (Automated)

Gemini 3 Flash generates an article based on the analysis:
- 800-1200 words
- SEO-optimized title and meta
- Includes actual customer quotes
- Balanced and honest tone
- Structured with clear sections

Output: Markdown + JSON metadata in `review_articles` table.

## Integration with knearme-portfolio

This agent is a sibling project to knearme-portfolio. Potential integrations:

1. **Shared Supabase** - Use same project for both
2. **Article Import** - Generated articles can be imported as blog posts
3. **Contractor Profiles** - Analysis can enrich contractor listings

## Troubleshooting

### DataForSEO Errors

```
Error: 40501 - Location code not found
```
→ Use national location code (2840 for US) instead of city-specific

```
Error: 20000 - No results
```
→ Try broader search terms or different location

### Supabase Errors

```
Error: relation "review_contractors" does not exist
```
→ Schema should already be applied. Check Supabase dashboard or re-run `supabase/migrations/001_review_agent_schema.sql`

### Rate Limits

- DataForSEO: 2000 requests/minute
- Add delays between batch operations if hitting limits

## Development

```bash
# Type check
npm run typecheck

# Run individual scripts
npx tsx src/scripts/discover.ts --help

# Debug mode (verbose output)
DEBUG=true npm run discover -- --search "test" --city "Denver"
```

## Related Documentation

- **DataForSEO Google Maps API**: https://docs.dataforseo.com/v3/serp/google/maps/
- **DataForSEO Reviews API**: https://docs.dataforseo.com/v3/business_data/google/reviews/
- **Supabase JS Client**: https://supabase.com/docs/reference/javascript/
- **Parent Workspace**: See `/Users/aaronbaker/knearme-workspace/CLAUDE.md`
