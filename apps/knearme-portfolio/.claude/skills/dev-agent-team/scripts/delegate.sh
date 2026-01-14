#!/bin/bash
# Delegate task to a Codex development agent
# Usage: ./delegate.sh <agent> <task-description>
#
# Agents: implementer, reviewer, tester, refactorer, documenter

set -e

SKILL_DIR="$(dirname "$0")/.."
AGENT="${1:-implementer}"
TASK="$2"
TIMESTAMP=$(date +%s)
LOG_FILE="${3:-/tmp/codex-${AGENT}-${TIMESTAMP}.log}"

# Validate agent
PERSONA_FILE="${SKILL_DIR}/config/agents/${AGENT}.md"
if [ ! -f "$PERSONA_FILE" ]; then
  echo "Error: Unknown agent '${AGENT}'"
  echo "Available agents: implementer, reviewer, tester, refactorer, documenter"
  exit 1
fi

# Require task
if [ -z "$TASK" ]; then
  echo "Usage: ./delegate.sh <agent> <task-description> [log-file]"
  echo ""
  echo "Examples:"
  echo "  ./delegate.sh implementer 'Fix the null check bug in auth.ts'"
  echo "  ./delegate.sh reviewer 'Security audit src/lib/api/'"
  echo "  ./delegate.sh tester 'Generate tests for src/lib/utils/'"
  exit 1
fi

# Load persona
PERSONA=$(cat "$PERSONA_FILE")

# Build full prompt
FULL_PROMPT="${PERSONA}

---

TASK:
${TASK}"

echo "Delegating to ${AGENT} agent..."
echo "Log file: ${LOG_FILE}"
echo "---"

# Run Codex with full permissions
cx exec -c 'sandbox_mode="danger-full-access"' "$FULL_PROMPT" 2>&1 | tee "$LOG_FILE" &
CX_PID=$!

echo "Codex PID: $CX_PID"
echo "Monitor with: tail -f $LOG_FILE"
echo "Stop with: kill $CX_PID"
