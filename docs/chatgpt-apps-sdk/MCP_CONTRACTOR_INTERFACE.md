# MCP Contractor Interface (ChatGPT app)

This document defines concrete tool contracts for the contractor-facing ChatGPT app. These tools map to the existing `knearme-portfolio` API routes and support the case-study workflow.

## Design rules

- ChatGPT is the primary copywriter. Tools persist structured data only.
- `structuredContent` is concise and model-facing.
- `_meta` contains full payloads for the UI widget only.
- Required fields are enforced at publish time (API-owned).

## Publish requirements (minimum)

**Required to publish**
- Title
- Project type
- City + state
- At least 1 image
- Hero image (auto-set to first image if missing)

**Recommended (non-blocking)**
- Summary, Challenge, Solution, Results
- Outcome highlights
- Before/after labels when available
- Materials, techniques, duration, tags
- SEO title + description

## Shared types

### Project narrative

```json
{
  "summary": "1-2 sentence hook",
  "challenge": "What was wrong / constraints",
  "solution": "What the contractor did",
  "results": "Outcome or impact",
  "outcome_highlights": ["Bullet 1", "Bullet 2"]
}
```

### Image object (UI)

```json
{
  "id": "uuid",
  "url": "https://...",
  "image_type": "before|after|progress|detail|null",
  "alt_text": "string|null",
  "display_order": 0
}
```

## Tool definitions

### 1) `create_project_draft`

**Purpose:** create a draft case-study project.

**Input schema**
```json
{
  "type": "object",
  "properties": {
    "project_type": { "type": "string" },
    "city": { "type": "string" },
    "state": { "type": "string" },
    "summary": { "type": "string" },
    "challenge": { "type": "string" },
    "solution": { "type": "string" },
    "results": { "type": "string" },
    "outcome_highlights": { "type": "array", "items": { "type": "string" } }
  },
  "required": []
}
```

**Output**
```json
{
  "structuredContent": {
    "project_id": "uuid",
    "missing_fields": ["hero_image"]
  },
  "_meta": {
    "project": { "id": "uuid", "status": "draft" }
  }
}
```

**Portfolio API mapping**
- `POST /api/projects`
- optional follow-up `PATCH /api/projects/[id]` to set narrative fields

---

### 2) `add_project_media`

**Purpose:** add media to a draft project.

**Input schema**
```json
{
  "type": "object",
  "properties": {
    "project_id": { "type": "string" },
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "file_id": { "type": "string" },
          "filename": { "type": "string" },
          "content_type": { "type": "string" },
          "image_type": { "type": "string", "enum": ["before", "after", "progress", "detail"] }
        },
        "required": ["file_id", "filename", "content_type"]
      }
    }
  },
  "required": ["project_id", "files"]
}
```

**Output**
```json
{
  "structuredContent": {
    "project_id": "uuid",
    "media_count": 5,
    "missing_fields": ["hero_image"]
  },
  "_meta": {
    "images": ["...full image list..."]
  }
}
```

**Portfolio API mapping**
- `POST /api/projects/[id]/images` to get signed upload URLs
- Widget downloads files via `getFileDownloadUrl(fileId)` and uploads bytes to storage
- `GET /api/projects/[id]/images` to refresh

---

### 3) `reorder_project_media`

**Purpose:** reorder images (drag-and-drop or ChatGPT request).

**Input schema**
```json
{
  "type": "object",
  "properties": {
    "project_id": { "type": "string" },
    "image_ids": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["project_id", "image_ids"]
}
```

**Output**
```json
{
  "structuredContent": { "project_id": "uuid", "status": "ok" },
  "_meta": { "images": ["...updated images..."] }
}
```

**Portfolio API mapping**
- `PATCH /api/projects/[id]/images`

---

### 4) `set_project_hero_media`

**Purpose:** set explicit hero image.

**Input schema**
```json
{
  "type": "object",
  "properties": {
    "project_id": { "type": "string" },
    "hero_image_id": { "type": "string" }
  },
  "required": ["project_id", "hero_image_id"]
}
```

**Portfolio API mapping**
- `PATCH /api/projects/[id]`

---

### 5) `set_project_media_labels`

**Purpose:** label images as before/after/progress/detail and update alt text.

**Input schema**
```json
{
  "type": "object",
  "properties": {
    "project_id": { "type": "string" },
    "labels": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "image_id": { "type": "string" },
          "image_type": { "type": "string", "enum": ["before", "after", "progress", "detail"] },
          "alt_text": { "type": "string" }
        },
        "required": ["image_id"]
      }
    }
  },
  "required": ["project_id", "labels"]
}
```

**Portfolio API mapping**
- Extend `PATCH /api/projects/[id]/images` to accept label updates

---

### 6) `update_project_sections`

**Purpose:** update the narrative sections.

**Input schema**
```json
{
  "type": "object",
  "properties": {
    "project_id": { "type": "string" },
    "summary": { "type": "string" },
    "challenge": { "type": "string" },
    "solution": { "type": "string" },
    "results": { "type": "string" },
    "outcome_highlights": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["project_id"]
}
```

**Portfolio API mapping**
- `PATCH /api/projects/[id]`

---

### 7) `update_project_meta`

**Purpose:** update title, tags, materials, techniques, SEO, duration, city, project_type.

**Input schema**
```json
{
  "type": "object",
  "properties": {
    "project_id": { "type": "string" },
    "title": { "type": "string" },
    "project_type": { "type": "string" },
    "city": { "type": "string" },
    "state": { "type": "string" },
    "duration": { "type": "string" },
    "tags": { "type": "array", "items": { "type": "string" } },
    "materials": { "type": "array", "items": { "type": "string" } },
    "techniques": { "type": "array", "items": { "type": "string" } },
    "seo_title": { "type": "string" },
    "seo_description": { "type": "string" }
  },
  "required": ["project_id"]
}
```

**Portfolio API mapping**
- `PATCH /api/projects/[id]`

---

### 8) `finalize_project`

**Purpose:** publish the project.

**Input schema**
```json
{
  "type": "object",
  "properties": {
    "project_id": { "type": "string" }
  },
  "required": ["project_id"]
}
```

**Output**
```json
{
  "structuredContent": {
    "project_id": "uuid",
    "status": "published",
    "url": "https://knearme.com/..."
  },
  "_meta": { "project": { "..." : "..." } }
}
```

**Portfolio API mapping**
- `POST /api/projects/[id]/publish`
  - API auto-composes `description` if missing and `description_manual` is false.
  - API enforces the minimum publish requirements (see above).

---

### 9) `list_contractor_projects`

**Purpose:** list recent projects for the contractor.

**Input schema**
```json
{
  "type": "object",
  "properties": {
    "status": { "type": "string", "enum": ["draft", "published", "archived"] },
    "limit": { "type": "number" },
    "offset": { "type": "number" }
  },
  "required": []
}
```

**Portfolio API mapping**
- `GET /api/projects?status=&limit=&offset=`

---

### 10) `get_project_status`

**Purpose:** get a single project + images.

**Input schema**
```json
{
  "type": "object",
  "properties": {
    "project_id": { "type": "string" }
  },
  "required": ["project_id"]
}
```

**Portfolio API mapping**
- `GET /api/projects/[id]`

## UI template mapping

Suggested templates for `openai/outputTemplate`:

- `template://project-draft` (draft review widget)
- `template://project-media` (media organizer)
- `template://project-status` (status view)
- `template://project-list` (list view)

## Widget state (minimal)

```json
{
  "project_id": "uuid",
  "image_ids": ["uuid", "uuid"],
  "hero_image_id": "uuid"
}
```
