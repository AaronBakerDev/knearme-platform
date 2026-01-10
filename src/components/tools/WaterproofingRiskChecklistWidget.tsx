'use client'

/**
 * Masonry Waterproofing Risk + Decision Checklist widget.
 *
 * Deterministic scoring + rule-based first action.
 * Page wrapper handles ToolLayout + metadata.
 *
 * Uses shared components from ToolWidgetBase.tsx to reduce duplication.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Droplets } from 'lucide-react'
import { Card, CardContent, Button } from '@/components/ui'
import {
  scoreWaterproofingRisk,
  type WaterproofingRiskInputs,
  type ClimateTier,
  type MasonryType,
  type ExposureTier,
  type DrainageTier,
  type IssueLocation,
} from '@/lib/tools/waterproofing-risk'
import {
  ToolWidgetLayout,
  InputsCard,
  ResultsCard,
  ToolSelect,
  SymptomChecklist,
  TierResultBadge,
  CauseDisplay,
  ProTriggersInline,
  ResultListCard,
  ToolDisclaimer,
  type SelectOption,
  type SymptomOption,
} from '@/components/tools/ToolWidgetBase'

const DEFAULT_INPUTS: WaterproofingRiskInputs = {
  climate: 'freeze-thaw',
  masonryType: 'brick',
  exposure: 'moderate',
  drainage: 'ok',
  location: 'mid-wall',
  symptoms: {
    efflorescence: false,
    spalling: false,
    dampInterior: false,
    activeLeak: false,
    mustyMold: false,
    mortarGaps: false,
  },
}

const CLIMATE_OPTIONS: SelectOption<ClimateTier>[] = [
  { value: 'freeze-thaw', label: 'Freeze-thaw climate (cold/mixed)' },
  { value: 'no-freeze', label: 'No freeze-thaw (warm/dry)' },
]

const MASONRY_OPTIONS: SelectOption<MasonryType>[] = [
  { value: 'brick', label: 'Brick' },
  { value: 'stone', label: 'Stone' },
  { value: 'block', label: 'Block / foundation masonry' },
]

const EXPOSURE_OPTIONS: SelectOption<ExposureTier>[] = [
  { value: 'high', label: 'High exposure / wind-driven rain' },
  { value: 'moderate', label: 'Moderate exposure' },
  { value: 'sheltered', label: 'Sheltered / covered' },
]

const DRAINAGE_OPTIONS: SelectOption<DrainageTier>[] = [
  { value: 'good', label: 'Good drainage & gutters' },
  { value: 'ok', label: 'OK / average drainage' },
  { value: 'poor', label: 'Poor (overflowing gutters or standing water)' },
]

const LOCATION_OPTIONS: SelectOption<IssueLocation>[] = [
  { value: 'roofline-chimney', label: 'Near roofline / chimney' },
  { value: 'mid-wall', label: 'Mid-wall' },
  { value: 'at-grade', label: 'At grade / basement' },
]

type SymptomKey = keyof WaterproofingRiskInputs['symptoms']

const SYMPTOMS: SymptomOption<SymptomKey>[] = [
  { key: 'efflorescence', label: 'White staining (efflorescence)', helper: 'Powdery white streaks on brick/stone.' },
  { key: 'spalling', label: 'Spalling/flaking brick', helper: 'Brick faces popping off or crumbling.' },
  { key: 'dampInterior', label: 'Damp interior wall/basement', helper: 'Moist wall surface inside.' },
  { key: 'activeLeak', label: 'Active leak during rain', helper: 'Visible dripping or wet spots when it rains.' },
  { key: 'mustyMold', label: 'Musty odor / visible mold nearby', helper: 'Signs of ongoing moisture.' },
  { key: 'mortarGaps', label: 'Mortar gaps/cracking', helper: 'Missing or deteriorated mortar joints.' },
]

/** Tool-specific body text for each tier. */
const TIER_BODY_TEXT = {
  low: 'Symptoms suggest early or cosmetic moisture risk. Maintain and monitor.',
  medium: 'Moisture paths are likely. Plan repairs before sealing.',
  high: 'Active water damage is likely. Prioritize professional inspection.',
} as const

export function WaterproofingRiskChecklistWidget() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const result = useMemo(() => scoreWaterproofingRisk(inputs), [inputs])
  const tierBody = TIER_BODY_TEXT[result.tier]

  const updateSymptom = (key: SymptomKey, checked: boolean) => {
    setInputs((prev) => ({ ...prev, symptoms: { ...prev.symptoms, [key]: checked } }))
  }

  const resultsContent = (
    <>
      <ResultsCard title='Risk result'>
        <TierResultBadge
          tier={result.tier}
          variant='risk'
          body={tierBody}
          score={result.score}
          scoreLabel='Risk score'
        />

        <CauseDisplay
          label={result.firstAction}
          sectionLabel='First thing to do'
        />

        <ProTriggersInline triggers={result.proTriggers} title='When to call a pro' />

        <Button asChild className='w-full'>
          <Link href='/tools/masonry-cost-estimator?service=waterproofing'>Estimate repair cost</Link>
        </Button>
      </ResultsCard>

      <ResultListCard
        title='Prioritized plan'
        items={result.planSteps}
        smallTitle
        numbered
      />

      <ResultListCard
        title='Why this result?'
        items={result.reasons}
        smallTitle
      />

      <Card className='border-0 bg-muted/30'>
        <CardContent className='py-4 text-sm flex flex-col gap-2'>
          <Link href='/services/masonry-waterproofing' className='underline'>
            Waterproofing service guide
          </Link>
          <Link href='/tools/efflorescence-treatment-planner' className='underline'>
            Efflorescence treatment planner
          </Link>
        </CardContent>
      </Card>
    </>
  )

  return (
    <ToolWidgetLayout results={resultsContent}>
      <InputsCard title='Your wall conditions' icon={Droplets}>
        <ToolSelect
          label='Climate exposure'
          value={inputs.climate}
          onChange={(v) => setInputs((p) => ({ ...p, climate: v }))}
          options={CLIMATE_OPTIONS}
        />

        <ToolSelect
          label='Masonry type'
          value={inputs.masonryType}
          onChange={(v) => setInputs((p) => ({ ...p, masonryType: v }))}
          options={MASONRY_OPTIONS}
        />

        <ToolSelect
          label='Exposure'
          value={inputs.exposure}
          onChange={(v) => setInputs((p) => ({ ...p, exposure: v }))}
          options={EXPOSURE_OPTIONS}
        />

        <ToolSelect
          label='Drainage & gutters'
          value={inputs.drainage}
          onChange={(v) => setInputs((p) => ({ ...p, drainage: v }))}
          options={DRAINAGE_OPTIONS}
        />

        <ToolSelect
          label='Where is the issue?'
          value={inputs.location}
          onChange={(v) => setInputs((p) => ({ ...p, location: v }))}
          options={LOCATION_OPTIONS}
        />

        <SymptomChecklist
          label='Check any symptoms you see'
          symptoms={SYMPTOMS}
          values={inputs.symptoms}
          onChange={updateSymptom}
        />
        <ToolDisclaimer text='Informational only - not a substitute for a professional inspection.' />
      </InputsCard>
    </ToolWidgetLayout>
  )
}

export default WaterproofingRiskChecklistWidget

