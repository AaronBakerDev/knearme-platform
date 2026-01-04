import type { ServiceContentPartial } from './types';

export const REPAIR_SERVICE_CONTENT = {
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
} satisfies ServiceContentPartial;
