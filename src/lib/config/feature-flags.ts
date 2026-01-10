/**
 * Feature Flag System for Agentic Migration
 *
 * Enables controlled rollout of agentic features with:
 * - Environment variable defaults
 * - Per-contractor overrides
 * - Kill switch for emergencies
 * - A/B testing support
 *
 * @see /docs/philosophy/operational-excellence.md - Resilience Strategy
 * @see /docs/philosophy/implementation-roadmap.md - Phase 0: Foundation
 */

import { logger } from '@/lib/logging';

// =============================================================================
// Types
// =============================================================================

/**
 * Feature flag configuration for agentic migration
 *
 * Hierarchy (highest to lowest priority):
 * 1. Kill switch (in-memory) - immediate disable
 * 2. Blocklist - explicitly disabled contractors
 * 3. Allowlist - explicitly enabled contractors
 * 4. Contractor-level overrides (from DB)
 * 5. Rollout percentage (hash-based deterministic)
 * 6. Environment defaults
 */
export interface AgenticFeatureFlags {
  /** Master switch - disables all agentic features */
  agenticEnabled: boolean;

  /** Phase 1: Discovery Agent for profile setup */
  agenticOnboarding: boolean;

  /** Phase 1: Story Agent for project creation */
  agenticProjectCreation: boolean;

  /** Later: Conversational editing */
  agenticEditing: boolean;

  /** DataForSEO integration for business lookup */
  businessDiscovery: boolean;

  /** Percentage of users in rollout (0-100) */
  rolloutPercentage: number;

  /** Contractors always in agentic flow */
  allowlistContractorIds: string[];

  /** Contractors never in agentic flow */
  blocklistContractorIds: string[];

  /** Below this confidence, suggest form fallback */
  minConversationConfidence: number;

  /** Above this error rate, trigger circuit breaker */
  maxAgentErrorRate: number;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_FLAGS: AgenticFeatureFlags = {
  // ⚠️ TESTING: Set to true for development, use env vars in production
  agenticEnabled: true,
  agenticOnboarding: true,
  agenticProjectCreation: false,
  agenticEditing: false,
  businessDiscovery: true,
  rolloutPercentage: 100, // 100% rollout for testing
  allowlistContractorIds: [],
  blocklistContractorIds: [],
  minConversationConfidence: 0.7,
  maxAgentErrorRate: 0.15,
};

// =============================================================================
// Kill Switch (In-Memory)
// =============================================================================

interface KillSwitchState {
  active: boolean;
  activatedAt: Date | null;
  reason: string | null;
  activatedBy: 'manual' | 'circuit_breaker' | 'error_threshold' | null;
}

let killSwitchState: KillSwitchState = {
  active: false,
  activatedAt: null,
  reason: null,
  activatedBy: null,
};

/**
 * Activate the kill switch - immediately disables all agentic features
 *
 * @param reason - Why the kill switch was activated
 * @param activatedBy - What triggered the activation
 */
export function activateKillSwitch(
  reason: string,
  activatedBy: KillSwitchState['activatedBy']
): void {
  killSwitchState = {
    active: true,
    activatedAt: new Date(),
    reason,
    activatedBy,
  };
  logger.error('[KILL SWITCH] Activated', { reason, activatedBy });
}

/**
 * Deactivate the kill switch - re-enables agentic features
 */
export function deactivateKillSwitch(): void {
  killSwitchState = {
    active: false,
    activatedAt: null,
    reason: null,
    activatedBy: null,
  };
  logger.info('[KILL SWITCH] Deactivated');
}

/**
 * Check if kill switch is active
 */
export function isKillSwitchActive(): boolean {
  return killSwitchState.active;
}

/**
 * Get current kill switch state
 */
export function getKillSwitchState(): Readonly<KillSwitchState> {
  return { ...killSwitchState };
}

// =============================================================================
// Environment Variable Parsing
// =============================================================================

function parseEnvList(envVar: string | undefined): string[] {
  if (!envVar) return [];
  return envVar.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Parse boolean env var - only override if explicitly set
 */
function parseEnvBool(envVar: string | undefined, defaultValue: boolean): boolean {
  if (envVar === undefined || envVar === '') return defaultValue;
  return envVar === 'true';
}

function mergeEnvFlags(base: AgenticFeatureFlags): AgenticFeatureFlags {
  return {
    ...base,
    agenticEnabled: parseEnvBool(process.env.FF_AGENTIC_ENABLED, base.agenticEnabled),
    agenticOnboarding: parseEnvBool(process.env.FF_AGENTIC_ONBOARDING, base.agenticOnboarding),
    agenticProjectCreation: parseEnvBool(process.env.FF_AGENTIC_PROJECT_CREATION, base.agenticProjectCreation),
    agenticEditing: parseEnvBool(process.env.FF_AGENTIC_EDITING, base.agenticEditing),
    businessDiscovery: parseEnvBool(process.env.FF_BUSINESS_DISCOVERY, base.businessDiscovery),
    rolloutPercentage: process.env.FF_ROLLOUT_PERCENTAGE
      ? parseInt(process.env.FF_ROLLOUT_PERCENTAGE, 10)
      : base.rolloutPercentage,
    allowlistContractorIds: process.env.FF_ALLOWLIST
      ? parseEnvList(process.env.FF_ALLOWLIST)
      : base.allowlistContractorIds,
    blocklistContractorIds: process.env.FF_BLOCKLIST
      ? parseEnvList(process.env.FF_BLOCKLIST)
      : base.blocklistContractorIds,
    minConversationConfidence: process.env.FF_MIN_CONFIDENCE
      ? parseFloat(process.env.FF_MIN_CONFIDENCE)
      : base.minConversationConfidence,
    maxAgentErrorRate: process.env.FF_MAX_ERROR_RATE
      ? parseFloat(process.env.FF_MAX_ERROR_RATE)
      : base.maxAgentErrorRate,
  };
}

// =============================================================================
// Deterministic Rollout Hashing
// =============================================================================

/**
 * Generate a deterministic hash for a contractor ID
 *
 * Used to consistently assign contractors to rollout buckets.
 * The same contractor always gets the same hash.
 */
function hashContractorId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// =============================================================================
// Flag Resolution
// =============================================================================

/**
 * Resolve feature flags for a specific contractor
 *
 * Applies the priority hierarchy to determine which flags are active.
 *
 * @param contractorId - The contractor's UUID
 * @param contractorFlags - Optional overrides from the contractor's DB record
 * @returns Resolved feature flags
 *
 * @example
 * ```typescript
 * const flags = await resolveFeatureFlags(contractorId);
 * if (flags.agenticOnboarding) {
 *   // Show conversation-first onboarding
 * } else {
 *   // Show form wizard
 * }
 * ```
 */
export function resolveFeatureFlags(
  contractorId: string,
  contractorFlags?: Partial<AgenticFeatureFlags>
): AgenticFeatureFlags {
  // Start with defaults
  let flags = { ...DEFAULT_FLAGS };

  // Layer 1: Environment variables
  flags = mergeEnvFlags(flags);

  // Layer 2: Check kill switch
  if (isKillSwitchActive()) {
    return { ...flags, agenticEnabled: false };
  }

  // Layer 3: Blocklist check
  if (flags.blocklistContractorIds.includes(contractorId)) {
    return { ...flags, agenticEnabled: false };
  }

  // Layer 4: Allowlist check
  if (flags.allowlistContractorIds.includes(contractorId)) {
    return { ...flags, agenticEnabled: true };
  }

  // Layer 5: Contractor-level overrides
  if (contractorFlags) {
    flags = { ...flags, ...contractorFlags };
  }

  // Layer 6: Rollout percentage (deterministic hash)
  if (flags.agenticEnabled && flags.rolloutPercentage < 100) {
    const hash = hashContractorId(contractorId);
    const inRollout = (hash % 100) < flags.rolloutPercentage;
    if (!inRollout) {
      flags.agenticEnabled = false;
    }
  }

  return flags;
}

// =============================================================================
// A/B Testing
// =============================================================================

export type ExperienceVariant = 'wizard' | 'agentic';

export interface ABTestAssignment {
  variant: ExperienceVariant;
  testId: string;
  assignedAt: Date;
}

/**
 * Assign a contractor to an A/B test variant
 *
 * Deterministic based on contractor ID for consistency.
 *
 * @param contractorId - The contractor's UUID
 * @param testId - Unique identifier for the test
 * @param agenticPercentage - Percentage of traffic to agentic (0-100)
 */
export function assignABVariant(
  contractorId: string,
  testId: string,
  agenticPercentage: number
): ABTestAssignment {
  // Combine contractor and test ID for deterministic assignment
  const combined = `${testId}:${contractorId}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
  }
  const bucket = Math.abs(hash) % 100;

  return {
    variant: bucket < agenticPercentage ? 'agentic' : 'wizard',
    testId,
    assignedAt: new Date(),
  };
}

// =============================================================================
// Quick Check Helpers
// =============================================================================

/**
 * Check if agentic onboarding is enabled for a contractor
 */
export function isAgenticOnboardingEnabled(
  contractorId: string,
  contractorFlags?: Partial<AgenticFeatureFlags>
): boolean {
  const flags = resolveFeatureFlags(contractorId, contractorFlags);
  return flags.agenticEnabled && flags.agenticOnboarding;
}

/**
 * Check if agentic project creation is enabled for a contractor
 */
export function isAgenticProjectCreationEnabled(
  contractorId: string,
  contractorFlags?: Partial<AgenticFeatureFlags>
): boolean {
  const flags = resolveFeatureFlags(contractorId, contractorFlags);
  return flags.agenticEnabled && flags.agenticProjectCreation;
}

/**
 * Check if business discovery is enabled
 */
export function isBusinessDiscoveryEnabled(
  contractorId: string,
  contractorFlags?: Partial<AgenticFeatureFlags>
): boolean {
  const flags = resolveFeatureFlags(contractorId, contractorFlags);
  return flags.agenticEnabled && flags.businessDiscovery;
}

// =============================================================================
// Debug/Admin
// =============================================================================

/**
 * Get all current feature flag settings for debugging
 */
export function getDebugFlagState(contractorId: string): {
  resolved: AgenticFeatureFlags;
  killSwitch: KillSwitchState;
  rolloutBucket: number;
} {
  return {
    resolved: resolveFeatureFlags(contractorId),
    killSwitch: getKillSwitchState(),
    rolloutBucket: hashContractorId(contractorId) % 100,
  };
}
