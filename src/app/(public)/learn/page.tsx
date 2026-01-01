/**
 * Learning Center Index Page.
 *
 * Displays all educational articles in a grid layout with filtering
 * by category. Optimized for SEO with proper meta tags.
 *
 * URL: /learn
 *
 * @see /src/lib/content/mdx.ts for content loading
 * @see /content/learn/ for MDX article files
 */

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Clock, ArrowRight, Tag } from "lucide-react";
import { getAllArticles, getAllCategories, getAllReviewArticles } from "@/lib/content/mdx";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://knearme.com";

export const metadata: Metadata = {
  title: "Learning Center | Masonry Guides & Tips | KnearMe",
  description:
    "Expert guides on masonry repair, restoration, and maintenance. Learn about chimney repair, tuckpointing, brick restoration, and more from industry professionals.",
  keywords: [
    "masonry guide",
    "chimney repair tips",
    "tuckpointing guide",
    "brick restoration",
    "masonry maintenance",
    "home repair guides",
  ].join(", "),
  openGraph: {
    title: "Learning Center | KnearMe",
    description:
      "Expert guides on masonry repair, restoration, and maintenance.",
    type: "website",
    url: `${SITE_URL}/learn`,
  },
  alternates: {
    canonical: `${SITE_URL}/learn`,
  },
};

// Category display names and colors
const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  chimney: { label: "Chimney", color: "bg-orange-100 text-orange-800" },
  brick: { label: "Brick & Mortar", color: "bg-red-100 text-red-800" },
  stone: { label: "Stone", color: "bg-slate-100 text-slate-800" },
  foundation: { label: "Foundation", color: "bg-amber-100 text-amber-800" },
  restoration: { label: "Restoration", color: "bg-purple-100 text-purple-800" },
  maintenance: { label: "Maintenance", color: "bg-green-100 text-green-800" },
  costs: { label: "Cost Guides", color: "bg-blue-100 text-blue-800" },
  reviews: { label: "Contractor Reviews", color: "bg-indigo-100 text-indigo-800" },
};

export default async function LearnIndexPage() {
  // Get MDX articles
  const mdxArticles = getAllArticles();
  const mdxCategories = getAllCategories();

  // Get database review articles
  const reviewArticles = await getAllReviewArticles();

  // Merge and sort by publishedAt date (newest first)
  const allArticles = [...mdxArticles, ...reviewArticles].sort((a, b) => {
    const dateA = new Date(a.frontmatter.publishedAt || 0).getTime();
    const dateB = new Date(b.frontmatter.publishedAt || 0).getTime();
    return dateB - dateA;
  });

  // Combine categories (add "reviews" if we have review articles)
  const categories = reviewArticles.length > 0
    ? [...new Set([...mdxCategories, "reviews"])]
    : mdxCategories;

  // Breadcrumb items
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Learning Center", url: "/learn" },
  ];

  // Group articles by category for display
  const featuredArticles = allArticles.filter((a) => a.frontmatter.featured);
  const recentArticles = allArticles.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium text-primary">
                Learning Center
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Masonry Guides & Expert Tips
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Learn from industry professionals about masonry repair,
              restoration, and maintenance. Whether you&apos;re a homeowner or
              contractor, find the knowledge you need.
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Browse by Category
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const config = CATEGORY_CONFIG[category] || {
                  label: category,
                  color: "bg-muted text-foreground",
                };
                return (
                  <Link
                    key={category}
                    href={`/learn?category=${category}`}
                    className="transition-transform hover:scale-105"
                  >
                    <Badge className={`${config.color} cursor-pointer`}>
                      {config.label}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {allArticles.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We&apos;re working on expert guides to help you understand masonry
              repair and maintenance. Check back soon!
            </p>
          </div>
        )}

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Featured Guides</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArticles.map((article) => (
                <ArticleCard key={article.slug} article={article} featured />
              ))}
            </div>
          </section>
        )}

        {/* All Articles */}
        {recentArticles.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">All Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentArticles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

/**
 * Article Card Component.
 */
function ArticleCard({
  article,
  featured = false,
}: {
  article: {
    slug: string;
    frontmatter: {
      title: string;
      description: string;
      category: string;
      image?: string;
      publishedAt: string;
    };
    readingTime: { text: string; minutes: number };
  };
  featured?: boolean;
}) {
  const categoryConfig = CATEGORY_CONFIG[article.frontmatter.category] || {
    label: article.frontmatter.category,
    color: "bg-muted text-foreground",
  };

  const publishDate = new Date(article.frontmatter.publishedAt);
  const formattedDate = publishDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/learn/${article.slug}`} className="group">
      <Card
        className={`h-full transition-all hover:shadow-lg hover:border-primary/20 ${
          featured ? "border-primary/30" : ""
        }`}
      >
        {/* Image */}
        {article.frontmatter.image && (
          <div className="relative aspect-video overflow-hidden rounded-t-lg">
            <Image
              src={article.frontmatter.image}
              alt={article.frontmatter.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        <CardHeader className="pb-2">
          <Badge className={`w-fit ${categoryConfig.color}`}>
            {categoryConfig.label}
          </Badge>
        </CardHeader>

        <CardContent>
          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {article.frontmatter.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {article.frontmatter.description}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{article.readingTime.minutes} min read</span>
            </div>
            <span>{formattedDate}</span>
          </div>

          <div className="mt-4 flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
            Read Article
            <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
