# Phase 16 — Private Draft Images + Publish Copy

> **Priority:** Medium
> **Status:** ✅ Complete
> **Focus:** Keep draft project images private, allow AI vision without signed URLs, publish by copying to public bucket.
> **Completed:** 2026-01-02

## Goals

- Draft project images stay private until publish.
- No signed read URLs anywhere in the product.
- AI vision still works by passing image bytes.
- Published projects use public CDN URLs.

---

## Decisions

1. **Two buckets**
   - `project-images-draft` (private) for drafts
   - `project-images` (public) for published
2. **No signed read URLs**
   - Internal UI uses an authenticated proxy endpoint.
   - AI uses raw bytes fetched server-side.
3. **Publish flow**
   - Copy all draft images to public bucket on publish.
   - Remove public copies on unpublish.

---

## Implementation Checklist

### Storage + Policies
- [x] Create `project-images-draft` bucket (private) + RLS policies
- [x] Register bucket in storage config

### Upload + API
- [x] Upload all project images to draft bucket
- [x] Copy draft images to public bucket when project is published
- [x] Remove public copies on unpublish
- [x] Update image upload endpoints (from file + from URL)

### Secure Delivery
- [x] Add authenticated image proxy endpoint for drafts
- [x] Return proxy URLs for drafts, public URLs for published

### AI Vision
- [x] Load draft image bytes server-side for Story Agent
- [x] Update image analysis to accept raw bytes (not URLs)

### UI Updates
- [x] Contractor dashboard + project pages use resolved URLs
- [x] Chat/edit flows use resolved URLs from project status

---

## Follow-ups (Optional)

- [ ] Add background job to backfill draft bucket from legacy public-only images
- [ ] Add caching layer for proxy image responses (ETag + longer max-age)
- [ ] Add telemetry: image proxy hit rate + publish copy failures
