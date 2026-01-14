#!/usr/bin/env node

/**
 * Run Task Agents - Execute Claude Code task agents to build KnearMe business
 */

import { ClaudeTaskAgents } from '../agents/claude-task-agents.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function main() {
  console.log('🏢 KNEARME BUSINESS BUILDING INITIATIVE');
  console.log('Using Claude Code to build complete business structure');
  console.log('='.repeat(60));

  const config = {
    claudePath: '/Users/aaronbaker/.claude/local/claude',
    projectRoot: projectRoot
  };

  const taskAgents = new ClaudeTaskAgents(config);

  // Test Claude availability first
  const claudeAvailable = await taskAgents.testClaudeAvailability();
  if (!claudeAvailable) {
    console.error('❌ Cannot proceed without Claude Code access');
    process.exit(1);
  }

  try {
    // Execute all business building tasks
    console.log('\n🚀 Starting business building tasks...');
    const results = await taskAgents.executeAllTasks();

    // Summary report
    console.log('\n📈 BUSINESS BUILDING COMPLETE');
    console.log('='.repeat(40));
    console.log('✅ Documentation updated for KnearMe platform');
    console.log('✅ Marketing department created');  
    console.log('✅ Sales department created');
    console.log('✅ Customer service department created');
    console.log('✅ Web development department created');
    console.log('✅ Project structure updated');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Review updated documentation');
    console.log('2. Test agent department coordination');
    console.log('3. Begin contractor outreach');
    console.log('4. Start platform development');
    console.log('5. Launch beta with first contractors');

    console.log('\n🏢 KnearMe is ready to transform contractor discovery!');

  } catch (error) {
    console.error('💥 Business building failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'docs':
    // Only update documentation
    const taskAgents = new ClaudeTaskAgents({
      claudePath: '/Users/aaronbaker/.claude/local/claude',
      projectRoot: projectRoot
    });
    taskAgents.executeDocumentationUpdate().then(() => {
      console.log('📝 Documentation update complete');
    });
    break;
    
  case 'departments':
    // Only build departments
    const deptAgents = new ClaudeTaskAgents({
      claudePath: '/Users/aaronbaker/.claude/local/claude', 
      projectRoot: projectRoot
    });
    Promise.all([
      deptAgents.buildMarketingDepartment(),
      deptAgents.buildSalesDepartment(),
      deptAgents.buildCustomerService(),
      deptAgents.buildWebDevelopment()
    ]).then(() => {
      console.log('🏢 All departments created');
    });
    break;
    
  default:
    // Run everything
    main().catch(console.error);
}