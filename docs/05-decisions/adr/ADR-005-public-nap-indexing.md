# ADR-005: Public NAP + Indexing Gate for Contractor Profiles

> **Status:** Accepted
> **Date:** January 2, 2026
> **Deciders:** Product Owner, Technical Architect
> **Related:** ADR-001 (Next.js), ADR-002 (Supabase)

---

## Context

We want contractor profiles and project pages to convert visitors into leads. Local SEO performance depends on clear, consistent NAP (Name, Address, Phone) visibility, and indexing thin profile pages (with zero published projects) can dilute search quality. We also need contractor profiles to remain publicly accessible even before a first project is published (for direct sharing or verification).

---

## Decision

**We will:**

1. **Collect and display public NAP** (Name, Address, Phone) on contractor profiles and project pages.
2. **Include NAP in LocalBusiness structured data** for better local search understanding.
3. **Keep contractor profiles publicly accessible even with zero projects**, but **set `noindex`** until at least one project is published.

This preserves shareability while preventing thin profiles from entering search indexes.

---

## Consequences

### Positive

- Stronger local trust signals through visible, consistent NAP.
- Cleaner SEO footprint: only profiles with real portfolio proof are indexed.
- Contractors can still share their profile URL before first publication.

### Trade-offs

- Requires collecting and storing address/phone in onboarding + profile forms.
- Adds backfill work for existing businesses (contractors table).
- Structured data must stay aligned with new fields.

---

## Alternatives Considered

1. **Index all profiles immediately**
   - Rejected: risks thin-content indexing and lower overall SEO quality.
2. **Hide profiles until first published project**
   - Rejected: conflicts with “publicly accessible” requirement.
3. **Only show NAP in schema (hidden in UI)**
   - Rejected: NAP should be human-visible for trust and conversion.

---

## Implementation Details

### Schema + Data

- Added public NAP + website fields to `contractors` and `businesses`.
  - Migration: `supabase/migrations/032_add_public_nap_fields.sql`
- Updated data model documentation:
  - `docs/03-architecture/data-model.md`

### Capture & Sync

- Onboarding capture:
  - `src/app/api/onboarding/route.ts`
  - `src/lib/agents/discovery.ts`
- Profile setup form:
  - `src/app/(contractor)/profile/setup/page.tsx`
- Sync contractor updates to businesses:
  - `src/app/api/contractors/me/route.ts`

### Public Display

- Contractor profile contact card:
  - `src/app/(public)/businesses/[city]/[slug]/page.tsx`
- Project page contractor CTA:
  - `src/app/(public)/[city]/masonry/[type]/[slug]/page.tsx`

### SEO & Indexing Gate

- Structured data now includes address, postal code, phone, website:
  - `src/lib/seo/structured-data.ts`
- Contractor profile `robots` uses `noindex` until at least one published project:
  - `src/app/(public)/businesses/[city]/[slug]/page.tsx`

---

## Notes

“Publish warnings” refers to SEO indexing state (noindex until the first published project). No UI warning is shown to visitors today; add one later if desired.
