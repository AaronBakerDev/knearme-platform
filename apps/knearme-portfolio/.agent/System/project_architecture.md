# Project Architecture Snapshot

## Tech Stack
- Languages: TypeScript, JavaScript, SQL, Markdown, CSS, Shell.
- Frontend frameworks: Next.js 16 with App Router, React 19.
- Styling/UI: Tailwind CSS, Radix UI, shadcn/ui patterns, class-variance-authority, lucide-react.
- Backend/API: Node.js, Express (knearme-portfolio/mcp-server, business-agent), Supabase (Postgres/Auth/Storage).
- Data/infra: Supabase Postgres (shared across active apps).
- Tooling/testing: npm, ESLint, Vitest, Playwright, tsx for TS runners.
- AI/LLM: AI SDK, OpenAI, Anthropic Claude, Google GenAI, OpenAI Codex SDK, Langfuse tracing, OpenTelemetry.

## Project Structure
- knearme-portfolio/ (Next.js 16 app, Supabase migrations, MCP server in mcp-server/)
- business-agent/ (CLI agent using Ink/React + Express)
- business-agent-codex/ (CLI agent using OpenAI Codex SDK)
- contractor-review-agent/ (TS scripts for review collection/analysis)
- review-agent-dashboard/ (Next.js dashboard UI)
- docs/ (business/product documentation)
- commands/ (agent command prompts)
- .agent/ (system documentation and plans)
- src/ (small shared components; currently minimal)

## Key Patterns
- Next.js projects use App Router with app/ routes and server/client component split; Supabase SSR helpers are used for auth/session handling.
- Supabase service-role access is used in contractor-review-agent for review ingestion and analysis.
- Review-agent-dashboard relies on Supabase admin client for reporting and RPC queries.
- MCP server in knearme-portfolio exposes portfolio tooling for external agents.
- AI features are integrated via AI SDK/OpenAI/Anthropic/Google GenAI across portfolio and agent tools.
- Testing spans unit (Vitest/Jest) and E2E (Playwright) per project.

## Database Schema (Summary)
- knearme-portfolio Supabase schema in knearme-portfolio/supabase/migrations/20260103055338_remote_schema.sql includes core tables for blog/content (blog_posts, blog_tags, blog_comments), business profiles (businesses, contractors, services, service_areas), case studies (case_studies, case_study_images), portfolios/projects (portfolio_items, portfolio_images, projects, project_images), reviews (reviews, review_analysis, review_articles), agent memory and telemetry (agent_memory, agent_handoff_log, ai_usage_log), chat/interview usage (chat_sessions, chat_messages, interview_sessions, voice_usage), prompt templates (prompt_cap_*), search/indexing (queries, query_locations, search_entries, searched_cities), and rank-tracking resources (rt_* tables).
- review-agent-dashboard reads review_contractors, review_data, review_analysis, review_articles, ai_usage_log, and searched_cities (see review-agent-dashboard/src/lib/supabase/queries.ts).
- contractor-review-agent writes review_contractors, review_data, review_analysis, and review_articles (see contractor-review-agent/src/lib/supabase.ts).
- Rank-tracking tables (rt_*) remain in the schema as legacy data; code has been removed from the workspace. See .agent/System/legacy_systems_reference.md for historical context.

## Integrations
- Supabase: Auth, Postgres, Storage, SSR helpers (multiple projects).
- Deployment targets documented in project docs, commonly Vercel for Next.js apps.
- AI providers: OpenAI, Anthropic Claude (business-agent), Google GenAI, AI SDK, OpenAI Codex SDK (business-agent-codex).
- Observability: Langfuse + OpenTelemetry (knearme-portfolio).
- External data providers: DataForSEO (contractor-review-agent).
- MCP server: knearme-portfolio/mcp-server uses @modelcontextprotocol/sdk.
