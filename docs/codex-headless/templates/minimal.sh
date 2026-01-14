#!/bin/bash
# minimal.sh - Simplest possible Codex headless agent
#
# Copy this file and modify for your use case.
#
# Usage:
#   ./minimal.sh "Your prompt here"

set -euo pipefail

codex -a never exec "$1" --sandbox read-only --skip-git-repo-check
