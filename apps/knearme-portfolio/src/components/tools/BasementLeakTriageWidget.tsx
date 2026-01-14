'use client'

/**
 * Basement Leak Source Triage + Fix Order widget.
 *
 * Deterministic planning-only guidance for homeowners.
 * See PRD: docs/13-homeowner-tools-phase-2/basement-leak-triage.md
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Droplets } from 'lucide-react'
import {
  Badge, Button, Input, Label,
} from '@/components/ui'
import {
  AssumptionsList,
  CauseDisplay,
  InputsCard,
  ProTriggersCard,
  ResultListCard,
  ResultsCard,
  type SelectOption,
  SymptomChecklist,
  type SymptomOption,
  TierResultBadge,
  ToolSelect,
  ToolWidgetLayout,
} from '@/components/tools/ToolWidgetBase'
import {
  triageBasementLeak,
  type BasementLeakInputs,
  type LeakLocation,
  type RainPattern,
  type VisibleSymptom,
  type GuttersTier,
  type GradingTier,
} from '@/lib/tools/basement-leak-triage'

const LOCATION_OPTIONS: Array<{ value: LeakLocation; label: string }> = [
  { value: 'floor-joint', label: 'Along floor joint / base of wall' },
  { value: 'wall-floor-corner', label: 'Wall‑floor corner' },
  { value: 'mid-wall', label: 'Mid‑wall dampness' },
  { value: 'window-well', label: 'Near window well' },
  { value: 'chimney-penetration', label: 'Near chimney / roofline' },
]

const RAIN_OPTIONS: Array<{ value: RainPattern; label: string }> = [
  { value: 'after-rain', label: 'Mostly after rain or snowmelt' },
  { value: 'constant', label: 'Constant / not tied to rain' },
  { value: 'unsure', label: 'Not sure' },
]

const SYMPTOM_OPTIONS: Array<{ value: VisibleSymptom; label: string }> = [
  { value: 'none', label: 'No visible masonry symptoms' },
  { value: 'efflorescence', label: 'White staining (efflorescence)' },
  { value: 'cracks', label: 'Visible cracks' },
  { value: 'crumbling-mortar', label: 'Crumbling / missing mortar' },
]

const GUTTER_OPTIONS: Array<{ value: GuttersTier; label: string }> = [
  { value: 'good', label: 'Good / drains well' },
  { value: 'overflowing', label: 'Overflowing / dumping water' },
  { value: 'unsure', label: 'Not sure' },
]

const GRADING_OPTIONS: Array<{ value: GradingTier; label: string }> = [
  { value: 'away', label: 'Slopes away from house' },
  { value: 'flat', label: 'Mostly flat' },
  { value: 'toward', label: 'Slopes toward house' },
]

type SumpOption = 'yes' | 'no' | 'unsure'

const SUMP_OPTIONS: Array<SelectOption<SumpOption>> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure' },
]

const DEFAULT_INPUTS: BasementLeakInputs = {
  location: 'wall-floor-corner',
  rainPattern: 'after-rain',
  visibleSymptom: 'none',
  extraSymptoms: {
    activeLeak: false,
    moldOrMusty: false,
    standingWater: false,
  },
}

const TIER_CONTENT: Record<'low' | 'medium' | 'high', { title: string; body: string }> = {
  low: {
    title: 'Low risk / early moisture',
    body: 'This pattern usually indicates minor moisture risk. Improve drainage and monitor for changes.',
  },
  medium: {
    title: 'Medium risk',
    body: 'Water entry is likely. Prioritize drainage and masonry repairs before sealing.',
  },
  high: {
    title: 'High risk / active leak',
    body: 'This pattern suggests an active leak or significant moisture path. Professional inspection is recommended.',
  },
}

type ExtraSymptomKey = keyof NonNullable<BasementLeakInputs['extraSymptoms']>

const EXTRA_SYMPTOMS: SymptomOption<ExtraSymptomKey>[] = [
  { key: 'activeLeak', label: 'Active leaking / dripping' },
  { key: 'standingWater', label: 'Standing water or puddles' },
  { key: 'moldOrMusty', label: 'Musty odor or visible mold' },
]

export function BasementLeakTriageWidget() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const result = useMemo(() => triageBasementLeak(inputs), [inputs])
  const tierContent = TIER_CONTENT[result.tier]
  const sumpValue: SumpOption = inputs.sumpPresent === undefined
    ? 'unsure'
    : inputs.sumpPresent
      ? 'yes'
      : 'no'

  const setExtra = (key: ExtraSymptomKey, checked: boolean) => {
    setInputs((prev) => ({
      ...prev,
      extraSymptoms: { ...prev.extraSymptoms, [key]: checked },
    }))
  }

  return (
    <ToolWidgetLayout
      results={(
        <div className='space-y-6'>
          <ResultsCard title='Risk + likely source'>
            <TierResultBadge
              tier={result.tier}
              variant='risk'
              title={tierContent.title}
              body={tierContent.body}
              score={result.score}
              scoreLabel='Risk score'
            />
            <CauseDisplay
              label={result.likelySource.label}
              confidence={result.likelySource.confidence}
              description={result.likelySource.rationale}
              sectionLabel='Most likely source'
            />
          </ResultsCard>

          <ResultListCard title='Conservative fix order' items={result.fixOrder} smallTitle />
          <ProTriggersCard triggers={result.proTriggers} />

          <ResultsCard title='Assumptions' smallTitle>
            <AssumptionsList assumptions={result.assumptions} />
          </ResultsCard>

          <Badge variant='secondary'>Planning guidance</Badge>
          <div className='flex flex-col gap-2'>
            <Button asChild variant='outline'>
              <Link href='/tools/waterproofing-risk-checklist'>Waterproofing checklist</Link>
            </Button>
            <Button asChild>
              <Link href='/tools/foundation-crack-severity-checker'>Check foundation cracks</Link>
            </Button>
          </div>
        </div>
      )}
    >
      <InputsCard title='Your basement symptoms' icon={Droplets}>
        <ToolSelect
          label='Where is the moisture/leak?'
          value={inputs.location}
          onChange={(value) => setInputs((p) => ({ ...p, location: value as LeakLocation }))}
          options={LOCATION_OPTIONS}
        />

        <ToolSelect
          label='Does it happen mainly after rain?'
          value={inputs.rainPattern}
          onChange={(value) => setInputs((p) => ({ ...p, rainPattern: value as RainPattern }))}
          options={RAIN_OPTIONS}
        />

        <ToolSelect
          label='Visible masonry symptoms'
          value={inputs.visibleSymptom}
          onChange={(value) => setInputs((p) => ({ ...p, visibleSymptom: value as VisibleSymptom }))}
          options={SYMPTOM_OPTIONS}
        />

        <details className='rounded-lg border p-3'>
          <summary className='cursor-pointer text-sm font-medium'>Drainage + history (optional)</summary>
          <div className='mt-4 grid gap-4 sm:grid-cols-2'>
            <ToolSelect
              label='Gutters & downspouts'
              value={inputs.gutters ?? 'unsure'}
              onChange={(value) => setInputs((p) => ({ ...p, gutters: value as GuttersTier }))}
              options={GUTTER_OPTIONS}
            />

            <ToolSelect
              label='Grading near house'
              value={inputs.grading ?? 'flat'}
              onChange={(value) => setInputs((p) => ({ ...p, grading: value as GradingTier }))}
              options={GRADING_OPTIONS}
            />

            <ToolSelect
              label='Sump pump or interior drain?'
              value={sumpValue}
              onChange={(value) => setInputs((p) => ({
                ...p,
                sumpPresent: value === 'unsure' ? undefined : value === 'yes',
              }))}
              options={SUMP_OPTIONS}
            />

            <div className='space-y-2'>
              <Label>Home age (years)</Label>
              <Input
                type='number'
                min={0}
                max={200}
                value={inputs.ageYears ?? ''}
                onChange={(e) => setInputs((p) => ({ ...p, ageYears: Number(e.target.value) || undefined }))}
              />
            </div>
          </div>

          <SymptomChecklist
            label='Extra red-flag symptoms'
            symptoms={EXTRA_SYMPTOMS}
            values={inputs.extraSymptoms ?? {}}
            onChange={setExtra}
            className='mt-4'
          />
        </details>
      </InputsCard>
    </ToolWidgetLayout>
  )
}

export default BasementLeakTriageWidget
