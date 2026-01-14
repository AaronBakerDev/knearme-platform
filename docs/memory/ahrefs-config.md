# Ahrefs Configuration – knearme.co (Updated Dec 12, 2025)

## Project Overview

- **Projects:** Two appear under the workspace (“Knearme” – health score pending, and the legacy “Knearme” using the older FixMyBrick experiments). The newly created project targets `http + https` for `*.knearme.co/*` with all subdomains consolidated under one scope.
- **Verification:** Ownership confirmed via the Ahrefs Web Analytics script. DNS TXT fallback token (if Cloudflare needs manual verification) is `ahrefs-site-verification_bd63a9e78c7f2dc6cf0e442d1f3cc27a6872a4f33c2da524bffd80608e40785a`.
- **Baseline metrics (Dec 12, 2025):** DR 0, Referring Domains 0, Organic Keywords 0, Organic Traffic 0. Web Analytics already shows a trickle of Total Visitors (6 in the last 30 days) from the client-side script.

## Site Audit Settings

- **Schedule:** Weekly crawl every **Monday between 06:00–06:59 AM (GMT-07:00 Mountain Time – Denver)** so reports are ready before the U.S. workday.
- **URL Sources:**
  - Website (http + https, subdomains)
  - Auto-detected sitemaps
  - **Specific sitemaps:**  
    `https://knearme.co/sitemap.xml`  
    `https://knearme.co/sitemap-main.xml`  
    `https://knearme.co/sitemap-directory-index.xml`
- **Crawl Settings Tweaks:**
  - Check images/CSS/JS (defaults stay on to ensure Next.js assets resolve).
  - **Check HTTP status of external links** – enabled to surface broken outbound references.
  - **Remove URL parameters** – enabled to reduce duplicate crawl paths (useful for marketing querystrings).
  - JS execution left off (Next.js renders server-side; enabling later if client-only widgets appear).
  - Limits remain at 10,000 internal pages / 48h duration / depth 16, which covers the current footprint.
  - Robots.txt honored (ownership allows increasing crawl speed later if needed).
- **Next Action:** Kick off the first crawl from Site Audit → “Run crawl” so the Health Score widget stops showing “Get started”.

## Site Audit Status (Dec 12, 2025)

- **New verified project (ID 9196092)** – Crawl started **1:07 PM MT** and finished at **1:13 PM MT** with an **88 % health score**. Coverage totals: 42 URLs crawled, 9 internal pages, 29 static resources, and just **5 internal URLs flagged with errors**. Top issues were small in scope (2× 404/4XX pages, 2× broken links, 3× redirect quirks, and a handful of metadata gaps like 3 Open Graph warnings and 3 indexable pages missing from the sitemap). Treat this as our “clean” baseline going forward.
- **Legacy project (ID 9193744)** – Last crawl completed **Dec 12, 2025 at 12:26 AM MT**, covering 203 total URLs (128 internal pages, 72 static resources) with **112 internal URLs returning errors** and a **45 % health score**.

### High-priority remediation items (legacy crawl)

1. **Canonical + HTTPS drift:** 91 pages expose canonicals that point from HTTPS back to HTTP. Update the Next.js metadata helpers (or raw `<link rel=\"canonical\">` tags) so every marketing page self-canonicals to the HTTPS version.
2. **Broken content & 4XXs:** 18 URLs resolve to 404/4XX, another 27 pages still link to broken targets, and 64 pages (plus 17 image resources) contain broken images. Audit `/public` assets and reroute/redirect any retired slugs to close the loop. _(New crawl shows only 2 broken URLs in the verified project, so fixes here will preserve that cleaner baseline.)_
3. **Metadata debt:** 58 meta descriptions are too long, 34 titles exceed recommended length, and 6 descriptions are too short. Normalize copy in `src/app/(marketing)` head configs so SERP snippets stay within Google’s pixel widths.
4. **Internal linking + sitemap coverage:** 35 pages only have one dofollow internal link (9 indexable, 26 non-indexable) and 16 indexable URLs are missing from the sitemap set. Strengthen hub → spoke linking and ensure each live route is emitted in `sitemap-*.xml`. _(Verified project still shows 2 “single-link” pages and 3 sitemap omissions—likely root causes overlap.)_
5. **Structured data + IndexNow:** 12 pages trip Google rich-result validation errors and 5 pages hit schema.org issues—likely due to outdated `Organization`/`LocalBusiness` JSON-LD payloads. 16 URLs are also flagged for IndexNow submission once fixes deploy. _(New crawl still flags 3 “Pages to submit to IndexNow,” so queue once refreshed.)_
6. **Miscellaneous performance:** Single instances of slow page, oversized CSS, and redirect chains surfaced; capture these in the performance backlog so Lighthouse budgets remain green post-launch. _(Verified crawl reported 1 CSS file >300 KB and one redirect chain—triage alongside the larger perf tasks.)_

## Rank Tracker Configuration

- **Keywords:** 20 seed queries covering core masonry + portfolio positioning. Examples: `masonry contractors near me`, `tuckpointing services`, `digital masonry portfolio`, `denver masonry contractor`, `brick repair phoenix`, etc. (Full list stored in Rank Tracker → Overview.)
- **Locations:**  
  1. United States (national)  
  2. Denver, Colorado (English)  
  3. Phoenix, Arizona (English)  
  4. Dallas, Texas (English)  
  → **80 tracked keywords total** (20 per location). This matches the marketing funnel focus cities from the current GTM plan.
- **Notes:** Once the first sync completes, enable email alerts for significant swings and star the highest-intent keywords so automated reports highlight them.

## Competitors (Rank Tracker + Dashboard)

Tracked for keyword and SERP visibility benchmarking:

1. `thumbtack.com`
2. `homeadvisor.com`
3. `angi.com`
4. `houzz.com`
5. `porch.com`

These cover the main marketplaces KNearMe is targeting for share-of-voice comparisons. If regional specialists emerge, add them per city later.

## Outstanding Items

- Turn the shared remediation list (canonicals, broken assets/links, metadata cleanup, internal linking, structured data) into engineering tickets, then rerun the verified project crawl to confirm the health score trends above 90 %.
- Consider enabling **Always-on audit** once the workspace upgrades to Pro (would give near-real-time alerts).
- After a week of Rank Tracker data, build a custom Dashboard widget (Trends: Last 30 days, filter to Priority keywords) so planning sessions start from live visibility numbers.
