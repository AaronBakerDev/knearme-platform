/**
 * Rules-based chimney repair urgency scoring.
 *
 * Used by the homeowner checklist tool.
 */

export type ChimneySymptomKey =
  | 'mortar_cracks'
  | 'spalling_bricks'
  | 'efflorescence'
  | 'water_leak'
  | 'crown_damage'
  | 'flashing_gap'
  | 'leaning'
  | 'firebox_debris'
  | 'old_chimney'

export interface ChimneyChecklistInputs {
  mortar_cracks: boolean
  spalling_bricks: boolean
  efflorescence: boolean
  water_leak: boolean
  crown_damage: boolean
  flashing_gap: boolean
  leaning: boolean
  firebox_debris: boolean
  old_chimney: boolean
}

export interface ChimneyUrgencyResult {
  score: number
  tier: 'monitor' | 'schedule' | 'urgent'
  reasons: string[]
  likelyRepairs: string[]
}

const WEIGHTS: Record<ChimneySymptomKey, number> = {
  leaning: 3,
  crown_damage: 3,
  spalling_bricks: 3,
  water_leak: 3,
  mortar_cracks: 2,
  flashing_gap: 2,
  efflorescence: 2,
  firebox_debris: 2,
  old_chimney: 1,
}

const REASONS: Record<ChimneySymptomKey, string> = {
  mortar_cracks: 'Cracked or missing mortar joints allow water and gases into the structure.',
  spalling_bricks: 'Spalling bricks indicate freeze–thaw damage and loss of structural integrity.',
  efflorescence: 'White staining suggests moisture is moving through the chimney stack.',
  water_leak: 'Active water intrusion accelerates decay and can damage interior framing.',
  crown_damage: 'A damaged crown lets water into the chimney and often precedes bigger failures.',
  flashing_gap: 'Flashing gaps can leak into the roof system and rot framing.',
  leaning: 'A leaning chimney may be structurally unsafe and needs urgent evaluation.',
  firebox_debris: 'Debris or odors inside can mean internal mortar failure.',
  old_chimney: 'Older chimneys without recent repairs are more likely to have hidden issues.',
}

const LIKELY_REPAIRS: Array<{ when: ChimneySymptomKey[]; label: string }> = [
  { when: ['mortar_cracks', 'efflorescence'], label: 'Repointing / tuckpointing' },
  { when: ['crown_damage'], label: 'Crown repair or rebuild' },
  { when: ['flashing_gap', 'water_leak'], label: 'Flashing repair / waterproofing' },
  { when: ['spalling_bricks'], label: 'Brick replacement / partial rebuild' },
  { when: ['leaning'], label: 'Structural rebuild evaluation' },
]

export function scoreChimneyUrgency(inputs: ChimneyChecklistInputs): ChimneyUrgencyResult {
  const selected = (Object.keys(inputs) as ChimneySymptomKey[]).filter((k) => inputs[k])

  const score = selected.reduce((sum, k) => sum + WEIGHTS[k], 0)

  const tier: ChimneyUrgencyResult['tier'] =
    score >= 8 ? 'urgent' : score >= 4 ? 'schedule' : 'monitor'

  const reasons = selected.map((k) => REASONS[k])

  const likelyRepairs = LIKELY_REPAIRS.filter((r) => r.when.some((k) => inputs[k]))
    .map((r) => r.label)
    .slice(0, 3)

  return { score, tier, reasons, likelyRepairs }
}

