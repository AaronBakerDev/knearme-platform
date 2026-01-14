'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Global error boundary for the dashboard.
 * Catches runtime errors and provides recovery options.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Error icon */}
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      {/* Error message */}
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-muted-foreground max-w-md mb-6">
        {error.message || 'An unexpected error occurred while loading the dashboard.'}
      </p>

      {/* Error digest for debugging */}
      {error.digest && (
        <p className="text-xs font-mono text-muted-foreground/60 mb-6">
          Error ID: {error.digest}
        </p>
      )}

      {/* Recovery actions */}
      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Button
          onClick={() => window.location.href = '/'}
          variant="outline"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
