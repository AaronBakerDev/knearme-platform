'use client'

/**
 * Brick Replacement Calculator widget.
 *
 * Shared widget for estimating brick count and budget for replacement projects.
 * Uses URL-synced state, mobile-friendly sticky results, and PDF export.
 */

import { useMemo } from 'react'
import Link from 'next/link'
import { BrickWall } from 'lucide-react'
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
import { useUrlState, ShareableLinkButton } from '@/components/tools/ToolSharing'
import { StickyResultsBar } from '@/components/tools/ToolResults'
import { PDFExportButton } from '@/components/tools/ToolPDF'

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

interface ResultsContentProps {
  result: {
    bricksNeeded: number
    bricksWithWaste: number
    materialCostLow: number
    materialCostHigh: number
    laborCostLow: number
    laborCostHigh: number
    assumptions: string[]
  }
  getShareableUrl: () => string
  toolState: Record<string, unknown>
}

/**
 * Results content component (used in desktop sidebar and mobile sheet).
 * Extracted as separate component to avoid recreation on each render.
 */
function ResultsContent({ result, getShareableUrl, toolState }: ResultsContentProps) {
  const totalLow = result.materialCostLow + result.laborCostLow
  const totalHigh = result.materialCostHigh + result.laborCostHigh

  return (
    <>
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

          {/* Action buttons */}
          <div className='flex flex-col gap-2'>
            <div className='flex gap-2'>
              <ShareableLinkButton
                getUrl={getShareableUrl}
                variant='outline'
                size='sm'
                className='flex-1'
              />
              <PDFExportButton
                toolSlug='brick-replacement-calculator'
                toolName='Brick Replacement Calculator'
                inputs={toolState}
                results={{
                  bricksNeeded: result.bricksNeeded,
                  bricksWithWaste: result.bricksWithWaste,
                  materials: { low: result.materialCostLow, high: result.materialCostHigh },
                  labor: { low: result.laborCostLow, high: result.laborCostHigh },
                  total: { low: totalLow, high: totalHigh },
                  assumptions: result.assumptions,
                }}
                variant='outline'
                size='sm'
                className='flex-1'
              />
            </div>

            <Button asChild className='w-full'>
              <Link href='/tools/masonry-cost-estimator'>Estimate full repair cost</Link>
            </Button>
          </div>
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
            <div className='text-muted-foreground text-xs mt-1'>${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}</div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export function BrickReplacementCalculatorWidget() {
  // URL-synced state for all form fields
  const defaultState = {
    damagedAreaSqFt: 20,
    brickSize: 'modular' as BrickSize,
    matchingDifficulty: 'medium' as MatchingDifficulty,
    accessLevel: 'ground' as AccessLevel,
  }

  const { state, setState, getShareableUrl } = useUrlState(defaultState)

  const result = useMemo(() => {
    return estimateBrickReplacement({
      damagedAreaSqFt: state.damagedAreaSqFt,
      brickSize: state.brickSize,
      matchingDifficulty: state.matchingDifficulty,
      accessLevel: state.accessLevel,
    })
  }, [state.damagedAreaSqFt, state.brickSize, state.matchingDifficulty, state.accessLevel])

  return (
    <>
      <div className='grid gap-6 lg:grid-cols-[1fr,360px]'>
        {/* Form */}
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
              <Input
                type='number'
                min={1}
                value={state.damagedAreaSqFt}
                onChange={(e) => setState({ damagedAreaSqFt: Number(e.target.value) || 1 })}
              />
              <p className='text-xs text-muted-foreground'>Estimate the section where bricks are cracked or spalling.</p>
            </div>

            <div className='space-y-2'>
              <Label>Brick size</Label>
              <Select value={state.brickSize} onValueChange={(v) => setState({ brickSize: v as BrickSize })}>
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
              <Select value={state.matchingDifficulty} onValueChange={(v) => setState({ matchingDifficulty: v as MatchingDifficulty })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MATCHING.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>
                {MATCHING.find((m) => m.value === state.matchingDifficulty)?.helper}
              </p>
            </div>

            <div className='space-y-2'>
              <Label>Access level</Label>
              <Select value={state.accessLevel} onValueChange={(v) => setState({ accessLevel: v as AccessLevel })}>
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

        {/* Results - Desktop sidebar */}
        <div className='hidden lg:block space-y-6'>
          <ResultsContent
            result={result}
            getShareableUrl={getShareableUrl}
            toolState={state}
          />
        </div>
      </div>

      {/* Mobile sticky results bar */}
      <StickyResultsBar
        summary={`${result.bricksNeeded.toLocaleString()} bricks needed`}
        summaryLabel="Brick count"
      >
        <ResultsContent
          result={result}
          getShareableUrl={getShareableUrl}
          toolState={state}
        />
      </StickyResultsBar>
    </>
  )
}

export default BrickReplacementCalculatorWidget
