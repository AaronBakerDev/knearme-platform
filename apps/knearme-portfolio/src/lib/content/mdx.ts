/**
 * MDX Content Loading Utilities.
 *
 * Server-side utilities for loading and parsing MDX files from the
 * content/learn directory. Used by /learn pages for static generation.
 *
 * Also includes functions for loading review articles from the database
 * (review_articles table in Supabase).
 *
 * @see /content/learn/ for MDX article files
 * @see /src/app/(public)/learn/ for learn routes
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";
import type { Database } from "@/types/database";

/**
 * Article frontmatter schema.
 *
 * @see /content/README.md for frontmatter documentation
 */
export interface ArticleFrontmatter {
  title: string;
  description: string;
  category: string;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  readingTime?: number;
  featured?: boolean;
  image?: string;
  tags?: string[];
  relatedServices?: string[];
  pillarSlug?: string;
  authoritativeSource?: {
    label: string;
    href: string;
  };
  authoritativeSources?: Array<{
    label: string;
    href: string;
  }>;
  faqs?: Array<{ question: string; answer: string }>;
  howToTitle?: string;
  howToDescription?: string;
  howToSteps?: Array<{
    title: string;
    description: string;
    duration?: string;
  }>;
}

/**
 * Full article with content and metadata.
 */
export interface Article {
  slug: string;
  frontmatter: ArticleFrontmatter;
  content: string;
  readingTime: {
    text: string;
    minutes: number;
    time: number;
    words: number;
  };
}

/**
 * Article metadata for list views (without full content).
 */
export interface ArticleMeta {
  slug: string;
  frontmatter: ArticleFrontmatter;
  readingTime: {
    text: string;
    minutes: number;
  };
}

// Content directory path
const CONTENT_DIR = path.join(process.cwd(), "content", "learn");

/**
 * Check if content directory exists.
 */
function contentDirExists(): boolean {
  try {
    return fs.existsSync(CONTENT_DIR);
  } catch {
    return false;
  }
}

/**
 * Get all MDX files from the content directory.
 */
function getMDXFiles(): string[] {
  if (!contentDirExists()) {
    return [];
  }

  try {
    const files = fs.readdirSync(CONTENT_DIR);
    return files.filter((file) => file.endsWith(".mdx"));
  } catch {
    return [];
  }
}

/**
 * Get article by slug.
 *
 * @param slug - Article slug (filename without .mdx extension)
 * @returns Article with frontmatter and content, or null if not found
 */
export function getArticleBySlug(slug: string): Article | null {
  try {
    const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    // Calculate reading time
    const stats = readingTime(content);

    return {
      slug,
      frontmatter: data as ArticleFrontmatter,
      content,
      readingTime: stats,
    };
  } catch (error) {
    logger.error(`[getArticleBySlug] Error loading article ${slug}`, { error });
    return null;
  }
}

/**
 * Get all articles with metadata.
 *
 * Returns articles sorted by publishedAt date (newest first).
 * Does not include full content - use getArticleBySlug for that.
 */
export function getAllArticles(): ArticleMeta[] {
  const files = getMDXFiles();

  const articles = files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      const filePath = path.join(CONTENT_DIR, filename);

      try {
        const fileContents = fs.readFileSync(filePath, "utf8");
        const { data, content } = matter(fileContents);
        const stats = readingTime(content);

        return {
          slug,
          frontmatter: data as ArticleFrontmatter,
          readingTime: {
            text: stats.text,
            minutes: Math.ceil(stats.minutes),
          },
        };
      } catch (error) {
        logger.error(`[getAllArticles] Error parsing ${filename}`, { error });
        return null;
      }
    })
    .filter((article): article is ArticleMeta => article !== null);

  // Sort by publishedAt date (newest first)
  return articles.sort((a, b) => {
    const dateA = new Date(a.frontmatter.publishedAt || 0).getTime();
    const dateB = new Date(b.frontmatter.publishedAt || 0).getTime();
    return dateB - dateA;
  });
}

/**
 * Get articles by category.
 *
 * @param category - Category to filter by
 * @returns Articles matching the category, sorted by date
 */
export function getArticlesByCategory(category: string): ArticleMeta[] {
  return getAllArticles().filter(
    (article) =>
      article.frontmatter.category?.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get featured articles.
 *
 * @param limit - Maximum number of articles to return
 * @returns Featured articles, sorted by date
 */
export function getFeaturedArticles(limit = 3): ArticleMeta[] {
  return getAllArticles()
    .filter((article) => article.frontmatter.featured)
    .slice(0, limit);
}

/**
 * Get articles by tag.
 *
 * @param tag - Tag to filter by
 * @returns Articles with the specified tag
 */
export function getArticlesByTag(tag: string): ArticleMeta[] {
  return getAllArticles().filter((article) =>
    article.frontmatter.tags?.some(
      (t) => t.toLowerCase() === tag.toLowerCase()
    )
  );
}

/**
 * Get articles related to a service type.
 *
 * @param serviceSlug - Service type slug (e.g., "chimney-repair")
 * @returns Articles that reference this service
 */
export function getArticlesByService(serviceSlug: string): ArticleMeta[] {
  return getAllArticles().filter((article) =>
    article.frontmatter.relatedServices?.includes(serviceSlug)
  );
}

/**
 * Get all article slugs for static generation.
 *
 * @returns Array of slugs for generateStaticParams
 */
export function getAllArticleSlugs(): string[] {
  return getMDXFiles().map((filename) => filename.replace(/\.mdx$/, ""));
}

/**
 * Get all unique categories from articles.
 */
export function getAllCategories(): string[] {
  const articles = getAllArticles();
  const categories = new Set<string>();

  articles.forEach((article) => {
    if (article.frontmatter.category) {
      categories.add(article.frontmatter.category);
    }
  });

  return Array.from(categories).sort();
}

/**
 * Get all unique tags from articles.
 */
export function getAllTags(): string[] {
  const articles = getAllArticles();
  const tags = new Set<string>();

  articles.forEach((article) => {
    article.frontmatter.tags?.forEach((tag) => tags.add(tag));
  });

  return Array.from(tags).sort();
}

// =============================================================================
// Review Articles (Database)
// =============================================================================

/**
 * Database row type for review_articles table.
 *
 * @see Supabase table: review_articles
 */
interface ReviewArticleRow {
  id: string;
  contractor_id: string;
  title: string;
  slug: string;
  content_markdown: string;
  metadata_json: {
    seo?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
    generated_with?: {
      model?: string;
      timestamp?: string;
      review_count?: number;
    };
    structured_data?: {
      name?: string;
      type?: string;
      aggregateRating?: {
        ratingValue?: number;
        reviewCount?: number;
      };
    };
  } | null;
  status: string;
  generated_at: string;
}

type ReviewArticleInsert = ReviewArticleRow;
type ReviewArticleUpdate = Partial<ReviewArticleRow>;

type ReviewDatabase = Database & {
  public: Database["public"] & {
    Tables: Database["public"]["Tables"] & {
      review_articles: {
        Row: ReviewArticleRow;
        Insert: ReviewArticleInsert;
        Update: ReviewArticleUpdate;
        Relationships: [];
      };
    };
  };
};

type ReviewSupabaseClient = SupabaseClient<ReviewDatabase>;

/**
 * Transform a database review article row to the Article format.
 *
 * Maps database fields to the ArticleFrontmatter interface for
 * consistent rendering with MDX articles.
 */
function transformReviewArticleToArticle(row: ReviewArticleRow): Article {
  const stats = readingTime(row.content_markdown);
  const metadata = row.metadata_json || {};

  return {
    slug: row.slug,
    frontmatter: {
      title: row.title,
      description: metadata.seo?.description || `Review article about ${row.title}`,
      category: "reviews",
      author: "KnearMe Editorial",
      publishedAt: row.generated_at,
      tags: metadata.seo?.keywords || [],
      // Reviews don't have these optional fields
      featured: false,
    },
    content: row.content_markdown,
    readingTime: stats,
  };
}

/**
 * Transform a database review article row to ArticleMeta format.
 *
 * Used for list views where full content is not needed.
 */
function transformReviewArticleToMeta(row: ReviewArticleRow): ArticleMeta {
  const stats = readingTime(row.content_markdown);
  const metadata = row.metadata_json || {};

  return {
    slug: row.slug,
    frontmatter: {
      title: row.title,
      description: metadata.seo?.description || `Review article about ${row.title}`,
      category: "reviews",
      author: "KnearMe Editorial",
      publishedAt: row.generated_at,
      tags: metadata.seo?.keywords || [],
      featured: false,
    },
    readingTime: {
      text: stats.text,
      minutes: Math.ceil(stats.minutes),
    },
  };
}

/**
 * Get a review article by slug from the database.
 *
 * @param slug - Article slug
 * @returns Article with frontmatter and content, or null if not found
 */
export async function getReviewArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const supabase = createAdminClient() as ReviewSupabaseClient;
    const { data, error } = await supabase
      .from("review_articles")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) {
      return null;
    }

    return transformReviewArticleToArticle(data);
  } catch (error) {
    logger.error(`[getReviewArticleBySlug] Error loading article ${slug}`, {
      error,
    });
    return null;
  }
}

/**
 * Get all published review articles from the database.
 *
 * Returns articles sorted by generated_at date (newest first).
 */
export async function getAllReviewArticles(): Promise<ArticleMeta[]> {
  try {
    const supabase = createAdminClient() as ReviewSupabaseClient;
    const { data, error } = await supabase
      .from("review_articles")
      .select("*")
      .eq("status", "published")
      .order("generated_at", { ascending: false });

    if (error) {
      logger.error("[getAllReviewArticles] Database error", { error });
      return [];
    }

    return (data || []).map(transformReviewArticleToMeta);
  } catch (error) {
    logger.error("[getAllReviewArticles] Error loading articles", { error });
    return [];
  }
}

/**
 * Get all review article slugs for static generation.
 *
 * @returns Array of slugs for generateStaticParams
 */
export async function getAllReviewArticleSlugs(): Promise<string[]> {
  try {
    const supabase = createAdminClient() as ReviewSupabaseClient;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("review_articles")
      .select("slug")
      .eq("status", "published");

    if (error) {
      logger.error("[getAllReviewArticleSlugs] Database error", { error });
      return [];
    }

    const rows = (data || []) as Array<{ slug: string }>;
    return rows.map((row) => row.slug);
  } catch (error) {
    logger.error("[getAllReviewArticleSlugs] Error loading slugs", { error });
    return [];
  }
}
