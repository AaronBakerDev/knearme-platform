'use client'

/**
 * Efflorescence Treatment Planner widget.
 *
 * Shared between the full tool page and potential SEO wrappers.
 * Uses deterministic rules-based treatment recommendations.
 */

import { useMemo } from 'react'
import Link from 'next/link'
import { Droplets, Brush } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { useUrlState, ShareableLinkButton } from '@/components/tools/ToolSharing'
import { StickyResultsBar } from '@/components/tools/ToolResults'
import { PDFExportButton } from '@/components/tools/ToolPDF'
import {
  AssumptionsList,
  InputsCard,
  ProTriggersInline,
  ResultListCard,
  ResultsCard,
  type SymptomOption,
  SymptomChecklist,
  ToolDisclaimer,
  ToolSelect,
  ToolWidgetLayout,
} from '@/components/tools/ToolWidgetBase'
import {
  planEfflorescenceTreatment,
  type EfflorescenceInputs,
  type EfflorescenceLocation,
  type EfflorescenceSeverity,
  type EfflorescenceTiming,
  type WallAgeTier,
} from '@/lib/tools/efflorescence'

const LOCATION_OPTIONS: Array<{ value: EfflorescenceLocation; label: string }> = [
  { value: 'exterior-wall', label: 'Exterior wall' },
  { value: 'interior-basement', label: 'Interior basement / crawlspace wall' },
  { value: 'chimney-roofline', label: 'Chimney / roofline area' },
]

const SEVERITY_OPTIONS: Array<{ value: EfflorescenceSeverity; label: string }> = [
  { value: 'light', label: 'Light dusting' },
  { value: 'moderate', label: 'Noticeable streaking' },
  { value: 'heavy', label: 'Heavy crust / flaking surface' },
]

const TIMING_OPTIONS: Array<{ value: EfflorescenceTiming; label: string }> = [
  { value: 'after-rain', label: 'Mostly after rain / snow melt' },
  { value: 'year-round', label: 'Year‑round' },
  { value: 'winter-freeze', label: 'Mostly winter / freeze‑thaw' },
]

const AGE_OPTIONS: Array<{ value: WallAgeTier; label: string }> = [
  { value: 'new', label: 'New build / <2 years' },
  { value: 'typical', label: '2–20 years' },
  { value: 'old', label: '20+ years' },
]

const SYMPTOM_OPTIONS: SymptomOption<keyof EfflorescenceInputs['symptoms']>[] = [
  { key: 'dampInterior', label: 'Damp interior surface behind wall' },
  { key: 'activeLeak', label: 'Active water leak nearby' },
  { key: 'spalling', label: 'Bricks spalling/flaking' },
  { key: 'mortarGaps', label: 'Mortar gaps/cracking' },
  { key: 'drainageIssues', label: 'Gutters/drainage dumping near wall' },
]

interface ResultsContentProps {
  result: {
    cause: {
      label: string
      description: string
    }
    treatmentSteps: string[]
    preventionSteps: string[]
    proTriggers: string[]
    assumptions: string[]
  }
  getShareableUrl: () => string
  toolState: Record<string, unknown>
}

/**
 * Results content component (used in desktop sidebar and mobile sheet).
 * Extracted as separate component to avoid recreation on each render.
 */
function ResultsContent({ result, getShareableUrl, toolState }: ResultsContentProps) {
  return (
    <>
      <ResultsCard title='Likely cause'>
        <div className='rounded-xl bg-muted/40 p-4'>
          <div className='font-semibold'>{result.cause.label}</div>
          <p className='text-xs text-muted-foreground mt-1 leading-relaxed'>{result.cause.description}</p>
        </div>

        <ProTriggersInline triggers={result.proTriggers} />

        <Badge variant='secondary' className='w-fit'>Planning‑level guidance</Badge>
        <AssumptionsList assumptions={result.assumptions} />

        {/* Action buttons */}
        <div className='flex flex-col gap-2'>
          <div className='flex gap-2'>
            <ShareableLinkButton
              getUrl={getShareableUrl}
              variant='outline'
              size='sm'
              className='flex-1'
            />
            <PDFExportButton
              toolSlug='efflorescence-treatment-planner'
              toolName='Efflorescence Treatment Planner'
              inputs={toolState}
              results={{
                cause: result.cause,
                treatmentSteps: result.treatmentSteps,
                preventionSteps: result.preventionSteps,
                proTriggers: result.proTriggers,
                assumptions: result.assumptions,
              }}
              variant='outline'
              size='sm'
              className='flex-1'
            />
          </div>

          <Button asChild className='w-full'>
            <Link href='/tools/waterproofing-risk-checklist'>Check moisture risk</Link>
          </Button>
        </div>
      </ResultsCard>

      <ResultListCard
        title='DIY treatment steps'
        items={result.treatmentSteps}
        icon={Brush}
        smallTitle
      />

      <ResultsCard title='Prevention checklist' smallTitle>
        <div className='space-y-2 text-sm'>
          {result.preventionSteps.map((s) => (
            <p key={s}>• {s}</p>
          ))}
        </div>
        <ToolDisclaimer text='Efflorescence usually returns until moisture sources are fixed.' />
      </ResultsCard>
    </>
  )
}

export function EfflorescenceTreatmentWidget() {
  // URL-synced state for all form fields (flattened for URL compatibility)
  const defaultState = {
    location: 'exterior-wall' as EfflorescenceLocation,
    severity: 'light' as EfflorescenceSeverity,
    timing: 'after-rain' as EfflorescenceTiming,
    wallAge: 'typical' as WallAgeTier,
    // Flattened symptoms for URL state
    dampInterior: false,
    activeLeak: false,
    spalling: false,
    mortarGaps: false,
    drainageIssues: false,
  }

  const { state, setState, getShareableUrl } = useUrlState(defaultState)

  const result = useMemo(() => planEfflorescenceTreatment({
    location: state.location,
    severity: state.severity,
    timing: state.timing,
    wallAge: state.wallAge,
    symptoms: {
      dampInterior: state.dampInterior,
      activeLeak: state.activeLeak,
      spalling: state.spalling,
      mortarGaps: state.mortarGaps,
      drainageIssues: state.drainageIssues,
    },
  }), [
    state.location, state.severity, state.timing, state.wallAge,
    state.dampInterior, state.activeLeak, state.spalling, state.mortarGaps, state.drainageIssues
  ])

  return (
    <>
      <ToolWidgetLayout
        results={(
          <ResultsContent
            result={result}
            getShareableUrl={getShareableUrl}
            toolState={state}
          />
        )}
      >
        <InputsCard title='Staining details' icon={Droplets}>
          <ToolSelect
            label='Where is the efflorescence?'
            value={state.location}
            onChange={(value) => setState({ location: value as EfflorescenceLocation })}
            options={LOCATION_OPTIONS}
          />

          <ToolSelect
            label='How bad is it?'
            value={state.severity}
            onChange={(value) => setState({ severity: value as EfflorescenceSeverity })}
            options={SEVERITY_OPTIONS}
          />

          <ToolSelect
            label='When does it show up most?'
            value={state.timing}
            onChange={(value) => setState({ timing: value as EfflorescenceTiming })}
            options={TIMING_OPTIONS}
          />

          <SymptomChecklist
            label='Any of these present?'
            symptoms={SYMPTOM_OPTIONS}
            values={{
              dampInterior: state.dampInterior,
              activeLeak: state.activeLeak,
              spalling: state.spalling,
              mortarGaps: state.mortarGaps,
              drainageIssues: state.drainageIssues,
            }}
            onChange={(key, checked) => setState({ [key]: checked })}
            compact
          />

          <ToolSelect
            label='Wall age'
            value={state.wallAge}
            onChange={(value) => setState({ wallAge: value as WallAgeTier })}
            options={AGE_OPTIONS}
          />
        </InputsCard>
      </ToolWidgetLayout>

      {/* Mobile sticky results bar */}
      <StickyResultsBar
        summary={result.cause.label}
        summaryLabel="Likely cause"
      >
        <ResultsContent
          result={result}
          getShareableUrl={getShareableUrl}
          toolState={state}
        />
      </StickyResultsBar>
    </>
  )
}

export default EfflorescenceTreatmentWidget
