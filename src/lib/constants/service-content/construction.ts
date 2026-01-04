import type { ServiceContentPartial } from './types';

export const CONSTRUCTION_SERVICE_CONTENT = {
  'stone-work': {
    id: 'stone-work',
    label: 'Stone Work & Veneer',
    shortDescription:
      'Custom stone masonry including natural stone walls, veneer installation, and decorative stonework.',
    longDescription: `
      <p>Stone masonry represents the pinnacle of the mason's craft, combining natural beauty with exceptional durability. From rustic fieldstone walls to precision-cut architectural stone, professional stone work adds lasting value and distinctive character to any property.</p>

      <p>Modern stone masonry includes both structural stone construction and stone veneer applications. While full-depth stone walls remain popular for retaining walls and high-end construction, manufactured and natural stone veneers provide the beauty of stone at reduced weight and cost.</p>

      <p>Professional stone masons work with a wide variety of materials including limestone, sandstone, granite, slate, and manufactured stone products. Each material has unique characteristics that affect cutting, setting, and long-term maintenance requirements.</p>

      <p>Stone veneer installation requires careful surface preparation, proper waterproofing, and attention to expansion joints and flashing details. When properly installed, stone veneer can last decades with minimal maintenance while transforming the appearance of any structure.</p>

      <p>Whether you're building a new stone feature, repairing existing stonework, or adding stone veneer to an existing structure, working with experienced stone masons ensures proper material selection, installation techniques, and long-term durability.</p>
    `,
    seoTitleTemplate: 'Stone Masonry in {city}, {state} | Walls, Veneer & More',
    seoDescriptionTemplate:
      'Professional stone masonry services in {city}. View {count}+ stone projects. Natural stone walls, veneer installation, and custom stonework.',
    commonIssues: [
      'Cracked or displaced stones in walls',
      'Failing mortar joints in stone structures',
      'Loose or fallen stone veneer',
      'Water infiltration behind stone facing',
      'Stained or discolored natural stone',
      'Structural settling affecting stone walls',
    ],
    keywords: [
      'stone masonry',
      'stone work',
      'stone veneer',
      'natural stone walls',
      'stone repair',
      'stone installation',
    ],
    relatedServices: ['retaining-walls', 'outdoor-living', 'restoration'],
    faqs: [
      {
        question: 'What is the difference between natural stone and manufactured stone veneer?',
        answer:
          'Natural stone is quarried rock cut to size, offering unique character but higher weight and cost. Manufactured stone is concrete molded and colored to resemble natural stone, providing similar aesthetics at lower weight and typically lower cost.',
      },
      {
        question: 'How long does stone veneer last?',
        answer:
          'Quality stone veneer with proper installation can last 50+ years. Natural stone veneer may last even longer. Longevity depends on installation quality, underlying substrate condition, and ongoing maintenance.',
      },
      {
        question: 'Can stone veneer be installed over existing brick or siding?',
        answer:
          'Yes, stone veneer can often be installed over existing surfaces with proper preparation. This typically includes adding a moisture barrier, metal lath, and scratch coat before setting the stone.',
      },
    ],
    processSteps: [
      {
        title: 'Design & layout',
        description: 'Confirm stone type, pattern, and coursing; measure surfaces and create a material takeoff.',
        duration: '1 visit',
      },
      {
        title: 'Prep substrate',
        description: 'Install lath/scratch coat or clean masonry, add flashing, weeps, and control joints.',
        duration: '1 day',
      },
      {
        title: 'Set stone',
        description: 'Butter stones and set to pattern, maintaining level courses and tight joints.',
        duration: '2-5 days',
      },
      {
        title: 'Tool joints & clean',
        description: 'Strike or over-grout joints per design, brush and wash without smearing faces.',
        duration: '0.5-1 day',
      },
      {
        title: 'Seal & finalize',
        description: 'Apply breathable sealer if specified, caulk transitions, complete punch list.',
      },
    ],
    costFactors: [
      {
        label: 'Stone type',
        description: 'Full-bed natural stone costs more than thin veneer; hand-cut patterns add labor.',
        typicalRange: '$18 - $45 per sq ft installed',
      },
      {
        label: 'Wall preparation',
        description: 'Lath, scratch coat, and flashing details add material and labor where needed.',
        typicalRange: '$3 - $8 per sq ft',
      },
      {
        label: 'Pattern complexity',
        description: 'Dry-stack or random rubble layouts take longer than ledgestone or ashlar.',
      },
      {
        label: 'Height & access',
        description: 'Tall chimneys or facades require staging or lifts.',
        typicalRange: '+$200 - $1,000',
      },
      {
        label: 'Sealing and detailing',
        description: 'Drip edges, weeps, sealers, and transition caulking add cost but extend life.',
        typicalRange: '$150 - $600',
      },
    ],
  },

  'retaining-walls': {
    id: 'retaining-walls',
    label: 'Retaining Walls',
    shortDescription:
      'Custom retaining wall construction using stone, block, and brick for erosion control and landscaping.',
    longDescription: `
      <p>Retaining walls serve both functional and aesthetic purposes, holding back soil to create usable outdoor spaces while adding visual interest to landscapes. Professional masonry retaining walls combine structural engineering with craftsman skill for lasting results.</p>

      <p>Material choices for retaining walls include natural stone, concrete block, brick, and segmental retaining wall systems. Each offers different aesthetics, structural capabilities, and price points to match project requirements.</p>

      <p>Proper retaining wall construction requires attention to drainage, footings, and structural reinforcement. Walls over 4 feet typically require engineering and permits. Professional masons understand these requirements and build walls that perform for decades.</p>
    `,
    seoTitleTemplate: 'Retaining Wall Contractors in {city}, {state} | Stone & Block Walls',
    seoDescriptionTemplate:
      'Professional retaining wall construction in {city}. View {count}+ projects. Stone, block, and brick walls for landscapes and erosion control.',
    commonIssues: [
      'Leaning or bulging retaining walls',
      'Poor drainage causing wall failure',
      'Cracked or displaced wall sections',
      'Deteriorating mortar in older walls',
    ],
    keywords: ['retaining wall', 'stone retaining wall', 'block wall', 'landscape wall'],
    relatedServices: ['stone-work', 'outdoor-living', 'concrete-work'],
    processSteps: [
      {
        title: 'Site evaluation & layout',
        description: 'Check slopes, soil, drainage paths, and mark wall alignment and height.',
        duration: '1 visit',
      },
      {
        title: 'Excavate & base prep',
        description: 'Excavate to frost depth as needed, install compacted gravel base, and leveling pad.',
        duration: '1-2 days',
      },
      {
        title: 'Build wall & reinforce',
        description: 'Stack block/stone, add geogrid or tie-backs where engineered, maintain batter for stability.',
        duration: '2-4 days',
      },
      {
        title: 'Drainage install',
        description: 'Place drain tile, washed stone backfill, and fabric separation to keep water away from wall.',
        duration: '0.5-1 day',
      },
      {
        title: 'Cap, grade, and finish',
        description: 'Install caps, final grading, and landscape restoration for proper runoff.',
      },
    ],
    costFactors: [
      {
        label: 'Wall height & length',
        description: 'Taller/longer walls require more material, engineering, and reinforcement.',
        typicalRange: '$40 - $120 per sq ft of face',
      },
      {
        label: 'Soil and drainage needs',
        description: 'Poor soils or added drainage systems increase excavation and material costs.',
      },
      {
        label: 'Material choice',
        description: 'Natural stone generally costs more than SRW block or CMU with veneer.',
      },
      {
        label: 'Engineering & permits',
        description: 'Walls over 4 ft often need stamped plans and permits.',
        typicalRange: '$300 - $1,000',
      },
      {
        label: 'Access and hauling',
        description: 'Tight sites or long carry distances add labor and machine time.',
      },
    ],
  },

  'concrete-work': {
    id: 'concrete-work',
    label: 'Concrete Work',
    shortDescription:
      'Professional concrete services including flatwork, stamped concrete, and decorative concrete applications.',
    longDescription: `
      <p>While distinct from traditional masonry, concrete work often falls within the skill set of masonry contractors. From driveways and patios to foundations and decorative elements, quality concrete work requires proper preparation, mixing, and finishing.</p>

      <p>Modern decorative concrete options include stamped patterns, exposed aggregate, colored concrete, and polished finishes. These techniques transform utilitarian concrete into attractive surfaces that complement any property.</p>

      <p>Professional concrete work addresses both new construction and repair of existing concrete. Crack repair, resurfacing, and replacement are common services that extend the life of concrete surfaces.</p>
    `,
    seoTitleTemplate: 'Concrete Contractors in {city}, {state} | Flatwork & Decorative',
    seoDescriptionTemplate:
      'Quality concrete work in {city}. Browse {count}+ projects. Driveways, patios, stamped concrete, and repairs from local contractors.',
    commonIssues: [
      'Cracked concrete slabs and driveways',
      'Settling and uneven concrete surfaces',
      'Spalling and surface deterioration',
      'Drainage problems around concrete',
    ],
    keywords: ['concrete work', 'concrete contractor', 'stamped concrete', 'concrete repair'],
    relatedServices: ['foundation-repair', 'outdoor-living', 'retaining-walls'],
    processSteps: [
      {
        title: 'Plan & form',
        description: 'Measure, set forms for slope/drainage, and plan control joints.',
        duration: '0.5-1 day',
      },
      {
        title: 'Prep base',
        description: 'Excavate, compact subgrade, add gravel base, and install reinforcement where specified.',
        duration: '1 day',
      },
      {
        title: 'Pour & finish',
        description: 'Place concrete, screed, bull float, edge, and finish (broom, stamp, or expose aggregate).',
        duration: '1 day',
      },
      {
        title: 'Cure & saw joints',
        description: 'Apply curing methods and saw control joints at proper spacing to control cracking.',
        duration: '0.5 day',
      },
      {
        title: 'Seal & clean up',
        description: 'Apply sealer when appropriate, remove forms, backfill edges, and clean the site.',
      },
    ],
    costFactors: [
      {
        label: 'Slab size & thickness',
        description: 'More area and thicker sections increase material and labor.',
        typicalRange: '$6 - $18 per sq ft',
      },
      {
        label: 'Finish type',
        description: 'Stamped, colored, or exposed aggregate finishes add materials and crew time.',
        typicalRange: '+$2 - $6 per sq ft',
      },
      {
        label: 'Base and reinforcement',
        description: 'Thicker gravel base, rebar, or wire mesh add cost but improve performance.',
      },
      {
        label: 'Access & removal',
        description: 'Tear-out of old concrete, tight access, or wheelbarrow-only pours increase labor.',
      },
      {
        label: 'Sealing and joints',
        description: 'High-performance sealers and joint fillers add finishing cost.',
        typicalRange: '$0.50 - $1.50 per sq ft',
      },
    ],
  },

  'fireplace': {
    id: 'fireplace',
    label: 'Fireplace Construction',
    shortDescription:
      'Custom fireplace design and construction including indoor fireplaces, outdoor fire features, and repairs.',
    longDescription: `
      <p>A well-crafted masonry fireplace serves as the heart of a home, providing warmth, ambiance, and a natural gathering place. Professional fireplace construction combines structural engineering with artistic design for safe, beautiful, and functional results.</p>

      <p>Fireplace construction options range from traditional all-masonry fireplaces to modern prefabricated units with masonry surrounds. Outdoor fireplaces and fire pits have become increasingly popular for extending living spaces into backyards and patios.</p>

      <p>Fireplace repair and renovation services address common issues like cracked fireboxes, deteriorating smoke chambers, and outdated surrounds. Many homeowners choose to update fireplace aesthetics while addressing underlying structural concerns.</p>
    `,
    seoTitleTemplate: 'Fireplace Contractors in {city}, {state} | Indoor & Outdoor',
    seoDescriptionTemplate:
      'Custom fireplace construction in {city}. View {count}+ projects. Indoor fireplaces, outdoor fire features, and expert repairs.',
    commonIssues: [
      'Cracked firebox or smoke chamber',
      'Deteriorating fireplace mortar',
      'Draft problems and smoking',
      'Outdated fireplace appearance',
    ],
    keywords: ['fireplace construction', 'fireplace repair', 'outdoor fireplace', 'fire pit'],
    relatedServices: ['chimney-repair', 'stone-work', 'outdoor-living'],
    processSteps: [
      {
        title: 'Design & code check',
        description: 'Confirm indoor/outdoor design, venting, clearances, and local code requirements.',
        duration: '1 visit',
      },
      {
        title: 'Foundation & rough-in',
        description: 'Pour footing or pad, rough in gas/electrical as needed, and set firebox or base courses.',
        duration: '1-2 days',
      },
      {
        title: 'Build firebox & chase',
        description: 'Lay firebrick with refractory mortar, build smoke chamber, flue, and chimney/chase.',
        duration: '2-4 days',
      },
      {
        title: 'Finish masonry',
        description: 'Apply stone/brick veneer, mantels, and hearth; tool joints and clean surfaces.',
        duration: '1-3 days',
      },
      {
        title: 'Cure, test, and start-up',
        description: 'Cure mortar, test draft, set damper/caps, and provide first-burn instructions.',
      },
    ],
    costFactors: [
      {
        label: 'Fireplace type',
        description: 'Masonry fireplaces cost more than prefab units with veneer surrounds.',
        typicalRange: '$4,000 - $25,000+',
      },
      {
        label: 'Fuel and venting',
        description: 'Wood vs. gas, flue height, and stainless liners influence material and labor.',
      },
      {
        label: 'Finish materials',
        description: 'Stone veneer, custom mantels, or specialty hearth materials add cost.',
      },
      {
        label: 'Location & access',
        description: 'Roof access for chimneys or tight patios affects staging and labor.',
      },
      {
        label: 'Code/permit requirements',
        description: 'Permits, inspections, and spark arrestors or caps add to the budget.',
        typicalRange: '$200 - $800',
      },
    ],
  },

  'outdoor-living': {
    id: 'outdoor-living',
    label: 'Outdoor Living Spaces',
    shortDescription:
      'Complete outdoor living solutions including patios, outdoor kitchens, fire features, and hardscaping.',
    longDescription: `
      <p>Outdoor living spaces extend your home's functional area into the backyard, creating spaces for cooking, entertaining, and relaxation. Professional masonry work provides the durability and aesthetics that make outdoor spaces truly livable.</p>

      <p>Popular outdoor masonry projects include stone or paver patios, outdoor kitchens with built-in grills, fire pits and fireplaces, pizza ovens, and decorative walls. These elements combine to create cohesive outdoor rooms that enhance property value and lifestyle.</p>

      <p>Quality outdoor masonry requires attention to drainage, frost protection, and material selection for local climate conditions. Professional contractors design and build outdoor spaces that perform in all seasons and weather conditions.</p>
    `,
    seoTitleTemplate: 'Outdoor Living Contractors in {city}, {state} | Patios & Kitchens',
    seoDescriptionTemplate:
      'Custom outdoor living spaces in {city}. Browse {count}+ projects. Patios, outdoor kitchens, fire features, and expert hardscaping.',
    commonIssues: [
      'Settling or uneven patio surfaces',
      'Drainage problems in outdoor spaces',
      'Weathered or damaged hardscaping',
      'Cracked or failing outdoor structures',
    ],
    keywords: ['outdoor living', 'outdoor kitchen', 'patio', 'hardscaping', 'fire pit'],
    relatedServices: ['stone-work', 'fireplace', 'retaining-walls'],
    processSteps: [
      {
        title: 'Plan layout & utilities',
        description: 'Define zones (cooking, dining, fire), plan gas/electric, and drainage paths.',
        duration: '1 visit',
      },
      {
        title: 'Excavate & base',
        description: 'Excavate, install gravel base with proper slope, and run sleeves/utilities.',
        duration: '1-2 days',
      },
      {
        title: 'Build hardscape',
        description: 'Set pavers/stone, build walls, seating, kitchens, and fire features.',
        duration: '2-5 days',
      },
      {
        title: 'Finish surfaces',
        description: 'Grout or sweep joints, install countertops/appliances, seal if specified.',
        duration: '1-2 days',
      },
      {
        title: 'Punch list & handoff',
        description: 'Test utilities, lighting, and provide care instructions for surfaces.',
      },
    ],
    costFactors: [
      {
        label: 'Square footage & scope',
        description: 'Larger patios and multiple features (kitchen + fire + seating) drive cost.',
        typicalRange: '$40 - $150 per sq ft',
      },
      {
        label: 'Materials',
        description: 'Natural stone costs more than concrete pavers; granite counters more than concrete.',
      },
      {
        label: 'Utilities & appliances',
        description: 'Gas lines, electrical runs, and built-in appliances add significant cost.',
        typicalRange: '$1,000 - $8,000',
      },
      {
        label: 'Site access & drainage',
        description: 'Tight yards or drainage corrections increase excavation and labor.',
      },
      {
        label: 'Lighting & finishes',
        description: 'Low-voltage lighting, sealing, and custom carpentry/steel accents add budget.',
      },
    ],
  },
} satisfies ServiceContentPartial;
