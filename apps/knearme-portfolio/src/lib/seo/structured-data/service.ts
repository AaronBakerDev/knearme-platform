import { SITE_URL } from './constants';

/**
 * Generate HowTo schema for service process overviews.
 *
 * Useful for service landing pages that outline the typical steps.
 */
export function generateServiceHowToSchema(
  service: { name: string; slug: string; description?: string },
  steps: Array<{ title: string; description: string; duration?: string }>
): Record<string, unknown> {
  const serviceUrl = `${SITE_URL}/services/${service.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `${service.name} Process`,
    description: service.description || `${service.name} process overview and steps.`,
    url: serviceUrl,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.description,
      ...(step.duration && { timeRequired: step.duration }),
    })),
  };
}

/**
 * Generate Service schema for service type by city pages.
 */
export function generateServiceSchema(
  serviceType: {
    name: string;
    slug: string;
    description: string;
  },
  location: {
    city: string;
    citySlug: string;
    state?: string;
  },
  stats: {
    projectCount: number;
    contractorCount: number;
    providers?: Array<{ name: string; slug: string; citySlug: string }>;
  }
) {
  const serviceUrl = `${SITE_URL}/${location.citySlug}/masonry/${serviceType.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': serviceUrl,
    name: `${serviceType.name} in ${location.city}${location.state ? `, ${location.state}` : ''}`,
    description: serviceType.description,
    serviceType: serviceType.name,
    url: serviceUrl,
    areaServed: {
      '@type': 'City',
      name: location.city,
      ...(location.state && {
        containedInPlace: {
          '@type': 'State',
          name: location.state,
        },
      }),
    },
    provider: stats.providers?.slice(0, 5).map((provider) => ({
      '@type': 'LocalBusiness',
      name: provider.name,
      url: `${SITE_URL}/businesses/${provider.citySlug}/${provider.slug}`,
    })) || [],
    offers: {
      '@type': 'AggregateOffer',
      offerCount: stats.projectCount,
      areaServed: location.city,
    },
    category: 'Masonry Services',
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: serviceUrl,
      serviceType: 'Online Portfolio',
    },
  };
}

/**
 * Generate AggregateRating schema for service type pages.
 */
export function generateAggregateRatingSchema(
  itemName: string,
  itemUrl: string,
  rating: {
    ratingValue: number;
    ratingCount: number;
    bestRating?: number;
    worstRating?: number;
  }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    itemReviewed: {
      '@type': 'Service',
      name: itemName,
      url: itemUrl,
    },
    ratingValue: rating.ratingValue,
    ratingCount: rating.ratingCount,
    bestRating: rating.bestRating || 5,
    worstRating: rating.worstRating || 1,
  };
}

/**
 * Generate national Service schema for service landing pages.
 */
export function generateNationalServiceSchema(
  service: {
    name: string;
    slug: string;
    description: string;
  },
  cities: Array<{ cityName: string; state: string }>,
  stats: {
    projectCount: number;
    contractorCount: number;
  }
): Record<string, unknown> {
  const serviceUrl = `${SITE_URL}/services/${service.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': serviceUrl,
    name: service.name,
    description: service.description,
    serviceType: service.name,
    url: serviceUrl,
    provider: {
      '@type': 'Organization',
      name: 'KnearMe',
      url: SITE_URL,
    },
    areaServed: cities.slice(0, 20).map((city) => ({
      '@type': 'City',
      name: city.cityName,
      containedInPlace: {
        '@type': 'State',
        name: city.state,
      },
    })),
    offers: {
      '@type': 'AggregateOffer',
      offerCount: stats.projectCount,
      description: `${stats.contractorCount} businesses offering ${service.name}`,
    },
    category: 'Masonry Services',
  };
}
