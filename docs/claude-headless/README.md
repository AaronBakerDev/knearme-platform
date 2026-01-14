# Claude Code Headless Mode Agent System

Build containerized AI agents using `claude -p` as the primitive — powered by your Claude Pro/Max subscription, no API credits required.

## Why This Pattern?

| Approach | Auth | Cost | Best For |
|----------|------|------|----------|
| Claude Agent SDK | API Key | Pay-per-token | Embedded in apps |
| **Claude Code Headless** | OAuth (Pro/Max) | Subscription | Container agents, scripts, automation |

Claude Code CLI supports OAuth authentication with your Claude account. This means you can build sophisticated agent systems that run on your existing subscription.

## Quick Start

### 1. Verify Authentication

```bash
# Check that Claude Code is authenticated (no API key needed)
echo "ANTHROPIC_API_KEY set: $([ -n "$ANTHROPIC_API_KEY" ] && echo 'YES' || echo 'NO')"
claude -p "Say hello" --output-format json | jq -r '.result'
```

### 2. Run Your First Agent

```bash
# One-shot task
claude -p "List all Python files in the current directory" \
  --output-format json \
  --allowedTools "Bash,Read"

# With streaming output (see work in real-time)
claude -p "Analyze this codebase structure" \
  --output-format stream-json \
  --permission-mode acceptEdits
```

### 3. Multi-Turn Agent

```bash
# Start a session
SESSION=$(claude -p "Initialize code review session" --output-format json | jq -r '.session_id')

# Continue the conversation
claude -p --resume "$SESSION" "Review src/main.py for bugs"
claude -p --resume "$SESSION" "Now check the test coverage"
claude -p --resume "$SESSION" "Generate a summary report"
```

## Core Concepts

### The Primitive: `claude -p`

```bash
claude -p "your prompt" [options]
```

Key flags:
- `--output-format json|stream-json|text` — Output format
- `--resume SESSION_ID` — Continue a conversation
- `--permission-mode acceptEdits` — Auto-approve file operations
- `--allowedTools "Tool1,Tool2"` — Restrict available tools
- `--mcp-config file.json` — Load MCP servers

### Output Formats

| Format | Use Case |
|--------|----------|
| `text` | Human-readable output |
| `json` | Parse final result programmatically |
| `stream-json` | Real-time JSONL stream of all events |

### Session Management

Sessions persist across invocations:

```bash
# Get session ID from first call
session_id=$(claude -p "Start" --output-format json | jq -r '.session_id')

# Resume later (even after container restart if volume mounted)
claude -p --resume "$session_id" "Continue where we left off"
```

## Directory Structure

```
docs/claude-headless/
├── README.md              # You are here
├── ARCHITECTURE.md        # System design + diagrams
├── CLI-REFERENCE.md       # Complete flag reference
├── PATTERNS.md            # Usage patterns
├── examples/
│   ├── basic/             # Minimal working agent
│   ├── multi-turn/        # Session persistence
│   ├── streaming/         # Real-time parsing
│   └── production/        # Docker Compose deployment
└── templates/             # Copy-paste starters
```

## Next Steps

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Understand the system design
2. **[CLI-REFERENCE.md](./CLI-REFERENCE.md)** — Complete flag documentation
3. **[PATTERNS.md](./PATTERNS.md)** — Common usage patterns
4. **[examples/basic/](./examples/basic/)** — Run your first containerized agent

## Key Insight

```bash
# This works WITHOUT an API key:
$ echo "ANTHROPIC_API_KEY set: $([ -n "$ANTHROPIC_API_KEY" ] && echo 'YES' || echo 'NO')"
ANTHROPIC_API_KEY set: NO

$ claude -p "Hello" --output-format json | jq -r '.result'
Hello! How can I help you today?
```

Claude Code uses OAuth authentication with your Claude account — your Pro/Max subscription covers the usage.
