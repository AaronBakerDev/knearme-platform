import type { UploadedImage } from '@/components/upload/ImageUploader';

export function mergeImagesById(
  current: UploadedImage[],
  incoming: UploadedImage[]
): UploadedImage[] {
  const seen = new Set<string>();
  const merged: UploadedImage[] = [];

  for (const image of current) {
    if (!seen.has(image.id)) {
      seen.add(image.id);
      merged.push(image);
    }
  }

  for (const image of incoming) {
    if (!seen.has(image.id)) {
      seen.add(image.id);
      merged.push(image);
    }
  }

  return merged;
}
