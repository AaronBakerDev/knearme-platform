#!/bin/bash
# session-manager.sh - Multi-turn conversation management
#
# This script demonstrates session persistence across multiple
# invocations, allowing Claude to maintain context.
#
# Usage:
#   # Start a new session
#   ./session-manager.sh new "Initialize code review session"
#
#   # Continue the session
#   ./session-manager.sh continue "Review the authentication module"
#   ./session-manager.sh continue "Now check for SQL injection vulnerabilities"
#   ./session-manager.sh continue "Generate a summary report"
#
#   # Check session status
#   ./session-manager.sh status
#
#   # Reset session
#   ./session-manager.sh reset

set -euo pipefail

# Configuration
SESSION_DIR="${SESSION_DIR:-$HOME/.claude-sessions}"
CURRENT_SESSION_FILE="$SESSION_DIR/current"
HISTORY_DIR="$SESSION_DIR/history"

mkdir -p "$SESSION_DIR" "$HISTORY_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

# Get current session ID
get_current_session() {
    if [[ -f "$CURRENT_SESSION_FILE" ]]; then
        cat "$CURRENT_SESSION_FILE"
    else
        echo ""
    fi
}

# Save session metadata
save_session_meta() {
    local session_id="$1"
    local prompt="$2"
    local cost="$3"

    local meta_file="$HISTORY_DIR/${session_id}.meta"

    echo "$(date -Iseconds) | \$$cost | ${prompt:0:80}" >> "$meta_file"
}

# Create new session
cmd_new() {
    local prompt="${1:-Initialize session}"

    log_info "Creating new session..."

    local result
    result=$(claude -p "$prompt" --output-format json)

    local session_id
    session_id=$(echo "$result" | jq -r '.session_id')

    local cost
    cost=$(echo "$result" | jq -r '.total_cost_usd')

    echo "$session_id" > "$CURRENT_SESSION_FILE"
    save_session_meta "$session_id" "$prompt" "$cost"

    log_success "Session created: $session_id"
    echo ""
    echo "$result" | jq -r '.result'
}

# Continue current session
cmd_continue() {
    local prompt="$1"

    if [[ -z "$prompt" ]]; then
        log_error "No prompt provided"
        exit 1
    fi

    local session_id
    session_id=$(get_current_session)

    if [[ -z "$session_id" ]]; then
        log_error "No active session. Run '$0 new' first."
        exit 1
    fi

    log_info "Resuming session: ${session_id:0:8}..."

    local result
    result=$(claude -p --resume "$session_id" "$prompt" --output-format json)

    local cost
    cost=$(echo "$result" | jq -r '.total_cost_usd')

    save_session_meta "$session_id" "$prompt" "$cost"

    echo "$result" | jq -r '.result'
    echo ""
    log_info "Cost: \$$cost"
}

# Show session status
cmd_status() {
    local session_id
    session_id=$(get_current_session)

    if [[ -z "$session_id" ]]; then
        log_info "No active session"
        return
    fi

    echo "Current Session: $session_id"
    echo ""

    local meta_file="$HISTORY_DIR/${session_id}.meta"
    if [[ -f "$meta_file" ]]; then
        echo "History:"
        cat "$meta_file" | while read -r line; do
            echo "  $line"
        done

        echo ""
        local total_cost
        total_cost=$(grep -oP '\$[\d.]+' "$meta_file" | tr -d '$' | awk '{s+=$1} END {printf "%.4f", s}')
        echo "Total Cost: \$$total_cost"
    fi
}

# List all sessions
cmd_list() {
    echo "Available Sessions:"
    echo ""

    for meta_file in "$HISTORY_DIR"/*.meta; do
        if [[ -f "$meta_file" ]]; then
            local session_id
            session_id=$(basename "$meta_file" .meta)

            local turn_count
            turn_count=$(wc -l < "$meta_file")

            local total_cost
            total_cost=$(grep -oP '\$[\d.]+' "$meta_file" | tr -d '$' | awk '{s+=$1} END {printf "%.4f", s}')

            local current_marker=""
            if [[ "$(get_current_session)" == "$session_id" ]]; then
                current_marker=" (current)"
            fi

            echo "  ${session_id:0:8}...$current_marker"
            echo "    Turns: $turn_count | Cost: \$$total_cost"
        fi
    done
}

# Switch to a different session
cmd_switch() {
    local target="${1:-}"

    if [[ -z "$target" ]]; then
        log_error "No session ID provided"
        exit 1
    fi

    # Find matching session
    for meta_file in "$HISTORY_DIR"/*.meta; do
        if [[ -f "$meta_file" ]]; then
            local session_id
            session_id=$(basename "$meta_file" .meta)

            if [[ "$session_id" == "$target"* ]]; then
                echo "$session_id" > "$CURRENT_SESSION_FILE"
                log_success "Switched to session: $session_id"
                return
            fi
        fi
    done

    log_error "Session not found: $target"
    exit 1
}

# Reset current session
cmd_reset() {
    if [[ -f "$CURRENT_SESSION_FILE" ]]; then
        rm "$CURRENT_SESSION_FILE"
        log_success "Session reset"
    else
        log_info "No active session to reset"
    fi
}

# Fork current session (create branch)
cmd_fork() {
    local prompt="${1:-Continue from fork}"

    local session_id
    session_id=$(get_current_session)

    if [[ -z "$session_id" ]]; then
        log_error "No active session to fork"
        exit 1
    fi

    log_info "Forking session: ${session_id:0:8}..."

    local result
    result=$(claude -p --resume "$session_id" --fork-session "$prompt" --output-format json)

    local new_session_id
    new_session_id=$(echo "$result" | jq -r '.session_id')

    local cost
    cost=$(echo "$result" | jq -r '.total_cost_usd')

    echo "$new_session_id" > "$CURRENT_SESSION_FILE"
    save_session_meta "$new_session_id" "[FORK] $prompt" "$cost"

    log_success "Forked to new session: $new_session_id"
    echo ""
    echo "$result" | jq -r '.result'
}

# Main command handler
main() {
    local cmd="${1:-help}"
    shift || true

    case "$cmd" in
        new)
            cmd_new "$@"
            ;;
        continue|c)
            cmd_continue "$@"
            ;;
        status|s)
            cmd_status
            ;;
        list|ls)
            cmd_list
            ;;
        switch)
            cmd_switch "$@"
            ;;
        reset)
            cmd_reset
            ;;
        fork)
            cmd_fork "$@"
            ;;
        help|--help|-h)
            echo "Session Manager for Claude Code Headless Mode"
            echo ""
            echo "Usage: $0 <command> [args]"
            echo ""
            echo "Commands:"
            echo "  new [prompt]      Create a new session"
            echo "  continue <prompt> Continue current session (alias: c)"
            echo "  status            Show current session status (alias: s)"
            echo "  list              List all sessions (alias: ls)"
            echo "  switch <id>       Switch to a different session"
            echo "  fork [prompt]     Fork current session into new branch"
            echo "  reset             Clear current session"
            echo ""
            echo "Environment:"
            echo "  SESSION_DIR       Directory for session storage (default: ~/.claude-sessions)"
            ;;
        *)
            log_error "Unknown command: $cmd"
            echo "Run '$0 help' for usage"
            exit 1
            ;;
    esac
}

main "$@"
