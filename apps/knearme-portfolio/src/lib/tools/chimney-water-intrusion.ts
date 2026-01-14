/**
 * Rules-based chimney water intrusion risk scoring.
 *
 * Deterministic checklist for homeowners.
 * See PRD: docs/13-homeowner-tools-phase-2/chimney-water-intrusion-risk-checklist.md
 */

export type ChimneyWaterSymptom = 'none' | 'efflorescence' | 'inside-staining' | 'attic-staining' | 'active-leak'
export type RooflineCondition = 'good' | 'damaged' | 'unknown'
export type FreezeThawTier = 'freeze-thaw' | 'no-freeze'

export interface ChimneyWaterInputs {
  symptom: ChimneyWaterSymptom
  roofline: RooflineCondition
  climate: FreezeThawTier

  chimneyAgeYears?: number
  priorWaterproofing?: 'never' | 'over-5-years' | 'under-5-years'
  mortarSpalling?: boolean
}

export type ChimneyWaterTier = 'low' | 'medium' | 'high'

export type EntryPathCategory = 'crown-cap' | 'flashing' | 'mortar-spalling'

export interface ChimneyWaterResult {
  score: number
  tier: ChimneyWaterTier
  likelyEntryPath: {
    category: EntryPathCategory
    label: string
    description: string
  }
  fixOrder: string[]
  proTriggers: string[]
  assumptions: string[]
}

const SYMPTOM_POINTS: Record<ChimneyWaterSymptom, number> = {
  none: 0,
  efflorescence: 2,
  'inside-staining': 3,
  'attic-staining': 3,
  'active-leak': 5,
}

const ROOFLINE_POINTS: Record<RooflineCondition, number> = {
  good: 0,
  damaged: 3,
  unknown: 1,
}

const ENTRY_PATHS: Record<EntryPathCategory, { label: string; description: string }> = {
  'crown-cap': {
    label: 'Crown / cap or top‑of‑chimney failure',
    description: 'Cracked crowns, missing caps, or open flues let water directly into the stack.',
  },
  flashing: {
    label: 'Roof flashing or roofline path',
    description: 'Water can leak where the chimney meets the roof and run down the structure.',
  },
  'mortar-spalling': {
    label: 'Mortar gaps or spalling brick',
    description: 'Weak joints and damaged bricks absorb water and pass it to the interior.',
  },
}

const FIX_ORDER = [
  'Repair crown/cap and ensure a proper flue cover.',
  'Repair or replace chimney flashing at the roofline.',
  'Repoint mortar and replace spalled bricks.',
  'Only after repairs, consider breathable chimney waterproofing.',
]

const ASSUMPTIONS = [
  'Planning-level chimney moisture rules of thumb.',
  'Hidden roof leaks can mimic chimney leaks.',
  'Always address structural brick/mortar damage before sealing.',
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function chooseEntryPath(inputs: ChimneyWaterInputs): EntryPathCategory {
  if (inputs.mortarSpalling) return 'mortar-spalling'
  if (inputs.roofline === 'damaged') return 'crown-cap'
  if (inputs.symptom === 'attic-staining' || inputs.symptom === 'inside-staining') return 'flashing'
  return 'crown-cap'
}

export function scoreChimneyWaterIntrusion(inputs: ChimneyWaterInputs): ChimneyWaterResult {
  let score = SYMPTOM_POINTS[inputs.symptom] + ROOFLINE_POINTS[inputs.roofline]
  if (inputs.climate === 'freeze-thaw') score += 1
  if (inputs.mortarSpalling) score += 2
  if (inputs.chimneyAgeYears && inputs.chimneyAgeYears > 50) score += 1
  score = clamp(score, 0, 12)

  const tier: ChimneyWaterTier = score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low'
  const entryCategory = chooseEntryPath(inputs)

  const proTriggers: string[] = []
  if (inputs.symptom === 'active-leak') proTriggers.push('Active leaking inside or around the fireplace.')
  if (inputs.mortarSpalling) proTriggers.push('Spalling bricks or missing mortar on the chimney stack.')
  if (tier === 'high') proTriggers.push('High risk pattern — schedule a pro inspection.')

  return {
    score,
    tier,
    likelyEntryPath: {
      category: entryCategory,
      label: ENTRY_PATHS[entryCategory].label,
      description: ENTRY_PATHS[entryCategory].description,
    },
    fixOrder: FIX_ORDER,
    proTriggers,
    assumptions: ASSUMPTIONS,
  }
}

