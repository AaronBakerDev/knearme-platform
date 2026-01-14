# Internal Linking Architecture

> **Version:** 1.1
> **Last Updated:** January 2, 2026
> **Status:** Active
> **Purpose:** Document internal linking strategy for SEO discovery and user navigation

---

## 1. Site Hierarchy

### 1.1 Link Flow Diagram

```
                                Homepage (/)
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
              City Hubs         National Service    Learn Section
          /{city}/masonry         /services/{type}    /learn
                    │                 │                 │
        ┌───────────┼───────────┐     │                 │
        │           │           │     │                 │
   Service Type  Featured   All Projects │           Articles
   by City Pages  Contractors   List     │          /learn/{slug}
   /{city}/       (cards)    (paginated) │                │
   masonry/{type}     │                  │                │
        │             │                  │                │
        │             │                  │                │
   Project Detail ────┴──────────────────┴────────────────┘
   /{city}/masonry/                Cross-linking
   {type}/{slug}
        │
        │
   Business Profile
   /contractor/{username}
```

### 1.2 Link Hierarchy Principles

**Upward Links:**
- Every page links back to its parent via breadcrumbs
- Maintains clear path to homepage
- Helps Google understand site structure

**Horizontal Links:**
- Related projects (same service type or city)
- Related services (on service type pages)
- Nearby cities (on city hub pages)

**Downward Links:**
- Hub pages link to all child pages
- City hubs → Service type pages → Projects
- National pages → City hubs

**Cross-Linking:**
- Educational content → Transactional pages
- Service pages → City-specific service pages
- Projects → Related projects

---

## 2. Link Requirements by Page Type

### 2.1 Requirements Table

| Page Type | Must Link To | Optional Links | Anchor Text Strategy | Link Count |
|-----------|--------------|----------------|---------------------|------------|
| **Homepage** | - Top 3-5 City Hubs (Denver, Lakewood, etc.)<br>- Featured projects | - /for-contractors<br>- /how-it-works<br>- /pricing | Exact match: "{City} Masonry" (current vertical) | 10-15 internal |
| **City Hub** | - All Service Type by City pages<br>- Homepage (breadcrumb) | - Featured projects<br>- Nearby cities (within 50 miles) | Exact match: "{Service} in {City}" | 20-30 internal |
| **Service Type by City** | - All projects of service type<br>- Parent City Hub (breadcrumb) | - Related service types<br>- Same service in nearby cities | Project name + city context | 15-25 internal |
| **Project Detail** | - Business Profile<br>- Parent Service Type page (breadcrumb)<br>- 3-4 Related Projects | - Educational content<br>- National service page | Business name; "More {service} projects" | 8-12 internal |
| **Business Profile** | - All business projects<br>- City Hub | - Social media (nofollow)<br>- Contact form | Project names | 10-20 internal |
| **National Service Landing** | - City Hubs offering service (sorted by project count)<br>- Homepage (breadcrumb) | - Educational content<br>- Related services | "{Service} in {City}" | 15-25 internal |
| **Educational Content** | - 2-3 relevant City Hubs or Service Type pages<br>- /learn landing page (breadcrumb) | - Related articles<br>- National service pages | Exact match keywords in context | 8-15 internal |

### 2.2 SEO Best Practices

**Anchor Text:**
- Use descriptive, keyword-rich anchor text (no "click here")
- Exact match for primary keywords (e.g., "Chimney Repair in Denver")
- Branded anchors for business profiles (e.g., "Johnson Masonry")
- Natural language in editorial content

**Link Attributes:**
- Internal links: No `rel` attribute needed
- External links: `rel="noopener noreferrer"` for security
- Paid/UGC links: `rel="sponsored"` or `rel="ugc"` as appropriate

**Link Density:**
- Avoid excessive linking (max 1 link per 100 words in body content)
- Navigation links don't count toward density
- Prioritize contextual links over sidebar/footer

---

## 3. Related Projects Component

### 3.1 Purpose

Increase session duration and pageviews by surfacing relevant projects on Project Detail pages.

**Goals:**
- Reduce bounce rate (target: <40%)
- Increase pages/session (target: 3-5 pages)
- Improve internal link distribution
- Keep users engaged with portfolio content

### 3.2 Algorithm Implementation

```typescript
/**
 * Get related projects for a given project.
 *
 * Algorithm:
 * 1. Priority 1: Same city + same service type (limit 2)
 * 2. Priority 2: Same service type, different city (limit 2)
 * 3. Fallback: Recent projects in same city (if < 4 results)
 *
 * @param currentProjectId - ID of current project
 * @param citySlug - City slug for filtering
 * @param serviceType - Service type for filtering
 * @param limit - Max number of related projects (default 4)
 * @returns Array of related projects
 */
export async function getRelatedProjects(
  currentProjectId: string,
  citySlug: string,
  serviceType: string,
  limit = 4
): Promise<Project[]> {
  const supabase = await createClient();

  // Priority 1: Same city + same service type (limit 2)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sameCityService } = await (supabase as any)
    .from('projects')
    .select('*')
    .eq('city_slug', citySlug)
    .eq('service_type', serviceType)
    .eq('status', 'published')
    .neq('id', currentProjectId)
    .order('published_at', { ascending: false })
    .limit(2);

  // Priority 2: Same service type, different city (limit 2)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sameService } = await (supabase as any)
    .from('projects')
    .select('*')
    .eq('service_type', serviceType)
    .eq('status', 'published')
    .neq('city_slug', citySlug)
    .neq('id', currentProjectId)
    .order('published_at', { ascending: false })
    .limit(2);

  // Combine results
  const related = [...(sameCityService || []), ...(sameService || [])];

  // Fallback: If < 4 results, add recent projects from same city
  if (related.length < limit) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: fallback } = await (supabase as any)
      .from('projects')
      .select('*')
      .eq('city_slug', citySlug)
      .eq('status', 'published')
      .neq('id', currentProjectId)
      .order('published_at', { ascending: false })
      .limit(limit - related.length);

    related.push(...(fallback || []));
  }

  return related.slice(0, limit) as Project[];
}
```

### 3.3 Component Specification

**Location:** `src/components/seo/RelatedProjects.tsx`

**Implementation Type:** Server Component (no client-side JS)

**UI Placement:**
- Below project description
- Above business CTA section
- Full-width container

**Component Props:**
```typescript
interface RelatedProjectsProps {
  currentProjectId: string;
  citySlug: string;
  serviceType: string;
  limit?: number;
}
```

**Rendering:**
```tsx
<section className="related-projects">
  <h2>Related {serviceType} Projects</h2>
  <div className="project-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {relatedProjects.map(project => (
      <a
        key={project.id}
        href={`/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`}
        className="project-card"
      >
        <Image
          src={project.thumbnail_url}
          alt={project.title}
          width={400}
          height={300}
          className="rounded-lg"
        />
        <h3 className="mt-2 font-semibold">{project.title}</h3>
        <p className="text-sm text-muted-foreground">{project.city}</p>
      </a>
    ))}
  </div>
</section>
```

**Performance:**
- Parallel data fetching with main project query
- Uses Next.js Image component for optimization
- No client-side JavaScript required
- Cached with ISR (revalidate: 3600)

---

## 4. City-to-City Navigation

### 4.1 Nearby Cities Component

**Purpose:** Link to service pages in geographically nearby cities.

**Placement:** Footer of City Hub and Service Type by City pages

**Algorithm:**
```typescript
/**
 * Get nearby cities within a specified radius.
 *
 * @param citySlug - Current city slug
 * @param radiusMiles - Search radius (default 50 miles)
 * @param limit - Max number of cities (default 6)
 * @returns Array of nearby cities with distances
 */
export async function getNearbyCities(
  citySlug: string,
  radiusMiles = 50,
  limit = 6
): Promise<Array<{ city: string; state: string; distance: number; slug: string }>> {
  // Implementation uses PostGIS ST_Distance or external geocoding API
  // Returns cities sorted by distance, filtered to those with published projects
}
```

**UI Example:**
```tsx
<section className="nearby-cities bg-muted p-6 rounded-lg">
  <h3 className="text-lg font-semibold mb-4">
    {serviceType} in Nearby Cities
  </h3>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {nearbyCities.map(city => (
      <a
        key={city.slug}
        href={`/${city.slug}/masonry/${serviceTypeSlug}`}
        className="text-primary hover:underline"
      >
        {city.city}, {city.state} ({city.distance}mi)
      </a>
    ))}
  </div>
</section>
```

### 4.2 State-Level Landing Pages (Phase 4)

**URL Pattern:** `/{state-code}/masonry`

**Example:** `/colorado/masonry`, `/texas/masonry`

**Purpose:**
- Aggregate all cities in a state
- Target state-level searches (e.g., "masonry contractors Colorado" — current vertical phrasing)
- Provide geographic context for clustering

**Links To:**
- All City Hubs in state (sorted by project count)
- National Service Landing pages
- Homepage (breadcrumb)

**Implementation Priority:** Phase 4 (multi-state expansion)

---

## 5. Breadcrumb Navigation

### 5.1 Breadcrumb Schema Requirements

**Visual Breadcrumbs:** Already implemented in all public pages

**JSON-LD Schema:** Add BreadcrumbList structured data (Phase 2)

**Implementation:**
```typescript
/**
 * Generate BreadcrumbList JSON-LD schema.
 *
 * @param items - Array of breadcrumb items
 * @returns JSON-LD BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}
```

### 5.2 Breadcrumb Patterns by Page Type

| Page Type | Breadcrumb Pattern |
|-----------|-------------------|
| City Hub | Home > {City} > Masonry |
| Service Type by City | Home > {City} > Masonry > {Service} |
| Project Detail | Home > {City} > Masonry > {Service} > {Project Title} |
| Business Profile | Home > Contractors > {Business Name} |
| National Service Landing | Home > Services > {Service} |
| Educational Content | Home > Learn > {Article Title} |

**Usage Example:**
```tsx
// In page.tsx
const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Denver', url: '/denver-co/masonry' },
  { name: 'Masonry', url: '/denver-co/masonry' },
  { name: 'Chimney Repair', url: '/denver-co/masonry/chimney-repair' },
  { name: project.title, url: `/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}` },
];

const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
```

---

## 6. Cross-Linking Rules

### 6.1 Editorial Content → Transactional Pages

**Rule:** Every educational article must link to at least 2-3 relevant City Hubs or Service Type pages.

**Example:**
- Article: "Signs Your Chimney Needs Repair"
- Links:
  - "Find chimney repair businesses in [Denver](/denver-co/masonry/chimney-repair)"
  - "View [chimney repair projects](/services/chimney-repair)"
  - "Browse [Denver masonry businesses](/denver-co/masonry)"

**Implementation:**
- Add links naturally in article body
- Use exact match anchor text for primary keywords
- Place primary CTA link near top of article (above fold)

### 6.2 Transactional Pages → Editorial Content

**Rule:** Service Type by City pages and National Service Landing pages should link to 1-2 relevant educational articles.

**Example:**
- Page: `/denver-co/masonry/chimney-repair`
- Links:
  - "Learn more: [How Much Does Chimney Repair Cost?](/learn/chimney-repair-cost-guide)"
  - "Read: [Signs Your Chimney Needs Repair](/learn/chimney-repair-signs)"

**Placement:**
- Below project gallery
- In sidebar (if layout permits)
- In FAQ section

### 6.3 Project Detail → Educational Content

**Rule:** Optional contextual link if relevant article exists.

**Example:**
- Project: "Historic Brick Chimney Restoration in Capitol Hill"
- Link: "Interested in historic restoration? Read our [complete guide](/learn/historic-brick-restoration-guide)"

**Trigger:** Check if project tags match article topics.

---

## 7. Link Monitoring & Maintenance

### 7.1 Internal Link Audit Checklist

**Monthly Tasks:**
- [ ] Check for broken internal links (404s)
- [ ] Verify breadcrumbs render correctly on all page types
- [ ] Ensure Related Projects component returns 4 results
- [ ] Test City-to-City navigation accuracy

**Tools:**
- Screaming Frog SEO Spider (crawl site monthly)
- Google Search Console (monitor "Not Found" errors)
- Custom script: `scripts/check-internal-links.ts`

### 7.2 Link Velocity Targets

| Phase | Target Internal Links/Page | New Pages/Month | Total Internal Links |
|-------|---------------------------|-----------------|---------------------|
| **Phase 1 (Current)** | 10-15 | 10 projects | ~750 links |
| **Phase 2 (Q1 2025)** | 15-20 | 60 pages (service type by city) | ~3,000 links |
| **Phase 3 (Q2 2025)** | 20-25 | 24 articles/guides | ~5,000 links |
| **Phase 4 (Q3-Q4 2025)** | 25-30 | 300 pages (city expansion) | ~15,000 links |

**Monitoring Metric:** Average internal links per page (Google Search Console > Links > Internal Links)

---

## 8. Implementation Checklist

### Phase 2 (January - February 2025)

- [ ] **Implement Related Projects Component**
  - File: `src/components/seo/RelatedProjects.tsx`
  - Integrate into Project Detail pages
  - Add unit tests for algorithm

- [ ] **Add BreadcrumbList Schema**
  - File: Update `src/lib/seo/structured-data.ts`
  - Add `generateBreadcrumbSchema()` function
  - Integrate into all public page types

- [ ] **Build Nearby Cities Component**
  - File: `src/components/seo/NearbyCities.tsx`
  - Geocoding integration (Mapbox or Google Maps API)
  - Add to City Hub and Service Type pages

- [ ] **Service Type by City Pages**
  - File: `app/(public)/[city]/masonry/[type]/page.tsx`
  - Auto-generate for 10 cities × 6 service types
  - Include links to projects, related services, nearby cities

### Phase 3 (March - June 2025)

- [ ] **Editorial Content Cross-Linking**
  - Ensure all articles link to 2-3 transactional pages
  - Add "Related Projects" sections in articles
  - Link National Service pages to articles

- [ ] **Link Audit Automation**
  - Script: `scripts/check-internal-links.ts`
  - Weekly cron job to detect broken links
  - Slack notification for 404s

### Phase 4 (July - December 2025)

- [ ] **State-Level Landing Pages**
  - File: `app/(public)/[state]/masonry/page.tsx`
  - Aggregate cities by state
  - Add state-to-state navigation

---

## 9. Performance Considerations

### 9.1 Database Query Optimization

**Related Projects Query:**
- Use database indexes on `city_slug`, `service_type`, `status`, `published_at`
- Cache results with Next.js ISR (revalidate: 3600)
- Parallel fetching with `Promise.all()`

**Nearby Cities Query:**
- Pre-compute distances and store in `cities` table
- Use materialized view for common radius queries
- Cache results in Redis for frequently accessed cities

### 9.2 Render Performance

**Related Projects Component:**
- Server Component (no client-side JS)
- Lazy load images with Next.js Image
- Use `loading="lazy"` for images below fold

**Breadcrumbs:**
- Static rendering (no database query needed)
- Minimal DOM nodes (<10 elements)
- CSS-only styling (no JavaScript)

---

## 10. Document References

**Related Documentation:**
- `/docs/11-seo-discovery/SEO-DISCOVERY-STRATEGY.md` - Section 5 (source)
- `/docs/11-seo-discovery/structured-data.md` - BreadcrumbList schema
- `/src/lib/seo/structured-data.ts` - Existing schema implementations
- `/src/components/ui/breadcrumb.tsx` - Visual breadcrumb component

**External Resources:**
- [Google Internal Linking Best Practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Schema.org BreadcrumbList](https://schema.org/BreadcrumbList)
- [Moz Internal Linking Guide](https://moz.com/learn/seo/internal-link)

---

**Last Updated:** December 2024
**Maintainer:** SEO Lead
**Review Cadence:** Quarterly
