#!/bin/bash
# Run Codex with full autonomy mode
# Usage: ./cx-full.sh "your task description"

TASK="$1"
LOG_FILE="${2:-/tmp/codex-$(date +%s).log}"

if [ -z "$TASK" ]; then
  echo "Usage: ./cx-full.sh \"task description\" [log_file]"
  exit 1
fi

echo "Starting Codex with full permissions..."
echo "Log file: $LOG_FILE"
echo "---"

cx exec -c 'sandbox_mode="danger-full-access"' "$TASK" 2>&1 | tee "$LOG_FILE" &
CX_PID=$!

echo "Codex PID: $CX_PID"
echo "Monitor with: tail -f $LOG_FILE"
echo "Stop with: kill $CX_PID"
