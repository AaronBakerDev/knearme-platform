import type { DBReview, ReviewTagAnalysis } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  User,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertCircle,
  Wrench,
  Building2,
  Settings,
  MessageSquare,
  DollarSign,
  Clock,
  type LucideIcon,
} from 'lucide-react';

interface ReviewCardProps {
  review: DBReview;
  /** Whether to show the analysis section (default: true if analysis_json exists) */
  showAnalysis?: boolean;
}

const reviewDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/**
 * Renders a star rating display with colored stars.
 */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/20'}`}
        />
      ))}
    </div>
  );
}

/**
 * Sentiment indicator icon and color based on analysis.
 */
function SentimentIndicator({ analysis }: { analysis: ReviewTagAnalysis }) {
  const sentimentConfig: Record<ReviewTagAnalysis['sentiment'], {
    icon: LucideIcon;
    color: string;
    bg: string;
    label: string;
  }> = {
    positive: {
      icon: ThumbsUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      label: 'Positive',
    },
    negative: {
      icon: ThumbsDown,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      label: 'Negative',
    },
    neutral: {
      icon: Minus,
      color: 'text-zinc-400',
      bg: 'bg-zinc-500/10 border-zinc-500/20',
      label: 'Neutral',
    },
    mixed: {
      icon: AlertCircle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      label: 'Mixed',
    },
  };

  const config = sentimentConfig[analysis.sentiment];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${config.bg}`}
      title={`Sentiment: ${config.label} (${analysis.sentiment_score.toFixed(2)})`}
    >
      <Icon className={`w-3 h-3 ${config.color}`} />
      <span className={`text-[10px] font-mono ${config.color}`}>
        {analysis.sentiment_score > 0 ? '+' : ''}{analysis.sentiment_score.toFixed(1)}
      </span>
    </div>
  );
}

/**
 * Project type badge with appropriate icon.
 */
function ProjectTypeBadge({ projectType }: { projectType: ReviewTagAnalysis['project_type'] }) {
  if (!projectType) return null;

  const typeConfig: Record<NonNullable<ReviewTagAnalysis['project_type']>, {
    icon: LucideIcon;
    label: string;
    color: string;
  }> = {
    repair: {
      icon: Wrench,
      label: 'Repair',
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    },
    new_construction: {
      icon: Building2,
      label: 'New Build',
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    maintenance: {
      icon: Settings,
      label: 'Maintenance',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    consultation: {
      icon: MessageSquare,
      label: 'Consult',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
  };

  const config = typeConfig[projectType];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${config.color}`}>
      <Icon className="w-3 h-3" />
      <span className="text-[10px] font-mono">{config.label}</span>
    </div>
  );
}

/**
 * Analysis section displaying AI-detected services, sentiment, and themes.
 */
function AnalysisSection({ analysis }: { analysis: ReviewTagAnalysis }) {
  const hasServices = analysis.detected_services.length > 0;
  const hasThemes = analysis.themes.length > 0;

  return (
    <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
      {/* Top row: Services, Project Type, and Sentiment */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Detected Services */}
        {hasServices && analysis.detected_services.map((service) => (
          <Badge
            key={service}
            variant="secondary"
            className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono uppercase tracking-wide"
          >
            {service}
          </Badge>
        ))}

        {/* Project Type */}
        <ProjectTypeBadge projectType={analysis.project_type} />

        {/* Sentiment */}
        <SentimentIndicator analysis={analysis} />

        {/* Price/Timeline indicators */}
        {analysis.mentions_price && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md border bg-green-500/10 border-green-500/20" title="Mentions pricing">
            <DollarSign className="w-3 h-3 text-green-400" />
          </div>
        )}
        {analysis.mentions_timeline && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md border bg-blue-500/10 border-blue-500/20" title="Mentions timeline">
            <Clock className="w-3 h-3 text-blue-400" />
          </div>
        )}
      </div>

      {/* Themes row */}
      {hasThemes && (
        <div className="flex flex-wrap gap-1.5">
          {analysis.themes.slice(0, 5).map((theme) => (
            <span
              key={theme}
              className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 rounded bg-secondary/50 border border-border/30"
            >
              {theme}
            </span>
          ))}
          {analysis.themes.length > 5 && (
            <span className="text-[10px] text-muted-foreground/50 font-medium px-2 py-0.5">
              +{analysis.themes.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Low confidence warning */}
      {analysis.confidence < 0.5 && (
        <div className="flex items-center gap-1 text-[10px] text-amber-400/70">
          <AlertCircle className="w-3 h-3" />
          <span>Low confidence analysis ({(analysis.confidence * 100).toFixed(0)}%)</span>
        </div>
      )}
    </div>
  );
}

/**
 * ReviewCard component displays a single review with premium glass styling.
 * Shows AI analysis labels when available.
 *
 * @see contractor-review-agent/src/scripts/tag-reviews.ts for analysis generation
 */
export function ReviewCard({ review, showAnalysis = true }: ReviewCardProps) {
  const formattedDate = review.review_date
    ? reviewDateFormatter.format(new Date(review.review_date))
    : 'Unknown date';

  const hasAnalysis = showAnalysis && review.analysis_json != null;

  return (
    <div className="group rounded-2xl glass-alt border border-border/50 p-5 shadow-depth hover:border-primary/20 transition-all duration-300">
      {/* Header: User Info and Rating */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center border border-border/50 group-hover:border-primary/30 transition-colors">
            <User className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {review.reviewer_name || 'Anonymous User'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review.rating} />
              <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                {formattedDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Text */}
      <div className="relative">
        <div className="absolute -left-2 top-0 text-3xl font-serif text-primary/10 select-none">&ldquo;</div>
        <p className="text-sm text-muted-foreground font-medium leading-relaxed pl-4 line-clamp-4 group-hover:line-clamp-none transition-all duration-500">
          {review.review_text || <span className="italic opacity-50">No text provided.</span>}
        </p>
      </div>

      {/* AI Analysis Section */}
      {hasAnalysis && <AnalysisSection analysis={review.analysis_json!} />}

      {/* Owner Response */}
      {review.owner_response && (
        <div className="mt-5 pt-4 border-t border-border/30 relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 rounded bg-primary/10">
              <MessageCircle className="w-3 h-3 text-primary" />
            </div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Official Response</p>
          </div>
          <p className="text-xs font-semibold text-foreground/80 leading-relaxed bg-background/30 rounded-lg p-3 border border-border/20">
            {review.owner_response}
          </p>
        </div>
      )}
    </div>
  );
}
