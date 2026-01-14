#!/bin/bash
# minimal.sh - Simplest possible Claude headless agent
#
# Copy this file and modify for your use case.
#
# Usage:
#   ./minimal.sh "Your prompt here"

claude -p "$1" --output-format json | jq -r '.result'
