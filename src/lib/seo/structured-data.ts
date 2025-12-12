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
import type { ArticleFrontmatter } from '@/lib/content/mdx';
import type {
  DirectoryPlace,
  StateStats,
  CityStats,
  CategoryStats,
} from '@/types/directory';

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
 * Generate HowTo schema for Learning Center articles.
 * Uses frontmatter to keep JSON-LD in sync with rendered step cards.
 */
export function generateArticleHowToSchema(
  article: { slug: string; frontmatter: ArticleFrontmatter },
  siteUrl: string = SITE_URL
) {
  const steps = article.frontmatter.howToSteps || [];

  if (!steps.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: article.frontmatter.howToTitle || article.frontmatter.title,
    description:
      article.frontmatter.howToDescription || article.frontmatter.description,
    mainEntityOfPage: `${siteUrl}/learn/${article.slug}`,
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
 * Generate SoftwareApplication schema for calculator tools.
 *
 * Helps search engines understand tool functionality and
 * can result in enhanced search results with tool metadata.
 *
 * @see https://schema.org/SoftwareApplication
 * @see https://developers.google.com/search/docs/appearance/structured-data/software-app
 *
 * @param tool - Tool details (name, slug, description, category)
 * @returns SoftwareApplication JSON-LD schema object
 *
 * @example
 * const toolSchema = generateToolSchema({
 *   name: 'Brick Calculator',
 *   slug: 'brick-calculator',
 *   description: 'Calculate materials needed for your masonry project',
 *   category: 'Construction Calculator'
 * });
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
 * Generate LocalBusiness schema for an individual directory listing.
 *
 * This schema provides search engines with structured information about
 * businesses in the directory, including location, contact info, and ratings.
 *
 * @see https://schema.org/LocalBusiness
 * @see /docs/11-seo-discovery/ for directory SEO architecture
 *
 * @param business - Directory place data from Google Maps scraping
 * @returns LocalBusiness JSON-LD schema object
 *
 * @example
 * const businessSchema = generateDirectoryBusinessSchema(business);
 * // Use in directory detail pages: /directory/[state]/[city]/[category]/[slug]
 */
export function generateDirectoryBusinessSchema(
  business: DirectoryPlace
): Record<string, unknown> {
  const businessUrl = `${SITE_URL}/directory/${business.state_slug}/${business.city_slug}/${business.category_slug}/${business.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': businessUrl,
    name: business.title,
    url: businessUrl,
    ...(business.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: business.address,
        addressLocality: business.city.length > 0 ? business.city[0] : undefined,
        addressRegion: business.province_state,
        addressCountry: 'US',
      },
    }),
    ...(business.phone_number && { telephone: business.phone_number }),
    ...(business.website && { url: business.website }),
    ...(business.latitude &&
      business.longitude && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: business.latitude,
          longitude: business.longitude,
        },
      }),
    ...(business.rating &&
      business.rating_count && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: business.rating,
          ratingCount: business.rating_count,
          bestRating: 5,
          worstRating: 1,
        },
      }),
  };
}

/**
 * Generate ItemList schema for directory category listing pages.
 *
 * This schema helps search engines understand the list of businesses
 * in a category, improving visibility in search results.
 *
 * @see https://schema.org/ItemList
 * @see /docs/11-seo-discovery/ for directory SEO architecture
 *
 * @param businesses - Array of directory places to include in list
 * @param listName - Name of the list (e.g., "Masonry Contractors in Denver, CO")
 * @param pageUrl - URL of the listing page
 * @returns ItemList JSON-LD schema object
 *
 * @example
 * const listSchema = generateDirectoryListSchema(
 *   businesses,
 *   "Masonry Contractors in Denver, CO",
 *   "/directory/colorado/denver/masonry-contractors"
 * );
 */
export function generateDirectoryListSchema(
  businesses: DirectoryPlace[],
  listName: string,
  pageUrl: string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    url: `${SITE_URL}${pageUrl}`,
    numberOfItems: businesses.length,
    itemListElement: businesses.map((business, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/directory/${business.state_slug}/${business.city_slug}/${business.category_slug}/${business.slug}`,
        name: business.title,
        address: business.address
          ? {
              '@type': 'PostalAddress',
              streetAddress: business.address,
              addressLocality: business.city.length > 0 ? business.city[0] : undefined,
              addressRegion: business.province_state,
              addressCountry: 'US',
            }
          : undefined,
        ...(business.rating &&
          business.rating_count && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: business.rating,
              ratingCount: business.rating_count,
            },
          }),
      },
    })),
  };
}

/**
 * Generate Place schema for directory city hub pages.
 *
 * This schema represents a city page that aggregates multiple business
 * categories, helping search engines understand the geographic scope
 * of the directory.
 *
 * @see https://schema.org/City
 * @see /docs/11-seo-discovery/ for directory SEO architecture
 *
 * @param city - City statistics and metadata
 * @param categories - Array of categories available in this city
 * @returns City JSON-LD schema object
 *
 * @example
 * const citySchema = generateDirectoryCitySchema(cityStats, categories);
 * // Use on: /directory/[state]/[city]
 */
export function generateDirectoryCitySchema(
  city: CityStats,
  categories: CategoryStats[]
): Record<string, unknown> {
  const cityUrl = `${SITE_URL}/directory/${city.state_slug}/${city.city_slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'City',
    '@id': cityUrl,
    name: city.city_name,
    url: cityUrl,
    containedInPlace: {
      '@type': 'State',
      name: city.state_name,
      containedInPlace: {
        '@type': 'Country',
        name: 'United States',
      },
    },
    makesOffer: categories.map((category) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: category.category_name,
        url: `${SITE_URL}/directory/${city.state_slug}/${city.city_slug}/${category.category_slug}`,
      },
      description: `${category.business_count} ${category.category_name} businesses in ${city.city_name}`,
      ...(category.avg_rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: category.avg_rating,
          ratingCount: category.business_count,
        },
      }),
    })),
  };
}

/**
 * Generate State/AdministrativeArea schema for directory state pages.
 *
 * This schema represents a state-level directory page that aggregates
 * multiple cities, helping search engines understand the hierarchical
 * organization of the directory.
 *
 * @see https://schema.org/State
 * @see /docs/11-seo-discovery/ for directory SEO architecture
 *
 * @param state - State statistics and metadata
 * @param cities - Array of cities with businesses in this state
 * @returns State JSON-LD schema object
 *
 * @example
 * const stateSchema = generateDirectoryStateSchema(stateStats, cities);
 * // Use on: /directory/[state]
 */
export function generateDirectoryStateSchema(
  state: StateStats,
  cities: CityStats[]
): Record<string, unknown> {
  const stateUrl = `${SITE_URL}/directory/${state.state_slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'State',
    '@id': stateUrl,
    name: state.state_name,
    url: stateUrl,
    containedInPlace: {
      '@type': 'Country',
      name: 'United States',
    },
    containsPlace: cities.map((city) => ({
      '@type': 'City',
      name: city.city_name,
      url: `${SITE_URL}/directory/${state.state_slug}/${city.city_slug}`,
      description: `${city.business_count} businesses across ${city.category_count} categories`,
      ...(city.avg_rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: city.avg_rating,
          ratingCount: city.business_count,
        },
      }),
    })),
  };
}

/**
 * Stringify schema for embedding in HTML.
 */
export function schemaToString(schema: Record<string, unknown>): string {
  return JSON.stringify(schema, null, 0);
}
