/**
 * PipelineDiagram Component
 *
 * Visual flow diagram showing the 4-stage contractor review pipeline:
 * Discover -> Collect -> Analyze -> Generate
 *
 * Each stage displays as a card with count/progress and colored status indicators:
 * - Complete (green): Stage finished
 * - In-progress (teal/primary): Currently processing
 * - Pending (gray): Not yet started
 *
 * @see /Users/aaronbaker/knearme-workspace/review-agent-dashboard/src/app/pipeline/page.tsx
 */

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  count: number;
  total: number;
  status: 'complete' | 'in-progress' | 'pending';
  icon: React.ReactNode;
}

interface PipelineDiagramProps {
  stages: PipelineStage[];
}

export function PipelineDiagram({ stages }: PipelineDiagramProps) {
  const getStatusColors = (status: PipelineStage['status']) => {
    switch (status) {
      case 'complete':
        return {
          bg: 'bg-[var(--success)]/10',
          border: 'border-[var(--success)]',
          text: 'text-[var(--success)]',
          dot: 'bg-[var(--success)]',
          arrow: 'bg-[var(--success)]',
        };
      case 'in-progress':
        return {
          bg: 'bg-[var(--primary)]/10',
          border: 'border-[var(--primary)]',
          text: 'text-[var(--primary)]',
          dot: 'bg-[var(--primary)]',
          arrow: 'bg-[var(--primary)]',
        };
      case 'pending':
        return {
          bg: 'bg-[var(--muted)]/50',
          border: 'border-[var(--muted)]',
          text: 'text-[var(--muted-foreground)]',
          dot: 'bg-[var(--muted-foreground)]',
          arrow: 'bg-[var(--muted)]',
        };
    }
  };

  const getStatusLabel = (status: PipelineStage['status']) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'in-progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
    }
  };

  const getProgressPercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div className="rounded-xl bg-[var(--card)] border border-[var(--border)] p-6">
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6">Pipeline Flow</h3>

      {/* Pipeline stages with arrows */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-0">
        {stages.map((stage, index) => {
          const colors = getStatusColors(stage.status);
          const percentage = getProgressPercentage(stage.count, stage.total);

          return (
            <div key={stage.id} className="flex flex-col lg:flex-row items-center flex-1">
              {/* Stage Card */}
              <div
                className={`relative w-full lg:w-auto lg:min-w-[160px] rounded-xl border-2 ${colors.border} ${colors.bg} p-4 transition-all hover:scale-[1.02]`}
              >
                {/* Status indicator dot */}
                <div className="absolute -top-1.5 -right-1.5">
                  <div className={`h-3 w-3 rounded-full ${colors.dot}`}>
                    {stage.status === 'in-progress' && (
                      <span className="absolute inset-0 rounded-full bg-[var(--primary)] animate-ping opacity-75" />
                    )}
                  </div>
                </div>

                {/* Icon */}
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg} ${colors.text} mb-3`}>
                  {stage.icon}
                </div>

                {/* Stage name */}
                <h4 className="font-semibold text-[var(--foreground)]">{stage.name}</h4>
                <p className="text-xs text-[var(--muted-foreground)] mb-3">{stage.description}</p>

                {/* Count display */}
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${colors.text}`}>
                    {stage.count.toLocaleString()}
                  </span>
                  {stage.total !== stage.count && (
                    <span className="text-sm text-[var(--muted-foreground)]">
                      / {stage.total.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 w-full bg-[var(--secondary)] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.dot} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Status label */}
                <p className={`mt-2 text-xs font-medium ${colors.text}`}>
                  {getStatusLabel(stage.status)} - {percentage}%
                </p>
              </div>

              {/* Arrow connector (not on last item) */}
              {index < stages.length - 1 && (
                <>
                  {/* Desktop arrow (horizontal) */}
                  <div className="hidden lg:flex items-center px-4">
                    <div className={`h-0.5 w-8 ${colors.arrow}`} />
                    <svg
                      className={`w-4 h-4 -ml-1 ${colors.text}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  {/* Mobile arrow (vertical) */}
                  <div className="flex lg:hidden items-center justify-center py-2">
                    <div className={`w-0.5 h-6 ${colors.arrow}`} />
                    <svg
                      className={`w-4 h-4 -mt-1 absolute ${colors.text}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      style={{ transform: 'rotate(90deg)' }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall progress summary */}
      <div className="mt-6 pt-6 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-[var(--muted-foreground)]">End-to-end Pipeline Progress</span>
          <span className="font-medium text-[var(--foreground)]">
            {stages.filter(s => s.status === 'complete').length} of {stages.length} stages complete
          </span>
        </div>
        <div className="flex gap-1">
          {stages.map((stage) => {
            const colors = getStatusColors(stage.status);
            return (
              <div
                key={stage.id}
                className={`flex-1 h-2 rounded-full ${colors.dot}`}
                title={`${stage.name}: ${getStatusLabel(stage.status)}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
