#!/usr/bin/env tsx
/**
 * Usage Stats Script - View AI cost and usage tracking
 *
 * Displays cumulative AI usage statistics from the ai_usage_log table.
 *
 * Usage:
 *   npm run usage-stats                           # All-time stats
 *   npm run usage-stats -- --since "2025-01-01"   # Since date
 *   npm run usage-stats -- --operation analyze    # Filter by operation
 *
 * @see ai_usage_log table in database
 */

import 'dotenv/config';
import { Command } from 'commander';
import { createSupabaseClient } from '../lib/supabase.js';

// =============================================================================
// CLI Setup
// =============================================================================

const program = new Command();

program
  .name('usage-stats')
  .description('View AI usage and cost statistics')
  .option('--since <date>', 'Only include usage since this date (ISO format)')
  .option('--operation <type>', 'Filter by operation type (analyze|generate)')
  .option('--json', 'Output as JSON')
  .parse(process.argv);

const options = program.opts();

// =============================================================================
// Main Function
// =============================================================================

async function main() {
  const log = (message: string) => {
    if (!options.json) {
      console.log(message);
    }
  };

  try {
    const db = createSupabaseClient();

    log('\n' + '='.repeat(50));
    log('AI USAGE STATISTICS');
    log('='.repeat(50));

    if (options.since) {
      log(`Since: ${options.since}`);
    }
    if (options.operation) {
      log(`Operation: ${options.operation}`);
    }
    log('');

    const stats = await db.getAIUsageStats({
      since: options.since,
      operation: options.operation,
    });

    if (options.json) {
      console.log(JSON.stringify(stats, null, 2));
      return;
    }

    log('SUMMARY');
    log('─'.repeat(30));
    log(`  Total Operations: ${stats.total_operations}`);
    log(`  Total Tokens:     ${stats.total_tokens.toLocaleString()}`);
    log(`  Total Cost:       $${stats.total_cost.toFixed(4)}`);
    log('');

    log('BY OPERATION');
    log('─'.repeat(30));
    for (const [operation, data] of Object.entries(stats.by_operation)) {
      log(`  ${operation}:`);
      log(`    Count:  ${data.count}`);
      log(`    Tokens: ${data.tokens.toLocaleString()}`);
      log(`    Cost:   $${data.cost.toFixed(4)}`);
    }

    log('');
    log('─'.repeat(50));

    // Projection for rollout
    if (stats.total_operations > 0) {
      const avgCostPerOp = stats.total_cost / stats.total_operations;
      const avgTokensPerOp = stats.total_tokens / stats.total_operations;

      log('');
      log('PROJECTIONS (based on current averages)');
      log('─'.repeat(30));
      log(`  Avg cost per operation: $${avgCostPerOp.toFixed(4)}`);
      log(`  Avg tokens per operation: ${Math.round(avgTokensPerOp).toLocaleString()}`);
      log('');
      log('  Cost for 100 contractors:  $' + (avgCostPerOp * 200).toFixed(2) + ' (analyze + generate)');
      log('  Cost for 500 contractors:  $' + (avgCostPerOp * 1000).toFixed(2));
      log('  Cost for 1000 contractors: $' + (avgCostPerOp * 2000).toFixed(2));
    }

    log('\n');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMsg}`);
    process.exit(1);
  }
}

// =============================================================================
// Run
// =============================================================================

main();
