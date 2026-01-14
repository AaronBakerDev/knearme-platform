# Usage Patterns: Claude Code Headless Mode

Common patterns for building agent systems with `claude -p`.

## Pattern 1: One-Shot Task

Execute a single task and get the result.

```bash
#!/bin/bash
# one-shot.sh

prompt="$1"
result=$(claude -p "$prompt" --output-format json)

if echo "$result" | jq -e '.is_error == true' > /dev/null; then
    echo "Error: $(echo "$result" | jq -r '.result')" >&2
    exit 1
fi

echo "$result" | jq -r '.result'
```

**Usage:**
```bash
./one-shot.sh "Explain the purpose of package.json"
```

---

## Pattern 2: Multi-Turn Conversation

Maintain context across multiple prompts.

```bash
#!/bin/bash
# multi-turn.sh

SESSION_FILE="${SESSION_FILE:-/tmp/claude-session.id}"

# Get or create session
if [[ -f "$SESSION_FILE" ]]; then
    SESSION_ID=$(cat "$SESSION_FILE")
else
    SESSION_ID=$(claude -p "Initialize session" --output-format json | jq -r '.session_id')
    echo "$SESSION_ID" > "$SESSION_FILE"
    echo "New session: $SESSION_ID"
fi

# Run prompt with session
result=$(claude -p --resume "$SESSION_ID" "$1" --output-format json)
echo "$result" | jq -r '.result'
```

**Usage:**
```bash
export SESSION_FILE=/tmp/my-agent.session
./multi-turn.sh "What files are in this project?"
./multi-turn.sh "Which ones are Python files?"
./multi-turn.sh "Summarize what they do"
```

---

## Pattern 3: Streaming Output

Process output in real-time as Claude works.

```bash
#!/bin/bash
# streaming.sh

prompt="$1"

claude -p "$prompt" --output-format stream-json | while IFS= read -r line; do
    type=$(echo "$line" | jq -r '.type')

    case "$type" in
        init)
            echo "=== Session Started ==="
            ;;
        assistant)
            # Extract text content
            text=$(echo "$line" | jq -r '.message.content[]? | select(.type=="text") | .text // empty')
            if [[ -n "$text" ]]; then
                echo "$text"
            fi

            # Show tool use
            tool=$(echo "$line" | jq -r '.message.content[]? | select(.type=="tool_use") | .name // empty')
            if [[ -n "$tool" ]]; then
                echo "[Using tool: $tool]"
            fi
            ;;
        result)
            echo ""
            echo "=== Complete ==="
            echo "Cost: \$$(echo "$line" | jq -r '.total_cost_usd')"
            echo "Duration: $(echo "$line" | jq -r '.duration_ms')ms"
            ;;
    esac
done
```

---

## Pattern 4: Tool Restrictions

Limit what the agent can do.

### Read-Only Agent

```bash
claude -p "Analyze this codebase and explain the architecture" \
    --allowedTools "Read,Glob,Grep" \
    --output-format json
```

### No Network Access

```bash
claude -p "Refactor this function for performance" \
    --disallowedTools "WebFetch,WebSearch" \
    --output-format json
```

### Specific Commands Only

```bash
claude -p "Run the test suite and fix any failures" \
    --allowedTools "Read,Edit,Bash(npm run test),Bash(npm run lint)" \
    --permission-mode acceptEdits \
    --output-format json
```

### Safe Exploration (Plan Mode)

```bash
# Show what would happen without executing
claude -p "How would you add authentication to this app?" \
    --permission-mode plan \
    --output-format json
```

---

## Pattern 5: MCP Integration

Connect to external tools and services.

### Configure MCP Servers

Create `mcp.json`:

```json
{
  "mcpServers": {
    "database": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-sqlite", "/data/app.db"]
    },
    "github": {
      "type": "http",
      "url": "https://api.github.com/mcp",
      "headers": {
        "Authorization": "Bearer ${GITHUB_TOKEN}"
      }
    }
  }
}
```

### Use MCP Tools

```bash
claude -p "Query the database for all users created this week" \
    --mcp-config mcp.json \
    --allowedTools "mcp__database" \
    --output-format json
```

### Strict MCP (Ignore Defaults)

```bash
claude -p "Only use my custom tools" \
    --mcp-config custom-tools.json \
    --strict-mcp-config \
    --output-format json
```

---

## Pattern 6: Error Handling

Robust error detection and recovery.

```bash
#!/bin/bash
# robust-agent.sh

run_with_retry() {
    local prompt="$1"
    local max_retries="${2:-3}"
    local retry=0

    while [[ $retry -lt $max_retries ]]; do
        # Capture both stdout and stderr
        if output=$(claude -p "$prompt" --output-format json 2>err.log); then
            # Check for logical errors in response
            if echo "$output" | jq -e '.is_error == true' > /dev/null; then
                echo "Task failed: $(echo "$output" | jq -r '.result')" >&2
                ((retry++))
                sleep 2
                continue
            fi

            # Success
            echo "$output"
            return 0
        else
            # CLI error
            echo "CLI error (attempt $((retry+1))): $(cat err.log)" >&2
            ((retry++))
            sleep 2
        fi
    done

    echo "Failed after $max_retries attempts" >&2
    return 1
}

# Usage
result=$(run_with_retry "Complex task that might fail")
echo "$result" | jq -r '.result'
```

---

## Pattern 7: Batch Processing

Process multiple items through an agent.

```bash
#!/bin/bash
# batch-processor.sh

QUEUE_FILE="${1:-queue.txt}"
RESULTS_DIR="${2:-results}"
SESSION_FILE="$RESULTS_DIR/session.id"

mkdir -p "$RESULTS_DIR"

# Create or resume session
if [[ -f "$SESSION_FILE" ]]; then
    SESSION_ID=$(cat "$SESSION_FILE")
else
    SESSION_ID=$(claude -p "Initialize batch processing session" --output-format json | jq -r '.session_id')
    echo "$SESSION_ID" > "$SESSION_FILE"
fi

# Process each item
item_num=0
while IFS= read -r item; do
    ((item_num++))
    echo "Processing item $item_num: $item"

    result=$(claude -p --resume "$SESSION_ID" \
        --output-format json \
        --permission-mode acceptEdits \
        "Process: $item")

    # Save result
    echo "$result" > "$RESULTS_DIR/item-$item_num.json"

    # Log summary
    cost=$(echo "$result" | jq -r '.total_cost_usd')
    echo "  Done. Cost: \$$cost"

done < "$QUEUE_FILE"

echo "Batch complete. Results in $RESULTS_DIR/"
```

---

## Pattern 8: Piping and Composition

Use Claude as a Unix-style filter.

### Simple Pipe

```bash
# Analyze git diff
git diff | claude -p "Review these changes for bugs"

# Process log file
tail -100 app.log | claude -p "Summarize any errors in this log"

# Transform data
cat data.csv | claude -p "Convert this CSV to JSON" --output-format json | jq -r '.result'
```

### Chained Agents

```bash
# Agent 1: Analyze
analysis=$(claude -p "Analyze src/ for security issues" --output-format json | jq -r '.result')

# Agent 2: Fix (with context from analysis)
claude -p "Based on this analysis, fix the issues: $analysis" \
    --permission-mode acceptEdits \
    --output-format json
```

---

## Pattern 9: Custom System Prompts

Specialize agent behavior.

### Append to Default

```bash
claude -p "Review this PR" \
    --append-system-prompt "You are a senior security engineer. Focus on OWASP Top 10 vulnerabilities." \
    --output-format json
```

### Replace Entirely

```bash
claude -p "Translate this text" \
    --system-prompt "You are a translator. Only output the translation, no explanations." \
    --output-format json
```

### From File

```bash
# system-prompt.txt contains your custom instructions
claude -p "Do the task" \
    --system-prompt-file system-prompt.txt \
    --output-format json
```

---

## Pattern 10: Container Entrypoint

Production-ready container agent.

```bash
#!/bin/bash
# entrypoint.sh

set -euo pipefail

# Configuration
DATA_DIR="${DATA_DIR:-/data}"
SESSION_FILE="$DATA_DIR/session.id"
QUEUE_FILE="$DATA_DIR/queue.txt"
RESULTS_DIR="$DATA_DIR/results"
MCP_CONFIG="${MCP_CONFIG:-/app/mcp.json}"

mkdir -p "$RESULTS_DIR"

# Session management
get_session() {
    if [[ -f "$SESSION_FILE" ]]; then
        cat "$SESSION_FILE"
    else
        local sid
        sid=$(claude -p "Initialize agent" --output-format json | jq -r '.session_id')
        echo "$sid" > "$SESSION_FILE"
        echo "$sid"
    fi
}

SESSION_ID=$(get_session)
echo "Session: $SESSION_ID"

# Process function
process_task() {
    local task="$1"
    local task_id="$2"

    claude -p --resume "$SESSION_ID" \
        --output-format stream-json \
        --permission-mode acceptEdits \
        --mcp-config "$MCP_CONFIG" \
        "$task" | tee "$RESULTS_DIR/$task_id.jsonl" | \
    jq -r 'select(.type=="result") | "Cost: $\(.total_cost_usd), Duration: \(.duration_ms)ms"'
}

# Main loop
if [[ -f "$QUEUE_FILE" ]]; then
    task_num=0
    while IFS= read -r task; do
        ((task_num++))
        echo "[$task_num] Processing: ${task:0:50}..."
        process_task "$task" "task-$task_num"
    done < "$QUEUE_FILE"
else
    # Single task mode
    process_task "${1:-Hello, agent ready}" "single"
fi

echo "Agent complete"
```

---

## Pattern 11: Timeout Protection

Prevent runaway agents.

```bash
#!/bin/bash
# with-timeout.sh

TIMEOUT="${TIMEOUT:-300}"  # 5 minutes default

if ! timeout "$TIMEOUT" claude -p "$1" --output-format json > result.json 2>err.log; then
    exit_code=$?
    if [[ $exit_code -eq 124 ]]; then
        echo "Agent timed out after ${TIMEOUT}s" >&2
        exit 124
    fi
    echo "Agent failed: $(cat err.log)" >&2
    exit $exit_code
fi

cat result.json
```

### With Max Turns

```bash
claude -p "Complex task" \
    --max-turns 10 \
    --output-format json
```

---

## Pattern 12: Structured Output

Validate output against a schema.

```bash
# Define expected schema
SCHEMA='{
  "type": "object",
  "properties": {
    "summary": {"type": "string"},
    "issues": {"type": "array", "items": {"type": "string"}},
    "severity": {"type": "string", "enum": ["low", "medium", "high"]}
  },
  "required": ["summary", "issues", "severity"]
}'

claude -p "Analyze this code and return structured findings" \
    --json-schema "$SCHEMA" \
    --output-format json | jq -r '.result' | jq '.'
```
