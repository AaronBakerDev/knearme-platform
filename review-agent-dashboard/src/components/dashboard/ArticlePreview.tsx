import type { DBArticle } from '@/lib/types';
import {
  FileText,
  ExternalLink,
  Clock,
  Search,
  Code,
  CheckCircle2,
  AlertCircle,
  Monitor,
  DollarSign
} from 'lucide-react';

const articlePreviewDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const numberFormatter = new Intl.NumberFormat('en-US');

interface ArticlePreviewProps {
  article: DBArticle;
}

/**
 * Status badge component for article status.
 * Enhanced with premium variants.
 */
function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  const isPublished = status === 'published';

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border transition-all ${isPublished
        ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30 shadow-glow-sm'
        : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
      }`}>
      {isPublished ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {status}
    </div>
  );
}

/**
 * Simple markdown renderer with premium typography.
 */
function MarkdownContent({ content }: { content: string }) {
  const previewContent = content.length > 2000 ? content.slice(0, 2000) + '...' : content;
  const lines = previewContent.split('\n');

  return (
    <div className="prose prose-sm prose-invert max-w-none space-y-4">
      {lines.map((line, idx) => {
        if (line.startsWith('# ')) {
          return <h1 key={idx} className="text-2xl font-black text-foreground mt-8 mb-4">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={idx} className="text-xl font-bold text-foreground mt-6 mb-2">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={idx} className="text-lg font-bold text-foreground mt-4 mb-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={idx} className="flex gap-3 items-start ml-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">{line.slice(2)}</p>
            </div>
          );
        }
        if (line.trim() === '') return <div key={idx} className="h-2" />;
        return <p key={idx} className="text-sm text-muted-foreground leading-relaxed text-pretty">{line}</p>;
      })}
    </div>
  );
}

/**
 * ArticlePreview component displays the generated article content.
 * Enhanced with premium glass aesthetics and structured layout.
 */
export function ArticlePreview({ article }: ArticlePreviewProps) {
  const formattedDate = articlePreviewDateFormatter.format(new Date(article.generated_at));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
        <div className="relative rounded-2xl glass border border-border p-8 shadow-depth">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <StatusBadge status={article.status} />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">AI Engineered Content</span>
              </div>
              <h3 className="text-2xl font-black text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors">
                {article.title}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>/{article.slug}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-xl border border-border/50">
                {article.model_used && (
                  <div className="flex flex-col items-center px-4 border-r border-border/50">
                    <Monitor className="w-4 h-4 text-primary mb-1" />
                    <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">{article.model_used}</span>
                  </div>
                )}
                <div className="flex flex-col items-center px-4 border-r border-border/50">
                  <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest mb-1">Tokens</span>
                  <span className="text-sm font-bold text-foreground">{numberFormatter.format(article.tokens_used || 0)}</span>
                </div>
                {article.cost_estimate && (
                  <div className="flex flex-col items-center px-4 border-r border-border/50">
                    <DollarSign className="w-4 h-4 text-emerald-500 mb-1" />
                    <span className="text-[10px] font-bold text-muted-foreground">${article.cost_estimate.toFixed(4)}</span>
                  </div>
                )}
                <div className="flex flex-col items-center px-2">
                  <Clock className="w-4 h-4 text-primary mb-1" />
                  <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">{formattedDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SEO Metadata */}
        <div className="rounded-2xl glass-alt border border-border p-6 shadow-depth">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Search className="w-4 h-4 text-primary" />
            </div>
            <h4 className="font-bold text-foreground">Search Engine Optimization</h4>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase text-primary tracking-widest">Meta Title</label>
              <p className="text-sm font-medium text-foreground mt-1 leading-relaxed">{article.metadata_json.seo.title}</p>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-primary tracking-widest">Meta Description</label>
              <p className="text-xs font-medium text-muted-foreground mt-1 leading-relaxed">{article.metadata_json.seo.description}</p>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-primary tracking-widest">Target Keywords</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {article.metadata_json.seo.keywords.map((kw, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-secondary/80 text-[10px] font-bold text-foreground border border-border/50">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Structured Data */}
        <div className="rounded-2xl glass-alt border border-border p-6 shadow-depth">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Code className="w-4 h-4 text-blue-400" />
            </div>
            <h4 className="font-bold text-foreground">Structured Schema (JSON-LD)</h4>
          </div>

          <div className="bg-background/50 rounded-xl p-4 font-mono text-[10px] max-h-[180px] overflow-y-auto custom-scrollbar border border-border/50">
            <pre className="text-muted-foreground/80 leading-normal">
              {JSON.stringify(article.metadata_json.structured_data, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Content Canvas */}
      <div className="rounded-3xl glass border border-border overflow-hidden shadow-elevated">
        <div className="bg-secondary/30 border-b border-border/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xs font-black uppercase tracking-widest">Article Canvas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500/30" />
            <div className="h-2 w-2 rounded-full bg-yellow-500/30" />
            <div className="h-2 w-2 rounded-full bg-green-500/30" />
          </div>
        </div>
        <div className="p-10 max-h-[800px] overflow-y-auto custom-scrollbar">
          <MarkdownContent content={article.content_markdown} />
        </div>
      </div>
    </div>
  );
}
