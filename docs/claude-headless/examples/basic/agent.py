#!/usr/bin/env python3
"""
agent.py - Python wrapper for Claude Code headless mode

Usage:
    from agent import ClaudeAgent

    agent = ClaudeAgent()
    result = agent.run("Explain this code")
    print(result.text)

    # With streaming
    result = agent.run("Build a feature", on_text=print)

    # Multi-turn
    agent.run("Step 1: Analyze")
    agent.run("Step 2: Implement")  # Remembers context
"""

import subprocess
import json
import sys
from pathlib import Path
from typing import Iterator, Optional, Callable, List
from dataclasses import dataclass, field


@dataclass
class AgentResult:
    """Result from a Claude agent run."""

    text: str
    cost_usd: float
    duration_ms: int
    session_id: str
    is_error: bool
    num_turns: int = 0
    raw_output: dict = field(default_factory=dict)


@dataclass
class StreamEvent:
    """Single event from streaming output."""

    type: str  # init, user, assistant, result
    data: dict


class ClaudeAgent:
    """
    Wrapper for Claude Code CLI headless mode.

    Provides:
    - Session management (multi-turn conversations)
    - Streaming output parsing
    - Tool restrictions
    - MCP server configuration

    Example:
        agent = ClaudeAgent(
            session_file=Path("/data/session.id"),
            permission_mode="acceptEdits",
            allowed_tools=["Read", "Write", "Bash"]
        )

        result = agent.run("Refactor the authentication module")
        print(f"Done! Cost: ${result.cost_usd:.4f}")
    """

    def __init__(
        self,
        session_file: Optional[Path] = None,
        mcp_config: Optional[Path] = None,
        permission_mode: str = "default",
        allowed_tools: Optional[List[str]] = None,
        disallowed_tools: Optional[List[str]] = None,
        system_prompt: Optional[str] = None,
        max_turns: Optional[int] = None,
    ):
        """
        Initialize the agent.

        Args:
            session_file: Path to store session ID for multi-turn conversations
            mcp_config: Path to MCP server configuration JSON
            permission_mode: One of: default, acceptEdits, plan, bypassPermissions
            allowed_tools: List of tools to allow (e.g., ["Read", "Write"])
            disallowed_tools: List of tools to deny
            system_prompt: Custom system prompt to append
            max_turns: Maximum agentic turns per run
        """
        self.session_file = session_file or Path("/tmp/claude-agent.session")
        self.mcp_config = mcp_config
        self.permission_mode = permission_mode
        self.allowed_tools = allowed_tools
        self.disallowed_tools = disallowed_tools
        self.system_prompt = system_prompt
        self.max_turns = max_turns

        self._session_id: Optional[str] = None

    @property
    def session_id(self) -> str:
        """Get or create session ID."""
        if self._session_id:
            return self._session_id

        if self.session_file.exists():
            self._session_id = self.session_file.read_text().strip()
        else:
            # Create new session
            result = self._run_once("Initialize agent session")
            self._session_id = result.session_id
            self.session_file.parent.mkdir(parents=True, exist_ok=True)
            self.session_file.write_text(self._session_id)

        return self._session_id

    def reset_session(self) -> str:
        """Create a new session, discarding the old one."""
        if self.session_file.exists():
            self.session_file.unlink()
        self._session_id = None
        return self.session_id

    def _build_command(self, prompt: str, stream: bool = False) -> List[str]:
        """Build the claude CLI command."""
        cmd = [
            "claude",
            "-p",
            "--output-format",
            "stream-json" if stream else "json",
            "--permission-mode",
            self.permission_mode,
            "--resume",
            self.session_id,
        ]

        if self.mcp_config:
            cmd.extend(["--mcp-config", str(self.mcp_config)])

        if self.allowed_tools:
            cmd.extend(["--allowedTools", ",".join(self.allowed_tools)])

        if self.disallowed_tools:
            cmd.extend(["--disallowedTools", ",".join(self.disallowed_tools)])

        if self.system_prompt:
            cmd.extend(["--append-system-prompt", self.system_prompt])

        if self.max_turns:
            cmd.extend(["--max-turns", str(self.max_turns)])

        cmd.append(prompt)
        return cmd

    def _run_once(self, prompt: str) -> AgentResult:
        """Run prompt and return final result (non-streaming)."""
        cmd = self._build_command(prompt, stream=False)
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            raise RuntimeError(f"Claude CLI failed: {result.stderr}")

        data = json.loads(result.stdout)
        return AgentResult(
            text=data.get("result", ""),
            cost_usd=data.get("total_cost_usd", 0),
            duration_ms=data.get("duration_ms", 0),
            session_id=data.get("session_id", ""),
            is_error=data.get("is_error", False),
            num_turns=data.get("num_turns", 0),
            raw_output=data,
        )

    def stream(self, prompt: str) -> Iterator[StreamEvent]:
        """
        Stream events as they happen.

        Yields StreamEvent objects with type and data.
        Types: init, user, assistant, result
        """
        cmd = self._build_command(prompt, stream=True)
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, text=True, bufsize=1)

        for line in proc.stdout:
            line = line.strip()
            if line:
                data = json.loads(line)
                yield StreamEvent(type=data.get("type", "unknown"), data=data)

        proc.wait()
        if proc.returncode != 0:
            raise RuntimeError(f"Claude CLI failed with code {proc.returncode}")

    def run(
        self, prompt: str, on_text: Optional[Callable[[str], None]] = None
    ) -> AgentResult:
        """
        Run a prompt with optional streaming callback.

        Args:
            prompt: The task or question for Claude
            on_text: Optional callback for each text chunk (enables streaming)

        Returns:
            AgentResult with text, cost, duration, etc.
        """
        if on_text is None:
            # Non-streaming mode
            return self._run_once(prompt)

        # Streaming mode with callback
        full_text: List[str] = []
        final_result: Optional[dict] = None

        for event in self.stream(prompt):
            if event.type == "assistant":
                message = event.data.get("message", {})
                for block in message.get("content", []):
                    if block.get("type") == "text":
                        text = block["text"]
                        full_text.append(text)
                        on_text(text)

            elif event.type == "result":
                final_result = event.data

        if final_result is None:
            raise RuntimeError("No result event received")

        return AgentResult(
            text="".join(full_text),
            cost_usd=final_result.get("total_cost_usd", 0),
            duration_ms=final_result.get("duration_ms", 0),
            session_id=final_result.get("session_id", self.session_id),
            is_error=final_result.get("is_error", False),
            num_turns=final_result.get("num_turns", 0),
            raw_output=final_result,
        )


# --- CLI Interface ---
def main():
    """Run agent from command line."""
    import argparse

    parser = argparse.ArgumentParser(description="Claude Code Headless Agent")
    parser.add_argument("prompt", nargs="?", help="Prompt to send")
    parser.add_argument(
        "--session-file", type=Path, default=Path("/tmp/claude-agent.session")
    )
    parser.add_argument("--permission-mode", default="default")
    parser.add_argument("--stream", action="store_true", help="Stream output")
    parser.add_argument("--reset", action="store_true", help="Reset session")

    args = parser.parse_args()

    agent = ClaudeAgent(
        session_file=args.session_file,
        permission_mode=args.permission_mode,
    )

    if args.reset:
        agent.reset_session()
        print(f"New session: {agent.session_id}")
        return

    # Get prompt from arg or stdin
    prompt = args.prompt
    if not prompt:
        prompt = sys.stdin.read().strip()

    if not prompt:
        parser.print_help()
        sys.exit(1)

    if args.stream:
        result = agent.run(prompt, on_text=lambda t: print(t, end="", flush=True))
        print(f"\n\nCost: ${result.cost_usd:.4f} | Duration: {result.duration_ms}ms")
    else:
        result = agent.run(prompt)
        print(result.text)
        print(f"\nCost: ${result.cost_usd:.4f} | Duration: {result.duration_ms}ms", file=sys.stderr)


if __name__ == "__main__":
    main()
