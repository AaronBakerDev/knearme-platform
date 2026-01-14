/**
 * Skill Library System for KnearMe Autonomous Agents
 * Records, stores, and replays learned skills for efficient automation
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { PersistentMemorySystem } from './memory-system.js';

class SkillLibrary {
  constructor(config = {}) {
    this.skillPath = config.skillPath || '/Users/aaronbaker/agent-systems-docs/knearme-platform/skills';
    this.memorySystem = config.memorySystem || new PersistentMemorySystem();
    this.claudePath = config.claudePath || '/Users/aaronbaker/.claude/local/claude';
    
    this.skills = new Map();
    this.executionStats = new Map();
    
    this.initializeSkillLibrary();
  }

  async initializeSkillLibrary() {
    try {
      // Create skills directory structure
      await fs.mkdir(this.skillPath, { recursive: true });
      await fs.mkdir(path.join(this.skillPath, 'recorded'), { recursive: true });
      await fs.mkdir(path.join(this.skillPath, 'validated'), { recursive: true });
      await fs.mkdir(path.join(this.skillPath, 'templates'), { recursive: true });
      
      // Load existing skills
      await this.loadSkills();
      
      console.log('🛠️ Skill Library initialized');
      console.log(`📚 Loaded ${this.skills.size} skills`);
      
    } catch (error) {
      console.error('❌ Skill library initialization failed:', error.message);
    }
  }

  async loadSkills() {
    try {
      const validatedPath = path.join(this.skillPath, 'validated');
      const skillFiles = await fs.readdir(validatedPath).catch(() => []);
      
      for (const filename of skillFiles) {
        if (filename.endsWith('.json')) {
          try {
            const skillPath = path.join(validatedPath, filename);
            const skillContent = await fs.readFile(skillPath, 'utf-8');
            const skill = JSON.parse(skillContent);
            
            this.skills.set(skill.id, skill);
            this.executionStats.set(skill.id, {
              total_executions: skill.metadata?.total_executions || 0,
              success_count: skill.metadata?.success_count || 0,
              failure_count: skill.metadata?.failure_count || 0,
              avg_execution_time: skill.metadata?.avg_execution_time || 0
            });
            
          } catch (loadError) {
            console.error(`❌ Failed to load skill ${filename}:`, loadError.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Skill loading failed:', error.message);
    }
  }

  // Record a new skill from Claude Code execution
  async recordSkill(name, description, task_prompt, success_result) {
    const skill_id = `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const skill = {
      id: skill_id,
      name: name,
      description: description,
      version: 1,
      status: 'recorded',
      created: new Date().toISOString(),
      
      // Core skill definition
      execution: {
        type: 'claude_code_delegation',
        prompt: task_prompt,
        expected_outcome: success_result,
        timeout_minutes: 10
      },
      
      // Skill metadata
      metadata: {
        created_by: 'autonomous_ceo',
        domain: 'business_automation',
        complexity: 'medium',
        estimated_tokens: this.estimateTokenUsage(task_prompt),
        total_executions: 0,
        success_count: 0,
        failure_count: 0
      },
      
      // Validation requirements
      validation: {
        requires_review: true,
        test_cases: [],
        validation_status: 'pending'
      }
    };

    try {
      // Save to recorded skills
      const recordedPath = path.join(this.skillPath, 'recorded', `${skill_id}.json`);
      await fs.writeFile(recordedPath, JSON.stringify(skill, null, 2));
      
      // Store in memory system
      await this.memorySystem.storeMemory('skills', 
        `Recorded new skill: ${name} - ${description}`,
        { 
          skill_id: skill_id,
          type: 'skill_creation',
          importance: 'high'
        }
      );
      
      console.log(`📝 Recorded new skill: ${skill_id} (${name})`);
      return skill_id;
      
    } catch (error) {
      console.error('❌ Skill recording failed:', error.message);
      return null;
    }
  }

  // Validate and promote skill from recorded to validated
  async validateSkill(skill_id, validation_notes = '') {
    try {
      const recordedPath = path.join(this.skillPath, 'recorded', `${skill_id}.json`);
      const skillContent = await fs.readFile(recordedPath, 'utf-8');
      const skill = JSON.parse(skillContent);
      
      // Update skill status
      skill.status = 'validated';
      skill.validation.validation_status = 'approved';
      skill.validation.validated_at = new Date().toISOString();
      skill.validation.validation_notes = validation_notes;
      
      // Move to validated directory
      const validatedPath = path.join(this.skillPath, 'validated', `${skill_id}.json`);
      await fs.writeFile(validatedPath, JSON.stringify(skill, null, 2));
      await fs.unlink(recordedPath);
      
      // Add to active skills
      this.skills.set(skill_id, skill);
      this.executionStats.set(skill_id, {
        total_executions: 0,
        success_count: 0,
        failure_count: 0,
        avg_execution_time: 0
      });
      
      // Store validation in memory
      await this.memorySystem.storeMemory('skills',
        `Validated skill: ${skill.name} - Ready for autonomous execution`,
        {
          skill_id: skill_id,
          type: 'skill_validation',
          importance: 'high'
        }
      );
      
      console.log(`✅ Validated skill: ${skill_id} (${skill.name})`);
      return true;
      
    } catch (error) {
      console.error('❌ Skill validation failed:', error.message);
      return false;
    }
  }

  // Execute a validated skill
  async executeSkill(skill_id, context = {}) {
    const startTime = Date.now();
    
    try {
      const skill = this.skills.get(skill_id);
      if (!skill) {
        throw new Error(`Skill not found: ${skill_id}`);
      }
      
      if (skill.status !== 'validated') {
        throw new Error(`Skill not validated: ${skill_id}`);
      }
      
      console.log(`🚀 Executing skill: ${skill.name}`);
      
      // Prepare execution context
      const execution_prompt = this.buildExecutionPrompt(skill, context);
      
      // Execute via Claude Code
      const result = await this.executeViaClaudeCode(execution_prompt);
      
      const execution_time = Date.now() - startTime;
      
      // Update execution statistics
      await this.updateExecutionStats(skill_id, true, execution_time);
      
      // Store execution in memory
      await this.memorySystem.storeMemory('skills',
        `Executed skill ${skill.name}: ${result.success ? 'SUCCESS' : 'FAILURE'}`,
        {
          skill_id: skill_id,
          execution_time_ms: execution_time,
          type: 'skill_execution',
          importance: 'medium'
        }
      );
      
      console.log(`✅ Skill executed successfully: ${skill.name} (${execution_time}ms)`);
      return {
        skill_id: skill_id,
        success: true,
        result: result,
        execution_time: execution_time
      };
      
    } catch (error) {
      const execution_time = Date.now() - startTime;
      await this.updateExecutionStats(skill_id, false, execution_time);
      
      console.error(`❌ Skill execution failed: ${error.message}`);
      return {
        skill_id: skill_id,
        success: false,
        error: error.message,
        execution_time: execution_time
      };
    }
  }

  buildExecutionPrompt(skill, context) {
    return `
SKILL EXECUTION REQUEST

SKILL: ${skill.name}
DESCRIPTION: ${skill.description}
VERSION: ${skill.version}

ORIGINAL PROMPT:
${skill.execution.prompt}

EXECUTION CONTEXT:
${JSON.stringify(context, null, 2)}

EXPECTED OUTCOME:
${skill.execution.expected_outcome}

INSTRUCTIONS:
1. Execute this skill based on the original prompt and current context
2. Adapt the execution to the current situation while maintaining core functionality
3. Provide detailed results and any relevant outputs
4. Report success/failure status clearly

This is an autonomous skill execution - proceed with full authority.
`;
  }

  async executeViaClaudeCode(prompt) {
    try {
      const command = `${this.claudePath} -p "${prompt.replace(/"/g, '\\"')}" --non-interactive`;
      const result = execSync(command, {
        encoding: 'utf-8',
        timeout: 600000, // 10 minutes
        cwd: '/Users/aaronbaker/agent-systems-docs/knearme-platform'
      });
      
      return {
        success: true,
        output: result,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async updateExecutionStats(skill_id, success, execution_time) {
    try {
      const stats = this.executionStats.get(skill_id) || {
        total_executions: 0,
        success_count: 0,
        failure_count: 0,
        avg_execution_time: 0
      };
      
      stats.total_executions++;
      if (success) {
        stats.success_count++;
      } else {
        stats.failure_count++;
      }
      
      // Update average execution time
      stats.avg_execution_time = (stats.avg_execution_time * (stats.total_executions - 1) + execution_time) / stats.total_executions;
      
      this.executionStats.set(skill_id, stats);
      
      // Update skill file with new stats
      const skill = this.skills.get(skill_id);
      if (skill) {
        skill.metadata = { ...skill.metadata, ...stats };
        const skillPath = path.join(this.skillPath, 'validated', `${skill_id}.json`);
        await fs.writeFile(skillPath, JSON.stringify(skill, null, 2));
      }
      
    } catch (error) {
      console.error('❌ Failed to update execution stats:', error.message);
    }
  }

  // Search skills by query
  async searchSkills(query, limit = 10) {
    const results = [];
    
    for (const [skill_id, skill] of this.skills) {
      const searchText = `${skill.name} ${skill.description} ${skill.metadata.domain}`.toLowerCase();
      if (searchText.includes(query.toLowerCase())) {
        const stats = this.executionStats.get(skill_id) || {};
        results.push({
          skill_id: skill_id,
          name: skill.name,
          description: skill.description,
          success_rate: stats.total_executions > 0 ? (stats.success_count / stats.total_executions) : 0,
          total_executions: stats.total_executions || 0,
          avg_execution_time: stats.avg_execution_time || 0
        });
      }
    }
    
    // Sort by success rate and execution count
    return results
      .sort((a, b) => {
        const scoreA = a.success_rate * Math.log(a.total_executions + 1);
        const scoreB = b.success_rate * Math.log(b.total_executions + 1);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  // Get library statistics
  getLibraryStats() {
    const stats = {
      total_skills: this.skills.size,
      by_status: { validated: 0, recorded: 0 },
      by_domain: {},
      execution_stats: {
        total_executions: 0,
        total_successes: 0,
        total_failures: 0,
        avg_success_rate: 0
      }
    };
    
    let total_executions = 0;
    let total_successes = 0;
    
    for (const [skill_id, skill] of this.skills) {
      stats.by_status[skill.status] = (stats.by_status[skill.status] || 0) + 1;
      stats.by_domain[skill.metadata.domain] = (stats.by_domain[skill.metadata.domain] || 0) + 1;
      
      const execStats = this.executionStats.get(skill_id) || {};
      total_executions += execStats.total_executions || 0;
      total_successes += execStats.success_count || 0;
    }
    
    stats.execution_stats.total_executions = total_executions;
    stats.execution_stats.total_successes = total_successes;
    stats.execution_stats.total_failures = total_executions - total_successes;
    stats.execution_stats.avg_success_rate = total_executions > 0 ? (total_successes / total_executions) : 0;
    
    return stats;
  }

  estimateTokenUsage(prompt) {
    // Rough estimate: 4 characters per token
    return Math.ceil(prompt.length / 4);
  }

  // Auto-validate simple skills
  async autoValidateSkill(skill_id) {
    try {
      const skill = this.skills.get(skill_id) || await this.loadSkillById(skill_id);
      
      // Simple validation criteria
      const autoValidationCriteria = [
        skill.metadata.complexity === 'low',
        skill.metadata.estimated_tokens < 1000,
        skill.name && skill.description && skill.execution.prompt
      ];
      
      if (autoValidationCriteria.every(criterion => criterion)) {
        await this.validateSkill(skill_id, 'Auto-validated: meets simple skill criteria');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Auto-validation failed:', error.message);
      return false;
    }
  }

  async loadSkillById(skill_id) {
    try {
      const recordedPath = path.join(this.skillPath, 'recorded', `${skill_id}.json`);
      const skillContent = await fs.readFile(recordedPath, 'utf-8');
      return JSON.parse(skillContent);
    } catch (error) {
      return null;
    }
  }

  getSystemStatus() {
    return {
      skill_path: this.skillPath,
      total_skills: this.skills.size,
      total_executions: Array.from(this.executionStats.values()).reduce((sum, stats) => sum + (stats.total_executions || 0), 0),
      claude_available: !!this.claudePath,
      memory_system: this.memorySystem.getSystemStatus(),
      status: 'operational'
    };
  }
}

export { SkillLibrary };