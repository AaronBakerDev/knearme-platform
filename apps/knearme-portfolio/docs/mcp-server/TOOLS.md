# MCP Tools Reference

This document describes the 11 MCP tools exposed by the KnearMe portfolio server.

## Tool Categories

| Category | Tools |
|----------|-------|
| **Project CRUD** | `create_project_draft`, `get_project_status`, `list_projects` |
| **Content** | `update_project_meta`, `update_project_sections` |
| **Media** | `add_project_media`, `reorder_project_media`, `set_project_hero_media`, `set_project_media_labels` |
| **Publishing** | `publish_project`, `unpublish_project` |

> Legacy aliases: `finalize_project` and `list_contractor_projects` are still supported but hidden from model selection.

---

## Project CRUD Tools

### `create_project_draft`

Creates a new draft project for the contractor.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | No | Optional project title |
| `project_type` | string | No | Type of project (e.g., "chimney-repair") |
| `city` | string | No | City where project is located |
| `state` | string | No | State where project is located |
| `summary` | string | No | 1-2 sentence hook |
| `challenge` | string | No | Problem description |
| `solution` | string | No | How it was solved |
| `results` | string | No | Outcome and impact |
| `outcome_highlights` | string[] | No | Bullet highlights |

**Returns:**
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
    }
  }
}
```

---

### `get_project_status`

Gets the current status and completeness of a project.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `project_id` | string | Yes | UUID of the project |

**Returns:** `project-status` widget data with missing fields and publish readiness.

---

### `list_projects`

Lists the contractor's projects with optional filtering.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `status` | string | No | Filter by status: `draft`, `published`, `archived` |
| `limit` | number | No | Max results (default: 10) |
| `offset` | number | No | Pagination offset (default: 0) |

**Returns:**
```json
{
  "structuredContent": { "count": 10, "has_more": true },
  "_meta": {
    "widgetTemplate": "project-list",
    "widgetData": {
      "projects": [ { "id": "uuid", "title": "...", "hero_image_url": "https://..." } ],
      "count": 10,
      "has_more": true
    }
  }
}
```

---

## Content Tools

### `update_project_meta`

Updates project metadata (title, type, location, duration, tags, SEO).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `project_id` | string | Yes | UUID of the project |
| `title` | string | No | Project title (max 200 chars) |
| `project_type` | string | No | Type of project |
| `city` | string | No | City location |
| `state` | string | No | State location |
| `duration` | string | No | Duration (e.g., "3 weeks") |
| `tags` | string[] | No | Tags |
| `materials` | string[] | No | Materials |
| `techniques` | string[] | No | Techniques |
| `seo_title` | string | No | SEO title (max 70 chars) |
| `seo_description` | string | No | SEO description (max 160 chars) |

**Returns:** `project-draft` widget data with updated missing fields and publish readiness.

---

### `update_project_sections`

Updates narrative content sections.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `project_id` | string | Yes | UUID of the project |
| `summary` | string | No | 1-2 sentence hook |
| `challenge` | string | No | Problem description |
| `solution` | string | No | How it was solved |
| `results` | string | No | Outcome and benefits |
| `outcome_highlights` | string[] | No | Bullet points |

**Returns:** `project-draft` widget data with updated missing fields and publish readiness.

---

## Media Tools

### `add_project_media`

Adds images to a project draft.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `project_id` | string | Yes | UUID of the project |
| `files` | object[] | No | ChatGPT file uploads (preferred) |
| `files[].file_id` | string | Yes | ChatGPT file ID |
| `files[].filename` | string | Yes | Original filename |
| `files[].content_type` | string | Yes | MIME type (e.g., `image/jpeg`) |
| `files[].image_type` | string | No | `before`/`after`/`progress`/`detail` |
| `files[].alt_text` | string | No | Alt text for accessibility |
| `files[].display_order` | number | No | Optional display order index |
| `files[].width` | number | No | Image width in pixels |
| `files[].height` | number | No | Image height in pixels |
| `images` | object[] | No | Fallback: import by URL |
| `images[].url` | string | Yes | Image URL |
| `images[].filename` | string | No | Optional filename |
| `images[].image_type` | string | No | `before`/`after`/`progress`/`detail` |
| `images[].alt_text` | string | No | Alt text for accessibility |

**Returns:**
```json
{
  "structuredContent": {
    "project_id": "uuid",
    "media_count": 5,
    "missing_fields": ["hero_image_id"],
    "upload_status": "Prepared 3 uploads, Imported 2 images"
  },
  "_meta": {
    "widgetTemplate": "project-media",
    "widgetData": {
      "project": { "id": "uuid", "title": "...", "hero_image_id": "uuid" },
      "images": [ { "id": "uuid", "url": "https://..." } ]
    },
    "uploads": [
      { "file_id": "file_123", "image_id": "uuid", "signed_url": "https://...", "token": "token", "path": "...", "content_type": "image/jpeg" }
    ]
  }
}
```

---

### `reorder_project_media`

Reorders images by display order.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `project_id` | string | Yes | UUID of the project |
| `image_ids` | string[] | Yes | Image IDs in display order |

**Returns:** `project-media` widget data with updated images.

---

### `set_project_hero_media`

Sets the hero image.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `project_id` | string | Yes | UUID of the project |
| `hero_image_id` | string | Yes | Image ID to use as hero |

**Returns:** `project-media` widget data with updated hero selection.

---

### `set_project_media_labels`

Labels images as before/after/progress/detail and updates alt text.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `project_id` | string | Yes | UUID of the project |
| `labels` | object[] | Yes | Label updates |
| `labels[].image_id` | string | Yes | Image ID |
| `labels[].image_type` | string | No | `before`/`after`/`progress`/`detail` |
| `labels[].alt_text` | string | No | Alt text |

**Returns:** `project-media` widget data with updated images.

---

## Publishing Tools

### `publish_project`

Publishes a project, making it publicly accessible.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `project_id` | string | Yes | UUID of the project |

**Returns:** `project-status` widget data with published status and public URL.

---

### `unpublish_project`

Reverts a published project to draft status.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `project_id` | string | Yes | UUID of the project |

**Returns:** `project-status` widget data with draft status.
