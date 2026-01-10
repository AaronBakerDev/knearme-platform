#!/bin/bash
# =============================================================================
# afk-ralph.sh - Away From Keyboard Ralph Wiggum Loop
# =============================================================================
#
# WHAT IS THIS?
# Runs Ralph in a loop for unattended, autonomous coding. Set it running,
# go make coffee, come back to commits.
#
# USAGE:
#   ./afk-ralph.sh <iterations> [OPTIONS]
#
# ARGUMENTS:
#   iterations              Number of iterations to run (required)
#
# OPTIONS:
#   -p, --prd <file>        PRD file path (default: .claude/ralph/prds/current.json)
#   -r, --prompt <file>     Custom prompt template (default: .claude/ralph/prompts/default.md)
#   -d, --progress <file>   Progress file (default: .claude/ralph/progress/progress.txt)
#   -s, --sandbox           Run in Docker sandbox (RECOMMENDED for AFK)
#   -n, --notify            Send notification when complete (requires ntfy.sh setup)
#   -v, --verbose           Show detailed output
#   -h, --help              Show this help message
#
# EXAMPLES:
#   ./afk-ralph.sh 10                        # Run 10 iterations
#   ./afk-ralph.sh 20 -s                     # 20 iterations in Docker sandbox
#   ./afk-ralph.sh 5 -r prompts/linting.md   # 5 iterations with linting prompt
#   ./afk-ralph.sh 30 -s -n                  # 30 iterations, sandboxed, notify when done
#
# SAFETY:
#   - Always caps iterations (no infinite loops)
#   - Docker sandbox recommended for unattended runs
#   - Stops on <promise>COMPLETE</promise> signal
#   - Logs all output for review
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
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Default paths (resolve symlinks properly)
SCRIPT_SOURCE="${BASH_SOURCE[0]}"
while [ -L "$SCRIPT_SOURCE" ]; do
    SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_SOURCE")" && pwd)"
    SCRIPT_SOURCE="$(readlink "$SCRIPT_SOURCE")"
    [[ $SCRIPT_SOURCE != /* ]] && SCRIPT_SOURCE="$SCRIPT_DIR/$SCRIPT_SOURCE"
done
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_SOURCE")" && pwd)"
RALPH_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(cd "$RALPH_DIR/../.." && pwd)"

# Defaults
PRD_FILE="${RALPH_DIR}/prds/current.json"
PROMPT_FILE="${RALPH_DIR}/prompts/default.md"
PROGRESS_FILE="${RALPH_DIR}/progress/progress.txt"
LOG_DIR="${RALPH_DIR}/logs"
USE_SANDBOX=false
NOTIFY=false
VERBOSE=false
MAX_ITERATIONS=0

# -----------------------------------------------------------------------------
# Functions
# -----------------------------------------------------------------------------

show_help() {
    head -45 "$0" | grep "^#" | sed 's/^# \?//'
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

log_iteration() {
    echo -e "${MAGENTA}[ITERATION $1/$2]${NC} $3"
}

validate_files() {
    local has_error=false

    if [[ ! -f "$PRD_FILE" ]]; then
        log_error "PRD file not found: $PRD_FILE"
        has_error=true
    fi

    if [[ ! -f "$PROMPT_FILE" ]]; then
        log_error "Prompt file not found: $PROMPT_FILE"
        has_error=true
    fi

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

    cat <<EOF
@${PRD_FILE} @${PROGRESS_FILE}

${prompt_template}
EOF
}

send_notification() {
    local title="$1"
    local message="$2"

    # Try ntfy.sh if configured
    if [[ -n "${NTFY_TOPIC:-}" ]]; then
        curl -s -d "$message" "ntfy.sh/${NTFY_TOPIC}" > /dev/null 2>&1 || true
    fi

    # Try macOS notification
    if command -v osascript &> /dev/null; then
        osascript -e "display notification \"$message\" with title \"$title\"" 2>/dev/null || true
    fi

    # Terminal bell
    echo -e "\a"
}

run_claude_iteration() {
    local iteration=$1
    local log_file="$LOG_DIR/iteration-${iteration}.log"

    local prompt
    prompt=$(build_prompt)

    log_info "Output log: $log_file"
    log_info "If output is quiet, Claude may still be working."

    if [[ "$USE_SANDBOX" == "true" ]]; then
        if ! command -v docker &> /dev/null; then
            log_error "Docker not found. Install Docker Desktop or remove -s flag."
            exit 1
        fi
        # Run in Docker sandbox with print mode for output capture
        docker sandbox run claude --permission-mode bypassPermissions -p "$prompt" 2>&1 | tee "$log_file"
    else
        if ! command -v claude &> /dev/null; then
            log_error "Claude CLI not found. Install it or use -s for Docker sandbox."
            exit 1
        fi
        # Run Claude in print mode (non-interactive)
        claude --permission-mode bypassPermissions -p "$prompt" 2>&1 | tee "$log_file"
    fi
}

check_completion() {
    local log_file="$1"
    if grep -q "<promise>COMPLETE</promise>" "$log_file" 2>/dev/null; then
        return 0
    fi
    return 1
}

show_banner() {
    local iterations=$1
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${YELLOW}🔄 Ralph Wiggum - AFK Loop Mode${NC}                             ${CYAN}║${NC}"
    echo -e "${CYAN}╠═══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}  PRD:        $(basename "$PRD_FILE")                                      ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Prompt:     $(basename "$PROMPT_FILE")                                   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Iterations: $iterations                                              ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Sandbox:    $USE_SANDBOX                                            ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Notify:     $NOTIFY                                             ${CYAN}║${NC}"
    echo -e "${CYAN}╠═══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}  ${RED}⚠️  AFK MODE - Claude will run unattended!${NC}                    ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${RED}   Use -s (sandbox) for safer execution${NC}                       ${CYAN}║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# -----------------------------------------------------------------------------
# Parse Arguments
# -----------------------------------------------------------------------------

# First positional argument is iterations
if [[ $# -lt 1 ]]; then
    log_error "Missing required argument: iterations"
    echo "Usage: $0 <iterations> [OPTIONS]"
    echo "Use -h for help"
    exit 1
fi

# Check if first arg is help
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
fi

# Parse iterations
if ! [[ "$1" =~ ^[0-9]+$ ]] || [[ "$1" -lt 1 ]]; then
    log_error "Iterations must be a positive integer, got: $1"
    exit 1
fi
MAX_ITERATIONS="$1"
shift

# Parse remaining options
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
        -n|--notify)
            NOTIFY=true
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

cd "$PROJECT_ROOT"

show_banner "$MAX_ITERATIONS"

log_info "Validating files..."
validate_files

log_info "PRD Status: $(get_prd_stats)"

# Create log directory
mkdir -p "$LOG_DIR"
SESSION_LOG="$LOG_DIR/session-$(date +%Y%m%d-%H%M%S).log"

# Safety confirmation for non-sandbox mode
if [[ "$USE_SANDBOX" == "false" ]]; then
    echo ""
    log_warning "Running WITHOUT Docker sandbox!"
    log_warning "Claude will have full access to your filesystem."
    echo ""
    read -p "Are you sure you want to continue? [y/N] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Aborted. Use -s for sandbox mode."
        exit 0
    fi
fi

echo ""
log_info "Starting AFK Ralph loop..."
log_info "Session log: $SESSION_LOG"
log_info "Tip: watch output with tail -f $LOG_DIR/iteration-1.log"
echo ""

# Record start time
START_TIME=$(date +%s)

# Main loop
COMPLETED=false
for ((i=1; i<=MAX_ITERATIONS; i++)); do
    log_iteration "$i" "$MAX_ITERATIONS" "Starting iteration..."

    ITER_START=$(date +%s)
    ITER_LOG="$LOG_DIR/iteration-${i}.log"

    # Run Claude
    if ! run_claude_iteration "$i"; then
        log_error "Iteration $i failed"
        echo "Check log: $ITER_LOG"
        continue
    fi

    ITER_END=$(date +%s)
    ITER_DURATION=$((ITER_END - ITER_START))

    log_iteration "$i" "$MAX_ITERATIONS" "Completed in ${ITER_DURATION}s"

    # Check for completion signal
    if check_completion "$ITER_LOG"; then
        log_success "🎉 PRD COMPLETE! Claude signaled completion."
        COMPLETED=true
        break
    fi

    # Show progress
    log_info "PRD Status: $(get_prd_stats)"
    echo ""

    # Small delay between iterations to avoid rate limits
    sleep 2
done

# Calculate total time
END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))
MINUTES=$((TOTAL_DURATION / 60))
SECONDS=$((TOTAL_DURATION % 60))

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
if [[ "$COMPLETED" == "true" ]]; then
    log_success "Ralph finished! PRD complete."
else
    log_info "Ralph finished $MAX_ITERATIONS iterations."
fi
echo ""
log_info "Total time: ${MINUTES}m ${SECONDS}s"
log_info "Final PRD Status: $(get_prd_stats)"
log_info "Session log: $SESSION_LOG"
log_info "Review commits: git log --oneline -${MAX_ITERATIONS}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"

# Send notification if enabled
if [[ "$NOTIFY" == "true" ]]; then
    if [[ "$COMPLETED" == "true" ]]; then
        send_notification "Ralph Complete" "PRD finished after $i iterations (${MINUTES}m ${SECONDS}s)"
    else
        send_notification "Ralph Finished" "Completed $MAX_ITERATIONS iterations (${MINUTES}m ${SECONDS}s)"
    fi
fi

exit 0
