/**
 * Persistent Memory System for KnearMe Autonomous Agents
 * Uses OpenAI file tools and vector stores for long-term memory
 */

import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

class PersistentMemorySystem {
  constructor(config = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.memoryPath = config.memoryPath || '/Users/aaronbaker/agent-systems-docs/knearme-platform/memory';
    this.vectorStoreId = config.vectorStoreId || 'vs_knearme_agent_memory';
    this.fileStoreId = config.fileStoreId || 'file_knearme_documents';
    
    this.memoryTypes = {
      strategic: 'strategic_decisions_memory.jsonl',
      operational: 'operational_tasks_memory.jsonl', 
      learning: 'agent_learning_memory.jsonl',
      skills: 'skill_library_memory.jsonl',
      performance: 'performance_metrics_memory.jsonl'
    };
    
    this.initializeMemorySystem();
  }

  async initializeMemorySystem() {
    try {
      // Ensure memory directory exists
      await fs.mkdir(this.memoryPath, { recursive: true });
      
      // Initialize memory files
      for (const [type, filename] of Object.entries(this.memoryTypes)) {
        const filepath = path.join(this.memoryPath, filename);
        try {
          await fs.access(filepath);
        } catch {
          await fs.writeFile(filepath, '');
          console.log(`📝 Initialized ${type} memory: ${filename}`);
        }
      }
      
      // Initialize vector store for semantic search
      await this.initializeVectorStore();
      
      console.log('🧠 Persistent Memory System initialized');
    } catch (error) {
      console.error('❌ Memory system initialization failed:', error.message);
    }
  }

  async initializeVectorStore() {
    try {
      // Check if vector store exists
      const vectorStores = await this.openai.beta.vectorStores.list();
      const existingStore = vectorStores.data.find(vs => vs.id === this.vectorStoreId);
      
      if (!existingStore) {
        // Create new vector store for agent memory
        const vectorStore = await this.openai.beta.vectorStores.create({
          name: "KnearMe Agent Memory",
          metadata: {
            purpose: "Agent long-term memory and knowledge storage",
            created_by: "autonomous_ceo",
            version: "1.0"
          }
        });
        
        this.vectorStoreId = vectorStore.id;
        console.log(`🗄️ Created vector store: ${this.vectorStoreId}`);
      } else {
        console.log(`🗄️ Using existing vector store: ${this.vectorStoreId}`);
      }
    } catch (error) {
      console.error('❌ Vector store initialization failed:', error.message);
    }
  }

  // Store memory with semantic indexing
  async storeMemory(type, content, metadata = {}) {
    const timestamp = new Date().toISOString();
    const memoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      content: content,
      metadata: {
        ...metadata,
        timestamp: timestamp,
        agent: metadata.agent || 'autonomous_ceo',
        importance: metadata.importance || 'medium'
      }
    };

    try {
      // Store in local JSONL file
      const filename = this.memoryTypes[type] || this.memoryTypes.operational;
      const filepath = path.join(this.memoryPath, filename);
      await fs.appendFile(filepath, JSON.stringify(memoryEntry) + '\n');

      // Upload to OpenAI for vector search
      await this.uploadToVectorStore(memoryEntry);

      console.log(`🧠 Stored ${type} memory: ${memoryEntry.id}`);
      return memoryEntry.id;

    } catch (error) {
      console.error(`❌ Failed to store ${type} memory:`, error.message);
      return null;
    }
  }

  async uploadToVectorStore(memoryEntry) {
    try {
      // Create temporary file for upload
      const tempFile = path.join(this.memoryPath, `temp_${memoryEntry.id}.txt`);
      const content = `Memory Type: ${memoryEntry.type}\nTimestamp: ${memoryEntry.metadata.timestamp}\nAgent: ${memoryEntry.metadata.agent}\nImportance: ${memoryEntry.metadata.importance}\n\nContent: ${memoryEntry.content}`;
      
      await fs.writeFile(tempFile, content);
      
      // Upload to OpenAI
      const file = await this.openai.files.create({
        file: await fs.createReadStream(tempFile),
        purpose: 'assistants'
      });

      // Add to vector store
      await this.openai.beta.vectorStores.files.create(this.vectorStoreId, {
        file_id: file.id
      });

      // Clean up temp file
      await fs.unlink(tempFile);

      console.log(`📤 Uploaded memory to vector store: ${file.id}`);
      return file.id;

    } catch (error) {
      console.error('❌ Vector store upload failed:', error.message);
      return null;
    }
  }

  // Retrieve memories with semantic search
  async retrieveMemories(query, type = null, limit = 10) {
    try {
      const memories = [];
      
      // Read from local files first
      const filesToSearch = type ? [this.memoryTypes[type]] : Object.values(this.memoryTypes);
      
      for (const filename of filesToSearch) {
        const filepath = path.join(this.memoryPath, filename);
        try {
          const content = await fs.readFile(filepath, 'utf-8');
          const lines = content.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const memory = JSON.parse(line);
              if (memory.content.toLowerCase().includes(query.toLowerCase())) {
                memories.push(memory);
              }
            } catch (parseError) {
              // Skip invalid JSON lines
            }
          }
        } catch (fileError) {
          // Skip missing files
        }
      }

      // Sort by timestamp (newest first) and limit
      return memories
        .sort((a, b) => new Date(b.metadata.timestamp) - new Date(a.metadata.timestamp))
        .slice(0, limit);

    } catch (error) {
      console.error('❌ Memory retrieval failed:', error.message);
      return [];
    }
  }

  // Get memory statistics
  async getMemoryStats() {
    const stats = {
      total_memories: 0,
      by_type: {},
      by_importance: { high: 0, medium: 0, low: 0 },
      recent_activity: 0
    };

    try {
      for (const [type, filename] of Object.entries(this.memoryTypes)) {
        const filepath = path.join(this.memoryPath, filename);
        try {
          const content = await fs.readFile(filepath, 'utf-8');
          const lines = content.split('\n').filter(line => line.trim());
          const count = lines.length;
          
          stats.by_type[type] = count;
          stats.total_memories += count;

          // Count by importance and recent activity
          for (const line of lines) {
            try {
              const memory = JSON.parse(line);
              const importance = memory.metadata.importance || 'medium';
              stats.by_importance[importance] = (stats.by_importance[importance] || 0) + 1;
              
              // Count memories from last 24 hours
              const memoryTime = new Date(memory.metadata.timestamp);
              const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
              if (memoryTime > dayAgo) {
                stats.recent_activity++;
              }
            } catch (parseError) {
              // Skip invalid entries
            }
          }
        } catch (fileError) {
          stats.by_type[type] = 0;
        }
      }

      return stats;
    } catch (error) {
      console.error('❌ Memory stats failed:', error.message);
      return stats;
    }
  }

  // Backup memory system
  async backupMemory() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.memoryPath, 'backups', timestamp);
    
    try {
      await fs.mkdir(backupDir, { recursive: true });
      
      // Copy all memory files
      for (const filename of Object.values(this.memoryTypes)) {
        const srcPath = path.join(this.memoryPath, filename);
        const destPath = path.join(backupDir, filename);
        try {
          await fs.copyFile(srcPath, destPath);
        } catch (copyError) {
          // Skip missing files
        }
      }
      
      console.log(`💾 Memory backup created: ${backupDir}`);
      return backupDir;
      
    } catch (error) {
      console.error('❌ Memory backup failed:', error.message);
      return null;
    }
  }

  // Clean old memories (retention policy)
  async cleanOldMemories(retentionDays = 90) {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      let cleanedCount = 0;

      for (const [type, filename] of Object.entries(this.memoryTypes)) {
        const filepath = path.join(this.memoryPath, filename);
        try {
          const content = await fs.readFile(filepath, 'utf-8');
          const lines = content.split('\n').filter(line => line.trim());
          const filteredLines = [];

          for (const line of lines) {
            try {
              const memory = JSON.parse(line);
              const memoryDate = new Date(memory.metadata.timestamp);
              
              // Keep memories that are newer than cutoff or marked as high importance
              if (memoryDate > cutoffDate || memory.metadata.importance === 'high') {
                filteredLines.push(line);
              } else {
                cleanedCount++;
              }
            } catch (parseError) {
              // Keep invalid entries as-is
              filteredLines.push(line);
            }
          }

          // Write back filtered content
          await fs.writeFile(filepath, filteredLines.join('\n') + '\n');
          
        } catch (fileError) {
          // Skip missing files
        }
      }

      console.log(`🧹 Cleaned ${cleanedCount} old memories (older than ${retentionDays} days)`);
      return cleanedCount;

    } catch (error) {
      console.error('❌ Memory cleanup failed:', error.message);
      return 0;
    }
  }

  // Get system status
  getSystemStatus() {
    return {
      memory_path: this.memoryPath,
      vector_store_id: this.vectorStoreId,
      file_store_id: this.fileStoreId,
      memory_types: Object.keys(this.memoryTypes),
      openai_available: !!process.env.OPENAI_API_KEY,
      status: 'operational'
    };
  }
}

export { PersistentMemorySystem };