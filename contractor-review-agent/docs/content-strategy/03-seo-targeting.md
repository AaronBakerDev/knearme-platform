# SEO Targeting Strategy

## URL Structure

```
/{city-slug}/{service-slug}/                    → Category Roundup
/{city-slug}/{service-slug}/{contractor-slug}/  → Individual Profile
/{city-slug}/{service-slug}/compare?c=a,b,c     → Comparison Tool (dynamic)
```

### Examples

```
/denver-co/chimney-repair/                              → "Best Chimney Repair in Denver"
/denver-co/chimney-repair/a1-chimney/                   → "A1 Chimney Reviews"
/denver-co/chimney-repair/compare?c=a1-chimney,chimney-kings → User-selected comparison
```

---

## Keyword Categories

### Primary Keywords (Category Roundups)

| Search Term | Monthly Volume (est.) | Competition | Our Target URL |
|-------------|----------------------|-------------|----------------|
| best chimney repair denver | 500-1000 | Medium | /denver-co/chimney-repair/ |
| brick repair denver | 1000-2000 | Medium | /denver-co/brick-repair/ |
| tuckpointing denver | 200-500 | Low | /denver-co/tuckpointing/ |
| parging repair denver | 200-500 | Low | /denver-co/parging/ |
| masonry contractor denver | 500-1000 | Medium | /denver-co/masonry/ |

### Long-tail Keywords (Individual Profiles)

| Pattern | Example | Target |
|---------|---------|--------|
| [business name] reviews | "brick repair denver reviews" | Individual profile |
| [business name] [city] | "a1 chimney denver" | Individual profile |
| is [business] good | "is homestrong any good" | Individual profile |
| [business] complaints | "faros construction complaints" | Individual profile (careful) |

### Comparison Keywords

| Pattern | Example | Target |
|---------|---------|--------|
| [a] vs [b] | "brick repair denver vs brick specialists" | Comparison tool with pre-selected |
| [a] or [b] | "homestrong or faros construction" | Comparison tool with pre-selected |
| compare [service] [city] | "compare masonry contractors denver" | Category page with "Compare" CTA |

> **Note**: Comparison keywords lead to the interactive tool, not static pages.
> Shareable URLs like `/compare?c=a1-chimney,chimney-kings` can be indexed.

---

## Content Hierarchy

```
                    DOMAIN
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      /denver-co/  /boulder-co/  /[city]/
          │
    ┌─────┼─────┬─────────┬────────────┐
    ▼     ▼     ▼         ▼            ▼
/chimney/ /brick/ /tuckpointing/ /foundation/ ...
    │
    ├── index (Category Roundup)
    │
    ├── /a1-chimney/ (Profile)
    ├── /chimney-kings/ (Profile)
    ├── /compare/a1-vs-kings/ (Comparison)
    └── ...
```

---

## On-Page SEO Requirements

### Category Roundups

```html
<title>Best Chimney Repair in Denver: Top 10 Contractors (2025)</title>
<meta name="description" content="Compare Denver's top-rated chimney repair
contractors based on 3,247 customer reviews. Find pricing, specialties, and
what real customers say.">

<h1>Best Chimney Repair in Denver</h1>
<h2>Our Top 10 Picks</h2>
<h3>1. A1 Chimney - Best Overall</h3>
...
<h2>How We Ranked These Contractors</h2>
<h2>FAQs About Chimney Repair in Denver</h2>
```

### Individual Profiles

```html
<title>A1 Chimney Reviews: What 107 Denver Customers Say (2025)</title>
<meta name="description" content="Read our analysis of 107 Google reviews
for A1 Chimney in Denver. See what customers love, common concerns, and
who this contractor is best for.">

<h1>A1 Chimney Reviews</h1>
<h2>What Customers Love</h2>
<h3>Fast Response Times</h3>
<h3>Transparent Pricing</h3>
<h2>Areas for Improvement</h2>
<h2>Who This Contractor Is Best For</h2>
```

---

## Schema Markup

### LocalBusiness (Individual Profiles)

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "A1 Chimney",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Denver",
    "addressRegion": "CO"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.3",
    "reviewCount": "107"
  }
}
```

### Article (All Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Best Chimney Repair in Denver",
  "datePublished": "2025-01-15",
  "dateModified": "2025-01-15",
  "author": {
    "@type": "Organization",
    "name": "KnearMe"
  }
}
```

### FAQPage (Category Roundups)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "How much does chimney repair cost in Denver?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Based on our review analysis..."
    }
  }]
}
```

---

## Internal Linking Strategy

```
Category Roundup
    │
    ├──► Individual Profiles (featured contractors)
    │       │
    │       └──► Back to Category ("See all Denver chimney contractors")
    │
    ├──► Related Categories ("Also consider: Fireplace Repair")
    │
    └──► Comparison Articles ("Compare our top picks")

Individual Profile
    │
    ├──► Category Roundup ("See all Denver chimney contractors")
    │
    ├──► Comparison ("Compare with [similar contractor]")
    │
    └──► Other profiles in same category (sidebar)
```

---

## City Expansion Priority

Based on search volume and contractor density:

| Priority | City | Population | Strategy |
|----------|------|------------|----------|
| 1 | Denver, CO | 715K | Pilot city - full coverage |
| 2 | Colorado Springs, CO | 478K | Second CO city |
| 3 | Phoenix, AZ | 1.6M | Large sunbelt market |
| 4 | Dallas, TX | 1.3M | Large sunbelt market |
| 5 | Austin, TX | 978K | Growth market |

### Per-City Launch Checklist

- [ ] Run all 10 search terms
- [ ] Collect reviews for 10+ review contractors
- [ ] Generate category roundups (10)
- [ ] Generate individual profiles (20+ review contractors first)
- [ ] Build internal links
- [ ] Submit sitemap

---

## Search Terms by Service Category

These are the terms we search in DataForSEO, mapped to URL slugs:

| Search Term | URL Slug | Related Terms to Target |
|-------------|----------|-------------------------|
| masonry | /masonry/ | masonry contractor, mason, brick mason |
| brick repair | /brick-repair/ | brick restoration, brick fixing |
| chimney repair | /chimney-repair/ | chimney fix, chimney restoration |
| tuckpointing | /tuckpointing/ | repointing, mortar repair |
| stone mason | /stone-masonry/ | stone work, natural stone |
| parging repair | /parging/ | parging, foundation coating, parge coat |
| retaining wall | /retaining-walls/ | retaining wall builder |
| concrete repair | /concrete-repair/ | concrete fix, cement repair |
| stucco repair | /stucco-repair/ | stucco fix, stucco restoration |
| fireplace repair | /fireplace-repair/ | fireplace fix, firebox repair |

---

## Tracking & Measurement

### Key Metrics

| Metric | Tool | Target |
|--------|------|--------|
| Organic impressions | Google Search Console | Growth month-over-month |
| Organic clicks | Google Search Console | 2%+ CTR |
| Keyword rankings | Ahrefs/SEMrush | Top 10 for target keywords |
| Page indexation | Search Console | 100% of published pages |
| Core Web Vitals | PageSpeed Insights | All green |

### UTM Structure for Contractor Tracking

```
?utm_source=knearme
&utm_medium=article
&utm_campaign=denver-chimney
&utm_content=a1-chimney-profile
```

Use these when contractors claim profiles to track which articles drive signups.
