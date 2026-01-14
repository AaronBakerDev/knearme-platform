import Link from 'next/link'
import type { ReactNode } from 'react'
import type { ArticleMetadata } from '@/lib/types'
import { getArticleById } from '@/lib/supabase/queries'
import { Button } from '@/components/ui/button'
import { updateArticleStatus } from '../actions'
import {
  ArrowLeft,
  Check,
  Pencil,
  Building2,
  MapPin,
  Star,
  RefreshCw,
  Save,
  Ban,
  CheckCircle,
  Calendar,
  FileText,
  Monitor,
  Hash,
  DollarSign,
  Code2,
  Search,
  Tag,
} from 'lucide-react'

/**
 * Extended article data with contractor info for the detail page.
 */
interface ArticleDetail {
  id: string
  title: string
  slug: string
  content_markdown: string
  model_used?: string
  tokens_used?: number
  cost_estimate?: number
  status: 'draft' | 'published'
  generated_at: string
  contractor: {
    id: string
    business_name: string
    city: string
    state: string | null
    rating: number | null
    review_count: number | null
  }
  metadata: ArticleMetadata
}

/**
 * Fetches article from Supabase by ID.
 *
 * @param id - Article UUID
 * @returns ArticleDetail or null if not found
 */
async function getArticle(id: string): Promise<ArticleDetail | null> {
  const article = await getArticleById(id)

  if (!article) {
    return null
  }

  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    content_markdown: article.content_markdown,
    model_used: article.model_used,
    tokens_used: article.tokens_used,
    cost_estimate: article.cost_estimate,
    status: article.status,
    generated_at: article.generated_at,
    contractor: {
      id: article.contractor?.id || '',
      business_name: article.contractor?.business_name || 'Unknown',
      city: article.contractor?.city || '',
      state: article.contractor?.state || null,
      rating: article.contractor?.rating || null,
      review_count: article.contractor?.review_count || null,
    },
    metadata: article.metadata_json,
  }
}

/**
 * Status badge component - Mission Control styling.
 */
function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  const isPublished = status === 'published'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border ${
        isPublished
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      }`}
    >
      {isPublished ? (
        <Check className="h-4 w-4" />
      ) : (
        <Pencil className="h-4 w-4" />
      )}
      {isPublished ? 'Published' : 'Draft'}
    </span>
  )
}

/**
 * Simple markdown renderer for article content.
 * Converts basic markdown to styled elements - Mission Control theme.
 */
function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split('\n')
  const blocks: ReactNode[] = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]

    // Headers
    if (line.startsWith('# ')) {
      blocks.push(
        <h1
          key={i}
          className="text-2xl font-bold text-zinc-100 mt-6 mb-4 first:mt-0"
        >
          {line.replace('# ', '')}
        </h1>
      )
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push(
        <h2
          key={i}
          className="text-xl font-semibold text-zinc-200 mt-6 mb-3"
        >
          {line.replace('## ', '')}
        </h2>
      )
      continue
    }
    if (line.startsWith('### ')) {
      blocks.push(
        <h3
          key={i}
          className="text-lg font-semibold text-zinc-200 mt-4 mb-2"
        >
          {line.replace('### ', '')}
        </h3>
      )
      continue
    }

    // Lists
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const listStart = i
      const items: ReactNode[] = []

      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        const itemText = lines[i].slice(2).replace(/\*\*(.*?)\*\*/g, '$1')
        items.push(
          <li key={`item-${i}`} className="text-zinc-300">
            {itemText}
          </li>
        )
        i += 1
      }

      blocks.push(
        <ul key={`list-${listStart}`} className="ml-4 list-disc space-y-1">
          {items}
        </ul>
      )
      i -= 1
      continue
    }

    // Italics (for notes)
    if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
      blocks.push(
        <p key={i} className="text-sm text-zinc-500 italic mt-4">
          {line.replace(/^\*/, '').replace(/\*$/, '')}
        </p>
      )
      continue
    }

    // Empty lines
    if (line.trim() === '') {
      blocks.push(<div key={i} className="h-2" />)
      continue
    }

    // Regular paragraphs (with bold text support)
    blocks.push(
      <p key={i} className="text-zinc-300 leading-relaxed mb-3">
        {line.split(/(\*\*.*?\*\*)/).map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={index} className="font-semibold text-zinc-100">
                {part.replace(/\*\*/g, '')}
              </strong>
            )
          }
          return part
        })}
      </p>
    )
  }

  return (
    <div className="prose prose-invert prose-zinc max-w-none">
      {blocks}
    </div>
  )
}

/**
 * SEO metadata display section - Mission Control styling.
 */
function SEOMetadataSection({ metadata }: { metadata: ArticleMetadata }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
          <Search className="w-3 h-3" />
          SEO Title
        </label>
        <p className="text-sm text-zinc-200 bg-zinc-800/50 rounded-lg px-4 py-3 border border-zinc-700/50 font-mono">
          {metadata.seo.title}
        </p>
      </div>
      <div>
        <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
          <FileText className="w-3 h-3" />
          Meta Description
        </label>
        <p className="text-sm text-zinc-300 bg-zinc-800/50 rounded-lg px-4 py-3 border border-zinc-700/50">
          {metadata.seo.description}
        </p>
      </div>
      <div>
        <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
          <Tag className="w-3 h-3" />
          Keywords
        </label>
        <div className="flex flex-wrap gap-2">
          {metadata.seo.keywords.map((keyword, index) => (
            <span
              key={index}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-mono border border-cyan-500/20"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Structured data preview section - Mission Control terminal styling.
 */
function StructuredDataSection({ metadata }: { metadata: ArticleMetadata }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': metadata.structured_data.type,
    name: metadata.structured_data.name,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: metadata.structured_data.aggregateRating.ratingValue,
      reviewCount: metadata.structured_data.aggregateRating.reviewCount,
    },
  }

  return (
    <div>
      <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
        <Code2 className="w-3 h-3" />
        JSON-LD Structured Data
      </label>
      <div className="relative rounded-lg bg-[#0d1117] border border-zinc-700/50 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border-b border-zinc-700/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-xs text-zinc-500 font-mono ml-2">schema.json</span>
        </div>
        <pre className="p-4 text-xs text-zinc-300 overflow-x-auto font-mono leading-relaxed">
          {JSON.stringify(structuredData, null, 2)}
        </pre>
      </div>
    </div>
  )
}

/**
 * Article detail/edit page (Server Component).
 * Displays the full article with editing capabilities.
 * Mission Control dark theme styling.
 *
 * @see /Users/aaronbaker/knearme-workspace/review-agent-dashboard/src/lib/types.ts
 */
export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const article = await getArticle(id)

  if (!article) {
    return (
      <div className="space-y-6">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-sm font-mono text-zinc-500 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Articles
        </Link>
        <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/50 p-12 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
            <FileText className="h-8 w-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-1">
            Article not found
          </h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            The article you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
        </div>
      </div>
    )
  }

  // Format dates
  const formattedDate = new Date(article.generated_at).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  )

  // Calculate word count
  const wordCount = article.content_markdown.split(/\s+/).filter(Boolean).length
  const nextStatus = article.status === 'published' ? 'draft' : 'published'
  const toggleStatus = async () => {
    'use server'
    await updateArticleStatus(article.id, nextStatus)
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/articles"
        className="inline-flex items-center gap-2 text-sm font-mono text-zinc-500 hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Articles
      </Link>

      {/* Article Header */}
      <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/50 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {/* Title and Contractor Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <StatusBadge status={article.status} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 mb-4">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <Link
                href={`/contractors/${article.contractor.id}`}
                className="flex items-center gap-2 text-zinc-400 hover:text-cyan-400 transition-colors"
              >
                <Building2 className="h-4 w-4 text-zinc-600" />
                {article.contractor.business_name}
              </Link>
              {(article.contractor.city || article.contractor.state) && (
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <MapPin className="h-4 w-4 text-zinc-600" />
                  {article.contractor.city}
                  {article.contractor.state
                    ? `, ${article.contractor.state}`
                    : ''}
                </span>
              )}
              {article.contractor.rating !== null && (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span className="font-mono">{article.contractor.rating}</span>
                  {article.contractor.review_count !== null && (
                    <span className="text-zinc-500">
                      ({article.contractor.review_count} reviews)
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50"
              disabled
              title="Feature coming soon"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50"
              disabled
              title="Feature coming soon"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
            <form action={toggleStatus}>
              <Button
                size="sm"
                className={`gap-2 ${
                  article.status === 'published'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                }`}
              >
                {article.status === 'published' ? (
                  <>
                    <Ban className="h-4 w-4" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Publish
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Generation Metadata */}
        <div className="mt-6 pt-6 border-t border-zinc-800/50 flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-mono">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-zinc-600" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-zinc-600" />
            {wordCount.toLocaleString()} words
          </span>
          <span className="flex items-center gap-1.5">
            <Monitor className="h-3.5 w-3.5 text-zinc-600" />
            {article.model_used}
          </span>
          <span className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-zinc-600" />
            {article.tokens_used?.toLocaleString()} tokens
          </span>
          {article.cost_estimate && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <DollarSign className="h-3.5 w-3.5" />
              ${article.cost_estimate.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500">
                  Article Content
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 transition-colors">
                  Preview
                </button>
                <button
                  className="px-3 py-1.5 text-xs font-mono text-zinc-500 border border-zinc-700/50 rounded-lg opacity-50 cursor-not-allowed"
                  disabled
                  title="Feature coming soon"
                >
                  Edit Markdown
                </button>
              </div>
            </div>
            <div className="border border-zinc-800/50 rounded-lg p-6 bg-zinc-950/30">
              <MarkdownPreview content={article.content_markdown} />
            </div>
          </div>
        </div>

        {/* Sidebar - SEO & Structured Data */}
        <div className="space-y-6">
          {/* SEO Metadata */}
          <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/50 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500">
                SEO Metadata
              </h2>
            </div>
            {article.metadata ? (
              <SEOMetadataSection metadata={article.metadata} />
            ) : (
              <p className="text-sm text-zinc-500">
                No SEO metadata available
              </p>
            )}
          </div>

          {/* Structured Data */}
          <div className="rounded-lg bg-zinc-900/30 border border-zinc-800/50 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-500">
                Structured Data
              </h2>
            </div>
            {article.metadata ? (
              <StructuredDataSection metadata={article.metadata} />
            ) : (
              <p className="text-sm text-zinc-500">
                No structured data available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
