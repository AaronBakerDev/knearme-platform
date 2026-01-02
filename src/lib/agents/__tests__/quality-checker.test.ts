/**
 * Quality Checker Agent Tests
 *
 * Tests the validation logic for publish requirements and recommendations.
 * Pure logic tests - no AI mocking needed.
 *
 * @see /src/lib/agents/quality-checker.ts
 */

import { describe, it, expect } from 'vitest';
import {
  checkQuality,
  formatQualityCheckSummary,
  getTopPriority,
} from '../quality-checker';
import {
  createEmptyProjectState,
  PUBLISH_REQUIREMENTS,
  PUBLISH_RECOMMENDATIONS,
} from '../types';
import type { SharedProjectState } from '../types';

/**
 * Helper to create a minimal valid project state.
 * All requirements met, no recommendations.
 */
function createMinimalValidState(): SharedProjectState {
  return {
    ...createEmptyProjectState(),
    title: 'Historic Chimney Rebuild',
    projectType: 'chimney-rebuild',
    projectTypeSlug: 'chimney-rebuild',
    city: 'Denver',
    state: 'CO',
    images: [
      {
        id: 'img-1',
        url: 'https://example.com/image1.jpg',
        displayOrder: 0,
      },
    ],
    heroImageId: 'img-1',
  };
}

/**
 * Helper to create a fully optimized project state.
 * All requirements AND recommendations met.
 */
function createOptimalState(): SharedProjectState {
  const words = Array(250).fill('word').join(' ');
  return {
    ...createMinimalValidState(),
    description: words,
    materials: ['reclaimed brick', 'lime mortar', 'copper flashing'],
    tags: ['chimney', 'historic', 'restoration'],
    seoTitle: 'Historic Chimney Rebuild in Denver | Expert Masonry',
    seoDescription:
      'Professional chimney rebuild using reclaimed brick and traditional techniques. See how we restored this 1920s Denver home.',
  };
}

describe('checkQuality', () => {
  // ---------------------------------------------------------------------------
  // Required Field Tests
  // ---------------------------------------------------------------------------

  /**
   * Agentic Philosophy: Nothing is truly required anymore.
   * PUBLISH_REQUIREMENTS.required = [] (empty array).
   * All fields are optional - users decide what to publish.
   * @see /docs/philosophy/agent-philosophy.md
   */
  describe('required fields (lenient mode)', () => {
    it('returns ready=true even when title is missing (nothing required)', () => {
      const state = createMinimalValidState();
      state.title = undefined;

      const result = checkQuality(state);

      // Philosophy: User decides what to publish
      expect(result.ready).toBe(true);
      expect(result.missing).not.toContain('title');
    });

    it('returns ready=true even when title is empty string (nothing required)', () => {
      const state = createMinimalValidState();
      state.title = '   ';

      const result = checkQuality(state);

      expect(result.ready).toBe(true);
      expect(result.missing).not.toContain('title');
    });

    it('returns ready=true even when project_type is missing (nothing required)', () => {
      const state = createMinimalValidState();
      state.projectType = undefined;

      const result = checkQuality(state);

      expect(result.ready).toBe(true);
      expect(result.missing).not.toContain('project_type');
    });

    it('returns ready=true even when city is missing (nothing required)', () => {
      const state = createMinimalValidState();
      state.city = undefined;

      const result = checkQuality(state);

      expect(result.ready).toBe(true);
      expect(result.missing).not.toContain('city');
    });

    it('returns ready=true even when state is missing (nothing required)', () => {
      const state = createMinimalValidState();
      state.state = undefined;

      const result = checkQuality(state);

      expect(result.ready).toBe(true);
      expect(result.missing).not.toContain('state');
    });

    it('returns ready=true even when project_type_slug is missing (nothing required)', () => {
      const state = createMinimalValidState();
      state.projectTypeSlug = undefined;

      const result = checkQuality(state);

      expect(result.ready).toBe(true);
      expect(result.missing).not.toContain('project_type_slug');
    });

    it('returns ready=true with no required fields (PUBLISH_REQUIREMENTS.required is empty)', () => {
      const state = createEmptyProjectState();

      const result = checkQuality(state);

      // Philosophy: Nothing blocks publishing, user always has final say
      expect(result.ready).toBe(true);
      expect(result.missing).toHaveLength(0);
      // Warnings may still exist for recommendations
      expect(PUBLISH_REQUIREMENTS.required).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Image Requirement Tests
  // ---------------------------------------------------------------------------

  /**
   * Agentic Philosophy: Images are optional.
   * PUBLISH_REQUIREMENTS.minImages = 0, requireHeroImage = false.
   * Users decide what to publish.
   * @see /docs/philosophy/agent-philosophy.md
   */
  describe('image requirements (lenient mode)', () => {
    it('returns ready=true even when no images uploaded (minImages=0)', () => {
      const state = createMinimalValidState();
      state.images = [];
      state.heroImageId = undefined;

      const result = checkQuality(state);

      // Philosophy: User decides if images are needed
      expect(result.ready).toBe(true);
      expect(result.missing).not.toContain('images');
    });

    it('returns ready=true even when no hero image selected (requireHeroImage=false)', () => {
      const state = createMinimalValidState();
      state.heroImageId = undefined;

      const result = checkQuality(state);

      // Philosophy: Hero image is a recommendation, not requirement
      expect(result.ready).toBe(true);
      expect(result.missing).not.toContain('hero_image');
    });

    it('returns ready=true even when hero image ID does not match (requireHeroImage=false)', () => {
      const state = createMinimalValidState();
      state.heroImageId = 'non-existent-id';

      const result = checkQuality(state);

      expect(result.ready).toBe(true);
      expect(result.missing).not.toContain('hero_image');
    });

    it('returns ready=true when hero image matches an uploaded image', () => {
      const state = createMinimalValidState();
      // heroImageId = 'img-1' and images contains id 'img-1'

      const result = checkQuality(state);

      expect(result.ready).toBe(true);
      expect(result.missing).not.toContain('hero_image');
    });

    it('validates minimum image count is now 0 (nothing required)', () => {
      // Philosophy: minImages changed from 1 to 0 - users decide
      expect(PUBLISH_REQUIREMENTS.minImages).toBe(0);
      expect(PUBLISH_REQUIREMENTS.requireHeroImage).toBe(false);

      const state = createMinimalValidState();
      state.images = [];

      const result = checkQuality(state);

      // No images is perfectly valid
      expect(result.ready).toBe(true);
      expect(result.missing).not.toContain('images');
    });
  });

  // ---------------------------------------------------------------------------
  // Ready State Tests
  // ---------------------------------------------------------------------------

  describe('ready state', () => {
    it('returns ready=true when all requirements are met', () => {
      const state = createMinimalValidState();

      const result = checkQuality(state);

      expect(result.ready).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('returns ready=true even with warnings (recommendations not met)', () => {
      const state = createMinimalValidState();
      // No description, materials, tags, or SEO - but still should be publishable

      const result = checkQuality(state);

      expect(result.ready).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Recommendation/Warning Tests
  // ---------------------------------------------------------------------------

  describe('recommendations and warnings', () => {
    it('warns when description is too short', () => {
      const state = createMinimalValidState();
      state.description = 'Short description with only a few words.';

      const result = checkQuality(state);

      expect(result.ready).toBe(true); // Not blocking
      expect(result.warnings.some((w) => w.includes('Description'))).toBe(true);
      expect(
        result.warnings.some((w) =>
          w.includes(String(PUBLISH_RECOMMENDATIONS.minDescriptionWords))
        )
      ).toBe(true);
    });

    it('warns when no description at all', () => {
      const state = createMinimalValidState();
      state.description = undefined;

      const result = checkQuality(state);

      expect(result.warnings.some((w) => w.includes('0 words'))).toBe(true);
    });

    it('no description warning when word count meets minimum', () => {
      const state = createMinimalValidState();
      state.description = Array(PUBLISH_RECOMMENDATIONS.minDescriptionWords)
        .fill('word')
        .join(' ');

      const result = checkQuality(state);

      expect(result.warnings.some((w) => w.includes('Description'))).toBe(
        false
      );
    });

    it('warns when too few materials listed', () => {
      const state = createMinimalValidState();
      state.materials = ['brick'];

      const result = checkQuality(state);

      expect(result.warnings.some((w) => w.includes('material'))).toBe(true);
    });

    it('no materials warning when minimum met', () => {
      const state = createMinimalValidState();
      state.materials = ['brick', 'mortar'];

      const result = checkQuality(state);

      expect(result.warnings.some((w) => w.includes('material'))).toBe(false);
    });

    it('warns when no tags added', () => {
      const state = createMinimalValidState();
      state.tags = [];

      const result = checkQuality(state);

      expect(result.warnings.some((w) => w.includes('tag'))).toBe(true);
    });

    it('warns when SEO metadata is incomplete', () => {
      const state = createMinimalValidState();
      state.seoTitle = undefined;
      state.seoDescription = undefined;

      const result = checkQuality(state);

      expect(result.warnings.some((w) => w.includes('SEO'))).toBe(true);
    });

    it('warns when only SEO title is missing', () => {
      const state = createMinimalValidState();
      state.seoTitle = undefined;
      state.seoDescription = 'A valid SEO description';

      const result = checkQuality(state);

      expect(result.warnings.some((w) => w.includes('SEO'))).toBe(true);
    });

    it('no SEO warning when both title and description present', () => {
      const state = createMinimalValidState();
      state.seoTitle = 'SEO Title';
      state.seoDescription = 'SEO Description';

      const result = checkQuality(state);

      expect(result.warnings.some((w) => w.includes('SEO'))).toBe(false);
    });

    it('returns no warnings when all recommendations met', () => {
      const state = createOptimalState();

      const result = checkQuality(state);

      expect(result.ready).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Suggestions Tests
  // ---------------------------------------------------------------------------

  describe('suggestions', () => {
    it('provides helpful suggestions for each missing required field', () => {
      const state = createEmptyProjectState();

      const result = checkQuality(state);

      // Should have at least one suggestion per missing field
      expect(result.suggestions.length).toBeGreaterThanOrEqual(
        result.missing.length
      );
    });

    it('provides suggestions for recommendations not met', () => {
      const state = createMinimalValidState();
      state.description = 'Short';
      state.materials = [];
      state.tags = [];

      const result = checkQuality(state);

      expect(result.suggestions.some((s) => s.includes('200+'))).toBe(true);
      expect(result.suggestions.some((s) => s.includes('materials'))).toBe(
        true
      );
      expect(result.suggestions.some((s) => s.includes('tags'))).toBe(true);
    });

    it('provides actionable suggestion text', () => {
      const state = createEmptyProjectState();

      const result = checkQuality(state);

      // Suggestions should be actionable (contain verbs like "Add", "Select", "Upload")
      const actionWords = ['Add', 'Select', 'Upload', 'Consider'];
      const hasActionable = result.suggestions.some((s) =>
        actionWords.some((word) => s.includes(word))
      );
      expect(hasActionable).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Helper Function Tests
// ---------------------------------------------------------------------------

describe('formatQualityCheckSummary', () => {
  it('returns success message when ready with no warnings', () => {
    const result = {
      ready: true,
      missing: [],
      warnings: [],
      suggestions: [],
    };

    const summary = formatQualityCheckSummary(result);

    expect(summary).toContain('ready to publish');
  });

  it('returns improvement message when ready but has warnings', () => {
    const result = {
      ready: true,
      missing: [],
      warnings: ['Description too short'],
      suggestions: [],
    };

    const summary = formatQualityCheckSummary(result);

    expect(summary).toContain('can be published');
    expect(summary).toContain('improvement');
  });

  it('returns blocking message when not ready', () => {
    const result = {
      ready: false,
      missing: ['title', 'images'],
      warnings: [],
      suggestions: [],
    };

    const summary = formatQualityCheckSummary(result);

    expect(summary).toContain('2 required');
  });
});

describe('getTopPriority', () => {
  it('returns null when no issues', () => {
    const result = {
      ready: true,
      missing: [],
      warnings: [],
      suggestions: [],
    };

    expect(getTopPriority(result)).toBeNull();
  });

  it('prioritizes images over other fields', () => {
    const result = {
      ready: false,
      missing: ['title', 'images', 'project_type'],
      warnings: [],
      suggestions: [],
    };

    expect(getTopPriority(result)).toBe('images');
  });

  it('prioritizes hero_image after images', () => {
    const result = {
      ready: false,
      missing: ['title', 'hero_image'],
      warnings: [],
      suggestions: [],
    };

    expect(getTopPriority(result)).toBe('hero_image');
  });

  it('prioritizes project_type_slug after project_type', () => {
    const result = {
      ready: false,
      missing: ['project_type_slug'],
      warnings: [],
      suggestions: [],
    };

    expect(getTopPriority(result)).toBe('project_type_slug');
  });

  it('returns description_length for description warnings', () => {
    const result = {
      ready: true,
      missing: [],
      warnings: ['Description is 50 words'],
      suggestions: [],
    };

    expect(getTopPriority(result)).toBe('description_length');
  });

  it('returns seo_metadata for SEO warnings', () => {
    const result = {
      ready: true,
      missing: [],
      warnings: ['SEO metadata incomplete'],
      suggestions: [],
    };

    expect(getTopPriority(result)).toBe('seo_metadata');
  });
});
