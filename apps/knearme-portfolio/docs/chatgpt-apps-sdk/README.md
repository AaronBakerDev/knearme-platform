# ChatGPT Apps SDK

Deep dive documentation for building ChatGPT apps with the OpenAI Apps SDK. This is a product-facing guide intended to help us design, build, and ship ChatGPT apps or app surfaces for KnearMe.

## What the Apps SDK is

A ChatGPT app has two required parts:

1. An MCP server that defines tools, enforces auth, runs business logic, and returns tool results.
2. A web component (UI bundle) rendered inside ChatGPT when a tool returns UI output.

The model chooses tools based on tool metadata and the conversation. Tool results can include:
- `structuredContent` for the model (small, concise, LLM-readable data).
- `_meta` for the UI widget only (full payloads, sensitive data, large objects).
- `content` for regular text output.

## Quick start map

1. Plan the app around a tight set of use cases and tools.
2. Build the MCP server and expose `/mcp` over HTTPS.
3. Build the UI bundle and register it as a `text/html+skybridge` MCP resource.
4. Connect the app in ChatGPT (Developer Mode) and test end-to-end.
5. Deploy and submit for review.

## When ChatGPT apps are a good fit

- The task benefits from a conversational interface with follow-up questions.
- The UI is lightweight and focused (view, confirm, edit, summarize, decide).
- The workflow is a tight loop between natural language and structured actions.

Avoid or de-scope:
- Heavy multi-step workflows better served by full web apps.
- Ads, noisy marketing surfaces, or low-signal content.
- Use cases that ask for sensitive or restricted data.

## How to use this directory

Start with `ARCHITECTURE.md` to understand the runtime and data flow, then use the rest as a build guide.

## Contents

- `ARCHITECTURE.md` - system model, data flow, runtime boundaries
- `PLANNING.md` - use case discovery, tool design, component planning
- `BUILDING.md` - server and UI implementation details
- `UI_UX.md` - UI and UX guidelines, display modes, design system notes
- `AUTH_STATE_SECURITY.md` - auth, state management, security, privacy
- `METADATA.md` - tool and app metadata best practices
- `DEPLOYMENT_REVIEW.md` - deploy, connect, test, submit, review
- `MONETIZATION.md` - payments and checkout options
- `TROUBLESHOOTING.md` - common issues and fixes
- `CONTRACTOR_APP.md` - contractor ChatGPT app for project generation
- `CONTRACTOR_APP.md` includes locked implementation decisions for the case-study flow
- `PORTFOLIO_SCHEMA_CHANGES.md` - schema changes for case-study projects
- `PORTFOLIO_TOOL_MAPPING.md` - tool-to-API mapping for the portfolio app
- `PORTFOLIO_MIGRATION_PLAN.md` - migration + API update plan
- `MCP_CONTRACTOR_INTERFACE.md` - tool contracts for the ChatGPT app
