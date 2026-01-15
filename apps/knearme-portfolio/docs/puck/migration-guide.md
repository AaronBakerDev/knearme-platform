# Puck Pages: Clean URL Migration Guide

This guide explains how to migrate Puck visual editor pages from the default `/p/[slug]` route to clean URLs like `/about`, `/services`, etc.

## Current Architecture

### Why /p/[slug] Exists

Puck pages are currently served at `/p/[slug]` to avoid route conflicts with existing marketing pages. This prefix-based approach:

1. **Prevents conflicts** - Pages like `/about` might already exist as static Next.js routes
2. **Isolates Puck content** - Clear separation between code-based and CMS-managed pages
3. **Enables gradual migration** - Start with /p/, then migrate individual pages as needed

### Route Structure

```
Current:
├── /p/about           → Puck page (managed in visual editor)
├── /p/landing         → Puck page
├── /about             → Static Next.js page (code-based)

After Migration:
├── /about             → Puck page at clean URL (recommended)
├── /landing           → Puck page at clean URL
```

## Migration Strategy

### Step 1: Create the Puck Page Content

Before migrating, ensure the page content exists in the Puck editor:

1. Navigate to `/admin/puck-pages`
2. Create a new page with the desired slug (e.g., `about`)
3. Build the page using the visual editor
4. Publish the page

### Step 2: Create a Thin Wrapper Page

Create a new Next.js page file that delegates to the Puck render utility:

```tsx
// app/(marketing)/about/page.tsx
import { renderPuckPage, generatePuckMetadata } from '@/lib/puck/render'
import type { Metadata } from 'next'

// ISR configuration (matches /p/[slug] behavior)
export const revalidate = 3600

// Generate SEO metadata from Puck page
export async function generateMetadata(): Promise<Metadata> {
  return generatePuckMetadata('about', 'https://knearme.co/about')
}

// Render the Puck page content
export default async function AboutPage() {
  return renderPuckPage('about', {
    canonicalUrl: 'https://knearme.co/about'
  })
}
```

### Step 3: Set Up Redirects (Optional)

If the old /p/[slug] URL was publicly shared, add a redirect:

```ts
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/p/about',
        destination: '/about',
        permanent: true, // 301 redirect for SEO
      },
      // Add more redirects as needed
    ]
  },
}
```

### Step 4: Update Internal Links

Search for and update any internal links to the old URL:

```bash
# Find references to the old URL
grep -r "/p/about" src/
```

## Code Examples

### Basic Page Migration

Minimal wrapper for a simple page:

```tsx
// app/(marketing)/pricing/page.tsx
import { renderPuckPage, generatePuckMetadata } from '@/lib/puck/render'
import type { Metadata } from 'next'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return generatePuckMetadata('pricing', 'https://knearme.co/pricing')
}

export default async function PricingPage() {
  return renderPuckPage('pricing', {
    canonicalUrl: 'https://knearme.co/pricing'
  })
}
```

### Dynamic Route Migration

For dynamic routes like `/services/[type]`:

```tsx
// app/(marketing)/services/[type]/page.tsx
import { renderPuckPage, generatePuckMetadata, puckPageExists } from '@/lib/puck/render'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ type: string }>
}

export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params
  const slug = `services-${type}` // e.g., "services-pricing"
  return generatePuckMetadata(slug, `https://knearme.co/services/${type}`)
}

export default async function ServicePage({ params }: Props) {
  const { type } = await params
  const slug = `services-${type}`

  // Check if Puck page exists
  const exists = await puckPageExists(slug)
  if (!exists) {
    notFound()
  }

  return renderPuckPage(slug, {
    canonicalUrl: `https://knearme.co/services/${type}`
  })
}
```

### Hybrid Page (Puck + Code Components)

For pages that combine Puck content with custom components:

```tsx
// app/(marketing)/contact/page.tsx
import { renderPuckPage, generatePuckMetadata, getPuckPage } from '@/lib/puck/render'
import { ContactForm } from '@/components/contact/ContactForm'
import type { Metadata } from 'next'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return generatePuckMetadata('contact', 'https://knearme.co/contact')
}

export default async function ContactPage() {
  const page = await getPuckPage('contact')

  return (
    <>
      {/* Render Puck content (hero, intro text, etc.) */}
      {page && await renderPuckPage('contact', {
        canonicalUrl: 'https://knearme.co/contact'
      })}

      {/* Add code-based components below Puck content */}
      <section className="py-16">
        <div className="container mx-auto">
          <ContactForm />
        </div>
      </section>
    </>
  )
}
```

## Pages Eligible for Migration

### Currently Using /p/ Prefix

Any page created in the Puck editor is automatically available at `/p/[slug]`. These can be migrated to clean URLs:

| Current URL | Clean URL | Wrapper Page Path |
|-------------|-----------|-------------------|
| `/p/about` | `/about` | `app/(marketing)/about/page.tsx` |
| `/p/landing` | `/landing` | `app/(marketing)/landing/page.tsx` |
| `/p/pricing` | `/pricing` | `app/(marketing)/pricing/page.tsx` |
| `/p/features` | `/features` | `app/(marketing)/features/page.tsx` |

### Existing Static Pages

The following marketing pages currently exist as static Next.js routes. They can be migrated to Puck by:

1. Creating the Puck page with matching content
2. Replacing the static page with a thin wrapper
3. Optionally keeping the static page as a fallback

| Route | Current Implementation | Migration Candidate |
|-------|----------------------|---------------------|
| `/about` | Static page | Yes - good for visual editing |
| `/contact` | Static + form | Hybrid - Puck for hero, code for form |
| `/services` | Dynamic static | Yes - standardize service pages |
| `/examples` | Static gallery | Yes - visual showcase |

### Not Recommended for Migration

Some pages should remain as code-based implementations:

- **Blog** (`/blog/*`) - Complex with MDX, categories, search
- **Tools** (`/tools/*`) - Interactive calculators with state
- **Dashboard** (`/dashboard`) - Protected, heavy interactivity
- **API routes** - Not applicable

## Utility Functions Reference

The `@/lib/puck/render` module exports these helpers:

### `renderPuckPage(slug, options?)`

Fetches and renders a published Puck page.

```typescript
interface RenderPuckPageOptions {
  canonicalUrl?: string // Custom URL for structured data
}
```

### `generatePuckMetadata(slug, canonicalUrl?)`

Generates Next.js Metadata from Puck page SEO fields.

### `getPuckPage(slug)`

Fetches the raw Puck page document (useful for conditional rendering).

### `puckPageExists(slug)`

Checks if a published Puck page exists (useful for fallbacks).

## Checklist

Before migrating a page:

- [ ] Puck page exists and is published
- [ ] Clean URL doesn't conflict with existing routes
- [ ] Wrapper page created with correct slug
- [ ] `canonicalUrl` set to the clean URL
- [ ] Redirect from old /p/ URL added (if shared)
- [ ] Internal links updated
- [ ] Tested in local development
- [ ] Deployed and verified in production

## Troubleshooting

### Page Shows 404

1. Verify the Puck page is **published** (not draft)
2. Check the slug matches exactly (case-sensitive)
3. Ensure no typo in the `renderPuckPage()` call

### SEO Metadata Not Showing

1. Check SEO fields are filled in the Puck admin
2. Verify `generateMetadata` is exported and async
3. Clear Next.js cache: `rm -rf .next`

### Old URL Still Works

1. Add permanent redirect in `next.config.js`
2. Wait for CDN cache to expire
3. Submit URL removal in Google Search Console

## Related Documentation

- [Puck Pages API Reference](../api/puck-pages.md)
- [PUCK-039: Render Utility Implementation](../../.claude/ralph/prds/current.json)
- [Puck Editor Documentation](https://puckeditor.com/docs)
