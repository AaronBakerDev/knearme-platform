import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Text, render, useApp, useInput, useStdout } from "ink";
import TextInput from "ink-text-input";
import { query } from "@anthropic-ai/claude-agent-sdk";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const KNEARME_ROOT = path.resolve(PROJECT_ROOT, "..");
const PORTFOLIO_ROOT = path.join(KNEARME_ROOT, "knearme-portfolio");
const DOCS_PATH = path.join(PROJECT_ROOT, "docs");
const TECH_DOCS_PATH = path.join(PORTFOLIO_ROOT, "docs");
const DATA_PATH = path.join(PROJECT_ROOT, "data");
const CONFIG_PATH = path.join(PROJECT_ROOT, "config");

interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  color: string;
  promptFile: string;
  description: string;
  docsFolder: string;
  capabilities: string[];
}

const AGENTS: Record<string, AgentConfig> = {
  consultant: {
    id: "consultant",
    name: "Business Consultant",
    emoji: "💼",
    color: "#0f766e",
    promptFile: "system-prompt.md",
    description: "Strategic business advisor",
    docsFolder: "strategy",
    capabilities: ["Business strategy", "Vision & planning", "Cross-functional alignment"],
  },
  marketing: {
    id: "marketing",
    name: "Marketing Advisor",
    emoji: "📣",
    color: "#c2410c",
    promptFile: "agents/marketing.md",
    description: "Acquisition & growth",
    docsFolder: "marketing",
    capabilities: ["SEO strategy", "Contractor acquisition", "Messaging & positioning"],
  },
  finance: {
    id: "finance",
    name: "Finance Advisor",
    emoji: "💰",
    color: "#15803d",
    promptFile: "agents/finance.md",
    description: "Unit economics & pricing",
    docsFolder: "finance",
    capabilities: ["Pricing strategy", "LTV/CAC modeling", "Revenue projections"],
  },
  product: {
    id: "product",
    name: "Product Advisor",
    emoji: "🎯",
    color: "#1d4ed8",
    promptFile: "agents/product.md",
    description: "Features & roadmap",
    docsFolder: "product",
    capabilities: ["Feature prioritization", "Roadmap planning", "User experience"],
  },
};

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

type Role = "user" | "assistant" | "system";

interface Message {
  id: string;
  role: Role;
  content: string;
  agentId?: string;
}

type PaletteType = "command" | "workflow" | "advisor";

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  kind: PaletteType | "command";
  value: string;
}

interface PaletteState {
  open: boolean;
  type: PaletteType;
  query: string;
  index: number;
}

const PALETTE_INITIAL: PaletteState = { open: false, type: "command", query: "", index: 0 };

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

function countDocsInFolder(folder: string): number {
  const folderPath = path.join(DOCS_PATH, folder);
  try {
    const files = fs.readdirSync(folderPath, { recursive: true });
    return (files as string[]).filter((f) => f.endsWith(".md")).length;
  } catch {
    return 0;
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(0);
  return `${mins}m ${secs}s`;
}

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
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

function truncatePath(filePath: string, maxLen = 42): string {
  if (filePath.length <= maxLen) return filePath;
  const parts = filePath.split("/");
  if (parts.length <= 2) return "..." + filePath.slice(-maxLen + 3);
  return ".../" + parts.slice(-2).join("/").slice(-maxLen + 4);
}

function getRecentMemory(): string | null {
  try {
    const memoryPath = path.join(DATA_PATH, "memory.md");
    const content = fs.readFileSync(memoryPath, "utf-8");
    return content.split("\n").slice(0, 6).join("\n");
  } catch {
    return null;
  }
}

const commandPaletteItems: PaletteItem[] = [
  { id: "weekly-review", label: "📅 Weekly Review", hint: "Structured check-in", kind: "workflow", value: "/weekly-review" },
  { id: "actions", label: "✅ Action Items", hint: "Review TODOs", kind: "workflow", value: "/actions" },
  { id: "metrics", label: "📊 Metrics Dashboard", hint: "Key business metrics", kind: "workflow", value: "/metrics" },
  { id: "roadmap", label: "🗺️ Product Roadmap", hint: "Roadmap overview", kind: "workflow", value: "/roadmap" },
  { id: "launch-check", label: "🚀 Launch Check", hint: "Pre-launch readiness", kind: "workflow", value: "/launch-check" },
  { id: "swot", label: "🔍 SWOT Analysis", hint: "Strengths and weaknesses", kind: "workflow", value: "/swot" },
  { id: "team-sync", label: "👥 Team Sync", hint: "All advisors input", kind: "command", value: "team-sync" },
  { id: "consultant", label: "💼 Business Consultant", hint: "Switch advisor", kind: "advisor", value: "consultant" },
  { id: "marketing", label: "📣 Marketing Advisor", hint: "Switch advisor", kind: "advisor", value: "marketing" },
  { id: "finance", label: "💰 Finance Advisor", hint: "Switch advisor", kind: "advisor", value: "finance" },
  { id: "product", label: "🎯 Product Advisor", hint: "Switch advisor", kind: "advisor", value: "product" },
  { id: "summary", label: "Session Summary", hint: "Usage stats", kind: "command", value: "summary" },
  { id: "history", label: "Recent History", hint: "Last exchanges", kind: "command", value: "history" },
  { id: "new", label: "New Session", hint: "Reset conversation", kind: "command", value: "new" },
  { id: "clear", label: "Clear Screen", hint: "Clear log", kind: "command", value: "clear" },
  { id: "help", label: "Help", hint: "All commands", kind: "command", value: "help" },
  { id: "exit", label: "Exit", hint: "Close the app", kind: "command", value: "exit" },
];

function filterPalette(items: PaletteItem[], query: string): PaletteItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => {
    const haystack = `${item.value} ${item.label} ${item.hint ?? ""}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

interface AppProps {
  initialPrompt?: string;
  initialAgent?: string;
}

const THEME = {
  accent: "#38bdf8",
  accentAlt: "#22d3ee",
  warm: "#f97316",
  primary: "#e2e8f0",
  secondary: "#cbd5e1",
  muted: "#94a3b8",
  panel: "#475569",
};

const StatText: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <Text>
    <Text color={THEME.muted}>{label} </Text>
    <Text color={color ?? THEME.primary}>{value}</Text>
  </Text>
);

const App: React.FC<AppProps> = ({ initialPrompt, initialAgent }) => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [currentAgent, setCurrentAgent] = useState(initialAgent && AGENTS[initialAgent] ? initialAgent : "consultant");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const agentSessionsRef = useRef<Record<string, string | undefined>>({});
  const [totalCost, setTotalCost] = useState(0);
  const [queryCount, setQueryCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState("Idle");
  const [toolCount, setToolCount] = useState(0);
  const [elapsed, setElapsed] = useState("0s");
  const [palette, setPalette] = useState<PaletteState>(PALETTE_INITIAL);
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const counts: Record<string, number> = {};
    for (const agent of Object.values(AGENTS)) {
      counts[agent.id] = countDocsInFolder(agent.docsFolder);
    }
    setDocCounts(counts);
  }, []);

  useEffect(() => {
    if (!isProcessing) {
      setElapsed("0s");
      return;
    }
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(formatElapsed(Date.now() - startTimeRef.current));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  useEffect(() => {
    const memory = getRecentMemory();
    const intro = [
      "Welcome back. Type / for workflows, @ for advisors, : for the palette.",
      memory ? "" : undefined,
      memory ? "Recent memory:" : undefined,
      memory || undefined,
    ]
      .filter(Boolean)
      .join("\n");
    setMessages([{ id: randomUUID(), role: "system", content: intro }]);
  }, []);

  const addMessage = useCallback((role: Role, content: string, agentId?: string) => {
    const id = randomUUID();
    setMessages((prev) => [...prev, { id, role, content, agentId }]);
    return id;
  }, []);

  const updateMessage = useCallback((id: string, append: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, content: msg.content + append } : msg))
    );
  }, []);

  const openPalette = useCallback((type: PaletteType, seed = "") => {
    setPalette({ open: true, type, query: seed, index: 0 });
  }, []);

  const closePalette = useCallback(() => {
    setPalette(PALETTE_INITIAL);
  }, []);

  const paletteItems = useMemo(() => {
    if (palette.type === "command") return filterPalette(commandPaletteItems, palette.query);
    if (palette.type === "workflow") {
      const items: PaletteItem[] = Object.entries(WORKFLOWS).map(([key, wf]) => ({
        id: key,
        label: `${wf.emoji} ${wf.name}`,
        hint: wf.description,
        kind: "workflow",
        value: key,
      }));
      return filterPalette(items, palette.query);
    }
    const items: PaletteItem[] = Object.entries(AGENTS).map(([key, agent]) => ({
      id: key,
      label: `${agent.emoji} ${agent.name}`,
      hint: agent.description,
      kind: "advisor",
      value: key,
    }));
    return filterPalette(items, palette.query);
  }, [palette.type, palette.query]);

  useEffect(() => {
    if (!palette.open) return;
    if (palette.index >= paletteItems.length) {
      setPalette((prev) => ({ ...prev, index: 0 }));
    }
  }, [palette.index, paletteItems.length, palette.open]);

  useInput((inputKey, key) => {
    if (!palette.open) return;

    if (key.escape) {
      closePalette();
      return;
    }

    if (key.upArrow) {
      setPalette((prev) => ({
        ...prev,
        index: paletteItems.length ? (prev.index - 1 + paletteItems.length) % paletteItems.length : 0,
      }));
      return;
    }

    if (key.downArrow) {
      setPalette((prev) => ({
        ...prev,
        index: paletteItems.length ? (prev.index + 1) % paletteItems.length : 0,
      }));
      return;
    }

    if (key.return) {
      const selected = paletteItems[palette.index];
      if (selected) {
        handlePaletteSelect(selected);
      }
      return;
    }

    if (key.backspace || key.delete) {
      setPalette((prev) => ({ ...prev, query: prev.query.slice(0, -1), index: 0 }));
      return;
    }

    if (inputKey && !key.ctrl && !key.meta) {
      setPalette((prev) => ({ ...prev, query: prev.query + inputKey, index: 0 }));
    }
  });

  const executeQuery = useCallback(
    async (prompt: string, agentId: string, allowedTools: string[], label?: string) => {
      const agent = AGENTS[agentId];
      const systemPrompt = loadAgentPrompt(agentId);
      const messageId = addMessage("assistant", "", agentId);
      let responseText = "";
      let toolsUsed = new Set<string>();

      const q = query({
        prompt,
        options: {
          ...(agentSessionsRef.current[agentId] && { resume: agentSessionsRef.current[agentId] }),
          systemPrompt,
          allowedTools,
          additionalDirectories: [DOCS_PATH, DATA_PATH, TECH_DOCS_PATH, KNEARME_ROOT],
          cwd: PROJECT_ROOT,
          settingSources: [],
        },
      });

      let isFirstText = true;

      for await (const message of q) {
        if (message.type === "system" && "subtype" in message && message.subtype === "init") {
          agentSessionsRef.current[agentId] = message.session_id;
          if (agentId === currentAgent) {
            setSessionId(message.session_id);
          }
        }

        if (message.type === "assistant" && "message" in message) {
          for (const block of message.message.content) {
            if ("type" in block && block.type === "tool_use") {
              const toolBlock = block as { type: string; name: string; input?: Record<string, unknown> };
              const toolName = toolBlock.name;
              toolsUsed.add(toolName);
              setToolCount(toolsUsed.size);

              let actionDetail = toolName;
              if (toolBlock.input) {
                if ("file_path" in toolBlock.input) {
                  const fp = String(toolBlock.input.file_path);
                  actionDetail = `Reading ${truncatePath(fp)}`;
                } else if ("pattern" in toolBlock.input) {
                  actionDetail = `Searching ${String(toolBlock.input.pattern).slice(0, 32)}`;
                } else if ("query" in toolBlock.input) {
                  actionDetail = `Web search ${String(toolBlock.input.query).slice(0, 32)}`;
                } else if ("url" in toolBlock.input) {
                  actionDetail = `Fetching URL`;
                }
              }
              setCurrentAction(`${getToolEmoji(toolName)} ${actionDetail}`);
            }

            if ("text" in block) {
              if (isFirstText) {
                setCurrentAction(label ? `Responding · ${label}` : "Responding");
                isFirstText = false;
              }
              updateMessage(messageId, block.text);
              responseText += block.text;
            }
          }
        }

        if (message.type === "result" && "result" in message) {
          const cost = message.total_cost_usd || 0;
          const duration = message.duration_ms || (startTimeRef.current ? Date.now() - startTimeRef.current : 0);
          setTotalCost((prev) => prev + cost);
          setQueryCount((prev) => prev + 1);
          addMessage(
            "system",
            `${agent.emoji} Done · ${formatCost(cost)} · ${formatDuration(duration)} · ${toolsUsed.size} tools`,
            agentId
          );
        }
      }

      if (!responseText) {
        updateMessage(messageId, "No response received.");
      }
    },
    [addMessage, currentAgent, updateMessage]
  );

  const runQuery = useCallback(
    async (prompt: string) => {
      setIsProcessing(true);
      setToolCount(0);
      setCurrentAction("Thinking");
      startTimeRef.current = Date.now();
      await executeQuery(prompt, currentAgent, ["Read", "Glob", "Grep", "WebSearch", "WebFetch", "Edit", "Write"], AGENTS[currentAgent].name);
      setIsProcessing(false);
      setCurrentAction("Idle");
    },
    [currentAgent, executeQuery]
  );

  const runConsult = useCallback(
    async (agentId: string, question: string) => {
      const target = AGENTS[agentId];
      addMessage("system", `Consulting ${target.emoji} ${target.name}...`);
      setIsProcessing(true);
      setToolCount(0);
      setCurrentAction(`Consulting ${target.name}`);
      startTimeRef.current = Date.now();
      await executeQuery(
        `[Consultation]\n\nQuestion: ${question}\n\nPlease provide your expert perspective as ${target.name}.`,
        agentId,
        ["Read", "Glob", "Grep"]
      );
      setIsProcessing(false);
      setCurrentAction("Idle");
    },
    [executeQuery, addMessage]
  );

  const runTeamSync = useCallback(
    async (topic: string) => {
      addMessage("system", `Team sync: ${topic}`);
      setIsProcessing(true);
      setToolCount(0);
      setCurrentAction("Team sync");
      startTimeRef.current = Date.now();

      for (const [agentId, agent] of Object.entries(AGENTS)) {
        setCurrentAction(`Consulting ${agent.name}`);
        await executeQuery(
          `Team sync topic: "${topic}"\n\nProvide your perspective as ${agent.name} in 2-3 concise paragraphs. Focus on your area of expertise.`,
          agentId,
          ["Read", "Glob", "Grep"]
        );
      }

      setIsProcessing(false);
      setCurrentAction("Idle");
    },
    [executeQuery, addMessage]
  );

  const showHelp = useCallback(() => {
    const help = [
      "Commands:",
      "  /launch-check  /weekly-review  /metrics  /swot  /roadmap  /actions  /team-sync",
      "  @consultant  @marketing  @finance  @product",
      "  ask @agent <question>",
      "  team-sync <topic>",
      "  new  reset  summary  history  clear  exit",
      "  : opens command palette",
      "  / opens workflow search, @ opens advisor search",
    ].join("\n");
    addMessage("system", help);
  }, [addMessage]);

  const showWorkflows = useCallback(() => {
    const lines = Object.entries(WORKFLOWS)
      .map(([key, wf]) => `${wf.emoji} ${key} — ${wf.description}`)
      .join("\n");
    addMessage("system", lines);
  }, [addMessage]);

  const showAgents = useCallback(() => {
    const lines = Object.entries(AGENTS)
      .map(([key, agent]) => `${agent.emoji} @${key} — ${agent.description}`)
      .join("\n");
    addMessage("system", lines);
  }, [addMessage]);

  const showSummary = useCallback(() => {
    if (queryCount === 0) {
      addMessage("system", "No queries yet this session.");
      return;
    }
    const summary = [
      `Queries: ${queryCount}`,
      `Total cost: ${formatCost(totalCost)}`,
      `Avg cost: ${formatCost(totalCost / queryCount)}`,
      `Session: ${sessionId ? sessionId.slice(0, 8) + "..." : "none"}`,
    ].join("\n");
    addMessage("system", summary);
  }, [addMessage, queryCount, totalCost, sessionId]);

  const showHistory = useCallback(() => {
    const recent = messages.slice(-8).map((msg) => `${msg.role.toUpperCase()}: ${msg.content.slice(0, 100)}`);
    addMessage("system", recent.length ? recent.join("\n") : "No history yet.");
  }, [addMessage, messages]);

  const handleCommand = useCallback(
    async (commandText: string) => {
      const trimmed = commandText.trim();
      const lower = trimmed.toLowerCase();

      if (!trimmed) return;

      if (["exit", "quit", "q"].includes(lower)) {
        showSummary();
        exit();
        return;
      }

      if (["help", "?", "h"].includes(lower)) {
        showHelp();
        return;
      }

      if (["workflows", "/workflows", "wf"].includes(lower)) {
        showWorkflows();
        return;
      }

      if (["advisors", "agents", "@", "a"].includes(lower)) {
        showAgents();
        return;
      }

      if (["new", "reset"].includes(lower)) {
        setSessionId(undefined);
        setMessages([]);
        addMessage("system", "New session started.");
        return;
      }

      if (["summary", "stats"].includes(lower)) {
        showSummary();
        return;
      }

      if (lower === "history") {
        showHistory();
        return;
      }

      if (["clear", "cls"].includes(lower)) {
        setMessages([]);
        addMessage("system", "Cleared.");
        return;
      }

      if (lower.startsWith("team-sync ") || lower.startsWith("/team-sync ")) {
        const topic = trimmed.replace(/^\/?(team-sync)\s+/i, "");
        await runTeamSync(topic);
        return;
      }

      const consultMatch = trimmed.match(/^(?:ask\s+)?@(\w+)\s+(.+)$/i);
      if (consultMatch) {
        const [, targetAgent, question] = consultMatch;
        const agentKey = targetAgent.toLowerCase();
        if (AGENTS[agentKey]) {
          await runConsult(agentKey, question);
        } else {
          addMessage("system", `Unknown advisor: ${targetAgent}`);
        }
        return;
      }

      if (lower.startsWith("@") && !lower.includes(" ")) {
        const agentKey = lower.slice(1);
        if (AGENTS[agentKey]) {
          setCurrentAgent(agentKey);
          setSessionId(agentSessionsRef.current[agentKey]);
          addMessage("system", `Switched to ${AGENTS[agentKey].name}.`);
          return;
        }
      }

      const workflowKey = Object.keys(WORKFLOWS).find((k) => lower === k || lower === k.slice(1));
      if (workflowKey) {
        const wf = WORKFLOWS[workflowKey];
        addMessage("user", `${wf.emoji} ${wf.name}`);
        await runQuery(wf.prompt);
        return;
      }

      addMessage("user", trimmed);
      await runQuery(trimmed);
    },
    [addMessage, exit, runQuery, runConsult, runTeamSync, showAgents, showHelp, showHistory, showSummary, showWorkflows]
  );

  const handlePaletteSelect = useCallback(
    (item: PaletteItem) => {
      closePalette();
      if (item.kind === "advisor") {
        setInput(`@${item.value} `);
        return;
      }
      if (item.kind === "workflow") {
        void handleCommand(item.value);
        return;
      }
      if (item.value === "team-sync") {
        setInput("team-sync ");
        return;
      }
      void handleCommand(item.value);
    },
    [closePalette, handleCommand]
  );

  const handleSubmit = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      setInput("");

      if (trimmed === ":") {
        openPalette("command");
        return;
      }

      if (trimmed.startsWith("/") && !Object.keys(WORKFLOWS).some((k) => k === trimmed || k === `/${trimmed.slice(1)}`)) {
        openPalette("workflow", trimmed.slice(1));
        return;
      }

      if (trimmed.startsWith("@") && !trimmed.includes(" ") && !AGENTS[trimmed.slice(1)]) {
        openPalette("advisor", trimmed.slice(1));
        return;
      }

      await handleCommand(trimmed);
    },
    [handleCommand, openPalette]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      if (palette.open || isProcessing) {
        setInput(value);
        return;
      }
      if (value === "/") {
        openPalette("workflow");
        setInput("");
        return;
      }
      if (value === "@") {
        openPalette("advisor");
        setInput("");
        return;
      }
      if (value === ":") {
        openPalette("command");
        setInput("");
        return;
      }
      setInput(value);
    },
    [palette.open, isProcessing, openPalette]
  );

  useEffect(() => {
    if (!initialPrompt) return;
    void handleCommand(initialPrompt).then(() => {
      exit();
    });
  }, [initialPrompt, handleCommand, exit]);

  const maxRows = stdout?.rows || 24;
  const visibleMessages = useMemo(() => messages.slice(-Math.max(12, maxRows - 8)), [messages, maxRows]);

  const renderMessage = (message: Message) => {
    if (message.role === "system") {
      return (
        <Box flexDirection="column">
          {message.content.split("\n").map((line, idx) => (
            <Text key={`${message.id}-line-${idx}`} color={THEME.secondary}>
              {line}
            </Text>
          ))}
        </Box>
      );
    }
    if (message.role === "user") {
      return (
        <Text color={THEME.accent}>
          › You: {message.content}
        </Text>
      );
    }
    const agent = AGENTS[message.agentId ?? currentAgent];
    return (
      <Text color={agent?.color ?? THEME.primary}>
        › {agent?.emoji ?? "🤖"} {agent?.name ?? "Advisor"}: {message.content}
      </Text>
    );
  };

  const width = stdout?.columns || 80;
  const divider = "─".repeat(Math.max(24, Math.min(120, width - 4)));

  return (
    <Box flexDirection="column" paddingX={2}>
      <Box flexDirection="column" marginTop={1}>
        <Text color={AGENTS[currentAgent].color}>
          {AGENTS[currentAgent].emoji} {AGENTS[currentAgent].name}{" "}
          <Text color={THEME.secondary}>KnearMe Business Advisor</Text>
        </Text>
        <Box marginTop={1} flexWrap="wrap">
          <StatText label="Session" value={sessionId ? "●" : "○"} color={sessionId ? THEME.accent : THEME.warm} />
          <Text color={THEME.muted}> · </Text>
          <StatText label="Queries" value={String(queryCount)} />
          <Text color={THEME.muted}> · </Text>
          <StatText label="Cost" value={formatCost(totalCost)} />
          <Text color={THEME.muted}> · </Text>
          <StatText label="Docs" value={`${docCounts[currentAgent] ?? 0} · ${AGENTS[currentAgent].docsFolder}/`} />
        </Box>
        {isProcessing && (
          <Box marginTop={1} flexWrap="wrap">
            <StatText label="Action" value={currentAction} color={THEME.accentAlt} />
            <Text color={THEME.muted}> · </Text>
            <StatText label="Elapsed" value={elapsed} />
            <Text color={THEME.muted}> · </Text>
            <StatText label="Tools" value={String(toolCount)} />
          </Box>
        )}
        <Text color={THEME.panel}>{divider}</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text color={THEME.secondary}>Conversation</Text>
        {visibleMessages.map((msg) => (
          <Box key={msg.id} marginTop={1}>
            {renderMessage(msg)}
          </Box>
        ))}
      </Box>

      {!palette.open && !initialPrompt && !isProcessing && (
        <Box marginTop={1} flexDirection="column">
          <Text color={THEME.secondary}>/ workflows · @ advisors · : commands · Esc closes palette</Text>
          <Box marginTop={1}>
            <Text color={THEME.secondary}>{AGENTS[currentAgent].emoji} </Text>
            <TextInput
              value={input}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              placeholder="Ask a question, /workflow, @advisor, or : palette"
            />
          </Box>
        </Box>
      )}

      {!palette.open && !initialPrompt && isProcessing && (
        <Box marginTop={1}>
          <Text color={THEME.muted}>Processing...</Text>
        </Box>
      )}

      {palette.open && (
        <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor={THEME.accentAlt} paddingX={2} paddingY={1}>
          <Text color={THEME.accentAlt}>
            {palette.type === "command" && "Command palette"}
            {palette.type === "workflow" && "Workflow search"}
            {palette.type === "advisor" && "Advisor search"}
          </Text>
          <Text color={THEME.secondary}>Search: {palette.query || "..."}</Text>
          {paletteItems.length === 0 && <Text color={THEME.warm}>No matches</Text>}
          {paletteItems.map((item, index) => {
            const isActive = index === palette.index;
            return (
              <Box key={item.id} marginTop={1}>
                <Text color={isActive ? "black" : THEME.primary} backgroundColor={isActive ? THEME.accentAlt : undefined}>
                  {item.label}
                </Text>
                {item.hint && (
                  <Text color={isActive ? "black" : THEME.muted}>
                    {" "}
                    — {item.hint}
                  </Text>
                )}
              </Box>
            );
          })}
          <Text color={THEME.secondary}>Enter to select · Esc to cancel · Type to filter</Text>
        </Box>
      )}
    </Box>
  );
};

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

const { prompt, agent } = parseArgs();

render(<App initialPrompt={prompt} initialAgent={agent} />);
