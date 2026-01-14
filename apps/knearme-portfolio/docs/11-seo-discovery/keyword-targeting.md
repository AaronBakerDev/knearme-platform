# Keyword Targeting Strategy

> **Version:** 1.1
> **Last Updated:** January 2, 2026
> **Status:** Active
> **Purpose:** Document keyword research, targeting strategy, and content-to-keyword mapping

---

## 1. Overview

KnearMe targets two distinct keyword audiences:

1. **Clients** (Demand Side) - Searching for providers and project information (current vertical queries still use contractor language)
2. **Businesses** (Supply Side) - Searching for marketing/portfolio solutions (Phase 2+)

**Primary Focus (MVP):** Client keywords for organic traffic and business discovery

**Data Sources:**
- Google Keyword Planner
- Ahrefs (Denver metro as reference market)
- Google Search Console (post-launch)
- Competitor analysis (Houzz, Angi, Yelp)

---

## 2. Client Keywords (Demand Side)

### 2.1 Primary Keyword Patterns

| Keyword Pattern | Example | Search Volume (Denver) | Competition | Priority | Target Page Type |
|-----------------|---------|------------------------|-------------|----------|-----------------|
| **{service} in {city}** | "chimney repair in Denver" | 880/mo | Medium | **P0** | Service Type by City |
| **{city} {service} contractors** | "Denver masonry contractors" | 590/mo | Medium | **P0** | City Hub (Roundup) |
| **{service} near me** | "tuckpointing near me" | 1,300/mo (national) | High | **P1** | City Hub (Roundup, geo-targeted) |
| **best {service} {city}** | "best masonry Denver" | 320/mo | Low | **P1** | Review Analysis Hub |
| **{service} cost {city}** | "chimney rebuild cost Denver" | 210/mo | Low | **P2** | Educational Content |
| **{service} {city} reviews** | "chimney repair Denver reviews" | 140/mo | Low | **P2** | Review Analysis Hub (Phase 3) |
| **{service} contractor near me** | "masonry contractor near me" | 890/mo (national) | High | **P1** | City Hub (Roundup) |
| **{city} {service}** | "Denver chimney repair" | 720/mo | Medium | **P0** | Service Type by City |

**Page Type Definitions:**
- **City Hub (Roundup):** Content hub built from business-generated projects and profiles. No review analysis.
- **Review Analysis Hub:** Separate editorial pipeline for “best {service} in {city}” and review-intent queries. Based on market review signals; links to city hub roundups and proof pages.

**Volume Notes:**
- Denver metro (population 3M) used as baseline
- Smaller cities: 30-50% of Denver volume
- Larger cities (NYC, LA): 200-300% of Denver volume
- National "near me" queries highest volume but geo-dependent

### 2.2 Long-Tail Client Keywords

**High-Intent, Lower Competition:**

| Keyword | Monthly Volume | Competition | Priority | Target Page |
|---------|----------------|-------------|----------|-------------|
| **masonry project examples {city}** | 100-500 | Low | **P1** | City Hub (Roundup) |
| **chimney repair portfolio** | 200-500 | Low | **P1** | Service Type by City |
| **before after masonry repair** | 500-1,000 | Medium | **P1** | Project Detail (image optimization) |
| **{service} contractor reviews {city}** | 100-300 | Low | **P2** | Review Analysis Hub (Phase 3) |
| **licensed {service} contractor {city}** | 150-400 | Low | **P2** | City Hub (Roundup) |
| **{service} estimate {city}** | 200-600 | Low | **P2** | Contractor Profile (CTA) |

**Content Gap Opportunities:**
- "masonry project examples" - No aggregators target this explicitly
- "chimney repair portfolio" - Pinterest/Houzz have poor SEO
- "before after masonry repair" - Image-heavy queries underserved

### 2.3 Service Type Keywords (Masonry)

Based on `/docs/content-planning/masonry/content-plan.md`:

| Service Type | Primary Keyword | Keyword Variations | Avg. Search Volume (National) | Slug |
|--------------|----------------|-------------------|-------------------------------|------|
| **Chimney Repair** | chimney repair | chimney rebuild, chimney restoration, chimney fix | 14,800/mo | `chimney-repair` |
| **Tuckpointing** | tuckpointing | repointing, mortar repair, brick repointing | 9,900/mo | `tuckpointing` |
| **Brick Repair** | brick repair | brick replacement, brick restoration, brick wall repair | 8,100/mo | `brick-repair` |
| **Stone Masonry** | stone masonry | stone walls, retaining walls, stone veneer | 6,600/mo | `stone-masonry` |
| **Foundation Repair** | foundation repair | masonry foundation, foundation waterproofing, basement repair | 18,100/mo | `foundation-repair` |
| **Historic Restoration** | historic masonry | historic brick restoration, heritage masonry | 1,300/mo | `historic-restoration` |
| **Brick Cleaning** | brick cleaning | masonry cleaning, efflorescence removal | 2,400/mo | `brick-cleaning` |
| **Chimney Crown Repair** | chimney crown repair | chimney cap repair, chimney crown replacement | 1,800/mo | `chimney-crown-repair` |

**Database Implementation:**
- `projects.service_type` column must use these exact slugs
- Service Type by City pages filter by these values
- National Service Landing pages use these as route parameters

**City Multiplier:**
- Each service type × 10 cities = 60 landing pages in Phase 2
- Each page targets "{service} in {city}" (e.g., "chimney repair in Denver")

### 2.4 Geographic Keywords

**City-Level Keywords:**

| City | Population | Monthly Volume (Masonry) | Priority |
|------|-----------|---------------------------|----------|
| Denver, CO | 715,000 | 880/mo | **P0** (MVP launch) |
| Lakewood, CO | 155,000 | 190/mo | **P0** (MVP launch) |
| Aurora, CO | 386,000 | 420/mo | **P0** (MVP launch) |
| Colorado Springs, CO | 478,000 | 520/mo | **P1** (Phase 2) |
| Fort Collins, CO | 169,000 | 180/mo | **P1** (Phase 2) |
| Boulder, CO | 108,000 | 150/mo | **P1** (Phase 2) |
| Arvada, CO | 121,000 | 130/mo | **P2** (Phase 2) |
| Westminster, CO | 114,000 | 120/mo | **P2** (Phase 2) |
| Thornton, CO | 141,000 | 140/mo | **P2** (Phase 2) |
| Centennial, CO | 108,000 | 110/mo | **P2** (Phase 2) |

**Geographic Expansion Strategy:**
- **Phase 1 (MVP):** 3 cities (Denver, Lakewood, Aurora)
- **Phase 2 (Q1 2025):** 10 cities (Colorado Front Range)
- **Phase 3 (Q2-Q3 2025):** 20 cities (add major metros: Phoenix, Dallas, Atlanta)
- **Phase 4 (Q4 2025):** 50 cities (top 50 US metros)

**"Near Me" Optimization:**
- Geo-targeting via Google My Business (future)
- City Hub (Roundup) pages optimized for local pack rankings
- Schema.org `areaServed` property for service radius

---

## 3. Business Acquisition Keywords (Supply Side)

### 3.1 B2B Business Keywords

**Phase 2+ Focus (Lower Priority than Client Keywords in MVP):**

| Keyword | Monthly Volume (National) | Competition | Target Landing Page | Priority |
|---------|---------------------------|-------------|---------------------|----------|
| **contractor portfolio website** | 720 | Low | `/for-masonry-contractors` | **P2** |
| **AI for contractors** | 880 | Medium | Homepage (Phase 2 messaging) | **P3** |
| **masonry business marketing** | 320 | Low | Blog/Learn section | **P3** |
| **how to get masonry leads** | 590 | Medium | Educational content | **P3** |
| **contractor website builder** | 1,900 | High | `/for-masonry-contractors` | **P2** |
| **free contractor portfolio** | 210 | Low | Homepage CTA | **P2** |
| **best contractor marketing tools** | 480 | Medium | Blog/Comparison content | **P3** |
| **contractor SEO** | 390 | Medium | Educational content | **P3** |
| **portfolio website for contractors** | 320 | Low | `/for-masonry-contractors` | **P2** |
| **contractor lead generation** | 1,600 | High | Educational content | **P3** |

**Strategy Notes:**
- Business keywords targeted via content marketing (not paid ads)
- Blog posts and educational content to build trust
- Conversion metric: "business signups from organic B2B search"
- Secondary to client keyword focus (clients drive demand)

### 3.2 Content Marketing Keywords (Business Funnel)

**Awareness Stage (TOFU):**

| Keyword | Monthly Volume | Content Type | Target Article |
|---------|----------------|--------------|----------------|
| **how to market masonry business** | 260 | Blog post | "5 Ways Masonry Contractors Can Get More Leads Without Ads" |
| **contractor marketing ideas** | 480 | Blog post | "Why Every Contractor Needs a Portfolio in 2026" |
| **get more contractor leads** | 720 | Blog post | "How AI Can Build Your Contractor Portfolio in 30 Minutes" |

**Consideration Stage (MOFU):**

| Keyword | Monthly Volume | Content Type | Target Article |
|---------|----------------|--------------|----------------|
| **best contractor portfolio website** | 210 | Comparison guide | "Traditional Website vs. AI Portfolio: What's Best?" |
| **AI portfolio generator** | 320 | Case study | "How [Business] Built a Portfolio in 30 Minutes with AI" |
| **contractor portfolio examples** | 480 | Gallery page | Featured business portfolios |

**Decision Stage (BOFU):**

| Keyword | Monthly Volume | Content Type | Target Page |
|---------|----------------|--------------|-------------|
| **knearme pricing** | <10 (branded) | Landing page | `/pricing` |
| **how does knearme work** | <10 (branded) | Landing page | `/how-it-works` |
| **knearme reviews** | <10 (branded) | Testimonials page | `/for-masonry-contractors` (social proof section) |

---

## 4. Content-to-Route Keyword Mapping

### 4.1 Programmatic Pages (Auto-Generated)

| Route Pattern | Primary Keyword | Secondary Keywords | Monthly Volume | Priority |
|---------------|----------------|-------------------|----------------|----------|
| **/{city}/masonry** | {city} masonry contractors | masonry {city}, {city} masonry services | 500-900/mo | **P0** |
| **/{city}/masonry/{type}** | {service} in {city} | {city} {service}, {service} contractors {city} | 200-800/mo | **P1** |
| **/{city}/masonry/{type}/{slug}** | {project title} | {service} project, {city} {service} example | 10-50/mo (long-tail) | **P0** |
| **/businesses/{city}/{slug}** | {business name} | {business name}, {city} {service} contractor | <10/mo (branded) | **P0** |

**Optimization Strategy:**
- **City Hub (Roundup):** H1 = "{City} Masonry Contractors" (current vertical), meta title includes "Find Masonry Contractors in {City}"
- **Service Type:** H1 = "{Service} in {City}", meta title = "Expert {Service} Contractors in {City} | KnearMe" (current vertical)
- **Project Detail:** H1 = AI-generated project title, meta title = "{Title} | {Business Name} | {City}"
- **Review Analysis Hub:** H1 = "Best {Service} in {City}", with methodology, review data sources, and a disclaimer.

### 4.2 National Service Landing Pages (Phase 3)

Based on `/docs/content-planning/masonry/content-plan.md` Section 1:

| Route | Primary Keyword | Secondary Keywords | Target Volume | Status |
|-------|----------------|-------------------|---------------|--------|
| **/services/chimney-repair** | chimney repair | chimney restoration, chimney rebuild | 14,800/mo | Phase 3 |
| **/services/tuckpointing** | tuckpointing | repointing, mortar repair | 9,900/mo | Phase 3 |
| **/services/stone-veneer** | stone veneer installation | stone facade, veneer siding | 3,600/mo | Phase 3 |
| **/services/brick-cleaning** | brick cleaning | masonry cleaning, efflorescence removal | 2,400/mo | Phase 3 |
| **/services/chimney-crown-repair** | chimney crown repair | chimney cap repair | 1,800/mo | Phase 3 |
| **/services/efflorescence-removal** | efflorescence removal | white residue on brick | 880/mo | Phase 3 |
| **/services/masonry-waterproofing** | masonry waterproofing | brick waterproofing | 1,200/mo | Phase 3 |
| **/services/historic-restoration** | historic masonry restoration | heritage brick restoration | 1,300/mo | Phase 3 |

**Content Strategy:**
- 1,500-2,500 words per page
- FAQ section (target featured snippets)
- Links to City Hub (Roundup) pages offering this service
- Embedded project galleries (8-12 featured projects)

### 4.3 Educational Content (Phase 3)

Based on `/docs/content-planning/masonry/content-plan.md` Section 2:

| Route | Primary Keyword | Secondary Keywords | Target Volume | Content Type |
|-------|----------------|-------------------|---------------|--------------|
| **/learn/chimney-repair-cost-guide** | how much does chimney repair cost | chimney repair cost, chimney rebuild cost | 1,600/mo | Cost guide |
| **/learn/tuckpointing-vs-repointing** | difference between tuckpointing and repointing | tuckpointing vs repointing | 880/mo | Comparison article |
| **/learn/how-to-choose-masonry-contractor** | how to find a good mason | choosing a masonry contractor | 720/mo | How-to guide |
| **/learn/historic-brick-restoration-guide** | historic brick restoration | heritage masonry restoration | 320/mo | Educational article |
| **/learn/foundation-waterproofing-guide** | how to waterproof masonry foundation | foundation waterproofing | 590/mo | How-to guide |
| **/learn/stone-retaining-wall-cost** | stone retaining wall cost | retaining wall cost | 480/mo | Cost guide |
| **/learn/signs-chimney-needs-repair** | signs your chimney needs repair | chimney damage signs | 590/mo | Educational article |
| **/learn/understanding-masonry-restoration-costs** | masonry restoration cost | brick restoration cost | 390/mo | Cost guide |

**SEO Optimization:**
- H1 = Exact match primary keyword (or close variation)
- H2/H3 = Secondary keywords and related questions
- Internal links to 2-3 City Hub (Roundup) pages or Service Type pages
- FAQ schema for featured snippets

### 4.4 Problem-Solution Guides (Phase 3)

Based on `/docs/content-planning/masonry/content-plan.md` Section 3:

| Route | Primary Keyword | Secondary Keywords | Target Volume | Content Type |
|-------|----------------|-------------------|---------------|--------------|
| **/guides/how-to-fix-chimney-crown-cracks** | how to fix chimney crown cracks | chimney crown repair | 320/mo | HowTo guide |
| **/guides/repointing-brick-walls** | how to repoint brick walls | repointing brick | 1,200/mo | HowTo guide |
| **/guides/preventing-efflorescence-on-brick** | how to prevent efflorescence | white residue on brick | 480/mo | Prevention guide |
| **/guides/repairing-cracked-foundation** | how to repair cracked foundation | foundation crack repair | 880/mo | HowTo guide |
| **/guides/cleaning-brick-exterior** | how to clean brick exterior | brick cleaning methods | 720/mo | HowTo guide |
| **/guides/waterproofing-masonry-walls** | how to waterproof masonry walls | brick waterproofing | 590/mo | HowTo guide |
| **/guides/installing-stone-veneer** | how to install stone veneer | stone veneer installation | 1,600/mo | HowTo guide |
| **/guides/restoring-historic-brick** | how to restore historic brick | historic brick restoration | 260/mo | HowTo guide |

**Schema Strategy:**
- HowTo schema with step-by-step instructions
- Images for each step (screenshots, diagrams, project photos)
- Tools/materials list
- Estimated time and cost

---

## 5. Keyword Ranking Strategy

### 5.1 On-Page SEO Requirements

| Element | Optimization | Example (Chimney Repair in Denver) |
|---------|--------------|-----------------------------------|
| **H1** | Exact match primary keyword | "Chimney Repair in Denver, Colorado" |
| **Meta Title** | Primary keyword + modifier (55-60 chars) | "Expert Chimney Repair in Denver | KNearMe" (48 chars) |
| **Meta Description** | Primary + secondary keywords + CTA (150-160 chars) | "Find top-rated chimney repair contractors in Denver. View portfolios, read reviews, and get quotes. Licensed & insured masons." (152 chars) |
| **URL Slug** | Hyphenated primary keyword | `/denver-co/masonry/chimney-repair` |
| **Image Alt Text** | Descriptive + keyword | "Chimney repair project in Denver showing brick restoration" |
| **H2 Headings** | Secondary keywords, questions | "Best Chimney Repair Contractors in Denver", "Chimney Repair Cost in Denver" |
| **Body Content** | Keyword density 1-2%, LSI keywords | Include variations: chimney rebuild, chimney restoration, mason, contractor |

### 5.2 Target Ranking Timeline

| Keyword Competitiveness | Expected Ranking Timeline | Phase |
|-------------------------|--------------------------|-------|
| **Low Competition (<30 DR)** | 3-6 months to top 20 | Phase 2 |
| **Medium Competition (30-50 DR)** | 6-9 months to top 20 | Phase 3 |
| **High Competition (50+ DR)** | 12+ months to top 20 | Phase 4 |

**Example:**
- "chimney repair in Lakewood" (Low, 25 DR) → Target: Top 20 by March 2025
- "chimney repair in Denver" (Medium, 42 DR) → Target: Top 20 by June 2025
- "chimney repair near me" (High, 68 DR) → Target: Top 50 by Dec 2025

### 5.3 Ranking Factors Prioritization

**Weighted Impact on Rankings (Based on Ahrefs/Moz Studies):**

| Factor | Weight | KNearMe Strategy |
|--------|--------|------------------|
| **Backlinks** | 40% | Contractor partnerships, local citations, PR outreach |
| **Content Quality** | 25% | AI-generated + human-edited, 400-600 words/project, 1,500+ words/article |
| **On-Page SEO** | 15% | Keyword-optimized H1/meta tags, structured data, internal linking |
| **User Experience** | 10% | Core Web Vitals (<2.5s LCP), mobile-first, low bounce rate |
| **Domain Authority** | 5% | Build DA over time (backlinks, age, trust) |
| **Local Signals** | 5% | City-specific content, schema areaServed, GMB listings (future) |

**Quick Wins (Phase 2):**
- Target low-competition keywords first (easier to rank)
- Optimize existing pages (low-hanging fruit)
- Build internal links between related pages
- Improve Core Web Vitals (technical SEO)

---

## 6. Keyword Research Tools & Process

### 6.1 Tools Stack

| Tool | Use Case | Frequency |
|------|----------|-----------|
| **Google Keyword Planner** | Search volume, keyword discovery | Monthly |
| **Ahrefs** | Competitor analysis, backlinks, keyword difficulty | Weekly |
| **Google Search Console** | Actual ranking data, click-through rates | Daily |
| **Google Trends** | Seasonal trends, keyword momentum | Quarterly |
| **AnswerThePublic** | Question-based keywords, long-tail discovery | Monthly |
| **AlsoAsked** | "People also ask" queries | Monthly |

### 6.2 Keyword Research Workflow

**Monthly Process:**
1. **Discover New Keywords**
   - Use Ahrefs "Content Gap" to find competitor keywords
   - Use AnswerThePublic for question-based queries
   - Check Google Search Console for "Queries" (rising keywords)

2. **Prioritize Keywords**
   - Filter by search volume (>100/mo)
   - Filter by keyword difficulty (KD <40 for quick wins)
   - Prioritize commercial intent ("near me", "contractors", "cost")

3. **Map Keywords to Content**
   - Assign keywords to existing pages (optimize)
   - Identify content gaps (create new pages)
   - Update content calendar

4. **Track Rankings**
   - Add new keywords to rank tracker (Ahrefs or `rank-tracking/local-beacon`)
   - Monitor weekly position changes
   - Adjust strategy based on performance

### 6.3 Competitor Keyword Analysis

**Top Competitors:**

| Competitor | Domain Authority | Target Their Keywords | Strategy |
|------------|-----------------|----------------------|----------|
| **Houzz** | 91 | Informational keywords (cost guides, how-tos) | Create better, more localized content |
| **Angi** | 83 | "{service} near me", "{city} {service}" | Target long-tail city + service keywords |
| **Yelp** | 93 | "{service} {city} reviews" | Differentiate with portfolios, not just reviews |
| **HomeAdvisor** | 82 | "find {service} contractor" | Emphasize free profiles, no lead fees |

**Content Gap Opportunities:**
- None of these platforms target "masonry project examples {city}"
- Houzz has poor local SEO (generic, not city-specific)
- Yelp/Angi focus on reviews, not visual portfolios

---

## 7. Seasonal & Trending Keywords

### 7.1 Seasonal Trends (Masonry)

**Peak Season (April - October):**
- "chimney repair" peaks in May (spring maintenance)
- "stone veneer installation" peaks in June-August (summer projects)
- "foundation repair" peaks in April-May (spring thaw)

**Off-Season (November - March):**
- "chimney crown repair" peaks in November (pre-winter prep)
- "interior brick cleaning" peaks in January (post-holiday cleaning)
- "masonry estimates" peaks in February (planning for spring)

**Content Strategy:**
- Publish seasonal content 2 months before peak (e.g., "Spring Chimney Maintenance" in March)
- Update cost guides annually in January

### 7.2 Emerging Keywords (2025)

**AI & Tech Keywords:**
- "AI contractor marketing" (up 200% YoY)
- "virtual home consultations" (up 150% YoY)
- "contractor portfolio AI" (new, <10 volume but rising)

**Sustainability Keywords:**
- "eco-friendly masonry" (up 80% YoY)
- "sustainable brick restoration" (up 60% YoY)

**Strategy:** Monitor these with Google Trends, create content when volume >100/mo

---

## 8. Implementation Checklist

### Phase 1 (Current - COMPLETE)

- [x] Identify primary keyword patterns (client keywords)
- [x] Map service type keywords to database slugs
- [x] Optimize existing City Hub (Roundup) and Project Detail pages
- [x] Define geographic keyword strategy (Colorado focus)

### Phase 2 (January - February 2025)

- [ ] **Implement Service Type by City Pages**
  - Target: "{service} in {city}" keywords
  - 10 cities × 6 service types = 60 new pages
  - On-page SEO: H1, meta title, meta description

- [ ] **Keyword Rank Tracking Setup**
  - Tool: Ahrefs or `rank-tracking/local-beacon`
  - Track 50-100 target keywords
  - Weekly monitoring

- [ ] **Google Search Console Optimization**
  - Analyze "Queries" report
  - Identify low-hanging fruit (positions 11-20)
  - Optimize pages for target keywords

### Phase 3 (March - June 2025)

- [ ] **National Service Landing Pages**
  - 8 service pages (chimney repair, tuckpointing, etc.)
  - Target national keywords (high volume)
  - FAQ schema for featured snippets

- [ ] **Educational Content (8 Articles)**
  - Cost guides, how-to articles
  - Target informational keywords (1,000-3,000 volume)
  - Internal links to transactional pages

- [ ] **Problem-Solution Guides (8 Guides)**
  - HowTo schema for rich results
  - Target "how to" keywords (500-2,000 volume)

### Phase 4 (July - December 2025)

- [ ] **Expand to 50 Cities**
  - Target major metro areas
  - 50 cities × 6 service types = 300 new pages
  - Geographic keyword domination

- [ ] **B2B Contractor Keywords**
  - Create `/for-masonry-contractors` landing page
  - Target "contractor portfolio website" keywords
  - Content marketing funnel

---

## 9. Document References

**Related Documentation:**
- `/docs/11-seo-discovery/SEO-DISCOVERY-STRATEGY.md` - Section 4 (source)
- `/docs/content-planning/masonry/content-plan.md` - Content calendar
- `/docs/11-seo-discovery/internal-linking.md` - Link strategy

**External Resources:**
- [Google Keyword Planner](https://ads.google.com/home/tools/keyword-planner/)
- [Ahrefs Keyword Explorer](https://ahrefs.com/keywords-explorer)
- [AnswerThePublic](https://answerthepublic.com)

---

**Last Updated:** December 2024
**Maintainer:** SEO Lead
**Review Cadence:** Monthly (keyword research), Quarterly (strategy review)
