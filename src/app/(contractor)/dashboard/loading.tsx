/**
 * Dashboard Loading State.
 *
 * Shows skeleton loaders matching the dashboard layout structure while
 * data is being fetched. Uses Next.js streaming to display immediately.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Welcome section skeleton */}
      <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl p-6">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-40" />
      </div>

      {/* Stats strip skeleton */}
      <div className="flex gap-3 md:gap-6 py-3 px-3 md:px-4 bg-muted/30 rounded-xl overflow-x-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <Skeleton className="w-2 h-2 md:w-8 md:h-8 rounded-full" />
            <div className="min-w-0">
              <Skeleton className="h-6 md:h-7 w-10 md:w-12" />
              <Skeleton className="h-3 w-12 mt-1" />
            </div>
            {i < 3 && (
              <div className="w-px h-8 bg-border ml-auto hidden md:block" />
            )}
          </div>
        ))}
      </div>

      {/* Recent projects skeleton */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-6 w-36 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-20" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick actions skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="border-2 border-dashed">
            <CardHeader>
              <Skeleton className="w-12 h-12 rounded-full mb-2" />
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-11 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
