/**
 * Directory category metadata for SEO-optimized category pages.
 * Each category provides unique content, FAQs, and service lists to avoid thin pages.
 *
 * @see https://knearme.com/directory for usage
 */

export interface DirectoryCategoryMeta {
  slug: string;
  name: string;
  pluralName: string;
  icon: string; // Lucide React icon name
  headline: string; // H1 template with {city} placeholder
  description: string; // Meta description template with {city}, {count} placeholders
  shortDescription: string; // Card description (1-2 sentences)
  services: string[]; // Common services offered in this category
  faqs: Array<{ question: string; answer: string }>;
  relatedCategories: string[]; // slugs of related categories
}

export const DIRECTORY_CATEGORIES: Record<string, DirectoryCategoryMeta> = {
  'masonry-contractor': {
    slug: 'masonry-contractor',
    name: 'Masonry Contractor',
    pluralName: 'Masonry Contractors',
    icon: 'Hammer',
    headline: 'Find Top-Rated Masonry Contractors in {city}',
    description: 'Browse {count} verified masonry contractors in {city}. Compare portfolios, read reviews, and hire local experts for brick, stone, and concrete work.',
    shortDescription: 'Expert brick, stone, and concrete work. Specializing in new construction, repair, and restoration projects.',
    services: [
      'Brick & Stone Veneer Installation',
      'Tuckpointing & Repointing',
      'Retaining Wall Construction',
      'Foundation Repair & Waterproofing',
      'Chimney Repair & Rebuild',
      'Patio & Walkway Installation',
    ],
    faqs: [
      {
        question: 'How much does masonry work typically cost?',
        answer: 'Masonry costs vary widely depending on the project scope and materials. Simple brick repairs may cost $500-$2,000, while full chimney rebuilds can range from $4,000-$15,000. Retaining walls typically cost $15-$50 per square foot installed. Always get 2-3 written estimates from licensed contractors before starting work.',
      },
      {
        question: 'How long does masonry work last?',
        answer: 'Quality masonry work is incredibly durable. Properly built brick and stone structures can last 100+ years with minimal maintenance. Mortar joints typically need repointing every 25-30 years. The longevity depends on material quality, installation craftsmanship, local climate, and regular maintenance.',
      },
      {
        question: 'What should I look for when hiring a masonry contractor?',
        answer: 'Key factors include: valid licenses and insurance, portfolio of similar completed projects, local references, detailed written estimates, and warranties on workmanship. Ask about their experience with your specific project type (e.g., historic restoration vs. new construction) and verify they pull proper permits.',
      },
    ],
    relatedCategories: ['concrete-contractor', 'chimney-services', 'stone-supplier', 'general-contractor'],
  },

  'chimney-sweep': {
    slug: 'chimney-sweep',
    name: 'Chimney Sweep',
    pluralName: 'Chimney Sweeps',
    icon: 'Flame',
    headline: 'Professional Chimney Sweeps in {city}',
    description: 'Find {count} certified chimney sweeps in {city}. Schedule annual cleanings, inspections, and maintenance to keep your fireplace safe and efficient.',
    shortDescription: 'Annual cleaning and inspection services to prevent chimney fires and carbon monoxide hazards.',
    services: [
      'Chimney Cleaning & Creosote Removal',
      'Video Inspection & Camera Services',
      'Chimney Cap Installation & Repair',
      'Damper Repair & Replacement',
      'Chimney Crown Waterproofing',
      'Dryer Vent Cleaning',
    ],
    faqs: [
      {
        question: 'How often should I have my chimney swept?',
        answer: 'The National Fire Protection Association (NFPA) recommends annual chimney inspections and cleaning as needed. If you use your fireplace regularly (2+ times per week during winter), annual cleaning is essential. Even if you rarely use your fireplace, annual inspections check for animal nests, debris, and structural issues.',
      },
      {
        question: 'What does a chimney sweep actually do?',
        answer: 'A professional chimney sweep removes creosote buildup (a flammable byproduct of wood burning), inspects the chimney structure for cracks or damage, checks the chimney cap and damper, and identifies any safety hazards. Modern sweeps use video cameras to inspect hard-to-see areas and provide documentation of chimney condition.',
      },
      {
        question: 'How much does chimney sweeping cost?',
        answer: 'Basic chimney sweeping typically costs $150-$300 depending on chimney height, accessibility, and creosote buildup level. Video inspections add $100-$200. If repairs are needed (caps, dampers, minor masonry), expect $200-$1,000 additional. Get quotes from CSIA-certified sweeps for best results.',
      },
    ],
    relatedCategories: ['chimney-services', 'fireplace-store', 'masonry-contractor', 'roofing-contractor'],
  },

  'chimney-services': {
    slug: 'chimney-services',
    name: 'Chimney Services',
    pluralName: 'Chimney Service Providers',
    icon: 'Home',
    headline: 'Complete Chimney Repair & Rebuilding in {city}',
    description: 'Compare {count} chimney service companies in {city}. Expert chimney repair, relining, rebuilding, and waterproofing from licensed contractors.',
    shortDescription: 'Comprehensive chimney repair, relining, rebuilding, and waterproofing services from licensed masonry professionals.',
    services: [
      'Chimney Rebuild & Reconstruction',
      'Chimney Liner Installation (Stainless/Clay)',
      'Chimney Flashing Repair & Replacement',
      'Brick & Mortar Restoration',
      'Chase Cover & Cap Replacement',
      'Chimney Waterproofing & Sealing',
    ],
    faqs: [
      {
        question: 'What is the difference between a chimney sweep and chimney services?',
        answer: 'Chimney sweeps focus on cleaning, inspection, and minor maintenance (caps, dampers). Chimney service companies handle structural repairs like masonry rebuilds, liner installation, flashing repair, and major waterproofing. For significant damage or safety issues identified during sweeping, you\'ll need a full-service chimney contractor.',
      },
      {
        question: 'How do I know if my chimney needs relining?',
        answer: 'Signs include: visible cracks in clay liner tiles, rust stains on chimney exterior, condensation issues, chimney fires, or chimneys over 30 years old. A video inspection will definitively show liner condition. Damaged liners pose serious carbon monoxide and fire risks, making relining a critical safety upgrade.',
      },
      {
        question: 'How much does chimney relining cost?',
        answer: 'Stainless steel chimney liner installation typically costs $2,500-$7,000 depending on chimney height, accessibility, and liner type. Clay tile relining costs $3,000-$10,000. Cast-in-place relining runs $4,000-$12,000. These investments significantly extend chimney life and improve safety and efficiency.',
      },
    ],
    relatedCategories: ['chimney-sweep', 'masonry-contractor', 'roofing-contractor', 'fireplace-store'],
  },

  'roofing-contractor': {
    slug: 'roofing-contractor',
    name: 'Roofing Contractor',
    pluralName: 'Roofing Contractors',
    icon: 'HardHat',
    headline: 'Trusted Roofing Contractors in {city}',
    description: 'Discover {count} licensed roofing contractors in {city}. Get free estimates for roof replacement, repair, and inspection services.',
    shortDescription: 'Professional roof installation, repair, and inspection for residential and commercial properties.',
    services: [
      'Roof Replacement (Asphalt, Metal, Tile)',
      'Roof Repair & Leak Detection',
      'Roof Inspection & Maintenance',
      'Gutter Installation & Repair',
      'Skylight Installation',
      'Emergency Storm Damage Repair',
    ],
    faqs: [
      {
        question: 'How long does a roof replacement take?',
        answer: 'Most residential roof replacements take 1-3 days for asphalt shingles, depending on roof size and complexity. Metal roofs may take 3-5 days, while tile or slate can take 5-10 days. Weather delays can extend timelines. Your contractor should provide a detailed schedule and protect your home during the project.',
      },
      {
        question: 'How often should I replace my roof?',
        answer: 'Asphalt shingle roofs last 20-30 years, metal roofs 40-70 years, and tile/slate 50-100+ years. Age isn\'t the only factor—also consider: missing/damaged shingles, curling edges, granule loss, leaks, or visible daylight through the roof deck. Annual inspections help catch issues before full replacement is needed.',
      },
      {
        question: 'Should I repair or replace my roof?',
        answer: 'If your roof is under 15 years old with localized damage, repairs are often cost-effective. If it\'s over 20 years old with widespread issues (multiple leaks, extensive shingle damage), replacement is typically better. Get professional assessments from 2-3 licensed roofers to compare repair vs. replacement costs and expected lifespan.',
      },
    ],
    relatedCategories: ['general-contractor', 'chimney-services', 'masonry-contractor', 'construction-company'],
  },

  'concrete-contractor': {
    slug: 'concrete-contractor',
    name: 'Concrete Contractor',
    pluralName: 'Concrete Contractors',
    icon: 'Building2',
    headline: 'Expert Concrete Contractors in {city}',
    description: 'Browse {count} concrete contractors in {city}. Compare prices for driveways, patios, foundations, and decorative concrete work.',
    shortDescription: 'Driveway, patio, foundation, and decorative concrete installation with expert finishing and design.',
    services: [
      'Concrete Driveway Installation',
      'Stamped & Decorative Concrete',
      'Foundation Pouring & Repair',
      'Concrete Patio & Walkway',
      'Concrete Resurfacing & Repair',
      'Garage Floor & Basement Slabs',
    ],
    faqs: [
      {
        question: 'How much does a concrete driveway cost?',
        answer: 'Standard concrete driveways cost $6-$12 per square foot installed. For a typical 2-car driveway (400-600 sq ft), expect $2,400-$7,200. Decorative options like stamped or colored concrete add $2-$8 per sq ft. Factors include site prep, thickness, rebar reinforcement, and finish complexity. Get itemized quotes from 3 contractors.',
      },
      {
        question: 'How long does concrete need to cure?',
        answer: 'Concrete reaches initial set in 24-48 hours but requires 28 days to reach full strength. You can walk on it after 24 hours and drive on driveways after 7 days. Avoid heavy loads during the full cure period. Proper curing (keeping concrete moist) is critical for strength and preventing cracks.',
      },
      {
        question: 'Why does concrete crack and how can I prevent it?',
        answer: 'Concrete cracks from shrinkage, freeze-thaw cycles, poor subgrade prep, or insufficient reinforcement. Prevention includes: proper site grading and compaction, adequate rebar or wire mesh, control joints every 8-10 feet, appropriate concrete mix for climate, and proper curing. Quality contractors address all these factors during installation.',
      },
    ],
    relatedCategories: ['masonry-contractor', 'general-contractor', 'stone-supplier', 'construction-company'],
  },

  'general-contractor': {
    slug: 'general-contractor',
    name: 'General Contractor',
    pluralName: 'General Contractors',
    icon: 'HardHat',
    headline: 'Licensed General Contractors in {city}',
    description: 'Find {count} general contractors in {city}. Full-service remodeling, additions, and renovation project management from trusted GCs.',
    shortDescription: 'Complete renovation project management, from permits to final inspection. Coordinate all trades for seamless execution.',
    services: [
      'Home Remodeling & Renovations',
      'Kitchen & Bathroom Remodels',
      'Home Additions & Extensions',
      'Project Management & Coordination',
      'Permit & Code Compliance',
      'Whole-House Renovations',
    ],
    faqs: [
      {
        question: 'What does a general contractor do?',
        answer: 'General contractors manage the entire construction project: obtain permits, hire and coordinate subcontractors (electricians, plumbers, carpenters), source materials, ensure code compliance, manage timeline and budget, and handle inspections. They serve as the single point of contact between homeowners and the construction process.',
      },
      {
        question: 'How much do general contractors charge?',
        answer: 'GCs typically charge 10-20% of total project cost as a markup (covering overhead and profit), or a flat project management fee of $3,000-$10,000+ for smaller projects. For a $50,000 kitchen remodel, expect $5,000-$10,000 in GC fees. Their value includes project coordination, problem-solving, and ensuring quality workmanship.',
      },
      {
        question: 'Do I need a general contractor or can I hire trades directly?',
        answer: 'For simple single-trade projects (replacing a water heater), hiring directly may work. For multi-trade projects (kitchen remodel, addition), a GC is invaluable: they coordinate schedules, ensure proper sequencing, handle permit issues, and provide warranty protection. GCs also have established relationships with quality subcontractors.',
      },
    ],
    relatedCategories: ['masonry-contractor', 'roofing-contractor', 'concrete-contractor', 'construction-company'],
  },

  'fireplace-store': {
    slug: 'fireplace-store',
    name: 'Fireplace Store',
    pluralName: 'Fireplace Stores',
    icon: 'Flame',
    headline: 'Fireplace Showrooms & Installers in {city}',
    description: 'Explore {count} fireplace stores in {city}. Shop gas, wood, and electric fireplaces with professional installation services.',
    shortDescription: 'Fireplace sales and installation for gas, wood-burning, electric, and pellet stove systems.',
    services: [
      'Gas Fireplace Sales & Installation',
      'Wood-Burning Fireplace Units',
      'Electric Fireplace Installation',
      'Fireplace Insert Retrofits',
      'Pellet Stove Sales & Service',
      'Custom Mantel & Surround Design',
    ],
    faqs: [
      {
        question: 'What type of fireplace is most efficient?',
        answer: 'Gas fireplaces are most efficient (70-85% heat output) and convenient. Wood-burning inserts in existing fireplaces reach 60-80% efficiency (vs. 10-20% for open hearths). Electric fireplaces are 99% efficient at converting electricity to heat but have higher operating costs. Pellet stoves offer 70-85% efficiency with renewable fuel.',
      },
      {
        question: 'How much does fireplace installation cost?',
        answer: 'Gas fireplace installation costs $3,000-$7,000 including unit and venting. Electric fireplaces are $500-$3,000 (mostly unit cost, minimal install). Wood-burning fireplace inserts run $2,500-$6,000. Full masonry fireplace builds cost $10,000-$25,000+. Venting requirements and existing chimney condition significantly impact costs.',
      },
      {
        question: 'Can I convert my wood-burning fireplace to gas?',
        answer: 'Yes, in most cases. Options include: gas log sets ($300-$1,200, keep existing chimney), gas inserts ($2,000-$5,000, sealed system with better efficiency), or full conversion ($3,000-$7,000, requires gas line and venting). A professional assessment determines the best approach based on chimney condition and gas line proximity.',
      },
    ],
    relatedCategories: ['chimney-services', 'chimney-sweep', 'masonry-contractor', 'general-contractor'],
  },

  'stone-supplier': {
    slug: 'stone-supplier',
    name: 'Stone Supplier',
    pluralName: 'Stone Suppliers',
    icon: 'Mountain',
    headline: 'Natural Stone & Paver Suppliers in {city}',
    description: 'Compare {count} stone suppliers in {city}. Source natural stone, pavers, landscape stone, and masonry materials for your project.',
    shortDescription: 'Natural stone, pavers, flagstone, and landscape materials for hardscaping and masonry projects.',
    services: [
      'Natural Stone (Flagstone, Bluestone, Slate)',
      'Paver Sales (Concrete, Brick, Travertine)',
      'Landscape & Decorative Stone',
      'Veneer Stone for Walls & Facades',
      'Stepping Stones & Edging Materials',
      'Delivery & Material Consultation',
    ],
    faqs: [
      {
        question: 'What is the best stone for outdoor patios?',
        answer: 'Flagstone, bluestone, and slate are top choices for patios due to durability and natural slip resistance. Flagstone (sedimentary) is cost-effective ($15-$30/sq ft) with rustic charm. Bluestone (denser) costs $25-$40/sq ft but handles freeze-thaw better. Travertine pavers ($15-$50/sq ft) offer a refined look. Consider local climate and aesthetic preferences.',
      },
      {
        question: 'How much stone do I need for my project?',
        answer: 'Calculate square footage (length × width) and add 10-15% for cuts and waste. For irregular flagstone, add 15-20%. Stone thickness matters: thin veneer (1-2") vs. full-depth (3-8"). Reputable suppliers offer calculators and on-site consultations. Bring project photos and dimensions for accurate estimates.',
      },
      {
        question: 'What is the difference between natural and manufactured stone?',
        answer: 'Natural stone is quarried (granite, limestone, slate) with unique patterns and higher cost ($15-$50+/sq ft). Manufactured/cast stone is concrete molded to resemble natural stone ($6-$15/sq ft), offering consistency and lighter weight. Natural stone is more durable long-term; manufactured stone works well for veneer applications where weight is a concern.',
      },
    ],
    relatedCategories: ['masonry-contractor', 'concrete-contractor', 'masonry-supply-store', 'general-contractor'],
  },

  'masonry-supply-store': {
    slug: 'masonry-supply-store',
    name: 'Masonry Supply Store',
    pluralName: 'Masonry Supply Stores',
    icon: 'Store',
    headline: 'Masonry Supply Stores in {city}',
    description: 'Find {count} masonry supply stores in {city}. Brick, block, mortar, tools, and materials for contractors and DIY projects.',
    shortDescription: 'Brick, concrete block, mortar, grout, and masonry tools for professional contractors and DIYers.',
    services: [
      'Brick & Concrete Block Sales',
      'Mortar & Grout (Bags & Bulk)',
      'Masonry Tools & Equipment Rental',
      'Rebar & Reinforcement Materials',
      'Concrete Mix & Additives',
      'Contractor Accounts & Delivery',
    ],
    faqs: [
      {
        question: 'What type of mortar should I use for my project?',
        answer: 'Type N (medium strength) suits most residential work: walls, chimneys, tuckpointing. Type S (high strength) is for below-grade and high-stress applications like retaining walls. Type M (very high strength) is for heavy loads and foundations. Type O (low strength) is for historic restoration. Consult with your masonry supply expert for specific recommendations.',
      },
      {
        question: 'How many bricks do I need for a wall?',
        answer: 'Standard modular bricks (3⅝"×7⅝") require about 7 bricks per square foot of wall (including mortar joints). For a 4"×8" utility brick, plan on 6.5 per sq ft. Calculate wall square footage, then multiply by brick count and add 5-10% for cuts/waste. Masonry suppliers can calculate exact quantities based on your project plans.',
      },
      {
        question: 'Can I get contractor pricing as a DIYer?',
        answer: 'Most masonry supply stores offer tiered pricing. DIYers pay retail; contractors with accounts get 10-30% discounts based on volume. Some stores offer DIY workshops or consultation services. For large projects, buying in bulk (pallets vs. individual units) can secure better pricing even without a contractor account. Ask about delivery minimums and fees.',
      },
    ],
    relatedCategories: ['masonry-contractor', 'concrete-contractor', 'stone-supplier', 'construction-company'],
  },

  'construction-company': {
    slug: 'construction-company',
    name: 'Construction Company',
    pluralName: 'Construction Companies',
    icon: 'Building',
    headline: 'Commercial Construction Companies in {city}',
    description: 'Browse {count} construction companies in {city}. Large-scale commercial, industrial, and residential construction services.',
    shortDescription: 'New construction, commercial build-outs, and large-scale residential developments with full project management.',
    services: [
      'Commercial Building Construction',
      'New Residential Construction',
      'Tenant Improvement (TI) Build-Outs',
      'Design-Build Services',
      'Site Development & Infrastructure',
      'Construction Management & Consulting',
    ],
    faqs: [
      {
        question: 'What is the difference between a general contractor and a construction company?',
        answer: 'General contractors typically handle residential remodels and smaller projects, often subcontracting all trades. Construction companies manage larger-scale commercial projects, often employing in-house trades (carpenters, laborers, project managers). Construction companies may offer design-build, pre-construction, and post-construction services that GCs don\'t typically provide.',
      },
      {
        question: 'How long does commercial construction take?',
        answer: 'Timelines vary widely: small tenant improvements (1,000-3,000 sq ft) take 2-4 months, mid-size commercial buildings (10,000-30,000 sq ft) require 8-18 months, and large developments can span 2-5+ years. Factors include design complexity, permitting, weather, supply chain, and project scope. Detailed schedules are part of the construction contract.',
      },
      {
        question: 'What should I look for in a construction company?',
        answer: 'Key criteria: relevant project portfolio (similar size/type), financial stability (bonding capacity, Dun & Bradstreet rating), safety record (OSHA compliance), licensing and insurance (general liability, workers comp), and references from recent clients. For commercial work, verify they have experience with your building type (retail, office, industrial) and local permitting.',
      },
    ],
    relatedCategories: ['general-contractor', 'masonry-contractor', 'concrete-contractor', 'roofing-contractor'],
  },
};

/**
 * Get category metadata by slug.
 */
export function getCategoryMeta(slug: string): DirectoryCategoryMeta | undefined {
  return DIRECTORY_CATEGORIES[slug];
}

/**
 * Get all category slugs for iteration.
 */
export const DIRECTORY_CATEGORY_SLUGS: string[] = Object.keys(DIRECTORY_CATEGORIES);

/**
 * Get all category metadata objects.
 */
export function getAllCategories(): DirectoryCategoryMeta[] {
  return Object.values(DIRECTORY_CATEGORIES);
}

/**
 * Check if a string is a valid category slug.
 */
export function isValidCategorySlug(slug: string): boolean {
  return slug in DIRECTORY_CATEGORIES;
}

/**
 * Get related categories for a given category slug.
 */
export function getRelatedCategories(slug: string): DirectoryCategoryMeta[] {
  const category = getCategoryMeta(slug);
  if (!category) return [];

  return category.relatedCategories
    .map(relatedSlug => getCategoryMeta(relatedSlug))
    .filter((cat): cat is DirectoryCategoryMeta => cat !== undefined);
}

/**
 * Get categories by icon for grouping in UI.
 */
export function getCategoriesByIcon(iconName: string): DirectoryCategoryMeta[] {
  return getAllCategories().filter(cat => cat.icon === iconName);
}
