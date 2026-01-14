# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace Overview

This is a **monorepo workspace** centered on the KnearMe portfolio app and supporting agent systems. Legacy directory and rank-tracking projects were removed from the workspace on 2026-01-05; historical context lives in `.agent/System/legacy_systems_reference.md` and `COMPARISON.md` (historical snapshot only).

## Workspace Structure

```
knearme-workspace/
├── knearme-portfolio/      # Primary app (Next.js + Supabase)
├── review-agent-dashboard/ # Review pipeline dashboard (Next.js + Supabase)
├── contractor-review-agent/ # Review ingestion + analysis scripts
├── business-agent/         # CLI agent (Anthropic Claude SDK)
├── business-agent-codex/   # CLI agent (OpenAI Codex SDK)
├── docs/                   # Product/business documentation
├── .agent/                 # System documentation and plans
└── commands/               # Agent command prompts
```

## Project Selection Guide

### When to Use Each Project

**knearme-portfolio/** (Primary Active Project)
- AI-powered contractor portfolio creation
- Next.js 16 (App Router) + Supabase
- **Status:** Active development
- **See:** `knearme-portfolio/CLAUDE.md` for detailed guidance

**review-agent-dashboard/** (Review Ops UI)
- Dashboard for review pipeline reporting and analytics
- Next.js + Supabase (admin queries, RPC usage)
- **Status:** Active

**contractor-review-agent/** (Review Pipeline)
- Ingests contractor reviews, runs analysis, generates content
- Uses Supabase service role access
- **Status:** Active

**business-agent/** and **business-agent-codex/** (Ad hoc agents)
- CLI assistants for business workflows
- **Status:** Active

## Development Commands by Project

### knearme-portfolio (Next.js 16 + Supabase)
```bash
cd knearme-portfolio
npm run dev          # Dev server at :3000
npm run build        # Production build
npm run lint         # ESLint
```

### review-agent-dashboard (Next.js + Supabase)
```bash
cd review-agent-dashboard
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # ESLint
```

### contractor-review-agent (TS scripts)
```bash
cd contractor-review-agent
npm run pipeline     # Full pipeline
npm run analyze      # Analysis step
npm run generate     # Content generation
npm run typecheck    # TypeScript check
```

### business-agent (CLI)
```bash
cd business-agent
npm run start        # CLI UI
npm run web          # Web server
npm run typecheck    # TypeScript check
```

### business-agent-codex (CLI)
```bash
cd business-agent-codex
npm run start        # CLI runner
npm run typecheck    # TypeScript check
```

## High-Level Architecture Patterns

### Shared Technology Patterns

**Authentication Architecture:**
- **knearme-portfolio**: Supabase Auth with cookie-based sessions (@supabase/ssr)
- **review-agent-dashboard**: Supabase SSR with admin client for reporting
- **contractor-review-agent**: Service role access for ingestion/analysis

**Database Architecture:**
- Shared Supabase Postgres with Row Level Security (RLS)
- Service-role writes are limited to agent pipelines and admin workflows

**Storage Architecture:**
- Supabase Storage used for uploads in the portfolio app

### Common UI Patterns

Next.js apps use App Router and shadcn/ui + Radix UI primitives, with Tailwind CSS for styling.

## Critical Cross-Project Patterns

### 1. Supabase Client Initialization (knearme-portfolio)

**Server-side (Server Components, API routes):**
```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()  // async
```

**Client-side (Client Components):**
```typescript
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()  // sync
```

**Admin operations (bypasses RLS):**
```typescript
import { createAdminClient } from '@/lib/supabase/server'
const supabase = createAdminClient()  // use sparingly
```

### 2. Database Migration Pattern (knearme-portfolio)

```sql
-- Create migration in supabase/migrations/XXX_migration_name.sql
-- Apply via Supabase dashboard or CLI
```

## Documentation Map

### Product Documentation
- **`COMPARISON.md`**: Historical snapshot of removed directory/rank-tracking repos
- **`.agent/System/legacy_systems_reference.md`**: Legacy system summaries and dependencies
- **`docs/PRODUCT-SPECIFICATION.md`**: Product requirements and specifications
- **`docs/AI-POWERED-PORTFOLIO-CONCEPT.md`**: Vision for AI portfolio generator

### Project-Specific Docs
- **`knearme-portfolio/CLAUDE.md`**: Primary app guidance

## Important Cross-Project Notes

### Supabase Project Configuration

The shared Supabase project is referenced in multiple `.env` files:
- `knearme-portfolio/.env.local`
- `review-agent-dashboard/.env.local`
- `contractor-review-agent/.env`

Do not rotate or delete keys without coordinating across all active systems.

## Repository Consolidation Notes

`directory-platforms/` and `rank-tracking/` were removed from the workspace. Historical context and dependencies are recorded in `.agent/System/legacy_systems_reference.md` and `.agent/System/shared_db_contract.md`.

## Getting Help

### Framework Documentation
- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev

### Service Documentation
- **Supabase**: https://supabase.com/docs

### UI/Component Libraries
- **shadcn/ui**: https://ui.shadcn.com
- **Radix UI**: https://www.radix-ui.com
- **Tailwind CSS**: https://tailwindcss.com/docs

### Project-Specific Help
Always check the project's own CLAUDE.md file first for detailed implementation guidance.

# Documentation Rules

- Context Loading: Before planning any implementation, always read .agent/README.md to get context.
- Maintenance: After implementing features, you must update the relevant docs in .agent to reflect changes.
- Documentation Structure: The .agent folder contains System, Tasks, and SOP subfolders.
