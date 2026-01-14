/**
 * Deterministic repoint vs replace decision tool.
 *
 * Planning-level guidance for homeowners.
 * See PRD: docs/13-homeowner-tools-phase-2/repoint-vs-replace-decision.md
 */

export type MortarLossTier = 'surface-dusting' | 'gaps-1-4-to-1-2' | 'missing-over-1-2'
export type BrickDamageTier = 'none' | 'some-spalling' | 'many-damaged'
export type FreezeThawTier = 'freeze-thaw' | 'no-freeze'

export type PriorSealingTier = 'never' | 'over-5-years' | 'under-5-years'

export interface RepointReplaceInputs {
  mortarLoss: MortarLossTier
  brickDamage: BrickDamageTier
  climate: FreezeThawTier

  wallAgeYears?: number
  moistureSymptoms?: {
    efflorescence?: boolean
    dampInterior?: boolean
    activeLeak?: boolean
  }
  priorSealing?: PriorSealingTier
}

export type RepointReplaceTier = 'low' | 'medium' | 'high'

export type RecommendationType = 'repoint' | 'replace-and-repoint' | 'rebuild-consult'

export type ScopeBand = 'spot' | 'one-elevation' | 'whole-home'

export interface RepointReplaceResult {
  score: number
  tier: RepointReplaceTier
  recommendation: {
    type: RecommendationType
    label: string
    reasoning: string
  }
  scope: ScopeBand
  nextSteps: string[]
  proTriggers: string[]
  assumptions: string[]
}

const RECOMMENDATION_LABELS: Record<RecommendationType, { label: string; reasoning: string }> = {
  repoint: {
    label: 'Repoint / tuckpoint the mortar joints',
    reasoning: 'Deep or widespread mortar loss with mostly sound bricks is best handled by repointing.',
  },
  'replace-and-repoint': {
    label: 'Replace damaged bricks, then repoint',
    reasoning: 'Spalled or soft bricks need replacement before repointing to avoid trapping moisture.',
  },
  'rebuild-consult': {
    label: 'Consult a pro about rebuild or structural repair',
    reasoning: 'Widespread brick failure often needs structural evaluation and larger scope work.',
  },
}

const ASSUMPTIONS = [
  'Planning-level decision tree based on typical residential masonry behavior.',
  'Hidden moisture paths and structural movement can change scope.',
  'Always repair mortar/brick damage before sealing.',
]

function computeScore(inputs: RepointReplaceInputs) {
  let score = 0
  if (inputs.mortarLoss === 'gaps-1-4-to-1-2') score += 2
  if (inputs.mortarLoss === 'missing-over-1-2') score += 3

  if (inputs.brickDamage === 'some-spalling') score += 2
  if (inputs.brickDamage === 'many-damaged') score += 4

  if (inputs.climate === 'freeze-thaw') score += 1

  const symptoms = inputs.moistureSymptoms
  if (symptoms?.efflorescence) score += 1
  if (symptoms?.dampInterior) score += 1
  if (symptoms?.activeLeak) score += 2

  if (inputs.wallAgeYears && inputs.wallAgeYears > 60) score += 1

  return score
}

function tierFromScore(score: number): RepointReplaceTier {
  if (score >= 7) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}

function recommendationFromInputs(inputs: RepointReplaceInputs, tier: RepointReplaceTier): RecommendationType {
  if (inputs.brickDamage === 'many-damaged') return 'rebuild-consult'
  if (inputs.brickDamage === 'some-spalling') return 'replace-and-repoint'
  if (inputs.mortarLoss === 'missing-over-1-2') return 'repoint'
  if (inputs.mortarLoss === 'gaps-1-4-to-1-2') return 'repoint'
  if (tier === 'high') return 'repoint'
  return 'repoint'
}

function scopeFromInputs(inputs: RepointReplaceInputs, tier: RepointReplaceTier): ScopeBand {
  if (inputs.brickDamage === 'many-damaged' || inputs.mortarLoss === 'missing-over-1-2') return 'whole-home'
  if (tier === 'medium' || inputs.brickDamage === 'some-spalling') return 'one-elevation'
  return 'spot'
}

function proTriggers(inputs: RepointReplaceInputs, tier: RepointReplaceTier): string[] {
  const triggers: string[] = []

  if (inputs.brickDamage === 'many-damaged') {
    triggers.push('Many bricks are soft, spalling, or broken.')
  }
  if (inputs.moistureSymptoms?.activeLeak) {
    triggers.push('Active leaking or interior water intrusion.')
  }
  if (tier === 'high') {
    triggers.push('High severity pattern — a pro evaluation is safest.')
  }

  return triggers
}

function nextSteps(type: RecommendationType): string[] {
  switch (type) {
    case 'replace-and-repoint':
      return [
        'Replace damaged or soft bricks first.',
        'Repoint/tuckpoint weak mortar joints.',
        'Improve drainage and only then consider breathable sealing.',
      ]
    case 'rebuild-consult':
      return [
        'Schedule a masonry or structural inspection.',
        'Avoid DIY sealing or patching until the wall is evaluated.',
        'Plan for a larger rebuild zone if bricks are failing widely.',
      ]
    case 'repoint':
    default:
      return [
        'Repoint or tuckpoint weak joints before winter or heavy rain.',
        'Replace any isolated damaged bricks during repointing.',
        'After repairs, consider breathable sealing if appropriate.',
      ]
  }
}

export function decideRepointVsReplace(inputs: RepointReplaceInputs): RepointReplaceResult {
  const score = computeScore(inputs)
  const tier = tierFromScore(score)
  const type = recommendationFromInputs(inputs, tier)
  const scope = scopeFromInputs(inputs, tier)
  const meta = RECOMMENDATION_LABELS[type]

  return {
    score,
    tier,
    recommendation: { type, label: meta.label, reasoning: meta.reasoning },
    scope,
    nextSteps: nextSteps(type),
    proTriggers: proTriggers(inputs, tier),
    assumptions: ASSUMPTIONS,
  }
}

