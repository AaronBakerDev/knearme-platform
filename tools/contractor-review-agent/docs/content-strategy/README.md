# Content Strategy Documentation

This folder outlines the content strategy for the Contractor Review Agent - a system that discovers contractors, analyzes their reviews, and generates SEO-optimized articles to bootstrap a contractor marketplace.

## Documents

| Document | Purpose |
|----------|---------|
| [01-strategy-overview.md](./01-strategy-overview.md) | The marketplace cold-start solution |
| [02-article-types.md](./02-article-types.md) | Article formats, templates, and examples |
| [03-seo-targeting.md](./03-seo-targeting.md) | Keyword strategy and URL structure |
| [04-contractor-funnel.md](./04-contractor-funnel.md) | How contractors discover us and convert |
| [05-content-pipeline.md](./05-content-pipeline.md) | Technical pipeline from data to published article |
| [06-comparison-tool.md](./06-comparison-tool.md) | Interactive comparison tool (replaces static comparison articles) |
| [07-rollout-plan.md](./07-rollout-plan.md) | City and service expansion roadmap |

## Quick Context

### The Problem We're Solving
Marketplaces face a chicken-and-egg problem:
- Need contractors to attract homeowners
- Need homeowners to attract contractors

### Our Solution
**Review-based articles** that:
1. Provide unique value to homeowners (aggregated review insights)
2. Feature contractors positively (free marketing for them)
3. Rank for local service searches (organic traffic)
4. Convert contractors to paying customers when they see the value

### Current Data (Denver Pilot)

| Metric | Count |
|--------|-------|
| Contractors discovered | 468 |
| With 10+ reviews | 319 |
| With 20+ reviews | 258 |
| Total reviews available | 43,034 |
| Search terms indexed | 10 |

## Related Files

- `/src/scripts/discover.ts` - Contractor discovery via DataForSEO
- `/src/scripts/collect.ts` - Review collection
- `/src/lib/supabase.ts` - Database operations
- `/supabase/migrations/` - Database schema
