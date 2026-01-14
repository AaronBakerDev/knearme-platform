import { promises as fs } from 'fs'
import path from 'path'

/**
 * Export file reader for contractor-review-agent JSON exports
 *
 * Reads JSON export files from the configured output directory.
 * Default: ../contractor-review-agent/output
 *
 * @see /Users/aaronbaker/knearme-workspace/contractor-review-agent/src/scripts/sync.ts
 */

export interface ExportFile {
  filename: string
  timestamp: Date
  size: number
}

export type SerializedExportFile = Omit<ExportFile, 'timestamp'> & {
  timestamp: string
}

export interface ExportData {
  exportedAt: string
  version: string
  counts: {
    contractors: number
    reviews: number
    analyses: number
    articles: number
  }
  data: {
    contractors: unknown[]
    reviews: unknown[]
    analyses: unknown[]
    articles: unknown[]
  }
}

/**
 * Get the export directory path from environment or default
 */
function getExportDir(): string {
  return process.env.CONTRACTOR_REVIEW_AGENT_OUTPUT_DIR
    || path.join(process.cwd(), '..', 'contractor-review-agent', 'output')
}

/**
 * Parse timestamp from export filename
 * Format: export-YYYY-MM-DDTHH-MM-SS.json
 */
function parseTimestampFromFilename(filename: string): Date | null {
  const match = filename.match(/export-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})\.json/)
  if (!match) return null

  const [, year, month, day, hour, minute, second] = match
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  )
}

/**
 * List all export files in the output directory
 * Returns files sorted by timestamp (newest first)
 */
export async function listExportFiles(): Promise<ExportFile[]> {
  const exportDir = getExportDir()

  try {
    const files = await fs.readdir(exportDir)
    const exportFiles: ExportFile[] = []

    for (const filename of files) {
      // Only include export-*.json files (combined exports)
      if (!filename.startsWith('export-') || !filename.endsWith('.json')) {
        continue
      }

      const filepath = path.join(exportDir, filename)
      const stats = await fs.stat(filepath)
      const timestamp = parseTimestampFromFilename(filename)

      if (timestamp) {
        exportFiles.push({
          filename,
          timestamp,
          size: stats.size,
        })
      }
    }

    // Sort by timestamp, newest first
    exportFiles.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return exportFiles
  } catch (error) {
    // Directory doesn't exist or can't be read
    console.error('Failed to list export files:', error)
    return []
  }
}

/**
 * Read and parse a specific export file
 */
export async function readExportFile(filename: string): Promise<ExportData | null> {
  const exportDir = getExportDir()
  const filepath = path.join(exportDir, filename)

  try {
    const content = await fs.readFile(filepath, 'utf-8')
    const data = JSON.parse(content) as ExportData
    return data
  } catch (error) {
    console.error(`Failed to read export file ${filename}:`, error)
    return null
  }
}

/**
 * Get the most recent export file
 */
export async function getLatestExport(): Promise<{ file: ExportFile; data: ExportData } | null> {
  const files = await listExportFiles()
  if (files.length === 0) return null

  const latestFile = files[0]
  const data = await readExportFile(latestFile.filename)
  if (!data) return null

  return { file: latestFile, data }
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
