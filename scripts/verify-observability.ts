/**
 * Observability Verification Script
 *
 * This script verifies that the Langfuse observability infrastructure is
 * correctly configured and provides a checklist for manual verification.
 *
 * Run with: npx tsx scripts/verify-observability.ts
 *
 * @see /docs/03-architecture/sdk-integration.md
 * @see /src/instrumentation.ts
 * @see /src/lib/observability/langfuse.ts
 */

import { isLangfuseEnabled, getTelemetryConfig } from '../src/lib/observability/langfuse';

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function success(msg: string) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function error(msg: string) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function warn(msg: string) {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function info(msg: string) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
}

function header(msg: string) {
  console.log(`\n${colors.bright}${msg}${colors.reset}`);
  console.log('─'.repeat(60));
}

async function main() {
  console.log(`
${colors.bright}╔══════════════════════════════════════════════════════════╗
║          KnearMe Observability Verification              ║
╚══════════════════════════════════════════════════════════╝${colors.reset}
`);

  let passCount = 0;
  let failCount = 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Section 1: Environment Variables
  // ─────────────────────────────────────────────────────────────────────────
  header('1. Environment Variables');

  if (process.env.LANGFUSE_PUBLIC_KEY) {
    success('LANGFUSE_PUBLIC_KEY is set');
    passCount++;
  } else {
    error('LANGFUSE_PUBLIC_KEY is not set');
    failCount++;
  }

  if (process.env.LANGFUSE_SECRET_KEY) {
    success('LANGFUSE_SECRET_KEY is set');
    passCount++;
  } else {
    error('LANGFUSE_SECRET_KEY is not set');
    failCount++;
  }

  if (process.env.LANGFUSE_ENABLED === 'false') {
    warn('LANGFUSE_ENABLED is explicitly set to false (tracing disabled)');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Section 2: Langfuse Module Check
  // ─────────────────────────────────────────────────────────────────────────
  header('2. Langfuse Module Configuration');

  if (isLangfuseEnabled()) {
    success('isLangfuseEnabled() returns true');
    passCount++;
  } else {
    error('isLangfuseEnabled() returns false - tracing will not work');
    failCount++;
  }

  const telemetryConfig = getTelemetryConfig({
    functionId: 'verify-script',
    metadata: { test: 'true' },
  });

  if (telemetryConfig.isEnabled) {
    success('getTelemetryConfig() returns isEnabled: true');
    passCount++;
  } else {
    error('getTelemetryConfig() returns isEnabled: false');
    failCount++;
  }

  if (telemetryConfig.functionId === 'verify-script') {
    success('getTelemetryConfig() accepts custom functionId');
    passCount++;
  } else {
    error('getTelemetryConfig() functionId mismatch');
    failCount++;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Section 3: Summary
  // ─────────────────────────────────────────────────────────────────────────
  header('3. Automated Check Summary');

  console.log(`
  Passed: ${colors.green}${passCount}${colors.reset}
  Failed: ${failCount > 0 ? colors.red : ''}${failCount}${colors.reset}
`);

  if (failCount === 0) {
    success('All automated checks passed!');
  } else {
    error(`${failCount} check(s) failed - fix before proceeding`);
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Section 4: Manual Verification Checklist
  // ─────────────────────────────────────────────────────────────────────────
  header('4. Manual Verification Checklist (VERIFY-001)');

  console.log(`
${colors.dim}Complete these steps to verify end-to-end observability:${colors.reset}

${colors.cyan}Step 1: Start the dev server${colors.reset}
  $ npm run dev

${colors.cyan}Step 2: Open Langfuse dashboard${colors.reset}
  URL: https://cloud.langfuse.com
  Look for project: knearme-portfolio

${colors.cyan}Step 3: Send a chat message${colors.reset}
  - Log in to the app at http://localhost:3000
  - Navigate to the onboarding chat or project creation
  - Send a message that triggers AI generation

${colors.cyan}Step 4: Verify trace appears in Langfuse (within 10 seconds)${colors.reset}
  Check for:
  [ ] Trace shows 'knearme-portfolio' as service name
  [ ] chat-completion span visible
  [ ] generateText/generateObject spans for AI calls
  [ ] agent_start event logged
  [ ] agent_decision event logged
  [ ] agent_complete event logged
  [ ] Correlation IDs link all events
  [ ] Token usage visible in trace metadata
  [ ] Cost estimate visible

${colors.cyan}Step 5: Verify agent hierarchy${colors.reset}
  - Click into the trace
  - Verify nested structure shows parent → child relationships
  - Verify all agents that ran are visible

${colors.bright}When all checks pass, mark VERIFY-001 as passing in the PRD.${colors.reset}
`);

  info('Run this script anytime to re-check configuration');
}

main().catch(console.error);
