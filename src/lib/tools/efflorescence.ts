/**
 * Rules-based efflorescence cause + treatment planner.
 *
 * Deterministic guidance for homeowners.
 * See PRD: docs/12-homeowner-tools/efflorescence-treatment-planner.md
 */

export type EfflorescenceLocation = 'exterior-wall' | 'interior-basement' | 'chimney-roofline'
export type EfflorescenceSeverity = 'light' | 'moderate' | 'heavy'
export type EfflorescenceTiming = 'after-rain' | 'year-round' | 'winter-freeze'
export type WallAgeTier = 'new' | 'typical' | 'old'

export interface EfflorescenceInputs {
  location: EfflorescenceLocation
  severity: EfflorescenceSeverity
  timing: EfflorescenceTiming
  symptoms: {
    dampInterior: boolean
    activeLeak: boolean
    spalling: boolean
    mortarGaps: boolean
    drainageIssues: boolean
  }
  wallAge: WallAgeTier
}

export type EfflorescenceCauseCategory =
  | 'new-construction-salts'
  | 'surface-water-intrusion'
  | 'hydrostatic-pressure'
  | 'roofline-entry'

export interface EfflorescenceResult {
  cause: {
    category: EfflorescenceCauseCategory
    label: string
    description: string
  }
  treatmentSteps: string[]
  preventionSteps: string[]
  proTriggers: string[]
  assumptions: string[]
}

const ASSUMPTIONS = [
  'Planning-level DIY guidance based on common masonry practices.',
  'Efflorescence can return until moisture sources are fixed.',
  'Test any cleaner on a small hidden area first.',
]

function determineCause(inputs: EfflorescenceInputs): EfflorescenceResult['cause'] {
  const { location, wallAge, symptoms, timing } = inputs

  if (wallAge === 'new' && inputs.severity === 'light' && !symptoms.activeLeak && !symptoms.dampInterior) {
    return {
      category: 'new-construction-salts',
      label: 'New‑construction salts (curing moisture)',
      description:
        'New masonry often releases salts as it cures. This is usually temporary if moisture is controlled.',
    }
  }

  if (location === 'interior-basement' || symptoms.dampInterior) {
    return {
      category: 'hydrostatic-pressure',
      label: 'Subsurface moisture / hydrostatic pressure',
      description:
        'Efflorescence on interior basement walls often means water is moving through the wall from outside soil.',
    }
  }

  if (location === 'chimney-roofline' || (location === 'exterior-wall' && timing === 'after-rain' && symptoms.activeLeak)) {
    return {
      category: 'roofline-entry',
      label: 'Roofline or chimney water entry',
      description:
        'Moisture entering near flashing, crowns, or roof transitions can pull salts to the surface.',
    }
  }

  return {
    category: 'surface-water-intrusion',
    label: 'Surface water intrusion',
    description:
      'Rain and splashback can soak masonry. As it dries, salts migrate outward and leave white staining.',
  }
}

function buildTreatment(inputs: EfflorescenceInputs): string[] {
  const { severity, symptoms } = inputs

  const steps: string[] = [
    'Let the masonry dry fully (a few dry days).',
    'Dry‑brush the surface with a stiff nylon brush to remove loose salts.',
  ]

  if (symptoms.spalling || symptoms.activeLeak) {
    steps.push('Stop here and contact a pro before using water or cleaners.')
    return steps
  }

  steps.push('Rinse with low‑pressure water and mild soap. Avoid pressure washing soft brick.')

  if (severity === 'heavy') {
    steps.push(
      'If staining remains, use a mild acid cleaner (white vinegar or an efflorescence cleaner) following label directions.'
    )
  }

  steps.push('After cleaning, allow the wall to dry completely again.')

  return steps
}

function buildPrevention(inputs: EfflorescenceInputs, cause: EfflorescenceResult['cause']): string[] {
  const { symptoms } = inputs

  const steps: string[] = []

  if (symptoms.activeLeak || cause.category === 'roofline-entry') {
    steps.push('Inspect and repair flashing, crowns, caps, or roof transitions to stop water entry.')
  }

  if (symptoms.drainageIssues || cause.category === 'hydrostatic-pressure') {
    steps.push('Improve drainage: extend downspouts, fix gutters, and ensure soil slopes away from the wall.')
  }

  if (symptoms.mortarGaps) {
    steps.push('Repoint or tuckpoint failing mortar joints before sealing.')
  }

  if (!symptoms.spalling) {
    steps.push('Only apply a breathable masonry sealer after repairs and full drying.')
  }

  steps.push('Re-check for recurring staining after major storms or seasonal thaw.')

  return steps
}

export function planEfflorescenceTreatment(inputs: EfflorescenceInputs): EfflorescenceResult {
  const cause = determineCause(inputs)

  const proTriggers: string[] = []
  if (inputs.symptoms.activeLeak) proTriggers.push('Active water leak present.')
  if (inputs.symptoms.spalling) proTriggers.push('Bricks are spalling/flaking.')
  if (cause.category === 'hydrostatic-pressure') {
    proTriggers.push('Interior/basement efflorescence often requires exterior waterproofing.')
  }

  return {
    cause,
    treatmentSteps: buildTreatment(inputs),
    preventionSteps: buildPrevention(inputs, cause),
    proTriggers,
    assumptions: ASSUMPTIONS,
  }
}

