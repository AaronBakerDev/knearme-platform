# Directory Decommission Inventory

**Date:** January 2, 2026

## Summary

The directory feature (public browsing of businesses sourced from legacy places data) has been decommissioned. This doc captures the full inventory of routes, UI, data, and SEO wiring so we can safely remove it without breaking unrelated portfolio pages or hubs.

## Public URLs (former directory surface)

- `/find` (directory landing)
- `/find/{state}` (state hub)
- `/find/{state}/{city}` (city hub)
- `/find/{state}/{city}/{category}` (category listing)
- `/find/{state}/{city}/{category}/{slug}` (business detail)

## API Routes

- `src/app/api/directory/search/route.ts` (autocomplete search)
- `src/app/api/directory/categories/route.ts` (category stats per city)

## Data Layer + Types

- `src/lib/data/directory.ts` (directory queries)
- `src/types/directory.ts` (DirectoryPlace, StateStats, CityStats, CategoryStats)
- `src/lib/constants/directory-categories.ts` (category metadata)

## UI Components

All lived under `src/components/directory/`:

- `BusinessCard.tsx`
- `CategoryCard.tsx`
- `CityGrid.tsx`
- `DirectoryBreadcrumbs.tsx`
- `DirectoryFilters.tsx`
- `DirectorySearch.tsx`
- `NearbyBusinesses.tsx`
- `Pagination.tsx`
- `PaginationClient.tsx`
- `RelatedCategories.tsx`
- `StarRating.tsx`
- `StateGrid.tsx`
- `StaticMap.tsx`
- `index.ts`
- Docs: `README.md`, `COMPONENT-HIERARCHY.md`

## SEO + Sitemap Wiring

- `src/app/sitemap.xml/route.ts` (previously referenced directory sitemaps)
- `src/app/sitemap-directory-index.xml/route.ts` (directory nav URLs)
- `src/app/sitemap-directory-[state].xml/route.ts` (business listings)
- `src/lib/seo/structured-data.ts` (directory schema helpers)
- `src/app/sitemap.ts.README.md` (described segmented directory sitemaps)

## Database Artifacts (legacy)

Materialized views and refresh function created for directory browsing:

- `supabase/migrations/008_create_directory_views.sql`
  - `directory_places`
  - `directory_state_stats`
  - `directory_city_stats`
  - `refresh_directory_views()` (cron refresh)

Places/search tables and public read policies:

- `supabase/migrations/017_enable_rls_places.sql`

These remain in the database but are no longer referenced by the app.

## Decommission Actions (this change set)

- Removed `/find` routes and layout.
- Removed directory API routes and UI components.
- Removed directory data layer, types, and category constants.
- Removed directory sitemaps and sitemap index entries.
- Updated `/contractors` landing to point at portfolio hubs by city and service.
- Updated sitemap documentation to reflect the simplified structure.

## Safety Checks

Use these to confirm the directory is fully removed:

1. `rg -n "/find" src` returns no results.
2. `rg -n "directory" src` returns no feature references (content/learn directory is ok).
3. `/sitemap.xml` only references `/sitemap-main.xml`.
4. `/contractors` loads and links to active portfolio hubs.

## Optional Follow-ups

- Remove any cron jobs or scripts that refresh `refresh_directory_views()`.
- Drop unused materialized views if we decide to remove legacy directory data entirely.
