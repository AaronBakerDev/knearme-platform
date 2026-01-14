/**
 * Deterministic concrete slab/patio settling diagnostic.
 *
 * Planning-level guidance for homeowners.
 * See PRD: docs/13-homeowner-tools-phase-2/concrete-slab-settling-diagnostic.md
 */

export type SettlementPattern = 'edge-near-house' | 'edge-away-house' | 'center-dip' | 'random-spots'
export type WaterSource = 'downspout-splash' | 'sprinkler-runoff' | 'pooling-water' | 'none'
export type SoilGuess = 'clay' | 'sandy' | 'unknown'
export type CrackPattern = 'none' | 'hairline' | 'wide' | 'multiple'

export interface ConcreteSettlingInputs {
  settlementInches: number
  pattern: SettlementPattern
  waterSource: WaterSource

  soil?: SoilGuess
  slabAgeYears?: number
  cracks?: CrackPattern
}

export type SettlingSeverityTier = 'low' | 'medium' | 'high'

export type SettlingCauseCategory =
  | 'washout-drainage'
  | 'shrink-swell-soil'
  | 'voids-roots'
  | 'structural-movement'

export interface ConcreteSettlingResult {
  severity: SettlingSeverityTier
  score: number
  likelyCause: {
    category: SettlingCauseCategory
    label: string
    confidence: 'low' | 'medium' | 'high'
    description: string
  }
  nextSteps: string[]
  proTriggers: string[]
  assumptions: string[]
}

const CAUSE_LABELS: Record<SettlingCauseCategory, { label: string; description: string }> = {
  'washout-drainage': {
    label: 'Sub‑base washout / poor drainage',
    description: 'Water from downspouts, sprinklers, or pooling can wash soil out from under slabs.',
  },
  'shrink-swell-soil': {
    label: 'Clay soil shrink‑swell movement',
    description: 'Expansive clay soils shrink when dry and swell when wet, shifting slabs unevenly.',
  },
  'voids-roots': {
    label: 'Voids, roots, or localized soil loss',
    description: 'Random dips can come from tree roots, animal burrows, or isolated soil settling.',
  },
  'structural-movement': {
    label: 'Possible structural/foundation movement',
    description: 'Large settlement near the house can reflect broader soil or foundation movement.',
  },
}

const ASSUMPTIONS = [
  'Planning-level diagnostic based on common residential slab patterns.',
  'Local soil conditions and hidden voids can change the cause.',
  'Seek professional evaluation if settlement is rapid or worsening.',
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function severityFromInputs(settlement: number, cracks: CrackPattern | undefined): SettlingSeverityTier {
  if (settlement > 1.5) return 'high'
  if (settlement >= 0.5) return 'medium'
  if (cracks === 'wide' || cracks === 'multiple') return 'medium'
  return 'low'
}

function scoreCause(inputs: ConcreteSettlingInputs) {
  const washout =
    (inputs.waterSource !== 'none' ? 3 : 0) +
    (inputs.pattern === 'edge-near-house' || inputs.pattern === 'edge-away-house' ? 1 : 0)

  const clay = (inputs.soil === 'clay' ? 3 : 0) + (inputs.pattern === 'random-spots' ? 1 : 0)

  const voids = (inputs.pattern === 'random-spots' ? 3 : 0) + (inputs.waterSource === 'none' ? 1 : 0)

  const structural =
    (inputs.pattern === 'edge-near-house' ? 3 : 0) + (inputs.settlementInches > 2 ? 2 : 0)

  const scores: Record<SettlingCauseCategory, number> = {
    'washout-drainage': washout,
    'shrink-swell-soil': clay,
    'voids-roots': voids,
    'structural-movement': structural,
  }

  const ordered = (Object.keys(scores) as SettlingCauseCategory[]).sort((a, b) => scores[b] - scores[a])
  const best = ordered[0] ?? 'washout-drainage'
  const bestScore = scores[best]
  const confidence: 'low' | 'medium' | 'high' = bestScore >= 5 ? 'high' : bestScore >= 3 ? 'medium' : 'low'

  return { category: best, confidence }
}

function nextSteps(inputs: ConcreteSettlingInputs, severity: SettlingSeverityTier): string[] {
  const steps: string[] = []

  if (severity === 'low') {
    steps.push('Monitor the slab for changes; small settlement is common over time.')
  }

  if (inputs.waterSource !== 'none') {
    steps.push('Improve drainage: extend downspouts, fix sprinkler overspray, and eliminate pooling.')
  }

  if (severity === 'medium') {
    steps.push('Consider a slab‑lifting consult (mudjacking or foam lifting) if the area is a trip hazard.')
  }

  if (severity === 'high') {
    steps.push('Get a professional evaluation for lifting vs replacement and to rule out structural movement.')
  }

  if (!steps.length) {
    steps.push('Keep water away from the slab and re‑check seasonally.')
  }

  return steps
}

export function diagnoseConcreteSettling(inputs: ConcreteSettlingInputs): ConcreteSettlingResult {
  const settlement = clamp(inputs.settlementInches, 0, 6)
  const cracks = inputs.cracks

  const severity = severityFromInputs(settlement, cracks)
  const cause = scoreCause({ ...inputs, settlementInches: settlement })

  const baseScore = settlement * 2 + (cracks === 'wide' ? 2 : cracks === 'multiple' ? 3 : 0)
  const score = clamp(Number(baseScore.toFixed(1)), 0, 12)

  const proTriggers: string[] = []
  if (severity === 'high') proTriggers.push('Settlement over ~1.5" or worsening quickly.')
  if (cracks === 'wide' || cracks === 'multiple') proTriggers.push('Wide or multiple cracks indicating movement.')
  if (inputs.pattern === 'edge-near-house' && settlement > 1) {
    proTriggers.push('Significant settlement close to the foundation.')
  }

  const label = CAUSE_LABELS[cause.category]

  return {
    severity,
    score,
    likelyCause: {
      category: cause.category,
      label: label.label,
      confidence: cause.confidence,
      description: label.description,
    },
    nextSteps: nextSteps({ ...inputs, settlementInches: settlement }, severity),
    proTriggers,
    assumptions: ASSUMPTIONS,
  }
}
