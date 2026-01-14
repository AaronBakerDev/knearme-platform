#!/bin/bash
# monitor-agent.sh - Poll agent output and report progress
# Usage: ./monitor-agent.sh <output-file> [interval-seconds]

OUTPUT_FILE="${1:?Usage: monitor-agent.sh <output-file> [interval]}"
INTERVAL="${2:-15}"
LAST_LINES=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=========================================="
echo "  Agent Monitor"
echo "  Output: $OUTPUT_FILE"
echo "  Polling every ${INTERVAL}s"
echo -e "==========================================${NC}"
echo ""

# Wait for file to exist
while [ ! -f "$OUTPUT_FILE" ]; do
    echo "Waiting for output file..."
    sleep 2
done

check_for_errors() {
    local content="$1"

    # Check for common error patterns
    if echo "$content" | grep -qiE "(error:|Error:|ERROR|failed|FAILED|exception|Exception)"; then
        return 0  # Found errors
    fi
    return 1  # No errors
}

check_for_completion() {
    local content="$1"

    # Check for completion signals
    if echo "$content" | grep -qE "(All done|Completed|Finished|PASS|✓.*passed)"; then
        return 0  # Completed
    fi
    return 1
}

extract_current_action() {
    local file="$1"

    # Try to find what the agent is currently doing
    # Look for patterns like "Reading file", "Writing to", "Running command"
    tail -50 "$file" 2>/dev/null | grep -oE "(Reading|Writing|Running|Creating|Updating|Checking|Installing|Testing).*" | tail -1
}

while true; do
    if [ ! -f "$OUTPUT_FILE" ]; then
        echo -e "${RED}Output file disappeared!${NC}"
        break
    fi

    CURRENT_LINES=$(wc -l < "$OUTPUT_FILE" 2>/dev/null || echo "0")
    NEW_LINES=$((CURRENT_LINES - LAST_LINES))

    if [ $NEW_LINES -gt 0 ]; then
        # Get new content
        NEW_CONTENT=$(tail -n $NEW_LINES "$OUTPUT_FILE" 2>/dev/null)

        # Show timestamp and line count
        echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} +${NEW_LINES} lines (total: ${CURRENT_LINES})"

        # Check for errors
        if check_for_errors "$NEW_CONTENT"; then
            echo -e "${RED}⚠ Possible error detected in recent output${NC}"
            echo "$NEW_CONTENT" | grep -iE "(error:|Error:|ERROR|failed|FAILED)" | head -3
        fi

        # Show current action
        ACTION=$(extract_current_action "$OUTPUT_FILE")
        if [ -n "$ACTION" ]; then
            echo -e "   ${GREEN}→${NC} $ACTION"
        fi

        # Check for completion
        if check_for_completion "$NEW_CONTENT"; then
            echo -e "${GREEN}✓ Agent appears to have completed${NC}"
            break
        fi

        LAST_LINES=$CURRENT_LINES
    else
        echo -e "${YELLOW}[$(date +%H:%M:%S)]${NC} No new output..."
    fi

    # Check if codex process is still running
    if ! pgrep -f "codex" > /dev/null 2>&1; then
        echo -e "${YELLOW}Codex process not found - agent may have completed${NC}"
        # Give it one more check
        sleep 2
        if ! pgrep -f "codex" > /dev/null 2>&1; then
            break
        fi
    fi

    sleep $INTERVAL
done

echo ""
echo -e "${CYAN}=========================================="
echo "  Monitor Complete"
echo -e "==========================================${NC}"

# Show final summary
echo ""
echo "Final output stats:"
wc -l "$OUTPUT_FILE" 2>/dev/null | awk '{print "  Lines: " $1}'

# Count errors/warnings
ERRORS=$(grep -ciE "(error:|Error:|ERROR)" "$OUTPUT_FILE" 2>/dev/null || echo "0")
WARNINGS=$(grep -ciE "(warning:|Warning:|WARN)" "$OUTPUT_FILE" 2>/dev/null || echo "0")
echo "  Errors: $ERRORS"
echo "  Warnings: $WARNINGS"

if [ "$ERRORS" -gt 0 ]; then
    echo ""
    echo -e "${RED}Review errors before proceeding:${NC}"
    grep -iE "(error:|Error:|ERROR)" "$OUTPUT_FILE" 2>/dev/null | tail -5
fi
