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
    "title": { "type": "string" },
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
    "missing_fields": ["title", "hero_image_id", "images"]
  },
  "_meta": {
    "widgetTemplate": "project-draft",
    "widgetData": {
      "project": { "id": "uuid", "status": "draft", "hero_image_url": null },
      "missing_fields": ["title", "hero_image_id", "images"],
      "can_publish": false
    },
    "project": { "id": "uuid", "status": "draft", "hero_image_url": null }
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
          "image_type": { "type": "string", "enum": ["before", "after", "progress", "detail"] },
          "alt_text": { "type": "string" },
          "display_order": { "type": "number" },
          "width": { "type": "number" },
          "height": { "type": "number" }
        },
        "required": ["file_id", "filename", "content_type"]
      }
    },
    "images": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "url": { "type": "string" },
          "filename": { "type": "string" },
          "image_type": { "type": "string", "enum": ["before", "after", "progress", "detail"] },
          "alt_text": { "type": "string" }
        },
        "required": ["url"]
      }
    }
  },
  "required": ["project_id"]
}
```

At least one of `files` or `images` is required.

**Output**
```json
{
  "structuredContent": {
    "project_id": "uuid",
    "media_count": 5,
    "missing_fields": ["hero_image_id"],
    "upload_status": "Prepared 3 uploads, Imported 2 images",
    "upload_errors": [
      { "file_id": "file_456", "error": "Unsupported format" }
    ]
  },
  "_meta": {
    "widgetTemplate": "project-media",
    "widgetData": {
      "project": { "id": "uuid", "title": "...", "hero_image_id": "uuid" },
      "images": ["...full image list..."]
    },
    "images": ["...full image list..."],
    "uploads": [
      { "file_id": "file_123", "image_id": "uuid", "signed_url": "https://...", "token": "token", "path": "...", "content_type": "image/jpeg" }
    ]
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
- `PATCH /api/projects/[id]/images` (labels + alt text updates)

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

**Output**
```json
{
  "structuredContent": {
    "project_id": "uuid",
    "missing_fields": ["hero_image_id"],
    "can_publish": false
  },
  "_meta": {
    "widgetTemplate": "project-draft",
    "widgetData": {
      "project": { "id": "uuid", "title": "...", "status": "draft" },
      "missing_fields": ["hero_image_id"],
      "can_publish": false
    },
    "project": { "id": "uuid", "title": "...", "status": "draft" }
  }
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

**Output**
```json
{
  "structuredContent": {
    "project_id": "uuid",
    "missing_fields": ["hero_image_id"],
    "can_publish": false
  },
  "_meta": {
    "widgetTemplate": "project-draft",
    "widgetData": {
      "project": { "id": "uuid", "title": "...", "status": "draft" },
      "missing_fields": ["hero_image_id"],
      "can_publish": false
    },
    "project": { "id": "uuid", "title": "...", "status": "draft" }
  }
}
```

**Portfolio API mapping**
- `PATCH /api/projects/[id]`

---

### 8) `publish_project`

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
    "url": "https://knearme.co/..."
  },
  "_meta": {
    "widgetTemplate": "project-status",
    "widgetData": {
      "project": { "id": "uuid", "status": "published" },
      "missing_fields": [],
      "can_publish": false,
      "public_url": "https://knearme.co/..."
    },
    "project": { "id": "uuid", "status": "published" }
  }
}
```

**Portfolio API mapping**
- `POST /api/projects/[id]/publish`
  - API auto-composes `description` if missing and `description_manual` is false.
  - API enforces the minimum publish requirements (see above).

---

### 9) `unpublish_project`

**Purpose:** revert a published project to draft.

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
    "status": "draft"
  },
  "_meta": {
    "widgetTemplate": "project-status",
    "widgetData": {
      "project": { "id": "uuid", "status": "draft" },
      "missing_fields": ["hero_image_id"],
      "can_publish": false
    }
  }
}
```

**Portfolio API mapping**
- `DELETE /api/projects/[id]/publish`

---

### 10) `list_projects`

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

**Output**
```json
{
  "structuredContent": { "count": 10, "has_more": true },
  "_meta": {
    "widgetTemplate": "project-list",
    "widgetData": {
      "projects": [ { "id": "uuid", "title": "...", "status": "draft" } ],
      "count": 10,
      "has_more": true
    }
  }
}
```

**Portfolio API mapping**
- `GET /api/projects?status=&limit=&offset=`

---

### 11) `get_project_status`

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

**Output**
```json
{
  "structuredContent": {
    "project_id": "uuid",
    "status": "draft",
    "missing_fields": ["hero_image_id"],
    "can_publish": false
  },
  "_meta": {
    "widgetTemplate": "project-status",
    "widgetData": {
      "project": { "id": "uuid", "title": "...", "status": "draft" },
      "missing_fields": ["hero_image_id"],
      "can_publish": false
    },
    "project": { "id": "uuid", "title": "...", "status": "draft" }
  }
}
```

**Portfolio API mapping**
- `GET /api/projects/[id]`

## UI template mapping

Suggested template for `openai/outputTemplate`:

- `template://knearme-portfolio` (single bundle; `widgetTemplate` selects the view)

## Widget state (minimal)

```json
{
  "project_id": "uuid",
  "image_ids": ["uuid", "uuid"],
  "hero_image_id": "uuid"
}
```
