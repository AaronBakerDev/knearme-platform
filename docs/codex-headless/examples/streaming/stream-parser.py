#!/usr/bin/env python3
"""stream-parser.py - Real-time JSONL stream parser for Codex headless mode.

Consumes `codex exec --json` output and emits useful callbacks.

Usage:
  codex exec --json "Task" | python3 stream-parser.py
"""

import sys
import json
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Iterator, Optional, List


class EventType(Enum):
    THREAD_STARTED = "thread.started"
    ITEM_COMPLETED = "item.completed"
    TURN_COMPLETED = "turn.completed"
    TURN_FAILED = "turn.failed"
    ERROR = "error"


@dataclass
class Event:
    type: EventType
    data: Any
    raw: dict = field(default_factory=dict)


@dataclass
class Stats:
    text_chunks: int = 0
    tool_uses: int = 0
    total_tokens: int = 0
    duration_ms: int = 0
    thread_id: str = ""
    is_error: bool = False


class StreamParser:
    def __init__(self):
        self.stats = Stats()
        self.on_text: Optional[Callable[[str], None]] = None
        self.on_tool: Optional[Callable[[str], None]] = None
        self.on_error: Optional[Callable[[str], None]] = None

    def parse_line(self, line: str) -> Optional[Event]:
        line = line.strip()
        if not line:
            return None
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            return None

        msg_type = data.get("type", "")

        if msg_type == "thread.started":
            self.stats.thread_id = data.get("thread_id", "")
            return Event(EventType.THREAD_STARTED, data, data)

        if msg_type == "item.completed":
            item = data.get("item", {})
            item_type = item.get("type")
            if item_type == "agent_message":
                text = item.get("text", "")
                if text:
                    self.stats.text_chunks += 1
                    if self.on_text:
                        self.on_text(text)
            elif item_type in ("tool_call", "command_execution"):
                name = item.get("tool") or item.get("command") or "tool"
                self.stats.tool_uses += 1
                if self.on_tool:
                    self.on_tool(str(name))
            return Event(EventType.ITEM_COMPLETED, data, data)

        if msg_type in ("turn.completed", "turn.failed"):
            self.stats.duration_ms = data.get("duration_ms", 0)
            usage = data.get("usage", {})
            self.stats.total_tokens = usage.get("input_tokens", 0) + usage.get("output_tokens", 0)
            self.stats.is_error = msg_type == "turn.failed"
            if self.stats.is_error and self.on_error:
                self.on_error(str(data.get("error", {}).get("message") or "Unknown error"))
            etype = EventType.TURN_FAILED if msg_type == "turn.failed" else EventType.TURN_COMPLETED
            return Event(etype, data, data)

        if msg_type == "error":
            if self.on_error:
                self.on_error(str(data.get("message") or "Error"))
            return Event(EventType.ERROR, data, data)

        return None

    def parse_stream(self, stream) -> Iterator[Event]:
        for line in stream:
            event = self.parse_line(line)
            if event:
                yield event


def main() -> None:
    import argparse

    parser_arg = argparse.ArgumentParser(description="Parse Codex --json stream")
    parser_arg.add_argument("--show-tools", action="store_true")
    parser_arg.add_argument("--quiet", action="store_true")
    args = parser_arg.parse_args()

    parser = StreamParser()
    collected: List[str] = []

    def on_text(text: str):
        if args.quiet:
            collected.append(text)
        else:
            print(text, end="", flush=True)

    def on_tool(name: str):
        if args.show_tools and not args.quiet:
            print(f"\n[Tool: {name}]", file=sys.stderr)

    parser.on_text = on_text
    parser.on_tool = on_tool

    for _ in parser.parse_stream(sys.stdin):
        pass

    if args.quiet:
        print("".join(collected))

    print("\n", file=sys.stderr)
    print(f"Duration: {parser.stats.duration_ms}ms", file=sys.stderr)
    if parser.stats.tool_uses:
        print(f"Tools used: {parser.stats.tool_uses}", file=sys.stderr)


if __name__ == "__main__":
    main()
