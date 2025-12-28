# Portfolio migration + API update plan

This plan translates the case-study requirements into concrete schema changes and API updates for the `knearme-portfolio` app.

## 1) Database migration (Supabase)

Create a new migration in `knearme-portfolio/supabase/migrations/010_case_study_fields.sql` (next available number):

```sql
-- Case-study narrative + media fields
ALTER TABLE public.projects
  ADD COLUMN state TEXT,
  ADD COLUMN summary TEXT,
  ADD COLUMN challenge TEXT,
  ADD COLUMN solution TEXT,
  ADD COLUMN results TEXT,
  ADD COLUMN outcome_highlights TEXT[] DEFAULT '{}',
  ADD COLUMN hero_image_id UUID,
  ADD COLUMN client_type TEXT,
  ADD COLUMN budget_range TEXT,
  ADD COLUMN description_manual BOOLEAN DEFAULT FALSE;

-- Optional constraints (safe, non-breaking)
ALTER TABLE public.projects
  ADD CONSTRAINT projects_client_type_check
    CHECK (client_type IS NULL OR client_type IN ('residential', 'commercial', 'municipal', 'other'));

ALTER TABLE public.projects
  ADD CONSTRAINT projects_budget_range_check
    CHECK (budget_range IS NULL OR budget_range IN ('<5k', '5k-10k', '10k-25k', '25k-50k', '50k+'));

-- Hero image relationship
ALTER TABLE public.projects
  ADD CONSTRAINT projects_hero_image_fk
    FOREIGN KEY (hero_image_id)
    REFERENCES public.project_images(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_hero_image_id
  ON public.projects(hero_image_id);
```

## 2) Backfill existing data

Add a one-time data migration (or run manually) after schema changes:

```sql
-- Set hero image to first image by display_order
WITH first_images AS (
  SELECT DISTINCT ON (project_id)
    project_id,
    id
  FROM public.project_images
  ORDER BY project_id, display_order ASC
)
UPDATE public.projects p
SET hero_image_id = fi.id
FROM first_images fi
WHERE p.id = fi.project_id
  AND p.hero_image_id IS NULL;

-- Backfill state from contractor profile
UPDATE public.projects p
SET state = c.state
FROM public.contractors c
WHERE p.contractor_id = c.id
  AND p.state IS NULL;

-- Create a short summary from description if available
UPDATE public.projects
SET summary = CASE
  WHEN description IS NULL THEN NULL
  WHEN POSITION('.' IN description) > 0 THEN LEFT(description, POSITION('.' IN description))
  ELSE LEFT(description, 160)
END
WHERE summary IS NULL AND description IS NOT NULL;

-- Default to auto-composed description unless explicitly set later
UPDATE public.projects
SET description_manual = FALSE
WHERE description_manual IS NULL;
```

## 3) TypeScript types

If using Supabase type generation, re-run after migration. Then update any derived types:

- `knearme-portfolio/src/types/database.ts`

## 4) API updates

### `PATCH /api/projects/[id]`

File: `knearme-portfolio/src/app/api/projects/[id]/route.ts`

- Extend `updateProjectSchema` to include:
  - `state`
  - `summary`, `challenge`, `solution`, `results`
  - `outcome_highlights`
  - `hero_image_id`
  - `client_type`, `budget_range`
  - `description_manual`
- If `city` or `state` changes, regenerate `city_slug` using both values.
- If narrative fields change, recompose `description` (see helper below).
  - Respect `description_manual` (skip recompute when manual is true).
  - If `description` is empty on publish and `description_manual` is false, compose once before validation.

Recommended helper (server-side):

```ts
function composeDescription(input: {
  summary?: string | null;
  challenge?: string | null;
  solution?: string | null;
  results?: string | null;
  outcome_highlights?: string[] | null;
}): string | null {
  const blocks = [
    input.summary,
    input.challenge ? `Challenge\n${input.challenge}` : null,
    input.solution ? `Solution\n${input.solution}` : null,
    input.results ? `Results\n${input.results}` : null,
    input.outcome_highlights?.length
      ? `Outcomes\n${input.outcome_highlights.map((o) => `- ${o}`).join('\n')}`
      : null,
  ].filter(Boolean);

  return blocks.length ? blocks.join('\n\n') : null;
}
```

### `POST /api/projects`

File: `knearme-portfolio/src/app/api/projects/route.ts`

- Allow optional `summary`, `project_type`, `city`, `state`, `title` at creation (already supports most fields).
- Copy `state` from contractor profile if not provided.
- Do not require narrative fields at creation; they are recommended but non-blocking at publish.

### `POST /api/projects/[id]/publish`

File: `knearme-portfolio/src/app/api/projects/[id]/publish/route.ts`

Update validation to require:
- `title`
- `project_type` + `project_type_slug`
- `city` + `state`
- `hero_image_id` (auto-set to first image if missing)
- at least 1 image

Recommended (non-blocking):
- `summary`, `challenge`, `solution`, `results`
- `outcome_highlights`
- `before/after` labels
- tags + SEO fields

### `PATCH /api/projects/[id]/images`

File: `knearme-portfolio/src/app/api/projects/[id]/images/route.ts`

Currently supports reorder only. Add support for:
- `image_type` updates
- `alt_text` updates

This lets the ChatGPT app label images (before/after) without new endpoints.

### `POST /api/projects/[id]/images` (hero auto-set)

- If `hero_image_id` is null, auto-set it to the first uploaded image.
- Keep explicit hero selection available via `PATCH /api/projects/[id]`.

## 5) UI updates (web app)

Recommended but optional for this migration:

- `knearme-portfolio/src/app/(contractor)/projects/[id]/edit/page.tsx`
  - Add fields for summary, challenge, solution, results, outcome highlights
  - Add hero image selector

- `knearme-portfolio/src/components/publish/PublishChecklist.tsx`
  - Add checks for summary + narrative sections + hero image

- `knearme-portfolio/src/app/(public)/[city]/masonry/[type]/[slug]/page.tsx`
  - Render summary + narrative sections (fallback to `description`)

## 6) Data model doc sync

Update `knearme-portfolio/docs/03-architecture/data-model.md` to reflect new fields and current nullable constraints.
