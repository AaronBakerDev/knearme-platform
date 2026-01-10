import type { Business, Contractor, Project, ProjectImage } from '@/types/database';
import { SITE_URL } from './constants';

/**
 * Generate CreativeWork schema for a project.
 *
 * @param project - Project data
 * @param business - Business profile (or legacy Contractor)
 * @param images - Project images
 */
export function generateProjectSchema(
  project: Project,
  business: Business | Contractor,
  images: ProjectImage[]
) {
  const businessName = 'name' in business ? business.name : business.business_name;

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
      name: businessName,
      address: {
        '@type': 'PostalAddress',
        ...(business.address ? { streetAddress: business.address } : {}),
        addressLocality: business.city,
        addressRegion: business.state,
        ...(business.postal_code ? { postalCode: business.postal_code } : {}),
      },
      ...(business.phone ? { telephone: business.phone } : {}),
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
 * Generate ItemList schema for project galleries.
 *
 * Supports both `business` (new) and `contractor` (legacy) properties.
 */
export function generateProjectListSchema(
  projects: Array<Project & ({ business: Business } | { contractor: Contractor })>,
  listName: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: projects.length,
    itemListElement: projects.map((project, index) => {
      const businessName = 'business' in project
        ? project.business?.name
        : 'contractor' in project
          ? project.contractor?.business_name
          : null;

      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CreativeWork',
          name: project.title,
          description: project.seo_description,
          url: `${SITE_URL}/${project.city_slug}/masonry/${project.project_type_slug}/${project.slug}`,
          creator: {
            '@type': 'LocalBusiness',
            name: businessName || 'Business',
          },
        },
      };
    }),
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
