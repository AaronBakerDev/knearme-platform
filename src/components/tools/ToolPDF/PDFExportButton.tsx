'use client'

import * as React from 'react'
import { FileDown, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmailCaptureDialog } from './EmailCaptureDialog'

export interface PDFExportButtonProps {
  /**
   * Tool slug (used in API request)
   */
  toolSlug: string

  /**
   * Tool display name (shown in dialog)
   */
  toolName: string

  /**
   * Tool input data to include in PDF
   */
  inputs: Record<string, unknown>

  /**
   * Tool results data to include in PDF
   */
  results: Record<string, unknown>

  /**
   * Button visual variant
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'secondary'

  /**
   * Button size
   * @default 'default'
   */
  size?: 'default' | 'sm' | 'lg'

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Whether to require email before download
   * @default true
   */
  requireEmail?: boolean
}

/**
 * PDFExportButton - Button component that triggers PDF export flow
 *
 * Handles the complete PDF export workflow:
 * 1. Opens email capture dialog (if requireEmail is true)
 * 2. Calls /api/tools/export-pdf endpoint with tool data
 * 3. Downloads resulting PDF blob
 *
 * @example
 * ```tsx
 * <PDFExportButton
 *   toolSlug="seo-analyzer"
 *   toolName="SEO Analysis Tool"
 *   inputs={{ url: 'https://example.com', keyword: 'plumbing' }}
 *   results={{ score: 85, recommendations: [...] }}
 *   variant="outline"
 *   requireEmail={true}
 * />
 * ```
 *
 * @see /src/app/api/tools/export-pdf/route.ts - API endpoint for PDF generation
 */
export function PDFExportButton({
  toolSlug,
  toolName,
  inputs,
  results,
  variant = 'default',
  size = 'default',
  className,
  requireEmail = true,
}: PDFExportButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [capturedEmail, setCapturedEmail] = React.useState<string | null>(null)

  /**
   * Generates and downloads the PDF
   * Called after email is captured (or immediately if requireEmail is false)
   */
  const handleDownloadPDF = React.useCallback(
    async (email?: string) => {
      setIsLoading(true)

      try {
        const response = await fetch('/api/tools/export-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            toolSlug,
            toolName,
            inputs,
            results,
            email: email || capturedEmail || undefined,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || 'Failed to generate PDF')
        }

        // Get PDF blob from response
        const blob = await response.blob()

        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        // Generate filename: tool-slug-YYYY-MM-DD.pdf
        const dateStr = new Date().toISOString().split('T')[0]
        link.download = `${toolSlug}-${dateStr}.pdf`

        // Trigger download
        document.body.appendChild(link)
        link.click()

        // Cleanup
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        // Close dialog on success
        setIsDialogOpen(false)
        setCapturedEmail(null)
      } catch (error) {
        console.error('PDF generation failed:', error)
        alert(
          error instanceof Error
            ? error.message
            : 'Failed to generate PDF. Please try again.'
        )
      } finally {
        setIsLoading(false)
      }
    },
    [toolSlug, toolName, inputs, results, capturedEmail]
  )

  /**
   * Handles button click - opens dialog or downloads immediately
   */
  const handleClick = () => {
    if (requireEmail) {
      setIsDialogOpen(true)
    } else {
      handleDownloadPDF()
    }
  }

  /**
   * Handles email submission from dialog
   */
  const handleEmailSubmit = (email: string) => {
    setCapturedEmail(email)
    handleDownloadPDF(email)
  }

  /**
   * Handles skipping email capture
   */
  const handleSkip = () => {
    handleDownloadPDF()
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FileDown />
            Export PDF
          </>
        )}
      </Button>

      <EmailCaptureDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleEmailSubmit}
        onSkip={requireEmail ? undefined : handleSkip}
        toolName={toolName}
        isLoading={isLoading}
      />
    </>
  )
}
