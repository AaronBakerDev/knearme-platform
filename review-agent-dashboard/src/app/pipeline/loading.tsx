import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading state for the pipeline status page.
 * Shows pipeline diagram and stats skeleton.
 */
export default function PipelineLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Pipeline diagram skeleton */}
      <div className="rounded-xl border border-border bg-card p-6">
        <Skeleton className="h-6 w-40 mb-6" />

        {/* Stage boxes */}
        <div className="flex items-center justify-between gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div className="flex-1 rounded-xl border border-border p-4 text-center">
                <Skeleton className="h-5 w-24 mx-auto mb-2" />
                <Skeleton className="h-8 w-16 mx-auto mb-1" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </div>
              {i < 3 && (
                <Skeleton className="h-1 w-8 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stage details grid */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-32 mt-1" />
              </div>
            </div>

            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Attention items */}
      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-6 w-36 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32 mt-1" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
