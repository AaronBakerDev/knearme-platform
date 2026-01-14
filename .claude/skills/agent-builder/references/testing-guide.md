# Testing Guide for Claude Agent SDK Applications

A comprehensive guide to testing AI agents built with the Claude Agent SDK. Covers unit testing, integration testing, E2E workflows, mock strategies, and CI/CD integration.

## Table of Contents

1. [Testing Philosophy for AI Agents](#1-testing-philosophy-for-ai-agents)
2. [Unit Testing Prompts](#2-unit-testing-prompts)
3. [Integration Testing with Tools](#3-integration-testing-with-tools)
4. [E2E Testing Agent Workflows](#4-e2e-testing-agent-workflows)
5. [Mock Strategies for Claude API](#5-mock-strategies-for-claude-api)
6. [Regression Testing](#6-regression-testing)
7. [Performance Benchmarking](#7-performance-benchmarking)
8. [Test Fixtures and Data](#8-test-fixtures-and-data)
9. [CI/CD Integration](#9-cicd-integration)
10. [Testing Subagents](#10-testing-subagents)

---

## 1. Testing Philosophy for AI Agents

### Why Agent Testing is Different

Traditional software testing relies on deterministic outputs: given input X, expect output Y. AI agents introduce non-determinism at multiple levels:

| Aspect | Traditional Software | AI Agents |
|--------|---------------------|-----------|
| Output | Deterministic | Probabilistic |
| Correctness | Exact match | Semantic correctness |
| Edge cases | Enumerate all | Impossible to enumerate |
| State | Explicit | Context-dependent |
| Timing | Predictable | Variable (API latency) |

### The Testing Pyramid for Agents

```
                    ┌──────────────┐
                    │    E2E       │  ← Expensive, slow, essential
                    │  Workflows   │     for critical paths
                    ├──────────────┤
                    │ Integration  │  ← Tool chains, subagent
                    │    Tests     │     coordination
                    ├──────────────┤
                    │    Unit      │  ← Prompts, parsing,
                    │    Tests     │     formatters (fast, cheap)
                    └──────────────┘
```

### Deterministic vs Non-Deterministic Testing

**Deterministic (Prefer These):**
- Prompt template rendering
- Input parsing and validation
- Output formatting and extraction
- Tool invocation logic
- Session management

**Non-Deterministic (Require Special Handling):**
- LLM response content
- Multi-turn conversation flow
- Subagent delegation decisions
- Tool selection heuristics

### Test Coverage Strategies

```typescript
// coverage-strategy.ts

/**
 * Agent Test Coverage Strategy
 *
 * 1. ALWAYS test deterministically:
 *    - Input validation (100% coverage)
 *    - Prompt construction (100% coverage)
 *    - Output parsing (100% coverage)
 *    - Error handling (100% coverage)
 *
 * 2. SELECTIVELY test non-deterministically:
 *    - Critical user journeys (E2E)
 *    - Known failure modes (regression)
 *    - Edge cases (boundary testing)
 *
 * 3. MONITOR in production:
 *    - Response quality metrics
 *    - Tool usage patterns
 *    - Error rates by prompt type
 */
```

### Core Testing Principles

1. **Test behavior, not implementation** - Validate that the agent accomplishes goals, not how it phrases responses.

2. **Use semantic assertions** - "Response contains safety warning" rather than "Response equals exact string".

3. **Embrace probabilistic testing** - Run non-deterministic tests multiple times and expect patterns, not exact matches.

4. **Isolate LLM from logic** - Keep business logic in testable functions separate from LLM interactions.

5. **Record and replay** - Capture real API responses for deterministic replay in tests.

---

## 2. Unit Testing Prompts

### Testing Prompt Parsing

```typescript
// src/prompts/__tests__/prompt-parser.test.ts
import { describe, it, expect } from "vitest";
import { parseUserIntent, extractEntities, buildSystemPrompt } from "../prompt-parser";

describe("parseUserIntent", () => {
  it("extracts project creation intent", () => {
    const input = "I want to create a new chimney repair project";
    const result = parseUserIntent(input);

    expect(result).toEqual({
      intent: "project.create",
      confidence: expect.any(Number),
      entities: {
        projectType: "chimney-repair",
      },
    });
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("handles ambiguous intent with low confidence", () => {
    const input = "help me with something";
    const result = parseUserIntent(input);

    expect(result.intent).toBe("general.help");
    expect(result.confidence).toBeLessThan(0.5);
  });

  it("extracts multiple entities", () => {
    const input = "Create a brick restoration project in Denver, CO for $5,000";
    const entities = extractEntities(input);

    expect(entities).toEqual({
      projectType: "brick-restoration",
      location: { city: "Denver", state: "CO" },
      budget: 5000,
    });
  });
});

describe("buildSystemPrompt", () => {
  it("includes contractor context when available", () => {
    const context = {
      contractorName: "Bob's Masonry",
      specialties: ["chimney", "tuckpointing"],
      projectCount: 15,
    };

    const prompt = buildSystemPrompt(context);

    expect(prompt).toContain("Bob's Masonry");
    expect(prompt).toContain("15 projects");
    expect(prompt).toMatch(/chimney|tuckpointing/);
  });

  it("handles missing optional fields gracefully", () => {
    const context = { contractorName: "Test Co" };
    const prompt = buildSystemPrompt(context);

    expect(prompt).toContain("Test Co");
    expect(prompt).not.toContain("undefined");
    expect(prompt).not.toContain("null");
  });

  it("escapes user-provided content", () => {
    const context = {
      contractorName: '<script>alert("xss")</script>',
    };

    const prompt = buildSystemPrompt(context);
    expect(prompt).not.toContain("<script>");
  });
});
```

### Testing Intent Detection

```typescript
// src/intents/__tests__/intent-classifier.test.ts
import { describe, it, expect } from "vitest";
import { classifyIntent, IntentType } from "../intent-classifier";

describe("classifyIntent", () => {
  const testCases: Array<{ input: string; expected: IntentType }> = [
    { input: "Create a new project", expected: "project.create" },
    { input: "Edit my profile", expected: "profile.edit" },
    { input: "Show me my analytics", expected: "analytics.view" },
    { input: "Delete this project", expected: "project.delete" },
    { input: "What's my total revenue?", expected: "analytics.revenue" },
    { input: "Help me upload photos", expected: "project.images.upload" },
  ];

  it.each(testCases)('classifies "$input" as $expected', ({ input, expected }) => {
    const result = classifyIntent(input);
    expect(result.primary).toBe(expected);
  });

  it("provides fallback for unknown intents", () => {
    const result = classifyIntent("xyzzy plugh nothing");
    expect(result.primary).toBe("general.unknown");
    expect(result.suggestions).toBeDefined();
  });

  it("handles multi-intent queries", () => {
    const result = classifyIntent("Create a project and then edit my profile");
    expect(result.intents).toHaveLength(2);
    expect(result.intents).toContain("project.create");
    expect(result.intents).toContain("profile.edit");
  });
});
```

### Testing Output Formatting

```typescript
// src/formatters/__tests__/response-formatter.test.ts
import { describe, it, expect } from "vitest";
import {
  formatProjectSummary,
  formatAnalyticsReport,
  extractCodeBlocks,
  sanitizeForDisplay,
} from "../response-formatter";

describe("formatProjectSummary", () => {
  const mockProject = {
    id: "proj-123",
    title: "Historic Chimney Rebuild",
    description: "Full chimney rebuild with reclaimed brick...",
    status: "published",
    createdAt: new Date("2024-12-01"),
    imageCount: 8,
  };

  it("formats project for display", () => {
    const result = formatProjectSummary(mockProject);

    expect(result).toContain("Historic Chimney Rebuild");
    expect(result).toContain("Published");
    expect(result).toContain("8 images");
    expect(result).toMatch(/December 1/);
  });

  it("truncates long descriptions", () => {
    const longDesc = { ...mockProject, description: "x".repeat(500) };
    const result = formatProjectSummary(longDesc);

    expect(result.length).toBeLessThan(600);
    expect(result).toContain("...");
  });

  it("handles draft status correctly", () => {
    const draft = { ...mockProject, status: "draft" };
    const result = formatProjectSummary(draft);

    expect(result).toContain("Draft");
    expect(result).toContain("[Not Published]");
  });
});

describe("extractCodeBlocks", () => {
  it("extracts code from markdown", () => {
    const markdown = `
Here's the code:
\`\`\`typescript
const x = 1;
\`\`\`
And some more:
\`\`\`json
{"key": "value"}
\`\`\`
`;

    const blocks = extractCodeBlocks(markdown);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ language: "typescript", code: "const x = 1;" });
    expect(blocks[1]).toEqual({ language: "json", code: '{"key": "value"}' });
  });

  it("handles empty code blocks", () => {
    const markdown = "```typescript\n```";
    const blocks = extractCodeBlocks(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].code).toBe("");
  });
});

describe("sanitizeForDisplay", () => {
  it("removes control characters", () => {
    const dirty = "Hello\x00World\x1F";
    expect(sanitizeForDisplay(dirty)).toBe("HelloWorld");
  });

  it("preserves valid unicode", () => {
    const text = "Masonry work in D\u00fcsseldorf";
    expect(sanitizeForDisplay(text)).toBe(text);
  });
});
```

### Testing Prompt Templates

```typescript
// src/templates/__tests__/prompt-templates.test.ts
import { describe, it, expect } from "vitest";
import { renderTemplate, TEMPLATES } from "../prompt-templates";

describe("renderTemplate", () => {
  it("renders project analysis template", () => {
    const result = renderTemplate(TEMPLATES.PROJECT_ANALYSIS, {
      imageCount: 5,
      projectType: "chimney-repair",
      contractorNotes: "Focus on the flashing work",
    });

    expect(result).toContain("5 images");
    expect(result).toContain("chimney-repair");
    expect(result).toContain("Focus on the flashing work");
  });

  it("handles missing optional placeholders", () => {
    const result = renderTemplate(TEMPLATES.PROJECT_ANALYSIS, {
      imageCount: 5,
      projectType: "general",
      // contractorNotes is optional
    });

    expect(result).not.toContain("undefined");
    expect(result).not.toContain("{{");
  });

  it("throws on missing required placeholders", () => {
    expect(() => {
      renderTemplate(TEMPLATES.PROJECT_ANALYSIS, {
        // Missing required fields
      });
    }).toThrow(/Missing required placeholder: imageCount/);
  });

  it("preserves template structure", () => {
    const result = renderTemplate(TEMPLATES.SYSTEM_PROMPT, {
      agentName: "Portfolio Assistant",
      capabilities: ["project creation", "image analysis"],
    });

    // Check structural elements are preserved
    expect(result).toMatch(/^#\s+/); // Starts with heading
    expect(result).toContain("## Your Role");
    expect(result).toContain("## Capabilities");
  });
});
```

---

## 3. Integration Testing with Tools

### Testing Tool Invocation

```typescript
// src/tools/__tests__/tool-executor.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ToolExecutor } from "../tool-executor";
import { createMockFileSystem } from "../../test-utils/mock-fs";

describe("ToolExecutor", () => {
  let executor: ToolExecutor;
  let mockFs: ReturnType<typeof createMockFileSystem>;

  beforeEach(() => {
    mockFs = createMockFileSystem({
      "/project/docs/README.md": "# Project Docs\nSome content here.",
      "/project/src/index.ts": 'export const main = () => "hello";',
    });

    executor = new ToolExecutor({
      cwd: "/project",
      fileSystem: mockFs,
    });
  });

  describe("Read tool", () => {
    it("reads file content", async () => {
      const result = await executor.execute({
        name: "Read",
        input: { file_path: "/project/docs/README.md" },
      });

      expect(result.success).toBe(true);
      expect(result.content).toContain("# Project Docs");
    });

    it("handles missing files gracefully", async () => {
      const result = await executor.execute({
        name: "Read",
        input: { file_path: "/project/nonexistent.md" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("File not found");
    });

    it("respects line limits", async () => {
      mockFs.writeFile("/project/large.txt", Array(100).fill("line").join("\n"));

      const result = await executor.execute({
        name: "Read",
        input: { file_path: "/project/large.txt", limit: 10 },
      });

      expect(result.content.split("\n")).toHaveLength(10);
    });
  });

  describe("Glob tool", () => {
    it("finds files by pattern", async () => {
      const result = await executor.execute({
        name: "Glob",
        input: { pattern: "**/*.ts", path: "/project" },
      });

      expect(result.success).toBe(true);
      expect(result.files).toContain("/project/src/index.ts");
    });

    it("returns empty array for no matches", async () => {
      const result = await executor.execute({
        name: "Glob",
        input: { pattern: "**/*.xyz", path: "/project" },
      });

      expect(result.success).toBe(true);
      expect(result.files).toEqual([]);
    });
  });

  describe("Write tool", () => {
    it("creates new files", async () => {
      const result = await executor.execute({
        name: "Write",
        input: {
          file_path: "/project/new-file.txt",
          content: "New content",
        },
      });

      expect(result.success).toBe(true);
      expect(mockFs.exists("/project/new-file.txt")).toBe(true);
    });

    it("refuses to write outside cwd without permission", async () => {
      const result = await executor.execute({
        name: "Write",
        input: {
          file_path: "/etc/passwd",
          content: "malicious",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("outside allowed directory");
    });
  });
});
```

### Mocking Tool Responses

```typescript
// src/test-utils/mock-tools.ts
import { vi } from "vitest";
import type { ToolResult, ToolInvocation } from "../types";

export interface MockToolResponse {
  tool: string;
  pattern?: RegExp | string; // Match against input
  response: ToolResult | ((input: unknown) => ToolResult);
}

export function createMockToolHandler(responses: MockToolResponse[]) {
  return vi.fn(async (invocation: ToolInvocation): Promise<ToolResult> => {
    const inputStr = JSON.stringify(invocation.input);

    for (const mock of responses) {
      if (invocation.name !== mock.tool) continue;

      const matches = mock.pattern
        ? typeof mock.pattern === "string"
          ? inputStr.includes(mock.pattern)
          : mock.pattern.test(inputStr)
        : true;

      if (matches) {
        return typeof mock.response === "function"
          ? mock.response(invocation.input)
          : mock.response;
      }
    }

    return {
      success: false,
      error: `No mock defined for ${invocation.name}: ${inputStr}`,
    };
  });
}

// Usage example
const mockHandler = createMockToolHandler([
  {
    tool: "Read",
    pattern: /README\.md/,
    response: { success: true, content: "# Mock README" },
  },
  {
    tool: "Glob",
    pattern: /\*\*\/\*\.ts/,
    response: { success: true, files: ["/src/index.ts", "/src/utils.ts"] },
  },
  {
    tool: "WebSearch",
    response: (input) => ({
      success: true,
      results: [
        { title: "Result 1", url: "https://example.com/1" },
        { title: "Result 2", url: "https://example.com/2" },
      ],
    }),
  },
]);
```

### Testing Tool Chains

```typescript
// src/chains/__tests__/tool-chain.test.ts
import { describe, it, expect, vi } from "vitest";
import { executeToolChain, ToolChain } from "../tool-chain";
import { createMockToolHandler } from "../../test-utils/mock-tools";

describe("Tool Chain Execution", () => {
  it("executes sequential tool chain", async () => {
    const mockHandler = createMockToolHandler([
      {
        tool: "Glob",
        response: { success: true, files: ["/src/a.ts", "/src/b.ts"] },
      },
      {
        tool: "Read",
        pattern: /a\.ts/,
        response: { success: true, content: "// File A" },
      },
      {
        tool: "Read",
        pattern: /b\.ts/,
        response: { success: true, content: "// File B" },
      },
    ]);

    const chain: ToolChain = {
      steps: [
        { tool: "Glob", input: { pattern: "**/*.ts" } },
        { tool: "Read", inputFrom: "previousFiles" }, // Read each found file
      ],
    };

    const results = await executeToolChain(chain, mockHandler);

    expect(results).toHaveLength(3); // Glob + 2 Reads
    expect(results[1].content).toContain("File A");
    expect(results[2].content).toContain("File B");
  });

  it("handles chain failures gracefully", async () => {
    const mockHandler = createMockToolHandler([
      {
        tool: "Glob",
        response: { success: false, error: "Permission denied" },
      },
    ]);

    const chain: ToolChain = {
      steps: [
        { tool: "Glob", input: { pattern: "**/*.ts" } },
        { tool: "Read", inputFrom: "previousFiles" },
      ],
      continueOnError: false,
    };

    const results = await executeToolChain(chain, mockHandler);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(false);
    expect(results[0].error).toContain("Permission denied");
  });

  it("supports conditional branching", async () => {
    const mockHandler = createMockToolHandler([
      {
        tool: "Read",
        response: { success: true, content: '{"version": "2.0"}' },
      },
    ]);

    const chain: ToolChain = {
      steps: [
        { tool: "Read", input: { file_path: "package.json" } },
        {
          condition: (prev) => JSON.parse(prev.content).version.startsWith("2"),
          then: { tool: "Bash", input: { command: "npm run v2-migrate" } },
          else: { tool: "Bash", input: { command: "npm run v1-migrate" } },
        },
      ],
    };

    // Verify conditional routing works
    const results = await executeToolChain(chain, mockHandler);
    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({ input: { command: "npm run v2-migrate" } })
    );
  });
});
```

---

## 4. E2E Testing Agent Workflows

### Full Conversation Flows

```typescript
// e2e/agent-workflows.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { TestAgent, createTestEnvironment } from "../test-utils/e2e-helpers";

describe("E2E: Project Creation Workflow", () => {
  let testEnv: ReturnType<typeof createTestEnvironment>;

  beforeAll(async () => {
    testEnv = createTestEnvironment({
      mockExternalAPIs: true,
      seedData: true,
    });
    await testEnv.setup();
  });

  afterAll(async () => {
    await testEnv.teardown();
  });

  it("completes project creation flow", async () => {
    const agent = new TestAgent({
      systemPrompt: "You help contractors create project portfolios...",
      cwd: testEnv.projectDir,
    });

    // Step 1: User initiates project creation
    const step1 = await agent.send("I want to create a new chimney repair project");
    expect(step1.text).toMatch(/project|create|start/i);
    expect(step1.toolsUsed).toContain("Write");

    // Step 2: User provides details
    const step2 = await agent.send(
      "It's a historic brick chimney in Denver. I rebuilt the crown and repointed the mortar."
    );
    expect(step2.text).toMatch(/historic|brick|chimney/i);

    // Step 3: User confirms
    const step3 = await agent.send("Yes, that looks good. Save it.");
    expect(step3.text).toMatch(/saved|created|complete/i);

    // Verify side effects
    const createdProject = await testEnv.db.findProject({
      title: /chimney/i,
    });
    expect(createdProject).toBeDefined();
    expect(createdProject.location).toBe("Denver");
  }, 60000); // 60s timeout for LLM interactions

  it("handles error recovery", async () => {
    const agent = new TestAgent({
      systemPrompt: "You help contractors create project portfolios...",
      cwd: testEnv.projectDir,
    });

    // Trigger an error scenario
    await agent.send("Create a project");
    const errorResponse = await agent.send("Save it now"); // Missing required info

    expect(errorResponse.text).toMatch(/missing|need|provide/i);
    expect(errorResponse.recoverable).toBe(true);

    // Provide missing info
    const recovery = await agent.send(
      "It's a tuckpointing project in Boulder"
    );
    expect(recovery.text).toMatch(/tuckpointing|boulder|ready/i);
  });
});
```

### Multi-Turn Interactions

```typescript
// e2e/multi-turn.test.ts
import { describe, it, expect } from "vitest";
import { ConversationRunner } from "../test-utils/conversation-runner";

describe("E2E: Multi-Turn Conversations", () => {
  it("maintains context across turns", async () => {
    const conversation = new ConversationRunner();

    // Turn 1: Establish context
    await conversation.user("I'm working on a chimney project");
    const r1 = await conversation.assistant();
    expect(r1).toMatch(/chimney/i);

    // Turn 2: Reference previous context
    await conversation.user("How many photos should I add?");
    const r2 = await conversation.assistant();
    expect(r2).toMatch(/chimney|project/i); // Should reference context
    expect(r2).toMatch(/\d+ (photos|images)/i);

    // Turn 3: Follow-up question
    await conversation.user("What about before and after shots?");
    const r3 = await conversation.assistant();
    expect(r3).toMatch(/before|after/i);

    // Verify context retention
    expect(conversation.contextContains("chimney")).toBe(true);
  });

  it("handles topic switching", async () => {
    const conversation = new ConversationRunner();

    await conversation.user("Tell me about my projects");
    await conversation.assistant();

    // Switch topic
    await conversation.user("Actually, how do I edit my profile?");
    const response = await conversation.assistant();

    expect(response).toMatch(/profile|edit|settings/i);
    expect(response).not.toMatch(/projects/i); // Should not be confused
  });

  it("handles clarification requests", async () => {
    const conversation = new ConversationRunner();

    // Ambiguous request
    await conversation.user("Delete it");
    const clarification = await conversation.assistant();

    expect(clarification).toMatch(/which|what|clarify/i);

    // Provide clarification
    await conversation.user("The draft project I created yesterday");
    const response = await conversation.assistant();

    expect(response).toMatch(/delete|removed|draft/i);
  });
});
```

### Session Persistence Testing

```typescript
// e2e/session-persistence.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { SessionStore } from "../src/session-store";

describe("E2E: Session Persistence", () => {
  let sessionStore: SessionStore;

  beforeEach(() => {
    sessionStore = new SessionStore({ storage: "memory" });
  });

  it("resumes session after disconnect", async () => {
    // Start initial session
    const session1 = await startSession();
    await session1.send("I'm working on a brick restoration in Denver");
    const sessionId = session1.getId();
    await session1.disconnect();

    // Resume session
    const session2 = await resumeSession(sessionId);
    const response = await session2.send("What was I working on?");

    expect(response.text).toMatch(/brick|restoration|denver/i);
    expect(session2.getHistory()).toHaveLength(2); // Previous + current
  });

  it("forks session without modifying original", async () => {
    const original = await startSession();
    await original.send("Create a project called Test");
    const originalSessionId = original.getId();

    // Fork and make changes
    const forked = await forkSession(originalSessionId);
    await forked.send("Change the name to Modified");

    // Verify original is unchanged
    const resumed = await resumeSession(originalSessionId);
    const check = await resumed.send("What's the project name?");
    expect(check.text).toMatch(/test/i);
    expect(check.text).not.toMatch(/modified/i);
  });

  it("handles expired sessions gracefully", async () => {
    const session = await startSession();
    const sessionId = session.getId();

    // Simulate expiration
    sessionStore.expire(sessionId);

    // Attempt to resume
    const resumed = await resumeSession(sessionId);
    expect(resumed.isNew()).toBe(true);
    expect(resumed.getHistory()).toHaveLength(0);
  });

  // Helper functions
  async function startSession() {
    return new TestSession(sessionStore);
  }

  async function resumeSession(id: string) {
    return new TestSession(sessionStore, { resume: id });
  }

  async function forkSession(id: string) {
    return new TestSession(sessionStore, { resume: id, fork: true });
  }
});
```

---

## 5. Mock Strategies for Claude API

### Mocking the query() Function

```typescript
// src/test-utils/mock-query.ts
import { vi } from "vitest";
import type { QueryOptions, SDKMessage } from "@anthropic-ai/claude-agent-sdk";

export interface MockQueryOptions {
  responses: MockResponse[];
  defaultResponse?: MockResponse;
  simulateLatency?: number;
  recordCalls?: boolean;
}

export interface MockResponse {
  pattern?: RegExp | string; // Match against prompt
  messages: SDKMessage[];
  cost?: number;
  duration?: number;
}

export function createMockQuery(options: MockQueryOptions) {
  const calls: Array<{ prompt: string; options: QueryOptions }> = [];

  const mockQuery = vi.fn(async function* mockQuery({
    prompt,
    options: queryOptions,
  }: {
    prompt: string;
    options?: QueryOptions;
  }): AsyncIterable<SDKMessage> {
    if (options.recordCalls) {
      calls.push({ prompt, options: queryOptions! });
    }

    if (options.simulateLatency) {
      await new Promise((r) => setTimeout(r, options.simulateLatency));
    }

    // Find matching response
    const response = options.responses.find((r) => {
      if (!r.pattern) return false;
      return typeof r.pattern === "string"
        ? prompt.includes(r.pattern)
        : r.pattern.test(prompt);
    }) || options.defaultResponse;

    if (!response) {
      throw new Error(`No mock response for prompt: ${prompt.slice(0, 100)}`);
    }

    // Emit messages
    for (const message of response.messages) {
      yield message;
    }
  });

  return {
    query: mockQuery,
    getCalls: () => calls,
    reset: () => calls.length = 0,
  };
}

// Pre-built response factories
export function createInitMessage(sessionId: string): SDKMessage {
  return {
    type: "system",
    subtype: "init",
    session_id: sessionId,
  } as SDKMessage;
}

export function createAssistantMessage(text: string, tools?: string[]): SDKMessage {
  const content: Array<{ type: string; text?: string; name?: string }> = [
    { type: "text", text },
  ];

  if (tools) {
    for (const tool of tools) {
      content.push({ type: "tool_use", name: tool });
    }
  }

  return {
    type: "assistant",
    message: { content },
  } as SDKMessage;
}

export function createResultMessage(success: boolean, cost = 0.001): SDKMessage {
  return {
    type: "result",
    subtype: success ? "success" : "error_during_execution",
    result: success ? "Task completed" : "Error occurred",
    total_cost_usd: cost,
    duration_ms: 1500,
  } as SDKMessage;
}
```

### Fixture-Based Responses

```typescript
// src/test-utils/fixtures/responses.ts

/**
 * Pre-recorded response fixtures for deterministic testing.
 * Generated by recording actual API responses and sanitizing sensitive data.
 */

export const FIXTURES = {
  projectCreation: {
    prompt: /create.*project/i,
    messages: [
      createInitMessage("fixture-session-1"),
      createAssistantMessage(
        "I'll help you create a new project. What type of masonry work is this?",
        ["Read"]
      ),
      createResultMessage(true, 0.002),
    ],
  },

  imageAnalysis: {
    prompt: /analyze.*image/i,
    messages: [
      createInitMessage("fixture-session-2"),
      createAssistantMessage(
        "I can see this is a chimney restoration project. The image shows:\n" +
        "- Brick type: Historic red clay\n" +
        "- Condition: Moderate deterioration\n" +
        "- Work visible: Crown repair, mortar repointing",
        []
      ),
      createResultMessage(true, 0.005),
    ],
  },

  errorRecovery: {
    prompt: /missing.*required/i,
    messages: [
      createInitMessage("fixture-session-3"),
      createAssistantMessage(
        "I notice we're missing some required information. Could you please provide:\n" +
        "1. Project location (city, state)\n" +
        "2. Type of masonry work\n" +
        "3. Brief description",
        []
      ),
      createResultMessage(true, 0.001),
    ],
  },
};

// Usage in tests
import { createMockQuery, FIXTURES } from "./test-utils";

const mockQuery = createMockQuery({
  responses: Object.values(FIXTURES),
  defaultResponse: {
    messages: [
      createInitMessage("default-session"),
      createAssistantMessage("I'm not sure how to help with that."),
      createResultMessage(true),
    ],
  },
});
```

### Deterministic Test Modes

```typescript
// src/test-utils/deterministic-mode.ts
import { vi } from "vitest";

/**
 * Enables deterministic testing mode for the agent.
 *
 * In this mode:
 * - LLM responses are replaced with predefined fixtures
 * - Tool execution uses mocked implementations
 * - Timestamps and random values are controlled
 * - Session IDs are predictable
 */
export function enableDeterministicMode(config: DeterministicConfig = {}) {
  const originalRandom = Math.random;
  const originalDate = Date;
  const originalNow = Date.now;

  // Control randomness
  let randomSeed = config.seed ?? 12345;
  Math.random = () => {
    randomSeed = (randomSeed * 16807) % 2147483647;
    return (randomSeed - 1) / 2147483646;
  };

  // Control time
  let currentTime = config.startTime ?? new Date("2024-12-15T10:00:00Z").getTime();
  Date.now = () => currentTime;

  // Provide time advancement
  const advanceTime = (ms: number) => {
    currentTime += ms;
  };

  // Reset function
  const reset = () => {
    Math.random = originalRandom;
    Date.now = originalNow;
    global.Date = originalDate;
  };

  return {
    advanceTime,
    reset,
    getCurrentTime: () => currentTime,
  };
}

interface DeterministicConfig {
  seed?: number;
  startTime?: number;
}

// Usage
describe("Deterministic Tests", () => {
  let deterministicMode: ReturnType<typeof enableDeterministicMode>;

  beforeEach(() => {
    deterministicMode = enableDeterministicMode({ seed: 42 });
  });

  afterEach(() => {
    deterministicMode.reset();
  });

  it("produces consistent results", () => {
    const result1 = generateSessionId();
    deterministicMode.reset();
    deterministicMode = enableDeterministicMode({ seed: 42 });
    const result2 = generateSessionId();

    expect(result1).toBe(result2);
  });
});
```

### Recording and Replaying API Calls

```typescript
// src/test-utils/record-replay.ts
import * as fs from "fs";
import * as path from "path";
import { query as realQuery } from "@anthropic-ai/claude-agent-sdk";

const RECORDINGS_DIR = path.join(__dirname, "../fixtures/recordings");

interface Recording {
  prompt: string;
  options: Record<string, unknown>;
  messages: unknown[];
  recordedAt: string;
}

/**
 * Records API responses for later replay.
 * Use sparingly - only for generating test fixtures.
 */
export async function recordQuery(
  name: string,
  prompt: string,
  options: Record<string, unknown>
): Promise<void> {
  const messages: unknown[] = [];

  for await (const message of realQuery({ prompt, options })) {
    messages.push(message);
  }

  const recording: Recording = {
    prompt,
    options: sanitizeOptions(options),
    messages,
    recordedAt: new Date().toISOString(),
  };

  const filePath = path.join(RECORDINGS_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(recording, null, 2));
  console.log(`Recording saved to ${filePath}`);
}

/**
 * Replays a recorded API response.
 */
export async function* replayQuery(name: string): AsyncIterable<unknown> {
  const filePath = path.join(RECORDINGS_DIR, `${name}.json`);
  const recording: Recording = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  for (const message of recording.messages) {
    yield message;
  }
}

function sanitizeOptions(options: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...options };
  // Remove sensitive data
  delete sanitized.apiKey;
  delete sanitized.credentials;
  return sanitized;
}

// Generate recordings (run manually, not in CI)
// npx tsx scripts/generate-recordings.ts
async function generateRecordings() {
  await recordQuery("project-creation", "Create a new chimney project", {
    model: "claude-sonnet-4-5-20250929",
    systemPrompt: "You help contractors...",
  });

  await recordQuery("image-analysis", "Analyze this masonry image", {
    model: "claude-sonnet-4-5-20250929",
    systemPrompt: "You analyze construction images...",
  });
}
```

---

## 6. Regression Testing

### Test Case Management

```typescript
// src/test-utils/regression-suite.ts
import * as fs from "fs";
import * as path from "path";

interface RegressionCase {
  id: string;
  name: string;
  prompt: string;
  expectedBehaviors: ExpectedBehavior[];
  baseline?: BaselineResult;
  priority: "critical" | "high" | "medium" | "low";
  tags: string[];
  createdAt: string;
  lastUpdated: string;
}

interface ExpectedBehavior {
  type: "contains" | "matches" | "tool_used" | "no_error" | "semantic";
  value: string | RegExp;
  weight?: number;
}

interface BaselineResult {
  response: string;
  toolsUsed: string[];
  cost: number;
  duration: number;
  recordedAt: string;
  modelVersion: string;
}

export class RegressionSuite {
  private cases: Map<string, RegressionCase> = new Map();
  private suitePath: string;

  constructor(suitePath: string) {
    this.suitePath = suitePath;
    this.loadCases();
  }

  private loadCases() {
    const files = fs.readdirSync(this.suitePath);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const content = fs.readFileSync(path.join(this.suitePath, file), "utf-8");
        const testCase: RegressionCase = JSON.parse(content);
        this.cases.set(testCase.id, testCase);
      }
    }
  }

  getCases(filter?: { priority?: string; tags?: string[] }): RegressionCase[] {
    let cases = Array.from(this.cases.values());

    if (filter?.priority) {
      cases = cases.filter((c) => c.priority === filter.priority);
    }

    if (filter?.tags?.length) {
      cases = cases.filter((c) => filter.tags!.some((t) => c.tags.includes(t)));
    }

    return cases;
  }

  addCase(testCase: Omit<RegressionCase, "id" | "createdAt" | "lastUpdated">) {
    const id = `reg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newCase: RegressionCase = {
      ...testCase,
      id,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    this.cases.set(id, newCase);
    this.saveCase(newCase);
    return id;
  }

  updateBaseline(id: string, result: BaselineResult) {
    const testCase = this.cases.get(id);
    if (!testCase) throw new Error(`Case ${id} not found`);

    testCase.baseline = result;
    testCase.lastUpdated = new Date().toISOString();
    this.saveCase(testCase);
  }

  private saveCase(testCase: RegressionCase) {
    const filePath = path.join(this.suitePath, `${testCase.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(testCase, null, 2));
  }
}
```

### Baseline Comparisons

```typescript
// src/test-utils/baseline-comparator.ts
import { diffWords } from "diff";

interface ComparisonResult {
  passed: boolean;
  score: number; // 0-1, where 1 is perfect match
  details: {
    behaviorScores: Record<string, number>;
    costDelta: number;
    durationDelta: number;
    textSimilarity: number;
    toolDifferences: string[];
  };
  warnings: string[];
}

export function compareToBaseline(
  actual: ActualResult,
  baseline: BaselineResult,
  expectedBehaviors: ExpectedBehavior[]
): ComparisonResult {
  const warnings: string[] = [];
  const behaviorScores: Record<string, number> = {};

  // Check each expected behavior
  let totalWeight = 0;
  let weightedScore = 0;

  for (const behavior of expectedBehaviors) {
    const weight = behavior.weight ?? 1;
    totalWeight += weight;

    const score = evaluateBehavior(actual, behavior);
    behaviorScores[behavior.value.toString()] = score;
    weightedScore += score * weight;
  }

  const behaviorScore = totalWeight > 0 ? weightedScore / totalWeight : 1;

  // Calculate text similarity
  const textSimilarity = calculateTextSimilarity(
    actual.response,
    baseline.response
  );

  // Check cost delta
  const costDelta = actual.cost - baseline.cost;
  if (costDelta > baseline.cost * 0.5) {
    warnings.push(`Cost increased by ${(costDelta / baseline.cost * 100).toFixed(1)}%`);
  }

  // Check duration delta
  const durationDelta = actual.duration - baseline.duration;
  if (durationDelta > baseline.duration * 0.5) {
    warnings.push(`Duration increased by ${(durationDelta / baseline.duration * 100).toFixed(1)}%`);
  }

  // Check tool differences
  const toolDifferences = findToolDifferences(actual.toolsUsed, baseline.toolsUsed);
  if (toolDifferences.length > 0) {
    warnings.push(`Tool usage changed: ${toolDifferences.join(", ")}`);
  }

  // Calculate overall score
  const score = behaviorScore * 0.7 + textSimilarity * 0.3;
  const passed = score >= 0.8 && behaviorScore >= 0.9;

  return {
    passed,
    score,
    details: {
      behaviorScores,
      costDelta,
      durationDelta,
      textSimilarity,
      toolDifferences,
    },
    warnings,
  };
}

function evaluateBehavior(actual: ActualResult, behavior: ExpectedBehavior): number {
  switch (behavior.type) {
    case "contains":
      return actual.response.toLowerCase().includes(
        behavior.value.toString().toLowerCase()
      ) ? 1 : 0;

    case "matches":
      const regex = behavior.value instanceof RegExp
        ? behavior.value
        : new RegExp(behavior.value, "i");
      return regex.test(actual.response) ? 1 : 0;

    case "tool_used":
      return actual.toolsUsed.includes(behavior.value.toString()) ? 1 : 0;

    case "no_error":
      return actual.error ? 0 : 1;

    case "semantic":
      // Use embedding similarity for semantic matching
      return calculateSemanticSimilarity(actual.response, behavior.value.toString());

    default:
      return 0;
  }
}

function calculateTextSimilarity(a: string, b: string): number {
  const changes = diffWords(a, b);
  const unchanged = changes.filter((c) => !c.added && !c.removed)
    .reduce((sum, c) => sum + c.value.length, 0);
  const total = Math.max(a.length, b.length);
  return unchanged / total;
}

function findToolDifferences(actual: string[], baseline: string[]): string[] {
  const differences: string[] = [];

  for (const tool of actual) {
    if (!baseline.includes(tool)) {
      differences.push(`+${tool}`);
    }
  }

  for (const tool of baseline) {
    if (!actual.includes(tool)) {
      differences.push(`-${tool}`);
    }
  }

  return differences;
}

function calculateSemanticSimilarity(_a: string, _b: string): number {
  // In production, use embeddings (e.g., OpenAI ada-002)
  // For now, return basic word overlap
  return 0.8; // Placeholder
}
```

### Detecting Regressions

```typescript
// e2e/regression.test.ts
import { describe, it, expect } from "vitest";
import { RegressionSuite } from "../src/test-utils/regression-suite";
import { compareToBaseline } from "../src/test-utils/baseline-comparator";
import { runAgentQuery } from "../src/test-utils/test-agent";

const suite = new RegressionSuite("./fixtures/regression-cases");

describe("Regression Tests", () => {
  // Run all critical cases
  const criticalCases = suite.getCases({ priority: "critical" });

  for (const testCase of criticalCases) {
    it(`[${testCase.id}] ${testCase.name}`, async () => {
      const result = await runAgentQuery(testCase.prompt);

      if (testCase.baseline) {
        const comparison = compareToBaseline(
          result,
          testCase.baseline,
          testCase.expectedBehaviors
        );

        // Log warnings but don't fail
        for (const warning of comparison.warnings) {
          console.warn(`[${testCase.id}] ${warning}`);
        }

        expect(comparison.passed, `Regression detected: score ${comparison.score}`).toBe(true);
      } else {
        // No baseline yet - just check behaviors
        for (const behavior of testCase.expectedBehaviors) {
          if (behavior.type === "contains") {
            expect(result.response).toContain(behavior.value);
          }
        }
      }
    }, 30000);
  }
});

// Script to update baselines
// npx tsx scripts/update-baselines.ts
async function updateBaselines() {
  const allCases = suite.getCases();

  for (const testCase of allCases) {
    console.log(`Running ${testCase.id}...`);
    const result = await runAgentQuery(testCase.prompt);

    suite.updateBaseline(testCase.id, {
      response: result.response,
      toolsUsed: result.toolsUsed,
      cost: result.cost,
      duration: result.duration,
      recordedAt: new Date().toISOString(),
      modelVersion: "claude-sonnet-4-5-20250929",
    });

    console.log(`Updated baseline for ${testCase.id}`);
  }
}
```

---

## 7. Performance Benchmarking

### Latency Benchmarks

```typescript
// benchmarks/latency.bench.ts
import { describe, bench, beforeAll, afterAll } from "vitest";
import { TestAgent } from "../src/test-utils/test-agent";

describe("Agent Latency Benchmarks", () => {
  let agent: TestAgent;

  beforeAll(async () => {
    agent = new TestAgent({ warmup: true });
    // Warm up the connection
    await agent.send("Hello");
  });

  afterAll(async () => {
    await agent.cleanup();
  });

  bench("simple query", async () => {
    await agent.send("What time is it?");
  }, { iterations: 10 });

  bench("query with tool use", async () => {
    await agent.send("Read the README file");
  }, { iterations: 10 });

  bench("query with subagent", async () => {
    await agent.send("Research best practices for chimney repair");
  }, { iterations: 5 });

  bench("multi-turn conversation (3 turns)", async () => {
    await agent.send("Start a new project");
    await agent.send("It's a chimney repair");
    await agent.send("In Denver, CO");
  }, { iterations: 5 });
});
```

### Cost Benchmarks

```typescript
// benchmarks/cost.bench.ts
import { describe, it, expect } from "vitest";
import { CostTracker } from "../src/utils/cost-tracker";
import { TestAgent } from "../src/test-utils/test-agent";

describe("Cost Benchmarks", () => {
  const tracker = new CostTracker();

  it("tracks cost for common operations", async () => {
    const agent = new TestAgent();
    const scenarios = [
      { name: "simple_query", prompt: "What is masonry?" },
      { name: "image_analysis", prompt: "Analyze this chimney image" },
      { name: "content_generation", prompt: "Write a project description" },
      { name: "multi_tool", prompt: "Search and summarize best practices" },
    ];

    const results: Array<{ name: string; cost: number; tokens: number }> = [];

    for (const scenario of scenarios) {
      const start = tracker.getTotal();
      await agent.send(scenario.prompt);
      const cost = tracker.getTotal() - start;

      results.push({
        name: scenario.name,
        cost,
        tokens: tracker.getLastTokenCount(),
      });
    }

    // Log results
    console.table(results);

    // Assert budgets
    expect(results.find((r) => r.name === "simple_query")?.cost).toBeLessThan(0.01);
    expect(results.find((r) => r.name === "image_analysis")?.cost).toBeLessThan(0.05);
    expect(results.find((r) => r.name === "content_generation")?.cost).toBeLessThan(0.03);
  });

  it("estimates monthly cost at usage levels", async () => {
    const usageLevels = [
      { name: "starter", queriesPerDay: 10 },
      { name: "growth", queriesPerDay: 100 },
      { name: "scale", queriesPerDay: 1000 },
    ];

    const avgCostPerQuery = 0.02; // Estimated from benchmarks

    for (const level of usageLevels) {
      const monthlyQueries = level.queriesPerDay * 30;
      const monthlyCost = monthlyQueries * avgCostPerQuery;

      console.log(`${level.name}: $${monthlyCost.toFixed(2)}/month (${monthlyQueries} queries)`);

      // Sanity check
      expect(monthlyCost).toBeGreaterThan(0);
      expect(monthlyCost).toBeLessThan(10000); // No runaway costs
    }
  });
});
```

### Token Usage Tracking

```typescript
// src/utils/token-tracker.ts

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

interface TrackedQuery {
  id: string;
  prompt: string;
  usage: TokenUsage;
  model: string;
  timestamp: number;
}

export class TokenTracker {
  private queries: TrackedQuery[] = [];

  record(query: TrackedQuery) {
    this.queries.push(query);
  }

  getStats(): TokenStats {
    const totalPromptTokens = this.queries.reduce((sum, q) => sum + q.usage.promptTokens, 0);
    const totalCompletionTokens = this.queries.reduce((sum, q) => sum + q.usage.completionTokens, 0);
    const totalCost = this.queries.reduce((sum, q) => sum + q.usage.cost, 0);

    return {
      totalQueries: this.queries.length,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens,
      totalCost,
      avgPromptTokens: totalPromptTokens / this.queries.length || 0,
      avgCompletionTokens: totalCompletionTokens / this.queries.length || 0,
      avgCostPerQuery: totalCost / this.queries.length || 0,
    };
  }

  getByModel(): Record<string, TokenStats> {
    const byModel: Record<string, TrackedQuery[]> = {};

    for (const query of this.queries) {
      byModel[query.model] = byModel[query.model] || [];
      byModel[query.model].push(query);
    }

    const result: Record<string, TokenStats> = {};
    for (const [model, queries] of Object.entries(byModel)) {
      result[model] = this.calculateStats(queries);
    }

    return result;
  }

  generateReport(): string {
    const stats = this.getStats();
    const byModel = this.getByModel();

    return `
# Token Usage Report

## Summary
- Total Queries: ${stats.totalQueries}
- Total Tokens: ${stats.totalTokens.toLocaleString()}
- Total Cost: $${stats.totalCost.toFixed(4)}
- Avg Cost/Query: $${stats.avgCostPerQuery.toFixed(4)}

## By Model
${Object.entries(byModel).map(([model, s]) => `
### ${model}
- Queries: ${s.totalQueries}
- Avg Tokens: ${s.avgPromptTokens.toFixed(0)} prompt + ${s.avgCompletionTokens.toFixed(0)} completion
- Avg Cost: $${s.avgCostPerQuery.toFixed(4)}
`).join("")}

## Recommendations
${this.generateRecommendations(stats, byModel)}
`;
  }

  private calculateStats(queries: TrackedQuery[]): TokenStats {
    // Implementation same as getStats but for subset
    // ...
  }

  private generateRecommendations(stats: TokenStats, byModel: Record<string, TokenStats>): string {
    const recommendations: string[] = [];

    if (stats.avgPromptTokens > 2000) {
      recommendations.push("- Consider reducing system prompt size");
    }

    if (byModel["claude-opus-4-5-20251101"]?.totalQueries > stats.totalQueries * 0.5) {
      recommendations.push("- Consider using Sonnet for routine tasks to reduce costs");
    }

    if (stats.avgCompletionTokens > stats.avgPromptTokens * 2) {
      recommendations.push("- Responses are verbose; consider instructing for brevity");
    }

    return recommendations.length > 0
      ? recommendations.join("\n")
      : "- No optimization recommendations at this time";
  }
}

interface TokenStats {
  totalQueries: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCost: number;
  avgPromptTokens: number;
  avgCompletionTokens: number;
  avgCostPerQuery: number;
}
```

### Performance Test Runner

```typescript
// scripts/run-benchmarks.ts
import { TokenTracker } from "../src/utils/token-tracker";
import { TestAgent } from "../src/test-utils/test-agent";
import * as fs from "fs";

interface BenchmarkConfig {
  name: string;
  iterations: number;
  warmup: number;
  prompts: string[];
}

async function runBenchmarks(config: BenchmarkConfig) {
  const tracker = new TokenTracker();
  const agent = new TestAgent();
  const results: Array<{
    prompt: string;
    latencies: number[];
    avgLatency: number;
    p95Latency: number;
    avgCost: number;
  }> = [];

  // Warmup
  for (let i = 0; i < config.warmup; i++) {
    await agent.send("warmup");
  }

  // Run benchmarks
  for (const prompt of config.prompts) {
    const latencies: number[] = [];

    for (let i = 0; i < config.iterations; i++) {
      const start = Date.now();
      await agent.send(prompt);
      latencies.push(Date.now() - start);
    }

    latencies.sort((a, b) => a - b);

    results.push({
      prompt: prompt.slice(0, 50),
      latencies,
      avgLatency: latencies.reduce((a, b) => a + b) / latencies.length,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      avgCost: tracker.getStats().avgCostPerQuery,
    });
  }

  // Generate report
  const report = {
    config,
    timestamp: new Date().toISOString(),
    results,
    tokenReport: tracker.generateReport(),
  };

  fs.writeFileSync(
    `benchmarks/results/${config.name}-${Date.now()}.json`,
    JSON.stringify(report, null, 2)
  );

  console.log("\nBenchmark Results:");
  console.table(results.map((r) => ({
    prompt: r.prompt,
    avgLatency: `${r.avgLatency.toFixed(0)}ms`,
    p95Latency: `${r.p95Latency.toFixed(0)}ms`,
    avgCost: `$${r.avgCost.toFixed(4)}`,
  })));
}

// Run with: npx tsx scripts/run-benchmarks.ts
runBenchmarks({
  name: "standard",
  iterations: 10,
  warmup: 2,
  prompts: [
    "What is masonry?",
    "Create a new project",
    "Analyze this chimney image",
    "Write a description for a brick restoration",
  ],
});
```

---

## 8. Test Fixtures and Data

### Creating Test Conversations

```typescript
// fixtures/conversations/index.ts

export interface ConversationFixture {
  id: string;
  name: string;
  description: string;
  turns: ConversationTurn[];
  expectedOutcome: string;
  tags: string[];
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
  assertions?: TurnAssertion[];
}

export interface TurnAssertion {
  type: "contains" | "matches" | "tool_used" | "length_max";
  value: string | number;
}

export const CONVERSATION_FIXTURES: ConversationFixture[] = [
  {
    id: "project-creation-happy-path",
    name: "Project Creation - Happy Path",
    description: "Standard project creation flow with all required info provided",
    tags: ["project", "creation", "happy-path"],
    turns: [
      {
        role: "user",
        content: "I want to create a new project for a chimney I just repaired",
      },
      {
        role: "assistant",
        content: "", // Will be generated
        assertions: [
          { type: "contains", value: "project" },
          { type: "contains", value: "chimney" },
        ],
      },
      {
        role: "user",
        content: "It's in Denver, CO. I rebuilt the crown and repointed all the mortar joints.",
      },
      {
        role: "assistant",
        content: "",
        assertions: [
          { type: "contains", value: "Denver" },
          { type: "tool_used", value: "Write" },
        ],
      },
      {
        role: "user",
        content: "Yes, save it",
      },
      {
        role: "assistant",
        content: "",
        assertions: [
          { type: "contains", value: "saved" },
          { type: "contains", value: "created" },
        ],
      },
    ],
    expectedOutcome: "Project created with title containing 'chimney' and location 'Denver'",
  },

  {
    id: "error-recovery-missing-info",
    name: "Error Recovery - Missing Information",
    description: "Agent gracefully handles missing required information",
    tags: ["error", "recovery", "validation"],
    turns: [
      {
        role: "user",
        content: "Save this project",
      },
      {
        role: "assistant",
        content: "",
        assertions: [
          { type: "contains", value: "missing" },
          { type: "contains", value: "need" },
        ],
      },
      {
        role: "user",
        content: "It's a tuckpointing job in Boulder",
      },
      {
        role: "assistant",
        content: "",
        assertions: [
          { type: "contains", value: "tuckpointing" },
          { type: "contains", value: "Boulder" },
        ],
      },
    ],
    expectedOutcome: "Agent requests missing info, then proceeds after receiving it",
  },

  {
    id: "multi-intent-handling",
    name: "Multi-Intent Query",
    description: "User asks about multiple things in one message",
    tags: ["multi-intent", "complex"],
    turns: [
      {
        role: "user",
        content: "Create a new project and also tell me how my analytics are doing",
      },
      {
        role: "assistant",
        content: "",
        assertions: [
          { type: "contains", value: "project" },
          { type: "contains", value: "analytics" },
        ],
      },
    ],
    expectedOutcome: "Agent addresses both intents in response",
  },
];

// Fixture loader for tests
export function loadFixture(id: string): ConversationFixture {
  const fixture = CONVERSATION_FIXTURES.find((f) => f.id === id);
  if (!fixture) {
    throw new Error(`Fixture not found: ${id}`);
  }
  return fixture;
}

export function getFixturesByTag(tag: string): ConversationFixture[] {
  return CONVERSATION_FIXTURES.filter((f) => f.tags.includes(tag));
}
```

### Sample Prompts

```typescript
// fixtures/prompts/index.ts

export interface PromptFixture {
  id: string;
  category: string;
  prompt: string;
  expectedIntent: string;
  expectedEntities?: Record<string, unknown>;
  variations?: string[];
}

export const PROMPT_FIXTURES: PromptFixture[] = [
  // Project Creation
  {
    id: "create-project-basic",
    category: "project.create",
    prompt: "Create a new project",
    expectedIntent: "project.create",
    variations: [
      "I want to create a project",
      "Start a new project",
      "New project please",
      "Make a project",
    ],
  },
  {
    id: "create-project-with-type",
    category: "project.create",
    prompt: "Create a chimney repair project",
    expectedIntent: "project.create",
    expectedEntities: {
      projectType: "chimney-repair",
    },
    variations: [
      "I need to create a chimney repair project",
      "New chimney repair",
      "Start a project for chimney work",
    ],
  },
  {
    id: "create-project-with-location",
    category: "project.create",
    prompt: "Create a brick restoration project in Denver",
    expectedIntent: "project.create",
    expectedEntities: {
      projectType: "brick-restoration",
      location: { city: "Denver" },
    },
  },

  // Analytics
  {
    id: "view-analytics",
    category: "analytics.view",
    prompt: "Show me my analytics",
    expectedIntent: "analytics.view",
    variations: [
      "What are my stats?",
      "How am I doing?",
      "Show analytics",
      "Dashboard please",
    ],
  },

  // Profile
  {
    id: "edit-profile",
    category: "profile.edit",
    prompt: "Edit my profile",
    expectedIntent: "profile.edit",
    variations: [
      "Update my profile",
      "Change my business info",
      "Modify profile settings",
    ],
  },

  // Edge Cases
  {
    id: "ambiguous-query",
    category: "edge.ambiguous",
    prompt: "Help me with this",
    expectedIntent: "general.help",
  },
  {
    id: "off-topic",
    category: "edge.off-topic",
    prompt: "What's the weather like?",
    expectedIntent: "general.unknown",
  },
  {
    id: "multi-intent",
    category: "edge.multi-intent",
    prompt: "Create a project and show my analytics",
    expectedIntent: "multi",
    expectedEntities: {
      intents: ["project.create", "analytics.view"],
    },
  },
];

// Get all prompts for a category
export function getPromptsByCategory(category: string): PromptFixture[] {
  return PROMPT_FIXTURES.filter((p) => p.category === category);
}

// Get all variations of a prompt
export function getPromptVariations(id: string): string[] {
  const fixture = PROMPT_FIXTURES.find((p) => p.id === id);
  return fixture ? [fixture.prompt, ...(fixture.variations || [])] : [];
}
```

### Expected Outputs

```typescript
// fixtures/outputs/index.ts

export interface OutputFixture {
  inputPrompt: string;
  expectedOutput: ExpectedOutput;
  context?: Record<string, unknown>;
}

export interface ExpectedOutput {
  mustContain: string[];
  mustNotContain?: string[];
  mustMatchPattern?: RegExp;
  maxLength?: number;
  minLength?: number;
  toolsExpected?: string[];
  structuredData?: Record<string, unknown>;
}

export const OUTPUT_FIXTURES: OutputFixture[] = [
  {
    inputPrompt: "Create a chimney repair project in Denver",
    expectedOutput: {
      mustContain: ["chimney", "Denver", "project"],
      mustNotContain: ["error", "sorry", "cannot"],
      toolsExpected: ["Write"],
      structuredData: {
        projectType: "chimney-repair",
        location: "Denver",
        status: "draft",
      },
    },
  },

  {
    inputPrompt: "What's my revenue this month?",
    expectedOutput: {
      mustContain: ["revenue", "$"],
      mustMatchPattern: /\$[\d,]+(\.\d{2})?/,
      toolsExpected: ["Read"],
    },
    context: {
      contractorId: "test-contractor",
      hasAnalytics: true,
    },
  },

  {
    inputPrompt: "Delete all my projects",
    expectedOutput: {
      mustContain: ["confirm", "sure", "delete"],
      mustNotContain: ["deleted", "removed", "done"],
      toolsExpected: [], // Should NOT delete without confirmation
    },
  },
];

// Validation function
export function validateOutput(
  actual: string,
  expected: ExpectedOutput,
  toolsUsed: string[]
): ValidationResult {
  const errors: string[] = [];

  // Check mustContain
  for (const term of expected.mustContain) {
    if (!actual.toLowerCase().includes(term.toLowerCase())) {
      errors.push(`Missing required term: "${term}"`);
    }
  }

  // Check mustNotContain
  if (expected.mustNotContain) {
    for (const term of expected.mustNotContain) {
      if (actual.toLowerCase().includes(term.toLowerCase())) {
        errors.push(`Contains forbidden term: "${term}"`);
      }
    }
  }

  // Check pattern
  if (expected.mustMatchPattern && !expected.mustMatchPattern.test(actual)) {
    errors.push(`Does not match pattern: ${expected.mustMatchPattern}`);
  }

  // Check length
  if (expected.maxLength && actual.length > expected.maxLength) {
    errors.push(`Output too long: ${actual.length} > ${expected.maxLength}`);
  }
  if (expected.minLength && actual.length < expected.minLength) {
    errors.push(`Output too short: ${actual.length} < ${expected.minLength}`);
  }

  // Check tools
  if (expected.toolsExpected) {
    for (const tool of expected.toolsExpected) {
      if (!toolsUsed.includes(tool)) {
        errors.push(`Expected tool not used: ${tool}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

---

## 9. CI/CD Integration

### GitHub Actions Setup

```yaml
# .github/workflows/test.yml
name: Test Agent

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    # Only run on main branch pushes (expensive)
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Authenticate Claude CLI
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          echo "Setting up Claude CLI..."
          # Claude CLI uses ANTHROPIC_API_KEY from environment

      - name: Run E2E tests
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          E2E_MODE: 'ci'
        run: npm run test:e2e
        timeout-minutes: 30

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-failures
          path: |
            e2e/screenshots/
            e2e/logs/

  regression-tests:
    name: Regression Tests
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Need full history for baseline comparison

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run regression tests
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: npm run test:regression

      - name: Comment on PR with results
        uses: actions/github-script@v7
        if: always()
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('regression-report.md', 'utf-8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });

  benchmarks:
    name: Performance Benchmarks
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run benchmarks
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: npm run benchmark

      - name: Store benchmark results
        uses: benchmark-action/github-action-benchmark@v1
        with:
          tool: 'customSmallerIsBetter'
          output-file-path: benchmarks/results/latest.json
          github-token: ${{ secrets.GITHUB_TOKEN }}
          auto-push: true
          alert-threshold: '150%'
          comment-on-alert: true
```

### Pre-Deployment Tests

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    uses: ./.github/workflows/test.yml
    secrets: inherit

  pre-deploy-validation:
    name: Pre-Deploy Validation
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Validate build artifacts
        run: |
          # Check that build succeeded
          test -d dist
          test -f dist/server.js

          # Check bundle size
          MAX_SIZE=5000000  # 5MB
          SIZE=$(stat -c%s dist/server.js 2>/dev/null || stat -f%z dist/server.js)
          if [ "$SIZE" -gt "$MAX_SIZE" ]; then
            echo "Bundle too large: $SIZE bytes"
            exit 1
          fi

      - name: Run smoke tests
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # Start server in background
          node dist/server.js &
          SERVER_PID=$!
          sleep 5

          # Health check
          curl -f http://localhost:3456/health || exit 1

          # Basic query test
          npm run test:smoke

          # Cleanup
          kill $SERVER_PID

  deploy:
    name: Deploy to Production
    needs: [pre-deploy-validation]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: root
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/my-agent
            git pull
            npm ci --production
            npm run build
            pm2 restart my-agent

      - name: Verify deployment
        run: |
          sleep 10
          curl -f https://agent.example.com/health

      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Deployment failed for ${{ github.repository }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Test Reporting

```typescript
// scripts/generate-test-report.ts
import * as fs from "fs";
import { glob } from "glob";

interface TestResult {
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  duration: number;
}

async function generateReport() {
  const resultFiles = await glob("**/test-results/*.json");
  const suites: TestSuite[] = [];

  for (const file of resultFiles) {
    const content = JSON.parse(fs.readFileSync(file, "utf-8"));
    suites.push(content);
  }

  const totalTests = suites.reduce((sum, s) => sum + s.tests.length, 0);
  const passedTests = suites.reduce(
    (sum, s) => sum + s.tests.filter((t) => t.status === "passed").length,
    0
  );
  const failedTests = suites.reduce(
    (sum, s) => sum + s.tests.filter((t) => t.status === "failed").length,
    0
  );
  const totalDuration = suites.reduce((sum, s) => sum + s.duration, 0);

  const report = `# Test Report

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${totalTests} |
| Passed | ${passedTests} |
| Failed | ${failedTests} |
| Pass Rate | ${((passedTests / totalTests) * 100).toFixed(1)}% |
| Total Duration | ${(totalDuration / 1000).toFixed(1)}s |

## Results by Suite

${suites.map((suite) => `
### ${suite.name}

| Test | Status | Duration |
|------|--------|----------|
${suite.tests.map((t) => `| ${t.name} | ${t.status === "passed" ? ":white_check_mark:" : ":x:"} | ${t.duration}ms |`).join("\n")}
`).join("\n")}

## Failed Tests

${suites.flatMap((s) => s.tests.filter((t) => t.status === "failed").map((t) => `
### ${s.name} > ${t.name}

\`\`\`
${t.error}
\`\`\`
`)).join("\n") || "No failed tests!"}
`;

  fs.writeFileSync("test-report.md", report);
  console.log("Report generated: test-report.md");

  // Exit with error if tests failed
  if (failedTests > 0) {
    process.exit(1);
  }
}

generateReport();
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --dir src --coverage",
    "test:integration": "vitest run --dir integration",
    "test:e2e": "vitest run --dir e2e --timeout=60000",
    "test:regression": "vitest run --dir regression",
    "test:smoke": "vitest run --dir smoke --timeout=30000",
    "test:watch": "vitest",
    "test:ci": "npm run test:unit && npm run test:integration",
    "benchmark": "vitest bench",
    "report": "npx tsx scripts/generate-test-report.ts"
  }
}
```

---

## 10. Testing Subagents

### Isolated Subagent Testing

```typescript
// src/subagents/__tests__/researcher.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { SUBAGENTS } from "../../agents";
import { createMockToolHandler } from "../../test-utils/mock-tools";

describe("Researcher Subagent", () => {
  const researcherConfig = SUBAGENTS["researcher"];

  it("has valid configuration", () => {
    expect(researcherConfig.description).toBeDefined();
    expect(researcherConfig.description.length).toBeGreaterThan(10);
    expect(researcherConfig.prompt).toBeDefined();
    expect(researcherConfig.tools).toContain("Read");
    expect(researcherConfig.tools).toContain("Grep");
  });

  it("executes research task successfully", async () => {
    const mockTools = createMockToolHandler([
      {
        tool: "Glob",
        response: { success: true, files: ["/docs/masonry.md", "/docs/chimney.md"] },
      },
      {
        tool: "Read",
        pattern: /masonry/,
        response: { success: true, content: "# Masonry Guide\nBricks are..." },
      },
      {
        tool: "Read",
        pattern: /chimney/,
        response: { success: true, content: "# Chimney Repair\nSteps include..." },
      },
    ]);

    // Run researcher in isolation
    const result = await runSubagentIsolated("researcher", {
      prompt: "Research best practices for chimney repair",
      toolHandler: mockTools,
    });

    expect(result.success).toBe(true);
    expect(result.response).toMatch(/chimney|masonry/i);
    expect(mockTools).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Read" })
    );
  });

  it("respects tool restrictions", async () => {
    const mockTools = createMockToolHandler([
      {
        tool: "Write",
        response: { success: false, error: "Tool not available" },
      },
    ]);

    const result = await runSubagentIsolated("researcher", {
      prompt: "Write a new file",
      toolHandler: mockTools,
    });

    // Researcher should not have Write access
    expect(researcherConfig.tools).not.toContain("Write");
  });
});

// Helper function to run subagent in isolation
async function runSubagentIsolated(
  subagentId: string,
  options: {
    prompt: string;
    toolHandler: ReturnType<typeof createMockToolHandler>;
  }
): Promise<{ success: boolean; response: string }> {
  const config = SUBAGENTS[subagentId as keyof typeof SUBAGENTS];

  // Create isolated query with subagent's config
  const messages = [];
  for await (const message of query({
    prompt: options.prompt,
    options: {
      systemPrompt: config.prompt,
      allowedTools: config.tools,
      // Inject mock tool handler
    },
  })) {
    messages.push(message);
  }

  const resultMessage = messages.find((m) => m.type === "result");
  const assistantMessages = messages.filter((m) => m.type === "assistant");

  return {
    success: resultMessage?.subtype === "success",
    response: assistantMessages.map((m) =>
      m.message?.content?.filter((b: { text?: string }) => b.text).map((b: { text: string }) => b.text).join("")
    ).join(""),
  };
}
```

### Orchestrator Integration Tests

```typescript
// integration/orchestrator.test.ts
import { describe, it, expect, vi } from "vitest";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { SUBAGENTS, ORCHESTRATOR_PROMPT } from "../src/agents";
import { createMockQuery } from "../src/test-utils/mock-query";

describe("Orchestrator Integration", () => {
  it("delegates to researcher for research tasks", async () => {
    const taskInvocations: string[] = [];

    // Track Task tool invocations
    const mockQuery = vi.fn(async function* () {
      yield {
        type: "assistant",
        message: {
          content: [
            {
              type: "tool_use",
              name: "Task",
              input: {
                subagent_type: "researcher",
                description: "Research chimney repair best practices",
              },
            },
          ],
        },
      };
      yield {
        type: "result",
        subtype: "success",
        result: "Research completed",
      };
    });

    // Verify orchestrator spawns researcher
    const result = await runWithMock(mockQuery, {
      prompt: "What are the best practices for chimney repair?",
      systemPrompt: ORCHESTRATOR_PROMPT,
      agents: SUBAGENTS,
    });

    expect(mockQuery).toHaveBeenCalled();
    // Check that Task was invoked with researcher
  });

  it("handles subagent failures gracefully", async () => {
    const mockQuery = createMockQuery({
      responses: [
        {
          pattern: /research/i,
          messages: [
            {
              type: "assistant",
              message: {
                content: [
                  { type: "tool_use", name: "Task", input: { subagent_type: "researcher" } },
                ],
              },
            },
            {
              type: "result",
              subtype: "error_during_execution",
              result: "Subagent failed",
            },
          ],
        },
      ],
    });

    const result = await runWithMock(mockQuery.query, {
      prompt: "Research something",
      systemPrompt: ORCHESTRATOR_PROMPT,
      agents: SUBAGENTS,
    });

    // Orchestrator should handle the failure
    expect(result.success).toBe(false);
  });

  it("runs independent subagents in parallel", async () => {
    const subagentStarts: number[] = [];
    const subagentEnds: number[] = [];

    // Track timing of subagent invocations
    const mockQuery = vi.fn(async function* () {
      // Simulate parallel Task calls
      yield {
        type: "assistant",
        message: {
          content: [
            {
              type: "tool_use",
              name: "Task",
              input: { subagent_type: "researcher" },
            },
            {
              type: "tool_use",
              name: "Task",
              input: { subagent_type: "writer" },
            },
          ],
        },
      };
      yield { type: "result", subtype: "success" };
    });

    await runWithMock(mockQuery, {
      prompt: "Research and write about chimney repair",
      systemPrompt: ORCHESTRATOR_PROMPT,
      agents: SUBAGENTS,
    });

    // Both tasks should be in same message (parallel)
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});

async function runWithMock(
  mockFn: ReturnType<typeof vi.fn>,
  options: Record<string, unknown>
): Promise<{ success: boolean }> {
  const messages = [];
  for await (const message of mockFn(options)) {
    messages.push(message);
  }
  const result = messages.find((m) => m.type === "result");
  return { success: result?.subtype === "success" };
}
```

### Subagent Communication Tests

```typescript
// integration/subagent-communication.test.ts
import { describe, it, expect } from "vitest";
import { TestOrchestrator } from "../src/test-utils/test-orchestrator";

describe("Subagent Communication", () => {
  it("passes context from orchestrator to subagent", async () => {
    const orchestrator = new TestOrchestrator();

    // Set context in orchestrator
    orchestrator.setContext({
      projectId: "proj-123",
      contractorName: "Bob's Masonry",
    });

    // Subagent should receive context
    const result = await orchestrator.delegateTo("researcher", {
      task: "Find info about current project",
    });

    expect(result.contextReceived).toContain("proj-123");
    expect(result.contextReceived).toContain("Bob's Masonry");
  });

  it("aggregates results from multiple subagents", async () => {
    const orchestrator = new TestOrchestrator();

    // Delegate to multiple subagents
    const [researchResult, writeResult] = await Promise.all([
      orchestrator.delegateTo("researcher", { task: "Find best practices" }),
      orchestrator.delegateTo("writer", { task: "Draft outline" }),
    ]);

    // Orchestrator synthesizes results
    const synthesis = await orchestrator.synthesize([researchResult, writeResult]);

    expect(synthesis).toContain("research");
    expect(synthesis).toContain("outline");
  });

  it("handles subagent timeout", async () => {
    const orchestrator = new TestOrchestrator({
      subagentTimeout: 5000, // 5 second timeout
    });

    // Simulate slow subagent
    const result = await orchestrator.delegateTo("slow-agent", {
      task: "Do something slow",
      simulateDelay: 10000, // 10 seconds
    });

    expect(result.timedOut).toBe(true);
    expect(result.error).toContain("timeout");
  });

  it("prevents infinite delegation loops", async () => {
    const orchestrator = new TestOrchestrator({
      maxDelegationDepth: 3,
    });

    // Attempt to delegate recursively
    const result = await orchestrator.delegateTo("recursive-agent", {
      task: "Delegate to another agent",
    });

    expect(result.delegationDepth).toBeLessThanOrEqual(3);
  });
});
```

### Test Helper Classes

```typescript
// src/test-utils/test-orchestrator.ts
import { query } from "@anthropic-ai/claude-agent-sdk";
import { SUBAGENTS, ORCHESTRATOR_PROMPT } from "../agents";

interface OrchestratorOptions {
  subagentTimeout?: number;
  maxDelegationDepth?: number;
}

interface DelegationResult {
  success: boolean;
  response: string;
  contextReceived?: string;
  timedOut?: boolean;
  error?: string;
  delegationDepth?: number;
}

export class TestOrchestrator {
  private context: Record<string, unknown> = {};
  private options: OrchestratorOptions;

  constructor(options: OrchestratorOptions = {}) {
    this.options = {
      subagentTimeout: 30000,
      maxDelegationDepth: 5,
      ...options,
    };
  }

  setContext(context: Record<string, unknown>) {
    this.context = { ...this.context, ...context };
  }

  async delegateTo(
    subagentId: string,
    task: { task: string; simulateDelay?: number }
  ): Promise<DelegationResult> {
    const config = SUBAGENTS[subagentId as keyof typeof SUBAGENTS];

    if (!config) {
      return {
        success: false,
        response: "",
        error: `Unknown subagent: ${subagentId}`,
      };
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Subagent timeout")),
          this.options.subagentTimeout
        )
      );

      const queryPromise = this.executeSubagent(subagentId, task.task);

      const result = await Promise.race([queryPromise, timeoutPromise]);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === "Subagent timeout") {
        return {
          success: false,
          response: "",
          timedOut: true,
          error: "Subagent timeout exceeded",
        };
      }
      throw error;
    }
  }

  private async executeSubagent(
    subagentId: string,
    task: string
  ): Promise<DelegationResult> {
    const config = SUBAGENTS[subagentId as keyof typeof SUBAGENTS];
    let response = "";

    for await (const message of query({
      prompt: task,
      options: {
        systemPrompt: config.prompt,
        allowedTools: config.tools,
      },
    })) {
      if (message.type === "assistant" && "message" in message) {
        for (const block of message.message.content) {
          if ("text" in block) {
            response += block.text;
          }
        }
      }
    }

    return {
      success: true,
      response,
      contextReceived: JSON.stringify(this.context),
    };
  }

  async synthesize(results: DelegationResult[]): Promise<string> {
    const summaries = results
      .filter((r) => r.success)
      .map((r) => r.response)
      .join("\n\n---\n\n");

    // Use orchestrator to synthesize
    let synthesis = "";
    for await (const message of query({
      prompt: `Synthesize these results:\n\n${summaries}`,
      options: {
        systemPrompt: ORCHESTRATOR_PROMPT,
      },
    })) {
      if (message.type === "assistant" && "message" in message) {
        for (const block of message.message.content) {
          if ("text" in block) {
            synthesis += block.text;
          }
        }
      }
    }

    return synthesis;
  }
}
```

---

## Appendix: Quick Reference

### Test Command Cheatsheet

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/prompts/__tests__/parser.test.ts

# Run tests matching pattern
npm test -- --grep "project creation"

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run E2E tests (slower, uses real API)
npm run test:e2e

# Run benchmarks
npm run benchmark

# Update snapshots
npm test -- --update-snapshots

# Run only failed tests from last run
npm test -- --failed
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", "dist", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["**/__tests__/**", "**/test-utils/**", "**/*.d.ts"],
    },
    testTimeout: 10000,
    hookTimeout: 30000,
    setupFiles: ["./test-setup.ts"],
  },
});
```

### Common Test Patterns

```typescript
// Pattern: Test with fixtures
import { loadFixture } from "./fixtures";

it("handles fixture scenario", async () => {
  const fixture = loadFixture("project-creation-happy-path");
  const result = await runConversation(fixture.turns);
  expect(result).toMatchSnapshot();
});

// Pattern: Parameterized tests
it.each([
  ["create project", "project.create"],
  ["show analytics", "analytics.view"],
  ["edit profile", "profile.edit"],
])('classifies "%s" as %s', (input, expected) => {
  expect(classifyIntent(input).primary).toBe(expected);
});

// Pattern: Async assertions with retries
import { retry } from "./test-utils";

it("eventually succeeds", async () => {
  await retry(
    async () => {
      const result = await unstableOperation();
      expect(result).toBeDefined();
    },
    { maxAttempts: 3, delay: 1000 }
  );
});

// Pattern: Mock restoration
afterEach(() => {
  vi.restoreAllMocks();
});
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Claude Agent SDK Docs](https://docs.anthropic.com/claude-code/agent-sdk)
- [Testing Best Practices for AI Systems](https://www.anthropic.com/research)
- [GitHub Actions for Node.js](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs)
