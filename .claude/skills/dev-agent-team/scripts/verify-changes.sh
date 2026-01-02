#!/bin/bash
# verify-changes.sh - Run before committing agent changes
# Usage: ./verify-changes.sh [--strict]

set -e

STRICT_MODE="${1:-}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  Agent Change Verification"
echo "=========================================="
echo ""

# Track failures
FAILURES=0
WARNINGS=0

# 1. Check if there are changes to verify
echo "📋 Checking for changes..."
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${YELLOW}No changes to verify${NC}"
    exit 0
fi

# Show summary
echo ""
git diff --stat
echo ""

# 2. Run linter
echo "🔍 Running linter..."
if npm run lint > /tmp/lint-output.txt 2>&1; then
    echo -e "${GREEN}✓ Lint passed${NC}"
else
    echo -e "${RED}✗ Lint failed${NC}"
    cat /tmp/lint-output.txt | tail -20
    FAILURES=$((FAILURES + 1))
fi

# 3. Run build
echo ""
echo "🔨 Running build..."
if npm run build > /tmp/build-output.txt 2>&1; then
    echo -e "${GREEN}✓ Build passed${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    cat /tmp/build-output.txt | tail -30
    FAILURES=$((FAILURES + 1))
fi

# 4. Run tests (if they exist for changed files)
echo ""
echo "🧪 Running tests..."
if npm run test -- --run > /tmp/test-output.txt 2>&1; then
    echo -e "${GREEN}✓ Tests passed${NC}"
else
    echo -e "${RED}✗ Tests failed${NC}"
    cat /tmp/test-output.txt | tail -30
    FAILURES=$((FAILURES + 1))
fi

# 5. Security scan - check for obvious issues
echo ""
echo "🔒 Security scan..."

# Check for hardcoded secrets
if git diff | grep -iE "(api_key|secret_key|password|token)\s*[:=]\s*['\"][^'\"]+['\"]" | grep -v "^\-" > /tmp/secrets.txt 2>&1; then
    if [ -s /tmp/secrets.txt ]; then
        echo -e "${RED}✗ Potential secrets found:${NC}"
        cat /tmp/secrets.txt
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${GREEN}✓ No hardcoded secrets detected${NC}"
fi

# Check for console.log with sensitive patterns
if git diff | grep -E "console\.(log|error)\(.*\b(password|token|secret|key)\b" | grep -v "^\-" > /tmp/console-leak.txt 2>&1; then
    if [ -s /tmp/console-leak.txt ]; then
        echo -e "${YELLOW}⚠ Possible sensitive data in console.log:${NC}"
        cat /tmp/console-leak.txt
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${GREEN}✓ No sensitive console.logs detected${NC}"
fi

# Check for disabled eslint rules
DISABLED_RULES=$(git diff | grep -c "eslint-disable" | grep -v "^\-" || echo "0")
if [ "$DISABLED_RULES" -gt 3 ]; then
    echo -e "${YELLOW}⚠ ${DISABLED_RULES} new eslint-disable comments added${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ ESLint disable count OK (${DISABLED_RULES})${NC}"
fi

# 6. Scope check - are changes in expected areas?
echo ""
echo "📁 Scope check..."
CHANGED_DIRS=$(git diff --name-only | cut -d'/' -f1-2 | sort -u)
echo "   Changed directories: $CHANGED_DIRS"

# 7. Summary
echo ""
echo "=========================================="
echo "  Verification Summary"
echo "=========================================="
if [ $FAILURES -gt 0 ]; then
    echo -e "${RED}BLOCKED: $FAILURES critical issue(s) found${NC}"
    echo ""
    echo "Run 'git checkout -- .' to revert changes"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}NEEDS REVIEW: $WARNINGS warning(s) found${NC}"
    if [ "$STRICT_MODE" = "--strict" ]; then
        echo "Strict mode: treating warnings as failures"
        exit 1
    fi
    echo ""
    echo "Review warnings above before committing"
    exit 0
else
    echo -e "${GREEN}APPROVED: All checks passed${NC}"
    echo ""
    echo "Safe to commit changes"
    exit 0
fi
