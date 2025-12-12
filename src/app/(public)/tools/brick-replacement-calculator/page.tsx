/**
 * Brick Replacement Count + Budget Tool (Homeowner tool).
 *
 * Deterministic MVP.
 */

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BrickWall } from 'lucide-react'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  estimateBrickReplacement,
  type BrickSize,
  type MatchingDifficulty,
  type AccessLevel,
} from '@/lib/tools/brick-replacement'

const BRICK_SIZES: Array<{ value: BrickSize; label: string }> = [
  { value: 'modular', label: 'Standard modular brick (most common)' },
  { value: 'queen', label: 'Queen / oversized brick' },
  { value: 'custom', label: 'Not sure / custom size' },
]

const MATCHING: Array<{ value: MatchingDifficulty; label: string; helper: string }> = [
  { value: 'easy', label: 'Easy match', helper: 'Common modern brick' },
  { value: 'medium', label: 'Medium match', helper: 'Older or less common brick' },
  { value: 'historic', label: 'Historic / hard match', helper: 'Soft brick, unique colors/sizes' },
]

const ACCESS: Array<{ value: AccessLevel; label: string }> = [
  { value: 'ground', label: 'Ground level / easy access' },
  { value: 'ladder', label: 'Ladder access' },
  { value: 'scaffold', label: 'Scaffolding required' },
]

export default function BrickReplacementCalculatorPage() {
  const [damagedAreaSqFt, setDamagedAreaSqFt] = useState(20)
  const [brickSize, setBrickSize] = useState<BrickSize>('modular')
  const [matchingDifficulty, setMatchingDifficulty] = useState<MatchingDifficulty>('medium')
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('ground')

  const result = useMemo(() => {
    return estimateBrickReplacement({
      damagedAreaSqFt,
      brickSize,
      matchingDifficulty,
      accessLevel,
    })
  }, [damagedAreaSqFt, brickSize, matchingDifficulty, accessLevel])

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Tools', url: '/tools' },
    { name: 'Brick Replacement', url: '/tools/brick-replacement-calculator' },
  ]

  return (
    <ToolLayout
      title='Brick Replacement Calculator'
      description='Estimate how many bricks you need to replace and get a planning budget for materials and labor.'
      breadcrumbs={breadcrumbs}
    >
      <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
        <Card className='border-0 shadow-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BrickWall className='h-5 w-5 text-primary' />
              Damage details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-2'>
              <Label>Damaged area (sq ft)</Label>
              <Input type='number' min={1} value={damagedAreaSqFt} onChange={(e) => setDamagedAreaSqFt(Number(e.target.value) || 1)} />
              <p className='text-xs text-muted-foreground'>Estimate the section where bricks are cracked or spalling.</p>
            </div>

            <div className='space-y-2'>
              <Label>Brick size</Label>
              <Select value={brickSize} onValueChange={(v) => setBrickSize(v as BrickSize)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BRICK_SIZES.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Matching difficulty</Label>
              <Select value={matchingDifficulty} onValueChange={(v) => setMatchingDifficulty(v as MatchingDifficulty)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MATCHING.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>
                {MATCHING.find((m) => m.value === matchingDifficulty)?.helper}
              </p>
            </div>

            <div className='space-y-2'>
              <Label>Access level</Label>
              <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v as AccessLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCESS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className='space-y-6'>
          <Card className='border-0 shadow-sm'>
            <CardHeader>
              <CardTitle>Materials + count</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='rounded-xl bg-muted/40 p-4 space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span>Bricks needed</span>
                  <span className='font-medium'>{result.bricksNeeded.toLocaleString()}</span>
                </div>
                <div className='flex justify-between'>
                  <span>With waste</span>
                  <span className='font-medium'>{result.bricksWithWaste.toLocaleString()}</span>
                </div>
              </div>

              <Badge variant='secondary'>Planning estimate</Badge>

              <div className='text-xs text-muted-foreground space-y-1'>
                {result.assumptions.map((a) => (
                  <p key={a}>• {a}</p>
                ))}
              </div>

              <Button asChild className='w-full'>
                <Link href='/tools/masonry-cost-estimator'>Estimate full repair cost</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-sm'>
            <CardHeader>
              <CardTitle className='text-base'>Budget guidance</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <div className='rounded-lg border bg-background p-3'>
                <div className='font-medium'>Materials</div>
                <div className='text-muted-foreground text-xs mt-1'>${result.materialCostLow} – ${result.materialCostHigh}</div>
              </div>
              <div className='rounded-lg border bg-background p-3'>
                <div className='font-medium'>Labor</div>
                <div className='text-muted-foreground text-xs mt-1'>${result.laborCostLow} – ${result.laborCostHigh}</div>
              </div>
              <div className='rounded-lg border bg-background p-3'>
                <div className='font-medium'>Typical total</div>
                <div className='text-muted-foreground text-xs mt-1'>${(result.materialCostLow + result.laborCostLow).toLocaleString()} – ${(result.materialCostHigh + result.laborCostHigh).toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolLayout>
  )
}
