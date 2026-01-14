import { describe, expect, it } from 'vitest';
import { mergeImagesById } from './mergeImagesById';

const image = (id: string, url = `https://example.com/${id}.webp`) => ({
  id,
  url,
  filename: `${id}.webp`,
  storage_path: `project/${id}.webp`,
});

describe('mergeImagesById', () => {
  it('keeps order and appends unique incoming images', () => {
    const current = [image('a'), image('b')];
    const incoming = [image('c'), image('a', 'https://example.com/alt-a.webp')];

    const merged = mergeImagesById(current, incoming);

    expect(merged.map((img) => img.id)).toEqual(['a', 'b', 'c']);
    expect(merged[0]?.url).toBe('https://example.com/a.webp');
  });

  it('dedupes duplicates already present in current', () => {
    const current = [image('a'), image('a', 'https://example.com/dup-a.webp'), image('b')];

    const merged = mergeImagesById(current, []);

    expect(merged.map((img) => img.id)).toEqual(['a', 'b']);
    expect(merged[0]?.url).toBe('https://example.com/a.webp');
  });

  it('handles empty inputs', () => {
    expect(mergeImagesById([], [])).toEqual([]);
    expect(mergeImagesById([], [image('a')]).map((img) => img.id)).toEqual(['a']);
  });
});
