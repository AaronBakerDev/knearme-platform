/**
 * JSON-LD structured data generators for SEO.
 *
 * Generates Schema.org structured data for:
 * - LocalBusiness (contractor profiles)
 * - CreativeWork (project portfolios)
 * - ImageObject (project photos)
 *
 * @see https://schema.org/
 * @see /docs/02-requirements/capabilities.md SEO capabilities
 */

import type { Contractor, Project, ProjectImage } from '@/types/database';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://knearme.com';

/**
 * Generate LocalBusiness schema for a contractor.
 */
export function generateContractorSchema(contractor: Contractor) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/contractors/${contractor.city_slug}/${contractor.id}`,
    name: contractor.business_name,
    description: contractor.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: contractor.city,
      addressRegion: contractor.state,
      addressCountry: 'US',
    },
    areaServed: (contractor.service_areas || []).map((area) => ({
      '@type': 'City',
      name: area,
    })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Masonry Services',
      itemListElement: (contractor.services || []).map((service, index) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service,
        },
        position: index + 1,
      })),
    },
    image: contractor.profile_photo_url,
  };
}

/**
 * Generate CreativeWork schema for a project.
 */
export function generateProjectSchema(
  project: Project,
  contractor: Contractor,
  images: ProjectImage[]
) {
  const projectUrl = `${SITE_URL}/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`;
  const primaryImage = images[0];

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': projectUrl,
    name: project.title,
    description: project.description,
    datePublished: project.published_at,
    dateModified: project.updated_at,
    creator: {
      '@type': 'LocalBusiness',
      name: contractor.business_name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: contractor.city,
        addressRegion: contractor.state,
      },
    },
    image: images.map((img) => ({
      '@type': 'ImageObject',
      url: `${SITE_URL}/storage/v1/object/public/project-images/${img.storage_path}`,
      width: img.width,
      height: img.height,
      caption: img.alt_text,
    })),
    thumbnailUrl: primaryImage
      ? `${SITE_URL}/storage/v1/object/public/project-images/${primaryImage.storage_path}`
      : undefined,
    keywords: project.tags?.join(', '),
    about: {
      '@type': 'Thing',
      name: project.project_type,
    },
    material: project.materials,
    locationCreated: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: project.city,
      },
    },
  };
}

/**
 * Generate BreadcrumbList schema for navigation.
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Generate ItemList schema for project galleries.
 */
export function generateProjectListSchema(
  projects: Array<Project & { contractor: Contractor }>,
  listName: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: projects.length,
    itemListElement: projects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'CreativeWork',
        name: project.title,
        description: project.seo_description,
        url: `${SITE_URL}/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`,
        creator: {
          '@type': 'LocalBusiness',
          name: project.contractor.business_name,
        },
      },
    })),
  };
}

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
 * Generate HowTo schema for project process documentation.
 * Useful for projects with before/during/after photos.
 */
export function generateHowToSchema(
  project: Project,
  steps: Array<{ name: string; description: string; imageUrl?: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How ${project.title} Was Completed`,
    description: project.description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.description,
      image: step.imageUrl,
    })),
    tool: project.materials?.map((material) => ({
      '@type': 'HowToTool',
      name: material,
    })),
  };
}

/**
 * Generate Service schema for service type by city pages.
 *
 * This schema helps search engines understand:
 * - What service is offered
 * - Where the service is available
 * - Who provides the service (aggregate of contractors)
 * - Quality indicators (project count, contractor count)
 *
 * @see https://schema.org/Service
 * @see /docs/SEO-DISCOVERY-STRATEGY.md for programmatic SEO architecture
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
    providers?: Array<{ name: string; id: string; citySlug: string }>;
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
      url: `${SITE_URL}/contractors/${provider.citySlug}/${provider.id}`,
    })) || [],
    // Aggregate offer showing availability
    offers: {
      '@type': 'AggregateOffer',
      offerCount: stats.projectCount,
      areaServed: location.city,
    },
    // Additional SEO hints
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
 *
 * Note: This requires actual rating data. For now, we generate
 * a placeholder that can be populated when ratings are implemented.
 *
 * @see https://schema.org/AggregateRating
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
    description: 'AI-powered portfolio platform for masonry contractors. Showcase your work, get discovered by homeowners.',
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      // Add social media links when available
    ],
  };
}

/**
 * Generate FAQPage schema for FAQ sections.
 *
 * FAQPage schema helps search engines understand Q&A content
 * and can result in featured snippets in search results.
 *
 * @see https://schema.org/FAQPage
 * @see https://developers.google.com/search/docs/appearance/structured-data/faqpage
 *
 * @param faqs - Array of question/answer pairs
 * @returns FAQPage JSON-LD schema object
 *
 * @example
 * const faqSchema = generateFAQSchema([
 *   { question: 'How much does chimney repair cost?', answer: 'Costs range from $300 to $15,000...' },
 *   { question: 'How long does chimney repair take?', answer: 'Most repairs take 1-7 days...' },
 * ]);
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate national Service schema for service landing pages.
 *
 * Unlike the city-specific generateServiceSchema, this schema
 * represents a service at the national level with multiple
 * cities served.
 *
 * @see https://schema.org/Service
 *
 * @param service - Service details (name, description)
 * @param cities - Array of cities offering this service
 * @param stats - Aggregate statistics
 * @returns Service JSON-LD schema object
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
      description: `${stats.contractorCount} contractors offering ${service.name}`,
    },
    category: 'Masonry Services',
  };
}

/**
 * Generate Article schema for educational content.
 *
 * Use this for /learn articles and other long-form content.
 *
 * @see https://schema.org/Article
 * @see https://developers.google.com/search/docs/appearance/structured-data/article
 */
export function generateArticleSchema(
  article: {
    title: string;
    description: string;
    slug: string;
    author: string;
    publishedAt: string;
    updatedAt?: string;
    image?: string;
    category?: string;
    tags?: string[];
    wordCount?: number;
  }
): Record<string, unknown> {
  const articleUrl = `${SITE_URL}/learn/${article.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': articleUrl,
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'KnearMe',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    ...(article.wordCount && { wordCount: article.wordCount }),
    ...(article.tags && { keywords: article.tags.join(', ') }),
    ...(article.category && { articleSection: article.category }),
  };
}

/**
 * Stringify schema for embedding in HTML.
 */
export function schemaToString(schema: Record<string, unknown>): string {
  return JSON.stringify(schema, null, 0);
}
