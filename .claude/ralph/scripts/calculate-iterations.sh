#!/bin/bash
# calculate-iterations.sh - Calculate recommended max_iterations for ralph-loop
#
# Usage: ./calculate-iterations.sh [path-to-prd.json]
#
# Formula:
#   recommended = incomplete_features + review_checkpoints + retry_buffer + safety_margin
#
# Where:
#   - incomplete_features = features where passes == false
#   - review_checkpoints = features where category == "review"
#   - retry_buffer = ceil(incomplete_features * 0.25) [25% for retries]
#   - safety_margin = 5 [always add a few extra]

set -e

# Default to current.json if no argument provided
PRD_FILE="${1:-.claude/ralph/prds/current.json}"

# Check if file exists
if [[ ! -f "$PRD_FILE" ]]; then
    echo "Error: PRD file not found: $PRD_FILE" >&2
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed" >&2
    exit 1
fi

# Extract counts using jq
TOTAL=$(jq '.features | length' "$PRD_FILE")
INCOMPLETE=$(jq '[.features[] | select(.passes == false)] | length' "$PRD_FILE")
PASSING=$(jq '[.features[] | select(.passes == true)] | length' "$PRD_FILE")
REVIEWS=$(jq '[.features[] | select(.category == "review")] | length' "$PRD_FILE")

# Calculate retry buffer (25% of incomplete, rounded up)
# Using awk for floating point math since bash doesn't support it
BUFFER=$(echo "$INCOMPLETE" | awk '{print int($1 * 0.25 + 0.99)}')

# Safety margin
SAFETY=5

# Calculate recommended iterations
RECOMMENDED=$((INCOMPLETE + BUFFER + SAFETY))

# Get PRD name for display
PRD_NAME=$(jq -r '.meta.name // "Unnamed PRD"' "$PRD_FILE")

# Output results
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PRD: $PRD_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Feature Analysis:"
echo "  Total features:      $TOTAL"
echo "  Passing:             $PASSING"
echo "  Incomplete:          $INCOMPLETE"
echo "  Review checkpoints:  $REVIEWS"
echo ""
echo "Iteration Calculation:"
echo "  Incomplete features: $INCOMPLETE"
echo "  + Retry buffer (25%): $BUFFER"
echo "  + Safety margin:     $SAFETY"
echo "  ─────────────────────"
echo "  = Recommended:       $RECOMMENDED"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Run with: /ralph-loop \"prompt\" --max-iterations $RECOMMENDED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Also output just the number for scripting use
# (use: ITERATIONS=$(./calculate-iterations.sh | tail -1) if you need just the number)
