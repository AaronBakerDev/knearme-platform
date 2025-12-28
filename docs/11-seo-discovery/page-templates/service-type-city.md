# Service Type by City Page Template

**Priority:** P1 (Next Sprint)
**Status:** Not Implemented
**Target:** Phase 2 - January 2025

## Overview

Service Type by City pages are the **highest-priority SEO implementation** for Phase 2. These programmatic landing pages target long-tail keywords like "chimney repair in Denver" and serve as critical conversion paths from search → contractor profiles.

**Business Impact:**
- Target 60+ new pages (10 cities × 6 service types)
- Rank for high-intent local searches
- Dual-purpose: Homeowner discovery + contractor showcasing

## Route Configuration

### File Location
```
app/(public)/[city]/masonry/[type]/page.tsx
```

### URL Pattern
```
/{city-slug}/masonry/{service-type-slug}
```

### Example URLs
- `/denver-co/masonry/chimney-repair`
- `/lakewood-co/masonry/tuckpointing`
- `/aurora-co/masonry/brick-repair`
- `/colorado-springs-co/masonry/stone-masonry`
- `/boulder-co/masonry/foundation-repair`
- `/arvada-co/masonry/historic-restoration`

### Service Type Slugs

| Slug | Display Name | Priority | Est. Search Volume |
|------|--------------|----------|-------------------|
| `chimney-repair` | Chimney Repair | High | 2,400/mo |
| `tuckpointing` | Tuckpointing | High | 1,800/mo |
| `brick-repair` | Brick Repair | High | 1,600/mo |
| `stone-masonry` | Stone Masonry | Medium | 1,200/mo |
| `foundation-repair` | Foundation Repair | High | 3,600/mo |
| `historic-restoration` | Historic Restoration | Low | 480/mo |

**Database Constraint:** `projects.project_type_slug` must match these exact slugs.

## Data Requirements

### Primary Query: Projects by City and Service Type

```typescript
/**
 * Fetch published projects filtered by city and service type.
 *
 * Returns projects with contractor details and cover images for display.
 * Used to populate Service Type by City pages.
 */
export async function getProjectsByCityAndType(
  citySlug: string,
  serviceTypeSlug: string
): Promise<ProjectWithContractor[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      contractor:contractors(
        id,
        business_name,
        city,
        state,
        city_slug,
        services,
        profile_photo_url
      ),
      project_images(
        id,
        storage_path,
        alt_text,
        display_order,
        image_type
      )
    `)
    .eq('city_slug', citySlug)
    .eq('project_type_slug', serviceTypeSlug)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[getProjectsByCityAndType] Error:', error);
    throw error;
  }

  // Type assertion for RLS
  type ProjectWithRelations = Project & {
    contractor: Contractor;
    project_images: ProjectImage[];
  };

  const projects = (data || []) as ProjectWithRelations[];

  // Add cover image to each project (first by display_order)
  return projects.map((project) => {
    const sortedImages = project.project_images.sort(
      (a, b) => a.display_order - b.display_order
    );
    return {
      ...project,
      cover_image: sortedImages[0],
    };
  });
}
```

### Secondary Query: Contractor Count for Service Type

```typescript
/**
 * Get count of unique contractors offering a service type in a city.
 * Used for page stats ("12 contractors in Denver offer chimney repair").
 */
export async function getContractorCountByService(
  citySlug: string,
  serviceTypeSlug: string
): Promise<number> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('projects')
    .select('contractor_id')
    .eq('city_slug', citySlug)
    .eq('project_type_slug', serviceTypeSlug)
    .eq('status', 'published');

  if (error) {
    console.error('[getContractorCountByService] Error:', error);
    return 0;
  }

  // Get unique contractor IDs
  const uniqueContractors = new Set((data || []).map((p) => p.contractor_id));
  return uniqueContractors.size;
}
```

### Tertiary Query: Related Service Types in Same City

```typescript
/**
 * Get other service types offered in the same city for cross-linking.
 * Excludes current service type.
 */
export async function getRelatedServiceTypes(
  citySlug: string,
  excludeSlug: string
): Promise<Array<{ slug: string; name: string; count: number }>> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('projects')
    .select('project_type_slug, project_type')
    .eq('city_slug', citySlug)
    .eq('status', 'published')
    .neq('project_type_slug', excludeSlug);

  if (error) {
    console.error('[getRelatedServiceTypes] Error:', error);
    return [];
  }

  // Aggregate by service type
  const serviceTypes = new Map<string, { slug: string; name: string; count: number }>();

  (data || []).forEach((project) => {
    if (!project.project_type_slug || !project.project_type) return;

    const existing = serviceTypes.get(project.project_type_slug);
    if (existing) {
      existing.count++;
    } else {
      serviceTypes.set(project.project_type_slug, {
        slug: project.project_type_slug,
        name: project.project_type,
        count: 1,
      });
    }
  });

  // Sort by count descending, return top 5
  return Array.from(serviceTypes.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
```

## Page Structure

### 1. Hero Section

**Components:**
- H1 heading (SEO-optimized)
- City + service type stats
- Brief service description (150-200 words)
- CTA button (optional for Phase 2)

**Example:**
```tsx
<header className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8">
  <h1 className="text-3xl md:text-4xl font-bold mb-4">
    {serviceTypeName} in {cityName}
  </h1>
  <div className="flex gap-4 text-muted-foreground mb-4">
    <span>{projectCount} Projects</span>
    <span>•</span>
    <span>{contractorCount} Local Contractors</span>
  </div>
  <p className="text-lg max-w-2xl">
    {serviceDescription}
  </p>
</header>
```

**H1 Format:** `{Service Type} in {City Name}, {State}`

### 2. Service Description

**Purpose:** SEO content block + user education
**Length:** 400-500 words
**Content:** Generated via AI SDK (Gemini 3 Flash preview) with city + service context

**Topics to Cover:**
- What is {service type}?
- Common use cases in {city}
- Typical project timelines
- Why hire a professional vs DIY
- Climate/regional considerations (e.g., Denver freeze-thaw cycles)

**Example Prompt for Content Generation:**
```
Write a 400-word description of {service type} services in {city}, {state}.
Include: what the service is, common problems it solves, typical project
timelines, and any regional considerations (climate, building codes, etc.).
Tone: helpful and informative, not salesy.
```

### 3. Project Grid (Filtered)

**Display:** Masonry grid layout (same as City Hub)
**Filter:** Only projects matching `city_slug` AND `project_type_slug`
**Sort:** Most recent first (`published_at DESC`)
**Limit:** 50 projects (pagination if needed in Phase 3)

**Component Reuse:** Same project card component as City Hub page

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {projects.map((project) => (
    <Link
      key={project.id}
      href={`/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`}
    >
      <ProjectCard project={project} />
    </Link>
  ))}
</div>
```

### 4. Featured Contractors

**Purpose:** Showcase top contractors for this service in this city
**Algorithm:** Sort by project count for this service type
**Display:** Top 3-5 contractors

```tsx
<section className="mt-12">
  <h2 className="text-2xl font-bold mb-6">
    {serviceTypeName} Contractors in {cityName}
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {featuredContractors.map((contractor) => (
      <ContractorCard key={contractor.id} contractor={contractor} />
    ))}
  </div>
</section>
```

### 5. Related Services

**Purpose:** Internal linking to other service types in same city
**Display:** Badge pills linking to other service type pages

```tsx
<section className="bg-muted/30 rounded-xl p-6">
  <h3 className="font-semibold mb-4">
    Other Masonry Services in {cityName}
  </h3>
  <div className="flex flex-wrap gap-2">
    {relatedServices.map((service) => (
      <Link key={service.slug} href={`/${citySlug}/masonry/${service.slug}`}>
        <Badge variant="secondary">
          {service.name} ({service.count})
        </Badge>
      </Link>
    ))}
  </div>
</section>
```

### 6. SEO Footer

**Purpose:** Additional keyword-rich content for SEO
**Content:** City-specific tips, local insights (200-300 words)

**Example Topics:**
- "Finding the Right {Service} Contractor in {City}"
- "Average {Service} Costs in {City}"
- "Local Building Codes and Permits"

## JSON-LD Structured Data

### Service Schema

```typescript
/**
 * Generate Service schema for Service Type by City pages.
 *
 * Tells search engines about the service offered in a specific area.
 */
export function generateServiceSchema(
  serviceType: string,
  cityName: string,
  stateCode: string,
  projects: Project[],
  contractors: Contractor[]
): object {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'serviceType': serviceType,
    'name': `${serviceType} in ${cityName}, ${stateCode}`,
    'description': `Professional ${serviceType} services in ${cityName}. Browse projects and find local contractors.`,
    'areaServed': {
      '@type': 'City',
      'name': cityName,
      'addressRegion': stateCode,
      'addressCountry': 'US',
    },
    'provider': {
      '@type': 'ItemList',
      'itemListElement': contractors.slice(0, 10).map((contractor, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'item': {
          '@type': 'LocalBusiness',
          'name': contractor.business_name,
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': contractor.city,
            'addressRegion': contractor.state,
            'addressCountry': 'US',
          },
          'url': `${siteUrl}/contractors/${contractor.city_slug}/${contractor.id}`,
        },
      })),
    },
    'hasOfferCatalog': {
      '@type': 'OfferCatalog',
      'name': `${serviceType} Projects`,
      'itemListElement': projects.slice(0, 10).map((project, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'item': {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': project.title,
            'url': `${siteUrl}/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`,
          },
        },
      })),
    },
  };
}
```

### Add to Page Component

```tsx
export default async function ServiceTypeCityPage({ params }: PageParams) {
  // ... data fetching ...

  const serviceSchema = generateServiceSchema(
    serviceTypeName,
    cityName,
    stateCode,
    projects,
    contractors
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToString(serviceSchema) }}
      />
      {/* Page content */}
    </>
  );
}
```

## SEO Metadata

### generateMetadata() Function

```typescript
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city, type } = await params;
  const supabase = createAdminClient();

  // Format city name from slug
  const cityName = formatCityName(city); // "denver-co" → "Denver, CO"

  // Get service type display name from first project
  const { data } = await supabase
    .from('projects')
    .select('project_type')
    .eq('city_slug', city)
    .eq('project_type_slug', type)
    .eq('status', 'published')
    .limit(1)
    .single();

  const serviceTypeName = data?.project_type || formatServiceType(type);

  // Fetch cover image from first project for OG
  const { data: projectData } = await supabase
    .from('projects')
    .select('project_images(storage_path, alt_text, display_order)')
    .eq('city_slug', city)
    .eq('project_type_slug', type)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .single();

  const coverImage = projectData?.project_images?.[0];
  const imageUrl = coverImage
    ? getPublicUrl('project-images', coverImage.storage_path)
    : undefined;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';
  const title = `${serviceTypeName} in ${cityName} | Local Contractors & Projects`;
  const description = `Find ${serviceTypeName} contractors in ${cityName}. Browse completed projects, compare portfolios, and connect with local masonry professionals.`;

  return {
    title,
    description,
    keywords: `${serviceTypeName} ${cityName}, ${type} ${cityName}, masonry ${cityName}`,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}/${city}/masonry/${type}`,
      images: imageUrl ? [{ url: imageUrl, alt: `${serviceTypeName} in ${cityName}` }] : [],
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `${siteUrl}/${city}/masonry/${type}`,
    },
  };
}
```

## Implementation Checklist

### Phase 2.1: Route and Data Layer

- [ ] Create route file: `app/(public)/[city]/masonry/[type]/page.tsx`
- [ ] Implement `getProjectsByCityAndType()` query
- [ ] Implement `getContractorCountByService()` query
- [ ] Implement `getRelatedServiceTypes()` query
- [ ] Add `generateStaticParams()` for pre-rendering
- [ ] Test with sample URLs: `/denver-co/masonry/chimney-repair`

### Phase 2.2: Page Components

- [ ] Build hero section with H1 and stats
- [ ] Add service description block (placeholder text initially)
- [ ] Implement filtered project grid (reuse City Hub components)
- [ ] Add featured contractors section
- [ ] Add related services navigation
- [ ] Build SEO footer section

### Phase 2.3: SEO Implementation

- [ ] Implement `generateMetadata()` for meta tags
- [ ] Add `generateServiceSchema()` to `src/lib/seo/structured-data.ts`
- [ ] Add Service schema to page
- [ ] Test JSON-LD with Google Rich Results Test
- [ ] Add breadcrumb navigation component

### Phase 2.4: Content Generation

- [ ] Create AI SDK prompt template for service descriptions (Gemini 3 Flash preview)
- [ ] Generate descriptions for all 6 service types
- [ ] Review and edit AI-generated content for accuracy
- [ ] Add city-specific SEO footer content (can be generic initially)

### Phase 2.5: Integration

- [ ] Update `app/sitemap.ts` to include service type pages
- [ ] Add links from City Hub pages to service type pages
- [ ] Add links from project detail pages to service type pages
- [ ] Test internal linking flow

### Phase 2.6: Launch Validation

- [ ] Verify 60+ pages indexed in Google Search Console
- [ ] Check Core Web Vitals (LCP < 2.5s, CLS < 0.1)
- [ ] Validate all JSON-LD schemas
- [ ] Monitor keyword rankings for top 10 city/service combinations

## Acceptance Criteria

### Functional Requirements

1. **Route Resolution:**
   - ✅ URL `/{city}/masonry/{type}` resolves to correct page
   - ✅ Invalid city or service type shows 404
   - ✅ Only cities/types with published projects are accessible

2. **Data Display:**
   - ✅ Page shows all projects for city + service type combination
   - ✅ Projects sorted by most recent first
   - ✅ Each project card links to project detail page
   - ✅ Contractor attribution visible on each project

3. **SEO Metadata:**
   - ✅ Unique `<title>` per page following pattern
   - ✅ Unique meta description per page
   - ✅ OpenGraph tags for social sharing
   - ✅ Canonical URL set correctly

4. **Structured Data:**
   - ✅ Service schema present and valid
   - ✅ Passes Google Rich Results Test
   - ✅ Provider list includes top contractors

5. **Internal Linking:**
   - ✅ Breadcrumbs link to parent City Hub
   - ✅ Related services link to other service type pages
   - ✅ Project cards link to project detail pages
   - ✅ Contractor cards link to contractor profiles

### Performance Requirements

- ✅ Largest Contentful Paint (LCP) < 2.5s
- ✅ Cumulative Layout Shift (CLS) < 0.1
- ✅ First Input Delay (FID) < 100ms
- ✅ Total page size < 1MB
- ✅ Images lazy-loaded with blur placeholders

### SEO Requirements

- ✅ H1 heading follows exact format: `{Service Type} in {City Name}, {State}`
- ✅ Meta description includes target keyword
- ✅ URL structure matches specification
- ✅ Sitemap includes all service type pages
- ✅ robots.txt allows crawling

## Testing Plan

### Manual Testing

1. **URL Variations:**
   - Test valid city/service combinations: `/denver-co/masonry/chimney-repair`
   - Test invalid city (should 404): `/fake-city/masonry/chimney-repair`
   - Test invalid service type (should 404): `/denver-co/masonry/invalid-service`
   - Test city with no projects for service type (should 404)

2. **Data Accuracy:**
   - Verify project count matches database
   - Verify contractor count matches unique contractors
   - Check related services list excludes current service

3. **Visual Regression:**
   - Desktop layout (1920px, 1366px)
   - Tablet layout (768px)
   - Mobile layout (375px)
   - Dark mode compatibility

### Automated Testing (Phase 3)

```typescript
// Example E2E test with Playwright
import { test, expect } from '@playwright/test';

test.describe('Service Type by City Page', () => {
  test('should display correct service type and city', async ({ page }) => {
    await page.goto('/denver-co/masonry/chimney-repair');

    // Check H1
    const h1 = page.locator('h1');
    await expect(h1).toContainText('Chimney Repair in Denver, CO');

    // Check meta description
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute('content', /chimney repair/i);

    // Check projects visible
    const projects = page.locator('[data-testid="project-card"]');
    await expect(projects).toHaveCount({ min: 1 });
  });

  test('should have valid JSON-LD schema', async ({ page }) => {
    await page.goto('/denver-co/masonry/chimney-repair');

    const schema = await page.locator('script[type="application/ld+json"]').textContent();
    const parsed = JSON.parse(schema || '{}');

    expect(parsed['@type']).toBe('Service');
    expect(parsed.serviceType).toBe('Chimney Repair');
    expect(parsed.areaServed.name).toBe('Denver');
  });
});
```

## Launch Milestones

### Week 1: Implementation
- Complete route and data layer
- Build page components
- Add SEO metadata

### Week 2: Content & Testing
- Generate service descriptions
- Manual testing across cities/services
- Fix bugs and refine UI

### Week 3: Integration & Launch
- Update sitemap
- Add internal links
- Submit to Google Search Console
- Monitor indexing

### Week 4: Optimization
- Analyze Search Console data
- Identify top-performing pages
- Optimize underperforming pages
- Generate additional content as needed

## Post-Launch Monitoring

### Google Search Console

**Check Weekly:**
- Index coverage (target: 95%+ indexed)
- Crawl errors (fix within 48 hours)
- Mobile usability issues
- Core Web Vitals (all pages in "Good" range)

**Check Monthly:**
- Keyword rankings (track top 20 keywords per city/service)
- Click-through rates (target: 3-5% for top 20 positions)
- Average position trends

### Analytics

**Track in GA4:**
- Pageviews by service type page
- Bounce rate (target: < 60%)
- Average time on page (target: > 1 minute)
- Conversion events: Contractor profile clicks, project detail views

### Success Criteria (90 Days Post-Launch)

- ✅ 60+ pages indexed in Google
- ✅ 10+ keywords in top 50 positions
- ✅ 500+ organic clicks/month
- ✅ 5+ contractor signups attributed to organic search

## Related Documentation

- [SEO Discovery Strategy](../../SEO-DISCOVERY-STRATEGY.md) - Overall strategy
- [City Hub Template](./city-hub.md) - Parent page pattern
- [Project Detail Template](./project-detail.md) - Child page pattern
- [EPIC-005: SEO](../../02-requirements/epics/EPIC-005-seo.md) - Requirements epic
