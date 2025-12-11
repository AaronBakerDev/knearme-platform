/**
 * Projects List Loading State.
 *
 * Shows skeleton grid while projects are being fetched.
 * Matches the gradient header and card styles from the main projects page.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header skeleton - matches gradient style */}
      <div className="flex justify-between items-start mb-8 bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl p-6">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-11 w-32" />
      </div>

      {/* Filter tabs skeleton */}
      <div className="bg-muted/50 p-1 rounded-lg inline-flex gap-1 mb-6">
        <Skeleton className="h-10 w-16 rounded-md" />
        <Skeleton className="h-10 w-20 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>

      {/* Projects grid skeleton - matches card styles */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden border-0 shadow-sm">
            <Skeleton className="h-48 w-full rounded-none" />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3 mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
