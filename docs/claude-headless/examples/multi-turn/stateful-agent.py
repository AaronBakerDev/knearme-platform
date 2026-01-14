#!/usr/bin/env python3
"""
stateful-agent.py - Multi-turn stateful agent with conversation history

Demonstrates:
- Session persistence across runs
- Conversation branching (fork)
- History tracking with costs
- Multiple concurrent sessions

Usage:
    # Interactive mode
    python stateful-agent.py

    # Single command
    python stateful-agent.py "Analyze this codebase"

    # With specific session
    python stateful-agent.py --session myproject "Continue analysis"
"""

import subprocess
import json
import sys
import os
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field, asdict
import argparse


@dataclass
class Turn:
    """Single turn in a conversation."""

    timestamp: str
    prompt: str
    response: str
    cost_usd: float
    duration_ms: int


@dataclass
class Session:
    """Conversation session with history."""

    session_id: str
    name: str
    created_at: str
    turns: List[Turn] = field(default_factory=list)
    total_cost_usd: float = 0.0
    parent_session_id: Optional[str] = None  # For forked sessions

    def add_turn(self, turn: Turn):
        self.turns.append(turn)
        self.total_cost_usd += turn.cost_usd

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Session":
        turns = [Turn(**t) for t in data.pop("turns", [])]
        return cls(**data, turns=turns)


class StatefulAgent:
    """
    Multi-turn agent with session management and history.

    Features:
    - Named sessions for different projects/tasks
    - Full conversation history with costs
    - Session forking for experimentation
    - Persistent storage
    """

    def __init__(self, storage_dir: Optional[Path] = None):
        self.storage_dir = storage_dir or Path.home() / ".claude-agent" / "sessions"
        self.storage_dir.mkdir(parents=True, exist_ok=True)

        self._current_session: Optional[Session] = None

    def _session_path(self, name: str) -> Path:
        """Get path to session file."""
        return self.storage_dir / f"{name}.json"

    def _save_session(self, session: Session):
        """Persist session to disk."""
        path = self._session_path(session.name)
        with open(path, "w") as f:
            json.dump(session.to_dict(), f, indent=2)

    def _load_session(self, name: str) -> Optional[Session]:
        """Load session from disk."""
        path = self._session_path(name)
        if path.exists():
            with open(path) as f:
                return Session.from_dict(json.load(f))
        return None

    def list_sessions(self) -> List[str]:
        """List all available session names."""
        return [p.stem for p in self.storage_dir.glob("*.json")]

    def create_session(self, name: str, initial_prompt: str = "Initialize session") -> Session:
        """Create a new named session."""
        # Run initial prompt to get session ID
        result = subprocess.run(
            ["claude", "-p", initial_prompt, "--output-format", "json"],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            raise RuntimeError(f"Failed to create session: {result.stderr}")

        data = json.loads(result.stdout)

        session = Session(
            session_id=data["session_id"],
            name=name,
            created_at=datetime.now().isoformat(),
        )

        turn = Turn(
            timestamp=datetime.now().isoformat(),
            prompt=initial_prompt,
            response=data.get("result", ""),
            cost_usd=data.get("total_cost_usd", 0),
            duration_ms=data.get("duration_ms", 0),
        )
        session.add_turn(turn)

        self._save_session(session)
        self._current_session = session

        return session

    def load_or_create_session(self, name: str) -> Session:
        """Load existing session or create new one."""
        session = self._load_session(name)
        if session:
            self._current_session = session
            return session
        return self.create_session(name)

    def run(
        self,
        prompt: str,
        session_name: Optional[str] = None,
        permission_mode: str = "default",
    ) -> Turn:
        """
        Run a prompt in a session.

        Args:
            prompt: The task or question
            session_name: Session to use (default: "default")
            permission_mode: Permission mode for tools

        Returns:
            The Turn object with response and metadata
        """
        name = session_name or "default"

        if self._current_session is None or self._current_session.name != name:
            self._current_session = self.load_or_create_session(name)

        session = self._current_session

        # Run prompt with session resumption
        result = subprocess.run(
            [
                "claude",
                "-p",
                "--resume",
                session.session_id,
                "--output-format",
                "json",
                "--permission-mode",
                permission_mode,
                prompt,
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            raise RuntimeError(f"Claude failed: {result.stderr}")

        data = json.loads(result.stdout)

        turn = Turn(
            timestamp=datetime.now().isoformat(),
            prompt=prompt,
            response=data.get("result", ""),
            cost_usd=data.get("total_cost_usd", 0),
            duration_ms=data.get("duration_ms", 0),
        )

        session.add_turn(turn)
        self._save_session(session)

        return turn

    def fork_session(self, new_name: str, prompt: str) -> Session:
        """
        Fork current session into a new branch.

        Creates a new session that continues from the current point
        but with a separate history going forward.
        """
        if self._current_session is None:
            raise RuntimeError("No current session to fork")

        parent = self._current_session

        # Run with --fork-session to get new session ID
        result = subprocess.run(
            [
                "claude",
                "-p",
                "--resume",
                parent.session_id,
                "--fork-session",
                "--output-format",
                "json",
                prompt,
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            raise RuntimeError(f"Failed to fork: {result.stderr}")

        data = json.loads(result.stdout)

        # Create new session with parent reference
        forked = Session(
            session_id=data["session_id"],
            name=new_name,
            created_at=datetime.now().isoformat(),
            parent_session_id=parent.session_id,
        )

        turn = Turn(
            timestamp=datetime.now().isoformat(),
            prompt=f"[FORK from {parent.name}] {prompt}",
            response=data.get("result", ""),
            cost_usd=data.get("total_cost_usd", 0),
            duration_ms=data.get("duration_ms", 0),
        )
        forked.add_turn(turn)

        self._save_session(forked)
        self._current_session = forked

        return forked

    def get_history(self, session_name: Optional[str] = None) -> List[Turn]:
        """Get conversation history for a session."""
        name = session_name or "default"
        session = self._load_session(name)
        return session.turns if session else []

    def get_stats(self, session_name: Optional[str] = None) -> Dict[str, Any]:
        """Get statistics for a session."""
        name = session_name or "default"
        session = self._load_session(name)

        if not session:
            return {"error": "Session not found"}

        return {
            "name": session.name,
            "session_id": session.session_id,
            "created_at": session.created_at,
            "turn_count": len(session.turns),
            "total_cost_usd": session.total_cost_usd,
            "parent": session.parent_session_id,
        }


def interactive_mode(agent: StatefulAgent, session_name: str):
    """Run agent in interactive REPL mode."""
    print(f"Claude Agent - Session: {session_name}")
    print("Type 'exit' to quit, 'stats' for session stats, 'history' for conversation history")
    print("-" * 50)

    while True:
        try:
            prompt = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not prompt:
            continue

        if prompt.lower() == "exit":
            break

        if prompt.lower() == "stats":
            stats = agent.get_stats(session_name)
            print(f"\nSession: {stats['name']}")
            print(f"Turns: {stats['turn_count']}")
            print(f"Total Cost: ${stats['total_cost_usd']:.4f}")
            continue

        if prompt.lower() == "history":
            for i, turn in enumerate(agent.get_history(session_name), 1):
                print(f"\n[{i}] You: {turn.prompt[:100]}...")
                print(f"    Claude: {turn.response[:200]}...")
                print(f"    Cost: ${turn.cost_usd:.4f}")
            continue

        try:
            turn = agent.run(prompt, session_name)
            print(f"\nClaude: {turn.response}")
            print(f"\n[Cost: ${turn.cost_usd:.4f} | Duration: {turn.duration_ms}ms]")
        except Exception as e:
            print(f"\nError: {e}")


def main():
    parser = argparse.ArgumentParser(description="Stateful Claude Agent")
    parser.add_argument("prompt", nargs="?", help="Prompt to run (omit for interactive mode)")
    parser.add_argument("--session", "-s", default="default", help="Session name")
    parser.add_argument("--list", "-l", action="store_true", help="List all sessions")
    parser.add_argument("--stats", action="store_true", help="Show session stats")
    parser.add_argument("--history", action="store_true", help="Show conversation history")
    parser.add_argument("--fork", metavar="NAME", help="Fork current session to new name")
    parser.add_argument(
        "--permission-mode",
        default="default",
        choices=["default", "acceptEdits", "plan", "bypassPermissions"],
    )

    args = parser.parse_args()

    agent = StatefulAgent()

    if args.list:
        sessions = agent.list_sessions()
        if sessions:
            print("Available sessions:")
            for name in sessions:
                stats = agent.get_stats(name)
                print(f"  {name}: {stats['turn_count']} turns, ${stats['total_cost_usd']:.4f}")
        else:
            print("No sessions found")
        return

    if args.stats:
        stats = agent.get_stats(args.session)
        print(json.dumps(stats, indent=2))
        return

    if args.history:
        for turn in agent.get_history(args.session):
            print(f"\n[{turn.timestamp}]")
            print(f"You: {turn.prompt}")
            print(f"Claude: {turn.response}")
            print(f"Cost: ${turn.cost_usd:.4f}")
        return

    if args.fork:
        if not args.prompt:
            print("Fork requires a prompt")
            sys.exit(1)
        agent.load_or_create_session(args.session)
        forked = agent.fork_session(args.fork, args.prompt)
        print(f"Forked to: {forked.name} ({forked.session_id})")
        return

    if args.prompt:
        # Single command mode
        turn = agent.run(args.prompt, args.session, args.permission_mode)
        print(turn.response)
        print(f"\n[Cost: ${turn.cost_usd:.4f}]", file=sys.stderr)
    else:
        # Interactive mode
        interactive_mode(agent, args.session)


if __name__ == "__main__":
    main()
