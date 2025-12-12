'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Email validation schema for PDF download gate
 */
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type EmailFormData = z.infer<typeof emailSchema>

export interface EmailCaptureDialogProps {
  /**
   * Controls dialog visibility
   */
  open: boolean

  /**
   * Callback when dialog open state changes
   */
  onOpenChange: (open: boolean) => void

  /**
   * Callback when email is submitted
   */
  onSubmit: (email: string) => void

  /**
   * Optional callback to skip email capture and download directly
   */
  onSkip?: () => void

  /**
   * Name of the tool being exported (displayed in dialog)
   */
  toolName: string

  /**
   * Loading state during PDF generation
   */
  isLoading?: boolean
}

/**
 * EmailCaptureDialog - Dialog component for capturing email before PDF download
 *
 * Provides an optional email gate for PDF downloads. If onSkip is provided,
 * users can bypass email capture. Otherwise, email is required.
 *
 * @example
 * ```tsx
 * <EmailCaptureDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSubmit={(email) => {
 *     console.log('Email captured:', email)
 *     generatePDF()
 *   }}
 *   onSkip={() => generatePDF()}  // Optional
 *   toolName="SEO Analysis Tool"
 *   isLoading={isGeneratingPDF}
 * />
 * ```
 */
export function EmailCaptureDialog({
  open,
  onOpenChange,
  onSubmit,
  onSkip,
  toolName,
  isLoading = false,
}: EmailCaptureDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })

  const onFormSubmit = (data: EmailFormData) => {
    onSubmit(data.email)
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
      reset()
    }
  }

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download PDF Report</DialogTitle>
          <DialogDescription>
            Get your {toolName} results as a PDF. Enter your email to receive the download link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="size-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={errors.email ? 'true' : 'false'}
              disabled={isLoading}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {onSkip && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
              >
                Skip
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Generating PDF...
                </>
              ) : (
                'Download PDF'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
