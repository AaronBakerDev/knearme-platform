# KnearMe Business Consultant Agent

A strategic business advisor powered by Claude Agent SDK, using your Claude Max subscription.

## Features

- **Beautiful TUI** - Clean, modern interface powered by Clack + Chalk
- **Web Interface** - Browser-based access from any device with real-time streaming
- **Multiple Advisors** - Switch between specialized experts (Business, Marketing, Finance, Product)
- **Workflow Commands** - Structured business processes (/launch-check, /weekly-review, etc.)
- **Action Tracking** - Persistent TODO list across sessions
- **Report Generation** - Auto-generated markdown reports
- **Metrics Dashboard** - Track key business metrics
- **Session Continuity** - Maintains context across multiple questions
- **No API key required** - Uses Claude Max subscription via OAuth

## Quick Start

```bash
# Interactive mode (recommended)
npm start

# Single query
npm start "What's our pricing strategy?"

# Run a workflow
npm start /launch-check

# Use specific advisor
npm start --marketing "How should we acquire our first 20 users?"
npm start --finance "What's our LTV:CAC ratio target?"
npm start --product "What should we prioritize for launch?"
```

## Advisors

Switch between specialized advisors using `@advisor` or `advisors` command:

| Advisor | Command | Expertise |
|---------|---------|-----------|
| 💼 Business Consultant | `@consultant` | Strategic business advice (default) |
| 📣 Marketing Advisor | `@marketing` | Acquisition, messaging, growth |
| 💰 Finance Advisor | `@finance` | Unit economics, pricing, projections |
| 🎯 Product Advisor | `@product` | Features, roadmap, prioritization |

```bash
# In interactive mode
@marketing
> How should we position against competitors?

@finance
> What CAC can we afford at $29/month?
```

## Agent Communication

Advisors can consult each other without switching context:

```bash
# Consult another advisor (while staying with current advisor)
@finance What's the CAC we can afford at $29/month?
ask @marketing How should we position this for contractors?

# Get all advisors' perspectives on a topic
team-sync Should we launch in Denver or Boulder first?
/team-sync What are the biggest risks to our soft launch?
```

### How It Works

- Each advisor maintains its own session context
- Consultations are tracked in shared context
- Team sync queries all 4 advisors sequentially
- Responses are displayed inline with advisor branding

## Workflow Commands

Run structured business processes:

| Command | Description |
|---------|-------------|
| `/launch-check` | Pre-launch readiness assessment |
| `/weekly-review` | Structured weekly business review |
| `/metrics` | Display business metrics dashboard |
| `/swot` | Generate SWOT analysis |
| `/roadmap` | Review product roadmap |
| `/actions` | Review and manage action items |
| `/team-sync` | Get input from all advisors |

Workflows generate reports in `data/reports/`.

## Interactive Commands

| Command | Description |
|---------|-------------|
| `new`, `reset` | Start a fresh session |
| `summary`, `stats` | Show session statistics |
| `workflows` | List available workflows |
| `advisors` | List and switch advisors |
| `@<advisor>` | Switch advisor (e.g., @marketing) |
| `clear` | Clear the screen |
| `help` | Show all commands |
| `exit`, `quit` | Exit the consultant |
| `Ctrl+C` | Graceful exit with summary |

## Documentation Ownership

Each advisor owns specific docs they can update:

```
docs/
├── strategy/           # 💼 Consultant owns
│   ├── business-plan.md
│   ├── vision.md
│   └── personas.md
├── marketing/          # 📣 Marketing Advisor owns
│   ├── seo-strategy.md
│   ├── keyword-targeting.md
│   └── ...
├── product/            # 🎯 Product Advisor owns
│   ├── capabilities.md
│   ├── user-journeys.md
│   └── homeowner-tools/
├── finance/            # 💰 Finance Advisor owns
│   ├── pricing.md
│   └── unit-economics.md
└── launch/             # 🚀 Shared
    └── launch-checklist.md
```

## Data Files

```
data/
├── memory.md      # Persistent memory across sessions
├── actions.md     # Action items and TODOs
├── metrics.json   # Business metrics (update manually or via API)
└── reports/       # Generated reports
    ├── launch-readiness-YYYY-MM-DD.md
    ├── weekly-review-YYYY-MM-DD.md
    └── swot-YYYY-MM-DD.md
```

## Project Structure

```
business-agent/
├── src/
│   ├── index.ts           # Main TUI + agent orchestration
│   ├── web-server.ts      # Express + WebSocket web server
│   └── test-auth.ts       # Auth verification script
├── public/
│   └── index.html         # Web interface (responsive SPA)
├── config/
│   ├── system-prompt.md   # Business Consultant persona
│   └── agents/            # Sub-agent prompts
│       ├── marketing.md
│       ├── finance.md
│       └── product.md
├── docs/                  # Business documentation (advisor-owned)
│   ├── strategy/          # Consultant
│   ├── marketing/         # Marketing Advisor
│   ├── product/           # Product Advisor
│   ├── finance/           # Finance Advisor
│   └── launch/            # Shared
├── data/
│   ├── memory.md          # Persistent memory
│   ├── actions.md         # Action items
│   ├── metrics.json       # Business metrics
│   └── reports/           # Generated reports
├── package.json
└── tsconfig.json
```

## How It Works

1. **Agent SDK** spawns Claude Code CLI as a subprocess
2. **Claude Code** uses OAuth auth from your Max subscription
3. **No API tokens consumed** - runs on subscription quota
4. **Tools available**: Read, Glob, Grep, WebSearch, WebFetch, Edit, Write
5. **Persistent state** via memory.md and actions.md files

## Cost Tracking

Even on Max subscription, the SDK reports estimated costs:

```
──────────────────────────────────────────────────
✓ $0.0234 · 5.4s · session active
```

Use `summary` to see cumulative stats:
```
┌ Session Summary ─────────────────────────────────┐
│  3 queries · $0.0712 total                       │
└──────────────────────────────────────────────────┘
```

## Expanding Capabilities

### Adding a New Advisor

1. Create `config/agents/new-advisor.md` with persona prompt
2. Add to `AGENTS` object in `src/index.ts`:
   ```typescript
   newadvisor: {
     name: "New Advisor",
     emoji: "🆕",
     color: chalk.yellow,
     promptFile: "agents/new-advisor.md",
     description: "What this advisor does",
   }
   ```

### Adding a New Workflow

1. Add workflow instructions to `config/system-prompt.md`
2. Add to `WORKFLOWS` object in `src/index.ts`:
   ```typescript
   "/new-workflow": {
     name: "New Workflow",
     description: "What it does",
     prompt: "Instructions for the agent...",
   }
   ```

### Integrating Real Metrics

Update `data/metrics.json` with real data from:
- Vercel Analytics API
- Supabase database queries
- Stripe/payment provider

The `/metrics` workflow will display whatever is in this file.

## Web Interface

Access the business advisor from any device through a browser:

```bash
# Start web server
npm run web

# With auto-reload for development
npm run web:dev
```

Open http://localhost:3456 in your browser.

### Features

- **Real-time streaming** - See responses as they're generated
- **Advisor switching** - Click the person icon to switch advisors
- **Quick workflows** - One-click access to common workflows
- **Mobile-friendly** - Works on phones and tablets
- **Tool visibility** - See what the AI is reading/searching

### Remote Access with Cloudflare Tunnel

To access from anywhere (phone, other computers):

```bash
# Install cloudflared
brew install cloudflared

# Create a tunnel (one-time setup)
cloudflared tunnel login
cloudflared tunnel create business-advisor

# Run the tunnel
cloudflared tunnel --url http://localhost:3456
```

This gives you a public URL like `https://random-name.trycloudflare.com` that works from any device.

## Development

```bash
# Install dependencies
npm install

# Run CLI in development
npm start

# Run web server
npm run web

# Type check
npm run typecheck

# Build for production
npm run build

# Test authentication
npm run test:auth
```
