# Usage Patterns: Codex CLI Headless Mode

Common patterns for building agent systems with `codex exec`.

## Pattern 1: One‑Shot Task

Execute a single task and get the result.

```bash
#!/bin/bash
# one-shot.sh

prompt="$1"

result=$(codex exec --json --sandbox read-only "$prompt")

# Extract the last assistant message, ignoring intermediate events
echo "$result" | jq -r 'select(.type=="item.completed" and .item.type=="agent_message") | .item.text' | tail -n 1
```

**Usage:**

```bash
./one-shot.sh "Explain the purpose of package.json"
```

---

## Pattern 2: Multi‑Turn Conversation

Maintain context across multiple prompts.

```bash
#!/bin/bash
# multi-turn.sh

SESSION_FILE="${SESSION_FILE:-/tmp/codex-session.id}"

get_or_create_session() {
  if [[ -f "$SESSION_FILE" ]]; then
    cat "$SESSION_FILE"
  else
    codex exec --json "Initialize session" \
      | jq -r 'select(.type=="thread.started") | .thread_id' | head -n 1 \
      | tee "$SESSION_FILE"
  fi
}

THREAD_ID=$(get_or_create_session)

codex exec resume "$THREAD_ID" "$1"
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

Process events in real‑time while Codex works.

```bash
#!/bin/bash
# streaming.sh

prompt="$1"

codex exec --json "$prompt" | while IFS= read -r line; do
  type=$(echo "$line" | jq -r '.type')

  case "$type" in
    thread.started)
      echo "=== Thread Started ===" >&2
      ;;
    item.completed)
      # Show assistant messages and tool usage
      item_type=$(echo "$line" | jq -r '.item.type // empty')
      if [[ "$item_type" == "agent_message" ]]; then
        echo "$line" | jq -r '.item.text'
      elif [[ "$item_type" == "command_execution" ]]; then
        cmd=$(echo "$line" | jq -r '.item.command')
        echo "[Ran: $cmd]" >&2
      fi
      ;;
    turn.completed)
      echo "" >&2
      echo "=== Complete ===" >&2
      usage=$(echo "$line" | jq -r '.usage')
      echo "Usage: $usage" >&2
      ;;
  esac
done
```

---

## Pattern 4: Sandbox + Approvals

Codex’s safety model is controlled by two knobs:

- `--sandbox` (per `exec` call) limits what model‑generated shell commands can do.
- `-a/--ask-for-approval` (global, before `exec`) controls when human approval is required.

### Read‑Only Agent

```bash
codex exec "Analyze this codebase and explain the architecture" \
  --sandbox read-only
```

### Auto‑run, sandboxed

```bash
codex -a on-failure exec "Refactor this function" \
  --sandbox workspace-write
```

### Full auto (dangerous)

```bash
codex exec "Fix all lint issues" \
  --dangerously-bypass-approvals-and-sandbox
```

---

## Pattern 5: Structured Output

Codex can validate its final answer against a JSON Schema.

```bash
cat > schema.json <<'EOF'
{
  "type": "object",
  "properties": {
    "summary": {"type": "string"},
    "files_changed": {"type": "array", "items": {"type": "string"}},
    "next_steps": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["summary", "files_changed"]
}
EOF

codex exec --output-schema schema.json \
  "Analyze the repo and return structured findings"
```

---

## Pattern 6: MCP Integration

Codex CLI manages MCP servers globally. Example:

```bash
# Add a local stdio MCP server
codex mcp add sqlite -- npx -y @modelcontextprotocol/server-sqlite /data/app.db

# List configured servers
codex mcp list

# Use tools in a headless run
codex exec "Query the database for users created this week" \
  --json --sandbox read-only
```

---

## Pattern 7: Batch Processing

Process multiple items through a single session.

```bash
#!/bin/bash
# batch-processor.sh

QUEUE_FILE="${1:-queue.txt}"
RESULTS_DIR="${2:-results}"
SESSION_FILE="$RESULTS_DIR/session.id"

mkdir -p "$RESULTS_DIR"

if [[ -f "$SESSION_FILE" ]]; then
  THREAD_ID=$(cat "$SESSION_FILE")
else
  THREAD_ID=$(codex exec --json "Initialize batch session" \
    | jq -r 'select(.type=="thread.started") | .thread_id' | head -n 1)
  echo "$THREAD_ID" > "$SESSION_FILE"
fi

item_num=0
while IFS= read -r item; do
  ((item_num++))
  echo "Processing item $item_num: $item" >&2

  codex exec resume "$THREAD_ID" "Process: $item" \
    > "$RESULTS_DIR/item-$item_num.txt"

done < "$QUEUE_FILE"
```

---

## Pattern 8: Piping and Composition

Use Codex as a Unix‑style filter.

```bash
git diff | codex exec "Review these changes for bugs" --skip-git-repo-check

tail -100 app.log | codex exec "Summarize any errors" --skip-git-repo-check
```
