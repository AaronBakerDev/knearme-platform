import type { Business, Contractor } from '@/types/database';
import { SITE_URL } from './constants';

/**
 * Generate LocalBusiness schema for a business profile.
 *
 * @param business - Business profile (or legacy Contractor)
 * @returns Schema.org LocalBusiness JSON-LD
 */
export function generateBusinessSchema(business: Business | Contractor) {
  const name = 'name' in business ? business.name : business.business_name;
  const slug = 'slug' in business ? business.slug : business.profile_slug;
  const businessSlug = slug || business.id;
  const businessUrl = `${SITE_URL}/businesses/${business.city_slug}/${businessSlug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': businessUrl,
    name: name,
    description: business.description,
    address: {
      '@type': 'PostalAddress',
      ...(business.address ? { streetAddress: business.address } : {}),
      addressLocality: business.city,
      addressRegion: business.state,
      ...(business.postal_code ? { postalCode: business.postal_code } : {}),
      addressCountry: 'US',
    },
    ...(business.phone ? { telephone: business.phone } : {}),
    url: businessUrl,
    areaServed: (business.service_areas || []).map((area) => ({
      '@type': 'City',
      name: area,
    })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: (business.services || []).map((service, index) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service,
        },
        position: index + 1,
      })),
    },
    image: business.profile_photo_url,
  };
}

/**
 * @deprecated Use generateBusinessSchema instead
 */
export const generateContractorSchema = generateBusinessSchema;
