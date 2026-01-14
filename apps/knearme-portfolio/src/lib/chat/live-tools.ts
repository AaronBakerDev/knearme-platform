/**
 * Live API tool declarations for the Interviewer session.
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ZodTypeAny } from 'zod';
import {
  extractProjectDataSchema,
  requestClarificationSchema,
  promptForImagesSchema,
  showPortfolioPreviewSchema,
  suggestQuickActionsSchema,
  generatePortfolioContentSchema,
  composePortfolioLayoutSchema,
  checkPublishReadySchema,
  updateFieldSchema,
  regenerateSectionSchema,
  reorderImagesSchema,
  validateForPublishSchema,
} from '@/lib/chat/tool-schemas';

type LiveToolDefinition = {
  name: string;
  description: string;
  schema: ZodTypeAny;
};

const LIVE_TOOL_DEFINITIONS: LiveToolDefinition[] = [
  {
    name: 'extractProjectData',
    description:
      'Extract project info (type, customer problem, solution, materials, location, proud moments).',
    schema: extractProjectDataSchema,
  },
  {
    name: 'requestClarification',
    description: 'Ask for clarification when a user answer is ambiguous.',
    schema: requestClarificationSchema,
  },
  {
    name: 'promptForImages',
    description: 'Prompt the user to upload project photos.',
    schema: promptForImagesSchema,
  },
  {
    name: 'showPortfolioPreview',
    description: 'Refresh the live portfolio preview.',
    schema: showPortfolioPreviewSchema,
  },
  {
    name: 'suggestQuickActions',
    description: 'Suggest a few next-step quick actions.',
    schema: suggestQuickActionsSchema,
  },
  {
    name: 'generatePortfolioContent',
    description: 'Generate the portfolio title, description, and SEO copy.',
    schema: generatePortfolioContentSchema,
  },
  {
    name: 'composePortfolioLayout',
    description: 'Compose structured description blocks and optional image order.',
    schema: composePortfolioLayoutSchema,
  },
  {
    name: 'checkPublishReady',
    description: 'Check if the project is ready to publish and summarize gaps.',
    schema: checkPublishReadySchema,
  },
  {
    name: 'updateField',
    description: 'Update a single field like title, description, tags, materials, or techniques.',
    schema: updateFieldSchema,
  },
  {
    name: 'regenerateSection',
    description: 'Regenerate a specific section with guidance.',
    schema: regenerateSectionSchema,
  },
  {
    name: 'reorderImages',
    description: 'Reorder images (first becomes hero).',
    schema: reorderImagesSchema,
  },
  {
    name: 'validateForPublish',
    description: 'Validate publish readiness against server rules.',
    schema: validateForPublishSchema,
  },
];

function toJsonSchema(schema: LiveToolDefinition['schema']) {
  // Cast to any for Zod v4 compatibility with zod-to-json-schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonSchema = zodToJsonSchema(schema as any, { $refStrategy: 'none' }) as Record<string, unknown>;
  delete jsonSchema.$schema;
  return jsonSchema;
}

export function buildLiveToolDeclarations() {
  return LIVE_TOOL_DEFINITIONS.map((def) => ({
    name: def.name,
    description: def.description,
    parametersJsonSchema: toJsonSchema(def.schema),
  }));
}
