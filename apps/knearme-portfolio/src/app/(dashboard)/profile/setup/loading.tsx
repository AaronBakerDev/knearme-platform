/**
 * Profile Setup Loading State.
 *
 * Shows skeleton loaders for the 3-step profile setup wizard.
 * Displays step indicators and generic form content skeleton.
 *
 * @see page.tsx for the wizard structure this skeleton matches
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ProfileSetupLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          {/* Step indicators */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-8 h-8 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-7 w-48 mx-auto mb-2" />
          <Skeleton className="h-5 w-64 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form fields skeleton - generic structure */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* Action button */}
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
