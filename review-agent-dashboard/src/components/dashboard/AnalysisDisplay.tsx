'use client'

import type { ReviewAnalysis, ThemeAnalysis } from '@/lib/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Quote,
  Star,
  Info,
  Monitor,
  Hash,
  DollarSign,
  Calendar,
  type LucideIcon
} from 'lucide-react';

const analysisDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const numberFormatter = new Intl.NumberFormat('en-US');

interface AnalysisDisplayProps {
  analysis: ReviewAnalysis;
  modelUsed?: string;
  tokensUsed?: number;
  costEstimate?: number;
  analyzedAt?: string;
}

type SentimentKey = ReviewAnalysis['sentiment']['overall'];

type RatingTooltipPayload = {
  value?: number;
  payload?: {
    stars?: string;
  };
};

type RatingTooltipProps = {
  active?: boolean;
  payload?: RatingTooltipPayload[];
};

function RatingTooltip({ active, payload }: RatingTooltipProps) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const stars = entry.payload?.stars ?? '';
  const count = typeof entry.value === 'number' ? entry.value : 0;

  return (
    <div className="bg-card border border-border p-2 rounded-lg shadow-elevated text-xs">
      <p className="font-bold text-foreground">{stars}</p>
      <p className="text-muted-foreground">{count} reviews</p>
    </div>
  );
}

/**
 * Visual indicator for sentiment score.
 * Shows a gradient bar with marker for the score position.
 */
function SentimentIndicator({ score, overall }: { score: number; overall: SentimentKey }) {
  const percentage = ((score + 1) / 2) * 100;

  const sentimentConfigs: Record<SentimentKey, { color: string; bg: string; icon: LucideIcon }> = {
    positive: { color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10', icon: TrendingUp },
    negative: { color: 'text-[var(--destructive)]', bg: 'bg-[var(--destructive)]/10', icon: TrendingDown },
    mixed: { color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10', icon: Info },
    neutral: { color: 'text-[var(--muted-foreground)]', bg: 'bg-muted/10', icon: Info },
  };

  const config = sentimentConfigs[overall] ?? sentimentConfigs.neutral;
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider block">Sentiment</span>
            <span className={`text-sm font-bold capitalize ${config.color}`}>
              {overall}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider block">Score</span>
          <span className="text-lg font-mono font-bold text-foreground">
            {score > 0 ? '+' : ''}{score.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="relative pt-2">
        <div className="h-2 w-full rounded-full bg-secondary/50 overflow-hidden flex">
          <div className="h-full bg-[var(--destructive)]" style={{ width: '33.33%' }} />
          <div className="h-full bg-[var(--warning)]" style={{ width: '33.33%' }} />
          <div className="h-full bg-[var(--success)]" style={{ width: '33.34%' }} />
        </div>
        <div
          className="absolute top-0 w-4 h-6 -mt-1 transition-all duration-1000 ease-out"
          style={{ left: `calc(${percentage}% - 8px)` }}
        >
          <div className="h-full w-0.5 bg-foreground mx-auto shadow-glow" />
          <div className="w-3 h-3 rounded-full bg-foreground border-2 border-background shadow-depth mx-auto -mt-1" />
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] font-medium uppercase tracking-tighter">
        <span>Negative</span>
        <span>Neutral</span>
        <span>Positive</span>
      </div>
    </div>
  );
}

/**
 * Rating distribution chart using Recharts.
 */
function RatingDistribution({ distribution }: { distribution: Record<string, number> }) {
  const data = [5, 4, 3, 2, 1].map(stars => ({
    stars: `${stars} ★`,
    count: distribution[stars.toString()] || 0,
    starNum: stars
  }));

  return (
    <div className="h-[180px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: -20, right: 10, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.3} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="stars"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 500 }}
          />
          <Tooltip content={<RatingTooltip />} cursor={{ fill: 'var(--secondary)', opacity: 0.4 }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.starNum >= 4 ? 'var(--success)' : entry.starNum >= 3 ? 'var(--warning)' : 'var(--destructive)'}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Theme card component.
 */
function ThemeCard({ theme, type }: { theme: ThemeAnalysis; type: 'positive' | 'negative' }) {
  const isPos = type === 'positive';
  const colorClass = isPos ? 'text-[var(--success)]' : 'text-[var(--destructive)]';
  const bgClass = isPos ? 'bg-[var(--success)]/10' : 'bg-[var(--destructive)]/10';
  const borderClass = isPos ? 'border-[var(--success)]/20' : 'border-[var(--destructive)]/20';

  return (
    <div className={`rounded-xl border ${borderClass} ${bgClass} p-4 transition-all hover:scale-[1.02] cursor-default group`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-bold uppercase tracking-wide ${colorClass}`}>{theme.theme}</span>
        <span className="text-[10px] font-mono bg-background/50 px-2 py-0.5 rounded border border-border/50 text-muted-foreground">
          {theme.count} mentions
        </span>
      </div>
      <div className="space-y-2">
        {theme.examples?.slice(0, 2).map((example: string, i: number) => (
          <div key={i} className="flex gap-2">
            <Quote className={`w-3 h-3 mt-1 shrink-0 ${colorClass} opacity-50`} />
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              {example}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Insight Card for Red Flags, Strengths, or Recommendations.
 */
function InsightCard({ title, items, type }: { title: string; items: string[]; type: 'red-flag' | 'strength' | 'recommendation' }) {
  const configs = {
    'red-flag': {
      icon: AlertTriangle,
      color: 'text-[var(--destructive)]',
      bg: 'bg-[var(--destructive)]/5',
      border: 'border-[var(--destructive)]/20',
      bullet: 'bg-[var(--destructive)]',
    },
    'strength': {
      icon: CheckCircle,
      color: 'text-[var(--success)]',
      bg: 'bg-[var(--success)]/5',
      border: 'border-[var(--success)]/20',
      bullet: 'bg-[var(--success)]',
    },
    'recommendation': {
      icon: Lightbulb,
      color: 'text-[var(--primary)]',
      bg: 'bg-[var(--primary)]/5',
      border: 'border-[var(--primary)]/20',
      bullet: 'bg-[var(--primary)]',
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  if (!items || items.length === 0) return null;

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-5 shadow-sm animate-fade-up`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg bg-background/50 border ${config.border} ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h4 className={`text-sm font-bold uppercase tracking-wider ${config.color}`}>{title}</h4>
      </div>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 group">
            <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${config.bullet} shadow-glow`} />
            <p className="text-sm text-foreground/90 leading-relaxed font-medium group-hover:text-foreground transition-colors">
              {item}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Format timestamp to readable date
 */
function formatDate(dateString: string): string {
  return analysisDateFormatter.format(new Date(dateString));
}

/**
 * AnalysisDisplay component shows the full AI analysis of contractor reviews.
 * Enhanced with premium visualizations and interactive scannability.
 */
export function AnalysisDisplay({ analysis, modelUsed, tokensUsed, costEstimate, analyzedAt }: AnalysisDisplayProps) {
  return (
    <div className="space-y-8 pb-12">
      {/* Generation Metadata */}
      {(modelUsed || tokensUsed || costEstimate || analyzedAt) && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground bg-secondary/30 rounded-xl px-4 py-3 border border-border/50">
          {analyzedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Analyzed: {formatDate(analyzedAt)}
            </span>
          )}
          {modelUsed && (
            <span className="flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5" />
              Model: {modelUsed}
            </span>
          )}
          {tokensUsed && (
            <span className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />
              {numberFormatter.format(tokensUsed)} tokens
            </span>
          )}
          {costEstimate && (
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              ${costEstimate.toFixed(4)}
            </span>
          )}
        </div>
      )}
      {/* Top Section: Sentiment & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sentiment Card */}
        <div className="lg:col-span-2 rounded-2xl glass border border-border p-6 shadow-depth animate-fade-up stagger-1">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">Pipeline Analysis: Sentiment</h4>
          <SentimentIndicator score={analysis.sentiment.score} overall={analysis.sentiment.overall} />

          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              AI generated summary of {analysis.summary.total_reviews} verified reviews.
            </p>
          </div>
        </div>

        {/* Rating Distribution Card */}
        <div className="lg:col-span-3 rounded-2xl glass border border-border p-6 shadow-depth animate-fade-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Rating Distribution</h4>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold">{analysis.summary.average_rating.toFixed(1)} Avg</span>
            </div>
          </div>
          <RatingDistribution distribution={analysis.summary.rating_distribution} />
        </div>
      </div>

      {/* Themes Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold">Key Review Themes</h3>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Positive Themes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <CheckCircle className="w-4 h-4 text-[var(--success)]" />
              <span className="text-xs font-bold text-[var(--success)] uppercase tracking-wider">Recurring Praise</span>
            </div>
            <div className="grid gap-4">
              {analysis.themes.positive.map((theme, idx) => (
                <ThemeCard key={idx} theme={theme} type="positive" />
              ))}
            </div>
          </div>

          {/* Negative Themes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <AlertTriangle className="w-4 h-4 text-[var(--destructive)]" />
              <span className="text-xs font-bold text-[var(--destructive)] uppercase tracking-wider">Points of Friction</span>
            </div>
            <div className="grid gap-4">
              {analysis.themes.negative.map((theme, idx) => (
                <ThemeCard key={idx} theme={theme} type="negative" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notable Quotes */}
      {analysis.notable_quotes && analysis.notable_quotes.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold">Voice of the Customer</h3>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.notable_quotes.map((quote, idx) => (
              <div key={idx} className="relative group rounded-xl bg-secondary/30 border border-border/50 p-5 hover:bg-secondary/50 transition-all hover:border-primary/30">
                <Quote className="absolute top-4 right-4 w-12 h-12 text-primary opacity-5 pointer-events-none transition-all group-hover:opacity-10" />
                <p className="text-sm text-foreground/90 italic leading-relaxed relative z-10 mb-4">
                  &ldquo;{quote.quote}&rdquo;
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${s <= quote.rating ? 'text-amber-500 fill-amber-500' : 'text-muted'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">{quote.context}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold">Actionable Insights</h3>
          <div className="h-px flex-1 bg-border/50" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InsightCard title="Critical Red Flags" items={analysis.red_flags} type="red-flag" />
          <InsightCard title="Competitive Strengths" items={analysis.strengths} type="strength" />
          <InsightCard title="Strategic Recommendations" items={analysis.recommendations} type="recommendation" />
        </div>
      </div>
    </div>
  );
}
