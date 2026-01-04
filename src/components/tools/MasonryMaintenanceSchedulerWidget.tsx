'use client'

/**
 * Masonry Maintenance Scheduler widget.
 *
 * Deterministic schedule generator; no AI.
 * See PRD: docs/12-homeowner-tools/masonry-maintenance-scheduler.md
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarCheck, Home, Snowflake, Sun } from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle,
  Label, Input, Badge, Button,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui'
import {
  generateMaintenanceSchedule,
  type MaintenanceInputs,
  type MasonryType,
  type ClimateExposure,
} from '@/lib/tools/maintenance-scheduler'

const MASONRY_OPTIONS: Array<{ value: MasonryType; label: string }> = [
  { value: 'brick', label: 'Brick walls / veneer' },
  { value: 'stone', label: 'Stone walls / veneer' },
  { value: 'concrete', label: 'Concrete block / concrete masonry' },
  { value: 'chimney', label: 'Chimney' },
]

const CLIMATE_OPTIONS: Array<{ value: ClimateExposure; label: string; icon: typeof Snowflake }> = [
  { value: 'mild', label: 'Mild / dry climate', icon: Sun },
  { value: 'mixed', label: 'Mixed / typical climate', icon: Home },
  { value: 'harsh', label: 'Harsh freeze‑thaw / wet climate', icon: Snowflake },
]

const DEFAULT_INPUTS: MaintenanceInputs = {
  masonryType: 'brick',
  ageYears: 20,
  climate: 'mixed',
}

export function MasonryMaintenanceSchedulerWidget() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const schedule = useMemo(() => generateMaintenanceSchedule(inputs), [inputs])

  return (
    <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CalendarCheck className='h-5 w-5 text-primary' />
            Your home
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label>Masonry type</Label>
            <Select
              value={inputs.masonryType}
              onValueChange={(v) => setInputs((p) => ({ ...p, masonryType: v as MasonryType }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MASONRY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Age of masonry/home (years)</Label>
            <Input
              type='number'
              min={0}
              max={150}
              step={1}
              value={inputs.ageYears}
              onChange={(e) => setInputs((p) => ({ ...p, ageYears: Math.max(0, Number(e.target.value) || 0) }))}
            />
          </div>

          <div className='space-y-2'>
            <Label>Climate exposure</Label>
            <Select
              value={inputs.climate}
              onValueChange={(v) => setInputs((p) => ({ ...p, climate: v as ClimateExposure }))}
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
            <summary className='cursor-pointer text-sm font-medium'>Last service dates (optional)</summary>
            <div className='mt-4 grid gap-4 sm:grid-cols-3'>
              <div className='space-y-2'>
                <Label>Last inspection year</Label>
                <Input
                  type='number'
                  min={1980}
                  max={new Date().getFullYear()}
                  value={inputs.lastInspectionYear ?? ''}
                  onChange={(e) => setInputs((p) => ({ ...p, lastInspectionYear: Number(e.target.value) || undefined }))}
                />
              </div>
              <div className='space-y-2'>
                <Label>Last sealing year</Label>
                <Input
                  type='number'
                  min={1980}
                  max={new Date().getFullYear()}
                  value={inputs.lastSealingYear ?? ''}
                  onChange={(e) => setInputs((p) => ({ ...p, lastSealingYear: Number(e.target.value) || undefined }))}
                />
              </div>
              <div className='space-y-2'>
                <Label>Last cleaning year</Label>
                <Input
                  type='number'
                  min={1980}
                  max={new Date().getFullYear()}
                  value={inputs.lastCleaningYear ?? ''}
                  onChange={(e) => setInputs((p) => ({ ...p, lastCleaningYear: Number(e.target.value) || undefined }))}
                />
              </div>
            </div>
          </details>
        </CardContent>
      </Card>

      <div className='space-y-6'>
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle>Recommended frequency</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3 text-sm'>
            <div className='rounded-xl bg-muted/40 p-4 space-y-2'>
              <div className='flex justify-between'>
                <span>Inspection</span>
                <span className='font-medium'>Every {schedule.inspectionEveryYears} yrs</span>
              </div>
              <div className='flex justify-between'>
                <span>Cleaning</span>
                <span className='font-medium'>Every {schedule.cleaningEveryYears} yrs</span>
              </div>
              <div className='flex justify-between'>
                <span>Sealing (if appropriate)</span>
                <span className='font-medium'>Every {schedule.sealingEveryYears} yrs</span>
              </div>
            </div>

            <Badge variant='secondary'>Planning guidance</Badge>
            <div className='text-xs text-muted-foreground leading-relaxed space-y-1'>
              {schedule.assumptions.map((a) => (
                <p key={a}>• {a}</p>
              ))}
            </div>

            <Button asChild className='w-full'>
              <Link href='/tools/masonry-cost-estimator'>Plan repair costs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle className='text-base'>Seasonal checklist (this year)</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 text-sm'>
            {(['spring', 'summer', 'fall', 'winter'] as const).map((season) => (
              <div key={season} className='space-y-2'>
                <div className='font-semibold capitalize'>{season}</div>
                <ul className='space-y-1 text-sm'>
                  {schedule.tasks.filter((t) => t.season === season).map((t) => (
                    <li key={t.title} className={t.due ? '' : 'text-muted-foreground'}>
                      • {t.title}{t.due ? '' : ' (monitor)'}
                      <div className='text-xs text-muted-foreground ml-3'>{t.description}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default MasonryMaintenanceSchedulerWidget

