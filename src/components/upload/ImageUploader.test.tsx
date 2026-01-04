/**
 * Unit tests for ImageUploader component.
 *
 * Tests file upload flow, drag-drop, validation, compression,
 * progress tracking, and image management.
 *
 * @see src/components/upload/ImageUploader.tsx
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import _userEvent from '@testing-library/user-event';
import { ImageUploader, type UploadedImage } from './ImageUploader';

// =============================================================================
// Mocks
// =============================================================================

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-testid="next-image" {...props} />
  ),
}));

// Mock compression utilities
vi.mock('@/lib/images/compress', () => ({
  compressImage: vi.fn().mockResolvedValue({
    blob: new Blob(['fake-image'], { type: 'image/webp' }),
    filename: 'compressed.webp',
    width: 800,
    height: 600,
  }),
  createPreviewUrl: vi.fn().mockReturnValue('blob:preview-url'),
  COMPRESSION_PRESETS: {
    upload: { maxWidth: 1920, quality: 0.85 },
  },
}));

// Mock file validation
vi.mock('@/lib/storage/upload', () => ({
  validateFile: vi.fn().mockReturnValue(null), // No error by default
}));

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(global.URL, 'createObjectURL', { value: mockCreateObjectURL });
Object.defineProperty(global.URL, 'revokeObjectURL', { value: mockRevokeObjectURL });

// =============================================================================
// Test Helpers
// =============================================================================

function createMockFile(name = 'test.jpg', type = 'image/jpeg', size = 1024): File {
  const file = new File(['mock-file-content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function createMockUploadedImage(id: string): UploadedImage {
  return {
    id,
    url: `https://storage.example.com/${id}.webp`,
    filename: `${id}.webp`,
    storage_path: `projects/123/${id}.webp`,
    width: 800,
    height: 600,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('ImageUploader', () => {
  const defaultProps = {
    projectId: 'project-123',
    onImagesChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    it('renders upload area with correct text', () => {
      render(<ImageUploader {...defaultProps} />);

      expect(screen.getByText('Tap to add photos')).toBeInTheDocument();
      expect(screen.getByText(/10 of 10 slots remaining/)).toBeInTheDocument();
    });

    it('shows correct remaining slots', () => {
      const images = [createMockUploadedImage('img-1'), createMockUploadedImage('img-2')];

      render(<ImageUploader {...defaultProps} images={images} maxImages={5} />);

      expect(screen.getByText(/3 of 5 slots remaining/)).toBeInTheDocument();
    });

    it('shows maximum reached when at capacity', () => {
      const images = Array.from({ length: 5 }, (_, i) => createMockUploadedImage(`img-${i}`));

      render(<ImageUploader {...defaultProps} images={images} maxImages={5} />);

      expect(screen.getByText('Maximum images reached')).toBeInTheDocument();
    });

    it('renders gallery button', () => {
      render(<ImageUploader {...defaultProps} />);

      expect(screen.getByRole('button', { name: /gallery/i })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ImageUploader {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  // ---------------------------------------------------------------------------
  // Image Grid
  // ---------------------------------------------------------------------------

  describe('image grid', () => {
    it('displays uploaded images', () => {
      const images = [
        createMockUploadedImage('img-1'),
        createMockUploadedImage('img-2'),
      ];

      render(<ImageUploader {...defaultProps} images={images} />);

      const imageElements = screen.getAllByTestId('next-image');
      expect(imageElements).toHaveLength(2);
    });

    it('shows delete button on hover for each image', () => {
      const images = [createMockUploadedImage('img-1')];

      render(<ImageUploader {...defaultProps} images={images} />);

      const deleteButton = screen.getByRole('button', { name: /delete image/i });
      expect(deleteButton).toBeInTheDocument();
    });

    it('hides delete buttons when disabled', () => {
      const images = [createMockUploadedImage('img-1')];

      render(<ImageUploader {...defaultProps} images={images} disabled />);

      expect(screen.queryByRole('button', { name: /delete image/i })).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Disabled State
  // ---------------------------------------------------------------------------

  describe('disabled state', () => {
    it('applies disabled styling to upload area', () => {
      const { container } = render(<ImageUploader {...defaultProps} disabled />);

      const uploadArea = container.querySelector('.border-dashed');
      expect(uploadArea).toHaveClass('opacity-50');
      expect(uploadArea).toHaveClass('cursor-not-allowed');
    });

    it('disables file input when disabled', () => {
      render(<ImageUploader {...defaultProps} disabled />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeDisabled();
    });

    it('disables gallery button when disabled', () => {
      render(<ImageUploader {...defaultProps} disabled />);

      const galleryButton = screen.getByRole('button', { name: /gallery/i });
      expect(galleryButton).toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // Drag and Drop
  // ---------------------------------------------------------------------------

  describe('drag and drop', () => {
    it('shows drag indicator on dragover', () => {
      const { container } = render(<ImageUploader {...defaultProps} />);

      const dropZone = container.querySelector('.border-dashed')!;
      fireEvent.dragOver(dropZone);

      expect(screen.getByText('Drop images here')).toBeInTheDocument();
    });

    it('hides drag indicator on dragleave', () => {
      const { container } = render(<ImageUploader {...defaultProps} />);

      const dropZone = container.querySelector('.border-dashed')!;
      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);

      expect(screen.getByText('Tap to add photos')).toBeInTheDocument();
    });

    it('does not show drag indicator when disabled', () => {
      const { container } = render(<ImageUploader {...defaultProps} disabled />);

      const dropZone = container.querySelector('.border-dashed')!;
      fireEvent.dragOver(dropZone);

      expect(screen.getByText('Tap to add photos')).toBeInTheDocument();
    });

    it('does not show drag indicator when at max capacity', () => {
      const images = Array.from({ length: 10 }, (_, i) => createMockUploadedImage(`img-${i}`));

      const { container } = render(
        <ImageUploader {...defaultProps} images={images} maxImages={10} />
      );

      const dropZone = container.querySelector('.border-dashed')!;
      fireEvent.dragOver(dropZone);

      // Should still show default text, not "Drop images here"
      expect(screen.queryByText('Drop images here')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // File Selection
  // ---------------------------------------------------------------------------

  describe('file selection', () => {
    it('triggers file input when upload area is clicked', async () => {
      const { container } = render(<ImageUploader {...defaultProps} />);

      const dropZone = container.querySelector('.border-dashed')!;
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      fireEvent.click(dropZone);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('accepts correct file types', () => {
      render(<ImageUploader {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput.accept).toBe('image/jpeg,image/png,image/webp,image/heic');
    });

    it('allows multiple file selection', () => {
      render(<ImageUploader {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput.multiple).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Upload Flow
  // ---------------------------------------------------------------------------

  describe('upload flow', () => {
    it('compresses and uploads file successfully', async () => {
      const onImagesChange = vi.fn();
      const onUploadProgress = vi.fn();

      // Mock successful API responses
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              image: {
                id: 'new-img-1',
                url: 'https://storage.example.com/new-img-1.webp',
                storage_path: 'projects/123/new-img-1.webp',
              },
              upload: {
                signed_url: 'https://storage.supabase.co/upload?token=abc',
              },
            }),
        })
        .mockResolvedValueOnce({ ok: true }) // Storage upload
        .mockResolvedValueOnce({ ok: true }); // Sync call

      render(
        <ImageUploader
          {...defaultProps}
          onImagesChange={onImagesChange}
          onUploadProgress={onUploadProgress}
        />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('photo.jpg');

      // Trigger file selection
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);

      // Wait for upload to complete
      await waitFor(() => {
        expect(onImagesChange).toHaveBeenCalled();
      });

      // Verify progress callbacks were called
      expect(onUploadProgress).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'uploading' })
      );
      expect(onUploadProgress).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'complete' })
      );
    });

    it('handles upload URL request failure', async () => {
      const onUploadProgress = vi.fn();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Quota exceeded' } }),
      });

      render(
        <ImageUploader {...defaultProps} onUploadProgress={onUploadProgress} />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('photo.jpg');

      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(onUploadProgress).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'error' })
        );
      });

      // Error message should be displayed
      await waitFor(() => {
        expect(screen.getByText(/quota exceeded/i)).toBeInTheDocument();
      });
    });

    it('handles storage upload failure', async () => {
      const onUploadProgress = vi.fn();

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              image: { id: 'new-img-1', url: 'url', storage_path: 'path' },
              upload: { signed_url: 'https://storage.example.com/upload' },
            }),
        })
        .mockResolvedValueOnce({
          ok: false,
          text: () => Promise.resolve('Storage error'),
        });

      render(
        <ImageUploader {...defaultProps} onUploadProgress={onUploadProgress} />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('photo.jpg');

      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(onUploadProgress).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'error' })
        );
      });
    });

    it('respects maxImages limit during upload', async () => {
      const onImagesChange = vi.fn();
      const images = Array.from({ length: 8 }, (_, i) => createMockUploadedImage(`img-${i}`));

      // Mock successful API responses for 2 uploads
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              image: { id: 'new-1', url: 'url', storage_path: 'path' },
              upload: { signed_url: 'https://storage.example.com/upload' },
            }),
        })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              image: { id: 'new-2', url: 'url', storage_path: 'path' },
              upload: { signed_url: 'https://storage.example.com/upload' },
            }),
        })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: true });

      render(
        <ImageUploader
          {...defaultProps}
          images={images}
          maxImages={10}
          onImagesChange={onImagesChange}
        />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      // Try to upload 5 files, but only 2 slots remain
      const files = Array.from({ length: 5 }, (_, i) => createMockFile(`photo${i}.jpg`));

      Object.defineProperty(fileInput, 'files', { value: files });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(onImagesChange).toHaveBeenCalled();
      });

      // Should only have processed 2 files (the remaining slots)
      const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const uploadUrlCalls = fetchCalls.filter(
        (call) => call[0]?.includes('/api/projects/') && call[0]?.includes('/images')
      );
      expect(uploadUrlCalls.length).toBeLessThanOrEqual(6); // 2 files * 3 calls each max
    });
  });

  // ---------------------------------------------------------------------------
  // File Validation
  // ---------------------------------------------------------------------------

  describe('file validation', () => {
    it('shows error for invalid file', async () => {
      const { validateFile } = await import('@/lib/storage/upload');
      (validateFile as ReturnType<typeof vi.fn>).mockReturnValue('File too large');

      render(<ImageUploader {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('huge.jpg', 'image/jpeg', 100 * 1024 * 1024);

      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('File too large')).toBeInTheDocument();
      });
    });

    it('shows remove button for failed uploads', async () => {
      const { validateFile } = await import('@/lib/storage/upload');
      (validateFile as ReturnType<typeof vi.fn>).mockReturnValue('Invalid format');

      render(<ImageUploader {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('bad.txt', 'text/plain');

      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Delete Image
  // ---------------------------------------------------------------------------

  describe('delete image', () => {
    it('calls API to delete image', async () => {
      const onImagesChange = vi.fn();
      const images = [createMockUploadedImage('img-1')];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });

      render(
        <ImageUploader {...defaultProps} images={images} onImagesChange={onImagesChange} />
      );

      const deleteButton = screen.getByRole('button', { name: /delete image/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/projects/project-123/images',
          expect.objectContaining({
            method: 'DELETE',
            body: JSON.stringify({ image_id: 'img-1' }),
          })
        );
      });

      expect(onImagesChange).toHaveBeenCalledWith([]);
    });

    it('handles delete failure gracefully', async () => {
      const onImagesChange = vi.fn();
      const images = [createMockUploadedImage('img-1')];
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });

      render(
        <ImageUploader {...defaultProps} images={images} onImagesChange={onImagesChange} />
      );

      const deleteButton = screen.getByRole('button', { name: /delete image/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      // onImagesChange should NOT be called on failure
      expect(onImagesChange).not.toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // Pending Upload Management
  // ---------------------------------------------------------------------------

  describe('pending upload management', () => {
    it('can remove failed pending upload', async () => {
      const { validateFile } = await import('@/lib/storage/upload');
      (validateFile as ReturnType<typeof vi.fn>).mockReturnValue('Validation error');

      render(<ImageUploader {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = createMockFile('bad.jpg');

      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Validation error')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove/i });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('Validation error')).not.toBeInTheDocument();
      });
    });
  });
});
