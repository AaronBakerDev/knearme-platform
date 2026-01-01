# EPIC-005: SEO & Performance

> **Version:** 1.0
> **Last Updated:** December 8, 2025
> **Status:** Ready for Development
> **Priority:** Must Have (MVP)

---

## Overview

Ensure all public pages are optimized for search engines and meet Core Web Vitals targets. This epic covers meta tags, structured data (Schema.org), sitemap generation, URL structure, image optimization delivery, and PWA capabilities.

### Business Value

- **Discovery**: SEO is the primary acquisition channel for homeowners
- **Local Search**: Ranking for "[city] masonry" queries drives leads
- **Trust**: Rich search results (stars, images) increase click-through
- **Performance**: Fast pages reduce bounce and improve conversions

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Lighthouse Performance | >80 mobile | CI checks |
| LCP | <2.5s | Real User Monitoring |
| Indexed pages | 100% published | Google Search Console |
| Rich result eligibility | >90% pages | Schema validator |

---

## User Stories

### US-005-01: Dynamic Meta Tags

**As a** search engine crawler
**I want to** find unique meta tags on each page
**So that** pages rank for relevant queries

#### Acceptance Criteria

- Given any public page
- When the HTML is rendered
- Then it includes unique `<title>`, `<meta description>`, and OG tags

- Given a project detail page
- When rendered
- Then meta tags include:
  - Title: AI-generated SEO title (60-70 chars)
  - Description: AI-generated meta description (150-160 chars)
  - OG image: Project hero image

- Given a contractor profile page
- When rendered
- Then meta tags include:
  - Title: "{Business Name} | Masonry Contractor in {City}"
  - Description: Business description excerpt
  - OG image: Profile photo or first project

**Meta Tag Templates:**

| Page Type | Title Format | Description |
|-----------|-------------|-------------|
| Project | "{Project Title} \| KnearMe" | AI SEO description |
| Contractor | "{Business} \| {City} Masonry" | Business desc excerpt |
| City Hub | "Masonry Contractors in {City}" | Dynamic based on content |
| Homepage | "KnearMe \| Masonry Portfolio Platform" | Static |

#### Technical Notes

- **Implementation**: Next.js Metadata API
- **Generation**: Server-side, cached
- **Validation**: Check max lengths

```typescript
// app/[city]/masonry/[type]/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const project = await getProject(params.slug);

  return {
    title: project.seo_title || `${project.title} | KnearMe`,
    description: project.seo_description,
    openGraph: {
      title: project.title,
      description: project.seo_description,
      images: [{ url: project.images[0]?.medium_url }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
    },
  };
}
```

---

### US-005-02: Schema.org Structured Data

**As a** search engine
**I want to** understand page content via structured data
**So that** I can show rich results

#### Acceptance Criteria

- Given a project detail page
- When rendered
- Then JSON-LD includes:
  - Article schema
  - ImageGallery schema
  - LocalBusiness reference

- Given a contractor profile page
- When rendered
- Then JSON-LD includes:
  - LocalBusiness schema
  - Service areas
  - Image

- Given I validate with Google Rich Results Test
- When testing any page
- Then no errors are reported

**Schema Examples:**

```json
// Project Page
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Historic Brick Chimney Rebuild in Denver",
  "image": ["url1", "url2"],
  "datePublished": "2025-12-01",
  "author": {
    "@type": "LocalBusiness",
    "name": "Heritage Masonry LLC",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Denver",
      "addressRegion": "CO"
    }
  },
  "publisher": {
    "@type": "Organization",
    "name": "KnearMe"
  }
}

// Contractor Profile
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Heritage Masonry LLC",
  "image": "logo-url",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Denver",
    "addressRegion": "CO"
  },
  "areaServed": [
    { "@type": "City", "name": "Denver" },
    { "@type": "City", "name": "Aurora" }
  ],
  "serviceType": ["Chimney Repair", "Tuckpointing", "Stone Work"]
}
```

#### Technical Notes

- **Implementation**: JSON-LD in `<script type="application/ld+json">`
- **Validation**: Test with schema.org validator
- **Updates**: Regenerate on content change

---

### US-005-03: XML Sitemap

**As a** search engine crawler
**I want to** find all pages via sitemap
**So that** I can index the full site

#### Acceptance Criteria

- Given the sitemap URL `/sitemap.xml`
- When requested
- Then it returns valid XML with all public pages

- Given a new project is published
- When the sitemap regenerates
- Then the new project URL is included

- Given the site has >50,000 URLs
- When requested
- Then sitemap index with multiple sitemaps is served

**Sitemap Structure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://knearme.com/denver-co/masonry/chimney-rebuild/historic-brick-2024</loc>
    <lastmod>2025-12-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- ... -->
</urlset>
```

#### Technical Notes

- **Generation**: On-demand or scheduled (every 6 hours)
- **Caching**: CDN cache for 1 hour
- **Split**: If >50k URLs, use sitemap index

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublishedProjects();
  const contractors = await getContractors();

  return [
    { url: 'https://knearme.com', lastModified: new Date() },
    ...projects.map((p) => ({
      url: `https://knearme.com/${p.city_slug}/masonry/${p.project_type_slug}/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...contractors.map((c) => ({
      url: `https://knearme.com/contractors/${c.city_slug}/${c.id}`,
      lastModified: c.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
```

---

### US-005-04: Robots.txt

**As a** search engine crawler
**I want to** know which pages to crawl
**So that** I respect site directives

#### Acceptance Criteria

- Given `/robots.txt` is requested
- When returned
- Then it allows all public pages
- And blocks admin/API routes
- And references sitemap

**Robots.txt:**
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /profile/
Disallow: /projects/new/

Sitemap: https://knearme.com/sitemap.xml
```

#### Technical Notes

- **Location**: `/public/robots.txt` or dynamic route
- **Environment**: Different for staging (Disallow: /)

---

### US-005-05: Canonical URLs

**As a** search engine
**I want to** know the canonical URL for each page
**So that** I don't index duplicates

#### Acceptance Criteria

- Given any page
- When rendered
- Then `<link rel="canonical">` is present
- And points to the preferred URL

- Given a page is accessible via multiple URLs
- When canonical is set
- Then all variations point to the same canonical

#### Technical Notes

- **Implementation**: Next.js metadata
- **Format**: Always include trailing behavior consistently

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    alternates: {
      canonical: `https://knearme.com/${params.city}/masonry/${params.type}/${params.slug}`,
    },
  };
}
```

---

### US-005-06: Core Web Vitals - LCP

**As a** visitor on mobile
**I want to** see the main content within 2.5 seconds
**So that** I don't abandon the page

#### Acceptance Criteria

- Given a project detail page on mobile 4G
- When measured
- Then LCP is <2.5 seconds

- Given a contractor profile page
- When measured
- Then LCP is <2.5 seconds

**Optimization Strategies:**
1. Hero image with `priority` and `fetchPriority="high"`
2. Critical CSS inlined
3. Server-side rendering
4. CDN for static assets

#### Technical Notes

- **Measurement**: Lighthouse CI, RUM
- **Reporting**: Web Vitals library
- **Target**: 75th percentile <2.5s

```typescript
// Priority loading for hero image
<Image
  src={project.images[0].full_url}
  alt={project.images[0].alt_text}
  priority
  fetchPriority="high"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

---

### US-005-07: Core Web Vitals - CLS

**As a** visitor reading content
**I want to** not have the page shift unexpectedly
**So that** I don't accidentally click wrong things

#### Acceptance Criteria

- Given any page loading
- When content renders
- Then CLS score is <0.1

- Given images are loading
- When space is reserved
- Then no layout shift occurs

**Prevention Strategies:**
1. Always specify image dimensions
2. Use aspect-ratio CSS
3. Reserve space for ads/embeds (N/A for MVP)
4. Font loading optimization

#### Technical Notes

- **Images**: Next.js Image auto-handles
- **Fonts**: `font-display: swap` with fallback
- **Skeleton**: Show loading placeholders

---

### US-005-08: Image Optimization Serving

**As a** visitor loading the page
**I want to** receive optimally sized images
**So that** the page loads fast

#### Acceptance Criteria

- Given I view a page on mobile
- When images load
- Then appropriately sized images are served
- And WebP format is used (with fallback)

- Given I view a page on desktop
- When images load
- Then larger images are served for the viewport
- And responsive srcset is used

**Responsive Image Strategy:**
```html
<img
  srcset="
    /images/thumb.webp 400w,
    /images/medium.webp 1200w,
    /images/full.webp 2400w
  "
  sizes="(max-width: 768px) 100vw, 50vw"
  src="/images/medium.webp"
  alt="Chimney rebuild before photo"
/>
```

#### Technical Notes

- **Delivery**: Next.js Image or Cloudflare Images
- **Formats**: WebP with JPEG fallback
- **Lazy Loading**: Below-fold images lazy loaded

---

### US-005-09: PWA - Add to Home Screen

**As a** contractor on mobile
**I want to** add KnearMe to my home screen
**So that** I can access it like a native app

#### Acceptance Criteria

- Given I visit on mobile Safari/Chrome
- When prompted (or via menu)
- Then I can "Add to Home Screen"
- And an icon appears on my phone

- Given I open from home screen
- When the app loads
- Then it opens in standalone mode (no browser chrome)
- And the splash screen shows briefly

**PWA Requirements:**
- Web App Manifest (`manifest.json`)
- Service Worker (basic caching)
- Icons (192x192, 512x512)
- Theme color

#### Technical Notes

- **Plugin**: `next-pwa` or manual implementation
- **Scope**: `/` for full app
- **Icons**: Generate with PWA asset generator

```json
// manifest.json
{
  "name": "KnearMe",
  "short_name": "KnearMe",
  "description": "Masonry Portfolio Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#f97316",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

### US-005-10: PWA - Offline Indicator

**As a** contractor with spotty connectivity
**I want to** know when I'm offline
**So that** I understand why things aren't working

#### Acceptance Criteria

- Given I lose network connectivity
- When I try to use the app
- Then I see a banner "You're offline"
- And basic cached pages still work

- Given I regain connectivity
- When online again
- Then the banner disappears
- And full functionality resumes

#### Technical Notes

- **Detection**: `navigator.onLine` + `online`/`offline` events
- **UI**: Toast or banner notification
- **Caching**: Cache static assets, show stale-while-revalidate for pages

```typescript
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
```

---

### US-005-11: SEO URL Structure

**As a** search engine
**I want to** understand page content from URLs
**So that** I can rank pages appropriately

#### Acceptance Criteria

- Given a project page URL
- When structured
- Then format is: `/[city-slug]/masonry/[project-type-slug]/[project-slug]`
- Example: `/denver-co/masonry/chimney-rebuild/historic-brick-2024`

- Given a contractor profile URL
- When structured
- Then format is: `/contractors/[city-slug]/[contractor-id]`
- Example: `/contractors/denver-co/abc123-def456`

**URL Patterns:**
| Page Type | Pattern | Example |
|-----------|---------|---------|
| Project | `/[city]/masonry/[type]/[slug]` | `/denver-co/masonry/chimney-rebuild/abc123` |
| Contractor | `/contractors/[city]/[id]` | `/contractors/denver-co/abc123-def456` |
| City Hub | `/[city]/masonry/` | `/denver-co/masonry/` |

#### Technical Notes

- **Slug Generation**: URL-safe, lowercase, hyphenated
- **Uniqueness**: Append UUID suffix if collision
- **Stability**: Never change after publish

```typescript
const generateSlug = (title: string, existingSlugs: string[]): string => {
  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

  if (existingSlugs.includes(slug)) {
    slug = `${slug}-${nanoid(6)}`;
  }

  return slug;
};
```

---

### US-005-12: Social Share Preview (Should Have)

**As a** contractor sharing my project
**I want to** see a nice preview when I share on social media
**So that** it looks professional

#### Acceptance Criteria

- Given I share a project URL on Facebook
- When the preview generates
- Then it shows: title, description, project image

- Given I share on Twitter
- When preview generates
- Then it shows large image card format

**OG Tags:**
```html
<meta property="og:title" content="Historic Chimney Rebuild" />
<meta property="og:description" content="Professional masonry..." />
<meta property="og:image" content="https://..." />
<meta property="og:type" content="article" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Historic Chimney Rebuild" />
<meta name="twitter:image" content="https://..." />
```

#### Technical Notes

- **Image Size**: 1200x630 for OG, 1200x600 for Twitter
- **Generation**: Crop from hero image or generate dynamically

---

## Non-Functional Requirements

| Requirement | Target | Notes |
|-------------|--------|-------|
| LCP (75th percentile) | <2.5s | Mobile 4G |
| INP | <200ms | Interaction responsiveness |
| CLS | <0.1 | No layout shift |
| Lighthouse Performance | >80 | Mobile |
| Lighthouse SEO | >90 | All pages |
| Time to First Byte | <600ms | Server response |

---

## Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| EPIC-004 | Internal | Pages to optimize |
| EPIC-002 | Internal | Image assets |
| Vercel/CDN | External | Asset delivery |
| Google Search Console | External | Monitoring |

---

## Out of Scope

- City hub pages / category pages (Could Have)
- Internal linking strategy (Could Have)
- Schema.org HowTo markup (Should Have)
- AMP pages (Won't Have)

---

## Test Scenarios

| ID | Scenario | Expected Result |
|----|----------|-----------------|
| SEO-T01 | Project page meta tags | Unique title, description |
| SEO-T02 | Validate Schema.org | No errors in validator |
| SEO-T03 | Request sitemap.xml | Valid XML returned |
| SEO-T04 | Lighthouse mobile score | >80 performance |
| SEO-T05 | LCP on 4G throttled | <2.5s |
| SEO-T06 | Install PWA on iOS | Works, icon appears |
| SEO-T07 | Go offline | Indicator shown |
| SEO-T08 | Share on Facebook | Preview renders correctly |
| SEO-T09 | Image srcset | Correct sizes served |
| SEO-T10 | Canonical URL check | Present and correct |

---

## Monitoring & Reporting

| Tool | Purpose | Frequency |
|------|---------|-----------|
| Google Search Console | Index status, errors | Daily check |
| Lighthouse CI | Performance regression | Every PR |
| Web Vitals (RUM) | Real user metrics | Continuous |
| Schema Validator | Structured data | Weekly |

---

*SEO is a long-term investment. This epic establishes the foundation; continuous optimization happens post-launch.*
