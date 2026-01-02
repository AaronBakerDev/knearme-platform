# Phase 12 - Service Catalog Migration (Hardcoded -> Dynamic)

> Goal: Replace hardcoded masonry service lists with a dynamic Service Catalog
> backed by `service_types`, while preserving SEO content quality and UX.
> Status: Proposed
> Target: After Phase 11 (or parallel if low risk).

---

## Handoff from Phase 11

### What Was Built
- Full rename from `contractors` → `businesses` across the stack
- Database migrations (033, 034) with JSONB agentic fields (`location`, `understanding`, `context`)
- `/api/businesses/me` and `/api/businesses/[slug]` endpoints (primary)
- `/api/contractors/me` kept for backward compatibility (deprecated)
- `Business*` TypeScript types with deprecated `Contractor*` aliases
- Route group renamed `(contractor)` → `(dashboard)`
- SEO structured data updated (`generateBusinessSchema()`)

### Key Files to Reference
```
src/types/database.ts           — Business types (primary), Contractor (deprecated)
src/app/api/businesses/me/      — Primary business API
src/app/(dashboard)/            — Authenticated routes (renamed from contractor)
src/lib/seo/structured-data.ts  — generateBusinessSchema()
src/lib/data/services.ts        — Business queries
supabase/migrations/033_*.sql   — Schema migration
supabase/migrations/034_*.sql   — Code review fixes
```

### Patterns to Follow
- Use `business_id` for all new FKs (not `contractor_id`)
- Query `businesses` table, not `contractors`
- Use `Business` type, not deprecated `Contractor`
- Use `generateBusinessSchema()`, not deprecated `generateContractorSchema()`

### Ready for Phase 12
- Universal business support established (not masonry-specific)
- JSONB fields ready for agentic context (`understanding.specialties`, etc.)
- Service catalog can now be business-agnostic
- Foundation for multi-trade expansion complete

---

## Why This Phase

Hardcoded masonry services currently act as the system of record for:
- Profile service selection (business onboarding).
- SEO landing pages and city-specific service pages.
- The masonry cost estimator.
- Service content and slug mapping.

This blocks multi-trade expansion and creates taxonomy drift between:
`MASONRY_SERVICES`, `SERVICE_CONTENT`, and `service_types`.

The database already has a `service_types` table but it is not the
source of truth for these flows yet.

---

## Principles

- Single source of truth: `service_types` is canonical for service IDs, slugs,
  labels, and icons.
- Content fallback: `SERVICE_CONTENT` remains as editorial fallback only.
- Runtime validation over type coupling: stop deriving types from hardcoded lists.
- Zero SEO regressions: URLs and copy should remain stable unless explicitly changed.

---

## Sprint Outcomes

- All service lists are driven by `service_types`.
- No UI or SEO route depends on `MASONRY_SERVICES` or `NATIONAL_SERVICE_TYPES`.
- `SERVICE_CONTENT` is used only as fallback when DB fields are empty.
- Service selection and routing work for any trade with published service types.

---

## Sub-Sprint 12.1 - Inventory and Mapping

Focus: Capture all masonry-specific dependencies and map to dynamic data.

Tasks:
- [ ] List all references to `MASONRY_SERVICES`, `SERVICE_CONTENT`,
      `NATIONAL_SERVICE_TYPES`, `mapUrlSlugToServiceId`, and hardcoded
      service descriptions.
- [ ] Map each masonry service to its `service_types` row
      (service_id, url_slug, label, icon_emoji).
- [ ] Identify any SEO slugs that must remain stable.

Acceptance:
- [ ] Documented mapping table for current masonry services.
- [ ] Clear list of files to update.

---

## Sub-Sprint 12.2 - Service Catalog Module

Focus: Create a single API for service lookup with fallback behavior.

Tasks:
- [ ] Add a Service Catalog module (e.g., `src/lib/services/catalog.ts`)
      that reads `service_types` and merges fallback data from
      `SERVICE_CONTENT`.
- [ ] Expose helpers:
      - getServiceCatalog()
      - getServiceBySlug()
      - getServiceById()
      - getServiceListForTrade()
- [ ] Update type usage to avoid `ServiceId` being derived from a static list.

Acceptance:
- [ ] One canonical module used for service data everywhere.
- [ ] Fallback fields work when DB data is incomplete.

---

## Sub-Sprint 12.3 - Seed or Admin Workflow

Focus: Ensure `service_types` has usable data for masonry.

Tasks:
- [ ] Decide strategy:
      - Seed script for masonry services, or
      - Admin-only creation in Supabase UI.
- [ ] If seeding, add a non-migration seed script
      (do not violate "no seed data" policy in migrations).
- [ ] Include icon_emoji and short_description at minimum.

Acceptance:
- [ ] Masonry services are present in `service_types` in all environments.

---

## Sub-Sprint 12.4 - Profile Service Selection

Focus: Replace hardcoded selection list in profile editor.

Tasks:
- [ ] Update `src/app/(contractor)/profile/edit/page.tsx`
      to render services from Service Catalog.
- [ ] Use `service_types.trade` (or a trade hint) to filter options.
- [ ] Preserve icon display (from DB or fallback).

Acceptance:
- [ ] Profile service picker is fully dynamic.

---

## Sub-Sprint 12.5 - Public Service Pages

Focus: Dynamic data on SEO landing pages.

Tasks:
- [ ] Update `/services` index to use Service Catalog for labels,
      icons, and descriptions (no static ServiceId typing).
- [ ] Update `/services/[type]` to use DB for long content and
      structured data fields; fallback to `SERVICE_CONTENT`.
- [ ] Update `mapUrlSlugToServiceId` usage to rely on DB `url_slug`.

Acceptance:
- [ ] No masonry-only list is required for national service pages.

---

## Sub-Sprint 12.6 - City Service Pages and Cost Estimator

Focus: Remove masonry-only assumptions from city routes and widgets.

Tasks:
- [ ] Replace `MASONRY_SERVICES` usage in:
      - `src/app/(public)/[city]/masonry/[type]/page.tsx`
      - `src/app/(public)/[city]/masonry/[type]/cost/page.tsx`
      - `src/components/tools/MasonryCostEstimatorWidget.tsx`
- [ ] Replace hardcoded service descriptions with DB content or
      a templated fallback.

Acceptance:
- [ ] City pages and cost estimator are driven by Service Catalog.

---

## Sub-Sprint 12.7 - Cleanup and QA

Focus: Remove legacy constants and verify behavior.

Tasks:
- [ ] Delete or quarantine `MASONRY_SERVICES` and `NATIONAL_SERVICE_TYPES`.
- [ ] Update `SERVICE_CONTENT` typing to accept string keys.
- [ ] Run `rg -n "MASONRY_SERVICES|NATIONAL_SERVICE_TYPES|ServiceId"` to ensure
      no hardcoded dependencies remain.
- [ ] QA: profile edit, service index, service detail, city service pages,
      cost estimator, sitemap/canonicals.

Acceptance:
- [ ] No hardcoded service list remains in runtime code.
- [ ] SEO routes render with correct labels, slugs, and copy.

---

## Non-Goals

- No new trade onboarding flows.
- No changes to service discovery or AI taxonomy generation.
- No DataForSEO integration in this sprint.

---

## References

- `supabase/migrations/032_add_service_types.sql`
- `src/lib/constants/services.ts`
- `src/lib/constants/service-content.ts`
- `src/lib/data/services.ts`
- `docs/11-seo-discovery/page-templates/national-service.md`
