/**
 * KnearMe Business Consultant Agent (Codex SDK Version)
 *
 * A strategic business advisor powered by OpenAI Codex SDK.
 * Uses GPT-5.2-Codex (or O3/O4-mini) for advanced reasoning.
 *
 * Usage:
 *   npm start                           # Interactive mode
 *   npm start "What's our pricing?"     # Single query mode
 *
 * Environment:
 *   OPENAI_API_KEY - Your OpenAI API key (required)
 */

import { Codex } from "@openai/codex-sdk";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const PROJECT_ROOT = path.resolve(__dirname, "..");
const KNEARME_ROOT = path.resolve(PROJECT_ROOT, "..");
const DOCS_PATH = path.join(KNEARME_ROOT, "knearme-portfolio", "docs");
const DATA_PATH = path.join(PROJECT_ROOT, "data");
const SYSTEM_PROMPT_PATH = path.join(PROJECT_ROOT, "config", "system-prompt.md");
const MANAGER_PROMPT_PATH = path.join(PROJECT_ROOT, "config", "manager-prompt.md");
const MEMORY_PATH = path.join(DATA_PATH, "memory.md");

type Lane =
  | "strategy"
  | "product_engineering"
  | "growth_marketing"
  | "sales"
  | "customer_success"
  | "operations"
  | "finance_legal"
  | "people";

type Autonomy = "observe" | "draft" | "auto" | "full";

type Classification = {
  lane: Lane;
  autonomy: Autonomy;
  escalate: boolean;
  escalation_reason: string;
  handoff_summary: string;
  questions: string[];
};

const ROLE_PROMPT_PATHS: Record<Lane, string> = {
  strategy: path.join(PROJECT_ROOT, "config", "roles", "strategy.md"),
  product_engineering: path.join(PROJECT_ROOT, "config", "roles", "product-engineering.md"),
  growth_marketing: path.join(PROJECT_ROOT, "config", "roles", "growth-marketing.md"),
  sales: path.join(PROJECT_ROOT, "config", "roles", "sales.md"),
  customer_success: path.join(PROJECT_ROOT, "config", "roles", "customer-success.md"),
  operations: path.join(PROJECT_ROOT, "config", "roles", "operations.md"),
  finance_legal: path.join(PROJECT_ROOT, "config", "roles", "finance-legal.md"),
  people: path.join(PROJECT_ROOT, "config", "roles", "people.md"),
};

function loadTextFile(filePath: string, fallback: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    console.error("Warning: Could not load file from", filePath);
    return fallback;
  }
}

// Load system prompt
function loadSystemPrompt(): string {
  return loadTextFile(SYSTEM_PROMPT_PATH, "You are a business consultant for KnearMe.");
}

function loadRolePrompt(lane: Lane): string {
  return loadTextFile(ROLE_PROMPT_PATHS[lane], loadSystemPrompt());
}

function loadManagerPrompt(): string {
  return loadTextFile(MANAGER_PROMPT_PATH, "You are a routing manager. Return JSON only.");
}

function loadMemory(): string {
  return loadTextFile(MEMORY_PATH, "# Memory not available");
}

// Initialize Codex client
const codex = new Codex();

// Thread state for session continuity
const laneThreads = new Map<Lane, ReturnType<typeof codex.startThread>>();

function getLaneThread(lane: Lane): ReturnType<typeof codex.startThread> {
  const existing = laneThreads.get(lane);
  if (existing) {
    return existing;
  }
  const thread = codex.startThread({
    workingDirectory: PROJECT_ROOT,
    skipGitRepoCheck: true,
  });
  laneThreads.set(lane, thread);
  return thread;
}

function resetAllThreads(): void {
  laneThreads.clear();
}

function extractJson(text: string): Classification | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Classification;
  } catch {
    return null;
  }
}

function normalizeClassification(raw: Classification | null): Classification {
  const fallback: Classification = {
    lane: "strategy",
    autonomy: "draft",
    escalate: false,
    escalation_reason: "",
    handoff_summary: "Defaulted to strategy lane.",
    questions: [],
  };

  if (!raw) return fallback;

  const lanes: Lane[] = [
    "strategy",
    "product_engineering",
    "growth_marketing",
    "sales",
    "customer_success",
    "operations",
    "finance_legal",
    "people",
  ];

  const autonomyLevels: Autonomy[] = ["observe", "draft", "auto", "full"];

  return {
    lane: lanes.includes(raw.lane) ? raw.lane : "strategy",
    autonomy: autonomyLevels.includes(raw.autonomy) ? raw.autonomy : "draft",
    escalate: Boolean(raw.escalate),
    escalation_reason: raw.escalation_reason || "",
    handoff_summary: raw.handoff_summary || "",
    questions: Array.isArray(raw.questions) ? raw.questions : [],
  };
}

async function runThreadPrompt(
  thread: ReturnType<typeof codex.startThread>,
  prompt: string,
  streamToStdout: boolean,
): Promise<string> {
  let result = "";
  const streamedTurn = await thread.runStreamed(prompt);

  for await (const event of streamedTurn.events) {
    if (event.type === "item.completed") {
      const item = event.item;
      if (item.type === "agent_message") {
        if (streamToStdout) {
          process.stdout.write(item.text);
        }
        result += item.text;
      }
    }

    if (event.type === "turn.completed" && streamToStdout) {
      const usage = event.usage;
      if (usage) {
        console.log("\n");
        console.log(`[Tokens: ${usage.input_tokens} in / ${usage.output_tokens} out]`);
      }
    }
  }

  return result;
}

async function classifyRequest(prompt: string): Promise<Classification> {
  const managerPrompt = loadManagerPrompt();
  const fullPrompt = `${managerPrompt}\n\nUser request:\n${prompt}\n\nReturn JSON only.`;
  const managerThread = codex.startThread({
    workingDirectory: PROJECT_ROOT,
    skipGitRepoCheck: true,
  });

  const output = await runThreadPrompt(managerThread, fullPrompt, false);
  return normalizeClassification(extractJson(output));
}

function buildAutonomyInstruction(classification: Classification): string {
  if (classification.escalate) {
    return `Escalation required: ${classification.escalation_reason || "unspecified"}.\nProvide a DRAFT ONLY and ask for approval before any action.`;
  }

  switch (classification.autonomy) {
    case "observe":
      return "Autonomy: OBSERVE ONLY. Provide analysis and risks, no actions.";
    case "draft":
      return "Autonomy: DRAFT. Provide recommendations and draft outputs only.";
    case "auto":
      return "Autonomy: AUTO. Provide actionable steps within scope and note risks.";
    case "full":
      return "Autonomy: FULL within scope. Provide full execution plan and risks.";
    default:
      return "Autonomy: DRAFT.";
  }
}

/**
 * Run a single query to the Business Consultant agent
 */
async function runQuery(prompt: string): Promise<string> {
  const classification = await classifyRequest(prompt);

  if (classification.questions.length > 0) {
    const questionsBlock = classification.questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
    const response = `I need a bit more detail before routing this:\n${questionsBlock}\n`;
    process.stdout.write(response);
    return response;
  }

  if (classification.escalate) {
    console.log(`\n[Escalation Required] ${classification.escalation_reason || "Needs approval"}\n`);
  }

  const systemPrompt = loadSystemPrompt();
  const rolePrompt = loadRolePrompt(classification.lane);
  const memory = loadMemory();
  const autonomyInstruction = buildAutonomyInstruction(classification);

  const fullPrompt = `${systemPrompt}\n\n${rolePrompt}\n\n---\nDocs path: ${DOCS_PATH}\nBusiness ops docs: ${path.join(DOCS_PATH, "14-business-ops")}\nMemory:\n${memory}\n---\nLane: ${classification.lane}\n${autonomyInstruction}\n---\nUser: ${prompt}`;

  const thread = getLaneThread(classification.lane);
  return runThreadPrompt(thread, fullPrompt, true);
}

/**
 * Interactive REPL mode
 */
async function runInteractive(): Promise<void> {
  console.log("=".repeat(60));
  console.log("  KnearMe Business Consultant (Codex SDK)");
  console.log("  Powered by GPT-5.2-Codex");
  console.log("  Type your questions, 'exit' to quit, 'new' to reset all lanes");
  console.log("=".repeat(60));
  console.log("");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (): void => {
    rl.question("You: ", async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        askQuestion();
        return;
      }

      if (trimmed.toLowerCase() === "exit") {
        console.log("\nGoodbye!");
        rl.close();
        return;
      }

      if (trimmed.toLowerCase() === "new") {
        resetAllThreads();
        console.log("\n[New session started]\n");
        askQuestion();
        return;
      }

      console.log("");
      try {
        await runQuery(trimmed);
      } catch (error) {
        console.error("Error:", error);
      }
      console.log("");
      askQuestion();
    });
  };

  askQuestion();
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  // Note: Codex SDK can use either:
  // 1. OPENAI_API_KEY environment variable (pay-per-token)
  // 2. ChatGPT login via `codex login --device-auth` (subscription-based)

  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Single query mode
    const prompt = args.join(" ");
    console.log("");
    await runQuery(prompt);
  } else {
    // Interactive mode
    await runInteractive();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
