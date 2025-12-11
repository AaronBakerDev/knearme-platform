'use client';

/**
 * TableOfContents - Sticky sidebar navigation for long-form articles.
 *
 * Features:
 * - Extracts headings from article content
 * - Highlights active section while scrolling
 * - Smooth scroll to sections on click
 * - Collapses on mobile (expandable)
 *
 * @see /docs/11-seo-discovery/SEO-DISCOVERY-STRATEGY.md
 */

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, List } from 'lucide-react';

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  /** Pre-extracted headings (optional - will extract from DOM if not provided) */
  headings?: TocHeading[];
  /** CSS class for the container */
  className?: string;
}

/**
 * Extract headings from the article content in the DOM.
 * Looks for h2 and h3 elements within the article.
 */
function extractHeadingsFromDOM(): TocHeading[] {
  const article = document.querySelector('article');
  if (!article) return [];

  const headingElements = article.querySelectorAll('h2, h3');
  const headings: TocHeading[] = [];

  headingElements.forEach((el) => {
    const id = el.id;
    const text = el.textContent?.trim() || '';
    const level = el.tagName === 'H2' ? 2 : 3;

    if (id && text) {
      headings.push({ id, text, level });
    }
  });

  return headings;
}

/**
 * TableOfContents component with active section highlighting.
 */
export function TableOfContents({ headings: initialHeadings, className }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocHeading[]>(initialHeadings || []);
  const [activeId, setActiveId] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract headings from DOM on mount if not provided
  useEffect(() => {
    if (!initialHeadings || initialHeadings.length === 0) {
      // Small delay to ensure MDX content is rendered
      const timer = setTimeout(() => {
        const extracted = extractHeadingsFromDOM();
        setHeadings(extracted);
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [initialHeadings]);

  // Track active section with Intersection Observer
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first heading that's intersecting (visible)
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by position and take the topmost
          const topEntry = visibleEntries.reduce((prev, curr) => {
            return prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr;
          });
          setActiveId(topEntry.target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px', // Trigger when heading is near top
        threshold: 0,
      }
    );

    // Observe all heading elements
    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  // Handle smooth scroll to section
  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -100; // Account for sticky header
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setIsExpanded(false); // Collapse on mobile after click
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className={cn('', className)} aria-label="Table of contents">
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between rounded-lg border bg-muted/50 p-3 text-sm font-medium lg:hidden"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2">
          <List className="h-4 w-4" />
          Table of Contents
        </span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
        />
      </button>

      {/* Table of contents list */}
      <div
        className={cn(
          'mt-2 lg:mt-0',
          // Mobile: collapsible
          'lg:block',
          isExpanded ? 'block' : 'hidden'
        )}
      >
        <div className="text-sm font-semibold text-foreground mb-3 hidden lg:block">
          On this page
        </div>
        <ul className="space-y-1 text-sm">
          {headings.map((heading) => (
            <li
              key={heading.id}
              className={cn(heading.level === 3 && 'ml-4')}
            >
              <button
                onClick={() => scrollToHeading(heading.id)}
                className={cn(
                  'block w-full text-left py-1.5 px-2 rounded-md transition-colors',
                  'hover:bg-muted hover:text-foreground',
                  activeId === heading.id
                    ? 'text-primary font-medium bg-primary/5'
                    : 'text-muted-foreground'
                )}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default TableOfContents;
