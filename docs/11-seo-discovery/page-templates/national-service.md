# National Service Landing Page Template

**Priority:** P2 (Phase 3)
**Status:** Not Implemented
**Target:** March - June 2025

## Overview

National Service Landing pages are **service-focused content pages** that target informational keywords at the national level (no specific city). These pages educate homeowners about specific masonry services and funnel them to city-specific pages.

**Business Purpose:**
- Capture informational search traffic ("what is tuckpointing")
- Establish domain authority on masonry topics
- Internal linking hub to city + service type pages
- Educational content marketing for homeowners

## Route Configuration

### File Location
```
app/(public)/services/[type]/page.tsx
```

### URL Pattern
```
/services/{service-type-slug}
```

### Example URLs
- `/services/chimney-repair`
- `/services/tuckpointing`
- `/services/brick-repair`
- `/services/stone-masonry`
- `/services/foundation-repair`
- `/services/historic-restoration`
- `/services/masonry-waterproofing`
- `/services/efflorescence-removal`

### Service Type Slugs

| Slug | Display Name | Target Keyword | Est. Volume |
|------|--------------|----------------|-------------|
| `chimney-repair` | Chimney Repair | "chimney repair", "chimney repair cost" | 2,400/mo |
| `tuckpointing` | Tuckpointing | "what is tuckpointing", "tuckpointing vs repointing" | 1,800/mo |
| `brick-repair` | Brick Repair | "brick repair", "brick restoration" | 1,600/mo |
| `stone-masonry` | Stone Masonry | "stone masonry", "stone veneer installation" | 1,200/mo |
| `foundation-repair` | Foundation Repair | "masonry foundation repair" | 3,600/mo |
| `historic-restoration` | Historic Restoration | "historic brick restoration" | 480/mo |
| `masonry-waterproofing` | Masonry Waterproofing | "how to waterproof brick" | 720/mo |
| `efflorescence-removal` | Efflorescence Removal | "how to remove efflorescence" | 590/mo |

**Total:** 8 planned pages

## Data Requirements

### Primary Query: Cities Offering Service

```typescript
/**
 * Get list of cities with published projects for a specific service type.
 * Used to populate "Find Contractors by City" section.
 */
export async function getCitiesByServiceType(
  serviceTypeSlug: string
): Promise<Array<{ citySlug: string; cityName: string; projectCount: number }>> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('projects')
    .select('city_slug, city')
    .eq('project_type_slug', serviceTypeSlug)
    .eq('status', 'published');

  if (error) {
    console.error('[getCitiesByServiceType] Error:', error);
    return [];
  }

  // Aggregate by city
  const cityMap = new Map<string, { citySlug: string; cityName: string; projectCount: number }>();

  (data || []).forEach((project) => {
    if (!project.city_slug || !project.city) return;

    const existing = cityMap.get(project.city_slug);
    if (existing) {
      existing.projectCount++;
    } else {
      cityMap.set(project.city_slug, {
        citySlug: project.city_slug,
        cityName: project.city,
        projectCount: 1,
      });
    }
  });

  // Sort by project count descending
  return Array.from(cityMap.values()).sort((a, b) => b.projectCount - a.projectCount);
}
```

### Secondary Query: Featured Projects

```typescript
/**
 * Get top featured projects for a service type (national).
 * Used to showcase portfolio examples.
 */
export async function getFeaturedProjectsByService(
  serviceTypeSlug: string,
  limit: number = 6
): Promise<ProjectWithContractor[]> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      contractor:contractors(id, business_name, city, state, city_slug),
      project_images(storage_path, alt_text, display_order)
    `)
    .eq('project_type_slug', serviceTypeSlug)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getFeaturedProjectsByService] Error:', error);
    return [];
  }

  // Add cover image to each project
  return (data || []).map((project) => {
    const sortedImages = (project.project_images || []).sort(
      (a, b) => a.display_order - b.display_order
    );
    return { ...project, cover_image: sortedImages[0] };
  });
}
```

## Page Structure

### 1. Hero Section

**Components:**
- H1 heading: `{Service Type}: Expert Guide & Top Contractors`
- Brief overview (150-200 words)
- CTA button: "Find Local Contractors" (scrolls to city list)

**Example:**
```tsx
<header className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 md:p-12">
  <h1 className="text-3xl md:text-4xl font-bold mb-4">
    Chimney Repair: Expert Guide & Top Contractors
  </h1>
  <p className="text-lg text-muted-foreground max-w-3xl mb-6">
    Learn everything you need to know about chimney repair, from common issues to cost
    estimates. Find qualified contractors in your area to restore and maintain your chimney.
  </p>
  <Button size="lg" onClick={() => scrollTo('#find-contractors')}>
    Find Local Contractors
  </Button>
</header>
```

### 2. Service Deep Dive

**Content:** 300-400 words explaining the service
**Subheadings (H2/H3):**
- What is {Service Type}?
- When You Need {Service}
- Common Problems Solved
- Process Overview

**Source:** AI-generated content + human editing
**Tone:** Educational, helpful, not salesy

**Example Structure:**
```markdown
## What is Chimney Repair?

Chimney repair involves fixing structural and functional issues with masonry chimneys,
including damaged bricks, deteriorating mortar joints, cracked crowns, and faulty flashing...

## When You Need Chimney Repair

Signs you may need professional chimney repair include:
- Visible cracks in the chimney structure
- Water leaks in the attic or around the fireplace
- Loose or missing bricks
- White staining (efflorescence) on chimney exterior
- Smoke entering the home when fireplace is in use

## Common Problems Solved

Professional chimney repair addresses issues such as:
- **Crown Damage**: Cracks in the concrete cap that protects the chimney top
- **Spalling Bricks**: Bricks deteriorating due to moisture infiltration
- **Mortar Joint Failure**: Deteriorated mortar between bricks (requires tuckpointing)
- **Flashing Leaks**: Gaps where chimney meets roof allowing water intrusion
```

### 3. Cost & Timeline

**Content:** 200-300 words
**Subheadings:**
- Typical Cost Ranges
- Timeline Expectations
- Factors Affecting Cost

**Example:**
```markdown
## Typical Cost Ranges

Chimney repair costs vary significantly based on extent of damage and repair type:

- **Minor Repairs** (crown patching, repointing): $300 - $1,500
- **Moderate Repairs** (partial rebuilds, flashing replacement): $1,500 - $5,000
- **Major Repairs** (complete rebuilds, structural stabilization): $5,000 - $15,000+

## Timeline Expectations

- **Minor Repairs**: 1-2 days
- **Moderate Repairs**: 3-7 days
- **Major Repairs**: 1-4 weeks

Weather conditions can extend timelines, as masonry work requires dry conditions and
moderate temperatures for proper curing.

## Factors Affecting Cost

- **Chimney Height**: Taller chimneys require scaffolding or lifts
- **Accessibility**: Roof pitch and access points
- **Materials**: Historic or specialty bricks cost more
- **Extent of Damage**: More damage = higher cost
- **Location**: Labor rates vary by region
```

**Source:** Content plan `/docs/content-planning/masonry/content-plan.md` Section 1

### 4. Featured Projects

**Display:** 6-8 project cards in grid (3 columns desktop, 2 tablet, 1 mobile)
**Content:** Top projects by recency with this service type
**Card Design:** Same as City Hub project cards

**Purpose:**
- Visual proof of service quality
- Internal linking to project detail pages
- Showcase contractor diversity (different cities)

```tsx
<section className="max-w-6xl mx-auto mb-12">
  <h2 className="text-2xl font-bold mb-6">Featured {serviceTypeName} Projects</h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {featuredProjects.map((project) => (
      <Link
        key={project.id}
        href={`/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`}
      >
        <ProjectCard project={project} />
      </Link>
    ))}
  </div>
</section>
```

### 5. Find Contractors by City

**Display:** Grid of city badges/cards
**Sort:** By project count descending
**Limit:** Show all cities (or top 50 if > 50)

**Card Design:**
```tsx
<Link href={`/${city.citySlug}/masonry/${serviceTypeSlug}`}>
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4 flex items-center justify-between">
      <div>
        <h3 className="font-semibold">{city.cityName}</h3>
        <p className="text-sm text-muted-foreground">
          {city.projectCount} {serviceTypeName} {city.projectCount === 1 ? 'Project' : 'Projects'}
        </p>
      </div>
      <ArrowRight className="h-5 w-5 text-primary" />
    </CardContent>
  </Card>
</Link>
```

**Purpose:**
- Primary internal linking to city + service type pages
- User-friendly navigation to local contractors
- SEO benefit: Links with keyword-rich anchor text

### 6. FAQ Section

**Content:** 5-7 common questions about the service
**Format:** Accordion/expandable sections
**Purpose:** Target featured snippets in Google

**Example Questions (Chimney Repair):**
- How much does chimney repair cost?
- How do I know if my chimney needs repair?
- Can I repair a chimney myself?
- How long does chimney repair take?
- How often should chimneys be inspected?
- What causes chimney damage?
- Is chimney repair covered by homeowners insurance?

**Source:** Content plan + common search queries

```tsx
<Accordion type="single" collapsible>
  {faqs.map((faq, index) => (
    <AccordionItem key={index} value={`item-${index}`}>
      <AccordionTrigger>{faq.question}</AccordionTrigger>
      <AccordionContent>{faq.answer}</AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

## JSON-LD Structured Data

### FAQPage Schema

```typescript
/**
 * Generate FAQPage schema for national service landing pages.
 * Optimizes for Google featured snippets.
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map((faq) => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer,
      },
    })),
  };
}
```

**Add to Page:**
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: schemaToString(generateFAQSchema(faqs)) }}
/>
```

### Service Schema (Optional)

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Chimney Repair",
  "name": "Chimney Repair Services",
  "description": "Professional chimney repair services nationwide...",
  "provider": {
    "@type": "Organization",
    "name": "KNearMe"
  },
  "areaServed": [
    {"@type": "City", "name": "Denver", "addressRegion": "CO"},
    {"@type": "City", "name": "Lakewood", "addressRegion": "CO"}
  ]
}
```

## SEO Metadata

### generateMetadata() Function

```typescript
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { type } = await params;
  const serviceTypeName = formatServiceType(type); // "chimney-repair" → "Chimney Repair"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

  // Fetch cover image from most recent project for OG
  const supabase = createAdminClient();
  const { data: projectData } = await supabase
    .from('projects')
    .select('project_images(storage_path, alt_text, display_order)')
    .eq('project_type_slug', type)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .single();

  const coverImage = projectData?.project_images?.[0];
  const imageUrl = coverImage
    ? getPublicUrl('project-images', coverImage.storage_path)
    : undefined;

  const title = `${serviceTypeName}: Complete Guide, Costs & Local Contractors | KNearMe`;
  const description = `Everything you need to know about ${serviceTypeName.toLowerCase()}: what it is, when you need it, typical costs, and how to find qualified contractors in your area.`;

  return {
    title,
    description,
    keywords: `${type}, ${serviceTypeName}, ${serviceTypeName} cost, ${serviceTypeName} contractors`,
    openGraph: {
      title: `${serviceTypeName} Guide & Contractors`,
      description,
      type: 'article',
      url: `${siteUrl}/services/${type}`,
      images: imageUrl ? [{ url: imageUrl, alt: `${serviceTypeName} example` }] : [],
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `${siteUrl}/services/${type}`,
    },
  };
}
```

## Content Production Workflow

### AI-Assisted Content Creation

**Step 1: Outline Generation**
```
Prompt: Generate a detailed outline for a service landing page about {service type}.
Include sections: What it is, when you need it, common problems, process, costs, timeline.
Target audience: Homeowners researching masonry services.
```

**Step 2: Section Drafting**
```
Prompt: Write the "What is {service}?" section (300-400 words) for a homeowner audience.
Explain the service, common use cases, and why it's important. Avoid jargon.
```

**Step 3: FAQ Generation**
```
Prompt: Generate 7 frequently asked questions about {service} with concise answers (2-3 sentences each).
Focus on cost, timing, DIY vs professional, and common problems.
```

**Step 4: Human Editing**
- Review AI content for accuracy
- Add local insights (e.g., "In Colorado, freeze-thaw cycles...")
- Fact-check cost estimates
- Add links to related educational content

**Step 5: SEO Review**
- Target keyword in H1, meta title, first paragraph
- Internal links to city + service type pages
- Alt text on images
- FAQ schema implemented

### Content Sources

**Reference:** `/docs/content-planning/masonry/content-plan.md` Section 1
**8 Service Pages Planned:**
1. Chimney Repair
2. Tuckpointing
3. Stone Veneer Installation
4. Brick Cleaning/Restoration
5. Chimney Crown Repair
6. Efflorescence Removal
7. Masonry Waterproofing
8. Historic Masonry Restoration

**Production Timeline:** 2 pages/month = 4 months

## Implementation Checklist

### Phase 3.1: Route and Data Layer

- [ ] Create route file: `app/(public)/services/[type]/page.tsx`
- [ ] Implement `getCitiesByServiceType()` query
- [ ] Implement `getFeaturedProjectsByService()` query
- [ ] Add `generateStaticParams()` for 8 service types
- [ ] Test with sample URL: `/services/chimney-repair`

### Phase 3.2: Content Creation

- [ ] Generate AI content for all 8 service pages
- [ ] Human review and edit (30-40% manual editing)
- [ ] Create FAQ content (7 questions per service)
- [ ] Source or create cost data (research market rates)
- [ ] Add internal links to related educational content

### Phase 3.3: Page Components

- [ ] Build hero section with H1 and CTA
- [ ] Add service deep dive section (prose component)
- [ ] Add cost & timeline section
- [ ] Implement featured projects grid
- [ ] Build "Find by City" component with cards
- [ ] Add FAQ accordion with schema

### Phase 3.4: SEO Implementation

- [ ] Implement `generateMetadata()` for meta tags
- [ ] Add `generateFAQSchema()` to `src/lib/seo/structured-data.ts`
- [ ] Add FAQPage schema to page
- [ ] Optional: Add Service schema
- [ ] Test JSON-LD with Google Rich Results Test

### Phase 3.5: Integration

- [ ] Update `app/sitemap.ts` to include service pages
- [ ] Add links from homepage to top service pages
- [ ] Add links from city hubs to service pages (breadcrumb)
- [ ] Test internal linking flow

### Phase 3.6: Launch Validation

- [ ] Verify 8 pages indexed in Google Search Console
- [ ] Check FAQ schema eligible for featured snippets
- [ ] Monitor keyword rankings for informational queries
- [ ] Track traffic from service pages → city pages

## Acceptance Criteria

### Functional Requirements

1. **Route Resolution:**
   - ✅ URL `/services/{type}` resolves to service landing page
   - ✅ Invalid service type shows 404
   - ✅ All 8 planned service types accessible

2. **Content Display:**
   - ✅ Hero section with H1, overview, CTA
   - ✅ Service deep dive (300-400 words)
   - ✅ Cost & timeline section
   - ✅ Featured projects grid (6-8 projects)
   - ✅ Find by city section (all cities offering service)
   - ✅ FAQ accordion (5-7 questions)

3. **SEO Metadata:**
   - ✅ Unique `<title>` per service type
   - ✅ Unique meta description per service
   - ✅ OpenGraph tags for social sharing
   - ✅ Canonical URL set correctly

4. **Structured Data:**
   - ✅ FAQPage schema present and valid
   - ✅ Passes Google Rich Results Test
   - ✅ Eligible for featured snippets

5. **Internal Linking:**
   - ✅ Featured projects link to project detail pages
   - ✅ City cards link to service type by city pages
   - ✅ Breadcrumbs link to homepage

### Performance Requirements

- ✅ LCP < 2.5s
- ✅ CLS < 0.1
- ✅ FID < 100ms
- ✅ Total page size < 1MB
- ✅ Mobile-responsive

### Content Quality Requirements

- ✅ Content is accurate and factual
- ✅ Tone is helpful and educational
- ✅ Cost estimates are realistic
- ✅ FAQ answers are concise (2-3 sentences)
- ✅ No keyword stuffing or over-optimization

## Success Metrics (90 Days Post-Launch)

### SEO Performance

- ✅ 8 pages indexed in Google
- ✅ 5+ keywords in top 50 (informational queries)
- ✅ 3+ featured snippet positions (FAQ schema)
- ✅ 200+ organic clicks/month

### Internal Linking Performance

- ✅ Average 3+ clicks per session from service pages
- ✅ 30%+ CTR on "Find by City" links
- ✅ 20%+ CTR on featured project cards

### Conversion Performance

- ✅ 10%+ of service page visitors navigate to city pages
- ✅ 5%+ of service page visitors view contractor profiles
- ✅ 2+ contractor signups attributed to service page traffic

## Related Documentation

- [SEO Discovery Strategy](../../SEO-DISCOVERY-STRATEGY.md) - Section 2.1, 6.2
- [Service Type by City Template](./service-type-city.md) - Child pages
- [Educational Content Template](./educational-content.md) - Related content type
- [Content Plan](../../../../docs/content-planning/masonry/content-plan.md) - Source content
- [EPIC-005: SEO](../../02-requirements/epics/EPIC-005-seo.md) - Requirements epic
