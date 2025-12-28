# API Design Document

> **Version:** 1.0
> **Last Updated:** December 26, 2025
> **Base URL:** `https://knearme.com/api`

---

## API Conventions

### Authentication

All authenticated endpoints require a valid Supabase JWT token in the Authorization header:

```
Authorization: Bearer <supabase_access_token>
```

### Response Format

All responses follow a consistent JSON structure:

**Success Response:**
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": { "field": "title" }
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `429` | Rate Limited |
| `500` | Internal Server Error |

---

## Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/callback` | No | Exchange Supabase tokens for session |
| `GET` | `/auth/user` | Yes | Get current authenticated user |
| `POST` | `/auth/logout` | Yes | End session |
| `GET` | `/contractors/me` | Yes | Get current contractor profile |
| `PUT` | `/contractors/me` | Yes | Update current contractor profile |
| `GET` | `/contractors/:slug` | No | Get public contractor profile |
| `GET` | `/projects` | Yes | List contractor's projects |
| `POST` | `/projects` | Yes | Create new project |
| `GET` | `/projects/:id` | Mixed | Get project details |
| `PUT` | `/projects/:id` | Yes | Update project |
| `DELETE` | `/projects/:id` | Yes | Archive project |
| `POST` | `/projects/:id/publish` | Yes | Publish draft project |
| `POST` | `/upload/signed-url` | Yes | Get signed upload URL |
| `POST` | `/ai/analyze-images` | Yes | Analyze project images |
| `POST` | `/ai/transcribe` | Yes | Transcribe voice recording |
| `POST` | `/ai/generate` | Yes | Generate project content |

---

## Authentication Endpoints

### POST /auth/callback

Exchange Supabase auth tokens for a server session.

**Request:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "..."
}
```

**Response (201):**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "mike@heritage-masonry.com"
    },
    "contractor": {
      "id": "uuid",
      "business_name": "Heritage Masonry LLC",
      "is_profile_complete": true
    }
  }
}
```

### GET /auth/user

Get current authenticated user.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "email": "mike@heritage-masonry.com",
    "contractor_id": "uuid"
  }
}
```

---

## Contractor Endpoints

### GET /contractors/me

Get current contractor's full profile.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "email": "mike@heritage-masonry.com",
    "business_name": "Heritage Masonry LLC",
    "city": "Denver",
    "state": "CO",
    "city_slug": "denver-co",
    "services": ["chimney", "tuckpointing", "stone-work"],
    "profile_image_url": "https://supabase.co/storage/v1/...",
    "business_description": "Family-owned masonry since 2010...",
    "projects_count": 12,
    "created_at": "2024-06-15T10:00:00Z"
  }
}
```

### PUT /contractors/me

Update current contractor's profile.

**Request:**
```json
{
  "business_name": "Heritage Masonry LLC",
  "city": "Denver",
  "state": "CO",
  "services": ["chimney", "tuckpointing", "stone-work"],
  "business_description": "Updated description..."
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "business_name": "Heritage Masonry LLC",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

### GET /contractors/:slug

Get public contractor profile (for portfolio page).

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "business_name": "Heritage Masonry LLC",
    "city": "Denver",
    "state": "CO",
    "services": ["chimney", "tuckpointing", "stone-work"],
    "profile_image_url": "...",
    "business_description": "...",
    "projects": [
      {
        "id": "uuid",
        "title": "Historic Chimney Rebuild",
        "slug": "historic-chimney-rebuild-denver",
        "thumbnail_url": "...",
        "published_at": "2025-01-10T14:00:00Z"
      }
    ]
  }
}
```

---

## Project Endpoints

### GET /projects

List contractor's projects (authenticated).

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | all | Filter by status: draft, published, archived |
| `limit` | number | 20 | Max results per page |
| `offset` | number | 0 | Pagination offset |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Historic Chimney Rebuild",
      "status": "published",
      "thumbnail_url": "...",
      "views_count": 47,
      "published_at": "2025-01-10T14:00:00Z"
    }
  ],
  "meta": {
    "total": 12,
    "limit": 20,
    "offset": 0
  }
}
```

### POST /projects

Create a new project (draft).

**Request:**
```json
{
  "title": "Chimney Rebuild Project",
  "description": "AI-generated description...",
  "project_type": "Chimney Rebuild",
  "project_type_slug": "chimney-rebuild",
  "materials": ["red brick", "portland mortar"],
  "techniques": ["full rebuild"],
  "city": "Denver",
  "duration": "3 days",
  "seo_title": "Historic Chimney Rebuild in Denver | Heritage Masonry",
  "seo_description": "Professional chimney rebuild in Denver...",
  "image_paths": [
    "projects/uuid/1.webp",
    "projects/uuid/2.webp"
  ],
  "interview_session_id": "uuid"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "slug": "historic-chimney-rebuild-denver-2025",
    "status": "draft",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### GET /projects/:id

Get project details.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "title": "Historic Chimney Rebuild in Denver",
    "description": "This 1920s chimney had seen better days...",
    "project_type": "Chimney Rebuild",
    "materials": ["red brick", "portland mortar"],
    "techniques": ["full rebuild"],
    "city": "Denver",
    "city_slug": "denver-co",
    "duration": "3 days",
    "status": "published",
    "slug": "historic-chimney-rebuild-denver-2025",
    "seo_title": "...",
    "seo_description": "...",
    "images": [
      {
        "id": "uuid",
        "url": "https://...",
        "image_type": "before",
        "alt_text": "Crumbling chimney before repair",
        "display_order": 0
      }
    ],
    "contractor": {
      "id": "uuid",
      "business_name": "Heritage Masonry LLC",
      "slug": "heritage-masonry-denver"
    },
    "published_at": "2025-01-10T14:00:00Z"
  }
}
```

### PUT /projects/:id

Update project details.

**Request:**
```json
{
  "title": "Updated Title",
  "description": "Updated description..."
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

### POST /projects/:id/publish

Publish a draft project.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "published",
    "slug": "historic-chimney-rebuild-denver-2025",
    "public_url": "https://knearme.com/denver-co/masonry/chimney-rebuild/historic-chimney-rebuild-denver-2025",
    "published_at": "2025-01-15T10:30:00Z"
  }
}
```

---

## Upload Endpoints

### POST /upload/signed-url

Get a signed URL for direct upload to Supabase Storage.

**Request:**
```json
{
  "file_name": "chimney-before.jpg",
  "content_type": "image/jpeg",
  "folder": "projects"
}
```

**Response (200):**
```json
{
  "data": {
    "upload_url": "https://xyzabc.supabase.co/storage/v1/object/upload/sign/...",
    "file_path": "projects/abc123/chimney-before.jpg",
    "expires_at": "2025-01-15T11:00:00Z"
  }
}
```

**Client uploads directly to `upload_url` using PUT with file body.**

---

## AI Endpoints

### POST /ai/analyze-images

Analyze uploaded project images using Gemini 3 Flash (preview) via the AI SDK.

**Request:**
```json
{
  "image_paths": [
    "projects/uuid/1.webp",
    "projects/uuid/2.webp",
    "projects/uuid/3.webp"
  ]
}
```

**Response (200):**
```json
{
  "data": {
    "project_type": "Chimney Rebuild",
    "project_type_slug": "chimney-rebuild",
    "confidence": 0.92,
    "materials": ["red brick", "portland mortar", "copper flashing"],
    "image_classifications": [
      { "path": "projects/uuid/1.webp", "type": "before" },
      { "path": "projects/uuid/2.webp", "type": "process" },
      { "path": "projects/uuid/3.webp", "type": "after" }
    ],
    "suggested_tags": ["chimney", "brick", "rebuild"]
  }
}
```

### POST /ai/transcribe

Transcribe voice recording using Whisper.

**Request:**
Form-data with audio file:
```
audio: <binary file data>
```

**Response (200):**
```json
{
  "data": {
    "transcript": "The whole chimney was falling apart. Bricks were crumbling, mortar was shot. Probably hadn't been touched in fifty years.",
    "duration_seconds": 12.5,
    "language": "en"
  }
}
```

### POST /ai/generate

Generate project content using Gemini 3 Flash (preview) via the AI SDK.

**Request:**
```json
{
  "project_type": "Chimney Rebuild",
  "materials": ["red brick", "portland mortar"],
  "city": "Denver",
  "interview_responses": [
    {
      "question": "What was the problem the customer had?",
      "answer": "The whole chimney was falling apart..."
    },
    {
      "question": "How did you fix it?",
      "answer": "Tore it down to the roofline and rebuilt with matching brick..."
    },
    {
      "question": "How long did it take?",
      "answer": "3 days"
    }
  ],
  "image_analysis": {
    "materials": ["red brick"],
    "image_classifications": [...]
  }
}
```

**Response (200):**
```json
{
  "data": {
    "title": "Historic Brick Chimney Rebuild in Denver",
    "description": "This 1920s chimney had seen better days—the mortar was crumbling and bricks were falling apart after decades of Colorado weather. Our team from Heritage Masonry LLC took on the challenge of restoring this historic piece while maintaining the home's original character...\n\n[400-600 words]",
    "tags": ["chimney", "rebuild", "denver", "brick", "masonry", "historic"],
    "seo_title": "Historic Brick Chimney Rebuild in Denver | Heritage Masonry",
    "seo_description": "Professional chimney rebuild in Denver. See how we restored this 1920s chimney using matching red brick. Expert masonry services.",
    "alt_texts": [
      "Crumbling brick chimney showing deteriorated mortar before repair in Denver",
      "Mason rebuilding chimney with red brick on Denver rooftop",
      "Completed chimney rebuild with new red brick matching original 1920s style"
    ]
  }
}
```

---

## Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 10 | per minute |
| Read operations | 100 | per minute |
| Write operations | 30 | per minute |
| AI operations | 10 | per minute |
| File uploads | 20 | per minute |

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705318200
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `AUTH_INVALID` | Invalid or expired token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Request validation failed |
| `RATE_LIMITED` | Too many requests |
| `AI_ERROR` | AI service error |
| `STORAGE_ERROR` | Storage operation failed |
| `INTERNAL_ERROR` | Server error |

---

## Webhooks (Phase 2)

### Jobber Job Completion

**POST /webhooks/jobber**

Receives job completion events from Jobber via Zapier.

**Request:**
```json
{
  "event": "job.completed",
  "job_id": "12345",
  "job_type": "Chimney Repair",
  "location": {
    "city": "Denver",
    "state": "CO"
  },
  "photos": [
    "https://jobber.com/attachments/..."
  ],
  "notes": "Rebuilt chimney from roofline",
  "technician": "Mike"
}
```

**Response (202):**
```json
{
  "data": {
    "queued": true,
    "draft_id": "uuid"
  }
}
```

---

## References

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
