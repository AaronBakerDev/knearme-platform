#!/bin/bash
# KnearMe Sprint Progress Checker
# Run from workspace root: ./.claude/skills/knearme-sprint-workflow/scripts/check_progress.sh

echo "=== KnearMe Sprint Progress ==="
echo ""

# Find the todo directory
TODO_DIR="knearme-portfolio/todo"
if [ ! -d "$TODO_DIR" ]; then
    TODO_DIR="./todo"
fi

if [ ! -d "$TODO_DIR" ]; then
    echo "Error: Cannot find todo directory"
    exit 1
fi

# Calculate progress for each phase/sprint
shopt -s nullglob
FILES=("$TODO_DIR"/ai-sdk-phase-*.md)
if [ ${#FILES[@]} -eq 0 ]; then
    FILES=("$TODO_DIR"/sprint-*.md)
fi

for f in "${FILES[@]}"; do
    if [ -f "$f" ]; then
        name=$(basename "$f" .md | sed 's/ai-sdk-phase-/AI SDK Phase /' | sed 's/sprint-/Sprint /')
        done=$(grep -c "\[x\]" "$f" 2>/dev/null)
        done=${done:-0}
        todo=$(grep -c "\[ \]" "$f" 2>/dev/null)
        todo=${todo:-0}
        total=$((done + todo))

        if [ "$total" -gt 0 ]; then
            pct=$((done * 100 / total))
            bar=""
            filled=$((pct / 5))
            empty=$((20 - filled))

            for ((i=0; i<filled; i++)); do bar+="█"; done
            for ((i=0; i<empty; i++)); do bar+="░"; done

            printf "%-25s [%s] %3d%% (%d/%d)\n" "$name:" "$bar" "$pct" "$done" "$total"
        fi
    fi
done

echo ""
echo "=== Next Tasks ==="
echo ""

# Show next 5 incomplete tasks from current phase
CURRENT_FILE=$(grep "Current File:" "$TODO_DIR/README.md" 2>/dev/null | head -1 | sed -n 's/.*`\\(.*\\)`/\\1/p')
SPRINT_FILE=""
if [ -n "$CURRENT_FILE" ]; then
    if [ -f "$CURRENT_FILE" ]; then
        SPRINT_FILE="$CURRENT_FILE"
    elif [ -f "$TODO_DIR/$(basename "$CURRENT_FILE")" ]; then
        SPRINT_FILE="$TODO_DIR/$(basename "$CURRENT_FILE")"
    fi
fi

if [ -n "$SPRINT_FILE" ] && [ -f "$SPRINT_FILE" ]; then
    base=$(basename "$SPRINT_FILE" .md)
    echo "From $base:"
    grep -n "\[ \]" "$SPRINT_FILE" | head -5 | while read line; do
        echo "  $line"
    done
else
    # Default to phase 1 if can't detect
    if [ -f "$TODO_DIR/ai-sdk-phase-1-foundation.md" ]; then
        echo "From ai-sdk-phase-1-foundation:"
        grep -n "\[ \]" "$TODO_DIR/ai-sdk-phase-1-foundation.md" | head -5 | while read line; do
            echo "  $line"
        done
    elif [ -f "$TODO_DIR/sprint-1-foundation.md" ]; then
        echo "From sprint-1-foundation:"
        grep -n "\[ \]" "$TODO_DIR/sprint-1-foundation.md" | head -5 | while read line; do
            echo "  $line"
        done
    fi
fi

echo ""
