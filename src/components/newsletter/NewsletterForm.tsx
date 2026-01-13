'use client'

/**
 * Newsletter Form - Client Component
 *
 * Interactive form for newsletter signup with validation and submission.
 * Receives display configuration as props from the server wrapper.
 *
 * Features:
 * - Email validation
 * - Loading state during submission
 * - Success/error feedback
 * - Accessible form controls
 *
 * @see PAY-056 in PRD for acceptance criteria
 * @see /src/app/api/newsletter/subscribe/route.ts - Submission endpoint
 */

import { useState, type FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react'

interface NewsletterFormProps {
  placeholder: string
  buttonText: string
  successMessage: string
}

/**
 * Email validation regex (basic but effective)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Newsletter signup form with client-side validation and submission
 */
export function NewsletterForm({
  placeholder,
  buttonText,
  successMessage,
}: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (!email.trim()) {
      setStatus('error')
      setErrorMessage('Please enter your email address')
      return
    }

    if (!EMAIL_REGEX.test(email)) {
      setStatus('error')
      setErrorMessage('Please enter a valid email address')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Subscription failed')
      }

      setStatus('success')
      setEmail('') // Clear input on success
    } catch (error) {
      setStatus('error')
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      )
    }
  }

  // Show success state
  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 py-2" role="status">
        <CheckCircle className="h-5 w-5" aria-hidden="true" />
        <span>{successMessage}</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            type="email"
            name="newsletter-email"
            placeholder={placeholder}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              // Clear error when user starts typing
              if (status === 'error') {
                setStatus('idle')
                setErrorMessage('')
              }
            }}
            className="pl-9"
            aria-label="Email address"
            aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
            aria-invalid={status === 'error'}
            disabled={status === 'loading'}
          />
        </div>
        <Button
          type="submit"
          disabled={status === 'loading'}
          className="whitespace-nowrap"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Subscribing...
            </>
          ) : (
            buttonText
          )}
        </Button>
      </div>

      {/* Error message */}
      {status === 'error' && errorMessage && (
        <div
          id="newsletter-error"
          className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 text-sm"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}
    </form>
  )
}
