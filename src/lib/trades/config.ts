/**
 * Trade Configuration System
 *
 * Provides vocabulary and defaults for contractor trades.
 * The system defaults to GENERIC_CONFIG, which works for any business.
 * Trade-specific configs (like MASONRY_CONFIG) are optional enhancements
 * that provide richer vocabulary for content generation.
 *
 * PHILOSOPHY ALIGNMENT:
 * - Generic is the default, not masonry
 * - Trade configs enhance, not require
 * - Model infers terminology when config is generic
 *
 * @see /docs/philosophy/agent-philosophy.md
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
 * Generic trade configuration.
 * THIS IS THE DEFAULT - works for any business type.
 * The model will infer materials, techniques, and terminology from context.
 * Intentionally minimal to let structure emerge from actual projects.
 */
export const GENERIC_CONFIG: TradeConfig = {
  id: 'construction',
  displayName: 'Construction',
  slug: 'construction',

  terminology: {
    projectTypes: [
      'renovation',
      'repair',
      'installation',
      'restoration',
      'new construction',
      'remodel',
      'maintenance',
      'custom work',
    ],
    materials: [
      // Intentionally empty - model will infer from context
    ],
    techniques: [
      // Intentionally empty - model will infer from context
    ],
    commonProblems: [
      'wear and tear',
      'damage',
      'aging',
      'deterioration',
      'malfunction',
      'code compliance',
    ],
    certifications: [
      'Licensed',
      'Insured',
      'Bonded',
    ],
  },

  defaults: {
    projectType: 'project',
    tags: [],
  },

  examplePrompts: [
    'I just finished a project for a customer',
    'Help me describe this work I completed',
    'Show me how to present this job',
  ],

  imageGuidance: {
    before: 'The condition before work began',
    after: 'The completed work showing the finished result',
    progress: 'Work in progress showing technique or process',
    detail: 'Close-up of craftsmanship or specific features',
  },
};

/**
 * Map of trade slugs to their configurations.
 * Add new trades here as they are supported.
 */
const TRADE_CONFIGS: Record<string, TradeConfig> = {
  masonry: MASONRY_CONFIG,
  // Future trades can be added here:
  // plumbing: PLUMBING_CONFIG,
  // electrical: ELECTRICAL_CONFIG,
};

/**
 * Get trade configuration by trade slug.
 * Returns GENERIC_CONFIG by default (philosophy-aligned).
 * Specific trade configs are optional vocabulary enhancements.
 *
 * @param trade - Optional trade slug (e.g., 'masonry', 'plumbing')
 * @returns The trade configuration (GENERIC_CONFIG if no specific match)
 */
export function getTradeConfig(trade?: string | null): TradeConfig {
  if (trade && TRADE_CONFIGS[trade]) {
    return TRADE_CONFIGS[trade];
  }
  // Philosophy: Generic is the default. Model infers from context.
  return GENERIC_CONFIG;
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
