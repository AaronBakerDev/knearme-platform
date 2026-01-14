# KnearMe Repository Comparison Guide

Status: Historical (legacy directories removed from workspace on 2026-01-05)
Generated: December 6, 2025
Archived reference: see `.agent/System/legacy_systems_reference.md` and `.agent/System/legacy_systems_inventory.md`.

This guide captured the state of legacy repositories before decommissioning and is retained for reference only.

---

## Quick Summary

Note: Recommendations below are historical; the corresponding repos are no longer present in the workspace.

### Directory Platforms (Contractor Directory)

| Repository | Score | Status | Best For |
|------------|-------|--------|----------|
| **supabase** | 9/10 | Most Recent (Nov 2025) | Production deployment |
| **v4** | 8/10 | Clean codebase | Future refactoring base |
| **astro-main** | 7/10 | Best SEO | SEO-first approach |
| **mvp** | 6/10 | Prototype | Rapid feature testing |

**Recommendation:** Use **supabase** as primary, adopt SEO features from **astro-main**

### Rank Tracking

| Repository | Score | Status | Best For |
|------------|-------|--------|----------|
| **local-beacon** | 8.7/10 | Feature-rich | Full platform with AI |
| **next-tracker** | 6.4/10 | Focused | Simple rank tracking SaaS |

**Recommendation:** **local-beacon** is significantly more complete with AI features

---

## Directory Platforms Detailed Comparison

### Tech Stack

| Feature | astro-main | supabase | mvp | v4 |
|---------|-----------|----------|-----|-----|
| Framework | Astro 4.0 | Next.js 14.2 | Vite + React 18 | Vite + React 18 |
| Database | Cloudflare D1 | Supabase PostgreSQL | Supabase | Neon PostgreSQL |
| ORM | Native SQL | Drizzle ORM | TypeScript Interfaces | Drizzle ORM |
| Auth | Cloudflare Access | Supabase Auth | Supabase Auth | Passport + OIDC |
| UI Library | Tailwind CSS | shadcn/ui + Radix | shadcn/ui + Radix | shadcn/ui + Radix |
| Deployment | Cloudflare Pages | Vercel | Vercel | Vercel |

### Feature Matrix

| Feature | astro-main | supabase | mvp | v4 |
|---------|-----------|----------|-----|-----|
| Search Functionality | Advanced | Basic | Basic | Basic |
| Contractor Profiles | Yes | Full | Full | Full |
| Project Portfolio | No | Yes (Images) | Yes (Gallery) | Yes (Images) |
| CMS/Resources | Blog | Full CMS | Articles | Full CMS |
| Claim System | No | Yes (Email+Manual) | No | Yes |
| Sitemap | Yes | No | No | No |
| Robots.txt | Yes | No | Yes | No |
| Structured Data | Full Schema.org | Limited | Full schemas | Limited |
| Test Coverage | 7 test files | None | None | None |

### Code Metrics

| Metric | astro-main | supabase | mvp | v4 |
|--------|-----------|----------|-----|-----|
| Components | 53 | 145 | 143 | 67 |
| Pages | 20 | 14 | 18 | 17 |
| Lines of Code | 12,655 | 9,583 | 17,102 | 9,706 |
| Repo Size | 582M | 923M | 290M | 21M |
| Last Updated | Mar 2025 | Oct 2025 | Apr 2025 | Oct 2025 |

### Completeness Scores

| Repository | Score | Rationale |
|------------|-------|-----------|
| **supabase** | 9/10 | Full feature set, modern auth, complete database schema, claim system |
| **v4** | 8/10 | Clean architecture, feature parity, smallest codebase (needs auth migration) |
| **astro-main** | 7/10 | Excellent SEO & testing, missing portfolio and claim system |
| **mvp** | 6/10 | Good UI/UX, over-engineered, no claim system |

---

## Rank Tracking Detailed Comparison

### Tech Stack

| Feature | next-tracker | local-beacon |
|---------|--------------|--------------|
| Framework | Next.js 14 (App Router) | Vite + React 18 |
| Database | Supabase PostgreSQL | Supabase PostgreSQL + PostGIS |
| Architecture | Single app | Multi-app monorepo (3 apps) |
| AI Integration | None | OpenAI + Anthropic |
| Edge Functions | Next.js API routes | 9+ Supabase Edge Functions |
| UI Library | Custom components | shadcn/ui + Recharts |
| Charting | Minimal | Recharts (full) |

### Feature Matrix

| Feature | next-tracker | local-beacon |
|---------|--------------|--------------|
| Keyword Tracking | Basic | Advanced + AI suggestions |
| Location Tracking | Basic (lat/lng) | PostGIS + Mapbox autocomplete |
| Competitor Analysis | Basic detection | AI-powered gap analysis |
| Historical Trends | Basic storage | Full visualization + predictions |
| AI Recommendations | No | Full (OpenAI + Anthropic) |
| Quick Wins | No | Yes (auto-generated suggestions) |
| Report Generation | Minimal | Full with date ranges |
| SERP Caching | No | Yes |
| Rate Limiting | No | Yes |
| Resource Center | Yes (guides/tutorials) | No (different focus) |

### Scoring by Category

| Category | next-tracker | local-beacon |
|----------|--------------|--------------|
| Core Rank Tracking | 7/10 | 9/10 |
| SERP API Integration | 6/10 | 9/10 |
| Database Design | 7/10 | 9/10 |
| AI/ML Features | 0/10 | 10/10 |
| Edge Functions | 5/10 | 10/10 |
| UI/Dashboard | 6/10 | 9/10 |
| Testing | 7/10 | 8/10 |
| Pricing/Subscriptions | 8/10 | 6/10 |
| **Overall** | **6.4/10** | **8.7/10** |

### Code Metrics

| Metric | next-tracker | local-beacon |
|--------|--------------|--------------|
| Source Files | 204 TS/TSX | 359 TS/TSX |
| UI Components | 82 | ~90 |
| Test Files | 34 | 19 |
| Repo Size | 796M | 2.7G |
| Last Commit | June 4, 2025 | June 11, 2025 |

---

## Migration Recommendations

### For Directory Platforms

**Recommended: Modernize supabase**

1. Add sitemap.xml generation (copy from astro-main)
2. Add robots.txt (copy from astro-main/mvp)
3. Add test suite (adapt from astro-main)
4. Optimize bundle size
5. Consider adopting v4's cleaner code organization

**Alternative: Modernize v4**

1. Replace Replit OIDC with Supabase Auth
2. Add sitemap generation from astro-main
3. Add test suite from astro-main
4. Result: Best of all worlds - clean codebase, modern auth

### For Rank Tracking

**Recommended: Use local-beacon**

local-beacon is significantly more complete:
- AI-powered recommendations (OpenAI + Anthropic)
- Quick wins service
- Advanced analytics
- SERP caching and rate limiting
- PostGIS for geospatial queries

**Consider merging from next-tracker:**
- Resource center (guides/tutorials)
- Cleaner subscription implementation
- More unit tests

---

## Critical Issues to Address

### Directory Platforms

| Repo | Critical Issue | Priority |
|------|----------------|----------|
| v4 | Replit OIDC auth needs migration to Supabase Auth | HIGH |
| supabase | No sitemap or robots.txt | MEDIUM |
| astro-main | Missing claim system and project portfolio | MEDIUM |
| mvp | No claim system, over-engineered | LOW |

### Rank Tracking

| Repo | Critical Issue | Priority |
|------|----------------|----------|
| next-tracker | No AI features, basic SERP integration | HIGH |
| local-beacon | Subscription implementation less documented | MEDIUM |
| local-beacon | Large repo size (2.7G) needs cleanup | LOW |

---

## File Locations (historical; removed from workspace)

### Directory Platforms (removed 2026-01-05)
- `directory-platforms/astro-main/` - Astro + Cloudflare (582M)
- `directory-platforms/supabase/` - React + Supabase (923M)
- `directory-platforms/mvp/` - Vite + React MVP (290M)
- `directory-platforms/v4/` - Vite + React v4 (21M)

### Rank Tracking
- `rank-tracking/next-tracker/` - Next.js tracker (796M)
- `rank-tracking/local-beacon/` - Full platform (2.7G)

### Documentation
- `docs/content-planning/` - Content strategy
- `docs/business/` - Business planning
- `docs/agents/` - Agent configurations

---

## Next Steps

1. **Choose primary directory platform** (recommended: supabase)
2. **Choose rank tracking platform** (recommended: local-beacon)
3. **Archive unused repos** after feature extraction
4. **Merge unique features** from other repos into chosen platforms
5. **Add missing critical features** (tests, SEO, auth migration)

---

## Disk Space Summary

| Category | Size |
|----------|------|
| Directory Platforms | 1.8 GB |
| Rank Tracking | 3.5 GB |
| Documentation | ~500 KB |
| **Total** | ~5.3 GB |

After consolidation decision, you can archive or delete unused repos to reclaim 2-4 GB.
