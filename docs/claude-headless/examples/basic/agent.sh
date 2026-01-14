#!/bin/bash
# agent.sh - Minimal Claude Code headless agent
#
# Usage:
#   ./agent.sh "Your prompt here"
#   echo "Your prompt" | ./agent.sh
#
# Environment:
#   SESSION_FILE - Path to session file (default: /tmp/claude-agent.session)
#   OUTPUT_FORMAT - json or stream-json (default: json)

set -euo pipefail

# Configuration
SESSION_FILE="${SESSION_FILE:-/tmp/claude-agent.session}"
OUTPUT_FORMAT="${OUTPUT_FORMAT:-json}"
PERMISSION_MODE="${PERMISSION_MODE:-default}"

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

# Session management
get_or_create_session() {
    if [[ -f "$SESSION_FILE" ]]; then
        cat "$SESSION_FILE"
    else
        local session_id
        session_id=$(claude -p "Initialize agent session" \
            --output-format json | jq -r '.session_id')
        echo "$session_id" > "$SESSION_FILE"
        echo "$session_id"
    fi
}

# Build command
build_command() {
    local session_id="$1"
    local prompt="$2"

    echo claude -p --resume "$session_id" \
        --output-format "$OUTPUT_FORMAT" \
        --permission-mode "$PERMISSION_MODE" \
        "$prompt"
}

# Run agent
run_agent() {
    local session_id
    session_id=$(get_or_create_session)

    if [[ "$OUTPUT_FORMAT" == "stream-json" ]]; then
        # Streaming mode - parse events
        claude -p --resume "$session_id" \
            --output-format stream-json \
            --permission-mode "$PERMISSION_MODE" \
            "$PROMPT" | while IFS= read -r line; do

            local msg_type
            msg_type=$(echo "$line" | jq -r '.type')

            case "$msg_type" in
                assistant)
                    echo "$line" | jq -r '.message.content[]? | select(.type=="text") | .text // empty'
                    ;;
                result)
                    echo "" >&2
                    echo "Cost: \$$(echo "$line" | jq -r '.total_cost_usd')" >&2
                    echo "Duration: $(echo "$line" | jq -r '.duration_ms')ms" >&2
                    ;;
            esac
        done
    else
        # JSON mode - return full result
        local result
        result=$(claude -p --resume "$session_id" \
            --output-format json \
            --permission-mode "$PERMISSION_MODE" \
            "$PROMPT")

        if echo "$result" | jq -e '.is_error == true' > /dev/null; then
            echo "Error: $(echo "$result" | jq -r '.result')" >&2
            exit 1
        fi

        echo "$result" | jq -r '.result'
    fi
}

# Main
run_agent
