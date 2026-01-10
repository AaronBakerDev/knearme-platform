/**
 * AI prompt templates for KnearMe portfolio generation.
 *
 * Used with Gemini/OpenAI for:
 * - Image analysis (vision)
 * - Content generation
 * - Interview question generation
 *
 * PHILOSOPHY: Prompts are trade-agnostic. The model infers trade context
 * from images and conversation. Specific trade vocabulary is optional
 * enhancement, not a requirement.
 *
 * @see /docs/philosophy/agent-philosophy.md
 * @see /docs/05-decisions/adr/ADR-003-openai.md
 */

import type { ImageAnalysisResult } from './image-analysis';

/**
 * System prompt for image analysis.
 * Used with Gemini 3.0 Flash to detect project details from photos.
 * Trade-agnostic: works for all contractor types.
 */
export const IMAGE_ANALYSIS_PROMPT = `You are an expert consultant analyzing project photos for a contractor portfolio website.

Your task is to identify and extract details from construction/trade project images:

1. **Project Type**: Identify the primary type of work shown. Be specific to what you see (e.g., chimney rebuild, bathroom renovation, electrical panel upgrade, kitchen remodel, roofing repair).

2. **Materials**: List specific materials visible in the images. Use accurate terminology for the trade shown.

3. **Techniques**: Identify professional techniques demonstrated. Be specific to the trade.

4. **Condition Assessment**: If this appears to be a before/during/after photo, note the condition and what work was done.

5. **Quality Indicators**: Note signs of craftsmanship quality (clean work, professional finish, attention to detail, etc.).

6. **Alt Text Generation**: For EACH image, generate a descriptive alt text for SEO and accessibility following this format:
   "[What's visible in the image] - [Project context/stage] - [Location/area]"

   Examples:
   - "Completed custom shelving unit with LED lighting - After professional installation - Living room"
   - "Water damage on ceiling before repair - Before restoration work - Bathroom"
   - "Contractor installing new flooring - During renovation process - Kitchen"

   Keep alt text 15-25 words, descriptive but concise. Key each image by its index starting from "0".

Respond in JSON format:
{
  "project_type": "primary type of work",
  "project_type_confidence": 0.0-1.0,
  "materials": ["material1", "material2"],
  "techniques": ["technique1", "technique2"],
  "image_stage": "before" | "during" | "after" | "detail" | "unknown",
  "quality_notes": "brief observation about craftsmanship",
  "suggested_title_keywords": ["keyword1", "keyword2", "keyword3"],
  "image_alt_texts": { "0": "alt text for first image", "1": "alt text for second image" }
}

Identify the actual type of work shown. Be accurate to the trade - don't assume a particular industry.`;

/**
 * System prompt for generating interview questions.
 * Produces contextual questions based on image analysis.
 */
export const INTERVIEW_QUESTIONS_PROMPT = `You are helping a contractor describe their work for a portfolio.

Based on the image analysis provided, generate 2-5 short interview questions to capture:
- What challenge or problem the customer had
- How the contractor solved it
- Any special techniques, tools, or materials worth mentioning
- Timeline or scope of the project

Keep questions conversational and easy to answer verbally in 1-2 sentences.
The contractor is busy and may be on a job site, so keep it brief.

Respond in JSON format:
{
  "questions": [
    {
      "id": "q1",
      "text": "Question text here?",
      "purpose": "What information this captures"
    }
  ]
}`;

/**
 * System prompt for content generation.
 * Creates SEO-optimized project descriptions from interview data.
 */
export const CONTENT_GENERATION_PROMPT = `You are a professional copywriter creating portfolio content for contractors.

Write compelling, search-friendly content that:
1. Highlights the craftsmanship and quality of work
2. Uses natural language with local context when provided
3. Tells the story of the project in a way that fits the work (problem → solution → result when relevant)
4. Builds trust and credibility for the contractor
5. Includes relevant technical details for informed homeowners

Target audience: Homeowners searching for this type of work.

Content guidance:
- Title: Clear, specific, and compelling (roughly 50-80 characters)
- Description: Long enough to be useful; usually 150-400 words unless the contractor wants shorter/longer
- SEO Title: Short; include location and service type when available
- SEO Description: 140-170 characters with a simple call-to-action
- Tags: 5-10 relevant keywords for categorization

Respond in JSON format:
{
  "title": "Project title here",
  "description": "Full project description with paragraphs...",
  "seo_title": "SEO optimized title | Business Name",
  "seo_description": "Meta description for search results...",
  "tags": ["tag1", "tag2", "tag3"],
  "materials": ["material1", "material2"],
  "techniques": ["technique1", "technique2"]
}`;

/**
 * Build the user message for image analysis.
 *
 * @param imageCount - Number of images to analyze
 */
export function buildImageAnalysisMessage(imageCount: number): string {
  return `Analyze ${imageCount === 1 ? 'this project image' : `these ${imageCount} project images`} and provide details about the work shown.`;
}

/**
 * Build the user message for interview question generation.
 *
 * @param imageAnalysis - Results from image analysis
 * @param businessContext - Contractor's business info for context
 */
export function buildQuestionGenerationMessage(
  imageAnalysis: ImageAnalysisResult | Record<string, unknown>,
  businessContext: { business_name: string; services: string[] }
): string {
  return `Based on this image analysis:
${JSON.stringify(imageAnalysis, null, 2)}

The contractor is ${businessContext.business_name}, specializing in: ${businessContext.services.join(', ')}.

Generate interview questions to help describe this project for their portfolio.`;
}

/**
 * Build the user message for content generation.
 *
 * @param imageAnalysis - Results from image analysis
 * @param interviewResponses - Q&A from the contractor interview
 * @param businessContext - Contractor's business info
 */
export function buildContentGenerationMessage(
  imageAnalysis: ImageAnalysisResult | Record<string, unknown>,
  interviewResponses: Array<{ question: string; answer: string }>,
  businessContext: { business_name: string; city: string; state: string; services: string[] }
): string {
  const qaPairs = interviewResponses
    .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
    .join('\n\n');

  return `Create portfolio content for this project.

**Business Info:**
- Name: ${businessContext.business_name}
- Location: ${businessContext.city}, ${businessContext.state}
- Services: ${businessContext.services.join(', ')}

**Image Analysis:**
${JSON.stringify(imageAnalysis, null, 2)}

**Contractor Interview:**
${qaPairs}

Generate compelling portfolio content that will help this contractor rank for local searches and convert visitors into customers.`;
}

/**
 * Default interview questions when image analysis fails or is unavailable.
 */
export const DEFAULT_INTERVIEW_QUESTIONS = [
  {
    id: 'q1',
    text: 'What problem was the customer trying to solve?',
    purpose: 'Captures the customer pain point',
  },
  {
    id: 'q2',
    text: 'What type of work did you do on this project?',
    purpose: 'Identifies the service type',
  },
  {
    id: 'q3',
    text: 'Were there materials, tools, or techniques that mattered?',
    purpose: 'Highlights craftsmanship and important details',
  },
  {
    id: 'q4',
    text: 'How long did the project take to complete?',
    purpose: 'Sets customer expectations',
  },
  {
    id: 'q5',
    text: "What are you most proud of about this project?",
    purpose: 'Creates emotional connection and showcases craftsmanship',
  },
];
