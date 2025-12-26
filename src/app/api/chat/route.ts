/**
 * Chat API Route - Streaming conversation with function calling.
 *
 * Uses Vercel AI SDK with Google Gemini 3.0 Flash for streaming responses.
 * Extracts structured project data from natural conversation.
 *
 * POST /api/chat
 *
 * @see /src/lib/chat/chat-prompts.ts for system prompts
 * @see /src/lib/chat/chat-types.ts for type definitions
 * @see https://ai-sdk.dev/docs/ai-sdk-core/generating-text#streamtext
 */

import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { z } from 'zod';
import { getChatModel, isGoogleAIEnabled } from '@/lib/ai/providers';
import { requireAuth, isAuthError } from '@/lib/api/auth';
import { CONVERSATION_SYSTEM_PROMPT } from '@/lib/chat/chat-prompts';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

/**
 * Schema for extracting project data from conversation.
 * Called by the model when it detects relevant information.
 */
const extractProjectDataSchema = z.object({
  project_type: z
    .string()
    .optional()
    .describe('Type of masonry project (chimney, tuckpointing, stone repair, brick repair, etc.)'),
  customer_problem: z
    .string()
    .optional()
    .describe('What issue or need the customer had'),
  solution_approach: z
    .string()
    .optional()
    .describe('How the contractor solved the problem'),
  materials_mentioned: z
    .array(z.string())
    .optional()
    .describe('Materials mentioned (brick types, mortar, stone, etc.)'),
  techniques_mentioned: z
    .array(z.string())
    .optional()
    .describe('Techniques or methods used'),
  duration: z
    .string()
    .optional()
    .describe('How long the project took'),
  location: z
    .string()
    .optional()
    .describe('City or area where project was done'),
  challenges: z
    .string()
    .optional()
    .describe('Any challenges or difficulties faced'),
  proud_of: z
    .string()
    .optional()
    .describe('What the contractor is most proud of about this work'),
  ready_for_images: z
    .boolean()
    .optional()
    .describe('Set to true when enough project info has been gathered and it is time to ask for photos'),
});

/**
 * POST /api/chat
 *
 * Stream a chat response with optional data extraction.
 */
export async function POST(request: Request) {
  try {
    // Check if AI is available
    if (!isGoogleAIEnabled()) {
      return new Response(
        JSON.stringify({ error: 'AI chat is not available. Please configure GOOGLE_GENERATIVE_AI_API_KEY.' }),
        { status: 503 }
      );
    }

    // Verify authentication
    const auth = await requireAuth();
    if (isAuthError(auth)) {
      return new Response(
        JSON.stringify({ error: auth.message }),
        { status: auth.type === 'UNAUTHORIZED' ? 401 : 403 }
      );
    }

    // Parse request body
    const { messages }: { messages: UIMessage[] } = await request.json();

    // Stream response with tool calling using Gemini 3.0 Flash
    const result = streamText({
      model: getChatModel(),
      system: CONVERSATION_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: {
        /**
         * Tool for extracting project data from conversation.
         * The model calls this when it detects relevant project information.
         */
        extractProjectData: tool({
          description: `Extract project information from the conversation. Call this when the user mentions:
- What type of project it was (chimney, tuckpointing, etc.)
- What problem the customer had
- How they fixed it
- What materials they used
- Any challenges or things they're proud of

Set ready_for_images to true when you have gathered:
1. The type of project
2. The customer's problem
3. How it was solved
4. At least some materials used

At that point, your next message should naturally ask for photos.`,
          inputSchema: extractProjectDataSchema,
          execute: async (args) => {
            // Return the extracted data - it will be available in the tool result
            return args;
          },
        }),
      },
      // Limit tool calling steps
      stopWhen: stepCountIs(3),
      // Temperature for natural conversation
      temperature: 0.7,
    });

    // Return streaming response
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[POST /api/chat] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat message' }),
      { status: 500 }
    );
  }
}
