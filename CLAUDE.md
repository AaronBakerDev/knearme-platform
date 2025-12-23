# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KnearMe is an AI-powered portfolio platform for masonry contractors. Contractors upload photos, complete voice-driven interviews, and AI generates SEO-optimized project showcases. Built with Next.js 14 (App Router), Supabase, and OpenAI.

**Status:** ✅ MVP Feature Complete (December 2024)

## Essential Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing (when implemented)
npm test             # Run all tests
npm run test:unit    # Unit tests only
npm run test:e2e     # E2E tests with Playwright

# Database (Supabase)
# Migrations are in supabase/migrations/
# No local commands needed - managed via Supabase dashboard
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 14 (App Router) with React 19
- **Database**: Supabase PostgreSQL with Row Level Security
- **Auth**: Supabase Auth (email/password)
- **Storage**: Supabase Storage for images
- **AI**: OpenAI GPT-4V (vision), Whisper (transcription), GPT-4o (generation)
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Deployment**: Vercel (configured for edge)
- **Production URL**: https://knearme.co (custom domain)

### Production Infrastructure

| Service | Details |
|---------|---------|
| **Hosting** | Vercel |
| **Production URL** | https://knearme.co |
| **Preview URL** | https://knearme-portfolio.vercel.app |
| **Vercel Project** | `knearme-portfolio` |
| **DNS Provider** | Cloudflare |
| **Domain Registrar** | Key-Systems GmbH (via reseller) |
| **Domain Renewal** | December 13 annually |

**DNS Configuration (Cloudflare):**
- A record: `knearme.co` → `216.150.1.1` (Vercel IP, DNS only mode)
- CNAME: `www` → `cname.vercel-dns.com`
- SSL Mode: Full (strict)

**Troubleshooting:**
- If site shows unstyled HTML or 503 errors on static assets, check domain expiration first
- Vercel dashboard: https://vercel.com/aaronbakerdevs-projects/knearme-portfolio
- Cloudflare dashboard: https://dash.cloudflare.com (knearme.co zone)

### Route Structure

The app uses Next.js route groups to separate concerns:

```
app/
├── (auth)/              # Unauthenticated auth flows
│   ├── login/           # Login page
│   ├── signup/          # Registration page
│   └── reset-password/  # Password reset flow
│
├── (contractor)/        # Authenticated contractor dashboard
│   ├── dashboard/       # Main dashboard with stats
│   ├── profile/
│   │   ├── setup/       # First-time profile setup (3-step wizard)
│   │   └── edit/        # Edit existing profile
│   └── projects/
│       ├── page.tsx     # Projects list with filters
│       ├── new/         # 6-step AI interview wizard
│       └── [id]/edit/   # Edit existing project
│
├── (public)/            # Public SEO pages
│   └── [city]/masonry/[type]/[slug]/  # Project detail pages
│
├── api/                 # API Routes
│   ├── ai/              # AI endpoints (analyze, transcribe, generate)
│   ├── contractors/me/  # Current contractor CRUD
│   └── projects/        # Projects CRUD + images + publish
│
├── auth/
│   ├── callback/        # OAuth callback handler
│   └── signout/         # Sign out endpoint
│
├── error.tsx            # Global error boundary
├── sitemap.ts           # Dynamic sitemap generation
└── page.tsx             # Landing page
```

**Key Patterns:**
- Routes in `(auth)` and `(contractor)` use **Client Components** for interactivity
- Routes in `(public)` use **Server Components** for SEO
- API routes in `app/api/` follow RESTful patterns with standardized error handling

### Data Model

Core entities (see `docs/03-architecture/data-model.md` for full schema):

```
contractors           # Contractor profiles
  ├── auth_user_id    # FK to Supabase auth.users
  ├── business_name
  ├── city_slug       # For SEO routing
  └── services[]      # Array of service types

projects              # Project showcases
  ├── contractor_id   # FK to contractors
  ├── title           # AI-generated
  ├── description     # AI-generated (400-600 words)
  ├── project_type_slug
  ├── city_slug       # For SEO routing
  ├── status          # draft | published | archived
  └── slug            # Unique URL identifier

project_images        # Images for projects
  ├── project_id
  ├── storage_path    # Supabase Storage path
  ├── image_type      # before | after | process
  └── display_order

interview_sessions    # AI interview state
  ├── project_id
  ├── questions       # JSONB: Q&A pairs
  ├── image_analysis  # JSONB: GPT-4V results
  └── generated_content  # JSONB: Final AI output
```

**RLS (Row Level Security):**
- All tables use RLS for security
- Contractors can only manage their own data
- Published projects are publicly readable
- See migration `supabase/migrations/001_initial_schema.sql`

### Supabase Client Patterns

**CRITICAL**: Use the correct client for the context:

```typescript
// ✅ Server Components & Server Actions
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()  // Note: async

// ✅ Client Components
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()  // Note: sync

// ✅ Admin operations (bypasses RLS - use carefully!)
import { createAdminClient } from '@/lib/supabase/server'
const supabase = createAdminClient()
```

**Session Management:**
- Middleware (`middleware.ts`) refreshes auth sessions automatically
  - Uses `@supabase/ssr` for proper cookie handling
  - Auth state accessible via `supabase.auth.getUser()`

**RLS Type Handling:**
Due to Row Level Security policies, Supabase TypeScript types sometimes infer `never` for query results. The solution used throughout the codebase:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data } = await (supabase as any)
  .from('table')
  .select('*')
  .single();

const typedData = data as ExpectedType | null;
```

### Path Aliases

TypeScript paths are configured in `tsconfig.json`:

```typescript
import { Button } from '@/components/ui/button'      // src/components/ui/button.tsx
import { createClient } from '@/lib/supabase/client' // src/lib/supabase/client.ts
import type { Database } from '@/types/database'     // src/types/database.ts
import { useAuth } from '@/hooks/useAuth'            // src/hooks/useAuth.ts
```

## Key Implementation Patterns

### 1. AI Pipeline Flow (Implemented)

The 6-step project creation wizard (`/projects/new`):

1. **Image Upload** → Supabase Storage with client-side compression (ImageUploader component)
2. **Image Analysis** → OpenAI GPT-4V detects project type, materials, techniques
3. **Voice Interview** → MediaRecorder API → Whisper API (VoiceRecorder + InterviewFlow components)
4. **Content Generation** → GPT-4o generates title, description, SEO metadata
5. **Review & Edit** → Contractor reviews/edits AI-generated content
6. **Publish** → Update project status to `published`

**Key Files:**
- `/src/lib/ai/` - OpenAI integration (image-analysis.ts, transcription.ts, content-generation.ts)
- `/src/app/api/ai/` - AI API routes (analyze-images, transcribe, generate-content)
- `/src/components/interview/` - Voice recording and interview components
- `/src/components/upload/ImageUploader.tsx` - Multi-image upload with compression

**See:** `docs/03-architecture/c4-container.md` for sequence diagram

### 2. SEO-Optimized Routing (Implemented)

Public pages follow this URL structure:

```
/{city-slug}/masonry/{project-type-slug}/{unique-slug}

Examples:
/denver-co/masonry/chimney-rebuild/historic-brick-chimney-2025
/lakewood-co/masonry/tuckpointing/downtown-building-restoration
```

**Implementation:**
- Dynamic routes in `app/(public)/[city]/masonry/[type]/[slug]/page.tsx`
- ISR with `revalidate: 3600` (hourly)
- JSON-LD structured data via `/src/lib/seo/structured-data.ts`
- Dynamic sitemap at `/app/sitemap.ts`
- robots.txt at `/public/robots.txt`

### 3. Form Handling

Use `react-hook-form` + `zod` for validation (already configured):

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

const form = useForm({
  resolver: zodResolver(schema)
})
```

### 4. Component Library

Use shadcn/ui components (installed in `src/components/ui/`):
- Pre-configured with Tailwind
- TypeScript definitions included
- Accessible by default
- Customize via `components.json`

## Environment Variables

Required in `.env.local` (see `.env.example`):

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only, bypasses RLS

# AI Provider (required for AI features)
OPENAI_API_KEY=sk-...

# App Config
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Critical Architecture Decisions

See `docs/05-decisions/adr/` for full rationale:

1. **ADR-001**: Next.js 14 App Router (SSR for SEO + client interactivity)
2. **ADR-002**: Supabase (PostgreSQL + Auth + Storage in one platform)
3. **ADR-003**: OpenAI (GPT-4V for vision, Whisper for voice, GPT-4o for generation)
4. **ADR-004**: PWA capabilities (offline-first for contractors in the field)

## Development Phases

**Status:** ✅ MVP FEATURE COMPLETE

**MVP (Phase 1) - Completed:**
- ✅ Next.js + Supabase setup
- ✅ Authentication (login, signup, password reset, email verification)
- ✅ Contractor profile setup (3-step wizard) and edit page
- ✅ Photo upload to Supabase Storage with compression
- ✅ AI interview flow (GPT-4V analysis, Whisper transcription, GPT-4o generation)
- ✅ 6-step project creation wizard
- ✅ Projects list with filters and CRUD operations
- ✅ Project edit page (content, images, SEO tabs)
- ✅ Public portfolio pages with SEO
- ✅ Dynamic sitemap and structured data
- ✅ Error boundaries and loading states

**Phase 2 (Future):**
- Homeowner discovery (browse projects by location/type)
- Contractor public profile pages
- Jobber integration (webhook-based project creation)
- Advanced analytics dashboard
- E2E and unit tests

## Important Notes

### Security
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code
- Always use RLS policies; avoid `createAdminClient()` unless necessary
- Validate all user inputs with Zod schemas
- Sanitize AI-generated content before displaying

### Performance
- Use `next/image` for all images (automatic optimization)
- Lazy load heavy components with `dynamic()` from `next/dynamic`
- Implement suspense boundaries for async Server Components
- Monitor Core Web Vitals (target: LCP < 2.5s)

### AI Integration
- Set reasonable timeouts (30s for GPT-4V, 60s for generation)
- Handle rate limits gracefully (OpenAI: 500 RPM on paid tier)
- Store raw transcripts and AI responses in `interview_sessions` table
- Allow contractors to edit AI-generated content before publishing

## Common Tasks

### Adding a New API Route

```typescript
// app/api/example/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getContractorFromRequest } from '@/lib/api/auth'
import { ApiError, handleApiError } from '@/lib/api/errors'
import type { Project } from '@/types/database'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated contractor (throws ApiError if not found)
    const contractor = await getContractorFromRequest(supabase)

    // Query with RLS type handling pattern
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('projects')
      .select('*')
      .eq('contractor_id', contractor.id)

    if (error) throw error

    const projects = (data || []) as Project[]
    return NextResponse.json({ projects })
  } catch (error) {
    return handleApiError(error)  // Standardized error responses
  }
}
```

**Key utilities:**
- `getContractorFromRequest()` - Auth helper in `/src/lib/api/auth.ts`
- `handleApiError()` - Error handler in `/src/lib/api/errors.ts`

### Adding Database Migrations

Create SQL files in `supabase/migrations/`:

```sql
-- supabase/migrations/002_add_ratings.sql
ALTER TABLE projects ADD COLUMN rating INTEGER CHECK (rating BETWEEN 1 AND 5);
CREATE INDEX idx_projects_rating ON projects(rating) WHERE status = 'published';
```

Apply via Supabase dashboard or CLI (no local commands needed for MVP).

### Adding a New UI Component

```bash
# Use shadcn CLI to add components
npx shadcn@latest add [component-name]

# Example: Add a tooltip
npx shadcn@latest add tooltip
# → Creates src/components/ui/tooltip.tsx
```

## Documentation References

- **Vision & Requirements**: `docs/01-vision/` and `docs/02-requirements/`
- **Architecture Diagrams**: `docs/03-architecture/` (C4 model, data model)
- **API Design**: `docs/04-apis/api-design.md`
- **ADRs**: `docs/05-decisions/adr/`
- **Security**: `docs/06-security/threat-model.md`
- **Testing**: `docs/08-quality/testing-strategy.md`
- **Sprint Plans**: `todo/sprint-*.md`

## Getting Help

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- shadcn/ui: https://ui.shadcn.com
