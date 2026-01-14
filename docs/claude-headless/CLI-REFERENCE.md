# CLI Reference: Claude Code Headless Mode

Complete reference for `claude -p` flags and options.

## Basic Syntax

```bash
claude -p "prompt" [options]
claude -p [options] "prompt"
echo "prompt" | claude -p [options]
```

## Core Flags

### Output Control

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--print`, `-p` | — | — | **Required.** Enable headless/print mode |
| `--output-format` | `text`, `json`, `stream-json` | `text` | Output format |
| `--verbose` | — | off | Enable verbose logging |
| `--include-partial-messages` | — | off | Include partial events in stream-json |

### Session Management

| Flag | Values | Description |
|------|--------|-------------|
| `--resume`, `-r` | `SESSION_ID` | Resume conversation by session ID |
| `--continue`, `-c` | — | Continue most recent conversation |
| `--session-id` | `UUID` | Use specific session ID (must be valid UUID) |
| `--fork-session` | — | Create new session when resuming instead of reusing |

### Input Control

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--input-format` | `text`, `stream-json` | `text` | Input format from stdin |

### System Prompt

| Flag | Description |
|------|-------------|
| `--append-system-prompt "text"` | Append to default system prompt |
| `--system-prompt "text"` | Replace entire system prompt |
| `--system-prompt-file path` | Load system prompt from file |

### Tool Control

| Flag | Description |
|------|-------------|
| `--allowedTools "T1,T2"` | Only allow these tools (comma or space separated) |
| `--disallowedTools "T1,T2"` | Deny these tools |
| `--tools "T1,T2"` | Alias for --allowedTools |

**Tool Name Patterns:**

```bash
# Exact tool
--allowedTools "Read,Write,Bash"

# Bash with specific commands
--allowedTools "Bash(npm run test),Bash(npm run build)"

# Bash prefix matching (note: can be bypassed with shell operators)
--allowedTools "Bash(npm:*)"

# File path patterns
--disallowedTools "Read(.env),Read(./secrets/**)"

# MCP tools
--allowedTools "mcp__github,mcp__database"
--disallowedTools "mcp__github__delete_repo"
```

### Permission Modes

| Flag | Mode | Behavior |
|------|------|----------|
| `--permission-mode default` | default | Prompt for each tool use |
| `--permission-mode acceptEdits` | acceptEdits | Auto-approve file edits |
| `--permission-mode plan` | plan | Show what would happen, don't execute |
| `--permission-mode bypassPermissions` | bypass | Skip all permission prompts |
| `--dangerously-skip-permissions` | bypass | Alias for bypassPermissions |

### MCP Configuration

| Flag | Description |
|------|-------------|
| `--mcp-config file.json` | Load MCP servers from file(s) |
| `--strict-mcp-config` | Only use specified MCP servers, ignore defaults |

### Limits

| Flag | Description |
|------|-------------|
| `--max-turns N` | Maximum agentic turns (default: unlimited) |

### Model Selection

| Flag | Values | Description |
|------|--------|-------------|
| `--model` | `sonnet`, `opus`, `haiku` | Override default model |
| `--fallback-model` | `sonnet`, `opus`, `haiku` | Fallback when primary overloaded |

### Output Validation

| Flag | Description |
|------|-------------|
| `--json-schema "schema"` | Validate output against JSON Schema |

### Advanced

| Flag | Description |
|------|-------------|
| `--agent name` | Use custom agent for session |
| `--agents "json"` | Define subagents dynamically |
| `--add-dir path` | Add additional working directories |
| `--plugin-dir path` | Load plugins from directory |
| `--settings "json_or_path"` | Load settings from JSON |
| `--setting-sources "user,project"` | Sources for settings |
| `--permission-prompt-tool "tool"` | MCP tool for permission prompts |
| `--betas "feature1,feature2"` | Enable beta features |
| `--debug "category"` | Enable debug logging |

---

## Output Formats

### text (Default)

Plain text response:

```bash
$ claude -p "What is 2+2?"
2 + 2 equals 4.
```

### json

Single JSON object with full metadata:

```bash
$ claude -p "What is 2+2?" --output-format json
```

```json
{
  "type": "result",
  "subtype": "success",
  "is_error": false,
  "duration_ms": 1234,
  "duration_api_ms": 800,
  "num_turns": 1,
  "result": "2 + 2 equals 4.",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_cost_usd": 0.003,
  "usage": {
    "input_tokens": 10,
    "output_tokens": 15
  },
  "modelUsage": {
    "claude-sonnet-4-20250514": {
      "inputTokens": 10,
      "outputTokens": 15,
      "costUSD": 0.003
    }
  }
}
```

**Key Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Always "result" |
| `subtype` | string | "success" or "error" |
| `is_error` | boolean | Whether task failed |
| `result` | string | Final text response |
| `session_id` | string | UUID for resuming |
| `total_cost_usd` | number | Total cost in USD |
| `duration_ms` | number | Total duration |
| `num_turns` | number | Agentic turns taken |

### stream-json

JSONL (one JSON object per line) with all events:

```bash
$ claude -p "Analyze code" --output-format stream-json
```

```jsonl
{"type":"init","session_id":"...","cwd":"/path"}
{"type":"user","message":{"role":"user","content":[{"type":"text","text":"Analyze code"}]}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"I'll analyze..."}]}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","name":"Read","input":{...}}]}}
{"type":"result","subtype":"success","total_cost_usd":0.05,"duration_ms":5000}
```

**Event Types:**

| Type | When | Content |
|------|------|---------|
| `init` | Start | Session ID, working directory |
| `user` | Each user message | Message content |
| `assistant` | Each Claude response | Text and/or tool_use |
| `result` | End | Final stats, error status |

---

## Input Formats

### text (Default)

```bash
# Direct argument
claude -p "Your prompt here"

# From stdin
echo "Your prompt" | claude -p

# File content
cat prompt.txt | claude -p
```

### stream-json

JSONL input for multi-turn in single invocation:

```bash
cat << 'EOF' | claude -p --input-format stream-json --output-format stream-json
{"type":"user","message":{"role":"user","content":[{"type":"text","text":"First message"}]}}
{"type":"user","message":{"role":"user","content":[{"type":"text","text":"Follow up"}]}}
EOF
```

---

## Environment Variables

### Authentication

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | API key (optional if using OAuth) |
| `ANTHROPIC_AUTH_TOKEN` | Custom Authorization header |

### Model Configuration

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | Max output tokens |
| `MAX_THINKING_TOKENS` | Extended thinking budget |

### MCP Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_TIMEOUT` | 10000 | Server startup timeout (ms) |
| `MCP_TOOL_TIMEOUT` | 30000 | Tool execution timeout (ms) |
| `MAX_MCP_OUTPUT_TOKENS` | 25000 | Max MCP output tokens |

### Cloud Providers

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_USE_BEDROCK=1` | Use AWS Bedrock |
| `AWS_BEARER_TOKEN_BEDROCK` | Bedrock auth token |
| `CLAUDE_CODE_USE_VERTEX=1` | Use Google Vertex |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP credentials |
| `CLAUDE_CODE_USE_FOUNDRY=1` | Use Microsoft Foundry |
| `ANTHROPIC_FOUNDRY_API_KEY` | Foundry API key |

### Network

| Variable | Description |
|----------|-------------|
| `HTTP_PROXY` | HTTP proxy URL |
| `HTTPS_PROXY` | HTTPS proxy URL |
| `NO_PROXY` | Hosts to bypass proxy |

### mTLS / Custom Certs

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_CLIENT_CERT` | Client certificate path |
| `CLAUDE_CODE_CLIENT_KEY` | Client key path |
| `CLAUDE_CODE_CLIENT_KEY_PASSPHRASE` | Key passphrase |
| `CLAUDE_CODE_CA_CERT` | Custom CA certificate |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1-127 | Error (check stderr and JSON is_error) |
| 124 | Timeout (if using `timeout` wrapper) |

**Recommended Error Handling:**

```bash
if ! output=$(claude -p "$prompt" --output-format json 2>err.log); then
    echo "CLI error: $(cat err.log)" >&2
    exit 1
fi

if echo "$output" | jq -e '.is_error == true' > /dev/null; then
    echo "Task error: $(echo "$output" | jq -r '.result')" >&2
    exit 1
fi

echo "$output" | jq -r '.result'
```

---

## Built-in Tools

Tools available to `claude -p`:

| Tool | Description |
|------|-------------|
| `Read` | Read file contents |
| `Write` | Write file |
| `Edit` | Edit file (string replacement) |
| `Bash` | Execute shell commands |
| `Glob` | Find files by pattern |
| `Grep` | Search file contents |
| `WebFetch` | Fetch URL content |
| `WebSearch` | Search the web |
| `Task` | Launch subagent |
| `TodoWrite` | Manage task list |
| `NotebookEdit` | Edit Jupyter notebooks |

**Restricting Tools:**

```bash
# Read-only agent
claude -p "Analyze codebase" --allowedTools "Read,Glob,Grep"

# No web access
claude -p "Review code" --disallowedTools "WebFetch,WebSearch"

# Specific bash commands only
claude -p "Run tests" --allowedTools "Bash(npm run test),Read"
```

---

## Common Patterns

### One-Shot Task

```bash
result=$(claude -p "Explain this error: $ERROR" --output-format json)
echo "$result" | jq -r '.result'
```

### Multi-Turn Session

```bash
SESSION=$(claude -p "Start" --output-format json | jq -r '.session_id')
claude -p --resume "$SESSION" "Step 1"
claude -p --resume "$SESSION" "Step 2"
```

### Streaming with Parsing

```bash
claude -p "Build feature" --output-format stream-json | while read -r line; do
    type=$(echo "$line" | jq -r '.type')
    case "$type" in
        assistant) echo "$line" | jq -r '.message.content[0].text // empty' ;;
        result) echo "Done: $(echo "$line" | jq -r '.total_cost_usd')" ;;
    esac
done
```

### Sandboxed Execution

```bash
claude -p "Refactor src/" \
    --permission-mode acceptEdits \
    --allowedTools "Read,Write,Edit,Bash(npm run test)" \
    --disallowedTools "Bash(rm:*),WebFetch"
```
