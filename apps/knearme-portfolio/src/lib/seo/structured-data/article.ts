import type { ArticleFrontmatter } from '@/lib/content/mdx';
import { SITE_URL } from './constants';

/**
 * Generate HowTo schema for Learning Center articles.
 * Uses frontmatter to keep JSON-LD in sync with rendered step cards.
 */
export function generateArticleHowToSchema(
  article: { slug: string; frontmatter: ArticleFrontmatter },
  siteUrl: string = SITE_URL
) {
  const steps = article.frontmatter.howToSteps || [];

  if (!steps.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: article.frontmatter.howToTitle || article.frontmatter.title,
    description:
      article.frontmatter.howToDescription || article.frontmatter.description,
    mainEntityOfPage: `${siteUrl}/learn/${article.slug}`,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.description,
      ...(step.duration && { timeRequired: step.duration }),
    })),
  };
}

/**
 * Generate FAQPage schema for FAQ sections.
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate Article schema for educational content.
 */
export function generateArticleSchema(
  article: {
    title: string;
    description: string;
    slug: string;
    author: string;
    publishedAt: string;
    updatedAt?: string;
    image?: string;
    category?: string;
    tags?: string[];
    wordCount?: number;
  }
): Record<string, unknown> {
  const articleUrl = `${SITE_URL}/learn/${article.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': articleUrl,
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'KnearMe',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    ...(article.wordCount && { wordCount: article.wordCount }),
    ...(article.tags && { keywords: article.tags.join(', ') }),
    ...(article.category && { articleSection: article.category }),
  };
}
