/**
 * Tests for PublishChecklist component.
 *
 * The PublishChecklist validates project data before publishing and provides
 * visual feedback about what's complete, incomplete, or optional (warning).
 *
 * Test categories:
 * 1. Validation logic (title, description, images, project_type, tags, SEO)
 * 2. Status display (complete, incomplete, warning)
 * 3. Navigation callbacks
 * 4. Publish button states
 * 5. Published project display
 *
 * @see src/components/publish/PublishChecklist.tsx
 */

import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublishChecklist } from './PublishChecklist';

type PublishChecklistProps = ComponentProps<typeof PublishChecklist>;

function renderChecklist(overrides: Partial<PublishChecklistProps>) {
  const props: PublishChecklistProps = {
    project: {},
    imageCount: 1,
    ...overrides,
  };
  return render(<PublishChecklist {...props} />);
}

function makeWords(count: number) {
  return Array.from({ length: count }, (_, i) => `word${i}`).join(' ');
}

// Helper to create a valid project with all required fields
function createCompleteProject() {
  return {
    title: 'Complete Project Title',
    description: makeWords(210),
    seo_title: 'SEO Optimized Title',
    seo_description: 'SEO description for search engines',
    tags: ['masonry', 'restoration'],
    project_type: 'chimney-rebuild',
    city: 'Denver',
  };
}

// Helper to create minimal incomplete project
function createEmptyProject() {
  return {
    title: '',
    description: '',
    seo_title: '',
    seo_description: '',
    tags: [],
    project_type: '',
    city: '',
  };
}

describe('PublishChecklist', () => {
  describe('validation logic', () => {
    describe('title validation', () => {
      it('shows complete status for valid title (5-100 chars)', () => {
        renderChecklist({ project: { title: 'Valid Title Here' } });

        // Use semantic data-testid and data-status attributes
        const titleRow = screen.getByTestId('checklist-item-title');
        expect(titleRow).toHaveAttribute('data-status', 'complete');
        expect(within(titleRow).getByTestId('status-complete')).toBeInTheDocument();
      });

      it('shows incomplete status for empty title', () => {
        renderChecklist({ project: { title: '' } });

        // Use semantic data-testid and data-status attributes
        const titleRow = screen.getByTestId('checklist-item-title');
        expect(titleRow).toHaveAttribute('data-status', 'incomplete');
        expect(within(titleRow).getByTestId('status-incomplete')).toBeInTheDocument();
      });

      it('shows incomplete status for title under 5 chars', () => {
        renderChecklist({ project: { title: 'Hi' } });

        // Use semantic data-testid and data-status attributes
        const titleRow = screen.getByTestId('checklist-item-title');
        expect(titleRow).toHaveAttribute('data-status', 'incomplete');
        expect(within(titleRow).getByTestId('status-incomplete')).toBeInTheDocument();
      });

      it('displays character count for valid title', () => {
        renderChecklist({ project: { title: 'Test Title' } });

        expect(screen.getByText('10 characters')).toBeInTheDocument();
      });
    });

    describe('description validation', () => {
      it('shows complete status for description with 200+ words', () => {
        renderChecklist({ project: { description: makeWords(210) } });

        expect(screen.getByText('210 words (200 min)')).toBeInTheDocument();
      });

      it('shows warning status for description with 50-199 words', () => {
        renderChecklist({ project: { description: makeWords(100) } });

        expect(screen.getByText('100 words (200 min)')).toBeInTheDocument();
      });

      it('shows incomplete status for description with under 50 words', () => {
        renderChecklist({
          project: { description: 'Short description only ten words here now one two three' },
        });

        // Use semantic data-testid and data-status attributes
        const descriptionRow = screen.getByTestId('checklist-item-description');
        expect(descriptionRow).toHaveAttribute('data-status', 'incomplete');
        expect(within(descriptionRow).getByTestId('status-incomplete')).toBeInTheDocument();
      });

      it('shows incomplete status for empty description', () => {
        renderChecklist({ project: { description: '' } });

        expect(screen.getByText('Required (200+ words)')).toBeInTheDocument();
      });
    });

    describe('image validation', () => {
      it('shows complete status when at least 1 image exists', () => {
        renderChecklist({ project: createEmptyProject(), imageCount: 3 });

        expect(screen.getByText('3 images uploaded')).toBeInTheDocument();
      });

      it('shows singular text for 1 image', () => {
        renderChecklist({ project: createEmptyProject(), imageCount: 1 });

        expect(screen.getByText('1 image uploaded')).toBeInTheDocument();
      });

      it('shows incomplete status when no images', () => {
        renderChecklist({ project: createEmptyProject(), imageCount: 0 });

        expect(screen.getByText('At least 1 required')).toBeInTheDocument();
      });
    });

    describe('project type validation', () => {
      it('shows complete status for valid project type', () => {
        renderChecklist({ project: { project_type: 'chimney-rebuild' } });

        expect(screen.getByText('chimney-rebuild')).toBeInTheDocument();
      });

      it('shows incomplete status for empty project type', () => {
        renderChecklist({ project: { project_type: '' } });

        expect(screen.getByText('Required for URL')).toBeInTheDocument();
      });

      it('treats whitespace-only project type as empty', () => {
        renderChecklist({ project: { project_type: '   ' } });

        expect(screen.getByText('Required for URL')).toBeInTheDocument();
      });
    });

    describe('tags validation', () => {
      it('shows complete status when tags exist', () => {
        renderChecklist({ project: { tags: ['masonry', 'brick', 'restoration'] } });

        expect(screen.getByText('3 tags added')).toBeInTheDocument();
      });

      it('shows singular text for 1 tag', () => {
        renderChecklist({ project: { tags: ['masonry'] } });

        expect(screen.getByText('1 tag added')).toBeInTheDocument();
      });

      it('shows warning status when no tags (not required)', () => {
        renderChecklist({ project: { tags: [] } });

        expect(screen.getByText('Recommended for SEO')).toBeInTheDocument();
      });
    });

    describe('SEO title validation', () => {
      it('shows complete status for valid SEO title', () => {
        renderChecklist({ project: { seo_title: 'SEO Optimized Title' } });

        expect(screen.getByText('19/60 characters')).toBeInTheDocument();
      });

      it('shows warning with auto-fix hint when title exists but no SEO title', () => {
        renderChecklist({ project: { title: 'Project Title', seo_title: '' } });

        expect(screen.getByText('Will auto-generate from title')).toBeInTheDocument();
        // The "Auto" text is rendered in a Sparkles icon span
        expect(screen.getByText(/Auto/)).toBeInTheDocument();
      });
    });

    describe('SEO description validation', () => {
      it('shows complete status for valid SEO description', () => {
        renderChecklist({ project: { seo_description: 'SEO description text here' } });

        expect(screen.getByText('25/160 characters')).toBeInTheDocument();
      });

      it('shows warning with auto-fix hint when description exists but no SEO description', () => {
        renderChecklist({
          project: { description: makeWords(50), seo_description: '' },
        });

        expect(screen.getByText('Will auto-generate from description')).toBeInTheDocument();
      });
    });
  });

  describe('overall readiness', () => {
    it('shows "Ready to Publish" badge when all required items are complete', () => {
      renderChecklist({ project: createCompleteProject() });

      expect(screen.getByText('Ready to Publish')).toBeInTheDocument();
    });

    it('shows "Not Ready" badge when required items are incomplete', () => {
      renderChecklist({ project: createEmptyProject(), imageCount: 0 });

      expect(screen.getByText('Not Ready')).toBeInTheDocument();
    });

    it('allows publishing with warnings (optional items incomplete)', () => {
      // All required complete, but no SEO or tags
      renderChecklist({
        project: {
          title: 'Valid Title',
          description: makeWords(210),
          project_type: 'chimney-rebuild',
          tags: [], // warning
          seo_title: '', // warning
          seo_description: '', // warning
        },
        onPublish: () => {},
      });

      expect(screen.getByText('Ready to Publish')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /publish project/i })).toBeEnabled();
    });
  });

  describe('navigation callbacks', () => {
    it('calls onNavigate with tab and field when Fix button is clicked', async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();

      renderChecklist({ project: { title: '' }, imageCount: 0, onNavigate });

      // Find and click the first Fix button
      const fixButtons = screen.getAllByRole('button', { name: /fix/i });
      const fixButton = fixButtons[0];
      expect(fixButton).toBeDefined();
      if (!fixButton) {
        throw new Error('Expected Fix button to be rendered');
      }
      await user.click(fixButton);

      expect(onNavigate).toHaveBeenCalledWith('content', 'title');
    });

    it('calls onNavigate for images tab', async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();

      renderChecklist({ project: createCompleteProject(), imageCount: 0, onNavigate });

      // Find the images Fix button
      const imagesRow = screen.getByText('Project Images').closest('div[class*="flex items-center justify-between"]');
      expect(imagesRow).toBeDefined();
      if (!(imagesRow instanceof HTMLElement)) {
        throw new Error('Expected images row to be an HTML element');
      }
      const imagesFixButton = within(imagesRow).getByRole('button');
      await user.click(imagesFixButton);

      expect(onNavigate).toHaveBeenCalledWith('images', undefined);
    });

    it('calls onNavigate for SEO items with Edit label', async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();

      renderChecklist({ project: { seo_title: '' }, onNavigate });

      // SEO items show "Edit" instead of "Fix"
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const editButton = editButtons[0];
      expect(editButton).toBeDefined();
      if (!editButton) {
        throw new Error('Expected Edit button to be rendered');
      }
      await user.click(editButton);

      expect(onNavigate).toHaveBeenCalled();
    });

    it('does not show navigation buttons when onNavigate is not provided', () => {
      renderChecklist({ project: createEmptyProject(), imageCount: 0 });

      expect(screen.queryByRole('button', { name: /fix/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });
  });

  describe('publish button', () => {
    it('renders publish button when onPublish is provided', () => {
      renderChecklist({ project: createCompleteProject(), onPublish: () => {} });

      expect(screen.getByRole('button', { name: /publish project/i })).toBeInTheDocument();
    });

    it('does not render publish button when onPublish is not provided', () => {
      renderChecklist({ project: createCompleteProject() });

      expect(screen.queryByRole('button', { name: /publish/i })).not.toBeInTheDocument();
    });

    it('calls onPublish when publish button is clicked', async () => {
      const user = userEvent.setup();
      const onPublish = vi.fn();

      renderChecklist({ project: createCompleteProject(), onPublish });

      await user.click(screen.getByRole('button', { name: /publish project/i }));

      expect(onPublish).toHaveBeenCalled();
    });

    it('disables publish button when not ready', () => {
      renderChecklist({ project: createEmptyProject(), imageCount: 0, onPublish: () => {} });

      const button = screen.getByRole('button', { name: /complete required items/i });
      expect(button).toBeDisabled();
    });

    it('disables publish button when isPublishing is true', () => {
      renderChecklist({
        project: createCompleteProject(),
        onPublish: () => {},
        isPublishing: true,
      });

      expect(screen.getByRole('button', { name: /publishing/i })).toBeDisabled();
    });

    it('shows remaining items count when not ready', () => {
      renderChecklist({ project: createEmptyProject(), imageCount: 0, onPublish: () => {} });

      expect(screen.getByText(/4 required item\(s\) remaining/)).toBeInTheDocument();
    });
  });

  describe('published status', () => {
    it('shows "Project is Live" button when status is published', () => {
      renderChecklist({
        project: createCompleteProject(),
        onPublish: () => {},
        status: 'published',
      });

      expect(screen.getByRole('button', { name: /project is live/i })).toBeInTheDocument();
    });

    it('disables the live button', () => {
      renderChecklist({
        project: createCompleteProject(),
        onPublish: () => {},
        status: 'published',
      });

      expect(screen.getByRole('button', { name: /project is live/i })).toBeDisabled();
    });

    it('shows informational text about saving changes', () => {
      renderChecklist({
        project: createCompleteProject(),
        onPublish: () => {},
        status: 'published',
      });

      expect(screen.getByText(/changes are saved to the live page/i)).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('applies custom className to Card container', () => {
      const { container } = renderChecklist({
        project: createCompleteProject(),
        className: 'custom-class',
      });

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });

  describe('section organization', () => {
    it('separates items into Required and SEO Optimization sections', () => {
      renderChecklist({ project: createCompleteProject() });

      expect(screen.getByText('Required')).toBeInTheDocument();
      expect(screen.getByText('SEO Optimization')).toBeInTheDocument();
    });

    it('places title, description, images, project_type in Required section', () => {
      renderChecklist({ project: createCompleteProject() });

      // These should be before SEO Optimization heading
      const requiredSection = screen.getByText('Required').parentElement;
      expect(requiredSection).toContainElement(screen.getByText('Title'));
      expect(requiredSection).toContainElement(screen.getByText('Description'));
      expect(requiredSection).toContainElement(screen.getByText('Project Images'));
      expect(requiredSection).toContainElement(screen.getByText('Project Type'));
    });

    it('places tags, seo_title, seo_description in SEO Optimization section', () => {
      renderChecklist({ project: createCompleteProject() });

      const seoSection = screen.getByText('SEO Optimization').parentElement;
      expect(seoSection).toContainElement(screen.getByText('Tags'));
      expect(seoSection).toContainElement(screen.getByText('SEO Title'));
      expect(seoSection).toContainElement(screen.getByText('SEO Description'));
    });
  });
});
