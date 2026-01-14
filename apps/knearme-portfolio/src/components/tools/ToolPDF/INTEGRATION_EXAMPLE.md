# Integration Example

Complete example showing how to integrate PDFExportButton into a tool results page.

## Scenario: SEO Analysis Tool

### 1. Tool Results Page Component

```tsx
// src/app/(dashboard)/tools/seo-analyzer/results/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { PDFExportButton } from '@/components/tools/ToolPDF'
import { Card } from '@/components/ui/card'

interface SEOAnalysisResults {
  score: number
  title: { score: number; issues: string[] }
  description: { score: number; issues: string[] }
  keywords: { density: number; suggestions: string[] }
  recommendations: Array<{ severity: string; message: string }>
}

export default function SEOAnalysisResultsPage() {
  const searchParams = useSearchParams()
  const [results, setResults] = useState<SEOAnalysisResults | null>(null)
  const [inputs, setInputs] = useState<{ url: string; keyword: string } | null>(null)

  useEffect(() => {
    // Load results from search params or state management
    const url = searchParams.get('url')
    const keyword = searchParams.get('keyword')

    if (url && keyword) {
      setInputs({ url, keyword })
      // Fetch or load results...
    }
  }, [searchParams])

  if (!results || !inputs) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">SEO Analysis Results</h1>
          <p className="text-muted-foreground">
            Analysis for {inputs.url}
          </p>
        </div>

        {/* PDF Export Button */}
        <PDFExportButton
          toolSlug="seo-analyzer"
          toolName="SEO Analysis Tool"
          inputs={inputs}
          results={results}
          variant="outline"
          size="lg"
          requireEmail={true}
        />
      </div>

      {/* Results Display */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Overall Score: {results.score}/100
        </h2>

        {/* Title Analysis */}
        <div className="mb-6">
          <h3 className="font-semibold">Title Tag</h3>
          <p>Score: {results.title.score}/100</p>
          <ul className="list-disc list-inside">
            {results.title.issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>

        {/* More results... */}
      </Card>
    </div>
  )
}
```

### 2. Corresponding API Endpoint

The API endpoint that generates the PDF should be created at:

```typescript
// src/app/api/tools/export-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateToolPDF } from '@/lib/pdf/generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toolSlug, toolName, inputs, results, email } = body

    // Validate required fields
    if (!toolSlug || !toolName || !inputs || !results) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Optional: Store email for marketing (with consent)
    if (email) {
      await storeEmailCapture(email, toolSlug)
    }

    // Generate PDF based on tool type
    const pdfBuffer = await generateToolPDF({
      toolSlug,
      toolName,
      inputs,
      results,
    })

    // Return PDF blob
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${toolSlug}-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { message: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
```

### 3. PDF Generation Library Setup

You'll need to create the PDF generator. Recommended library: `@react-pdf/renderer` or `puppeteer`

**Example with @react-pdf/renderer:**

```typescript
// src/lib/pdf/generator.ts
import { renderToBuffer } from '@react-pdf/renderer'
import { SEOAnalysisPDFDocument } from './templates/seo-analysis'
import { CostEstimatorPDFDocument } from './templates/cost-estimator'

interface GeneratePDFParams {
  toolSlug: string
  toolName: string
  inputs: Record<string, unknown>
  results: Record<string, unknown>
}

export async function generateToolPDF({
  toolSlug,
  toolName,
  inputs,
  results,
}: GeneratePDFParams): Promise<Buffer> {
  // Select appropriate template based on tool
  let document

  switch (toolSlug) {
    case 'seo-analyzer':
      document = (
        <SEOAnalysisPDFDocument
          toolName={toolName}
          inputs={inputs}
          results={results}
        />
      )
      break

    case 'cost-estimator':
      document = (
        <CostEstimatorPDFDocument
          toolName={toolName}
          inputs={inputs}
          results={results}
        />
      )
      break

    default:
      throw new Error(`Unknown tool: ${toolSlug}`)
  }

  // Render to buffer
  return await renderToBuffer(document)
}
```

**PDF Template Example:**

```typescript
// src/lib/pdf/templates/seo-analysis.tsx
import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  text: {
    fontSize: 12,
    lineHeight: 1.5,
  },
})

interface SEOAnalysisPDFDocumentProps {
  toolName: string
  inputs: {
    url: string
    keyword: string
  }
  results: {
    score: number
    title: { score: number; issues: string[] }
    description: { score: number; issues: string[] }
    recommendations: Array<{ severity: string; message: string }>
  }
}

export function SEOAnalysisPDFDocument({
  toolName,
  inputs,
  results,
}: SEOAnalysisPDFDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{toolName}</Text>
          <Text style={styles.text}>Analysis for: {inputs.url}</Text>
          <Text style={styles.text}>Target Keyword: {inputs.keyword}</Text>
          <Text style={styles.text}>
            Generated: {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Overall Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall SEO Score</Text>
          <Text style={styles.text}>{results.score}/100</Text>
        </View>

        {/* Title Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title Tag Analysis</Text>
          <Text style={styles.text}>Score: {results.title.score}/100</Text>
          {results.title.issues.map((issue, i) => (
            <Text key={i} style={styles.text}>
              • {issue}
            </Text>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {results.recommendations.map((rec, i) => (
            <Text key={i} style={styles.text}>
              [{rec.severity.toUpperCase()}] {rec.message}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  )
}
```

## Installation

To use @react-pdf/renderer:

```bash
npm install @react-pdf/renderer
```

Or with puppeteer (for more complex PDFs):

```bash
npm install puppeteer
```

## Alternative: Direct Download (No Email)

For internal tools or logged-in users, you can skip email capture:

```tsx
<PDFExportButton
  toolSlug="internal-estimator"
  toolName="Internal Cost Estimator"
  inputs={inputs}
  results={results}
  requireEmail={false}  // Skip email dialog
  variant="default"
/>
```

## Testing the Integration

1. Navigate to tool results page
2. Click "Export PDF" button
3. Email dialog opens (if requireEmail=true)
4. Enter email or click "Skip"
5. PDF generates and downloads automatically
6. Filename format: `seo-analyzer-2025-12-12.pdf`

## Error Handling

The component handles common errors:
- Network failures (shows alert)
- Invalid responses (shows error message)
- Validation errors (inline form validation)

Customize error handling by catching errors in the API route.
