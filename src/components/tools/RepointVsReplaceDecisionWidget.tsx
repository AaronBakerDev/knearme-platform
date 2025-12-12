'use client'

/**
 * Repoint vs Replace Decision Tool widget.
 *
 * Deterministic planning-only guidance for homeowners.
 * See PRD: docs/13-homeowner-tools-phase-2/repoint-vs-replace-decision.md
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Wrench, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  decideRepointVsReplace,
  type RepointReplaceInputs,
  type MortarLossTier,
  type BrickDamageTier,
  type FreezeThawTier,
  type PriorSealingTier,
} from '@/lib/tools/repoint-vs-replace'

const MORTAR_OPTIONS: Array<{ value: MortarLossTier; label: string }> = [
  { value: 'surface-dusting', label: 'Surface dusting / shallow wear' },
  { value: 'gaps-1-4-to-1-2', label: 'Gaps about 1/4–1/2 inch deep' },
  { value: 'missing-over-1-2', label: 'More than 1/2 inch missing' },
]

const BRICK_OPTIONS: Array<{ value: BrickDamageTier; label: string }> = [
  { value: 'none', label: 'Bricks mostly sound' },
  { value: 'some-spalling', label: 'Some spalling / soft bricks' },
  { value: 'many-damaged', label: 'Many bricks broken or soft' },
]

const CLIMATE_OPTIONS: Array<{ value: FreezeThawTier; label: string }> = [
  { value: 'freeze-thaw', label: 'Freeze‑thaw climate (cold/mixed)' },
  { value: 'no-freeze', label: 'No freeze‑thaw (warm/dry)' },
]

const SEALING_OPTIONS: Array<{ value: PriorSealingTier; label: string }> = [
  { value: 'never', label: 'Never sealed' },
  { value: 'over-5-years', label: 'Sealed over 5 years ago' },
  { value: 'under-5-years', label: 'Sealed in last 5 years' },
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

function tierMeta(tier: 'low' | 'medium' | 'high') {
  switch (tier) {
    case 'low':
      return {
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: CheckCircle2,
        label: 'Low severity',
      }
    case 'medium':
      return {
        color: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
        icon: AlertTriangle,
        label: 'Medium severity',
      }
    case 'high':
      return {
        color: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200',
        icon: ShieldAlert,
        label: 'High severity',
      }
  }
}

export function RepointVsReplaceDecisionWidget() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const result = useMemo(() => decideRepointVsReplace(inputs), [inputs])
  const meta = tierMeta(result.tier)
  const TierIcon = meta.icon

  const updateMoisture = (key: keyof NonNullable<RepointReplaceInputs['moistureSymptoms']>, checked: boolean) => {
    setInputs((prev) => ({
      ...prev,
      moistureSymptoms: { ...prev.moistureSymptoms, [key]: checked },
    }))
  }

  return (
    <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Wrench className='h-5 w-5 text-primary' />
            Your wall condition
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label>Mortar loss depth</Label>
            <Select
              value={inputs.mortarLoss}
              onValueChange={(v) => setInputs((p) => ({ ...p, mortarLoss: v as MortarLossTier }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MORTAR_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Brick/stone damage rate</Label>
            <Select
              value={inputs.brickDamage}
              onValueChange={(v) => setInputs((p) => ({ ...p, brickDamage: v as BrickDamageTier }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BRICK_OPTIONS.map((o) => (
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
              <div className='space-y-2'>
                <Label>Prior sealing</Label>
                <Select
                  value={inputs.priorSealing ?? 'never'}
                  onValueChange={(v) => setInputs((p) => ({ ...p, priorSealing: v as PriorSealingTier }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEALING_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='mt-4 space-y-2 text-sm'>
              <Label>Moisture symptoms</Label>
              {([
                { key: 'efflorescence', label: 'White staining (efflorescence)' },
                { key: 'dampInterior', label: 'Damp interior wall/basement' },
                { key: 'activeLeak', label: 'Active leak during rain' },
              ] as const).map((s) => (
                <label key={s.key} className='flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/40 cursor-pointer'>
                  <input
                    type='checkbox'
                    className='mt-1 h-5 w-5 accent-primary'
                    checked={!!inputs.moistureSymptoms?.[s.key]}
                    onChange={(e) => updateMoisture(s.key, e.target.checked)}
                  />
                  <div className='font-medium'>{s.label}</div>
                </label>
              ))}
            </div>
          </details>
        </CardContent>
      </Card>

      <div className='space-y-6'>
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle>Recommendation</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className={cn('rounded-xl p-4', meta.color)}>
              <div className='flex items-center gap-2 mb-1 font-semibold'>
                <TierIcon className='h-5 w-5' />
                {meta.label}
              </div>
              <div className='text-xs text-muted-foreground'>Score: {result.score}</div>
            </div>

            <div className='rounded-lg border bg-muted/30 p-3 text-sm space-y-1'>
              <div className='text-xs font-medium uppercase text-muted-foreground'>Most likely next step</div>
              <div className='font-medium'>{result.recommendation.label}</div>
              <p className='text-xs text-muted-foreground leading-relaxed'>{result.recommendation.reasoning}</p>
            </div>

            <div className='rounded-lg border p-3 text-sm'>
              <div className='text-xs font-medium uppercase text-muted-foreground mb-1'>Scope band</div>
              <div className='font-medium capitalize'>{result.scope.replace('-', ' ')}</div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle className='text-base'>Conservative next steps</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            {result.nextSteps.map((s) => (
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
            <Link href='/tools/tuckpointing-calculator'>Estimate tuckpointing materials</Link>
          </Button>
          <Button asChild variant='outline'>
            <Link href='/tools/brick-replacement-calculator'>Estimate brick replacement</Link>
          </Button>
          <Button asChild>
            <Link href='/tools/masonry-cost-estimator'>Estimate cost</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RepointVsReplaceDecisionWidget

