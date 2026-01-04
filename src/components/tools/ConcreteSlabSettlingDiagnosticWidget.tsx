'use client'

/**
 * Concrete Slab / Patio Settling Diagnostic widget.
 *
 * Deterministic planning-only guidance for homeowners.
 * See PRD: docs/13-homeowner-tools-phase-2/concrete-slab-settling-diagnostic.md
 *
 * Uses shared components from ToolWidgetBase.tsx to reduce duplication.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Layers } from 'lucide-react'
import { Label, Input, Badge, Button } from '@/components/ui'
import {
  diagnoseConcreteSettling,
  type ConcreteSettlingInputs,
  type SettlementPattern,
  type WaterSource,
  type SoilGuess,
  type CrackPattern,
} from '@/lib/tools/concrete-slab-settling'
import {
  ToolWidgetLayout,
  InputsCard,
  ResultsCard,
  ToolSelect,
  TierResultBadge,
  CauseDisplay,
  ResultListCard,
  ProTriggersCard,
  type SelectOption,
} from '@/components/tools/ToolWidgetBase'

const PATTERN_OPTIONS: SelectOption<SettlementPattern>[] = [
  { value: 'edge-near-house', label: 'Edge near the house' },
  { value: 'edge-away-house', label: 'Edge away from the house' },
  { value: 'center-dip', label: 'Center dip' },
  { value: 'random-spots', label: 'Random spots' },
]

const WATER_OPTIONS: SelectOption<WaterSource>[] = [
  { value: 'downspout-splash', label: 'Downspout splash / roof runoff' },
  { value: 'sprinkler-runoff', label: 'Sprinkler overspray or irrigation' },
  { value: 'pooling-water', label: 'Pooling water nearby' },
  { value: 'none', label: 'No obvious water source' },
]

const SOIL_OPTIONS: SelectOption<SoilGuess>[] = [
  { value: 'clay', label: 'Clay / heavy soil' },
  { value: 'sandy', label: 'Sandy / fast draining' },
  { value: 'unknown', label: 'Not sure' },
]

const CRACK_OPTIONS: SelectOption<CrackPattern>[] = [
  { value: 'none', label: 'No cracks' },
  { value: 'hairline', label: 'Hairline cracks' },
  { value: 'wide', label: 'Wide cracks (>1/8")' },
  { value: 'multiple', label: 'Multiple cracks / sections moving' },
]

const DEFAULT_INPUTS: ConcreteSettlingInputs = {
  settlementInches: 0.5,
  pattern: 'edge-near-house',
  waterSource: 'none',
}

export function ConcreteSlabSettlingDiagnosticWidget() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const result = useMemo(() => diagnoseConcreteSettling(inputs), [inputs])

  const resultsContent = (
    <>
      <ResultsCard title='Diagnosis'>
        <TierResultBadge
          tier={result.severity}
          variant='severity'
          score={result.score}
          scoreLabel='Severity score'
        />

        <CauseDisplay
          label={result.likelyCause.label}
          description={result.likelyCause.description}
          confidence={result.likelyCause.confidence}
        />
      </ResultsCard>

      <ResultListCard
        title='Recommended next steps'
        items={result.nextSteps}
        smallTitle
      />

      <ProTriggersCard triggers={result.proTriggers} />

      <Badge variant='secondary'>Planning guidance</Badge>
      <div className='flex flex-col gap-2'>
        <Button asChild variant='outline'>
          <Link href='/tools/outdoor-drainage-quick-planner'>Plan drainage fixes</Link>
        </Button>
        <Button asChild>
          <Link href='/tools/masonry-cost-estimator'>Estimate repair cost</Link>
        </Button>
      </div>
    </>
  )

  return (
    <ToolWidgetLayout results={resultsContent}>
      <InputsCard title='Your slab/patio' icon={Layers}>
        <div className='space-y-2'>
          <Label>About how much has it settled? (inches)</Label>
          <Input
            type='number'
            min={0}
            max={6}
            step={0.1}
            value={inputs.settlementInches}
            onChange={(e) => setInputs((p) => ({ ...p, settlementInches: Number(e.target.value) || 0 }))}
          />
        </div>

        <ToolSelect
          label='Settlement pattern'
          value={inputs.pattern}
          onChange={(v) => setInputs((p) => ({ ...p, pattern: v }))}
          options={PATTERN_OPTIONS}
        />

        <ToolSelect
          label='Nearby water source'
          value={inputs.waterSource}
          onChange={(v) => setInputs((p) => ({ ...p, waterSource: v }))}
          options={WATER_OPTIONS}
        />

        <details className='rounded-lg border p-3'>
          <summary className='cursor-pointer text-sm font-medium'>Soil + slab history (optional)</summary>
          <div className='mt-4 grid gap-4 sm:grid-cols-2'>
            <ToolSelect
              label='Soil type guess'
              value={inputs.soil ?? 'unknown'}
              onChange={(v) => setInputs((p) => ({ ...p, soil: v }))}
              options={SOIL_OPTIONS}
            />

            <div className='space-y-2'>
              <Label>Slab age (years)</Label>
              <Input
                type='number'
                min={0}
                max={100}
                value={inputs.slabAgeYears ?? ''}
                onChange={(e) => setInputs((p) => ({ ...p, slabAgeYears: Number(e.target.value) || undefined }))}
              />
            </div>

            <div className='sm:col-span-2'>
              <ToolSelect
                label='Crack pattern'
                value={inputs.cracks ?? 'none'}
                onChange={(v) => setInputs((p) => ({ ...p, cracks: v }))}
                options={CRACK_OPTIONS}
              />
            </div>
          </div>
        </details>
      </InputsCard>
    </ToolWidgetLayout>
  )
}

export default ConcreteSlabSettlingDiagnosticWidget

