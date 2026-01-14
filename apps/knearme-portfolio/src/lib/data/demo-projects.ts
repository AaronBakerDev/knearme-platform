/**
 * Demo project data for the Examples page.
 *
 * These are realistic examples that showcase what contractors can create.
 * Used when slug starts with "demo-" to avoid database lookup.
 *
 * @see /src/app/(public)/[city]/masonry/[type]/[slug]/page.tsx
 * @see /src/app/(public)/examples/page.tsx
 */

export interface DemoProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  description_blocks: Array<{
    type: 'paragraph' | 'heading' | 'list';
    content?: string;
    items?: string[];
    level?: number;
  }>;
  city: string;
  city_slug: string;
  state: string;
  neighborhood?: string;
  project_type: string;
  project_type_slug: string;
  tags: string[];
  materials: string[];
  techniques: string[];
  duration: string;
  published_at: string;
  seo_title: string;
  seo_description: string;
  contractor: {
    id: string;
    business_name: string;
    city: string;
    city_slug: string;
    state: string;
    services: string[];
    profile_photo_url?: string;
  };
  images: Array<{
    id: string;
    url: string;
    alt_text: string;
    display_order: number;
  }>;
}

/**
 * Demo projects keyed by their full path: city/type/slug
 */
export const DEMO_PROJECTS: Record<string, DemoProject> = {
  'denver-co/chimney-repair/demo-historic-brick-rebuild': {
    id: 'demo-1',
    slug: 'demo-historic-brick-rebuild',
    title: 'Historic Brick Chimney Full Rebuild',
    description: `This 1920s brick chimney had severe deterioration after nearly a century of Colorado weather. The homeowner wanted to preserve the home's historic character while ensuring the chimney would last another hundred years.

We carefully documented the original brick pattern and mortar color before beginning demolition. The tear-down revealed the flue liner had completely failed, which explained the moisture problems the homeowner had been experiencing.

The rebuild used reclaimed period-appropriate brick matched to the original, with a custom-mixed mortar to replicate the historic color. We installed a new stainless steel flue liner and modern crown to prevent future water intrusion.`,
    description_blocks: [
      {
        type: 'heading',
        content: 'The Challenge',
        level: 2,
      },
      {
        type: 'paragraph',
        content: 'This 1920s brick chimney had severe deterioration after nearly a century of Colorado weather. The homeowner wanted to preserve the home\'s historic character while ensuring the chimney would last another hundred years.',
      },
      {
        type: 'heading',
        content: 'Our Approach',
        level: 2,
      },
      {
        type: 'paragraph',
        content: 'We carefully documented the original brick pattern and mortar color before beginning demolition. The tear-down revealed the flue liner had completely failed, which explained the moisture problems the homeowner had been experiencing.',
      },
      {
        type: 'heading',
        content: 'The Result',
        level: 2,
      },
      {
        type: 'paragraph',
        content: 'The rebuild used reclaimed period-appropriate brick matched to the original, with a custom-mixed mortar to replicate the historic color. We installed a new stainless steel flue liner and modern crown to prevent future water intrusion.',
      },
      {
        type: 'list',
        items: [
          'Matched 100-year-old brick color and style',
          'New clay flue liner for improved draft',
          'Stainless steel crown and cap for longevity',
          '10-year warranty on all workmanship',
        ],
      },
    ],
    city: 'Denver',
    city_slug: 'denver-co',
    state: 'CO',
    neighborhood: 'Washington Park',
    project_type: 'Chimney Repair',
    project_type_slug: 'chimney-repair',
    tags: ['historic restoration', 'brick chimney', 'flue liner', 'chimney rebuild', 'Denver'],
    materials: [
      'Reclaimed period brick (circa 1920)',
      'Type S mortar with custom color match',
      'Stainless steel flue liner',
      'Concrete crown with drip edge',
      'Stainless steel chimney cap',
    ],
    techniques: [
      'Historic brick matching',
      'Custom mortar color mixing',
      'Full chimney tear-down and rebuild',
      'Flue liner installation',
      'Waterproof crown construction',
    ],
    duration: '5 days',
    published_at: '2024-11-15T10:00:00Z',
    seo_title: 'Historic Brick Chimney Rebuild in Washington Park, Denver | Rocky Mountain Masonry',
    seo_description: 'Complete tear-down and rebuild of a 1920s brick chimney in Denver\'s Washington Park neighborhood. Period-appropriate brick, new flue liner, 10-year warranty.',
    contractor: {
      id: 'demo-contractor-1',
      business_name: 'Rocky Mountain Masonry',
      city: 'Denver',
      city_slug: 'denver-co',
      state: 'CO',
      services: ['Chimney Repair', 'Tuckpointing', 'Historic Restoration'],
    },
    images: [
      {
        id: 'img-1',
        url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Historic brick home in Denver before chimney rebuild',
        display_order: 0,
      },
      {
        id: 'img-2',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Chimney rebuild in progress showing new brick courses',
        display_order: 1,
      },
      {
        id: 'img-3',
        url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Completed chimney rebuild with new crown and cap',
        display_order: 2,
      },
    ],
  },

  'lakewood-co/foundation-repair/demo-basement-waterproofing': {
    id: 'demo-2',
    slug: 'demo-basement-waterproofing',
    title: 'Foundation Crack Repair & Basement Waterproofing',
    description: `The homeowners had dealt with water in their basement for years. Every heavy rain brought puddles, and they'd noticed cracks spreading across the foundation walls. They were worried about structural damage and tired of the musty smell.

Our inspection revealed 12 significant cracks, some showing active water intrusion. The exterior grade was also sloping toward the house, directing water right at the foundation.

We used low-pressure epoxy injection to seal all cracks from the inside, then excavated the exterior to apply a waterproof membrane. A new French drain system directs water away from the foundation to a sump pump.`,
    description_blocks: [
      {
        type: 'heading',
        content: 'The Problem',
        level: 2,
      },
      {
        type: 'paragraph',
        content: 'The homeowners had dealt with water in their basement for years. Every heavy rain brought puddles, and they\'d noticed cracks spreading across the foundation walls. They were worried about structural damage and tired of the musty smell.',
      },
      {
        type: 'heading',
        content: 'What We Found',
        level: 2,
      },
      {
        type: 'paragraph',
        content: 'Our inspection revealed 12 significant cracks, some showing active water intrusion. The exterior grade was also sloping toward the house, directing water right at the foundation.',
      },
      {
        type: 'heading',
        content: 'The Solution',
        level: 2,
      },
      {
        type: 'paragraph',
        content: 'We used low-pressure epoxy injection to seal all cracks from the inside, then excavated the exterior to apply a waterproof membrane. A new French drain system directs water away from the foundation to a sump pump.',
      },
      {
        type: 'list',
        items: [
          'Epoxy injection on all 12 foundation cracks',
          'Exterior waterproof membrane applied',
          'French drain system installed',
          'Grade corrected to slope away from home',
          'Lifetime transferable warranty included',
        ],
      },
    ],
    city: 'Lakewood',
    city_slug: 'lakewood-co',
    state: 'CO',
    neighborhood: 'Green Mountain',
    project_type: 'Foundation Repair',
    project_type_slug: 'foundation-repair',
    tags: ['foundation repair', 'waterproofing', 'basement', 'crack repair', 'French drain'],
    materials: [
      'Polyurethane crack injection resin',
      'Carbon fiber reinforcement strips',
      'Bituminous waterproof membrane',
      'Drainage board',
      'Perforated drain pipe',
      'Washed gravel',
    ],
    techniques: [
      'Low-pressure epoxy injection',
      'Exterior excavation',
      'Membrane waterproofing',
      'French drain installation',
      'Grade correction',
    ],
    duration: '4 days',
    published_at: '2024-10-20T10:00:00Z',
    seo_title: 'Foundation Crack Repair & Waterproofing in Lakewood, CO | Keystone Foundation',
    seo_description: 'Basement waterproofing and foundation crack repair in Lakewood. Epoxy injection, exterior membrane, French drain. Lifetime warranty.',
    contractor: {
      id: 'demo-contractor-2',
      business_name: 'Keystone Foundation Services',
      city: 'Lakewood',
      city_slug: 'lakewood-co',
      state: 'CO',
      services: ['Foundation Repair', 'Waterproofing', 'Structural Repair'],
    },
    images: [
      {
        id: 'img-4',
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Foundation wall showing cracks before repair',
        display_order: 0,
      },
      {
        id: 'img-5',
        url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Epoxy injection process on foundation crack',
        display_order: 1,
      },
      {
        id: 'img-6',
        url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Completed waterproofing with dry basement',
        display_order: 2,
      },
    ],
  },

  'aurora-co/tuckpointing/demo-commercial-repoint': {
    id: 'demo-3',
    slug: 'demo-commercial-repoint',
    title: 'Commercial Building Full Tuckpointing',
    description: `This 1965 commercial building's west-facing wall had taken a beating from decades of afternoon sun and wind-driven rain. The mortar joints had eroded to the point where you could push a finger into them in some spots.

The property manager was getting complaints from tenants about drafts and had concerns about water getting into the wall cavity. A full tuckpointing was the only solution.

We set up scaffolding and systematically removed deteriorated mortar to a depth of 3/4 inch across all 2,400 square feet of wall surface. The new Type S mortar was color-matched to the original, and we finished with a concave joint profile for maximum weather resistance.`,
    description_blocks: [
      {
        type: 'heading',
        content: 'Scope of Work',
        level: 2,
      },
      {
        type: 'paragraph',
        content: 'This 1965 commercial building\'s west-facing wall had taken a beating from decades of afternoon sun and wind-driven rain. The mortar joints had eroded to the point where you could push a finger into them in some spots.',
      },
      {
        type: 'heading',
        content: 'Why It Mattered',
        level: 2,
      },
      {
        type: 'paragraph',
        content: 'The property manager was getting complaints from tenants about drafts and had concerns about water getting into the wall cavity. A full tuckpointing was the only solution.',
      },
      {
        type: 'heading',
        content: 'How We Did It',
        level: 2,
      },
      {
        type: 'paragraph',
        content: 'We set up scaffolding and systematically removed deteriorated mortar to a depth of 3/4 inch across all 2,400 square feet of wall surface. The new Type S mortar was color-matched to the original, and we finished with a concave joint profile for maximum weather resistance.',
      },
    ],
    city: 'Aurora',
    city_slug: 'aurora-co',
    state: 'CO',
    project_type: 'Tuckpointing',
    project_type_slug: 'tuckpointing',
    tags: ['tuckpointing', 'commercial', 'mortar repair', 'brick restoration', 'repointing'],
    materials: [
      'Type S mortar',
      'Custom color-matched pigment',
      'Bonding agent',
      'Backer rod for deep joints',
    ],
    techniques: [
      'Mechanical mortar removal',
      'Hand grinding for delicate areas',
      'Color matching',
      'Concave joint tooling',
      'Proper curing with misting',
    ],
    duration: '8 days',
    published_at: '2024-09-10T10:00:00Z',
    seo_title: 'Commercial Tuckpointing in Aurora, CO | Heritage Brickwork',
    seo_description: 'Full tuckpointing of 2,400 sq ft commercial building in Aurora. Color-matched mortar, Type S for durability, professional scaffolding.',
    contractor: {
      id: 'demo-contractor-3',
      business_name: 'Heritage Brickwork',
      city: 'Aurora',
      city_slug: 'aurora-co',
      state: 'CO',
      services: ['Tuckpointing', 'Brick Repair', 'Historic Restoration'],
    },
    images: [
      {
        id: 'img-7',
        url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Commercial brick building before tuckpointing',
        display_order: 0,
      },
      {
        id: 'img-8',
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Scaffolding setup for commercial tuckpointing',
        display_order: 1,
      },
      {
        id: 'img-9',
        url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Completed tuckpointing with fresh mortar joints',
        display_order: 2,
      },
    ],
  },

  'boulder-co/stone-masonry/demo-retaining-wall': {
    id: 'demo-4',
    slug: 'demo-retaining-wall',
    title: 'Natural Stone Retaining Wall',
    description: `The homeowner had a steep slope in their backyard that was eroding and unusable. They wanted a solution that looked natural, not like a concrete block wall, and could handle the Colorado freeze-thaw cycles.

We designed a dry-stack retaining wall using locally-sourced Colorado sandstone. Dry-stack construction allows the wall to flex slightly with ground movement, which is crucial in our climate.

The finished wall is 45 linear feet, reaching 4 feet at the tallest point. We incorporated planting pockets throughout for native grasses and left conduit for future landscape lighting.`,
    description_blocks: [
      {
        type: 'heading',
        content: 'The Vision',
        level: 2,
      },
      {
        type: 'paragraph',
        content: 'The homeowner had a steep slope in their backyard that was eroding and unusable. They wanted a solution that looked natural, not like a concrete block wall, and could handle the Colorado freeze-thaw cycles.',
      },
      {
        type: 'heading',
        content: 'Design Approach',
        level: 2,
      },
      {
        type: 'paragraph',
        content: 'We designed a dry-stack retaining wall using locally-sourced Colorado sandstone. Dry-stack construction allows the wall to flex slightly with ground movement, which is crucial in our climate.',
      },
      {
        type: 'heading',
        content: 'Final Result',
        level: 2,
      },
      {
        type: 'paragraph',
        content: 'The finished wall is 45 linear feet, reaching 4 feet at the tallest point. We incorporated planting pockets throughout for native grasses and left conduit for future landscape lighting.',
      },
      {
        type: 'list',
        items: [
          '45 linear feet of natural stone wall',
          'Locally-sourced Colorado sandstone',
          'Dry-stack construction for flexibility',
          'Integrated drainage behind wall',
          'Planting pockets for landscaping',
        ],
      },
    ],
    city: 'Boulder',
    city_slug: 'boulder-co',
    state: 'CO',
    neighborhood: 'Chautauqua',
    project_type: 'Stone Masonry',
    project_type_slug: 'stone-masonry',
    tags: ['retaining wall', 'natural stone', 'sandstone', 'dry stack', 'landscaping'],
    materials: [
      'Colorado sandstone (locally quarried)',
      'Crushed gravel base',
      'Landscape fabric',
      'Perforated drain pipe',
      'Native grass seeds',
    ],
    techniques: [
      'Dry-stack stone construction',
      'Batter (setback) for stability',
      'Integrated drainage',
      'Natural stone selection and fitting',
      'Planting pocket creation',
    ],
    duration: '6 days',
    published_at: '2024-08-25T10:00:00Z',
    seo_title: 'Natural Stone Retaining Wall in Boulder, CO | Summit Stone Works',
    seo_description: 'Custom dry-stack retaining wall in Boulder using local Colorado sandstone. 45 linear feet, integrated drainage, native plantings.',
    contractor: {
      id: 'demo-contractor-4',
      business_name: 'Summit Stone Works',
      city: 'Boulder',
      city_slug: 'boulder-co',
      state: 'CO',
      services: ['Stone Masonry', 'Retaining Walls', 'Outdoor Living'],
    },
    images: [
      {
        id: 'img-10',
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Steep slope before retaining wall installation',
        display_order: 0,
      },
      {
        id: 'img-11',
        url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Stone selection and wall construction in progress',
        display_order: 1,
      },
      {
        id: 'img-12',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=80',
        alt_text: 'Completed natural stone retaining wall with plantings',
        display_order: 2,
      },
    ],
  },
};

/**
 * Get a demo project by its URL path components.
 * Returns undefined if not a demo project.
 */
export function getDemoProject(city: string, type: string, slug: string): DemoProject | undefined {
  const key = `${city}/${type}/${slug}`;
  return DEMO_PROJECTS[key];
}

/**
 * Check if a slug is a demo project slug.
 */
export function isDemoSlug(slug: string): boolean {
  return slug.startsWith('demo-');
}

/**
 * Get all demo projects for the examples page.
 */
export function getAllDemoProjects(): DemoProject[] {
  return Object.values(DEMO_PROJECTS);
}
