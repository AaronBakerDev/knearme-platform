/**
 * Rules-based foundation crack severity scoring.
 *
 * Deterministic, planning-only guidance for homeowners.
 * See PRD: docs/12-homeowner-tools/foundation-crack-severity-checker.md
 */

export type FoundationMaterial = 'poured-concrete' | 'block-brick' | 'stone-other'
export type CrackOrientation = 'vertical' | 'diagonal' | 'horizontal' | 'stair-step'
export type CrackWidthTier = 'hairline' | 'medium' | 'wide'
export type WaterIntrusionTier = 'none' | 'damp' | 'active'

export interface FoundationCrackInputs {
  material: FoundationMaterial
  orientation: CrackOrientation
  width: CrackWidthTier
  water: WaterIntrusionTier
  displacement: boolean
  symptoms: {
    stickingDoors: boolean
    slopingFloors: boolean
    recentGrowth: boolean
  }
}

export type FoundationSeverityTier = 'low' | 'medium' | 'high'

export type FoundationCauseCategory =
  | 'shrinkage-settling'
  | 'differential-settlement'
  | 'lateral-pressure'

export interface FoundationCrackResult {
  score: number
  tier: FoundationSeverityTier
  hardTrigger: boolean
  reasons: string[]
  cause: {
    category: FoundationCauseCategory
    label: string
    description: string
  }
  nextSteps: string[]
  assumptions: string[]
}

const ORIENTATION_POINTS: Record<CrackOrientation, number> = {
  vertical: 0,
  diagonal: 2,
  'stair-step': 3,
  horizontal: 4,
}

const WIDTH_POINTS: Record<CrackWidthTier, number> = {
  hairline: 0,
  medium: 2,
  wide: 4,
}

const WATER_POINTS: Record<WaterIntrusionTier, number> = {
  none: 0,
  damp: 1,
  active: 3,
}

const REASONS = {
  orientation: {
    vertical: 'Vertical cracks are often from normal shrinkage or minor settlement.',
    diagonal: 'Diagonal cracks can indicate uneven settlement or soil movement.',
    horizontal: 'Horizontal cracks can signal lateral soil pressure and are higher risk.',
    'stair-step': 'Stair-step cracks in block/brick usually suggest differential movement.',
  },
  width: {
    hairline: 'Hairline cracks are common and often cosmetic.',
    medium: 'Cracks wider than ~1/8" may allow moisture in and can worsen over time.',
    wide: 'Cracks wider than ~1/4" are often considered structural risk indicators.',
  },
  water: {
    none: 'No water intrusion lowers urgency.',
    damp: 'Dampness suggests an active moisture path that needs attention.',
    active: 'Active leaking accelerates damage and can indicate a larger issue.',
  },
  displacement: 'Offset or bulging edges suggest movement, not just surface cracking.',
  stickingDoors: 'Sticking doors/windows can be a sign of settlement or shifting.',
  slopingFloors: 'Sloping floors can indicate ongoing foundation movement.',
  recentGrowth: 'Recent crack growth increases risk and urgency.',
} as const

const NEXT_STEPS: Record<FoundationSeverityTier, string[]> = {
  low: [
    'Monitor the crack for changes (take a photo and measure width).',
    'Seal small cracks if recommended for your foundation type.',
    'Improve surface drainage (gutters, downspouts, grading).',
  ],
  medium: [
    'Measure the crack width and re-check in 3–6 months.',
    'Address drainage and moisture around the foundation.',
    'Schedule an inspection with a qualified foundation or masonry pro.',
  ],
  high: [
    'Contact a licensed foundation professional or structural engineer.',
    'Avoid DIY structural fixes until a pro evaluates the cause.',
    'Prioritize stopping active water intrusion immediately.',
  ],
}

const ASSUMPTIONS = [
  'Planning-level guidance using common residential rules of thumb.',
  'Hidden damage and local soil conditions can change risk materially.',
  'Always confirm with a licensed professional if you are unsure.',
]

function hardTriggerHigh(inputs: FoundationCrackInputs): boolean {
  if (inputs.width === 'wide') return true
  if (inputs.orientation === 'horizontal' && inputs.width !== 'hairline') return true
  if (inputs.orientation === 'stair-step' && inputs.displacement) return true
  if (
    inputs.water === 'active' &&
    (inputs.orientation === 'diagonal' || inputs.orientation === 'stair-step')
  ) {
    return true
  }
  return false
}

function getCause(inputs: FoundationCrackInputs): FoundationCrackResult['cause'] {
  if (inputs.orientation === 'horizontal') {
    return {
      category: 'lateral-pressure',
      label: 'Lateral soil or water pressure',
      description:
        'Horizontal cracking often happens when soil or water pushes against the wall. These cases need professional evaluation.',
    }
  }

  if (inputs.orientation === 'diagonal' || inputs.orientation === 'stair-step') {
    return {
      category: 'differential-settlement',
      label: 'Differential settlement or movement',
      description:
        'Diagonal or stair-step cracks can result from uneven settling or shifting soil. Monitor closely and consider an inspection.',
    }
  }

  return {
    category: 'shrinkage-settling',
    label: 'Shrinkage or minor settling',
    description:
      'Vertical hairline cracks are commonly caused by concrete curing or minor settling and are often not structural.',
  }
}

export function assessFoundationCrack(inputs: FoundationCrackInputs): FoundationCrackResult {
  const score =
    ORIENTATION_POINTS[inputs.orientation] +
    WIDTH_POINTS[inputs.width] +
    WATER_POINTS[inputs.water] +
    (inputs.displacement ? 3 : 0) +
    (inputs.symptoms.stickingDoors ? 1 : 0) +
    (inputs.symptoms.slopingFloors ? 1 : 0) +
    (inputs.symptoms.recentGrowth ? 1 : 0)

  const hardTrigger = hardTriggerHigh(inputs)

  const tier: FoundationSeverityTier = hardTrigger
    ? 'high'
    : score >= 8
      ? 'high'
      : score >= 4
        ? 'medium'
        : 'low'

  const reasons: string[] = []

  if (inputs.orientation !== 'vertical') reasons.push(REASONS.orientation[inputs.orientation])
  if (inputs.width !== 'hairline') reasons.push(REASONS.width[inputs.width])
  if (inputs.water !== 'none') reasons.push(REASONS.water[inputs.water])
  if (inputs.displacement) reasons.push(REASONS.displacement)
  if (inputs.symptoms.stickingDoors) reasons.push(REASONS.stickingDoors)
  if (inputs.symptoms.slopingFloors) reasons.push(REASONS.slopingFloors)
  if (inputs.symptoms.recentGrowth) reasons.push(REASONS.recentGrowth)

  return {
    score,
    tier,
    hardTrigger,
    reasons,
    cause: getCause(inputs),
    nextSteps: NEXT_STEPS[tier],
    assumptions: ASSUMPTIONS,
  }
}

