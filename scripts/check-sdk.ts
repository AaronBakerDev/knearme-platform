
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-dummy',
});

console.log('OpenAI Client keys:', Object.keys(openai));
// @ts-expect-error - SDK surface may expose responses in newer builds
console.log('Has responses?', !!openai.responses);
// @ts-expect-error - beta namespace is optional depending on SDK version
console.log('Has beta?', !!openai.beta);
// @ts-expect-error - beta chat parsing helper is optional
console.log('Has beta.chat.completions.parse?', !!openai.beta?.chat?.completions?.parse);
