'use client';

import { useState, useMemo } from 'react';
import type { DBReview, ContractorDetail } from '@/lib/types';
import { ReviewCard } from '@/components/dashboard/ReviewCard';
import { AnalysisDisplay } from '@/components/dashboard/AnalysisDisplay';
import { ArticlePreview } from '@/components/dashboard/ArticlePreview';
import { MessageSquare, Lightbulb, FileText, LayoutDashboard, Filter, X, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContractorTabsProps {
  reviews: DBReview[];
  analysis: ContractorDetail['analysis'];
  article: ContractorDetail['article'];
}

type FilterType = 'all' | 'positive' | 'negative' | 'star-5' | 'star-4' | 'star-3' | 'star-2' | 'star-1';

/**
 * Client component for tab functionality on the contractor detail page.
 * Mission Control dark theme styling with interactive review filtering.
 *
 * @see /Users/aaronbaker/knearme-workspace/review-agent-dashboard/src/app/contractors/[id]/page.tsx
 */
export function ContractorTabs({ reviews, analysis, article }: ContractorTabsProps) {
  const [reviewFilter, setReviewFilter] = useState<FilterType>('all');

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Memoized filtering logic
  const filteredReviews = useMemo(() => {
    switch (reviewFilter) {
      case 'positive':
        return reviews.filter(r => r.rating >= 4);
      case 'negative':
        return reviews.filter(r => r.rating <= 2);
      case 'star-5': return reviews.filter(r => r.rating === 5);
      case 'star-4': return reviews.filter(r => r.rating === 4);
      case 'star-3': return reviews.filter(r => r.rating === 3);
      case 'star-2': return reviews.filter(r => r.rating === 2);
      case 'star-1': return reviews.filter(r => r.rating === 1);
      default:
        return reviews;
    }
  }, [reviews, reviewFilter]);

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const rating = Math.round(r.rating) as keyof typeof counts;
      if (counts[rating] !== undefined) counts[rating]++;
    });
    return counts;
  }, [reviews]);

  return (
    <Tabs defaultValue="reviews" className="space-y-6">
      {/* Tab Buttons Container */}
      <div className="flex items-center justify-center md:justify-start">
        <TabsList className="bg-zinc-800/50 border border-zinc-700/50 p-1 h-auto rounded-lg">
          <TabsTrigger
            value="reviews"
            className="gap-2 px-5 py-2.5 rounded-lg text-sm font-mono data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/20 text-zinc-400"
          >
            <MessageSquare className="w-4 h-4" />
            Reviews
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-zinc-700/50 tabular-nums">
              {reviews.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            disabled={!analysis}
            className="gap-2 px-5 py-2.5 rounded-lg text-sm font-mono data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-400 text-zinc-400 disabled:opacity-40"
          >
            <Lightbulb className="w-4 h-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger
            value="article"
            disabled={!article}
            className="gap-2 px-5 py-2.5 rounded-lg text-sm font-mono data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-zinc-400 disabled:opacity-40"
          >
            <FileText className="w-4 h-4" />
            Article
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Tab Content Container */}
      <div>
        <TabsContent value="reviews" className="space-y-6 mt-0">
          {/* Reviews Summary Header */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Aggregate Rating */}
              <div className="flex flex-col items-center min-w-[140px]">
                <div className="text-5xl font-bold font-mono text-zinc-100 tabular-nums mb-2">
                  {avgRating.toFixed(1)}
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "w-4 h-4",
                        s <= Math.round(avgRating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-zinc-700"
                      )}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  Aggregate Rating
                </p>
              </div>

              <div className="h-16 w-px bg-zinc-800/50 hidden md:block" />

              {/* Quick Stats */}
              <div className="flex-1 grid grid-cols-3 gap-4 w-full">
                <button
                  onClick={() => setReviewFilter('all')}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-lg transition-all border",
                    reviewFilter === 'all'
                      ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                      : "bg-zinc-800/30 border-zinc-700/50 text-zinc-400 hover:border-cyan-500/20"
                  )}
                >
                  <div className="text-2xl font-bold font-mono tabular-nums">{reviews.length}</div>
                  <p className="text-[10px] font-mono uppercase tracking-widest mt-1 opacity-70">
                    Total
                  </p>
                </button>
                <button
                  onClick={() => setReviewFilter('positive')}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-lg transition-all border",
                    reviewFilter === 'positive'
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-zinc-800/30 border-zinc-700/50 text-zinc-400 hover:border-emerald-500/20"
                  )}
                >
                  <div className="text-2xl font-bold font-mono tabular-nums">
                    {reviews.filter(r => r.rating >= 4).length}
                  </div>
                  <p className="text-[10px] font-mono uppercase tracking-widest mt-1 opacity-70">
                    Positive
                  </p>
                </button>
                <button
                  onClick={() => setReviewFilter('negative')}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-lg transition-all border",
                    reviewFilter === 'negative'
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : "bg-zinc-800/30 border-zinc-700/50 text-zinc-400 hover:border-red-500/20"
                  )}
                >
                  <div className="text-2xl font-bold font-mono tabular-nums">
                    {reviews.filter(r => r.rating <= 2).length}
                  </div>
                  <p className="text-[10px] font-mono uppercase tracking-widest mt-1 opacity-70">
                    Negative
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-2 px-3 border-r border-zinc-700/50">
              <Filter className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Star Filter
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const filterKey = `star-${star}` as FilterType;
                const isActive = reviewFilter === filterKey;
                const count = ratingCounts[star as keyof typeof ratingCounts];

                return (
                  <Button
                    key={star}
                    variant="outline"
                    size="sm"
                    onClick={() => setReviewFilter(isActive ? 'all' : filterKey)}
                    disabled={count === 0}
                    className={cn(
                      "h-8 rounded-lg text-xs font-mono gap-1.5 border",
                      isActive
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-zinc-800/50 text-zinc-500 border-zinc-700/50 hover:text-zinc-300 hover:border-zinc-600/50",
                      count === 0 && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Star className={cn(
                      "w-3 h-3",
                      isActive ? "fill-amber-400 text-amber-400" : "fill-amber-400 text-amber-400"
                    )} />
                    <span>{star}</span>
                    <span className="text-zinc-600">({count})</span>
                  </Button>
                );
              })}
            </div>
            {reviewFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReviewFilter('all')}
                className="ml-auto h-8 text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </Button>
            )}
          </div>

          {/* Reviews List Header */}
          <div className="flex items-center gap-4 px-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                {filteredReviews.length} {reviewFilter !== 'all' ? reviewFilter.replace('star-', '') + ' Star ' : ''} Records
              </span>
            </div>
            <div className="h-px flex-1 bg-zinc-800/50" />
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {filteredReviews.length === 0 && (
            <div className="rounded-lg border border-dashed border-zinc-700/50 bg-zinc-900/20 p-12 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
                <MessageSquare className="w-8 h-8 text-zinc-600" />
              </div>
              <h4 className="text-lg font-semibold text-zinc-400 mb-1">No Reviews Found</h4>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                No reviews match the selected filter criteria.
              </p>
              <Button
                variant="link"
                onClick={() => setReviewFilter('all')}
                className="mt-4 text-cyan-400 hover:text-cyan-300"
              >
                Reset filters
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="mt-0">
          {analysis ? (
            <AnalysisDisplay
              analysis={analysis.analysis_json}
              modelUsed={analysis.model_used}
              tokensUsed={analysis.tokens_used}
              costEstimate={analysis.cost_estimate}
              analyzedAt={analysis.analyzed_at}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-700/50 bg-zinc-900/20 p-12 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
                <LayoutDashboard className="w-8 h-8 text-zinc-600" />
              </div>
              <h4 className="text-lg font-semibold text-zinc-400 mb-1">Analysis Pending</h4>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                The AI review agent has not processed the data for this contractor.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="article" className="mt-0">
          {article ? (
            <ArticlePreview article={article} />
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-700/50 bg-zinc-900/20 p-12 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
                <FileText className="w-8 h-8 text-zinc-600" />
              </div>
              <h4 className="text-lg font-semibold text-zinc-400 mb-1">Article Not Generated</h4>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                Complete the analysis phase to unlock AI article generation.
              </p>
            </div>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
}
