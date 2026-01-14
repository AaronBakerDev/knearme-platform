#!/usr/bin/env python3
"""
python-wrapper.py - Reusable Python wrapper for Claude headless mode

Copy and customize this template for your agent.

Usage:
    agent = ClaudeWrapper()
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
    cost_usd: float
    duration_ms: int
    session_id: str
    is_error: bool


class ClaudeWrapper:
    """Minimal wrapper for claude -p."""

    def __init__(
        self,
        session_file: Path = Path("/tmp/claude.session"),
        permission_mode: str = "default",
        allowed_tools: Optional[List[str]] = None,
    ):
        self.session_file = session_file
        self.permission_mode = permission_mode
        self.allowed_tools = allowed_tools
        self._session_id: Optional[str] = None

    @property
    def session_id(self) -> str:
        if self._session_id:
            return self._session_id
        if self.session_file.exists():
            self._session_id = self.session_file.read_text().strip()
        else:
            result = self._execute("Initialize")
            self._session_id = result.session_id
            self.session_file.parent.mkdir(parents=True, exist_ok=True)
            self.session_file.write_text(self._session_id)
        return self._session_id

    def _execute(self, prompt: str) -> Result:
        cmd = [
            "claude", "-p",
            "--output-format", "json",
            "--permission-mode", self.permission_mode,
        ]
        if self._session_id:
            cmd.extend(["--resume", self._session_id])
        if self.allowed_tools:
            cmd.extend(["--allowedTools", ",".join(self.allowed_tools)])
        cmd.append(prompt)

        proc = subprocess.run(cmd, capture_output=True, text=True)
        data = json.loads(proc.stdout)

        return Result(
            text=data.get("result", ""),
            cost_usd=data.get("total_cost_usd", 0),
            duration_ms=data.get("duration_ms", 0),
            session_id=data.get("session_id", ""),
            is_error=data.get("is_error", False),
        )

    def run(self, prompt: str) -> Result:
        """Run a prompt and return the result."""
        _ = self.session_id  # Ensure session exists
        return self._execute(prompt)

    def reset(self):
        """Reset session."""
        if self.session_file.exists():
            self.session_file.unlink()
        self._session_id = None


# --- Example Usage ---
if __name__ == "__main__":
    import sys

    agent = ClaudeWrapper(
        allowed_tools=["Read", "Glob", "Grep"],  # Read-only agent
    )

    prompt = " ".join(sys.argv[1:]) or "What can you help me with?"
    result = agent.run(prompt)

    print(result.text)
    print(f"\nCost: ${result.cost_usd:.4f}", file=sys.stderr)
