#!/bin/bash
# event-handler.sh - Bash streaming event handler for Claude Code
#
# Parses stream-json output and handles events in real-time.
# Useful for shell scripts that need to react to Claude's actions.
#
# Usage:
#   claude -p "Build something" --output-format stream-json | ./event-handler.sh
#
#   # With custom handlers (source and override functions)
#   source event-handler.sh
#   on_tool_use() { echo "Tool: $1"; }
#   parse_stream

set -euo pipefail

# ANSI colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# State tracking
TOTAL_COST=0
TOOL_COUNT=0
TEXT_BUFFER=""

# --- Event Handlers (override these) ---

on_init() {
    local session_id="$1"
    echo -e "${BLUE}Session: ${session_id:0:8}...${NC}" >&2
}

on_text() {
    local text="$1"
    echo -n "$text"
}

on_tool_use() {
    local tool_name="$1"
    local tool_input="$2"

    ((TOOL_COUNT++))

    case "$tool_name" in
        Read)
            local file
            file=$(echo "$tool_input" | jq -r '.file_path // "?"')
            echo -e "\n${CYAN}[Reading: $file]${NC}" >&2
            ;;
        Write)
            local file
            file=$(echo "$tool_input" | jq -r '.file_path // "?"')
            echo -e "\n${GREEN}[Writing: $file]${NC}" >&2
            ;;
        Edit)
            local file
            file=$(echo "$tool_input" | jq -r '.file_path // "?"')
            echo -e "\n${YELLOW}[Editing: $file]${NC}" >&2
            ;;
        Bash)
            local cmd
            cmd=$(echo "$tool_input" | jq -r '.command // "?"')
            local short_cmd="${cmd:0:60}"
            [[ ${#cmd} -gt 60 ]] && short_cmd="$short_cmd..."
            echo -e "\n${YELLOW}[Running: $short_cmd]${NC}" >&2
            ;;
        Glob)
            local pattern
            pattern=$(echo "$tool_input" | jq -r '.pattern // "?"')
            echo -e "\n${CYAN}[Glob: $pattern]${NC}" >&2
            ;;
        Grep)
            local pattern
            pattern=$(echo "$tool_input" | jq -r '.pattern // "?"')
            echo -e "\n${CYAN}[Grep: $pattern]${NC}" >&2
            ;;
        mcp__*)
            echo -e "\n${BLUE}[MCP: $tool_name]${NC}" >&2
            ;;
        *)
            echo -e "\n${BLUE}[Tool: $tool_name]${NC}" >&2
            ;;
    esac
}

on_tool_result() {
    local tool_name="$1"
    local result="$2"
    # Default: silent. Override if you want to see results.
    :
}

on_thinking() {
    local thinking="$1"
    # Default: silent. Override to show thinking.
    :
}

on_error() {
    local error="$1"
    echo -e "\n${RED}[ERROR] $error${NC}" >&2
}

on_complete() {
    local cost="$1"
    local duration="$2"
    local is_error="$3"

    echo "" >&2
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" >&2

    if [[ "$is_error" == "true" ]]; then
        echo -e "${RED}Status: Error${NC}" >&2
    else
        echo -e "${GREEN}Status: Complete${NC}" >&2
    fi

    echo -e "Cost: \$${cost}" >&2
    echo -e "Duration: ${duration}ms" >&2
    echo -e "Tools used: ${TOOL_COUNT}" >&2
}

# --- Parser ---

parse_line() {
    local line="$1"

    # Skip empty lines
    [[ -z "$line" ]] && return

    local msg_type
    msg_type=$(echo "$line" | jq -r '.type // ""')

    case "$msg_type" in
        init)
            local session_id
            session_id=$(echo "$line" | jq -r '.session_id // ""')
            on_init "$session_id"
            ;;

        user)
            # User message echo - usually skip
            :
            ;;

        assistant)
            # Parse content blocks
            local content
            content=$(echo "$line" | jq -c '.message.content // []')

            echo "$content" | jq -c '.[]' | while read -r block; do
                local block_type
                block_type=$(echo "$block" | jq -r '.type // ""')

                case "$block_type" in
                    text)
                        local text
                        text=$(echo "$block" | jq -r '.text // ""')
                        [[ -n "$text" ]] && on_text "$text"
                        ;;

                    tool_use)
                        local tool_name tool_input
                        tool_name=$(echo "$block" | jq -r '.name // "unknown"')
                        tool_input=$(echo "$block" | jq -c '.input // {}')
                        on_tool_use "$tool_name" "$tool_input"
                        ;;

                    tool_result)
                        local tool_name result
                        tool_name=$(echo "$block" | jq -r '.name // "unknown"')
                        result=$(echo "$block" | jq -r '.content // ""')
                        on_tool_result "$tool_name" "$result"
                        ;;

                    thinking)
                        local thinking
                        thinking=$(echo "$block" | jq -r '.thinking // ""')
                        [[ -n "$thinking" ]] && on_thinking "$thinking"
                        ;;
                esac
            done
            ;;

        result)
            local cost duration is_error
            cost=$(echo "$line" | jq -r '.total_cost_usd // 0')
            duration=$(echo "$line" | jq -r '.duration_ms // 0')
            is_error=$(echo "$line" | jq -r '.is_error // false')

            TOTAL_COST="$cost"

            if [[ "$is_error" == "true" ]]; then
                local error_msg
                error_msg=$(echo "$line" | jq -r '.result // "Unknown error"')
                on_error "$error_msg"
            fi

            on_complete "$cost" "$duration" "$is_error"
            ;;
    esac
}

parse_stream() {
    while IFS= read -r line; do
        parse_line "$line"
    done
}

# --- Main ---

# If sourced, just define functions. If executed, run parser.
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    parse_stream
fi
