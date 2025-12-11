'use client';

/**
 * Global Error Boundary - Catches unhandled errors in the app.
 *
 * Provides a user-friendly error page with retry functionality.
 * Logs errors for debugging while hiding technical details from users.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * GitHub repository for issue reporting.
 * Update this when the project has a public repo.
 */
const GITHUB_REPO = 'knearme/portfolio';

/**
 * Builds a pre-filled GitHub issue URL with error context.
 * Encodes error details in the issue body for easier debugging.
 */
function buildGitHubIssueUrl(error: Error & { digest?: string }): string {
  const title = encodeURIComponent(`[Bug] Unexpected error: ${error.name}`);

  const body = encodeURIComponent(`## Error Details

**Error Message:** ${error.message}
**Error ID (digest):** ${error.digest || 'N/A'}
**URL:** ${typeof window !== 'undefined' ? window.location.href : 'Unknown'}
**User Agent:** ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}
**Time:** ${new Date().toISOString()}

## Steps to Reproduce

1. [Describe what you were doing when the error occurred]
2.
3.

## Expected Behavior

[What did you expect to happen?]

## Additional Context

[Add any other context, screenshots, or information that might help]
`);

  return `https://github.com/${GITHUB_REPO}/issues/new?title=${title}&body=${body}&labels=bug`;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to console in development
    console.error('[Global Error]', error);

    // In production, you'd send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            We encountered an unexpected error. Don&apos;t worry, your data is safe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-mono text-xs text-muted-foreground break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="w-full text-muted-foreground"
            >
              <a
                href={buildGitHubIssueUrl(error)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Bug className="h-4 w-4 mr-2" />
                Report Issue
              </a>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Help us improve by reporting this issue on GitHub.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
