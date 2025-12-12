/**
 * Deterministic tuckpointing material + labor calculator.
 *
 * No AI, no DB.
 * Constants are conservative and intended for planning only.
 */

export type BrickType = 'standard' | 'historic' | 'stone-veneer'

export interface TuckpointingInputs {
  wallLengthFt: number
  wallHeightFt: number
  jointDepthIn: number
  deteriorationPercent: number
  brickType: BrickType
  wastePercent?: number
}

export interface TuckpointingResult {
  wallAreaSqFt: number
  affectedAreaSqFt: number
  linearFeetJoints: number
  mortarVolumeCuFt: number
  bagsNeeded: number
  laborHoursLow: number
  laborHoursHigh: number
  materialCostLow: number
  materialCostHigh: number
}

const LINEAR_FEET_PER_SQFT: Record<BrickType, number> = {
  standard: 7.5,
  historic: 8.5,
  'stone-veneer': 5.5,
}

const PRODUCTIVITY_SQFT_PER_HOUR: Record<BrickType, number> = {
  standard: 12,
  historic: 8,
  'stone-veneer': 10,
}

const JOINT_WIDTH_IN = 0.375 // 3/8" typical mortar joint
const CUIN_PER_CUFT = 1728
const BAG_YIELD_CUFT = 0.6 // 80lb Type N bag yield (approx.)

const BAG_COST_LOW = 12
const BAG_COST_HIGH = 18

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function estimateTuckpointing(inputs: TuckpointingInputs): TuckpointingResult {
  const wallLengthFt = clamp(inputs.wallLengthFt, 1, 500)
  const wallHeightFt = clamp(inputs.wallHeightFt, 1, 100)
  const jointDepthIn = clamp(inputs.jointDepthIn, 0.25, 2.5)
  const deteriorationPercent = clamp(inputs.deteriorationPercent, 0, 100)
  const wastePercent = clamp(inputs.wastePercent ?? 12, 0, 30)

  const wallAreaSqFt = wallLengthFt * wallHeightFt
  const affectedAreaSqFt = wallAreaSqFt * (deteriorationPercent / 100)

  const linearFeetJoints = affectedAreaSqFt * LINEAR_FEET_PER_SQFT[inputs.brickType]

  const volumePerLinearFootCuFt =
    (JOINT_WIDTH_IN * jointDepthIn * 12) / CUIN_PER_CUFT

  const mortarVolumeCuFt = linearFeetJoints * volumePerLinearFootCuFt * (1 + wastePercent / 100)

  const bagsNeeded = Math.ceil(mortarVolumeCuFt / BAG_YIELD_CUFT)

  const baseProd = PRODUCTIVITY_SQFT_PER_HOUR[inputs.brickType]
  const depthMultiplier = clamp(jointDepthIn / 0.75, 0.6, 2)
  const laborHours = affectedAreaSqFt / baseProd * depthMultiplier

  const laborHoursLow = Math.max(1, laborHours * 0.75)
  const laborHoursHigh = laborHours * 1.25

  const materialCostLow = bagsNeeded * BAG_COST_LOW
  const materialCostHigh = bagsNeeded * BAG_COST_HIGH

  return {
    wallAreaSqFt: Math.round(wallAreaSqFt),
    affectedAreaSqFt: Math.round(affectedAreaSqFt),
    linearFeetJoints: Math.round(linearFeetJoints),
    mortarVolumeCuFt: Number(mortarVolumeCuFt.toFixed(2)),
    bagsNeeded,
    laborHoursLow: Number(laborHoursLow.toFixed(1)),
    laborHoursHigh: Number(laborHoursHigh.toFixed(1)),
    materialCostLow,
    materialCostHigh,
  }
}

