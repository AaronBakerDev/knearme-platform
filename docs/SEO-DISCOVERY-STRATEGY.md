# SEO & Discovery Strategy

> **Version:** 1.0
> **Last Updated:** December 2024
> **Status:** Active
> **Purpose:** Bridge workspace content strategy → project implementation

---

## 1. Executive Summary

KNearMe Portfolio operates as a **two-sided marketplace** with asymmetric discovery strategies:

**Homeowner Acquisition (Demand Side):**
- **Primary Channel:** Organic search via programmatic SEO pages
- **Strategy:** City-specific service pages targeting "{service} in {city}" queries
- **User Intent:** Finding qualified contractors for specific masonry projects
- **Conversion Path:** Search → City/Service Page → Project Gallery → Contractor Profile → Contact

**Contractor Acquisition (Supply Side):**
- **Primary Channel:** Word-of-mouth and organic referrals
- **Secondary Channel:** Educational content marketing (Phase 2)
- **Strategy:** Build trust through value-first content, not paid advertising
- **Conversion Path:** Referral/Search → Homepage/Landing → Portfolio Examples → Onboarding

**Core Differentiator:**
Programmatic SEO pages (City Hubs + Service Type by City) are the **primary competitive moat** in the MVP phase. These pages serve dual purposes:
1. Homeowner discovery and contractor evaluation
2. Contractor portfolio showcase and credibility building

**Source Documents:**
- Workspace Strategy: `/docs/content-planning/masonry/content-plan.md`
- Business Model: `/docs/business/BUSINESS-PLAN.md`
- Product Spec: `/docs/PRODUCT-SPECIFICATION.md`

This document translates workspace-level strategy into **implementation specifications** for the knearme-portfolio Next.js application.

---

## 2. Programmatic SEO Architecture

### 2.1 Page Type Taxonomy

| Page Type | URL Pattern | Purpose | Priority | Status |
|-----------|-------------|---------|----------|--------|
| **City Hub** | `/{city}/masonry` | Aggregate all masonry services and projects in a specific city; primary landing page for "{city} masonry" queries | **P0** | ✅ Implemented |
| **Service Type by City** | `/{city}/masonry/{type}` | Show all projects of a specific service type in a city (e.g., "chimney repair in Denver"); target long-tail "{service} in {city}" keywords | **P1** | 🔨 Next sprint |
| **Project Detail** | `/{city}/masonry/{type}/{project-slug}` | Individual project showcase with rich media, descriptions, structured data; builds trust and demonstrates quality | **P0** | ✅ Implemented |
| **Contractor Profile** | `/contractor/{username}` | Contractor's full portfolio, bio, contact info; conversion endpoint for homeowners | **P0** | ✅ Implemented |
| **National Service Landing** | `/services/{type}` | National-level service landing page linking to all cities offering that service; "what is tuckpointing" education + city links | **P2** | 📋 Phase 2 |
| **Educational Content** | `/learn/{slug}` | How-to guides, cost guides, contractor selection advice; builds domain authority and captures informational queries | **P2** | 📋 Phase 2 |

### 2.2 Next.js Route Implementation

| Page Type | Route File | Data Source | SSR/SSG |
|-----------|-----------|-------------|---------|
| **City Hub** | `app/(public)/[city]/masonry/page.tsx` | `getProjectsByCity()` → Supabase `projects` table filtered by city | SSR (dynamic) |
| **Service Type by City** | `app/(public)/[city]/masonry/[type]/page.tsx` | `getProjectsByCityAndType()` → Supabase `projects` filtered by city + `service_type` | SSR (dynamic) |
| **Project Detail** | `app/(public)/[city]/masonry/[type]/[slug]/page.tsx` | `getProjectBySlug()` → Supabase `projects` joined with `contractors` | SSR (dynamic) |
| **Contractor Profile** | `app/(public)/contractor/[username]/page.tsx` | `getContractorProfile()` → Supabase `contractors` + `projects` | SSR (dynamic) |
| **National Service Landing** | `app/(public)/services/[type]/page.tsx` | `getCitiesByServiceType()` → Distinct cities offering service type | SSR (dynamic) |
| **Educational Content** | `app/(public)/learn/[slug]/page.tsx` | Markdown files or CMS integration (TBD) | SSG (static) |

**Implementation Notes:**
- **P1 Priority:** `app/(public)/[city]/masonry/[type]/page.tsx` is the next critical route to implement
- **Parallel Static Generation:** Future optimization to pre-render top 50-100 city/service combinations
- **Structured Data:** All public pages must include JSON-LD structured data (see Section 5.3)

---

## 3. Contractor Acquisition Funnel

### 3.1 Organic Acquisition Channels

| Channel | Strategy | Content Type | Target Audience | Timeline |
|---------|----------|--------------|-----------------|----------|
| **Google Search (B2B)** | Target "contractor portfolio website", "AI for contractors", "masonry business marketing" | Homepage + /for-contractors landing page (P2) | Contractors actively seeking marketing solutions | Phase 2 |
| **Industry Forums** | Authentic participation in r/masonry, ContractorTalk, Masonry Forum; link to portfolio examples when helpful | Example portfolios, how-to content | Contractors seeking advice/tools | Ongoing |
| **Trade Associations** | Partner with regional masonry associations; offer free portfolio tool to members | Co-branded landing pages, association testimonials | Association members looking to improve online presence | Phase 3 |
| **Existing Contractor Referrals** | Incentivize early contractors to refer peers (e.g., premium features, revenue share) | Referral dashboard, email templates | Satisfied contractors with contractor networks | MVP launch |
| **Local Outreach** | Direct outreach to highly-rated local contractors via email/phone; personalized demo of AI portfolio | One-on-one demos, custom portfolio previews | Top-rated contractors with weak online presence | Phase 1 |

### 3.2 Content Marketing Funnel

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWARENESS                                │
│  Keywords: "how to market masonry business", "contractor SEO"    │
│  Content: Blog posts, YouTube tutorials, LinkedIn articles       │
│  Goal: Establish authority, build email list                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CONSIDERATION                              │
│  Keywords: "best contractor portfolio website", "AI portfolio"   │
│  Content: Case studies, portfolio examples, comparison guides    │
│  Goal: Demonstrate value, show before/after examples             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DECISION                                 │
│  Keywords: "knearme pricing", "contractor portfolio cost"        │
│  Content: Pricing page, FAQ, onboarding video                    │
│  Goal: Convert to signup, reduce friction in onboarding          │
└─────────────────────────────────────────────────────────────────┘
```

**Example Content Pieces by Stage:**

- **Awareness:**
  - "5 Ways Masonry Contractors Can Get More Leads Without Paying for Ads"
  - "Why Every Contractor Needs a Portfolio in 2025"

- **Consideration:**
  - "How AI Can Build Your Contractor Portfolio in 30 Minutes (Case Study)"
  - "Traditional Website vs. AI Portfolio: What's Best for Your Business?"

- **Decision:**
  - "How KNearMe Works: From Interview to Live Portfolio in 3 Steps"
  - "Pricing & Plans: What's Included in the Free vs. Premium Portfolio"

### 3.3 Landing Page Strategy

**Phase 1 (MVP):**
- **Primary Landing Page:** Homepage (`app/page.tsx`)
  - Dual messaging: Homeowners (find contractors) + Contractors (build portfolio)
  - Above-the-fold split: "Find Masonry Contractors" vs. "Showcase Your Work"
  - CTA: "Browse Projects" (homeowners) + "Create Free Portfolio" (contractors)

**Phase 2 (Post-MVP):**
- **Contractor-Specific Landing:** `/for-masonry-contractors`
  - Headline: "Build Your Portfolio in 30 Minutes with AI"
  - Social proof: Example portfolios, testimonials
  - Value props: No coding, voice interview, SEO optimized
  - CTA: "Start Free Portfolio"

- **How It Works:** `/how-it-works`
  - Step-by-step walkthrough with screenshots
  - Embedded demo video
  - FAQ section

- **Pricing:** `/pricing`
  - Free vs. Premium tier comparison
  - Transparent pricing (avoid "Contact Us")
  - CTA: "Start Free" with upgrade path

---

## 4. Keyword Strategy

### 4.1 Homeowner Search Keywords

| Keyword Pattern | Example | Search Volume (Denver) | Competition | Priority |
|-----------------|---------|------------------------|-------------|----------|
| **{service} in {city}** | "chimney repair in Denver" | 880/mo | Medium | **P0** |
| **{service} near me** | "tuckpointing near me" | 1,300/mo (national) | High | **P1** |
| **best {service} {city}** | "best masonry Denver" | 320/mo | Low | **P1** |
| **{service} cost {city}** | "chimney rebuild cost Denver" | 210/mo | Low | **P2** |
| **{city} {service} contractors** | "Denver masonry contractors" | 590/mo | Medium | **P0** |
| **{service} {city} reviews** | "chimney repair Denver reviews" | 140/mo | Low | **P2** |

**Data Source:** Google Keyword Planner, Ahrefs (Denver metro as reference market)

**Target Ranking Strategy:**
- **Page Type:** Service Type by City pages (`/{city}/masonry/{type}`)
- **On-Page Optimization:** H1 = "{Service} in {City}", rich project gallery, city-specific intro paragraph
- **Structured Data:** LocalBusiness + Service schema with aggregateRating

### 4.2 Target Service Keywords (Masonry)

Based on `/docs/content-planning/masonry/content-plan.md`, prioritize these service types:

| Service Type | Keyword Variations | Avg. Search Volume | Slug |
|--------------|-------------------|-------------------|------|
| **Chimney Repair** | chimney repair, chimney rebuild, chimney restoration | 2,400/mo | `chimney-repair` |
| **Tuckpointing** | tuckpointing, repointing, mortar repair | 1,800/mo | `tuckpointing` |
| **Brick Repair** | brick repair, brick replacement, brick restoration | 1,600/mo | `brick-repair` |
| **Stone Masonry** | stone masonry, stone walls, retaining walls | 1,200/mo | `stone-masonry` |
| **Foundation Repair** | foundation repair, masonry foundation, foundation waterproofing | 3,600/mo | `foundation-repair` |
| **Historic Restoration** | historic masonry, historic brick restoration | 480/mo | `historic-restoration` |

**Implementation in Database:**
- `projects.service_type` column must use these exact slugs
- Service Type by City pages dynamically filter by these values
- National Service Landing pages (`/services/{type}`) use these as route parameters

### 4.3 Contractor Acquisition Keywords (B2B)

| Keyword | Monthly Volume | Competition | Target Landing Page | Priority |
|---------|----------------|-------------|---------------------|----------|
| **contractor portfolio website** | 720 | Low | `/for-masonry-contractors` | **P2** |
| **AI for contractors** | 880 | Medium | Homepage (Phase 2 messaging) | **P3** |
| **masonry business marketing** | 320 | Low | Blog/Learn section | **P3** |
| **how to get masonry leads** | 590 | Medium | Educational content | **P3** |
| **contractor website builder** | 1,900 | High | `/for-masonry-contractors` | **P2** |
| **free contractor portfolio** | 210 | Low | Homepage CTA | **P2** |

**Strategy Notes:**
- **Phase 2 Focus:** Contractor keywords are lower priority than homeowner keywords in MVP
- **Content-First Approach:** Target these via blog posts and educational content before building dedicated landing pages
- **Conversion Metric:** Track "contractor signups from organic B2B search" separately from referrals

### 4.4 Content-to-Route Keyword Mapping

Based on `/docs/content-planning/masonry/content-plan.md`:

| Content Topic (from Workspace Plan) | Target Route | Primary Keyword | Search Volume |
|-------------------------------------|--------------|-----------------|---------------|
| **Chimney Repair Costs** | `/learn/chimney-repair-cost-guide` | "how much does chimney repair cost" | 1,600/mo |
| **Tuckpointing vs Repointing** | `/learn/tuckpointing-vs-repointing` | "difference between tuckpointing and repointing" | 880/mo |
| **How to Choose a Mason** | `/learn/how-to-choose-masonry-contractor` | "how to find a good mason" | 720/mo |
| **Historic Brick Restoration** | `/learn/historic-brick-restoration-guide` | "historic brick restoration" | 320/mo |
| **Foundation Waterproofing** | `/learn/foundation-waterproofing-guide` | "how to waterproof masonry foundation" | 590/mo |
| **Stone Retaining Wall Costs** | `/learn/stone-retaining-wall-cost` | "stone retaining wall cost" | 480/mo |

**Implementation Plan (Phase 2):**
1. Create `/learn` route group in Next.js: `app/(public)/learn/[slug]/page.tsx`
2. Content storage: MDX files in `content/learn/` directory
3. Internal linking: Each article links to 2-3 relevant City Hub or Service Type pages
4. Structured Data: Article schema with author, datePublished, breadcrumbs

---

## 5. Internal Linking Architecture

### 5.1 Site Hierarchy & Link Flow

```
Homepage (/)
│
├─── City Hubs (/{city}/masonry)
│    │
│    ├─── Service Type by City (/{city}/masonry/{type})
│    │    │
│    │    └─── Project Detail (/{city}/masonry/{type}/{slug})
│    │         │
│    │         └─── Contractor Profile (/contractor/{username})
│    │
│    └─── All Projects in City (paginated list)
│
├─── National Service Landing (/services/{type})
│    │
│    ├─── Links to City Hubs offering service
│    │
│    └─── Educational content about service
│
└─── Learn Section (/learn)
     │
     ├─── Educational Articles (/learn/{slug})
     │
     └─── Links to City Hubs + Service Pages
```

**Key Principles:**
- **Upward Links:** Every page links back to its parent (breadcrumbs)
- **Horizontal Links:** Related projects, related services, related cities
- **Downward Links:** Hub pages link to all child pages (service types, projects)
- **Cross-Linking:** Educational content links to transactional pages (hubs, service pages)

### 5.2 Internal Link Requirements by Page Type

| Page Type | Must Link To | Optional Links | Anchor Text Strategy |
|-----------|--------------|----------------|---------------------|
| **Homepage** | Top 3-5 City Hubs (Denver, Lakewood, Colorado Springs, etc.) | Featured projects, /for-contractors | Exact match: "{City} Masonry" |
| **City Hub** | All Service Type by City pages for that city; Homepage (breadcrumb) | Featured projects in city; Nearby cities | Exact match: "{Service} in {City}" |
| **Service Type by City** | All projects of that service type in city; Parent City Hub (breadcrumb) | Related service types in same city; Same service in nearby cities | Project name + city context |
| **Project Detail** | Contractor Profile; Parent Service Type page (breadcrumb) | 3-4 related projects (same city OR same service); Educational content related to service | Contractor name; "More {service} projects" |
| **Contractor Profile** | All contractor's projects; City Hub where contractor is based | Social media links; Contact form | Project names |
| **National Service Landing** | City Hubs offering this service (sorted by # of projects) | Educational content; Related services | "{Service} in {City}" |
| **Educational Content** | 2-3 relevant City Hubs or Service Type pages | Related articles; National Service Landing | Exact match keywords in context |

### 5.3 Related Projects Component Specification

**Purpose:** Increase pageviews and session duration by surfacing related projects on Project Detail pages.

**Algorithm:**
```typescript
// Pseudocode for related projects query
async function getRelatedProjects(currentProject: Project, limit = 4) {
  // Priority 1: Same service type in same city
  const sameCityService = await supabase
    .from('projects')
    .select('*')
    .eq('city', currentProject.city)
    .eq('service_type', currentProject.service_type)
    .neq('id', currentProject.id)
    .limit(2)

  // Priority 2: Same service type in different city
  const sameService = await supabase
    .from('projects')
    .select('*')
    .eq('service_type', currentProject.service_type)
    .neq('city', currentProject.city)
    .neq('id', currentProject.id)
    .limit(2)

  return [...sameCityService, ...sameService].slice(0, limit)
}
```

**Component Location:** `app/(public)/[city]/masonry/[type]/[slug]/page.tsx`

**UI Placement:** Below project description, above contractor CTA

**Link Structure:**
```tsx
<a href="/{project.city}/masonry/{project.service_type}/{project.slug}">
  {project.title}
</a>
```

**Performance:** Server Component with parallel data fetching; no client-side JS required

**Structured Data:** Each related project link includes thumbnail image for visual engagement

---

## 6. Content Types & Templates

### 6.1 Programmatic Content (Auto-Generated)

#### City Hub Page Template

**URL Pattern:** `/{city-slug}/masonry`

**H1 Format:** `Masonry Contractors in {City Name}, {State}`

**Page Structure:**
- **Hero Section:**
  - H1 heading
  - City stats (contractor count, project count)
  - CTA: "Get Started" → Voice interview flow

- **Service Type Badges:**
  - Filterable service types (chimney repair, tuckpointing, stone restoration, etc.)
  - Click filters project grid to service type

- **Featured Contractors Section:**
  - Top 3-5 contractors by ranking algorithm
  - Profile cards: name, specialty, project count, rating

- **Project Grid:**
  - All published projects in city
  - Masonry layout (responsive)
  - Sort: recent, popular, featured
  - Pagination/infinite scroll

- **SEO Footer:**
  - City-specific content block (200-300 words)
  - Links to service type pages
  - Links to nearby cities

**JSON-LD Schema:**
```json
{
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "LocalBusiness",
      "name": "{contractor name}",
      "address": "{city address}",
      "aggregateRating": {...}
    }
  ]
}
```

---

#### Service Type Page Template (NEW - Phase 2)

**URL Pattern:** `/{city-slug}/masonry/{service-type-slug}`

**Examples:**
- `/denver-co/masonry/chimney-repair`
- `/lakewood-co/masonry/tuckpointing`
- `/aurora-co/masonry/stone-restoration`

**H1 Format:** `{Service Type} in {City Name}, {State}`

**Page Structure:**
- **Hero Section:**
  - H1 heading
  - Service-specific stats (project count for service in city)
  - Brief description (150-200 words) of service type
  - CTA: "Find a {Service} Contractor"

- **Service Description:**
  - Auto-generated content (400-500 words)
  - Common use cases, typical timelines, cost considerations
- Generated via AI SDK (Gemini 3 Flash preview) with city + service type context

- **Filtered Project Grid:**
  - Only projects tagged with this service type
  - Same masonry layout as city hub
  - Contractor attribution on each project card

- **Featured Contractors:**
  - Contractors with most projects in this service type
  - Filtered to city

- **Related Services:**
  - Links to other service types in same city
  - Example: Chimney Repair → Tuckpointing, Masonry Cleaning

**JSON-LD Schema:**
```json
{
  "@type": "Service",
  "serviceType": "{service type}",
  "areaServed": {
    "@type": "City",
    "name": "{city name}"
  },
  "provider": {
    "@type": "ItemList",
    "itemListElement": [...]
  }
}
```

---

#### Project Detail Template

**URL Pattern:** `/{city-slug}/masonry/{project-slug}`

**H1 Format:** AI-generated project title (e.g., "Historic Brick Chimney Restoration in Capitol Hill")

**Page Structure:**
- **Hero Image:**
  - Primary project image (optimized via Next.js Image)
  - Lazy loading, blur placeholder

- **Project Header:**
  - H1: AI-generated title
  - Breadcrumbs: Home > {City} > Masonry > {Project}
  - Service type badges
  - Publication date

- **Project Description:**
  - 400-600 words, AI-generated from contractor interview
- Gemini 3 Flash (preview) image analysis insights
  - Structured paragraphs: challenge, solution, outcome

- **Image Gallery:**
  - Masonry grid layout
  - Before/after toggle (if applicable)
  - Lightbox on click
  - Alt text: AI-generated, keyword-optimized

- **Contractor Attribution:**
  - Profile card with CTA to full profile
  - Company name, rating, project count
  - Link: `/contractors/{contractor-slug}`

- **Related Projects:**
  - 3-4 similar projects (same service type or city)
  - Recommendation algorithm: service type match > city match > recency

- **Metadata:**
  - Tags/categories visible to user
  - Share buttons (social meta tags)

**JSON-LD Schema (Multiple Types):**
```json
[
  {
    "@type": "Article",
    "headline": "{project title}",
    "author": {
      "@type": "LocalBusiness",
      "name": "{contractor name}"
    },
    "datePublished": "{ISO date}",
    "image": ["{image URLs}"]
  },
  {
    "@type": "ImageGallery",
    "image": [...]
  },
  {
    "@type": "LocalBusiness",
    "name": "{contractor name}",
    "address": {...},
    "aggregateRating": {...}
  }
]
```

---

### 6.2 Editorial Content (Human + AI)

#### Content Mapping from Workspace Plans

| Content Category | Source Document | Target Page Type | Template Location |
|-----------------|----------------|------------------|-------------------|
| **Service Pages** | `/docs/content-planning/masonry/content-plan.md` Section 1 | Static service landing pages | `app/(public)/services/[service]/page.tsx` |
| **Educational Articles** | `/docs/content-planning/masonry/content-plan.md` Section 2 | Blog/Resource center | `app/(public)/resources/[slug]/page.tsx` |
| **Problem-Solution Guides** | `/docs/content-planning/masonry/content-plan.md` Section 3 | How-to guides | `app/(public)/guides/[slug]/page.tsx` |
| **Chimney-Specific** | `/docs/content-planning/chimney/content-plan.md` | Service + educational pages | Same as above |

---

#### Service Page Template (Editorial)

**URL Pattern:** `/services/{service-slug}` (national, no city)

**Example URLs:**
- `/services/chimney-repair`
- `/services/tuckpointing`
- `/services/stone-veneer-installation`

**H1 Format:** `{Service Type}: Expert Guide & Top Contractors`

**Content Blocks:**
1. **Hero:**
   - H1 heading
   - Overview (150-200 words)
   - CTA: "Find Local Contractors"

2. **Service Deep Dive:**
   - What is {service}? (300-400 words)
   - When you need it
   - Common issues solved
   - Process overview

3. **Cost & Timeline:**
   - Typical cost ranges
   - Timeline expectations
   - Factors affecting cost
   - (Source: masonry/content-plan.md Section 1)

4. **Featured Projects:**
   - 6-8 top projects with this service type
   - Links to project detail pages

5. **Find Contractors by City:**
   - Grid of city links
   - Format: `/[city-slug]/masonry/{service-slug}`

6. **FAQ Section:**
   - 5-7 common questions
   - FAQ schema for featured snippets

**JSON-LD Schema:**
```json
{
  "@type": "FAQPage",
  "mainEntity": [...]
}
```

---

#### Educational Article Template

**URL Pattern:** `/resources/{article-slug}`

**Example URLs:**
- `/resources/signs-your-chimney-needs-repair`
- `/resources/choosing-the-right-masonry-contractor`
- `/resources/understanding-masonry-restoration-costs`

**H1 Format:** Article title (optimized for long-tail keywords)

**Content Structure:**
1. **Introduction:** Problem statement (150-200 words)
2. **Main Content:** 1,500-2,500 words
   - H2/H3 subheadings (keyword-optimized)
   - Bulleted lists for scannability
   - Images/diagrams (custom or stock)
3. **Real Project Examples:** 2-3 embedded project cards
4. **Expert Tips:** Pull quotes from contractor interviews
5. **CTA:** "Need help with {topic}? Find a contractor in your city"
6. **Related Resources:** 3-4 links to related articles/guides

**Source Content:** `/docs/content-planning/masonry/content-plan.md` Section 2
- 8 educational articles planned
- Topics cover homeowner pain points + SEO keywords

**JSON-LD Schema:**
```json
{
  "@type": "Article",
  "headline": "{title}",
  "author": {
    "@type": "Organization",
    "name": "KNearMe"
  },
  "publisher": {...},
  "datePublished": "{ISO date}",
  "mainEntityOfPage": "{URL}"
}
```

---

#### Problem-Solution Guide Template

**URL Pattern:** `/guides/{guide-slug}`

**Example URLs:**
- `/guides/how-to-fix-chimney-crown-cracks`
- `/guides/repointing-brick-walls`
- `/guides/preventing-efflorescence-on-brick`

**H1 Format:** "How to {Solve Problem}: Complete Guide"

**Content Structure:**
1. **Problem Overview:** What, why it happens (200-300 words)
2. **When to DIY vs Hire a Pro:** Decision tree
3. **Step-by-Step Process:** (If applicable)
   - Numbered steps with images
   - Tools/materials needed
4. **Professional Solution:** What contractors do differently
5. **Featured Projects:** Before/after examples
6. **Find a Contractor CTA:** City-specific links
7. **Related Guides:** Cross-links

**Source Content:** `/docs/content-planning/masonry/content-plan.md` Section 3

**JSON-LD Schema:**
```json
{
  "@type": "HowTo",
  "name": "{title}",
  "step": [
    {
      "@type": "HowToStep",
      "name": "{step name}",
      "text": "{step description}",
      "image": "{step image URL}"
    }
  ]
}
```

---

### Content Production Workflow

**AI-Assisted Content Creation:**
1. **Outline Generation:** Gemini 3 Flash (preview) from content plan + keyword research
2. **First Draft:** AI writes 60-70% of content
3. **Human Editing:** Subject matter expert reviews, adds nuance (30-40%)
4. **Image Sourcing:** Mix of project portfolio images + stock
5. **SEO Review:** Keyword density, meta tags, internal links
6. **Publish + Monitor:** Track rankings, update quarterly

**Content Calendar (from workspace plans):**
- **Month 1-2:** 4 service pages (top-priority services)
- **Month 3-4:** 4 educational articles
- **Month 5-6:** 4 problem-solution guides
- **Ongoing:** Quarterly updates based on GSC data

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Current - December 2024)

**Status: COMPLETE**

#### Technical SEO Infrastructure
- [x] **Project detail pages with SEO**
  - Dynamic meta tags (title, description, OG tags)
  - JSON-LD structured data (Article, ImageGallery, LocalBusiness)
  - Canonical URLs
  - Breadcrumb navigation
  - File: `app/(public)/[city]/masonry/[project]/page.tsx`

- [x] **City hub pages**
  - Programmatic city landing pages
  - Dynamic stats (contractor count, project count)
  - Project grid with filtering
  - JSON-LD ItemList schema
  - File: `app/(public)/[city]/masonry/page.tsx`

- [x] **Contractor profile pages**
  - Public profile with portfolio
  - Contact information
  - JSON-LD LocalBusiness schema
  - File: `app/(public)/contractors/[slug]/page.tsx`

- [x] **Dynamic sitemap**
  - Auto-generates from database
  - Includes city hubs, projects, contractor profiles
  - Updates on new content publish
  - File: `app/sitemap.ts`

- [x] **robots.txt**
  - Allows all crawlers
  - Sitemap reference
  - File: `public/robots.txt`

- [x] **JSON-LD structured data**
  - `generateJsonLd()` utility function
  - Multiple schema types per page
  - File: `src/lib/seo/json-ld.ts`

- [x] **Core Web Vitals optimization**
  - Next.js Image component (lazy loading, blur placeholders)
  - Route-based code splitting
  - Server Components for fast initial load
  - LCP target: <2.5s, CLS target: <0.1

- [x] **Image optimization**
  - Automatic WebP conversion
  - Responsive image sizes
  - Alt text generation (AI-assisted)

- [x] **PWA manifest**
  - App icons, theme colors
  - File: `app/manifest.ts`

---

### Phase 2: Expansion (January - February 2025)

**Goal:** Double indexed pages, establish internal linking graph, begin ranking for competitive terms

#### New Page Types
- [ ] **Service type by city pages**
  - Template: `/{city-slug}/masonry/{service-type-slug}`
  - Auto-generate for all city + service combinations
  - Initial: 10 cities × 6 service types = 60 new pages
  - Priority: Denver, Lakewood, Aurora, Colorado Springs (high project volume)
  - File: Create `app/(public)/[city]/masonry/[service]/page.tsx`

#### Internal Linking Automation
- [ ] **Related projects component**
  - Algorithm: Same service type > Same city > Recent
  - Display 3-4 related projects on each project detail page
  - Component: `src/components/seo/RelatedProjects.tsx`

- [ ] **City-to-city navigation**
  - "Find {service} contractors in nearby cities"
  - Geospatial query (cities within 50 miles)
  - Footer component on city hub pages

- [ ] **Breadcrumb schema**
  - Add BreadcrumbList JSON-LD
  - Visual breadcrumbs already exist, add schema markup
  - File: Update `src/lib/seo/json-ld.ts`

#### Search Console Setup
- [ ] **Google Search Console verification**
  - Add site property
  - Verify via DNS or HTML file
  - Submit sitemap: `https://knearme.com/sitemap.xml`

- [ ] **Index coverage monitoring**
  - Weekly check for crawl errors
  - Fix 404s, soft 404s, redirect chains
  - Target: 95%+ pages indexed within 30 days

- [ ] **Google Analytics 4 setup**
  - Event tracking: project views, contractor profile clicks
  - Goal: contractor profile CTA clicks
  - Integration: `next-google-analytics` package

#### Keyword Ranking Tracking
- [ ] **Tool selection**
  - Option A: Use workspace `rank-tracking/local-beacon` (self-hosted)
  - Option B: Ahrefs or SEMrush subscription
  - Track 50-100 target keywords

**Success Metrics (End of Phase 2):**
- 200+ indexed pages (from ~50 current)
- 10+ keywords in top 50 positions
- 100+ organic clicks/week
- 5+ contractor signups attributed to organic search

---

### Phase 3: Authority Building (March - June 2025)

**Goal:** Establish KNearMe as authoritative source for masonry/contractor content, rank for informational queries

#### Editorial Content Production
- [ ] **National service landing pages**
  - Template: `/services/{service-slug}`
  - 8 service pages (from content plan):
    1. Chimney Repair
    2. Tuckpointing
    3. Stone Veneer Installation
    4. Brick Cleaning/Restoration
    5. Chimney Crown Repair
    6. Efflorescence Removal
    7. Masonry Waterproofing
    8. Historic Masonry Restoration
  - Source: `/docs/content-planning/masonry/content-plan.md` Section 1

- [ ] **Educational content hub**
  - Template: `/resources/{article-slug}`
  - Create landing page: `/resources`
  - Category filters: service type, city, topic

- [ ] **8 educational articles**
  - Source: `/docs/content-planning/masonry/content-plan.md` Section 2
  - Target keywords: informational intent (what, why, how)
  - Examples:
    - "Signs Your Chimney Needs Repair"
    - "Understanding Masonry Restoration Costs"
    - "Choosing the Right Masonry Contractor"
  - Production: 2 articles/month × 4 months

- [ ] **8 problem-solution guides**
  - Source: `/docs/content-planning/masonry/content-plan.md` Section 3
  - HowTo schema for featured snippets
  - Examples:
    - "How to Fix Chimney Crown Cracks"
    - "Repointing Brick Walls: Complete Guide"
    - "Preventing Efflorescence on Brick"
  - Production: 2 guides/month × 4 months

#### Advanced Schema Markup
- [ ] **FAQ schema on service pages**
  - 5-7 FAQs per service page
  - Target featured snippet positions
  - File: Update `src/lib/seo/json-ld.ts` with `generateFAQSchema()`

- [ ] **Review/rating schema**
  - Contractor profile pages
  - AggregateRating schema
  - Requires: Implement contractor review system (future feature)

- [ ] **HowTo schema**
  - Problem-solution guide pages
  - Step-by-step structured data
  - Images for each step

#### Backlink Acquisition Strategy
- [ ] **Industry directory submissions**
  - Submit to masonry/construction directories
  - Local chambers of commerce
  - Better Business Bureau listings

- [ ] **Guest posting**
  - Home improvement blogs
  - Local news sites (city-specific)
  - Contractor associations

- [ ] **PR/outreach**
  - Press release: "AI-Powered Contractor Portfolios Launch"
  - Reach out to construction journalists
  - Local business features

- [ ] **Contractor partnerships**
  - Encourage contractors to link from their websites
  - "Powered by KNearMe" badge program
  - Mutual link exchange (their site ↔ their profile)

**Success Metrics (End of Phase 3):**
- 500+ indexed pages
- 25+ keywords in top 20 positions
- 500+ organic clicks/week
- 10+ referring domains (backlinks)
- 20+ contractor signups attributed to content

---

### Phase 4: Scale (July - December 2025)

**Goal:** Geographic expansion, dominate local searches in top 50 US cities

#### Multi-City Expansion
- [ ] **Expand to 50 cities**
  - Priority: Top 50 metro areas by population
  - Auto-generate city hub pages for each
  - Target: 50 cities × 6 service types = 300 new pages

- [ ] **City-to-city internal linking**
  - "Nearby cities" component on city hub pages
  - State-level landing pages: `/colorado/masonry`
  - Geospatial clustering (cities within regions)

- [ ] **Local content customization**
  - City-specific stats (avg project cost, climate considerations)
  - Local building codes/regulations (future)
  - City hero images (skyline, landmarks)

#### Advanced SEO Features
- [ ] **Sitemap split for >50k URLs**
  - Split into multiple sitemaps by content type
  - Sitemap index file
  - File: Update `app/sitemap.ts`

- [ ] **hreflang tags (future international expansion)**
  - Language/region targeting
  - Initially: US English only
  - Future: Spanish, Canadian English

- [ ] **Featured snippet optimization**
  - Target "People also ask" queries
  - Optimize FAQ schema
  - Monitor GSC "Rich Results" report

**Success Metrics (End of Phase 4):**
- 2,000+ indexed pages
- 100+ keywords in top 10 positions
- 2,000+ organic clicks/week
- 100+ contractor signups attributed to organic search
- Expand to 3+ additional trade types (plumbing, HVAC, etc.)

---

## 8. Success Metrics

### 8.1 SEO KPIs

| Metric | Baseline (Dec 2024) | 3-Month Target (Mar 2025) | 6-Month Target (Jun 2025) | 12-Month Target (Dec 2025) | Tool |
|--------|---------------------|---------------------------|---------------------------|----------------------------|------|
| **Indexed Pages** | 50 | 200 | 500 | 2,000 | Google Search Console |
| **Organic Clicks/Month** | 50 | 500 | 2,000 | 8,000 | Google Search Console |
| **Organic Impressions/Month** | 1,000 | 10,000 | 50,000 | 200,000 | Google Search Console |
| **Average Keyword Position (Top 50 Keywords)** | Not ranking | 35 | 20 | 12 | Ahrefs / rank-tracking/local-beacon |
| **Keywords in Top 10** | 0 | 5 | 25 | 100 | Ahrefs / rank-tracking/local-beacon |
| **Keywords in Top 20** | 0 | 10 | 50 | 200 | Ahrefs / rank-tracking/local-beacon |
| **Referring Domains (Backlinks)** | 1 | 5 | 15 | 50 | Ahrefs |
| **Domain Authority (DA)** | 10 | 15 | 25 | 40 | Moz |
| **Core Web Vitals - LCP** | 2.1s | <2.5s | <2.0s | <1.5s | PageSpeed Insights |
| **Core Web Vitals - CLS** | 0.08 | <0.1 | <0.05 | <0.05 | PageSpeed Insights |
| **Core Web Vitals - FID** | 50ms | <100ms | <100ms | <100ms | PageSpeed Insights |
| **Mobile Usability Score** | 95 | 98 | 100 | 100 | Google Search Console |

---

### 8.2 Contractor Acquisition KPIs

| Metric | Baseline (Dec 2024) | 3-Month Target (Mar 2025) | 6-Month Target (Jun 2025) | 12-Month Target (Dec 2025) | Measurement Method |
|--------|---------------------|---------------------------|---------------------------|----------------------------|-------------------|
| **Contractor Signups (Total)** | 5 | 25 | 75 | 250 | Supabase `profiles` table |
| **Contractor Signups (Organic Search)** | 0 | 5 | 20 | 100 | GA4 attribution (UTM source) |
| **Projects Published** | 15 | 75 | 300 | 1,200 | Supabase `projects` table |
| **Active Contractors (Published ≥1 Project)** | 3 | 15 | 50 | 150 | SQL query: `COUNT(DISTINCT contractor_id)` |
| **Avg Projects per Contractor** | 5 | 5 | 6 | 8 | Total projects / active contractors |
| **Contractor Referral %** | 0% | 10% | 20% | 30% | Referral code tracking (future) |
| **Content-Attributed Signups** | 0 | 3 | 10 | 40 | GA4 attribution (landing page = `/resources/*` or `/guides/*`) |
| **Profile Completion Rate** | 60% | 75% | 85% | 90% | % contractors with complete profile |
| **Contractor Retention (3-Month)** | N/A | 70% | 75% | 80% | % contractors still active after 90 days |

---

### 8.3 Monitoring Cadence

| Activity | Frequency | Tool(s) | Owner | Action Items |
|----------|-----------|---------|-------|--------------|
| **Keyword Ranking Review** | Weekly | Ahrefs / rank-tracking/local-beacon | SEO Lead | Track position changes, identify quick wins |
| **Index Coverage Check** | Weekly | Google Search Console | SEO Lead | Fix crawl errors, submit new pages for indexing |
| **Core Web Vitals Audit** | Weekly | PageSpeed Insights, GSC | Engineering | Address performance regressions |
| **Backlink Monitoring** | Bi-weekly | Ahrefs | SEO Lead | Identify new backlinks, disavow toxic links |
| **Content Performance Review** | Monthly | GA4, GSC | Content Lead | Identify top performers, update underperforming content |
| **Competitor Analysis** | Monthly | Ahrefs, SEMrush | SEO Lead | Track competitor rankings, identify content gaps |
| **Contractor Acquisition Review** | Monthly | GA4, Supabase | Product Lead | Analyze signup sources, optimize conversion funnel |
| **Quarterly SEO Strategy Review** | Quarterly | All tools | Leadership | Adjust roadmap based on performance, market changes |

---

## 9. Technical SEO Checklist

### 9.1 Already Implemented (Phase 1 - COMPLETE)

#### On-Page SEO
- [x] **Dynamic meta tags**
  - `<title>`: Unique, keyword-optimized per page
  - `<meta name="description">`: 150-160 characters
  - Implementation: `src/lib/seo/metadata.ts` → `generateMetadata()` function

- [x] **Open Graph (OG) tags**
  - `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
  - Optimized for social sharing (Facebook, LinkedIn)

- [x] **Twitter Card tags**
  - `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
  - Large image format for project images

- [x] **Canonical URLs**
  - `<link rel="canonical">`: Prevents duplicate content issues
  - Format: `https://knearme.com/{path}`

#### Structured Data (JSON-LD)
- [x] **JSON-LD structured data**
  - Utility function: `src/lib/seo/json-ld.ts` → `generateJsonLd()`
  - Types implemented:
    - `Article` (project detail pages)
    - `ImageGallery` (project detail pages)
    - `LocalBusiness` (contractor profiles, project attribution)
    - `ItemList` (city hub pages)

#### Site Architecture
- [x] **XML sitemap**
  - Auto-generated from database
  - File: `app/sitemap.ts`

- [x] **robots.txt**
  - Allows all crawlers
  - Disallows: `/api/`, `/dashboard/`, `/_next/`
  - File: `public/robots.txt`

- [x] **Breadcrumb navigation**
  - Visual breadcrumbs on all pages
  - Format: Home > {City} > Masonry > {Project}

#### Performance Optimization
- [x] **Image optimization**
  - Next.js `<Image>` component (automatic WebP conversion)
  - Lazy loading with blur placeholders
  - Responsive sizes

- [x] **Core Web Vitals optimization**
  - **LCP (Largest Contentful Paint):** <2.5s
  - **CLS (Cumulative Layout Shift):** <0.1
  - **FID (First Input Delay):** <100ms

- [x] **Server Components**
  - All public pages use React Server Components
  - Reduces JavaScript bundle size by ~60%

---

### 9.2 To Implement (Phase 2+)

#### Enhanced Structured Data (Phase 2)
- [ ] **BreadcrumbList schema**
  - Add JSON-LD to existing visual breadcrumbs
  - File: Update `src/lib/seo/json-ld.ts` with `generateBreadcrumbSchema()`

- [ ] **FAQ schema on service pages** (Phase 3)
  - Target featured snippets
  - File: Create `generateFAQSchema()` in `src/lib/seo/json-ld.ts`

- [ ] **HowTo schema** (Phase 3)
  - Problem-solution guide pages
  - File: Create `generateHowToSchema()` in `src/lib/seo/json-ld.ts`

- [ ] **Review/rating schema** (Phase 3)
  - **Blocker:** Requires contractor review system implementation
  - File: Update `generateLocalBusinessSchema()` when reviews available

#### Site Architecture Enhancements
- [ ] **Sitemap split for >50k URLs** (Phase 4)
  - Split into multiple sitemaps by content type
  - Create sitemap index file

- [ ] **hreflang tags** (Phase 4+, Future International Expansion)
  - Currently: US English only
  - Future: Spanish (es-US), Canadian English (en-CA)

#### Analytics & Tracking
- [ ] **Enhanced Google Analytics 4 setup** (Phase 2)
  - Custom events: `contractor_signup`, `project_published`, `related_project_click`
  - File: Create `src/lib/analytics.ts` wrapper

---

## 10. Competitive Positioning

### 10.1 SEO Competitive Analysis

| Competitor | Domain Authority | Strengths | Weaknesses | Our Differentiator |
|------------|-----------------|-----------|------------|-------------------|
| **Houzz** | 91 | - Massive content library<br>- High DA, strong backlink profile<br>- Visual discovery | - Generic marketplace<br>- Pay-to-play visibility<br>- Limited local search focus | ✅ **Hyper-local focus:** City + service type landing pages<br>✅ **Free contractor profiles** |
| **Angi** | 83 | - Lead generation platform<br>- Review/rating system<br>- National brand recognition | - Focus on reviews, not portfolios<br>- Expensive for contractors | ✅ **Portfolio-first approach:** Real projects<br>✅ **No lead fees** |
| **Yelp** | 93 | - Dominant local search<br>- Review platform<br>- Strong mobile app | - Review-centric, minimal portfolios<br>- Aggressive sales tactics | ✅ **Contractor ownership:** Full profile control<br>✅ **Project storytelling** |
| **Instagram** | N/A | - Visual discovery<br>- Direct messaging<br>- Free organic reach | - No SEO value<br>- Ephemeral content<br>- Algorithm changes | ✅ **Google-indexed portfolios**<br>✅ **Permanent content** |

---

### 10.2 Content Gap Opportunities

High-priority underserved queries with low competition:

| Search Query | Monthly Volume | Competitor Weakness | KNearMe Strategy |
|--------------|----------------|---------------------|------------------|
| **"masonry project examples {city}"** | 100-500 | No city-specific portfolio aggregators | City hub pages with real project galleries |
| **"chimney repair portfolio"** | 200-500 | No competitor targets explicitly | Service type pages with featured projects |
| **"before after masonry repair"** | 500-1,000 | Pinterest/Houzz have poor SEO optimization | Before/after toggle feature, image optimization |
| **"{service} contractor reviews {city}"** | 100-300 | Yelp/Angi focus on reviews only, no portfolios | Project-based trust signals + future reviews |
| **"how to choose a {service} contractor"** | 1,000-2,000 | Generic advice, not localized | Editorial articles with local contractor links |

---

### 10.3 Competitive Advantage Summary

| Advantage | Description | Impact on SEO |
|-----------|-------------|---------------|
| **🚀 AI-Powered Content** | Gemini 3 Flash (preview) generates project descriptions 10x faster | Faster scaling (100s of projects/month) |
| **🎯 Hyper-Local Pages** | City + service type pages | Rank for long-tail local queries |
| **📷 Real Project Portfolios** | Contractors upload real photos | Higher engagement, lower bounce rate |
| **🆓 Free Contractor Profiles** | No pay-to-win bias | More contractor adoption → more content |
| **🔗 Contractor Backlinks** | Contractors link to KNearMe | Natural backlink acquisition |
| **📊 Structured Data Excellence** | JSON-LD on all pages | Rich results in SERPs |

---

## 11. Document References

### 11.1 Workspace-Level (Strategy Source of Truth)

| Document | Location | Purpose |
|----------|----------|---------|
| **Directory Ranking System** | `/docs/content-planning/directory-ranking-system.md` | Contractor ranking algorithm |
| **Editorial Workflow** | `/docs/content-planning/editorial-workflow.md` | Content creation process |
| **Masonry Content Plan** | `/docs/content-planning/masonry/content-plan.md` | Content calendar for masonry articles |
| **Chimney Content Plan** | `/docs/content-planning/chimney/content-plan.md` | Content calendar for chimney content |
| **AI-Powered Portfolio Concept** | `/docs/AI-POWERED-PORTFOLIO-CONCEPT.md` | Original product vision |

### 11.2 Project-Level (Implementation)

| Document | Location | Purpose |
|----------|----------|---------|
| **EPIC-005: SEO Implementation** | `/docs/02-requirements/epics/EPIC-005-seo.md` | Technical SEO requirements |
| **Vision Document** | `/docs/01-vision/vision.md` | Product strategy |
| **Launch Checklist** | `/docs/10-launch/launch-checklist.md` | Pre-launch validation |
| **Project CLAUDE.md** | `/knearme-portfolio/CLAUDE.md` | AI assistant guidance |

### 11.3 Code References

| File | Purpose |
|------|---------|
| **`src/lib/seo/metadata.ts`** | Generate Next.js metadata |
| **`src/lib/seo/json-ld.ts`** | Generate JSON-LD structured data |
| **`app/sitemap.ts`** | Dynamic XML sitemap generation |
| **`app/(public)/[city]/masonry/page.tsx`** | City hub page template |
| **`app/(public)/[city]/masonry/[project]/page.tsx`** | Project detail page template |
| **`app/(public)/contractors/[slug]/page.tsx`** | Contractor profile page template |

### 11.4 External Documentation

| Resource | URL | Use Case |
|----------|-----|----------|
| **Google Search Console** | https://search.google.com/search-console | Index coverage, keyword performance |
| **Google Analytics 4** | https://analytics.google.com | Traffic analysis, conversion tracking |
| **PageSpeed Insights** | https://pagespeed.web.dev | Core Web Vitals |
| **Google Rich Results Test** | https://search.google.com/test/rich-results | Validate JSON-LD |
| **schema.org** | https://schema.org | Structured data reference |

---

## Document Maintenance

**Ownership:** SEO Lead (or Product Lead if no dedicated SEO role)

**Update Cadence:**
- **Monthly:** Update Section 8 (Success Metrics) with actual performance data
- **Quarterly:** Review Section 7 (Roadmap) and adjust phases based on progress
- **As needed:** Add new content types to Section 6 when features launch

**Version History:**
- **v1.0 (Dec 2024):** Initial document creation

---

*This document bridges workspace-level content strategy with project-level implementation. For technical SEO implementation details, see EPIC-005-seo.md.*
