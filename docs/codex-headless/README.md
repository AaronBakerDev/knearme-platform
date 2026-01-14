# Codex CLI Headless Mode Agent System

Build containerized AI agents using `codex exec` as the primitive — the same Codex CLI you use interactively, but runnable from scripts, CI, and cron.

## Why This Pattern?

| Approach | Auth | Cost Model | Best For |
|----------|------|------------|----------|
| Codex / Responses API | API key | Pay‑per‑token | Embedded product features |
| **Codex CLI Headless** | OAuth (`codex login`) or API key | Your OpenAI account / plan | Containers, scripts, automation, CI |

Codex CLI supports OAuth login and a non‑interactive `exec` subcommand, which makes it easy to run agentic work anywhere you can spawn a process.

## Quick Start

### 1. Verify Authentication

```bash
# API key is optional if you're logged in with OAuth
echo "OPENAI_API_KEY set: $([ -n \"$OPENAI_API_KEY\" ] && echo 'YES' || echo 'NO')"

codex login   # run once if needed
codex exec "Say hello"
```

### 2. Run Your First Agent

```bash
# One‑shot task (text output)
codex -a never exec "List all Python files in the current directory" \
  --sandbox read-only

# Streaming JSONL events (see work in real‑time)
codex -a on-request exec --json "Analyze this repo and propose next steps" \
  --sandbox workspace-write
```

### 3. Multi‑Turn Agent

```bash
# Start a session and capture the thread id from the JSONL stream
THREAD_ID=$( \
  codex exec --json "Initialize code review session" | \
  jq -r 'select(.type=="thread.started") | .thread_id' | \
  head -n1 \
)

# Continue the conversation
codex exec resume "$THREAD_ID" "Review src/main.py for bugs"
codex exec resume "$THREAD_ID" "Now check the test coverage"
codex exec resume "$THREAD_ID" "Generate a summary report"
```

## Core Concepts

### The Primitive: `codex exec`

```bash
codex exec "your prompt" [options]
```

Key flags:
- `--json` — Emit a JSONL stream of all events to stdout.
- `codex exec resume THREAD_ID "prompt"` — Continue a conversation by thread id.
- `--output-schema schema.json` — Constrain the final response to a JSON Schema.
- `--sandbox read-only|workspace-write|danger-full-access` — Control filesystem access for tools.
- `-a/--ask-for-approval untrusted|on-failure|on-request|never` — Control when tool calls require approval (global; must appear before `exec`).
- `-c key=value` — Override config values at runtime.
- `codex mcp` — Add/list/manage MCP servers for external tools.

### Output Modes

| Mode | How | Use Case |
|------|-----|----------|
| Text (default) | `codex exec "prompt"` | Human‑readable scripts, CI logs |
| JSONL events | `codex exec --json "prompt"` | Real‑time parsing, orchestration, structured agents |

### Session Management

Sessions persist in your Codex CLI state store and can be resumed:

```bash
# Resume by id
codex exec resume "$THREAD_ID" "Continue where we left off"

# Or resume the most recent recorded session
codex exec resume --last "What's next?"
```

## Directory Structure

```
docs/codex-headless/
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

Codex CLI lets you run agents headlessly without wiring an SDK.
If you can run a shell script or a container, you can run a Codex agent.
