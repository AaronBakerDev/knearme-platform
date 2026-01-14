# Repository Guidelines

## ExecPlans
When writing complex features or significant refactors, use an ExecPlan (see `PLANS.md` at the repository root). Start from `EXECPLAN_TEMPLATE.md` and keep the plan updated as a living document.

## Project Structure & Modules
- App entry and routing live in `src/app`, with feature routes under folders like `(auth)`, `(dashboard)`, `(marketing)`, `(portfolio)`, and `(payload)`.
- Reusable UI and feature components are in `src/components` (for example `src/components/portfolio`, `src/components/forms`, `src/components/ui`).
- Shared logic resides in `src/hooks`, `src/lib` (Supabase, SEO, utilities), and `src/types`.
- Product documentation is organized under `docs/01-vision` through `docs/10-launch`; keep architecture and decision records there.

## Architecture Overview
- Next.js App Router frontend deployed on Vercel, with Supabase providing authentication, PostgreSQL, and file storage.
- API routes and server actions live under `src/app/api` and server components; call Supabase through helpers in `src/lib/supabase`.
- Database schema changes belong in `supabase/migrations`; keep C4 diagrams and data model docs up to date in `docs/03-architecture`.

## Build, Dev, and Lint
- `npm run dev` – start the Next.js dev server.
- `npm run build` – create a production build; fix all type and lint errors before committing.
- `npm start` – run the built app locally.
- `npm run lint` – run ESLint with the Next.js core-web-vitals config; all changes should pass.

## Coding Style & Naming
- Use TypeScript throughout; prefer explicit types on public functions and shared utilities.
- Follow React/Next conventions: `PascalCase` for components, `camelCase` for variables and functions, and file-based routing under `src/app`.
- Keep components small and focused; place shared UI in `src/components/ui` and feature-specific logic in the closest feature folder.
- Respect existing Tailwind usage from `src/app/globals.css` and utility patterns (`clsx`, `tailwind-merge`).

## Testing & Quality
- Add lightweight tests or examples near complex logic (for example, utilities in `src/lib/utils.ts`).
- Before opening a PR, ensure `npm run lint` and `npm run build` succeed and that key flows in `(auth)` and `(dashboard)` run locally.

## Security & Configuration
- Store secrets in `.env.local` (never commit them); required vars include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and OpenAI API keys.
- Use the Supabase admin client from `src/lib/supabase/server.ts` only in secure server-side code, and follow `docs/06-security/threat-model.md` for RLS, rate limiting, security headers, and file-upload validation.

## Commits & Pull Requests
- Write concise, imperative commit messages (for example, `Add contractor onboarding form`, `Fix auth redirect in layout`).
- For pull requests, include: a short summary, any linked issues, screenshots or GIFs for UI changes, and notes on testing performed.
- Keep PRs focused on a single feature or fix; update relevant docs under `docs/` when behavior or architecture changes.

## Messaging Guidelines

When writing user-facing copy, marketing content, or UI text:

### Core Message
KnearMe turns finished projects into shareable proof that wins more jobs. AI handles the writing—the contractor's work is the hero.

### Voice Checklist
- [ ] Does it focus on the contractor's work, not our technology?
- [ ] Does it promise outcomes (more jobs) not features (fast/easy)?
- [ ] Would a busy contractor understand it in 3 seconds?
- [ ] Does it avoid jargon like "case study", "SEO", "AI-powered"?

### Quick Reference
- **Hero**: The contractor and their craftsmanship
- **Villain**: Competitors with better online presence stealing jobs
- **Solution**: Make every project visible proof that builds trust
- **Tone**: Direct, practical, tradesperson-friendly
