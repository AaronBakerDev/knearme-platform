'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Download,
  FileJson,
  Star,
  Building2,
  MessageSquare,
  FileText,
  BarChart3,
  Terminal,
  Calendar,
  HardDrive,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import type { SerializedExportFile, ExportData } from '@/lib/exports/reader'

const exportDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const numberFormatter = new Intl.NumberFormat('en-US')

interface ExportViewerProps {
  files: SerializedExportFile[]
  initialData: ExportData | null
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return exportDateFormatter.format(d)
}

/**
 * Export file card - Mission Control styling.
 */
function ExportCard({
  file,
  counts,
  isSelected,
  onSelect,
}: {
  file: SerializedExportFile
  counts?: ExportData['counts']
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full text-left cursor-pointer rounded-lg border p-4 transition-all ${
        isSelected
          ? 'border-cyan-500/30 bg-cyan-500/5 shadow-lg shadow-cyan-500/5'
          : 'border-zinc-700/50 bg-zinc-900/30 hover:border-cyan-500/20 hover:bg-zinc-800/30'
      }`}
    >
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <FileJson className={`h-4 w-4 ${isSelected ? 'text-cyan-400' : 'text-zinc-500'}`} />
        <code className={`text-sm font-mono truncate ${isSelected ? 'text-cyan-400' : 'text-zinc-300'}`}>
          {file.filename}
        </code>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="flex items-center gap-1.5 text-zinc-600 mb-1">
            <Calendar className="h-3 w-3" />
            Exported
          </p>
          <p className="font-mono text-zinc-400">{formatDate(file.timestamp)}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-zinc-600 mb-1">
            <HardDrive className="h-3 w-3" />
            Size
          </p>
          <p className="font-mono text-zinc-400 tabular-nums">
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>

      {counts && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-800/50">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono border border-cyan-500/20">
            <Building2 className="h-3 w-3" />
            {counts.contractors}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono border border-amber-500/20">
            <MessageSquare className="h-3 w-3" />
            {counts.reviews}
          </span>
        </div>
      )}
    </button>
  )
}

/**
 * JSON preview with terminal styling.
 */
function JsonPreview({ data }: { data: unknown }) {
  const jsonString = JSON.stringify(data, null, 2)
  const lines = jsonString.split('\n').slice(0, 40)
  const truncated = jsonString.split('\n').length > 40

  return (
    <div className="relative rounded-lg bg-[#0d1117] border border-zinc-700/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border-b border-zinc-700/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
        <Terminal className="h-3 w-3 text-zinc-500 ml-2" />
        <span className="text-xs text-zinc-500 font-mono">export.json</span>
      </div>

      <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto">
        <pre className="text-xs font-mono leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="w-8 text-right pr-4 text-zinc-700 select-none tabular-nums">
                {i + 1}
              </span>
              <code className="text-zinc-400">{line}</code>
            </div>
          ))}
          {truncated && (
            <div className="flex mt-2">
              <span className="w-8 text-right pr-4 text-zinc-700 select-none">
                ...
              </span>
              <span className="text-zinc-600 italic">
                Truncated for preview
              </span>
            </div>
          )}
        </pre>
      </div>
    </div>
  )
}

/**
 * Export Viewer Component - Mission Control styling.
 * Displays export files with data preview tabs.
 *
 * @see /Users/aaronbaker/knearme-workspace/review-agent-dashboard/src/lib/exports/reader.ts
 */
export default function ExportViewer({ files, initialData }: ExportViewerProps) {
  const [selectedFile, setSelectedFile] = useState<SerializedExportFile | null>(
    files.length > 0 ? files[0] : null
  )
  const [exportData, setExportData] = useState<ExportData | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('contractors')

  const handleSelectFile = async (file: SerializedExportFile) => {
    setSelectedFile(file)
    setLoading(true)

    try {
      const res = await fetch(`/api/exports/${file.filename}`)
      if (res.ok) {
        const data = await res.json()
        setExportData(data)
      } else {
        setExportData(null)
      }
    } catch (error) {
      console.error('Failed to load export:', error)
      setExportData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!selectedFile) return
    window.open(`/api/exports/${selectedFile.filename}`, '_blank')
  }

  // Get array types from export data
  const contractors = (exportData?.data?.contractors || []) as Array<{
    id?: string
    business_name?: string
    city?: string
    state?: string
    rating?: number
    review_count?: number
  }>

  const reviews = (exportData?.data?.reviews || []) as Array<{
    id?: string
    contractor_id?: string
    rating?: number
    reviewer_name?: string
    review_date?: string
  }>

  const analyses = (exportData?.data?.analyses || []) as Array<{
    id?: string
    contractor_id?: string
    sentiment_score?: number
  }>

  const articles = (exportData?.data?.articles || []) as Array<{
    id?: string
    contractor_id?: string
    title?: string
    status?: string
  }>

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Export files list */}
      <div className="col-span-4 space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
            Export Files
          </span>
        </div>
        <div className="space-y-3">
          {files.map((file) => (
            <ExportCard
              key={file.filename}
              file={file}
              counts={
                selectedFile?.filename === file.filename && exportData
                  ? exportData.counts
                  : undefined
              }
              isSelected={selectedFile?.filename === file.filename}
              onSelect={() => handleSelectFile(file)}
            />
          ))}
        </div>
      </div>

      {/* Export details */}
      {selectedFile && (
        <div className="col-span-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
            <div>
              <h2 className="text-lg font-semibold text-zinc-200 font-mono">
                {selectedFile.filename}
              </h2>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                Exported {formatDate(selectedFile.timestamp)} • {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <Button
              size="sm"
              className="gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>

          {loading ? (
            <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/50 p-12 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm text-zinc-500 font-mono">Loading export data...</p>
            </div>
          ) : exportData ? (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/50 p-4 text-center">
                  <div className="h-10 w-10 mx-auto mb-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-cyan-400" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
                    {numberFormatter.format(exportData.counts.contractors)}
                  </p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-1">Contractors</p>
                </div>
                <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/50 p-4 text-center">
                  <div className="h-10 w-10 mx-auto mb-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
                    {numberFormatter.format(exportData.counts.reviews)}
                  </p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-1">Reviews</p>
                </div>
                <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/50 p-4 text-center">
                  <div className="h-10 w-10 mx-auto mb-3 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-violet-400" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
                    {numberFormatter.format(exportData.counts.analyses)}
                  </p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-1">Analyses</p>
                </div>
                <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/50 p-4 text-center">
                  <div className="h-10 w-10 mx-auto mb-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
                    {numberFormatter.format(exportData.counts.articles)}
                  </p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-1">Articles</p>
                </div>
              </div>

              {/* Data preview tabs */}
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50">
                    <TabsList className="bg-zinc-800/50 border border-zinc-700/50 p-1 rounded-lg">
                      <TabsTrigger
                        value="contractors"
                        className="gap-1.5 text-xs font-mono data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400"
                      >
                        <Building2 className="h-3 w-3" />
                        Contractors
                      </TabsTrigger>
                      <TabsTrigger
                        value="reviews"
                        className="gap-1.5 text-xs font-mono data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Reviews
                      </TabsTrigger>
                      <TabsTrigger
                        value="analyses"
                        className="gap-1.5 text-xs font-mono data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-400"
                      >
                        <BarChart3 className="h-3 w-3" />
                        Analyses
                      </TabsTrigger>
                      <TabsTrigger
                        value="articles"
                        className="gap-1.5 text-xs font-mono data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400"
                      >
                        <FileText className="h-3 w-3" />
                        Articles
                      </TabsTrigger>
                      <TabsTrigger
                        value="raw"
                        className="gap-1.5 text-xs font-mono data-[state=active]:bg-zinc-700/50 data-[state=active]:text-zinc-200"
                      >
                        <Terminal className="h-3 w-3" />
                        Raw JSON
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="contractors" className="p-4 mt-0">
                    {contractors.length === 0 ? (
                      <div className="p-8 text-center">
                        <Building2 className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                        <p className="text-sm text-zinc-500">No contractors in this export</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-zinc-800/50 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-zinc-800/50 hover:bg-transparent">
                              <TableHead className="text-zinc-500 font-mono text-xs">Business Name</TableHead>
                              <TableHead className="text-zinc-500 font-mono text-xs">Location</TableHead>
                              <TableHead className="text-zinc-500 font-mono text-xs text-right">Rating</TableHead>
                              <TableHead className="text-zinc-500 font-mono text-xs text-right">Reviews</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contractors.slice(0, 10).map((c, i) => (
                              <TableRow key={c.id || i} className="border-zinc-800/30 hover:bg-zinc-800/20">
                                <TableCell className="font-medium text-zinc-200">
                                  {c.business_name || 'Unknown'}
                                </TableCell>
                                <TableCell className="text-zinc-500 font-mono text-sm">
                                  {c.city}, {c.state}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="inline-flex items-center gap-1.5 text-amber-400">
                                    <span className="font-mono tabular-nums">{c.rating?.toFixed(1) || 'N/A'}</span>
                                    <Star className="h-3 w-3 fill-amber-400" />
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm text-zinc-400 tabular-nums">
                                  {c.review_count || 0}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {contractors.length > 10 && (
                          <div className="px-4 py-2 text-xs font-mono text-zinc-600 border-t border-zinc-800/50 bg-zinc-900/50">
                            Showing 10 of {contractors.length} contractors
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="reviews" className="p-4 mt-0">
                    {reviews.length === 0 ? (
                      <div className="p-8 text-center">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                        <p className="text-sm text-zinc-500">No reviews in this export</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-zinc-800/50 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-zinc-800/50 hover:bg-transparent">
                              <TableHead className="text-zinc-500 font-mono text-xs">Reviewer</TableHead>
                              <TableHead className="text-zinc-500 font-mono text-xs text-right">Rating</TableHead>
                              <TableHead className="text-zinc-500 font-mono text-xs text-right">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reviews.slice(0, 10).map((r, i) => (
                              <TableRow key={r.id || i} className="border-zinc-800/30 hover:bg-zinc-800/20">
                                <TableCell className="font-medium text-zinc-200">
                                  {r.reviewer_name || 'Anonymous'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono border ${
                                      (r.rating || 0) >= 4
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : (r.rating || 0) >= 3
                                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}
                                  >
                                    <Star className="h-3 w-3 fill-current" />
                                    {r.rating || 0}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right text-zinc-500 font-mono text-sm">
                                  {r.review_date || 'Unknown'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {reviews.length > 10 && (
                          <div className="px-4 py-2 text-xs font-mono text-zinc-600 border-t border-zinc-800/50 bg-zinc-900/50">
                            Showing 10 of {reviews.length} reviews
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="analyses" className="p-4 mt-0">
                    {analyses.length === 0 ? (
                      <div className="p-8 text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                        <p className="text-sm text-zinc-500">No analyses in this export</p>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-zinc-800/20 rounded-lg border border-zinc-800/50">
                        <div className="h-12 w-12 mx-auto mb-4 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                          <BarChart3 className="h-6 w-6 text-violet-400" />
                        </div>
                        <p className="text-2xl font-bold font-mono text-zinc-100 tabular-nums">
                          {analyses.length}
                        </p>
                        <p className="text-sm text-zinc-500 mt-1">
                          analyses in this export
                        </p>
                        <p className="text-xs text-zinc-600 mt-3">
                          Select Raw JSON tab to view analysis data
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="articles" className="p-4 mt-0">
                    {articles.length === 0 ? (
                      <div className="p-8 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                        <p className="text-sm text-zinc-500">No articles in this export</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-zinc-800/50 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-zinc-800/50 hover:bg-transparent">
                              <TableHead className="text-zinc-500 font-mono text-xs">Title</TableHead>
                              <TableHead className="text-zinc-500 font-mono text-xs text-right">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {articles.slice(0, 10).map((a, i) => (
                              <TableRow key={a.id || i} className="border-zinc-800/30 hover:bg-zinc-800/20">
                                <TableCell className="font-medium text-zinc-200">
                                  {a.title || 'Untitled'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest border ${
                                      a.status === 'published'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : a.status === 'draft'
                                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                          : 'bg-zinc-700/50 text-zinc-400 border-zinc-600/50'
                                    }`}
                                  >
                                    {a.status === 'published' ? (
                                      <CheckCircle2 className="h-3 w-3" />
                                    ) : (
                                      <Clock className="h-3 w-3" />
                                    )}
                                    {a.status || 'unknown'}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {articles.length > 10 && (
                          <div className="px-4 py-2 text-xs font-mono text-zinc-600 border-t border-zinc-800/50 bg-zinc-900/50">
                            Showing 10 of {articles.length} articles
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="raw" className="p-4 mt-0">
                    <JsonPreview data={exportData} />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : (
            <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/50 p-12 text-center">
              <FileJson className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
              <p className="text-sm text-zinc-500">Failed to load export data</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
