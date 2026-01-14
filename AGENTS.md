# Repository Guidelines

This workspace is a collection of related KnearMe apps and experiments. Each top‑level folder is a self‑contained project with its own `package.json`, tooling, and (in some cases) its own git history. Always `cd` into the project you’re changing and follow any nested `AGENTS.md` there.

## ExecPlans
When writing complex features or significant refactors, use an ExecPlan (as described in `PLANS.md` at the repository root) from design to implementation. Start from `EXECPLAN_TEMPLATE.md` and keep the plan updated as a living document.

## Project Structure & Module Organization
- `knearme-portfolio/` – Next.js 16 + React 19 portfolio/app. Source in `src/`, routes in `src/app/`, public assets in `public/`.
- `directory-platforms/` – directory platform variants:
  - `astro-main/` (Astro + Cloudflare Pages), `v4/` (Vite + Express + Drizzle), `supabase/` (React/Vite client + Express server).
- `rank-tracking/` – pnpm/Turborepo monorepo for rank‑tracking tools (`local-beacon/`, `next-tracker/`).
- `docs/` – product and business documentation; treat as source‑of‑truth for decisions.

## Build, Test, and Development Commands
Run from the relevant subproject:
- `npm install` or `pnpm install` – install dependencies.
- `npm run dev` / `pnpm dev` – start local dev server (Next.js, Astro, or Turbo apps).
- `npm run build` / `pnpm build` – production build.
- `npm run lint` / `pnpm lint` – ESLint/Turbo linting.
- Where configured: `npm test`, `npm run test:coverage`, `npm run test:e2e` (Jest/Playwright).

## Coding Style & Naming Conventions
- TypeScript-first; React components in `PascalCase`, utilities in `camelCase`.
- Respect framework conventions (Next.js App Router, Astro pages, Express routes).
- Formatting/linting is enforced via ESLint and (in some packages) Prettier/Turbo; run lint before pushing.

## Testing Guidelines
- Tests are per-package: Jest or Vitest for unit tests; Playwright for e2e in `astro-main/` and `rank-tracking/`.
- Name tests `*.test.ts` / `*.test.tsx` and colocate under `__tests__/` or the package’s test folder.

## Commit & Pull Request Guidelines
- Most packages use short, imperative commits; some follow Conventional Commits (`feat:`, `fix:`). Prefer Conventional Commits when unsure.
- PRs should include a clear summary, linked issues, screenshots/GIFs for UI changes, and notes on how you tested. Update `docs/` and `.env.example` when behavior or config changes.
