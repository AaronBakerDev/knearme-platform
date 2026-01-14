import Link from 'next/link';
import { Star, CheckCircle2, MapPin, Calendar, MessageSquare, type LucideIcon, ChevronRight } from 'lucide-react';

/**
 * Pipeline status for a contractor - indicates which stages are complete.
 */
export interface PipelineStatus {
  hasReviews: boolean;
  hasAnalysis: boolean;
  hasArticle: boolean;
}

/**
 * Contractor data shape for display in the contractors list.
 */
export interface ContractorData {
  id: string;
  businessName: string;
  rating: number;
  reviewCount: number;
  city: string;
  state: string;
  pipelineStatus: PipelineStatus;
  lastSyncedAt: string;
}

export interface ContractorRowProps {
  contractor: ContractorData;
}

/**
 * Pipeline status badge component.
 * Mission Control style with emerald/zinc coloring.
 */
function StatusBadge({
  label,
  isComplete,
  icon: Icon = CheckCircle2,
}: {
  label: string;
  isComplete: boolean;
  icon?: LucideIcon;
}) {
  return (
    <div className={`flex flex-col items-center gap-1 min-w-[45px] transition-opacity duration-300 ${isComplete ? 'opacity-100' : 'opacity-40'}`}>
      <div
        className={`flex items-center justify-center h-7 w-7 rounded-lg transition-all ${
          isComplete
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-zinc-800/50 text-zinc-600 border border-zinc-700/50'
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span
        className={`text-[9px] font-mono uppercase tracking-wider ${isComplete ? 'text-emerald-400' : 'text-zinc-600'}`}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * Reusable contractor row component for the contractors list.
 * Mission Control dark theme styling.
 */
export function ContractorRow({ contractor }: ContractorRowProps) {
  const {
    id,
    businessName,
    rating,
    reviewCount,
    city,
    state,
    pipelineStatus,
    lastSyncedAt,
  } = contractor;

  const formattedDate = new Date(lastSyncedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link
      href={`/contractors/${id}`}
      className="group block px-4 py-4 hover:bg-zinc-800/30 transition-colors"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Left: Rating Badge */}
        <div className="flex shrink-0 items-center justify-center h-12 w-12 rounded-lg bg-zinc-800/50 border border-zinc-700/50 group-hover:border-amber-500/30 transition-colors relative">
          <div className="flex flex-col items-center justify-center">
            <span className="text-base font-bold font-mono text-zinc-100 leading-none tabular-nums">{rating.toFixed(1)}</span>
            <Star className="w-3 h-3 text-amber-500 fill-amber-500 mt-0.5" />
          </div>
          {rating >= 4.5 && (
            <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-zinc-900 font-bold z-10">
              ★
            </div>
          )}
        </div>

        {/* Center: Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors truncate">
            {businessName}
          </h3>
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
              <MapPin className="w-3 h-3 text-zinc-600" />
              <span>{city}, {state}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
              <MessageSquare className="w-3 h-3 text-zinc-600" />
              <span>{reviewCount.toLocaleString()} reviews</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
              <Calendar className="w-3 h-3 text-zinc-600" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Right: Pipeline Visualizer */}
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
          <StatusBadge label="Data" isComplete={pipelineStatus.hasReviews} />
          <div className="w-3 h-px bg-zinc-700/50" />
          <StatusBadge label="AI" isComplete={pipelineStatus.hasAnalysis} />
          <div className="w-3 h-px bg-zinc-700/50" />
          <StatusBadge label="Pub" isComplete={pipelineStatus.hasArticle} />
        </div>

        {/* Arrow */}
        <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-cyan-400 transition-all group-hover:translate-x-1 hidden md:block" />
      </div>
    </Link>
  );
}
