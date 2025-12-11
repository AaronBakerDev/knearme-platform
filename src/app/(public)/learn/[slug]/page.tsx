/**
 * Article Detail Page - Educational content hub.
 *
 * URL Structure: /learn/{slug}
 * Example: /learn/signs-chimney-needs-repair
 *
 * Features:
 * - MDX content rendering with custom components
 * - JSON-LD Article structured data
 * - Table of contents (sticky sidebar)
 * - Related articles
 * - FAQ section with schema
 * - ISR with weekly revalidation
 *
 * @see /src/lib/content/mdx.ts for content loading
 * @see /content/learn/ for MDX article files
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, ArrowLeft, Tag, User } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import {
  getArticleBySlug,
  getAllArticleSlugs,
  getArticlesByCategory,
  type ArticleMeta,
} from "@/lib/content/mdx";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { TableOfContents } from "@/components/content/TableOfContents";
import { SocialShare } from "@/components/content/SocialShare";
import {
  generateFAQSchema,
  schemaToString,
} from "@/lib/seo/structured-data";
import { useMDXComponents } from "@/mdx-components";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://knearme.com";

// ISR: Revalidate weekly
export const revalidate = 604800;

type PageParams = {
  params: Promise<{ slug: string }>;
};

/**
 * Generate static params for all articles.
 */
export async function generateStaticParams() {
  const slugs = getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * Generate metadata for the article.
 */
export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return { title: "Article Not Found" };
  }

  const { frontmatter } = article;

  return {
    title: `${frontmatter.title} | KnearMe Learning Center`,
    description: frontmatter.description,
    keywords: frontmatter.tags?.join(", "),
    authors: [{ name: frontmatter.author }],
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      type: "article",
      url: `${SITE_URL}/learn/${slug}`,
      images: frontmatter.image
        ? [{ url: frontmatter.image, alt: frontmatter.title }]
        : [],
      publishedTime: frontmatter.publishedAt,
      modifiedTime: frontmatter.updatedAt || frontmatter.publishedAt,
      authors: [frontmatter.author],
      tags: frontmatter.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.title,
      description: frontmatter.description,
      images: frontmatter.image ? [frontmatter.image] : [],
    },
    alternates: {
      canonical: `${SITE_URL}/learn/${slug}`,
    },
  };
}

/**
 * Generate Article JSON-LD schema.
 */
function generateArticleSchema(
  article: NonNullable<ReturnType<typeof getArticleBySlug>>,
  slug: string
) {
  const { frontmatter, readingTime } = article;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${SITE_URL}/learn/${slug}`,
    headline: frontmatter.title,
    description: frontmatter.description,
    image: frontmatter.image,
    datePublished: frontmatter.publishedAt,
    dateModified: frontmatter.updatedAt || frontmatter.publishedAt,
    author: {
      "@type": "Person",
      name: frontmatter.author,
    },
    publisher: {
      "@type": "Organization",
      name: "KnearMe",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/learn/${slug}`,
    },
    wordCount: readingTime.words,
    keywords: frontmatter.tags?.join(", "),
    articleSection: frontmatter.category,
  };
}

/**
 * Article Detail Page Component.
 */
export default async function ArticlePage({ params }: PageParams) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const { frontmatter, content, readingTime } = article;

  // Get related articles by category
  const relatedArticles = getArticlesByCategory(frontmatter.category)
    .filter((a) => a.slug !== slug)
    .slice(0, 3);

  // Generate structured data
  const articleSchema = generateArticleSchema(article, slug);
  const faqSchema =
    frontmatter.faqs && frontmatter.faqs.length > 0
      ? generateFAQSchema(frontmatter.faqs)
      : null;

  // Breadcrumb items
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Learning Center", url: "/learn" },
    { name: frontmatter.title, url: `/learn/${slug}` },
  ];

  // Format dates
  const publishDate = new Date(frontmatter.publishedAt);
  const formattedDate = publishDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // MDX components
  const components = useMDXComponents({});

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToString(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaToString(faqSchema) }}
        />
      )}

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Back link */}
          <div className="max-w-4xl mx-auto lg:max-w-6xl">
            <Link
              href="/learn"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Learning Center
            </Link>
          </div>

          {/* Two-column layout: Content + TOC sidebar */}
          <div className="flex flex-col lg:flex-row lg:gap-12 max-w-6xl mx-auto">
            {/* Main content */}
            <div className="flex-1 max-w-4xl">
              {/* Article Header */}
              <article>
              <header className="mb-8">
                {/* Category Badge */}
                <Badge variant="secondary" className="mb-4">
                  {frontmatter.category}
                </Badge>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                  {frontmatter.title}
                </h1>

                {/* Description */}
                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                  {frontmatter.description}
                </p>

                {/* Meta info */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span>{frontmatter.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{readingTime.text}</span>
                  </div>
                </div>

                {/* Tags */}
                {frontmatter.tags && frontmatter.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {frontmatter.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/learn?tag=${tag}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Share Buttons */}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Share:</span>
                  <SocialShare
                    title={frontmatter.title}
                    description={frontmatter.description}
                  />
                </div>
              </header>

              {/* Featured Image */}
              {frontmatter.image && (
                <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
                  <Image
                    src={frontmatter.image}
                    alt={frontmatter.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                </div>
              )}

              {/* MDX Content */}
              <div className="prose prose-lg max-w-none">
                <MDXRemote
                  source={content}
                  components={components}
                  options={{
                    mdxOptions: {
                      remarkPlugins: [remarkGfm],
                      rehypePlugins: [
                        rehypeSlug,
                        [rehypeAutolinkHeadings, { behavior: "wrap" }],
                      ],
                    },
                  }}
                />
              </div>

              {/* FAQ Section */}
              {frontmatter.faqs && frontmatter.faqs.length > 0 && (
                <section className="mt-12 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-6">
                    Frequently Asked Questions
                  </h2>
                  <Accordion type="single" collapsible className="w-full">
                    {frontmatter.faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              )}

              {/* Related Services */}
              {frontmatter.relatedServices &&
                frontmatter.relatedServices.length > 0 && (
                  <section className="mt-8 p-6 bg-muted/50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">
                      Related Services
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {frontmatter.relatedServices.map((service) => (
                        <Link
                          key={service}
                          href={`/services/${service}`}
                          className="transition-transform hover:scale-105"
                        >
                          <Badge variant="outline" className="cursor-pointer">
                            {service.replace(/-/g, " ")}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
            </article>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <section className="mt-12 pt-8 border-t">
                <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {relatedArticles.map((related) => (
                    <RelatedArticleCard key={related.slug} article={related} />
                  ))}
                </div>
              </section>
            )}
            </div>

            {/* Sticky TOC Sidebar - Desktop only */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <TableOfContents className="border rounded-lg p-4 bg-muted/30" />
              </div>
            </aside>
          </div>

          {/* Mobile TOC - Shows at top of article on mobile */}
          <div className="lg:hidden max-w-4xl mx-auto mt-6">
            <TableOfContents />
          </div>
        </main>
      </div>
    </>
  );
}

/**
 * Related Article Card Component.
 */
function RelatedArticleCard({ article }: { article: ArticleMeta }) {
  return (
    <Link href={`/learn/${article.slug}`} className="group">
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {article.frontmatter.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {article.frontmatter.description}
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{article.readingTime.minutes} min read</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
