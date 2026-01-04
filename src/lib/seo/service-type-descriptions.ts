/**
 * City service descriptions for masonry service-type pages.
 *
 * Kept separate from SERVICE_CONTENT intentionally.
 * City pages need editorial control over headlines/features that differ
 * from national service pages.
 *
 * Variables available in description strings: {city}, {state}, {projectCount}, {contractorCount}
 */

export type ServiceTypeDescription = {
  headline: string;
  description: string;
  features: string[];
};

export const SERVICE_TYPE_DESCRIPTIONS: Record<string, ServiceTypeDescription> = {
  'chimney-repair': {
    headline: 'Professional Chimney Repair & Rebuild Services',
    description:
      'Find expert chimney repair contractors in {city}. From minor mortar repairs to complete chimney rebuilds, browse completed projects and connect with local masonry professionals who specialize in chimney restoration.',
    features: [
      'Chimney cap installation',
      'Crown repair',
      'Flashing repair',
      'Tuckpointing',
      'Complete rebuilds',
    ],
  },
  'tuckpointing': {
    headline: 'Expert Tuckpointing & Repointing Services',
    description:
      "Browse tuckpointing projects in {city} to see the quality of work from local masonry contractors. Tuckpointing restores the mortar joints between bricks, preventing water damage and improving your home's appearance.",
    features: [
      'Mortar joint repair',
      'Historic preservation',
      'Color matching',
      'Structural reinforcement',
      'Weather sealing',
    ],
  },
  'brick-repair': {
    headline: 'Brick Repair & Replacement Specialists',
    description:
      'Need brick repair in {city}? Browse completed brick repair and replacement projects from local contractors. From cracked bricks to full wall restorations, find the right mason for your project.',
    features: [
      'Crack repair',
      'Brick replacement',
      'Spalling repair',
      'Efflorescence removal',
      'Brick cleaning',
    ],
  },
  'stone-work': {
    headline: 'Stone Work & Veneer Installation',
    description:
      'Explore stone masonry projects in {city}. Natural stone and veneer add timeless beauty to any property. See how local contractors transform homes with expert stone installation.',
    features: [
      'Natural stone installation',
      'Stone veneer',
      'Flagstone patios',
      'Stone columns',
      'Decorative accents',
    ],
  },
  'retaining-walls': {
    headline: 'Professional Retaining Wall Construction',
    description:
      'Looking for retaining wall contractors in {city}? Browse completed retaining wall projects that combine structural engineering with aesthetic design to manage slopes and create usable outdoor spaces.',
    features: [
      'Block retaining walls',
      'Stone retaining walls',
      'Drainage solutions',
      'Tiered walls',
      'Landscaping integration',
    ],
  },
  'concrete-work': {
    headline: 'Quality Concrete Work & Construction',
    description:
      'Find concrete contractors in {city} who deliver quality results. From driveways to patios, browse completed concrete projects and see the craftsmanship of local professionals.',
    features: [
      'Driveways',
      'Patios',
      'Sidewalks',
      'Foundations',
      'Decorative concrete',
    ],
  },
  'foundation-repair': {
    headline: 'Foundation Repair & Restoration',
    description:
      'Foundation problems require expert solutions. Browse foundation repair projects in {city} to find contractors experienced in stabilizing and restoring residential and commercial foundations.',
    features: [
      'Crack repair',
      'Wall stabilization',
      'Waterproofing',
      'Underpinning',
      'Structural assessment',
    ],
  },
  fireplace: {
    headline: 'Fireplace Construction & Restoration',
    description:
      'Add warmth and character to your home with expert fireplace construction in {city}. Browse fireplace projects from local masons who specialize in both traditional and modern designs.',
    features: [
      'Indoor fireplaces',
      'Outdoor fireplaces',
      'Fire pits',
      'Hearth construction',
      'Chimney integration',
    ],
  },
  'outdoor-living': {
    headline: 'Outdoor Living Space Construction',
    description:
      'Transform your backyard in {city} with professional outdoor living construction. Browse patios, outdoor kitchens, and more from local masonry contractors.',
    features: [
      'Outdoor kitchens',
      'Patios',
      'Pergola bases',
      'Built-in seating',
      'Fire features',
    ],
  },
  commercial: {
    headline: 'Commercial Masonry Services',
    description:
      'Browse commercial masonry projects in {city}. From storefront facades to large-scale construction, see how local contractors deliver quality workmanship on commercial properties.',
    features: [
      'Storefront construction',
      'Building facades',
      'Structural masonry',
      'ADA compliance',
      'Code compliance',
    ],
  },
  restoration: {
    headline: 'Historic Restoration & Preservation',
    description:
      'Historic buildings require specialized masonry skills. Browse restoration projects in {city} from contractors who understand preservation techniques and period-appropriate materials.',
    features: [
      'Historic preservation',
      'Period-accurate materials',
      'Landmark compliance',
      'Gentle cleaning',
      'Documentation',
    ],
  },
  waterproofing: {
    headline: 'Masonry Waterproofing & Sealing',
    description:
      'Protect your masonry investment with professional waterproofing in {city}. Browse completed sealing and waterproofing projects that extend the life of brick, stone, and concrete.',
    features: [
      'Brick sealing',
      'Basement waterproofing',
      'Foundation coating',
      'Drainage systems',
      'Moisture barriers',
    ],
  },
};
