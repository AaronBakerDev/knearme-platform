# SEO & Discovery Implementation Documentation

This directory contains detailed implementation specifications for KNearMe's SEO and discovery features, translating the high-level strategy document into actionable development guides.

## Overview

**Purpose:** Bridge strategic planning → technical implementation for programmatic SEO pages.

**Source Strategy:** [`../SEO-DISCOVERY-STRATEGY.md`](../SEO-DISCOVERY-STRATEGY.md)

**Scope:** All public-facing SEO pages that drive homeowner discovery and contractor showcasing.

## Documentation Structure

### Page Template Specifications

| Document | Route Pattern | Priority | Status |
|----------|---------------|----------|--------|
| [Service Type by City](./page-templates/service-type-city.md) | `/{city}/masonry/{type}` | **P1** | Next sprint |
| [City Hub](./page-templates/city-hub.md) | `/{city}/masonry` | **P0** | ✅ Implemented |
| [Project Detail](./page-templates/project-detail.md) | `/{city}/masonry/{type}/{slug}` | **P0** | ✅ Implemented |
| [Contractor Profile](./page-templates/contractor-profile.md) | `/contractors/{city}/{id}` | **P0** | ✅ Implemented |
| [National Service Landing](./page-templates/national-service.md) | `/services/{type}` | **P2** | Phase 3 |
| [Educational Content](./page-templates/educational-content.md) | `/learn/{slug}` or `/resources/{slug}` | **P2** | Phase 3 |

### Editorial & UX Standards

- [Learn Blog: Internal Linking & Readability Playbook](./learn-blog-linking-readability.md)

## Implementation Priority Table

### Phase 1 (Complete)

| Feature | Route | Lines of Code | Status |
|---------|-------|---------------|--------|
| City Hub Pages | `app/(public)/[city]/masonry/page.tsx` | 441 | ✅ Complete |
| Project Detail Pages | `app/(public)/[city]/masonry/[type]/[slug]/page.tsx` | 474 | ✅ Complete |
| Contractor Profiles | `app/(public)/contractors/[city]/[id]/page.tsx` | 510 | ✅ Complete |
| Dynamic Sitemap | `app/sitemap.ts` | ~150 | ✅ Complete |
| JSON-LD Utilities | `src/lib/seo/structured-data.ts` | ~300 | ✅ Complete |

### Phase 2 (Next Sprint - P1)

| Feature | Route | Estimated LOC | Priority |
|---------|-------|---------------|----------|
| **Service Type by City** | `app/(public)/[city]/masonry/[type]/page.tsx` | 400-500 | **P1** |
| Related Projects Component | `src/components/seo/RelatedProjects.tsx` | 100-150 | **P1** |
| Breadcrumb Schema Enhancement | Update `src/lib/seo/structured-data.ts` | +50 | **P1** |
| Google Search Console Setup | Configuration | N/A | **P1** |

### Phase 3 (Future - P2)

| Feature | Route | Estimated LOC | Priority |
|---------|-------|---------------|----------|
| National Service Landing Pages | `app/(public)/services/[type]/page.tsx` | 400-600 | **P2** |
| Educational Content Hub | `app/(public)/learn/page.tsx` | 200-300 | **P2** |
| Educational Articles | `app/(public)/learn/[slug]/page.tsx` | 300-400 | **P2** |
| FAQ Schema for Services | Update `src/lib/seo/structured-data.ts` | +100 | **P2** |
| HowTo Schema for Guides | Update `src/lib/seo/structured-data.ts` | +100 | **P2** |

## Quick Start: Next Implementation

### P1: Service Type by City Pages

**Goal:** Create programmatic pages targeting long-tail keywords like "chimney repair in Denver".

**Steps:**
1. Read [`./page-templates/service-type-city.md`](./page-templates/service-type-city.md)
2. Create route file: `app/(public)/[city]/masonry/[type]/page.tsx`
3. Implement data fetching query (see spec for complete code)
4. Add JSON-LD Service schema
5. Update sitemap to include new routes
6. Test with sample cities: Denver, Lakewood, Aurora

**Target Keywords:**
- chimney-repair, tuckpointing, brick-repair
- stone-masonry, foundation-repair, historic-restoration

**Expected Impact:**
- 60+ new indexed pages (10 cities × 6 service types)
- Target 10+ keywords in top 50 within 3 months

## Content Strategy Alignment

### SEO Page Types → Business Outcomes

| Page Type | Primary Audience | Business Goal | Conversion Metric |
|-----------|------------------|---------------|-------------------|
| **Service Type by City** | Homeowners searching "{service} in {city}" | Project inquiries | Contractor profile clicks |
| **City Hub** | Homeowners browsing local contractors | Discovery | Project detail views |
| **Project Detail** | Homeowners evaluating quality | Trust building | Contractor profile visits |
| **Contractor Profile** | Homeowners ready to contact | Conversion | Contact clicks (Phase 2) |
| **National Service** | Homeowners researching services | Education | City hub clicks |
| **Educational Content** | Homeowners learning | Authority | City/service page clicks |

### Keyword Strategy Summary

**Implemented (Phase 1):**
- City-specific: `{city} masonry` (City Hubs)
- Project-specific: AI-generated long-tail titles (Project Details)

**Next Sprint (Phase 2):**
- Service + City: `{service} in {city}` (Service Type by City pages)
- Examples: "chimney repair in Denver", "tuckpointing Lakewood"

**Future (Phase 3):**
- Informational: "how to {task}", "what is {service}"
- Cost guides: "{service} cost", "masonry pricing"
- Contractor selection: "how to choose a {service} contractor"

## Data Requirements

### Database Schema Coverage

All page types query from these tables:
- `projects` - Published project showcases
- `contractors` - Contractor profiles
- `project_images` - Project gallery images

**Key Columns for SEO:**
- `projects.city_slug` - SEO-friendly city identifier
- `projects.project_type_slug` - Service type slug (chimney-repair, etc.)
- `projects.slug` - Unique project identifier
- `projects.status` - Must be 'published' for public pages
- `projects.seo_title`, `seo_description` - Meta tags
- `contractors.city_slug` - Contractor city identifier

**See:** Phase 2 spec includes complete Supabase query code examples.

## Success Metrics

### Phase 2 Targets (3 Months Post-Implementation)

| Metric | Current (Phase 1) | Target (Phase 2) |
|--------|-------------------|------------------|
| Indexed Pages | ~50 | 200+ |
| Organic Clicks/Month | 50 | 500+ |
| Keywords in Top 50 | 0 | 10+ |
| Contractor Signups from Organic | 0 | 5+ |

**Measurement Tools:**
- Google Search Console (index coverage, keyword rankings)
- Google Analytics 4 (traffic, conversions)
- Ahrefs or rank-tracking/local-beacon (keyword tracking)

## Related Documentation

### Strategic Planning
- [`../SEO-DISCOVERY-STRATEGY.md`](../SEO-DISCOVERY-STRATEGY.md) - Complete SEO strategy
- [`../../CLAUDE.md`](../../CLAUDE.md) - Project overview and architecture
- [`../02-requirements/epics/EPIC-005-seo.md`](../02-requirements/epics/EPIC-005-seo.md) - SEO requirements epic

### Implementation Guides
- [`../03-architecture/data-model.md`](../03-architecture/data-model.md) - Database schema
- [`../04-apis/api-design.md`](../04-apis/api-design.md) - API patterns
- Project CLAUDE.md sections on SEO patterns

### Code References
- `src/lib/seo/structured-data.ts` - JSON-LD schema generators
- `app/sitemap.ts` - Dynamic sitemap
- `src/components/seo/Breadcrumbs.tsx` - Breadcrumb component

## Contributing

When adding new page templates:
1. Create spec in `./page-templates/{name}.md`
2. Include: Route, Data requirements, Page structure, JSON-LD schema, Acceptance criteria
3. Update this README with priority and status
4. Reference SEO-DISCOVERY-STRATEGY.md for keyword targets
5. Add to sitemap.ts when implemented
