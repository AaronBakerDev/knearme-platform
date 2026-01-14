# Streaming example

Two ways to consume `codex exec --json` output:

1. **Shell handler:**

```bash
./event-handler.sh "Analyze this repo"
```

2. **Python parser:**

```bash
codex exec --json "Analyze this repo" | python3 stream-parser.py
```
