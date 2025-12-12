/**
 * Brick replacement count + budget calculator.
 *
 * Deterministic, planning-only tool.
 */

export type BrickSize = 'modular' | 'queen' | 'custom'
export type MatchingDifficulty = 'easy' | 'medium' | 'historic'
export type AccessLevel = 'ground' | 'ladder' | 'scaffold'

export interface BrickReplacementInputs {
  damagedAreaSqFt: number
  brickSize: BrickSize
  matchingDifficulty: MatchingDifficulty
  accessLevel: AccessLevel
  wastePercent?: number
}

export interface BrickReplacementResult {
  bricksNeeded: number
  bricksWithWaste: number
  materialCostLow: number
  materialCostHigh: number
  laborCostLow: number
  laborCostHigh: number
  assumptions: string[]
}

const BRICKS_PER_SQFT: Record<BrickSize, number> = {
  modular: 7,
  queen: 5.5,
  custom: 7,
}

const MATCH_MULTIPLIER: Record<MatchingDifficulty, number> = {
  easy: 1,
  medium: 1.2,
  historic: 1.5,
}

const ACCESS_MULTIPLIER: Record<AccessLevel, number> = {
  ground: 1,
  ladder: 1.15,
  scaffold: 1.35,
}

// Planning material cost per brick (national averages)
const MATERIAL_PER_BRICK_LOW = 1.25
const MATERIAL_PER_BRICK_HIGH = 4

// Planning labor cost per sq ft for spot replacement
const LABOR_PER_SQFT_LOW = 12
const LABOR_PER_SQFT_HIGH = 35

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function estimateBrickReplacement(inputs: BrickReplacementInputs): BrickReplacementResult {
  const damagedAreaSqFt = clamp(inputs.damagedAreaSqFt, 1, 2000)
  const wastePercent = clamp(inputs.wastePercent ?? 12, 0, 30)

  const bricksNeededRaw = damagedAreaSqFt * BRICKS_PER_SQFT[inputs.brickSize]
  const bricksNeeded = Math.ceil(bricksNeededRaw)
  const bricksWithWaste = Math.ceil(bricksNeeded * (1 + wastePercent / 100))

  const match = MATCH_MULTIPLIER[inputs.matchingDifficulty]
  const access = ACCESS_MULTIPLIER[inputs.accessLevel]

  const materialCostLow = Math.round(bricksWithWaste * MATERIAL_PER_BRICK_LOW * match)
  const materialCostHigh = Math.round(bricksWithWaste * MATERIAL_PER_BRICK_HIGH * match)

  const laborCostLow = Math.round(damagedAreaSqFt * LABOR_PER_SQFT_LOW * match * access)
  const laborCostHigh = Math.round(damagedAreaSqFt * LABOR_PER_SQFT_HIGH * match * access)

  return {
    bricksNeeded,
    bricksWithWaste,
    materialCostLow,
    materialCostHigh,
    laborCostLow,
    laborCostHigh,
    assumptions: [
      'Planning-level estimate based on national averages.',
      'Assumes standard modular brick unless otherwise selected.',
      'Historic or hard-to-match brick increases cost.',
      'Scaffolding or difficult access raises labor cost.',
    ],
  }
}

