#!/bin/bash
# session-manager.sh - Multi-turn conversation management for Codex CLI.
#
# Demonstrates:
# - Thread persistence across runs
# - Lightweight history logging
#
# Note: `codex exec resume` currently outputs plain text (no --json).
#
# Usage:
#   ./session-manager.sh new "Initialize code review session"
#   ./session-manager.sh continue "Review src/auth.ts"
#   ./session-manager.sh status
#   ./session-manager.sh reset

set -euo pipefail

SESSION_DIR="${SESSION_DIR:-$HOME/.codex-sessions}"
CURRENT_SESSION_FILE="$SESSION_DIR/current"
HISTORY_DIR="$SESSION_DIR/history"
SANDBOX="${SANDBOX:-workspace-write}"
APPROVAL_POLICY="${APPROVAL_POLICY:-on-failure}"

mkdir -p "$SESSION_DIR" "$HISTORY_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

get_current_session() {
  if [[ -f "$CURRENT_SESSION_FILE" ]]; then
    cat "$CURRENT_SESSION_FILE"
  else
    echo ""
  fi
}

save_session_meta() {
  local session_id="$1"
  local prompt="$2"
  local duration="$3"

  echo "$(date -Iseconds) | ${duration}ms | ${prompt:0:80}" >> "$HISTORY_DIR/${session_id}.meta"
}

cmd_new() {
  local prompt="${1:-Initialize session}"

  log_info "Creating new thread..."
  local session_id
  session_id=$(codex -a "$APPROVAL_POLICY" -s "$SANDBOX" exec --json --skip-git-repo-check \
      "$prompt" | jq -r 'select(.type=="thread.started") | .thread_id' | head -n1)

  echo "$session_id" > "$CURRENT_SESSION_FILE"
  save_session_meta "$session_id" "$prompt" 0

  log_success "Thread created: $session_id"
}

cmd_continue() {
  local prompt="$1"
  [[ -z "$prompt" ]] && log_error "No prompt provided" && exit 1

  local session_id
  session_id=$(get_current_session)
  [[ -z "$session_id" ]] && log_error "No active session. Run '$0 new' first." && exit 1

  log_info "Resuming thread: ${session_id:0:8}..."

  # Resume outputs plain text (no JSON events)
  local out
  out=$(codex -a "$APPROVAL_POLICY" -s "$SANDBOX" exec --skip-git-repo-check \
      resume "$session_id" "$prompt")

  echo "$out"

  save_session_meta "$session_id" "$prompt" 0
}

cmd_status() {
  local session_id
  session_id=$(get_current_session)

  if [[ -z "$session_id" ]]; then
    log_info "No active session"
    return
  fi

  echo "Current Session: $session_id"

  local meta_file="$HISTORY_DIR/${session_id}.meta"
  if [[ -f "$meta_file" ]]; then
    echo "History:"
    sed 's/^/  /' "$meta_file"
  fi
}

cmd_list() {
  echo "Available Sessions:"
  for meta_file in "$HISTORY_DIR"/*.meta; do
    [[ -f "$meta_file" ]] || continue
    session_id=$(basename "$meta_file" .meta)
    turns=$(wc -l < "$meta_file")
    marker=""
    [[ "$(get_current_session)" == "$session_id" ]] && marker=" (current)"
    echo "  ${session_id:0:8}...$marker — $turns turns"
  done
}

cmd_reset() {
  rm -f "$CURRENT_SESSION_FILE"
  log_success "Session reset"
}

cmd_fork() {
  log_error "Codex CLI does not support session forking yet. Create a new session instead."
  exit 1
}

main() {
  local cmd="${1:-help}"
  shift || true

  case "$cmd" in
    new) cmd_new "$@" ;;
    continue|c) cmd_continue "$@" ;;
    status|s) cmd_status ;;
    list|ls) cmd_list ;;
    reset) cmd_reset ;;
    fork) cmd_fork ;;
    help|--help|-h)
      echo "Session Manager for Codex CLI Headless Mode"
      echo "Usage: $0 <command> [args]"
      echo "Commands: new, continue|c, status|s, list|ls, reset, fork"
      ;;
    *)
      log_error "Unknown command: $cmd"
      exit 1
      ;;
  esac
}

main "$@"
