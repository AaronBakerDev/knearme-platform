/**
 * Layout Composer Agent
 *
 * Generates structured description blocks and optional image ordering
 * for a contractor portfolio project.
 *
 * @see /docs/09-agent/multi-agent-architecture.md
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { descriptionBlocksSchema, type DescriptionBlock } from '@/lib/content/description-blocks';
import { formatProjectLocation } from '@/lib/utils/location';
import { getGenerationModel, isGoogleAIEnabled, OUTPUT_LIMITS } from '@/lib/ai/providers';
import type { SharedProjectState } from './types';

export interface LayoutComposerOptions {
  goal?: string;
  focusAreas?: string[];
  includeImageOrder?: boolean;
}

export interface LayoutComposerResult {
  blocks: DescriptionBlock[];
  imageOrder?: string[];
  rationale?: string;
  missingContext?: string[];
  confidence?: number;
}

const LayoutComposerSchema = z.object({
  blocks: descriptionBlocksSchema.describe('Structured description blocks'),
  imageOrder: z.array(z.string()).optional(),
  rationale: z.string().optional(),
  missingContext: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const LAYOUT_SYSTEM_PROMPT = `You are a layout composer for contractor portfolio pages.

Turn the provided project context into structured description blocks.

Rules:
- Use ONLY provided facts. Do not invent materials, timelines, or outcomes.
- Keep blocks concise and skimmable (4-10 blocks when possible).
- Start with a short overview paragraph.
- Use headings for key sections (e.g., Project Overview, The Problem, The Solution, Results, Craft).
- Use lists for materials or techniques when present.
- Use callouts for timeline or "proud of" details when present.
- If includeImageOrder is true, return imageOrder as a list of provided image IDs.

Return JSON that matches the schema exactly.`;

function getLocationLabel(state: SharedProjectState): string | null {
  if (state.location && state.location.trim().length > 0) {
    return state.location;
  }
  return formatProjectLocation({ city: state.city, state: state.state });
}

function truncateText(text: string | undefined, limit = 1200): string | undefined {
  if (!text) return undefined;
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, Math.max(0, limit - 3))}...`;
}

function buildLayoutPrompt(state: SharedProjectState, options: LayoutComposerOptions): string {
  const locationLabel = getLocationLabel(state);

  const context = {
    projectType: state.projectType ?? null,
    title: state.title ?? null,
    description: truncateText(state.description, 1200) ?? null,
    customerProblem: state.customerProblem ?? null,
    solutionApproach: state.solutionApproach ?? null,
    materials: state.materials ?? [],
    techniques: state.techniques ?? [],
    duration: state.duration ?? null,
    proudOf: state.proudOf ?? null,
    location: locationLabel ?? null,
    tags: state.tags ?? [],
    images: state.images.map((image) => ({
      id: image.id,
      type: image.imageType ?? null,
      altText: image.altText ?? null,
      displayOrder: image.displayOrder,
    })),
  };

  const guidance = [
    options.goal ? `Goal: ${options.goal}` : null,
    options.focusAreas && options.focusAreas.length > 0
      ? `Focus Areas: ${options.focusAreas.join(', ')}`
      : null,
    options.includeImageOrder ? 'Include a recommended imageOrder.' : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `Compose layout blocks for the project below.

${guidance ? `${guidance}\n\n` : ''}Project Context:
${JSON.stringify(context, null, 2)}
`;
}

function getMissingContext(state: SharedProjectState): string[] {
  const missing: string[] = [];
  if (!state.projectType) missing.push('project_type');
  if (!state.customerProblem) missing.push('customer_problem');
  if (!state.solutionApproach) missing.push('solution_approach');
  if (!state.location && !state.city && !state.state) missing.push('location');
  if (!state.duration) missing.push('duration');
  if (!state.proudOf) missing.push('proud_of');
  if (state.materials.length === 0) missing.push('materials');
  if (state.techniques.length === 0) missing.push('techniques');
  if (state.images.length === 0) missing.push('images');
  return missing;
}

function mergeMissingContext(
  generated: string[] | undefined,
  detected: string[]
): string[] | undefined {
  if (!generated || generated.length === 0) {
    return detected.length > 0 ? detected : undefined;
  }

  const merged = new Set<string>([...generated, ...detected]);
  return Array.from(merged);
}

function normalizeImageOrder(
  imageOrder: string[] | undefined,
  state: SharedProjectState,
  includeImageOrder?: boolean
): string[] | undefined {
  if (!includeImageOrder) return undefined;

  const availableIds = state.images.map((image) => image.id);
  if (availableIds.length === 0) return undefined;

  if (!imageOrder || imageOrder.length === 0) {
    return availableIds;
  }

  const filtered = imageOrder.filter((id) => availableIds.includes(id));
  const remainder = availableIds.filter((id) => !filtered.includes(id));
  return [...filtered, ...remainder];
}

function buildFallbackBlocks(state: SharedProjectState): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  const locationLabel = getLocationLabel(state);
  const summaryParts: string[] = [];

  if (state.projectType) summaryParts.push(`Project: ${state.projectType}.`);
  if (state.customerProblem) summaryParts.push(`Problem: ${state.customerProblem}`);
  if (state.solutionApproach) summaryParts.push(`Solution: ${state.solutionApproach}`);
  if (locationLabel) summaryParts.push(`Location: ${locationLabel}.`);

  if (summaryParts.length > 0) {
    blocks.push({ type: 'paragraph', text: summaryParts.join(' ') });
  }

  if (state.materials.length > 0) {
    blocks.push({ type: 'heading', level: '2', text: 'Materials Used' });
    blocks.push({ type: 'list', style: 'bullet', items: state.materials });
  }

  if (state.techniques.length > 0) {
    blocks.push({ type: 'heading', level: '2', text: 'Techniques' });
    blocks.push({ type: 'list', style: 'bullet', items: state.techniques });
  }

  if (state.duration) {
    blocks.push({ type: 'callout', variant: 'info', title: 'Timeline', text: state.duration });
  }

  if (state.proudOf) {
    blocks.push({ type: 'callout', variant: 'tip', title: 'Proud Of', text: state.proudOf });
  }

  return blocks;
}

export async function composePortfolioLayout(
  state: SharedProjectState,
  options: LayoutComposerOptions = {}
): Promise<LayoutComposerResult> {
  const detectedMissing = getMissingContext(state);

  if (!isGoogleAIEnabled()) {
    return {
      blocks: buildFallbackBlocks(state),
      missingContext: detectedMissing,
      rationale: 'AI layout composition is unavailable.',
      confidence: 0.2,
    };
  }

  try {
    const { object } = await generateObject({
      model: getGenerationModel(),
      schema: LayoutComposerSchema,
      system: LAYOUT_SYSTEM_PROMPT,
      prompt: buildLayoutPrompt(state, options),
      maxOutputTokens: OUTPUT_LIMITS.contentGeneration,
      temperature: 0.4,
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingLevel: 'high',
          },
        },
      },
    });

    return {
      ...object,
      imageOrder: normalizeImageOrder(object.imageOrder, state, options.includeImageOrder),
      missingContext: mergeMissingContext(object.missingContext, detectedMissing),
    };
  } catch (error) {
    console.error('[LayoutComposer] Error:', error);
    return {
      blocks: buildFallbackBlocks(state),
      imageOrder: normalizeImageOrder(undefined, state, options.includeImageOrder),
      missingContext: detectedMissing,
      rationale: 'Layout composition failed; using fallback blocks.',
      confidence: 0.3,
    };
  }
}
