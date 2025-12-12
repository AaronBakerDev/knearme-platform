# Sitemap Migration Note

**Date:** December 12, 2024

## What Changed

The original `sitemap.ts` file has been replaced with a **segmented sitemap architecture** to handle the growing number of directory listings (34,809+ businesses across 613 cities).

### Old Approach (sitemap.ts - now .backup)
- Single sitemap file returning all URLs
- Would eventually hit Google's 50,000 URL limit
- Expensive to generate (queries all data on every request)
- Didn't scale with directory growth

### New Approach (Segmented Sitemaps)

#### Sitemap Index: `/sitemap.xml/route.ts`
Entry point that references all sitemap segments:
- `/sitemap-main.xml` (static pages, portfolios)
- `/sitemap-directory-index.xml` (state/city/category pages)
- `/sitemap-directory-[state].xml` (per-state business listings)

#### Main Sitemap: `/sitemap-main.xml/route.ts`
Contains non-directory content:
- Static pages (home, contractors, etc.)
- National service landing pages
- Learning center articles
- Homeowner tools
- Portfolio projects
- Contractor profiles
- City landing pages

#### Directory Index: `/sitemap-directory-index.xml/route.ts`
Contains directory navigation pages (~3,000 URLs):
- `/find` (directory landing)
- `/find/{state}` (state pages)
- `/find/{state}/{city}` (city pages)
- `/find/{state}/{city}/{category}` (category pages)

#### Per-State Business Sitemaps: `/sitemap-directory-[state].xml/route.ts`
Dynamic route generating one sitemap per state with all business listings:
- `/sitemap-directory-colorado.xml`
- `/sitemap-directory-texas.xml`
- etc.

Each state sitemap contains up to ~10,000 business detail URLs, well under the 50k limit.

## Benefits

1. **Scalability**: Can handle millions of businesses by further segmenting if needed
2. **Performance**: Each sitemap is cached independently (24 hours)
3. **SEO**: Proper sitemap index structure follows Google best practices
4. **Maintainability**: Easy to add/remove segments as content grows

## robots.txt

The `robots.txt` still points to `/sitemap.xml` which now serves as the sitemap index.

## Rollback

If you need to rollback, rename `sitemap.ts.backup` back to `sitemap.ts` and delete the new route files. However, the new approach is strongly recommended for production.
