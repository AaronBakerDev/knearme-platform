/**
 * Extended service content for SEO pages.
 *
 * This file contains detailed content for each masonry service type,
 * used to generate Service Type by City pages (e.g., /denver-co/masonry/chimney-repair).
 *
 * Content structure:
 * - shortDescription: For cards/lists (~100 chars)
 * - longDescription: For service pages (300-400 words)
 * - seoTitleTemplate: Meta title with {city}, {state} variables
 * - seoDescriptionTemplate: Meta description with {city}, {count} variables
 * - commonIssues: H2/H3 content sections
 * - keywords: Target search terms
 * - relatedServices: For internal linking
 * - faqs: For FAQ schema (future)
 *
 * @see /docs/11-seo-discovery/page-templates/service-type-city.md
 */

import type { ServiceId } from './services';

/**
 * FAQ item for FAQ schema markup.
 */
export interface ServiceFAQ {
  question: string;
  answer: string;
}

/**
 * Standardized process step for service pages.
 */
export interface ServiceProcessStep {
  /** Step title shown in the Process Overview */
  title: string;
  /** Brief explanation of what happens during this step */
  description: string;
  /** Optional time expectation shown as a chip (e.g., "1-2 days") */
  duration?: string;
}

/**
 * Cost factor displayed in the pricing guidance section.
 */
export interface ServiceCostFactor {
  /** What drives the cost */
  label: string;
  /** How the factor affects pricing */
  description: string;
  /** Typical dollar range to set expectations */
  typicalRange?: string;
}

/**
 * Complete content definition for a service type.
 * Used to generate programmatic SEO pages.
 */
export interface ServiceContent {
  /** Service identifier (matches ServiceId from services.ts) */
  id: ServiceId;
  /** Display label for the service */
  label: string;
  /** Short description for cards/lists (~100 chars) */
  shortDescription: string;
  /** Long description for service pages (300-400 words, can include HTML) */
  longDescription: string;
  /** SEO title template with {city}, {state} placeholders */
  seoTitleTemplate: string;
  /** SEO description template with {city}, {count} placeholders (max 155 chars) */
  seoDescriptionTemplate: string;
  /** Common issues/problems this service addresses (4-6 items) */
  commonIssues: string[];
  /** Target keywords for this service */
  keywords: string[];
  /** Related service IDs for internal linking */
  relatedServices: ServiceId[];
  /** FAQ items for FAQ schema (optional, 3-5 items) */
  faqs?: ServiceFAQ[];
  /** Process overview steps for the service (4-6 items) */
  processSteps: ServiceProcessStep[];
  /** Cost guidance factors for the service */
  costFactors: ServiceCostFactor[];
}

/**
 * Complete content for all masonry service types.
 *
 * Priority services (Phase 2):
 * - chimney-repair (2,400/mo search volume)
 * - foundation-repair (3,600/mo)
 * - tuckpointing (1,800/mo)
 * - brick-repair (1,600/mo)
 * - stone-work (1,200/mo)
 * - restoration (480/mo)
 */
export const SERVICE_CONTENT: Record<ServiceId, ServiceContent> = {
  'chimney-repair': {
    id: 'chimney-repair',
    label: 'Chimney Repair & Rebuild',
    shortDescription:
      'Professional chimney repair, rebuilding, and restoration services from certified masonry contractors.',
    longDescription: `
      <p>Your chimney is one of the most exposed structures on your home, constantly battling weather, temperature changes, and the corrosive effects of combustion gases. Over time, even the most solidly built chimneys develop problems that require professional repair.</p>

      <p>Professional chimney repair addresses issues ranging from minor mortar joint deterioration to complete structural rebuilds. Experienced masonry contractors can assess whether your chimney needs simple repointing, crown repair, or a full rebuild from the roofline up.</p>

      <p>Common chimney problems include cracked or missing mortar joints, damaged chimney crowns, deteriorating flashing, spalling bricks, and leaning structures. Left unaddressed, these issues can lead to water infiltration, interior damage, and even structural failure.</p>

      <p>A qualified chimney repair contractor will thoroughly inspect your chimney, identify all problem areas, and recommend the most cost-effective repair approach. Many repairs can be completed in a day or two, while full rebuilds may take longer depending on the chimney's size and condition.</p>

      <p>When hiring a chimney repair contractor, look for experience with your specific chimney type, proper licensing and insurance, and a portfolio of completed projects. Before and after photos are particularly helpful for evaluating a contractor's work quality.</p>
    `,
    seoTitleTemplate: 'Chimney Repair in {city}, {state} | Local Masonry Contractors',
    seoDescriptionTemplate:
      'Find trusted chimney repair contractors in {city}. Browse {count}+ completed projects with before/after photos. Get quotes from local masonry pros.',
    commonIssues: [
      'Cracked or deteriorating mortar joints between bricks',
      'Damaged or crumbling chimney crown',
      'Leaning or tilting chimney structure',
      'Water damage and white efflorescence staining',
      'Flashing problems causing roof leaks',
      'Spalling or flaking brick faces',
    ],
    keywords: [
      'chimney repair',
      'chimney rebuild',
      'chimney restoration',
      'chimney repointing',
      'chimney crown repair',
      'chimney flashing repair',
    ],
    relatedServices: ['tuckpointing', 'fireplace', 'waterproofing'],
    faqs: [
      {
        question: 'How much does chimney repair cost?',
        answer:
          'Chimney repair costs vary widely based on the extent of damage. Minor repointing may cost $200-$500, crown repairs $300-$1,000, while full rebuilds can range from $1,500 to $10,000 or more depending on chimney size and accessibility.',
      },
      {
        question: 'How do I know if my chimney needs repair?',
        answer:
          'Signs your chimney needs repair include visible cracks in mortar or bricks, white staining (efflorescence), pieces of mortar in your fireplace, water stains on interior walls near the chimney, or a visibly leaning structure.',
      },
      {
        question: 'Can I repair my chimney myself?',
        answer:
          'While minor cosmetic repairs may be DIY-friendly, most chimney repairs require professional expertise. Working at heights, understanding structural integrity, and ensuring proper waterproofing are critical skills that professional masons bring to the job.',
      },
    ],
    processSteps: [
      {
        title: 'Inspect & diagnose',
        description:
          'Camera and visual inspection to document mortar failure, crown cracks, flashing gaps, and structural lean.',
        duration: '1 visit',
      },
      {
        title: 'Stabilize & prep',
        description: 'Set up roof access, protect roof/shingles, remove loose masonry and deteriorated mortar.',
        duration: '0.5-1 day',
      },
      {
        title: 'Repair joints & crown',
        description: 'Repoint mortar joints, rebuild crown or install cast-in-place crown with proper slope and drip edge.',
        duration: '1-2 days',
      },
      {
        title: 'Flash & waterproof',
        description: 'Replace or re-seat flashing, seal counterflashing, apply breathable water repellent to chimney stack.',
        duration: '0.5 day',
      },
      {
        title: 'Rebuild (if needed)',
        description: 'Demo and rebuild from roofline up when structural failure is present; match brick and mortar profile.',
        duration: '2-4 days',
      },
      {
        title: 'Final cure & cleanup',
        description: 'Allow mortar to cure, remove debris, provide photo report and maintenance tips.',
      },
    ],
    costFactors: [
      {
        label: 'Extent of damage',
        description: 'Spot repointing costs far less than full crown rebuilds or structural rebuilds.',
        typicalRange: '$300 - $10,000',
      },
      {
        label: 'Height & access',
        description: 'Two-story roofs or steep pitches add staging and safety costs.',
        typicalRange: '+$150 - $800',
      },
      {
        label: 'Crown material',
        description: 'Cast-in-place concrete crowns cost more than mortar wash caps but last longer.',
        typicalRange: '$400 - $1,500',
      },
      {
        label: 'Flashing replacement',
        description: 'New step/counter flashing with ice & water shield adds time and sheet metal.',
        typicalRange: '$350 - $900',
      },
      {
        label: 'Brick match & labor time',
        description: 'Historic or hard-to-source brick and color-matched mortar increase labor.',
        typicalRange: 'Varies',
      },
    ],
  },

  'tuckpointing': {
    id: 'tuckpointing',
    label: 'Tuckpointing & Repointing',
    shortDescription:
      'Expert tuckpointing and repointing services to restore mortar joints and extend the life of your masonry.',
    longDescription: `
      <p>Tuckpointing is a specialized masonry technique that restores deteriorating mortar joints in brick and stone structures. This essential maintenance service can add decades to the life of your masonry while dramatically improving its appearance.</p>

      <p>The process involves carefully removing damaged mortar to a consistent depth, then filling the joints with fresh mortar that matches your existing masonry. Skilled tuckpointers can also add contrasting mortar lines to create the classic tuckpointing aesthetic that makes joints appear thinner and more refined.</p>

      <p>Mortar deteriorates faster than brick or stone because it's designed to be the sacrificial element in masonry construction. When mortar fails, water infiltrates the wall system, leading to accelerated damage, efflorescence, and eventually structural problems.</p>

      <p>Professional tuckpointing requires matching the mortar's composition, color, and profile to ensure repairs blend seamlessly with original work. Using the wrong mortar type can actually accelerate damage to historic masonry, making contractor expertise essential.</p>

      <p>Most homes benefit from tuckpointing every 25-30 years, though exposure to harsh weather, poor original construction, or deferred maintenance can shorten this timeline. Early intervention through targeted repointing is far more cost-effective than waiting until extensive repairs are needed.</p>
    `,
    seoTitleTemplate: 'Tuckpointing Services in {city}, {state} | Masonry Contractors',
    seoDescriptionTemplate:
      'Professional tuckpointing and repointing in {city}. View {count}+ completed projects. Restore your mortar joints with experienced local masons.',
    commonIssues: [
      'Crumbling or missing mortar between bricks',
      'Mortar joints recessed more than 1/4 inch',
      'White powdery deposits on brick (efflorescence)',
      'Visible gaps allowing water infiltration',
      'Mortar color mismatch from previous repairs',
      'Soft, sandy mortar that crumbles when touched',
    ],
    keywords: [
      'tuckpointing',
      'repointing',
      'mortar repair',
      'brick pointing',
      'mortar joint repair',
      'masonry repointing',
    ],
    relatedServices: ['brick-repair', 'chimney-repair', 'waterproofing'],
    faqs: [
      {
        question: 'What is the difference between tuckpointing and repointing?',
        answer:
          'Repointing is the general process of removing and replacing damaged mortar joints. Tuckpointing is a specific technique that uses two contrasting mortar colors to create the illusion of very fine joints. Many contractors use the terms interchangeably.',
      },
      {
        question: 'How long does tuckpointing last?',
        answer:
          'Quality tuckpointing work typically lasts 25-30 years under normal conditions. Lifespan depends on mortar quality, installation technique, and exposure to weather and moisture.',
      },
      {
        question: 'Can you tuckpoint in cold weather?',
        answer:
          'Tuckpointing should generally be done when temperatures are consistently above 40°F (4°C) and not expected to freeze within 24 hours. Cold weather curing can weaken mortar bonds.',
      },
    ],
    processSteps: [
      {
        title: 'Assess mortar condition',
        description: 'Measure joint depth loss, identify soft or mismatched mortar, and mark failing areas.',
        duration: '1 visit',
      },
      {
        title: 'Remove damaged mortar',
        description: 'Grind or rake joints to proper depth without damaging brick arrises; clean joints of dust.',
        duration: '0.5-1 day',
      },
      {
        title: 'Mix matched mortar',
        description: 'Blend mortar to match historic composition, color, and profile; test a small area first.',
        duration: '0.5 day',
      },
      {
        title: 'Install new joints',
        description: 'Pack and tool mortar for proper bond and water shedding; add fine tuck line if specified.',
        duration: '1-2 days',
      },
      {
        title: 'Cure & clean',
        description: 'Mist joints for slow cure, clean residue, and provide maintenance guidance.',
      },
    ],
    costFactors: [
      {
        label: 'Linear feet of joints',
        description: 'More wall area and deeper removal increase labor time.',
        typicalRange: '$8 - $18 per sq ft',
      },
      {
        label: 'Mortar matching complexity',
        description: 'Historic lime mixes or custom pigments add material and testing cost.',
        typicalRange: '$150 - $500 setup',
      },
      {
        label: 'Access & height',
        description: 'Scaffolding or lift rental for multi-story facades raises costs.',
        typicalRange: '+$300 - $1,200',
      },
      {
        label: 'Brick sensitivity',
        description: 'Soft or historic brick requires hand tools instead of grinders, adding labor.',
      },
      {
        label: 'Weather protection',
        description: 'Cold/ wet weather enclosures and curing blankets add to project cost.',
      },
    ],
  },

  'brick-repair': {
    id: 'brick-repair',
    label: 'Brick Repair & Replacement',
    shortDescription:
      'Comprehensive brick repair, replacement, and restoration services for walls, foundations, and structures.',
    longDescription: `
      <p>Brick masonry is remarkably durable, but even the toughest bricks eventually need repair. Whether from impact damage, freeze-thaw cycles, moisture intrusion, or simple age, damaged bricks compromise both the appearance and structural integrity of your masonry.</p>

      <p>Professional brick repair encompasses a range of services from replacing individual damaged bricks to rebuilding entire wall sections. Skilled masons can source matching bricks, carefully remove damaged units, and install replacements that blend seamlessly with existing work.</p>

      <p>Common brick problems include spalling (where the brick face flakes off), cracking, discoloration, and complete brick failure. These issues often indicate underlying problems like water infiltration, foundation movement, or improper original construction.</p>

      <p>When replacing bricks, matching the size, color, texture, and bond pattern of existing masonry is crucial. Experienced contractors maintain inventories of salvaged and new bricks specifically for repair work, and know how to age new bricks to match weathered surroundings.</p>

      <p>Beyond individual brick replacement, comprehensive brick repair may include crack stitching, wall tie replacement, lintel repair, and addressing the root causes of brick damage. A thorough assessment by a qualified mason ensures all problems are identified and properly addressed.</p>
    `,
    seoTitleTemplate: 'Brick Repair in {city}, {state} | Expert Masonry Services',
    seoDescriptionTemplate:
      'Expert brick repair and replacement in {city}. Browse {count}+ projects with photos. Find skilled masons for walls, foundations, and more.',
    commonIssues: [
      'Spalling or flaking brick faces',
      'Cracked or broken individual bricks',
      'Loose or displaced bricks in walls',
      'Discolored or stained brickwork',
      'Bulging or bowing brick walls',
      'Water damage and moisture infiltration',
    ],
    keywords: [
      'brick repair',
      'brick replacement',
      'brick restoration',
      'masonry repair',
      'brick wall repair',
      'spalling brick repair',
    ],
    relatedServices: ['tuckpointing', 'foundation-repair', 'restoration'],
    faqs: [
      {
        question: 'Can damaged bricks be repaired or do they need replacement?',
        answer:
          'Minor surface damage can sometimes be repaired with brick staining or facing compounds. However, structurally compromised bricks (cracked through, severely spalled, or crumbling) should be replaced to maintain wall integrity.',
      },
      {
        question: 'How do you match replacement bricks to existing masonry?',
        answer:
          'Professional masons match brick size, color, texture, and bond pattern. They may use salvaged bricks from demolished structures, special-order matching bricks, or apply staining techniques to help new bricks blend with weathered surroundings.',
      },
      {
        question: 'What causes bricks to spall?',
        answer:
          'Spalling occurs when moisture trapped inside bricks freezes and expands, breaking off the brick face. Common causes include poor-quality bricks, failed water barriers, improper mortar, and deferred tuckpointing maintenance.',
      },
    ],
    processSteps: [
      {
        title: 'Inspect & identify causes',
        description: 'Check for moisture paths, movement cracks, or load issues to address root causes before repairs.',
        duration: '1 visit',
      },
      {
        title: 'Remove failed brick',
        description: 'Carefully cut out damaged units without harming adjacent masonry; stage matching replacements.',
        duration: '0.5-1 day',
      },
      {
        title: 'Prepare bed & joints',
        description: 'Clean cavities, hydrate brick, and prep compatible mortar for proper bonding.',
        duration: '0.5 day',
      },
      {
        title: 'Set replacement brick',
        description: 'Install matching brick to existing bond pattern; tool joints to shed water.',
        duration: '1 day',
      },
      {
        title: 'Seal & finish',
        description: 'Spot-seal or apply breathable water repellent where appropriate; clean work area.',
      },
    ],
    costFactors: [
      {
        label: 'Quantity of bricks',
        description: 'Replacing a handful costs far less than rebuilding wall sections.',
        typicalRange: '$25 - $60 per brick installed',
      },
      {
        label: 'Brick matching difficulty',
        description: 'Custom or salvaged brick sourcing raises material and lead time costs.',
      },
      {
        label: 'Access & staging',
        description: 'Upper stories or tight alleys may need lifts or scaffold.',
        typicalRange: '+$200 - $900',
      },
      {
        label: 'Root-cause repairs',
        description: 'Lintel replacement, waterproofing, or drainage fixes add scope but prevent repeat failures.',
      },
      {
        label: 'Cleaning and sealing',
        description: 'Post-repair cleaning, staining, or water repellent is often added for appearance and durability.',
        typicalRange: '$150 - $600',
      },
    ],
  },

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

  'foundation-repair': {
    id: 'foundation-repair',
    label: 'Foundation Repair',
    shortDescription:
      'Professional foundation repair services including crack repair, waterproofing, and structural stabilization.',
    longDescription: `
      <p>Your foundation is the most critical structural element of your home, and foundation problems demand immediate professional attention. From minor cracks to major structural issues, experienced masonry contractors have the skills and equipment to properly diagnose and repair foundation problems.</p>

      <p>Foundation issues manifest in many ways: visible cracks in basement walls, doors and windows that stick, uneven floors, gaps between walls and ceilings, and exterior stair-step cracks in brick or block. These symptoms often indicate underlying problems that will worsen without intervention.</p>

      <p>Professional foundation repair addresses both symptoms and root causes. This may include crack injection, carbon fiber reinforcement, wall anchors, underpinning, and drainage improvements. The appropriate solution depends on the foundation type, soil conditions, and nature of the damage.</p>

      <p>Masonry foundation repair focuses on block and brick foundations, which are common in older homes and certain regions. These foundations develop characteristic problems including mortar joint deterioration, block cracking, and bowing walls from lateral soil pressure.</p>

      <p>Early intervention in foundation problems is crucial. What starts as a minor crack can progress to significant structural damage if water infiltration accelerates deterioration. Professional assessment helps homeowners understand problem severity and repair options before issues escalate.</p>
    `,
    seoTitleTemplate: 'Foundation Repair in {city}, {state} | Masonry Specialists',
    seoDescriptionTemplate:
      'Expert foundation repair in {city}. See {count}+ completed projects. Crack repair, waterproofing, and structural solutions from local pros.',
    commonIssues: [
      'Horizontal or stair-step cracks in foundation walls',
      'Bowing or leaning basement walls',
      'Water seepage through foundation cracks',
      'Deteriorating mortar in block foundations',
      'Settling causing uneven floors',
      'Gaps forming between foundation and structure',
    ],
    keywords: [
      'foundation repair',
      'basement wall repair',
      'foundation crack repair',
      'block foundation repair',
      'foundation waterproofing',
      'structural repair',
    ],
    relatedServices: ['waterproofing', 'brick-repair', 'concrete-work'],
    faqs: [
      {
        question: 'How do I know if foundation cracks are serious?',
        answer:
          'Horizontal cracks, stair-step patterns, cracks wider than 1/4 inch, or cracks that are growing typically indicate structural issues requiring professional assessment. Hairline vertical cracks from concrete curing are usually cosmetic.',
      },
      {
        question: 'Does foundation repair increase home value?',
        answer:
          'Foundation repair protects and can increase home value by addressing structural deficiencies. Documented repairs with warranties often satisfy buyer concerns and can make homes more marketable.',
      },
      {
        question: 'How long does foundation repair take?',
        answer:
          'Simple crack repairs may take a day. More extensive work like wall anchoring or underpinning typically takes 2-5 days. Major structural repairs involving excavation may require several weeks.',
      },
    ],
    processSteps: [
      {
        title: 'Inspect & measure movement',
        description: 'Document crack widths, wall bowing, moisture entry, and soil conditions with levels and gauges.',
        duration: '1 visit',
      },
      {
        title: 'Stabilize structure',
        description: 'Install temporary bracing or relieve lateral pressure before permanent reinforcement.',
        duration: '0.5 day',
      },
      {
        title: 'Repair & reinforce',
        description: 'Inject cracks, add carbon fiber straps, wall anchors, or underpinning/piers as needed.',
        duration: '1-3 days',
      },
      {
        title: 'Waterproof & drain',
        description: 'Seal walls, add interior/exterior drains and sump where needed, improve grading/gutters.',
        duration: '1-2 days',
      },
      {
        title: 'Backfill & restore finishes',
        description: 'Backfill carefully, restore slabs/landscaping, and verify movement control.',
      },
    ],
    costFactors: [
      {
        label: 'Repair method',
        description: 'Epoxy injection costs less than anchors; underpinning with piers is highest.',
        typicalRange: '$500 - $25,000+',
      },
      {
        label: 'Wall length & displacement',
        description: 'More linear feet and greater bowing require more anchors or reinforcement.',
      },
      {
        label: 'Water management scope',
        description: 'Adding drains, sump pumps, or exterior excavation increases budget.',
        typicalRange: '$1,500 - $8,000',
      },
      {
        label: 'Soil & access conditions',
        description: 'Clay soils, tight setbacks, or interior obstructions raise labor and equipment costs.',
      },
      {
        label: 'Permits and engineering',
        description: 'Stamped engineering and local permits add soft costs but are often required.',
        typicalRange: '$300 - $1,200',
      },
    ],
  },

  'restoration': {
    id: 'restoration',
    label: 'Historic Restoration',
    shortDescription:
      'Specialized historic masonry restoration preserving architectural heritage with period-appropriate techniques.',
    longDescription: `
      <p>Historic masonry restoration is a specialized discipline that preserves our architectural heritage while ensuring structural integrity for future generations. This work requires deep knowledge of historical construction methods, traditional materials, and preservation standards.</p>

      <p>Unlike modern masonry repair, historic restoration prioritizes authenticity and reversibility. Restoration masons use lime-based mortars that match original compositions, source period-appropriate bricks and stones, and employ traditional techniques that complement rather than compromise historic fabric.</p>

      <p>Common historic restoration projects include repointing with lime mortar, brick and stone replacement, terra cotta repair, ornamental restoration, and cleaning of historic surfaces. Each project requires careful analysis of original materials and construction methods before work begins.</p>

      <p>The Secretary of the Interior's Standards for Historic Preservation guide professional restoration work, emphasizing minimal intervention, use of compatible materials, and documentation of all changes. Many historic restoration projects also involve coordination with local preservation offices and historical societies.</p>

      <p>Proper historic restoration protects property values, maintains neighborhood character, and may qualify for historic tax credits or grant funding. Working with masons experienced in preservation ensures your historic property receives appropriate care that honors its architectural significance.</p>
    `,
    seoTitleTemplate: 'Historic Masonry Restoration in {city}, {state} | Preservation Experts',
    seoDescriptionTemplate:
      'Specialized historic restoration in {city}. Browse {count}+ preservation projects. Period-appropriate repairs from experienced restoration masons.',
    commonIssues: [
      'Deteriorated lime mortar joints',
      'Previous repairs with incompatible cement mortar',
      'Spalling historic brick or stone',
      'Damaged ornamental masonry elements',
      'Paint removal and surface cleaning needs',
      'Structural issues in load-bearing masonry walls',
    ],
    keywords: [
      'historic restoration',
      'masonry restoration',
      'historic preservation',
      'lime mortar repointing',
      'brick restoration',
      'heritage building repair',
    ],
    relatedServices: ['tuckpointing', 'brick-repair', 'stone-work'],
    faqs: [
      {
        question: 'Why is lime mortar important for historic buildings?',
        answer:
          'Historic buildings used soft lime mortar that allows moisture movement and accommodates building settling. Modern portland cement mortar is too hard and can trap moisture, causing accelerated deterioration of historic brick and stone.',
      },
      {
        question: 'Are there tax incentives for historic restoration?',
        answer:
          'Yes, federal and many state programs offer tax credits for certified historic rehabilitation. The federal program provides a 20% credit for income-producing properties. Contact your State Historic Preservation Office for specific requirements.',
      },
      {
        question: 'How do you match historic brick for repairs?',
        answer:
          'Restoration masons source matching brick from salvage yards, specialty manufacturers, or custom brick makers. When exact matches are impossible, techniques like brick staining or strategic placement help repairs blend with original work.',
      },
    ],
    processSteps: [
      {
        title: 'Document & test',
        description: 'Photograph existing conditions, sample mortar/brick, and review preservation standards or approvals.',
        duration: '1 visit',
      },
      {
        title: 'Mockups & approvals',
        description: 'Create test panels for mortar color, tooling, and cleaning; get owner/SHPO sign-off.',
        duration: '0.5-1 day',
      },
      {
        title: 'Careful removal',
        description: 'Hand-remove failing mortar or units to protect historic fabric; catalog ornate elements.',
        duration: '1-3 days',
      },
      {
        title: 'Restore & replace',
        description: 'Repoint with compatible lime mortar, replace units with salvaged/matched materials, repair ornaments.',
        duration: '2-7 days',
      },
      {
        title: 'Finish & record',
        description: 'Gentle cleaning, optional breathable sealers, and final documentation for owner records.',
      },
    ],
    costFactors: [
      {
        label: 'Preservation requirements',
        description: 'Design reviews, documentation, and mockups add professional time and fees.',
      },
      {
        label: 'Material matching',
        description: 'Salvaged brick/stone and custom lime mortars raise sourcing and lead time costs.',
        typicalRange: '+15% - 40% vs. standard work',
      },
      {
        label: 'Delicate methods',
        description: 'Hand tooling and low-pressure cleaning slow production compared to modern methods.',
      },
      {
        label: 'Ornamental elements',
        description: 'Terra cotta, carvings, and cornices may need specialty craftspeople or casting.',
      },
      {
        label: 'Project size',
        description: 'Small patches have higher per-unit cost; large façades gain economies of scale.',
      },
    ],
  },

  // Remaining services with basic content (lower priority)
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

  'commercial': {
    id: 'commercial',
    label: 'Commercial Masonry',
    shortDescription:
      'Commercial masonry services for buildings, storefronts, and industrial facilities.',
    longDescription: `
      <p>Commercial masonry projects require contractors with experience in larger-scale construction, commercial building codes, and coordination with general contractors and other trades. From new construction to building restoration, commercial masonry demands professional expertise.</p>

      <p>Commercial masonry services include structural masonry walls, brick and stone facades, decorative elements, parking structures, and building restoration. These projects often involve tight schedules, complex logistics, and stringent quality requirements.</p>

      <p>Professional commercial masons understand the unique demands of business environments, including minimizing disruption to operations, meeting strict deadlines, and coordinating with building managers and property owners.</p>
    `,
    seoTitleTemplate: 'Commercial Masonry in {city}, {state} | Building & Restoration',
    seoDescriptionTemplate:
      'Professional commercial masonry in {city}. View {count}+ commercial projects. New construction, restoration, and building maintenance.',
    commonIssues: [
      'Deteriorating building facades',
      'Water infiltration in masonry walls',
      'Structural masonry problems',
      'Code compliance issues',
    ],
    keywords: ['commercial masonry', 'building restoration', 'commercial brick', 'facade repair'],
    relatedServices: ['brick-repair', 'tuckpointing', 'restoration'],
    processSteps: [
      {
        title: 'Scope & staging plan',
        description: 'Coordinate with GC/owner on access, hours, safety, and phasing to minimize disruption.',
        duration: '1 visit',
      },
      {
        title: 'Site prep & protection',
        description: 'Erect scaffold/lifts, protect public areas, and stage materials per safety plans.',
        duration: '1-2 days',
      },
      {
        title: 'Execute masonry work',
        description: 'Perform repairs or new install per drawings/specs with QA checks and daily cleanup.',
        duration: 'Varies',
      },
      {
        title: 'Waterproof & seal',
        description: 'Install flashing, sealants, or coatings to prevent infiltration.',
        duration: '0.5-2 days',
      },
      {
        title: 'Closeout & documentation',
        description: 'Punch list, inspections, warranties, and as-built documentation for owner/GC.',
      },
    ],
    costFactors: [
      {
        label: 'Project size & complexity',
        description: 'High elevations, large facades, and structural work increase time and crew size.',
      },
      {
        label: 'Access & safety requirements',
        description: 'Street closures, swing stages, or hoists add permitting and rental costs.',
        typicalRange: '$500 - $5,000+',
      },
      {
        label: 'Material specifications',
        description: 'Face brick, stone, or specialty anchors/flashing drive material budgets.',
      },
      {
        label: 'Scheduling constraints',
        description: 'Night/weekend work or tight timelines may require larger crews/overtime.',
      },
      {
        label: 'Documentation & compliance',
        description: 'Prevailing wage, certified payroll, and inspection fees add administrative cost.',
      },
    ],
  },

  'waterproofing': {
    id: 'waterproofing',
    label: 'Waterproofing & Sealing',
    shortDescription:
      'Professional waterproofing and sealing services for masonry walls, foundations, and structures.',
    longDescription: `
      <p>Water is the primary enemy of masonry, causing deterioration, staining, and structural damage over time. Professional waterproofing and sealing services protect masonry investments and prevent costly future repairs.</p>

      <p>Waterproofing solutions include breathable sealers that allow moisture vapor to escape while blocking liquid water, penetrating sealers that protect from within, and membrane systems for below-grade applications. The right solution depends on the masonry type, exposure conditions, and aesthetic requirements.</p>

      <p>Effective waterproofing addresses water entry points including mortar joints, cracks, porous masonry units, and flashing failures. Comprehensive waterproofing often combines sealers with drainage improvements and repair of existing damage.</p>
    `,
    seoTitleTemplate: 'Masonry Waterproofing in {city}, {state} | Sealers & Protection',
    seoDescriptionTemplate:
      'Expert masonry waterproofing in {city}. View {count}+ projects. Protect brick, stone, and block from water damage with professional sealers.',
    commonIssues: [
      'Water penetration through masonry walls',
      'Efflorescence and mineral staining',
      'Freeze-thaw damage to masonry',
      'Basement moisture and seepage',
    ],
    keywords: ['masonry waterproofing', 'brick sealer', 'foundation waterproofing', 'masonry sealer'],
    relatedServices: ['foundation-repair', 'tuckpointing', 'chimney-repair'],
    faqs: [
      {
        question: 'How often should masonry be waterproofed?',
        answer:
          'Most masonry waterproofing treatments last 5-10 years depending on the sealer type and exposure conditions. Vertical surfaces in sheltered areas may go longer between treatments, while horizontal surfaces exposed to weather need more frequent reapplication.',
      },
      {
        question: 'Can you waterproof brick from the inside?',
        answer:
          'While interior waterproofing can help manage moisture, exterior waterproofing is generally more effective at preventing water entry. Interior solutions typically involve drainage systems and vapor barriers rather than sealers.',
      },
      {
        question: 'Will waterproofing sealer change how my brick looks?',
        answer:
          'Most penetrating sealers are invisible when dry and don\'t change masonry appearance. Film-forming sealers may add slight sheen or darken color. Always test in an inconspicuous area first.',
      },
    ],
    processSteps: [
      {
        title: 'Diagnose moisture paths',
        description: 'Inspect for cracks, failed joints, flashing gaps, and vapor drive to choose the right system.',
        duration: '1 visit',
      },
      {
        title: 'Prep surface',
        description: 'Clean masonry, repair joints/cracks, and mask adjacent finishes for even absorption.',
        duration: '0.5-1 day',
      },
      {
        title: 'Apply sealer or membrane',
        description: 'Spray/roll penetrating sealer or install membrane/drainage for below-grade areas.',
        duration: '0.5-1 day',
      },
      {
        title: 'Detail flashings & joints',
        description: 'Seal penetrations, reset counterflashing, and address copings/sills where water enters.',
        duration: '0.5 day',
      },
      {
        title: 'Test & handoff',
        description: 'Perform spot water test, clean up, and provide reapplication schedule.',
      },
    ],
    costFactors: [
      {
        label: 'Treatment type',
        description: 'Penetrating sealers cost less than membrane systems or below-grade drainage.',
        typicalRange: '$1.50 - $8 per sq ft',
      },
      {
        label: 'Surface condition',
        description: 'Crack/joint repairs and cleaning add prep cost before sealing.',
      },
      {
        label: 'Height & access',
        description: 'Lift/scaffold work for multi-story façades increases labor and equipment.',
        typicalRange: '+$200 - $1,200',
      },
      {
        label: 'Below-grade scope',
        description: 'Excavation, drainage board, and membranes around foundations are the largest cost drivers.',
      },
      {
        label: 'Reapplication frequency',
        description: 'Budget for 5-10 year maintenance depending on exposure and product used.',
      },
    ],
  },

  'efflorescence-removal': {
    id: 'efflorescence-removal',
    label: 'Efflorescence Removal',
    shortDescription:
      'Professional efflorescence removal and prevention services for brick, stone, and concrete surfaces.',
    longDescription: `
      <p>Efflorescence is the white, powdery deposit that appears on masonry surfaces when water-soluble salts migrate to the surface and crystallize. While not structurally harmful itself, efflorescence indicates moisture movement through masonry and can be a persistent aesthetic problem.</p>

      <p>Professional efflorescence removal involves proper cleaning techniques that remove deposits without damaging the underlying masonry. Simple brushing may work for light efflorescence, but heavier deposits often require chemical cleaners specifically formulated for masonry.</p>

      <p>Effective treatment goes beyond cleaning to address the moisture source causing efflorescence. This may involve improving drainage, repairing mortar joints, waterproofing treatments, or modifying sprinkler systems that wet masonry surfaces.</p>

      <p>Recurring efflorescence indicates an ongoing moisture problem that will continue until the water source is eliminated. Professional assessment helps identify why moisture is moving through the masonry and what corrections will provide lasting results.</p>

      <p>Prevention strategies include proper material selection, adequate curing of new masonry, drainage improvements, and breathable waterproofing treatments. New construction should incorporate moisture barriers and weep systems designed to manage water without allowing salt migration.</p>
    `,
    seoTitleTemplate: 'Efflorescence Removal in {city}, {state} | Masonry Cleaning',
    seoDescriptionTemplate:
      'Expert efflorescence removal in {city}. View {count}+ projects. Remove white stains from brick and stone with professional cleaning.',
    commonIssues: [
      'White powdery deposits on brick or stone surfaces',
      'Recurring efflorescence after cleaning',
      'Stubborn crystalline salt buildup',
      'Staining around window sills and planters',
      'New construction efflorescence',
      'Efflorescence on interior basement walls',
    ],
    keywords: [
      'efflorescence removal',
      'efflorescence cleaning',
      'white stain on brick',
      'salt deposits on masonry',
      'brick cleaning',
      'how to remove efflorescence',
    ],
    relatedServices: ['waterproofing', 'tuckpointing', 'brick-repair'],
    faqs: [
      {
        question: 'What causes efflorescence on brick?',
        answer:
          'Efflorescence occurs when water dissolves salts present in masonry materials, carries them to the surface, and evaporates leaving white crystalline deposits. Sources include salts in bricks, mortar, soil, or deicing products.',
      },
      {
        question: 'How do you remove efflorescence from brick?',
        answer:
          'Light efflorescence can be dry-brushed off. Heavier deposits require washing with water or specialized masonry cleaners. Avoid acid cleaners on new masonry as they can release more salts. Always address the moisture source to prevent recurrence.',
      },
      {
        question: 'Will efflorescence go away on its own?',
        answer:
          'Primary efflorescence from new construction often diminishes over time as salts are depleted. However, secondary efflorescence from external water sources will continue until the moisture problem is corrected.',
      },
      {
        question: 'Is efflorescence harmful to masonry?',
        answer:
          'Efflorescence itself doesn\'t damage masonry, but it indicates moisture movement that can cause freeze-thaw damage, spalling, and mortar deterioration. The underlying moisture problem should be addressed.',
      },
    ],
    processSteps: [
      {
        title: 'Identify moisture source',
        description: 'Trace irrigation overspray, grading, leaks, or vapor drive that is moving salts outward.',
        duration: '1 visit',
      },
      {
        title: 'Dry brush & test clean',
        description: 'Start with dry brushing; spot-test cleaner on a hidden area to avoid surface damage.',
        duration: '0.5 day',
      },
      {
        title: 'Wash deposits',
        description: 'Use masonry-safe cleaner or low-pressure rinse to dissolve and remove crystalline salts.',
        duration: '0.5-1 day',
      },
      {
        title: 'Fix moisture path',
        description: 'Seal joints/cracks, adjust sprinklers, add drip edges or drainage to stop water entry.',
        duration: '0.5-1 day',
      },
      {
        title: 'Seal & monitor',
        description: 'Apply breathable water repellent if appropriate and monitor for recurrence.',
      },
    ],
    costFactors: [
      {
        label: 'Severity & coverage',
        description: 'Light dusting costs less than thick crystalline buildup across large areas.',
        typicalRange: '$300 - $1,500',
      },
      {
        label: 'Cleaning method',
        description: 'Specialty cleaners or low-pressure washing add material and labor time.',
      },
      {
        label: 'Access & height',
        description: 'Upper-story façades or chimney stacks may require ladders or lifts.',
        typicalRange: '+$150 - $600',
      },
      {
        label: 'Moisture remediation',
        description: 'Drainage fixes, joint repairs, or flashing tweaks add scope but prevent recurrence.',
      },
      {
        label: 'Sealer application',
        description: 'Optional breathable repellent adds cost but helps manage future staining.',
        typicalRange: '$1 - $3 per sq ft',
      },
    ],
  },
};

/**
 * Get service content by ID.
 */
export function getServiceContent(serviceId: ServiceId): ServiceContent | undefined {
  return SERVICE_CONTENT[serviceId];
}

/**
 * Get all service content entries.
 */
export function getAllServiceContent(): ServiceContent[] {
  return Object.values(SERVICE_CONTENT);
}

/**
 * Get priority services (high search volume).
 * These are the focus for Phase 2 SEO implementation.
 */
export function getPriorityServices(): ServiceContent[] {
  const priorityIds: ServiceId[] = [
    'chimney-repair',
    'foundation-repair',
    'tuckpointing',
    'brick-repair',
    'stone-work',
    'restoration',
  ];
  return priorityIds.map((id) => SERVICE_CONTENT[id]);
}
