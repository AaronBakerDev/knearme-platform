#!/bin/bash
# agent.sh - Minimal Codex CLI headless agent
#
# Usage:
#   ./agent.sh "Your prompt here"
#   echo "Your prompt" | ./agent.sh
#
# Environment:
#   SESSION_FILE      Path to session file (default: /tmp/codex-agent.session)
#   SANDBOX           read-only|workspace-write|danger-full-access (default: workspace-write)
#   APPROVAL_POLICY   untrusted|on-failure|on-request|never (default: on-failure)
#   JSON_STREAM       true|false (default: false)

set -euo pipefail

SESSION_FILE="${SESSION_FILE:-/tmp/codex-agent.session}"
SANDBOX="${SANDBOX:-workspace-write}"
APPROVAL_POLICY="${APPROVAL_POLICY:-on-failure}"
JSON_STREAM="${JSON_STREAM:-false}"

# Get prompt from argument or stdin
if [[ $# -gt 0 ]]; then
  PROMPT="$1"
else
  PROMPT=$(cat)
fi

if [[ -z "$PROMPT" ]]; then
  echo "Usage: $0 \"prompt\" or echo \"prompt\" | $0" >&2
  exit 1
fi

get_or_create_session() {
  if [[ -f "$SESSION_FILE" ]]; then
    cat "$SESSION_FILE"
  else
    codex -a "$APPROVAL_POLICY" -s "$SANDBOX" exec --json --skip-git-repo-check \
      "Initialize agent session" \
      | jq -r 'select(.type=="thread.started") | .thread_id' \
      | head -n 1 \
      | tee "$SESSION_FILE"
  fi
}

THREAD_ID=$(get_or_create_session)

if [[ "$JSON_STREAM" == "true" ]]; then
  codex -a "$APPROVAL_POLICY" -s "$SANDBOX" exec --json --skip-git-repo-check \
    resume "$THREAD_ID" "$PROMPT" | while IFS= read -r line; do

    type=$(echo "$line" | jq -r '.type // ""')

    case "$type" in
      thread.started)
        tid=$(echo "$line" | jq -r '.thread_id')
        echo "Session: ${tid:0:8}..." >&2
        ;;
      item.completed)
        item_type=$(echo "$line" | jq -r '.item.type // empty')
        if [[ "$item_type" == "agent_message" ]]; then
          echo "$line" | jq -r '.item.text // empty'
        elif [[ "$item_type" == "command_execution" ]]; then
          cmd=$(echo "$line" | jq -r '.item.command // empty')
          [[ -n "$cmd" ]] && echo "[Ran: $cmd]" >&2
        elif [[ "$item_type" == "tool_call" ]]; then
          tool=$(echo "$line" | jq -r '.item.tool // .item.name // "tool"')
          echo "[Tool: $tool]" >&2
        fi
        ;;
      turn.completed|turn.failed)
        duration=$(echo "$line" | jq -r '.duration_ms // 0')
        echo "" >&2
        echo "Duration: ${duration}ms" >&2
        ;;
      error)
        msg=$(echo "$line" | jq -r '.message // .error.message // "error"')
        echo "[Error] $msg" >&2
        ;;
    esac
  done
else
  codex -a "$APPROVAL_POLICY" -s "$SANDBOX" exec --skip-git-repo-check \
    resume "$THREAD_ID" "$PROMPT"
fi
