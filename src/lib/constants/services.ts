/**
 * Masonry services offered by contractors.
 * Used in profile setup and project categorization.
 */
export const MASONRY_SERVICES = [
  { id: 'chimney-repair', label: 'Chimney Repair & Rebuild', icon: '🏠' },
  { id: 'tuckpointing', label: 'Tuckpointing & Repointing', icon: '🧱' },
  { id: 'brick-repair', label: 'Brick Repair & Replacement', icon: '🔧' },
  { id: 'stone-work', label: 'Stone Work & Veneer', icon: '🪨' },
  { id: 'retaining-walls', label: 'Retaining Walls', icon: '🧱' },
  { id: 'concrete-work', label: 'Concrete Work', icon: '🏗️' },
  { id: 'foundation-repair', label: 'Foundation Repair', icon: '🏚️' },
  { id: 'fireplace', label: 'Fireplace Construction', icon: '🔥' },
  { id: 'outdoor-living', label: 'Outdoor Living Spaces', icon: '🌳' },
  { id: 'commercial', label: 'Commercial Masonry', icon: '🏢' },
  { id: 'restoration', label: 'Historic Restoration', icon: '🏛️' },
  { id: 'waterproofing', label: 'Waterproofing & Sealing', icon: '💧' },
  { id: 'efflorescence-removal', label: 'Efflorescence Removal', icon: '✨' },
] as const;

export type ServiceId = typeof MASONRY_SERVICES[number]['id'];

/**
 * US States for contractor location.
 */
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
] as const;

/**
 * Canadian Provinces and Territories for contractor location.
 */
export const CANADIAN_PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' },
] as const;

/**
 * Combined regions (US States + Canadian Provinces) for contractor location.
 * Grouped by country for better UX in dropdowns.
 */
export const REGIONS = [
  { group: 'United States', items: US_STATES },
  { group: 'Canada', items: CANADIAN_PROVINCES },
] as const;

export type StateCode = typeof US_STATES[number]['value'];
export type ProvinceCode = typeof CANADIAN_PROVINCES[number]['value'];
export type RegionCode = StateCode | ProvinceCode;

/**
 * Re-export service content for SEO pages.
 * @see ./service-content.ts for detailed service descriptions
 */
export {
  SERVICE_CONTENT,
  getServiceContent,
  getAllServiceContent,
  getPriorityServices,
  type ServiceContent,
  type ServiceFAQ,
} from './service-content';

/**
 * Get service label by ID.
 */
export function getServiceLabel(serviceId: ServiceId): string {
  const service = MASONRY_SERVICES.find((s) => s.id === serviceId);
  return service?.label || serviceId;
}

/**
 * Get all service IDs.
 */
export function getAllServiceIds(): ServiceId[] {
  return MASONRY_SERVICES.map((s) => s.id);
}

/**
 * Check if a string is a valid service ID.
 */
export function isValidServiceId(id: string): id is ServiceId {
  return MASONRY_SERVICES.some((s) => s.id === id);
}
