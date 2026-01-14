# Review Agent Dashboard

A Next.js dashboard for monitoring and managing the contractor-review-agent pipeline. Built with KnearMe branding (teal accent, dark theme) and connected to the same Supabase instance.

## Features

- **Pipeline Overview** - Monitor the discover → collect → analyze → generate pipeline
- **Contractors Management** - Browse, filter, and view contractor profiles
- **Reviews Browser** - Search and filter all collected reviews
- **Articles Manager** - Review and manage AI-generated articles
- **Exports Viewer** - Browse and preview JSON export files

## Tech Stack

- **Framework**: Next.js 16 (App Router) with Turbopack
- **Database**: Supabase PostgreSQL (shared with contractor-review-agent)
- **UI**: shadcn/ui + Tailwind CSS 4
- **Fonts**: Geist Sans/Mono
- **State**: TanStack Query for data fetching

## Quick Start

### Prerequisites

- Node.js 20.11+ (see `.nvmrc` or `package.json` Volta pin)
- Access to the KnearMe Supabase project
- contractor-review-agent must be set up (for export file viewing)

### Installation

```bash
# Clone and install
cd /Users/aaronbaker/knearme-workspace/review-agent-dashboard
nvm use || nvm install
# If you use Volta instead of nvm:
# volta install node@20.11.1
npm install

# Copy environment variables from knearme-portfolio
cp ../knearme-portfolio/.env.local .env.local

# Start development server
npm run dev
```

The dashboard will be available at http://localhost:3000

### Environment Variables

The dashboard uses the same Supabase credentials as knearme-portfolio:

```bash
# Required - Supabase connection
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx

# Optional - Export file directory
CONTRACTOR_REVIEW_AGENT_OUTPUT_DIR=../contractor-review-agent/output
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard overview
│   ├── contractors/          # Contractors list and detail
│   ├── reviews/              # Reviews browser
│   ├── articles/             # Articles list and detail
│   ├── pipeline/             # Pipeline status
│   ├── exports/              # JSON export viewer
│   ├── loading.tsx           # Global loading state
│   └── error.tsx             # Global error boundary
│
├── components/
│   ├── dashboard/            # Dashboard-specific components
│   │   └── Sidebar.tsx       # Navigation sidebar
│   ├── providers.tsx         # TanStack Query provider
│   └── ui/                   # shadcn/ui components
│
└── lib/
    ├── supabase/
    │   ├── client.ts         # Browser Supabase client
    │   ├── server.ts         # Server Supabase client
    │   └── queries.ts        # Data fetching functions
    ├── exports/
    │   └── reader.ts         # JSON export file reader
    └── types.ts              # TypeScript definitions
```

## Database Tables

The dashboard reads from these Supabase tables (managed by contractor-review-agent):

| Table | Description |
|-------|-------------|
| `review_contractors` | Discovered contractor profiles |
| `review_data` | Individual reviews from Google |
| `review_analysis` | AI-generated analysis (JSONB) |
| `review_articles` | Generated SEO articles |
| `searched_cities` | Search history |

## Routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard overview with stats and activity |
| `/contractors` | Contractors list with filters |
| `/contractors/[id]` | Contractor detail with reviews/analysis/article tabs |
| `/reviews` | All reviews browser with filters |
| `/articles` | Articles list by status |
| `/articles/[id]` | Article detail viewer |
| `/pipeline` | Visual pipeline status |
| `/exports` | JSON export file viewer |

## Development

```bash
# Development server (Turbopack)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Design System

Uses KnearMe branding consistent with knearme-portfolio:

- **Primary Color**: Teal `oklch(0.72 0.14 185)`
- **Theme**: Dark mode only
- **Typography**: Geist Sans for UI, Geist Mono for code
- **Components**: shadcn/ui with custom theming

## Related Projects

- **contractor-review-agent** - The AI agent that collects and analyzes reviews
- **knearme-portfolio** - The contractor portfolio platform

## License

Private - KnearMe
