/**
 * Global 404 Not Found Page.
 *
 * Displays when a route doesn't exist. Provides helpful navigation
 * options and suggests similar content when possible.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */

import Link from 'next/link';
import { Home, Search, ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-6xl font-bold text-muted-foreground/30">
            404
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
          <CardDescription className="text-base">
            We couldn&apos;t find the page you&apos;re looking for.
            It may have been moved or no longer exists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                <Building2 className="h-4 w-4 mr-2" />
                Contractor Dashboard
              </Link>
            </Button>
          </div>

          {/* Helpful Links */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3 text-muted-foreground">
              Looking for something specific?
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link
                href="/login"
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
              >
                <Search className="h-4 w-4" />
                Create Account
              </Link>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            If you believe this is an error, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
