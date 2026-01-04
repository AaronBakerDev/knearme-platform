'use client'

/**
 * Outdoor Drainage Quick Planner widget.
 *
 * Deterministic planning-only guidance for homeowners.
 * See PRD: docs/13-homeowner-tools-phase-2/outdoor-drainage-quick-planner.md
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Droplets, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle,
  Label, Input, Badge, Button,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  planOutdoorDrainage,
  type OutdoorDrainageInputs,
  type SlopeTier,
  type SoilAbsorptionTier,
} from '@/lib/tools/outdoor-drainage'

const SLOPE_OPTIONS: Array<{ value: SlopeTier; label: string }> = [
  { value: 'toward', label: 'Slopes toward the house' },
  { value: 'flat', label: 'Mostly flat' },
  { value: 'away', label: 'Slopes away from the house' },
]

const SOIL_OPTIONS: Array<{ value: SoilAbsorptionTier; label: string }> = [
  { value: 'fast', label: 'Fast draining (sandy)' },
  { value: 'average', label: 'Average' },
  { value: 'slow', label: 'Slow draining (clay)' },
]

const DEFAULT_INPUTS: OutdoorDrainageInputs = {
  currentDischargeDistanceFt: 2,
  slope: 'flat',
  soilAbsorption: 'average',
  poolingLowSpots: false,
  basementMoistureHistory: false,
}

function difficultyMeta(tier: 'low' | 'medium' | 'high') {
  switch (tier) {
    case 'low':
      return {
        label: 'Low difficulty',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: CheckCircle2,
      }
    case 'medium':
      return {
        label: 'Medium difficulty',
        color: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
        icon: AlertTriangle,
      }
    case 'high':
      return {
        label: 'High difficulty',
        color: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200',
        icon: ShieldAlert,
      }
  }
}

export function OutdoorDrainageQuickPlannerWidget() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const result = useMemo(() => planOutdoorDrainage(inputs), [inputs])
  const meta = difficultyMeta(result.difficulty)
  const TierIcon = meta.icon

  return (
    <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Droplets className='h-5 w-5 text-primary' />
            Your yard/drainage
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label>Current downspout discharge distance (ft)</Label>
            <Input
              type='number'
              min={0}
              max={30}
              step={1}
              value={inputs.currentDischargeDistanceFt}
              onChange={(e) => setInputs((p) => ({ ...p, currentDischargeDistanceFt: Number(e.target.value) || 0 }))}
            />
          </div>

          <div className='space-y-2'>
            <Label>Yard slope near foundation</Label>
            <Select
              value={inputs.slope}
              onValueChange={(v) => setInputs((p) => ({ ...p, slope: v as SlopeTier }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SLOPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Soil absorption</Label>
            <Select
              value={inputs.soilAbsorption}
              onValueChange={(v) => setInputs((p) => ({ ...p, soilAbsorption: v as SoilAbsorptionTier }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOIL_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <details className='rounded-lg border p-3'>
            <summary className='cursor-pointer text-sm font-medium'>Low spots + moisture (optional)</summary>
            <div className='mt-4 space-y-2 text-sm'>
              <label className='flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/40 cursor-pointer'>
                <input
                  type='checkbox'
                  className='mt-1 h-5 w-5 accent-primary'
                  checked={!!inputs.poolingLowSpots}
                  onChange={(e) => setInputs((p) => ({ ...p, poolingLowSpots: e.target.checked }))}
                />
                <div className='font-medium'>Pooling water or low spots after storms</div>
              </label>
              <label className='flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/40 cursor-pointer'>
                <input
                  type='checkbox'
                  className='mt-1 h-5 w-5 accent-primary'
                  checked={!!inputs.basementMoistureHistory}
                  onChange={(e) => setInputs((p) => ({ ...p, basementMoistureHistory: e.target.checked }))}
                />
                <div className='font-medium'>Basement has moisture history</div>
              </label>
            </div>
          </details>
        </CardContent>
      </Card>

      <div className='space-y-6'>
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle>Drainage plan</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className={cn('rounded-xl p-4', meta.color)}>
              <div className='flex items-center gap-2 mb-1 font-semibold'>
                <TierIcon className='h-5 w-5' />
                {meta.label}
              </div>
              <div className='text-xs text-muted-foreground'>DIY difficulty tier</div>
            </div>

            <div className='rounded-lg border bg-muted/30 p-3 text-sm'>
              <div className='text-xs font-medium uppercase text-muted-foreground mb-1'>Recommended extension</div>
              <div className='font-medium'>{result.recommendedExtensionFt} ft away from foundation</div>
            </div>

            <div className='rounded-lg border p-3 text-sm'>
              <div className='text-xs font-medium uppercase text-muted-foreground mb-1'>Grading target</div>
              <p className='text-sm leading-relaxed'>{result.gradingTarget}</p>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle className='text-base'>Checklist</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            {result.checklist.map((c) => (
              <p key={c}>• {c}</p>
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
            <Link href='/tools/basement-leak-triage'>Basement leak triage</Link>
          </Button>
          <Button asChild>
            <Link href='/tools/waterproofing-risk-checklist'>Waterproofing checklist</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default OutdoorDrainageQuickPlannerWidget

