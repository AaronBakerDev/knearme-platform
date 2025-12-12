'use client'

/**
 * Basement Leak Source Triage + Fix Order widget.
 *
 * Deterministic planning-only guidance for homeowners.
 * See PRD: docs/13-homeowner-tools-phase-2/basement-leak-triage.md
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Droplets, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
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

function tierMeta(tier: 'low' | 'medium' | 'high') {
  switch (tier) {
    case 'low':
      return {
        title: 'Low risk / early moisture',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: CheckCircle2,
        body: 'This pattern usually indicates minor moisture risk. Improve drainage and monitor for changes.',
      }
    case 'medium':
      return {
        title: 'Medium risk',
        color: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
        icon: AlertTriangle,
        body: 'Water entry is likely. Prioritize drainage and masonry repairs before sealing.',
      }
    case 'high':
      return {
        title: 'High risk / active leak',
        color: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200',
        icon: ShieldAlert,
        body: 'This pattern suggests an active leak or significant moisture path. Professional inspection is recommended.',
      }
  }
}

export function BasementLeakTriageWidget() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const result = useMemo(() => triageBasementLeak(inputs), [inputs])
  const meta = tierMeta(result.tier)
  const TierIcon = meta.icon

  const setExtra = (key: keyof NonNullable<BasementLeakInputs['extraSymptoms']>, checked: boolean) => {
    setInputs((prev) => ({
      ...prev,
      extraSymptoms: { ...prev.extraSymptoms, [key]: checked },
    }))
  }

  return (
    <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
      {/* Inputs */}
      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Droplets className='h-5 w-5 text-primary' />
            Your basement symptoms
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label>Where is the moisture/leak?</Label>
            <Select
              value={inputs.location}
              onValueChange={(v) => setInputs((p) => ({ ...p, location: v as LeakLocation }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCATION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Does it happen mainly after rain?</Label>
            <Select
              value={inputs.rainPattern}
              onValueChange={(v) => setInputs((p) => ({ ...p, rainPattern: v as RainPattern }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RAIN_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Visible masonry symptoms</Label>
            <Select
              value={inputs.visibleSymptom}
              onValueChange={(v) => setInputs((p) => ({ ...p, visibleSymptom: v as VisibleSymptom }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SYMPTOM_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <details className='rounded-lg border p-3'>
            <summary className='cursor-pointer text-sm font-medium'>Drainage + history (optional)</summary>
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Gutters & downspouts</Label>
                <Select
                  value={inputs.gutters ?? 'unsure'}
                  onValueChange={(v) => setInputs((p) => ({ ...p, gutters: v as GuttersTier }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GUTTER_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Grading near house</Label>
                <Select
                  value={inputs.grading ?? 'flat'}
                  onValueChange={(v) => setInputs((p) => ({ ...p, grading: v as GradingTier }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADING_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Sump pump or interior drain?</Label>
                <Select
                  value={inputs.sumpPresent === undefined ? 'unsure' : inputs.sumpPresent ? 'yes' : 'no'}
                  onValueChange={(v) =>
                    setInputs((p) => ({
                      ...p,
                      sumpPresent: v === 'unsure' ? undefined : v === 'yes',
                    }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='yes'>Yes</SelectItem>
                    <SelectItem value='no'>No</SelectItem>
                    <SelectItem value='unsure'>Not sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

            <div className='mt-4 space-y-2 text-sm'>
              <Label>Extra red‑flag symptoms</Label>
              {([
                { key: 'activeLeak', label: 'Active leaking / dripping' },
                { key: 'standingWater', label: 'Standing water or puddles' },
                { key: 'moldOrMusty', label: 'Musty odor or visible mold' },
              ] as const).map((s) => (
                <label key={s.key} className='flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/40 cursor-pointer'>
                  <input
                    type='checkbox'
                    className='mt-1 h-5 w-5 accent-primary'
                    checked={!!inputs.extraSymptoms?.[s.key]}
                    onChange={(e) => setExtra(s.key, e.target.checked)}
                  />
                  <div className='font-medium'>{s.label}</div>
                </label>
              ))}
            </div>
          </details>
        </CardContent>
      </Card>

      {/* Results */}
      <div className='space-y-6'>
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle>Risk + likely source</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className={cn('rounded-xl p-4', meta.color)}>
              <div className='flex items-center gap-2 mb-2 font-semibold'>
                <TierIcon className='h-5 w-5' />
                {meta.title}
              </div>
              <p className='text-sm leading-relaxed'>{meta.body}</p>
              <div className='text-xs mt-3'>Risk score: {result.score}</div>
            </div>

            <div className='rounded-lg border bg-muted/30 p-3 text-sm space-y-1'>
              <div className='text-xs font-medium uppercase text-muted-foreground'>Most likely source</div>
              <div className='font-medium'>{result.likelySource.label}</div>
              <div className='text-xs text-muted-foreground'>Confidence: {result.likelySource.confidence}</div>
              <p className='text-xs text-muted-foreground leading-relaxed'>{result.likelySource.rationale}</p>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle className='text-base'>Conservative fix order</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            {result.fixOrder.map((step) => (
              <p key={step}>• {step}</p>
            ))}
          </CardContent>
        </Card>

        {result.proTriggers.length > 0 && (
          <Card className='border-0 shadow-sm'>
            <CardHeader>
              <CardTitle className='text-base flex items-center gap-2 text-destructive'>
                <ShieldAlert className='h-4 w-4' />
                When to call a pro
              </CardTitle>
            </CardHeader>
            <CardContent className='text-sm space-y-2'>
              {result.proTriggers.map((t) => (
                <p key={t}>• {t}</p>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle className='text-base'>Assumptions</CardTitle>
          </CardHeader>
          <CardContent className='text-xs text-muted-foreground space-y-1'>
            {result.assumptions.map((a) => (
              <p key={a}>• {a}</p>
            ))}
          </CardContent>
        </Card>

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
    </div>
  )
}

export default BasementLeakTriageWidget

