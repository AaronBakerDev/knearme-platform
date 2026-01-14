import type { Metadata } from 'next';

export type CoverImage = {
  storage_path: string;
  alt_text: string | null;
  display_order: number;
};

export function selectCoverImage(images?: CoverImage[] | null): CoverImage | null {
  if (!images || images.length === 0) return null;

  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);
  return sorted[0] ?? null;
}

interface OpenGraphMetaInput {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  imageAlt?: string;
  type?: Metadata['openGraph'] extends { type?: infer T } ? T : string;
}

export function buildOpenGraphMeta({
  title,
  description,
  url,
  imageUrl,
  imageAlt,
  type = 'website',
}: OpenGraphMetaInput): NonNullable<Metadata['openGraph']> {
  return {
    title,
    description,
    type: type as 'website',
    url,
    images: imageUrl ? [{ url: imageUrl, alt: imageAlt }] : [],
  };
}

interface TwitterMetaInput {
  title: string;
  description: string;
  imageUrl?: string;
}

export function buildTwitterMeta({
  title,
  description,
  imageUrl,
}: TwitterMetaInput): NonNullable<Metadata['twitter']> {
  return {
    card: imageUrl ? 'summary_large_image' : 'summary',
    title,
    description,
    images: imageUrl ? [imageUrl] : [],
  };
}
