# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🚀 Vision & Direction (Read First)

> **We are evolving from a masonry-specific tool to a universal portfolio platform powered by agentic AI.**

### The North Star

Any business that does work worth showing can benefit from a portfolio. The AI agents should discover what that means for each business, not assume it.

**Core Principles:**
- **Conversation is the interface** - Forms are fallbacks, not defaults
- **Agents get personas and tools** - Not prescribed workflows
- **Structure emerges from content** - Not forced into templates
- **Trust the AI** - It knows how to interview, extract, and generate

### Philosophy Documentation

**Read these to understand where we're going:**

| Document | Purpose |
|----------|---------|
| [`docs/philosophy/agent-philosophy.md`](docs/philosophy/agent-philosophy.md) | Core beliefs about agentic design |
| [`docs/philosophy/over-engineering-audit.md`](docs/philosophy/over-engineering-audit.md) | 25+ specific issues to fix (with line numbers) |
| [`docs/philosophy/universal-portfolio-agents.md`](docs/philosophy/universal-portfolio-agents.md) | Agent personas, handoffs, any-business vision |
| [`docs/philosophy/agentic-first-experience.md`](docs/philosophy/agentic-first-experience.md) | Complete UX journey, data model, and tools |
| [`docs/philosophy/implementation-roadmap.md`](docs/philosophy/implementation-roadmap.md) | **Concrete phases and MVP definition** |
| [`docs/philosophy/operational-excellence.md`](docs/philosophy/operational-excellence.md) | Testing, observability, resilience strategies |

### Current State vs Vision

| Aspect | Current (Legacy) | Vision (Target) |
|--------|------------------|-----------------|
| **Business type** | Masonry contractors only | Any business with work to show |
| **Onboarding** | 3-step form wizard | Conversation with Discovery Agent |
| **Project creation** | 6-step wizard | Natural dialogue with Story Agent |
| **Data model** | Fixed columns (materials, techniques) | JSONB, structure emerges |
| **Agent workflow** | Rigid phases, magic numbers | Agent-initiated handoffs |
| **Business discovery** | Manual form entry | DataForSEO lookup → 1 confirmation |

### Development Guidelines

**For new features:**
- Follow the agentic philosophy, not the legacy patterns
- Prefer conversation over forms
- Let agents decide workflow, don't prescribe
- Use JSONB for flexible data structures
- Reference philosophy docs for guidance

**For existing code:**
- The architecture below describes what EXISTS, not what we're building toward
- See `over-engineering-audit.md` for specific issues to address
- Don't add more masonry-specific code

---

## Project Overview

KnearMe is an AI-powered portfolio platform. Currently serving masonry contractors (MVP), evolving to support any business with work worth showing.

Built with Next.js 14 (App Router), Supabase, and Google Gemini.

**Status:** ✅ MVP Feature Complete (December 2024) | 🔄 Evolving to Agentic Architecture

## Brand Voice & Messaging

### Core Value Proposition
> "Turn your finished work into your best salesperson."

KnearMe helps contractors document and share their work so they win more jobs. The AI is invisible infrastructure—the contractor's craftsmanship is the star.

### Messaging Principles
1. **Outcome over feature**: "Win more jobs" not "Save time"
2. **Work over AI**: Never lead with AI or automation
3. **Trust over speed**: Address the trust gap, not just convenience
4. **Specific over generic**: We serve masonry contractors (for now)
5. **Referral amplifier**: We extend word-of-mouth, not replace it

### Language Guide
| Say | Don't Say |
|-----|-----------|
| Your work, your projects | AI-generated content |
| Proof that wins jobs | Case studies |
| When homeowners Google you | SEO optimization |
| Document your work | Build a portfolio |
| Share with potential customers | Publish to your portfolio |

### The Trust Gap (Core Insight)
92% of homeowners trust referrals. When they can't get one, they Google. The contractor with visible proof of quality work gets the call. KnearMe makes every job visible, shareable proof.

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
- **AI**: Google Gemini 3.0 Flash (vision, generation, chat) + OpenAI Whisper (transcription)
  - Provider abstraction via Vercel AI SDK (`@ai-sdk/google`, `@ai-sdk/openai`)
  - See `src/lib/ai/providers.ts` for model configuration
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
├── (dashboard)/         # Authenticated business dashboard (renamed from contractor in 11.9)
│   ├── dashboard/       # Main dashboard with stats
│   ├── profile/
│   │   ├── setup/       # First-time profile setup
│   │   └── edit/        # Edit existing profile
│   └── projects/
│       ├── page.tsx     # Projects list with filters
│       ├── new/         # Chat-based project creation
│       └── [id]/        # Unified project workspace
│
├── (public)/            # Public SEO pages
│   ├── businesses/      # Business profile pages
│   └── [city]/masonry/[type]/[slug]/  # Project detail pages
│
├── api/                 # API Routes
│   ├── ai/              # AI endpoints (analyze, transcribe, generate)
│   ├── businesses/me/   # Current business CRUD (primary)
│   ├── contractors/me/  # Legacy endpoint (deprecated)
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
- Routes in `(auth)` and `(dashboard)` use **Client Components** for interactivity
- Routes in `(public)` use **Server Components** for SEO
- API routes in `app/api/` follow RESTful patterns with standardized error handling

### Data Model

Core entities (see `docs/03-architecture/data-model.md` for full schema):

```
businesses            # Business profiles (primary, renamed from contractors in Phase 11)
  ├── auth_user_id    # FK to Supabase auth.users
  ├── name            # Business name
  ├── slug            # URL identifier
  ├── city_slug       # For SEO routing
  ├── services[]      # Array of service types
  ├── location        # JSONB: Agentic location context
  ├── understanding   # JSONB: Agent-discovered business data
  └── context         # JSONB: Agent memory/context

projects              # Project showcases
  ├── business_id     # FK to businesses (primary)
  ├── contractor_id   # FK to contractors (legacy, deprecated)
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

contractors           # Legacy table (deprecated, kept for backward compatibility)
  └── (see businesses table for current schema)
```

**RLS (Row Level Security):**
- All tables use RLS for security
- Businesses can only manage their own data
- Published projects are publicly readable
- See migrations `supabase/migrations/033_*.sql` for current schema

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
2. **Image Analysis** → Gemini 3.0 Flash detects project type, materials, techniques
3. **Voice Interview** → MediaRecorder API → Whisper API (VoiceRecorder + InterviewFlow components)
4. **Content Generation** → Gemini 3.0 Flash generates title, description, SEO metadata
5. **Review & Edit** → Contractor reviews/edits AI-generated content
6. **Publish** → Update project status to `published`

**Key Files:**
- `/src/lib/ai/providers.ts` - Centralized AI provider configuration (Gemini + Whisper)
- `/src/lib/ai/` - AI integration (image-analysis.ts, transcription.ts, content-generation.ts)
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

# AI Providers (required for AI features)
GOOGLE_GENERATIVE_AI_API_KEY=...  # Gemini 3.0 Flash (vision, generation, chat)
OPENAI_API_KEY=sk-...             # Whisper (transcription only)

# App Config
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Critical Architecture Decisions

See `docs/05-decisions/adr/` for full rationale:

1. **ADR-001**: Next.js 14 App Router (SSR for SEO + client interactivity)
2. **ADR-002**: Supabase (PostgreSQL + Auth + Storage in one platform)
3. **ADR-003**: AI Provider Strategy (Gemini 3.0 Flash primary + Whisper for transcription)
4. **ADR-004**: PWA capabilities (offline-first for contractors in the field)

## Development Phases

**Status:** ✅ MVP FEATURE COMPLETE

**MVP (Phase 1) - Completed:**
- ✅ Next.js + Supabase setup
- ✅ Authentication (login, signup, password reset, email verification)
- ✅ Contractor profile setup (3-step wizard) and edit page
- ✅ Photo upload to Supabase Storage with compression
- ✅ AI interview flow (Gemini vision analysis, Whisper transcription, Gemini content generation)
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
- Uses Vercel AI SDK for provider abstraction (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`)
- Set reasonable timeouts (30s for vision, 60s for generation)
- Handle rate limits gracefully (Gemini: 1500 RPM free tier, 360 RPM Whisper)
- Store raw transcripts and AI responses in `interview_sessions` table
- Allow contractors to edit AI-generated content before publishing
- Run `npx tsx scripts/test-gemini.ts` to verify AI integration

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
- **Phase Plans**: `todo/ai-sdk-phase-*.md`

## Getting Help

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- shadcn/ui: https://ui.shadcn.com
