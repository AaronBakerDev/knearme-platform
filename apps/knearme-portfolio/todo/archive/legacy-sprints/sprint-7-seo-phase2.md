# Sprint 7: SEO Phase 2 - Programmatic Pages

> **Status:** 🔄 In Progress
> **Epic References:** EPIC-005 (SEO), SEO-DISCOVERY-STRATEGY.md
> **Estimated Duration:** 3-4 weeks
> **Timing:** January - February 2025
> **Last Updated:** 2025-12-10

## Overview

Implement programmatic service type by city pages, enhance internal linking, add advanced structured data, and set up comprehensive analytics and Search Console monitoring.

---

## 1. Service Type by City Pages (P1)

### Route Implementation
- [x] Create route: `app/(portfolio)/[city]/masonry/[type]/page.tsx` ✅ (2025-12-10)
- [x] Implement `generateStaticParams()` for top city/service combinations ✅ (2025-12-10)
- [x] Configure ISR with appropriate revalidation (3600s) ✅ (2025-12-10)

### Data Layer
- [x] Create `getProjectsByCityAndType()` query in Supabase ✅ (2025-12-10)
- [x] Add indexes for city_slug + project_type_slug queries ✅ (2025-12-10)
  - Added compound index: `idx_projects_city_type_status`
- [ ] Implement pagination for cities with many projects

### Page Layout Components
- [x] Create Hero section with service type title and description ✅ (2025-12-10)
- [x] Implement Service Description area (SEO-optimized copy) ✅ (2025-12-10)
- [x] Create Project Grid with filters ✅ (2025-12-10)
- [x] Add Featured Contractors section ✅ (2025-12-10)
- [x] Implement CTA section ("List Your Business") ✅ (2025-12-10)

### Service Type Templates
- [x] Create service description templates for 12 service types: ✅ (2025-12-10)
  - [x] Chimney repair
  - [x] Tuckpointing
  - [x] Brick repair
  - [x] Stone masonry (stone-work)
  - [x] Foundation repair
  - [x] Historic restoration
  - [x] Retaining walls
  - [x] Concrete work
  - [x] Fireplace
  - [x] Outdoor living
  - [x] Commercial masonry
  - [x] Waterproofing
- [x] Implement template variable substitution (city, state, stats) ✅ (2025-12-10)

### SEO Optimization
- [x] Generate unique meta titles for each city/service combo ✅ (2025-12-10)
- [x] Generate unique meta descriptions (include city stats) ✅ (2025-12-10)
- [x] Implement canonical tags ✅ (2025-12-10)
- [x] Add `og:image` with city/service branding ✅ (2025-12-10)

---

## 2. Internal Linking Components

### Related Projects Component
- [x] Create `components/seo/RelatedProjects.tsx` ✅ (2025-12-10)
- [x] Implement algorithm for related projects: ✅ (2025-12-10)
  - [x] Same contractor (priority 1)
  - [x] Same service type in different cities (priority 2)
  - [x] Different service types in same city (priority 3)
- [x] Add to project detail pages ✅ (2025-12-10)
- [x] Style as 3-column grid below project content ✅ (2025-12-10)

### Nearby Cities Component
- [x] Create `components/seo/NearbyCities.tsx` ✅ (2025-12-10)
- [x] Implement state-based grouping (geospatial future enhancement) ✅ (2025-12-10)
- [x] Add to city hub pages ✅ (2025-12-10)
- [ ] Add to service type pages
- [ ] Show distance from current city (requires PostGIS - future)

### Service Type Navigation
- [x] Create `components/seo/ServiceTypeNav.tsx` (inline in service type page) ✅ (2025-12-10)
- [x] Show all service types available in current city ✅ (2025-12-10)
- [x] Highlight current service type ✅ (2025-12-10)
- [x] Add to city hub page (linked badges) ✅ (2025-12-10)

---

## 3. Enhanced Structured Data

### Service Schema
- [x] Add `generateServiceSchema()` to `lib/seo/structured-data.ts` ✅ (2025-12-10)
- [x] Implement Service JSON-LD for service type pages ✅ (2025-12-10)
- [x] Include service area, provider list ✅ (2025-12-10)
- [x] Add `generateAggregateRatingSchema()` function ✅ (2025-12-10)
- [x] Add `generateOrganizationSchema()` function ✅ (2025-12-10)

### BreadcrumbList Enhancement
- [x] Verify BreadcrumbList on all public pages ✅ (2025-12-10)
  - City hub page: ✅
  - Service type page: ✅
  - Project detail page: ✅
  - Contractor profile page: ✅
- [x] Add breadcrumbs to service type pages ✅ (2025-12-10)
- [x] Add breadcrumbs to contractor profile pages ✅ (already implemented)
- [ ] Test with Google Rich Results Test

### Aggregate Rating Schema
- [x] Implement AggregateRating function ✅ (2025-12-10)
- [ ] Calculate rating from all projects in city/service (requires rating data)
- [ ] Display star rating visually on pages (requires rating data)

---

## 4. Analytics Setup

### Google Analytics 4
- [ ] Set up GA4 property (if not done in Sprint 6)
- [ ] Configure data streams for production domain
- [ ] Set up custom dimensions:
  - City
  - Service type
  - Contractor ID
  - Project ID

### Enhanced Event Tracking
- [ ] Implement custom events:
  - `service_page_view` (city, service_type)
  - `related_project_click` (from_project_id, to_project_id)
  - `contractor_profile_click` (contractor_id, source_page)
  - `nearby_city_click` (from_city, to_city)
- [ ] Test events in GA4 DebugView

### Conversion Goals
- [ ] Set up conversion goals in GA4:
  - Contractor signup initiated
  - Contractor profile completed
  - Project published
  - Contact button click (Phase 2)
- [ ] Create custom funnel reports

### Dashboard Creation
- [ ] Create "SEO Performance" dashboard in GA4
- [ ] Add widgets for:
  - Top landing pages
  - Top cities
  - Top service types
  - Conversion funnel

---

## 5. Search Console Monitoring

### Index Coverage
- [ ] Verify all new programmatic pages indexed
- [ ] Monitor index coverage report weekly
- [ ] Set up email alerts for indexing issues
- [ ] Fix any crawl errors immediately

### Performance Tracking
- [ ] Track keyword rankings for target terms:
  - "[city] [service type]" (e.g., "Denver chimney repair")
  - "[service type] near me"
  - "masonry contractors in [city]"
- [ ] Export weekly ranking reports
- [ ] Create tracking spreadsheet

### Core Web Vitals
- [ ] Monitor CWV in Search Console
- [ ] Set up alerts for CWV degradation
- [ ] Investigate and fix any field issues
- [ ] Maintain LCP < 2.5s, FID < 100ms, CLS < 0.1

### Coverage Monitoring
- [ ] Set up weekly reports for:
  - New pages indexed
  - Pages with errors
  - Pages excluded
- [ ] Create workflow for fixing errors

---

## 6. Sitemap Enhancement

### Dynamic Sitemap Updates
- [x] Update `app/sitemap.ts` to include: ✅ (2025-12-10)
  - [x] Service type by city pages
  - [x] City masonry hub pages
  - [x] Priority based on project count
  - [x] Frequency based on last update
- [ ] Verify sitemap validates
- [ ] Resubmit to Search Console

### Sitemap Index (if needed)
- [ ] Create sitemap index if > 50,000 URLs
- [ ] Split into:
  - Projects sitemap
  - Service pages sitemap
  - Contractor profiles sitemap (Phase 2)

---

## 7. Performance Optimization

### Static Generation
- [ ] Generate top 60 city/service combos at build time
- [ ] Configure ISR for less popular combos
- [ ] Monitor build time (keep < 5 minutes)

### Database Optimization
- [ ] Add compound indexes:
  - `(city_slug, project_type_slug, status)`
  - `(project_type_slug, city_slug, status)`
- [ ] Review query performance in Supabase dashboard
- [ ] Optimize slow queries

### Edge Caching
- [ ] Configure Vercel edge caching for public pages
- [ ] Set appropriate `Cache-Control` headers
- [ ] Implement stale-while-revalidate pattern

---

## Definition of Done

- [ ] 60+ service type by city pages live (10 cities × 6 services)
- [ ] All pages pass Google Rich Results Test
- [ ] Related projects showing on all project detail pages
- [ ] GA4 tracking implemented with custom events
- [ ] Search Console index coverage > 95%
- [ ] All programmatic pages in sitemap
- [ ] Core Web Vitals passing in field data
- [ ] Lighthouse scores maintained:
  - Performance: ≥ 90
  - Accessibility: ≥ 90
  - Best Practices: ≥ 90
  - SEO: ≥ 90

---

## Success Metrics (End of Sprint)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Indexed pages | 100+ | Google Search Console |
| Organic impressions | 500+/week | GSC Performance report |
| Click-through rate | > 2% | GSC Performance report |
| Avg position (target kw) | < 50 | GSC Performance report |
| Core Web Vitals | All green | Search Console CWV report |
| Internal links per page | 5+ | Manual audit |

---

## Notes

- Focus on top 10 cities with most contractors first
- Service descriptions should be unique, not template-duplicated
- Monitor index velocity - Google should index new pages within 1 week
- Track which city/service combos drive most traffic for content prioritization
- Document any indexing issues for future sprints
