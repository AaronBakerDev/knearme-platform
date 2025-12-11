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

      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="w-10 h-10 rounded-full" />
              </div>
              <Skeleton className="h-10 w-16 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
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
