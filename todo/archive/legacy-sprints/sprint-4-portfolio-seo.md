# Sprint 4: Portfolio & SEO

> **Status:** 🔄 In Progress (~54% complete)
> **Epic References:** EPIC-004 (Portfolio), EPIC-005 (SEO)
> **Estimated Duration:** 1 week
> **Last Updated:** 2025-12-10

## Overview

Build public-facing pages with SEO optimization: project detail pages, contractor profiles, Schema.org markup, and sitemap generation.

**Implementation Note (Dec 2025):** Core project detail page and SEO infrastructure were implemented early. Focus now on contractor profiles, city hubs, and component extraction.

---

## 1. URL Architecture

### Route Structure
- [x] Create dynamic route: `/app/(public)/[city]/masonry/[type]/[slug]/page.tsx` ✅ Implemented
- [x] Create contractor route ✅ `/app/(public)/contractors/[city]/[id]/page.tsx`
- [x] Create city hub route ✅ `/app/(public)/[city]/masonry/page.tsx`
- [x] Set up route param validation (via generateStaticParams)

### Slug Generation
- [x] Create `lib/utils/slugify.ts` ✅ Implemented (note: in utils, not seo)
- [x] Generate project slugs: `{title-slug}-{unique-id}` (generateProjectSlug)
- [ ] Generate contractor slugs: `{business-name}-{city}`
- [x] Generate city slugs: `{city}-{state}` (generateCitySlug)
- [x] Ensure URL-safe characters only
- [x] Handle duplicate slugs (via random ID suffix)

### Canonical URLs
- [x] Implement canonical URL generation (in generateMetadata)
- [ ] Handle www vs non-www (configure at Vercel level)
- [ ] Handle trailing slashes consistently (Next.js config)

---

## 2. Project Detail Page (US-004-04)

> **Status:** ✅ ~90% Complete
> **Implementation:** `src/app/(public)/[city]/masonry/[type]/[slug]/page.tsx` (371 lines)

### Page Structure
- [x] Create project page component ✅ Server Component with SSG
- [x] Build layout: ✅ All elements present
  ```
  - Breadcrumb navigation ✅ Inline implementation
  - Project title ✅
  - Location + project type ✅
  - Photo gallery (hero + thumbnails) ✅
  - Full description ✅
  - Contractor card ✅ Inline CTA card
  - Tags ✅
  - Materials & Techniques ✅ Bonus feature
  ```

### Photo Gallery
- [x] Create `components/portfolio/PhotoGallery.tsx` ✅ Implemented with lightbox
- [x] Hero image (priority loading)
- [x] Thumbnail strip below (configurable max)
- [x] Lightbox on click/tap ✅ Full-screen viewer
- [x] Keyboard navigation (← → Escape) ✅
- [x] Thumbnail navigation in lightbox ✅
- [x] Swipe navigation in lightbox (touch events) ✅ Touch handlers added
- [ ] Before/after comparison slider (if applicable)
- [x] Lazy load thumbnails (via next/image)

### Contractor Card
- [ ] Create `components/portfolio/ContractorCard.tsx` (extract from inline - low priority)
- [x] Show contractor photo/logo (in contractor profile page)
- [x] Display business name
- [x] Show location
- [x] Link to full profile
- [x] Show service badges (all services shown)

### Breadcrumb Navigation (US-005-09)
- [x] Create `components/seo/Breadcrumbs.tsx` ✅ Implemented with auto-schema
- [x] Show: Home > City > Masonry > Type > Project
- [x] Schema.org BreadcrumbList markup (auto-injected by component)
- [x] Mobile-friendly truncation (configurable maxItems)
- [x] Home icon option
- [x] Accessible with aria-labels

### Related Projects
- [x] Show 3-4 related projects ✅ Grid of 4 related projects
- [x] Same contractor or same city/type ✅ OR query with contractor priority
- [ ] Lazy load below fold (Phase 2 - not critical)

---

## 3. Contractor Profile Page (US-004-05)

> **Status:** ✅ ~95% Complete
> **Implementation:** `src/app/(public)/contractors/[city]/[id]/page.tsx` (320 lines)

### Page Structure
- [x] Create contractor profile component ✅ Server Component with SSG
- [x] Build layout: ✅ All elements present
  ```
  - Business name + logo ✅
  - Location ✅
  - Services offered ✅ (as badges)
  - About/description ✅
  - Service areas list ✅
  - Project grid ✅
  - Contact CTA (Phase 2) - Footer placeholder
  ```

### Profile Header
- [x] Business logo/photo (with fallback)
- [x] Business name (h1)
- [x] City, State
- [x] Service badges (all services shown)

### Project Grid
- [x] Show all published projects
- [x] Card with thumbnail, title, type
- [x] Sort by most recent (published_at)
- [x] Pagination (12 per page) ✅ URL-based with Previous/Next buttons
- [ ] Filter by project type (optional)

### Service Areas Section
- [x] Display all service areas (as badges)
- [x] Link to city pages ✅ Badges now link to `/{city-slug}/masonry` hub pages
- [x] Schema.org areaServed (via generateContractorSchema)

---

## 4. City Hub Page

> **Status:** ✅ ~90% Complete
> **Implementation:** `src/app/(public)/[city]/masonry/page.tsx` (330 lines)

### Page Structure
- [x] Create city hub component ✅ Server Component with SSG
- [x] Show: "Masonry Services in {City}, {State}"
- [x] List projects in city (grid with 50 limit)
- [x] List contractors serving city (up to 4 featured)

### Content Sections
- [x] Featured projects (most recent via published_at sort)
- [x] Contractors in area (with project counts)
- [x] Project type breakdown (badges with counts)
- [ ] SEO content block (AI-generated, Phase 2)

### Dynamic Generation
- [x] Only generate for cities with published projects (1+ projects)
- [x] Return 404 for unpopulated cities
- [ ] Redirect common misspellings (Phase 2)

---

## 5. SEO Metadata

> **Status:** ✅ ~70% Complete (project pages done)

### Next.js Metadata API (US-005-01)
- [x] Implement `generateMetadata` for project pages ✅ In page.tsx
- [x] Implement for contractor pages ✅ In page.tsx
- [x] Implement for city hub pages ✅ In page.tsx

### Open Graph Tags (Project Pages)
- [x] Set og:title, og:description
- [x] Set og:type (article for projects)
- [x] Set og:url (canonical)
- [ ] Set og:locale (Phase 2 - not critical)
- [x] Set og:image ✅ Uses cover image from project_images

### Twitter Cards (Project Pages)
- [x] Set twitter:card (summary_large_image)
- [x] Set twitter:title, twitter:description
- [x] Set twitter:image ✅ Uses cover image from project_images
- [ ] Verify with Twitter Card Validator (manual testing)

---

## 6. Schema.org Structured Data

> **Status:** ✅ ~90% Complete
> **Implementation:** `src/lib/seo/structured-data.ts` (187 lines)

### Project Pages (US-005-02)
- [x] Create `lib/seo/structured-data.ts` ✅ Implemented
- [x] Implement CreativeWork schema (used instead of Article - better fit for portfolio)
- [x] ImageObject schema included in CreativeWork
- [x] Add HowTo schema generator (generateHowToSchema)

### Contractor Pages
- [x] Implement LocalBusiness schema (generateContractorSchema):
  - Address with city/state
  - areaServed array
  - hasOfferCatalog with services
- [ ] Add aggregateRating (Phase 2 - requires review system)

### Breadcrumb Schema
- [x] Implement BreadcrumbList schema (generateBreadcrumbSchema)
- [x] Include on project pages
- [x] Include on contractor pages ✅ Via Breadcrumbs component
- [x] Include on city hub pages ✅ Via Breadcrumbs component

### Schema Injection
- [x] Schema stringification utility (schemaToString)
- [x] Inject via dangerouslySetInnerHTML in pages
- [ ] Create `components/seo/JsonLd.tsx` wrapper (optional refactor)
- [ ] Validate with Google Rich Results Test

---

## 7. Sitemap Generation

> **Status:** ✅ Complete
> **Implementation:** `src/app/sitemap.ts` (126 lines)

### XML Sitemap (US-005-03)
- [x] Create `/app/sitemap.ts` ✅ Implemented
- [x] Generate sitemap with all:
  - [x] Published project URLs
  - [x] Contractor profile URLs (contractors with published projects)
  - [x] City hub URLs (cities with projects)
  - [x] Static pages (home, contractors index)
- [x] Include lastmod dates
- [x] Set appropriate priority values (1.0 home, 0.8 contractors, 0.7 projects, 0.6 cities)
- [x] Set changefreq hints (daily/weekly)

### Robots.txt
- [x] Create `/public/robots.txt` ✅ Static file
- [x] Allow all crawlers
- [x] Point to sitemap
- [x] Block admin/draft URLs (/dashboard, /profile, /projects/new, /projects/*/edit, /api/)

### Sitemap Updates
- [x] Dynamic generation on request (Next.js handles caching)
- [ ] Trigger revalidation on publish (optional - not critical with dynamic generation)
- [ ] Implement ISR for sitemap (optional - Next.js default behavior is fine)

---

## 8. Image SEO

### Alt Text Generation (US-005-08)
- [x] Generate descriptive alt text during AI analysis ✅ Added to GPT-4V analysis
- [x] Format: "[What's in image] - [Context] - [Location]" ✅ Prompt updated
- [ ] Allow contractor to edit alt text (Phase 2 - UI needed)
- [x] Fallback to generic if missing ✅ PhotoGallery fallback to project title

### Image Optimization
- [x] Verify WebP delivery ✅ All images compressed to WebP on upload
- [x] Implement srcset for responsive images ✅ Next.js Image `sizes` prop handles this
- [x] Add width/height to prevent CLS ✅ aspect-* containers reserve space; dimensions stored in DB
- [x] Implement blur placeholder ✅ Added shimmer placeholders to all public page images

### Image Sitemaps (Optional)
- [ ] Create image sitemap
- [ ] Include all project images
- [ ] Add captions and titles

---

## 9. Static Generation & Caching

### Static Generation (US-005-04)
- [x] Configure `generateStaticParams` for project pages ✅ In page.tsx
- [x] Configure for contractor pages ✅ In page.tsx
- [x] Configure for city hub pages ✅ In page.tsx
- [x] Set revalidation period (3600s / 1 hour) ✅ `revalidate = 3600`

### ISR (Incremental Static Regeneration)
- [ ] Implement on-demand revalidation
- [ ] Trigger on project publish
- [ ] Trigger on project edit
- [ ] Trigger on profile update

### Caching Strategy
```typescript
// Project page
export const revalidate = 3600; // 1 hour

// On publish
await revalidatePath(`/${project.city_slug}/masonry/${project.type_slug}/${project.slug}`);
await revalidatePath(`/contractors/${contractor.slug}`);
```

### Cache Headers
- [ ] Set appropriate Cache-Control headers
- [ ] Configure CDN caching rules
- [ ] Handle stale-while-revalidate

---

## 10. Performance Optimization

### Core Web Vitals (US-005-05)
- [ ] Measure baseline Lighthouse scores
- [ ] Optimize LCP:
  - Priority load hero image
  - Preload critical assets
  - Minimize server response time
- [ ] Optimize INP:
  - Minimize JavaScript
  - Use React Server Components
  - Defer non-critical scripts
- [ ] Optimize CLS:
  - Set image dimensions
  - Reserve space for dynamic content
  - Avoid layout shifts

### Image Loading
- [x] Hero image: priority loading ✅ PhotoGallery hero has `priority` prop
- [x] Thumbnails: lazy loading ✅ Next.js Image default behavior
- [x] Blur placeholders for all images ✅ SHIMMER_PLACEHOLDER on all public images
- [x] Progressive JPEG/WebP ✅ All uploads compressed to WebP

### Code Splitting
- [ ] Lazy load gallery lightbox
- [ ] Lazy load below-fold components
- [ ] Analyze bundle with `@next/bundle-analyzer`

### Font Optimization
- [x] Use `next/font` ✅ Already using Geist fonts via next/font/google (Vercel's Inter alternative)
- [x] Subset to used characters ✅ Latin subset configured in layout.tsx
- [x] Preload critical fonts ✅ next/font handles automatic preloading

---

## 11. Testing & Quality

### SEO Testing
- [ ] Validate with Google Search Console
- [ ] Test structured data with Rich Results Test
- [ ] Verify Open Graph with Facebook Debugger
- [ ] Verify Twitter Cards
- [ ] Check robots.txt accessibility
- [ ] Validate sitemap

### Performance Testing
- [ ] Run Lighthouse on all page types
- [ ] Target: Performance ≥ 90
- [ ] Test on slow 3G
- [ ] Test on mobile devices

### Accessibility Testing
- [ ] Run axe-core on all pages
- [ ] Verify keyboard navigation
- [ ] Test with screen reader
- [ ] Check color contrast

### Manual Testing
- [ ] View project pages at various breakpoints
- [ ] Test gallery interactions
- [ ] Verify all links work
- [ ] Check 404 handling

---

## Definition of Done

- [ ] Project detail pages render with full content
- [ ] Contractor profile pages show all projects
- [ ] All pages have proper meta tags
- [ ] Schema.org validates without errors
- [ ] Sitemap includes all published content
- [ ] Lighthouse Performance ≥ 90 on mobile
- [ ] Core Web Vitals all green
- [ ] Pages indexed by Google (verify in Search Console)

---

## Notes

- SEO is critical for this product - invest time here
- Test with real Google Search Console data
- Monitor Core Web Vitals in production
- Consider edge caching for best performance
