# ChatGPT tools -> Portfolio API mapping

This document maps proposed ChatGPT app tools to the existing `knearme-portfolio` API routes and highlights gaps.

## Existing API routes (portfolio)

- `POST /api/projects` - create draft project
- `GET /api/projects` - list projects (filter by `status`)
- `GET /api/projects/[id]` - get project + images
- `PATCH /api/projects/[id]` - update project fields
- `POST /api/projects/[id]/publish` - publish project
- `DELETE /api/projects/[id]/publish` - unpublish
- `GET /api/projects/[id]/images` - list images
- `POST /api/projects/[id]/images` - request signed upload URL + create image record
- `PATCH /api/projects/[id]/images` - reorder images
- `DELETE /api/projects/[id]/images` - delete image
- `POST /api/ai/analyze-images` - image analysis (OpenAI API)
- `POST /api/ai/generate-content` - content generation (OpenAI API)
- `POST /api/ai/transcribe` - voice transcription (OpenAI API)

## Tool mapping

### `create_project_draft`
- **Maps to**: `POST /api/projects`
- **Notes**: extend to accept `summary`, `project_type`, `city`, `state`, and new narrative fields as optional inputs.

### `list_contractor_projects`
- **Maps to**: `GET /api/projects?status=draft|published`

### `get_project_status`
- **Maps to**: `GET /api/projects/[id]`

### `add_project_media`
- **Maps to**: `POST /api/projects/[id]/images` + upload to Supabase Storage
- **Notes**: ChatGPT file uploads return a file ID + download URL. Widget-first flow:
  1) widget calls `POST /api/projects/[id]/images` to get a signed upload URL
  2) widget downloads the file via `getFileDownloadUrl(fileId)`
  3) widget uploads to the signed URL
  4) widget calls `GET /api/projects/[id]/images` to refresh

### `reorder_project_media`
- **Maps to**: `PATCH /api/projects/[id]/images` with `image_ids`

### `set_project_hero_media`
- **Maps to**: `PATCH /api/projects/[id]` once `hero_image_id` exists
- **Gap**: add `hero_image_id` column and allow updates in PATCH schema
  - **Note**: auto-set hero to first upload if missing

### `set_project_media_labels`
- **Maps to**: new endpoint or extend `PATCH /api/projects/[id]/images`
- **Gap**: current PATCH only supports reorder. We need to allow updates to `image_type` and `alt_text`.

### `update_project_sections`
- **Maps to**: `PATCH /api/projects/[id]`
- **Gap**: add `summary`, `challenge`, `solution`, `results`, `outcome_highlights` to update schema.

### `update_project_meta`
- **Maps to**: `PATCH /api/projects/[id]` (already supports `title`, `tags`, `materials`, `techniques`, `duration`, SEO)
- **Notes**: extend to accept `state` (project-specific) and `description_manual` if/when exposing manual overrides in web app.

### `finalize_project`
- **Maps to**: `POST /api/projects/[id]/publish`
- **Gap**: update publish validation to enforce minimum requirements (title, project_type, city+state, hero image, >=1 image) and auto-compose description if needed.

## AI endpoints usage (cost note)

The existing AI endpoints call OpenAI APIs directly. For the ChatGPT app, avoid them to prevent extra API billing:
- Do **not** call `POST /api/ai/generate-content` from the ChatGPT app.
- Use ChatGPT conversation to draft copy, then persist via `PATCH /api/projects/[id]`.
- `POST /api/ai/analyze-images` is optional; prefer ChatGPT's native vision to label images.

## Minimal MCP server responsibilities

- Tool auth and contractor identity
- Request signed upload URLs from the portfolio API
- Update project fields and media order
- Enforce publish readiness (same as web app)
