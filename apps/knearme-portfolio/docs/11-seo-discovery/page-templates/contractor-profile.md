# Business Profile Page Template (Contractor Schema)

**Priority:** P0 (Implemented)
**Status:** ✅ Complete
**Phase:** 1 (MVP)

## Overview

Business Profile pages are **public-facing portfolio showcases** for individual businesses. These pages serve as the primary conversion endpoint where clients can view a business’s body of work and decide to contact them. The current schema and routes still use `contractors`.

**Implementation:** `app/(public)/businesses/[city]/[slug]/page.tsx` (re-export; source lives under `/contractors`)

**Business Purpose:**
- Showcase business expertise and project diversity
- Build trust through complete portfolio presentation
- SEO landing pages for business names and locations
- Conversion point for client inquiries (Phase 2: contact forms)

## Route Configuration

### File Location
```
app/(public)/businesses/[city]/[slug]/page.tsx
```

### URL Pattern
```
/businesses/{city-slug}/{business-slug}
```

### Example URLs
- `/businesses/denver-co/denver-masonry-pro`
- `/businesses/lakewood-co/brickwise-masonry`
- `/businesses/aurora-co/highlands-masonry-3`

### Dynamic Route Parameters

| Parameter | Type | Source | Example |
|-----------|------|--------|---------|
| `city` | string | URL segment | `denver-co` |
| `slug` | string | URL segment (unique business slug) | `denver-masonry-pro` |

**Validation:**
- Route returns 404 if contractor slug not found
- City slug must match contractor's `city_slug` field
- Contractor slug must be unique (stored as `profile_slug`)
- **Indexing gate:** if zero published projects, page is public but `noindex` is applied

**Slug Rules:**
- Default `profile_slug` = `slugify(business_name)`
- If slug collision, append a short suffix (e.g., `-2`, `-3`) to keep it unique
- Contractors can edit the slug; uniqueness is enforced on save
- Recommended: preserve old slugs for future alias handling if needed

## Implemented Features

### 1. Data Fetching

**Primary Query:**
```typescript
const { data, error } = await supabase
  .from('contractors')
  .select(`
    *,
    projects(
      *,
      project_images(*)
    )
  `)
  .eq('profile_slug', slug)
  .eq('city_slug', city)
  .single();
```

**Returns:**
- Full business profile (name, bio, services, location, contact info)
- All projects (filtered to published only in component)
- All project images for each project

**Post-Processing:**
- Filters projects to `status = 'published'`
- Sorts projects by `published_at` descending
- Paginates projects (12 per page)

### 2. Static Site Generation

**generateStaticParams():**
```typescript
export async function generateStaticParams() {
  const supabase = createAdminClient();

  // Get contractors with at least one published project
  const { data: contractors } = await supabase
    .from('contractors')
    .select(`
      profile_slug,
      city_slug,
      projects!inner(status)
    `)
    .eq('projects.status', 'published')
    .not('profile_slug', 'is', null)
    .not('city_slug', 'is', null)
    .limit(100);

  // Deduplicate (join may return multiples)
  const unique = new Map();
  contractors.forEach((c) => {
    if (!unique.has(c.profile_slug)) {
      unique.set(c.profile_slug, { city: c.city_slug, slug: c.profile_slug });
    }
  });

  return Array.from(unique.values());
}
```

**ISR:** Page revalidates every hour (`revalidate = 3600`)

### 3. Page Structure (Implemented)

#### Profile Header
- **Layout:** Horizontal (desktop) / Vertical (mobile)
- **Profile Photo:** Large circular avatar (144px × 144px)
- **Business Name:** H1 heading
- **Location Badge:** City, state with MapPin icon
- **Project Count Badge:** Total published projects
- **Services:** Badges with Briefcase icon
- **Description:** Business bio (owner-provided or AI-generated)

**Code:**
```tsx
<div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl p-6 md:p-8">
  <div className="flex flex-col md:flex-row gap-6 items-start">
    {/* Profile Photo (56px on mobile, 144px on desktop) */}
    <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden">
      {contractor.profile_photo_url ? (
        <Image src={contractor.profile_photo_url} alt={contractor.business_name} fill />
      ) : (
        <div className="bg-primary/10 text-primary font-bold">
          {contractor.business_name?.charAt(0)}
        </div>
      )}
    </div>

    {/* Business Info */}
    <div className="flex-1">
      <h1 className="text-3xl md:text-4xl font-bold mb-3">
        {contractor.business_name}
      </h1>
      {/* Badges, services, description */}
    </div>
  </div>
</div>
```

#### Service Areas
- **Display:** Badge pills with MapPin icons
- **Behavior:** Each badge links to corresponding City Hub page
- **Purpose:** Internal linking to city pages, SEO benefit
- **Conditional:** Only displays if `service_areas` array exists

**Linking Logic:**
```tsx
{contractor.service_areas?.map((area) => {
  const citySlug = slugify(area); // "Denver" → "denver-co"
  return (
    <Link key={area} href={`/${citySlug}/masonry`}>
      <Badge variant="outline">
        <MapPin className="h-3 w-3 mr-1" />
        {area}
      </Badge>
    </Link>
  );
})}
```

#### Contact Card (NAP)
- **Display:** Address, phone, and website when available
- **Purpose:** Trust + conversion; aligns with LocalBusiness schema
- **Conditional:** Renders only when at least one NAP field exists

#### Project Portfolio Grid
- **Layout:** 3 columns desktop, 2 tablet, 1 mobile
- **Pagination:** 12 projects per page
- **Sort:** Most recent first (`published_at DESC`)
- **Card Design:**
  - Cover image (aspect-video)
  - Project title (2-line clamp)
  - Project type badge
  - City location with MapPin icon
  - Hover effects: Shadow lift, image scale

**Pagination Controls:**
```tsx
<nav className="flex items-center justify-center gap-2 mt-8">
  <Button disabled={page === 1} asChild={page > 1}>
        <Link href={`/businesses/${city}/${slug}?page=${page - 1}`}>
      <ChevronLeft /> Previous
    </Link>
  </Button>

  <span className="text-sm text-muted-foreground">
    Page {page} of {totalPages}
  </span>

  <Button disabled={page >= totalPages} asChild={page < totalPages}>
        <Link href={`/businesses/${city}/${slug}?page=${page + 1}`}>
      Next <ChevronRight />
    </Link>
  </Button>
</nav>
```

#### Footer CTA
- **Copy:** "Interested in local services in {City}, {State}?"
- **Subtext:** "Contact {Business Name} to discuss your project."
- **Design:** Gradient background, centered text
- **Future:** Add contact form or phone number (Phase 2)

### 4. SEO Implementation

#### Metadata Generation

**generateMetadata():**
```typescript
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { city, slug } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('contractors')
    .select(`
      business_name, city, state, description, services, profile_photo_url,
      projects(project_images(storage_path, alt_text))
    `)
    .eq('profile_slug', slug)
    .eq('projects.status', 'published')
    .limit(1, { foreignTable: 'projects' })
    .single();

  const contractor = data;
  if (!contractor) return { title: 'Contractor Not Found' };

  const title = `${contractor.business_name} | Services in ${contractor.city}, ${contractor.state}`;
  const description = contractor.description?.slice(0, 160) ||
    `${contractor.business_name} showcases real projects in ${contractor.city}. View their portfolio.`;

  // OG image priority: profile photo > first project cover image
  let imageUrl = contractor.profile_photo_url;
  if (!imageUrl && contractor.projects?.[0]?.project_images?.[0]) {
    imageUrl = getPublicUrl('project-images', contractor.projects[0].project_images[0].storage_path);
  }

  return {
    title,
    description,
    keywords: contractor.services?.join(', '),
    openGraph: { title: contractor.business_name, description, type: 'profile', url: `${siteUrl}/businesses/${city}/${slug}`, images: imageUrl ? [{ url: imageUrl }] : [] },
    twitter: { card: 'summary_large_image', title: contractor.business_name, description, images: imageUrl ? [imageUrl] : [] },
    robots: hasPublishedProjects ? undefined : { index: false, follow: true },
    alternates: { canonical: `${siteUrl}/businesses/${city}/${slug}` },
  };
}
```

**OG Image Strategy:**
1. Profile photo (if uploaded)
2. Cover image from most recent published project
3. No image (summary card only)

#### Structured Data (JSON-LD)

**LocalBusiness Schema:**
```typescript
const contractorSchema = generateContractorSchema(contractor);
```

**Output:**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Denver Stone & Steel",
  "description": "Specializing in custom installs, repairs, and restoration projects...",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Denver",
    "addressRegion": "CO",
    "addressCountry": "US"
  },
  "url": "https://knearme.com/businesses/denver-co/denver-masonry-pro",
  "telephone": "+1-303-555-0100",
  "email": "contact@denvermasonrypro.com",
  "priceRange": "$$",
  "image": "https://storage.supabase.co/profile-photos/abc123.jpg",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Services",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Chimney Repair" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Tuckpointing" } }
    ]
  }
}
```

**ItemList Schema (Projects):**
```typescript
const projectListSchema = generateProjectListSchema(
  allPublishedProjects.map((p) => ({ ...p, contractor })),
  `Projects by ${contractor.business_name}`
);
```

**Indexing Gate:**
- If `hasPublishedProjects` is false, render the profile but set `noindex`.
- Only render the project ItemList schema when at least one published project exists.

**Breadcrumb Schema:**
- Generated by `<Breadcrumbs>` component
- Path: Home → Contractors (current route name) → {Business Name}

### 5. Internal Linking

**Outbound Links (Implemented):**
- Service areas → City Hub pages
- Project cards → Project detail pages
- Breadcrumb → /businesses (future index page)

**Inbound Links (Expected):**
- City Hub → Featured contractor cards
- Project detail pages → Contractor CTA
- Related projects → Contractor profiles

**Link Context:**
- All links use business name or descriptive text
- Project links include project title
- Service area links include city name

## What's Implemented

### Complete Features ✅

- Dynamic route with city and contractor slug parameters
- Static generation for top 100 contractors with published projects
- Profile header (photo, name, location, services, bio)
- Service areas section with links to city hubs
- Project portfolio grid (paginated, 12 per page)
- Pagination controls (Previous/Next)
- SEO metadata (title, description, OG tags, Twitter cards)
- JSON-LD schemas (LocalBusiness, ItemList, Breadcrumbs)
- Breadcrumb navigation
- ISR with hourly revalidation
- Responsive design (mobile, tablet, desktop)
- Dark mode support
- Image optimization (lazy loading, blur placeholders)

### Missing Features (Future Phases)

- **Contact Form:** "Get a Quote" form (Phase 2)
- **Phone Number Display:** Click-to-call button (Phase 2)
- **Email Contact:** "Send Email" button (Phase 2)
- **Reviews/Ratings:** Display contractor reviews (Phase 3)
- **Certifications/Licenses:** Display credentials (Phase 3)
- **Years in Business:** Display experience (Phase 3)
- **Service Area Map:** Interactive map of coverage (Phase 3)

## Data Model Requirements

### Database Tables Used

**contractors:**
- `id` (uuid, PK)
- `business_name` (string, required) - Company or individual name
- `profile_slug` (string, required, unique) - Slugified business name for URLs (editable by contractor)
- `city` (string, required) - Display city name
- `state` (string, required) - 2-letter state code
- `city_slug` (string, required) - SEO-friendly city identifier
- `description` (text, nullable) - Business bio
- `services` (text[], nullable) - Array of service types offered
- `service_areas` (text[], nullable) - Cities served
- `profile_photo_url` (string, nullable) - Profile image URL
- `contact_email` (string, nullable) - Public contact email
- `contact_phone` (string, nullable) - Public phone number
- `website_url` (string, nullable) - External website
- `created_at` (timestamp) - Registration date
- `updated_at` (timestamp) - Last profile update

**projects:**
- All fields from projects table (see Project Detail template)
- Filtered by `contractor_id` and `status = 'published'`

**project_images:**
- Used to get cover images for project cards

### Contractor ID (Internal)

**Type:** UUID v4  
**Example:** `abc123de-f456-7890-ghij-klmnopqrstuv`  
**Generation:** Supabase auto-generates on contractor creation  
**Public URL:** Uses `profile_slug` instead of ID

## Performance Metrics

### Core Web Vitals (Actual)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| **LCP** | < 2.5s | ~2.2s | ✅ Good |
| **CLS** | < 0.1 | ~0.06 | ✅ Good |
| **FID** | < 100ms | ~40ms | ✅ Good |

**Optimizations Applied:**
- Priority loading for profile photo
- Lazy loading for project grid images
- Server Components for fast initial render
- Pagination reduces initial payload

### SEO Metrics (Current)

| Metric | Current Value | Phase 2 Target |
|--------|---------------|----------------|
| Indexed Pages | ~5 profiles | 50+ profiles |
| Avg. Position | Not ranking | Top 50 for "{contractor} {city}" |
| Organic Clicks/Month | < 5 | 50+ |

## Testing Coverage

### Manual Testing (Completed)

- ✅ URL resolution for valid contractor slugs
- ✅ 404 for invalid slugs
- ✅ Noindex for profiles with zero published projects (public but not indexed)
- ✅ Profile header displays correctly
- ✅ Service areas link to city hubs
- ✅ Project grid populates with projects
- ✅ Pagination works (Previous/Next)
- ✅ Project cards link to detail pages
- ✅ Breadcrumbs navigate properly
- ✅ Responsive layout (375px, 768px, 1920px)
- ✅ Dark mode compatibility

### Automated Testing (Not Implemented)

**Recommended for Phase 2:**
- E2E test: Navigate from city hub → project → contractor profile
- Pagination test: Navigate through multiple pages
- Schema validation: Automated JSON-LD testing

## Known Issues & Limitations

### Current Limitations

1. **No Contact Form:**
   - No lead form; contact relies on visible phone/address/website
   - **Impact:** Medium (conversion opportunity)
   - **Fix:** Phase 2 - Add contact form or inquiry capture

2. **No Review System:**
   - No social proof or ratings
   - **Impact:** Medium (trust building opportunity)
   - **Fix:** Phase 3 - Implement review system

3. **No Service Area Map:**
   - Service areas listed but not visualized
   - **Impact:** Low (nice-to-have)
   - **Fix:** Phase 3 - Add interactive map

4. **No Certifications/Licenses:**
   - Can't showcase credentials
   - **Impact:** Low (not critical for MVP)
   - **Fix:** Phase 3 - Add credentials section

### Bug Fixes (Completed)

- ✅ Fixed pagination state bugs (page > totalPages)
- ✅ Resolved service areas linking to invalid slugs
- ✅ Corrected contractor schema validation errors
- ✅ Fixed profile photo aspect ratio issues

## Related Documentation

### Implementation Files

- **Route:** `app/(public)/businesses/[city]/[slug]/page.tsx`
- **Components:** `src/components/seo/Breadcrumbs.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/card.tsx`
- **Utilities:** `src/lib/seo/structured-data.ts`, `src/lib/utils/slugify.ts`
- **Types:** `src/types/database.ts`

### Documentation References

- [SEO Discovery Strategy](../../SEO-DISCOVERY-STRATEGY.md) - Section 2.1, 6.1
- [City Hub Template](./city-hub.md) - Links to contractor profiles
- [Project Detail Template](./project-detail.md) - Links to contractor profiles
- [Data Model](../../03-architecture/data-model.md) - Database schema

## Acceptance Criteria (Validated)

### Functional Requirements ✅

- [x] URL `/businesses/{city}/{slug}` resolves to profile page
- [x] Invalid slug shows 404
- [x] Contractors with zero published projects show 404
- [x] Profile header displays name, photo, location, services, bio
- [x] Service areas link to city hub pages
- [x] Project portfolio displays all published projects
- [x] Pagination works correctly (12 per page)
- [x] Project cards link to project detail pages
- [x] Breadcrumbs navigate correctly

### SEO Requirements ✅

- [x] Unique `<title>` per contractor
- [x] Unique meta description
- [x] OpenGraph tags with profile photo or project image
- [x] Twitter card tags
- [x] Canonical URL set correctly
- [x] JSON-LD LocalBusiness schema valid
- [x] JSON-LD ItemList schema valid (projects)
- [x] Breadcrumb schema valid

### Performance Requirements ✅

- [x] LCP < 2.5s
- [x] CLS < 0.1
- [x] FID < 100ms
- [x] Images lazy-loaded
- [x] Total page size < 1.5MB
- [x] Mobile-responsive

## Future Enhancements (Phase 2+)

### High Priority (Phase 2)

1. **Contact Form:**
   - "Request a Quote" modal
   - Fields: Name, email, phone, project description
   - Sends email to contractor + saves lead in database
   - CTA: "Get a Free Quote"

2. **Phone/Email Display:**
   - "Call Now" button (click-to-call on mobile)
   - "Send Email" button (opens mail client)
   - Conditional: Only show if contractor opts in

### Medium Priority (Phase 3)

3. **Review System:**
   - Display average rating (stars)
   - Show recent reviews (5 most recent)
   - Link to full reviews page
   - Update LocalBusiness schema with aggregateRating

4. **Certifications/Licenses:**
   - Display badges for certifications (e.g., "Licensed & Insured")
   - State contractor license number
   - Trade association memberships

5. **Service Area Map:**
   - Interactive map showing coverage area
   - Highlight cities served
   - Filterable by service type

### Low Priority (Phase 4)

6. **Social Media Links:**
   - Facebook, Instagram, LinkedIn
   - Display as icon buttons in header

7. **Video Portfolio:**
   - Embed YouTube/Vimeo videos
   - Project walkthroughs, testimonials

8. **Project Statistics:**
   - "Completed 50+ projects"
   - "10 years in business"
   - "Avg 4.8-star rating"
