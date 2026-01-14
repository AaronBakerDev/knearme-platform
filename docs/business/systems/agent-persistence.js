/**
 * Agent Persistence System - Keep agents alive 24/7
 * Manages agent lifecycle, health monitoring, and automatic recovery
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { PersistentMemorySystem } from './memory-system.js';
import { SkillLibrary } from './skill-library.js';

class AgentPersistenceSystem {
  constructor(config = {}) {
    this.agentPath = config.agentPath || '/Users/aaronbaker/agent-systems-docs/knearme-platform/agents';
    this.pidPath = config.pidPath || '/Users/aaronbaker/agent-systems-docs/knearme-platform/pids';
    this.logPath = config.logPath || '/Users/aaronbaker/agent-systems-docs/knearme-platform/logs';
    
    this.memorySystem = new PersistentMemorySystem();
    this.skillLibrary = new SkillLibrary({ memorySystem: this.memorySystem });
    
    this.agents = new Map(); // Active agent processes
    this.agentConfigs = new Map(); // Agent configurations
    this.healthChecks = new Map(); // Health check intervals
    
    this.monitoringInterval = 30000; // 30 seconds
    this.maxRestarts = 5;
    this.restartDelay = 5000; // 5 seconds
    
    this.initializePersistenceSystem();
  }

  async initializePersistenceSystem() {
    try {
      // Create necessary directories
      await fs.mkdir(this.pidPath, { recursive: true });
      await fs.mkdir(this.logPath, { recursive: true });
      
      // Load agent configurations
      await this.loadAgentConfigurations();
      
      // Start monitoring system
      this.startMonitoring();
      
      console.log('🔄 Agent Persistence System initialized');
      console.log(`👥 Monitoring ${this.agentConfigs.size} agent types`);
      
    } catch (error) {
      console.error('❌ Persistence system initialization failed:', error.message);
    }
  }

  async loadAgentConfigurations() {
    // Define core agent configurations
    const agentConfigs = [
      {
        id: 'autonomous_ceo',
        name: 'Autonomous CEO',
        script: 'autonomous-ceo-agent.js',
        priority: 'critical',
        restart_policy: 'always',
        max_memory_mb: 512,
        environment: {
          AGENT_ROLE: 'ceo',
          DECISION_AUTHORITY: 'high',
          AUTONOMOUS_MODE: 'true'
        }
      },
      {
        id: 'customer_interaction',
        name: 'Customer Interaction Manager', 
        script: 'customer-interaction-agents.js',
        priority: 'high',
        restart_policy: 'on_failure',
        max_memory_mb: 256,
        environment: {
          AGENT_ROLE: 'customer_service',
          RESPONSE_TIME_TARGET: '2000'
        }
      },
      {
        id: 'claude_task_manager',
        name: 'Claude Task Manager',
        script: 'claude-task-agents.js',
        priority: 'high', 
        restart_policy: 'always',
        max_memory_mb: 128,
        environment: {
          AGENT_ROLE: 'task_execution',
          CLAUDE_PATH: '/Users/aaronbaker/.claude/local/claude'
        }
      }
    ];

    for (const config of agentConfigs) {
      this.agentConfigs.set(config.id, config);
    }
  }

  // Start an agent process
  async startAgent(agentId) {
    try {
      const config = this.agentConfigs.get(agentId);
      if (!config) {
        throw new Error(`Agent configuration not found: ${agentId}`);
      }

      // Check if already running
      if (this.agents.has(agentId)) {
        console.log(`⚠️ Agent already running: ${agentId}`);
        return false;
      }

      const scriptPath = path.join(this.agentPath, config.script);
      const logFile = path.join(this.logPath, `${agentId}.log`);
      const pidFile = path.join(this.pidPath, `${agentId}.pid`);

      // Ensure log file exists
      await fs.writeFile(logFile, `Agent ${agentId} starting at ${new Date().toISOString()}\n`, { flag: 'a' });

      // Start agent process
      const child = spawn('node', [scriptPath], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          ...config.environment,
          AGENT_ID: agentId,
          PERSISTENCE_ENABLED: 'true'
        }
      });

      // Save PID
      await fs.writeFile(pidFile, child.pid.toString());

      // Set up logging
      child.stdout.on('data', async (data) => {
        await fs.appendFile(logFile, `[STDOUT] ${data}`, { flag: 'a' });
      });

      child.stderr.on('data', async (data) => {
        await fs.appendFile(logFile, `[STDERR] ${data}`, { flag: 'a' });
      });

      // Handle process exit
      child.on('exit', async (code, signal) => {
        console.log(`🔴 Agent ${agentId} exited with code ${code}, signal ${signal}`);
        
        // Remove from active agents
        this.agents.delete(agentId);
        
        // Clean up PID file
        try {
          await fs.unlink(pidFile);
        } catch (unlinkError) {
          // Ignore if file doesn't exist
        }
        
        // Log to memory system
        await this.memorySystem.storeMemory('operational',
          `Agent ${agentId} stopped: code=${code}, signal=${signal}`,
          { agent_id: agentId, type: 'agent_lifecycle', importance: 'high' }
        );

        // Auto-restart if configured
        if (config.restart_policy === 'always' || (config.restart_policy === 'on_failure' && code !== 0)) {
          setTimeout(() => {
            this.restartAgent(agentId);
          }, this.restartDelay);
        }
      });

      // Store agent info
      this.agents.set(agentId, {
        process: child,
        config: config,
        started_at: new Date(),
        restart_count: 0,
        status: 'running'
      });

      // Set up health monitoring
      this.setupHealthCheck(agentId);

      console.log(`✅ Started agent: ${agentId} (PID: ${child.pid})`);
      
      // Log to memory system
      await this.memorySystem.storeMemory('operational',
        `Agent ${agentId} started successfully`,
        { agent_id: agentId, pid: child.pid, type: 'agent_lifecycle', importance: 'high' }
      );

      return true;

    } catch (error) {
      console.error(`❌ Failed to start agent ${agentId}:`, error.message);
      return false;
    }
  }

  // Stop an agent process
  async stopAgent(agentId, force = false) {
    try {
      const agentInfo = this.agents.get(agentId);
      if (!agentInfo) {
        console.log(`⚠️ Agent not running: ${agentId}`);
        return false;
      }

      // Clear health check
      if (this.healthChecks.has(agentId)) {
        clearInterval(this.healthChecks.get(agentId));
        this.healthChecks.delete(agentId);
      }

      // Stop process
      if (force) {
        agentInfo.process.kill('SIGKILL');
      } else {
        agentInfo.process.kill('SIGTERM');
      }

      console.log(`🛑 Stopped agent: ${agentId}`);
      
      // Log to memory system
      await this.memorySystem.storeMemory('operational',
        `Agent ${agentId} stopped by request`,
        { agent_id: agentId, type: 'agent_lifecycle', importance: 'medium' }
      );

      return true;

    } catch (error) {
      console.error(`❌ Failed to stop agent ${agentId}:`, error.message);
      return false;
    }
  }

  // Restart an agent
  async restartAgent(agentId) {
    try {
      const agentInfo = this.agents.get(agentId);
      if (agentInfo) {
        agentInfo.restart_count++;
        
        if (agentInfo.restart_count > this.maxRestarts) {
          console.error(`💥 Agent ${agentId} exceeded max restarts (${this.maxRestarts})`);
          
          await this.memorySystem.storeMemory('operational',
            `Agent ${agentId} exceeded max restarts - DISABLED`,
            { agent_id: agentId, restart_count: agentInfo.restart_count, type: 'agent_failure', importance: 'high' }
          );
          
          return false;
        }
      }

      // Stop existing process
      await this.stopAgent(agentId, true);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, this.restartDelay));
      
      // Start again
      return await this.startAgent(agentId);

    } catch (error) {
      console.error(`❌ Failed to restart agent ${agentId}:`, error.message);
      return false;
    }
  }

  // Set up health monitoring for an agent
  setupHealthCheck(agentId) {
    const interval = setInterval(async () => {
      await this.checkAgentHealth(agentId);
    }, this.monitoringInterval);
    
    this.healthChecks.set(agentId, interval);
  }

  // Check agent health
  async checkAgentHealth(agentId) {
    try {
      const agentInfo = this.agents.get(agentId);
      if (!agentInfo) {
        return;
      }

      const pidFile = path.join(this.pidPath, `${agentId}.pid`);
      
      // Check if PID file exists and process is running
      try {
        const pidContent = await fs.readFile(pidFile, 'utf-8');
        const pid = parseInt(pidContent.trim());
        
        // Check if process exists
        process.kill(pid, 0); // This throws if process doesn't exist
        
        // Process exists, agent is healthy
        agentInfo.status = 'running';
        
      } catch (error) {
        // Process doesn't exist, agent is dead
        console.error(`💀 Agent ${agentId} health check failed: ${error.message}`);
        agentInfo.status = 'dead';
        
        // Remove from active agents and restart
        this.agents.delete(agentId);
        await this.restartAgent(agentId);
      }

    } catch (error) {
      console.error(`❌ Health check failed for ${agentId}:`, error.message);
    }
  }

  // Start all configured agents
  async startAllAgents() {
    console.log('🚀 Starting all agents...');
    
    const results = [];
    for (const agentId of this.agentConfigs.keys()) {
      const result = await this.startAgent(agentId);
      results.push({ agentId, success: result });
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Started ${successCount}/${results.length} agents`);
    
    // Log to memory system
    await this.memorySystem.storeMemory('operational',
      `Started ${successCount}/${results.length} agents on system startup`,
      { type: 'system_startup', importance: 'high' }
    );
    
    return results;
  }

  // Stop all agents
  async stopAllAgents() {
    console.log('🛑 Stopping all agents...');
    
    const results = [];
    for (const agentId of this.agents.keys()) {
      const result = await this.stopAgent(agentId);
      results.push({ agentId, success: result });
    }
    
    // Clear all health checks
    for (const interval of this.healthChecks.values()) {
      clearInterval(interval);
    }
    this.healthChecks.clear();
    
    console.log(`🛑 Stopped ${results.filter(r => r.success).length}/${results.length} agents`);
    return results;
  }

  // Start monitoring system
  startMonitoring() {
    // Monitor overall system health every minute
    setInterval(async () => {
      await this.performSystemHealthCheck();
    }, 60000);
    
    console.log('👁️ Agent monitoring system started');
  }

  async performSystemHealthCheck() {
    try {
      const stats = this.getSystemStats();
      
      // Check for critical agent failures
      const criticalAgentsDown = [];
      for (const [agentId, config] of this.agentConfigs) {
        if (config.priority === 'critical' && !this.agents.has(agentId)) {
          criticalAgentsDown.push(agentId);
        }
      }
      
      if (criticalAgentsDown.length > 0) {
        console.error(`🚨 CRITICAL: ${criticalAgentsDown.length} critical agents down:`, criticalAgentsDown);
        
        // Auto-restart critical agents
        for (const agentId of criticalAgentsDown) {
          await this.startAgent(agentId);
        }
      }
      
      // Log system health
      await this.memorySystem.storeMemory('performance',
        `System health check: ${stats.running_agents}/${stats.total_agents} agents running`,
        { 
          stats: stats,
          critical_issues: criticalAgentsDown.length,
          type: 'health_check',
          importance: criticalAgentsDown.length > 0 ? 'high' : 'low'
        }
      );
      
    } catch (error) {
      console.error('❌ System health check failed:', error.message);
    }
  }

  // Get system statistics
  getSystemStats() {
    const stats = {
      total_agents: this.agentConfigs.size,
      running_agents: this.agents.size,
      agents_by_status: {},
      uptime_info: {},
      memory_usage: process.memoryUsage(),
      system_load: process.cpuUsage()
    };
    
    // Count agents by status
    for (const [agentId, agentInfo] of this.agents) {
      stats.agents_by_status[agentInfo.status] = (stats.agents_by_status[agentInfo.status] || 0) + 1;
      
      // Calculate uptime
      const uptime = Date.now() - agentInfo.started_at.getTime();
      stats.uptime_info[agentId] = {
        uptime_ms: uptime,
        uptime_hours: Math.round(uptime / (1000 * 60 * 60) * 100) / 100,
        restart_count: agentInfo.restart_count
      };
    }
    
    return stats;
  }

  getSystemStatus() {
    return {
      agent_path: this.agentPath,
      pid_path: this.pidPath,
      log_path: this.logPath,
      monitoring_interval: this.monitoringInterval,
      max_restarts: this.maxRestarts,
      system_stats: this.getSystemStats(),
      memory_system: this.memorySystem.getSystemStatus(),
      skill_library: this.skillLibrary.getSystemStatus(),
      status: 'operational'
    };
  }
}

export { AgentPersistenceSystem };