'use client'

/**
 * Repoint vs Replace Decision Tool widget.
 *
 * Deterministic planning-only guidance for homeowners.
 * See PRD: docs/13-homeowner-tools-phase-2/repoint-vs-replace-decision.md
 *
 * Uses shared components from ToolWidgetBase.tsx to reduce duplication.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Wrench } from 'lucide-react'
import { Label, Input, Badge, Button } from '@/components/ui'
import {
  decideRepointVsReplace,
  type RepointReplaceInputs,
  type MortarLossTier,
  type BrickDamageTier,
  type FreezeThawTier,
  type PriorSealingTier,
} from '@/lib/tools/repoint-vs-replace'
import {
  ToolWidgetLayout,
  InputsCard,
  ResultsCard,
  ToolSelect,
  SymptomChecklist,
  TierResultBadge,
  CauseDisplay,
  ResultListCard,
  ProTriggersCard,
  type SelectOption,
  type SymptomOption,
} from '@/components/tools/ToolWidgetBase'

const MORTAR_OPTIONS: SelectOption<MortarLossTier>[] = [
  { value: 'surface-dusting', label: 'Surface dusting / shallow wear' },
  { value: 'gaps-1-4-to-1-2', label: 'Gaps about 1/4-1/2 inch deep' },
  { value: 'missing-over-1-2', label: 'More than 1/2 inch missing' },
]

const BRICK_OPTIONS: SelectOption<BrickDamageTier>[] = [
  { value: 'none', label: 'Bricks mostly sound' },
  { value: 'some-spalling', label: 'Some spalling / soft bricks' },
  { value: 'many-damaged', label: 'Many bricks broken or soft' },
]

const CLIMATE_OPTIONS: SelectOption<FreezeThawTier>[] = [
  { value: 'freeze-thaw', label: 'Freeze-thaw climate (cold/mixed)' },
  { value: 'no-freeze', label: 'No freeze-thaw (warm/dry)' },
]

const SEALING_OPTIONS: SelectOption<PriorSealingTier>[] = [
  { value: 'never', label: 'Never sealed' },
  { value: 'over-5-years', label: 'Sealed over 5 years ago' },
  { value: 'under-5-years', label: 'Sealed in last 5 years' },
]

type MoistureKey = keyof NonNullable<RepointReplaceInputs['moistureSymptoms']>

const MOISTURE_SYMPTOMS: SymptomOption<MoistureKey>[] = [
  { key: 'efflorescence', label: 'White staining (efflorescence)' },
  { key: 'dampInterior', label: 'Damp interior wall/basement' },
  { key: 'activeLeak', label: 'Active leak during rain' },
]

const DEFAULT_INPUTS: RepointReplaceInputs = {
  mortarLoss: 'surface-dusting',
  brickDamage: 'none',
  climate: 'freeze-thaw',
  moistureSymptoms: {
    efflorescence: false,
    dampInterior: false,
    activeLeak: false,
  },
}

export function RepointVsReplaceDecisionWidget() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const result = useMemo(() => decideRepointVsReplace(inputs), [inputs])

  const updateMoisture = (key: MoistureKey, checked: boolean) => {
    setInputs((prev) => ({
      ...prev,
      moistureSymptoms: { ...prev.moistureSymptoms, [key]: checked },
    }))
  }

  const resultsContent = (
    <>
      <ResultsCard title='Recommendation'>
        <TierResultBadge
          tier={result.tier}
          variant='severity'
          score={result.score}
        />

        <CauseDisplay
          label={result.recommendation.label}
          description={result.recommendation.reasoning}
          sectionLabel='Most likely next step'
        />

        <div className='rounded-lg border p-3 text-sm'>
          <div className='text-xs font-medium uppercase text-muted-foreground mb-1'>Scope band</div>
          <div className='font-medium capitalize'>{result.scope.replace('-', ' ')}</div>
        </div>
      </ResultsCard>

      <ResultListCard
        title='Conservative next steps'
        items={result.nextSteps}
        smallTitle
      />

      <ProTriggersCard triggers={result.proTriggers} />

      <Badge variant='secondary'>Planning guidance</Badge>
      <div className='flex flex-col gap-2'>
        <Button asChild variant='outline'>
          <Link href='/tools/tuckpointing-calculator'>Estimate tuckpointing materials</Link>
        </Button>
        <Button asChild variant='outline'>
          <Link href='/tools/brick-replacement-calculator'>Estimate brick replacement</Link>
        </Button>
        <Button asChild>
          <Link href='/tools/masonry-cost-estimator'>Estimate cost</Link>
        </Button>
      </div>
    </>
  )

  return (
    <ToolWidgetLayout results={resultsContent}>
      <InputsCard title='Your wall condition' icon={Wrench}>
        <ToolSelect
          label='Mortar loss depth'
          value={inputs.mortarLoss}
          onChange={(v) => setInputs((p) => ({ ...p, mortarLoss: v }))}
          options={MORTAR_OPTIONS}
        />

        <ToolSelect
          label='Brick/stone damage rate'
          value={inputs.brickDamage}
          onChange={(v) => setInputs((p) => ({ ...p, brickDamage: v }))}
          options={BRICK_OPTIONS}
        />

        <ToolSelect
          label='Climate exposure'
          value={inputs.climate}
          onChange={(v) => setInputs((p) => ({ ...p, climate: v }))}
          options={CLIMATE_OPTIONS}
        />

        <details className='rounded-lg border p-3'>
          <summary className='cursor-pointer text-sm font-medium'>Moisture + history (optional)</summary>
          <div className='mt-4 grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Wall age (years)</Label>
              <Input
                type='number'
                min={0}
                max={200}
                value={inputs.wallAgeYears ?? ''}
                onChange={(e) => setInputs((p) => ({ ...p, wallAgeYears: Number(e.target.value) || undefined }))}
              />
            </div>

            <ToolSelect
              label='Prior sealing'
              value={inputs.priorSealing ?? 'never'}
              onChange={(v) => setInputs((p) => ({ ...p, priorSealing: v }))}
              options={SEALING_OPTIONS}
            />
          </div>

          <div className='mt-4'>
            <SymptomChecklist
              label='Moisture symptoms'
              symptoms={MOISTURE_SYMPTOMS}
              values={inputs.moistureSymptoms ?? {}}
              onChange={updateMoisture}
            />
          </div>
        </details>
      </InputsCard>
    </ToolWidgetLayout>
  )
}

export default RepointVsReplaceDecisionWidget

