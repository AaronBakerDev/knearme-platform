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
import { ArrowLeft } from "lucide-react";
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
  type Article,
} from "@/lib/content/mdx";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { TableOfContents } from "@/components/content/TableOfContents";
import {
  ArticleHeader,
  FeaturedImage,
  FaqSection,
  HowToSection,
  KeyLinksSection,
  RelatedArticlesSection,
  RelatedServicesSection,
  type KeyLink,
} from "@/components/content/ArticleSections";
import {
  generateFAQSchema,
  generateArticleHowToSchema,
  schemaToString,
} from "@/lib/seo/structured-data";
import { getMDXComponents } from "@/mdx-components";

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
  const components = getMDXComponents({});

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
                <ArticleHeader
                  frontmatter={frontmatter}
                  formattedDate={formattedDate}
                  readingTimeText={readingTime.text}
                />

                <KeyLinksSection links={keyLinks} />

                <HowToSection frontmatter={frontmatter} />

                <FeaturedImage image={frontmatter.image} title={frontmatter.title} />

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

                <FaqSection faqs={frontmatter.faqs} />
                <RelatedServicesSection services={frontmatter.relatedServices} />
              </article>
              <RelatedArticlesSection articles={relatedArticles} />
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
