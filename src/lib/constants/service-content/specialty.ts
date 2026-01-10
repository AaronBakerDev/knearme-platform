import type { ServiceContentPartial } from './types';

export const SPECIALTY_SERVICE_CONTENT = {
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
} satisfies ServiceContentPartial;
