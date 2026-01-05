import { z } from 'zod';

export const showBusinessSearchResultsSchema = z.object({
  businessName: z.string().describe('The business name to search for'),
  location: z.string().describe('City and state/province (e.g., "Denver, CO")'),
});

export const confirmBusinessSchema = z.object({
  googlePlaceId: z.string().describe('Google Place ID of the confirmed business'),
  businessName: z.string().describe('Confirmed business name'),
  address: z.string().optional().describe('Street address from the listing'),
  city: z.string().optional().describe('City from the listing'),
  state: z.string().optional().describe('State/province from the listing'),
  phone: z.string().optional().describe('Phone from the listing'),
  website: z.string().optional().describe('Website from the listing'),
  category: z.string().optional().describe('Category from the listing'),
});

export const saveProfileSchema = z.object({
  businessName: z.string().describe('Business name'),
  address: z.string().describe('Street address'),
  phone: z.string().describe('Public phone number'),
  website: z.string().optional().describe('Website URL'),
  city: z.string().describe('City'),
  state: z.string().describe('State/province code'),
  description: z.string().optional().describe('Business description'),
  services: z.array(z.string()).describe('Services offered'),
  serviceAreas: z.array(z.string()).optional().describe('Service areas'),
});

export const webSearchBusinessSchema = z.object({
  businessName: z.string().describe('Business name to search for'),
  location: z.string().optional().describe('City and state/province (e.g., "Denver, CO")'),
});

export const showProfileRevealSchema = z.object({
  businessName: z.string().describe('The business name'),
  address: z.string().describe('Full street address'),
  city: z.string().describe('City'),
  state: z.string().describe('State/province code'),
  phone: z.string().optional().describe('Phone number'),
  website: z.string().optional().describe('Website URL'),
  services: z.array(z.string()).describe('List of services offered'),
  rating: z.number().optional().describe('Google rating (1-5)'),
  reviewCount: z.number().optional().describe('Number of Google reviews'),
  celebrationMessage: z.string().describe('A short, enthusiastic message celebrating the business (1-2 sentences)'),
});
