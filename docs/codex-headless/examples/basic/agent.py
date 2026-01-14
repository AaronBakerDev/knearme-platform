#!/usr/bin/env python3
"""\
agent.py - Python wrapper for Codex CLI headless mode

Usage:
    from agent import CodexAgent

    agent = CodexAgent()
    result = agent.run("Explain this code")
    print(result.text)

    # With streaming
    agent.run("Build a feature", on_text=lambda t: print(t, end="", flush=True))

    # Multi-turn
    agent.run("Step 1: Analyze")
    agent.run("Step 2: Implement")  # Remembers context
"""

import subprocess
import json
import sys
from pathlib import Path
from typing import Iterator, Optional, Callable, List, Any
from dataclasses import dataclass, field


@dataclass
class AgentResult:
    """Result from a Codex agent run."""

    text: str
    duration_ms: int
    thread_id: str
    is_error: bool
    raw_events: List[dict] = field(default_factory=list)


@dataclass
class StreamEvent:
    type: str  # thread.started, item.completed, turn.completed, ...
    data: dict


class CodexAgent:
    """Headless wrapper around `codex exec`."""

    def __init__(
        self,
        session_file: Optional[Path] = None,
        sandbox: str = "workspace-write",
        approval_policy: str = "on-failure",
        skip_git_repo_check: bool = True,
        extra_config: Optional[List[str]] = None,
    ):
        self.session_file = session_file or Path("/tmp/codex-agent.session")
        self.sandbox = sandbox
        self.approval_policy = approval_policy
        self.skip_git_repo_check = skip_git_repo_check
        self.extra_config = extra_config or []
        self._thread_id: Optional[str] = None

    @property
    def thread_id(self) -> str:
        if self._thread_id:
            return self._thread_id
        if self.session_file.exists():
            self._thread_id = self.session_file.read_text().strip()
        else:
            result = self._run_json("Initialize agent session")
            self._thread_id = result.thread_id
            self.session_file.parent.mkdir(parents=True, exist_ok=True)
            self.session_file.write_text(self._thread_id)
        return self._thread_id

    def _base_cmd(self) -> List[str]:
        cmd = ["codex", "-a", self.approval_policy, "-s", self.sandbox]
        for c in self.extra_config:
            cmd += ["-c", c]
        return cmd

    def _exec_cmd(self, json_stream: bool, prompt: str, resume: bool) -> List[str]:
        cmd = self._base_cmd() + ["exec"]
        if json_stream:
            cmd.append("--json")
        if self.skip_git_repo_check:
            cmd.append("--skip-git-repo-check")
        if resume:
            cmd += ["resume", self.thread_id, prompt]
        else:
            cmd.append(prompt)
        return cmd

    def stream(self, prompt: str) -> Iterator[StreamEvent]:
        """Yield JSONL events from a run."""
        cmd = self._exec_cmd(json_stream=True, prompt=prompt, resume=True)
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, text=True, bufsize=1)
        assert proc.stdout is not None

        for line in proc.stdout:
            line = line.strip()
            if not line:
                continue
            data = json.loads(line)
            yield StreamEvent(type=data.get("type", "unknown"), data=data)

        proc.wait()
        if proc.returncode != 0:
            raise RuntimeError(f"codex exec failed with {proc.returncode}")

    def _run_json(self, prompt: str, resume: bool = False) -> AgentResult:
        cmd = self._exec_cmd(json_stream=True, prompt=prompt, resume=resume)
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or "codex exec failed")

        events = [json.loads(l) for l in proc.stdout.splitlines() if l.strip()]

        thread = next((e for e in events if e.get("type") == "thread.started"), {})
        final = next(
            (e for e in reversed(events) if e.get("type") in ("turn.completed", "turn.failed", "final", "result")),
            {},
        )

        # Prefer modern Codex event surface (item.completed agent_message)
        text = "".join(
            e.get("item", {}).get("text", "")
            for e in events
            if e.get("type") == "item.completed" and e.get("item", {}).get("type") == "agent_message"
        )

        # Fallback for older/alternate surfaces
        if not text:
            text = "".join(
                block.get("text", "")
                for e in events
                if e.get("type") == "assistant"
                for block in e.get("message", {}).get("content", [])
                if block.get("type") == "text"
            ) or final.get("message", "")

        # Persist thread id for future resumes
        if not self._thread_id and thread.get("thread_id"):
            self._thread_id = thread["thread_id"]

        return AgentResult(
            text=text,
            duration_ms=final.get("duration_ms", 0),
            thread_id=thread.get("thread_id", self._thread_id or ""),
            is_error=final.get("type") == "turn.failed" or bool(final.get("error")) or final.get("is_error", False),
            raw_events=events,
        )

    def run(
        self, prompt: str, on_text: Optional[Callable[[str], None]] = None
    ) -> AgentResult:
        """Run a prompt; if on_text is provided, stream text chunks."""
        _ = self.thread_id

        if on_text is None:
            return self._run_json(prompt, resume=True)

        collected: List[str] = []
        final_event: Optional[dict] = None
        thread_event: Optional[dict] = None

        for event in self.stream(prompt):
            if event.type == "thread.started":
                thread_event = event.data
                if thread_event.get("thread_id") and not self._thread_id:
                    self._thread_id = thread_event["thread_id"]

            if event.type == "item.completed":
                item = event.data.get("item", {})
                if item.get("type") == "agent_message":
                    text = item.get("text", "")
                    if text:
                        collected.append(text)
                        on_text(text)
            elif event.type == "assistant":
                for block in event.data.get("message", {}).get("content", []):
                    if block.get("type") == "text":
                        text = block.get("text", "")
                        if text:
                            collected.append(text)
                            on_text(text)
            elif event.type in ("turn.completed", "turn.failed", "final", "result"):
                final_event = event.data

        return AgentResult(
            text="".join(collected),
            duration_ms=(final_event or {}).get("duration_ms", 0),
            thread_id=(thread_event or {}).get("thread_id", self._thread_id or ""),
            is_error=(final_event or {}).get("type") == "turn.failed" or bool((final_event or {}).get("error")) or (final_event or {}).get("is_error", False),
            raw_events=[],
        )

    def reset_session(self) -> str:
        if self.session_file.exists():
            self.session_file.unlink()
        self._thread_id = None
        return self.thread_id


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Codex Headless Agent")
    parser.add_argument("prompt", nargs="?", help="Prompt to send")
    parser.add_argument("--session-file", type=Path, default=Path("/tmp/codex-agent.session"))
    parser.add_argument("--sandbox", default="workspace-write")
    parser.add_argument("--approval-policy", default="on-failure")
    parser.add_argument("--stream", action="store_true")
    parser.add_argument("--reset", action="store_true")

    args = parser.parse_args()

    agent = CodexAgent(
        session_file=args.session_file,
        sandbox=args.sandbox,
        approval_policy=args.approval_policy,
    )

    if args.reset:
        agent.reset_session()
        print(f"New thread: {agent.thread_id}")
        return

    prompt = args.prompt or sys.stdin.read().strip()
    if not prompt:
        parser.print_help()
        sys.exit(1)

    if args.stream:
        result = agent.run(prompt, on_text=lambda t: print(t, end="", flush=True))
        print(f"\n\nDuration: {result.duration_ms}ms", file=sys.stderr)
    else:
        result = agent.run(prompt)
        print(result.text)


if __name__ == "__main__":
    main()
