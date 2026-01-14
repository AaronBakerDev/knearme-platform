# CLI Reference: Codex CLI Headless Mode

Complete reference for running Codex non‑interactively.

> Headless runs use `codex exec`. Global safety flags like `-a/--ask-for-approval` must appear **before** `exec`.

## Basic Syntax

```bash
codex exec "prompt" [options]
codex exec [options] "prompt"
echo "prompt" | codex exec - [options]
```

### Resuming Sessions

```bash
codex exec resume THREAD_ID "prompt"
codex exec resume --last "prompt"     # resume most recent
```

## Global Flags (before `exec`)

These flags apply to interactive and headless modes.

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `-a, --ask-for-approval` | `untrusted`, `on-failure`, `on-request`, `never` | `on-failure` | When to require human approval for model‑generated commands |
| `-s, --sandbox` | `read-only`, `workspace-write`, `danger-full-access` | `workspace-write` | Default sandbox policy for tools |
| `-m, --model` | e.g. `o3`, `gpt-4.1`, `o4-mini` | config default | Override model |
| `-c, --config key=value` | repeatable | — | Override `config.toml` settings |
| `-p, --profile name` | — | — | Select config profile |
| `-C, --cd DIR` | — | cwd | Set working root |
| `--search` | — | off | Enable web search tool |

Example:

```bash
codex -a on-request -s read-only exec "Analyze this repo" --skip-git-repo-check
```

## `codex exec` Flags

### Output Control

| Flag | Default | Description |
|------|---------|-------------|
| `--json` | off | Stream all events as JSONL to stdout |
| `--output-last-message FILE` | — | Write final assistant message to file |
| `--output-schema FILE` | — | Enforce final output to match JSON Schema |
| `--color always|never|auto` | `auto` | Color behavior |

### Workspace Control

| Flag | Default | Description |
|------|---------|-------------|
| `--skip-git-repo-check` | off | Allow running outside a git repo |
| `--add-dir DIR` | — | Add an additional writable directory |

### Sandbox Control (per call)

`codex exec` also accepts `--sandbox` to override the global default.

```bash
codex exec "Read only task" --sandbox read-only
```

### Model Selection

| Flag | Description |
|------|-------------|
| `-m, --model MODEL` | Override model just for this exec |
| `--oss` / `--local-provider` | Use a local OSS model provider |

## Output Modes

### Plain Text (default)

```bash
$ codex exec "What is 2+2?" --skip-git-repo-check
2 + 2 = 4.
```

### JSONL Stream (`--json`)

```bash
$ codex exec --json "Analyze code" --skip-git-repo-check
```

Example stream (truncated):

```jsonl
{"type":"thread.started","thread_id":"..."}
{"type":"turn.started"}
{"type":"item.completed","item":{"type":"agent_message","text":"I'll analyze..."}}
{"type":"item.completed","item":{"type":"command_execution","command":"bash -lc 'ls'"}}
{"type":"turn.completed","usage":{"input_tokens":123,"output_tokens":456}}
```

**Notes:**

- Events are not a fixed schema beyond having `type`.
- To stream events on a resume, place `--json` before the `resume` subcommand:

  ```bash
  codex exec --json resume "$THREAD_ID" "Next step"
  ```

- The interactive `codex resume` command does not support JSON streaming.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | API key for headless usage (optional if logged in via OAuth) |
| `CODEX_CONFIG` | Override config file path |
| `CODEX_HOME` | Override Codex home dir (sessions, cache) |
