/**
 * Product Structured Data Schema Generators
 *
 * Generates JSON-LD Product schema for SaaS pricing tiers.
 * Used on the landing page pricing section for rich results in Google.
 *
 * @see https://schema.org/Product
 * @see https://schema.org/Offer
 * @see PAY-025 in PRD for acceptance criteria
 */
import { SITE_URL } from './constants';

/**
 * Pricing tier structure for schema generation
 */
interface PricingTierInput {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features?: Array<{ text: string }>;
  ctaLink?: string;
}

/**
 * Generate Product schema for a single pricing tier.
 *
 * For SaaS products, each pricing tier is represented as a separate Product
 * with Offer details including price and billing frequency.
 *
 * @param tier - Pricing tier data
 * @param siteUrl - Base site URL
 * @returns JSON-LD Product schema object
 */
export function generateProductSchema(
  tier: PricingTierInput,
  siteUrl: string = SITE_URL
): Record<string, unknown> {
  const offers: Record<string, unknown>[] = [];

  // Monthly offer (if not free)
  if (tier.monthlyPrice > 0) {
    offers.push({
      '@type': 'Offer',
      name: `${tier.name} - Monthly`,
      price: tier.monthlyPrice.toFixed(2),
      priceCurrency: 'USD',
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}${tier.ctaLink || '/signup'}`,
      eligibleRegion: {
        '@type': 'Place',
        name: 'United States',
      },
    });
  }

  // Yearly offer (if not free)
  if (tier.yearlyPrice > 0) {
    offers.push({
      '@type': 'Offer',
      name: `${tier.name} - Annual`,
      price: tier.yearlyPrice.toFixed(2),
      priceCurrency: 'USD',
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}${tier.ctaLink || '/signup'}`,
      eligibleRegion: {
        '@type': 'Place',
        name: 'United States',
      },
    });
  }

  // Free tier
  if (tier.monthlyPrice === 0) {
    offers.push({
      '@type': 'Offer',
      name: `${tier.name}`,
      price: '0.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}${tier.ctaLink || '/signup'}`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${siteUrl}/#product-${tier.id}`,
    name: `KnearMe ${tier.name}`,
    description: tier.description || `${tier.name} plan for contractor portfolio management`,
    brand: {
      '@type': 'Brand',
      name: 'KnearMe',
    },
    category: 'Software > Business Software > Portfolio Management',
    offers: offers.length === 1 ? offers[0] : offers,
    // Include feature list as product description details
    ...(tier.features && tier.features.length > 0 && {
      additionalProperty: tier.features.map((feature, index) => ({
        '@type': 'PropertyValue',
        name: `Feature ${index + 1}`,
        value: feature.text,
      })),
    }),
  };
}

/**
 * Generate aggregated Product schema for all pricing tiers.
 *
 * Creates a single JSON-LD block with all pricing tiers as separate
 * Product entries within a graph structure.
 *
 * @param tiers - Array of pricing tier data
 * @param siteUrl - Base site URL
 * @returns JSON-LD with @graph containing all product schemas
 */
export function generatePricingSchema(
  tiers: PricingTierInput[],
  siteUrl: string = SITE_URL
): Record<string, unknown> {
  const products = tiers.map((tier) => {
    // Generate product without @context (it's at the root level)
    const product = generateProductSchema(tier, siteUrl);
    const { '@context': context, ...productWithoutContext } = product;
    // context is intentionally discarded - it's added at the root level
    void context;
    return productWithoutContext;
  });

  return {
    '@context': 'https://schema.org',
    '@graph': products,
  };
}
