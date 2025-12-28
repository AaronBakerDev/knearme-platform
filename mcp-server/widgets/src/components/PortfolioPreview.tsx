/**
 * Portfolio Preview Component.
 *
 * Displays a portfolio project preview card in ChatGPT's inline mode.
 * Shows hero image, project info, status, and missing fields for drafts.
 *
 * @see /docs/chatgpt-apps-sdk/UI_UX.md
 */

import type { JSX } from 'react';
import { useToolOutput, useTheme } from './hooks';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Project image data.
 */
interface ProjectImage {
  id: string;
  url: string;
  image_type: string;
}

/**
 * Project data from the MCP tool response.
 */
interface Project {
  id: string;
  title: string;
  status: 'draft' | 'published';
  project_type: string;
  city: string;
  state: string;
  summary?: string;
  hero_image_id?: string;
}

/**
 * Expected tool output structure for portfolio preview.
 */
interface PortfolioPreviewData {
  project: Project;
  images: ProjectImage[];
  missing_fields?: string[];
  can_publish?: boolean;
  public_url?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Human-readable labels for missing fields.
 */
const fieldLabels: Record<string, string> = {
  title: 'Title',
  summary: 'Summary',
  challenge: 'Challenge',
  solution: 'Solution',
  results: 'Results',
  project_type: 'Project Type',
  city: 'City',
  state: 'State',
  hero_image_id: 'Hero Image',
  images: 'Images',
};

/**
 * Get the hero image URL from project data.
 * Uses hero_image_id match first, then falls back to first image.
 */
function getHeroImageUrl(project: Project, images: ProjectImage[]): string | null {
  if (!images || images.length === 0) {
    return null;
  }

  // Try to find image matching hero_image_id
  if (project.hero_image_id) {
    const heroImage = images.find((img) => img.id === project.hero_image_id);
    if (heroImage) {
      return heroImage.url;
    }
  }

  // Fall back to first image
  return images[0].url;
}

/**
 * Request fullscreen display mode from ChatGPT.
 */
function requestFullscreen(): void {
  const openai = (window as unknown as {
    openai?: { requestDisplayMode?: (opts: { mode: string }) => void };
  }).openai;

  if (openai?.requestDisplayMode) {
    openai.requestDisplayMode({ mode: 'fullscreen' });
  } else {
    console.log('[Mock] requestDisplayMode: fullscreen');
  }
}

/**
 * Open external URL in new tab.
 */
function openExternal(url: string): void {
  const openai = (window as unknown as {
    openai?: { openExternal?: (url: string) => Promise<void> };
  }).openai;

  if (openai?.openExternal) {
    openai.openExternal(url);
  } else {
    window.open(url, '_blank');
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * PortfolioPreview displays a compact portfolio project card.
 *
 * Used in ChatGPT inline mode to show:
 * - Hero image (first image or hero_image_id match)
 * - Project title and status badge
 * - Location (city, state)
 * - Project type
 * - Missing fields list (for drafts)
 * - Public URL link (for published)
 * - "View Full Preview" button for fullscreen mode
 */
export function PortfolioPreview(): JSX.Element {
  const data = useToolOutput<PortfolioPreviewData>();
  const theme = useTheme();

  // Loading state
  if (!data) {
    return (
      <div className="widget-loading">
        <div className="spinner" />
        <p>Loading preview...</p>
      </div>
    );
  }

  const { project, images, missing_fields, public_url } = data;
  const heroImageUrl = getHeroImageUrl(project, images);
  const isDraft = project.status === 'draft';
  const hasMissingFields = missing_fields && missing_fields.length > 0;

  return (
    <div className="card" data-theme={theme}>
      {/* Hero Image */}
      {heroImageUrl && (
        <div
          style={{
            height: 140,
            marginBottom: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: 'var(--color-bg-subtle)',
          }}
        >
          <img
            src={heroImageUrl}
            alt={project.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {/* Header: Title + Status Badge */}
      <div className="card-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="heading-md truncate">{project.title || 'Untitled Project'}</h2>
        </div>
        <span className={isDraft ? 'badge badge-draft' : 'badge badge-published'}>
          {project.status}
        </span>
      </div>

      {/* Card Body: Location & Type */}
      <div className="card-body">
        {/* Location */}
        {(project.city || project.state) && (
          <p className="text-muted" style={{ marginBottom: 'var(--space-xs)' }}>
            {[project.city, project.state].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Project Type */}
        {project.project_type && (
          <p className="text-subtle">{project.project_type}</p>
        )}

        {/* Missing Fields (Draft only) */}
        {isDraft && hasMissingFields && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <p
              className="text-subtle"
              style={{
                marginBottom: 'var(--space-xs)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              Missing to publish:
            </p>
            <div className="flex gap-xs" style={{ flexWrap: 'wrap' }}>
              {missing_fields.map((field) => (
                <span
                  key={field}
                  style={{
                    padding: '2px 8px',
                    background: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-warning)',
                  }}
                >
                  {fieldLabels[field] || field}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Public URL (Published only) */}
        {!isDraft && public_url && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => openExternal(public_url)}
              style={{
                padding: 0,
                color: 'var(--color-primary)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              View public page
            </button>
          </div>
        )}
      </div>

      {/* Footer: Actions */}
      <div className="card-footer">
        <button
          className="btn btn-primary btn-sm"
          onClick={requestFullscreen}
        >
          View Full Preview
        </button>
      </div>
    </div>
  );
}

export default PortfolioPreview;
