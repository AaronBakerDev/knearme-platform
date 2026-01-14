/**
 * Claude Agent SDK - Web Server Template
 *
 * A complete template for building AI agents with:
 * - Express HTTP server
 * - WebSocket streaming
 * - Subagent architecture
 * - Session management
 *
 * Usage:
 *   npm install @anthropic-ai/claude-agent-sdk express ws
 *   npx tsx src/server.ts
 */

import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { query } from "@anthropic-ai/claude-agent-sdk";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3456;
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DOCS_PATH = path.join(PROJECT_ROOT, "docs");
const DATA_PATH = path.join(PROJECT_ROOT, "data");

// ═══════════════════════════════════════════════════════════════════════════
// ORCHESTRATOR SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════

const ORCHESTRATOR_PROMPT = `# Your Agent Name

You are [describe your agent's role and purpose].

## Your Role

You serve as the main orchestrator who:
- [Primary responsibility 1]
- [Primary responsibility 2]
- Delegates to specialist subagents when their expertise is needed

## Available Subagents

You have access to these specialists via the Task tool:

| Agent | When to Use |
|-------|-------------|
| **specialist-a** | [When to use specialist A] |
| **specialist-b** | [When to use specialist B] |

## When to Delegate

**Delegate when:**
- Question requires deep domain expertise
- User explicitly asks about [domain]
- Complex questions need parallel investigation

**Handle directly when:**
- High-level strategy questions
- Quick factual lookups
- Simple requests

## How to Delegate

Use the Task tool with subagent_type:
- For [domain A]: subagent_type="specialist-a"
- For [domain B]: subagent_type="specialist-b"

## Documentation Access

Read from these paths:
- \`docs/\` - [Description]
- \`data/\` - [Description]

## Communication Style

- [Style guideline 1]
- [Style guideline 2]
`;

// ═══════════════════════════════════════════════════════════════════════════
// SUBAGENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Subagent definitions for the Claude Agent SDK.
 * These are spawned by the orchestrator via the Task tool.
 *
 * IMPORTANT:
 * - The `Task` tool MUST be in parent's allowedTools for subagents to work
 * - Subagents CANNOT spawn other subagents (no nesting)
 * - Omitting `tools` means subagent inherits all parent tools
 *
 * Each subagent needs:
 * - description: REQUIRED - When should the orchestrator spawn this agent?
 * - prompt: REQUIRED - System prompt for the specialist
 * - tools: Optional - Which tools can this specialist use? (omit to inherit all)
 * - model: Optional - Override model ('sonnet' | 'opus' | 'haiku' | 'inherit')
 */
const SUBAGENTS = {
  "specialist-a": {
    description: "Specialist for [domain A] - use when [criteria]",
    prompt: `You are a **Specialist A** focusing on [domain].

## Your Expertise
- [Expertise area 1]
- [Expertise area 2]

## Key Context
[Relevant context for this specialist]

## Your Documentation
Read from \`docs/domain-a/\` for reference materials.

## Style
- [Style guideline 1]
- [Style guideline 2]`,
    tools: ["Read", "Glob", "Grep"],  // Read-only for analysis
    // model: "opus",  // Uncomment to use stronger model for critical tasks
  },

  "specialist-b": {
    description: "Specialist for [domain B] - use when [criteria]",
    prompt: `You are a **Specialist B** focusing on [domain].

## Your Expertise
- [Expertise area 1]
- [Expertise area 2]

## Key Context
[Relevant context for this specialist]

## Your Documentation
Read from \`docs/domain-b/\` for reference materials.

## Style
- [Style guideline 1]
- [Style guideline 2]`,
    tools: ["Read", "Glob", "Grep", "WebSearch"],
    // Omit model to inherit from parent
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
app.use(express.static(path.join(PROJECT_ROOT, "public")));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API: Get agent info
app.get("/api/agent", (_req, res) => {
  res.json({
    name: "Your Agent Name",
    description: "Agent description",
    subagents: Object.keys(SUBAGENTS),
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET SERVER
// ═══════════════════════════════════════════════════════════════════════════

const server = createServer(app);
const wss = new WebSocketServer({ server });

interface WSMessage {
  type: "query" | "new_session" | "ping";
  prompt?: string;
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

  const connectionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const session = createSession(connectionId);

  send(ws, { type: "session_created", sessionId: connectionId });

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

      if (msg.type === "query" && msg.prompt) {
        await runQuery(ws, session, msg.prompt);
      }
    } catch (error) {
      console.error("[WS] Error:", error);
      send(ws, { type: "error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  ws.on("close", () => console.log("[WS] Client disconnected"));
});

// ═══════════════════════════════════════════════════════════════════════════
// QUERY EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

async function runQuery(ws: WebSocket, session: Session, prompt: string): Promise<void> {
  const startTime = Date.now();

  session.history.push({ role: "user", content: prompt, timestamp: Date.now() });

  try {
    const q = query({
      prompt,
      options: {
        // Session resume (if continuing conversation)
        ...(session.sessionId && { resume: session.sessionId }),

        // Model - use specific version for consistency
        model: "claude-sonnet-4-5-20250929",

        // System prompt
        systemPrompt: ORCHESTRATOR_PROMPT,

        // Tools - Task is REQUIRED for subagent spawning
        allowedTools: ["Read", "Glob", "Grep", "WebSearch", "WebFetch", "Edit", "Write", "Task"],

        // Subagents
        agents: SUBAGENTS,

        // Directories the agent can access
        additionalDirectories: [DOCS_PATH, DATA_PATH],
        cwd: PROJECT_ROOT,

        // Permissions - acceptEdits auto-approves file changes
        permissionMode: "acceptEdits",

        // Safety limits
        maxTurns: 50,        // Prevent infinite loops
        maxBudgetUsd: 1.0,   // Cost limit per query
      },
    });

    let responseText = "";
    const activeSubagents = new Set<string>();

    for await (const message of q) {
      // Session initialization
      if (message.type === "system" && "subtype" in message && message.subtype === "init") {
        session.sessionId = message.session_id;
      }

      // Handle assistant messages
      if (message.type === "assistant" && "message" in message) {
        for (const block of message.message.content) {
          // Tool use detection
          if ("type" in block && block.type === "tool_use") {
            const toolBlock = block as { type: string; name: string; input?: Record<string, unknown> };

            // Check for subagent spawning
            if (toolBlock.name === "Task" && toolBlock.input) {
              const subagentType = toolBlock.input.subagent_type as string;
              if (subagentType && SUBAGENTS[subagentType as keyof typeof SUBAGENTS]) {
                activeSubagents.add(subagentType);
                send(ws, {
                  type: "subagent",
                  subagentId: subagentType,
                  subagentStatus: "started",
                  detail: (toolBlock.input.description as string) || subagentType,
                });
                continue;
              }
            }

            // Regular tool use
            let detail = "";
            if (toolBlock.input) {
              if ("file_path" in toolBlock.input) {
                detail = String(toolBlock.input.file_path).split("/").slice(-2).join("/");
              } else if ("pattern" in toolBlock.input) {
                detail = String(toolBlock.input.pattern).slice(0, 40);
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

      // Final result
      if (message.type === "result" && "result" in message) {
        const cost = message.total_cost_usd || 0;
        const duration = message.duration_ms || Date.now() - startTime;

        session.totalCost += cost;
        session.queryCount++;
        session.history.push({ role: "assistant", content: responseText, timestamp: Date.now() });

        // Mark subagents complete
        for (const subagentId of activeSubagents) {
          send(ws, { type: "subagent", subagentId, subagentStatus: "completed" });
        }

        send(ws, { type: "done", cost, duration, queryCount: session.queryCount });
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
  console.log("│  Your Agent Name                                  │");
  console.log("╰───────────────────────────────────────────────────╯");
  console.log();
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://0.0.0.0:${PORT}`);
  console.log();
  console.log("  Subagents:");
  Object.keys(SUBAGENTS).forEach((id) => console.log(`    - ${id}`));
  console.log();
});
