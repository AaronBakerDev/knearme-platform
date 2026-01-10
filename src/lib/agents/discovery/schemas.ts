import { z } from 'zod';

export const showBusinessSearchResultsSchema = z.object({
  businessName: z.string().describe('The business name to search for'),
  location: z.string().describe('City and state/province (e.g., "Denver, CO")'),
});

export const confirmBusinessSchema = z.object({
  googlePlaceId: z.string().describe('Google Place ID of the confirmed business'),
  googleCid: z.string().optional().describe('Google CID (customer ID) for fetching reviews'),
  businessName: z.string().describe('Confirmed business name'),
  address: z.string().optional().describe('Street address from the listing'),
  city: z.string().optional().describe('City from the listing'),
  state: z.string().optional().describe('State/province from the listing'),
  phone: z.string().optional().describe('Phone from the listing'),
  website: z.string().optional().describe('Website from the listing'),
  category: z.string().optional().describe('Category from the listing'),
  rating: z.number().optional().describe('Google rating (1-5)'),
  reviewCount: z.number().optional().describe('Number of Google reviews'),
});

export const fetchReviewsSchema = z.object({
  googleCid: z.string().describe('Google CID (customer ID) from the confirmed business'),
  maxReviews: z.number().optional().describe('Maximum number of reviews to fetch (default: 10)'),
});

export const saveProfileSchema = z.object({
  businessName: z.string().describe('Business name'),
  address: z.string().optional().describe('Street address (optional for service-area businesses)'),
  phone: z.string().describe('Public phone number'),
  website: z.string().optional().describe('Website URL'),
  city: z.string().describe('City'),
  state: z.string().describe('State/province code'),
  description: z.string().optional().describe('Business description'),
  services: z.array(z.string()).describe('Services offered'),
  serviceAreas: z.array(z.string()).optional().describe('Service areas'),
  hideAddress: z.boolean().optional().describe('True if service-area business - do not collect or display address'),
});

export const webSearchBusinessSchema = z.object({
  businessName: z.string().describe('Business name to search for'),
  location: z.string().optional().describe('City and state/province (e.g., "Denver, CO")'),
});

/**
 * Schema for showProfileReveal tool - the "wow" moment artifact.
 * Includes bio, highlights, and project suggestions for maximum delight.
 *
 * @see /docs/specs/typeform-onboarding-spec.md - Phase 5: Reveal Artifact
 */
export const showProfileRevealSchema = z.object({
  businessName: z.string().describe('The business name'),
  address: z.string().optional().describe('Street address (omit for service-area businesses)'),
  city: z.string().describe('City'),
  state: z.string().describe('State/province code'),
  phone: z.string().optional().describe('Phone number'),
  website: z.string().optional().describe('Website URL'),
  services: z.array(z.string()).describe('List of services offered'),
  rating: z.number().optional().describe('Google rating (1-5)'),
  reviewCount: z.number().optional().describe('Number of Google reviews'),
  celebrationMessage: z.string().describe('A short, enthusiastic message celebrating the business (1-2 sentences)'),
  bio: z.string().optional().describe('AI-generated bio synthesized from reviews and web content'),
  highlights: z.array(z.string()).optional().describe('2-3 best review quotes'),
  yearsInBusiness: z.string().optional().describe('Years in business if discovered (e.g., "20 years")'),
  projectSuggestions: z.array(z.object({
    title: z.string().describe('Suggested project title'),
    description: z.string().optional().describe('Brief description or context'),
    source: z.enum(['review', 'web']).describe('Source of the suggestion'),
    imageUrls: z.array(z.string()).optional().describe('Image URLs if available'),
  })).optional().describe('Project suggestions from reviews with photos or web portfolio'),
  hideAddress: z.boolean().optional().describe('If true, do not display street address in reveal (service-area business)'),
});
