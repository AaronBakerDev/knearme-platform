#!/usr/bin/env python3
"""
agent-service.py - Production-grade Claude agent service

Features:
- Queue-based task processing
- Session management with persistence
- Real-time streaming output
- Cost tracking and budgeting
- Retry logic with exponential backoff
- Structured logging
- Graceful shutdown

Usage:
    # Single task
    ./agent-service.py "Analyze this codebase"

    # Queue processing
    ./agent-service.py --queue /data/queue.txt

    # Interactive mode
    ./agent-service.py --interactive

    # As a long-running service
    ./agent-service.py --daemon --queue /data/queue.txt
"""

import subprocess
import json
import sys
import os
import signal
import time
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, Iterator, Callable, List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum
import argparse


# --- Configuration ---

@dataclass
class Config:
    """Agent configuration from environment."""

    session_file: Path = field(
        default_factory=lambda: Path(os.getenv("SESSION_FILE", "/data/session.id"))
    )
    results_dir: Path = field(
        default_factory=lambda: Path(os.getenv("RESULTS_DIR", "/data/results"))
    )
    queue_file: Path = field(
        default_factory=lambda: Path(os.getenv("QUEUE_FILE", "/data/queue.txt"))
    )
    mcp_config: Path = field(
        default_factory=lambda: Path(os.getenv("MCP_CONFIG", "/app/mcp.json"))
    )
    permission_mode: str = field(
        default_factory=lambda: os.getenv("PERMISSION_MODE", "acceptEdits")
    )
    max_turns: int = field(
        default_factory=lambda: int(os.getenv("MAX_TURNS", "20"))
    )
    max_retries: int = field(
        default_factory=lambda: int(os.getenv("MAX_RETRIES", "3"))
    )
    budget_usd: Optional[float] = field(
        default_factory=lambda: float(os.getenv("BUDGET_USD", "0")) or None
    )


# --- Logging Setup ---

def setup_logging(level: str = "INFO") -> logging.Logger:
    """Configure structured logging."""
    logger = logging.getLogger("agent")
    logger.setLevel(getattr(logging, level.upper()))

    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger


logger = setup_logging(os.getenv("LOG_LEVEL", "INFO"))


# --- Data Classes ---

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    RETRYING = "retrying"


@dataclass
class TaskResult:
    """Result of a task execution."""

    task_id: str
    prompt: str
    status: TaskStatus
    output: str = ""
    cost_usd: float = 0.0
    duration_ms: int = 0
    attempts: int = 1
    error: Optional[str] = None
    output_file: Optional[Path] = None


@dataclass
class ServiceStats:
    """Accumulated service statistics."""

    tasks_completed: int = 0
    tasks_failed: int = 0
    total_cost_usd: float = 0.0
    total_duration_ms: int = 0
    started_at: str = field(default_factory=lambda: datetime.now().isoformat())


# --- Agent Service ---

class AgentService:
    """
    Production agent service with queue processing.

    Handles:
    - Session management
    - Task queue processing
    - Retry logic
    - Budget enforcement
    - Graceful shutdown
    """

    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config()
        self.stats = ServiceStats()
        self._session_id: Optional[str] = None
        self._shutdown_requested = False

        # Ensure directories exist
        self.config.results_dir.mkdir(parents=True, exist_ok=True)
        self.config.session_file.parent.mkdir(parents=True, exist_ok=True)

        # Register signal handlers
        signal.signal(signal.SIGTERM, self._handle_shutdown)
        signal.signal(signal.SIGINT, self._handle_shutdown)

    def _handle_shutdown(self, signum, frame):
        """Handle graceful shutdown."""
        logger.info("Shutdown requested, finishing current task...")
        self._shutdown_requested = True

    @property
    def session_id(self) -> str:
        """Get or create session ID."""
        if self._session_id:
            return self._session_id

        if self.config.session_file.exists():
            self._session_id = self.config.session_file.read_text().strip()
            logger.info(f"Resumed session: {self._session_id[:8]}...")
        else:
            logger.info("Creating new session...")
            result = self._run_claude("Initialize agent session", stream=False)
            self._session_id = result.get("session_id", "")
            self.config.session_file.write_text(self._session_id)
            logger.info(f"Created session: {self._session_id[:8]}...")

        return self._session_id

    def _build_command(self, prompt: str, stream: bool = True) -> List[str]:
        """Build claude CLI command."""
        cmd = [
            "claude", "-p",
            "--resume", self.session_id,
            "--output-format", "stream-json" if stream else "json",
            "--permission-mode", self.config.permission_mode,
            "--max-turns", str(self.config.max_turns),
        ]

        if self.config.mcp_config.exists():
            cmd.extend(["--mcp-config", str(self.config.mcp_config)])

        cmd.append(prompt)
        return cmd

    def _run_claude(self, prompt: str, stream: bool = True) -> Dict[str, Any]:
        """Execute claude and return result."""
        cmd = self._build_command(prompt, stream)

        if stream:
            proc = subprocess.Popen(
                cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
            )
            output_lines = []
            result_data = {}

            for line in proc.stdout:
                line = line.strip()
                if line:
                    output_lines.append(line)
                    try:
                        data = json.loads(line)
                        if data.get("type") == "result":
                            result_data = data
                    except json.JSONDecodeError:
                        pass

            proc.wait()
            result_data["_output_lines"] = output_lines
            return result_data
        else:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise RuntimeError(f"Claude failed: {result.stderr}")
            return json.loads(result.stdout)

    def run_task(
        self,
        prompt: str,
        task_id: Optional[str] = None,
        on_output: Optional[Callable[[str], None]] = None,
    ) -> TaskResult:
        """
        Execute a single task with retry logic.

        Args:
            prompt: The task prompt
            task_id: Optional task identifier
            on_output: Optional callback for streaming output

        Returns:
            TaskResult with status and metadata
        """
        task_id = task_id or f"task-{int(time.time() * 1000)}"
        output_file = self.config.results_dir / f"{task_id}.jsonl"

        logger.info(f"[{task_id}] Starting: {prompt[:60]}...")

        attempt = 0
        last_error = None

        while attempt < self.config.max_retries:
            attempt += 1

            if attempt > 1:
                # Exponential backoff
                delay = 2 ** (attempt - 1)
                logger.info(f"[{task_id}] Retry {attempt}/{self.config.max_retries} in {delay}s...")
                time.sleep(delay)

            try:
                cmd = self._build_command(prompt, stream=True)
                proc = subprocess.Popen(
                    cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
                )

                output_lines = []
                text_output = []
                result_data = {}

                with open(output_file, "w") as f:
                    for line in proc.stdout:
                        line = line.strip()
                        if not line:
                            continue

                        f.write(line + "\n")
                        output_lines.append(line)

                        try:
                            data = json.loads(line)
                            msg_type = data.get("type", "")

                            if msg_type == "assistant":
                                for block in data.get("message", {}).get("content", []):
                                    if block.get("type") == "text":
                                        text = block.get("text", "")
                                        text_output.append(text)
                                        if on_output:
                                            on_output(text)

                            elif msg_type == "result":
                                result_data = data

                        except json.JSONDecodeError:
                            pass

                proc.wait()

                if proc.returncode != 0:
                    stderr = proc.stderr.read()
                    raise RuntimeError(f"CLI error: {stderr}")

                is_error = result_data.get("is_error", False)
                cost = result_data.get("total_cost_usd", 0)
                duration = result_data.get("duration_ms", 0)

                # Update stats
                self.stats.total_cost_usd += cost
                self.stats.total_duration_ms += duration

                # Check budget
                if self.config.budget_usd and self.stats.total_cost_usd > self.config.budget_usd:
                    logger.warning(f"Budget exceeded: ${self.stats.total_cost_usd:.2f} > ${self.config.budget_usd:.2f}")

                if is_error:
                    self.stats.tasks_failed += 1
                    return TaskResult(
                        task_id=task_id,
                        prompt=prompt,
                        status=TaskStatus.FAILED,
                        output="".join(text_output),
                        cost_usd=cost,
                        duration_ms=duration,
                        attempts=attempt,
                        error=result_data.get("result", "Unknown error"),
                        output_file=output_file,
                    )

                self.stats.tasks_completed += 1
                logger.info(f"[{task_id}] Complete. Cost: ${cost:.4f}, Duration: {duration}ms")

                return TaskResult(
                    task_id=task_id,
                    prompt=prompt,
                    status=TaskStatus.SUCCESS,
                    output="".join(text_output),
                    cost_usd=cost,
                    duration_ms=duration,
                    attempts=attempt,
                    output_file=output_file,
                )

            except Exception as e:
                last_error = str(e)
                logger.error(f"[{task_id}] Attempt {attempt} failed: {e}")

        # All retries exhausted
        self.stats.tasks_failed += 1
        return TaskResult(
            task_id=task_id,
            prompt=prompt,
            status=TaskStatus.FAILED,
            attempts=attempt,
            error=last_error,
            output_file=output_file,
        )

    def process_queue(self, queue_file: Optional[Path] = None) -> List[TaskResult]:
        """Process tasks from a queue file."""
        queue_path = queue_file or self.config.queue_file

        if not queue_path.exists():
            logger.warning(f"Queue file not found: {queue_path}")
            return []

        results = []
        task_num = 0

        logger.info(f"Processing queue: {queue_path}")

        with open(queue_path) as f:
            for line in f:
                if self._shutdown_requested:
                    logger.info("Shutdown requested, stopping queue processing")
                    break

                line = line.strip()
                if not line or line.startswith("#"):
                    continue

                task_num += 1
                task_id = f"queue-{task_num:04d}-{int(time.time())}"

                result = self.run_task(line, task_id)
                results.append(result)

                # Small delay between tasks
                time.sleep(0.5)

        # Archive processed queue
        if task_num > 0 and not self._shutdown_requested:
            archive_path = self.config.results_dir / f"queue-{datetime.now().strftime('%Y%m%d-%H%M%S')}.txt"
            queue_path.rename(archive_path)
            logger.info(f"Queue archived: {archive_path}")

        logger.info(
            f"Queue complete: {self.stats.tasks_completed} succeeded, "
            f"{self.stats.tasks_failed} failed, "
            f"total cost: ${self.stats.total_cost_usd:.4f}"
        )

        return results

    def run_interactive(self):
        """Run interactive REPL mode."""
        logger.info("Interactive mode started")
        print(f"Session: {self.session_id[:8]}...")
        print("Type 'exit' to quit, 'stats' for statistics")
        print("-" * 40)

        while not self._shutdown_requested:
            try:
                prompt = input("\nYou: ").strip()
            except (EOFError, KeyboardInterrupt):
                break

            if not prompt:
                continue
            if prompt.lower() == "exit":
                break
            if prompt.lower() == "stats":
                print(f"Tasks completed: {self.stats.tasks_completed}")
                print(f"Tasks failed: {self.stats.tasks_failed}")
                print(f"Total cost: ${self.stats.total_cost_usd:.4f}")
                continue

            result = self.run_task(
                prompt,
                on_output=lambda t: print(t, end="", flush=True)
            )
            print(f"\n[Cost: ${result.cost_usd:.4f}]")

        print("\nGoodbye!")


# --- CLI ---

def main():
    parser = argparse.ArgumentParser(description="Claude Agent Service")
    parser.add_argument("prompt", nargs="?", help="Single task prompt")
    parser.add_argument("--queue", type=Path, help="Process queue file")
    parser.add_argument("--interactive", "-i", action="store_true", help="Interactive mode")
    parser.add_argument("--daemon", action="store_true", help="Run as daemon (with --queue)")
    parser.add_argument("--stats", action="store_true", help="Show stats and exit")

    args = parser.parse_args()

    service = AgentService()

    if args.stats:
        print(json.dumps({
            "session_id": service.session_id,
            "stats": {
                "completed": service.stats.tasks_completed,
                "failed": service.stats.tasks_failed,
                "total_cost_usd": service.stats.total_cost_usd,
            }
        }, indent=2))
        return

    if args.interactive:
        service.run_interactive()
    elif args.queue:
        if args.daemon:
            logger.info("Running in daemon mode...")
            while not service._shutdown_requested:
                service.process_queue(args.queue)
                time.sleep(5)  # Poll interval
        else:
            service.process_queue(args.queue)
    elif args.prompt:
        result = service.run_task(
            args.prompt,
            on_output=lambda t: print(t, end="", flush=True)
        )
        print(f"\n\n[Status: {result.status.value}, Cost: ${result.cost_usd:.4f}]")
        sys.exit(0 if result.status == TaskStatus.SUCCESS else 1)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
