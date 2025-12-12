/**
 * Deterministic outdoor drainage quick planner.
 *
 * Planning-level guidance for homeowners.
 * See PRD: docs/13-homeowner-tools-phase-2/outdoor-drainage-quick-planner.md
 */

export type SlopeTier = 'toward' | 'flat' | 'away'
export type SoilAbsorptionTier = 'fast' | 'average' | 'slow'

export interface OutdoorDrainageInputs {
  currentDischargeDistanceFt: number
  slope: SlopeTier
  soilAbsorption: SoilAbsorptionTier

  poolingLowSpots?: boolean
  basementMoistureHistory?: boolean
}

export type DrainageDifficultyTier = 'low' | 'medium' | 'high'

export interface OutdoorDrainageResult {
  recommendedExtensionFt: number
  gradingTarget: string
  difficulty: DrainageDifficultyTier
  checklist: string[]
  proTriggers: string[]
  assumptions: string[]
}

const ASSUMPTIONS = [
  'Rules of thumb for typical residential sites.',
  'Local codes and lot constraints may limit grading options.',
  'If you cannot safely regrade, consult a pro.',
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function extensionLength(inputs: OutdoorDrainageInputs): number {
  let recommended = 6
  if (inputs.slope === 'flat') recommended = 8
  if (inputs.slope === 'toward') recommended = 10
  if (inputs.soilAbsorption === 'slow') recommended += 2
  if (inputs.currentDischargeDistanceFt >= 8) recommended = Math.max(recommended, inputs.currentDischargeDistanceFt)
  return clamp(Math.round(recommended), 4, 15)
}

function difficultyTier(inputs: OutdoorDrainageInputs): DrainageDifficultyTier {
  if (inputs.slope === 'toward' || inputs.soilAbsorption === 'slow' || inputs.poolingLowSpots) return 'high'
  if (inputs.slope === 'flat' || inputs.soilAbsorption === 'average') return 'medium'
  return 'low'
}

export function planOutdoorDrainage(inputs: OutdoorDrainageInputs): OutdoorDrainageResult {
  const recommendedExtensionFt = extensionLength(inputs)
  const difficulty = difficultyTier(inputs)

  const checklist: string[] = [
    `Extend downspouts to discharge at least ${recommendedExtensionFt} ft from the foundation.`,
    'Ensure gutters are clear and pitched correctly.',
    'Target ~5% slope away from the house for the first 10 ft (about 6" drop).',
    'Keep mulch/soil below siding/brick weep holes.',
  ]

  if (inputs.poolingLowSpots) checklist.push('Fill or regrade low spots that collect water after storms.')
  if (inputs.basementMoistureHistory) checklist.push('Prioritize drainage fixes before interior sealing or waterproofing.')

  const proTriggers: string[] = []
  if (difficulty === 'high') {
    proTriggers.push('Slope toward the house or slow-draining soil makes DIY drainage harder.')
  }
  if (inputs.poolingLowSpots && inputs.basementMoistureHistory) {
    proTriggers.push('Pooling water plus basement moisture history suggests a pro drainage consult.')
  }

  return {
    recommendedExtensionFt,
    gradingTarget: 'Aim for water to slope away from the house for the first ~10 ft when possible.',
    difficulty,
    checklist,
    proTriggers,
    assumptions: ASSUMPTIONS,
  }
}

