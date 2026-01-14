import { promises as fs } from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/exports/[filename]
 *
 * Downloads an export file from the contractor-review-agent output directory.
 * Returns the raw JSON file with proper Content-Disposition header for download.
 */

function getExportDir(): string {
  return process.env.CONTRACTOR_REVIEW_AGENT_OUTPUT_DIR
    || path.join(process.cwd(), '..', 'contractor-review-agent', 'output')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  // Validate filename format to prevent directory traversal
  if (!filename.match(/^export-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/)) {
    return NextResponse.json(
      { error: 'Invalid filename format' },
      { status: 400 }
    )
  }

  const exportDir = getExportDir()
  const filepath = path.join(exportDir, filename)

  try {
    const content = await fs.readFile(filepath, 'utf-8')

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error(`Failed to read export file ${filename}:`, error)
    return NextResponse.json(
      { error: 'Export file not found' },
      { status: 404 }
    )
  }
}
