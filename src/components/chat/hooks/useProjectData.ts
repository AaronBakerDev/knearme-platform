/**
 * Hook for aggregating project data for the live preview canvas.
 *
 * Combines extracted conversation data with uploaded images into
 * a unified preview-ready format. Handles derived fields like
 * suggested title, formatted materials, and hero image selection.
 *
 * This hook acts as the single source of truth for what displays
 * in the LivePortfolioCanvas, deriving everything from the raw
 * extractedData and uploadedImages state in ChatWizard.
 *
 * @see implementation-roadmap.md#phase-3-live-preview
 * @see chat-ux-patterns.md#liveportfoliocanvas
 */

import { useMemo } from 'react';
import type { ExtractedProjectData, UploadedImage } from '@/lib/chat/chat-types';
import { formatProjectLocation } from '@/lib/utils/location';

/**
 * Hero image layout configuration.
 * Picks best images for the 1 large + 2 small grid.
 */
export interface HeroImageLayout {
  /** Primary large image (first 'after' or first image) */
  primary: UploadedImage | null;
  /** Secondary images for smaller slots */
  secondary: UploadedImage[];
}

/**
 * Aggregated project data ready for preview rendering.
 */
export interface ProjectPreviewData {
  /** Suggested title (derived from project type + location) */
  suggestedTitle: string | null;
  /** Project type in human-readable format */
  projectType: string | null;
  /** Materials as display-ready array */
  materials: string[];
  /** Techniques as display-ready array */
  techniques: string[];
  /** Customer problem summary */
  problem: string | null;
  /** Solution approach summary */
  solution: string | null;
  /** Duration string */
  duration: string | null;
  /** Location string */
  location: string | null;
  /** What they're proud of */
  highlight: string | null;
  /** Total image count */
  imageCount: number;
  /** Hero image layout for canvas */
  heroLayout: HeroImageLayout;
  /** All uploaded images */
  allImages: UploadedImage[];
  /** Whether we have enough data to show something meaningful */
  hasContent: boolean;
}

/**
 * Format project type slug into human-readable text.
 * Handles common masonry project types.
 */
function formatProjectType(slug: string | undefined): string | null {
  if (!slug) return null;

  const typeMap: Record<string, string> = {
    'chimney-rebuild': 'Chimney Rebuild',
    'chimney-repair': 'Chimney Repair',
    'tuckpointing': 'Tuckpointing',
    'brick-repair': 'Brick Repair',
    'stone-work': 'Stone Work',
    'foundation-repair': 'Foundation Repair',
    'fireplace': 'Fireplace',
    'retaining-wall': 'Retaining Wall',
    'paver': 'Paver Installation',
    'concrete': 'Concrete Work',
  };

  // Try direct match
  if (typeMap[slug]) {
    return typeMap[slug];
  }

  // Fallback: Title case the slug
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate a suggested title from available data.
 */
function generateSuggestedTitle(
  data: ExtractedProjectData
): string | null {
  const type = formatProjectType(data.project_type);
  if (!type) return null;

  // If we have location, include it
  const locationLabel =
    data.location ||
    formatProjectLocation({ city: data.city, state: data.state });
  if (locationLabel) {
    return `${type} in ${locationLabel}`;
  }

  return type;
}

/**
 * Select hero images for the canvas grid layout.
 * Prioritizes 'after' images for primary slot.
 */
function selectHeroImages(images: UploadedImage[]): HeroImageLayout {
  if (images.length === 0) {
    return { primary: null, secondary: [] };
  }

  // Sort by preference: after > detail > progress > before > uncategorized
  const priorityOrder: (string | undefined)[] = [
    'after',
    'detail',
    'progress',
    'before',
    undefined,
  ];

  const sorted = [...images].sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.image_type);
    const bIndex = priorityOrder.indexOf(b.image_type);
    // Unknown types (-1) should sort last, not first
    const aScore = aIndex === -1 ? priorityOrder.length : aIndex;
    const bScore = bIndex === -1 ? priorityOrder.length : bIndex;
    return aScore - bScore;
  });

  return {
    primary: sorted[0] ?? null,
    secondary: sorted.slice(1, 3), // Next 2 for small slots
  };
}

/**
 * Normalize array fields (handle undefined/null).
 */
function normalizeArray(arr: string[] | undefined | null): string[] {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.filter((item) => item && typeof item === 'string');
}

/**
 * Hook for aggregating project data for live preview.
 *
 * @example
 * ```tsx
 * const previewData = useProjectData(extractedData, uploadedImages);
 *
 * return (
 *   <LivePortfolioCanvas
 *     title={previewData.suggestedTitle}
 *     materials={previewData.materials}
 *     heroLayout={previewData.heroLayout}
 *   />
 * );
 * ```
 */
export function useProjectData(
  data: ExtractedProjectData,
  images: UploadedImage[]
): ProjectPreviewData {
  return useMemo(() => {
    const projectType = formatProjectType(data.project_type);
    const materials = normalizeArray(data.materials_mentioned);
    const techniques = normalizeArray(data.techniques_mentioned);
    const heroLayout = selectHeroImages(images);

    // Determine if we have enough content to show something meaningful
    // At minimum: project type OR materials OR at least one image
    const hasContent =
      !!projectType ||
      materials.length > 0 ||
      techniques.length > 0 ||
      images.length > 0 ||
      !!data.customer_problem ||
      !!data.solution_approach;

    const locationLabel =
      data.location ||
      formatProjectLocation({ city: data.city, state: data.state });

    return {
      suggestedTitle: generateSuggestedTitle(data),
      projectType,
      materials,
      techniques,
      problem: data.customer_problem || null,
      solution: data.solution_approach || null,
      duration: data.duration || null,
      location: locationLabel || null,
      highlight: data.proud_of || null,
      imageCount: images.length,
      heroLayout,
      allImages: images,
      hasContent,
    };
  }, [data, images]);
}

// Types are exported inline via interface declarations above
