# EPIC-004: Portfolio Display & Publishing

> **Version:** 1.0
> **Last Updated:** December 8, 2025
> **Status:** Ready for Development
> **Priority:** Must Have (MVP)

---

## Overview

Enable contractors to publish their AI-generated project showcases and display them publicly. This epic covers the guided editing interface, one-tap publishing, project detail pages, contractor profile pages, and the dashboard for portfolio management.

### Business Value

- **Revenue Driver**: Published portfolios attract homeowners (future monetization)
- **Contractor Value**: Professional online presence without design skills
- **SEO Foundation**: Each published project is indexable content
- **Social Proof**: Visual portfolio builds trust with potential customers

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Publish completion rate | >90% | After approval step |
| Time from approval to publish | <30s | Event timestamps |
| Projects per contractor | 5+ avg | Database analytics |
| Profile completion rate | >80% | Required fields |

---

## User Stories

### US-004-01: Guided Content Editing

**As a** contractor reviewing AI-generated content
**I want to** easily edit specific sections
**So that** I have control over my portfolio content

#### Acceptance Criteria

- Given AI has generated content
- When I view the editing interface
- Then I see the title, description, and tags
- And each is clearly marked as editable

- Given I tap on the title
- When editing
- Then it becomes an inline editable field
- And I see character count (60-80 recommended)

- Given I tap on the description
- When editing
- Then I see a rich text editor (basic formatting)
- And word count is displayed

- Given I edited content
- When I save
- Then changes are persisted to the draft
- And I can continue editing or publish

#### Technical Notes

- **Editor**: Lexical or TipTap for rich text
- **Autosave**: Debounced save every 5 seconds
- **Validation**: Warn if title > 80 chars or description < 200 words

```typescript
interface EditableContent {
  title: {
    value: string;
    maxLength: 100;
    recommended: { min: 60, max: 80 };
  };
  description: {
    value: string;
    minWords: 200;
    maxWords: 800;
  };
  tags: string[];
}
```

---

### US-004-02: Tag Management

**As a** contractor customizing my project
**I want to** add, edit, or remove tags
**So that** my project is discoverable for the right searches

#### Acceptance Criteria

- Given AI generated tags
- When I view the tags section
- Then I see tag chips I can remove
- And an input to add new tags

- Given I add a new tag
- When I type and press enter/comma
- Then the tag is added as a chip
- And input is cleared for another

- Given I have too many tags (>10)
- When I try to add more
- Then I see "Maximum 10 tags"

- Given a tag is misspelled
- When I tap it
- Then I can edit inline

#### Technical Notes

- **UI**: Chip input component
- **Validation**: No duplicates, 2-30 chars per tag
- **Suggestions**: Show popular tags (Phase 2)

---

### US-004-03: One-Tap Publish

**As a** contractor who approved the content
**I want to** publish with a single tap
**So that** my project goes live instantly

#### Acceptance Criteria

- Given I reviewed and approved content
- When I tap "Publish"
- Then I see a brief confirmation "Your project is live!"
- And the project status changes to "published"
- And the public URL is shown

- Given I tap "Publish"
- When publishing completes
- Then `published_at` timestamp is set
- And the project appears in my public portfolio
- And the sitemap is updated (async)

- Given publish fails
- When error occurs
- Then I see "Couldn't publish. Please try again."
- And the project remains as draft

#### Technical Notes

- **Endpoint**: `PATCH /api/projects/{id}/publish`
- **Database**: Set `status = 'published'`, `published_at = now()`
- **Cache**: Invalidate contractor profile cache
- **Sitemap**: Queue sitemap regeneration

```typescript
const publishProject = async (projectId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .update({
      status: 'published',
      published_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .select()
    .single();

  if (data) {
    // Invalidate caches
    await revalidatePath(`/contractors/${data.city_slug}/${data.contractor_id}`);
    await revalidatePath(`/${data.city_slug}/masonry/${data.project_type_slug}/${data.slug}`);
  }

  return data;
};
```

---

### US-004-04: Project Detail Page

**As a** visitor viewing a published project
**I want to** see the full project showcase
**So that** I can understand the contractor's work quality

#### Acceptance Criteria

- Given I navigate to a project URL
- When the page loads
- Then I see:
  - Project title
  - Photo gallery with thumbnails
  - Full description
  - Contractor name/link
  - Project details (type, location, duration)
  - Tags

- Given the project has before/after photos
- When I view the gallery
- Then I see a before/after comparison slider

- Given I tap a thumbnail
- When viewing
- Then the full-size image opens in a lightbox
- And I can swipe through all photos

**Page Structure:**
```
┌─────────────────────────────────────┐
│ [Breadcrumb: City > Masonry > Type] │
│                                      │
│ Project Title                        │
│ Denver, CO • Chimney Rebuild         │
│                                      │
│ ┌────────────────────────────────┐  │
│ │                                │  │
│ │     [Main Photo/Gallery]       │  │
│ │                                │  │
│ └────────────────────────────────┘  │
│ [thumb] [thumb] [thumb] [thumb]     │
│                                      │
│ Description text...                  │
│ 400-600 words of AI-generated        │
│ professional content.                │
│                                      │
│ ┌──────────────────────────────────┐│
│ │ About the Contractor              ││
│ │ [Photo] Heritage Masonry LLC      ││
│ │ Denver, CO                        ││
│ │ [View Portfolio →]                ││
│ └──────────────────────────────────┘│
│                                      │
│ Tags: #chimney #rebuild #denver      │
└─────────────────────────────────────┘
```

#### Technical Notes

- **Route**: `/[city]/masonry/[project-type]/[slug]`
- **Rendering**: Static generation with ISR (revalidate: 3600)
- **Images**: Next.js Image with priority for hero
- **Schema.org**: Article + ImageGallery markup

---

### US-004-05: Contractor Profile Page

**As a** homeowner researching contractors
**I want to** view a contractor's full portfolio
**So that** I can evaluate their work history

#### Acceptance Criteria

- Given I navigate to a contractor profile URL
- When the page loads
- Then I see:
  - Business name and logo
  - Location and services
  - Business description
  - Grid of published projects
  - Service areas list

- Given the contractor has 10+ projects
- When viewing the grid
- Then pagination or infinite scroll is available
- And projects are sorted by most recent

- Given I tap a project card
- When navigating
- Then I go to the full project detail page

**Page Structure:**
```
┌─────────────────────────────────────┐
│ [Logo] Heritage Masonry LLC          │
│ Denver, CO                           │
│ Chimney • Tuckpointing • Stone       │
│                                      │
│ About                                │
│ "Family-owned masonry company        │
│ serving Denver metro since 1995..."  │
│                                      │
│ Service Areas                        │
│ Denver | Aurora | Lakewood | Boulder │
│                                      │
│ Projects (24)                        │
│ ┌────────┐ ┌────────┐ ┌────────┐    │
│ │ proj1  │ │ proj2  │ │ proj3  │    │
│ └────────┘ └────────┘ └────────┘    │
│ ┌────────┐ ┌────────┐ ┌────────┐    │
│ │ proj4  │ │ proj5  │ │ proj6  │    │
│ └────────┘ └────────┘ └────────┘    │
│                                      │
│ [Load More]                          │
└─────────────────────────────────────┘
```

#### Technical Notes

- **Route**: `/contractors/[city]/[id]`
- **Slug Format**: `{business-name-slug}-{city-slug}`
- **Rendering**: SSG with ISR (revalidate: 3600)
- **Schema.org**: LocalBusiness markup

---

### US-004-06: Project List/Grid View

**As a** contractor managing my portfolio
**I want to** see all my projects in a grid
**So that** I can manage my published work

#### Acceptance Criteria

- Given I am on my dashboard
- When I view the projects section
- Then I see a grid of my projects
- And each card shows: thumbnail, title, status, date

- Given I have both drafts and published projects
- When viewing
- Then I can filter by status (All/Drafts/Published)

- Given I tap a project card
- When interacting
- Then I can: View (published), Edit, Archive

**Project Card:**
```
┌──────────────────────────┐
│ [Thumbnail Image]        │
│                          │
│ Historic Chimney Rebuild │
│ 📍 Denver, CO            │
│                          │
│ ✓ Published • Dec 5      │
│                          │
│ [Edit] [View] [•••]      │
└──────────────────────────┘
```

#### Technical Notes

- **Endpoint**: `GET /api/contractors/me/projects`
- **Pagination**: 12 per page, load more
- **Sorting**: Most recent first
- **Filtering**: Query param `?status=published|draft`

---

### US-004-07: Project Editing (Post-Publish)

**As a** contractor who published a project
**I want to** edit it after publishing
**So that** I can fix mistakes or update information

#### Acceptance Criteria

- Given I have a published project
- When I tap "Edit"
- Then I see the editing interface
- And all fields are editable

- Given I make changes
- When I save
- Then changes are immediately live
- And `updated_at` is set

- Given I change the title significantly
- When saving
- Then the URL slug does NOT change (preserve links)
- But SEO title can be updated

#### Technical Notes

- **Slug Stability**: Never change slug after publish
- **URL Redirects**: Not needed if slug stable
- **Cache**: Revalidate page after edit

---

### US-004-08: Project Archive/Unpublish

**As a** contractor who wants to hide a project
**I want to** archive it without deleting
**So that** I can restore it later if needed

#### Acceptance Criteria

- Given I have a published project
- When I tap "Archive"
- Then I see confirmation dialog
- And project status changes to "archived"
- And it's removed from public portfolio

- Given I have an archived project
- When I view my dashboard
- Then I can see archived projects (separate tab)
- And I can "Restore" to republish

- Given I restore a project
- When confirmed
- Then it's published again
- And same URL is active

#### Technical Notes

- **Status Flow**: draft → published ↔ archived
- **SEO**: Return 410 Gone for archived project URLs
- **Recovery**: Full content preserved

---

### US-004-09: Dashboard Overview

**As a** contractor
**I want to** see a summary of my portfolio
**So that** I know my overall status at a glance

#### Acceptance Criteria

- Given I log into my dashboard
- When the page loads
- Then I see:
  - Total published projects
  - Total views (if tracking, Phase 2)
  - Recent projects (last 5)
  - Quick action: "Add New Project"

- Given I have no projects yet
- When viewing dashboard
- Then I see empty state with CTA "Create Your First Project"

**Dashboard Layout:**
```
┌─────────────────────────────────────┐
│ Welcome back, Mike!                  │
│                                      │
│ ┌──────────┐ ┌──────────┐           │
│ │    12    │ │  Draft   │           │
│ │ Published │ │    2     │           │
│ └──────────┘ └──────────┘           │
│                                      │
│ [+ Add New Project]                  │
│                                      │
│ Recent Projects                      │
│ ─────────────────                    │
│ • Chimney Rebuild - Published        │
│ • Tuckpointing Job - Draft           │
│ • Stone Steps - Published            │
│                                      │
│ [View All Projects →]                │
└─────────────────────────────────────┘
```

#### Technical Notes

- **Route**: `/dashboard`
- **Auth**: Protected route, redirect if not logged in
- **Data**: Single query with counts

---

### US-004-10: Profile Editing

**As a** contractor
**I want to** update my business profile
**So that** my portfolio stays accurate

#### Acceptance Criteria

- Given I am on profile settings
- When I view my profile
- Then I can edit: name, city, services, description, photo, service areas

- Given I change my business name
- When saved
- Then my portfolio URL slug does NOT change
- And the display name updates

- Given I update my service areas
- When saved
- Then the new areas appear on my profile
- And may affect search visibility

#### Technical Notes

- **Route**: `/profile`
- **Slug Stability**: Profile slug never changes
- **Photo Upload**: Same pipeline as project images

---

## Non-Functional Requirements

| Requirement | Target | Notes |
|-------------|--------|-------|
| Project page load time | <2.5s LCP | Core Web Vitals |
| Profile page load time | <2.5s LCP | Core Web Vitals |
| Dashboard load time | <1s | Authenticated user |
| Image lazy loading | Below fold only | Performance |
| Mobile responsive | 375px+ | Primary use case |

---

## Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| EPIC-003 | Internal | Requires AI-generated content |
| EPIC-005 | Internal | SEO integration |
| EPIC-001 | Internal | Auth for dashboard |

---

## Out of Scope

- Contact form / lead generation (Phase 2)
- Analytics dashboard (Phase 2)
- Social sharing buttons (Should Have)
- Print view (Won't Have)

---

## Test Scenarios

| ID | Scenario | Expected Result |
|----|----------|-----------------|
| PORT-T01 | Edit title inline | Changes saved, reflected |
| PORT-T02 | Publish project | Status changes, URL works |
| PORT-T03 | View published project | Full content displayed |
| PORT-T04 | Archive and restore | Status toggles correctly |
| PORT-T05 | Profile page loads | All sections visible |
| PORT-T06 | Dashboard with 0 projects | Empty state shown |
| PORT-T07 | Dashboard with 50 projects | Pagination works |
| PORT-T08 | Edit profile photo | New photo displayed |
| PORT-T09 | Update service areas | Changes reflected |
| PORT-T10 | Project page on mobile | Responsive layout |

---

*This epic delivers the visible output. SEO optimization in EPIC-005 makes these pages discoverable.*
