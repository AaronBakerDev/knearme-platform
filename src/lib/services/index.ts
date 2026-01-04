/**
 * Service Catalog Module Exports
 *
 * Single source of truth for service type data.
 *
 * @example
 * import { getServiceCatalog, getServiceBySlug } from '@/lib/services';
 */

export {
  getServiceCatalog,
  getServiceBySlug,
  getServiceById,
  getServiceSlugs,
  getServicesByTrade,
  getServiceOptions,
  clearCatalogCache,
  type CatalogService,
  type ProcessStep,
  type CostFactor,
  type FAQ,
} from './catalog';

export {
  SERVICE_SLUG_MAPPINGS,
  SERVICE_ICONS,
  getUrlSlugForService,
  getIconForService,
} from './slug-mappings';
