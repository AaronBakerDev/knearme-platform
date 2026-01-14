#!/bin/bash
# entrypoint.sh - Production Codex agent entrypoint
#
# Modes:
#   --help          Show help
#   --queue         Process tasks from queue file
#   --interactive   Start interactive session
#   --single "..."  Run single task
#   "prompt"        Run single task (shorthand)

set -euo pipefail

SESSION_FILE="${SESSION_FILE:-/data/session.id}"
RESULTS_DIR="${RESULTS_DIR:-/data/results}"
QUEUE_FILE="${QUEUE_FILE:-/data/queue.txt}"
SANDBOX="${SANDBOX:-workspace-write}"
APPROVAL_POLICY="${APPROVAL_POLICY:-on-request}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  local level="$1"; shift
  local msg="$*"
  local ts
  ts=$(date -Iseconds)
  case "$level" in
    INFO)  echo -e "${BLUE}[$ts]${NC} $msg" ;;
    WARN)  echo -e "${YELLOW}[$ts]${NC} $msg" >&2 ;;
    ERROR) echo -e "${RED}[$ts]${NC} $msg" >&2 ;;
    OK)    echo -e "${GREEN}[$ts]${NC} $msg" ;;
  esac
}

mkdir -p "$RESULTS_DIR" "$(dirname "$SESSION_FILE")"

get_or_create_session() {
  if [[ -f "$SESSION_FILE" ]]; then
    cat "$SESSION_FILE"
  else
    log INFO "Creating new thread..."
    local tid
    tid=$(codex -a "$APPROVAL_POLICY" -s "$SANDBOX" exec --json --skip-git-repo-check \
        "Initialize agent thread" \
        | jq -r 'select(.type=="thread.started") | .thread_id' | head -n1)
    echo "$tid" > "$SESSION_FILE"
    log OK "Thread created: ${tid:0:8}..."
    echo "$tid"
  fi
}

run_task() {
  local prompt="$1"
  local task_id="${2:-$(date +%s%N)}"

  local thread_id
  thread_id=$(get_or_create_session)

  log INFO "Running task: ${prompt:0:60}..."
  local output_file="$RESULTS_DIR/$task_id.jsonl"

  if codex -a "$APPROVAL_POLICY" -s "$SANDBOX" exec --json --skip-git-repo-check \
      resume "$thread_id" "$prompt" > "$output_file" 2>&1; then

    local final_line
    final_line=$(grep -E '"type":"turn\.(completed|failed)"' "$output_file" | tail -n1 || true)
    local duration is_error final_type
    final_type=$(echo "$final_line" | jq -r '.type // "turn.completed"')
    duration=$(echo "$final_line" | jq -r '.duration_ms // 0')
    is_error=$([[ "$final_type" == "turn.failed" ]] && echo "true" || echo "false")

    if [[ "$is_error" == "true" ]]; then
      log ERROR "Task failed. See: $output_file"
      return 1
    fi

    log OK "Task complete. Duration: ${duration}ms"
    log INFO "Output: $output_file"
  else
    log ERROR "codex exec failed"
    return 1
  fi
}

process_queue() {
  [[ -f "$QUEUE_FILE" ]] || { log WARN "No queue file: $QUEUE_FILE"; return 0; }

  local i=0
  while IFS= read -r task || [[ -n "$task" ]]; do
    [[ -z "$task" || "$task" =~ ^# ]] && continue
    ((i++))
    run_task "$task" "task-$(printf '%04d' $i)" || true
    sleep 1
  done < "$QUEUE_FILE"
}

interactive_mode() {
  local thread_id
  thread_id=$(get_or_create_session)
  log INFO "Interactive thread: ${thread_id:0:8}..."

  while true; do
    echo -n "You: "
    read -r prompt || break
    [[ "$prompt" == "exit" ]] && break
    [[ -z "$prompt" ]] && continue

    codex -a "$APPROVAL_POLICY" -s "$SANDBOX" exec --json --skip-git-repo-check \
      resume "$thread_id" "$prompt" \
      | jq -r 'select(.type=="item.completed" and .item.type=="agent_message") | .item.text // empty'

    echo "---"
  done
}

show_help() {
  cat <<'EOF'
Codex Agent - Production Container

Usage:
  entrypoint.sh [MODE] [ARGS]

Modes:
  --help, -h          Show help
  --queue             Process tasks from queue file
  --interactive, -i   Start interactive session
  --single "prompt"   Run one task
  "prompt"            Shorthand for --single

Environment:
  SESSION_FILE     Path to thread id file (default: /data/session.id)
  RESULTS_DIR      Directory for results (default: /data/results)
  QUEUE_FILE       Queue file path (default: /data/queue.txt)
  SANDBOX          Sandbox policy (default: workspace-write)
  APPROVAL_POLICY  Approval policy (default: on-request)
EOF
}

main() {
  local mode="${1:---help}"; shift || true
  case "$mode" in
    --help|-h) show_help ;;
    --queue) process_queue ;;
    --interactive|-i) interactive_mode ;;
    --single) run_task "$1" ;;
    *) run_task "$mode $*" ;;
  esac
}

main "$@"
