'use client'

/**
 * Chimney Water Intrusion Risk Checklist widget.
 *
 * Deterministic scoring + fix-order guidance for homeowners.
 * See PRD: docs/13-homeowner-tools-phase-2/chimney-water-intrusion-risk-checklist.md
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ShieldAlert, CheckCircle2, Droplets } from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle,
  Label, Input, Badge, Button,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui'
import { cn } from '@/lib/utils'
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

function tierMeta(tier: 'low' | 'medium' | 'high') {
  switch (tier) {
    case 'low':
      return {
        title: 'Low risk',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: CheckCircle2,
      }
    case 'medium':
      return {
        title: 'Medium risk',
        color: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
        icon: AlertTriangle,
      }
    case 'high':
      return {
        title: 'High risk',
        color: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200',
        icon: ShieldAlert,
      }
  }
}

export function ChimneyWaterIntrusionRiskWidget() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const result = useMemo(() => scoreChimneyWaterIntrusion(inputs), [inputs])
  const meta = tierMeta(result.tier)
  const TierIcon = meta.icon

  return (
    <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Droplets className='h-5 w-5 text-primary' />
            Chimney symptoms
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label>Symptoms seen</Label>
            <Select
              value={inputs.symptom}
              onValueChange={(v) => setInputs((p) => ({ ...p, symptom: v as ChimneyWaterSymptom }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SYMPTOM_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Top/roofline condition</Label>
            <Select
              value={inputs.roofline}
              onValueChange={(v) => setInputs((p) => ({ ...p, roofline: v as RooflineCondition }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROOFLINE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Climate exposure</Label>
            <Select
              value={inputs.climate}
              onValueChange={(v) => setInputs((p) => ({ ...p, climate: v as FreezeThawTier }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CLIMATE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <details className='rounded-lg border p-3'>
            <summary className='cursor-pointer text-sm font-medium'>Chimney history (optional)</summary>
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Chimney age (years)</Label>
                <Input
                  type='number'
                  min={0}
                  max={150}
                  value={inputs.chimneyAgeYears ?? ''}
                  onChange={(e) => setInputs((p) => ({ ...p, chimneyAgeYears: Number(e.target.value) || undefined }))}
                />
              </div>

              <div className='space-y-2'>
                <Label>Prior waterproofing</Label>
                <Select
                  value={inputs.priorWaterproofing ?? 'never'}
                  onValueChange={(v) => setInputs((p) => ({ ...p, priorWaterproofing: v as ChimneyWaterInputs['priorWaterproofing'] }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='never'>Never</SelectItem>
                    <SelectItem value='over-5-years'>Over 5 years ago</SelectItem>
                    <SelectItem value='under-5-years'>Within 5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='mt-4 space-y-2 text-sm'>
              <label className='flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/40 cursor-pointer'>
                <input
                  type='checkbox'
                  className='mt-1 h-5 w-5 accent-primary'
                  checked={!!inputs.mortarSpalling}
                  onChange={(e) => setInputs((p) => ({ ...p, mortarSpalling: e.target.checked }))}
                />
                <div className='font-medium'>Mortar gaps or spalling bricks</div>
              </label>
            </div>
          </details>
        </CardContent>
      </Card>

      <div className='space-y-6'>
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle>Risk result</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className={cn('rounded-xl p-4', meta.color)}>
              <div className='flex items-center gap-2 mb-1 font-semibold'>
                <TierIcon className='h-5 w-5' />
                {meta.title}
              </div>
              <div className='text-xs text-muted-foreground'>Risk score: {result.score}</div>
            </div>

            <div className='rounded-lg border bg-muted/30 p-3 text-sm space-y-1'>
              <div className='text-xs font-medium uppercase text-muted-foreground'>Likely entry path</div>
              <div className='font-medium'>{result.likelyEntryPath.label}</div>
              <p className='text-xs text-muted-foreground leading-relaxed'>{result.likelyEntryPath.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle className='text-base'>Conservative fix order</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            {result.fixOrder.map((s) => (
              <p key={s}>• {s}</p>
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
    </div>
  )
}

export default ChimneyWaterIntrusionRiskWidget

