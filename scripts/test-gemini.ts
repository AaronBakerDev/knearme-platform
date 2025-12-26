/**
 * Integration test for Gemini 3.0 Flash via Vercel AI SDK.
 *
 * Tests:
 * 1. Image analysis with vision model
 * 2. Content generation with structured output
 * 3. Provider configuration
 *
 * Run with: npx tsx scripts/test-gemini.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!key) {
  console.error('❌ GOOGLE_GENERATIVE_AI_API_KEY is missing');
  console.log('');
  console.log('To fix this:');
  console.log('1. Get an API key from: https://aistudio.google.com/apikey');
  console.log('2. Add to .env.local: GOOGLE_GENERATIVE_AI_API_KEY=your-key-here');
  process.exit(1);
}

console.log('✅ GOOGLE_GENERATIVE_AI_API_KEY is set');
console.log('');

// Test 1: Simple text generation with structured output
async function testStructuredOutput() {
  console.log('🧪 Test 1: Structured output generation...');

  const RecipeSchema = z.object({
    name: z.string(),
    ingredients: z.array(z.string()),
    steps: z.array(z.string()),
  });

  try {
    const { object } = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: RecipeSchema,
      prompt: 'Generate a simple recipe for scrambled eggs.',
    });

    console.log('✅ Structured output works!');
    console.log('   Recipe:', object.name);
    console.log('   Ingredients:', object.ingredients.length);
    console.log('   Steps:', object.steps.length);
    return true;
  } catch (error) {
    console.error('❌ Structured output failed:', error);
    return false;
  }
}

// Test 2: Image analysis (vision)
async function testVisionAnalysis() {
  console.log('');
  console.log('🧪 Test 2: Vision/Image analysis...');

  const ImageSchema = z.object({
    description: z.string(),
    objects: z.array(z.string()),
    colors: z.array(z.string()),
  });

  // Use a public test image (Unsplash - no rate limiting)
  const testImageUrl = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400';

  try {
    const { object } = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: ImageSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image briefly.' },
            { type: 'image', image: new URL(testImageUrl) },
          ],
        },
      ],
    });

    console.log('✅ Vision analysis works!');
    console.log('   Description:', object.description.slice(0, 50) + '...');
    console.log('   Objects found:', object.objects.length);
    return true;
  } catch (error) {
    console.error('❌ Vision analysis failed:', error);
    return false;
  }
}

// Test 3: Masonry-specific schema (like our actual use case)
async function testMasonryAnalysis() {
  console.log('');
  console.log('🧪 Test 3: Masonry project schema (simulated)...');

  const MasonrySchema = z.object({
    project_type: z.string(),
    project_type_confidence: z.number().min(0).max(1),
    materials: z.array(z.string()),
    techniques: z.array(z.string()),
    image_stage: z.enum(['before', 'during', 'after', 'detail', 'unknown']),
    quality_notes: z.string(),
  });

  try {
    const { object } = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: MasonrySchema,
      system: 'You are an expert masonry consultant. Respond with realistic masonry project data.',
      prompt: 'Generate sample data for a chimney rebuild project.',
    });

    console.log('✅ Masonry schema works!');
    console.log('   Project type:', object.project_type);
    console.log('   Confidence:', object.project_type_confidence);
    console.log('   Materials:', object.materials.join(', '));
    console.log('   Techniques:', object.techniques.join(', '));
    console.log('   Stage:', object.image_stage);
    return true;
  } catch (error) {
    console.error('❌ Masonry schema failed:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Running Gemini 3.0 Flash Integration Tests');
  console.log('=' .repeat(50));
  console.log('');

  const results = {
    structuredOutput: await testStructuredOutput(),
    visionAnalysis: await testVisionAnalysis(),
    masonrySchema: await testMasonryAnalysis(),
  };

  console.log('');
  console.log('=' .repeat(50));
  console.log('📊 Test Results:');
  console.log('');

  let allPassed = true;
  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status}: ${test}`);
    if (!passed) allPassed = false;
  }

  console.log('');
  if (allPassed) {
    console.log('🎉 All tests passed! Gemini integration is working.');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
    process.exit(1);
  }
}

runTests();
