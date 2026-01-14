# Agent Architecture Patterns

This guide covers the major architectural patterns for building agents with the Claude Agent SDK. Choose the right pattern based on your use case complexity.

## Architecture Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                    Is your task single-domain                    │
│                    with straightforward logic?                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                   YES                      NO
                    │                       │
                    ▼                       ▼
            ┌───────────────┐     ┌─────────────────────────────┐
            │ Single Agent  │     │ Does task require multiple  │
            │   Pattern     │     │ areas of expertise?         │
            └───────────────┘     └──────────────┬──────────────┘
                                                 │
                                     ┌───────────┴───────────┐
                                     │                       │
                                    YES                      NO
                                     │                       │
                                     ▼                       ▼
                        ┌─────────────────────┐   ┌─────────────────────┐
                        │   Orchestrator +    │   │ Are there separate  │
                        │     Subagents       │   │ products/domains?   │
                        └─────────────────────┘   └──────────┬──────────┘
                                                             │
                                                 ┌───────────┴───────────┐
                                                 │                       │
                                                YES                      NO
                                                 │                       │
                                                 ▼                       ▼
                                    ┌─────────────────────┐   ┌─────────────────┐
                                    │  Multi-Agent Fleet  │   │ Event-Driven or │
                                    │                     │   │ Hierarchical    │
                                    └─────────────────────┘   └─────────────────┘
```

---

## Pattern 1: Single Agent

**Best for:** Simple Q&A bots, single-purpose assistants, MVP prototypes

### Architecture

```
┌──────────┐     ┌─────────────────┐     ┌──────────────┐
│   User   │────▶│  Single Agent   │────▶│   Response   │
└──────────┘     │  (Claude API)   │     └──────────────┘
                 │                 │
                 │  ┌───────────┐  │
                 │  │   Tools   │  │
                 │  └───────────┘  │
                 └─────────────────┘
```

### Implementation

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const response = query({
  prompt: userMessage,
  options: {
    model: "claude-sonnet-4-5-20250929",
    systemPrompt: `You are a helpful assistant for masonry contractors.
You help answer questions about projects, scheduling, and best practices.`,
    allowedTools: ["Read", "Glob", "Grep", "WebSearch"],
    cwd: "/path/to/project",
    permissionMode: "acceptEdits",
  },
});

for await (const message of response) {
  // Handle streaming response
}
```

### When to Use

| Scenario | Single Agent? |
|----------|---------------|
| FAQ bot with knowledge base | ✅ Yes |
| Simple code assistant | ✅ Yes |
| Basic data lookup | ✅ Yes |
| Multi-step research task | ❌ No |
| Content pipeline (analyze → write → review) | ❌ No |

### Pros & Cons

**Pros:**
- Simplest to implement and debug
- Lowest latency (no coordination overhead)
- Easiest to reason about

**Cons:**
- Limited context window for complex tasks
- No parallelization
- Single point of failure

---

## Pattern 2: Orchestrator + Subagents (Recommended)

**Best for:** Multi-specialty work, complex domain problems, content pipelines

### Architecture

```
                         ┌─────────────────────────────────────────┐
                         │              ORCHESTRATOR               │
                         │  Routes requests to specialist agents   │
                         └───────────────┬─────────────────────────┘
                                         │
           ┌─────────────────────────────┼─────────────────────────────┐
           │                             │                             │
           ▼                             ▼                             ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   RESEARCHER        │     │   WRITER            │     │   REVIEWER          │
│   subagent          │     │   subagent          │     │   subagent          │
├─────────────────────┤     ├─────────────────────┤     ├─────────────────────┤
│ Tools:              │     │ Tools:              │     │ Tools:              │
│ - Read              │     │ - Read              │     │ - Read              │
│ - Grep              │     │ - Write             │     │ - Grep              │
│ - WebSearch         │     │ - Edit              │     │                     │
│                     │     │                     │     │                     │
│ Model: sonnet       │     │ Model: sonnet       │     │ Model: haiku        │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### Implementation

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

// Define specialists
const SUBAGENTS = {
  "researcher": {
    description: "Use when you need to gather information, search documentation, or analyze existing code patterns",
    prompt: `# Research Specialist

You are a research specialist who excels at finding and synthesizing information.

## Your Expertise
- Searching codebases and documentation
- Analyzing patterns and best practices
- Synthesizing findings into actionable insights

## Guidelines
- Always cite sources (file paths, URLs)
- Summarize findings concisely
- Highlight key takeaways`,
    tools: ["Read", "Glob", "Grep", "WebSearch", "WebFetch"],
  },

  "writer": {
    description: "Use when you need to create, write, or modify content, code, or documentation",
    prompt: `# Writing Specialist

You are a writing specialist who creates high-quality content and code.

## Your Expertise
- Technical writing and documentation
- Code generation and modification
- Clear, concise communication

## Guidelines
- Follow existing code patterns and style
- Write self-documenting code
- Include necessary comments for complex logic`,
    tools: ["Read", "Write", "Edit", "Glob"],
  },

  "reviewer": {
    description: "Use when you need to validate work, check for errors, or ensure quality standards",
    prompt: `# Review Specialist

You are a review specialist who ensures quality and correctness.

## Your Expertise
- Code review and error detection
- Quality assurance
- Consistency checking

## Guidelines
- Be thorough but constructive
- Prioritize high-impact issues
- Suggest specific fixes`,
    tools: ["Read", "Glob", "Grep"],
    model: "haiku",  // Fast model for review
  },
};

// Orchestrator query
const response = query({
  prompt: userMessage,
  options: {
    model: "claude-sonnet-4-5-20250929",
    systemPrompt: `# Orchestrator

You coordinate specialist agents to complete complex tasks.

## Available Specialists
| Agent | When to Use |
|-------|-------------|
| researcher | Information gathering, pattern analysis |
| writer | Content creation, code generation |
| reviewer | Quality checks, validation |

## Your Role
1. Analyze the user's request
2. Break it into subtasks for specialists
3. Delegate using the Task tool
4. Synthesize results into a coherent response

## Guidelines
- Delegate to specialists for their expertise
- Run independent tasks in parallel when possible
- Review and synthesize specialist outputs`,
    allowedTools: ["Read", "Glob", "Task"],  // Task required for subagents!
    agents: SUBAGENTS,
    permissionMode: "acceptEdits",
  },
});
```

### Key Rules

1. **Task tool is required** - Include `"Task"` in orchestrator's `allowedTools`
2. **No nesting** - Subagents CANNOT spawn other subagents
3. **Tool inheritance** - Omit `tools` to inherit all parent tools
4. **Model override** - Use `model: "haiku"` for simple/fast tasks

### Parallel Execution

Subagents can run in parallel for independent tasks:

```typescript
// Orchestrator spawns these in parallel:
// - researcher: Find existing patterns
// - writer: Draft initial structure
// Both complete, then reviewer validates
```

### When to Use

| Scenario | Orchestrator + Subagents? |
|----------|---------------------------|
| Content pipeline (research → write → review) | ✅ Yes |
| Multi-domain expert system | ✅ Yes |
| Code analysis with recommendations | ✅ Yes |
| Simple Q&A | ❌ No (overhead) |
| Real-time chat | ❌ No (latency) |

### Pros & Cons

**Pros:**
- Context isolation prevents overload
- Parallel execution speeds up complex tasks
- Specialized prompts improve quality
- Modular: add/remove agents easily

**Cons:**
- Higher latency (coordination overhead)
- More complex to debug
- Higher cost (multiple model calls)

---

## Pattern 3: Multi-Agent Fleet

**Best for:** Different products/domains, isolated concerns, microservices-style

### Architecture

```
                        ┌─────────────────────────────────────┐
                        │           LOAD BALANCER             │
                        │      (Nginx / Cloudflare Tunnel)    │
                        └───────────────────┬─────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        │                                   │                                   │
        ▼                                   ▼                                   ▼
┌───────────────────┐           ┌───────────────────┐           ┌───────────────────┐
│   PORTFOLIO       │           │   REVIEWS         │           │   RANK TRACKER    │
│   AGENT           │           │   AGENT           │           │   AGENT           │
│   :3456           │           │   :3457           │           │   :3458           │
├───────────────────┤           ├───────────────────┤           ├───────────────────┤
│ Domain:           │           │ Domain:           │           │ Domain:           │
│ Project creation  │           │ Review analysis   │           │ SEO tracking      │
│                   │           │                   │           │                   │
│ Database:         │           │ Database:         │           │ Database:         │
│ portfolio_db      │           │ reviews_db        │           │ rankings_db       │
│                   │           │                   │           │                   │
│ Codebase:         │           │ Codebase:         │           │ Codebase:         │
│ /opt/portfolio    │           │ /opt/reviews      │           │ /opt/rankings     │
└───────────────────┘           └───────────────────┘           └───────────────────┘
```

### Implementation

Each agent is a separate deployment:

**Agent A: Portfolio Agent**
```typescript
// /opt/portfolio-agent/src/server.ts
const response = query({
  prompt: userMessage,
  options: {
    model: "claude-sonnet-4-5-20250929",
    systemPrompt: `You are the Portfolio Agent. You help contractors create project showcases.`,
    cwd: "/opt/portfolio-agent",
    additionalDirectories: ["/opt/portfolio-agent/docs"],
  },
});
```

**Agent B: Reviews Agent**
```typescript
// /opt/reviews-agent/src/server.ts
const response = query({
  prompt: userMessage,
  options: {
    model: "claude-sonnet-4-5-20250929",
    systemPrompt: `You are the Reviews Agent. You analyze contractor reviews and generate insights.`,
    cwd: "/opt/reviews-agent",
    additionalDirectories: ["/opt/reviews-agent/docs"],
  },
});
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/agents
upstream portfolio {
    server localhost:3456;
}

upstream reviews {
    server localhost:3457;
}

upstream rankings {
    server localhost:3458;
}

server {
    listen 80;
    server_name agents.knearme.co;

    # Portfolio agent
    location /portfolio/ {
        proxy_pass http://portfolio/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    # Reviews agent
    location /reviews/ {
        proxy_pass http://reviews/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    # Rankings agent
    location /rankings/ {
        proxy_pass http://rankings/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

### When to Use

| Scenario | Multi-Agent Fleet? |
|----------|-------------------|
| Multiple products with different domains | ✅ Yes |
| Microservices-style isolation | ✅ Yes |
| Independent scaling needs | ✅ Yes |
| Shared knowledge base | ❌ No |
| Tightly coupled tasks | ❌ No |

### Pros & Cons

**Pros:**
- Complete isolation (failures don't cascade)
- Independent deployment and scaling
- Different configurations per agent
- Clear ownership boundaries

**Cons:**
- More infrastructure to manage
- No shared context between agents
- Higher operational complexity
- Cross-agent coordination is manual

---

## Pattern 4: Hierarchical Agents

**Best for:** Large-scale systems, multi-level delegation, enterprise workflows

### Architecture

```
                              ┌─────────────────────────────────┐
                              │         EXECUTIVE AGENT         │
                              │   High-level strategy & routing │
                              └───────────────┬─────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
        ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
        │ MANAGER AGENT A   │     │ MANAGER AGENT B   │     │ MANAGER AGENT C   │
        │ (Content Team)    │     │ (Analysis Team)   │     │ (Ops Team)        │
        └─────────┬─────────┘     └─────────┬─────────┘     └─────────┬─────────┘
                  │                         │                         │
        ┌─────────┼─────────┐     ┌─────────┼─────────┐     ┌─────────┼─────────┐
        │         │         │     │         │         │     │         │         │
        ▼         ▼         ▼     ▼         ▼         ▼     ▼         ▼         ▼
     Worker   Worker   Worker  Worker   Worker   Worker  Worker   Worker   Worker
```

### Implementation Strategy

Since the SDK doesn't allow subagent nesting, implement hierarchy with separate queries:

```typescript
// Executive level
async function executeWorkflow(userRequest: string) {
  // 1. Executive determines strategy
  const strategy = await queryExecutive(userRequest);

  // 2. Managers execute in parallel
  const managerResults = await Promise.all([
    queryContentManager(strategy.contentTasks),
    queryAnalysisManager(strategy.analysisTasks),
    queryOpsManager(strategy.opsTasks),
  ]);

  // 3. Executive synthesizes
  return await querySynthesis(managerResults);
}

async function queryContentManager(tasks: string[]) {
  // Manager has its own subagents
  return query({
    prompt: tasks.join("\n"),
    options: {
      systemPrompt: "You manage content creation...",
      agents: {
        "writer": { /* ... */ },
        "editor": { /* ... */ },
      },
    },
  });
}
```

### When to Use

| Scenario | Hierarchical? |
|----------|--------------|
| Large enterprise workflows | ✅ Yes |
| Multi-department coordination | ✅ Yes |
| Complex approval chains | ✅ Yes |
| Simple tasks | ❌ No (overkill) |
| Real-time requirements | ❌ No (latency) |

---

## Pattern 5: Event-Driven Agents

**Best for:** Async workflows, webhook integrations, background processing

### Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐
│   Webhook    │────▶│    Queue     │────▶│      Agent Worker        │
│   (Trigger)  │     │   (Redis)    │     │   (Processes events)     │
└──────────────┘     └──────────────┘     └──────────────────────────┘
                                                      │
                                          ┌───────────┴───────────┐
                                          │                       │
                                          ▼                       ▼
                                    ┌───────────┐           ┌───────────┐
                                    │  Result   │           │  Notify   │
                                    │  Storage  │           │  User     │
                                    └───────────┘           └───────────┘
```

### Implementation

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import Redis from "ioredis";

const redis = new Redis();

// Event listener
async function processEvents() {
  while (true) {
    // Block until event available
    const event = await redis.brpop("agent:events", 0);

    if (event) {
      const { type, payload } = JSON.parse(event[1]);

      // Process based on event type
      switch (type) {
        case "new_project":
          await handleNewProject(payload);
          break;
        case "review_submitted":
          await handleReview(payload);
          break;
      }
    }
  }
}

async function handleNewProject(payload: { projectId: string; images: string[] }) {
  const response = query({
    prompt: `Analyze project ${payload.projectId} with ${payload.images.length} images`,
    options: {
      model: "claude-sonnet-4-5-20250929",
      systemPrompt: "You analyze masonry projects...",
    },
  });

  // Store results
  let result = "";
  for await (const message of response) {
    if (message.type === "result") {
      await redis.set(`project:${payload.projectId}:analysis`, result);
      // Notify user
      await redis.publish("notifications", JSON.stringify({
        userId: payload.userId,
        message: "Project analysis complete",
      }));
    }
  }
}
```

### When to Use

| Scenario | Event-Driven? |
|----------|--------------|
| Webhook integrations (Jobber, Stripe) | ✅ Yes |
| Background processing | ✅ Yes |
| Async notifications | ✅ Yes |
| Interactive chat | ❌ No |
| Real-time responses needed | ❌ No |

---

## Choosing the Right Pattern

### Quick Reference

| Pattern | Complexity | Latency | Scalability | Best For |
|---------|------------|---------|-------------|----------|
| Single Agent | Low | Low | Limited | MVPs, simple tasks |
| Orchestrator + Subagents | Medium | Medium | Good | Complex domains |
| Multi-Agent Fleet | High | Low | Excellent | Multiple products |
| Hierarchical | Very High | High | Excellent | Enterprise |
| Event-Driven | Medium | Async | Excellent | Background work |

### Decision Questions

1. **How many distinct expertise areas?**
   - 1 → Single Agent
   - 2-5 → Orchestrator + Subagents
   - 5+ → Consider Fleet or Hierarchical

2. **Are tasks independent?**
   - Yes → Fleet or Event-Driven
   - No → Orchestrator + Subagents

3. **Real-time required?**
   - Yes → Single Agent or Orchestrator
   - No → Event-Driven acceptable

4. **Team structure?**
   - Single team → Orchestrator + Subagents
   - Multiple teams → Multi-Agent Fleet

---

## Migration Paths

### Single Agent → Orchestrator + Subagents

```typescript
// Before: Monolithic prompt
systemPrompt: `You help with research, writing, and review...`

// After: Split into specialists
orchestratorPrompt: `You coordinate specialists...`
agents: {
  "researcher": { ... },
  "writer": { ... },
  "reviewer": { ... },
}
```

### Orchestrator → Fleet

When subagents become complex enough to need their own subagents:

1. Extract subagent to separate codebase
2. Deploy as independent service
3. Update orchestrator to call via HTTP/queue instead of Task tool

---

## Resources

- [Claude Agent SDK Docs](https://docs.anthropic.com/claude-code/agent-sdk)
- [Subagents Documentation](https://docs.claude.com/en/docs/agent-sdk/subagents)
- [VPS Deployment Guide](./SKILL.md#vps-deployment)
