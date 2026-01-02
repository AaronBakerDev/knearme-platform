# Sitemap Migration Note

**Date:** December 12, 2024 (original). **Updated:** January 2, 2026.

## What Changed

The directory feature has been decommissioned. The sitemap index now only references the main sitemap.

### Current Approach

#### Sitemap Index: `/sitemap.xml/route.ts`
Entry point that references:
- `/sitemap-main.xml` (static pages, portfolios, contractors, learning center, tools, and city hubs)

#### Main Sitemap: `/sitemap-main.xml/route.ts`
Contains all indexed content:
- Static pages (home, contractors, etc.)
- National service landing pages
- Learning center articles
- Homeowner tools
- Portfolio projects
- Contractor profiles
- City landing pages

## robots.txt

The `robots.txt` points to `/sitemap.xml`, which remains the sitemap index.

## Rollback

If you need to rollback, recover the previous sitemap routes from git history and re-add the directory sitemap segments.
