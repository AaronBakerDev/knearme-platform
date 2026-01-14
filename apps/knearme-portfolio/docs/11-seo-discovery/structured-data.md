# Structured Data (JSON-LD) Implementation Guide

> **Version:** 1.0
> **Last Updated:** December 2024
> **Status:** Active
> **Purpose:** Document all JSON-LD structured data schemas for SEO

---

## 1. Overview

KNearMe uses JSON-LD structured data (Schema.org) to help search engines understand page content and enable rich results in SERPs.

**Primary Benefits:**
- **Rich Snippets:** Enhanced search results with ratings, images, breadcrumbs
- **Knowledge Graph:** Entity recognition (contractors, services, locations)
- **Voice Search:** Better understanding for voice assistants
- **CTR Boost:** Studies show 30-40% CTR increase with rich results

**Implementation Location:** `/src/lib/seo/structured-data.ts`

---

## 2. Currently Implemented Schemas

### 2.1 LocalBusiness Schema

**Purpose:** Contractor profiles and project attribution

**Usage:** Contractor profile pages, embedded in project pages

**Function:** `generateContractorSchema(contractor: Contractor)`

**Implementation:**
```typescript
export function generateContractorSchema(contractor: Contractor) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/businesses/${contractor.city_slug}/${contractor.id}`,
    name: contractor.business_name,
    description: contractor.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: contractor.city,
      addressRegion: contractor.state,
      addressCountry: 'US',
    },
    areaServed: (contractor.service_areas || []).map((area) => ({
      '@type': 'City',
      name: area,
    })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Masonry Services',
      itemListElement: (contractor.services || []).map((service, index) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service,
        },
        position: index + 1,
      })),
    },
    image: contractor.profile_photo_url,
  };
}
```

**Usage Example:**
```tsx
// In contractor profile page
const contractorSchema = generateContractorSchema(contractor);

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(contractorSchema) }}
/>
```

**Future Enhancement (Phase 3):**
- Add `aggregateRating` when review system is implemented
- Add `telephone`, `email` when available
- Add `openingHours` for business hours

---

### 2.2 CreativeWork Schema

**Purpose:** Project detail pages (portfolio showcases)

**Usage:** Individual project pages

**Function:** `generateProjectSchema(project: Project, contractor: Contractor, images: ProjectImage[])`

**Implementation:**
```typescript
export function generateProjectSchema(
  project: Project,
  contractor: Contractor,
  images: ProjectImage[]
) {
  const projectUrl = `${SITE_URL}/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`;
  const primaryImage = images[0];

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': projectUrl,
    name: project.title,
    description: project.description,
    datePublished: project.published_at,
    dateModified: project.updated_at,
    creator: {
      '@type': 'LocalBusiness',
      name: contractor.business_name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: contractor.city,
        addressRegion: contractor.state,
      },
    },
    image: images.map((img) => ({
      '@type': 'ImageObject',
      url: `${SITE_URL}/storage/v1/object/public/project-images/${img.storage_path}`,
      width: img.width,
      height: img.height,
      caption: img.alt_text,
    })),
    thumbnailUrl: primaryImage
      ? `${SITE_URL}/storage/v1/object/public/project-images/${primaryImage.storage_path}`
      : undefined,
    keywords: project.tags?.join(', '),
    about: {
      '@type': 'Thing',
      name: project.project_type,
    },
    material: project.materials,
    locationCreated: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: project.city,
      },
    },
  };
}
```

**Why CreativeWork vs Article:**
- Projects are visual portfolios, not editorial content
- Emphasizes `creator` (contractor) relationship
- Supports `material`, `locationCreated` properties specific to physical work

---

### 2.3 BreadcrumbList Schema

**Purpose:** Breadcrumb navigation for all pages

**Usage:** All public pages (already have visual breadcrumbs)

**Function:** `generateBreadcrumbSchema(items: Array<{ name: string; url: string }>)`

**Implementation:**
```typescript
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
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

**Usage Example:**
```tsx
// In project detail page
const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Denver', url: '/denver-co/masonry' },
  { name: 'Chimney Repair', url: '/denver-co/masonry/chimney-repair' },
  { name: project.title, url: `/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}` },
];

const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
```

**Status:** Visual breadcrumbs exist, schema integration needed in Phase 2

---

### 2.4 ItemList Schema

**Purpose:** Project galleries on City Hub and Service Type pages

**Usage:** City Hub pages, Service Type by City pages

**Function:** `generateProjectListSchema(projects: Array<Project & { contractor: Contractor }>, listName: string)`

**Implementation:**
```typescript
export function generateProjectListSchema(
  projects: Array<Project & { contractor: Contractor }>,
  listName: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: projects.length,
    itemListElement: projects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'CreativeWork',
        name: project.title,
        description: project.seo_description,
        url: `${SITE_URL}/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`,
        creator: {
          '@type': 'LocalBusiness',
          name: project.contractor.business_name,
        },
      },
    })),
  };
}
```

**Usage Example:**
```tsx
// In City Hub page
const projectListSchema = generateProjectListSchema(
  projects,
  `Masonry Projects in ${cityName}`
);
```

---

### 2.5 HowTo Schema (Existing)

**Purpose:** Problem-solution guides with step-by-step instructions

**Usage:** Educational content (Phase 3)

**Function:** `generateHowToSchema(project: Project, steps: Array<{ name: string; description: string; imageUrl?: string }>)`

**Implementation:**
```typescript
export function generateHowToSchema(
  project: Project,
  steps: Array<{ name: string; description: string; imageUrl?: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How ${project.title} Was Completed`,
    description: project.description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.description,
      image: step.imageUrl,
    })),
    tool: project.materials?.map((material) => ({
      '@type': 'HowToTool',
      name: material,
    })),
  };
}
```

**Usage:** Currently for projects with before/during/after photos; will expand to guide pages in Phase 3

---

## 3. New Schemas to Implement (Phase 2+)

### 3.1 Service Schema (Phase 2)

**Purpose:** Service Type by City pages

**Target:** `/denver-co/masonry/chimney-repair`

**Function:** `generateServiceSchema(serviceType: string, city: string, state: string, projects: Project[])`

**Implementation:**
```typescript
/**
 * Generate Service schema for Service Type by City pages.
 *
 * @param serviceType - Service type name (e.g., "Chimney Repair")
 * @param city - City name (e.g., "Denver")
 * @param state - State abbreviation (e.g., "CO")
 * @param projects - Projects of this service type in city
 * @returns Service schema
 */
export function generateServiceSchema(
  serviceType: string,
  city: string,
  state: string,
  projects: Project[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: serviceType,
    provider: {
      '@type': 'ItemList',
      name: `${serviceType} Contractors in ${city}`,
      numberOfItems: projects.length,
      itemListElement: projects.map((project, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'LocalBusiness',
          name: project.contractor.business_name,
          address: {
            '@type': 'PostalAddress',
            addressLocality: city,
            addressRegion: state,
          },
        },
      })),
    },
    areaServed: {
      '@type': 'City',
      name: city,
      containedInPlace: {
        '@type': 'State',
        name: state,
      },
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: `${SITE_URL}/${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}/masonry/${serviceType.toLowerCase().replace(/\s+/g, '-')}`,
    },
  };
}
```

**Rich Result Target:** Service rich snippets with provider list

---

### 3.2 FAQPage Schema (Phase 3)

**Purpose:** National Service Landing pages, Educational articles

**Target:** `/services/chimney-repair`, `/learn/how-to-choose-masonry-contractor`

**Function:** `generateFAQSchema(faqs: Array<{ question: string; answer: string }>)`

**Implementation:**
```typescript
/**
 * Generate FAQPage schema for articles and service pages.
 *
 * @param faqs - Array of FAQ items
 * @returns FAQPage schema
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
```

**Usage Example:**
```tsx
// In National Service Landing page
const faqs = [
  {
    question: 'What is chimney repair?',
    answer: 'Chimney repair involves fixing damage to chimney structures, including cracks, missing mortar, deteriorated bricks, and damaged chimney crowns.',
  },
  {
    question: 'How much does chimney repair cost?',
    answer: 'Chimney repair costs vary widely based on the extent of damage, ranging from $300 for minor tuckpointing to $3,000+ for major rebuilds.',
  },
  // ... 3-5 more FAQs
];

const faqSchema = generateFAQSchema(faqs);
```

**Rich Result Target:** FAQ rich snippets in SERPs (expandable Q&A boxes)

**Validation:**
- Minimum 3 FAQs required for rich results
- Answers should be 100-300 words
- Questions should match common search queries

---

### 3.3 Article Schema (Phase 3)

**Purpose:** Educational articles in /learn section

**Target:** `/learn/chimney-repair-cost-guide`

**Function:** `generateArticleSchema(article: Article, author: string)`

**Implementation:**
```typescript
/**
 * Generate Article schema for educational content.
 *
 * @param article - Article metadata
 * @param author - Author name (default: "KNearMe Editorial Team")
 * @returns Article schema
 */
export function generateArticleSchema(
  article: {
    title: string;
    description: string;
    slug: string;
    publishedAt: string;
    updatedAt: string;
    imageUrl?: string;
  },
  author = 'KNearMe Editorial Team'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Organization',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'KNearMe',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/learn/${article.slug}`,
    },
    image: article.imageUrl
      ? {
          '@type': 'ImageObject',
          url: article.imageUrl,
        }
      : undefined,
  };
}
```

**Rich Result Target:** Article rich snippets with publish date, author

---

### 3.4 Enhanced HowTo Schema (Phase 3)

**Purpose:** Problem-solution guides with detailed steps

**Target:** `/guides/how-to-fix-chimney-crown-cracks`

**Enhanced Implementation:**
```typescript
/**
 * Generate HowTo schema for problem-solution guides.
 *
 * @param guide - Guide metadata
 * @param steps - Step-by-step instructions
 * @param totalTime - Estimated time (ISO 8601 duration format)
 * @param tools - Required tools
 * @param materials - Required materials
 * @returns HowTo schema
 */
export function generateGuideHowToSchema(
  guide: {
    title: string;
    description: string;
    imageUrl?: string;
  },
  steps: Array<{
    name: string;
    text: string;
    imageUrl?: string;
  }>,
  totalTime?: string, // e.g., "PT2H" for 2 hours
  tools?: string[],
  materials?: string[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: guide.title,
    description: guide.description,
    image: guide.imageUrl
      ? {
          '@type': 'ImageObject',
          url: guide.imageUrl,
        }
      : undefined,
    totalTime: totalTime,
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: '0', // DIY guides; professional cost mentioned in text
    },
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.imageUrl
        ? {
            '@type': 'ImageObject',
            url: step.imageUrl,
          }
        : undefined,
    })),
    tool: tools?.map((tool) => ({
      '@type': 'HowToTool',
      name: tool,
    })),
    supply: materials?.map((material) => ({
      '@type': 'HowToSupply',
      name: material,
    })),
  };
}
```

**Rich Result Target:** HowTo rich snippets with step carousel

---

### 3.5 AggregateRating Schema (Phase 3+)

**Purpose:** Contractor profiles with review system

**Prerequisite:** Implement contractor review feature

**Function:** `generateRatingSchema(contractor: Contractor, reviews: Review[])`

**Implementation:**
```typescript
/**
 * Generate AggregateRating for contractors with reviews.
 *
 * @param contractor - Contractor data
 * @param reviews - Array of reviews
 * @returns LocalBusiness schema with aggregateRating
 */
export function generateContractorWithRatingSchema(
  contractor: Contractor,
  reviews: Array<{ rating: number; comment: string; author: string; date: string }>
) {
  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/businesses/${contractor.city_slug}/${contractor.id}`,
    name: contractor.business_name,
    // ... other LocalBusiness fields
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.map((review) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.author,
      },
      datePublished: review.date,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
      },
      reviewBody: review.comment,
    })),
  };
}
```

**Rich Result Target:** Star ratings in search results

---

## 4. Schema Usage Best Practices

### 4.1 Multiple Schemas Per Page

Many pages should include multiple schema types:

**Project Detail Page Example:**
```tsx
const schemas = [
  generateProjectSchema(project, contractor, images),
  generateContractorSchema(contractor),
  generateBreadcrumbSchema(breadcrumbs),
  // Optionally: HowTo schema if before/after photos exist
];

<>
  {schemas.map((schema, index) => (
    <script
      key={index}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  ))}
</>
```

**Service Type by City Page Example:**
```tsx
const schemas = [
  generateServiceSchema(serviceType, city, state, projects),
  generateProjectListSchema(projects, `${serviceType} in ${city}`),
  generateBreadcrumbSchema(breadcrumbs),
];
```

### 4.2 Schema Validation Workflow

**Step 1: Generate Schema**
- Use utility functions in `src/lib/seo/structured-data.ts`
- Ensure all required properties are present

**Step 2: Validate with Google Rich Results Test**
- URL: https://search.google.com/test/rich-results
- Paste page URL or schema JSON
- Fix any errors or warnings

**Step 3: Test in Search Console**
- Submit page for indexing
- Check "Enhancements" report after 7-14 days
- Verify rich results are detected

**Step 4: Monitor Performance**
- Track CTR in Google Search Console
- Compare rich result pages vs. standard results
- Target: 30-40% CTR increase for rich results

### 4.3 Common Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| **Missing required property** | Schema incomplete | Add missing field (e.g., `datePublished`, `image`) |
| **Invalid URL format** | Relative URLs used | Use absolute URLs with `SITE_URL` prefix |
| **Invalid date format** | Non-ISO dates | Use ISO 8601 format (e.g., `2024-12-10T12:00:00Z`) |
| **Image too small** | Image < 1200px wide | Use high-res images (min 1200×675) |
| **Duplicate @id** | Same @id on multiple entities | Ensure unique @id for each entity |

---

## 5. Implementation Checklist

### Phase 1 (Current - COMPLETE)

- [x] LocalBusiness schema (contractor profiles)
- [x] CreativeWork schema (project pages)
- [x] ItemList schema (city hub pages)
- [x] BreadcrumbList schema (utility function exists)
- [x] HowTo schema (for projects with process photos)

### Phase 2 (January - February 2025)

- [ ] **Integrate BreadcrumbList schema into all pages**
  - File: Update all page.tsx files in `app/(marketing)/` and `app/(portfolio)/`
  - Validation: Google Rich Results Test

- [ ] **Implement Service schema**
  - File: Add `generateServiceSchema()` to `structured-data.ts`
  - Usage: Service Type by City pages
  - Validation: Test with Google Rich Results

### Phase 3 (March - June 2025)

- [ ] **Implement FAQPage schema**
  - File: Add `generateFAQSchema()` to `structured-data.ts`
  - Usage: National Service Landing pages, Educational articles
  - Target: Featured snippets in SERPs

- [ ] **Implement Article schema**
  - File: Add `generateArticleSchema()` to `structured-data.ts`
  - Usage: /learn articles
  - Validation: Ensure author, publisher, image present

- [ ] **Enhance HowTo schema**
  - File: Add `generateGuideHowToSchema()` to `structured-data.ts`
  - Usage: Problem-solution guides
  - Target: Step carousel rich results

### Phase 3+ (When Reviews Launch)

- [ ] **Implement AggregateRating schema**
  - File: Add `generateContractorWithRatingSchema()` to `structured-data.ts`
  - Prerequisite: Build contractor review system
  - Target: Star ratings in search results

---

## 6. Testing & Validation

### 6.1 Validation Tools

| Tool | URL | Use Case |
|------|-----|----------|
| **Google Rich Results Test** | https://search.google.com/test/rich-results | Validate individual pages |
| **Schema Markup Validator** | https://validator.schema.org | Check JSON-LD syntax |
| **Google Search Console** | https://search.google.com/search-console | Monitor rich results in production |
| **Structured Data Linter** | http://linter.structured-data.org | Detailed validation with RDF output |

### 6.2 Validation Checklist

**Per Page Type:**
- [ ] All required schema properties present
- [ ] All URLs are absolute (include `https://`)
- [ ] Dates in ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`)
- [ ] Images meet minimum size (1200×675)
- [ ] No duplicate `@id` values
- [ ] Breadcrumbs have sequential `position` values
- [ ] ItemList items have sequential `position` values

**Google Rich Results Test:**
- [ ] No errors
- [ ] Warnings addressed (or documented as acceptable)
- [ ] Preview shows expected rich result

**Search Console Validation (7-14 days post-publish):**
- [ ] Page appears in "Enhancements" report
- [ ] Rich result detected (e.g., "FAQ", "How-to", "Breadcrumb")
- [ ] No "Coverage" errors for schema pages

### 6.3 Automated Testing (Phase 2)

Create automated tests for schema generation:

```typescript
// tests/seo/structured-data.test.ts
import { describe, it, expect } from 'vitest';
import { generateBreadcrumbSchema, generateServiceSchema } from '@/lib/seo/structured-data';

describe('generateBreadcrumbSchema', () => {
  it('should generate valid BreadcrumbList schema', () => {
    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Denver', url: '/denver-co/masonry' },
    ];
    const schema = generateBreadcrumbSchema(breadcrumbs);

    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[0].position).toBe(1);
  });
});

describe('generateServiceSchema', () => {
  it('should generate valid Service schema', () => {
    const schema = generateServiceSchema('Chimney Repair', 'Denver', 'CO', []);

    expect(schema['@type']).toBe('Service');
    expect(schema.serviceType).toBe('Chimney Repair');
    expect(schema.areaServed.name).toBe('Denver');
  });
});
```

---

## 7. Performance Considerations

### 7.1 Schema Size Optimization

**Target:** Keep total schema size < 50KB per page

**Strategies:**
- Minify JSON (remove whitespace): `JSON.stringify(schema, null, 0)`
- Limit ItemList to 50 items (paginate beyond that)
- Limit Review schema to 10 most recent reviews
- Use `@id` references to avoid repeating entities

**Example:**
```typescript
// Good: Reference entity by @id
{
  "@type": "CreativeWork",
  "creator": { "@id": "/businesses/denver-co/123" }
}

// Avoid: Repeat full entity
{
  "@type": "CreativeWork",
  "creator": {
    "@type": "LocalBusiness",
    "name": "...",
    "address": { ... }
  }
}
```

### 7.2 Server-Side Generation

All schema generation happens server-side:
- No client-side JavaScript required
- Schema included in initial HTML
- Crawlers see schema immediately

**Implementation:**
```tsx
// app/(portfolio)/[city]/masonry/page.tsx
export default async function CityHubPage({ params }) {
  const projects = await getProjectsByCity(params.city);
  const schemas = [
    generateProjectListSchema(projects, `Masonry in ${params.city}`),
    generateBreadcrumbSchema(breadcrumbs),
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {/* Page content */}
    </>
  );
}
```

---

## 8. Monitoring & Maintenance

### 8.1 Monthly Monitoring Tasks

- [ ] **Search Console Enhancements Report**
  - Check for new rich result types detected
  - Fix any validation errors
  - Track rich result impressions/clicks

- [ ] **Rich Results Test Spot Checks**
  - Test 5-10 random pages
  - Verify no new errors introduced
  - Test new page types

- [ ] **Schema.org Updates**
  - Review changelog quarterly: https://schema.org/docs/releases.html
  - Adopt new relevant types (e.g., new Service properties)

### 8.2 KPIs to Track

| Metric | Tool | Target |
|--------|------|--------|
| **Pages with Valid Schema** | Google Search Console | 100% |
| **Rich Result Impressions** | Google Search Console | 50%+ of total impressions |
| **Rich Result CTR** | Google Search Console | 30-40% higher than standard results |
| **Featured Snippet Wins** | Ahrefs | 5+ by Phase 3 end |

---

## 9. Document References

**Related Documentation:**
- `/docs/11-seo-discovery/SEO-DISCOVERY-STRATEGY.md` - Section 6 (content types)
- `/src/lib/seo/structured-data.ts` - Implementation file
- `/docs/11-seo-discovery/internal-linking.md` - Breadcrumb usage

**External Resources:**
- [Schema.org Documentation](https://schema.org)
- [Google Search Central: Structured Data](https://developers.google.com/search/docs/appearance/structured-data)
- [JSON-LD Specification](https://json-ld.org)
- [Google Rich Results Gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)

---

**Last Updated:** December 2024
**Maintainer:** SEO Lead
**Review Cadence:** Quarterly (or when Schema.org releases major updates)
