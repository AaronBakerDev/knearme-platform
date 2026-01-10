#!/bin/bash
# =============================================================================
# ralph-once.sh - Human-in-the-Loop (HITL) Ralph Wiggum Single Iteration
# =============================================================================
#
# WHAT IS THIS?
# Ralph runs your AI coding CLI on a list of tasks. The agent picks what to
# work on next from your PRD. You define the end state. Ralph gets there.
#
# This script runs ONE iteration - perfect for:
#   - Learning how Ralph works
#   - Refining your prompts
#   - Risky architectural work that needs oversight
#
# USAGE:
#   ./ralph-once.sh [OPTIONS]
#
# OPTIONS:
#   -p, --prd <file>        PRD file path (default: .claude/ralph/prds/current.json)
#   -r, --prompt <file>     Custom prompt template (default: .claude/ralph/prompts/default.md)
#   -d, --progress <file>   Progress file (default: .claude/ralph/progress/progress.txt)
#   -s, --sandbox           Run in Docker sandbox (safer, recommended for AFK)
#   -v, --verbose           Show detailed output
#   -h, --help              Show this help message
#
# EXAMPLES:
#   ./ralph-once.sh                           # Use defaults
#   ./ralph-once.sh -p prds/geo-tracker.json  # Custom PRD
#   ./ralph-once.sh -s                        # Docker sandbox mode
#   ./ralph-once.sh -r prompts/migration.md   # Custom prompt
#
# REFERENCES:
#   - AI Hero Tips: https://www.aihero.dev/tips-for-ai-coding-with-ralph-wiggum
#   - Anthropic Harnesses: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
#
# =============================================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default paths (resolve symlinks properly)
SCRIPT_SOURCE="${BASH_SOURCE[0]}"
# Resolve symlinks to get the actual script location
while [ -L "$SCRIPT_SOURCE" ]; do
    SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_SOURCE")" && pwd)"
    SCRIPT_SOURCE="$(readlink "$SCRIPT_SOURCE")"
    # If relative symlink, resolve relative to symlink directory
    [[ $SCRIPT_SOURCE != /* ]] && SCRIPT_SOURCE="$SCRIPT_DIR/$SCRIPT_SOURCE"
done
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_SOURCE")" && pwd)"
RALPH_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(cd "$RALPH_DIR/../.." && pwd)"

PRD_FILE="${RALPH_DIR}/prds/current.json"
PROMPT_FILE="${RALPH_DIR}/prompts/default.md"
PROGRESS_FILE="${RALPH_DIR}/progress/progress.txt"
USE_SANDBOX=false
VERBOSE=false

# -----------------------------------------------------------------------------
# Functions
# -----------------------------------------------------------------------------

show_help() {
    head -50 "$0" | grep "^#" | sed 's/^# \?//'
    exit 0
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

validate_files() {
    local has_error=false

    if [[ ! -f "$PRD_FILE" ]]; then
        log_error "PRD file not found: $PRD_FILE"
        log_info "Create one with: cp ${RALPH_DIR}/prds/template.json ${PRD_FILE}"
        has_error=true
    fi

    if [[ ! -f "$PROMPT_FILE" ]]; then
        log_error "Prompt file not found: $PROMPT_FILE"
        has_error=true
    fi

    # Create progress file if it doesn't exist
    if [[ ! -f "$PROGRESS_FILE" ]]; then
        log_warning "Progress file not found, creating: $PROGRESS_FILE"
        mkdir -p "$(dirname "$PROGRESS_FILE")"
        echo "# Ralph Progress Log" > "$PROGRESS_FILE"
        echo "# Created: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$PROGRESS_FILE"
        echo "" >> "$PROGRESS_FILE"
    fi

    if [[ "$has_error" == "true" ]]; then
        exit 1
    fi
}

get_prd_stats() {
    if command -v jq &> /dev/null; then
        local total=$(jq '.features | length' "$PRD_FILE" 2>/dev/null || echo "?")
        local passing=$(jq '[.features[] | select(.passes == true)] | length' "$PRD_FILE" 2>/dev/null || echo "?")
        local failing=$(jq '[.features[] | select(.passes == false)] | length' "$PRD_FILE" 2>/dev/null || echo "?")
        echo "Total: $total | Passing: $passing | Remaining: $failing"
    else
        echo "(install jq for PRD stats)"
    fi
}

build_prompt() {
    local prompt_template
    prompt_template=$(cat "$PROMPT_FILE")

    # Build the full prompt with file references
    cat <<EOF
@${PRD_FILE} @${PROGRESS_FILE}

${prompt_template}
EOF
}

run_claude() {
    local prompt="$1"

    if [[ "$USE_SANDBOX" == "true" ]]; then
        log_step "Launching Claude in Docker sandbox..."
        log_info "This may take a minute. Output will stream below."
        if ! command -v docker &> /dev/null; then
            log_error "Docker not found. Install Docker Desktop or remove -s flag."
            exit 1
        fi
        docker sandbox run claude --permission-mode bypassPermissions -p "$prompt"
    else
        if ! command -v claude &> /dev/null; then
            log_error "Claude CLI not found. Install it or use -s for Docker sandbox."
            exit 1
        fi
        log_step "Launching Claude (interactive mode)..."
        log_info "If the terminal looks idle, Claude is still working. Press Ctrl+C to cancel."
        # Using -p for print mode allows capturing output
        # Remove -p for fully interactive session where you can intervene
        claude --permission-mode bypassPermissions "$prompt"
    fi
}

show_banner() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${YELLOW}🔄 Ralph Wiggum - HITL Single Iteration${NC}                      ${CYAN}║${NC}"
    echo -e "${CYAN}╠═══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}  PRD:      $(basename "$PRD_FILE")                                        ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Prompt:   $(basename "$PROMPT_FILE")                                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Progress: $(basename "$PROGRESS_FILE")                                   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Sandbox:  $USE_SANDBOX                                              ${CYAN}║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# -----------------------------------------------------------------------------
# Parse Arguments
# -----------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            ;;
        -p|--prd)
            PRD_FILE="$2"
            shift 2
            ;;
        -r|--prompt)
            PROMPT_FILE="$2"
            shift 2
            ;;
        -d|--progress)
            PROGRESS_FILE="$2"
            shift 2
            ;;
        -s|--sandbox)
            USE_SANDBOX=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use -h for help"
            exit 1
            ;;
    esac
done

# -----------------------------------------------------------------------------
# Main Execution
# -----------------------------------------------------------------------------

# Change to project root
cd "$PROJECT_ROOT"

show_banner

log_info "Validating files..."
validate_files

log_info "PRD Status: $(get_prd_stats)"

# Check git status
if git rev-parse --is-inside-work-tree &> /dev/null; then
    local_changes=$(git status --porcelain | wc -l | tr -d ' ')
    if [[ "$local_changes" -gt 0 ]]; then
        log_warning "You have $local_changes uncommitted changes"
        log_info "Ralph will make commits - consider committing your work first"
        echo ""
        read -p "Continue anyway? [y/N] " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Aborted. Commit your changes and try again."
            exit 0
        fi
    fi
fi

echo ""
log_step "Starting Ralph iteration..."
echo ""

# Build and run the prompt
FULL_PROMPT=$(build_prompt)

if [[ "$VERBOSE" == "true" ]]; then
    echo -e "${CYAN}--- PROMPT ---${NC}"
    echo "$FULL_PROMPT"
    echo -e "${CYAN}--- END PROMPT ---${NC}"
    echo ""
else
    log_info "Prompt ready. Use -v to print it."
fi

# Run Claude
run_claude "$FULL_PROMPT"

echo ""
log_success "Ralph iteration complete!"
echo ""
log_info "PRD Status: $(get_prd_stats)"
log_info "Review the changes with: git log -1 --stat"
log_info "Run again with: ./ralph-once.sh"
echo ""
