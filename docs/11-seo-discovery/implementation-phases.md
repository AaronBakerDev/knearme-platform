# SEO Implementation Roadmap

> **Version:** 1.0
> **Last Updated:** December 2024
> **Status:** Active
> **Purpose:** Detailed implementation phases for SEO & discovery strategy

---

## Overview

This document breaks down the SEO implementation into four phases over 12 months (Dec 2024 - Dec 2025). Each phase has specific deliverables, success criteria, and dependencies.

**Source:** `/docs/11-seo-discovery/SEO-DISCOVERY-STRATEGY.md` Section 7

---

## Phase 1: Foundation (December 2024)

### Status: ✅ COMPLETE

### Objectives

- Establish core technical SEO infrastructure
- Launch MVP with SEO-optimized public pages
- Enable search engine indexing

### Technical Deliverables

#### 1.1 Project Detail Pages with SEO

**Status:** ✅ Complete

**Implementation:**
- Dynamic meta tags (title, description, OG tags)
- JSON-LD structured data (CreativeWork, ImageGallery, LocalBusiness)
- Canonical URLs
- Breadcrumb navigation
- Next.js Image optimization

**File:** `app/(public)/[city]/masonry/[type]/[slug]/page.tsx`

**Validation:**
- [ ] Google Rich Results Test passes
- [ ] PageSpeed Insights score >90
- [ ] All images have alt text
- [ ] Structured data validates

---

#### 1.2 City Hub Pages

**Status:** ✅ Complete

**Implementation:**
- Programmatic city landing pages
- Dynamic stats (contractor count, project count)
- Project grid with filtering by service type
- JSON-LD ItemList schema

**File:** `app/(public)/[city]/masonry/page.tsx`

**Validation:**
- [ ] All 3 initial cities render correctly (Denver, Lakewood, Aurora)
- [ ] Project counts accurate
- [ ] Schema validates

---

#### 1.3 Contractor Profile Pages

**Status:** ✅ Complete

**Implementation:**
- Public profile with full portfolio
- Contact information and business details
- JSON-LD LocalBusiness schema

**File:** `app/(public)/contractor/[username]/page.tsx`

**Validation:**
- [ ] Profile loads from database
- [ ] All contractor projects display
- [ ] Schema includes areaServed and services

---

#### 1.4 Dynamic Sitemap

**Status:** ✅ Complete

**Implementation:**
- Auto-generates from database (projects, city hubs, contractor profiles)
- Updates on new content publish
- Includes `lastmod`, `priority`, `changefreq`

**File:** `app/sitemap.ts`

**Validation:**
- [ ] Sitemap renders at `/sitemap.xml`
- [ ] All published projects included
- [ ] Valid XML format

---

#### 1.5 robots.txt

**Status:** ✅ Complete

**Implementation:**
- Allows all crawlers
- Disallows private routes (`/dashboard`, `/api`, `/_next`)
- References sitemap

**File:** `public/robots.txt`

**Content:**
```
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /_next/

Sitemap: https://knearme.com/sitemap.xml
```

---

#### 1.6 Core Web Vitals Optimization

**Status:** ✅ Complete

**Implementation:**
- Next.js Image component (lazy loading, blur placeholders)
- Route-based code splitting
- Server Components for fast initial load
- Responsive images with `srcset`

**Targets:**
- LCP (Largest Contentful Paint): <2.5s
- CLS (Cumulative Layout Shift): <0.1
- FID (First Input Delay): <100ms

**Validation:**
- [ ] PageSpeed Insights passes Core Web Vitals
- [ ] Mobile score >85
- [ ] Desktop score >90

---

#### 1.7 PWA Manifest

**Status:** ✅ Complete

**Implementation:**
- App icons (192×192, 512×512)
- Theme colors
- Display mode: standalone

**File:** `app/manifest.ts`

---

### Success Criteria (Phase 1)

| Metric | Target | Status |
|--------|--------|--------|
| **Pages Indexed** | 50+ | ✅ (City hubs + Projects) |
| **Core Web Vitals Pass** | 100% | ✅ |
| **Structured Data Valid** | 100% | ✅ |
| **Mobile-Friendly** | Yes | ✅ |

---

## Phase 2: Expansion (January - February 2025)

### Objectives

- Double indexed pages (50 → 200+)
- Establish internal linking graph
- Begin ranking for competitive "{service} in {city}" keywords
- Set up monitoring and tracking

### New Page Types

#### 2.1 Service Type by City Pages

**Priority:** **P0** (Highest Impact)

**URL Pattern:** `/{city-slug}/masonry/{service-type-slug}`

**Target Pages:** 60 pages (10 cities × 6 service types)

**Cities:**
1. Denver, CO
2. Lakewood, CO
3. Aurora, CO
4. Colorado Springs, CO
5. Fort Collins, CO
6. Boulder, CO
7. Arvada, CO
8. Westminster, CO
9. Thornton, CO
10. Centennial, CO

**Service Types:**
1. `chimney-repair`
2. `tuckpointing`
3. `brick-repair`
4. `stone-masonry`
5. `foundation-repair`
6. `historic-restoration`

**File:** `app/(public)/[city]/masonry/[type]/page.tsx`

**Page Structure:**
- H1: "{Service Type} in {City}, {State}"
- Service description (400-500 words, AI-generated with city context)
- Filtered project grid (only projects with service type)
- Featured contractors (most projects in service type)
- Related services (links to other service types in same city)
- Nearby cities (links to same service in nearby cities)
- JSON-LD: Service schema + ItemList

**Implementation Tasks:**
- [ ] Create dynamic route handler
- [ ] Build `getProjectsByCityAndType()` database query
- [ ] Implement service description generator (AI SDK - Gemini 3 Flash preview)
- [ ] Add Service schema to `structured-data.ts`
- [ ] Create RelatedServices component
- [ ] Create NearbyCities component

**Success Metrics:**
- [ ] All 60 pages render without errors
- [ ] Average load time <2s
- [ ] Schema validates on all pages
- [ ] Indexed by Google within 30 days

---

### Internal Linking Automation

#### 2.2 Related Projects Component

**Priority:** **P1**

**Purpose:** Increase session duration, reduce bounce rate

**Algorithm:**
1. Same city + same service type (limit 2)
2. Same service type, different city (limit 2)
3. Fallback: Recent projects in same city

**File:** `src/components/seo/RelatedProjects.tsx`

**Implementation:**
```typescript
export async function getRelatedProjects(
  currentProjectId: string,
  citySlug: string,
  serviceType: string,
  limit = 4
): Promise<Project[]> {
  // See /docs/11-seo-discovery/internal-linking.md for full implementation
}
```

**Placement:** Below project description on Project Detail pages

**Implementation Tasks:**
- [ ] Create `RelatedProjects.tsx` Server Component
- [ ] Implement `getRelatedProjects()` query
- [ ] Add to Project Detail page template
- [ ] Write unit tests for algorithm

**Success Metrics:**
- [ ] 100% of projects have related projects
- [ ] Average session duration increases by 30%
- [ ] Bounce rate decreases by 10%

---

#### 2.3 City-to-City Navigation

**Priority:** **P1**

**Purpose:** Link to same service type in nearby cities

**File:** `src/components/seo/NearbyCities.tsx`

**Algorithm:** Geospatial query (cities within 50 miles, sorted by distance)

**Placement:** Footer of City Hub and Service Type by City pages

**Implementation Tasks:**
- [ ] Create `NearbyCities.tsx` component
- [ ] Implement `getNearbyCities()` query (PostGIS or geocoding API)
- [ ] Add to City Hub footer
- [ ] Add to Service Type by City footer

**Success Metrics:**
- [ ] 100% of City Hub pages have nearby cities links
- [ ] Click-through rate on nearby cities: >5%

---

#### 2.4 BreadcrumbList Schema

**Priority:** **P1**

**Purpose:** Enhanced search results with breadcrumb trail

**File:** `src/lib/seo/structured-data.ts` (function already exists)

**Implementation Tasks:**
- [ ] Add BreadcrumbList schema to all public pages
- [ ] Validate with Google Rich Results Test
- [ ] Monitor Search Console for breadcrumb rich results

**Success Metrics:**
- [ ] 100% of public pages have breadcrumb schema
- [ ] Breadcrumbs appear in SERPs within 30 days

---

### Search Console Setup

#### 2.5 Google Search Console Verification

**Priority:** **P0**

**Implementation Tasks:**
- [ ] Add site property to Google Search Console
- [ ] Verify via DNS TXT record or HTML file
- [ ] Submit sitemap: `https://knearme.com/sitemap.xml`
- [ ] Request indexing for key pages

**Monitoring:**
- [ ] Weekly index coverage check
- [ ] Fix 404s, soft 404s, redirect chains
- [ ] Target: 95%+ pages indexed within 30 days

---

#### 2.6 Google Analytics 4 Setup

**Priority:** **P1**

**Implementation Tasks:**
- [ ] Create GA4 property
- [ ] Add tracking code to Next.js app
- [ ] Configure custom events:
  - `project_view`
  - `contractor_profile_click`
  - `contractor_signup`
  - `related_project_click`

**File:** `src/lib/analytics.ts`

**Package:** `next-google-analytics` or `@next/third-parties/google`

**Validation:**
- [ ] Events tracking correctly
- [ ] No PII collected
- [ ] GDPR/CCPA compliant

---

### Keyword Rank Tracking

#### 2.7 Rank Tracker Setup

**Priority:** **P1**

**Options:**
1. **Self-Hosted:** Use workspace `rank-tracking/local-beacon` (free, full control)
2. **Third-Party:** Ahrefs or SEMrush subscription ($99-199/mo)

**Initial Keywords to Track:** 50-100 keywords

**Examples:**
- "chimney repair in Denver"
- "tuckpointing in Lakewood"
- "masonry contractors Denver"
- "brick repair Aurora CO"

**Implementation Tasks:**
- [ ] Choose rank tracking tool
- [ ] Add target keywords
- [ ] Set up weekly position tracking
- [ ] Create dashboard for monitoring

---

### Timeline & Resources

**Duration:** 8 weeks (January 1 - February 28, 2025)

**Team:**
- 1 Full-Stack Developer (0.5 FTE)
- 1 SEO Specialist (0.25 FTE, consultant)

**Effort Estimate:**
- Service Type by City pages: 3 weeks
- Related Projects component: 1 week
- BreadcrumbList schema integration: 1 week
- Analytics/GSC setup: 1 week
- Rank tracking setup: 1 week
- QA and validation: 1 week

---

### Success Criteria (Phase 2)

| Metric | Baseline (Dec 2024) | Target (Feb 2025) | Measurement |
|--------|---------------------|-------------------|-------------|
| **Indexed Pages** | 50 | 200+ | Google Search Console |
| **Keywords in Top 50** | 0 | 10+ | Ahrefs / local-beacon |
| **Organic Clicks/Week** | <10 | 100+ | Google Search Console |
| **Contractor Signups (Organic)** | 0 | 5+ | GA4 attribution |
| **Avg Session Duration** | 1:30 | 2:00+ | GA4 |
| **Bounce Rate** | 60% | <50% | GA4 |

---

## Phase 3: Authority Building (March - June 2025)

### Objectives

- Establish KNearMe as authoritative source for masonry content
- Rank for informational queries (how-to, cost guides)
- Build backlink profile
- Target featured snippets

### Editorial Content Production

#### 3.1 National Service Landing Pages

**Priority:** **P1**

**URL Pattern:** `/services/{service-slug}`

**Target Pages:** 8 service pages

**Services:**
1. Chimney Repair
2. Tuckpointing
3. Stone Veneer Installation
4. Brick Cleaning/Restoration
5. Chimney Crown Repair
6. Efflorescence Removal
7. Masonry Waterproofing
8. Historic Masonry Restoration

**File:** `app/(public)/services/[type]/page.tsx`

**Content Source:** `/docs/content-planning/masonry/content-plan.md` Section 1

**Page Structure:**
- 1,500-2,500 words
- FAQ section (5-7 questions)
- Featured projects gallery (8-12 projects)
- City links grid (all cities offering this service)
- JSON-LD: FAQPage + ItemList

**Production Timeline:** 2 pages/month × 4 months (March - June)

**Implementation Tasks:**
- [ ] Create route handler
- [ ] Write content (AI-assisted + human editing)
- [ ] Add FAQPage schema
- [ ] Link to City Hubs
- [ ] Validate with Rich Results Test

**Success Metrics:**
- [ ] All 8 pages live by end of June
- [ ] 2+ featured snippets earned
- [ ] Average organic traffic: 500 visits/mo per page (by Aug)

---

#### 3.2 Educational Content Hub

**Priority:** **P1**

**URL Pattern:** `/learn/{article-slug}`

**Landing Page:** `/learn`

**Target Articles:** 8 educational articles

**Topics (from content plan):**
1. Signs Your Chimney Needs Repair
2. Understanding Masonry Restoration Costs
3. Choosing the Right Masonry Contractor
4. How to Prevent Chimney Damage
5. Masonry Maintenance Guide
6. Understanding Tuckpointing
7. Historic Masonry Preservation
8. Masonry vs. Concrete: What's the Difference?

**Content Source:** `/docs/content-planning/masonry/content-plan.md` Section 2

**Production Timeline:** 2 articles/month × 4 months

**Article Structure:**
- 1,500-2,500 words
- H2/H3 keyword-optimized subheadings
- 2-3 internal links to City Hubs or Service Type pages
- Embedded project examples (2-3 project cards)
- JSON-LD: Article schema

**Implementation Tasks:**
- [ ] Create `/learn` landing page
- [ ] Create route handler for articles
- [ ] Write content (AI-assisted + expert review)
- [ ] Add Article schema
- [ ] Internal linking to transactional pages

**Success Metrics:**
- [ ] All 8 articles live by end of June
- [ ] Average organic traffic: 300 visits/mo per article (by Aug)
- [ ] 5+ contractor signups attributed to articles

---

#### 3.3 Problem-Solution Guides

**Priority:** **P2**

**URL Pattern:** `/guides/{guide-slug}`

**Target Guides:** 8 HowTo guides

**Topics (from content plan):**
1. How to Fix Chimney Crown Cracks
2. Repointing Brick Walls: Complete Guide
3. Preventing Efflorescence on Brick
4. Repairing Cracked Foundation
5. Cleaning Brick Exterior
6. Waterproofing Masonry Walls
7. Installing Stone Veneer
8. Restoring Historic Brick

**Content Source:** `/docs/content-planning/masonry/content-plan.md` Section 3

**Production Timeline:** 2 guides/month × 4 months

**Guide Structure:**
- 1,200-2,000 words
- Step-by-step instructions (5-10 steps)
- Images for each step
- Tools/materials list
- JSON-LD: HowTo schema

**Implementation Tasks:**
- [ ] Create route handler
- [ ] Write content with step-by-step format
- [ ] Source/create step images
- [ ] Add HowTo schema
- [ ] Internal linking to contractors

**Success Metrics:**
- [ ] All 8 guides live by end of June
- [ ] 3+ HowTo rich results in SERPs
- [ ] Average organic traffic: 200 visits/mo per guide (by Aug)

---

### Advanced Schema Markup

#### 3.4 FAQ Schema

**Priority:** **P1**

**File:** `src/lib/seo/structured-data.ts`

**Function:** `generateFAQSchema()`

**Usage:** National Service Landing pages, Educational articles

**Implementation Tasks:**
- [ ] Add `generateFAQSchema()` function
- [ ] Integrate into service landing pages
- [ ] Integrate into educational articles
- [ ] Validate with Google Rich Results Test

**Success Metrics:**
- [ ] 10+ pages with FAQ schema
- [ ] 2+ featured snippets earned

---

#### 3.5 HowTo Schema Enhancement

**Priority:** **P2**

**File:** `src/lib/seo/structured-data.ts`

**Function:** `generateGuideHowToSchema()`

**Usage:** Problem-solution guides

**Implementation Tasks:**
- [ ] Enhance existing HowTo schema
- [ ] Add `totalTime`, `estimatedCost`, `supply` properties
- [ ] Add step images
- [ ] Validate with Google Rich Results Test

**Success Metrics:**
- [ ] 8+ guides with HowTo schema
- [ ] 3+ HowTo carousels in SERPs

---

### Backlink Acquisition Strategy

#### 3.6 Industry Directory Submissions

**Priority:** **P1**

**Target Directories:**
- Better Business Bureau (BBB)
- Local chambers of commerce
- Masonry contractor associations
- Construction industry directories

**Implementation Tasks:**
- [ ] Create list of 20 target directories
- [ ] Submit to 5 directories/month
- [ ] Track submissions in spreadsheet

**Success Metrics:**
- [ ] 10+ directory backlinks by end of June

---

#### 3.7 Guest Posting & PR

**Priority:** **P2**

**Target Publications:**
- Home improvement blogs (e.g., Houzz Pro, JLC Online)
- Local news sites (Denver Post, Westword)
- Contractor association newsletters

**Topics:**
- "How AI is Transforming Contractor Marketing"
- "The Future of Contractor Portfolios"
- "Case Study: [Local Contractor] Grows Business with AI"

**Implementation Tasks:**
- [ ] Identify 10 target publications
- [ ] Pitch 2 guest posts/month
- [ ] Publish 1-2 guest posts total (by June)

**Success Metrics:**
- [ ] 2+ guest post backlinks
- [ ] 1+ PR mention in local news

---

#### 3.8 Contractor Partnership Program

**Priority:** **P1**

**Strategy:** Encourage contractors to link from their websites to KNearMe profile

**Tactics:**
- "Powered by KNearMe" badge with backlink
- Contractor website audit (offer as value-add)
- Mutual link exchange (contractor site ↔ KNearMe profile)

**Implementation Tasks:**
- [ ] Create "Powered by KNearMe" badge + widget
- [ ] Email 20 contractors with badge offer
- [ ] Target: 5+ contractors add badge

**Success Metrics:**
- [ ] 5+ contractor website backlinks

---

### Timeline & Resources

**Duration:** 16 weeks (March 1 - June 30, 2025)

**Team:**
- 1 Content Writer (0.5 FTE)
- 1 SEO Specialist (0.5 FTE)
- 1 Developer (0.25 FTE, schema implementation)

**Effort Estimate:**
- National Service pages: 8 weeks (2 pages/month)
- Educational articles: 8 weeks (2 articles/month)
- Problem-solution guides: 8 weeks (2 guides/month)
- Schema implementation: 2 weeks
- Backlink acquisition: Ongoing (2 hours/week)

---

### Success Criteria (Phase 3)

| Metric | Baseline (Feb 2025) | Target (June 2025) | Measurement |
|--------|---------------------|-------------------|-------------|
| **Indexed Pages** | 200 | 500+ | Google Search Console |
| **Keywords in Top 20** | 10 | 25+ | Ahrefs / local-beacon |
| **Organic Clicks/Week** | 100 | 500+ | Google Search Console |
| **Referring Domains (Backlinks)** | 1-2 | 10+ | Ahrefs |
| **Featured Snippets** | 0 | 2+ | Manual tracking |
| **Contractor Signups (Content)** | 5 | 20+ | GA4 attribution |

---

## Phase 4: Scale (July - December 2025)

### Objectives

- Geographic expansion (10 cities → 50 cities)
- Dominate local searches in top 50 US metros
- Build state-level landing pages
- Expand to additional trade types (Phase 5 prep)

### Multi-City Expansion

#### 4.1 Expand to 50 Cities

**Priority:** **P0**

**Target:** 50 cities total (40 new cities)

**Cities to Add (Prioritized by Population):**

**Top 20 Metros (July - September):**
1. Phoenix, AZ
2. Houston, TX
3. San Antonio, TX
4. Dallas, TX
5. Austin, TX
6. Jacksonville, FL
7. Fort Worth, TX
8. Columbus, OH
9. Charlotte, NC
10. San Francisco, CA
11. Indianapolis, IN
12. Seattle, WA
13. San Diego, CA
14. Nashville, TN
15. Oklahoma City, OK
16. Portland, OR
17. Las Vegas, NV
18. Memphis, TN
19. Louisville, KY
20. Baltimore, MD

**Next 20 Metros (October - December):**
21. Milwaukee, WI
22. Albuquerque, NM
23. Tucson, AZ
24. Fresno, CA
25. Sacramento, CA
26. Kansas City, MO
27. Atlanta, GA
28. Miami, FL
29. Raleigh, NC
30. Omaha, NE
31. Cleveland, OH
32. Virginia Beach, VA
33. Minneapolis, MN
34. Tulsa, OK
35. Arlington, TX
36. New Orleans, LA
37. Wichita, KS
38. Tampa, FL
39. Bakersfield, CA
40. Aurora, IL

**Implementation:**
- Auto-generate City Hub pages for each city
- Auto-generate Service Type by City pages (50 cities × 6 services = 300 pages)
- Populate with projects as contractors sign up

**Implementation Tasks:**
- [ ] Database: Add cities to `cities` table with geocoordinates
- [ ] Script: Auto-generate city hub pages
- [ ] Script: Auto-generate service type by city pages
- [ ] Content: City-specific intro paragraphs (AI-generated)

**Success Metrics:**
- [ ] All 50 cities live by December
- [ ] 300+ service type by city pages indexed
- [ ] 10+ cities have 5+ active contractors

---

#### 4.2 State-Level Landing Pages

**Priority:** **P1**

**URL Pattern:** `/{state-code}/masonry`

**Target States:** 20 states (states with 2+ cities)

**Examples:**
- `/colorado/masonry` (Denver, Lakewood, Aurora, etc.)
- `/texas/masonry` (Houston, Dallas, Austin, etc.)
- `/california/masonry` (San Diego, San Francisco, etc.)

**File:** `app/(public)/[state]/masonry/page.tsx`

**Page Structure:**
- H1: "Masonry Contractors in {State}"
- State overview (200-300 words)
- Grid of cities in state (sorted by project count)
- Top contractors statewide
- JSON-LD: ItemList (cities)

**Implementation Tasks:**
- [ ] Create route handler
- [ ] Build `getCitiesByState()` query
- [ ] Create state overview content
- [ ] Add ItemList schema

**Success Metrics:**
- [ ] 20 state pages live
- [ ] Indexed by Google within 30 days

---

#### 4.3 Local Content Customization

**Priority:** **P2**

**Enhancements for City Hub Pages:**

**City Stats:**
- Average project cost in city (calculated from project data)
- Climate considerations (e.g., "Denver's freeze-thaw cycles require...")
- Popular service types in city (data-driven)

**City Hero Images:**
- Skyline or landmark images
- Source: Unsplash API or project images

**Implementation Tasks:**
- [ ] Add city stats to database
- [ ] Generate climate-specific content (AI SDK - Gemini 3 Flash preview)
- [ ] Source hero images

**Success Metrics:**
- [ ] 50 cities have unique hero images
- [ ] 20+ cities have climate-specific content

---

### Advanced SEO Features

#### 4.4 Sitemap Split for >50k URLs

**Priority:** **P2** (only if >50k URLs)

**Current Estimate (Dec 2025):**
- 50 cities × 6 service types = 300 service pages
- 50 cities × 1 hub = 50 city hubs
- 1,200 projects (est.)
- 150 contractors (est.)
- **Total:** ~1,700 URLs (no split needed yet)

**Future:** Split when >50k URLs (Phase 5+)

**Implementation Tasks:**
- [ ] Monitor total URL count
- [ ] Create sitemap index file when needed
- [ ] Split into sitemaps by content type

---

#### 4.5 Featured Snippet Optimization

**Priority:** **P1**

**Tactics:**
- Target "People also ask" queries
- Optimize FAQ schema
- Structure content for snippets (lists, tables, definitions)

**Target Queries:**
- "What is tuckpointing?"
- "How much does chimney repair cost?"
- "How to choose a masonry contractor?"

**Implementation Tasks:**
- [ ] Identify 20 snippet opportunities (Ahrefs)
- [ ] Optimize content for snippet format
- [ ] Monitor GSC "Rich Results" report

**Success Metrics:**
- [ ] 5+ featured snippets earned

---

### Timeline & Resources

**Duration:** 24 weeks (July 1 - December 31, 2025)

**Team:**
- 1 Full-Stack Developer (0.75 FTE)
- 1 SEO Specialist (0.5 FTE)
- 1 Content Writer (0.25 FTE)

**Effort Estimate:**
- City expansion (40 cities): 8 weeks
- State-level pages (20 states): 4 weeks
- Local content customization: 6 weeks
- Featured snippet optimization: Ongoing
- Monitoring and maintenance: Ongoing

---

### Success Criteria (Phase 4)

| Metric | Baseline (June 2025) | Target (Dec 2025) | Measurement |
|--------|---------------------|-------------------|-------------|
| **Indexed Pages** | 500 | 2,000+ | Google Search Console |
| **Keywords in Top 10** | 5 | 100+ | Ahrefs / local-beacon |
| **Organic Clicks/Week** | 500 | 2,000+ | Google Search Console |
| **Referring Domains** | 10 | 50+ | Ahrefs |
| **Featured Snippets** | 2 | 5+ | Manual tracking |
| **Contractor Signups (Organic)** | 20 | 100+ | GA4 attribution |
| **Active Cities** | 10 | 30+ | Database query |

---

## Cross-Phase Monitoring

### Weekly Tasks

- [ ] **Keyword Rank Review**
  - Tool: Ahrefs / local-beacon
  - Track position changes for top 50 keywords
  - Identify quick wins (positions 11-20)

- [ ] **Index Coverage Check**
  - Tool: Google Search Console
  - Fix crawl errors (404s, soft 404s)
  - Submit new pages for indexing

- [ ] **Core Web Vitals Audit**
  - Tool: PageSpeed Insights, GSC
  - Address performance regressions
  - Target: LCP <2.5s, CLS <0.1

### Monthly Tasks

- [ ] **Content Performance Review**
  - Tool: GA4, GSC
  - Identify top performers
  - Update underperforming content

- [ ] **Backlink Monitoring**
  - Tool: Ahrefs
  - Identify new backlinks
  - Disavow toxic links (if needed)

- [ ] **Competitor Analysis**
  - Tool: Ahrefs, SEMrush
  - Track competitor rankings
  - Identify content gaps

### Quarterly Tasks

- [ ] **SEO Strategy Review**
  - Review all metrics vs. targets
  - Adjust roadmap based on performance
  - Update keyword strategy
  - Plan next quarter's content

---

## Risk Mitigation

### Potential Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Algorithm Update Penalty** | Low | High | Follow Google guidelines, avoid black-hat SEO, diversify traffic sources |
| **Slow Indexing** | Medium | Medium | Submit sitemaps, request indexing via GSC, build backlinks |
| **Low Content Quality** | Medium | High | Human review of all AI-generated content, subject matter experts |
| **Insufficient Contractor Supply** | Medium | High | Focus contractor acquisition in parallel, prioritize high-demand cities |
| **Competitor SEO Attacks** | Low | Medium | Monitor backlink profile, disavow toxic links, strong technical SEO |
| **Budget Overruns** | Medium | Medium | Prioritize highest-impact tasks, cut low-priority content if needed |

---

## Budget Estimate

### Phase 2 (Jan-Feb 2025)

| Item | Cost | Notes |
|------|------|-------|
| **Developer (0.5 FTE × 2 months)** | $10,000 | Service Type pages, components |
| **SEO Consultant (0.25 FTE × 2 months)** | $3,000 | Strategy, monitoring |
| **Tools (Ahrefs, GSC, GA4)** | $200 | Ahrefs subscription |
| **Total Phase 2** | **$13,200** | |

### Phase 3 (Mar-Jun 2025)

| Item | Cost | Notes |
|------|------|-------|
| **Content Writer (0.5 FTE × 4 months)** | $12,000 | 24 articles/guides |
| **SEO Specialist (0.5 FTE × 4 months)** | $12,000 | Schema, backlinks, strategy |
| **Developer (0.25 FTE × 4 months)** | $10,000 | Schema implementation |
| **Tools** | $400 | Ahrefs, content tools |
| **Total Phase 3** | **$34,400** | |

### Phase 4 (Jul-Dec 2025)

| Item | Cost | Notes |
|------|------|-------|
| **Developer (0.75 FTE × 6 months)** | $45,000 | 40 cities expansion |
| **SEO Specialist (0.5 FTE × 6 months)** | $18,000 | Ongoing optimization |
| **Content Writer (0.25 FTE × 6 months)** | $9,000 | City content customization |
| **Tools** | $600 | Ahrefs, analytics |
| **Total Phase 4** | **$72,600** | |

### Total 12-Month Budget

**$120,200** (Phases 2-4)

---

## Document References

**Related Documentation:**
- `/docs/11-seo-discovery/SEO-DISCOVERY-STRATEGY.md` - Overall strategy
- `/docs/11-seo-discovery/internal-linking.md` - Related Projects component
- `/docs/11-seo-discovery/structured-data.md` - Schema implementations
- `/docs/11-seo-discovery/keyword-targeting.md` - Keyword strategy

**External Resources:**
- [Google Search Central](https://developers.google.com/search)
- [Next.js SEO Guide](https://nextjs.org/learn/seo/introduction-to-seo)

---

**Last Updated:** December 2024
**Maintainer:** Product Lead / SEO Lead
**Review Cadence:** Monthly (during active phase), Quarterly (overall roadmap)
