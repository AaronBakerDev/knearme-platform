/**
 * MDX Content Loading Utilities.
 *
 * Server-side utilities for loading and parsing MDX files from the
 * content/learn directory. Used by /learn pages for static generation.
 *
 * @see /content/learn/ for MDX article files
 * @see /src/app/(public)/learn/ for learn routes
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

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
  faqs?: Array<{ question: string; answer: string }>;
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
    console.error(`[getArticleBySlug] Error loading article ${slug}:`, error);
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
        console.error(`[getAllArticles] Error parsing ${filename}:`, error);
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
