/**
 * Shared Context Types and Utilities.
 *
 * This file contains types and functions that can be used
 * on both client and server. Separate from context-loader.ts
 * to avoid importing server-only Supabase client on the client.
 *
 * @see /src/lib/chat/context-loader.ts for server-side loading
 */

import type { UIMessage } from 'ai';
import type { ExtractedProjectData } from './chat-types';

// ============================================
// Types (shared between client and server)
// ============================================

/**
 * Project data loaded for context.
 * Subset of project fields relevant for AI context.
 */
export interface ProjectContextData {
  id: string;
  title: string | null;
  description: string | null;
  project_type: string | null;
  city: string | null;
  state: string | null;
  materials: string[] | null;
  techniques: string[] | null;
  status: string;
  extractedData: ExtractedProjectData;
  conversationSummary: string | null;
}

/**
 * Business profile context for prompt injection.
 */
export interface BusinessProfileContext {
  businessName?: string | null;
  trade?: string | null;
  services?: string[] | null;
  serviceAreas?: string[] | null;
  city?: string | null;
  state?: string | null;
  differentiators?: string[] | null;
  voice?: string | null;
}

/**
 * Result of loading conversation context.
 */
export interface ContextLoadResult {
  /** Project data for context */
  projectData: ProjectContextData;
  /** Messages to load into chat (full history or recent subset) */
  messages: UIMessage[];
  /** Conversation summary (if using compacted loading) */
  summary: string | null;
  /** Whether full conversation was loaded */
  loadedFully: boolean;
  /** Estimated token count of loaded context */
  estimatedTokens: number;
  /** Total message count in session */
  totalMessageCount: number;
}

// ============================================
// Client-safe Utilities
// ============================================

/**
 * Create a system message containing the conversation summary.
 *
 * Used to inject summary context when loading compacted conversations.
 * This function is pure and can be used on both client and server.
 *
 * @param summary - Conversation summary text
 * @param projectData - Project context data
 * @returns System message with summary context
 */
export function createSummarySystemMessage(
  summary: string,
  projectData: ProjectContextData
): UIMessage {
  const contextParts: string[] = [];

  // Add summary
  contextParts.push('## Previous Conversation Summary');
  contextParts.push(summary);

  // Add project state if available
  if (projectData.title || projectData.project_type) {
    contextParts.push('\n## Current Project State');
    if (projectData.title) {
      contextParts.push(`Title: ${projectData.title}`);
    }
    if (projectData.project_type) {
      contextParts.push(`Type: ${projectData.project_type}`);
    }
    if (projectData.city && projectData.state) {
      contextParts.push(`Location: ${projectData.city}, ${projectData.state}`);
    }
    if (projectData.status) {
      contextParts.push(`Status: ${projectData.status}`);
    }
  }

  return {
    id: 'context-summary',
    role: 'system',
    parts: [{ type: 'text', text: contextParts.join('\n') }],
  };
}

/**
 * Format project data for inclusion in AI prompt.
 *
 * @param projectData - Project context data
 * @returns Formatted string for prompt injection
 */
export function formatProjectDataForPrompt(
  projectData: ProjectContextData
): string {
  const parts: string[] = [];

  if (projectData.title) {
    parts.push(`Project Title: ${projectData.title}`);
  }
  if (projectData.project_type) {
    parts.push(`Project Type: ${projectData.project_type}`);
  }
  if (projectData.city && projectData.state) {
    parts.push(`Location: ${projectData.city}, ${projectData.state}`);
  }
  if (projectData.materials?.length) {
    parts.push(`Materials: ${projectData.materials.join(', ')}`);
  }
  if (projectData.techniques?.length) {
    parts.push(`Techniques: ${projectData.techniques.join(', ')}`);
  }
  if (projectData.status) {
    parts.push(`Status: ${projectData.status}`);
  }

  // Add extracted data if available
  const extracted = projectData.extractedData;
  if (extracted) {
    if (extracted.customer_problem) {
      parts.push(`Customer Problem: ${extracted.customer_problem}`);
    }
    if (extracted.solution_approach) {
      parts.push(`Solution: ${extracted.solution_approach}`);
    }
    if (extracted.challenges) {
      parts.push(`Challenges: ${extracted.challenges}`);
    }
  }

  return parts.length > 0 ? parts.join('\n') : '';
}

/**
 * Format business profile data for inclusion in AI prompt.
 *
 * @param profile - Business profile context data
 * @returns Formatted string for prompt injection
 */
export function formatBusinessProfileForPrompt(
  profile: BusinessProfileContext
): string {
  const parts: string[] = [];

  if (profile.businessName) {
    parts.push(`Company: ${profile.businessName}`);
  }

  if (profile.trade) {
    parts.push(`Trade: ${profile.trade}`);
  }

  const services = Array.isArray(profile.services)
    ? profile.services.filter((item) => item && item.trim())
    : [];
  if (services.length > 0) {
    parts.push(`Services: ${services.join(', ')}`);
  }

  const serviceAreas = Array.isArray(profile.serviceAreas)
    ? profile.serviceAreas.filter((item) => item && item.trim())
    : [];
  if (serviceAreas.length > 0) {
    parts.push(`Service area: ${serviceAreas.join(', ')}`);
  } else if (profile.city && profile.state) {
    parts.push(`Service area: ${profile.city}, ${profile.state}`);
  }

  const differentiators = Array.isArray(profile.differentiators)
    ? profile.differentiators.filter((item) => item && item.trim())
    : [];
  if (differentiators.length > 0) {
    parts.push(`Differentiators: ${differentiators.join('; ')}`);
  }

  if (profile.voice) {
    parts.push(`Voice: ${profile.voice}`);
  }

  return parts.length > 0 ? parts.join('\n') : '';
}
