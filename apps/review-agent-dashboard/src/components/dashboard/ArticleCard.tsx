'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import {
  Calendar,
  FileText,
  Eye,
  Pencil,
  CheckCircle2,
  XCircle,
  MapPin,
  ChevronRight
} from 'lucide-react';

const articleDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
});

const numberFormatter = new Intl.NumberFormat('en-US');

/**
 * Article data shape for display in the articles list.
 * Matches DBArticle with contractor info attached.
 */
export interface ArticleData {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  generatedAt: string;
  wordCount: number;
  contractor: {
    id: string;
    businessName: string;
    city: string;
    state: string;
  };
}

export interface ArticleCardProps {
  article: ArticleData;
  onPublishToggle?: (id: string, newStatus: 'draft' | 'published') => Promise<void> | void;
}

/**
 * Status badge component with Mission Control styling.
 * Shows published (emerald) or draft (amber) status.
 */
function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  const isPublished = status === 'published';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-widest ${
        isPublished
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      }`}
    >
      {isPublished ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <Pencil className="w-3 h-3" />
      )}
      {isPublished ? 'Published' : 'Draft'}
    </span>
  );
}

/**
 * Reusable article card component for the articles list.
 * Mission Control dark theme styling.
 *
 * @example
 * ```tsx
 * <ArticleCard article={{
 *   id: '1',
 *   title: 'Denver Brick Masters: Trusted Masonry Experts',
 *   slug: 'denver-brick-masters-review',
 *   status: 'published',
 *   generatedAt: '2024-12-30T14:30:00Z',
 *   wordCount: 1250,
 *   contractor: {
 *     id: '1',
 *     businessName: 'Denver Brick Masters',
 *     city: 'Denver',
 *     state: 'CO'
 *   }
 * }} />
 * ```
 */
export function ArticleCard({ article, onPublishToggle }: ArticleCardProps) {
  const [isPending, startTransition] = useTransition();
  const {
    id,
    title,
    status,
    generatedAt,
    wordCount,
    contractor,
  } = article;

  // Format the generated date for display
  const formattedDate = articleDateFormatter.format(new Date(generatedAt));

  // Handle publish/unpublish toggle
  const handlePublishClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = status === 'published' ? 'draft' : 'published';
    if (!onPublishToggle) return;
    startTransition(() => {
      void onPublishToggle(id, newStatus);
    });
  };

  const canToggle = Boolean(onPublishToggle);
  const actionLabel = status === 'published' ? 'Unpublish' : 'Publish';

  return (
    <Link
      href={`/articles/${id}`}
      className="group block px-4 py-4 hover:bg-zinc-800/30 transition-colors"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Left: Icon Badge */}
        <div className="flex shrink-0 items-center justify-center h-12 w-12 rounded-lg bg-zinc-800/50 border border-zinc-700/50 group-hover:border-emerald-500/30 transition-colors">
          <FileText className="h-5 w-5 text-emerald-400" />
        </div>

        {/* Center: Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors truncate">
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
              <MapPin className="w-3 h-3 text-zinc-600" />
              <span>{contractor.businessName}</span>
              <span className="text-zinc-700">•</span>
              <span>{contractor.city}, {contractor.state}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
              <Calendar className="w-3 h-3 text-zinc-600" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
              <FileText className="w-3 h-3 text-zinc-600" />
              <span>{numberFormatter.format(wordCount)} words</span>
            </div>
          </div>
        </div>

        {/* Right: Status and Actions */}
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/articles/${id}`;
              }}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-700/50 border border-zinc-700/50 transition-colors"
              title="View"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/articles/${id}?edit=true`;
              }}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-amber-400 hover:bg-zinc-700/50 border border-zinc-700/50 transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handlePublishClick}
              disabled={!canToggle || isPending}
              className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-mono transition-colors disabled:opacity-60 disabled:pointer-events-none ${
                status === 'published'
                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
              }`}
              aria-busy={isPending}
              title={actionLabel}
            >
              {status === 'published' ? (
                <XCircle className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {isPending ? '...' : actionLabel}
              </span>
            </button>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-cyan-400 transition-all group-hover:translate-x-1 hidden md:block" />
        </div>
      </div>
    </Link>
  );
}
