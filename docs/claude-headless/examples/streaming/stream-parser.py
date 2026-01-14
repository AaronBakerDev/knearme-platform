#!/usr/bin/env python3
"""
stream-parser.py - Real-time JSONL stream parser for Claude Code headless mode

Parses stream-json output and provides:
- Real-time text output
- Tool use notifications
- Progress tracking
- Cost accumulation
- Event callbacks for custom handling

Usage:
    # Pipe from claude
    claude -p "Build a feature" --output-format stream-json | python stream-parser.py

    # As a library
    from stream_parser import StreamParser, Event

    parser = StreamParser()
    for event in parser.parse_stream(process.stdout):
        if event.type == "text":
            print(event.data, end="")
"""

import sys
import json
from typing import Iterator, Callable, Optional, Any, List
from dataclasses import dataclass, field
from enum import Enum


class EventType(Enum):
    """Types of events emitted by the parser."""

    INIT = "init"
    TEXT = "text"
    TOOL_USE = "tool_use"
    TOOL_RESULT = "tool_result"
    THINKING = "thinking"
    RESULT = "result"
    ERROR = "error"


@dataclass
class Event:
    """Parsed event from stream."""

    type: EventType
    data: Any
    raw: dict = field(default_factory=dict)


@dataclass
class StreamStats:
    """Statistics accumulated during stream parsing."""

    text_chunks: int = 0
    tool_uses: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    duration_ms: int = 0
    session_id: str = ""
    is_error: bool = False


class StreamParser:
    """
    Parses Claude Code stream-json output into structured events.

    Example:
        parser = StreamParser()

        # With callbacks
        parser.on_text = lambda text: print(text, end="")
        parser.on_tool_use = lambda tool, input: print(f"[{tool}]")

        for event in parser.parse_stream(sys.stdin):
            pass  # Callbacks handle output

        print(f"Cost: ${parser.stats.cost_usd}")
    """

    def __init__(self):
        self.stats = StreamStats()

        # Callbacks
        self.on_text: Optional[Callable[[str], None]] = None
        self.on_tool_use: Optional[Callable[[str, dict], None]] = None
        self.on_tool_result: Optional[Callable[[str, Any], None]] = None
        self.on_thinking: Optional[Callable[[str], None]] = None
        self.on_error: Optional[Callable[[str], None]] = None

    def parse_line(self, line: str) -> Optional[Event]:
        """Parse a single JSONL line into an Event."""
        line = line.strip()
        if not line:
            return None

        try:
            data = json.loads(line)
        except json.JSONDecodeError as e:
            return Event(type=EventType.ERROR, data=f"JSON parse error: {e}", raw={})

        msg_type = data.get("type", "")

        if msg_type == "init":
            self.stats.session_id = data.get("session_id", "")
            return Event(type=EventType.INIT, data=data, raw=data)

        elif msg_type == "assistant":
            events = []
            message = data.get("message", {})

            for block in message.get("content", []):
                block_type = block.get("type", "")

                if block_type == "text":
                    text = block.get("text", "")
                    if text:
                        self.stats.text_chunks += 1
                        if self.on_text:
                            self.on_text(text)
                        return Event(type=EventType.TEXT, data=text, raw=data)

                elif block_type == "tool_use":
                    tool_name = block.get("name", "unknown")
                    tool_input = block.get("input", {})
                    self.stats.tool_uses += 1
                    if self.on_tool_use:
                        self.on_tool_use(tool_name, tool_input)
                    return Event(
                        type=EventType.TOOL_USE,
                        data={"name": tool_name, "input": tool_input},
                        raw=data,
                    )

                elif block_type == "tool_result":
                    tool_name = block.get("name", "unknown")
                    result = block.get("content", "")
                    if self.on_tool_result:
                        self.on_tool_result(tool_name, result)
                    return Event(
                        type=EventType.TOOL_RESULT,
                        data={"name": tool_name, "result": result},
                        raw=data,
                    )

                elif block_type == "thinking":
                    thinking = block.get("thinking", "")
                    if thinking and self.on_thinking:
                        self.on_thinking(thinking)
                    return Event(type=EventType.THINKING, data=thinking, raw=data)

        elif msg_type == "result":
            self.stats.cost_usd = data.get("total_cost_usd", 0)
            self.stats.duration_ms = data.get("duration_ms", 0)
            self.stats.is_error = data.get("is_error", False)

            usage = data.get("usage", {})
            self.stats.total_tokens = (
                usage.get("input_tokens", 0) + usage.get("output_tokens", 0)
            )

            if self.stats.is_error and self.on_error:
                self.on_error(data.get("result", "Unknown error"))

            return Event(type=EventType.RESULT, data=data, raw=data)

        return None

    def parse_stream(self, stream) -> Iterator[Event]:
        """
        Parse a stream of JSONL lines.

        Args:
            stream: File-like object (e.g., sys.stdin, process.stdout)

        Yields:
            Event objects for each parsed line
        """
        for line in stream:
            event = self.parse_line(line)
            if event:
                yield event


def format_tool_use(name: str, input_data: dict) -> str:
    """Format tool use for display."""
    if name == "Read":
        return f"[Reading: {input_data.get('file_path', '?')}]"
    elif name == "Write":
        return f"[Writing: {input_data.get('file_path', '?')}]"
    elif name == "Edit":
        return f"[Editing: {input_data.get('file_path', '?')}]"
    elif name == "Bash":
        cmd = input_data.get("command", "")
        return f"[Running: {cmd[:50]}{'...' if len(cmd) > 50 else ''}]"
    elif name == "Glob":
        return f"[Searching: {input_data.get('pattern', '?')}]"
    elif name == "Grep":
        return f"[Grep: {input_data.get('pattern', '?')}]"
    elif name.startswith("mcp__"):
        return f"[MCP: {name}]"
    else:
        return f"[Tool: {name}]"


def main():
    """CLI interface for stream parsing."""
    import argparse

    parser_arg = argparse.ArgumentParser(
        description="Parse Claude Code stream-json output"
    )
    parser_arg.add_argument(
        "--show-tools", action="store_true", help="Show tool use notifications"
    )
    parser_arg.add_argument(
        "--show-thinking", action="store_true", help="Show thinking blocks"
    )
    parser_arg.add_argument("--quiet", "-q", action="store_true", help="Only show final result")
    parser_arg.add_argument("--json", action="store_true", help="Output events as JSON")

    args = parser_arg.parse_args()

    parser = StreamParser()

    collected_text: List[str] = []

    if args.json:
        # JSON output mode
        for event in parser.parse_stream(sys.stdin):
            output = {"type": event.type.value, "data": event.data}
            print(json.dumps(output))
    elif args.quiet:
        # Quiet mode - collect and print at end
        for event in parser.parse_stream(sys.stdin):
            if event.type == EventType.TEXT:
                collected_text.append(event.data)

        print("".join(collected_text))
    else:
        # Interactive mode with callbacks
        def on_text(text: str):
            print(text, end="", flush=True)

        def on_tool_use(name: str, input_data: dict):
            if args.show_tools:
                print(f"\n{format_tool_use(name, input_data)}", file=sys.stderr)

        def on_thinking(text: str):
            if args.show_thinking:
                print(f"\n[Thinking: {text[:100]}...]", file=sys.stderr)

        parser.on_text = on_text
        parser.on_tool_use = on_tool_use
        parser.on_thinking = on_thinking

        for event in parser.parse_stream(sys.stdin):
            pass

        # Print stats
        print("\n", file=sys.stderr)
        print(f"Cost: ${parser.stats.cost_usd:.4f}", file=sys.stderr)
        print(f"Duration: {parser.stats.duration_ms}ms", file=sys.stderr)
        if parser.stats.tool_uses > 0:
            print(f"Tools used: {parser.stats.tool_uses}", file=sys.stderr)


if __name__ == "__main__":
    main()
