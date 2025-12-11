# Editorial Content Directory

This directory will contain MDX files for editorial content in Phase 3 (March 2025+).

## Directory Structure

```
content/
├── services/     # National service landing pages (8 planned)
│   └── *.mdx     # e.g., chimney-repair.mdx
├── learn/        # Educational articles (8 planned)
│   └── *.mdx     # e.g., signs-chimney-needs-repair.mdx
└── guides/       # Problem-solution guides (8 planned)
    └── *.mdx     # e.g., choosing-masonry-contractor.mdx
```

## MDX Frontmatter Template

```mdx
---
title: "Article Title"
description: "SEO meta description (max 155 chars)"
publishedAt: "2025-03-01"
updatedAt: "2025-03-15"
author: "KnearMe Team"
featuredImage: "/images/content/article-slug.jpg"
category: "guide" # service | guide | article
relatedServices: ["chimney-repair", "tuckpointing"]
keywords: ["keyword1", "keyword2"]
readingTime: 8
draft: false
---

Content goes here...
```

## Implementation Notes

- MDX support will be added when the first article is written
- Install: `npm install @next/mdx @mdx-js/loader gray-matter`
- Configure: Update `next.config.ts` with MDX plugin
- See: `/docs/11-seo-discovery/page-templates/educational-content.md`

## Current Status

**Phase 2 (Current):** Using TypeScript constants for service descriptions
**Phase 3 (Future):** MDX files for editorial content
