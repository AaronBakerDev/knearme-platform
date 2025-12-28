# Define Tools

> Source: https://developers.openai.com/apps-sdk/plan/tools

## Overview

This guide covers planning and defining tools for ChatGPT app assistants through the Apps SDK.

## Tool-First Thinking

The foundational approach treats tools as "the contract between your MCP server and the model."

## Draft the Tool Surface Area

Core principles include:

- **Single responsibility**: "keep each tool focused on a single read or write action"
- **Explicit inputs**: Define `inputSchema` with parameter names, types, and enums
- **Predictable outputs**: Enumerate structured fields with machine-readable identifiers

## Capture Metadata for Discovery

Essential metadata elements:

- **Name**: "action oriented and unique inside your connector"
- **Description**: Starting phrase "Use this when…"
- **Parameter annotations**: Document safe ranges and enumerations
- **Global metadata**: App-level name, icon, and descriptions

## Model-Side Guardrails

Implementation considerations:

- **Authentication**: Distinguish prelinked vs. link-required tools
- **Read-only hints**: Use `readOnlyHint` annotation for non-mutating tools
- **Destructive hints**: Mark tools that delete/overwrite data
- **Open-world hints**: Flag tools that publish or reach external accounts
- **Result components**: Determine rendering behavior via `_meta["openai/outputTemplate"]`

## Golden Prompt Rehearsal

Validation checklist:

1. Each direct prompt maps to exactly one tool
2. Indirect prompts have sufficient context in descriptions
3. Negative prompts remain hidden via metadata

## Handoff to Implementation

Documentation deliverables: tool specifications, component requirements, auth/rate limits, and test prompts.
