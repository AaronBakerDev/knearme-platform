#!/usr/bin/env python3
"""
python-wrapper.py - Reusable Python wrapper for Codex headless mode

Copy and customize this template for your agent.

Usage:
    agent = CodexWrapper()
    result = agent.run("Your task")
    print(result.text)
"""

import subprocess
import json
from pathlib import Path
from typing import Optional, List
from dataclasses import dataclass


@dataclass
class Result:
    text: str
    duration_ms: int
    thread_id: str
    is_error: bool


class CodexWrapper:
    """Minimal wrapper for `codex exec`."""

    def __init__(
        self,
        session_file: Path = Path("/tmp/codex.session"),
        sandbox: str = "workspace-write",
        approval_policy: str = "on-request",
        extra_config: Optional[List[str]] = None,
    ):
        self.session_file = session_file
        self.sandbox = sandbox
        self.approval_policy = approval_policy
        self.extra_config = extra_config or []
        self._thread_id: Optional[str] = None

    @property
    def thread_id(self) -> str:
        if self._thread_id:
            return self._thread_id
        if self.session_file.exists():
            self._thread_id = self.session_file.read_text().strip()
        else:
            result = self._execute("Initialize")
            self._thread_id = result.thread_id
            self.session_file.parent.mkdir(parents=True, exist_ok=True)
            self.session_file.write_text(self._thread_id)
        return self._thread_id

    def _base_cmd(self) -> List[str]:
        cmd = [
            "codex",
            "-a",
            self.approval_policy,
            "-s",
            self.sandbox,
        ]
        for c in self.extra_config:
            cmd.extend(["-c", c])
        return cmd

    def _execute(self, prompt: str) -> Result:
        cmd = self._base_cmd() + ["exec", "--json", "--skip-git-repo-check"]

        if self._thread_id:
            cmd += ["resume", self._thread_id, prompt]
        else:
            cmd.append(prompt)

        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or "codex exec failed")

        events = [json.loads(l) for l in proc.stdout.splitlines() if l.strip()]
        thread = next((e for e in events if e.get("type") == "thread.started"), {})
        turn_done = next(
            (e for e in reversed(events) if e.get("type") in ("turn.completed", "turn.failed")),
            {},
        )

        assistant_text = "".join(
            e.get("item", {}).get("text", "")
            for e in events
            if e.get("type") == "item.completed" and e.get("item", {}).get("type") == "agent_message"
        )

        # Fallback for future event formats
        if not assistant_text:
            assistant_text = "".join(
                block.get("text", "")
                for e in events
                if e.get("type") == "assistant"
                for block in e.get("message", {}).get("content", [])
                if block.get("type") == "text"
            )

        return Result(
            text=assistant_text.strip() or turn_done.get("message", ""),
            duration_ms=turn_done.get("duration_ms", 0),
            thread_id=thread.get("thread_id", self._thread_id or ""),
            is_error=turn_done.get("type") == "turn.failed" or bool(turn_done.get("error")),
        )

    def run(self, prompt: str) -> Result:
        _ = self.thread_id
        return self._execute(prompt)

    def reset(self):
        if self.session_file.exists():
            self.session_file.unlink()
        self._thread_id = None


if __name__ == "__main__":
    import sys

    agent = CodexWrapper(sandbox="read-only", approval_policy="never")
    prompt = " ".join(sys.argv[1:]) or "What can you help me with?"
    result = agent.run(prompt)
    print(result.text)
