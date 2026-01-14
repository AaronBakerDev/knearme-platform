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

### `list_projects`
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
  - **Fallback**: URL imports are supported via `POST /api/projects/[id]/images/from-url`.

### `reorder_project_media`
- **Maps to**: `PATCH /api/projects/[id]/images` with `image_ids`

### `set_project_hero_media`
- **Maps to**: `PATCH /api/projects/[id]` once `hero_image_id` exists
- **Status**: `hero_image_id` is supported in the PATCH schema and auto-set to the first upload if missing.

### `set_project_media_labels`
- **Maps to**: `PATCH /api/projects/[id]/images`
- **Status**: `PATCH /api/projects/[id]/images` supports `labels` updates for `image_type` and `alt_text`.

### `update_project_sections`
- **Maps to**: `PATCH /api/projects/[id]`
- **Status**: narrative fields are supported in the update schema.

### `update_project_meta`
- **Maps to**: `PATCH /api/projects/[id]` (already supports `title`, `tags`, `materials`, `techniques`, `duration`, SEO)
- **Status**: `state` is supported in the update schema. `description_manual`, `client_type`, and `budget_range` are supported by the API but are not exposed in the MCP tool yet.

### `publish_project`
- **Maps to**: `POST /api/projects/[id]/publish`
- **Status**: publish validation enforces minimum requirements and auto-composes description when needed.

### `unpublish_project`
- **Maps to**: `DELETE /api/projects/[id]/publish`

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
