import { SITE_URL } from './constants';

/**
 * Generate SoftwareApplication schema for calculator tools.
 */
export function generateToolSchema(tool: {
  name: string;
  slug: string;
  description: string;
  category: string;
}): Record<string, unknown> {
  const toolUrl = `${SITE_URL}/tools/${tool.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': toolUrl,
    name: tool.name,
    description: tool.description,
    url: toolUrl,
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: tool.category,
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    provider: {
      '@type': 'Organization',
      name: 'KnearMe',
      url: SITE_URL,
    },
  };
}
