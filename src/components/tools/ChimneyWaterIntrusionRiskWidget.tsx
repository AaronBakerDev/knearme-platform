'use client'

/**
 * Chimney Water Intrusion Risk Checklist widget.
 *
 * Deterministic scoring + fix-order guidance for homeowners.
 * See PRD: docs/13-homeowner-tools-phase-2/chimney-water-intrusion-risk-checklist.md
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Droplets } from 'lucide-react'
import {
  Badge, Button, Input,
} from '@/components/ui'
import {
  CauseDisplay,
  InputsCard,
  ProTriggersCard,
  ResultListCard,
  ResultsCard,
  SymptomCheckbox,
  TierResultBadge,
  ToolSelect,
  ToolWidgetLayout,
} from '@/components/tools/ToolWidgetBase'
import {
  scoreChimneyWaterIntrusion,
  type ChimneyWaterInputs,
  type ChimneyWaterSymptom,
  type RooflineCondition,
  type FreezeThawTier,
} from '@/lib/tools/chimney-water-intrusion'

const SYMPTOM_OPTIONS: Array<{ value: ChimneyWaterSymptom; label: string }> = [
  { value: 'none', label: 'No obvious symptoms' },
  { value: 'efflorescence', label: 'White staining on chimney' },
  { value: 'inside-staining', label: 'Staining near fireplace inside' },
  { value: 'attic-staining', label: 'Staining in attic near chimney' },
  { value: 'active-leak', label: 'Active leak during rain' },
]

const ROOFLINE_OPTIONS: Array<{ value: RooflineCondition; label: string }> = [
  { value: 'good', label: 'Cap/crown/flashing look good' },
  { value: 'damaged', label: 'Visible damage or gaps' },
  { value: 'unknown', label: 'Not sure / can’t see well' },
]

const CLIMATE_OPTIONS: Array<{ value: FreezeThawTier; label: string }> = [
  { value: 'freeze-thaw', label: 'Freeze‑thaw climate (cold/mixed)' },
  { value: 'no-freeze', label: 'No freeze‑thaw (warm/dry)' },
]

const DEFAULT_INPUTS: ChimneyWaterInputs = {
  symptom: 'none',
  roofline: 'unknown',
  climate: 'freeze-thaw',
  mortarSpalling: false,
}

const TIER_TITLES: Record<'low' | 'medium' | 'high', string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
}

export function ChimneyWaterIntrusionRiskWidget() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const result = useMemo(() => scoreChimneyWaterIntrusion(inputs), [inputs])
  const tierTitle = TIER_TITLES[result.tier]

  return (
    <ToolWidgetLayout
      results={(
        <div className='space-y-6'>
          <ResultsCard title='Risk result'>
            <TierResultBadge
              tier={result.tier}
              variant='risk'
              title={tierTitle}
              score={result.score}
              scoreLabel='Risk score'
            />
            <CauseDisplay
              label={result.likelyEntryPath.label}
              description={result.likelyEntryPath.description}
              sectionLabel='Likely entry path'
            />
          </ResultsCard>

          <ResultListCard title='Conservative fix order' items={result.fixOrder} smallTitle />
          <ProTriggersCard triggers={result.proTriggers} />

          <Badge variant='secondary'>Planning guidance</Badge>
          <div className='flex flex-col gap-2'>
            <Button asChild variant='outline'>
              <Link href='/tools/chimney-repair-urgency-checklist'>Chimney urgency checklist</Link>
            </Button>
            <Button asChild>
              <Link href='/tools/masonry-cost-estimator'>Estimate repair cost</Link>
            </Button>
          </div>
        </div>
      )}
    >
      <InputsCard title='Chimney symptoms' icon={Droplets}>
        <ToolSelect
          label='Symptoms seen'
          value={inputs.symptom}
          onChange={(value) => setInputs((p) => ({ ...p, symptom: value as ChimneyWaterSymptom }))}
          options={SYMPTOM_OPTIONS}
        />

        <ToolSelect
          label='Top/roofline condition'
          value={inputs.roofline}
          onChange={(value) => setInputs((p) => ({ ...p, roofline: value as RooflineCondition }))}
          options={ROOFLINE_OPTIONS}
        />

        <ToolSelect
          label='Climate exposure'
          value={inputs.climate}
          onChange={(value) => setInputs((p) => ({ ...p, climate: value as FreezeThawTier }))}
          options={CLIMATE_OPTIONS}
        />

        <details className='rounded-lg border p-3'>
          <summary className='cursor-pointer text-sm font-medium'>Chimney history (optional)</summary>
          <div className='mt-4 grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Chimney age (years)</label>
              <Input
                type='number'
                min={0}
                max={150}
                value={inputs.chimneyAgeYears ?? ''}
                onChange={(e) => setInputs((p) => ({ ...p, chimneyAgeYears: Number(e.target.value) || undefined }))}
              />
            </div>

            <ToolSelect
              label='Prior waterproofing'
              value={inputs.priorWaterproofing ?? 'never'}
              onChange={(value) => setInputs((p) => ({ ...p, priorWaterproofing: value as ChimneyWaterInputs['priorWaterproofing'] }))}
              options={[
                { value: 'never', label: 'Never' },
                { value: 'over-5-years', label: 'Over 5 years ago' },
                { value: 'under-5-years', label: 'Within 5 years' },
              ]}
            />
          </div>

          <div className='mt-4 space-y-2 text-sm'>
            <SymptomCheckbox
              label='Mortar gaps or spalling bricks'
              checked={!!inputs.mortarSpalling}
              onChange={(checked) => setInputs((p) => ({ ...p, mortarSpalling: checked }))}
            />
          </div>
        </details>
      </InputsCard>
    </ToolWidgetLayout>
  )
}

export default ChimneyWaterIntrusionRiskWidget
