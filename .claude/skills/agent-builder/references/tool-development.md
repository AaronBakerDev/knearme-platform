# Tool Development Guide

This comprehensive guide covers all aspects of working with tools in the Claude Agent SDK. Tools are the primary mechanism for agents to interact with the external world - reading files, executing code, searching the web, and delegating to other agents.

---

## 1. Available Tool Categories

The Claude Agent SDK provides a comprehensive set of built-in tools organized into functional categories.

### Complete Tool Reference Table

| Category | Tool | Purpose | When to Use |
|----------|------|---------|-------------|
| **File Operations** | `Read` | Read files (text, images, PDFs, notebooks) | Need to view file contents, analyze images, parse PDFs |
| | `Write` | Create/overwrite files | Create new files or replace entire file contents |
| | `Edit` | Edit existing files (string replacement) | Modify specific parts of existing files |
| | `Glob` | Find files by pattern | Search for files by name pattern (e.g., `**/*.ts`) |
| | `Grep` | Search file contents with regex | Find text patterns across codebase |
| **Execution** | `Bash` | Execute shell commands | Run CLI tools, scripts, git commands |
| | `BashOutput` | Get output from background shells | Check on long-running processes |
| | `KillBash` | Kill background shell processes | Terminate hung or no-longer-needed processes |
| **Web** | `WebSearch` | Search the web | Get current information, documentation, news |
| | `WebFetch` | Fetch and process URLs | Read specific web pages, API docs |
| **Agent Control** | `Task` | Spawn subagents | Delegate complex subtasks to specialist agents |
| **UI/UX** | `Skill` | Invoke registered skills | Use project or user-defined skill workflows |
| | `TodoWrite` | Track task lists | Manage multi-step task progress |
| | `AskUserQuestion` | Ask user for clarification | Get missing information, confirm actions |
| **Notebooks** | `NotebookEdit` | Edit Jupyter notebooks | Modify `.ipynb` cells |

### Tool Category Details

#### File Operations

```typescript
// Read - Supports multiple file types
allowedTools: ["Read"]
// Reads: .ts, .js, .md, .json, .png, .jpg, .pdf, .ipynb

// Write - Creates or overwrites files
allowedTools: ["Write"]
// Note: Requires Read first for existing files

// Edit - String replacement in files
allowedTools: ["Edit"]
// Note: Requires Read first, uses old_string/new_string pattern

// Glob - Pattern-based file finding
allowedTools: ["Glob"]
// Examples: "**/*.ts", "src/**/*.test.js", "*.md"

// Grep - Regex content search
allowedTools: ["Grep"]
// Features: regex, file type filters, context lines
```

#### Execution Tools

```typescript
// Bash - Shell command execution
allowedTools: ["Bash"]
// Features: timeout, background execution, working directory

// BashOutput - Read background process output
allowedTools: ["BashOutput"]
// Use after Bash with run_in_background: true

// KillBash - Terminate processes
allowedTools: ["KillBash"]
// Use to clean up hung background processes
```

#### Web Tools

```typescript
// WebSearch - Web search with AI processing
allowedTools: ["WebSearch"]
// Returns: search results with links

// WebFetch - Fetch and process URLs
allowedTools: ["WebFetch"]
// Processes: HTML to markdown, content extraction
```

#### Agent Control

```typescript
// Task - Spawn subagents (REQUIRED for subagent pattern)
allowedTools: ["Task"]
// Spawns specialist agents defined in `agents` option
// CRITICAL: Must be included for orchestrator pattern
```

#### UI/UX Tools

```typescript
// Skill - Invoke registered skills
allowedTools: ["Skill"]
// Invokes skills from .claude/skills/ directories

// TodoWrite - Task list management
allowedTools: ["TodoWrite"]
// Tracks: pending, in_progress, completed tasks

// AskUserQuestion - User interaction
allowedTools: ["AskUserQuestion"]
// Use for: confirmations, missing info, ambiguous requests
```

---

## 2. Tool Selection Best Practices

### Matching Tools to Agent Role

Different agent roles require different tool sets. Match tools to the agent's responsibilities:

```typescript
// Research-focused agent
const RESEARCHER_TOOLS = ["Read", "Glob", "Grep", "WebSearch", "WebFetch"];

// Writing/editing agent
const WRITER_TOOLS = ["Read", "Write", "Edit", "Glob"];

// Analysis-only agent (read-only, safe)
const ANALYST_TOOLS = ["Read", "Glob", "Grep"];

// Full-capability agent (use sparingly)
const FULL_TOOLS = [
  "Read", "Write", "Edit", "Glob", "Grep",
  "Bash", "WebSearch", "WebFetch", "Task"
];

// Orchestrator (coordination only)
const ORCHESTRATOR_TOOLS = ["Read", "Glob", "Task"];
```

### Role-Based Tool Matrix

| Agent Role | File Ops | Execution | Web | Subagents | UI |
|------------|----------|-----------|-----|-----------|-----|
| Researcher | Read, Glob, Grep | - | WebSearch, WebFetch | - | - |
| Writer | Read, Write, Edit | - | - | - | - |
| Reviewer | Read, Glob, Grep | - | - | - | - |
| DevOps | Read, Write, Edit | Bash, BashOutput | - | - | - |
| Orchestrator | Read, Glob | - | - | Task | TodoWrite |
| Full Agent | All | All | All | Task | All |

### Least-Privilege Approach

Always grant the minimum tools needed for the task:

```typescript
// BAD: Over-privileged agent
const response = query({
  prompt: "Analyze this codebase",
  options: {
    allowedTools: ["Read", "Write", "Edit", "Bash", "Task", "WebSearch"],
    // Risk: Agent could modify files when only analysis needed
  },
});

// GOOD: Right-sized permissions
const response = query({
  prompt: "Analyze this codebase",
  options: {
    allowedTools: ["Read", "Glob", "Grep"],
    // Only read access - safe for analysis
  },
});
```

**Privilege Escalation Pattern:**

When an agent needs elevated permissions temporarily:

```typescript
// Orchestrator with limited tools delegates to specialized agent
const SUBAGENTS = {
  "code-modifier": {
    description: "Use ONLY when you need to modify code files",
    prompt: "You are a code modification specialist...",
    tools: ["Read", "Write", "Edit", "Glob"],
  },
  "analyzer": {
    description: "Use for code analysis and research",
    prompt: "You are a code analysis specialist...",
    tools: ["Read", "Glob", "Grep"],
  },
};

// Orchestrator only has Task tool - delegates modifications
const response = query({
  prompt: userMessage,
  options: {
    allowedTools: ["Read", "Glob", "Task"],
    agents: SUBAGENTS,
  },
});
```

### Performance Considerations

| Tool | Latency | Resource Impact | Notes |
|------|---------|-----------------|-------|
| Read | Low | Low | Fast for text, slower for images/PDFs |
| Glob | Low | Low | Use specific patterns to reduce matches |
| Grep | Low-Medium | Medium | Regex complexity affects speed |
| Write | Low | Low | Atomic writes |
| Edit | Low | Low | String matching can be slow on large files |
| Bash | Variable | Variable | Depends on command; set timeouts |
| WebSearch | Medium | External API | Rate limited; cache when possible |
| WebFetch | Medium | External API | Cache responses; respect robots.txt |
| Task | High | High | Spawns new agent instance |

**Optimization Tips:**

```typescript
// 1. Batch file reads when possible
// Instead of multiple Read calls, use Glob + strategic Reads

// 2. Use Grep before Read for large codebases
// First find relevant files, then read specific ones

// 3. Set reasonable Bash timeouts
const response = query({
  prompt: "Run tests",
  options: {
    allowedTools: ["Bash"],
    // Agent can set timeout per command
  },
});

// 4. Avoid unnecessary Task spawning
// Only delegate when genuinely beneficial
```

---

## 3. Tool Calling Patterns

### How Agents Decide Which Tool to Use

The agent's decision process for tool selection follows this hierarchy:

```
1. Parse user intent
   └─▶ What is the goal?

2. Match intent to capabilities
   └─▶ Which tools can achieve this?

3. Evaluate constraints
   ├─▶ Which tools are allowed?
   ├─▶ What are the permissions?
   └─▶ What are the risks?

4. Select optimal tool
   └─▶ Least-cost path to goal

5. Execute and iterate
   └─▶ Tool result informs next action
```

**System Prompt Guidance:**

Guide tool selection through the system prompt:

```typescript
const systemPrompt = `# Code Review Agent

## Tool Usage Guidelines

### When to use each tool:
- **Glob**: Start by finding relevant files (e.g., "**/*.ts")
- **Grep**: Search for specific patterns across files
- **Read**: Read files you need to analyze
- **WebSearch**: Look up documentation or best practices

### Tool Priority:
1. Always start with Glob to understand file structure
2. Use Grep to narrow down to relevant files
3. Read files for detailed analysis
4. Only use WebSearch for external references

### Never:
- Modify files (you don't have Write/Edit access)
- Execute commands (you don't have Bash access)
`;
```

### Tool Chaining Patterns

#### Sequential Chain (Common)

Execute tools in order where each result informs the next:

```
Glob → Read → Edit → Read (verify)
```

```typescript
// Agent naturally chains: find files → read → modify → verify
const systemPrompt = `
When modifying code:
1. First use Glob to find the file
2. Use Read to understand current implementation
3. Use Edit to make changes
4. Use Read again to verify the change
`;
```

#### Parallel Exploration

Independent searches that combine results:

```
┌─▶ Grep (pattern A) ─┐
│                      │
├─▶ Grep (pattern B) ─┼─▶ Synthesize
│                      │
└─▶ WebSearch ────────┘
```

```typescript
// Agent can call multiple tools in parallel
// (handled automatically by the SDK when tools are independent)

// Example: Research task
const systemPrompt = `
For research tasks, gather information from multiple sources:
- Search the codebase for relevant patterns
- Check documentation online
- Look at test files for usage examples

You can search multiple sources simultaneously.
`;
```

#### Branching Pattern

Different paths based on tool results:

```
Read config.json
      │
      ├─▶ [has database section] → Grep for DB queries
      │
      └─▶ [no database section] → Check environment vars
```

```typescript
const systemPrompt = `
When analyzing configuration:
1. Read the main config file
2. Based on what you find:
   - If database config exists: search for database usage
   - If no database config: check for environment variables
   - If neither: ask user about data storage approach
`;
```

### Parallel Tool Calls

The SDK supports parallel tool execution for independent operations:

```typescript
// These can execute in parallel:
// - Glob for TypeScript files
// - WebSearch for React best practices
// - Read existing package.json

// The agent will naturally parallelize when:
// 1. Operations are independent
// 2. Results don't depend on each other
// 3. Combined results answer the question

// System prompt to encourage parallelism:
const systemPrompt = `
When gathering information, run independent searches in parallel:
- Search codebase while fetching documentation
- Read multiple files simultaneously
- Combine results for comprehensive analysis
`;
```

---

## 4. Error Handling

### Common Failure Modes

| Tool | Common Failures | Cause |
|------|-----------------|-------|
| Read | File not found | Path typo, file deleted, wrong directory |
| Write | Permission denied | File locked, directory doesn't exist |
| Edit | String not found | Content changed, whitespace issues |
| Glob | No matches | Pattern too specific, wrong path |
| Grep | Timeout | Pattern too broad, huge codebase |
| Bash | Command failed | Missing dependency, syntax error |
| WebSearch | Rate limited | Too many requests |
| WebFetch | Connection failed | URL invalid, site down |
| Task | Subagent error | Invalid agent config, circular reference |

### Retry Strategies

#### Simple Retry with Backoff

```typescript
// Guide agent to retry with backoff
const systemPrompt = `
## Error Handling

When a tool fails:
1. Analyze the error message
2. Adjust your approach based on the error
3. Retry with modifications

Common fixes:
- File not found: Check path, use Glob to find correct location
- Edit failed: Re-read file, verify exact string match
- Command failed: Check prerequisites, try alternative approach
`;
```

#### Adaptive Retry Pattern

```typescript
const systemPrompt = `
## Adaptive Error Handling

### File Operations
If Read fails:
1. Use Glob to verify file exists
2. Check parent directory with Glob("*")
3. If still not found, inform user

If Edit fails (string not found):
1. Re-read the file to get current content
2. Use exact string from file (copy-paste approach)
3. If content changed, adjust to new content

### Command Execution
If Bash fails:
1. Check error message for missing dependencies
2. Try alternative command if available
3. Reduce scope (e.g., fewer files, simpler operation)
4. If persistent, inform user of blocker

### Web Operations
If WebSearch/WebFetch fails:
1. Try alternative search terms
2. Try different URL format
3. Fall back to cached/known information
4. Inform user if external info unavailable
`;
```

### Fallback Patterns

#### Graceful Degradation

```typescript
const systemPrompt = `
## Fallback Strategy

### Primary → Secondary → Inform User

**Finding Documentation:**
1. Try: WebFetch official docs URL
2. Fallback: WebSearch for docs
3. Fallback: Check local README files
4. Final: Inform user docs unavailable

**Finding Code Patterns:**
1. Try: Grep for exact pattern
2. Fallback: Glob for similar files + Read
3. Fallback: Read index/main entry points
4. Final: Ask user for guidance

**Executing Commands:**
1. Try: Preferred command
2. Fallback: Alternative command
3. Fallback: Manual steps user can run
4. Final: Document what needs to happen
`;
```

#### Error Recovery Chain

```typescript
// Example: File modification with recovery
const systemPrompt = `
When editing files, always maintain recoverability:

1. Read file before modification
2. Store original content mentally
3. Make the edit
4. Verify with Read
5. If verification fails:
   - Attempt to restore from memory
   - If restoration fails, inform user of state
`;
```

### User Notification

When errors cannot be recovered, notify users clearly:

```typescript
const systemPrompt = `
## User Notification Protocol

When you encounter an unrecoverable error:

1. **Clearly state what failed**
   Example: "I was unable to install the dependency..."

2. **Explain why it failed**
   Example: "...because npm registry returned a 503 error."

3. **Suggest alternatives**
   Example: "You could try:
   - Running 'npm install' manually
   - Checking if the registry is down
   - Using a different package"

4. **Offer to help differently**
   Example: "Would you like me to find an alternative package?"

Never:
- Hide errors or pretend success
- Repeat the same failing operation without changes
- Give up without explaining the situation
`;
```

---

## 5. MCP (Model Context Protocol) Integration

### What is MCP?

MCP (Model Context Protocol) is a standard for connecting AI models to external tools and data sources. It allows agents to access capabilities beyond the built-in tools.

```
┌──────────────────┐         ┌─────────────────┐
│   Claude Agent   │◀───────▶│   MCP Server    │
│                  │         │                 │
│  Built-in Tools  │         │  - Database     │
│  + MCP Tools     │         │  - Custom API   │
│                  │         │  - Browser      │
└──────────────────┘         └─────────────────┘
```

### When to Use MCP vs Built-in Tools

| Use Built-in Tools | Use MCP |
|--------------------|---------|
| File operations on local filesystem | Database queries (Supabase, PostgreSQL) |
| Basic shell commands | Browser automation |
| Web search/fetch | Custom API integrations |
| Subagent delegation | Specialized domain tools |
| Standard development tasks | Proprietary system access |

### Setting Up MCP Servers

#### Configuration File Location

MCP servers are configured in `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://xxx.supabase.co",
        "SUPABASE_KEY": "${SUPABASE_KEY}"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    },
    "browser": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-browser"],
      "env": {}
    }
  }
}
```

#### Using MCP in Agent SDK

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const response = query({
  prompt: "Query the users table for recent signups",
  options: {
    model: "claude-sonnet-4-5-20250929",
    systemPrompt: "You have access to the database via MCP...",
    // MCP servers are automatically loaded from config
    // No additional configuration needed in query options
  },
});
```

### Popular MCP Servers

| Server | Purpose | Package |
|--------|---------|---------|
| Supabase | Database operations | `@modelcontextprotocol/server-supabase` |
| PostgreSQL | Direct DB access | `@modelcontextprotocol/server-postgres` |
| Browser | Web automation | `@anthropic-ai/mcp-server-browser` |
| Filesystem | File operations | `@modelcontextprotocol/server-filesystem` |
| Memory | Persistent memory | `@modelcontextprotocol/server-memory` |
| GitHub | GitHub operations | `@modelcontextprotocol/server-github` |

### Custom MCP Tool Creation

For domain-specific tools, create a custom MCP server:

```typescript
// custom-mcp-server/src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "my-custom-tools",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
  },
});

// Define tools
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "analyze_project",
        description: "Analyze a masonry project for quality metrics",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "string", description: "Project ID" },
            metrics: {
              type: "array",
              items: { type: "string" },
              description: "Metrics to analyze",
            },
          },
          required: ["projectId"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "analyze_project") {
    const result = await analyzeProject(args.projectId, args.metrics);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

Register in `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "custom-tools": {
      "command": "node",
      "args": ["./custom-mcp-server/dist/index.js"]
    }
  }
}
```

---

## 6. Custom Tool Patterns (via Skills)

Skills extend agent capabilities without modifying the SDK. They're filesystem-based, shareable, and can include scripts, references, and assets.

### Creating Skill-Based Tools

Skills live in `.claude/skills/` directories:

```
.claude/skills/
├── project-analyzer/
│   ├── SKILL.md           # Skill definition (required)
│   ├── scripts/
│   │   └── analyze.py     # Executable script
│   └── references/
│       └── quality-metrics.md
└── seo-optimizer/
    ├── SKILL.md
    ├── scripts/
    │   └── check-seo.ts
    └── assets/
        └── seo-checklist.json
```

### Script-Backed Tools

Create tools that execute scripts:

```markdown
<!-- .claude/skills/project-analyzer/SKILL.md -->

# Project Analyzer

Analyze masonry projects for quality and completeness.

## Metadata

- **Name:** project-analyzer
- **Version:** 1.0.0
- **Tags:** analysis, quality

## When to Use

Use this skill when:
- Reviewing project submissions
- Checking content completeness
- Generating quality scores

## Usage

### Analyze a Project

```bash
# Run the analysis script
python scripts/analyze.py --project-id <id> --output json
```

### Output Format

The script returns:
- quality_score: 0-100
- completeness: percentage
- issues: array of problems
- recommendations: array of suggestions

## Guidelines

- Always check image quality first
- Verify description length (400-600 words)
- Ensure proper categorization
```

The script itself:

```python
#!/usr/bin/env python3
# .claude/skills/project-analyzer/scripts/analyze.py

import argparse
import json
import sys

def analyze_project(project_id: str) -> dict:
    """Analyze a project and return quality metrics."""
    # Implementation here
    return {
        "quality_score": 85,
        "completeness": 0.9,
        "issues": [],
        "recommendations": ["Add more process photos"]
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-id", required=True)
    parser.add_argument("--output", default="json")
    args = parser.parse_args()

    result = analyze_project(args.project_id)

    if args.output == "json":
        print(json.dumps(result, indent=2))
    else:
        print(f"Quality Score: {result['quality_score']}")
```

### Reference Document Tools

Skills can provide domain knowledge via reference documents:

```markdown
<!-- .claude/skills/masonry-expert/SKILL.md -->

# Masonry Expert

Provides expert knowledge about masonry techniques and materials.

## When to Use

Use this skill when:
- Answering questions about masonry techniques
- Reviewing project descriptions for accuracy
- Suggesting appropriate materials

## Reference Documents

Load these references as needed:

- `references/brick-types.md` - Comprehensive brick type guide
- `references/mortar-mixes.md` - Mortar mix ratios and uses
- `references/techniques.md` - Common masonry techniques
- `references/terminology.md` - Industry terminology

## Usage

When answering masonry questions:
1. Read relevant reference document
2. Apply knowledge to specific question
3. Cite specific techniques or materials
```

### Enabling Skills in Agent SDK

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const response = query({
  prompt: userMessage,
  options: {
    model: "claude-sonnet-4-5-20250929",
    cwd: "/path/to/project",
    // Load skills from user and project directories
    settingSources: ["user", "project"],
    // Include Skill tool to invoke skills
    allowedTools: ["Read", "Glob", "Grep", "Skill", "Bash"],
  },
});
```

### Skills vs Subagents Comparison

| Feature | Skills | Subagents |
|---------|--------|-----------|
| Definition | Filesystem (`SKILL.md`) | Code (`agents` option) |
| Invocation | Via `Skill` tool | Via `Task` tool |
| Context | Extends current agent | Separate agent instance |
| State | Shares parent state | Isolated state |
| Best for | Reusable workflows | Complex delegation |

---

## 7. Tool Result Caching

### When to Cache

Cache tool results when:

| Scenario | Cache? | Reason |
|----------|--------|--------|
| File read (within session) | Yes | File unlikely to change |
| WebSearch result | Yes (short TTL) | Results stable for minutes |
| WebFetch (documentation) | Yes (long TTL) | Docs change slowly |
| Bash command output | Sometimes | Depends on command |
| Database query | No | Data changes frequently |
| Subagent result | Session-based | Context-dependent |

### Cache Invalidation Strategies

#### Time-Based Invalidation

```typescript
// System prompt guidance for caching behavior
const systemPrompt = `
## Caching Guidelines

### When to re-fetch:
- File contents: Re-read if more than 5 minutes since last read
- Web documentation: Cache for 1 hour
- Search results: Cache for 15 minutes
- Configuration files: Re-read if editing is happening

### When to always re-read:
- Files you just modified (use Read to verify)
- Files that other tools may have changed
- Dynamic configuration (environment-based)
`;
```

#### Event-Based Invalidation

```typescript
const systemPrompt = `
## Cache Invalidation Events

Invalidate cached file content when:
- You use Edit on that file
- You use Write on that file
- Bash commands might modify it (npm install, git pull, etc.)
- User mentions changes were made externally

After invalidating, re-read before making decisions.
`;
```

### Session-Based Caching

The SDK maintains session context that can be resumed:

```typescript
// First query - builds context
let sessionId: string | undefined;

for await (const message of query({ prompt: "Analyze the codebase" })) {
  if (message.type === "system" && message.subtype === "init") {
    sessionId = message.session_id;
  }
}

// Resume with cached context
const continued = query({
  prompt: "Now focus on the auth module",
  options: {
    resume: sessionId,  // Uses cached context from first query
  },
});
```

**Session Cache Contains:**
- Previously read file contents
- Conversation history
- Tool execution results
- Working directory context

---

## 8. Input Validation

### Validating Tool Inputs

While the SDK handles basic validation, system prompts can guide proper input formatting:

```typescript
const systemPrompt = `
## Input Validation Guidelines

### File Paths
- Always use absolute paths
- Verify path exists with Glob before Read/Edit
- Escape special characters in paths

### Glob Patterns
- Test patterns with small scope first
- Use specific patterns: "src/**/*.ts" not "**/*"
- Escape special characters: use \`interface\\{\\}\` to find \`interface{}\`

### Grep Patterns
- Use regex escaping for literal characters
- Test complex patterns on known content first
- Use multiline: true for cross-line patterns

### Bash Commands
- Quote paths with spaces: cd "/path with spaces"
- Use double quotes for variable expansion
- Set appropriate timeouts for long commands

### Edit Operations
- old_string must be unique in the file
- Preserve exact indentation from Read output
- Verify change with Read after Edit
`;
```

### Sanitization

```typescript
const systemPrompt = `
## Input Sanitization

### Before using user-provided input:

1. **File paths**
   - Resolve relative to known directory
   - Reject paths with ".." traversal
   - Verify within allowed directories

2. **Command arguments**
   - Quote all user-provided strings
   - Never interpolate into shell commands directly
   - Use arrays for command arguments when possible

3. **Search patterns**
   - Escape regex special characters if literal search
   - Limit result counts to prevent timeout
   - Use type/glob filters to narrow scope

4. **URLs**
   - Verify protocol is http/https
   - Check against allowed domains if restricted
   - Handle redirects carefully
`;
```

### Type Checking

The SDK enforces types, but prompts can clarify expectations:

```typescript
const systemPrompt = `
## Type Requirements

### Glob tool
- pattern: string (required) - e.g., "**/*.ts"
- path: string (optional) - absolute directory path

### Grep tool
- pattern: string (required) - regex pattern
- path: string (optional) - file or directory
- type: string (optional) - file type filter ("ts", "js", etc.)

### Edit tool
- file_path: string (required) - absolute path
- old_string: string (required) - exact text to replace
- new_string: string (required) - replacement text
- replace_all: boolean (optional) - replace all occurrences

### Bash tool
- command: string (required) - shell command
- timeout: number (optional) - milliseconds, max 600000
- run_in_background: boolean (optional) - async execution
`;
```

---

## Quick Reference

### Tool Selection Checklist

```
[ ] Does agent need to read files? → Read, Glob, Grep
[ ] Does agent need to modify files? → Write, Edit
[ ] Does agent need to execute commands? → Bash
[ ] Does agent need web access? → WebSearch, WebFetch
[ ] Does agent need to delegate? → Task (with agents config)
[ ] Does agent need user input? → AskUserQuestion
[ ] Does agent need task tracking? → TodoWrite
[ ] Does agent need database access? → Configure MCP
```

### Common Tool Combinations

| Task | Tools |
|------|-------|
| Code analysis | Read, Glob, Grep |
| Code modification | Read, Write, Edit, Glob |
| Documentation update | Read, Write, Edit, WebFetch |
| Research | WebSearch, WebFetch, Read |
| Testing | Bash, Read, Glob |
| Complex workflow | Task, TodoWrite, Read |

### Error Recovery Checklist

```
[ ] Identify the error type
[ ] Check if it's recoverable
[ ] Apply appropriate retry strategy
[ ] If unrecoverable, notify user
[ ] Document what was attempted
[ ] Suggest alternatives
```

---

## Resources

- [Claude Agent SDK Documentation](https://docs.anthropic.com/claude-code/agent-sdk)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)
- [Skills Development Guide](./skills-development.md)
- [Agent Architecture Patterns](./architectures.md)
