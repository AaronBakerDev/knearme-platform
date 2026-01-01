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
import {
  Calendar,
  Clock,
  ArrowLeft,
  Tag,
  User,
  ListOrdered,
  Link2,
  ArrowUpRight,
} from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import {
  getArticleBySlug,
  getAllArticleSlugs,
  getArticlesByCategory,
  getReviewArticleBySlug,
  getAllReviewArticleSlugs,
  type ArticleMeta,
  type Article,
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
  generateArticleHowToSchema,
  schemaToString,
} from "@/lib/seo/structured-data";
import { useMDXComponents } from "@/mdx-components";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://knearme.com";
const CATEGORY_LABELS: Record<string, string> = {
  chimney: "Chimney",
  brick: "Brick & Mortar",
  stone: "Stone",
  foundation: "Foundation",
  restoration: "Restoration",
  maintenance: "Maintenance",
  costs: "Cost Guides",
  reviews: "Reviews",
};

const DEFAULT_EXTERNAL_SOURCE = {
  href: "https://developers.google.com/search/docs/crawling-indexing/links-crawlable",
  label: "Google guidance: make links crawlable",
};

// ISR: Revalidate weekly
export const revalidate = 604800;

type PageParams = {
  params: Promise<{ slug: string }>;
};

/**
 * Generate static params for all articles (MDX + database review articles).
 */
export async function generateStaticParams() {
  // Get MDX article slugs
  const mdxSlugs = getAllArticleSlugs();

  // Get review article slugs from database
  const reviewSlugs = await getAllReviewArticleSlugs();

  // Combine and deduplicate (MDX takes priority if slug collision)
  const allSlugs = [...new Set([...mdxSlugs, ...reviewSlugs])];

  return allSlugs.map((slug) => ({ slug }));
}

/**
 * Helper to get article from MDX or database.
 * Checks MDX first (local files take priority), then falls back to database.
 */
async function getArticle(slug: string): Promise<Article | null> {
  // Check MDX first (local files take priority)
  const mdxArticle = getArticleBySlug(slug);
  if (mdxArticle) {
    return mdxArticle;
  }

  // Fall back to database review articles
  return await getReviewArticleBySlug(slug);
}

/**
 * Generate metadata for the article.
 */
export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

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
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const { frontmatter, content, readingTime } = article;

  // Get related articles by category
  const relatedArticles = getArticlesByCategory(frontmatter.category)
    .filter((a) => a.slug !== slug)
    .slice(0, 3);

  // Build key links for quick navigation and internal linking
  type KeyLink = { href: string; label: string; external?: boolean };
  const keyLinks: KeyLink[] = [];
  const seen = new Set<string>();

  const addLink = (href: string, label: string, external = false) => {
    if (!href || seen.has(href)) return;
    seen.add(href);
    keyLinks.push({ href, label, external });
  };

  const formatServiceName = (service: string) =>
    service
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  if (frontmatter.pillarSlug) {
    addLink(
      `/services/${frontmatter.pillarSlug}`,
      `Pillar guide: ${formatServiceName(frontmatter.pillarSlug)}`
    );
  }

  if (frontmatter.relatedServices && frontmatter.relatedServices.length > 0) {
    const service = frontmatter.relatedServices[0];
    if (service) {
      addLink(`/services/${service}`, `Related service: ${formatServiceName(service)}`);
    }
  }

  if (frontmatter.category) {
    const categoryLabel = CATEGORY_LABELS[frontmatter.category] || frontmatter.category;
    addLink(`/learn?category=${frontmatter.category}`, `More ${categoryLabel} guides`);
  }

  relatedArticles.slice(0, 2).forEach((related) =>
    addLink(`/learn/${related.slug}`, `Related guide: ${related.frontmatter.title}`)
  );

  const authoritativeSources =
    frontmatter.authoritativeSources ||
    (frontmatter.authoritativeSource ? [frontmatter.authoritativeSource] : []);

  const authoritativeLink = authoritativeSources[0] || DEFAULT_EXTERNAL_SOURCE;
  addLink(authoritativeLink.href, authoritativeLink.label, true);

  // Generate structured data
  const articleSchema = generateArticleSchema(article, slug);
  const faqSchema =
    frontmatter.faqs && frontmatter.faqs.length > 0
      ? generateFAQSchema(frontmatter.faqs)
      : null;
  const howToSchema = generateArticleHowToSchema({ slug, frontmatter });

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
  // eslint-disable-next-line react-hooks/rules-of-hooks
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
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaToString(howToSchema) }}
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
          <div className="flex flex-col lg:flex-row lg:gap-14 max-w-6xl mx-auto">
            {/* Main content */}
            <div className="flex-1 w-full max-w-[60ch] md:max-w-[68ch] lg:max-w-[74ch]">
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
                <p className="text-lg md:text-xl leading-relaxed text-muted-foreground mb-6">
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

              {/* Key links for fast navigation and topical authority */}
              {keyLinks.length > 0 && (
                <section className="mb-8" aria-labelledby="key-links-heading">
                  <div className="rounded-xl border bg-muted/40 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Link2 className="h-4 w-4 text-primary" />
                      <h2
                        id="key-links-heading"
                        className="text-sm font-semibold tracking-tight text-foreground"
                      >
                        Key links
                      </h2>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {keyLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="group flex items-start justify-between gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-muted-foreground/30 hover:bg-muted/20"
                          target={link.external ? "_blank" : undefined}
                          rel={link.external ? "noopener noreferrer" : undefined}
                        >
                          <span className="text-sm text-primary font-semibold group-hover:text-primary/80">
                            {link.label}
                          </span>
                          {link.external && (
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* How-To Steps (if provided) */}
              {frontmatter.howToSteps && frontmatter.howToSteps.length > 0 && (
                <section className="mb-10" aria-labelledby="howto-steps-heading">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ListOrdered className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2
                        id="howto-steps-heading"
                        className="text-2xl font-semibold tracking-tight"
                      >
                        {frontmatter.howToTitle || "Step-by-Step Process"}
                      </h2>
                      {frontmatter.howToDescription && (
                        <p className="text-sm text-muted-foreground">
                          {frontmatter.howToDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {frontmatter.howToSteps.map((step, idx) => (
                      <Card key={`${step.title}-${idx}`} className="border border-muted">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <h3 className="font-semibold">{step.title}</h3>
                            </div>
                            {step.duration && (
                              <Badge variant="outline" className="text-xs">
                                {step.duration}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

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
              <div className="prose prose-lg max-w-[60ch] md:max-w-[68ch] lg:max-w-[72ch] leading-relaxed prose-headings:tracking-tight prose-headings:leading-tight prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:leading-relaxed">
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
