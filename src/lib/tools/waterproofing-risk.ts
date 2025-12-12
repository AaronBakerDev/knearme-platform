/**
 * Masonry waterproofing risk + decision checklist.
 *
 * Deterministic, conservative guidance for homeowners.
 * See PRD: docs/12-homeowner-tools/waterproofing-risk-checklist.md
 */

export type ClimateTier = 'freeze-thaw' | 'no-freeze'
export type MasonryType = 'brick' | 'stone' | 'block'
export type ExposureTier = 'high' | 'moderate' | 'sheltered'
export type DrainageTier = 'good' | 'ok' | 'poor'
export type IssueLocation = 'roofline-chimney' | 'mid-wall' | 'at-grade'

export interface WaterproofingRiskInputs {
  climate: ClimateTier
  masonryType: MasonryType
  exposure: ExposureTier
  drainage: DrainageTier
  location?: IssueLocation
  symptoms: {
    efflorescence: boolean
    spalling: boolean
    dampInterior: boolean
    activeLeak: boolean
    mustyMold: boolean
    mortarGaps: boolean
  }
}

export interface WaterproofingRiskResult {
  score: number
  tier: 'low' | 'medium' | 'high'
  reasons: string[]
  firstAction: string
  planSteps: string[]
  proTriggers: string[]
  assumptions: string[]
}

const CLIMATE_WEIGHT: Record<ClimateTier, number> = {
  'freeze-thaw': 2,
  'no-freeze': 0,
}

const EXPOSURE_WEIGHT: Record<ExposureTier, number> = {
  high: 2,
  moderate: 1,
  sheltered: 0,
}

const DRAINAGE_WEIGHT: Record<DrainageTier, number> = {
  good: 0,
  ok: 1,
  poor: 3,
}

type SymptomKey = keyof WaterproofingRiskInputs['symptoms']

const SYMPTOM_WEIGHT: Record<SymptomKey, number> = {
  activeLeak: 4,
  spalling: 4,
  dampInterior: 3,
  mustyMold: 2,
  mortarGaps: 2,
  efflorescence: 1,
}

const SYMPTOM_REASON: Record<SymptomKey, string> = {
  efflorescence: 'White staining suggests moisture moving through masonry.',
  spalling: 'Spalling indicates freeze–thaw damage and trapped moisture.',
  dampInterior: 'Interior dampness means water is penetrating the wall.',
  activeLeak: 'Active leaks can cause rapid hidden structural damage.',
  mustyMold: 'Musty odors or mold signal ongoing moisture problems.',
  mortarGaps: 'Failing mortar joints let water in and should be repaired first.',
}

const ASSUMPTIONS = [
  'Planning-level checklist based on common masonry waterproofing practices.',
  'Moisture paths can be hidden; when in doubt, get a professional inspection.',
  'Breathable sealers should only be applied after repairs and full drying.',
]

function selectedSymptoms(inputs: WaterproofingRiskInputs): SymptomKey[] {
  return (Object.keys(inputs.symptoms) as SymptomKey[]).filter((k) => inputs.symptoms[k])
}

function computeScore(inputs: WaterproofingRiskInputs, selected: SymptomKey[]): number {
  const climate = CLIMATE_WEIGHT[inputs.climate]
  const exposure = EXPOSURE_WEIGHT[inputs.exposure]
  const drainage = DRAINAGE_WEIGHT[inputs.drainage]

  const symptomsScore = selected.reduce((sum, k) => sum + SYMPTOM_WEIGHT[k], 0)

  return climate + exposure + drainage + symptomsScore
}

function computeTier(inputs: WaterproofingRiskInputs, score: number): WaterproofingRiskResult['tier'] {
  if (inputs.symptoms.activeLeak) return 'high'
  if (inputs.symptoms.spalling && inputs.climate === 'freeze-thaw') return 'high'

  if (score >= 10) return 'high'
  if (score >= 5) return 'medium'
  return 'low'
}

function firstAction(inputs: WaterproofingRiskInputs, selected: SymptomKey[]): string {
  const { symptoms } = inputs

  if (symptoms.activeLeak) {
    return 'Inspect flashing / roofline and contact a pro to stop the active leak.'
  }

  if (symptoms.spalling && inputs.climate === 'freeze-thaw') {
    return 'Repair/repoint damaged brick first — do not seal until repairs are complete.'
  }

  if (inputs.drainage === 'poor') {
    return 'Fix drainage and gutters first to keep bulk water away from the wall.'
  }

  const onlyEfflorescence =
    symptoms.efflorescence &&
    selected.length === 1 &&
    !symptoms.spalling &&
    !symptoms.activeLeak

  if (onlyEfflorescence) {
    return 'Clean efflorescence and find the moisture source; consider breathable sealer only after drying.'
  }

  if (symptoms.mortarGaps) {
    return 'Repoint/tuckpoint failing mortar joints before any sealing.'
  }

  if (selected.length === 0 && inputs.exposure === 'high') {
    return 'Consider preventive breathable waterproofing and routine maintenance.'
  }

  return 'Address minor moisture paths and monitor before sealing.'
}

function buildPlan(inputs: WaterproofingRiskInputs): string[] {
  const steps: string[] = []
  const { symptoms } = inputs

  if (inputs.drainage === 'poor') {
    steps.push('Improve drainage: fix gutters, extend downspouts, and slope soil away from walls.')
  }

  if (symptoms.activeLeak) {
    steps.push('Inspect roofline/chimney flashing and repair any entry points.')
    steps.push('If leaking continues, schedule a professional inspection.')
  }

  if (symptoms.mortarGaps) {
    steps.push('Repoint/tuckpoint deteriorated mortar joints to close water pathways.')
  }

  if (symptoms.spalling) {
    steps.push('Replace spalling bricks and repair underlying moisture issues.')
  }

  if (symptoms.efflorescence && !symptoms.activeLeak) {
    steps.push('Dry and clean surface salts once moisture sources are addressed.')
  }

  steps.push('Let masonry dry thoroughly before any sealing (several dry days).')

  if (!symptoms.spalling && !symptoms.activeLeak && (inputs.exposure === 'high' || inputs.climate === 'freeze-thaw')) {
    steps.push('Apply a breathable masonry sealer if appropriate for your material.')
  }

  steps.push('Recheck after major storms or the next freeze–thaw season.')

  return steps.slice(0, 6)
}

export function scoreWaterproofingRisk(inputs: WaterproofingRiskInputs): WaterproofingRiskResult {
  const selected = selectedSymptoms(inputs)
  const score = computeScore(inputs, selected)
  const tier = computeTier(inputs, score)

  const reasons = selected.map((k) => SYMPTOM_REASON[k])

  const proTriggers: string[] = []
  if (inputs.symptoms.activeLeak) proTriggers.push('Active leak during rain.')
  if (inputs.symptoms.spalling) proTriggers.push('Spalling/flaking masonry present.')
  if (inputs.symptoms.dampInterior) proTriggers.push('Interior dampness or basement moisture.')
  if (inputs.symptoms.mustyMold) proTriggers.push('Musty odor or visible mold nearby.')
  if (tier === 'high') proTriggers.push('Overall risk is high; hidden damage is possible.')

  return {
    score,
    tier,
    reasons,
    firstAction: firstAction(inputs, selected),
    planSteps: buildPlan(inputs),
    proTriggers,
    assumptions: ASSUMPTIONS,
  }
}

