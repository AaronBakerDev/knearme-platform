/**
 * Trade Configuration System
 *
 * Provides vocabulary and defaults for the masonry trade.
 * Designed to be extensible for future trades, but currently masonry-only.
 *
 * @see /docs/09-agent/multi-agent-architecture.md
 */

/**
 * Trade configuration interface.
 * Defines vocabulary and defaults for a trade.
 */
export interface TradeConfig {
  id: string;
  displayName: string;
  slug: string;

  /** Trade-specific vocabulary for content generation */
  terminology: {
    projectTypes: string[];
    materials: string[];
    techniques: string[];
    commonProblems: string[];
    certifications: string[];
  };

  defaults: {
    projectType: string;
    tags: string[];
  };

  examplePrompts: string[];

  /** Image type guidance for classification */
  imageGuidance: {
    before: string;
    after: string;
    progress: string;
    detail: string;
  };
}

/**
 * Masonry trade configuration.
 * The initial and most complete trade configuration.
 */
export const MASONRY_CONFIG: TradeConfig = {
  id: 'masonry',
  displayName: 'Masonry',
  slug: 'masonry',

  terminology: {
    projectTypes: [
      'chimney rebuild',
      'chimney repair',
      'tuckpointing',
      'brick repair',
      'stone veneer',
      'retaining wall',
      'foundation repair',
      'fireplace restoration',
      'historic restoration',
      'concrete work',
      'paver installation',
      'block wall',
    ],
    materials: [
      'brick',
      'mortar',
      'limestone',
      'sandstone',
      'granite',
      'concrete block',
      'natural stone',
      'cultured stone',
      'flagstone',
      'pavers',
      'stucco',
      'cement',
    ],
    techniques: [
      'repointing',
      'tuckpointing',
      'flashing',
      'waterproofing',
      'grinding',
      'matching mortar color',
      'crown repair',
      'cap installation',
      'veneer application',
      'structural reinforcement',
    ],
    commonProblems: [
      'water damage',
      'crumbling mortar',
      'efflorescence',
      'spalling brick',
      'settling foundation',
      'cracks',
      'leaning structure',
      'missing caps',
      'deteriorated flashing',
      'freeze-thaw damage',
    ],
    certifications: [
      'MCAA Certified',
      'OSHA Certified',
      'Licensed Mason',
      'Historic Preservation Specialist',
    ],
  },

  defaults: {
    projectType: 'masonry',
    tags: ['masonry', 'brick', 'stone'],
  },

  examplePrompts: [
    'I just finished a chimney rebuild in Denver',
    'Show me how to describe this tuckpointing job',
    'Help me write about a historic brick restoration',
  ],

  imageGuidance: {
    before: 'Damaged or deteriorating masonry before work began',
    after: 'Completed masonry work showing the finished result',
    progress: 'Work in progress showing technique or process',
    detail: 'Close-up of materials, craftsmanship, or specific features',
  },
};

/**
 * Get trade configuration.
 * Currently only masonry is supported.
 */
export function getTradeConfig(): TradeConfig {
  return MASONRY_CONFIG;
}

/**
 * Build a context string for the Trade Expert agent.
 * Used to inject trade-specific knowledge into prompts.
 *
 * @param config - The trade configuration
 * @returns A formatted context string for prompts
 */
export function buildTradeContext(config: TradeConfig): string {
  return `
Trade: ${config.displayName}

Project Types: ${config.terminology.projectTypes.join(', ')}

Common Materials: ${config.terminology.materials.join(', ')}

Techniques: ${config.terminology.techniques.join(', ')}

Common Problems: ${config.terminology.commonProblems.join(', ')}

Industry Certifications: ${config.terminology.certifications.join(', ')}
`.trim();
}
