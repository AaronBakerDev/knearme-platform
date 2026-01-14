/**
 * KnearMe Business Advisor - Web Server (Subagent Architecture)
 *
 * Express server with WebSocket support for real-time streaming responses.
 * Uses Claude Agent SDK subagent pattern for auto-delegation to specialists.
 *
 * Architecture:
 * - Main orchestrator (Business Consultant) handles all queries
 * - Automatically delegates to specialist subagents (Marketing, Finance, Product)
 * - Subagents work in parallel when appropriate
 * - Orchestrator synthesizes results
 *
 * Usage:
 *   npm run web          # Start web server at http://localhost:3456
 *   npm run web:dev      # Start with auto-reload
 */

import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { query } from "@anthropic-ai/claude-agent-sdk";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════
// PATHS
// ═══════════════════════════════════════════════════════════════════════════

const PROJECT_ROOT = path.resolve(__dirname, "..");
const KNEARME_ROOT = path.resolve(PROJECT_ROOT, "..");
const PORTFOLIO_ROOT = path.join(KNEARME_ROOT, "knearme-portfolio");
const DOCS_PATH = path.join(PROJECT_ROOT, "docs");
const TECH_DOCS_PATH = path.join(PORTFOLIO_ROOT, "docs");
const DATA_PATH = path.join(PROJECT_ROOT, "data");
const PUBLIC_PATH = path.join(PROJECT_ROOT, "public");

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3456;

// ═══════════════════════════════════════════════════════════════════════════
// ORCHESTRATOR SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════

const ORCHESTRATOR_PROMPT = `# KnearMe Business Advisor - Orchestrator

You are the lead **Business Consultant** for KnearMe, an AI-powered portfolio platform for masonry contractors.

## Your Role

You serve as the strategic orchestrator who:
- Understands the full business context
- Answers questions directly when you have the expertise
- **Delegates to specialist subagents** when their expertise is needed
- Synthesizes insights from multiple specialists into actionable advice

## Core Business Context

**Value Proposition:** "Turn your finished work into your best salesperson."
**Target Customer:** Masonry contractors who want to win more jobs
**Business Model:** Free tier (5 projects) / Pro tier ($29/month unlimited)
**Current Phase:** MVP complete, soft launch in Denver (20 contractors target)

## Available Subagents

You have access to these specialist advisors via the Task tool:

| Agent | When to Use |
|-------|-------------|
| **marketing-advisor** | SEO, acquisition channels, messaging, positioning, growth |
| **finance-advisor** | Pricing, unit economics, LTV/CAC, projections, revenue |
| **product-advisor** | Features, roadmap, UX, prioritization, technical trade-offs |

## When to Delegate

**Delegate to subagents when:**
- Question requires deep domain expertise
- User explicitly asks about marketing/finance/product
- Cross-functional analysis would benefit from multiple perspectives
- Complex questions that need parallel investigation

**Handle directly when:**
- High-level strategy questions
- Quick factual lookups from docs
- Action item management
- Workflow execution

## How to Delegate

Use the Task tool with the subagent type:
- For marketing questions: subagent_type="marketing-advisor"
- For finance questions: subagent_type="finance-advisor"
- For product questions: subagent_type="product-advisor"

You can spawn multiple subagents in parallel for complex questions.

## Documentation Access

All business docs are in \`docs/\`:
- \`docs/strategy/\` - Business plan, vision, personas (your domain)
- \`docs/marketing/\` - SEO, acquisition, messaging
- \`docs/product/\` - Requirements, roadmap, tools
- \`docs/finance/\` - Pricing, unit economics
- \`docs/launch/\` - Launch checklist, go-to-market
- \`data/memory.md\` - Persistent memory across sessions
- \`data/actions.md\` - Action items and TODOs

## Workflows

Execute these when user requests them:

- **/launch-check** - Pre-launch readiness assessment
- **/weekly-review** - Structured weekly check-in
- **/metrics** - Business metrics dashboard
- **/swot** - SWOT analysis
- **/roadmap** - Product roadmap review
- **/actions** - Action item management

## Communication Style

- Direct and concise
- Strategic framing - connect tactics to outcomes
- Synthesize subagent insights into coherent recommendations
- Be honest about trade-offs and uncertainties
`;

// ═══════════════════════════════════════════════════════════════════════════
// SUBAGENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Subagent definitions for the Claude Agent SDK.
 * These are spawned by the orchestrator via the Task tool.
 */
const SUBAGENTS = {
  "marketing-advisor": {
    description: "Marketing specialist for SEO, contractor acquisition, messaging, and growth strategy",
    prompt: `You are a **Marketing Advisor** for KnearMe, specializing in contractor acquisition and growth.

## Your Expertise
- Contractor Acquisition: Channels, tactics, conversion optimization
- Messaging & Positioning: Value propositions for blue-collar trades
- Content Strategy: SEO, social proof, case studies
- Local Marketing: Geo-targeted campaigns, local SEO

## Key Context
**Target:** Masonry contractors (brick, stone, chimney, tuckpointing)
**Core Message:** "Turn your finished work into your best salesperson."
**Phase:** Soft launch in Denver, targeting 20 contractors

## Your Documentation
Read from \`docs/marketing/\` for SEO strategy, keywords, success metrics.

## Style
- Practical and direct—no marketing jargon
- Concrete examples over abstract concepts
- Data-driven recommendations
- Acknowledge what we don't know yet`,
    tools: ["Read", "Glob", "Grep", "WebSearch", "WebFetch"],
  },

  "finance-advisor": {
    description: "Finance specialist for unit economics, pricing strategy, and financial modeling",
    prompt: `You are a **Finance Advisor** for KnearMe, specializing in unit economics and pricing.

## Your Expertise
- Unit Economics: CAC, LTV, payback period, margins
- Pricing Strategy: Value-based pricing, tier optimization
- Financial Modeling: Revenue projections, scenario analysis
- SaaS Metrics: MRR, ARR, churn, expansion revenue

## Key Context
**Pricing:** Free (5 projects) / Pro $29/month (unlimited)
**Model:** B2B SaaS, low-touch self-serve
**Phase:** Pre-revenue, soft launch

## Key Metrics
| Metric | Target |
|--------|--------|
| MRR | $5k (month 3) |
| Pro conversion | 10-20% |
| Monthly churn | <5% |
| CAC | <$50 |
| LTV:CAC | >3:1 |

## Your Documentation
Read from \`docs/finance/\` for pricing research and unit economics.

## Style
- Always show your math—assumptions, calculations, ranges
- Use conservative, base, and optimistic scenarios
- Flag critical assumptions needing validation
- Ranges over point estimates`,
    tools: ["Read", "Glob", "Grep"],
  },

  "product-advisor": {
    description: "Product specialist for feature prioritization, roadmap planning, and UX strategy",
    prompt: `You are a **Product Advisor** for KnearMe, specializing in product strategy.

## Your Expertise
- Feature Prioritization: RICE, MoSCoW, impact vs. effort
- Roadmap Planning: Quarterly themes, milestones, dependencies
- UX Strategy: Onboarding, activation metrics, retention hooks
- Technical Trade-offs: Build vs. buy, MVP scoping

## Key Context
**Product:** AI-powered portfolio platform for masonry contractors
- Upload photos → AI interview → Generate SEO-optimized showcase
- Voice-driven (contractors on job sites)
- Mobile-first consideration

**MVP Status:** Feature complete
- Auth, profile setup, project creation wizard
- AI image analysis, voice transcription
- Content generation and public portfolio pages

## Roadmap
- Phase 1 (Done): MVP for contractors
- Phase 2 (Now): Launch validation + homeowner discovery
- Phase 3 (Future): Scale, integrations, advanced AI

## Your Documentation
Read from \`docs/product/\` for capabilities, NFRs, user journeys.

## Style
- Prioritize ruthlessly—what moves the needle NOW
- Trade-offs always explicit
- Ship small, learn fast mentality
- Connect features to outcomes`,
    tools: ["Read", "Glob", "Grep"],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOWS
// ═══════════════════════════════════════════════════════════════════════════

const WORKFLOWS: Record<string, { name: string; emoji: string; description: string; prompt: string }> = {
  "/launch-check": {
    name: "Launch Readiness",
    emoji: "🚀",
    description: "Pre-launch assessment",
    prompt: `Run the /launch-check workflow:
1. Review docs/launch/launch-checklist.md
2. Check all readiness criteria
3. Identify gaps and blockers
4. Delegate to marketing-advisor, finance-advisor, and product-advisor in parallel to assess their domains
5. Synthesize findings into a comprehensive report
6. Save report to data/reports/launch-readiness-${new Date().toISOString().split("T")[0]}.md`,
  },
  "/weekly-review": {
    name: "Weekly Review",
    emoji: "📅",
    description: "Structured weekly check-in",
    prompt: "Run the /weekly-review workflow. Read data/memory.md and data/actions.md, then guide me through: wins, blockers, metrics, and next week's priorities.",
  },
  "/metrics": {
    name: "Metrics Dashboard",
    emoji: "📊",
    description: "Business metrics overview",
    prompt: "Run the /metrics workflow. Read data/metrics.json and display the current metrics dashboard. Delegate to finance-advisor for analysis of financial metrics.",
  },
  "/swot": {
    name: "SWOT Analysis",
    emoji: "🔍",
    description: "Strengths, weaknesses, opportunities, threats",
    prompt: `Run the /swot workflow:
1. Delegate to all three advisors in parallel to gather domain-specific insights
2. Synthesize into a comprehensive SWOT analysis
3. Save to data/reports/swot-${new Date().toISOString().split("T")[0]}.md`,
  },
  "/roadmap": {
    name: "Product Roadmap",
    emoji: "🗺️",
    description: "Review product roadmap",
    prompt: "Run the /roadmap workflow. Delegate to product-advisor to review docs/product/ and present the current roadmap phases, then discuss any changes.",
  },
  "/actions": {
    name: "Action Items",
    emoji: "✅",
    description: "Review and manage TODOs",
    prompt: "Run the /actions workflow. Read data/actions.md and walk me through current items, asking for status updates.",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

interface Session {
  id: string;
  sessionId?: string; // Claude SDK session for resume
  history: Array<{ role: "user" | "assistant"; content: string; timestamp: number }>;
  totalCost: number;
  queryCount: number;
  startTime: number;
}

const sessions = new Map<string, Session>();

function createSession(id: string): Session {
  const session: Session = {
    id,
    history: [],
    totalCost: 0,
    queryCount: 0,
    startTime: Date.now(),
  };
  sessions.set(id, session);
  return session;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPRESS SERVER
// ═══════════════════════════════════════════════════════════════════════════

const app = express();
app.use(express.json());
app.use(express.static(PUBLIC_PATH));

// API: Get available workflows
app.get("/api/workflows", (_req, res) => {
  const workflowsList = Object.entries(WORKFLOWS).map(([id, wf]) => ({
    id,
    ...wf,
  }));
  res.json(workflowsList);
});

// API: Get subagent info (for UI display)
app.get("/api/agents", (_req, res) => {
  const agents = [
    {
      id: "orchestrator",
      name: "Business Advisor",
      emoji: "💼",
      color: "#06b6d4",
      description: "Strategic orchestrator with specialist subagents",
      capabilities: ["Strategy", "Coordination", "Synthesis"],
      subagents: Object.entries(SUBAGENTS).map(([id, agent]) => ({
        id,
        description: agent.description,
      })),
    },
  ];
  res.json(agents);
});

// API: Get session info
app.get("/api/session/:id", (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  res.json({
    history: session.history,
    totalCost: session.totalCost,
    queryCount: session.queryCount,
    startTime: session.startTime,
  });
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET SERVER
// ═══════════════════════════════════════════════════════════════════════════

const server = createServer(app);
const wss = new WebSocketServer({ server });

interface WSMessage {
  type: "query" | "workflow" | "new_session" | "ping";
  prompt?: string;
  workflowId?: string;
}

interface WSResponse {
  type: "chunk" | "tool_use" | "subagent" | "done" | "error" | "session_created" | "pong";
  text?: string;
  tool?: string;
  detail?: string;
  subagentId?: string;
  subagentStatus?: "started" | "completed";
  cost?: number;
  duration?: number;
  queryCount?: number;
  sessionId?: string;
  error?: string;
}

function send(ws: WebSocket, msg: WSResponse) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

wss.on("connection", (ws) => {
  console.log("[WS] Client connected");

  const connectionId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const session = createSession(connectionId);

  // Send initial session info
  send(ws, {
    type: "session_created",
    sessionId: connectionId,
  });

  ws.on("message", async (data) => {
    try {
      const msg: WSMessage = JSON.parse(data.toString());

      if (msg.type === "ping") {
        send(ws, { type: "pong" });
        return;
      }

      if (msg.type === "new_session") {
        session.sessionId = undefined;
        session.history = [];
        session.totalCost = 0;
        session.queryCount = 0;
        send(ws, { type: "session_created", sessionId: connectionId });
        return;
      }

      if (msg.type === "workflow" && msg.workflowId) {
        const workflow = WORKFLOWS[msg.workflowId];
        if (workflow) {
          await runQueryWithStreaming(ws, session, workflow.prompt);
        } else {
          send(ws, { type: "error", error: `Unknown workflow: ${msg.workflowId}` });
        }
        return;
      }

      if (msg.type === "query" && msg.prompt) {
        await runQueryWithStreaming(ws, session, msg.prompt);
        return;
      }
    } catch (error) {
      console.error("[WS] Error:", error);
      send(ws, { type: "error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  ws.on("close", () => {
    console.log("[WS] Client disconnected");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// QUERY EXECUTION WITH STREAMING & SUBAGENTS
// ═══════════════════════════════════════════════════════════════════════════

async function runQueryWithStreaming(ws: WebSocket, session: Session, prompt: string): Promise<void> {
  const startTime = Date.now();

  session.history.push({
    role: "user",
    content: prompt,
    timestamp: Date.now(),
  });

  try {
    const q = query({
      prompt,
      options: {
        ...(session.sessionId && { resume: session.sessionId }),
        model: "claude-sonnet-4-5-20250929",
        systemPrompt: ORCHESTRATOR_PROMPT,
        allowedTools: ["Read", "Glob", "Grep", "WebSearch", "WebFetch", "Edit", "Write", "Task"],
        agents: SUBAGENTS,
        additionalDirectories: [DOCS_PATH, DATA_PATH, TECH_DOCS_PATH, KNEARME_ROOT],
        cwd: PROJECT_ROOT,
        permissionMode: "acceptEdits",
      },
    });

    let responseText = "";
    const activeSubagents = new Set<string>();

    for await (const message of q) {
      // Session init
      if (message.type === "system" && "subtype" in message && message.subtype === "init") {
        session.sessionId = message.session_id;
      }

      // Handle messages
      if (message.type === "assistant" && "message" in message) {
        const content = message.message.content;

        for (const block of content) {
          // Tool use - check for subagent spawning
          if ("type" in block && block.type === "tool_use") {
            const toolBlock = block as { type: string; name: string; input?: Record<string, unknown> };
            let detail = "";

            // Check if this is a Task tool spawning a subagent
            if (toolBlock.name === "Task" && toolBlock.input) {
              const subagentType = toolBlock.input.subagent_type as string;
              if (subagentType && SUBAGENTS[subagentType as keyof typeof SUBAGENTS]) {
                activeSubagents.add(subagentType);
                send(ws, {
                  type: "subagent",
                  subagentId: subagentType,
                  subagentStatus: "started",
                  detail: toolBlock.input.description as string || subagentType,
                });
                continue;
              }
            }

            // Regular tool use
            if (toolBlock.input) {
              if ("file_path" in toolBlock.input) {
                detail = String(toolBlock.input.file_path).split("/").slice(-2).join("/");
              } else if ("pattern" in toolBlock.input) {
                detail = String(toolBlock.input.pattern).slice(0, 40);
              } else if ("query" in toolBlock.input) {
                detail = String(toolBlock.input.query).slice(0, 40);
              }
            }

            send(ws, { type: "tool_use", tool: toolBlock.name, detail });
          }

          // Text content
          if ("text" in block) {
            responseText += block.text;
            send(ws, { type: "chunk", text: block.text });
          }
        }
      }

      // Track subagent completions from tool results
      if (message.type === "user" && "message" in message) {
        // Check for subagent completion signals in tool results
        const content = message.message.content;
        for (const block of content) {
          if ("type" in block && block.type === "tool_result") {
            const resultBlock = block as { tool_use_id?: string; content?: string };
            // If a subagent just completed, notify the frontend
            for (const subagentId of activeSubagents) {
              if (resultBlock.content?.includes(subagentId) ||
                  resultBlock.tool_use_id?.includes(subagentId)) {
                send(ws, {
                  type: "subagent",
                  subagentId,
                  subagentStatus: "completed",
                });
                activeSubagents.delete(subagentId);
              }
            }
          }
        }
      }

      // Final result
      if (message.type === "result" && "result" in message) {
        const cost = message.total_cost_usd || 0;
        const duration = message.duration_ms || Date.now() - startTime;

        session.totalCost += cost;
        session.queryCount++;

        session.history.push({
          role: "assistant",
          content: responseText,
          timestamp: Date.now(),
        });

        // Mark any remaining subagents as completed
        for (const subagentId of activeSubagents) {
          send(ws, {
            type: "subagent",
            subagentId,
            subagentStatus: "completed",
          });
        }

        send(ws, {
          type: "done",
          cost,
          duration,
          queryCount: session.queryCount,
        });
      }
    }
  } catch (error) {
    console.error("[Query] Error:", error);
    send(ws, { type: "error", error: error instanceof Error ? error.message : String(error) });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════

server.listen(PORT, () => {
  console.log();
  console.log("╭───────────────────────────────────────────────────╮");
  console.log("│  💼 KnearMe Business Advisor (Subagent Arch)      │");
  console.log("╰───────────────────────────────────────────────────╯");
  console.log();
  console.log(`  🌐 Local:   http://localhost:${PORT}`);
  console.log(`  🌐 Network: http://0.0.0.0:${PORT}`);
  console.log();
  console.log("  Subagents available:");
  console.log("    📣 marketing-advisor");
  console.log("    💰 finance-advisor");
  console.log("    🎯 product-advisor");
  console.log();
  console.log("  Press Ctrl+C to stop");
  console.log();
});
