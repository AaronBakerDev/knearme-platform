/**
 * Retaining Wall Planner (Homeowner tool).
 *
 * Deterministic MVP: materials + safety guidance.
 * See PRD: docs/12-homeowner-tools/retaining-wall-planner.md
 */

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Ruler, Layers, ShieldAlert, Droplets } from 'lucide-react'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { estimateRetainingWall, type BlockType, type SoilType, type DrainageOption } from '@/lib/tools/retaining-wall'

const BLOCK_OPTIONS: Array<{ value: BlockType; label: string; helper: string }> = [
  { value: 'segmental', label: 'Segmental blocks', helper: 'Standard interlocking retaining wall blocks' },
  { value: 'stone', label: 'Natural stone', helper: 'Irregular larger stones, more mortar/backfill' },
  { value: 'concrete', label: 'Concrete blocks', helper: 'Large concrete wall blocks' },
]

const SOIL_OPTIONS: Array<{ value: SoilType; label: string; helper: string }> = [
  { value: 'loam', label: 'Loam (typical)', helper: 'Well‑draining, easiest to work with' },
  { value: 'sand', label: 'Sand', helper: 'Fast draining but can slump' },
  { value: 'clay', label: 'Clay', helper: 'Holds water; needs strong drainage' },
]

const DRAINAGE_OPTIONS: Array<{ value: DrainageOption; label: string; helper: string }> = [
  { value: 'gravel', label: 'Gravel backfill', helper: 'Drainage gravel only' },
  { value: 'pipe', label: 'Perforated drain pipe', helper: 'Pipe + gravel (recommended)' },
  { value: 'none', label: 'None', helper: 'Not recommended except very small walls' },
]

type DiyDifficulty = 'easy' | 'moderate' | 'pro' | 'engineer'

const DIY_TIER_BADGE = {
  easy: { label: 'DIY Friendly', variant: 'default' },
  moderate: { label: 'Moderate DIY', variant: 'secondary' },
  pro: { label: 'Pro Recommended', variant: 'destructive' },
  engineer: { label: 'Engineer Required', variant: 'destructive' },
} as const satisfies Record<DiyDifficulty, { label: string; variant: 'default' | 'secondary' | 'destructive' }>

export default function RetainingWallPlannerPage() {
  const [wallLengthFt, setWallLengthFt] = useState(12)
  const [wallHeightFt, setWallHeightFt] = useState(3)
  const [blockType, setBlockType] = useState<BlockType>('segmental')
  const [soilType, setSoilType] = useState<SoilType>('loam')
  const [tieredSlope, setTieredSlope] = useState(false)
  const [drainage, setDrainage] = useState<DrainageOption>('pipe')

  const estimate = useMemo(() => {
    return estimateRetainingWall({
      wallLengthFt,
      wallHeightFt,
      blockType,
      soilType,
      tieredSlope,
      drainage,
    })
  }, [wallLengthFt, wallHeightFt, blockType, soilType, tieredSlope, drainage])

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Retaining Wall Planner', url: '/tools/retaining-wall-planner' },
  ]

  const tierBadge = DIY_TIER_BADGE[estimate.diyDifficulty]

  return (
    <ToolLayout
      title='Retaining Wall Planner'
      description='Plan a straight retaining wall in under a minute. Estimate blocks, base gravel, backfill, drainage, and safety limits before you start digging.'
      breadcrumbs={breadcrumbs}
    >
      <div className='grid gap-8 lg:grid-cols-2'>
        {/* Inputs */}
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Ruler className='h-5 w-5 text-primary' />
              Wall details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div className='space-y-2'>
              <Label>Wall length (ft)</Label>
              <Input
                type='number'
                min={2}
                step={1}
                value={wallLengthFt}
                onChange={(e) => setWallLengthFt(Math.max(2, Number(e.target.value) || 2))}
              />
              <p className='text-xs text-muted-foreground'>Measure along the front face of the wall.</p>
            </div>

            <div className='space-y-2'>
              <Label>Wall height (ft)</Label>
              <Input
                type='number'
                min={1}
                step={0.5}
                value={wallHeightFt}
                onChange={(e) => setWallHeightFt(Math.max(1, Number(e.target.value) || 1))}
              />
              <p className='text-xs text-muted-foreground'>From finished grade to top of wall.</p>
            </div>

            <div className='space-y-2'>
              <Label>Block type</Label>
              <Select value={blockType} onValueChange={(v) => setBlockType(v as BlockType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>Choose the material you plan to build with.</p>
            </div>

            <div className='space-y-2'>
              <Label>Soil type</Label>
              <Select value={soilType} onValueChange={(v) => setSoilType(v as SoilType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOIL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>Advanced — affects drainage guidance.</p>
            </div>

            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div>
                <div className='font-medium'>Tiered / sloped site?</div>
                <div className='text-xs text-muted-foreground'>Multiple levels or a steep hillside.</div>
              </div>
              <input
                type='checkbox'
                className='h-5 w-5 accent-primary'
                checked={tieredSlope}
                onChange={(e) => setTieredSlope(e.target.checked)}
              />
            </div>

            <div className='space-y-2'>
              <Label className='flex items-center gap-2'>
                <Droplets className='h-4 w-4 text-muted-foreground' />
                Drainage option
              </Label>
              <Select value={drainage} onValueChange={(v) => setDrainage(v as DrainageOption)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DRAINAGE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>{DRAINAGE_OPTIONS.find((d) => d.value === drainage)?.helper}</p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className='space-y-6'>
          {estimate.warnings.length > 0 && (
            <Card className='border-destructive/40 bg-destructive/5'>
              <CardHeader className='flex flex-row items-center gap-2'>
                <ShieldAlert className='h-5 w-5 text-destructive' />
                <CardTitle className='text-base'>Safety & permit notes</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2 text-sm'>
                {estimate.warnings.map((w) => (
                  <p key={w}>• {w}</p>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className='border-0 shadow-sm'>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle>Materials list</CardTitle>
              <Badge variant={tierBadge.variant}>{tierBadge.label}</Badge>
            </CardHeader>
            <CardContent className='space-y-5'>
              <div className='grid gap-3 rounded-lg bg-muted/40 p-4 text-sm'>
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>Wall face area</span>
                  <span>{estimate.wallAreaSqFt} sq ft</span>
                </div>
              </div>

              <div className='space-y-3'>
                <div className='flex items-center gap-2 font-medium'>
                  <Layers className='h-4 w-4 text-primary' />
                  Blocks
                </div>
                <ul className='text-sm space-y-1'>
                  <li>Blocks needed: <strong>{estimate.blocksNeeded.toLocaleString()}</strong></li>
                  <li>With waste: <strong>{estimate.blocksWithWaste.toLocaleString()}</strong> (includes ~8% overage)</li>
                </ul>
              </div>

              <div className='space-y-3'>
                <div className='font-medium'>Base / footing</div>
                <ul className='text-sm space-y-1'>
                  <li>Base gravel: <strong>{estimate.baseGravelCuYd} cu yd</strong></li>
                </ul>
              </div>

              <div className='space-y-3'>
                <div className='font-medium'>Backfill & drainage</div>
                <ul className='text-sm space-y-1'>
                  <li>Backfill gravel/soil: <strong>{estimate.backfillCuYd} cu yd</strong></li>
                  {estimate.drainagePipeFt > 0 && (
                    <li>Perforated drain pipe: <strong>{estimate.drainagePipeFt} ft</strong></li>
                  )}
                </ul>
              </div>

              <div className='border-t pt-4 space-y-2'>
                <div className='text-xs font-medium uppercase text-muted-foreground'>Assumptions</div>
                <ul className='text-xs text-muted-foreground space-y-1'>
                  {estimate.assumptions.map((a) => (
                    <li key={a}>• {a}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 bg-muted/30'>
            <CardContent className='py-4 text-sm flex flex-col gap-2'>
              <Link href='/tools/masonry-cost-estimator' className='underline'>
                Estimate total masonry costs
              </Link>
              <Link href='/services/retaining-walls' className='underline'>
                Learn about retaining wall services
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolLayout>
  )
}
