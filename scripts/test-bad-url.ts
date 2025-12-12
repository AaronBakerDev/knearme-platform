
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const key = process.env.OPENAI_API_KEY;
if (!key) {
    process.exit(1);
}

const openai = new OpenAI({ apiKey: key });

const Schema = z.object({ result: z.string() });

async function testBadUrl() {
    console.log('Testing with BAD URL...');
    const imageUrl = "undefined/storage/v1/object/public/project-images/foo.webp"; // Simulate missing env var

    try {
        const client = openai as unknown as {
            responses?: {
                parse: (...args: unknown[]) => Promise<unknown>;
            };
        };

        await client.responses?.parse({
            model: 'gpt-4o',
            instructions: "Analyze",
            input: [
                {
                    type: 'message',
                    role: 'user',
                    content: [
                        { type: 'input_text', text: "What is this?" },
                        {
                            type: 'input_image',
                            image_url: imageUrl, // BAD URL
                            detail: 'auto'
                        }
                    ]
                }
            ],
            text: { format: zodTextFormat(Schema, 'result') },
        });
    } catch (error) {
        console.log('❌ Error caught!');
        const err = error as { status?: unknown; code?: unknown; message?: unknown };
        if (err.status) console.log('Status:', err.status);
        if (err.code) console.log('Code:', err.code);
        if (err.message) console.log('Message:', err.message);
    }
}

testBadUrl();
