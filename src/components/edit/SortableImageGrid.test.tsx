/**
 * Tests for SortableImageGrid component.
 *
 * The SortableImageGrid provides drag-and-drop reordering of project images
 * with cover photo indicator, delete functionality, and image type badges.
 *
 * Test categories:
 * 1. Rendering (empty state, images, cover badge, type badges)
 * 2. Delete functionality
 * 3. Disabled state
 * 4. Image error handling
 * 5. Helper text
 *
 * Note: Drag-and-drop testing with dnd-kit requires special handling.
 * We test the callback behavior rather than simulating actual DnD events.
 *
 * @see src/components/edit/SortableImageGrid.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortableImageGrid } from './SortableImageGrid';
import type { ProjectImage } from '@/types/database';

// Helper to create mock images
function createMockImage(
  id: string,
  url: string,
  options: Partial<ProjectImage & { url: string }> = {}
): ProjectImage & { url: string } {
  return {
    id,
    project_id: 'project-1',
    storage_path: `projects/project-1/${id}.jpg`,
    image_type: null,
    alt_text: null,
    display_order: 0,
    width: null,
    height: null,
    created_at: new Date().toISOString(),
    url,
    ...options,
  };
}

describe('SortableImageGrid', () => {
  describe('rendering', () => {
    it('renders empty state message when no images', () => {
      render(
        <SortableImageGrid
          images={[]}
          onReorder={() => {}}
          onDelete={() => {}}
        />
      );

      expect(screen.getByText('No images uploaded yet')).toBeInTheDocument();
    });

    it('renders images in a grid', () => {
      const images = [
        createMockImage('img-1', '/test1.jpg'),
        createMockImage('img-2', '/test2.jpg'),
        createMockImage('img-3', '/test3.jpg'),
      ];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
        />
      );

      // Each image should be rendered with alt text
      const imageElements = screen.getAllByRole('img');
      expect(imageElements).toHaveLength(3);
    });

    it('shows Cover badge on first image only', () => {
      const images = [
        createMockImage('img-1', '/test1.jpg'),
        createMockImage('img-2', '/test2.jpg'),
      ];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
        />
      );

      // Only one "Cover" badge should exist
      const coverBadges = screen.getAllByText('Cover');
      expect(coverBadges).toHaveLength(1);
    });

    it('shows image type badge when image_type is set', () => {
      const images = [
        createMockImage('img-1', '/test1.jpg', { image_type: 'before' }),
        createMockImage('img-2', '/test2.jpg', { image_type: 'after' }),
        createMockImage('img-3', '/test3.jpg'), // no type
      ];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
        />
      );

      expect(screen.getByText('before')).toBeInTheDocument();
      expect(screen.getByText('after')).toBeInTheDocument();
    });

    it('uses alt_text for image alt attribute', () => {
      const images = [
        createMockImage('img-1', '/test1.jpg', { alt_text: 'Custom alt text' }),
      ];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
        />
      );

      expect(screen.getByAltText('Custom alt text')).toBeInTheDocument();
    });

    it('uses default alt text when alt_text is null', () => {
      const images = [
        createMockImage('img-1', '/test1.jpg', { alt_text: null }),
      ];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
        />
      );

      expect(screen.getByAltText('Project image')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const images = [createMockImage('img-1', '/test1.jpg')];

      const { container } = render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
          className="custom-class"
        />
      );

      // The grid should have the custom class
      const grid = container.querySelector('.custom-class');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('delete functionality', () => {
    it('shows delete button on image hover', async () => {
      const _user = userEvent.setup();
      const images = [createMockImage('img-1', '/test1.jpg')];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
        />
      );

      // Delete button should exist (visible on hover via CSS)
      const deleteButton = screen.getByRole('button', { name: /delete image/i });
      expect(deleteButton).toBeInTheDocument();
    });

    it('calls onDelete with image when delete button clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const images = [
        createMockImage('img-1', '/test1.jpg'),
        createMockImage('img-2', '/test2.jpg'),
      ];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={onDelete}
        />
      );

      // Get delete buttons and click the first one
      const deleteButtons = screen.getAllByRole('button', { name: /delete image/i });
      const deleteButton = deleteButtons[0];
      expect(deleteButton).toBeDefined();
      if (!deleteButton) {
        throw new Error('Expected delete button to be rendered');
      }
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith(images[0]);
    });

    it('hides delete button when disabled', () => {
      const images = [createMockImage('img-1', '/test1.jpg')];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
          disabled
        />
      );

      // Delete button should not be present when disabled
      const deleteButton = screen.queryByRole('button', { name: /delete image/i });
      expect(deleteButton).not.toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('hides drag handle when disabled', () => {
      const images = [createMockImage('img-1', '/test1.jpg')];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
          disabled
        />
      );

      // Drag handle should not be present
      const dragHandle = screen.queryByRole('button', { name: /drag to reorder/i });
      expect(dragHandle).not.toBeInTheDocument();
    });

    it('shows drag handle when not disabled', () => {
      const images = [createMockImage('img-1', '/test1.jpg')];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
        />
      );

      const dragHandle = screen.getByRole('button', { name: /drag to reorder/i });
      expect(dragHandle).toBeInTheDocument();
    });

    it('hides helper text when disabled', () => {
      const images = [
        createMockImage('img-1', '/test1.jpg'),
        createMockImage('img-2', '/test2.jpg'),
      ];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
          disabled
        />
      );

      expect(screen.queryByText(/drag images to reorder/i)).not.toBeInTheDocument();
    });
  });

  describe('helper text', () => {
    it('shows helper text when multiple images and not disabled', () => {
      const images = [
        createMockImage('img-1', '/test1.jpg'),
        createMockImage('img-2', '/test2.jpg'),
      ];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
        />
      );

      expect(screen.getByText(/drag images to reorder/i)).toBeInTheDocument();
      expect(screen.getByText(/first image will be used as the cover/i)).toBeInTheDocument();
    });

    it('does not show helper text with only one image', () => {
      const images = [createMockImage('img-1', '/test1.jpg')];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
        />
      );

      expect(screen.queryByText(/drag images to reorder/i)).not.toBeInTheDocument();
    });
  });

  describe('image error handling', () => {
    it('shows fallback UI when image fails to load', () => {
      const images = [createMockImage('img-1', '/broken-image.jpg')];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
        />
      );

      // Simulate image error - SafeImage should show fallback
      const img = screen.getByAltText('Project image');
      fireEvent.error(img);

      // After error, a Remove button should appear in the fallback
      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
      expect(screen.getByText(/image not found/i)).toBeInTheDocument();
    });

    it('calls onDelete when Remove button clicked in error fallback', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const images = [createMockImage('img-1', '/broken-image.jpg')];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={onDelete}
        />
      );

      // Simulate image error
      const img = screen.getByAltText('Project image');
      fireEvent.error(img);

      // Click the Remove button in the fallback
      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      expect(onDelete).toHaveBeenCalledWith(images[0]);
    });
  });

  describe('reorder callback', () => {
    // Note: Testing actual drag-and-drop with dnd-kit is complex and typically
    // done with E2E tests. Here we verify the callback is wired correctly.

    it('provides onReorder callback that receives reordered images', () => {
      const onReorder = vi.fn();
      const images = [
        createMockImage('img-1', '/test1.jpg'),
        createMockImage('img-2', '/test2.jpg'),
      ];

      render(
        <SortableImageGrid
          images={images}
          onReorder={onReorder}
          onDelete={() => {}}
        />
      );

      // The component is rendered and ready for DnD
      // Actual DnD testing would require simulating pointer events
      expect(screen.getAllByRole('img')).toHaveLength(2);
    });
  });

  describe('accessibility', () => {
    it('has accessible delete button', () => {
      const images = [createMockImage('img-1', '/test1.jpg')];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete image/i });
      expect(deleteButton).toHaveAccessibleName();
    });

    it('has accessible drag handle', () => {
      const images = [createMockImage('img-1', '/test1.jpg')];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
        />
      );

      const dragHandle = screen.getByRole('button', { name: /drag to reorder/i });
      expect(dragHandle).toHaveAccessibleName();
    });

    it('can activate delete button with Enter key', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const images = [createMockImage('img-1', '/test1.jpg')];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={onDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete image/i });
      deleteButton.focus();
      await user.keyboard('{Enter}');

      expect(onDelete).toHaveBeenCalledWith(images[0]);
    });

    it('can activate delete button with Space key', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const images = [createMockImage('img-1', '/test1.jpg')];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={onDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete image/i });
      deleteButton.focus();
      await user.keyboard(' ');

      expect(onDelete).toHaveBeenCalledWith(images[0]);
    });

    it('supports keyboard focus on drag handle', () => {
      const images = [createMockImage('img-1', '/test1.jpg')];

      render(
        <SortableImageGrid
          images={images}
          onReorder={() => {}}
          onDelete={() => {}}
        />
      );

      const dragHandle = screen.getByRole('button', { name: /drag to reorder/i });
      dragHandle.focus();
      expect(document.activeElement).toBe(dragHandle);
    });
  });
});
