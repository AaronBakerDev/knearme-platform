# KnearMe Business Consultant Agent (Codex SDK)

A strategic business advisor powered by **OpenAI Codex SDK**, using GPT-5.2-Codex.

## Comparison: Claude vs Codex Version

| Feature | Claude Version | Codex Version |
|---------|---------------|---------------|
| **SDK** | `@anthropic-ai/claude-agent-sdk` | `@openai/codex-sdk` |
| **Model** | Claude Opus 4.5 | GPT-5 |
| **Auth** | Claude Max (OAuth) | ChatGPT (device auth) or API key |
| **Cost** | Subscription | Subscription or pay-per-token |
| **API Pattern** | `query()` async generator | `thread.runStreamed()` |

## Setup

```bash
# Install dependencies
npm install

# Option 1: Use ChatGPT subscription (recommended - no extra cost)
codex login --device-auth

# Option 2: Use API key (pay-per-token)
export OPENAI_API_KEY=sk-...

# Run
npm start
```

**Note:** If you're logged into ChatGPT via `codex login`, no API key is needed!

## Usage

```bash
# Interactive mode
npm start

# Single query
npm start "What's our pricing strategy?"
```

## Project Structure

```
business-agent-codex/
├── src/
│   └── index.ts        # Main agent (Codex SDK)
├── config/
│   ├── system-prompt.md # Base business context
│   ├── manager-prompt.md # Routing + autonomy decisions
│   └── roles/            # Lane-specific prompts
├── data/
│   └── memory.md       # Persistent memory
├── package.json
└── tsconfig.json
```

## Key Differences from Claude Version

### Thread-Based API

Codex uses a thread-based conversation model:

```typescript
// Create a thread
const thread = codex.startThread({ workingDirectory: PROJECT_ROOT });

// Run queries on the thread
const result = await thread.runStreamed("Your prompt");

// Iterate over events
for await (const event of result.events) {
  if (event.type === "item.completed" && event.item.type === "agent_message") {
    console.log(event.item.text);
  }
}
```

### Event Types

| Event | Description |
|-------|-------------|
| `thread.started` | New thread created |
| `turn.started` | Processing started |
| `item.started` | New item (message, command, file change) |
| `item.completed` | Item finished |
| `turn.completed` | Turn finished with usage stats |

### Authentication

Requires `OPENAI_API_KEY` environment variable (unlike Claude version which uses Max subscription OAuth).

## When to Use Each

| Use Case | Recommended |
|----------|-------------|
| Zero marginal cost | Claude (Max subscription) |
| GPT-5 reasoning | Codex |
| Complex code generation | Codex |
| Strategic analysis | Either |
| Subscription billing | Claude |
| Pay-per-use billing | Codex |
