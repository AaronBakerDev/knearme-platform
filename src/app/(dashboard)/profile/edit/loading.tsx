/**
 * Profile Edit Loading State.
 *
 * Shows skeleton loaders matching the profile edit form structure.
 * Mirrors the actual form layout for a seamless loading experience.
 *
 * @see page.tsx for the actual form structure this skeleton matches
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ProfileEditLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link skeleton */}
      <Skeleton className="h-5 w-36 mb-6" />

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-7 w-28 mb-1" />
          <Skeleton className="h-5 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Business Name field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Location - City & State grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Description textarea */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-3 w-56" />
          </div>

          {/* Services - 2 column grid of buttons */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48 mb-2" />
            <div className="grid gap-2 sm:grid-cols-2 mt-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          </div>

          {/* Service Areas */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-52 mb-2" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-10" />
            </div>
            {/* Sample badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
