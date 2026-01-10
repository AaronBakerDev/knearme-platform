/**
 * Rules-based basement leak triage + fix-order guidance.
 *
 * Deterministic planning tool for homeowners.
 * See PRD: docs/13-homeowner-tools-phase-2/basement-leak-triage.md
 */

export type LeakLocation =
  | 'floor-joint'
  | 'mid-wall'
  | 'wall-floor-corner'
  | 'window-well'
  | 'chimney-penetration'

export type RainPattern = 'after-rain' | 'constant' | 'unsure'

export type VisibleSymptom = 'none' | 'efflorescence' | 'cracks' | 'crumbling-mortar'

export type GuttersTier = 'good' | 'overflowing' | 'unsure'
export type GradingTier = 'away' | 'flat' | 'toward'

export type LeakSourceCategory =
  | 'surface-runoff'
  | 'wall-cracks-mortar'
  | 'window-penetration'
  | 'hydrostatic-pressure'
  | 'chimney-roofline'

export interface BasementLeakInputs {
  location: LeakLocation
  rainPattern: RainPattern
  visibleSymptom: VisibleSymptom

  gutters?: GuttersTier
  grading?: GradingTier
  sumpPresent?: boolean
  ageYears?: number

  extraSymptoms?: {
    activeLeak?: boolean
    moldOrMusty?: boolean
    standingWater?: boolean
  }
}

export type BasementLeakRiskTier = 'low' | 'medium' | 'high'

export interface BasementLeakResult {
  score: number
  tier: BasementLeakRiskTier
  likelySource: {
    category: LeakSourceCategory
    label: string
    confidence: 'low' | 'medium' | 'high'
    rationale: string
  }
  fixOrder: string[]
  proTriggers: string[]
  assumptions: string[]
}

const SOURCE_LABELS: Record<LeakSourceCategory, string> = {
  'surface-runoff': 'Surface runoff / downspout drainage',
  'wall-cracks-mortar': 'Wall cracks or mortar gaps',
  'window-penetration': 'Window well or wall penetration leak',
  'hydrostatic-pressure': 'Hydrostatic pressure / high water table',
  'chimney-roofline': 'Chimney / roofline water path',
}

const FIX_ORDERS: Record<LeakSourceCategory, string[]> = {
  'surface-runoff': [
    'Fix gutters and extend downspouts at least 6–10 ft away from the foundation.',
    'Regrade soil so water slopes away from the house for the first ~10 ft.',
    'After drainage is improved, repair visible cracks and consider breathable masonry sealing.',
  ],
  'wall-cracks-mortar': [
    'Repair cracks or deteriorated mortar (repoint/patch) before waterproofing.',
    'Improve exterior drainage to keep the wall dry (downspouts, grading).',
    'Only after repairs and drainage are addressed, consider a breathable sealer.',
  ],
  'window-penetration': [
    'Clear and repair window well drains and ensure the well cover sheds water.',
    'Seal the window well/penetration and patch nearby cracks or mortar gaps.',
    'Improve surface drainage around the window (downspouts/grading).',
  ],
  'hydrostatic-pressure': [
    'Confirm sump pump/drain system works and keep discharge away from the home.',
    'If water persists, consult a pro about interior drains or exterior waterproofing.',
    'Repair interior cracks/mortar, then follow a pro plan for waterproofing.',
  ],
  'chimney-roofline': [
    'Inspect and repair chimney crown/cap and roof flashing first.',
    'Repoint or replace spalled bricks/mortar on the chimney stack.',
    'Only after repairs, consider chimney waterproofing.',
  ],
}

const ASSUMPTIONS = [
  'Planning-level guidance using common residential leak patterns.',
  'Hidden drainage paths or structural issues can change the diagnosis.',
  'Always prioritize safety and professional inspection if unsure.',
]

function baseSourceFromLocation(location: LeakLocation): LeakSourceCategory {
  switch (location) {
    case 'window-well':
      return 'window-penetration'
    case 'chimney-penetration':
      return 'chimney-roofline'
    case 'mid-wall':
      return 'wall-cracks-mortar'
    case 'floor-joint':
    case 'wall-floor-corner':
    default:
      return 'surface-runoff'
  }
}

function chooseLikelySource(inputs: BasementLeakInputs) {
  const { location, rainPattern, visibleSymptom } = inputs
  const gutters = inputs.gutters
  const grading = inputs.grading
  const sumpPresent = inputs.sumpPresent

  // Strong location-based rules first
  if (location === 'window-well') {
    return {
      category: 'window-penetration' as const,
      confidence: 'high' as const,
      rationale: 'Leaks near window wells usually come from the well drain or flashing around the opening.',
    }
  }

  if (location === 'chimney-penetration') {
    return {
      category: 'chimney-roofline' as const,
      confidence: 'medium' as const,
      rationale: 'Moisture near the chimney often tracks down from the crown, cap, or flashing.',
    }
  }

  // Pattern-based rules
  if (rainPattern === 'constant') {
    if ((location === 'floor-joint' || location === 'wall-floor-corner') && !sumpPresent) {
      return {
        category: 'hydrostatic-pressure' as const,
        confidence: 'high' as const,
        rationale: 'Constant seepage at the floor joint often indicates water pressure below the slab.',
      }
    }

    if (visibleSymptom === 'cracks' || visibleSymptom === 'crumbling-mortar') {
      return {
        category: 'wall-cracks-mortar' as const,
        confidence: 'medium' as const,
        rationale: 'Persistent dampness plus cracking usually points to a direct wall penetration.',
      }
    }
  }

  if (rainPattern === 'after-rain') {
    if (gutters === 'overflowing' || grading === 'toward') {
      return {
        category: 'surface-runoff' as const,
        confidence: 'high' as const,
        rationale: 'Rain-linked leaks with poor drainage most commonly come from surface runoff or downspouts.',
      }
    }

    if (visibleSymptom === 'cracks' || visibleSymptom === 'crumbling-mortar') {
      return {
        category: 'wall-cracks-mortar' as const,
        confidence: 'medium' as const,
        rationale: 'Rainwater is likely entering through cracks or weak mortar joints.',
      }
    }
  }

  // Fallback
  const category = baseSourceFromLocation(location)
  return {
    category,
    confidence: 'low' as const,
    rationale: 'Based on your description, this is the most common source, but multiple paths are possible.',
  }
}

function computeScore(inputs: BasementLeakInputs) {
  let score = 0
  if (inputs.rainPattern === 'constant') score += 2
  if (inputs.visibleSymptom === 'cracks') score += 1
  if (inputs.visibleSymptom === 'crumbling-mortar') score += 2
  if (inputs.visibleSymptom === 'efflorescence') score += 1
  if (inputs.gutters === 'overflowing') score += 1
  if (inputs.grading === 'toward') score += 1

  const extra = inputs.extraSymptoms
  if (extra?.activeLeak) score += 3
  if (extra?.standingWater) score += 3
  if (extra?.moldOrMusty) score += 2

  if (inputs.ageYears && inputs.ageYears > 50) score += 1

  return score
}

function tierFromScore(score: number): BasementLeakRiskTier {
  if (score >= 7) return 'high'
  if (score >= 4) return 'medium'
  return 'low'
}

function proTriggers(inputs: BasementLeakInputs, tier: BasementLeakRiskTier) {
  const triggers: string[] = []
  const extra = inputs.extraSymptoms

  if (extra?.activeLeak) triggers.push('Active leaking during rain or continuously.')
  if (extra?.standingWater) triggers.push('Standing water or puddling on the basement floor.')
  if (extra?.moldOrMusty) triggers.push('Musty odor or visible mold growth.')

  if (inputs.visibleSymptom === 'crumbling-mortar') {
    triggers.push('Crumbling mortar can indicate deeper wall deterioration.')
  }

  if (tier === 'high') triggers.push('High risk pattern — a pro inspection is the safest next step.')

  return triggers
}

export function triageBasementLeak(inputs: BasementLeakInputs): BasementLeakResult {
  const likely = chooseLikelySource(inputs)
  const score = computeScore(inputs)
  const tier = tierFromScore(score)

  return {
    score,
    tier,
    likelySource: {
      category: likely.category,
      label: SOURCE_LABELS[likely.category],
      confidence: likely.confidence,
      rationale: likely.rationale,
    },
    fixOrder: FIX_ORDERS[likely.category],
    proTriggers: proTriggers(inputs, tier),
    assumptions: ASSUMPTIONS,
  }
}
