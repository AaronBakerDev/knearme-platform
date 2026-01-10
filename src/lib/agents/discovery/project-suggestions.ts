/**
 * Project Suggestions for Discovery Agent
 *
 * Extracts potential project suggestions from:
 * 1. Reviews with photos (primary source)
 * 2. Web search results mentioning portfolio/projects (fallback)
 *
 * These suggestions are shown in the ProfileRevealArtifact to give
 * businesses a head start on creating their first projects.
 *
 * @see /docs/specs/typeform-onboarding-spec.md - Phase 6: Project Suggestions
 */

import type { DiscoveryReview } from './types';
import type { ProfileRevealProjectSuggestion } from './tool-types';

export interface ProjectSuggestionsInput {
  reviews?: DiscoveryReview[];
  webSearchInfo?: {
    aboutDescription?: string;
    services?: string[];
    specialties?: string[];
    sources?: Array<{ url: string; title?: string }>;
  };
  businessName: string;
  services?: string[];
}

/**
 * Extract project suggestions from reviews and web search results.
 *
 * Priority:
 * 1. Reviews with photos (highest value - shows actual work)
 * 2. Reviews describing specific projects/work
 * 3. Web portfolio mentions (fallback)
 *
 * @returns Array of 0-3 project suggestions
 */
export function extractProjectSuggestions(
  input: ProjectSuggestionsInput
): ProfileRevealProjectSuggestion[] {
  const suggestions: ProfileRevealProjectSuggestion[] = [];

  // 1. First priority: Reviews with photos
  const reviewsWithPhotos = (input.reviews || [])
    .filter((r) => r.hasImages && r.imageUrls && r.imageUrls.length > 0)
    .filter((r) => r.rating >= 4); // Only good reviews

  for (const review of reviewsWithPhotos.slice(0, 2)) {
    const title = generateProjectTitleFromReview(review, input.services);
    if (title) {
      suggestions.push({
        title,
        description: extractProjectDescription(review.text),
        source: 'review',
        imageUrls: review.imageUrls || undefined,
      });
    }
  }

  // 2. Second priority: 5-star reviews with project-like descriptions (no photos)
  if (suggestions.length < 2) {
    const projectDescriptionReviews = (input.reviews || [])
      .filter((r) => r.rating >= 4.5 && r.text && r.text.length > 50)
      .filter((r) => !r.hasImages) // Skip those already included
      .filter((r) => hasProjectKeywords(r.text));

    for (const review of projectDescriptionReviews.slice(0, 2 - suggestions.length)) {
      const title = generateProjectTitleFromReview(review, input.services);
      if (title) {
        suggestions.push({
          title,
          description: extractProjectDescription(review.text),
          source: 'review',
        });
      }
    }
  }

  // 3. Fallback: Web search sources that look like portfolio pages
  if (suggestions.length < 2 && input.webSearchInfo?.sources) {
    const portfolioSources = input.webSearchInfo.sources.filter((s) =>
      isPortfolioSource(s.url, s.title)
    );

    for (const source of portfolioSources.slice(0, 2 - suggestions.length)) {
      suggestions.push({
        title: cleanPortfolioTitle(source.title) || `View our work on ${new URL(source.url).hostname}`,
        description: `Found on their website`,
        source: 'web',
      });
    }
  }

  return suggestions.slice(0, 3); // Max 3 suggestions
}

/**
 * Generate a project title from a review.
 * Looks for specific work mentioned in the review text.
 */
function generateProjectTitleFromReview(
  review: DiscoveryReview,
  services?: string[]
): string | null {
  const text = review.text.toLowerCase();

  // Look for specific project types mentioned
  const projectPatterns = [
    { pattern: /chimney\s*(rebuild|repair|restoration)/i, title: 'Chimney Rebuild' },
    { pattern: /fireplace\s*(rebuild|repair|restoration)/i, title: 'Fireplace Restoration' },
    { pattern: /tuckpoint(ing)?/i, title: 'Tuckpointing Project' },
    { pattern: /brick\s*(repair|replacement|restoration)/i, title: 'Brick Restoration' },
    { pattern: /stone\s*(work|wall|patio|walkway)/i, title: 'Stone Work' },
    { pattern: /patio|outdoor\s*(living|space)/i, title: 'Outdoor Living Space' },
    { pattern: /retaining\s*wall/i, title: 'Retaining Wall' },
    { pattern: /foundation\s*(repair|work)/i, title: 'Foundation Repair' },
    { pattern: /(roof|roofing)/i, title: 'Roofing Project' },
    { pattern: /(bathroom|kitchen)\s*(remodel|renovation)/i, title: 'Remodel Project' },
    { pattern: /addition/i, title: 'Home Addition' },
    { pattern: /renovation/i, title: 'Renovation Project' },
    { pattern: /new\s*(home|house|construction)/i, title: 'New Construction' },
  ];

  for (const { pattern, title } of projectPatterns) {
    if (pattern.test(text)) {
      return title;
    }
  }

  // If services are provided, try to match
  if (services && services.length > 0) {
    for (const service of services) {
      if (text.includes(service.toLowerCase())) {
        return `${capitalize(service)} Project`;
      }
    }
  }

  // Generic fallback based on review sentiment
  if (text.includes('work') || text.includes('job') || text.includes('project')) {
    return 'Quality Work';
  }

  return null;
}

/**
 * Extract a brief project description from review text.
 */
function extractProjectDescription(text: string): string {
  // Take first sentence or first 100 chars
  const firstSentence = text.split(/[.!?]/)[0];
  if (firstSentence && firstSentence.length <= 100) {
    return firstSentence.trim();
  }
  if (text.length <= 100) {
    return text.trim();
  }
  return text.slice(0, 97).trim() + '...';
}

/**
 * Check if review text mentions project-like work.
 */
function hasProjectKeywords(text: string): boolean {
  const keywords = [
    'work',
    'job',
    'project',
    'repair',
    'install',
    'build',
    'restore',
    'remodel',
    'renovate',
    'fix',
    'replace',
    'construction',
  ];
  const lowerText = text.toLowerCase();
  return keywords.some((kw) => lowerText.includes(kw));
}

/**
 * Check if a web source looks like a portfolio page.
 */
function isPortfolioSource(url: string, title?: string): boolean {
  const portfolioKeywords = [
    'portfolio',
    'project',
    'gallery',
    'work',
    'case study',
    'our work',
    'completed',
  ];

  const urlLower = url.toLowerCase();
  const titleLower = (title || '').toLowerCase();

  return portfolioKeywords.some(
    (kw) => urlLower.includes(kw) || titleLower.includes(kw)
  );
}

/**
 * Clean up a portfolio page title for display.
 */
function cleanPortfolioTitle(title?: string): string | null {
  if (!title) return null;
  // Remove site name suffixes like "| Company Name"
  const parts = title.split(/\s*[|–-]\s*/);
  const firstPart = parts[0];
  if (!firstPart) return null;
  const cleaned = firstPart.trim();
  if (cleaned.length < 5) return null;
  return cleaned;
}

/**
 * Capitalize first letter of a string.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
