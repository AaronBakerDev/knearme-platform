/**
 * AI prompt templates for KnearMe portfolio generation.
 *
 * Used with OpenAI Responses API:
 * - `responses.parse()` for structured outputs with Zod schemas
 * - `instructions` parameter for system-level context
 * - `input` parameter for user prompts
 *
 * Prompts are designed to:
 * - Extract masonry-specific details from images
 * - Generate SEO-optimized content for local search
 * - Maintain consistent voice and quality
 *
 * @see /docs/05-decisions/adr/ADR-003-openai.md
 * @see /docs/01-vision/vision.md for product context
 */

import type { ImageAnalysisResult } from './image-analysis';

/**
 * System prompt for image analysis.
 * Used with GPT-4V to detect project details from photos.
 */
export const IMAGE_ANALYSIS_PROMPT = `You are an expert masonry consultant analyzing project photos for a contractor portfolio website.

Your task is to identify and extract details from masonry project images:

1. **Project Type**: Identify the primary type of masonry work shown (e.g., chimney rebuild, tuckpointing, brick repair, stone wall, patio/walkway, fireplace, foundation repair, retaining wall).

2. **Materials**: List specific materials visible (e.g., red clay brick, limestone, flagstone, mortar type, concrete blocks).

3. **Techniques**: Identify masonry techniques demonstrated (e.g., running bond pattern, herringbone, stacked bond, repointing, waterproofing).

4. **Condition Assessment**: If this appears to be a before/during/after photo, note the condition and what work was done.

5. **Quality Indicators**: Note any signs of craftsmanship quality (clean lines, consistent mortar joints, proper flashing, etc.).

6. **Alt Text Generation**: For EACH image, generate a descriptive alt text for SEO and accessibility following this format:
   "[What's visible in the image] - [Project context/stage] - [Location/area]"

   Examples:
   - "Completed chimney top with new cap and flashing - After professional rebuild - Historic brick chimney"
   - "Crack in mortar joints before repair - Before tuckpointing work - Exterior fireplace wall"
   - "Mason applying fresh mortar to brick joints - During repointing process - Residential foundation"

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

Be specific to masonry work. If the image doesn't show masonry, respond with project_type: "not_masonry" and generic alt texts like "Construction site image".`;

/**
 * System prompt for generating interview questions.
 * Produces contextual questions based on image analysis.
 */
export const INTERVIEW_QUESTIONS_PROMPT = `You are helping a masonry contractor describe their work for a portfolio.

Based on the image analysis provided, generate 3-5 short interview questions to capture:
- What challenge or problem the customer had
- How the contractor solved it
- Any special techniques or materials used
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
export const CONTENT_GENERATION_PROMPT = `You are a professional copywriter creating portfolio content for masonry contractors.

Write compelling, SEO-optimized content that:
1. Highlights the craftsmanship and quality of work
2. Uses natural language with local SEO keywords
3. Tells the story of the project (problem → solution → result)
4. Builds trust and credibility for the contractor
5. Includes relevant technical details for informed homeowners

Target audience: Homeowners searching for masonry contractors in their area.

Content requirements:
- Title: 60-70 characters, compelling and descriptive
- Description: 400-600 words, professional yet approachable
- SEO Title: Under 60 characters, includes location and service type
- SEO Description: 150-160 characters, includes call-to-action
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
 * @param imageUrls - Public URLs of images to analyze
 */
export function buildImageAnalysisMessage(imageUrls: string[]): string {
  const imageCount = imageUrls.length;
  return `Analyze ${imageCount === 1 ? 'this masonry project image' : `these ${imageCount} masonry project images`} and provide details about the work shown.`;
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

  return `Create portfolio content for this masonry project.

**Business Info:**
- Name: ${businessContext.business_name}
- Location: ${businessContext.city}, ${businessContext.state}
- Services: ${businessContext.services.join(', ')}

**Image Analysis:**
${JSON.stringify(imageAnalysis, null, 2)}

**Contractor Interview:**
${qaPairs}

Generate compelling portfolio content that will help this contractor rank for local masonry searches and convert visitors into customers.`;
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
    text: 'What type of masonry work did you do on this project?',
    purpose: 'Identifies the service type',
  },
  {
    id: 'q3',
    text: 'What materials did you use and why?',
    purpose: 'Highlights expertise and quality materials',
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
