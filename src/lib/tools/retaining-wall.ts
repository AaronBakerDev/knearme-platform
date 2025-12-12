/**
 * Retaining wall materials planner.
 *
 * Deterministic, planning‑only tool for homeowners.
 * Provides rough block counts, base/backfill volumes, drainage lengths,
 * and safety/permit guidance.
 *
 * See PRD: docs/12-homeowner-tools/retaining-wall-planner.md
 */

export type BlockType = 'segmental' | 'stone' | 'concrete'
export type SoilType = 'clay' | 'loam' | 'sand'
export type DrainageOption = 'none' | 'gravel' | 'pipe'

export interface RetainingWallInputs {
  wallLengthFt: number
  wallHeightFt: number
  blockType: BlockType
  soilType: SoilType
  tieredSlope: boolean
  drainage: DrainageOption
  wastePercent?: number
}

export interface RetainingWallResult {
  wallAreaSqFt: number
  blocksNeeded: number
  blocksWithWaste: number
  baseGravelCuYd: number
  backfillCuYd: number
  drainagePipeFt: number
  diyDifficulty: 'easy' | 'moderate' | 'pro' | 'engineer'
  warnings: string[]
  assumptions: string[]
}

const CUFT_PER_CUYD = 27

const BLOCKS_PER_SQFT: Record<BlockType, number> = {
  segmental: 2.0, // typical SRW block face ≈ 12"×6" → ~0.5 sq ft
  stone: 1.25, // irregular larger face stones
  concrete: 1.5, // larger concrete blocks
}

const BASE_DEPTH_FT: Record<BlockType, number> = {
  segmental: 0.5, // 6"
  stone: 0.67, // 8"
  concrete: 0.67,
}

const BASE_WIDTH_FT: Record<BlockType, number> = {
  segmental: 1.0, // 12" minimum
  stone: 1.25,
  concrete: 1.5,
}

const BACKFILL_DEPTH_FT = 1.0 // 12" drainage/backfill zone behind wall

const DIY_HEIGHT_THRESHOLD_FT = 3.5
const ENGINEER_HEIGHT_THRESHOLD_FT = 4.0

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function estimateRetainingWall(inputs: RetainingWallInputs): RetainingWallResult {
  const wallLengthFt = clamp(inputs.wallLengthFt, 2, 200)
  const wallHeightFt = clamp(inputs.wallHeightFt, 1, 12)
  const wastePercent = clamp(inputs.wastePercent ?? 8, 0, 20)

  const wallAreaSqFt = wallLengthFt * wallHeightFt

  const blocksNeeded = Math.ceil(wallAreaSqFt * BLOCKS_PER_SQFT[inputs.blockType])
  const blocksWithWaste = Math.ceil(blocksNeeded * (1 + wastePercent / 100))

  const baseVolumeCuFt = wallLengthFt * BASE_WIDTH_FT[inputs.blockType] * BASE_DEPTH_FT[inputs.blockType]
  const baseGravelCuYd = baseVolumeCuFt / CUFT_PER_CUYD

  const backfillVolumeCuFt = wallLengthFt * wallHeightFt * BACKFILL_DEPTH_FT
  const backfillCuYd = backfillVolumeCuFt / CUFT_PER_CUYD

  const drainagePipeFt = inputs.drainage === 'pipe' ? Math.ceil(wallLengthFt * 1.05) : 0

  const warnings: string[] = []

  if (wallHeightFt > DIY_HEIGHT_THRESHOLD_FT) {
    warnings.push(
      `Walls over ~${DIY_HEIGHT_THRESHOLD_FT} ft often require a permit and professional build.`
    )
  }

  if (wallHeightFt > ENGINEER_HEIGHT_THRESHOLD_FT) {
    warnings.push(
      'An engineer or qualified pro is recommended at this height for safety and drainage design.'
    )
  }

  if (inputs.tieredSlope) {
    warnings.push('Tiered or sloped sites add complexity; consider a pro for layout and drainage.')
  }

  if (inputs.soilType === 'clay' && inputs.drainage !== 'pipe') {
    warnings.push('Clay soils hold water — a perforated drain pipe is strongly recommended.')
  }

  let diyDifficulty: RetainingWallResult['diyDifficulty'] = 'easy'

  if (wallHeightFt > 2 || wallLengthFt > 25) diyDifficulty = 'moderate'
  if (wallHeightFt > 4 || wallLengthFt > 40 || inputs.tieredSlope) diyDifficulty = 'pro'
  if (wallHeightFt > 6) diyDifficulty = 'engineer'

  return {
    wallAreaSqFt: Math.round(wallAreaSqFt),
    blocksNeeded,
    blocksWithWaste,
    baseGravelCuYd: Number(baseGravelCuYd.toFixed(2)),
    backfillCuYd: Number(backfillCuYd.toFixed(2)),
    drainagePipeFt,
    diyDifficulty,
    warnings,
    assumptions: [
      'Planning-level estimate using standard retaining wall rules of thumb.',
      'Assumes straight wall without curves or steps unless tiered selected.',
      'Backfill volume assumes a 12" drainage zone behind the wall.',
      'Always check local codes for permits and height limits.',
    ],
  }
}

