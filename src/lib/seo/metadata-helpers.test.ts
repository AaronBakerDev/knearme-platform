import { describe, expect, it } from 'vitest';
import {
  selectCoverImage,
  buildOpenGraphMeta,
  buildTwitterMeta,
} from './metadata-helpers';

describe('selectCoverImage', () => {
  it('returns null when images are missing', () => {
    expect(selectCoverImage(undefined)).toBeNull();
    expect(selectCoverImage([])).toBeNull();
  });

  it('returns the image with the lowest display order', () => {
    const images = [
      { storage_path: 'b.jpg', alt_text: 'b', display_order: 2 },
      { storage_path: 'a.jpg', alt_text: 'a', display_order: 1 },
    ];

    expect(selectCoverImage(images)).toEqual({
      storage_path: 'a.jpg',
      alt_text: 'a',
      display_order: 1,
    });
  });

  it('does not mutate the original array order', () => {
    const images = [
      { storage_path: 'first.jpg', alt_text: null, display_order: 2 },
      { storage_path: 'second.jpg', alt_text: null, display_order: 1 },
    ];

    selectCoverImage(images);
    expect(images[0]?.storage_path).toBe('first.jpg');
  });
});

describe('buildOpenGraphMeta', () => {
  it('defaults to website type and empty images', () => {
    const meta = buildOpenGraphMeta({
      title: 'Test Page',
      description: 'Test description',
      url: 'https://knearme.com/test',
    });

    expect(meta.type).toBe('website');
    expect(meta.images).toEqual([]);
  });

  it('includes image when provided', () => {
    const meta = buildOpenGraphMeta({
      title: 'Test Page',
      description: 'Test description',
      url: 'https://knearme.com/test',
      imageUrl: 'https://example.com/image.jpg',
      imageAlt: 'Preview',
      type: 'article',
    });

    expect(meta.type).toBe('article');
    expect(meta.images).toEqual([{ url: 'https://example.com/image.jpg', alt: 'Preview' }]);
  });
});

describe('buildTwitterMeta', () => {
  it('returns summary card without image', () => {
    const meta = buildTwitterMeta({
      title: 'Test Page',
      description: 'Test description',
    });

    expect(meta.card).toBe('summary');
    expect(meta.images).toEqual([]);
  });

  it('returns summary_large_image when image is provided', () => {
    const meta = buildTwitterMeta({
      title: 'Test Page',
      description: 'Test description',
      imageUrl: 'https://example.com/image.jpg',
    });

    expect(meta.card).toBe('summary_large_image');
    expect(meta.images).toEqual(['https://example.com/image.jpg']);
  });
});
