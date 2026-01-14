#!/bin/bash
# entrypoint.sh - Production agent entrypoint
#
# Modes:
#   --help          Show help
#   --queue         Process tasks from queue file
#   --interactive   Start interactive session
#   --single "..."  Run single task
#   "prompt"        Run single task (shorthand)

set -euo pipefail

# Configuration from environment
SESSION_FILE="${SESSION_FILE:-/data/session.id}"
RESULTS_DIR="${RESULTS_DIR:-/data/results}"
QUEUE_FILE="${QUEUE_FILE:-/data/queue.txt}"
MCP_CONFIG="${MCP_CONFIG:-/app/mcp.json}"
PERMISSION_MODE="${PERMISSION_MODE:-acceptEdits}"
MAX_TURNS="${MAX_TURNS:-20}"
LOG_LEVEL="${LOG_LEVEL:-info}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    local level="$1"
    shift
    local msg="$*"
    local timestamp
    timestamp=$(date -Iseconds)

    case "$level" in
        INFO)  echo -e "${BLUE}[$timestamp]${NC} $msg" ;;
        WARN)  echo -e "${YELLOW}[$timestamp]${NC} $msg" >&2 ;;
        ERROR) echo -e "${RED}[$timestamp]${NC} $msg" >&2 ;;
        OK)    echo -e "${GREEN}[$timestamp]${NC} $msg" ;;
    esac
}

# Ensure directories exist
mkdir -p "$RESULTS_DIR" "$(dirname "$SESSION_FILE")"

# --- Session Management ---

get_or_create_session() {
    if [[ -f "$SESSION_FILE" ]]; then
        cat "$SESSION_FILE"
    else
        log INFO "Creating new session..."
        local session_id
        session_id=$(claude -p "Initialize agent session" \
            --output-format json \
            --mcp-config "$MCP_CONFIG" \
            | jq -r '.session_id')
        echo "$session_id" > "$SESSION_FILE"
        log OK "Session created: ${session_id:0:8}..."
        echo "$session_id"
    fi
}

# --- Task Execution ---

run_task() {
    local prompt="$1"
    local task_id="${2:-$(date +%s%N)}"

    log INFO "Running task: ${prompt:0:60}..."

    local session_id
    session_id=$(get_or_create_session)

    local output_file="$RESULTS_DIR/$task_id.jsonl"

    # Run with streaming output
    if claude -p --resume "$session_id" \
        --output-format stream-json \
        --permission-mode "$PERMISSION_MODE" \
        --max-turns "$MAX_TURNS" \
        --mcp-config "$MCP_CONFIG" \
        "$prompt" > "$output_file" 2>&1; then

        # Extract stats from result
        local result_line
        result_line=$(tail -1 "$output_file")

        local cost duration is_error
        cost=$(echo "$result_line" | jq -r '.total_cost_usd // 0')
        duration=$(echo "$result_line" | jq -r '.duration_ms // 0')
        is_error=$(echo "$result_line" | jq -r '.is_error // false')

        if [[ "$is_error" == "true" ]]; then
            log ERROR "Task failed. See: $output_file"
            return 1
        else
            log OK "Task complete. Cost: \$$cost, Duration: ${duration}ms"
            log INFO "Output: $output_file"
            return 0
        fi
    else
        log ERROR "Claude CLI failed"
        return 1
    fi
}

# --- Queue Processing ---

process_queue() {
    if [[ ! -f "$QUEUE_FILE" ]]; then
        log WARN "No queue file found: $QUEUE_FILE"
        return 0
    fi

    local task_num=0
    local success_count=0
    local fail_count=0

    log INFO "Processing queue: $QUEUE_FILE"

    while IFS= read -r task || [[ -n "$task" ]]; do
        # Skip empty lines and comments
        [[ -z "$task" || "$task" =~ ^# ]] && continue

        ((task_num++))
        local task_id="task-$(printf '%04d' $task_num)-$(date +%s)"

        if run_task "$task" "$task_id"; then
            ((success_count++))
        else
            ((fail_count++))
        fi

        # Small delay between tasks
        sleep 1
    done < "$QUEUE_FILE"

    log INFO "Queue complete: $success_count succeeded, $fail_count failed"

    # Archive processed queue
    if [[ $task_num -gt 0 ]]; then
        mv "$QUEUE_FILE" "$RESULTS_DIR/queue-$(date +%Y%m%d-%H%M%S).txt"
        log INFO "Queue archived"
    fi
}

# --- Interactive Mode ---

interactive_mode() {
    log INFO "Starting interactive mode..."

    local session_id
    session_id=$(get_or_create_session)

    log INFO "Session: ${session_id:0:8}..."
    echo "Type 'exit' to quit"
    echo "---"

    while true; do
        echo -n "You: "
        read -r prompt

        [[ "$prompt" == "exit" ]] && break
        [[ -z "$prompt" ]] && continue

        claude -p --resume "$session_id" \
            --output-format stream-json \
            --permission-mode "$PERMISSION_MODE" \
            --max-turns "$MAX_TURNS" \
            --mcp-config "$MCP_CONFIG" \
            "$prompt" | while IFS= read -r line; do

            local msg_type
            msg_type=$(echo "$line" | jq -r '.type')

            if [[ "$msg_type" == "assistant" ]]; then
                echo "$line" | jq -r '.message.content[]? | select(.type=="text") | .text // empty'
            elif [[ "$msg_type" == "result" ]]; then
                local cost
                cost=$(echo "$line" | jq -r '.total_cost_usd')
                echo ""
                log INFO "Cost: \$$cost"
            fi
        done

        echo "---"
    done

    log INFO "Goodbye!"
}

# --- Help ---

show_help() {
    cat << 'EOF'
Claude Agent - Production Container

Usage:
  entrypoint.sh [MODE] [OPTIONS]

Modes:
  --help, -h          Show this help message
  --queue             Process tasks from queue file
  --interactive, -i   Start interactive session
  --single "prompt"   Run a single task
  "prompt"            Run a single task (shorthand)

Environment:
  SESSION_FILE     Path to session file (default: /data/session.id)
  RESULTS_DIR      Directory for results (default: /data/results)
  QUEUE_FILE       Path to queue file (default: /data/queue.txt)
  MCP_CONFIG       Path to MCP config (default: /app/mcp.json)
  PERMISSION_MODE  Permission mode (default: acceptEdits)
  MAX_TURNS        Maximum turns per task (default: 20)

Examples:
  # Run single task
  docker run claude-agent "Analyze this codebase"

  # Interactive mode
  docker run -it claude-agent --interactive

  # Queue processing
  echo "Task 1" >> queue.txt
  echo "Task 2" >> queue.txt
  docker run -v ./queue.txt:/data/queue.txt claude-agent --queue

  # Mount workspace for file operations
  docker run -v ./myproject:/workspace claude-agent "Review the code"
EOF
}

# --- Main ---

main() {
    local mode="${1:---help}"
    shift || true

    case "$mode" in
        --help|-h)
            show_help
            ;;
        --queue)
            process_queue
            ;;
        --interactive|-i)
            interactive_mode
            ;;
        --single)
            if [[ $# -lt 1 ]]; then
                log ERROR "No prompt provided"
                exit 1
            fi
            run_task "$1"
            ;;
        --version|-v)
            claude --version
            ;;
        *)
            # Treat as prompt
            run_task "$mode $*"
            ;;
    esac
}

main "$@"
