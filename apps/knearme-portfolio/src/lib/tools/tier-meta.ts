/**
 * Shared tier metadata utility for homeowner diagnostic tools.
 *
 * Eliminates duplicated switch statements across 8+ widget files.
 * Each widget was defining nearly identical tier metadata functions.
 *
 * @see BasementLeakTriageWidget.tsx - tierMeta()
 * @see FoundationCrackCheckerWidget.tsx - tierCopy()
 * @see WaterproofingRiskChecklistWidget.tsx - tierMeta()
 * @see ConcreteSlabSettlingDiagnosticWidget.tsx - severityMeta()
 */

import { AlertTriangle, CheckCircle2, ShieldAlert, type LucideIcon } from 'lucide-react'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Standard three-tier risk/severity levels used across most tools */
export type TierLevel = 'low' | 'medium' | 'high'

/** Alternative tier naming used by ChimneyUrgencyChecklist */
export type UrgencyTier = 'monitor' | 'schedule' | 'urgent'

/** Metadata returned for each tier level */
export interface TierMeta {
  /** Display label (e.g., "Low Severity", "Monitor") */
  label: string
  /** Tailwind color classes for background and text */
  colorClass: string
  /** Lucide icon component for the tier */
  icon: LucideIcon
  /** Short summary for mobile sticky bars */
  summary?: string
}

// -----------------------------------------------------------------------------
// Color Constants (Tailwind classes)
// -----------------------------------------------------------------------------

/**
 * Tier color classes optimized for light/dark mode.
 * Used consistently across all diagnostic tools.
 */
export const TIER_COLORS = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
  high: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200',
} as const

/**
 * Badge-compatible Tailwind color classes (no background, just text/border).
 * Use for inline indicators or badges.
 */
export const TIER_BADGE_COLORS = {
  low: 'text-green-700 border-green-300 dark:text-green-400 dark:border-green-700',
  medium: 'text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700',
  high: 'text-red-700 border-red-300 dark:text-red-400 dark:border-red-700',
} as const

// -----------------------------------------------------------------------------
// Core Functions
// -----------------------------------------------------------------------------

/**
 * Get complete tier metadata for standard low/medium/high levels.
 *
 * @param tier - The tier level
 * @returns Tier metadata including label, color, icon, and summary
 *
 * @example
 * const meta = getTierMeta('high')
 * // { label: 'High', colorClass: 'bg-red-100...', icon: ShieldAlert, summary: 'Urgent' }
 */
export function getTierMeta(tier: TierLevel): TierMeta {
  switch (tier) {
    case 'low':
      return {
        label: 'Low',
        colorClass: TIER_COLORS.low,
        icon: CheckCircle2,
        summary: 'Monitor',
      }
    case 'medium':
      return {
        label: 'Medium',
        colorClass: TIER_COLORS.medium,
        icon: AlertTriangle,
        summary: 'Schedule',
      }
    case 'high':
      return {
        label: 'High',
        colorClass: TIER_COLORS.high,
        icon: ShieldAlert,
        summary: 'Urgent',
      }
  }
}

/**
 * Get tier metadata with severity-specific labels.
 * Use for tools that express results as severity levels.
 *
 * @param tier - The tier level
 * @returns Tier metadata with "Low Severity", "Medium Severity", etc.
 */
export function getSeverityMeta(tier: TierLevel): TierMeta {
  const base = getTierMeta(tier)
  return {
    ...base,
    label: `${base.label} Severity`,
  }
}

/**
 * Get tier metadata with risk-specific labels.
 * Use for tools that express results as risk levels.
 *
 * @param tier - The tier level
 * @returns Tier metadata with "Low Risk", "Medium Risk", etc.
 */
export function getRiskMeta(tier: TierLevel): TierMeta {
  const base = getTierMeta(tier)
  return {
    ...base,
    label: `${base.label} Risk`,
  }
}

/**
 * Convert urgency tier to standard tier level.
 * ChimneyUrgencyChecklist uses monitor/schedule/urgent instead of low/medium/high.
 *
 * @param urgency - The urgency tier (monitor, schedule, urgent)
 * @returns Equivalent standard tier level
 */
export function urgencyToTier(urgency: UrgencyTier): TierLevel {
  switch (urgency) {
    case 'monitor':
      return 'low'
    case 'schedule':
      return 'medium'
    case 'urgent':
      return 'high'
  }
}

/**
 * Get urgency-specific tier metadata.
 * Maps monitor/schedule/urgent to appropriate labels and colors.
 *
 * @param urgency - The urgency tier
 * @returns Tier metadata with urgency-appropriate labels
 */
export function getUrgencyMeta(urgency: UrgencyTier): TierMeta {
  const tier = urgencyToTier(urgency)
  const base = getTierMeta(tier)

  switch (urgency) {
    case 'monitor':
      return {
        ...base,
        label: 'Monitor',
        summary: 'Monitor',
      }
    case 'schedule':
      return {
        ...base,
        label: 'Schedule Inspection',
        summary: 'Schedule',
      }
    case 'urgent':
      return {
        ...base,
        label: 'Urgent',
        summary: 'Urgent',
      }
  }
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Get just the Tailwind color class for a tier.
 *
 * @param tier - The tier level
 * @returns Tailwind color classes string
 */
export function getTierColorClass(tier: TierLevel): string {
  return TIER_COLORS[tier]
}

/**
 * Get shadcn/ui Badge variant for a tier.
 *
 * @param tier - The tier level
 * @returns Badge variant name
 */
export function getTierBadgeVariant(tier: TierLevel): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (tier) {
    case 'low':
      return 'secondary'
    case 'medium':
      return 'outline'
    case 'high':
      return 'destructive'
  }
}

/**
 * Get the Lucide icon component for a tier.
 *
 * @param tier - The tier level
 * @returns Lucide icon component
 */
export function getTierIcon(tier: TierLevel): LucideIcon {
  switch (tier) {
    case 'low':
      return CheckCircle2
    case 'medium':
      return AlertTriangle
    case 'high':
      return ShieldAlert
  }
}
