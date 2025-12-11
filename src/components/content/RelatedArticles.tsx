/**
 * RelatedArticles - Display related educational articles on service pages.
 *
 * Features:
 * - Show articles related to a specific service type
 * - Links between service pages and learning center
 * - Improves internal linking for SEO
 *
 * @see /src/lib/content/mdx.ts for article loading
 * @see /docs/11-seo-discovery/SEO-DISCOVERY-STRATEGY.md
 */

import Link from 'next/link';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAllArticles, type ArticleMeta } from '@/lib/content/mdx';

interface RelatedArticlesProps {
  /** Service slug to find related articles */
  serviceSlug: string;
  /** Maximum number of articles to show */
  limit?: number;
  /** Optional title override */
  title?: string;
  /** CSS class for container */
  className?: string;
}

/**
 * Get articles related to a specific service.
 * Matches by relatedServices array in frontmatter.
 */
function getArticlesForService(serviceSlug: string, limit: number = 3): ArticleMeta[] {
  const allArticles = getAllArticles();

  // Filter articles that have this service in relatedServices
  const related = allArticles.filter(
    (article) => article.frontmatter.relatedServices?.includes(serviceSlug)
  );

  // Sort by featured first, then by date
  related.sort((a, b) => {
    // Featured articles first
    if (a.frontmatter.featured && !b.frontmatter.featured) return -1;
    if (!a.frontmatter.featured && b.frontmatter.featured) return 1;
    // Then by date (newest first)
    return new Date(b.frontmatter.publishedAt).getTime() -
           new Date(a.frontmatter.publishedAt).getTime();
  });

  return related.slice(0, limit);
}

/**
 * RelatedArticles component for service pages.
 * Server Component - can be used directly in Next.js pages.
 */
export function RelatedArticles({
  serviceSlug,
  limit = 3,
  title = 'Learn More',
  className,
}: RelatedArticlesProps) {
  const articles = getArticlesForService(serviceSlug, limit);

  if (articles.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {title}
        </h2>
        <Link
          href="/learn"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View All Articles
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}

/**
 * Individual article card component.
 */
function ArticleCard({ article }: { article: ArticleMeta }) {
  return (
    <Link href={`/learn/${article.slug}`} className="group">
      <Card className="h-full hover:shadow-md transition-all hover:border-primary/20">
        <CardContent className="pt-6">
          <Badge variant="secondary" className="mb-3 text-xs">
            {article.frontmatter.category}
          </Badge>
          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {article.frontmatter.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {article.frontmatter.description}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{article.readingTime.minutes} min read</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default RelatedArticles;
