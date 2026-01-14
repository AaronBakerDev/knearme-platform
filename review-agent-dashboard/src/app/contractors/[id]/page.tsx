import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ContractorDetail } from '@/lib/types';
import { ContractorTabs } from '@/components/dashboard/ContractorTabs';
import { getContractorDetail as getContractorDetailQuery } from '@/lib/supabase/queries';
import { formatPhoneNumber, cn } from '@/lib/utils';
import {
  Phone,
  Globe,
  MapPin,
  Building2,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  Star,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  ExternalLink,
  Search,
} from 'lucide-react';

/**
 * Fetches contractor detail from Supabase.
 *
 * @param id - The contractor ID from the URL params
 * @returns ContractorDetail with reviews, analysis, and article, or null if not found
 */
async function getContractorDetailData(id: string): Promise<ContractorDetail | null> {
  return getContractorDetailQuery(id);
}

/**
 * Star rating display component - Mission Control styling.
 */
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-5 h-5",
            star <= fullStars
              ? "text-amber-400 fill-amber-400"
              : "text-zinc-700"
          )}
        />
      ))}
      <span className="ml-2 text-xl font-bold font-mono text-zinc-100 tabular-nums">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

/**
 * Pipeline status badge component - Mission Control styling.
 */
function PipelineBadge({ hasAnalysis, hasArticle }: { hasAnalysis: boolean; hasArticle: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border",
          hasAnalysis
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-zinc-800/50 text-zinc-500 border-zinc-700/50"
        )}
      >
        {hasAnalysis ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : (
          <Clock className="w-3.5 h-3.5" />
        )}
        {hasAnalysis ? 'Analyzed' : 'Pending Analysis'}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border",
          hasArticle
            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
            : "bg-zinc-800/50 text-zinc-500 border-zinc-700/50"
        )}
      >
        {hasArticle ? (
          <FileText className="w-3.5 h-3.5" />
        ) : (
          <Clock className="w-3.5 h-3.5" />
        )}
        {hasArticle ? 'Article Ready' : 'No Article'}
      </span>
    </div>
  );
}

/**
 * Contractor detail page (Server Component).
 * Displays full contractor information with reviews, analysis, and article tabs.
 * Mission Control dark theme styling.
 *
 * @param params - Route params containing contractor ID
 */
export default async function ContractorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contractor = await getContractorDetailData(id);

  // Handle contractor not found
  if (!contractor) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm font-mono">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-zinc-500 hover:text-cyan-400 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        <ChevronRight className="w-4 h-4 text-zinc-700" />
        <Link
          href="/contractors"
          className="text-zinc-500 hover:text-cyan-400 transition-colors"
        >
          Contractors
        </Link>
        <ChevronRight className="w-4 h-4 text-zinc-700" />
        <span className="text-zinc-200 truncate max-w-[200px]">
          {contractor.business_name}
        </span>
      </nav>

      {/* Header Section */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            {/* Left: Business Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-6">
                {/* Business Icon */}
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex-shrink-0">
                  <Building2 className="w-10 h-10 text-cyan-400" />
                </div>

                {/* Business Details */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-zinc-100 truncate">
                      {contractor.business_name}
                    </h1>
                    {contractor.is_claimed && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        Claimed
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  {contractor.rating && (
                    <div className="flex items-center gap-3">
                      <StarRating rating={contractor.rating} />
                      <span className="text-sm text-zinc-500 font-mono">
                        ({contractor.review_count || 0} reviews)
                      </span>
                    </div>
                  )}

                  {/* Location & Category */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-zinc-600" />
                      {contractor.city}
                      {contractor.state ? `, ${contractor.state}` : ''}
                    </span>

                    {contractor.category?.length > 0 && (
                      <>
                        <span className="text-zinc-700">•</span>
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-zinc-600" />
                          {contractor.category.join(', ')}
                        </span>
                      </>
                    )}

                    {contractor.search_terms?.length > 0 && (
                      <>
                        <span className="text-zinc-700">•</span>
                        <span className="flex items-center gap-1.5">
                          <Search className="w-4 h-4 text-zinc-600" />
                          {contractor.search_terms.join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Pipeline Status */}
            <div className="flex flex-col items-start lg:items-end gap-3 min-w-[200px]">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  Pipeline Status
                </span>
              </div>
              <PipelineBadge
                hasAnalysis={contractor.analysis !== null}
                hasArticle={contractor.article !== null}
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-8 pt-8 border-t border-zinc-800/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contractor.phone && (
                <a
                  href={`tel:${contractor.phone}`}
                  className="group flex items-center gap-4 p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-cyan-500/30 transition-all"
                >
                  <div className="h-12 w-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                      Phone
                    </span>
                    <span className="text-sm font-mono text-zinc-200 group-hover:text-cyan-400 transition-colors">
                      {formatPhoneNumber(contractor.phone)}
                    </span>
                  </div>
                </a>
              )}

              {contractor.website && (
                <a
                  href={contractor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:border-emerald-500/30 transition-all"
                >
                  <div className="h-12 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Globe className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                      Website
                    </span>
                    <span className="text-sm font-mono text-zinc-200 group-hover:text-emerald-400 transition-colors truncate">
                      {contractor.website.replace(/^https?:\/\//, '')}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                </a>
              )}

              {contractor.address && (
                <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
                  <div className="h-12 w-12 rounded-lg bg-zinc-700/30 border border-zinc-600/30 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                      Address
                    </span>
                    <span className="text-sm text-zinc-300 truncate">
                      {contractor.address}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <ContractorTabs
        reviews={contractor.reviews}
        analysis={contractor.analysis}
        article={contractor.article}
      />
    </div>
  );
}
