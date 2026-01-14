# Portfolio schema changes (case-study focused)

This document proposes schema updates in `knearme-portfolio` to support the ChatGPT-first case study workflow.

## Current publish requirements (from code)

Publish gate today requires:
- `title`
- `description`
- `project_type` + `project_type_slug`
- at least 1 image

This is enforced in `knearme-portfolio/src/app/api/projects/[id]/publish/route.ts` and mirrored in the publish checklist UI.

## Proposed additions (projects table)

Add the following fields to support structured, engaging case studies while keeping the existing `description` for SEO:

**Narrative fields**
- `summary` (text) - 1-2 sentence hook
- `challenge` (text) - what was wrong / constraints
- `solution` (text) - what was done
- `results` (text) - outcomes / impact
- `outcome_highlights` (text[]) - 2-4 bullet highlights
- `description_manual` (boolean, default false) - allow manual override in web app

**Media fields**
- `hero_image_id` (uuid, FK to `project_images.id`) - explicit hero image

**Optional context**
- `state` (text) - project-specific state (copied from contractor, editable per project)
- `client_type` (text, enum: residential/commercial/municipal/other)
- `budget_range` (text, enum)

**Why keep `description`**
- Public pages already render `description` as the main body.
- Keep `description` as a composed narrative built from summary + sections for SEO.
- Allow manual override in the web app when `description_manual = true`.

## Proposed additions (project_images table)

No required changes, but consider optional fields later:
- `caption` (text) - image caption for the gallery

Before/after labeling can use existing `image_type` (`before`, `after`, `progress`, `detail`).

## Publish gate updates (recommended)

Update the publish gate to require:
- `title`
- `summary`
- `challenge`, `solution`, `results`
- `project_type` + `project_type_slug`
- `city` + `state`
- `hero_image_id`
- at least 1 image

Keep `tags`, SEO fields, and before/after labeling as recommended (not required).

## Backfill strategy for existing projects

- `summary`: first 1-2 sentences of `description`
- `challenge/solution/results`: leave null unless a migration script can infer reliably
- `hero_image_id`: set to the first image by `display_order`
- `outcome_highlights`: empty by default
- `state`: copy from contractor profile
- `description_manual`: default false

## Rendering strategy

- Public page: show summary + sections, then full description (or a combined narrative built from the sections).
- ChatGPT app: edit sections directly; on save, recompute `description` server-side.
