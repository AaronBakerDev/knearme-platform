'use client'

/**
 * Masonry Waterproofing Risk + Decision Checklist widget.
 *
 * Deterministic scoring + rule-based first action.
 * Page wrapper handles ToolLayout + metadata.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Droplets, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  scoreWaterproofingRisk,
  type WaterproofingRiskInputs,
  type ClimateTier,
  type MasonryType,
  type ExposureTier,
  type DrainageTier,
  type IssueLocation,
} from '@/lib/tools/waterproofing-risk'

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

const CLIMATE_OPTIONS: Array<{ value: ClimateTier; label: string }> = [
  { value: 'freeze-thaw', label: 'Freeze–thaw climate (cold/mixed)' },
  { value: 'no-freeze', label: 'No freeze–thaw (warm/dry)' },
]

const MASONRY_OPTIONS: Array<{ value: MasonryType; label: string }> = [
  { value: 'brick', label: 'Brick' },
  { value: 'stone', label: 'Stone' },
  { value: 'block', label: 'Block / foundation masonry' },
]

const EXPOSURE_OPTIONS: Array<{ value: ExposureTier; label: string }> = [
  { value: 'high', label: 'High exposure / wind-driven rain' },
  { value: 'moderate', label: 'Moderate exposure' },
  { value: 'sheltered', label: 'Sheltered / covered' },
]

const DRAINAGE_OPTIONS: Array<{ value: DrainageTier; label: string }> = [
  { value: 'good', label: 'Good drainage & gutters' },
  { value: 'ok', label: 'OK / average drainage' },
  { value: 'poor', label: 'Poor (overflowing gutters or standing water)' },
]

const LOCATION_OPTIONS: Array<{ value: IssueLocation; label: string }> = [
  { value: 'roofline-chimney', label: 'Near roofline / chimney' },
  { value: 'mid-wall', label: 'Mid‑wall' },
  { value: 'at-grade', label: 'At grade / basement' },
]

const SYMPTOMS: Array<{ key: keyof WaterproofingRiskInputs['symptoms']; label: string; helper: string }> = [
  { key: 'efflorescence', label: 'White staining (efflorescence)', helper: 'Powdery white streaks on brick/stone.' },
  { key: 'spalling', label: 'Spalling/flaking brick', helper: 'Brick faces popping off or crumbling.' },
  { key: 'dampInterior', label: 'Damp interior wall/basement', helper: 'Moist wall surface inside.' },
  { key: 'activeLeak', label: 'Active leak during rain', helper: 'Visible dripping or wet spots when it rains.' },
  { key: 'mustyMold', label: 'Musty odor / visible mold nearby', helper: 'Signs of ongoing moisture.' },
  { key: 'mortarGaps', label: 'Mortar gaps/cracking', helper: 'Missing or deteriorated mortar joints.' },
]

function tierMeta(tier: 'low' | 'medium' | 'high') {
  switch (tier) {
    case 'low':
      return {
        title: 'Low risk',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: CheckCircle2,
        body: 'Symptoms suggest early or cosmetic moisture risk. Maintain and monitor.',
      }
    case 'medium':
      return {
        title: 'Medium risk',
        color: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
        icon: AlertTriangle,
        body: 'Moisture paths are likely. Plan repairs before sealing.',
      }
    case 'high':
      return {
        title: 'High risk',
        color: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200',
        icon: ShieldAlert,
        body: 'Active water damage is likely. Prioritize professional inspection.',
      }
  }
}

export function WaterproofingRiskChecklistWidget() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const result = useMemo(() => scoreWaterproofingRisk(inputs), [inputs])
  const meta = tierMeta(result.tier)
  const TierIcon = meta.icon

  const updateSymptom = (key: keyof WaterproofingRiskInputs['symptoms'], checked: boolean) => {
    setInputs((prev) => ({ ...prev, symptoms: { ...prev.symptoms, [key]: checked } }))
  }

  return (
    <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
      {/* Inputs */}
      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Droplets className='h-5 w-5 text-primary' />
            Your wall conditions
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label>Climate exposure</Label>
            <Select value={inputs.climate} onValueChange={(v) => setInputs((p) => ({ ...p, climate: v as ClimateTier }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CLIMATE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Masonry type</Label>
            <Select value={inputs.masonryType} onValueChange={(v) => setInputs((p) => ({ ...p, masonryType: v as MasonryType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MASONRY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Exposure</Label>
            <Select value={inputs.exposure} onValueChange={(v) => setInputs((p) => ({ ...p, exposure: v as ExposureTier }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPOSURE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Drainage & gutters</Label>
            <Select value={inputs.drainage} onValueChange={(v) => setInputs((p) => ({ ...p, drainage: v as DrainageTier }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DRAINAGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Where is the issue?</Label>
            <Select value={inputs.location} onValueChange={(v) => setInputs((p) => ({ ...p, location: v as IssueLocation }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCATION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Check any symptoms you see</Label>
            <div className='space-y-2 text-sm'>
              {SYMPTOMS.map((s) => (
                <label key={s.key} className='flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/40 cursor-pointer'>
                  <input
                    type='checkbox'
                    className='mt-1 h-5 w-5 accent-primary'
                    checked={inputs.symptoms[s.key]}
                    onChange={(e) => updateSymptom(s.key, e.target.checked)}
                  />
                  <div>
                    <div className='font-medium'>{s.label}</div>
                    <div className='text-xs text-muted-foreground mt-1'>{s.helper}</div>
                  </div>
                </label>
              ))}
            </div>
            <p className='text-xs text-muted-foreground pt-2'>
              Informational only — not a substitute for a professional inspection.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className='space-y-6'>
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle>Risk result</CardTitle>
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

            <div className='rounded-lg border bg-muted/30 p-3 text-sm'>
              <div className='text-xs font-medium uppercase text-muted-foreground mb-1'>First thing to do</div>
              <p className='font-medium'>{result.firstAction}</p>
            </div>

            {result.proTriggers.length > 0 && (
              <div className='rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs space-y-1'>
                <div className='flex items-center gap-2 font-medium text-destructive'>
                  <ShieldAlert className='h-4 w-4' />
                  When to call a pro
                </div>
                {result.proTriggers.map((t) => (
                  <p key={t}>• {t}</p>
                ))}
              </div>
            )}

            <Button asChild className='w-full'>
              <Link href='/tools/masonry-cost-estimator?service=waterproofing'>Estimate repair cost</Link>
            </Button>
          </CardContent>
        </Card>

        {result.planSteps.length > 0 && (
          <Card className='border-0 shadow-sm'>
            <CardHeader>
              <CardTitle className='text-base'>Prioritized plan</CardTitle>
            </CardHeader>
            <CardContent className='text-sm space-y-2'>
              {result.planSteps.map((step, i) => (
                <p key={step}>{i + 1}. {step}</p>
              ))}
            </CardContent>
          </Card>
        )}

        {result.reasons.length > 0 && (
          <Card className='border-0 shadow-sm'>
            <CardHeader>
              <CardTitle className='text-base'>Why this result?</CardTitle>
            </CardHeader>
            <CardContent className='text-sm space-y-2'>
              {result.reasons.map((reason) => (
                <p key={reason}>• {reason}</p>
              ))}
            </CardContent>
          </Card>
        )}

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
      </div>
    </div>
  )
}

export default WaterproofingRiskChecklistWidget

