'use client'

/**
 * Efflorescence Treatment Planner widget.
 *
 * Shared between the full tool page and potential SEO wrappers.
 * Uses deterministic rules-based treatment recommendations.
 */

import { useMemo } from 'react'
import Link from 'next/link'
import { Droplets, Brush, AlertTriangle, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUrlState, ShareableLinkButton } from '@/components/tools/ToolSharing'
import { StickyResultsBar } from '@/components/tools/ToolResults'
import { PDFExportButton } from '@/components/tools/ToolPDF'
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
      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle>Likely cause</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div className='rounded-xl bg-muted/40 p-4'>
            <div className='font-semibold'>{result.cause.label}</div>
            <p className='text-xs text-muted-foreground mt-1 leading-relaxed'>{result.cause.description}</p>
          </div>

          {result.proTriggers.length > 0 && (
            <div className='rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs space-y-1'>
              <div className='flex items-center gap-2 font-medium text-destructive'>
                <ShieldAlert className='h-4 w-4' />
                Consider a professional inspection
              </div>
              {result.proTriggers.map((t) => (
                <p key={t}>• {t}</p>
              ))}
            </div>
          )}

          <Badge variant='secondary' className='w-fit'>Planning‑level guidance</Badge>

          <div className='text-xs text-muted-foreground leading-relaxed space-y-1'>
            {result.assumptions.map((a) => (
              <p key={a}>• {a}</p>
            ))}
          </div>

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
        </CardContent>
      </Card>

      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Brush className='h-4 w-4 text-primary' />
            DIY treatment steps
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          {result.treatmentSteps.map((s) => (
            <p key={s}>• {s}</p>
          ))}
        </CardContent>
      </Card>

      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <AlertTriangle className='h-4 w-4 text-primary' />
            Prevention checklist
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          {result.preventionSteps.map((s) => (
            <p key={s}>• {s}</p>
          ))}
          <div className='text-xs text-muted-foreground pt-2'>
            Efflorescence usually returns until moisture sources are fixed.
          </div>
        </CardContent>
      </Card>
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

  const updateSymptoms = (key: keyof EfflorescenceInputs['symptoms'], checked: boolean) => {
    setState({ [key]: checked })
  }

  return (
    <>
      <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
        {/* Inputs */}
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Droplets className='h-5 w-5 text-primary' />
              Staining details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-2'>
              <Label>Where is the efflorescence?</Label>
              <Select value={state.location} onValueChange={(v) => setState({ location: v as EfflorescenceLocation })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCATION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>How bad is it?</Label>
              <Select value={state.severity} onValueChange={(v) => setState({ severity: v as EfflorescenceSeverity })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>When does it show up most?</Label>
              <Select value={state.timing} onValueChange={(v) => setState({ timing: v as EfflorescenceTiming })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMING_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Any of these present?</Label>
              <div className='space-y-2 text-sm'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input type='checkbox' className='h-4 w-4 accent-primary' checked={state.dampInterior} onChange={(e) => updateSymptoms('dampInterior', e.target.checked)} />
                  Damp interior surface behind wall
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input type='checkbox' className='h-4 w-4 accent-primary' checked={state.activeLeak} onChange={(e) => updateSymptoms('activeLeak', e.target.checked)} />
                  Active water leak nearby
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input type='checkbox' className='h-4 w-4 accent-primary' checked={state.spalling} onChange={(e) => updateSymptoms('spalling', e.target.checked)} />
                  Bricks spalling/flaking
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input type='checkbox' className='h-4 w-4 accent-primary' checked={state.mortarGaps} onChange={(e) => updateSymptoms('mortarGaps', e.target.checked)} />
                  Mortar gaps/cracking
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input type='checkbox' className='h-4 w-4 accent-primary' checked={state.drainageIssues} onChange={(e) => updateSymptoms('drainageIssues', e.target.checked)} />
                  Gutters/drainage dumping near wall
                </label>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Wall age</Label>
              <Select value={state.wallAge} onValueChange={(v) => setState({ wallAge: v as WallAgeTier })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AGE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results - Desktop sidebar */}
        <div className='hidden lg:block space-y-6'>
          <ResultsContent
            result={result}
            getShareableUrl={getShareableUrl}
            toolState={state}
          />
        </div>
      </div>

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
