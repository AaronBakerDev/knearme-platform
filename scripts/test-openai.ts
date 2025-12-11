
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const key = process.env.OPENAI_API_KEY;
if (!key) {
    console.error('❌ OPENAI_API_KEY is missing');
    process.exit(1);
}

const openai = new OpenAI({ apiKey: key });

const ImageAnalysisSchema = z.object({
    project_type: z.string(),
    project_type_confidence: z.number(),
    materials: z.array(z.string()),
    // simplify for test
});

async function testResponsesParse() {
    console.log('Testing openai.responses.parse...');

    const imageUrl = "https://xynhhmliqdvyzrqnlvmk.supabase.co/storage/v1/object/public/project-images/4b783b8f-f473-4cd5-a7c0-cd6af32c17be/d6818f09-2215-457b-bc1a-1379141bf74f/10-finished-block-walls-pillar-mj0lg3gg66tmgm.webp";

    try {
        // @ts-ignore
        const response = await openai.responses.parse({
            model: 'gpt-4o', // AI_MODELS.vision
            instructions: "Analyze this image.",
            input: [
                {
                    type: 'message',
                    role: 'user',
                    content: [
                        { type: 'input_text', text: "What is this?" },
                        {
                            type: 'input_image',
                            image_url: imageUrl,
                            detail: 'auto'
                        }
                    ]
                }
            ],
            text: {
                format: zodTextFormat(ImageAnalysisSchema, 'image_analysis'),
            },
            max_output_tokens: 500,
        });

        console.log('✅ Responses API Parsed successfully!');
        console.log(JSON.stringify(response.output_parsed, null, 2));
    } catch (error) {
        console.error('❌ Responses API failed:', error);
        if (error && typeof error === 'object' && 'status' in error) {
            // @ts-ignore
            console.error('Status:', error.status);
        }
        // log full properties
        console.log('Error object:', error);
    }
}

testResponsesParse();
