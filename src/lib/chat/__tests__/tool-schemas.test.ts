import { describe, expect, it } from 'vitest';
import type { ZodTypeAny } from 'zod';
import {
  extractProjectDataSchema,
  promptForImagesSchema,
  showPortfolioPreviewSchema,
  updateDescriptionBlocksSchema,
  showContentEditorSchema,
  requestClarificationSchema,
  suggestQuickActionsSchema,
  generatePortfolioContentSchema,
  composePortfolioLayoutSchema,
  checkPublishReadySchema,
  updateFieldSchema,
  regenerateSectionSchema,
  reorderImagesSchema,
  validateForPublishSchema,
  updateContractorProfileSchema,
} from '@/lib/chat/tool-schemas';

const expectValid = <T extends ZodTypeAny>(schema: T, input: unknown) => {
  const result = schema.safeParse(input);
  expect(result.success).toBe(true);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
};

const expectInvalid = (
  schema: ZodTypeAny,
  input: unknown,
  path?: string,
  code?: string
) => {
  const result = schema.safeParse(input);
  expect(result.success).toBe(false);
  if (result.success) {
    throw new Error('Expected schema validation to fail.');
  }
  if (path) {
    expect(result.error.issues.some((issue) => issue.path.join('.') === path)).toBe(true);
  }
  if (code) {
    expect(result.error.issues.some((issue) => issue.code === code)).toBe(true);
  }
};

const validBlocks = [
  {
    type: 'paragraph',
    text: 'Repointed the west wall with matching lime mortar.',
  },
];

describe('extractProjectDataSchema', () => {
  it('accepts optional project context fields', () => {
    const result = expectValid(extractProjectDataSchema, {
      project_type: 'chimney repair',
      customer_problem: 'Loose bricks around the crown',
      materials_mentioned: ['brick', 'lime mortar'],
      techniques_mentioned: ['tuckpointing'],
      ready_for_images: true,
    });

    expect(result.project_type).toBe('chimney repair');
    expect(result.materials_mentioned).toEqual(['brick', 'lime mortar']);
  });

  it('rejects nulls and invalid array members', () => {
    expectInvalid(extractProjectDataSchema, { project_type: null }, 'project_type');
    expectInvalid(extractProjectDataSchema, { materials_mentioned: ['brick', 2] }, 'materials_mentioned.1');
  });
});

describe('promptForImagesSchema', () => {
  it('applies defaults for optional counts', () => {
    const result = expectValid(promptForImagesSchema, {});

    expect(result.existingCount).toBe(0);
  });

  it('rejects invalid categories and does not coerce numbers', () => {
    expectInvalid(
      promptForImagesSchema,
      { suggestedCategories: ['before', 'unknown'] },
      'suggestedCategories.1'
    );
    expectInvalid(promptForImagesSchema, { existingCount: '2' }, 'existingCount');
  });
});

describe('showPortfolioPreviewSchema', () => {
  it('accepts preview metadata', () => {
    const result = expectValid(showPortfolioPreviewSchema, {
      title: 'Chimney Rebuild in Denver',
      message: 'Preview updated with your latest notes.',
      highlightFields: ['materials', 'photos'],
    });

    expect(result.highlightFields).toEqual(['materials', 'photos']);
  });

  it('rejects invalid highlight fields', () => {
    expectInvalid(showPortfolioPreviewSchema, { highlightFields: 'materials' }, 'highlightFields');
  });
});

describe('updateDescriptionBlocksSchema', () => {
  it('accepts valid description blocks', () => {
    const result = expectValid(updateDescriptionBlocksSchema, {
      blocks: validBlocks,
      reason: 'Updated to highlight the mortar match.',
    });

    expect(result.blocks).toHaveLength(1);
  });

  it('rejects missing blocks and invalid block shapes', () => {
    expectInvalid(updateDescriptionBlocksSchema, {}, 'blocks');
    expectInvalid(
      updateDescriptionBlocksSchema,
      { blocks: [{ type: 'heading', level: '4', text: 'Scope' }] },
      'blocks.0.level'
    );
  });
});

describe('showContentEditorSchema', () => {
  it('requires title and description and applies defaults', () => {
    const result = expectValid(showContentEditorSchema, {
      title: 'Stone Repair and Cleanup',
      description: 'We replaced the damaged stones and matched the original joints.',
    });

    expect(result.editable).toBe(true);
  });

  it('allows empty strings but rejects missing fields or wrong types', () => {
    const result = expectValid(showContentEditorSchema, {
      title: '',
      description: '',
    });

    expect(result.title).toBe('');
    expectInvalid(showContentEditorSchema, { description: 'Missing title' }, 'title');
    expectInvalid(showContentEditorSchema, { title: 'Ok', description: 'Ok', editable: 'no' }, 'editable');
  });
});

describe('requestClarificationSchema', () => {
  it('accepts clarification requests with confidence bounds', () => {
    const result = expectValid(requestClarificationSchema, {
      field: 'project_type',
      question: 'Was this a rebuild or tuckpointing job?',
      confidence: 0.6,
      alternatives: ['chimney rebuild', 'tuckpointing'],
    });

    expect(result.field).toBe('project_type');
  });

  it('rejects nulls, missing required fields, and out-of-range confidence', () => {
    expectInvalid(requestClarificationSchema, { field: null }, 'field');
    expectInvalid(
      requestClarificationSchema,
      { field: 'materials', confidence: 0.5 },
      'question'
    );
    expectInvalid(
      requestClarificationSchema,
      { field: 'materials', question: 'Which mortar?', confidence: 1.5 },
      'confidence'
    );
    expectInvalid(
      requestClarificationSchema,
      { field: 'materials', question: 'Which mortar?', confidence: '0.5' },
      'confidence'
    );
  });
});

describe('suggestQuickActionsSchema', () => {
  it('accepts up to five quick actions', () => {
    const result = expectValid(suggestQuickActionsSchema, {
      actions: [
        { label: 'Add photos', type: 'addPhotos' },
        { label: 'Generate write-up', type: 'generate' },
      ],
    });

    expect(result.actions).toHaveLength(2);
  });

  it('rejects invalid actions and overflow', () => {
    expectInvalid(
      suggestQuickActionsSchema,
      { actions: [{ label: 'Oops', type: 'unsupported' }] },
      'actions.0.type'
    );

    const tooManyActions = Array.from({ length: 6 }, (_, index) => ({
      label: `Action ${index + 1}`,
      type: 'addPhotos',
    }));

    expectInvalid(suggestQuickActionsSchema, { actions: tooManyActions }, 'actions');
  });
});

describe('generatePortfolioContentSchema', () => {
  it('accepts empty input and optional focus areas', () => {
    const result = expectValid(generatePortfolioContentSchema, {});

    expect(result).toEqual({});
    expectValid(generatePortfolioContentSchema, { focusAreas: ['craftsmanship'] });
  });

  it('rejects invalid option types', () => {
    expectInvalid(generatePortfolioContentSchema, { forceRegenerate: 'yes' }, 'forceRegenerate');
    expectInvalid(generatePortfolioContentSchema, { focusAreas: ['quality', 3] }, 'focusAreas.1');
  });
});

describe('composePortfolioLayoutSchema', () => {
  it('accepts optional layout guidance', () => {
    const result = expectValid(composePortfolioLayoutSchema, {
      goal: 'Emphasize before/after photos',
      includeImageOrder: true,
    });

    expect(result.goal).toBe('Emphasize before/after photos');
  });

  it('rejects invalid boolean types', () => {
    expectInvalid(composePortfolioLayoutSchema, { includeImageOrder: 'true' }, 'includeImageOrder');
    expectInvalid(composePortfolioLayoutSchema, { focusAreas: 'materials' }, 'focusAreas');
  });
});

describe('checkPublishReadySchema', () => {
  it('defaults showWarnings to true', () => {
    const result = expectValid(checkPublishReadySchema, {});

    expect(result.showWarnings).toBe(true);
  });

  it('rejects non-boolean showWarnings', () => {
    expectInvalid(checkPublishReadySchema, { showWarnings: 'false' }, 'showWarnings');
  });
});

describe('updateFieldSchema', () => {
  it('accepts string and array field updates', () => {
    const stringResult = expectValid(updateFieldSchema, {
      field: 'title',
      value: 'New title',
    });

    const arrayResult = expectValid(updateFieldSchema, {
      field: 'tags',
      value: ['masonry', 'restoration'],
    });

    expect(stringResult.value).toBe('New title');
    expect(arrayResult.value).toEqual(['masonry', 'restoration']);
  });

  it('rejects invalid fields and mismatched value types', () => {
    expectInvalid(updateFieldSchema, { field: 'unknown', value: 'Nope' }, 'field');
    expectInvalid(updateFieldSchema, { field: 'title', value: ['oops'] }, 'value');
  });
});

describe('regenerateSectionSchema', () => {
  it('accepts valid regeneration requests', () => {
    const result = expectValid(regenerateSectionSchema, {
      section: 'seo',
      guidance: 'Make it more concise.',
      preserveElements: ['historic'],
    });

    expect(result.section).toBe('seo');
  });

  it('rejects missing or invalid sections', () => {
    expectInvalid(regenerateSectionSchema, {}, 'section');
    expectInvalid(regenerateSectionSchema, { section: 'summary' }, 'section');
  });
});

describe('reorderImagesSchema', () => {
  it('accepts image id lists, including empty arrays', () => {
    const result = expectValid(reorderImagesSchema, {
      imageIds: ['img-1', 'img-2'],
    });

    expect(result.imageIds).toEqual(['img-1', 'img-2']);
    expectValid(reorderImagesSchema, { imageIds: [] });
  });

  it('rejects nulls and invalid array items', () => {
    expectInvalid(reorderImagesSchema, { imageIds: null }, 'imageIds');
    expectInvalid(reorderImagesSchema, { imageIds: ['img-1', 2] }, 'imageIds.1');
  });
});

describe('validateForPublishSchema', () => {
  it('accepts optional validation fields', () => {
    const result = expectValid(validateForPublishSchema, {
      checkFields: ['title', 'images'],
    });

    expect(result.checkFields).toEqual(['title', 'images']);
    expectValid(validateForPublishSchema, {});
  });

  it('rejects unknown validation fields', () => {
    expectInvalid(
      validateForPublishSchema,
      { checkFields: ['title', 'unknown'] },
      'checkFields.1'
    );
  });
});

describe('updateContractorProfileSchema', () => {
  it('accepts string and array profile updates', () => {
    const stringResult = expectValid(updateContractorProfileSchema, {
      field: 'business_name',
      value: 'Brickworks Co.',
    });

    const arrayResult = expectValid(updateContractorProfileSchema, {
      field: 'services',
      value: ['chimney rebuilds'],
    });

    expect(stringResult.value).toBe('Brickworks Co.');
    expect(arrayResult.value).toEqual(['chimney rebuilds']);
  });

  it('rejects invalid fields and mismatched value types', () => {
    expectInvalid(updateContractorProfileSchema, { field: 'unknown', value: 'Nope' }, 'field');
    expectInvalid(updateContractorProfileSchema, { field: 'services', value: 'chimney' }, 'value');
  });
});
