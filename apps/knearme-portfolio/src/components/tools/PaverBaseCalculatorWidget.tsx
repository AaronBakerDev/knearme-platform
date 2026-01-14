'use client'

/**
 * Paver Base + Materials Calculator widget.
 *
 * Deterministic planning tool; no AI.
 * See PRD: docs/12-homeowner-tools/paver-base-calculator.md
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Ruler, Layers, Snowflake, Truck } from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle,
  Label, Input, Badge, Button,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui'
import {
  estimatePaverBase,
  type ProjectLoad,
  type SoilTier,
} from '@/lib/tools/paver-base'

const LOAD_OPTIONS: Array<{ value: ProjectLoad; label: string }> = [
  { value: 'pedestrian', label: 'Walkway / patio (pedestrian)' },
  { value: 'driveway', label: 'Driveway / heavy load' },
]

const SOIL_OPTIONS: Array<{ value: SoilTier; label: string }> = [
  { value: 'sandy', label: 'Well‑draining / sandy' },
  { value: 'average', label: 'Average soil' },
  { value: 'clay', label: 'Clay / poor drainage' },
]

export function PaverBaseCalculatorWidget() {
  const [lengthFt, setLengthFt] = useState(12)
  const [widthFt, setWidthFt] = useState(10)
  const [projectLoad, setProjectLoad] = useState<ProjectLoad>('pedestrian')
  const [paverThicknessIn, setPaverThicknessIn] = useState(1.75)
  const [soil, setSoil] = useState<SoilTier>('average')
  const [freezeThaw, setFreezeThaw] = useState(true)
  const [wastePercent, setWastePercent] = useState(10)

  const areaSqFt = Math.max(4, lengthFt * widthFt)

  const estimate = useMemo(() => {
    return estimatePaverBase({
      areaSqFt,
      projectLoad,
      paverThicknessIn,
      soil,
      freezeThaw,
      wastePercent,
    })
  }, [areaSqFt, projectLoad, paverThicknessIn, soil, freezeThaw, wastePercent])

  return (
    <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
      <Card className='border-0 shadow-sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Ruler className='h-5 w-5 text-primary' />
            Project details
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Length (ft)</Label>
              <Input type='number' min={2} step={0.5} value={lengthFt} onChange={(e) => setLengthFt(Number(e.target.value) || 2)} />
            </div>
            <div className='space-y-2'>
              <Label>Width (ft)</Label>
              <Input type='number' min={2} step={0.5} value={widthFt} onChange={(e) => setWidthFt(Number(e.target.value) || 2)} />
            </div>
          </div>
          <p className='text-xs text-muted-foreground'>Area: {estimate.areaSqFt} sq ft</p>

          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              <Truck className='h-4 w-4 text-muted-foreground' />
              Project load
            </Label>
            <Select value={projectLoad} onValueChange={(v) => setProjectLoad(v as ProjectLoad)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOAD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Paver thickness (in)</Label>
            <Input type='number' min={1} step={0.25} value={paverThicknessIn} onChange={(e) => setPaverThicknessIn(Number(e.target.value) || 1.75)} />
            <p className='text-xs text-muted-foreground'>Standard brick pavers are ~1.75 in thick.</p>
          </div>

          <div className='space-y-2'>
            <Label>Soil type</Label>
            <Select value={soil} onValueChange={(v) => setSoil(v as SoilTier)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOIL_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className='flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/40'>
            <div className='flex items-center gap-2'>
              <Snowflake className='h-4 w-4 text-muted-foreground' />
              Freeze‑thaw climate?
            </div>
            <input type='checkbox' className='h-5 w-5 accent-primary' checked={freezeThaw} onChange={(e) => setFreezeThaw(e.target.checked)} />
          </label>

          <div className='space-y-2'>
            <Label>Waste / overage %</Label>
            <Input type='number' min={0} max={20} step={1} value={wastePercent} onChange={(e) => setWastePercent(Number(e.target.value) || 0)} />
          </div>
        </CardContent>
      </Card>

      <div className='space-y-6'>
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle>Shopping list</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 text-sm'>
            <div className='rounded-xl bg-muted/40 p-4 space-y-2'>
              <div className='flex justify-between'>
                <span>Gravel base depth</span>
                <span className='font-medium'>{estimate.gravelDepthIn} in</span>
              </div>
              <div className='flex justify-between'>
                <span>Gravel needed</span>
                <span className='font-medium'>{estimate.gravelCuYd} cu yd</span>
              </div>
              <div className='flex justify-between'>
                <span>Bedding sand</span>
                <span className='font-medium'>{estimate.sandCuYd} cu yd</span>
              </div>
              <div className='flex justify-between'>
                <span>Total excavation depth</span>
                <span className='font-medium'>{estimate.excavationDepthIn} in</span>
              </div>
            </div>

            <Badge variant='secondary'>Planning estimate</Badge>

            <div className='text-xs text-muted-foreground leading-relaxed space-y-1'>
              {estimate.assumptions.map((a) => (
                <p key={a}>• {a}</p>
              ))}
            </div>

            <Button asChild className='w-full'>
              <Link href='/blog'>Browse installation guides</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Layers className='h-4 w-4 text-primary' />
              Installation tips
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm'>
            <p>• Compact gravel in 2&quot; lifts with a plate compactor.</p>
            <p>• Use edge restraints to prevent spreading.</p>
            <p>• Slope the surface ~1/8&quot; per ft away from the home.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PaverBaseCalculatorWidget

