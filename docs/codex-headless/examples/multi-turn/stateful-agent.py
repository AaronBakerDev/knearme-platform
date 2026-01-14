#!/usr/bin/env python3
"""\
stateful-agent.py - Multi-turn stateful Codex agent with history

Demonstrates:
- Session persistence across runs
- Named sessions
- History tracking

Usage:
    python3 stateful-agent.py                 # interactive
    python3 stateful-agent.py "Analyze repo"  # single prompt
    python3 stateful-agent.py --session myproj "Continue"
"""

import subprocess
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field, asdict
import argparse


@dataclass
class Turn:
    timestamp: str
    prompt: str
    response: str
    duration_ms: int = 0


@dataclass
class Session:
    session_id: str
    name: str
    created_at: str
    turns: List[Turn] = field(default_factory=list)

    def add_turn(self, turn: Turn) -> None:
        self.turns.append(turn)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Session":
        turns = [Turn(**t) for t in data.pop("turns", [])]
        return cls(**data, turns=turns)


class StatefulAgent:
    def __init__(self, storage_dir: Optional[Path] = None, sandbox: str = "workspace-write", approval_policy: str = "on-failure"):
        self.storage_dir = storage_dir or Path.home() / ".codex-agent" / "sessions"
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.sandbox = sandbox
        self.approval_policy = approval_policy
        self._current_session: Optional[Session] = None

    def _session_path(self, name: str) -> Path:
        return self.storage_dir / f"{name}.json"

    def _save_session(self, session: Session) -> None:
        self._session_path(session.name).write_text(json.dumps(session.to_dict(), indent=2))

    def _load_session(self, name: str) -> Optional[Session]:
        path = self._session_path(name)
        if path.exists():
            return Session.from_dict(json.loads(path.read_text()))
        return None

    def list_sessions(self) -> List[str]:
        return [p.stem for p in self.storage_dir.glob("*.json")]

    def _base_cmd(self) -> List[str]:
        return ["codex", "-a", self.approval_policy, "-s", self.sandbox, "exec", "--json", "--skip-git-repo-check"]

    def create_session(self, name: str, initial_prompt: str = "Initialize session") -> Session:
        proc = subprocess.run(self._base_cmd() + [initial_prompt], capture_output=True, text=True)
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr)

        events = [json.loads(l) for l in proc.stdout.splitlines() if l.strip()]
        session_id = next((e.get("thread_id") for e in events if e.get("type") == "thread.started"), "")
        session = Session(session_id=session_id, name=name, created_at=datetime.now().isoformat())
        self._save_session(session)
        self._current_session = session
        return session

    def load_or_create_session(self, name: str) -> Session:
        existing = self._load_session(name)
        if existing:
            self._current_session = existing
            return existing
        return self.create_session(name)

    def run(self, prompt: str, session_name: str = "default") -> Turn:
        if self._current_session is None or self._current_session.name != session_name:
            self._current_session = self.load_or_create_session(session_name)

        session = self._current_session
        proc = subprocess.run(
            self._base_cmd() + ["resume", session.session_id, prompt],
            capture_output=True,
            text=True,
        )
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr)

        events = [json.loads(l) for l in proc.stdout.splitlines() if l.strip()]

        response = "".join(
            e.get("item", {}).get("text", "")
            for e in events
            if e.get("type") == "item.completed" and e.get("item", {}).get("type") == "agent_message"
        )

        if not response:
            response = "".join(
                block.get("text", "")
                for e in events
                if e.get("type") == "assistant"
                for block in e.get("message", {}).get("content", [])
                if block.get("type") == "text"
            )

        duration_ms = next(
            (
                e.get("duration_ms")
                for e in events
                if e.get("type") in ("turn.completed", "turn.failed", "final", "result")
            ),
            0,
        )

        turn = Turn(timestamp=datetime.now().isoformat(), prompt=prompt, response=response, duration_ms=duration_ms)
        session.add_turn(turn)
        self._save_session(session)
        return turn

    def get_history(self, name: str = "default") -> List[Turn]:
        session = self._load_session(name)
        return session.turns if session else []

    def get_stats(self, name: str = "default") -> Dict[str, Any]:
        session = self._load_session(name)
        if not session:
            return {"error": "Session not found"}
        return {
            "name": session.name,
            "thread_id": session.session_id,
            "created_at": session.created_at,
            "turn_count": len(session.turns),
        }


def interactive_mode(agent: StatefulAgent, session_name: str) -> None:
    print(f"Codex Agent — session: {session_name}")
    print("Type 'exit' to quit, 'stats' or 'history' for info")
    print("-" * 50)

    while True:
        try:
            prompt = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if prompt.lower() == "exit":
            break
        if prompt.lower() == "stats":
            print(json.dumps(agent.get_stats(session_name), indent=2))
            continue
        if prompt.lower() == "history":
            for i, turn in enumerate(agent.get_history(session_name), 1):
                print(f"\n[{i}] You: {turn.prompt}")
                print(f"    Codex: {turn.response[:200]}...")
            continue

        turn = agent.run(prompt, session_name)
        print(f"\nCodex: {turn.response}")
        print(f"[Duration: {turn.duration_ms}ms]", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description="Stateful Codex Agent")
    parser.add_argument("prompt", nargs="?", help="Prompt to run")
    parser.add_argument("--session", "-s", default="default")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--stats", action="store_true")
    parser.add_argument("--history", action="store_true")
    parser.add_argument("--sandbox", default="workspace-write")
    parser.add_argument("--approval-policy", default="on-failure")

    args = parser.parse_args()

    agent = StatefulAgent(sandbox=args.sandbox, approval_policy=args.approval_policy)

    if args.list:
        for name in agent.list_sessions():
            stats = agent.get_stats(name)
            print(f"{name}: {stats['turn_count']} turns")
        return
    if args.stats:
        print(json.dumps(agent.get_stats(args.session), indent=2))
        return
    if args.history:
        for turn in agent.get_history(args.session):
            print(f"[{turn.timestamp}] {turn.prompt}\n{turn.response}\n")
        return

    if args.prompt:
        turn = agent.run(args.prompt, args.session)
        print(turn.response)
    else:
        interactive_mode(agent, args.session)


if __name__ == "__main__":
    main()
