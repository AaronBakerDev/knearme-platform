# ADR-001: Next.js 14 as Frontend Framework

> **Status:** Accepted
> **Date:** December 8, 2025
> **Deciders:** Technical Architect
> **Related:** ADR-002 (Supabase), ADR-004 (PWA)

---

## Context

We need to choose a frontend framework for KnearMe that supports:

1. **SEO-critical pages** - Project and profile pages must be indexable
2. **Rich interactivity** - AI interview flow requires complex state management
3. **PWA capabilities** - Add to home screen, offline indicators
4. **Voice/media APIs** - Browser MediaRecorder for voice input
5. **Fast development** - MVP in 4-6 weeks
6. **Image optimization** - Responsive images for Core Web Vitals

The framework must balance server-rendered SEO pages with highly interactive client features.

---

## Decision

**We will use Next.js 14 with the App Router.**

Specifically:
- **App Router** (not Pages Router) for modern React features
- **Server Components** for SEO-critical pages (projects, profiles)
- **Client Components** for interactive features (interview flow, dashboard)
- **API Routes** for backend logic in the same codebase
- **next-pwa** plugin for PWA features

---

## Consequences

### Positive

| Benefit | Details |
|---------|---------|
| **SEO performance** | Server Components render pages server-side, ensuring full indexability |
| **Hybrid rendering** | Mix SSR (SEO pages) with CSR (interactive flows) naturally |
| **Built-in optimization** | `next/image` handles WebP, srcset, lazy loading automatically |
| **API co-location** | API routes live alongside pages, faster development |
| **Strong ecosystem** | shadcn/ui, TanStack Query, next-pwa all well-supported |
| **Vercel deployment** | Zero-config deployment, edge functions, analytics |
| **TypeScript-first** | Full type safety across frontend and API |

### Negative

| Trade-off | Mitigation |
|-----------|------------|
| **Learning curve** | App Router is newer; some patterns unfamiliar |
| **Build complexity** | Server/Client component boundaries can be confusing |
| **Vercel lock-in** | Can self-host, but optimal experience on Vercel |
| **Bundle size** | React framework overhead; mitigate with dynamic imports |

### Neutral

- Requires Node.js runtime (not static-only like Astro)
- Team needs to understand RSC (React Server Components) model
- Some libraries may not yet support App Router patterns

---

## Alternatives Considered

### 1. Astro

| Aspect | Evaluation |
|--------|------------|
| **Pros** | Excellent static generation, island architecture, smaller bundles |
| **Cons** | Complex for highly interactive flows; islands add boilerplate |
| **Why not** | AI interview requires rich client state; Astro islands would fragment the UX |

### 2. Remix

| Aspect | Evaluation |
|--------|------------|
| **Pros** | Great DX, nested routes, progressive enhancement |
| **Cons** | Smaller ecosystem, fewer UI libraries |
| **Why not** | Next.js ecosystem is larger; Vercel deployment is smoother |

### 3. Vite + React (SPA)

| Aspect | Evaluation |
|--------|------------|
| **Pros** | Simple, fast builds, no SSR complexity |
| **Cons** | No SSR = poor SEO; requires separate API server |
| **Why not** | SEO is critical; project pages must be server-rendered |

### 4. Existing knearme-supabase Codebase

| Aspect | Evaluation |
|--------|------------|
| **Pros** | Already built, familiar patterns |
| **Cons** | Different architecture (Express + Vite), would need significant refactoring |
| **Why not** | Starting fresh with Next.js provides cleaner architecture for new requirements |

---

## Implementation Details

### Project Structure

```
app/
├── (auth)/              # Auth pages (client-heavy)
│   ├── login/
│   └── signup/
├── (contractor)/        # Contractor dashboard (client-heavy)
│   ├── dashboard/
│   └── projects/
│       └── new/         # AI interview flow
├── (public)/            # Public pages (server-rendered)
│   ├── [city]/
│   │   └── masonry/
│   │       └── [type]/
│   │           └── [slug]/  # Project detail
│   └── contractors/
│       └── [slug]/          # Profile page
├── api/                 # API routes
│   ├── ai/
│   ├── projects/
│   └── upload/
└── layout.tsx
```

### Rendering Strategy

| Route Pattern | Rendering | Reason |
|---------------|-----------|--------|
| `/[city]/masonry/[type]/[slug]` | SSG with ISR | SEO-critical, cacheable |
| `/contractors/[slug]` | SSG with ISR | SEO-critical, cacheable |
| `/dashboard/*` | CSR | Authenticated, dynamic |
| `/projects/new` | CSR | Highly interactive |
| `/login`, `/signup` | CSR | Auth forms, no SEO value |

### Key Packages

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "next-pwa": "^5.x",
    "@tanstack/react-query": "^5.x",
    "@supabase/supabase-js": "^2.x"
  }
}
```

---

## Validation

This decision will be validated by:

1. **SEO audit** - Pages indexable by Googlebot within 48 hours
2. **Core Web Vitals** - LCP < 2.5s on project pages
3. **Build time** - Production build < 5 minutes
4. **Developer feedback** - Team velocity during Sprint 1

---

## References

- [Next.js 14 App Router Documentation](https://nextjs.org/docs/app)
- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [next-pwa Plugin](https://github.com/shadowwalker/next-pwa)

---

*This ADR is subject to revision if significant blockers are discovered during implementation.*
