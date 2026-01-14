#!/bin/bash
# archive-prd.sh - Archives completed PRDs to archive/completed/
#
# Usage: ./archive-prd.sh <prd-file.json>
# Example: ./archive-prd.sh prds/google-ai-agent-reliability.json
#
# Requirements:
# - All features must have passes: true
# - Cannot archive current.json (active loop protection)
# - jq must be installed
#
# Actions:
# 1. Validates PRD completion
# 2. Adds archive metadata
# 3. Moves to archive/completed/ with date prefix
# 4. Updates archive index.md

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RALPH_DIR="$(dirname "$SCRIPT_DIR")"
ARCHIVE_DIR="$RALPH_DIR/archive/completed"
INDEX_FILE="$ARCHIVE_DIR/index.md"

# Check dependencies
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed.${NC}"
    echo "Install with: brew install jq"
    exit 1
fi

# Check arguments
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <prd-file.json>${NC}"
    echo "Example: $0 prds/google-ai-agent-reliability.json"
    exit 1
fi

PRD_FILE="$1"

# Resolve relative paths
if [[ ! "$PRD_FILE" = /* ]]; then
    PRD_FILE="$RALPH_DIR/$PRD_FILE"
fi

# Check file exists
if [ ! -f "$PRD_FILE" ]; then
    echo -e "${RED}Error: PRD file not found: $PRD_FILE${NC}"
    exit 1
fi

# Safety: Refuse to archive current.json
BASENAME=$(basename "$PRD_FILE")
if [ "$BASENAME" = "current.json" ]; then
    echo -e "${RED}Error: Cannot archive current.json - this is the active PRD.${NC}"
    echo "Wait for the Ralph loop to complete, then rename or copy the file first."
    exit 1
fi

# Validate: All features must have passes: true
echo -e "${YELLOW}Validating PRD completion...${NC}"

TOTAL=$(jq '.features | length' "$PRD_FILE")
PASSING=$(jq '[.features[] | select(.passes == true)] | length' "$PRD_FILE")
FAILED=$(jq '[.features[] | select(.passes != true)] | length' "$PRD_FILE")

if [ "$TOTAL" -eq 0 ]; then
    echo -e "${RED}Error: PRD has no features.${NC}"
    exit 1
fi

if [ "$PASSING" -ne "$TOTAL" ]; then
    echo -e "${RED}Error: PRD is not complete.${NC}"
    echo "  Total features: $TOTAL"
    echo "  Passing: $PASSING"
    echo "  Incomplete: $FAILED"
    echo ""
    echo "Incomplete features:"
    jq -r '.features[] | select(.passes != true) | "  - \(.id): \(.description[0:60])..."' "$PRD_FILE"
    exit 1
fi

echo -e "${GREEN}PRD validated: $PASSING/$TOTAL features passing${NC}"

# Extract metadata
PRD_NAME=$(jq -r '.meta.name' "$PRD_FILE")
PRD_CREATED=$(jq -r '.meta.created // empty' "$PRD_FILE")
TODAY=$(date +%Y-%m-%d)

# Generate archive filename
SLUG=$(echo "$PRD_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')
ARCHIVE_FILENAME="${TODAY}_${SLUG}.json"
ARCHIVE_PATH="$ARCHIVE_DIR/$ARCHIVE_FILENAME"

# Ensure archive directory exists
mkdir -p "$ARCHIVE_DIR"

# Add archive metadata and write to archive location
echo -e "${YELLOW}Archiving to: $ARCHIVE_FILENAME${NC}"

jq --arg date "$TODAY" --arg total "$TOTAL" '.meta += {
  archived: true,
  archived_date: $date,
  completion_stats: {
    total_features: ($total | tonumber),
    all_passed: true
  }
}' "$PRD_FILE" > "$ARCHIVE_PATH"

# Remove original file
rm "$PRD_FILE"
echo -e "${GREEN}Moved to archive: $ARCHIVE_PATH${NC}"

# Update index.md
echo -e "${YELLOW}Updating archive index...${NC}"

# Create index if it doesn't exist
if [ ! -f "$INDEX_FILE" ]; then
    cat > "$INDEX_FILE" << 'EOF'
# Completed PRD Archive

This directory contains archived PRDs that have been fully completed (all features passing).

## Archive Index

| Archived | Project | Features | Original Created |
|----------|---------|----------|------------------|
EOF
fi

# Add entry to index (insert after table header)
INDEX_ENTRY="| $TODAY | $PRD_NAME | $TOTAL | ${PRD_CREATED:-N/A} |"

# Check if entry already exists
if grep -q "$ARCHIVE_FILENAME" "$INDEX_FILE" 2>/dev/null; then
    echo "Entry already exists in index"
else
    # Add entry after the table header line (line containing "|---")
    sed -i '' "/|----------|/a\\
$INDEX_ENTRY
" "$INDEX_FILE"
    echo -e "${GREEN}Added to index.md${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}=== Archive Complete ===${NC}"
echo "  Project: $PRD_NAME"
echo "  Features: $TOTAL (all passing)"
echo "  Archived to: archive/completed/$ARCHIVE_FILENAME"
echo "  Original removed from prds/"
