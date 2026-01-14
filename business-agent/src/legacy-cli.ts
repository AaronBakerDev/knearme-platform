/**
 * KnearMe Business Consultant Agent
 *
 * A strategic business advisor powered by Claude, with access to all KnearMe
 * business documentation. Features workflow commands, sub-agents, and
 * persistent action tracking.
 *
 * Usage:
 *   npm start                           # Interactive mode
 *   npm start "What's our pricing?"     # Single query mode
 *   npm start --marketing "..."         # Use Marketing sub-agent
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import * as p from "@clack/prompts";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const PROJECT_ROOT = path.resolve(__dirname, "..");
const KNEARME_ROOT = path.resolve(PROJECT_ROOT, "..");
const PORTFOLIO_ROOT = path.join(KNEARME_ROOT, "knearme-portfolio");
const DOCS_PATH = path.join(PROJECT_ROOT, "docs");
const TECH_DOCS_PATH = path.join(PORTFOLIO_ROOT, "docs");
const DATA_PATH = path.join(PROJECT_ROOT, "data");
const CONFIG_PATH = path.join(PROJECT_ROOT, "config");

// Session state
let sessionId: string | undefined;
let totalCost = 0;
let queryCount = 0;
let currentAgent = "consultant";
let conversationHistory: string[] = [];

// Agent sessions - each agent maintains its own session
const agentSessions: Record<string, string | undefined> = {};

// Shared context between agents
interface SharedContext {
  lastDecisions: string[];
  activeTopics: string[];
  pendingQuestions: { from: string; to: string; question: string; answer?: string }[];
}
const sharedContext: SharedContext = {
  lastDecisions: [],
  activeTopics: [],
  pendingQuestions: [],
};

// ═══════════════════════════════════════════════════════════════════════════
// AGENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

interface AgentConfig {
  name: string;
  emoji: string;
  color: (text: string) => string;
  bgColor: (text: string) => string;
  promptFile: string;
  description: string;
  docsFolder: string;
  capabilities: string[];
}

const AGENTS: Record<string, AgentConfig> = {
  consultant: {
    name: "Business Consultant",
    emoji: "💼",
    color: chalk.cyan,
    bgColor: chalk.bgCyan.black,
    promptFile: "system-prompt.md",
    description: "Strategic business advisor",
    docsFolder: "strategy",
    capabilities: ["Business strategy", "Vision & planning", "Cross-functional alignment"],
  },
  marketing: {
    name: "Marketing Advisor",
    emoji: "📣",
    color: chalk.magenta,
    bgColor: chalk.bgMagenta.black,
    promptFile: "agents/marketing.md",
    description: "Acquisition & growth",
    docsFolder: "marketing",
    capabilities: ["SEO strategy", "Contractor acquisition", "Messaging & positioning"],
  },
  finance: {
    name: "Finance Advisor",
    emoji: "💰",
    color: chalk.green,
    bgColor: chalk.bgGreen.black,
    promptFile: "agents/finance.md",
    description: "Unit economics & pricing",
    docsFolder: "finance",
    capabilities: ["Pricing strategy", "LTV/CAC modeling", "Revenue projections"],
  },
  product: {
    name: "Product Advisor",
    emoji: "🎯",
    color: chalk.blue,
    bgColor: chalk.bgBlue.black,
    promptFile: "agents/product.md",
    description: "Features & roadmap",
    docsFolder: "product",
    capabilities: ["Feature prioritization", "Roadmap planning", "User experience"],
  },
};

const UI = {
  brand: chalk.hex("#0ea5a4"),
  warm: chalk.hex("#ea580c"),
  gold: chalk.hex("#d97706"),
  slate: chalk.hex("#64748b"),
  muted: chalk.hex("#94a3b8"),
};

// ═══════════════════════════════════════════════════════════════════════════
// WORKFLOW DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

interface Workflow {
  name: string;
  emoji: string;
  description: string;
  prompt: string;
}

const WORKFLOWS: Record<string, Workflow> = {
  "/launch-check": {
    name: "Launch Readiness",
    emoji: "🚀",
    description: "Pre-launch assessment",
    prompt: `Run the /launch-check workflow. Review docs/launch/launch-checklist.md, check all readiness criteria, identify gaps, and save a report to data/reports/launch-readiness-${new Date().toISOString().split("T")[0]}.md`,
  },
  "/weekly-review": {
    name: "Weekly Review",
    emoji: "📅",
    description: "Structured weekly check-in",
    prompt: `Run the /weekly-review workflow. Read data/memory.md and data/actions.md, then guide me through: wins, blockers, metrics, and next week's priorities.`,
  },
  "/metrics": {
    name: "Metrics Dashboard",
    emoji: "📊",
    description: "Business metrics overview",
    prompt: `Run the /metrics workflow. Read data/metrics.json and display the current metrics dashboard with key insights.`,
  },
  "/swot": {
    name: "SWOT Analysis",
    emoji: "🔍",
    description: "Strengths, weaknesses, opportunities, threats",
    prompt: `Run the /swot workflow. Review the business documentation and generate a SWOT analysis, saving to data/reports/swot-${new Date().toISOString().split("T")[0]}.md`,
  },
  "/roadmap": {
    name: "Product Roadmap",
    emoji: "🗺️",
    description: "Review product roadmap",
    prompt: `Run the /roadmap workflow. Read docs/product/ and display the current roadmap phases, then ask about changes.`,
  },
  "/actions": {
    name: "Action Items",
    emoji: "✅",
    description: "Review and manage TODOs",
    prompt: `Run the /actions workflow. Read data/actions.md and walk me through current items, asking for status updates.`,
  },
  "/team-sync": {
    name: "Team Sync",
    emoji: "👥",
    description: "Get input from all advisors",
    prompt: `This is a team sync. I need perspectives from all advisors on our current priorities. Please provide your view as the current advisor, then I'll consult the others.`,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function loadAgentPrompt(agentId: string): string {
  const agent = AGENTS[agentId];
  if (!agent) return loadAgentPrompt("consultant");

  const promptPath = path.join(CONFIG_PATH, agent.promptFile);
  try {
    return fs.readFileSync(promptPath, "utf-8");
  } catch {
    return `You are a ${agent.name} for KnearMe.`;
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(0);
  return `${mins}m ${secs}s`;
}

function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

function countDocsInFolder(folder: string): number {
  const folderPath = path.join(DOCS_PATH, folder);
  try {
    const files = fs.readdirSync(folderPath, { recursive: true });
    return (files as string[]).filter((f) => f.endsWith(".md")).length;
  } catch {
    return 0;
  }
}

function getRecentMemory(): string | null {
  try {
    const memoryPath = path.join(DATA_PATH, "memory.md");
    const content = fs.readFileSync(memoryPath, "utf-8");
    const lines = content.split("\n").slice(0, 20);
    return lines.join("\n");
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DISPLAY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getTerminalWidth(max = 80): number {
  const cols = process.stdout.columns || max;
  return Math.min(cols, max);
}

function drawBox(content: string[], title?: string, color = chalk.dim): void {
  const maxLen = Math.max(
    ...content.map((l) => l.replace(/\x1b\[[0-9;]*m/g, "").length),
    title ? title.length + 4 : 0
  );
  const width = Math.min(maxLen + 4, getTerminalWidth(80));

  const top = title
    ? `${color("╭─")} ${chalk.bold(title)} ${color("─".repeat(Math.max(0, width - title.length - 5)) + "╮")}`
    : color("╭" + "─".repeat(width - 2) + "╮");

  console.log(top);
  for (const line of content) {
    const plainLen = line.replace(/\x1b\[[0-9;]*m/g, "").length;
    const padding = " ".repeat(Math.max(0, width - plainLen - 4));
    console.log(color("│") + " " + line + padding + " " + color("│"));
  }
  console.log(color("╰" + "─".repeat(width - 2) + "╯"));
}

function printRule(label?: string): void {
  const width = getTerminalWidth(80);
  if (!label) {
    console.log(UI.muted("─".repeat(width)));
    return;
  }
  const padded = ` ${label} `;
  const remaining = Math.max(0, width - padded.length);
  const left = Math.floor(remaining / 2);
  const right = remaining - left;
  console.log(UI.muted("─".repeat(left)) + UI.brand(padded) + UI.muted("─".repeat(right)));
}

function showHeader(): void {
  console.clear();

  const agent = AGENTS[currentAgent];
  const docCount = countDocsInFolder(agent.docsFolder);
  const sessionStatus = sessionId ? UI.brand("●") : UI.warm("○");

  // Main header
  console.log();
  console.log(`${agent.bgColor(` ${agent.emoji} ${agent.name} `)} ${UI.muted("KnearMe Business Advisor")}`);
  printRule();

  // Status line
  const statusParts = [
    chalk.dim("Session") + " " + sessionStatus,
    chalk.dim("Queries") + " " + chalk.bold(queryCount),
    chalk.dim("Cost") + " " + chalk.bold(formatCost(totalCost)),
    chalk.dim("Docs") + " " + chalk.white(`${docCount} · ${agent.docsFolder}/`),
  ];
  console.log("  " + statusParts.join(UI.muted(" · ")));
  console.log();
}

function showWelcome(): void {
  showHeader();

  const agent = AGENTS[currentAgent];

  const capLines = agent.capabilities.map((c) => `${UI.muted("•")} ${c}`);
  drawBox(capLines, "Capabilities", UI.muted);
  console.log();

  const quickLines = [
    `${UI.brand("/weekly-review")} ${UI.muted("Weekly planning ritual")}`,
    `${UI.brand("/actions")} ${UI.muted("Review action items")}`,
    `${UI.brand("/metrics")} ${UI.muted("Snapshot key metrics")}`,
    `${UI.brand("/roadmap")} ${UI.muted("Review product roadmap")}`,
    "",
    `${UI.brand("@marketing")} ${UI.muted("Switch advisor")}`,
    `${UI.brand("team-sync")} ${UI.muted("Get all advisors' input")}`,
  ];
  drawBox(quickLines, "Quick Actions", UI.muted);
  console.log();

  const memory = getRecentMemory();
  if (memory) {
    const memoryLines = memory
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 4)
      .map((line) => UI.muted(line));
    if (memoryLines.length > 0) {
      drawBox(memoryLines, "Recent Memory (data/memory.md)", UI.muted);
      console.log();
    }
  }

  console.log(UI.muted("Tip: ") + UI.brand(":") + UI.muted(" opens command palette · ") + UI.brand("help") + UI.muted(" for full list."));
  console.log();
}

async function openCommandPalette(): Promise<string | null> {
  const selection = await p.select({
    message: "Command palette",
    options: [
      { value: "section-workflows", label: "Workflows", disabled: true },
      { value: "/weekly-review", label: "📅 Weekly Review", hint: "Structured check-in" },
      { value: "/actions", label: "✅ Action Items", hint: "Review TODOs" },
      { value: "/metrics", label: "📊 Metrics Dashboard", hint: "Key business metrics" },
      { value: "/roadmap", label: "🗺️ Product Roadmap", hint: "Roadmap overview" },
      { value: "/launch-check", label: "🚀 Launch Check", hint: "Pre-launch readiness" },
      { value: "/swot", label: "🔍 SWOT Analysis", hint: "Strengths, weaknesses, opportunities" },
      { value: "/team-sync", label: "👥 Team Sync", hint: "All advisors (will prompt topic)" },
      { value: "section-agents", label: "Advisors", disabled: true },
      { value: "@consultant", label: "💼 Business Consultant", hint: "Switch advisor" },
      { value: "@marketing", label: "📣 Marketing Advisor", hint: "Switch advisor" },
      { value: "@finance", label: "💰 Finance Advisor", hint: "Switch advisor" },
      { value: "@product", label: "🎯 Product Advisor", hint: "Switch advisor" },
      { value: "section-session", label: "Session", disabled: true },
      { value: "summary", label: "Session Summary", hint: "Usage stats" },
      { value: "history", label: "Recent History", hint: "Last exchanges" },
      { value: "new", label: "New Session", hint: "Reset conversation" },
      { value: "clear", label: "Clear Screen", hint: "Redraw header" },
      { value: "help", label: "Help", hint: "All commands" },
      { value: "exit", label: "Exit", hint: "Close the app" },
    ],
  });

  if (p.isCancel(selection)) {
    return null;
  }

  if (selection === "/team-sync") {
    const topic = await p.text({
      message: "Team sync topic",
      placeholder: "What should all advisors weigh in on?",
      validate: (v) => (!v ? "Enter a topic" : undefined),
    });
    if (p.isCancel(topic)) return null;
    return `team-sync ${String(topic).trim()}`;
  }

  return String(selection);
}

function filterPaletteOptions(
  options: Array<{ value: string; label: string; hint?: string; disabled?: boolean }>,
  query: string
): Array<{ value: string; label: string; hint?: string; disabled?: boolean }> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return options;

  return options.filter((option) => {
    if (option.disabled) return false;
    const haystack = `${option.value} ${option.label} ${option.hint ?? ""}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

async function openWorkflowPalette(seed = ""): Promise<string | null> {
  const options = Object.entries(WORKFLOWS).flatMap(([cmd, wf], index, arr) => {
    const items: Array<{ value: string; label: string; hint?: string; disabled?: boolean }> = [];
    if (index === 0) {
      items.push({ value: "section-workflows", label: "Workflows", disabled: true });
    }
    items.push({ value: cmd, label: `${wf.emoji} ${wf.name}`, hint: wf.description });
    if (index < arr.length - 1) items.push({ value: `spacer-${cmd}`, label: " ", disabled: true });
    return items;
  });

  const query = seed.trim();
  const filtered = filterPaletteOptions(options, query);
  if (filtered.length === 0) {
    p.log.warn(`No workflows match "${query}"`);
    return null;
  }

  const selection = await p.select({
    message: query ? `Workflows matching "${query}"` : "Workflows",
    options: filtered,
  });

  if (p.isCancel(selection)) return null;
  return String(selection);
}

async function openAdvisorPalette(seed = ""): Promise<string | null> {
  const options = Object.entries(AGENTS).flatMap(([id, agent], index, arr) => {
    const items: Array<{ value: string; label: string; hint?: string; disabled?: boolean }> = [];
    if (index === 0) {
      items.push({ value: "section-advisors", label: "Advisors", disabled: true });
    }
    items.push({ value: `@${id}`, label: `${agent.emoji} ${agent.name}`, hint: agent.description });
    if (index < arr.length - 1) items.push({ value: `spacer-${id}`, label: " ", disabled: true });
    return items;
  });

  const query = seed.trim();
  const filtered = filterPaletteOptions(options, query);
  if (filtered.length === 0) {
    p.log.warn(`No advisors match "${query}"`);
    return null;
  }

  const selection = await p.select({
    message: query ? `Advisors matching "${query}"` : "Advisors",
    options: filtered,
  });

  if (p.isCancel(selection)) return null;
  return String(selection);
}

function showHelp(): void {
  console.log();
  drawBox(
    [
      chalk.bold.white("Navigation"),
      UI.brand("  @consultant    ") + chalk.dim("Switch to Business Consultant"),
      UI.brand("  @marketing     ") + chalk.dim("Switch to Marketing Advisor"),
      UI.brand("  @finance       ") + chalk.dim("Switch to Finance Advisor"),
      UI.brand("  @product       ") + chalk.dim("Switch to Product Advisor"),
      UI.brand("  :              ") + chalk.dim("Open command palette"),
      UI.brand("  /              ") + chalk.dim("Search workflows"),
      UI.brand("  @              ") + chalk.dim("Search advisors"),
      "",
      chalk.bold.white("Agent Communication"),
      UI.brand("  @agent <question>      ") + chalk.dim("Consult another advisor"),
      UI.brand("  ask @agent <question>  ") + chalk.dim("Same as above"),
      UI.brand("  team-sync <topic>      ") + chalk.dim("Get all advisors' input"),
      "",
      chalk.bold.white("Workflows"),
      UI.brand("  /launch-check  ") + chalk.dim("Pre-launch readiness"),
      UI.brand("  /weekly-review ") + chalk.dim("Weekly business review"),
      UI.brand("  /metrics       ") + chalk.dim("Business metrics"),
      UI.brand("  /swot          ") + chalk.dim("SWOT analysis"),
      UI.brand("  /roadmap       ") + chalk.dim("Product roadmap"),
      UI.brand("  /actions       ") + chalk.dim("Action items"),
      UI.brand("  /team-sync     ") + chalk.dim("Multi-advisor sync"),
      "",
      chalk.bold.white("Session"),
      UI.brand("  new, reset   ") + chalk.dim("Start fresh session"),
      UI.brand("  summary      ") + chalk.dim("Show session stats"),
      UI.brand("  history      ") + chalk.dim("Recent conversation"),
      UI.brand("  clear        ") + chalk.dim("Clear screen"),
      UI.brand("  exit, quit   ") + chalk.dim("Exit"),
    ],
    "Help"
  );
  console.log();
}

function showAgents(): void {
  console.log();

  const lines: string[] = [];
  for (const [id, agent] of Object.entries(AGENTS)) {
    const isCurrent = id === currentAgent;
    const prefix = isCurrent ? UI.brand("▶ ") : "  ";
    const name = isCurrent ? chalk.bold(agent.name) : agent.name;
    const docCount = countDocsInFolder(agent.docsFolder);

    lines.push(
      `${prefix}${agent.emoji} ${agent.color(id.padEnd(12))} ${name}`,
      `     ${chalk.dim(agent.description)} · ${chalk.dim(`${docCount} docs`)}`
    );
    if (id !== "product") lines.push("");
  }

  drawBox(lines, "Advisors");
  console.log();
}

function showWorkflows(): void {
  console.log();

  const lines: string[] = [];
  for (const [cmd, wf] of Object.entries(WORKFLOWS)) {
    lines.push(`${wf.emoji} ${UI.brand(cmd.padEnd(16))} ${wf.name}`, `   ${chalk.dim(wf.description)}`);
    if (cmd !== "/actions") lines.push("");
  }

  drawBox(lines, "Workflows");
  console.log();
}

function showSummary(): void {
  if (queryCount === 0) {
    p.log.info(chalk.dim("No queries yet this session"));
    return;
  }

  console.log();
  drawBox(
    [
      chalk.white(`Queries:    ${chalk.bold(queryCount)}`),
      chalk.white(`Total cost: ${chalk.bold(formatCost(totalCost))}`),
      chalk.white(`Avg cost:   ${chalk.bold(formatCost(totalCost / queryCount))}`),
      "",
      chalk.dim(`Session: ${sessionId ? sessionId.slice(0, 8) + "..." : "none"}`),
    ],
    "Session Summary",
    UI.brand
  );
  console.log();
}

function showHistory(): void {
  if (conversationHistory.length === 0) {
    p.log.info(chalk.dim("No conversation history yet"));
    return;
  }

  console.log();
  const recent = conversationHistory.slice(-6);
  drawBox(
    recent.map((h, i) =>
      i % 2 === 0 ? UI.brand("You: ") + h : UI.muted("AI: ") + h.slice(0, 50) + "..."
    ),
    "Recent"
  );
  console.log();
}

function showAgentSwitch(agentId: string): void {
  const agent = AGENTS[agentId];
  console.log();
  console.log(agent.bgColor(` ${agent.emoji} ${agent.name} `));
  console.log();
  console.log(chalk.dim("  Capabilities:"));
  agent.capabilities.forEach((c) => console.log(chalk.dim("  • ") + c));
  console.log();
  console.log(chalk.dim(`  Docs folder: docs/${agent.docsFolder}/ (${countDocsInFolder(agent.docsFolder)} files)`));
  console.log();
}

// ═══════════════════════════════════════════════════════════════════════════
// INTER-AGENT COMMUNICATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Consult another agent without switching context
 * Returns the other agent's response
 */
async function consultAgent(targetAgentId: string, question: string, context?: string): Promise<string> {
  const targetAgent = AGENTS[targetAgentId];
  if (!targetAgent) {
    throw new Error(`Unknown agent: ${targetAgentId}`);
  }

  const fromAgent = AGENTS[currentAgent];

  console.log();
  console.log(
    chalk.dim("─".repeat(50)) +
      "\n" +
      chalk.dim(`${fromAgent.emoji} Consulting `) +
      targetAgent.bgColor(` ${targetAgent.emoji} ${targetAgent.name} `)
  );

  // Build consultation prompt
  const consultPrompt = context
    ? `[Consultation from ${fromAgent.name}]\n\nContext: ${context}\n\nQuestion: ${question}\n\nPlease provide your expert perspective as the ${targetAgent.name}.`
    : `[Consultation from ${fromAgent.name}]\n\nQuestion: ${question}\n\nPlease provide your expert perspective as the ${targetAgent.name}. Be concise but thorough.`;

  const systemPrompt = loadAgentPrompt(targetAgentId);
  const progress = createProgressTracker();
  let responseText = "";

  // Status updates
  const updateStatus = () => {
    const elapsed = formatElapsed(Date.now() - progress.startTime);
    process.stdout.write("\r\x1b[K");
    process.stdout.write(chalk.dim(`${targetAgent.emoji} Thinking · ${elapsed}`));
  };

  updateStatus();
  progress.interval = setInterval(updateStatus, 1000);

  try {
    const q = query({
      prompt: consultPrompt,
      options: {
        // Use the target agent's session if it exists
        ...(agentSessions[targetAgentId] && { resume: agentSessions[targetAgentId] }),
        systemPrompt,
        allowedTools: ["Read", "Glob", "Grep"],
        additionalDirectories: [DOCS_PATH, DATA_PATH, TECH_DOCS_PATH],
        cwd: PROJECT_ROOT,
        settingSources: [],
      },
    });

    let isFirstContent = true;

    for await (const message of q) {
      if (message.type === "system" && "subtype" in message && message.subtype === "init") {
        agentSessions[targetAgentId] = message.session_id;
      }

      if (message.type === "assistant" && "message" in message) {
        const content = message.message.content;
        for (const block of content) {
          if ("text" in block) {
            if (isFirstContent) {
              if (progress.interval) clearInterval(progress.interval);
              process.stdout.write("\r\x1b[K");
              console.log();
              console.log(targetAgent.color(`${targetAgent.emoji} ${targetAgent.name}:`));
              console.log();
              isFirstContent = false;
            }
            process.stdout.write(block.text);
            responseText += block.text;
          }
        }
      }

      if (message.type === "result" && "result" in message) {
        const cost = message.total_cost_usd || 0;
        totalCost += cost;
        queryCount++;

        console.log("\n");
        console.log(chalk.dim("─".repeat(50)));
      }
    }

    if (isFirstContent) {
      if (progress.interval) clearInterval(progress.interval);
      process.stdout.write("\r\x1b[K");
      console.log(chalk.yellow("No response from consultant"));
    }
  } catch (error) {
    if (progress.interval) clearInterval(progress.interval);
    process.stdout.write("\r\x1b[K");
    throw error;
  }

  // Store in shared context
  sharedContext.pendingQuestions.push({
    from: currentAgent,
    to: targetAgentId,
    question,
    answer: responseText,
  });

  return responseText;
}

/**
 * Run a team sync - get perspectives from all advisors
 */
async function runTeamSync(topic: string): Promise<void> {
  console.log();
  console.log(chalk.bold("👥 Team Sync: ") + topic);
  console.log(chalk.dim("─".repeat(50)));
  console.log();

  const responses: Record<string, string> = {};
  const originalAgent = currentAgent;

  for (const [agentId, agent] of Object.entries(AGENTS)) {
    console.log(agent.bgColor(` ${agent.emoji} ${agent.name} `));
    console.log();

    const prompt = `Team sync topic: "${topic}"\n\nProvide your perspective as ${agent.name} in 2-3 concise paragraphs. Focus on your area of expertise.`;
    const systemPrompt = loadAgentPrompt(agentId);

    const progress = createProgressTracker();
    const updateStatus = () => {
      const elapsed = formatElapsed(Date.now() - progress.startTime);
      process.stdout.write("\r\x1b[K");
      process.stdout.write(chalk.dim(`${agent.emoji} Thinking · ${elapsed}`));
    };

    updateStatus();
    progress.interval = setInterval(updateStatus, 1000);

    try {
      const q = query({
        prompt,
        options: {
          ...(agentSessions[agentId] && { resume: agentSessions[agentId] }),
          systemPrompt,
          allowedTools: ["Read", "Glob", "Grep"],
          additionalDirectories: [DOCS_PATH, DATA_PATH],
          cwd: PROJECT_ROOT,
          settingSources: [],
        },
      });

      let responseText = "";
      let isFirstContent = true;

      for await (const message of q) {
        if (message.type === "system" && "subtype" in message && message.subtype === "init") {
          agentSessions[agentId] = message.session_id;
        }

        if (message.type === "assistant" && "message" in message) {
          for (const block of message.message.content) {
            if ("text" in block) {
              if (isFirstContent) {
                if (progress.interval) clearInterval(progress.interval);
                process.stdout.write("\r\x1b[K");
                isFirstContent = false;
              }
              process.stdout.write(block.text);
              responseText += block.text;
            }
          }
        }

        if (message.type === "result" && "result" in message) {
          totalCost += message.total_cost_usd || 0;
          queryCount++;
        }
      }

      if (isFirstContent && progress.interval) {
        clearInterval(progress.interval);
        process.stdout.write("\r\x1b[K");
      }

      responses[agentId] = responseText;
      console.log("\n");
    } catch (error) {
      if (progress.interval) clearInterval(progress.interval);
      console.log(chalk.red(`\nError consulting ${agent.name}`));
    }
  }

  // Summary
  console.log(chalk.dim("═".repeat(50)));
  console.log(chalk.bold("👥 Team Sync Complete"));
  console.log(chalk.dim(`Topic: ${topic}`));
  console.log(chalk.dim(`Advisors consulted: ${Object.keys(responses).length}`));
  console.log(chalk.dim("═".repeat(50)));
  console.log();

  currentAgent = originalAgent;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS TRACKING
// ═══════════════════════════════════════════════════════════════════════════

interface ProgressState {
  startTime: number;
  currentAction: string;
  toolsUsed: string[];
  filesRead: string[];
  interval: NodeJS.Timeout | null;
}

function createProgressTracker(): ProgressState {
  return {
    startTime: Date.now(),
    currentAction: "Thinking",
    toolsUsed: [],
    filesRead: [],
    interval: null,
  };
}

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function getToolEmoji(tool: string): string {
  const emojis: Record<string, string> = {
    Read: "📖",
    Glob: "🔍",
    Grep: "🔎",
    Write: "✏️",
    Edit: "📝",
    WebSearch: "🌐",
    WebFetch: "🌍",
  };
  return emojis[tool] || "🔧";
}

function truncatePath(filePath: string, maxLen = 40): string {
  if (filePath.length <= maxLen) return filePath;
  const parts = filePath.split("/");
  if (parts.length <= 2) return "..." + filePath.slice(-maxLen + 3);
  return ".../" + parts.slice(-2).join("/").slice(-maxLen + 4);
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

async function runQuery(prompt: string): Promise<string> {
  const systemPrompt = loadAgentPrompt(currentAgent);
  let result = "";
  const agent = AGENTS[currentAgent];
  const progress = createProgressTracker();

  // Add to history
  conversationHistory.push(prompt);

  // Status line that updates
  let statusLine = "";
  const updateStatus = () => {
    const elapsed = formatElapsed(Date.now() - progress.startTime);
    const action = progress.currentAction;
    const toolCount = progress.toolsUsed.length;

    // Clear previous line and write new status
    process.stdout.write("\r\x1b[K"); // Clear line
    statusLine =
      chalk.dim(`${agent.emoji} `) +
      chalk.yellow(action) +
      chalk.dim(` · ${elapsed}`) +
      (toolCount > 0 ? chalk.dim(` · ${toolCount} tools used`) : "");
    process.stdout.write(statusLine);
  };

  // Start progress updates
  updateStatus();
  progress.interval = setInterval(updateStatus, 1000);

  try {
    const q = query({
      prompt,
      options: {
        ...(sessionId && { resume: sessionId }),
        systemPrompt,
        allowedTools: ["Read", "Glob", "Grep", "WebSearch", "WebFetch", "Edit", "Write"],
        additionalDirectories: [DOCS_PATH, DATA_PATH, TECH_DOCS_PATH, KNEARME_ROOT],
        cwd: PROJECT_ROOT,
        settingSources: [],
      },
    });

    let isFirstContent = true;
    let responseText = "";

    for await (const message of q) {
      // Session init
      if (message.type === "system" && "subtype" in message && message.subtype === "init") {
        sessionId = message.session_id;
      }

      // Tool use - show what the agent is doing
      if (message.type === "assistant" && "message" in message) {
        const content = message.message.content;

        for (const block of content) {
          // Check for tool use
          if ("type" in block && block.type === "tool_use") {
            const toolBlock = block as { type: string; name: string; input?: Record<string, unknown> };
            const toolName = toolBlock.name;

            if (!progress.toolsUsed.includes(toolName)) {
              progress.toolsUsed.push(toolName);
            }

            // Update current action based on tool
            const emoji = getToolEmoji(toolName);
            let actionDetail = toolName;

            // Extract useful info from tool input
            if (toolBlock.input) {
              if ("file_path" in toolBlock.input) {
                const fp = String(toolBlock.input.file_path);
                actionDetail = `Reading ${truncatePath(fp)}`;
                progress.filesRead.push(fp);
              } else if ("pattern" in toolBlock.input) {
                actionDetail = `Searching: ${String(toolBlock.input.pattern).slice(0, 30)}`;
              } else if ("query" in toolBlock.input) {
                actionDetail = `Web search: ${String(toolBlock.input.query).slice(0, 30)}`;
              } else if ("url" in toolBlock.input) {
                actionDetail = `Fetching URL`;
              }
            }

            progress.currentAction = `${emoji} ${actionDetail}`;
            updateStatus();
          }

          // Text content - start streaming response
          if ("text" in block) {
            if (isFirstContent) {
              // Clear the status line and show response header
              if (progress.interval) {
                clearInterval(progress.interval);
                progress.interval = null;
              }
              process.stdout.write("\r\x1b[K"); // Clear line

              // Show summary of work done
              if (progress.toolsUsed.length > 0 || progress.filesRead.length > 0) {
                const elapsed = formatElapsed(Date.now() - progress.startTime);
                console.log(
                  chalk.dim(
                    `${agent.emoji} Processed in ${elapsed}: ` +
                      progress.toolsUsed.map((t) => `${getToolEmoji(t)}${t}`).join(" ")
                  )
                );
                if (progress.filesRead.length > 0 && progress.filesRead.length <= 5) {
                  progress.filesRead.forEach((f) => {
                    console.log(chalk.dim(`   📄 ${truncatePath(f, 60)}`));
                  });
                } else if (progress.filesRead.length > 5) {
                  console.log(chalk.dim(`   📄 ${progress.filesRead.length} files read`));
                }
                console.log();
              }

              console.log(chalk.dim(`${agent.emoji} Response:`));
              console.log();
              isFirstContent = false;
            }

            process.stdout.write(block.text);
            responseText += block.text;
          }
        }
      }

      // Final result
      if (message.type === "result" && "result" in message) {
        result = message.result;
        const cost = message.total_cost_usd || 0;
        const duration = message.duration_ms || Date.now() - progress.startTime;

        totalCost += cost;
        queryCount++;

        // Add truncated response to history
        conversationHistory.push(responseText.slice(0, 100));

        console.log("\n");
        console.log(
          chalk.dim("─".repeat(50)) +
            "\n" +
            chalk.green("✓ ") +
            chalk.dim(`${formatCost(cost)} · ${formatDuration(duration)}`) +
            chalk.dim(` · ${progress.toolsUsed.length} tools`) +
            (sessionId ? chalk.dim.italic(" · session active") : "")
        );
      }
    }

    if (isFirstContent) {
      if (progress.interval) {
        clearInterval(progress.interval);
      }
      process.stdout.write("\r\x1b[K");
      console.log(chalk.yellow("No response received"));
    }
  } catch (error) {
    if (progress.interval) {
      clearInterval(progress.interval);
    }
    process.stdout.write("\r\x1b[K");
    console.log(chalk.red("Error occurred"));
    throw error;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════════════════

async function runInteractive(): Promise<void> {
  showWelcome();

  while (true) {
    const agent = AGENTS[currentAgent];

    const input = await p.text({
      message: `${agent.emoji} ${agent.color(agent.name)}`,
      placeholder: "Ask a question, /workflow, @advisor, or : palette",
      validate: (v) => (!v ? "Enter a question or command" : undefined),
    });

    if (p.isCancel(input)) {
      showSummary();
      p.outro(chalk.dim("Goodbye! 👋"));
      process.exit(0);
    }

    let trimmed = (input as string).trim();
    let lower = trimmed.toLowerCase();

    if ([":", "palette", "cmd"].includes(lower)) {
      const selected = await openCommandPalette();
      if (!selected) {
        console.log();
        continue;
      }
      trimmed = selected;
      lower = trimmed.toLowerCase();
      console.log(UI.muted(`→ ${trimmed}`));
    }

    const workflowExact = Object.keys(WORKFLOWS).find((k) => lower === k || lower === k.slice(1));
    if (!workflowExact && trimmed.startsWith("/")) {
      const seed = trimmed.slice(1);
      const selected = await openWorkflowPalette(seed);
      if (!selected) {
        console.log();
        continue;
      }
      trimmed = selected;
      lower = trimmed.toLowerCase();
      console.log(UI.muted(`→ ${trimmed}`));
    }

    if (trimmed === "@" || (trimmed.startsWith("@") && !lower.includes(" "))) {
      const candidate = trimmed.slice(1).toLowerCase();
      if (!candidate || !AGENTS[candidate]) {
        const selected = await openAdvisorPalette(candidate);
        if (!selected) {
          console.log();
          continue;
        }
        trimmed = selected;
        lower = trimmed.toLowerCase();
        console.log(UI.muted(`→ ${trimmed}`));
      }
    }

    // ─── Exit ───
    if (["exit", "quit", "q"].includes(lower)) {
      showSummary();
      p.outro(chalk.dim("Goodbye! 👋"));
      break;
    }

    // ─── Session commands ───
    if (["new", "reset"].includes(lower)) {
      sessionId = undefined;
      conversationHistory = [];
      p.log.success("New session started");
      continue;
    }

    if (["summary", "stats"].includes(lower)) {
      showSummary();
      continue;
    }

    if (lower === "history") {
      showHistory();
      continue;
    }

    if (["clear", "cls"].includes(lower)) {
      showHeader();
      continue;
    }

    // ─── Help ───
    if (["help", "?", "h"].includes(lower)) {
      showHelp();
      continue;
    }

    // ─── List workflows ───
    if (["workflows", "/workflows", "wf"].includes(lower)) {
      showWorkflows();
      continue;
    }

    // ─── List agents ───
    if (["advisors", "agents", "@", "a"].includes(lower)) {
      showAgents();
      continue;
    }

    // ─── Switch agent ───
    if (lower.startsWith("@") && !lower.includes(" ")) {
      const agentId = lower.slice(1);
      if (AGENTS[agentId]) {
        currentAgent = agentId;
        sessionId = agentSessions[agentId];
        conversationHistory = [];
        showAgentSwitch(agentId);
        continue;
      } else {
        p.log.warn(`Unknown: ${agentId}. Try: @consultant, @marketing, @finance, @product`);
        continue;
      }
    }

    // ─── Consult another agent (ask @agent question) ───
    const consultMatch = trimmed.match(/^(?:ask\s+)?@(\w+)\s+(.+)$/i);
    if (consultMatch) {
      const [, targetAgent, question] = consultMatch;
      if (AGENTS[targetAgent.toLowerCase()]) {
        try {
          await consultAgent(targetAgent.toLowerCase(), question);
        } catch (error) {
          p.log.error(`Consultation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
        console.log();
        continue;
      }
    }

    // ─── Team sync ───
    if (lower.startsWith("team-sync ") || lower.startsWith("/team-sync ")) {
      const topic = trimmed.replace(/^\/?(team-sync)\s+/i, "");
      await runTeamSync(topic);
      continue;
    }

    // ─── Run workflow ───
    const workflowKey = Object.keys(WORKFLOWS).find((k) => lower === k || lower === k.slice(1));
    if (workflowKey) {
      const wf = WORKFLOWS[workflowKey];
      console.log();
      console.log(chalk.dim("─".repeat(50)));
      console.log(`${wf.emoji} ${chalk.bold(wf.name)}`);
      console.log(chalk.dim("─".repeat(50)));
      console.log();

      try {
        await runQuery(wf.prompt);
      } catch (error) {
        p.log.error(`Failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      console.log();
      continue;
    }

    // ─── Regular query ───
    console.log();
    try {
      await runQuery(trimmed);
    } catch (error) {
      p.log.error(`Failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    console.log();
  }
}

async function runSingleQuery(prompt: string, agentId?: string): Promise<void> {
  if (agentId && AGENTS[agentId]) {
    currentAgent = agentId;
  }

  const agent = AGENTS[currentAgent];
  console.log();
  console.log(agent.bgColor(` ${agent.emoji} ${agent.name} `));
  console.log();

  const workflowKey = Object.keys(WORKFLOWS).find((k) => prompt.toLowerCase() === k || prompt.toLowerCase() === k.slice(1));

  try {
    if (workflowKey) {
      const wf = WORKFLOWS[workflowKey];
      console.log(`${wf.emoji} ${chalk.bold(wf.name)}`);
      console.log();
      await runQuery(wf.prompt);
    } else {
      await runQuery(prompt);
    }
  } catch (error) {
    p.log.error(`Failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  console.log();
  p.outro(chalk.dim("Done"));
}

function parseArgs(): { prompt?: string; agent?: string } {
  const args = process.argv.slice(2);
  let agent: string | undefined;
  const promptParts: string[] = [];

  for (const arg of args) {
    if (arg.startsWith("--")) {
      const agentId = arg.slice(2);
      if (AGENTS[agentId]) agent = agentId;
    } else {
      promptParts.push(arg);
    }
  }

  return {
    prompt: promptParts.length > 0 ? promptParts.join(" ") : undefined,
    agent,
  };
}

async function main(): Promise<void> {
  const { prompt, agent } = parseArgs();

  if (prompt) {
    await runSingleQuery(prompt, agent);
  } else {
    if (agent) currentAgent = agent;
    await runInteractive();
  }
}

main().catch((error) => {
  p.log.error(`Fatal: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
