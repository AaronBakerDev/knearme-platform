'use client'

/**
 * Foundation Crack Severity Checker widget.
 *
 * Deterministic triage; no AI.
 * Uses URL state management and sharing capabilities.
 */

import { useMemo } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ShieldAlert, Ruler, Droplets, Home } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  assessFoundationCrack,
  type FoundationCrackInputs,
  type FoundationMaterial,
  type CrackOrientation,
  type CrackWidthTier,
  type WaterIntrusionTier,
} from '@/lib/tools/foundation-cracks'
import { useUrlState, ShareableLinkButton } from '@/components/tools/ToolSharing'
import { StickyResultsBar } from '@/components/tools/ToolResults'
import { PDFExportButton } from '@/components/tools/ToolPDF'

const MATERIAL_OPTIONS: Array<{ value: FoundationMaterial; label: string }> = [
  { value: 'poured-concrete', label: 'Poured concrete' },
  { value: 'block-brick', label: 'Concrete block / brick' },
  { value: 'stone-other', label: 'Stone / other' },
]

const ORIENTATION_OPTIONS: Array<{ value: CrackOrientation; label: string; helper: string }> = [
  { value: 'vertical', label: 'Vertical', helper: 'Runs mostly up and down' },
  { value: 'diagonal', label: 'Diagonal', helper: 'Slants across the wall' },
  { value: 'horizontal', label: 'Horizontal', helper: 'Runs side to side' },
  { value: 'stair-step', label: 'Stair‑step / stepped', helper: 'Follows mortar joints in blocks' },
]

const WIDTH_OPTIONS: Array<{ value: CrackWidthTier; label: string }> = [
  { value: 'hairline', label: 'Hairline / < 1⁄8 in' },
  { value: 'medium', label: '1⁄8 – 1⁄4 in' },
  { value: 'wide', label: '> 1⁄4 in' },
]

const WATER_OPTIONS: Array<{ value: WaterIntrusionTier; label: string }> = [
  { value: 'none', label: 'No water intrusion' },
  { value: 'damp', label: 'Dampness only' },
  { value: 'active', label: 'Active leak during rain/snow melt' },
]

function tierCopy(tier: 'low' | 'medium' | 'high') {
  switch (tier) {
    case 'low':
      return {
        title: 'Low Severity (Monitor)',
        color: 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200',
        icon: CheckCircle2,
        body: 'Your inputs suggest a common, low‑risk crack. Monitor it and focus on drainage and maintenance.',
        summary: 'Monitor',
      }
    case 'medium':
      return {
        title: 'Medium Severity (Schedule Inspection)',
        color: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
        icon: AlertTriangle,
        body: 'This crack may indicate movement or moisture. Plan an inspection and address water sources soon.',
        summary: 'Schedule Inspection',
      }
    case 'high':
      return {
        title: 'High Severity (Prompt Pro Evaluation)',
        color: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200',
        icon: ShieldAlert,
        body: 'Your inputs match higher‑risk patterns. Contact a licensed foundation pro or engineer.',
        summary: 'Urgent',
      }
  }
}

interface ResultsContentProps {
  result: {
    tier: 'low' | 'medium' | 'high'
    score: number
    assumptions: string[]
    cause: { label: string; description: string }
    reasons: string[]
    nextSteps: string[]
  }
  tierMeta: ReturnType<typeof tierCopy>
  TierIcon: typeof CheckCircle2 | typeof AlertTriangle | typeof ShieldAlert
  getShareableUrl: () => string
  toolState: Record<string, unknown>
}

/**
 * Results content component (used in desktop sidebar and mobile sheet).
 * Extracted as separate component to avoid recreation on each render.
 */
function ResultsContent({ result, tierMeta, TierIcon, getShareableUrl, toolState }: ResultsContentProps) {
  return (
    <>
      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle>Severity result</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className={cn('rounded-xl p-4', tierMeta.color)}>
            <div className='flex items-center gap-2 mb-2 font-semibold'>
              <TierIcon className='h-5 w-5' />
              {tierMeta.title}
            </div>
            <p className='text-sm leading-relaxed'>{tierMeta.body}</p>
            <div className='text-xs mt-3'>Severity score: {result.score}</div>
          </div>

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
                toolSlug='foundation-crack-severity-checker'
                toolName='Foundation Crack Severity Checker'
                inputs={toolState}
                results={{
                  tier: result.tier,
                  score: result.score,
                  severityTitle: tierMeta.title,
                  cause: result.cause,
                  reasons: result.reasons,
                  nextSteps: result.nextSteps,
                  assumptions: result.assumptions,
                }}
                variant='outline'
                size='sm'
                className='flex-1'
              />
            </div>

            <Button asChild className='w-full'>
              <Link href='/tools/masonry-cost-estimator?service=foundation-repair'>Estimate repair cost</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle className='text-base'>What this likely means</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          <div className='font-medium'>{result.cause.label}</div>
          <p className='text-muted-foreground text-xs leading-relaxed'>{result.cause.description}</p>
        </CardContent>
      </Card>

      {result.reasons.length > 0 && (
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle className='text-base'>Why you got this result</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            {result.reasons.map((r) => (
              <p key={r}>• {r}</p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle className='text-base'>Recommended next steps</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          {result.nextSteps.map((s) => (
            <p key={s}>• {s}</p>
          ))}
          <div className='text-xs text-muted-foreground pt-2'>
            This tool is informational only and not a substitute for a licensed inspection.
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export function FoundationCrackCheckerWidget() {
  // URL-synced state for all form fields
  const defaultState = {
    material: 'poured-concrete' as FoundationMaterial,
    orientation: 'vertical' as CrackOrientation,
    width: 'hairline' as CrackWidthTier,
    water: 'none' as WaterIntrusionTier,
    displacement: false,
    stickingDoors: false,
    slopingFloors: false,
    recentGrowth: false,
  }

  const { state, setState, getShareableUrl } = useUrlState(defaultState)

  // Build inputs object for assessment
  const inputs: FoundationCrackInputs = useMemo(() => ({
    material: state.material,
    orientation: state.orientation,
    width: state.width,
    water: state.water,
    displacement: state.displacement,
    symptoms: {
      stickingDoors: state.stickingDoors,
      slopingFloors: state.slopingFloors,
      recentGrowth: state.recentGrowth,
    },
  }), [state])

  const result = useMemo(() => assessFoundationCrack(inputs), [inputs])
  const tierMeta = tierCopy(result.tier)
  const TierIcon = tierMeta.icon

  return (
    <>
      <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
        {/* Inputs */}
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Home className='h-5 w-5 text-primary' />
              Crack details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-2'>
              <Label>Foundation material</Label>
              <Select value={state.material} onValueChange={(v) => setState({ material: v as FoundationMaterial })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MATERIAL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label className='flex items-center gap-2'>
                <Ruler className='h-4 w-4 text-muted-foreground' />
                Crack orientation
              </Label>
              <div className='grid gap-2 sm:grid-cols-2'>
                {ORIENTATION_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type='button'
                    aria-pressed={state.orientation === o.value}
                    onClick={() => setState({ orientation: o.value })}
                    className={cn(
                      'rounded-lg border p-3 text-left hover:bg-muted/40',
                      state.orientation === o.value && 'border-primary bg-primary/5'
                    )}
                  >
                    <div className='font-medium'>{o.label}</div>
                    <div className='text-xs text-muted-foreground mt-1'>{o.helper}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Crack width (widest point)</Label>
              <Select value={state.width} onValueChange={(v) => setState({ width: v as CrackWidthTier })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WIDTH_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label className='flex items-center gap-2'>
                <Droplets className='h-4 w-4 text-muted-foreground' />
                Water intrusion
              </Label>
              <Select value={state.water} onValueChange={(v) => setState({ water: v as WaterIntrusionTier })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WATER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className='flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/40'>
              <div>
                <div className='font-medium'>Movement or displacement?</div>
                <div className='text-xs text-muted-foreground'>Edges offset, wall bulging, or crack widening across the wall.</div>
              </div>
              <input
                type='checkbox'
                className='h-5 w-5 accent-primary'
                checked={state.displacement}
                onChange={(e) => setState({ displacement: e.target.checked })}
              />
            </label>

            <div className='space-y-2'>
              <Label>Related home symptoms</Label>
              <div className='space-y-2 text-sm'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    className='h-4 w-4 accent-primary'
                    checked={state.stickingDoors}
                    onChange={(e) => setState({ stickingDoors: e.target.checked })}
                  />
                  Doors or windows sticking
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    className='h-4 w-4 accent-primary'
                    checked={state.slopingFloors}
                    onChange={(e) => setState({ slopingFloors: e.target.checked })}
                  />
                  Sloping floors
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    className='h-4 w-4 accent-primary'
                    checked={state.recentGrowth}
                    onChange={(e) => setState({ recentGrowth: e.target.checked })}
                  />
                  Crack has grown recently
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results - Desktop sidebar */}
        <div className='hidden lg:block space-y-6'>
          <ResultsContent
            result={result}
            tierMeta={tierMeta}
            TierIcon={TierIcon}
            getShareableUrl={getShareableUrl}
            toolState={state}
          />
        </div>
      </div>

      {/* Mobile sticky results bar */}
      <StickyResultsBar
        summary={tierMeta.summary}
        summaryLabel='Severity level'
      >
        <ResultsContent
          result={result}
          tierMeta={tierMeta}
          TierIcon={TierIcon}
          getShareableUrl={getShareableUrl}
          toolState={state}
        />
      </StickyResultsBar>
    </>
  )
}

export default FoundationCrackCheckerWidget
