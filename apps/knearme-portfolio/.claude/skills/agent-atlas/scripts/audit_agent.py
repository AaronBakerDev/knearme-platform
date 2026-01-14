#!/usr/bin/env python3
"""
Agent Atlas Audit Script

Compares current code state against documented state in reference files.
Detects drift and generates reports for updating documentation.
Also checks for philosophy-alignment issues (over-engineering patterns).

Usage:
    python audit_agent.py              # Full audit
    python audit_agent.py --tools      # Tools only
    python audit_agent.py --agents     # Agents only
    python audit_agent.py --quick      # Quick check (no details)
    python audit_agent.py --generate-catalog  # Regenerate TOOL-CATALOG.md
    python audit_agent.py --philosophy # Check philosophy alignment
    python audit_agent.py --masonry    # Find masonry-specific language
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


# =============================================================================
# PHILOSOPHY ALIGNMENT CHECKS
# =============================================================================

# Masonry-specific terms that should be generalized
MASONRY_PATTERNS = [
    (r'\bmasonry\b', 'masonry'),
    (r'\bchimney\b', 'chimney'),
    (r'\btuckpointing\b', 'tuckpointing'),
    (r'\bbrick\s+repair\b', 'brick repair'),
    (r'\bstone\s+masonry\b', 'stone masonry'),
    (r'\bfoundation\s+repair\b', 'foundation repair'),
    (r'\befflorescence\b', 'efflorescence'),
    (r'\bmortar\b', 'mortar'),
]

# Files to check for masonry-specific language
PHILOSOPHY_CHECK_FILES = [
    "src/lib/ai/prompts.ts",
    "src/lib/agents/story-extractor.ts",
    "src/lib/agents/content-generator.ts",
    "src/lib/agents/quality-checker.ts",
    "src/lib/chat/tool-schemas.ts",
    "src/lib/chat/chat-prompts.ts",
    "src/lib/trades/config.ts",
    "src/lib/data/services.ts",
]

# Magic number patterns (thresholds that should be removed)
MAGIC_NUMBER_PATTERNS = [
    (r'MIN_\w+_WORDS\s*=\s*\d+', 'MIN_*_WORDS threshold'),
    (r'MIN_\w+\s*=\s*\d+', 'MIN_* threshold'),
    (r'THRESHOLD\s*=\s*[\d.]+', 'THRESHOLD value'),
    (r'\.\s*min\s*\(\s*\d+\s*\)', '.min() validation'),
    (r'\.\s*max\s*\(\s*\d+\s*\)', '.max() validation'),
    (r'>=\s*\d+\s*words', 'word count check'),
    (r'<\s*\d+\s*words', 'word count check'),
]

# Prescriptive workflow patterns
PRESCRIPTIVE_PATTERNS = [
    (r'step\s*1[:\)]', 'numbered step'),
    (r'step\s*2[:\)]', 'numbered step'),
    (r'step\s*3[:\)]', 'numbered step'),
    (r'1\)\s+\w+', 'numbered procedure'),
    (r'2\)\s+\w+', 'numbered procedure'),
    (r'MUST\s+call\s+\w+\s+first', 'forced ordering'),
    (r'ONLY\s+set\s+true\s+when', 'rigid condition'),
    (r'ALWAYS\s+call\s+\w+\s+after', 'forced sequence'),
]


def check_masonry_language(verbose: bool = True) -> List[Tuple[str, str, int, str]]:
    """
    Find masonry-specific language in monitored files.

    Returns list of (file, pattern_name, line_number, line_content) tuples.
    """
    findings = []

    for file_path in PHILOSOPHY_CHECK_FILES:
        full_path = PROJECT_ROOT / file_path
        if not full_path.exists():
            continue

        content = full_path.read_text()
        lines = content.split('\n')

        for line_num, line in enumerate(lines, 1):
            # Skip comments that might be documenting the issue
            if '// TODO' in line or '// FIXME' in line or '# NOTE' in line:
                continue

            for pattern, name in MASONRY_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    # Skip if it's in a comment explaining the issue
                    if 'masonry-specific' in line.lower() or 'to be removed' in line.lower():
                        continue
                    findings.append((file_path, name, line_num, line.strip()[:80]))

    if verbose and findings:
        print(f"\n  Found {len(findings)} masonry-specific references:")
        # Group by file
        by_file: Dict[str, List] = {}
        for f, name, line, content in findings:
            by_file.setdefault(f, []).append((name, line, content))

        for file_path, items in by_file.items():
            print(f"\n  📄 {file_path}:")
            for name, line, content in items[:5]:  # Show first 5 per file
                print(f"     Line {line}: '{name}' - {content[:50]}...")
            if len(items) > 5:
                print(f"     ... and {len(items) - 5} more")

    return findings


def check_magic_numbers(verbose: bool = True) -> List[Tuple[str, str, int, str]]:
    """
    Find magic numbers and thresholds that should be removed.

    Returns list of (file, pattern_name, line_number, line_content) tuples.
    """
    findings = []

    for file_path in PHILOSOPHY_CHECK_FILES:
        full_path = PROJECT_ROOT / file_path
        if not full_path.exists():
            continue

        content = full_path.read_text()
        lines = content.split('\n')

        for line_num, line in enumerate(lines, 1):
            for pattern, name in MAGIC_NUMBER_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    findings.append((file_path, name, line_num, line.strip()[:80]))

    if verbose and findings:
        print(f"\n  Found {len(findings)} magic number/threshold patterns:")
        for f, name, line, content in findings[:10]:
            print(f"     {f}:{line} - {name}")
        if len(findings) > 10:
            print(f"     ... and {len(findings) - 10} more")

    return findings


def check_prescriptive_patterns(verbose: bool = True) -> List[Tuple[str, str, int, str]]:
    """
    Find prescriptive workflow patterns (numbered steps, forced sequences).

    Returns list of (file, pattern_name, line_number, line_content) tuples.
    """
    findings = []

    # Focus on prompt files where prescriptive patterns are most problematic
    prompt_files = [
        "src/lib/chat/chat-prompts.ts",
        "src/lib/agents/story-extractor.ts",
    ]

    for file_path in prompt_files:
        full_path = PROJECT_ROOT / file_path
        if not full_path.exists():
            continue

        content = full_path.read_text()
        lines = content.split('\n')

        for line_num, line in enumerate(lines, 1):
            for pattern, name in PRESCRIPTIVE_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    findings.append((file_path, name, line_num, line.strip()[:80]))

    if verbose and findings:
        print(f"\n  Found {len(findings)} prescriptive workflow patterns:")
        for f, name, line, content in findings[:10]:
            print(f"     {f}:{line} - {name}")
        if len(findings) > 10:
            print(f"     ... and {len(findings) - 10} more")

    return findings


def audit_philosophy(verbose: bool = True) -> List[str]:
    """
    Full philosophy alignment audit.

    Checks for:
    - Masonry-specific language
    - Magic numbers and thresholds
    - Prescriptive workflow patterns
    """
    issues = []

    print("\n  Checking masonry-specific language...")
    masonry = check_masonry_language(verbose=verbose)
    if masonry:
        issues.append(f"Found {len(masonry)} masonry-specific references to generalize")

    print("\n  Checking magic numbers and thresholds...")
    magic = check_magic_numbers(verbose=verbose)
    if magic:
        issues.append(f"Found {len(magic)} magic number/threshold patterns to remove")

    print("\n  Checking prescriptive workflow patterns...")
    prescriptive = check_prescriptive_patterns(verbose=verbose)
    if prescriptive:
        issues.append(f"Found {len(prescriptive)} prescriptive patterns to soften")

    return issues


def main():
    parser = argparse.ArgumentParser(description="Audit agent system documentation")
    parser.add_argument("--tools", action="store_true", help="Audit tools only")
    parser.add_argument("--agents", action="store_true", help="Audit agents only")
    parser.add_argument("--artifacts", action="store_true", help="Audit artifacts only")
    parser.add_argument("--quick", action="store_true", help="Quick check, no details")
    parser.add_argument("--since-last-change", action="store_true", help="Show changes since last changelog")
    parser.add_argument("--generate-catalog", action="store_true", help="Generate TOOL-CATALOG.md")
    parser.add_argument("--philosophy", action="store_true", help="Check philosophy alignment")
    parser.add_argument("--masonry", action="store_true", help="Find masonry-specific language only")
    args = parser.parse_args()

    print("=" * 60)
    print("Agent Atlas Audit")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)

    all_issues = []
    philosophy_issues = []

    # Determine if any specific audit was requested
    specific_audit = any([args.tools, args.agents, args.artifacts, args.philosophy, args.masonry])

    # Philosophy-only audits
    if args.masonry:
        print("\n🧱 Masonry Language Check:")
        findings = check_masonry_language(verbose=not args.quick)
        if findings:
            philosophy_issues.append(f"Found {len(findings)} masonry-specific references")
        else:
            print("  ✅ No masonry-specific language found")

    elif args.philosophy:
        print("\n📜 Philosophy Alignment Audit:")
        issues = audit_philosophy(verbose=not args.quick)
        philosophy_issues.extend(issues)
        if not issues:
            print("\n  ✅ No philosophy-alignment issues found")

    # Standard audits
    else:
        # Check for recent changes first
        if args.since_last_change or not specific_audit:
            print("\n📋 Changes since last changelog entry:")
            changes = check_recent_changes()
            if changes:
                for change in changes:
                    print(f"  ⚠️  {change}")
            else:
                print("  ✅ No relevant changes detected")

        # Audit tools
        if args.tools or not specific_audit:
            print("\n🔧 Tool Audit:")
            issues = audit_tools(verbose=not args.quick)
            all_issues.extend(issues)

        # Audit agents
        if args.agents or not specific_audit:
            print("\n🤖 Agent Audit:")
            issues = audit_agents(verbose=not args.quick)
            all_issues.extend(issues)

        # Audit artifacts
        if args.artifacts or not specific_audit:
            print("\n🎨 Artifact Audit:")
            issues = audit_artifacts(verbose=not args.quick)
            all_issues.extend(issues)

    # Summary
    print("\n" + "=" * 60)

    total_issues = len(all_issues) + len(philosophy_issues)

    if total_issues > 0:
        if all_issues:
            print(f"❌ Found {len(all_issues)} documentation issue(s):")
            for issue in all_issues:
                print(f"  • {issue}")
        if philosophy_issues:
            print(f"⚠️  Found {len(philosophy_issues)} philosophy-alignment issue(s):")
            for issue in philosophy_issues:
                print(f"  • {issue}")
            print("\n  See: references/MIGRATIONS.md for migration tracking")
            print("  See: references/PHILOSOPHY.md for principles")

        # Philosophy issues are warnings, not failures (exit 0)
        if all_issues:
            sys.exit(1)
        else:
            sys.exit(0)
    else:
        print("✅ All documentation is in sync with code")
        sys.exit(0)


if __name__ == "__main__":
    main()
