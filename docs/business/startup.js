#!/usr/bin/env node

/**
 * KnearMe Autonomous Platform Startup
 * Initializes all systems and begins 24/7 autonomous operations
 */

import { AgentPersistenceSystem } from './systems/agent-persistence.js';
import { PersistentMemorySystem } from './systems/memory-system.js';
import { SkillLibrary } from './systems/skill-library.js';
import { AutonomousCEOAgent } from './agents/autonomous-ceo-agent.js';

class KnearMePlatform {
  constructor() {
    this.memorySystem = new PersistentMemorySystem();
    this.skillLibrary = new SkillLibrary({ memorySystem: this.memorySystem });
    this.persistenceSystem = new AgentPersistenceSystem();
    this.ceoAgent = new AutonomousCEOAgent();
    
    this.startupTime = new Date();
    this.operationalMode = 'autonomous_24_7';
  }

  async initialize() {
    console.log('🏢 KNEARME AUTONOMOUS PLATFORM STARTUP');
    console.log('=' .repeat(50));
    console.log(`🕐 Startup Time: ${this.startupTime.toISOString()}`);
    console.log(`🤖 Mode: ${this.operationalMode}`);
    
    try {
      // Initialize core systems
      console.log('\n📚 Initializing Memory System...');
      await this.memorySystem.initializeMemorySystem();
      
      console.log('\n🛠️ Initializing Skill Library...');
      await this.skillLibrary.initializeSkillLibrary();
      
      console.log('\n🔄 Initializing Agent Persistence...');
      await this.persistenceSystem.initializePersistenceSystem();
      
      // Record startup in memory
      await this.memorySystem.storeMemory('operational',
        'KnearMe Autonomous Platform initialized successfully',
        {
          startup_time: this.startupTime.toISOString(),
          mode: this.operationalMode,
          type: 'platform_startup',
          importance: 'high'
        }
      );
      
      // Schedule CEO to check for blocked tasks from interactive session
      console.log('\n🤖 Starting Autonomous CEO Operations...');
      await this.scheduleInitialCEOTasks();
      
      // Start agent team
      console.log('\n👥 Starting Agent Team...');
      await this.persistenceSystem.startAllAgents();
      
      // Schedule periodic operations
      this.schedulePeriodicOperations();
      
      console.log('\n✅ KNEARME PLATFORM OPERATIONAL');
      console.log('🚀 Autonomous business building commenced');
      console.log('📊 Monitor via memory system and skill library');
      
      return true;
      
    } catch (error) {
      console.error('💥 Platform initialization failed:', error.message);
      return false;
    }
  }

  async scheduleInitialCEOTasks() {
    // Check for any tasks that need manual intervention (2FA, etc.)
    await this.memorySystem.storeMemory('strategic',
      'CEO reviewing any blocked tasks requiring manual intervention (2FA, account setups, etc.)',
      {
        type: 'task_review',
        importance: 'high',
        requires_human: false // CEO will handle autonomously where possible
      }
    );

    // Schedule CEO to continue work using Claude Code and Gemini CLI
    const continuousWorkPlan = `
AUTONOMOUS CEO CONTINUOUS OPERATION PLAN

Since this interactive session will end, the CEO must continue operations using:

1. CLAUDE CODE INTEGRATION
   - Use Claude Code via command line for all development tasks
   - Command: /Users/aaronbaker/.claude/local/claude -p "task prompt" --non-interactive
   - Available for: file operations, research, code generation, documentation

2. GEMINI CLI INTEGRATION  
   - Use Gemini CLI for research and analysis
   - Available for: market research, competitive analysis, content generation
   - Command: gemini "research query" --format detailed

3. BLOCKED TASKS HANDLING
   - Log any tasks requiring 2FA or manual setup
   - Schedule these for human review
   - Continue with available autonomous tasks
   - Never wait - always have alternative work

4. CONTINUOUS IMPROVEMENT
   - Self-improvement cycles every 24 hours
   - Skill library expansion
   - Memory system optimization
   - Performance analysis and enhancement

5. BUSINESS DEVELOPMENT PRIORITIES
   - Contractor research and outreach automation
   - Platform feature development
   - Market analysis and competitive intelligence
   - Revenue optimization strategies

Execute this plan immediately and maintain 24/7 operations.`;

    // Record this plan as a high-priority skill
    const planSkillId = await this.skillLibrary.recordSkill(
      'continuous_autonomous_operation',
      'CEO continuous operation plan for autonomous business building',
      continuousWorkPlan,
      'CEO operating autonomously 24/7 using Claude Code and Gemini CLI'
    );

    // Auto-validate and activate this critical skill
    await this.skillLibrary.autoValidateSkill(planSkillId);

    console.log(`📋 CEO continuous operation plan recorded: ${planSkillId}`);
  }

  schedulePeriodicOperations() {
    // Daily CEO planning cycle (every 24 hours)
    setInterval(async () => {
      await this.dailyCEOCycle();
    }, 24 * 60 * 60 * 1000);

    // Hourly progress check
    setInterval(async () => {
      await this.hourlyProgressCheck();
    }, 60 * 60 * 1000);

    // Memory system maintenance (every 6 hours)
    setInterval(async () => {
      await this.memoryMaintenance();
    }, 6 * 60 * 60 * 1000);

    console.log('⏰ Periodic operations scheduled');
  }

  async dailyCEOCycle() {
    console.log('📅 Daily CEO Planning Cycle');
    
    // CEO reviews performance and plans next 24 hours
    const dailyPlan = `
DAILY CEO AUTONOMOUS PLANNING CYCLE

1. PERFORMANCE REVIEW
   - Analyze yesterday's achievements
   - Review skill execution statistics
   - Assess memory system insights
   - Identify improvement opportunities

2. STRATEGIC PLANNING
   - Update business priorities
   - Analyze market conditions
   - Plan contractor outreach initiatives
   - Schedule platform development tasks

3. RESOURCE ALLOCATION
   - Optimize agent workloads
   - Prioritize skill development
   - Allocate Claude Code time
   - Plan Gemini research tasks

4. EXECUTION SCHEDULE
   - Define today's objectives
   - Schedule skill executions
   - Plan improvement cycles
   - Set performance targets

Execute this planning cycle and record results in memory system.`;

    // Execute via skill library
    await this.skillLibrary.executeSkill('continuous_autonomous_operation', {
      cycle_type: 'daily_planning',
      plan: dailyPlan
    });

    await this.memorySystem.storeMemory('strategic',
      'Daily CEO planning cycle completed',
      {
        type: 'daily_planning',
        importance: 'high'
      }
    );
  }

  async hourlyProgressCheck() {
    const stats = this.persistenceSystem.getSystemStats();
    const memoryStats = await this.memorySystem.getMemoryStats();
    const skillStats = this.skillLibrary.getLibraryStats();

    await this.memorySystem.storeMemory('performance',
      `Hourly system check: ${stats.running_agents}/${stats.total_agents} agents, ${memoryStats.total_memories} memories, ${skillStats.total_skills} skills`,
      {
        system_stats: stats,
        memory_stats: memoryStats,
        skill_stats: skillStats,
        type: 'hourly_check',
        importance: 'low'
      }
    );

    // Check for any critical issues
    if (stats.running_agents < stats.total_agents) {
      console.log(`⚠️ Agent availability issue: ${stats.running_agents}/${stats.total_agents} running`);
    }
  }

  async memoryMaintenance() {
    console.log('🧹 Memory system maintenance');
    
    // Backup memory
    await this.memorySystem.backupMemory();
    
    // Clean old memories (keep 90 days)
    const cleanedCount = await this.memorySystem.cleanOldMemories(90);
    
    await this.memorySystem.storeMemory('operational',
      `Memory maintenance completed: ${cleanedCount} old memories cleaned`,
      {
        type: 'maintenance',
        importance: 'low'
      }
    );
  }

  // Handle graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down KnearMe Platform...');
    
    // Stop all agents
    await this.persistenceSystem.stopAllAgents();
    
    // Final memory backup
    await this.memorySystem.backupMemory();
    
    // Record shutdown
    await this.memorySystem.storeMemory('operational',
      'KnearMe Platform shutdown completed',
      {
        shutdown_time: new Date().toISOString(),
        type: 'platform_shutdown',
        importance: 'high'
      }
    );
    
    console.log('✅ Platform shutdown complete');
  }

  getStatus() {
    return {
      platform: 'KnearMe Autonomous Business',
      mode: this.operationalMode,
      startup_time: this.startupTime,
      uptime: Date.now() - this.startupTime.getTime(),
      systems: {
        memory: this.memorySystem.getSystemStatus(),
        skills: this.skillLibrary.getSystemStatus(),
        persistence: this.persistenceSystem.getSystemStatus()
      }
    };
  }
}

// Handle process signals for graceful shutdown
const platform = new KnearMePlatform();

process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await platform.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await platform.shutdown();
  process.exit(0);
});

// Start the platform
if (import.meta.url === `file://${process.argv[1]}`) {
  platform.initialize().then(success => {
    if (success) {
      console.log('\n🎯 KnearMe Platform running autonomously');
      console.log('📱 Status available via platform.getStatus()');
      
      // Keep process alive
      setInterval(() => {
        // Heartbeat every 5 minutes
        console.log(`💓 Platform heartbeat: ${new Date().toISOString()}`);
      }, 5 * 60 * 1000);
      
    } else {
      console.error('💥 Platform startup failed');
      process.exit(1);
    }
  });
}

export { KnearMePlatform };