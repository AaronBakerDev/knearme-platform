/**
 * Paver base + materials calculator.
 *
 * Deterministic planning tool for patios/walkways/driveways.
 * See PRD: docs/12-homeowner-tools/paver-base-calculator.md
 */

export type ProjectLoad = 'pedestrian' | 'driveway'
export type SoilTier = 'sandy' | 'average' | 'clay'

export interface PaverBaseInputs {
  areaSqFt: number
  projectLoad: ProjectLoad
  paverThicknessIn: number
  soil: SoilTier
  freezeThaw: boolean
  wastePercent?: number
}

export interface PaverBaseResult {
  areaSqFt: number
  gravelDepthIn: number
  sandDepthIn: number
  excavationDepthIn: number
  gravelCuYd: number
  gravelCuFt: number
  sandCuYd: number
  sandCuFt: number
  assumptions: string[]
}

const CUFT_PER_CUYD = 27

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function baseGravelDepth(load: ProjectLoad): number {
  return load === 'driveway' ? 7 : 5
}

export function estimatePaverBase(inputs: PaverBaseInputs): PaverBaseResult {
  const areaSqFt = clamp(inputs.areaSqFt, 4, 5000)
  const paverThicknessIn = clamp(inputs.paverThicknessIn, 1, 4)
  const wastePercent = clamp(inputs.wastePercent ?? 10, 0, 20)

  let gravelDepthIn = baseGravelDepth(inputs.projectLoad)
  const sandDepthIn = 1

  if (inputs.soil === 'clay') gravelDepthIn += 2
  if (inputs.freezeThaw) gravelDepthIn += 2
  if (paverThicknessIn < 2) gravelDepthIn += 1

  gravelDepthIn = clamp(gravelDepthIn, 4, 12)

  const excavationDepthIn = gravelDepthIn + sandDepthIn + paverThicknessIn

  const gravelCuFt = areaSqFt * (gravelDepthIn / 12)
  const sandCuFt = areaSqFt * (sandDepthIn / 12)

  const gravelCuYd = gravelCuFt / CUFT_PER_CUYD
  const sandCuYd = sandCuFt / CUFT_PER_CUYD

  return {
    areaSqFt: Math.round(areaSqFt),
    gravelDepthIn,
    sandDepthIn,
    excavationDepthIn,
    gravelCuFt: Number(gravelCuFt.toFixed(1)),
    gravelCuYd: Number((gravelCuYd * (1 + wastePercent / 100)).toFixed(2)),
    sandCuFt: Number(sandCuFt.toFixed(1)),
    sandCuYd: Number((sandCuYd * (1 + wastePercent / 100)).toFixed(2)),
    assumptions: [
      'Assumes a standard 1" bedding sand layer and compacted gravel base.',
      'Depths follow typical residential rules of thumb; local codes vary.',
      `Includes ~${wastePercent}% overage for ordering and compaction loss.`,
      'Always slope surfaces away from the home for drainage.',
    ],
  }
}

