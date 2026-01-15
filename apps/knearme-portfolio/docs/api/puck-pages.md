# Puck Pages API Documentation

> **For AI Agents**: This document provides complete specifications for programmatically managing visual pages in the KnearMe portfolio platform using the Puck visual editor API.

## Overview

The Puck Pages API enables external systems and AI agents to create, read, update, and list visual pages built with the Puck editor. Pages are stored in Payload CMS and rendered on the public frontend.

**Base URL**: `https://knearme.co` (or `http://localhost:3000` for development)

## Authentication

All write operations require Payload CMS authentication. Include session cookies from a logged-in Payload admin user.

```bash
# Authentication is cookie-based via Payload CMS session
# Obtain a session by logging into /admin first
```

## Endpoints

### GET /api/puck

List all Puck pages with optional filtering and pagination.

**Authentication**: Required

**Query Parameters**:
- `status` (optional): Filter by status ("draft" or "published")
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Results per page (default: 10, max: 100)

**Response** (200 OK):
```json
{
  "docs": [
    {
      "id": "6789abc123",
      "slug": "about",
      "title": "About Us",
      "status": "published",
      "createdAt": "2026-01-14T12:00:00.000Z",
      "updatedAt": "2026-01-14T18:30:00.000Z"
    },
    {
      "id": "6789abc456",
      "slug": "pricing",
      "title": "Pricing",
      "status": "draft",
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T17:00:00.000Z"
    }
  ],
  "totalDocs": 25,
  "page": 1,
  "totalPages": 3,
  "limit": 10,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

**Note**: The `puckData` field is excluded from list responses for efficiency. Use `GET /api/puck/[slug]` to retrieve full page data.

**Error Responses**:
- `401`: Authentication required
- `500`: Server error

**curl Example**:
```bash
# List all pages
curl "https://knearme.co/api/puck" \
  -H "Cookie: payload-token=YOUR_SESSION_TOKEN"

# Filter by published status with pagination
curl "https://knearme.co/api/puck?status=published&page=2&limit=20" \
  -H "Cookie: payload-token=YOUR_SESSION_TOKEN"
```

---

### GET /api/puck/[slug]

Retrieve page data by slug for editing.

**Authentication**: Required

**Parameters**:
- `slug` (path): The unique page identifier (e.g., `about`, `pricing`)

**Response** (200 OK):
```json
{
  "id": "6789abc123",
  "slug": "about",
  "title": "About Us",
  "puckData": {
    "root": { "props": {} },
    "content": [...],
    "zones": {}
  },
  "status": "published",
  "updatedAt": "2026-01-14T18:30:00.000Z"
}
```

**Error Responses**:
- `400`: Slug is required
- `401`: Authentication required
- `404`: Page not found
- `500`: Server error

**curl Example**:
```bash
curl -X GET "https://knearme.co/api/puck/about" \
  -H "Cookie: payload-token=YOUR_SESSION_TOKEN"
```

---

### POST /api/puck/[slug]

Create or update a page. If the slug exists, updates it; otherwise, creates a new page.

**Authentication**: Required

**Parameters**:
- `slug` (path): The unique page identifier

**Request Body**:
```json
{
  "title": "About Us",
  "status": "draft",
  "puckData": {
    "root": { "props": {} },
    "content": [
      {
        "type": "Hero",
        "props": {
          "id": "hero-1705267800000-abc123",
          "heading": "Welcome to Our Company",
          "subheading": "Building great things together",
          "alignment": "center",
          "backgroundImage": null,
          "ctaButtons": [
            { "text": "Get Started", "href": "/contact", "variant": "primary" }
          ]
        }
      }
    ],
    "zones": {}
  }
}
```

**Response** (200 OK - Updated):
```json
{
  "success": true,
  "message": "Page updated successfully",
  "id": "6789abc123",
  "slug": "about",
  "status": "draft"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Page created successfully",
  "id": "6789abc456",
  "slug": "about",
  "status": "draft"
}
```

**Error Responses**:
- `400`: Validation failed (with details)
- `401`: Authentication required
- `500`: Server error

**curl Example**:
```bash
curl -X POST "https://knearme.co/api/puck/about" \
  -H "Content-Type: application/json" \
  -H "Cookie: payload-token=YOUR_SESSION_TOKEN" \
  -d '{
    "title": "About Us",
    "status": "draft",
    "puckData": {
      "root": { "props": {} },
      "content": [
        {
          "type": "Heading",
          "props": {
            "id": "heading-1",
            "text": "About Our Company",
            "level": "h1",
            "alignment": "center",
            "color": ""
          }
        }
      ],
      "zones": {}
    }
  }'
```

---

### DELETE /api/puck/[slug]

Delete a page by slug. Triggers ISR revalidation to ensure the public URL returns 404 immediately.

**Authentication**: Required

**Parameters**:
- `slug` (path): The unique page identifier

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Page deleted successfully",
  "slug": "about"
}
```

**Error Responses**:
- `400`: Slug is required
- `401`: Authentication required
- `404`: Page not found
- `500`: Server error

**curl Example**:
```bash
# Delete a page
curl -X DELETE "https://knearme.co/api/puck/about" \
  -H "Cookie: payload-token=YOUR_SESSION_TOKEN"

# Response
{
  "success": true,
  "message": "Page deleted successfully",
  "slug": "about"
}
```

**Side Effects**:
- Triggers ISR revalidation for `/p/[slug]` (the public URL)
- Triggers sitemap revalidation (`/sitemap-main.xml`)
- The public page URL will return 404 after deletion

---

### GET /api/puck/media

Retrieve media items from Payload for use in visual pages.

**Authentication**: Not required (public read)

**Query Parameters**:
- `query` (optional): Search term for alt text, filename, or caption
- `folder` (optional): Filter by folder name
- `limit` (optional): Max results (default: 50, max: 100)

**Response** (200 OK):
```json
[
  {
    "id": "media-123",
    "title": "Hero Background",
    "description": "1920x1080 - 245.3 KB",
    "url": "https://knearme.co/api/media/file/hero-bg.jpg",
    "alt": "Hero Background",
    "width": 1920,
    "height": 1080,
    "thumbnailUrl": "https://knearme.co/api/media/file/hero-bg-thumbnail.jpg"
  }
]
```

**curl Example**:
```bash
# List all images
curl "https://knearme.co/api/puck/media"

# Search for specific images
curl "https://knearme.co/api/puck/media?query=hero&limit=10"
```

---

## Puck Data Schema

The `puckData` field follows the Puck editor's data format. Below is the complete schema for AI agents.

### Root Structure

```typescript
interface PuckPageData {
  /** Root-level page configuration */
  root: {
    props?: {
      title?: string;
      [key: string]: unknown;
    };
  };
  /** Array of content blocks on the page */
  content: PuckComponentData[];
  /** Named zones for nested content (used by Section, Columns blocks) */
  zones?: Record<string, PuckComponentData[]>;
}
```

### Component Data Structure

Each block in `content` or `zones` follows this structure:

```typescript
interface PuckComponentData {
  type: PuckBlockType;  // Block type name
  props: {
    id: string;         // Unique ID (required)
    // ... block-specific props
  };
}
```

### Block ID Generation

Each block requires a unique `id` prop. Generate IDs using this pattern:

```typescript
const id = `${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
// Example: "hero-1705267800000-abc123"
```

---

## Available Block Types

### Layout Blocks

#### Section
Container wrapper with spacing and background.

```json
{
  "type": "Section",
  "props": {
    "id": "section-1",
    "backgroundColor": "#ffffff",
    "paddingTop": "md",
    "paddingBottom": "md",
    "maxWidth": "lg"
  }
}
```

| Prop | Type | Options | Default |
|------|------|---------|---------|
| backgroundColor | string | Any CSS color | "transparent" |
| paddingTop | enum | "none", "sm", "md", "lg", "xl" | "md" |
| paddingBottom | enum | "none", "sm", "md", "lg", "xl" | "md" |
| maxWidth | enum | "sm", "md", "lg", "xl", "full" | "lg" |

**Note**: Section blocks can contain nested content via zones. Add child blocks to `zones["Section-{id}:content"]`.

#### Columns
Multi-column responsive grid.

```json
{
  "type": "Columns",
  "props": {
    "id": "columns-1",
    "layout": "50-50",
    "gap": "md",
    "verticalAlign": "top"
  }
}
```

| Prop | Type | Options | Default |
|------|------|---------|---------|
| layout | enum | "50-50", "33-33-33", "25-75", "75-25", "33-66", "66-33" | "50-50" |
| gap | enum | "none", "sm", "md", "lg" | "md" |
| verticalAlign | enum | "top", "center", "bottom" | "top" |

**Note**: Column content goes in zones `Columns-{id}:column-0`, `Columns-{id}:column-1`, etc.

#### Spacer
Vertical spacing utility.

```json
{
  "type": "Spacer",
  "props": {
    "id": "spacer-1",
    "size": "md",
    "customSize": 32
  }
}
```

| Prop | Type | Options | Default |
|------|------|---------|---------|
| size | enum | "sm", "md", "lg", "xl", "custom" | "md" |
| customSize | number | 0+ (pixels, only used when size="custom") | 32 |

---

### Content Blocks

#### Hero
Page header with background, heading, and CTAs.

```json
{
  "type": "Hero",
  "props": {
    "id": "hero-1",
    "heading": "Welcome to Our Site",
    "subheading": "We build amazing things",
    "alignment": "center",
    "backgroundImage": null,
    "ctaButtons": [
      { "text": "Get Started", "href": "/signup", "variant": "primary" },
      { "text": "Learn More", "href": "/about", "variant": "outline" }
    ]
  }
}
```

| Prop | Type | Description |
|------|------|-------------|
| heading | string | Main heading text |
| subheading | string | Supporting text |
| alignment | enum | "left", "center", "right" |
| backgroundImage | MediaRef \| null | Background image from Payload Media |
| ctaButtons | CTAButton[] | Array of call-to-action buttons |

**CTAButton Structure**:
```json
{ "text": "Button Text", "href": "/path", "variant": "primary" }
```
Variants: "primary", "secondary", "outline"

#### RichText
WYSIWYG formatted content (HTML).

```json
{
  "type": "RichText",
  "props": {
    "id": "richtext-1",
    "content": "<h2>Our Story</h2><p>Founded in 2020, we have grown...</p>"
  }
}
```

| Prop | Type | Description |
|------|------|-------------|
| content | string | HTML content |

#### Heading
Semantic heading (H1-H6).

```json
{
  "type": "Heading",
  "props": {
    "id": "heading-1",
    "text": "About Us",
    "level": "h2",
    "alignment": "left",
    "color": ""
  }
}
```

| Prop | Type | Options |
|------|------|---------|
| text | string | Heading text |
| level | enum | "h1", "h2", "h3", "h4", "h5", "h6" |
| alignment | enum | "left", "center", "right" |
| color | string | CSS color (empty = theme default) |

#### Image
Single image with caption.

```json
{
  "type": "Image",
  "props": {
    "id": "image-1",
    "image": {
      "id": "media-123",
      "url": "/api/media/file/photo.jpg",
      "alt": "Team photo",
      "width": 800,
      "height": 600
    },
    "alt": "Our team at the office",
    "caption": "The team celebrating our launch",
    "size": "large",
    "alignment": "center"
  }
}
```

| Prop | Type | Options |
|------|------|---------|
| image | MediaRef \| null | Image from Payload Media |
| alt | string | Alt text override |
| caption | string | Image caption |
| size | enum | "small", "medium", "large", "full" |
| alignment | enum | "left", "center", "right" |

#### Video
YouTube/Vimeo embedded video.

```json
{
  "type": "Video",
  "props": {
    "id": "video-1",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "aspectRatio": "16:9",
    "autoplay": false,
    "caption": "Product demo video"
  }
}
```

| Prop | Type | Options |
|------|------|---------|
| url | string | YouTube or Vimeo URL |
| aspectRatio | enum | "16:9", "4:3", "1:1" |
| autoplay | boolean | Auto-play on load |
| caption | string | Video caption |

---

### Marketing Blocks

#### FeaturesGrid
Feature cards with icons.

```json
{
  "type": "FeaturesGrid",
  "props": {
    "id": "features-1",
    "columns": 3,
    "iconStyle": "filled",
    "items": [
      { "icon": "Zap", "title": "Fast", "description": "Lightning fast performance" },
      { "icon": "Shield", "title": "Secure", "description": "Enterprise-grade security" },
      { "icon": "Heart", "title": "Reliable", "description": "99.9% uptime guarantee" }
    ]
  }
}
```

**Available Icons**: Zap, Target, Award, Users, TrendingUp, Clock, Shield, Heart, Star, Rocket, Sparkles, Globe, Lock, Eye, Layers, Cpu, Database, Cloud, Code, Terminal, Box, Package, Puzzle, Settings, Tool, Wrench, Hammer, Lightbulb, MessageSquare, Mail, Phone, MapPin, Calendar, CheckCircle, XCircle

#### Testimonials
Customer quotes display.

```json
{
  "type": "Testimonials",
  "props": {
    "id": "testimonials-1",
    "layout": "grid",
    "showAvatar": true,
    "items": [
      {
        "quote": "This product changed our business completely.",
        "author": "Jane Smith",
        "title": "CEO, TechCorp",
        "avatar": null
      }
    ]
  }
}
```

| Prop | Type | Options |
|------|------|---------|
| layout | enum | "carousel", "grid" |
| showAvatar | boolean | Show author avatars |
| items | array | Testimonial items |

#### PricingTable
Pricing tier comparison.

```json
{
  "type": "PricingTable",
  "props": {
    "id": "pricing-1",
    "showToggle": false,
    "highlightTier": 1,
    "tiers": [
      {
        "name": "Starter",
        "price": 9,
        "period": "monthly",
        "features": "5 projects\n10GB storage\nEmail support",
        "ctaText": "Get Started",
        "ctaLink": "/signup?plan=starter",
        "isHighlighted": false
      },
      {
        "name": "Pro",
        "price": 29,
        "period": "monthly",
        "features": "Unlimited projects\n100GB storage\nPriority support\nAdvanced analytics",
        "ctaText": "Go Pro",
        "ctaLink": "/signup?plan=pro",
        "isHighlighted": true
      }
    ]
  }
}
```

**Note**: Features are newline-separated text.

#### CTABanner
Call-to-action banner section.

```json
{
  "type": "CTABanner",
  "props": {
    "id": "cta-1",
    "heading": "Ready to get started?",
    "description": "Join thousands of happy customers today.",
    "backgroundColor": "#0070f3",
    "style": "centered",
    "buttons": [
      { "text": "Start Free Trial", "href": "/signup", "variant": "primary" },
      { "text": "Contact Sales", "href": "/contact", "variant": "outline" }
    ]
  }
}
```

#### FAQAccordion
Expandable Q&A section.

```json
{
  "type": "FAQAccordion",
  "props": {
    "id": "faq-1",
    "allowMultiple": false,
    "defaultOpen": 0,
    "items": [
      {
        "question": "How does billing work?",
        "answer": "We bill monthly or annually based on your plan selection."
      },
      {
        "question": "Can I cancel anytime?",
        "answer": "Yes, you can cancel your subscription at any time."
      }
    ]
  }
}
```

#### Stats
Key metrics display.

```json
{
  "type": "Stats",
  "props": {
    "id": "stats-1",
    "columns": 4,
    "style": "card",
    "items": [
      { "number": "10", "label": "Years Experience", "prefix": "", "suffix": "+" },
      { "number": "500", "label": "Happy Clients", "prefix": "", "suffix": "+" },
      { "number": "99.9", "label": "Uptime", "prefix": "", "suffix": "%" },
      { "number": "24", "label": "Support", "prefix": "", "suffix": "/7" }
    ]
  }
}
```

| Prop | Type | Options |
|------|------|---------|
| columns | enum | 2, 3, 4 |
| style | enum | "default", "card", "minimal", "glass", "gradient" |

---

### Blog Blocks

#### CodeBlock
Syntax-highlighted code.

```json
{
  "type": "CodeBlock",
  "props": {
    "id": "code-1",
    "language": "typescript",
    "showLineNumbers": true,
    "filename": "example.ts",
    "code": "const greeting = 'Hello, World!';\nconsole.log(greeting);"
  }
}
```

| Prop | Type | Options |
|------|------|---------|
| language | enum | "javascript", "typescript", "python", "bash", "json", "html", "css", "sql" |
| showLineNumbers | boolean | Show line numbers |
| filename | string | Optional filename header |
| code | string | Code content |

#### Callout
Info/warning/tip boxes.

```json
{
  "type": "Callout",
  "props": {
    "id": "callout-1",
    "type": "info",
    "title": "Note",
    "content": "This is important information for users."
  }
}
```

| Prop | Type | Options |
|------|------|---------|
| type | enum | "info", "warning", "success", "error", "tip" |
| title | string | Callout title |
| content | string | Callout body text |

#### Table
Data table with headers.

```json
{
  "type": "Table",
  "props": {
    "id": "table-1",
    "striped": true,
    "bordered": true,
    "headers": [
      { "value": "Feature" },
      { "value": "Basic" },
      { "value": "Pro" }
    ],
    "rows": [
      { "cells": "Storage\n10GB\n100GB" },
      { "cells": "Support\nEmail\nPriority" }
    ]
  }
}
```

**Note**: Each row's `cells` are newline-separated values matching header count.

#### ImageGallery
Multi-image grid with lightbox.

```json
{
  "type": "ImageGallery",
  "props": {
    "id": "gallery-1",
    "columns": 3,
    "lightbox": true,
    "images": [
      {
        "id": "media-1",
        "url": "/api/media/file/image1.jpg",
        "alt": "Gallery image 1",
        "width": 800,
        "height": 600
      }
    ]
  }
}
```

---

## Media Reference Structure

When referencing Payload Media items:

```typescript
interface MediaRef {
  id: string;       // Payload Media document ID
  url: string;      // Full URL to the media file
  alt: string;      // Alt text
  width?: number;   // Image width in pixels
  height?: number;  // Image height in pixels
}
```

Use `GET /api/puck/media` to search and retrieve available media items.

---

## Validation

All `puckData` is validated using Zod schemas before saving. Import schemas from `src/types/puck.ts`:

```typescript
import {
  puckPageDataSchema,
  validatePuckPageData,
  safeParsePuckPageData,
  validateBlockProps,
  isValidBlockType,
  isPuckPageData
} from '@/types/puck';

// Validate complete page data
const result = safeParsePuckPageData(data);
if (!result.success) {
  console.error(result.error.flatten());
}

// Validate single block props
const blockResult = validateBlockProps('Hero', heroProps);
```

---

## Complete Example: Creating a Landing Page

```bash
curl -X POST "https://knearme.co/api/puck/landing" \
  -H "Content-Type: application/json" \
  -H "Cookie: payload-token=YOUR_SESSION_TOKEN" \
  -d '{
    "title": "Product Landing Page",
    "status": "draft",
    "puckData": {
      "root": { "props": {} },
      "content": [
        {
          "type": "Hero",
          "props": {
            "id": "hero-1705267800000-xyz789",
            "heading": "Build Better Products",
            "subheading": "The all-in-one platform for modern teams",
            "alignment": "center",
            "backgroundImage": null,
            "ctaButtons": [
              { "text": "Start Free Trial", "href": "/signup", "variant": "primary" },
              { "text": "Watch Demo", "href": "/demo", "variant": "outline" }
            ]
          }
        },
        {
          "type": "FeaturesGrid",
          "props": {
            "id": "features-1705267800001-abc123",
            "columns": 3,
            "iconStyle": "filled",
            "items": [
              { "icon": "Zap", "title": "Lightning Fast", "description": "Optimized for speed" },
              { "icon": "Shield", "title": "Secure", "description": "Enterprise security" },
              { "icon": "Users", "title": "Collaborative", "description": "Built for teams" }
            ]
          }
        },
        {
          "type": "CTABanner",
          "props": {
            "id": "cta-1705267800002-def456",
            "heading": "Ready to get started?",
            "description": "Join 10,000+ teams already using our platform.",
            "backgroundColor": "#0070f3",
            "style": "centered",
            "buttons": [
              { "text": "Start Free Trial", "href": "/signup", "variant": "primary" }
            ]
          }
        }
      ],
      "zones": {}
    }
  }'
```

---

## Public Page Rendering

Published pages are accessible at:
- **URL Pattern**: `/p/{slug}`
- **Example**: `https://knearme.co/p/about`

Pages with `status: "draft"` are not publicly accessible.

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": {
    // Optional: Validation error details
  }
}
```

**HTTP Status Codes**:
- `200`: Success
- `201`: Created
- `400`: Bad request / Validation error
- `401`: Authentication required
- `404`: Not found
- `500`: Server error

---

## TypeScript Integration

For TypeScript projects, import types directly:

```typescript
import type {
  PuckPageData,
  PuckComponentData,
  PuckBlockType,
  BlockPropsMap,
  // Individual block props
  HeroBlockProps,
  FeaturesGridBlockProps,
  // ... etc
} from '@/types/puck';

// Helper functions
import {
  createComponent,
  createEmptyPuckPageData,
  defaultBlockProps,
} from '@/types/puck';

// Create a new Hero block with defaults
const hero = createComponent('Hero', {
  heading: 'My Custom Heading',
});

// Create empty page structure
const pageData = createEmptyPuckPageData();
pageData.content.push(hero);
```

---

## Related Resources

- **Puck Editor Documentation**: https://puckeditor.com/docs
- **Payload CMS Documentation**: https://payloadcms.com/docs
- **Type Definitions**: `src/types/puck.ts`
- **Block Configuration**: `src/lib/puck/config.tsx`
