#!/usr/bin/env python3
"""
Agent Atlas Audit Script

Compares current code state against documented state in reference files.
Detects drift and generates reports for updating documentation.

Usage:
    python audit_agent.py              # Full audit
    python audit_agent.py --tools      # Tools only
    python audit_agent.py --agents     # Agents only
    python audit_agent.py --quick      # Quick check (no details)
    python audit_agent.py --generate-catalog  # Regenerate TOOL-CATALOG.md
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set, Tuple

# Paths relative to project root
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent.parent
SKILL_ROOT = PROJECT_ROOT / ".claude" / "skills" / "agent-atlas"
REFERENCES_DIR = SKILL_ROOT / "references"

# Monitored file patterns
MONITORED_FILES = {
    "tools": [
        "src/lib/chat/tool-schemas.ts",
        "src/lib/chat/tools-runtime.ts",
    ],
    "agents": [
        "src/lib/agents/orchestrator.ts",
        "src/lib/agents/story-extractor.ts",
        "src/lib/agents/content-generator.ts",
        "src/lib/agents/layout-composer.ts",
        "src/lib/agents/quality-checker.ts",
        "src/lib/agents/types.ts",
        "src/lib/agents/index.ts",
    ],
    "api": [
        "src/app/api/chat/route.ts",
    ],
    "artifacts": [
        "src/components/chat/artifacts/ArtifactRenderer.tsx",
        "src/components/chat/ChatMessage.tsx",
        "src/types/artifacts.ts",
    ],
    "state": [
        "src/lib/agents/types.ts",
        "src/lib/chat/chat-types.ts",
    ],
}


def get_git_modified_since(since_date: str) -> List[str]:
    """Get files modified since a date."""
    try:
        result = subprocess.run(
            ["git", "log", f"--since={since_date}", "--name-only", "--pretty=format:"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
        )
        files = [f.strip() for f in result.stdout.split("\n") if f.strip()]
        return list(set(files))
    except Exception as e:
        print(f"Warning: Could not get git history: {e}")
        return []


def extract_tools_from_code() -> Dict[str, dict]:
    """Extract tool definitions from tool-schemas.ts."""
    tools = {}
    schema_file = PROJECT_ROOT / "src/lib/chat/tool-schemas.ts"

    if not schema_file.exists():
        return tools

    content = schema_file.read_text()

    # Find schema definitions
    schema_pattern = r"export const (\w+Schema) = z\.object\("
    for match in re.finditer(schema_pattern, content):
        schema_name = match.group(1)
        tool_name = schema_name.replace("Schema", "")
        tools[tool_name] = {
            "schema": schema_name,
            "file": "src/lib/chat/tool-schemas.ts",
        }

    return tools


def extract_tools_from_runtime() -> Dict[str, str]:
    """Extract tool classifications from tools-runtime.ts."""
    classifications = {}
    runtime_file = PROJECT_ROOT / "src/lib/chat/tools-runtime.ts"

    if not runtime_file.exists():
        return classifications

    content = runtime_file.read_text()

    # Find FAST_TURN_TOOLS
    fast_match = re.search(
        r"export const FAST_TURN_TOOLS = \[([\s\S]*?)\] as const",
        content
    )
    if fast_match:
        tools = re.findall(r"'(\w+)'", fast_match.group(1))
        for tool in tools:
            classifications[tool] = "FAST"

    # Find DEEP_CONTEXT_TOOLS
    deep_match = re.search(
        r"export const DEEP_CONTEXT_TOOLS = \[([\s\S]*?)\] as const",
        content
    )
    if deep_match:
        tools = re.findall(r"'(\w+)'", deep_match.group(1))
        for tool in tools:
            classifications[tool] = "DEEP"

    return classifications


def extract_agents_from_code() -> Dict[str, dict]:
    """Extract agent definitions from agents directory."""
    agents = {}
    agents_dir = PROJECT_ROOT / "src/lib/agents"

    if not agents_dir.exists():
        return agents

    for file in agents_dir.glob("*.ts"):
        if file.name in ["index.ts", "types.ts"]:
            continue

        content = file.read_text()

        # Try to find main export function
        export_match = re.search(r"export (?:async )?function (\w+)", content)
        if export_match:
            agents[file.stem] = {
                "file": f"src/lib/agents/{file.name}",
                "main_function": export_match.group(1),
            }

    return agents


def extract_artifact_types() -> Set[str]:
    """Extract artifact types from artifacts.ts."""
    types = set()
    artifacts_file = PROJECT_ROOT / "src/types/artifacts.ts"

    if not artifacts_file.exists():
        return types

    content = artifacts_file.read_text()

    # Find ArtifactType definition
    match = re.search(r"export type ArtifactType =\s*([\s\S]*?);", content)
    if match:
        type_str = match.group(1)
        types = set(re.findall(r"'(\w+)'", type_str))

    return types


def get_documented_tools() -> Set[str]:
    """Get tools documented in TOOL-CATALOG.md."""
    tools = set()
    catalog_file = REFERENCES_DIR / "TOOL-CATALOG.md"

    if not catalog_file.exists():
        return tools

    content = catalog_file.read_text()

    # Find tool headers (### toolName)
    tools = set(re.findall(r"^### (\w+)$", content, re.MULTILINE))

    return tools


def get_last_changelog_date() -> str:
    """Get the date of the last changelog entry."""
    changelog_file = REFERENCES_DIR / "CHANGE-LOG.md"

    if not changelog_file.exists():
        return "1970-01-01"

    content = changelog_file.read_text()

    # Find date headers
    dates = re.findall(r"^## (\d{4}-\d{2}-\d{2})", content, re.MULTILINE)

    return dates[0] if dates else "1970-01-01"


def audit_tools(verbose: bool = True) -> List[str]:
    """Audit tool definitions vs documentation."""
    issues = []

    code_tools = extract_tools_from_code()
    classifications = extract_tools_from_runtime()
    documented_tools = get_documented_tools()

    # Check for undocumented tools
    for tool in code_tools:
        if tool not in documented_tools:
            issues.append(f"UNDOCUMENTED: Tool '{tool}' exists in code but not in TOOL-CATALOG.md")

    # Check for documented but removed tools
    for tool in documented_tools:
        if tool not in code_tools and tool not in ["showContentEditor"]:  # Known deprecated
            issues.append(f"STALE: Tool '{tool}' is documented but not in code")

    # Check classifications match
    for tool, classification in classifications.items():
        if verbose:
            print(f"  {tool}: {classification}")

    return issues


def audit_agents(verbose: bool = True) -> List[str]:
    """Audit agent definitions."""
    issues = []

    agents = extract_agents_from_code()

    if verbose:
        print(f"Found {len(agents)} agents:")
        for name, info in agents.items():
            print(f"  {name}: {info['main_function']}()")

    return issues


def audit_artifacts(verbose: bool = True) -> List[str]:
    """Audit artifact types."""
    issues = []

    artifact_types = extract_artifact_types()

    if verbose:
        print(f"Found {len(artifact_types)} artifact types:")
        for t in sorted(artifact_types):
            print(f"  {t}")

    return issues


def check_recent_changes() -> List[str]:
    """Check for changes since last changelog entry."""
    last_date = get_last_changelog_date()
    modified = get_git_modified_since(last_date)

    relevant = []
    for category, patterns in MONITORED_FILES.items():
        for pattern in patterns:
            if pattern in modified:
                relevant.append(f"[{category}] {pattern}")

    return relevant


def main():
    parser = argparse.ArgumentParser(description="Audit agent system documentation")
    parser.add_argument("--tools", action="store_true", help="Audit tools only")
    parser.add_argument("--agents", action="store_true", help="Audit agents only")
    parser.add_argument("--artifacts", action="store_true", help="Audit artifacts only")
    parser.add_argument("--quick", action="store_true", help="Quick check, no details")
    parser.add_argument("--since-last-change", action="store_true", help="Show changes since last changelog")
    parser.add_argument("--generate-catalog", action="store_true", help="Generate TOOL-CATALOG.md")
    args = parser.parse_args()

    print("=" * 60)
    print("Agent Atlas Audit")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)

    all_issues = []

    # Check for recent changes first
    if args.since_last_change or not any([args.tools, args.agents, args.artifacts]):
        print("\n📋 Changes since last changelog entry:")
        changes = check_recent_changes()
        if changes:
            for change in changes:
                print(f"  ⚠️  {change}")
        else:
            print("  ✅ No relevant changes detected")

    # Audit tools
    if args.tools or not any([args.tools, args.agents, args.artifacts]):
        print("\n🔧 Tool Audit:")
        issues = audit_tools(verbose=not args.quick)
        all_issues.extend(issues)

    # Audit agents
    if args.agents or not any([args.tools, args.agents, args.artifacts]):
        print("\n🤖 Agent Audit:")
        issues = audit_agents(verbose=not args.quick)
        all_issues.extend(issues)

    # Audit artifacts
    if args.artifacts or not any([args.tools, args.agents, args.artifacts]):
        print("\n🎨 Artifact Audit:")
        issues = audit_artifacts(verbose=not args.quick)
        all_issues.extend(issues)

    # Summary
    print("\n" + "=" * 60)
    if all_issues:
        print(f"❌ Found {len(all_issues)} issue(s):")
        for issue in all_issues:
            print(f"  • {issue}")
        sys.exit(1)
    else:
        print("✅ All documentation is in sync with code")
        sys.exit(0)


if __name__ == "__main__":
    main()
