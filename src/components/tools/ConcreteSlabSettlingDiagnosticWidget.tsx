'use client'

/**
 * Concrete Slab / Patio Settling Diagnostic widget.
 *
 * Deterministic planning-only guidance for homeowners.
 * See PRD: docs/13-homeowner-tools-phase-2/concrete-slab-settling-diagnostic.md
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Layers, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  diagnoseConcreteSettling,
  type ConcreteSettlingInputs,
  type SettlementPattern,
  type WaterSource,
  type SoilGuess,
  type CrackPattern,
} from '@/lib/tools/concrete-slab-settling'

const PATTERN_OPTIONS: Array<{ value: SettlementPattern; label: string }> = [
  { value: 'edge-near-house', label: 'Edge near the house' },
  { value: 'edge-away-house', label: 'Edge away from the house' },
  { value: 'center-dip', label: 'Center dip' },
  { value: 'random-spots', label: 'Random spots' },
]

const WATER_OPTIONS: Array<{ value: WaterSource; label: string }> = [
  { value: 'downspout-splash', label: 'Downspout splash / roof runoff' },
  { value: 'sprinkler-runoff', label: 'Sprinkler overspray or irrigation' },
  { value: 'pooling-water', label: 'Pooling water nearby' },
  { value: 'none', label: 'No obvious water source' },
]

const SOIL_OPTIONS: Array<{ value: SoilGuess; label: string }> = [
  { value: 'clay', label: 'Clay / heavy soil' },
  { value: 'sandy', label: 'Sandy / fast draining' },
  { value: 'unknown', label: 'Not sure' },
]

const CRACK_OPTIONS: Array<{ value: CrackPattern; label: string }> = [
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

function severityMeta(tier: 'low' | 'medium' | 'high') {
  switch (tier) {
    case 'low':
      return {
        title: 'Low severity',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: CheckCircle2,
      }
    case 'medium':
      return {
        title: 'Medium severity',
        color: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
        icon: AlertTriangle,
      }
    case 'high':
      return {
        title: 'High severity',
        color: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200',
        icon: ShieldAlert,
      }
  }
}

export function ConcreteSlabSettlingDiagnosticWidget() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const result = useMemo(() => diagnoseConcreteSettling(inputs), [inputs])
  const meta = severityMeta(result.severity)
  const TierIcon = meta.icon

  return (
    <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Layers className='h-5 w-5 text-primary' />
            Your slab/patio
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
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

          <div className='space-y-2'>
            <Label>Settlement pattern</Label>
            <Select
              value={inputs.pattern}
              onValueChange={(v) => setInputs((p) => ({ ...p, pattern: v as SettlementPattern }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PATTERN_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Nearby water source</Label>
            <Select
              value={inputs.waterSource}
              onValueChange={(v) => setInputs((p) => ({ ...p, waterSource: v as WaterSource }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WATER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <details className='rounded-lg border p-3'>
            <summary className='cursor-pointer text-sm font-medium'>Soil + slab history (optional)</summary>
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Soil type guess</Label>
                <Select
                  value={inputs.soil ?? 'unknown'}
                  onValueChange={(v) => setInputs((p) => ({ ...p, soil: v as SoilGuess }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOIL_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

              <div className='space-y-2 sm:col-span-2'>
                <Label>Crack pattern</Label>
                <Select
                  value={inputs.cracks ?? 'none'}
                  onValueChange={(v) => setInputs((p) => ({ ...p, cracks: v as CrackPattern }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CRACK_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>

      <div className='space-y-6'>
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle>Diagnosis</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className={cn('rounded-xl p-4', meta.color)}>
              <div className='flex items-center gap-2 mb-2 font-semibold'>
                <TierIcon className='h-5 w-5' />
                {meta.title}
              </div>
              <div className='text-xs text-muted-foreground'>Severity score: {result.score}</div>
            </div>

            <div className='rounded-lg border bg-muted/30 p-3 text-sm space-y-1'>
              <div className='text-xs font-medium uppercase text-muted-foreground'>Most likely cause</div>
              <div className='font-medium'>{result.likelyCause.label}</div>
              <div className='text-xs text-muted-foreground'>Confidence: {result.likelyCause.confidence}</div>
              <p className='text-xs text-muted-foreground leading-relaxed'>{result.likelyCause.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle className='text-base'>Recommended next steps</CardTitle>
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
            <Link href='/tools/outdoor-drainage-quick-planner'>Plan drainage fixes</Link>
          </Button>
          <Button asChild>
            <Link href='/tools/masonry-cost-estimator'>Estimate repair cost</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConcreteSlabSettlingDiagnosticWidget

