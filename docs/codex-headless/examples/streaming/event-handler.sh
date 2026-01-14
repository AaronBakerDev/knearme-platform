#!/bin/bash
# event-handler.sh - Bash streaming event handler for Codex CLI
#
# Parses `codex exec --json` output and reacts to events.
#
# Usage:
#   codex exec --json "Build something" | ./event-handler.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

TOOL_COUNT=0

on_init() {
  local thread_id="$1"
  echo -e "${BLUE}Session: ${thread_id:0:8}...${NC}" >&2
}

on_text() {
  echo -n "$1"
}

on_tool_use() {
  local name="$1"
  ((TOOL_COUNT++))
  echo -e "\n${CYAN}[Tool: $name]${NC}" >&2
}

on_error() {
  echo -e "\n${RED}[ERROR] $1${NC}" >&2
}

on_complete() {
  local duration="$1"
  local is_error="$2"
  echo "" >&2
  if [[ "$is_error" == "true" ]]; then
    echo -e "${RED}Status: Error${NC}" >&2
  else
    echo -e "${GREEN}Status: Complete${NC}" >&2
  fi
  echo -e "Duration: ${duration}ms" >&2
  echo -e "Tools used: ${TOOL_COUNT}" >&2
}

parse_line() {
  local line="$1"
  [[ -z "$line" ]] && return

  local msg_type
  msg_type=$(echo "$line" | jq -r '.type // ""')

  case "$msg_type" in
    thread.started)
      on_init "$(echo "$line" | jq -r '.thread_id // ""')"
      ;;
    item.completed)
      item_type=$(echo "$line" | jq -r '.item.type // empty')
      if [[ "$item_type" == "agent_message" ]]; then
        on_text "$(echo "$line" | jq -r '.item.text // ""')"
      elif [[ "$item_type" == "tool_call" || "$item_type" == "command_execution" ]]; then
        on_tool_use "$(echo "$line" | jq -r '.item.tool // .item.command // "tool"')"
      fi
      ;;
    turn.completed|turn.failed)
      duration=$(echo "$line" | jq -r '.duration_ms // 0')
      is_error=$(echo "$line" | jq -r '.type=="turn.failed"')
      [[ "$is_error" == "true" ]] && on_error "$(echo "$line" | jq -r '.error.message // "Unknown error"')"
      on_complete "$duration" "$is_error"
      ;;
    error)
      on_error "$(echo "$line" | jq -r '.message // .error.message // "Unknown error"')"
      ;;
  esac
}

parse_stream() {
  while IFS= read -r line; do
    parse_line "$line"
  done
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  parse_stream
fi

