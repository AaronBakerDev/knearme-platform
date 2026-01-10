# Ralph Wiggum - Autonomous AI Coding Loops

> "Me fail English? That's unpossible!" - Ralph Wiggum

Ralph runs your AI coding CLI in a loop, letting it work autonomously on a list of tasks. You define what needs to be done. Ralph figures out how - and keeps going until it's finished.

## Quick Start

```bash
# 1. Create/edit your PRD
cp .claude/ralph/prds/template.json .claude/ralph/prds/current.json
# Edit current.json with your features

# 2. Run a single iteration (HITL mode)
./.claude/ralph/scripts/ralph-once.sh

# 3. Watch, review, repeat
```

## Directory Structure

```
.claude/ralph/
├── scripts/
│   ├── ralph-once.sh      # Human-in-the-loop single iteration
│   └── afk-ralph.sh       # AFK loop with max iterations
├── prompts/
│   ├── default.md         # Feature development prompt
│   ├── test-coverage.md   # Test coverage loop prompt
│   └── linting.md         # Code quality loop prompt
├── prds/
│   ├── template.json      # PRD template
│   └── current.json       # Active PRD (gitignored)
├── progress/
│   └── progress.txt       # Session progress log
└── README.md              # This file
```

## Two Modes of Operation

| Mode | Script | Use Case |
|------|--------|----------|
| **HITL** | `ralph-once.sh` | Learning, refinement, risky work |
| **AFK** | `afk-ralph.sh` | Bulk work, overnight runs |

### AFK Mode Usage

```bash
# Run 10 iterations
./afk-ralph.sh 10

# Run in Docker sandbox (recommended for safety)
./afk-ralph.sh 20 -s

# Run with notifications when done
./afk-ralph.sh 30 -s -n
```

**Safety features:**
- Always capped iterations (no infinite loops)
- Stops on `<promise>COMPLETE</promise>` signal
- Docker sandbox mode for isolation
- Warns before running without sandbox
- Logs every iteration for review

**Start with HITL** to learn how Ralph works. Watch what it does. Refine your PRD and prompts. Only go AFK once you trust your setup.

## PRD Format

PRDs use JSON with a `passes` field (inspired by [Anthropic's research](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)):

```json
{
  "features": [
    {
      "id": "feat-001",
      "category": "functional",
      "priority": "high",
      "description": "User can create a new account",
      "acceptance_criteria": [
        "Form validates email format",
        "Password meets security requirements",
        "Confirmation email is sent"
      ],
      "verification_steps": [
        "Submit form with valid data",
        "Check database for new user",
        "Verify email received"
      ],
      "dependencies": [],
      "notes": "",
      "passes": false
    }
  ]
}
```

**Key Rules:**
- Ralph can only change `passes: false` to `passes: true`
- Never remove or edit feature descriptions
- Only mark as passing after verified testing

## Available Prompts

### `default.md` - Feature Development
General-purpose prompt for building features from a PRD.

```bash
./.claude/ralph/scripts/ralph-once.sh
```

### `test-coverage.md` - Test Coverage
Focused on increasing test coverage.

```bash
./.claude/ralph/scripts/ralph-once.sh -r .claude/ralph/prompts/test-coverage.md
```

### `linting.md` - Code Quality
Fixes lint errors one category at a time.

```bash
./.claude/ralph/scripts/ralph-once.sh -r .claude/ralph/prompts/linting.md
```

## Script Options

```bash
./ralph-once.sh [OPTIONS]

Options:
  -p, --prd <file>      PRD file (default: prds/current.json)
  -r, --prompt <file>   Prompt template (default: prompts/default.md)
  -d, --progress <file> Progress file (default: progress/progress.txt)
  -s, --sandbox         Run in Docker sandbox (safer)
  -v, --verbose         Show detailed output
  -h, --help            Show help
```

## How Ralph Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Ralph Loop Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐    ┌─────────────┐    ┌──────────────┐       │
│   │   PRD   │───▶│ Agent Reads │───▶│ Agent Chooses│       │
│   │  (JSON) │    │ PRD+Progress│    │  Next Task   │       │
│   └─────────┘    └─────────────┘    └──────┬───────┘       │
│                                            │                │
│   ┌─────────┐    ┌─────────────┐    ┌──────▼───────┐       │
│   │ COMPLETE│◀───│  All Tasks  │◀───│  Implement   │       │
│   │  Signal │    │   Done?     │    │   Feature    │       │
│   └─────────┘    └──────┬──────┘    └──────┬───────┘       │
│                         │                   │               │
│                         │ No         ┌──────▼───────┐       │
│                         │            │   Feedback   │       │
│   ┌─────────┐    ┌──────▼──────┐    │    Loops     │       │
│   │ Progress│◀───│   Update    │◀───│(types/tests) │       │
│   │  File   │    │  PRD+Commit │    └──────────────┘       │
│   └─────────┘    └─────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Tips for Success

### 1. Define Clear Scope
The vaguer the task, the greater the risk. Be specific about acceptance criteria.

### 2. Use Feedback Loops
TypeScript, tests, and linting catch mistakes before they compound.

### 3. Take Small Steps
One feature per iteration. Quality over speed.

### 4. Prioritize Risky Work
Tackle architectural decisions first while you're watching.

### 5. Track Progress
The progress file helps the next iteration skip exploration.

## References

- [11 Tips for AI Coding with Ralph](https://www.aihero.dev/tips-for-ai-coding-with-ralph-wiggum) - Matt Pocock
- [Getting Started with Ralph](https://www.aihero.dev/getting-started-with-ralph) - Matt Pocock
- [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) - Anthropic
- [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents) - Anthropic

## Coming Soon

- ClickUp/Linear integration for task sources
- Domain-specific prompts (SEO audit, migration, etc.)
- WhatsApp/Slack notification hooks (ntfy.sh supported now with `-n` flag)
