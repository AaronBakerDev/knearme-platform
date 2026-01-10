import { SITE_URL } from './constants';

/**
 * Generate Organization schema for the platform itself.
 *
 * Use this on the homepage and about pages.
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'KnearMe',
    url: SITE_URL,
    description: 'AI-powered portfolio platform for service businesses. Showcase your work, get discovered by clients.',
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      // Add social media links when available
    ],
  };
}
