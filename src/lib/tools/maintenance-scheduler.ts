/**
 * Masonry maintenance schedule generator.
 *
 * Deterministic, planning-level calendar for homeowners.
 * See PRD: docs/12-homeowner-tools/masonry-maintenance-scheduler.md
 */

export type MasonryType = 'brick' | 'stone' | 'concrete' | 'chimney'
export type ClimateExposure = 'mild' | 'mixed' | 'harsh'

export interface MaintenanceInputs {
  masonryType: MasonryType
  ageYears: number
  climate: ClimateExposure
  lastInspectionYear?: number
  lastSealingYear?: number
  lastCleaningYear?: number
}

export type Season = 'spring' | 'summer' | 'fall' | 'winter'

export interface MaintenanceTask {
  season: Season
  title: string
  description: string
  due: boolean
}

export interface MaintenanceScheduleResult {
  inspectionEveryYears: number
  sealingEveryYears: number
  cleaningEveryYears: number
  tasks: MaintenanceTask[]
  assumptions: string[]
}

const BASE_FREQUENCIES: Record<MasonryType, { inspection: number; sealing: number; cleaning: number }> = {
  brick: { inspection: 2, sealing: 7, cleaning: 2 },
  stone: { inspection: 2, sealing: 8, cleaning: 3 },
  concrete: { inspection: 3, sealing: 5, cleaning: 3 },
  chimney: { inspection: 1, sealing: 5, cleaning: 2 },
}

const CLIMATE_MULTIPLIER: Record<ClimateExposure, number> = {
  mild: 1.2, // warm/dry climates → slower wear
  mixed: 1.0,
  harsh: 0.75, // freeze-thaw / high moisture → faster wear
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function ageMultiplier(ageYears: number) {
  if (ageYears < 10) return 1.2
  if (ageYears < 30) return 1.0
  return 0.8
}

function computeFrequency(base: number, climate: ClimateExposure, ageYears: number) {
  const years = base * CLIMATE_MULTIPLIER[climate] * ageMultiplier(ageYears)
  return clamp(Number(years.toFixed(1)), 1, 12)
}

function isDue(lastYear: number | undefined, everyYears: number, currentYear: number) {
  if (!lastYear) return true
  return currentYear - lastYear >= everyYears
}

function buildTasks(
  type: MasonryType,
  due: { inspection: boolean; sealing: boolean; cleaning: boolean }
): MaintenanceTask[] {
  switch (type) {
    case 'chimney':
      return [
        {
          season: 'spring',
          title: 'Post‑winter chimney check',
          description: 'Inspect crown, cap, and exposed mortar for freeze‑thaw cracks or spalling.',
          due: due.inspection,
        },
        {
          season: 'summer',
          title: 'Clean and clear the firebox area',
          description: 'Remove loose debris, check damper operation, and look for interior moisture staining.',
          due: due.cleaning,
        },
        {
          season: 'fall',
          title: 'Annual sweep & inspection before heating season',
          description: 'Schedule a chimney inspection/sweep and verify flashing is watertight.',
          due: due.inspection,
        },
        {
          season: 'winter',
          title: 'Monitor for leaks or draft changes',
          description: 'If you notice new odors, dampness, or debris, stop use and call a pro.',
          due: false,
        },
      ]

    case 'stone':
      return [
        {
          season: 'spring',
          title: 'Inspect stone veneer / joints',
          description: 'Check mortar joints and stones for cracks, shifting, or white staining.',
          due: due.inspection,
        },
        {
          season: 'summer',
          title: 'Gentle wash and vegetation control',
          description: 'Rinse with low pressure and keep plants/sprinklers off the wall.',
          due: due.cleaning,
        },
        {
          season: 'fall',
          title: 'Repoint small gaps and consider sealing',
          description: 'Repair weak joints; apply breathable sealer only if masonry is sound and dry.',
          due: due.sealing,
        },
        {
          season: 'winter',
          title: 'Watch for moisture freeze‑thaw damage',
          description: 'Look for new flaking stones or mortar after storms.',
          due: false,
        },
      ]

    case 'concrete':
      return [
        {
          season: 'spring',
          title: 'Inspect for cracks and scaling',
          description: 'Check concrete masonry for cracks, spalling, or exposed aggregate.',
          due: due.inspection,
        },
        {
          season: 'summer',
          title: 'Clean and check drainage',
          description: 'Remove dirt/mildew and confirm downspouts and grading move water away.',
          due: due.cleaning,
        },
        {
          season: 'fall',
          title: 'Seal if due and repair small cracks',
          description: 'Apply concrete masonry sealer if recommended; patch hairline cracks.',
          due: due.sealing,
        },
        {
          season: 'winter',
          title: 'Avoid salt buildup near walls',
          description: 'De‑icing salts can accelerate scaling; use sparingly near concrete masonry.',
          due: false,
        },
      ]

    case 'brick':
    default:
      return [
        {
          season: 'spring',
          title: 'Inspect brick and mortar after winter',
          description: 'Look for cracking joints, spalling bricks, and new efflorescence.',
          due: due.inspection,
        },
        {
          season: 'summer',
          title: 'Clean surface and control moisture',
          description: 'Low‑pressure rinse, remove algae, and keep sprinklers off brick.',
          due: due.cleaning,
        },
        {
          season: 'fall',
          title: 'Repoint weak joints and seal if due',
          description: 'Repair mortar before cold weather; apply breathable sealer only when sound/dry.',
          due: due.sealing,
        },
        {
          season: 'winter',
          title: 'Monitor interior dampness',
          description: 'If you see leaks or rapid deterioration, schedule a pro inspection.',
          due: false,
        },
      ]
  }
}

export function generateMaintenanceSchedule(inputs: MaintenanceInputs): MaintenanceScheduleResult {
  const currentYear = new Date().getFullYear()
  const ageYears = clamp(inputs.ageYears, 0, 150)

  const base = BASE_FREQUENCIES[inputs.masonryType]

  const inspectionEveryYears = computeFrequency(base.inspection, inputs.climate, ageYears)
  const sealingEveryYears = computeFrequency(base.sealing, inputs.climate, ageYears)
  const cleaningEveryYears = computeFrequency(base.cleaning, inputs.climate, ageYears)

  const dueFlags = {
    inspection: isDue(inputs.lastInspectionYear, inspectionEveryYears, currentYear),
    sealing: isDue(inputs.lastSealingYear, sealingEveryYears, currentYear),
    cleaning: isDue(inputs.lastCleaningYear, cleaningEveryYears, currentYear),
  }

  const tasks = buildTasks(inputs.masonryType, dueFlags)

  return {
    inspectionEveryYears,
    sealingEveryYears,
    cleaningEveryYears,
    tasks,
    assumptions: [
      'Planning-level schedule using standard masonry maintenance rules of thumb.',
      'Adjust frequency for local codes, extreme weather, or known issues.',
      'Always repair mortar or brick damage before sealing.',
    ],
  }
}

