/**
 * Deterministic cost estimator for homeowner tools.
 *
 * v1 uses conservative national averages + coarse multipliers.
 * v2 will be calibrated with first‑party project pricing.
 */

import type { ServiceId } from '@/lib/constants/services'

export type SeverityTier = 'minor' | 'standard' | 'structural'
export type AccessTier = 'single' | 'two-story' | 'steep' | 'limited'

export interface EstimateInputs {
  serviceId: ServiceId
  size: number
  severity: SeverityTier
  access: AccessTier
  historic: boolean
  cityTier: 'A' | 'B' | 'C'
}

export interface EstimateResult {
  low: number
  typical: number
  high: number
  unitLabel: string
  assumptions: string[]
}

interface ServiceBase {
  unitLabel: string
  lowPerUnit: number
  typicalPerUnit: number
  highPerUnit: number
  minProject: number
  maxProject: number
}

// Seed ranges from PRD (conservative national averages)
// NOTE: Only a subset are used in the initial UI. Others are coarse fallbacks
// to keep estimates safe until first‑party pricing is available.
const SERVICE_BASES: Record<ServiceId, ServiceBase> = {
  'chimney-repair': {
    unitLabel: 'vertical ft',
    lowPerUnit: 150,
    typicalPerUnit: 250,
    highPerUnit: 450,
    minProject: 300,
    maxProject: 10000,
  },
  tuckpointing: {
    unitLabel: 'sq ft wall area',
    lowPerUnit: 6,
    typicalPerUnit: 12,
    highPerUnit: 25,
    minProject: 800,
    maxProject: 6000,
  },
  'brick-repair': {
    unitLabel: 'sq ft damaged area',
    lowPerUnit: 15,
    typicalPerUnit: 30,
    highPerUnit: 60,
    minProject: 500,
    maxProject: 5000,
  },
  'stone-work': {
    unitLabel: 'sq ft area',
    lowPerUnit: 25,
    typicalPerUnit: 45,
    highPerUnit: 90,
    minProject: 1200,
    maxProject: 12000,
  },
  'retaining-walls': {
    unitLabel: 'sq ft wall face',
    lowPerUnit: 30,
    typicalPerUnit: 55,
    highPerUnit: 110,
    minProject: 1500,
    maxProject: 15000,
  },
  'concrete-work': {
    unitLabel: 'sq ft area',
    lowPerUnit: 8,
    typicalPerUnit: 15,
    highPerUnit: 30,
    minProject: 800,
    maxProject: 12000,
  },
  'foundation-repair': {
    unitLabel: 'linear ft crack/joint',
    lowPerUnit: 250,
    typicalPerUnit: 600,
    highPerUnit: 1200,
    minProject: 1500,
    maxProject: 15000,
  },
  fireplace: {
    unitLabel: 'project',
    lowPerUnit: 1200,
    typicalPerUnit: 2500,
    highPerUnit: 6000,
    minProject: 1200,
    maxProject: 12000,
  },
  'outdoor-living': {
    unitLabel: 'project',
    lowPerUnit: 2000,
    typicalPerUnit: 5000,
    highPerUnit: 15000,
    minProject: 2000,
    maxProject: 50000,
  },
  commercial: {
    unitLabel: 'project',
    lowPerUnit: 5000,
    typicalPerUnit: 15000,
    highPerUnit: 50000,
    minProject: 5000,
    maxProject: 200000,
  },
  restoration: {
    unitLabel: 'project',
    lowPerUnit: 1500,
    typicalPerUnit: 3500,
    highPerUnit: 9000,
    minProject: 1500,
    maxProject: 20000,
  },
  waterproofing: {
    unitLabel: 'sq ft area',
    lowPerUnit: 3,
    typicalPerUnit: 6,
    highPerUnit: 12,
    minProject: 400,
    maxProject: 5000,
  },
  'efflorescence-removal': {
    unitLabel: 'sq ft area',
    lowPerUnit: 4,
    typicalPerUnit: 8,
    highPerUnit: 16,
    minProject: 250,
    maxProject: 3000,
  },
} as const

const CITY_MULTIPLIERS = { A: 0.85, B: 1.0, C: 1.2 } as const
const SEVERITY_MULTIPLIERS: Record<SeverityTier, number> = {
  minor: 0.7,
  standard: 1.0,
  structural: 1.6,
}
const ACCESS_MULTIPLIERS: Record<AccessTier, number> = {
  single: 1.0,
  'two-story': 1.15,
  steep: 1.3,
  limited: 1.45,
}

export function estimateCost(inputs: EstimateInputs): EstimateResult {
  const base = SERVICE_BASES[inputs.serviceId]

  const city = CITY_MULTIPLIERS[inputs.cityTier]
  const severity = SEVERITY_MULTIPLIERS[inputs.severity]
  const access = ACCESS_MULTIPLIERS[inputs.access]
  const historic = inputs.historic ? 1.25 : 1.0

  const multiplier = city * severity * access * historic

  const rawLow = inputs.size * base.lowPerUnit * multiplier
  const rawTypical = inputs.size * base.typicalPerUnit * multiplier
  const rawHigh = inputs.size * base.highPerUnit * multiplier

  // Clamp to conservative project bands
  const low = Math.max(base.minProject, rawLow)
  const typical = Math.max(low, Math.min(base.maxProject, rawTypical))
  const high = Math.max(typical, Math.min(base.maxProject * 1.5, rawHigh))

  return {
    low: Math.round(low),
    typical: Math.round(typical),
    high: Math.round(high),
    unitLabel: base.unitLabel,
    assumptions: [
      'Planning-level estimate based on national averages.',
      'Assumes standard materials and typical site conditions.',
      'Hidden structural issues can increase cost.',
      'Get 2–3 local bids for an exact price.',
    ],
  }
}
